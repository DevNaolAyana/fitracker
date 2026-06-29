import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--bg-color)]">
      <div className="text-center max-w-md animate-fade-in">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-[#FF5236]/10 border border-[#FF5236]/20 mb-6 text-4xl">
          🗺️
        </div>

        {/* Heading */}
        <h1 className="text-6xl font-black text-[var(--text-color)] mb-3 tracking-tight">
          404
        </h1>
        <h2 className="text-lg font-bold text-[var(--text-color)] mb-3">
          Page not found
        </h2>
        <p className="text-sm text-[var(--text-muted-color)] mb-8 leading-relaxed">
          The route you're looking for doesn't exist. It may have moved, or you
          might have followed a broken link.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#FF5236] text-white text-sm font-semibold hover:bg-[#e84a2f] transition-colors shadow-lg shadow-[#FF5236]/20"
          >
            ⚡ Back to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--surface-color)] text-[var(--text-muted-color)] text-sm font-semibold border border-[var(--text-muted-color)]/15 hover:text-[var(--text-color)] transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
