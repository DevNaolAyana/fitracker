import React, { useState } from 'react';
import { Trash2, Loader2, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FoodLogList = ({ date, foods, onFoodDeleted }) => {
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);

  const handleDelete = async (entryId) => {
    setDeletingId(entryId);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/logs/${date}/food/${entryId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to delete food entry');
      }

      const updatedLog = await res.json();
      onFoodDeleted(updatedLog);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete food entry');
    } finally {
      setDeletingId(null);
    }
  };

  if (!foods || foods.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-[var(--text-muted-color)] bg-[var(--surface-color)]/25 rounded-2xl border border-dashed border-[var(--text-muted-color)]/10">
        No foods logged for today.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--text-muted-color)]/10 overflow-hidden bg-[var(--surface-color)]/25 divide-y divide-[var(--text-muted-color)]/5">
        {foods.map((food) => (
          <div
            key={food._id}
            className="p-3.5 flex items-center justify-between gap-3 text-sm transition-colors hover:bg-[var(--surface-color)]/40 animate-fade-in"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-[var(--text-color)] truncate">{food.name}</h4>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--text-muted-color)] mt-0.5">
                <span className="font-medium text-[var(--text-color)]/80">Qty: {food.quantity}</span>
                <span className="text-[var(--text-muted-color)]/40">•</span>
                <span>{food.totalCalories} kcal</span>
                <span className="text-[var(--text-muted-color)]/40">•</span>
                <span>P: {food.totalProtein}g</span>
                <span className="text-[var(--text-muted-color)]/40">•</span>
                <span>C: {food.totalCarbs}g</span>
                <span className="text-[var(--text-muted-color)]/40">•</span>
                <span>F: {food.totalFat}g</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleDelete(food._id)}
              disabled={deletingId !== null}
              className="p-2 rounded-xl text-[var(--text-muted-color)] hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
              title="Delete food entry"
            >
              {deletingId === food._id ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FoodLogList;
