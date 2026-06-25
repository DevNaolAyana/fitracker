import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    resetToken: String,
    resetTokenExpiry: Date,
    heightCm: Number,
    age: Number,
    gender: { type: String, enum: ['male', 'female', 'other'] },
    activityLevel: { type: String, enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'] },
    goal: { type: String, enum: ['lose', 'maintain', 'gain'], default: 'maintain' },
    targetOverrides: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number
    }
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);

export default User;
