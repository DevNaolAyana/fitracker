import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import {
  CheckSquare,
  Square,
  Plus,
  Pencil,
  Trash2,
  Clock,
  CalendarDays,
  History,
  ListTodo,
  Check,
  X,
  Loader2,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const today = () => new Date().toISOString().slice(0, 10);

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric', year: 'numeric' }
  );
};

const formatCompletedAt = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
const Spinner = () => (
  <div className="flex justify-center py-10">
    <Loader2 className="w-6 h-6 text-[#FF5236] animate-spin" />
  </div>
);

function AddTodoForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(today());
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    if (!date) { setError('Date is required'); return; }
    setLoading(true);
    setError('');
    try {
      await onAdd({ title: title.trim(), date, time: time || undefined });
      setTitle('');
      setDate(today());
      setTime('');
    } catch (err) {
      setError(err.message || 'Failed to add todo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[var(--surface-color)] border border-[var(--text-muted-color)]/10 rounded-3xl p-5 sm:p-6 space-y-4"
      aria-label="Add new todo"
    >
      <h2 className="text-sm font-bold text-[var(--text-color)] uppercase tracking-wider flex items-center gap-2">
        <Plus className="w-4 h-4 text-[#FF5236]" />
        New Todo
      </h2>

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="todo-title" className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">
          Title <span className="text-[#FF5236]">*</span>
        </label>
        <input
          id="todo-title"
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(''); }}
          placeholder="e.g. Meal prep for the week"
          maxLength={500}
          className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-color)] text-[var(--text-color)] placeholder:text-[var(--text-muted-color)]/60 border border-[var(--text-muted-color)]/20 hover:border-[var(--text-muted-color)]/40 focus:outline-none focus:ring-2 focus:ring-[#FF5236]/40 focus:border-[#FF5236] transition-all"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="todo-date" className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">
            Date <span className="text-[#FF5236]">*</span>
          </label>
          <input
            id="todo-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--text-muted-color)]/20 hover:border-[var(--text-muted-color)]/40 focus:outline-none focus:ring-2 focus:ring-[#FF5236]/40 focus:border-[#FF5236] transition-all"
          />
        </div>

        {/* Time */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="todo-time" className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">
            Time <span className="text-[var(--text-muted-color)]">(optional)</span>
          </label>
          <input
            id="todo-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--text-muted-color)]/20 hover:border-[var(--text-muted-color)]/40 focus:outline-none focus:ring-2 focus:ring-[#FF5236]/40 focus:border-[#FF5236] transition-all"
          />
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5236] text-white text-sm font-semibold hover:bg-[#e84a2f] disabled:opacity-60 transition-all shadow-md shadow-[#FF5236]/20"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add Todo
      </button>
    </form>
  );
}

function EditForm({ todo, onSave, onCancel }) {
  const [title, setTitle] = useState(todo.title);
  const [date, setDate] = useState(todo.date);
  const [time, setTime] = useState(todo.time || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setLoading(true);
    try {
      await onSave(todo._id, { title: title.trim(), date, time: time || null });
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 animate-fade-in" aria-label="Edit todo">
      <div className="flex flex-col gap-1">
        <label htmlFor={`edit-title-${todo._id}`} className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">
          Title
        </label>
        <input
          id={`edit-title-${todo._id}`}
          type="text"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(''); }}
          className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--text-muted-color)]/20 focus:outline-none focus:border-[#FF5236] transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label htmlFor={`edit-date-${todo._id}`} className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">
            Date
          </label>
          <input
            id={`edit-date-${todo._id}`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--text-muted-color)]/20 focus:outline-none focus:border-[#FF5236] transition-all"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`edit-time-${todo._id}`} className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">
            Time
          </label>
          <input
            id={`edit-time-${todo._id}`}
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 rounded-xl text-sm bg-[var(--bg-color)] text-[var(--text-color)] border border-[var(--text-muted-color)]/20 focus:outline-none focus:border-[#FF5236] transition-all"
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FF5236] text-white text-xs font-semibold hover:bg-[#e84a2f] disabled:opacity-60 transition-all"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--bg-color)] text-[var(--text-muted-color)] text-xs font-semibold border border-[var(--text-muted-color)]/15 hover:text-[var(--text-color)] transition-all"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      </div>
    </form>
  );
}

function TodoItem({ todo, onToggle, onEdit, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(todo._id); } finally { setToggling(false); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this todo?')) return;
    setDeleting(true);
    try { await onDelete(todo._id); } finally { setDeleting(false); }
  };

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-200 ${
      todo.done
        ? 'border-[var(--text-muted-color)]/10 bg-[var(--surface-color)]/40'
        : 'border-[var(--text-muted-color)]/10 bg-[var(--surface-color)] hover:border-[var(--text-muted-color)]/20'
    }`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          aria-label={todo.done ? 'Mark as incomplete' : 'Mark as complete'}
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110 disabled:opacity-50"
        >
          {toggling
            ? <Loader2 className="w-5 h-5 text-[#FF5236] animate-spin" />
            : todo.done
              ? <CheckSquare className="w-5 h-5 text-[#FF5236]" />
              : <Square className="w-5 h-5 text-[var(--text-muted-color)]/50 hover:text-[#FF5236]" />
          }
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold text-[var(--text-color)] break-words ${todo.done ? 'line-through text-[var(--text-muted-color)]' : ''}`}>
            {todo.title}
          </p>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-[var(--text-muted-color)]">
              <CalendarDays className="w-3 h-3" />
              {formatDate(todo.date)}
            </span>
            {todo.time && (
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted-color)]">
                <Clock className="w-3 h-3" />
                {todo.time}
              </span>
            )}
            {todo.done && todo.completedAt && (
              <span className="text-xs text-green-500/80">
                ✓ {formatCompletedAt(todo.completedAt)}
              </span>
            )}
          </div>

          {/* Inline edit form */}
          {editingId === todo._id && (
            <EditForm
              todo={todo}
              onSave={async (id, updates) => {
                await onEdit(id, updates);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          )}
        </div>

        {/* Actions */}
        {!todo.done && editingId !== todo._id && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setEditingId(todo._id)}
              aria-label="Edit todo"
              className="p-1.5 rounded-lg text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--bg-color)] transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete todo"
              className="p-1.5 rounded-lg text-[var(--text-muted-color)] hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
        {todo.done && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete completed todo"
            className="p-1.5 rounded-lg text-[var(--text-muted-color)] hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50 flex-shrink-0"
          >
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Todos Page
// ---------------------------------------------------------------------------
const Todos = () => {
  const [todos, setTodos] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [error, setError] = useState('');

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchActive = useCallback(async () => {
    setLoadingActive(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/todos`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch todos');
      setTodos(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingActive(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/todos/history`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch history');
      setHistory(await res.json());
      setHistoryLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchActive();
  }, [fetchActive]);

  const handleViewHistory = () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && !historyLoaded) fetchHistory();
  };

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------
  const handleAdd = async (data) => {
    const res = await fetch(`${API_URL}/api/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to create todo');
    }
    const newTodo = await res.json();
    setTodos((prev) => [...prev, newTodo]);
  };

  const handleEdit = async (id, updates) => {
    const res = await fetch(`${API_URL}/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to update todo');
    }
    const updated = await res.json();
    setTodos((prev) => prev.map((t) => (t._id === id ? updated : t)));
  };

  const handleToggle = async (id) => {
    const res = await fetch(`${API_URL}/api/todos/${id}/toggle`, {
      method: 'PATCH',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to toggle todo');
    const updated = await res.json();

    if (updated.done) {
      // Move from active → history
      setTodos((prev) => prev.filter((t) => t._id !== id));
      setHistory((prev) => [updated, ...prev]);
    } else {
      // Move from history → active
      setHistory((prev) => prev.filter((t) => t._id !== id));
      setTodos((prev) => [updated, ...prev]);
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`${API_URL}/api/todos/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete todo');
    setTodos((prev) => prev.filter((t) => t._id !== id));
    setHistory((prev) => prev.filter((t) => t._id !== id));
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const displayList = showHistory ? history : todos;
  const isLoading = showHistory ? loadingHistory : loadingActive;

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[var(--text-color)] tracking-tight flex items-center gap-2">
              <ListTodo className="w-6 h-6 text-[#FF5236]" />
              Todos
            </h1>
            <p className="text-sm text-[var(--text-muted-color)] mt-0.5">
              Reminders and tasks to keep you on track
            </p>
          </div>

          {/* Active / History toggle */}
          <div className="flex items-center gap-1 bg-[var(--surface-color)] p-1 rounded-2xl border border-[var(--text-muted-color)]/10">
            <button
              onClick={() => setShowHistory(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                !showHistory
                  ? 'bg-[#FF5236] text-white shadow-sm'
                  : 'text-[var(--text-muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <ListTodo className="w-3.5 h-3.5" />
              Active
            </button>
            <button
              onClick={handleViewHistory}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                showHistory
                  ? 'bg-[#FF5236] text-white shadow-sm'
                  : 'text-[var(--text-muted-color)] hover:text-[var(--text-color)]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>
        </div>

        {/* Add form — only in active view */}
        {!showHistory && <AddTodoForm onAdd={handleAdd} />}

        {/* List */}
        <div className="space-y-3">
          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {isLoading ? (
            <Spinner />
          ) : displayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3 bg-[var(--surface-color)] rounded-3xl border border-[var(--text-muted-color)]/10">
              <span className="text-4xl">{showHistory ? '🎉' : '✅'}</span>
              <p className="font-semibold text-[var(--text-color)] text-sm">
                {showHistory ? 'No completed todos yet' : 'All clear!'}
              </p>
              <p className="text-xs text-[var(--text-muted-color)] max-w-xs">
                {showHistory
                  ? 'Completed todos will appear here once you check them off.'
                  : 'Add a reminder above to get started.'}
              </p>
            </div>
          ) : (
            <>
              {showHistory && (
                <p className="text-xs text-[var(--text-muted-color)] px-1">
                  {displayList.length} completed {displayList.length === 1 ? 'todo' : 'todos'} — uncheck to move back to active
                </p>
              )}
              {!showHistory && (
                <p className="text-xs text-[var(--text-muted-color)] px-1">
                  {displayList.length} active {displayList.length === 1 ? 'todo' : 'todos'}
                </p>
              )}
              {displayList.map((todo) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  onToggle={handleToggle}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Todos;
