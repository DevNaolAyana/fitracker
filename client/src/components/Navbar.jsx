import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Dumbbell, Calendar, User, LogOut, Sun, Moon, CheckSquare } from 'lucide-react';

const Navbar = () => {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-[#FF4D2E]/10 text-[#FF5236]'
        : 'text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--surface-color)]'
    }`;

  return (
    <header className="border-b border-[var(--text-muted-color)]/10 bg-[var(--surface-color)]/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand/Logo */}
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-[#FF4D2E] flex items-center justify-center shadow shadow-[#FF4D2E]/30 transition-transform duration-300 group-hover:scale-105">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-[var(--text-color)] tracking-tight">Fitraker</span>
        </NavLink>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/dashboard" className={linkClass}>
            <Dumbbell className="w-4 h-4" />
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            <User className="w-4 h-4" />
            Profile
          </NavLink>
          <NavLink to="/calendar" className={linkClass}>
            <Calendar className="w-4 h-4" />
            Calendar
          </NavLink>
          <NavLink to="/todos" className={linkClass}>
            <CheckSquare className="w-4 h-4" />
            Todos
          </NavLink>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile Navigation Icons */}
          <div className="flex md:hidden items-center gap-1">
            <NavLink to="/dashboard" className="p-2 rounded-xl text-[var(--text-muted-color)] hover:text-[var(--text-color)]" title="Dashboard">
              <Dumbbell className="w-5 h-5" />
            </NavLink>
            <NavLink to="/profile" className="p-2 rounded-xl text-[var(--text-muted-color)] hover:text-[var(--text-color)]" title="Profile">
              <User className="w-5 h-5" />
            </NavLink>
            <NavLink to="/calendar" className="p-2 rounded-xl text-[var(--text-muted-color)] hover:text-[var(--text-color)]" title="Calendar">
              <Calendar className="w-5 h-5" />
            </NavLink>
            <NavLink to="/todos" className="p-2 rounded-xl text-[var(--text-muted-color)] hover:text-[var(--text-color)]" title="Todos">
              <CheckSquare className="w-5 h-5" />
            </NavLink>
          </div>

          <div className="h-6 w-px bg-[var(--text-muted-color)]/25 mx-1 hidden md:block"></div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2.5 rounded-xl text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--surface-color)] transition-all duration-200"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-muted-color)] hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
