import React, { useState, useEffect, useCallback } from 'react';
import { useCalendar } from '../context/CalendarContext';
import Navbar from '../components/Navbar';
import DayDetail from '../components/DayDetail';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';

const ETHIOPIAN_MONTHS = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miazia', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];

const GREGORIAN_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Calendar = () => {
  const { calendarSystem, todayData, loadingToday, todayError, convert, fetchToday } = useCalendar();

  // Navigation states
  // Gregorian view state
  const [gregMonth, setGregMonth] = useState(new Date().getMonth());
  const [gregYear, setGregYear] = useState(new Date().getFullYear());

  // Ethiopian view state
  const [ethioMonth, setEthioMonth] = useState(10); // Default to Sene (Month 10)
  const [ethioYear, setEthioYear] = useState(2018);

  // Month grid day objects
  const [days, setDays] = useState([]);
  const [startWeekday, setStartWeekday] = useState(0);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [gridError, setGridError] = useState(null);

  // Selected date state for DayDetail
  const [selectedDate, setSelectedDate] = useState(null);

  // Initialize view states from synchronized "todayData"
  useEffect(() => {
    if (todayData) {
      const [gYear, gMonth] = todayData.gregorianDate.split('-').map(Number);
      setGregMonth(gMonth - 1);
      setGregYear(gYear);

      if (todayData.ethiopianDate) {
        setEthioMonth(todayData.ethiopianDate.month);
        setEthioYear(todayData.ethiopianDate.year);
      }
    }
  }, [todayData]);

  // Compute Gregorian Month grid
  const generateGregorianGrid = useCallback(() => {
    setLoadingGrid(true);
    setGridError(null);
    try {
      const firstDay = new Date(gregYear, gregMonth, 1);
      const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday etc.
      const daysInMonth = new Date(gregYear, gregMonth + 1, 0).getDate();

      const tempDays = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const yearStr = gregYear;
        const monthStr = String(gregMonth + 1).padStart(2, '0');
        const dayStr = String(d).padStart(2, '0');
        tempDays.push({
          dayNum: d,
          gregorianDateString: `${yearStr}-${monthStr}-${dayStr}`,
        });
      }

      setStartWeekday(startDayOfWeek);
      setDays(tempDays);
    } catch (err) {
      console.error('Error generating Gregorian grid:', err);
      setGridError('Failed to generate Gregorian calendar grid.');
    } finally {
      setLoadingGrid(false);
    }
  }, [gregMonth, gregYear]);

  // Compute Ethiopian Month grid
  const generateEthiopianGrid = useCallback(async () => {
    setLoadingGrid(true);
    setGridError(null);
    try {
      // 1. Determine days in Ethiopian month
      let daysInMonth = 30;
      if (ethioMonth === 13) {
        // Leap year if year % 4 === 3
        const isLeap = ethioYear % 4 === 3;
        daysInMonth = isLeap ? 6 : 5;
      }

      // 2. Fetch Gregorian equivalent of Ethiopian 1st of the month
      const firstDayStr = `${ethioYear}-${String(ethioMonth).padStart(2, '0')}-01`;
      const conversion = await convert(firstDayStr, 'ethiopian');

      if (!conversion || !conversion.gregorianDate) {
        throw new Error('Failed to convert Ethiopian first day of month');
      }

      // 3. Parse base date to noon to avoid DST/timezone shift bugs
      const [gYear, gMonth, gDay] = conversion.gregorianDate.split('-').map(Number);
      const baseDate = new Date(gYear, gMonth - 1, gDay, 12, 0, 0);

      const startDayOfWeek = new Date(gYear, gMonth - 1, gDay).getDay();

      // 4. Generate days sequentially
      const tempDays = [];
      for (let d = 1; d <= daysInMonth; d++) {
        // Add d-1 days in milliseconds
        const cellDate = new Date(baseDate.getTime() + (d - 1) * 24 * 60 * 60 * 1000);
        const y = cellDate.getFullYear();
        const m = String(cellDate.getMonth() + 1).padStart(2, '0');
        const dayNum = String(cellDate.getDate()).padStart(2, '0');
        
        tempDays.push({
          dayNum: d,
          gregorianDateString: `${y}-${m}-${dayNum}`,
        });
      }

      setStartWeekday(startDayOfWeek);
      setDays(tempDays);
    } catch (err) {
      console.error(err);
      setGridError('Ethiopian calendar conversion failed. Check network or try again.');
    } finally {
      setLoadingGrid(false);
    }
  }, [ethioMonth, ethioYear, convert]);

  // Regenerate grid when view date or calendar system changes
  useEffect(() => {
    if (calendarSystem === 'gregorian') {
      generateGregorianGrid();
    } else {
      generateEthiopianGrid();
    }
  }, [calendarSystem, gregMonth, gregYear, ethioMonth, ethioYear, generateGregorianGrid, generateEthiopianGrid]);

  // Navigate to previous month
  const handlePrevMonth = () => {
    if (calendarSystem === 'gregorian') {
      if (gregMonth === 0) {
        setGregMonth(11);
        setGregYear(gregYear - 1);
      } else {
        setGregMonth(gregMonth - 1);
      }
    } else {
      if (ethioMonth === 1) {
        setEthioMonth(13);
        setEthioYear(ethioYear - 1);
      } else {
        setEthioMonth(ethioMonth - 1);
      }
    }
  };

  // Navigate to next month
  const handleNextMonth = () => {
    if (calendarSystem === 'gregorian') {
      if (gregMonth === 11) {
        setGregMonth(0);
        setGregYear(gregYear + 1);
      } else {
        setGregMonth(gregMonth + 1);
      }
    } else {
      if (ethioMonth === 13) {
        setEthioMonth(1);
        setEthioYear(ethioYear + 1);
      } else {
        setEthioMonth(ethioMonth + 1);
      }
    }
  };

  // Jump to today
  const handleToday = () => {
    if (todayData) {
      const [gYear, gMonth] = todayData.gregorianDate.split('-').map(Number);
      setGregMonth(gMonth - 1);
      setGregYear(gYear);

      if (todayData.ethiopianDate) {
        setEthioMonth(todayData.ethiopianDate.month);
        setEthioYear(todayData.ethiopianDate.year);
      }
    }
  };

  const getHeaderTitle = () => {
    if (calendarSystem === 'gregorian') {
      return `${GREGORIAN_MONTHS[gregMonth]} ${gregYear}`;
    } else {
      return `${ETHIOPIAN_MONTHS[ethioMonth - 1]} ${ethioYear}`;
    }
  };

  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Handle cell click
  const handleDayClick = (day) => {
    setSelectedDate(day.gregorianDateString);
  };

  if (loadingToday) {
    return (
      <div className="min-h-screen bg-[var(--bg-color)] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-[#FF4D2E] animate-spin" />
          <p className="text-xs text-[var(--text-muted-color)]">Syncing with server timezone...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] pb-24">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 mt-10">
        <div className="animate-fade-in space-y-6">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface-color)] border border-[var(--text-muted-color)]/10 rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF4D2E]/10 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-[#FF4D2E]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-muted-color)] uppercase tracking-wider">Calendar View</p>
                <h1 className="text-xl font-extrabold text-[var(--text-color)] tracking-tight">
                  {getHeaderTitle()}
                </h1>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevMonth}
                disabled={loadingGrid}
                className="p-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--surface-color)] disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleToday}
                disabled={loadingGrid}
                className="px-4 py-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-xs font-bold text-[var(--text-color)] hover:bg-[var(--surface-color)] disabled:opacity-50 cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                disabled={loadingGrid}
                className="p-2 rounded-xl border border-[var(--text-muted-color)]/10 bg-[var(--bg-color)] text-[var(--text-color)] hover:bg-[var(--surface-color)] disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Calendar Syncing Error Alert */}
          {todayError && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-semibold">Calendar Sync Warning</p>
                  <p className="text-xs text-red-500/80 mt-0.5">{todayError}</p>
                </div>
              </div>
              <button
                onClick={fetchToday}
                className="px-3 py-1.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-colors cursor-pointer"
              >
                Retry Sync
              </button>
            </div>
          )}

          {/* Month Grid */}
          <div className="bg-[var(--surface-color)] border border-[var(--text-muted-color)]/10 rounded-3xl p-6 shadow-sm">
            {loadingGrid ? (
              <div className="py-32 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-[#FF4D2E] animate-spin" />
                <p className="text-xs text-[var(--text-muted-color)]">Loading monthly calendar...</p>
              </div>
            ) : gridError ? (
              <div className="py-32 flex flex-col items-center justify-center gap-3 text-center">
                <AlertCircle className="w-8 h-8 text-[#FF4D2E]" />
                <p className="text-sm font-semibold text-[var(--text-color)]">{gridError}</p>
                <button
                  onClick={calendarSystem === 'gregorian' ? generateGregorianGrid : generateEthiopianGrid}
                  className="mt-2 px-4 py-2 rounded-xl bg-[#FF4D2E] text-white text-xs font-bold"
                >
                  Retry Load
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Weekdays header */}
                <div className="grid grid-cols-7 gap-2 text-center">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="text-xs font-bold text-[var(--text-muted-color)] uppercase tracking-wider py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Padding offsets */}
                  {Array.from({ length: startWeekday }).map((_, index) => (
                    <div
                      key={`pad-${index}`}
                      className="aspect-square rounded-2xl bg-transparent border border-transparent"
                    />
                  ))}

                  {/* Day cells */}
                  {days.map((day) => {
                    const isToday = todayData && day.gregorianDateString === todayData.gregorianDate;

                    return (
                      <div
                        key={day.gregorianDateString}
                        onClick={() => handleDayClick(day)}
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center p-2 cursor-pointer transition-all duration-200 hover:scale-[1.03] select-none ${
                          isToday
                            ? 'bg-[#FF4D2E]/10 border-[#FF4D2E]/40 text-[#FF5236]'
                            : 'bg-[var(--bg-color)] border-[var(--text-muted-color)]/10 text-[var(--text-color)] hover:border-[var(--text-muted-color)]/30 hover:bg-[var(--surface-color)]/40'
                        }`}
                      >
                        <span className={`text-sm sm:text-base font-extrabold ${isToday ? 'scale-110' : ''}`}>
                          {day.dayNum}
                        </span>
                        
                        {/* Subtext to display Gregorian date on Ethiopian calendar cells */}
                        {calendarSystem === 'ethiopian' && (
                          <span className="text-[9px] text-[var(--text-muted-color)]/80 mt-1">
                            {day.gregorianDateString.split('-')[2]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Selected Day Log Drawer/Modal */}
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSaveSuccess={() => {
            // Can trigger refresh if needed
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
