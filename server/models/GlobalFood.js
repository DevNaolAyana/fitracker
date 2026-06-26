import mongoose from 'mongoose';

const globalFoodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    servingUnit: {
      type: String,
      required: true,
    },
    caloriesPerServing: {
      type: Number,
      required: true,
    },
    proteinPerServing: {
      type: Number,
      required: true,
    },
    carbsPerServing: {
      type: Number,
      required: true,
    },
    fatPerServing: {
      type: Number,
      required: true,
    },
  }
);

// Index name for fast lookups
globalFoodSchema.index({ name: 1 });

const GlobalFood = mongoose.model('GlobalFood', globalFoodSchema);

export default GlobalFood;
