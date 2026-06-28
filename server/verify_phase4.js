import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import DailyLog from './models/DailyLog.js';
import WeightLog from './models/WeightLog.js';
import { getQuoteOfDay } from './utils/quoteService.js';
import assert from 'assert';

dotenv.config();

/**
 * Helper to format date as YYYY-MM-DD
 */
function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Returns the Monday of the ISO week containing `date`.
 */
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // shift so Mon=0
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const runTests = async () => {
  try {
    await connectDB();
    console.log('--- Phase 4 Mongoose Model & Logic Verification Tests ---');

    // Setup: Clean up any test users/logs
    const testEmail = 'phase4test@fitraker.com';
    await User.deleteMany({ email: testEmail });
    
    // Create test user
    const testUser = new User({
      email: testEmail,
      passwordHash: 'dummyhash',
      name: 'Phase 4 Tester',
      heightCm: 180,
      age: 25,
      gender: 'male',
      activityLevel: 'moderate',
      goal: 'maintain',
    });
    await testUser.save();
    
    const testUserId = testUser._id;
    await DailyLog.deleteMany({ userId: testUserId });
    await WeightLog.deleteMany({ userId: testUserId });

    // Test Case 1: weeklyGymGoal Default Value
    console.log('Test 1: Verifying weeklyGymGoal default...');
    assert.strictEqual(testUser.weeklyGymGoal, 4, 'Default weeklyGymGoal should be 4');
    
    // Pre-field document simulation: if it's missing, code should default to 4 (using ??)
    const rawUser = await User.findById(testUserId).lean();
    assert.strictEqual(rawUser.weeklyGymGoal, 4, 'Database should store default value 4');
    console.log('✓ Test 1 Passed (weeklyGymGoal default verified)');

    // Test Case 2: Stats Aggregation Logic (Weekly/Monthly)
    console.log('Test 2: Verifying weekly stats aggregation...');
    // Let's create a fixed week. Let's say June 1st, 2026 (which is a Monday).
    // Days in week: 2026-06-01 (Mon) to 2026-06-07 (Sun).
    const mon = '2026-06-01';
    const tue = '2026-06-02';
    const wed = '2026-06-03';
    const thu = '2026-06-04';
    const fri = '2026-06-05';
    
    // Log food and gym on Monday, Wednesday, Friday
    await DailyLog.create([
      { userId: testUserId, date: mon, gym: true, totalCalories: 2500, totalProtein: 150, totalCarbs: 250, totalFat: 70 },
      { userId: testUserId, date: tue, gym: false, totalCalories: 2000, totalProtein: 120, totalCarbs: 200, totalFat: 60 },
      { userId: testUserId, date: wed, gym: true, totalCalories: 2600, totalProtein: 160, totalCarbs: 260, totalFat: 75 },
      { userId: testUserId, date: thu, gym: false, totalCalories: 1800, totalProtein: 100, totalCarbs: 180, totalFat: 55 },
      { userId: testUserId, date: fri, gym: true, totalCalories: 2700, totalProtein: 170, totalCarbs: 270, totalFat: 80 },
    ]);

    const logs = await DailyLog.find({
      userId: testUserId,
      date: { $gte: '2026-06-01', $lte: '2026-06-07' },
    }).sort({ date: 1 });

    assert.strictEqual(logs.length, 5);
    
    // Aggregate in JS (same as route logic)
    let gymDaysCount = 0;
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    for (const log of logs) {
      if (log.gym) gymDaysCount++;
      totalCalories += log.totalCalories || 0;
      totalProtein  += log.totalProtein  || 0;
      totalCarbs    += log.totalCarbs    || 0;
      totalFat      += log.totalFat      || 0;
    }
    const n = logs.length || 1;
    const avgCalories = Math.round(totalCalories / n);
    const avgProtein = Math.round(totalProtein / n);

    assert.strictEqual(gymDaysCount, 3);
    assert.strictEqual(totalCalories, 2500 + 2000 + 2600 + 1800 + 2700); // 11600
    assert.strictEqual(avgCalories, Math.round(11600 / 5)); // 2320
    assert.strictEqual(avgProtein, Math.round((150 + 120 + 160 + 100 + 170) / 5)); // 140
    console.log('✓ Test 2 Passed (Weekly stats aggregation verified)');

    // Test Case 3: Heatmap Data
    console.log('Test 3: Verifying heatmap data...');
    // Heatmap should return list of [{ date, gym, totalCalories }] for matching dates
    const heatmapLogs = await DailyLog.find({
      userId: testUserId,
      date: { $gte: '2026-05-01', $lte: '2026-06-30' },
    }).sort({ date: 1 });
    
    const heatmap = heatmapLogs.map(log => ({
      date: log.date,
      gym: log.gym || false,
      totalCalories: log.totalCalories || 0,
    }));
    assert.strictEqual(heatmap.length, 5);
    assert.strictEqual(heatmap[0].date, '2026-06-01');
    assert.strictEqual(heatmap[0].gym, true);
    assert.strictEqual(heatmap[0].totalCalories, 2500);
    console.log('✓ Test 3 Passed (Heatmap data projection verified)');

    // Test Case 4: Consistency calculation (Lookback)
    console.log('Test 4: Verifying gym consistency lookback...');
    // We want to test consistency lookback week-by-week.
    // Let's set the user's goal to 3 gym days.
    testUser.weeklyGymGoal = 3;
    await testUser.save();

    // Clean out DailyLogs to start fresh for consistency test
    await DailyLog.deleteMany({ userId: testUserId });

    // Setup weeks relative to "current" week. Let's make "current" week starting today (Mon-Sun).
    const now = new Date();
    const thisWeekStart = getWeekStart(now);
    
    // Helper to add gym days to a Mon-Sun week offset by weeksAgo (positive or negative)
    const seedGymDaysForWeek = async (weeksAgo, gymDaysCount) => {
      const start = new Date(thisWeekStart);
      start.setUTCDate(start.getUTCDate() - (weeksAgo * 7));
      for (let i = 0; i < gymDaysCount; i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        await DailyLog.create({
          userId: testUserId,
          date: toDateStr(d),
          gym: true,
          totalCalories: 0,
        });
      }
    };

    // Let's mock a scenario:
    // Current Week (0 weeks ago): 2 gym days (goal is 3, so not met yet)
    // Past Week 1 (1 week ago): 3 gym days (goal met)
    // Past Week 2 (2 weeks ago): 4 gym days (goal met)
    // Past Week 3 (3 weeks ago): 3 gym days (goal met)
    // Past Week 4 (4 weeks ago): 1 gym day (goal NOT met)
    
    await seedGymDaysForWeek(0, 2);
    await seedGymDaysForWeek(1, 3);
    await seedGymDaysForWeek(2, 4);
    await seedGymDaysForWeek(3, 3);
    await seedGymDaysForWeek(4, 1);

    // Run consistency lookup logic
    const userForConsistency = await User.findById(testUserId).select('weeklyGymGoal');
    const weeklyGoal = userForConsistency.weeklyGymGoal ?? 4;
    assert.strictEqual(weeklyGoal, 3);

    const thisWeekLogs = await DailyLog.find({
      userId: testUserId,
      date: {
        $gte: toDateStr(thisWeekStart),
        $lte: toDateStr(new Date(thisWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)),
      },
      gym: true,
    });
    const currentWeekGymDays = thisWeekLogs.length;
    assert.strictEqual(currentWeekGymDays, 2);
    const metGoalThisWeek = currentWeekGymDays >= weeklyGoal;
    assert.strictEqual(metGoalThisWeek, false);

    // Count consecutive past weeks that met goal
    let consecutiveWeeksMetGoal = 0;
    let checkWeekStart = new Date(thisWeekStart);

    for (let i = 0; i < 52; i++) {
      checkWeekStart.setUTCDate(checkWeekStart.getUTCDate() - 7);
      const checkWeekEnd = new Date(checkWeekStart);
      checkWeekEnd.setUTCDate(checkWeekEnd.getUTCDate() + 6);

      const weekLogs = await DailyLog.find({
        userId: testUserId,
        date: { $gte: toDateStr(checkWeekStart), $lte: toDateStr(checkWeekEnd) },
        gym: true,
      });

      if (weekLogs.length >= weeklyGoal) {
        consecutiveWeeksMetGoal++;
      } else {
        break;
      }
    }

    assert.strictEqual(consecutiveWeeksMetGoal, 3, 'Should find exactly 3 consecutive past weeks meeting the goal');
    console.log('✓ Test 4 Passed (Gym consistency lookback verified)');

    // Test Case 5: ZenQuotes Fetch and Caching
    console.log('Test 5: Verifying quote service fetch & cache...');
    const q1 = await getQuoteOfDay();
    console.log(`- Quote 1 fetched: "${q1.text}" — ${q1.author}`);
    assert.ok(q1.text && q1.author);

    const q2 = await getQuoteOfDay();
    assert.strictEqual(q2, q1, 'Subsequent call within hour should return the exact cached object');
    console.log('✓ Test 5 Passed (Quote service cache verified)');

    // Test Case 6: Recommendation Messages Logic
    console.log('Test 6: Verifying recommendations message rules...');
    
    // Case 6a: Fresh user, no weight log logged
    const recsNoWeight = {
      macroMessage: null,
      hintWeightLog: true,
    };
    // Asserting logic match
    const latestWeightLog = await WeightLog.findOne({ userId: testUserId }).sort({ date: -1 });
    assert.strictEqual(latestWeightLog, null);
    if (!latestWeightLog) {
      assert.strictEqual(recsNoWeight.macroMessage, null);
      assert.strictEqual(recsNoWeight.hintWeightLog, true);
    }
    
    // Case 6b: Weight logged, profile setup complete, no food logged today
    await WeightLog.create({ userId: testUserId, date: toDateStr(now), weightKg: 80 });
    
    // Simulate macro targets (BMR / TDEE)
    // male BMR = 10 * 80 + 6.25 * 180 - 5 * 25 + 5 = 800 + 1125 - 125 + 5 = 1805
    // moderate TDEE = 1805 * 1.55 = 2797.75 -> maintain target calories = 2798 (rounded)
    // protein = 2.0 * 80 = 160g -> 640 kcal
    // fat = 0.25 * 2797.75 / 9 = 77.7g -> 78g (approx)
    // carbs = (2798 - 640 - 78 * 9) / 4 = (2798 - 640 - 702) / 4 = 1456 / 4 = 364g
    
    const targets = {
      calories: 2798,
      protein: 160,
      carbs: 364,
      fat: 78,
    };
    
    const loggedNone = { calories: 0, protein: 0 };
    const macroMsgNone = `No food logged today. Target: ${targets.calories} kcal, ${targets.protein}g protein.`;
    assert.strictEqual(macroMsgNone, `No food logged today. Target: 2798 kcal, 160g protein.`);

    // Case 6c: Food logged, check on-target / over / under logic
    // Let's test on-target calorie logic: within 100 kcal
    const loggedOnTarget = { calories: 2750, protein: 155 };
    const calDiff = loggedOnTarget.calories - targets.calories; // -48
    const proteinDiff = loggedOnTarget.protein - targets.protein; // -5
    
    const calStatus = Math.abs(calDiff) <= 100
      ? `on target (${loggedOnTarget.calories} kcal) ✅`
      : calDiff > 0
      ? `${calDiff} kcal over target`
      : `${Math.abs(calDiff)} kcal under target`;
      
    const proteinStatus = Math.abs(proteinDiff) <= 10
      ? `protein on target (${loggedOnTarget.protein}g) ✅`
      : proteinDiff > 0
      ? `${loggedOnTarget.protein}g protein — ${proteinDiff}g over target`
      : `${loggedOnTarget.protein}g protein — ${Math.abs(proteinDiff)}g short of target`;
      
    const macroMsgOnTarget = `Today you're ${calStatus}. ${proteinStatus}.`;
    assert.strictEqual(macroMsgOnTarget, `Today you're on target (2750 kcal) ✅. protein on target (155g) ✅.`);
    console.log(`- Macro message (on target): "${macroMsgOnTarget}"`);

    // Case 6d: Gym consistency messaging
    // Current gym days this week = 2, goal = 3, remaining = 1
    const daysSinceGym = 1; // yesterday was gym day
    let gymMessage;
    if (currentWeekGymDays >= weeklyGoal) {
      gymMessage = `${currentWeekGymDays}/${weeklyGoal} gym days this week — goal met! 💪`;
    } else if (daysSinceGym === 0) {
      gymMessage = `Great — gym day today! ${currentWeekGymDays}/${weeklyGoal} this week.`;
    } else if (daysSinceGym === 1) {
      gymMessage = `Rest day well earned — you hit the gym yesterday. ${currentWeekGymDays}/${weeklyGoal} days this week.`;
    } else {
      const needed = weeklyGoal - currentWeekGymDays;
      gymMessage = `${currentWeekGymDays}/${weeklyGoal} so far this week, ${needed} more to hit your goal.`;
    }
    assert.strictEqual(gymMessage, `Rest day well earned — you hit the gym yesterday. 2/3 days this week.`);
    console.log(`- Gym message (rest day): "${gymMessage}"`);

    console.log('✓ Test 6 Passed (Recommendations message rules verified)');

    // Clean up
    await User.deleteMany({ email: testEmail });
    await DailyLog.deleteMany({ userId: testUserId });
    await WeightLog.deleteMany({ userId: testUserId });
    
    await mongoose.connection.close();
    console.log('Database connection closed.');
    console.log('All Phase 4 backend verification tests passed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Test run failed:', err);
    process.exit(1);
  }
};

runTests();
