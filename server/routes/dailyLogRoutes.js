import express from 'express';
import protect from '../middleware/auth.js';
import DailyLog from '../models/DailyLog.js';

const router = express.Router();

// GET /api/logs/:date - Get log for a specific date, or return default empty shape
router.get('/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format slightly (e.g. YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD' });
    }

    const log = await DailyLog.findOne({ userId: req.userId, date });

    if (!log) {
      return res.json({
        date,
        gym: false,
        muscleGroups: [],
        workoutNotes: '',
        foods: [],
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
      });
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching daily log:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/logs/:date - Upsert gym details for a specific date
router.put('/:date', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const { gym, muscleGroups, workoutNotes } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD' });
    }

    const updateFields = {};
    if (gym !== undefined) updateFields.gym = gym;
    if (muscleGroups !== undefined) updateFields.muscleGroups = muscleGroups;
    if (workoutNotes !== undefined) updateFields.workoutNotes = workoutNotes;

    // Use findOneAndUpdate with upsert
    // $setOnInsert ensures that new logs get foods/macro-totals initialized to their default values
    const log = await DailyLog.findOneAndUpdate(
      { userId: req.userId, date },
      {
        $set: updateFields,
        $setOnInsert: {
          foods: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({
      message: 'Daily log updated successfully',
      log,
    });
  } catch (error) {
    console.error('Error saving daily log:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
