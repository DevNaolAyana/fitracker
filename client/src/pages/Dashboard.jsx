import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useCalendar } from '../context/CalendarContext';
import Navbar from '../components/Navbar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function toDateStr(date) {
  return date.toISOString().slice(0, 10);
}

/** Returns the Monday of the ISO week containing today. */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Last 30 days from (and including) today. */
function getLast30Days() {
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(toDateStr(d));
  }
  return days;
}

/** All 7 days of the current Mon–Sun week as YYYY-MM-DD strings. */
function getCurrentWeekDays() {
  const monday = getWeekStart();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    return toDateStr(d);
  });
}

const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Spinning loader */
function Spinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="w-7 h-7 rounded-full border-4 border-[#FF4D2E]/20 border-t-[#FF4D2E] animate-spin" />
    </div>
  );
}

/** Card wrapper */
function Card({ children, className = '' }) {
  return (
    <div className={`bg-[var(--surface-color)] rounded-3xl border border-[var(--text-muted-color)]/10 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/** Section header row */
function SectionHeader({ icon, title, sub }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="text-xl">{icon}</span>
      <div>
        <h2 className="text-base font-bold text-[var(--text-color)] tracking-tight leading-tight">{title}</h2>
        {sub && <p className="text-xs text-[var(--text-muted-color)]">{sub}</p>}
      </div>
    </div>
  );
}

/** Macro progress bar row */
function MacroRow({ label, value, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = target > 0 && value > target;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-semibold text-[var(--text-muted-color)] uppercase tracking-wide">{label}</span>
        <span className="font-bold text-[var(--text-color)]">
          {value}
          <span className="font-normal text-[var(--text-muted-color)]"> / {target}g</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--text-muted-color)]/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: over ? '#ef4444' : color }}
        />
      </div>
    </div>
  );
}

/** Custom tooltip for Recharts bar chart */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--surface-color)] border border-[var(--text-muted-color)]/15 rounded-2xl px-4 py-3 shadow-xl text-sm">
      <p className="font-bold text-[var(--text-color)] mb-1">{label}</p>
      <p className="text-[#FF4D2E] font-semibold">{payload[0].value} kcal</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
const Dashboard = () => {
  const { user } = useAuth();
  const { calendarSystem, convert } = useCalendar();

  // Data states
  const [recs, setRecs] = useState(null);
  const [weeklyStats, setWeeklyStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [consistency, setConsistency] = useState(null);

  // Label translation cache { 'YYYY-MM-DD': 'Tikimt 13' }
  const [ethLabels, setEthLabels] = useState({});

  // Loading flags
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState(true);
  const [loadingConsistency, setLoadingConsistency] = useState(true);

  // Fetch helpers
  const fetchRecs = useCallback(async () => {
    setLoadingRecs(true);
    try {
      const res = await fetch(`${API_URL}/api/recommendations/today`, { credentials: 'include' });
      if (res.ok) setRecs(await res.json());
    } catch (e) { console.error('recs fetch', e); }
    finally { setLoadingRecs(false); }
  }, []);

  const fetchWeekly = useCallback(async () => {
    setLoadingWeekly(true);
    try {
      const res = await fetch(`${API_URL}/api/stats/weekly`, { credentials: 'include' });
      if (res.ok) setWeeklyStats(await res.json());
    } catch (e) { console.error('weekly fetch', e); }
    finally { setLoadingWeekly(false); }
  }, []);

  const fetchMonthly = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = now.getUTCMonth() + 1;
      const res = await fetch(`${API_URL}/api/stats/monthly?year=${y}&month=${m}`, { credentials: 'include' });
      if (res.ok) setMonthlyStats(await res.json());
    } catch (e) { console.error('monthly fetch', e); }
    finally { setLoadingMonthly(false); }
  }, []);

  const fetchHeatmap = useCallback(async () => {
    setLoadingHeatmap(true);
    try {
      const res = await fetch(`${API_URL}/api/stats/heatmap`, { credentials: 'include' });
      if (res.ok) setHeatmapData(await res.json());
    } catch (e) { console.error('heatmap fetch', e); }
    finally { setLoadingHeatmap(false); }
  }, []);

  const fetchConsistency = useCallback(async () => {
    setLoadingConsistency(true);
    try {
      const res = await fetch(`${API_URL}/api/stats/consistency`, { credentials: 'include' });
      if (res.ok) setConsistency(await res.json());
    } catch (e) { console.error('consistency fetch', e); }
    finally { setLoadingConsistency(false); }
  }, []);

  useEffect(() => {
    fetchRecs();
    fetchWeekly();
    fetchMonthly();
    fetchHeatmap();
    fetchConsistency();
  }, [fetchRecs, fetchWeekly, fetchMonthly, fetchHeatmap, fetchConsistency]);

  // Translate week-day labels to Ethiopian when that calendar system is active
  useEffect(() => {
    if (calendarSystem !== 'ethiopian') return;
    const weekDays = getCurrentWeekDays();
    const missing = weekDays.filter(d => !ethLabels[d]);
    if (missing.length === 0) return;

    Promise.all(
      missing.map(async (d) => {
        try {
          const data = await convert(d, 'gregorian');
          return {
            date: d,
            label: `${data.ethiopianDate.monthName.slice(0, 3)} ${data.ethiopianDate.day}`,
          };
        } catch { return null; }
      })
    ).then(results => {
      const map = {};
      for (const r of results) if (r) map[r.date] = r.label;
      setEthLabels(prev => ({ ...prev, ...map }));
    });
  }, [calendarSystem, weeklyStats, ethLabels, convert]);

  // ---------------------------------------------------------------------------
  // Derived: weekly chart data
  // ---------------------------------------------------------------------------
  const weekDays = getCurrentWeekDays();

  const weeklyChartData = weekDays.map((date, i) => {
    const log = weeklyStats?.dailyBreakdown?.find(d => d.date === date);
    const baseLabel = DAY_LABELS_SHORT[i];
    const label = calendarSystem === 'ethiopian' && ethLabels[date]
      ? ethLabels[date]
      : baseLabel;
    return {
      date,
      label,
      calories: log?.totalCalories || 0,
      gym: log?.gym || false,
    };
  });

  // ---------------------------------------------------------------------------
  // Derived: heatmap grid (last 30 days)
  // ---------------------------------------------------------------------------
  const heatmapMap = {};
  for (const h of heatmapData) heatmapMap[h.date] = h;
  const allDays = getLast30Days();

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-fade-in">

        {/* ── Welcome Hero ─────────────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-[#FF4D2E]/10 to-[#FF4D2E]/5 rounded-3xl p-8 border border-[#FF4D2E]/15 shadow-xl">
          <div className="flex items-start justify-between flex-wrap gap-5">
            <div>
              <p className="text-xs font-bold text-[#FF4D2E] mb-1.5 tracking-widest uppercase">Dashboard</p>
              <h1 className="text-3xl font-black text-[var(--text-color)] tracking-tight mb-1">
                Welcome back, {user?.name?.split(' ')[0]} 👋
              </h1>
              <p className="text-sm text-[var(--text-muted-color)]">
                Here's your training and nutrition snapshot.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-[var(--surface-color)]/80 px-4 py-3 rounded-2xl border border-[var(--text-muted-color)]/10 backdrop-blur-sm">
              <div className="w-9 h-9 rounded-xl bg-[#FF4D2E]/15 flex items-center justify-center text-lg">
                👤
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted-color)]">Signed in as</p>
                <p className="text-sm font-semibold text-[var(--text-color)]">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Phase Progress ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { phase: 'Phase 1', label: 'Foundation & Auth',         icon: '🔐', status: 'live' },
            { phase: 'Phase 2', label: 'Profile & Calendar Core',   icon: '📅', status: 'live' },
            { phase: 'Phase 3', label: 'Food & Nutrition Logging',  icon: '🍎', status: 'live' },
            { phase: 'Phase 4', label: 'Stats & Dashboard',         icon: '📊', status: 'live' },
            { phase: 'Phase 5', label: 'Reminders, CSV, PWA & Polish', icon: '✨', status: 'next' },
          ].map(({ phase, label, status, icon }) => (
            <div
              key={phase}
              className={`rounded-2xl p-4 border transition-all duration-200
                ${status === 'live'
                  ? 'border-[#FF4D2E]/25 bg-[#FF4D2E]/5'
                  : 'border-[var(--text-muted-color)]/10 bg-[var(--surface-color)] opacity-60'}`}
            >
              <div className="text-xl mb-2">{icon}</div>
              <p className="text-xs font-bold text-[var(--text-muted-color)] uppercase tracking-wider mb-0.5">{phase}</p>
              <p className="text-xs font-medium text-[var(--text-color)] leading-snug">{label}</p>
              {status === 'live' && (
                <span className="inline-block mt-2 text-xs bg-[#FF4D2E] text-white px-2 py-0.5 rounded-full font-bold">
                  ✅ Live
                </span>
              )}
              {status === 'next' && (
                <span className="inline-block mt-2 text-xs text-[var(--text-muted-color)] border border-[var(--text-muted-color)]/20 px-2 py-0.5 rounded-full">
                  Up next
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ── Today's Totals vs Targets + Recommendations ──────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Today totals */}
          <Card className="p-6">
            <SectionHeader icon="🔥" title="Today's Nutrition" sub="Logged vs. daily targets" />
            {loadingRecs ? <Spinner /> : (
              recs?.targets ? (
                <div className="space-y-4">
                  {/* Calorie big number */}
                  <div className="bg-[var(--bg-color)] rounded-2xl p-4 flex items-center justify-between border border-[var(--text-muted-color)]/10">
                    <div>
                      <p className="text-xs text-[var(--text-muted-color)] font-medium mb-0.5">Calories</p>
                      <p className="text-2xl font-black text-[var(--text-color)]">
                        {recs.todayTotals?.calories ?? 0}
                        <span className="text-sm font-normal text-[var(--text-muted-color)]"> / {recs.targets.calories} kcal</span>
                      </p>
                    </div>
                    <div className="text-3xl">🔥</div>
                  </div>
                  <MacroRow label="Protein" value={recs.todayTotals?.protein ?? 0} target={recs.targets.protein} color="#FF4D2E" />
                  <MacroRow label="Carbs"   value={recs.todayTotals?.carbs   ?? 0} target={recs.targets.carbs}   color="#f59e0b" />
                  <MacroRow label="Fat"     value={recs.todayTotals?.fat     ?? 0} target={recs.targets.fat}     color="#8b5cf6" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                  <span className="text-3xl">⚖️</span>
                  <p className="text-sm font-semibold text-[var(--text-color)]">
                    {recs?.hintWeightLog
                      ? 'Log your weight to unlock macro targets'
                      : 'Complete your profile to see targets'}
                  </p>
                  <p className="text-xs text-[var(--text-muted-color)]">
                    Visit the Profile page to set up your details.
                  </p>
                </div>
              )
            )}
          </Card>

          {/* Recommendations panel */}
          <Card className="p-6 flex flex-col">
            <SectionHeader icon="💡" title="Today's Insights" sub="Personalised for you" />
            {loadingRecs ? <Spinner /> : (
              <div className="flex flex-col gap-4 flex-1">
                {/* Gym message */}
                {recs?.gymMessage && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#FF4D2E]/5 border border-[#FF4D2E]/15">
                    <span className="text-xl shrink-0">🏋️</span>
                    <p className="text-sm text-[var(--text-color)] font-medium leading-relaxed">{recs.gymMessage}</p>
                  </div>
                )}

                {/* Macro message */}
                {recs?.macroMessage && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-[var(--bg-color)] border border-[var(--text-muted-color)]/10">
                    <span className="text-xl shrink-0">📊</span>
                    <p className="text-sm text-[var(--text-color)] leading-relaxed">{recs.macroMessage}</p>
                  </div>
                )}
                {recs?.hintWeightLog && !recs?.macroMessage && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <span className="text-xl shrink-0">💡</span>
                    <p className="text-sm text-[var(--text-color)] leading-relaxed">
                      Log your weight on the Profile page to get personalised macro feedback.
                    </p>
                  </div>
                )}

                {/* Quote */}
                {recs?.quote && (
                  <div className="mt-auto pt-4 border-t border-[var(--text-muted-color)]/10">
                    <blockquote className="italic text-sm text-[var(--text-muted-color)] leading-relaxed mb-1">
                      "{recs.quote.text}"
                    </blockquote>
                    <p className="text-xs font-semibold text-[var(--text-color)]">— {recs.quote.author}</p>
                    <p className="text-xs text-[var(--text-muted-color)]/60 mt-2">
                      Quotes provided by{' '}
                      <a
                        href="https://zenquotes.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-[#FF4D2E] transition-colors"
                      >
                        ZenQuotes.io
                      </a>
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* ── Weekly Chart + Consistency ───────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* Weekly bar chart — takes 2/3 */}
          <Card className="p-6 md:col-span-2">
            <SectionHeader icon="📈" title="This Week" sub="Daily calories (Mon – Sun)" />
            {loadingWeekly ? <Spinner /> : (
              weeklyChartData.every(d => d.calories === 0) ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <span className="text-3xl">📋</span>
                  <p className="text-sm text-[var(--text-muted-color)]">No food logged this week yet.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={weeklyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: 'var(--text-muted-color)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--text-muted-color)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,77,46,0.06)' }} />
                    <Bar dataKey="calories" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {weeklyChartData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={entry.gym ? '#FF4D2E' : 'rgba(255,77,46,0.35)'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )
            )}
            <p className="text-xs text-[var(--text-muted-color)]/60 mt-2">
              Orange bars = gym day · Faded = rest day
            </p>
          </Card>

          {/* Consistency badge — takes 1/3 */}
          <Card className="p-6 flex flex-col">
            <SectionHeader icon="🎯" title="Gym Consistency" />
            {loadingConsistency ? <Spinner /> : consistency ? (
              <div className="flex flex-col gap-4 flex-1">
                {/* This week progress */}
                <div className="bg-[var(--bg-color)] rounded-2xl p-4 border border-[var(--text-muted-color)]/10 text-center">
                  <p className="text-4xl font-black text-[var(--text-color)]">
                    {consistency.currentWeekGymDays}
                    <span className="text-xl font-bold text-[var(--text-muted-color)]">/{consistency.weeklyGoal}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted-color)] mt-1">gym days this week</p>
                  {/* Mini dot progress */}
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    {Array.from({ length: consistency.weeklyGoal }, (_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${i < consistency.currentWeekGymDays ? 'bg-[#FF4D2E]' : 'bg-[var(--text-muted-color)]/20'}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Goal status */}
                <div className={`rounded-2xl p-3 text-center text-xs font-semibold border
                  ${consistency.metGoalThisWeek
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : 'bg-[var(--bg-color)] border-[var(--text-muted-color)]/10 text-[var(--text-muted-color)]'}`}>
                  {consistency.metGoalThisWeek ? '✅ Goal met this week!' : 'Goal in progress…'}
                </div>

                {/* Streak */}
                {consistency.consecutiveWeeksMetGoal > 0 && (
                  <div className="mt-auto text-center">
                    <p className="text-2xl font-black text-[#FF4D2E]">🔥 {consistency.consecutiveWeeksMetGoal}</p>
                    <p className="text-xs text-[var(--text-muted-color)]">
                      consecutive {consistency.consecutiveWeeksMetGoal === 1 ? 'week' : 'weeks'} meeting goal
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted-color)] text-center py-4">Could not load consistency data.</p>
            )}
          </Card>
        </div>

        {/* ── 30-Day Heatmap ───────────────────────────────────────────────── */}
        <Card className="p-6">
          <SectionHeader icon="🗓️" title="30-Day Activity Heatmap" sub="Last 30 days — hover for details" />
          {loadingHeatmap ? <Spinner /> : (
            <>
              <div
                className="grid gap-1.5"
                style={{ gridTemplateColumns: 'repeat(30, minmax(0, 1fr))' }}
              >
                {allDays.map((date) => {
                  const entry = heatmapMap[date];
                  const isToday = date === toDateStr(new Date());

                  let bg;
                  let title;
                  if (!entry) {
                    bg = 'bg-[var(--text-muted-color)]/10';
                    title = `${date}: No log`;
                  } else if (entry.gym && entry.totalCalories > 0) {
                    bg = 'bg-[#FF4D2E]';
                    title = `${date}: Gym ✓, ${entry.totalCalories} kcal`;
                  } else if (entry.gym) {
                    bg = 'bg-[#FF4D2E]/70';
                    title = `${date}: Gym ✓, no food logged`;
                  } else if (entry.totalCalories > 0) {
                    bg = 'bg-[#FF4D2E]/30';
                    title = `${date}: ${entry.totalCalories} kcal logged`;
                  } else {
                    bg = 'bg-[var(--text-muted-color)]/10';
                    title = `${date}: No activity`;
                  }

                  return (
                    <div
                      key={date}
                      title={title}
                      className={`
                        aspect-square rounded-md transition-all duration-150 cursor-default
                        hover:scale-125 hover:z-10 relative
                        ${bg}
                        ${isToday ? 'ring-2 ring-[#FF4D2E] ring-offset-1 ring-offset-[var(--surface-color)]' : ''}
                      `}
                    />
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-4 mt-4 flex-wrap">
                {[
                  { color: 'bg-[var(--text-muted-color)]/10', label: 'No log' },
                  { color: 'bg-[#FF4D2E]/30',                 label: 'Food logged' },
                  { color: 'bg-[#FF4D2E]/70',                 label: 'Gym only' },
                  { color: 'bg-[#FF4D2E]',                    label: 'Gym + food' },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${color}`} />
                    <span className="text-xs text-[var(--text-muted-color)]">{label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* ── Monthly Summary ──────────────────────────────────────────────── */}
        <Card className="p-6">
          <SectionHeader icon="📅" title="This Month" sub="Calendar month totals" />
          {loadingMonthly ? <Spinner /> : monthlyStats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Gym Days',    value: monthlyStats.gymDaysCount,           unit: 'days' },
                { label: 'Avg Calories',value: monthlyStats.avgCalories,            unit: 'kcal / day' },
                { label: 'Avg Protein', value: monthlyStats.avgProtein,             unit: 'g / day' },
                { label: 'Total Calories', value: monthlyStats.totalCalories,       unit: 'kcal' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="bg-[var(--bg-color)] rounded-2xl p-4 border border-[var(--text-muted-color)]/10 text-center">
                  <p className="text-xs text-[var(--text-muted-color)] font-semibold uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-2xl font-black text-[var(--text-color)]">{value}</p>
                  <p className="text-xs text-[var(--text-muted-color)] mt-0.5">{unit}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted-color)] text-center py-4">Could not load monthly data.</p>
          )}
        </Card>

      </main>
    </div>
  );
};

export default Dashboard;
