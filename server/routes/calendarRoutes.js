import express from 'express';
import protect from '../middleware/auth.js';

const router = express.Router();

// Helper to get current Gregorian date in GMT+3 (Addis Ababa time)
function getAddisAbabaGregorianDate() {
  const options = { timeZone: 'Africa/Addis_Ababa', year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;
  return `${year}-${month}-${day}`;
}

// Ethiopian month names
const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

// Simple in-memory cache for today's date
let todayCache = null;
let todayCacheTime = 0;

// Simple in-memory cache for date conversions
const conversionCache = new Map();

// Helper to fetch with timeout
async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// GET /api/calendar/today
router.get('/today', protect, async (req, res) => {
  const now = Date.now();
  const currentGregorian = getAddisAbabaGregorianDate();

  // If cache is valid (less than 60s old) and the date matches the current Gregorian date
  if (todayCache && (now - todayCacheTime < 60000) && todayCache.gregorianDate === currentGregorian) {
    return res.json(todayCache);
  }

  try {
    let data = null;
    let fetchError = null;

    // Try primary API
    try {
      const response = await fetchWithTimeout('https://date.ethioall.com/api/date', 5000);
      if (response.ok) {
        data = await response.json();
      } else {
        throw new Error(`HTTP error ${response.status}`);
      }
    } catch (err) {
      console.warn('Primary Ethiopian date API failed, trying fallback...', err.message);
      fetchError = err;
    }

    // Try fallback API if primary failed or returned invalid JSON
    if (!data) {
      try {
        const response = await fetchWithTimeout('https://api.ethioall.com/date/api', 5000);
        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error(`Fallback HTTP error ${response.status}`);
        }
      } catch (err) {
        console.error('Fallback Ethiopian date API also failed:', err.message);
        fetchError = err;
      }
    }

    if (!data) {
      return res.status(502).json({
        error: 'Ethiopian calendar service currently unavailable',
        details: fetchError ? fetchError.message : 'Unknown error',
        fallbackGregorianDate: currentGregorian
      });
    }

    // Standardize representation
    const result = {
      gregorianDate: currentGregorian,
      ethiopianDate: {
        day: parseInt(data.date, 10),
        month: parseInt(data.month_number, 10),
        monthName: data.month_english || ETHIOPIAN_MONTHS[parseInt(data.month_number, 10) - 1],
        year: parseInt(data.year, 10)
      }
    };

    // Cache the result
    todayCache = result;
    todayCacheTime = now;

    res.json(result);
  } catch (error) {
    console.error('Error fetching today calendar:', error);
    res.status(500).json({ error: 'Server error fetching calendar' });
  }
});

// GET /api/calendar/convert?date=YYYY-MM-DD&from=gregorian|ethiopian
router.get('/convert', protect, async (req, res) => {
  const { date, from } = req.query;

  if (!date || !from) {
    return res.status(400).json({ error: 'Parameters "date" and "from" are required' });
  }

  if (from !== 'gregorian' && from !== 'ethiopian') {
    return res.status(400).json({ error: 'Parameter "from" must be "gregorian" or "ethiopian"' });
  }

  // Check format: YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
  }

  const cacheKey = `${from}:${date}`;
  if (conversionCache.has(cacheKey)) {
    return res.json(conversionCache.get(cacheKey));
  }

  try {
    if (from === 'gregorian') {
      // Convert Gregorian to Ethiopian
      const url = `https://api.ethioall.com/convert/api?gc=${date}`;
      const response = await fetchWithTimeout(url, 5000);
      
      if (!response.ok) {
        throw new Error(`Conversion API returned HTTP ${response.status}`);
      }

      const list = await response.json();
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Invalid conversion API response format (expected non-empty array)');
      }

      const item = list[0];
      const result = {
        gregorianDate: date,
        ethiopianDate: {
          day: parseInt(item.day, 10),
          month: parseInt(item.month, 10),
          monthName: item.month_name?.english || ETHIOPIAN_MONTHS[parseInt(item.month, 10) - 1],
          year: parseInt(item.year, 10)
        }
      };

      conversionCache.set(cacheKey, result);
      return res.json(result);
    } else {
      // Convert Ethiopian to Gregorian
      const url = `https://api.ethioall.com/convert/api?ec=${date}`;
      const response = await fetchWithTimeout(url, 5000);

      if (!response.ok) {
        throw new Error(`Conversion API returned HTTP ${response.status}`);
      }

      const list = await response.json();
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Invalid conversion API response format (expected non-empty array)');
      }

      const item = list[0];
      const gregorianDate = `${item.year}-${String(item.month).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;

      const [ecYear, ecMonth, ecDay] = date.split('-').map(Number);
      const result = {
        gregorianDate,
        ethiopianDate: {
          day: ecDay,
          month: ecMonth,
          monthName: ETHIOPIAN_MONTHS[ecMonth - 1] || 'Unknown',
          year: ecYear
        }
      };

      conversionCache.set(cacheKey, result);
      return res.json(result);
    }
  } catch (error) {
    console.error(`Error converting date ${date} from ${from}:`, error.message);
    res.status(502).json({
      error: 'Date conversion service currently unavailable',
      details: error.message
    });
  }
});

export default router;
