import React, { useState, useEffect } from 'react';
import { useCalendar } from '../context/CalendarContext';
import Navbar from '../components/Navbar';
import Button from '../components/Button';
import Input from '../components/Input';
import { User, Activity, Flame, Scale, Info, RotateCcw } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Profile = () => {
  const { calendarSystem, toggleCalendarSystem, todayData } = useCalendar();

  // Profile fields state
  const [heightCm, setHeightCm] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('male');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [goal, setGoal] = useState('maintain');
  const [weeklyGymGoal, setWeeklyGymGoal] = useState(4);

  // Target overrides state
  const [overrideCalories, setOverrideCalories] = useState('');
  const [overrideProtein, setOverrideProtein] = useState('');
  const [overrideCarbs, setOverrideCarbs] = useState('');
  const [overrideFat, setOverrideFat] = useState('');

  // Weight log state
  const [weightKg, setWeightKg] = useState('');
  const [weightDate, setWeightDate] = useState('');

  // Computed data / History from server
  const [targets, setTargets] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const [needsWeightLog, setNeedsWeightLog] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(true);
  const [weightHistory, setWeightHistory] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [weightLogging, setWeightLogging] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch profile & weight history
  const fetchProfileData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        const prof = data.profile;
        setHeightCm(prof.heightCm || '');
        setAge(prof.age || '');
        setGender(prof.gender || 'male');
        setActivityLevel(prof.activityLevel || 'moderate');
        setGoal(prof.goal || 'maintain');
        setWeeklyGymGoal(prof.weeklyGymGoal ?? 4);

        setOverrideCalories(prof.targetOverrides?.calories || '');
        setOverrideProtein(prof.targetOverrides?.protein || '');
        setOverrideCarbs(prof.targetOverrides?.carbs || '');
        setOverrideFat(prof.targetOverrides?.fat || '');

        setTargets(data.targets);
        setLatestWeight(data.latestWeight);
        setNeedsWeightLog(data.needsWeightLog);
        setNeedsProfileSetup(data.needsProfileSetup);
      }
    } catch (err) {
      console.error('Error fetching profile data:', err);
    }
  };

  const fetchWeightHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/api/profile/weight-history`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        // Sort newest weight logs first for display
        setWeightHistory(data.reverse());
      }
    } catch (err) {
      console.error('Error fetching weight history:', err);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchProfileData(), fetchWeightHistory()]);
      setLoading(false);
    };
    loadAll();
  }, []);

  // Sync weightDate when todayData finishes loading
  useEffect(() => {
    if (todayData?.gregorianDate) {
      setWeightDate(todayData.gregorianDate);
    }
  }, [todayData]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // Submit profile settings
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const overrides = {
        calories: overrideCalories ? parseInt(overrideCalories, 10) : null,
        protein: overrideProtein ? parseInt(overrideProtein, 10) : null,
        carbs: overrideCarbs ? parseInt(overrideCarbs, 10) : null,
        fat: overrideFat ? parseInt(overrideFat, 10) : null,
      };

      const res = await fetch(`${API_URL}/api/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          heightCm: heightCm ? parseFloat(heightCm) : null,
          age: age ? parseInt(age, 10) : null,
          gender,
          activityLevel,
          goal,
          weeklyGymGoal: weeklyGymGoal ? parseInt(weeklyGymGoal, 10) : 4,
          targetOverrides: overrides,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');

      setTargets(data.targets);
      setLatestWeight(data.latestWeight);
      setNeedsWeightLog(data.needsWeightLog);
      setNeedsProfileSetup(data.needsProfileSetup);
      showMessage('Profile settings saved successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      showMessage(err.message || 'Error saving profile', 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // Submit weigh-in
  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!weightKg || !weightDate) return;
    setWeightLogging(true);
    try {
      const res = await fetch(`${API_URL}/api/profile/weight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          date: weightDate,
          weightKg: parseFloat(weightKg),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to log weight');

      setTargets(data.targets);
      setLatestWeight(data.latestWeight);
      setNeedsWeightLog(data.needsWeightLog);
      setNeedsProfileSetup(data.needsProfileSetup);

      setWeightKg('');
      showMessage('Weigh-in recorded successfully!');
      fetchWeightHistory();
    } catch (err) {
      console.error('Error saving weight:', err);
      showMessage(err.message || 'Error saving weigh-in', 'error');
    } finally {
      setWeightLogging(false);
    }
  };

  const handleResetOverrides = () => {
    setOverrideCalories('');
    setOverrideProtein('');
    setOverrideCarbs('');
    setOverrideFat('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-[#FF4D2E]/25 border-t-[#FF4D2E] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 mt-10">
        <div className="animate-fade-in space-y-8">
          {/* Header & Global Calendar toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-color)] rounded-3xl p-6 border border-[var(--text-muted-color)]/10">
            <div>
              <p className="text-xs font-semibold text-[#FF5236] uppercase tracking-wider mb-0.5">Settings & Macros</p>
              <h1 className="text-2xl font-extrabold text-[var(--text-color)] tracking-tight">Your Profile</h1>
            </div>
            
            {/* Calendar toggle */}
            <div className="flex items-center gap-3 bg-[var(--bg-color)] p-1.5 rounded-2xl border border-[var(--text-muted-color)]/10 shrink-0">
              <span className="text-xs font-semibold text-[var(--text-muted-color)] pl-2.5">Calendar System</span>
              <button
                onClick={toggleCalendarSystem}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  calendarSystem === 'gregorian'
                    ? 'bg-[#FF4D2E] text-white shadow shadow-[#FF4D2E]/25'
                    : 'text-[var(--text-color)] hover:bg-[var(--surface-color)]'
                }`}
              >
                Gregorian
              </button>
              <button
                onClick={toggleCalendarSystem}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                  calendarSystem === 'ethiopian'
                    ? 'bg-[#FF4D2E] text-white shadow shadow-[#FF4D2E]/25'
                    : 'text-[var(--text-color)] hover:bg-[var(--surface-color)]'
                }`}
              >
                Ethiopian
              </button>
            </div>
          </div>

          {message.text && (
            <div
              className={`p-4 rounded-2xl text-sm font-medium border animate-fade-in ${
                message.type === 'error'
                  ? 'bg-red-500/10 border-red-500/20 text-red-500'
                  : 'bg-green-500/10 border-green-500/20 text-green-500'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Profile Overview Banner / Needs Setup banner */}
          {(needsProfileSetup || needsWeightLog) && (
            <div className="flex items-start gap-4 p-5 rounded-3xl bg-[#FF4D2E]/5 border border-[#FF4D2E]/20 text-[var(--text-color)]">
              <Info className="w-5 h-5 text-[#FF4D2E] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm">Macro Calculator Setup Required</h3>
                <p className="text-xs text-[var(--text-muted-color)] mt-1 leading-relaxed">
                  {needsProfileSetup && needsWeightLog
                    ? 'Please fill out your profile details (height, age, gender, activity level) and record a weigh-in below to automatically calculate your BMR, TDEE, and daily macro targets.'
                    : needsProfileSetup
                    ? 'Please complete your height, age, gender, and activity details to calculate your calorie and macro targets.'
                    : 'Please log a weigh-in below. The macro calculator requires your latest weight to compute calorie targets and macros.'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1 & 2: Forms */}
            <div className="md:col-span-2 space-y-8">
              {/* Profile details and macro overrides */}
              <form onSubmit={handleProfileSubmit} className="bg-[var(--surface-color)] border border-[var(--text-muted-color)]/10 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-[var(--text-muted-color)]/10 pb-4 mb-2">
                  <User className="w-5 h-5 text-[#FF4D2E]" />
                  <h2 className="text-lg font-bold text-[var(--text-color)] tracking-tight">Physical Parameters</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Height (cm)"
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="e.g. 181"
                    min="50"
                    max="250"
                  />
                  <Input
                    label="Age"
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 22"
                    min="1"
                    max="120"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label htmlFor="profile-gender" className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">Gender</label>
                    <select
                      id="profile-gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[var(--text-muted-color)]/15 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E] transition-colors"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other / Average</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="profile-activity" className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">Activity Level</label>
                    <select
                      id="profile-activity"
                      value={activityLevel}
                      onChange={(e) => setActivityLevel(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[var(--text-muted-color)]/15 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E] transition-colors"
                    >
                      <option value="sedentary">Sedentary (Office job)</option>
                      <option value="light">Lightly Active</option>
                      <option value="moderate">Moderately Active</option>
                      <option value="active">Active (Heavy gym)</option>
                      <option value="very_active">Very Active (Athlete)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="profile-goal" className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">Goal</label>
                    <select
                      id="profile-goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      className="w-full h-11 px-4 rounded-xl border border-[var(--text-muted-color)]/15 bg-[var(--bg-color)] text-sm text-[var(--text-color)] focus:outline-none focus:border-[#FF4D2E] transition-colors"
                    >
                      <option value="lose">Lose Weight (-500 kcal)</option>
                      <option value="maintain">Maintain Weight</option>
                      <option value="gain">Gain Weight (+300 kcal)</option>
                    </select>
                  </div>
                </div>

                {/* Weekly gym goal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Weekly Gym Goal (days)"
                    type="number"
                    value={weeklyGymGoal}
                    onChange={(e) => setWeeklyGymGoal(e.target.value)}
                    placeholder="e.g. 4"
                    min="1"
                    max="7"
                  />
                </div>

                {/* Macro Target Overrides */}
                <div className="pt-4 border-t border-[var(--text-muted-color)]/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-[var(--text-color)]">Manual Target Overrides</h3>
                      <p className="text-xs text-[var(--text-muted-color)]">Leave blank to use automatic calculations</p>
                    </div>
                    {(overrideCalories || overrideProtein || overrideCarbs || overrideFat) && (
                      <button
                        type="button"
                        onClick={handleResetOverrides}
                        className="flex items-center gap-1 text-xs text-[#FF5236] font-semibold hover:underline"
                      >
                        <RotateCcw className="w-3 h-3" /> Clear Overrides
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Input
                      label="Calories (kcal)"
                      type="number"
                      value={overrideCalories}
                      onChange={(e) => setOverrideCalories(e.target.value)}
                      placeholder={targets ? String(targets.calories) : 'Auto'}
                    />
                    <Input
                      label="Protein (g)"
                      type="number"
                      value={overrideProtein}
                      onChange={(e) => setOverrideProtein(e.target.value)}
                      placeholder={targets ? String(targets.protein) : 'Auto'}
                    />
                    <Input
                      label="Carbs (g)"
                      type="number"
                      value={overrideCarbs}
                      onChange={(e) => setOverrideCarbs(e.target.value)}
                      placeholder={targets ? String(targets.carbs) : 'Auto'}
                    />
                    <Input
                      label="Fat (g)"
                      type="number"
                      value={overrideFat}
                      onChange={(e) => setOverrideFat(e.target.value)}
                      placeholder={targets ? String(targets.fat) : 'Auto'}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={profileSaving}>
                    {profileSaving ? 'Saving parameters...' : 'Save Profile & Settings'}
                  </Button>
                </div>
              </form>

              {/* Weight Log Section */}
              <div className="bg-[var(--surface-color)] border border-[var(--text-muted-color)]/10 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2.5 border-b border-[var(--text-muted-color)]/10 pb-4 mb-2">
                  <Scale className="w-5 h-5 text-[#FF4D2E]" />
                  <h2 className="text-lg font-bold text-[var(--text-color)] tracking-tight">Log Your Weight</h2>
                </div>

                <form onSubmit={handleWeightSubmit} className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="flex-1 w-full">
                    <Input
                      label="Weight (kg)"
                      type="number"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="e.g. 78.5"
                      required
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <Input
                      label="Date"
                      type="date"
                      value={weightDate}
                      onChange={(e) => setWeightDate(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={weightLogging} className="h-11 shrink-0 px-6 w-full sm:w-auto">
                    {weightLogging ? 'Logging...' : 'Record Weigh-in'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Column 3: Display targets & Weight history */}
            <div className="space-y-8">
              {/* Macro target board */}
              <div className="bg-[var(--surface-color)] border border-[var(--text-muted-color)]/10 rounded-3xl p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#FF4D2E]" />
                  <h2 className="text-md font-bold text-[var(--text-color)] tracking-tight">Active Targets</h2>
                </div>

                {targets ? (
                  <div className="space-y-4">
                    {/* Calorie Card */}
                    <div className="bg-[var(--bg-color)] border border-[var(--text-muted-color)]/10 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-xs text-[var(--text-muted-color)] font-medium">Daily Calorie Target</p>
                        <p className="text-2xl font-black text-[var(--text-color)] tracking-tight mt-1">{targets.calories} kcal</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                    </div>

                    {/* Macro Cards Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[var(--bg-color)] border border-[var(--text-muted-color)]/10 rounded-xl p-3">
                        <p className="text-xs text-[var(--text-muted-color)] font-semibold uppercase">Protein</p>
                        <p className="text-md font-bold text-[var(--text-color)] mt-1">{targets.protein}g</p>
                      </div>
                      <div className="bg-[var(--bg-color)] border border-[var(--text-muted-color)]/10 rounded-xl p-3">
                        <p className="text-xs text-[var(--text-muted-color)] font-semibold uppercase">Carbs</p>
                        <p className="text-md font-bold text-[var(--text-color)] mt-1">{targets.carbs}g</p>
                      </div>
                      <div className="bg-[var(--bg-color)] border border-[var(--text-muted-color)]/10 rounded-xl p-3">
                        <p className="text-xs text-[var(--text-muted-color)] font-semibold uppercase">Fat</p>
                        <p className="text-md font-bold text-[var(--text-color)] mt-1">{targets.fat}g</p>
                      </div>
                    </div>

                    {/* Auto-calc summary details */}
                    <div className="text-xs text-[var(--text-muted-color)] space-y-1.5 pt-2 border-t border-[var(--text-muted-color)]/10">
                      <div className="flex justify-between">
                        <span>Calculated BMR:</span>
                        <span className="font-semibold text-[var(--text-color)]">{targets.bmr} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Calculated TDEE:</span>
                        <span className="font-semibold text-[var(--text-color)]">{targets.tdee} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Latest weight:</span>
                        <span className="font-semibold text-[var(--text-color)]">{latestWeight} kg</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-[var(--bg-color)] border border-[var(--text-muted-color)]/10 rounded-2xl">
                    <p className="text-sm text-[var(--text-muted-color)] font-medium">No calculations yet</p>
                    <p className="text-xs text-[var(--text-muted-color)]/70 px-4 mt-1">Complete your details and weight log to calculate macros.</p>
                  </div>
                )}
              </div>

              {/* Weight history list */}
              <div className="bg-[var(--surface-color)] border border-[var(--text-muted-color)]/10 rounded-3xl p-6 space-y-4 max-h-[350px] flex flex-col">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#FF4D2E]" />
                  <h2 className="text-md font-bold text-[var(--text-color)] tracking-tight">Weight Log History</h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {weightHistory.length > 0 ? (
                    weightHistory.map((log) => (
                      <div key={log._id} className="bg-[var(--bg-color)] border border-[var(--text-muted-color)]/10 rounded-xl px-4 py-2.5 flex items-center justify-between text-sm shadow-sm hover:scale-[1.01] transition-transform">
                        <span className="font-medium text-[var(--text-color)]">{log.weightKg} kg</span>
                        <span className="text-xs text-[var(--text-muted-color)]">{log.date}</span>
                      </div>
                    ))
                  ) : (
                    <div className="py-10 text-center">
                      <p className="text-xs text-[var(--text-muted-color)] font-medium">No weigh-ins recorded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
