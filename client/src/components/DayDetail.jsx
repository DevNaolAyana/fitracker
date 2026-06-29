import React, { useState, useEffect } from 'react';
import MuscleGroupSelector from './MuscleGroupSelector';
import { useCalendar } from '../context/CalendarContext';
import { X, CheckCircle2, Dumbbell, AlertTriangle, Loader2 } from 'lucide-react';
import Button from './Button';
import FoodSearchDropdown from './FoodSearchDropdown';
import FoodLogList from './FoodLogList';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DayDetail = ({ date, onClose, onSaveSuccess }) => {
  const { convert } = useCalendar();
  const [gym, setGym] = useState(false);
  const [muscleGroups, setMuscleGroups] = useState([]);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [foods, setFoods] = useState([]);
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [displayDates, setDisplayDates] = useState({ gregStr: date, ethioStr: '' });

  // Load the date conversion representation
  useEffect(() => {
    let active = true;
    const fetchConversion = async () => {
      try {
        const conv = await convert(date, 'gregorian');
        if (active && conv) {
          const gregDate = new Date(date);
          const gregStr = gregDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
          const ethStr = `${conv.ethiopianDate.monthName} ${conv.ethiopianDate.day}, ${conv.ethiopianDate.year}`;
          setDisplayDates({ gregStr, ethStr });
        }
      } catch (err) {
        console.error('Error converting date in DayDetail:', err);
      }
    };
    fetchConversion();
    return () => {
      active = false;
    };
  }, [date, convert]);

  // Load the log data for the given date
  useEffect(() => {
    let active = true;
    const fetchLog = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/logs/${date}`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (active) {
            setGym(data.gym || false);
            setMuscleGroups(data.muscleGroups || []);
            setWorkoutNotes(data.workoutNotes || '');
            setFoods(data.foods || []);
            setTotalCalories(data.totalCalories || 0);
            setTotalProtein(data.totalProtein || 0);
            setTotalCarbs(data.totalCarbs || 0);
            setTotalFat(data.totalFat || 0);
          }
        } else {
          throw new Error('Failed to load log data');
        }
      } catch (err) {
        console.error('Error loading log:', err);
        if (active) {
          setError('Failed to load today\'s log. Please try again.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchLog();
    return () => {
      active = false;
    };
  }, [date]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/logs/${date}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ gym, muscleGroups, workoutNotes }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to save log');
      }

      if (onSaveSuccess) {
        onSaveSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error saving daily log:', err);
      setError(err.message || 'Failed to save log. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFoodUpdated = (updatedLog) => {
    setFoods(updatedLog.foods || []);
    setTotalCalories(updatedLog.totalCalories || 0);
    setTotalProtein(updatedLog.totalProtein || 0);
    setTotalCarbs(updatedLog.totalCarbs || 0);
    setTotalFat(updatedLog.totalFat || 0);
    if (onSaveSuccess) {
      onSaveSuccess();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full sm:max-w-lg bg-[var(--bg-color)] rounded-t-3xl sm:rounded-3xl border border-[var(--text-muted-color)]/10 shadow-2xl p-6 overflow-y-auto max-h-[85vh] sm:max-h-[90vh] animate-fade-in transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-color)] tracking-tight">
              {displayDates.gregStr}
            </h2>
            {displayDates.ethioStr && (
              <p className="text-sm font-semibold text-[#FF5236] mt-0.5">
                🇪🇹 {displayDates.ethioStr}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted-color)] hover:bg-[var(--surface-color)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-[#FF4D2E] animate-spin" />
            <p className="text-xs text-[var(--text-muted-color)]">Loading log details...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Gym Checkbox Toggle */}
            <div
              onClick={() => setGym(!gym)}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer ${
                gym
                  ? 'border-[#FF4D2E]/35 bg-[#FF4D2E]/5 shadow-sm'
                  : 'border-[var(--text-muted-color)]/10 bg-[var(--surface-color)]/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    gym ? 'bg-[#FF4D2E] text-white' : 'bg-[var(--bg-color)] text-[var(--text-muted-color)]'
                  }`}
                >
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-color)]">Workout Completed</h3>
                  <p className="text-xs text-[var(--text-muted-color)]">Check this if you hit the gym today</p>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                  gym ? 'bg-[#FF4D2E] border-[#FF4D2E]' : 'border-[var(--text-muted-color)]/30'
                }`}
              >
                {gym && <CheckCircle2 className="w-4 h-4 text-white" />}
              </div>
            </div>

            {/* Muscle Groups */}
            {gym && (
              <div className="space-y-2.5 animate-fade-in">
                <label className="block text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">
                  Targeted Muscle Groups
                </label>
                <MuscleGroupSelector selected={muscleGroups} onChange={setMuscleGroups} />
              </div>
            )}

            {/* Workout Notes */}
            <div className="space-y-2">
              <label htmlFor="workout-notes" className="block text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">
                Workout Notes
              </label>
              <textarea
                id="workout-notes"
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="Log exercises, sets, weights, or how you felt..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-[var(--text-muted-color)]/10 bg-[var(--surface-color)]/50 text-sm text-[var(--text-color)] placeholder-[var(--text-muted-color)]/60 focus:outline-none focus:border-[#FF4D2E]/50 focus:bg-[var(--bg-color)] transition-all resize-none"
              />
            </div>

            {/* Food & Nutrition Section */}
            <div className="border-t border-[var(--text-muted-color)]/10 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-color)] uppercase tracking-wider">
                Food & Nutrition
              </h3>
              
              {/* Daily Macro Totals Summary Grid */}
              <div className="grid grid-cols-4 gap-3 bg-[var(--surface-color)]/40 p-4 rounded-2xl border border-[var(--text-muted-color)]/10">
                <div className="text-center">
                  <span className="block text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Calories</span>
                  <span className="text-base font-bold text-[#FF5236]">{totalCalories}</span>
                  <span className="block text-[9px] text-[var(--text-muted-color)]">kcal</span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Protein</span>
                  <span className="text-base font-bold text-[var(--text-color)]">{totalProtein}g</span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Carbs</span>
                  <span className="text-base font-bold text-[var(--text-color)]">{totalCarbs}g</span>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Fat</span>
                  <span className="text-base font-bold text-[var(--text-color)]">{totalFat}g</span>
                </div>
              </div>

              {/* Food Logging dropdown search */}
              <FoodSearchDropdown date={date} onFoodAdded={handleFoodUpdated} />

              {/* Food Log List */}
              <FoodLogList date={date} foods={foods} onFoodDeleted={handleFoodUpdated} />
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  'Save Workout'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default DayDetail;
