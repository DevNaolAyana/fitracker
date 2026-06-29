import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    date: {
      type: String, // "YYYY-MM-DD"
      required: true,
    },
    time: {
      type: String, // "HH:MM", optional
      default: null,
    },
    done: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for sorted active todos
todoSchema.index({ userId: 1, date: 1, time: 1 });

const Todo = mongoose.model('Todo', todoSchema);

export default Todo;

