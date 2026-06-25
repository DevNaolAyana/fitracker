import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg-color)]">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="animate-fade-in">
          {/* Welcome hero */}
          <div className="bg-[var(--surface-color)] rounded-3xl p-10 border border-[var(--text-muted-color)]/10 shadow-xl mb-8">
            <div className="flex items-start justify-between flex-wrap gap-6">
              <div>
                <p className="text-sm font-medium text-[#FF4D2E] mb-2 tracking-wide uppercase">Dashboard</p>
                <h1 className="text-3xl font-bold text-[var(--text-color)] tracking-tight mb-2">
                  Welcome back, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-[var(--text-muted-color)]">
                  Track your workouts, log your weight, and check your macro targets on the calendar.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-[var(--bg-color)] px-4 py-3 rounded-2xl border border-[var(--text-muted-color)]/10">
                <div className="w-9 h-9 rounded-xl bg-[#FF4D2E]/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#FF4D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-muted-color)]">Signed in as</p>
                  <p className="text-sm font-medium text-[var(--text-color)]">{user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Phase progress cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { phase: 'Phase 1', label: 'Foundation & Auth', status: 'complete', icon: '🔐' },
              { phase: 'Phase 2', label: 'Profile & Calendar Core', status: 'complete', icon: '📅' },
              { phase: 'Phase 3', label: 'Food & Nutrition Logging', status: 'next', icon: '🍎' },
            ].map(({ phase, label, status, icon }) => (
              <div
                key={phase}
                className={`rounded-2xl p-5 border transition-all duration-200
                  ${status === 'complete'
                    ? 'border-[#FF4D2E]/30 bg-[#FF4D2E]/5'
                    : 'border-[var(--text-muted-color)]/10 bg-[var(--surface-color)] opacity-60'}
                `}
              >
                <div className="text-2xl mb-3">{icon}</div>
                <p className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wider mb-1">{phase}</p>
                <p className="text-sm font-medium text-[var(--text-color)]">{label}</p>
                {status === 'complete' && (
                  <span className="inline-block mt-2 text-xs bg-[#FF4D2E] text-white px-2 py-0.5 rounded-full font-semibold">
                    ✓ Live
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
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
