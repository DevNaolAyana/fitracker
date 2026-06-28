/**
 * quoteService.js
 * Fetches a daily motivational quote from ZenQuotes.io and caches it server-side
 * for up to 1 hour. ZenQuotes updates the "today" endpoint once per day, so
 * calling it more than once per hour is unnecessary and wastes the free-tier
 * rate limit (5 req / 30 s).
 *
 * Free-tier requirement: display "Quotes provided by ZenQuotes.io" with a link
 * wherever the quote is shown. Attribution is enforced on the client.
 */

const QUOTE_TTL_MS = 60 * 60 * 1000; // 1 hour

let quoteCache = null;
let quoteCacheTime = 0;

const FALLBACK_QUOTE = {
  text: 'The secret of getting ahead is getting started.',
  author: 'Mark Twain',
};

/**
 * Returns { text, author } — fetches from ZenQuotes at most once per hour.
 */
export async function getQuoteOfDay() {
  const now = Date.now();

  if (quoteCache && now - quoteCacheTime < QUOTE_TTL_MS) {
    return quoteCache;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);

    const res = await fetch('https://zenquotes.io/api/today', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`ZenQuotes returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0 || !data[0].q) {
      throw new Error('Unexpected ZenQuotes response shape');
    }

    const quote = { text: data[0].q, author: data[0].a };
    quoteCache = quote;
    quoteCacheTime = now;
    console.log(`[quoteService] Refreshed quote cache at ${new Date(now).toISOString()}`);
    return quote;
  } catch (err) {
    console.warn('[quoteService] Failed to fetch quote, using fallback:', err.message);
    // If we have a stale cache, prefer it over the hardcoded fallback
    if (quoteCache) return quoteCache;
    return FALLBACK_QUOTE;
  }
}
