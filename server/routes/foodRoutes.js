import express from 'express';
import protect from '../middleware/auth.js';
import GlobalFood from '../models/GlobalFood.js';
import CustomFood from '../models/CustomFood.js';

const router = express.Router();

// GET /api/foods - Merged list of global foods and user's custom foods
router.get('/', protect, async (req, res) => {
  try {
    const globals = await GlobalFood.find({});
    const customs = await CustomFood.find({ userId: req.userId });

    const merged = [
      ...globals.map(g => ({
        _id: g._id,
        name: g.name,
        servingUnit: g.servingUnit,
        caloriesPerServing: g.caloriesPerServing,
        proteinPerServing: g.proteinPerServing,
        carbsPerServing: g.carbsPerServing,
        fatPerServing: g.fatPerServing,
        source: 'global',
      })),
      ...customs.map(c => ({
        _id: c._id,
        name: c.name,
        servingUnit: c.servingUnit,
        caloriesPerServing: c.caloriesPerServing,
        proteinPerServing: c.proteinPerServing,
        carbsPerServing: c.carbsPerServing,
        fatPerServing: c.fatPerServing,
        source: 'custom',
      })),
    ];

    // Sort alphabetically by name
    merged.sort((a, b) => a.name.localeCompare(b.name));

    res.json(merged);
  } catch (error) {
    console.error('Error fetching food library:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/foods/custom - Create a custom food in user's library
router.post('/custom', protect, async (req, res) => {
  try {
    const { name, servingUnit, caloriesPerServing, proteinPerServing, carbsPerServing, fatPerServing } = req.body;

    if (!name || !servingUnit) {
      return res.status(400).json({ message: 'Name and serving unit are required' });
    }

    // Check for case-insensitive duplicate names for this user
    const existing = await CustomFood.findOne({
      userId: req.userId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
    });

    if (existing) {
      return res.status(400).json({ message: 'A custom food with this name already exists' });
    }

    const calVal = Number(caloriesPerServing) || 0;
    const proteinVal = Number(proteinPerServing) || 0;
    const carbsVal = Number(carbsPerServing) || 0;
    const fatVal = Number(fatPerServing) || 0;

    if (calVal < 0 || proteinVal < 0 || carbsVal < 0 || fatVal < 0) {
      return res.status(400).json({ message: 'Macro values must be greater than or equal to 0' });
    }

    const customFood = new CustomFood({
      userId: req.userId,
      name: name.trim(),
      servingUnit,
      caloriesPerServing: calVal,
      proteinPerServing: proteinVal,
      carbsPerServing: carbsVal,
      fatPerServing: fatVal,
    });

    await customFood.save();

    res.status(201).json({
      _id: customFood._id,
      name: customFood.name,
      servingUnit: customFood.servingUnit,
      caloriesPerServing: customFood.caloriesPerServing,
      proteinPerServing: customFood.proteinPerServing,
      carbsPerServing: customFood.carbsPerServing,
      fatPerServing: customFood.fatPerServing,
      source: 'custom',
    });
  } catch (error) {
    console.error('Error creating custom food:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/foods/custom/:id - Delete a custom food (must belong to req.userId)
router.delete('/custom/:id', protect, async (req, res) => {
  try {
    const customFood = await CustomFood.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!customFood) {
      return res.status(404).json({ message: 'Custom food not found or unauthorized' });
    }

    res.json({ message: 'Custom food deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom food:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
