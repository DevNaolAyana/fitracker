import express from 'express';
import protect from '../middleware/auth.js';
import DailyLog from '../models/DailyLog.js';
import GlobalFood from '../models/GlobalFood.js';
import CustomFood from '../models/CustomFood.js';

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

// POST /api/logs/:date/food - Add or combine a food entry for the date
router.post('/:date/food', protect, async (req, res) => {
  try {
    const { date } = req.params;
    const { foodId, source, quantity, name, caloriesPerServing, proteinPerServing, carbsPerServing, fatPerServing } = req.body;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD' });
    }

    if (quantity === undefined || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }

    let foodName = '';
    let caloriesPerUnit = 0;
    let proteinPerUnit = 0;
    let carbsPerUnit = 0;
    let fatPerUnit = 0;

    if (foodId) {
      // Look up food in database
      let foodDoc;
      if (source === 'global') {
        foodDoc = await GlobalFood.findById(foodId);
      } else if (source === 'custom') {
        foodDoc = await CustomFood.findOne({ _id: foodId, userId: req.userId });
      }

      if (!foodDoc) {
        return res.status(404).json({ message: 'Food item not found' });
      }

      foodName = foodDoc.name;
      caloriesPerUnit = foodDoc.caloriesPerServing;
      proteinPerUnit = foodDoc.proteinPerServing;
      carbsPerUnit = foodDoc.carbsPerServing;
      fatPerUnit = foodDoc.fatPerServing;
    } else {
      // Inline custom food flow payload
      if (!name) {
        return res.status(400).json({ message: 'Food name is required for inline custom food logging' });
      }
      foodName = name.trim();
      caloriesPerUnit = Number(caloriesPerServing) || 0;
      proteinPerUnit = Number(proteinPerServing) || 0;
      carbsPerUnit = Number(carbsPerServing) || 0;
      fatPerUnit = Number(fatPerServing) || 0;

      if (caloriesPerUnit < 0 || proteinPerUnit < 0 || carbsPerUnit < 0 || fatPerUnit < 0) {
        return res.status(400).json({ message: 'Macro values cannot be negative' });
      }
    }

    // Find or create DailyLog
    let log = await DailyLog.findOne({ userId: req.userId, date });
    if (!log) {
      log = new DailyLog({
        userId: req.userId,
        date,
        gym: false,
        muscleGroups: [],
        workoutNotes: '',
        foods: [],
      });
    }

    const qty = Number(quantity);
    const existingIndex = log.foods.findIndex(
      f => f.name.toLowerCase() === foodName.toLowerCase()
    );

    if (existingIndex > -1) {
      // When entries combine by name, the first-logged entry's per-unit macros are kept 
      // and quantity is summed — later entries do not overwrite or average the macros.
      const existing = log.foods[existingIndex];
      const newQty = existing.quantity + qty;
      existing.quantity = newQty;
      existing.totalCalories = Math.round(existing.caloriesPerUnit * newQty * 100) / 100;
      existing.totalProtein = Math.round(existing.proteinPerUnit * newQty * 100) / 100;
      existing.totalCarbs = Math.round(existing.carbsPerUnit * newQty * 100) / 100;
      existing.totalFat = Math.round(existing.fatPerUnit * newQty * 100) / 100;
      log.markModified('foods');
    } else {
      log.foods.push({
        name: foodName,
        quantity: qty,
        caloriesPerUnit,
        proteinPerUnit,
        carbsPerUnit,
        fatPerUnit,
        totalCalories: Math.round(caloriesPerUnit * qty * 100) / 100,
        totalProtein: Math.round(proteinPerUnit * qty * 100) / 100,
        totalCarbs: Math.round(carbsPerUnit * qty * 100) / 100,
        totalFat: Math.round(fatPerUnit * qty * 100) / 100,
      });
    }

    // Recompute top-level totals
    log.totalCalories = Math.round(log.foods.reduce((sum, f) => sum + f.totalCalories, 0) * 100) / 100;
    log.totalProtein = Math.round(log.foods.reduce((sum, f) => sum + f.totalProtein, 0) * 100) / 100;
    log.totalCarbs = Math.round(log.foods.reduce((sum, f) => sum + f.totalCarbs, 0) * 100) / 100;
    log.totalFat = Math.round(log.foods.reduce((sum, f) => sum + f.totalFat, 0) * 100) / 100;

    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Error logging food:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/logs/:date/food/:entryId - Remove a food entry from the date's foods array
router.delete('/:date/food/:entryId', protect, async (req, res) => {
  try {
    const { date, entryId } = req.params;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ message: 'Invalid date format. Expected YYYY-MM-DD' });
    }

    const log = await DailyLog.findOne({ userId: req.userId, date });
    if (!log) {
      return res.status(404).json({ message: 'Daily log not found' });
    }

    const initialLength = log.foods.length;
    log.foods = log.foods.filter(f => f._id.toString() !== entryId);

    if (log.foods.length === initialLength) {
      return res.status(404).json({ message: 'Food entry not found' });
    }

    // Recompute top-level totals
    log.totalCalories = Math.round(log.foods.reduce((sum, f) => sum + f.totalCalories, 0) * 100) / 100;
    log.totalProtein = Math.round(log.foods.reduce((sum, f) => sum + f.totalProtein, 0) * 100) / 100;
    log.totalCarbs = Math.round(log.foods.reduce((sum, f) => sum + f.totalCarbs, 0) * 100) / 100;
    log.totalFat = Math.round(log.foods.reduce((sum, f) => sum + f.totalFat, 0) * 100) / 100;

    await log.save();
    res.json(log);
  } catch (error) {
    console.error('Error deleting food entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
