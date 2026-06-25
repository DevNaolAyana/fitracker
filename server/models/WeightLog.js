import mongoose from 'mongoose';

const weightLogSchema = new mongoose.Schema(
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
    weightKg: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so logging again on same day overwrites
weightLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const WeightLog = mongoose.model('WeightLog', weightLogSchema);

export default WeightLog;
