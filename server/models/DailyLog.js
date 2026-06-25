import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    gym: {
      type: Boolean,
      default: false,
    },
    muscleGroups: [
      {
        type: String,
        enum: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Cardio', 'Core', 'Full Body', 'Rest'],
      },
    ],
    workoutNotes: {
      type: String,
      default: '',
    },
    // Nutrition/food fields for Phase 3
    foods: {
      type: Array,
      default: [],
    },
    totalCalories: {
      type: Number,
      default: 0,
    },
    totalProtein: {
      type: Number,
      default: 0,
    },
    totalCarbs: {
      type: Number,
      default: 0,
    },
    totalFat: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for user and date
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);

export default DailyLog;
