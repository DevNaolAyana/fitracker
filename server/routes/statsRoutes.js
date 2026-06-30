import express from 'express';
import protect from '../middleware/auth.js';
import DailyLog from '../models/DailyLog.js';
import User from '../models/User.js';
import { getWeekStart, toDateStr } from '../utils/dateUtils.js';

const router = express.Router();

function getDatesInRange(startStr, endStr) {
  const dates = [];
  const curr = new Date(startStr + 'T00:00:00Z');
  const end = new Date(endStr + 'T00:00:00Z');
  while (curr <= end) {
    dates.push(curr.toISOString().slice(0, 10));
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Aggregates an array of DailyLog documents into a stats object.
 * @param {Array} logs - DailyLog documents
 * @param {string} periodStart - YYYY-MM-DD
 * @param {string} periodEnd   - YYYY-MM-DD
 */
function aggregateLogs(logs, periodStart, periodEnd) {
  let gymDaysCount = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  const logsMap = {};
  for (const log of logs) {
    logsMap[log.date] = log;
    if (log.gym) gymDaysCount++;
    totalCalories += log.totalCalories || 0;
    totalProtein  += log.totalProtein  || 0;
    totalCarbs    += log.totalCarbs    || 0;
    totalFat      += log.totalFat      || 0;
  }

  const n = logs.length || 1; // avoid division by zero

  const allDates = getDatesInRange(periodStart, periodEnd);
  const dailyBreakdown = allDates.map(date => {
    const log = logsMap[date];
    return {
      date,
      gym:           log?.gym || false,
      totalCalories: log?.totalCalories || 0,
      totalProtein:  log?.totalProtein  || 0,
      totalCarbs:    log?.totalCarbs    || 0,
      totalFat:      log?.totalFat      || 0,
    };
  });

  return {
    periodStart,
    periodEnd,
    gymDaysCount,
    totalCalories: Math.round(totalCalories),
    totalProtein:  Math.round(totalProtein),
    totalCarbs:    Math.round(totalCarbs),
    totalFat:      Math.round(totalFat),
    avgCalories:   Math.round(totalCalories / n),
    avgProtein:    Math.round(totalProtein  / n),
    avgCarbs:      Math.round(totalCarbs    / n),
    avgFat:        Math.round(totalFat      / n),
    dailyBreakdown,
  };
}

// ---------------------------------------------------------------------------
// GET /api/stats/weekly?date=YYYY-MM-DD
// Stats for the Mon–Sun week containing `date` (defaults to current week).
// ---------------------------------------------------------------------------
router.get('/weekly', protect, async (req, res) => {
  try {
    const inputDate = req.query.date
      ? new Date(req.query.date + 'T00:00:00Z')
      : new Date();

    const weekStart = getWeekStart(inputDate);
    const weekEnd   = new Date(weekStart);
    weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);

    const weekStartStr = toDateStr(weekStart);
    const weekEndStr   = toDateStr(weekEnd);

    const logs = await DailyLog.find({
      userId: req.userId,
      date: { $gte: weekStartStr, $lte: weekEndStr },
    }).sort({ date: 1 });

    const stats = aggregateLogs(logs, weekStartStr, weekEndStr);
    // Rename periodStart/End to weekStart/End for clarity
    const { periodStart: weekStartOut, periodEnd: weekEndOut, ...rest } = stats;
    res.json({ weekStart: weekStartOut, weekEnd: weekEndOut, ...rest });
  } catch (err) {
    console.error('Error fetching weekly stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/stats/monthly?year=YYYY&month=MM
// Stats for the specified calendar month (defaults to current month).
// ---------------------------------------------------------------------------
router.get('/monthly', protect, async (req, res) => {
  try {
    const now   = new Date();
    const year  = parseInt(req.query.year  || now.getUTCFullYear(),  10);
    const month = parseInt(req.query.month || (now.getUTCMonth() + 1), 10);

    // First and last day of the month
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay    = new Date(Date.UTC(year, month, 0)).getUTCDate(); // month=next, day=0 → last day of current month
    const monthEnd   = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const logs = await DailyLog.find({
      userId: req.userId,
      date: { $gte: monthStart, $lte: monthEnd },
    }).sort({ date: 1 });

    const stats = aggregateLogs(logs, monthStart, monthEnd);
    const { periodStart: monthStartOut, periodEnd: monthEndOut, ...rest } = stats;
    res.json({ monthStart: monthStartOut, monthEnd: monthEndOut, ...rest });
  } catch (err) {
    console.error('Error fetching monthly stats:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/stats/heatmap
// Last 30 days: [{ date, gym, totalCalories }]
// Days with no DailyLog are not included — client renders blank squares.
// ---------------------------------------------------------------------------
router.get('/heatmap', protect, async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29); // inclusive of today → 30 days

    const startStr = toDateStr(thirtyDaysAgo);
    const endStr   = toDateStr(today);

    const logs = await DailyLog.find({
      userId: req.userId,
      date: { $gte: startStr, $lte: endStr },
    }).sort({ date: 1 });

    const heatmap = logs.map(log => ({
      date:          log.date,
      gym:           log.gym || false,
      totalCalories: log.totalCalories || 0,
    }));

    res.json(heatmap);
  } catch (err) {
    console.error('Error fetching heatmap:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/stats/consistency
// { currentWeekGymDays, weeklyGoal, metGoalThisWeek, consecutiveWeeksMetGoal }
// Looks back week-by-week (most recent first), stops at the first week that
// didn't meet weeklyGymGoal. Uses `?? 4` to handle pre-field documents.
// ---------------------------------------------------------------------------
router.get('/consistency', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('weeklyGymGoal');
    // Use ?? 4 so pre-field documents (created before this field was added) get
    // the default rather than undefined/null from the DB.
    const weeklyGoal = user.weeklyGymGoal ?? 4;

    const now           = new Date();
    const thisWeekStart = getWeekStart(now);
    const thisWeekEnd   = new Date(thisWeekStart);
    thisWeekEnd.setUTCDate(thisWeekEnd.getUTCDate() + 6);

    const thisWeekStartStr = toDateStr(thisWeekStart);
    const thisWeekEndStr   = toDateStr(thisWeekEnd);

    // Current week's gym days
    const thisWeekLogs = await DailyLog.find({
      userId: req.userId,
      date:   { $gte: thisWeekStartStr, $lte: thisWeekEndStr },
      gym:    true,
    });
    const currentWeekGymDays  = thisWeekLogs.length;
    const metGoalThisWeek     = currentWeekGymDays >= weeklyGoal;

    // Count consecutive past weeks (not including current) that met the goal
    let consecutiveWeeksMetGoal = 0;
    let checkWeekStart = new Date(thisWeekStart);

    for (let i = 0; i < 52; i++) { // cap at 52 weeks to avoid infinite loop
      checkWeekStart.setUTCDate(checkWeekStart.getUTCDate() - 7);
      const checkWeekEnd = new Date(checkWeekStart);
      checkWeekEnd.setUTCDate(checkWeekEnd.getUTCDate() + 6);

      const weekLogs = await DailyLog.find({
        userId: req.userId,
        date:   { $gte: toDateStr(checkWeekStart), $lte: toDateStr(checkWeekEnd) },
        gym:    true,
      });

      if (weekLogs.length >= weeklyGoal) {
        consecutiveWeeksMetGoal++;
      } else {
        break; // First miss — stop counting
      }
    }

    res.json({
      currentWeekGymDays,
      weeklyGoal,
      metGoalThisWeek,
      consecutiveWeeksMetGoal,
    });
  } catch (err) {
    console.error('Error fetching consistency:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
