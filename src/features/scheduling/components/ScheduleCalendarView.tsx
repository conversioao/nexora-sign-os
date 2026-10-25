import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Monitor,
  AlertTriangle,
  Layers,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import { DayOfWeek, Schedule, ScheduleConflict } from '../../../types/domain';
import { DAYS_OF_WEEK, DAY_SHORT_LABELS, DAY_FULL_LABELS, SCHEDULE_PRIORITY_CONFIG } from '../constants/schedulingConstants';
import { jsDayToDayOfWeek } from '../services/scheduleRecurrenceService';

export interface ScheduleCalendarViewProps {
  schedules: Schedule[];
  conflictMap: Map<string, ScheduleConflict[]>;
  onSelectSchedule: (schedule: Schedule) => void;
  onEditSchedule: (schedule: Schedule) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  schedules,
  conflictMap,
  onSelectSchedule,
  onEditSchedule,
}) => {
  // Calendar state: anchor date (default today)
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarMode, setCalendarMode] = useState<'WEEK' | 'MONTH'>('WEEK');

  // Compute Monday of current week
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  const weekMonday = getMonday(currentDate);

  // Generate 7 days of the week
  const weekDays = DAYS_OF_WEEK.map((dayOfWeek, idx) => {
    const dayDate = new Date(weekMonday);
    dayDate.setDate(weekMonday.getDate() + idx);
    const dateStr = dayDate.toISOString().split('T')[0];

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;

    return {
      dayOfWeek,
      date: dayDate,
      dateStr,
      dayNumber: dayDate.getDate(),
      monthLabel: dayDate.toLocaleDateString('pt-PT', { month: 'short' }),
      isToday,
    };
  });

  const nextPeriod = () => {
    const next = new Date(currentDate);
    if (calendarMode === 'WEEK') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    setCurrentDate(next);
  };

  const prevPeriod = () => {
    const prev = new Date(currentDate);
    if (calendarMode === 'WEEK') {
      prev.setDate(prev.getDate() - 7);
    } else {
      prev.setMonth(prev.getMonth() - 1);
    }
    setCurrentDate(prev);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Find schedules for a given day of the week and date
  const getSchedulesForDay = (dayOfWeek: DayOfWeek, dateStr: string) => {
    return schedules
      .filter((s) => {
        if (s.status === 'EXPIRED') return false;
        // Check date interval
        if (dateStr < s.startDate || dateStr > s.endDate) return false;
        // Check day of week
        return s.daysOfWeek.includes(dayOfWeek);
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const formattedWeekRange = `${weekDays[0].dayNumber} ${weekDays[0].monthLabel} — ${
    weekDays[6].dayNumber
  } ${weekDays[6].monthLabel} ${weekDays[0].date.getFullYear()}`;

  return (
    <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl overflow-hidden shadow-lg shadow-black/20 space-y-0">
      {/* Calendar Header / Controls */}
      <div className="p-4 border-b border-[#1E293B] bg-[#070B14]/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Navigation & Period Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#0F172A] border border-[#1E293B] rounded-lg p-1">
            <button
              type="button"
              onClick={prevPeriod}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-md transition-colors cursor-pointer"
              title="Período anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={goToToday}
              className="px-2.5 py-1 text-xs font-semibold hover:bg-slate-800 text-slate-200 rounded-md transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={nextPeriod}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-md transition-colors cursor-pointer"
              title="Próximo período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white capitalize">{formattedWeekRange}</h3>
          </div>
        </div>

        {/* Priority Legend */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium mr-1">Prioridade:</span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Urgente
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Alta
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Normal
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-500" /> Baixa
          </span>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-[#1E293B] min-h-[520px]">
        {weekDays.map((day) => {
          const daySchedules = getSchedulesForDay(day.dayOfWeek, day.dateStr);

          return (
            <div
              key={day.dayOfWeek}
              className={`flex flex-col min-h-[200px] ${
                day.isToday ? 'bg-blue-950/10' : 'bg-[#0B132B]/40'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3 border-b border-[#1E293B] flex items-center justify-between ${
                  day.isToday ? 'bg-blue-950/40 border-blue-500/30' : 'bg-[#070B14]/40'
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-300">
                    {DAY_SHORT_LABELS[day.dayOfWeek]}
                  </span>
                  <div className="text-[11px] text-slate-400">
                    {day.dayNumber} {day.monthLabel}
                  </div>
                </div>

                {day.isToday && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white shadow-sm">
                    Hoje
                  </span>
                )}
              </div>

              {/* Day Events / Schedules */}
              <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[500px]">
                {daySchedules.length === 0 ? (
                  <div className="h-full flex items-center justify-center py-8 text-center text-xs text-slate-600">
                    Sem grades
                  </div>
                ) : (
                  daySchedules.map((schedule) => {
                    const conflicts = conflictMap.get(schedule.id) || [];
                    const hasConflict = conflicts.length > 0;
                    const pConfig = SCHEDULE_PRIORITY_CONFIG[schedule.priority];

                    return (
                      <div
                        key={schedule.id}
                        onClick={() => onSelectSchedule(schedule)}
                        className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${
                          pConfig.borderColor
                        } ${
                          hasConflict
                            ? 'bg-amber-950/20 border-amber-500/60 shadow-amber-950/20'
                            : 'bg-[#0F172A]/90 hover:bg-[#1E293B]'
                        }`}
                      >
                        {/* Time & Priority Pill */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-200">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <span>
                              {schedule.startTime} — {schedule.endTime}
                            </span>
                          </span>

                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${pConfig.chipBg}`}
                          >
                            {pConfig.label}
                          </span>
                        </div>

                        {/* Title */}
                        <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                          <span className="truncate">{schedule.name}</span>
                          {hasConflict && (
                            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
                          )}
                        </div>

                        {/* Playlist Name */}
                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-1">
                          <Layers className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">{schedule.playlistName}</span>
                        </div>

                        {/* Displays Count */}
                        <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Monitor className="w-3 h-3 text-slate-400" />
                            <span>{schedule.displayCount || schedule.displayIds?.length || 0} telas</span>
                          </span>
                          <span className="text-blue-400 font-mono text-[9px]">
                            {schedule.code}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
