import express from 'express';
import protect from '../middleware/auth.js';
import Todo from '../models/Todo.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// ---------------------------------------------------------------------------
// GET /api/todos
// Active (done: false) todos sorted by date asc, time asc (nulls last)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.userId, done: false }).sort({
      date: 1,
      time: 1,
    });
    res.json(todos);
  } catch (err) {
    console.error('Error fetching todos:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/todos/history
// Completed (done: true) todos sorted by completedAt desc
// ---------------------------------------------------------------------------
router.get('/history', async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.userId, done: true }).sort({
      completedAt: -1,
    });
    res.json(todos);
  } catch (err) {
    console.error('Error fetching todo history:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/todos
// Create a new todo { title, date, time? }
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { title, date, time } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const todo = await Todo.create({
      userId: req.userId,
      title: title.trim(),
      date,
      time: time || null,
    });

    res.status(201).json(todo);
  } catch (err) {
    console.error('Error creating todo:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/todos/:id
// Edit title, date, time (must belong to req.userId)
// ---------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    const { title, date, time } = req.body;

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({ message: 'Title cannot be empty' });
      }
      todo.title = title.trim();
    }
    if (date !== undefined) todo.date = date;
    if (time !== undefined) todo.time = time || null;

    await todo.save();
    res.json(todo);
  } catch (err) {
    console.error('Error updating todo:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/todos/:id/toggle
// Flip done; set completedAt when marking done, clear it when un-marking
// ---------------------------------------------------------------------------
router.patch('/:id/toggle', async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }

    todo.done = !todo.done;
    todo.completedAt = todo.done ? new Date() : null;

    await todo.save();
    res.json(todo);
  } catch (err) {
    console.error('Error toggling todo:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/todos/:id
// Delete todo (must belong to req.userId)
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  try {
    const todo = await Todo.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    res.json({ message: 'Todo deleted' });
  } catch (err) {
    console.error('Error deleting todo:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
