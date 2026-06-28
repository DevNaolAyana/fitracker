import express from 'express';
import protect from '../middleware/auth.js';
import DailyLog from '../models/DailyLog.js';
import WeightLog from '../models/WeightLog.js';
import User from '../models/User.js';
import { calculateMacros } from '../utils/macroCalculator.js';
import { getQuoteOfDay } from '../utils/quoteService.js';

const router = express.Router();

/**
 * Returns today's date string (YYYY-MM-DD) in Africa/Addis_Ababa timezone.
 */
function getTodayStr() {
  const options = { timeZone: 'Africa/Addis_Ababa', year: 'numeric', month: '2-digit', day: '2-digit' };
  const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(new Date());
  const y = parts.find(p => p.type === 'year').value;
  const m = parts.find(p => p.type === 'month').value;
  const d = parts.find(p => p.type === 'day').value;
  return `${y}-${m}-${d}`;
}

/**
 * Returns the Monday of the ISO week containing `date`.
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// GET /api/recommendations/today
// Returns { macroMessage, hintWeightLog, gymMessage, quote }
// Uses `?? 4` for weeklyGymGoal to handle pre-field documents.
// ---------------------------------------------------------------------------
router.get('/today', protect, async (req, res) => {
  try {
    const today = getTodayStr();

    // Fetch user, today's log, and latest weight in parallel
    const [user, todayLog, latestWeightLog] = await Promise.all([
      User.findById(req.userId).select('-passwordHash'),
      DailyLog.findOne({ userId: req.userId, date: today }),
      WeightLog.findOne({ userId: req.userId }).sort({ date: -1 }),
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // -----------------------------------------------------------------------
    // Macro message
    // -----------------------------------------------------------------------
    let macroMessage = null;
    let hintWeightLog = false;

    const needsProfileSetup = !user.heightCm || !user.age || !user.gender || !user.activityLevel;

    if (!latestWeightLog) {
      macroMessage = null;
      hintWeightLog = true;
    } else if (needsProfileSetup) {
      macroMessage = null;
      hintWeightLog = false; // profile, not weight, is the blocker
    } else {
      const targets = calculateMacros(user, latestWeightLog.weightKg);

      if (!targets) {
        macroMessage = null;
      } else {
        const logged = {
          calories: todayLog?.totalCalories || 0,
          protein:  todayLog?.totalProtein  || 0,
          carbs:    todayLog?.totalCarbs    || 0,
          fat:      todayLog?.totalFat      || 0,
        };

        if (!todayLog || (logged.calories === 0 && logged.protein === 0)) {
          macroMessage = `No food logged today. Target: ${targets.calories} kcal, ${targets.protein}g protein.`;
        } else {
          const calDiff     = logged.calories - targets.calories;
          const proteinDiff = logged.protein  - targets.protein;

          const calStatus =
            Math.abs(calDiff) <= 100
              ? `on target (${logged.calories} kcal) ✅`
              : calDiff > 0
              ? `${calDiff} kcal over target`
              : `${Math.abs(calDiff)} kcal under target`;

          const proteinStatus =
            Math.abs(proteinDiff) <= 10
              ? `protein on target (${logged.protein}g) ✅`
              : proteinDiff > 0
              ? `${logged.protein}g protein — ${proteinDiff}g over target`
              : `${logged.protein}g protein — ${Math.abs(proteinDiff)}g short of target`;

          macroMessage = `Today you're ${calStatus}. ${proteinStatus}.`;
        }
      }
    }

    // -----------------------------------------------------------------------
    // Gym message — uses ?? 4 for pre-field documents
    // -----------------------------------------------------------------------
    const weeklyGoal = user.weeklyGymGoal ?? 4;

    // Current week gym days
    const now           = new Date();
    const thisWeekStart = getWeekStart(now);
    const thisWeekEnd   = new Date(thisWeekStart);
    thisWeekEnd.setUTCDate(thisWeekEnd.getUTCDate() + 6);

    const thisWeekLogs = await DailyLog.find({
      userId: req.userId,
      date:   { $gte: toDateStr(thisWeekStart), $lte: toDateStr(thisWeekEnd) },
      gym:    true,
    });
    const currentWeekGymDays = thisWeekLogs.length;

    // Days since last gym entry (0 = today)
    const lastGymLog = await DailyLog.findOne({
      userId: req.userId,
      gym:    true,
    }).sort({ date: -1 });

    let daysSinceGym = null;
    if (lastGymLog) {
      const lastGymDate  = new Date(lastGymLog.date + 'T00:00:00Z');
      const todayDate    = new Date(today + 'T00:00:00Z');
      daysSinceGym = Math.floor((todayDate - lastGymDate) / (1000 * 60 * 60 * 24));
    }

    let gymMessage;
    const daysLeftInWeek = 7 - new Date().getUTCDay(); // Mon-based remaining

    if (currentWeekGymDays >= weeklyGoal) {
      gymMessage = `${currentWeekGymDays}/${weeklyGoal} gym days this week — goal met! 💪`;
    } else if (daysSinceGym === 0) {
      // Went to gym today
      gymMessage = `Great — gym day today! ${currentWeekGymDays}/${weeklyGoal} this week.`;
    } else if (daysSinceGym === 1) {
      gymMessage = `Rest day well earned — you hit the gym yesterday. ${currentWeekGymDays}/${weeklyGoal} days this week.`;
    } else if (daysSinceGym !== null && daysSinceGym >= 3) {
      gymMessage = `Haven't logged a gym day in ${daysSinceGym} days — let's go! ${currentWeekGymDays}/${weeklyGoal} so far this week.`;
    } else {
      const needed = weeklyGoal - currentWeekGymDays;
      gymMessage = `${currentWeekGymDays}/${weeklyGoal} so far this week, ${needed} more to hit your goal.`;
    }

    // -----------------------------------------------------------------------
    // Quote
    // -----------------------------------------------------------------------
    const quote = await getQuoteOfDay();

    res.json({
      macroMessage,
      hintWeightLog,
      gymMessage,
      quote,
      // Surface today's logged totals so Dashboard can render the bar without a separate call
      todayTotals: todayLog
        ? {
            calories: todayLog.totalCalories || 0,
            protein:  todayLog.totalProtein  || 0,
            carbs:    todayLog.totalCarbs    || 0,
            fat:      todayLog.totalFat      || 0,
          }
        : null,
      targets: latestWeightLog && !needsProfileSetup
        ? calculateMacros(user, latestWeightLog.weightKg)
        : null,
    });
  } catch (err) {
    console.error('Error building recommendations:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
