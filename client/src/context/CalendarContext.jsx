import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

const CalendarContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const CalendarProvider = ({ children }) => {
  const { user } = useAuth();
  const [calendarSystem, setCalendarSystem] = useState(() => {
    return localStorage.getItem('calendarSystem') || 'gregorian';
  });
  const [todayData, setTodayData] = useState(null);
  const [loadingToday, setLoadingToday] = useState(true);
  const [todayError, setTodayError] = useState(null);

  // In-memory cache for conversions: keyed by "from:date" -> { gregorianDate, ethiopianDate }
  const cacheRef = useRef(new Map());

  const toggleCalendarSystem = useCallback(() => {
    setCalendarSystem((prev) => {
      const next = prev === 'gregorian' ? 'ethiopian' : 'gregorian';
      localStorage.setItem('calendarSystem', next);
      return next;
    });
  }, []);

  const fetchToday = useCallback(async () => {
    setLoadingToday(true);
    setTodayError(null);
    try {
      const res = await fetch(`${API_URL}/api/calendar/today`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setTodayData(data);
      } else {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch calendar date');
      }
    } catch (err) {
      console.error('Error fetching calendar today date:', err);
      setTodayError(err.message || 'Failed to sync calendar date');
      setTodayData(null);
    } finally {
      setLoadingToday(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchToday();
    } else {
      setTodayData(null);
      setLoadingToday(false);
      setTodayError(null);
    }
  }, [user, fetchToday]);

  const convert = useCallback(async (date, from) => {
    const key = `${from}:${date}`;
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key);
    }

    try {
      const res = await fetch(`${API_URL}/api/calendar/convert?date=${date}&from=${from}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Conversion failed');
      }
      const data = await res.json();
      cacheRef.current.set(key, data);
      return data;
    } catch (err) {
      console.error(`Conversion failed for ${date} (${from}):`, err);
      throw err;
    }
  }, []);

  return (
    <CalendarContext.Provider
      value={{
        calendarSystem,
        setCalendarSystem,
        toggleCalendarSystem,
        todayData,
        loadingToday,
        todayError,
        convert,
        fetchToday,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendar must be used within CalendarProvider');
  return ctx;
};
