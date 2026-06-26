import mongoose from 'mongoose';

const customFoodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
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
  },
  {
    timestamps: true,
  }
);

// Compound unique index for user and food name to avoid duplicates
customFoodSchema.index({ userId: 1, name: 1 }, { unique: true });

const CustomFood = mongoose.model('CustomFood', customFoodSchema);

export default CustomFood;
