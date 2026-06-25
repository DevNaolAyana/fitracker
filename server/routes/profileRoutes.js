import express from 'express';
import protect from '../middleware/auth.js';
import User from '../models/User.js';
import WeightLog from '../models/WeightLog.js';
import { calculateMacros } from '../utils/macroCalculator.js';

const router = express.Router();

// GET /api/profile - get user profile and computed targets
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const latestWeightLog = await WeightLog.findOne({ userId: req.userId }).sort({ date: -1 });

    let targets = null;
    let needsWeightLog = !latestWeightLog;
    let needsProfileSetup = !user.heightCm || !user.age || !user.gender || !user.activityLevel;

    if (latestWeightLog && !needsProfileSetup) {
      targets = calculateMacros(user, latestWeightLog.weightKg);
    }

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        heightCm: user.heightCm || null,
        age: user.age || null,
        gender: user.gender || null,
        activityLevel: user.activityLevel || null,
        goal: user.goal || 'maintain',
        targetOverrides: user.targetOverrides || {
          calories: null,
          protein: null,
          carbs: null,
          fat: null,
        },
      },
      targets,
      needsWeightLog,
      needsProfileSetup,
      latestWeight: latestWeightLog ? latestWeightLog.weightKg : null,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/profile - update user profile fields
router.put('/', protect, async (req, res) => {
  try {
    const { heightCm, age, gender, activityLevel, goal, targetOverrides } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (heightCm !== undefined) user.heightCm = heightCm;
    if (age !== undefined) user.age = age;
    if (gender !== undefined) user.gender = gender;
    if (activityLevel !== undefined) user.activityLevel = activityLevel;
    if (goal !== undefined) user.goal = goal;

    if (targetOverrides !== undefined) {
      user.targetOverrides = {
        calories: targetOverrides.calories || null,
        protein: targetOverrides.protein || null,
        carbs: targetOverrides.carbs || null,
        fat: targetOverrides.fat || null,
      };
    }

    await user.save();

    // Return updated profile and targets
    const latestWeightLog = await WeightLog.findOne({ userId: req.userId }).sort({ date: -1 });
    let targets = null;
    let needsWeightLog = !latestWeightLog;
    let needsProfileSetup = !user.heightCm || !user.age || !user.gender || !user.activityLevel;

    if (latestWeightLog && !needsProfileSetup) {
      targets = calculateMacros(user, latestWeightLog.weightKg);
    }

    res.json({
      message: 'Profile updated successfully',
      profile: {
        name: user.name,
        email: user.email,
        heightCm: user.heightCm,
        age: user.age,
        gender: user.gender,
        activityLevel: user.activityLevel,
        goal: user.goal,
        targetOverrides: user.targetOverrides,
      },
      targets,
      needsWeightLog,
      needsProfileSetup,
      latestWeight: latestWeightLog ? latestWeightLog.weightKg : null,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/profile/weight - upsert a weigh-in
router.post('/weight', protect, async (req, res) => {
  try {
    const { date, weightKg } = req.body;

    if (!date || !weightKg) {
      return res.status(400).json({ message: 'Date and weight are required' });
    }

    // Upsert the weight log
    await WeightLog.findOneAndUpdate(
      { userId: req.userId, date },
      { weightKg },
      { upsert: true, new: true }
    );

    // Fetch user and updated targets
    const user = await User.findById(req.userId);
    const latestWeightLog = await WeightLog.findOne({ userId: req.userId }).sort({ date: -1 });

    let targets = null;
    let needsWeightLog = !latestWeightLog;
    let needsProfileSetup = !user.heightCm || !user.age || !user.gender || !user.activityLevel;

    if (latestWeightLog && !needsProfileSetup) {
      targets = calculateMacros(user, latestWeightLog.weightKg);
    }

    res.json({
      message: 'Weight logged successfully',
      latestWeight: latestWeightLog ? latestWeightLog.weightKg : null,
      targets,
      needsWeightLog,
      needsProfileSetup,
    });
  } catch (error) {
    console.error('Error logging weight:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/profile/weight-history - get all weigh-ins sorted by date ascending
router.get('/weight-history', protect, async (req, res) => {
  try {
    const history = await WeightLog.find({ userId: req.userId }).sort({ date: 1 });
    res.json(history);
  } catch (error) {
    console.error('Error fetching weight history:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
