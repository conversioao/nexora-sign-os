import React from 'react';
import { DayOfWeek } from '../../../types/domain';
import { DAYS_OF_WEEK, DAY_SHORT_LABELS, DAY_FULL_LABELS } from '../constants/schedulingConstants';
import { formatDaysSummary } from '../services/scheduleRecurrenceService';

export interface DaysOfWeekSelectorProps {
  selectedDays: DayOfWeek[];
  onChange: (days: DayOfWeek[]) => void;
  disabled?: boolean;
}

export const DaysOfWeekSelector: React.FC<DaysOfWeekSelectorProps> = ({
  selectedDays,
  onChange,
  disabled = false,
}) => {
  const toggleDay = (day: DayOfWeek) => {
    if (disabled) return;
    if (selectedDays.includes(day)) {
      onChange(selectedDays.filter((d) => d !== day));
    } else {
      // Keep in canonical order MON..SUN
      const next = [...selectedDays, day];
      const sorted = DAYS_OF_WEEK.filter((d) => next.includes(d));
      onChange(sorted);
    }
  };

  const selectWeekdays = () => {
    if (disabled) return;
    onChange(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  };

  const selectAll = () => {
    if (disabled) return;
    onChange([...DAYS_OF_WEEK]);
  };

  const selectWeekend = () => {
    if (disabled) return;
    onChange(['SAT', 'SUN']);
  };

  const clearAll = () => {
    if (disabled) return;
    onChange([]);
  };

  const summary = formatDaysSummary(selectedDays);

  return (
    <div className="space-y-3">
      {/* Day Buttons */}
      <div className="grid grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day) => {
          const isSelected = selectedDays.includes(day);
          const isWeekend = day === 'SAT' || day === 'SUN';

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => toggleDay(day)}
              title={DAY_FULL_LABELS[day]}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border text-xs font-semibold tracking-wider transition-all cursor-pointer ${
                disabled ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                isSelected
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30'
                  : isWeekend
                  ? 'bg-[#0B132B]/60 border-[#1E293B] text-slate-400 hover:border-slate-600 hover:text-slate-200'
                  : 'bg-[#0F172A] border-[#1E293B] text-slate-300 hover:border-blue-500/50 hover:text-white'
              }`}
            >
              <span>{DAY_SHORT_LABELS[day]}</span>
              <span
                className={`w-1.5 h-1.5 mt-1 rounded-full transition-all ${
                  isSelected ? 'bg-white' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Quick Selection Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={selectWeekdays}
            className="px-2.5 py-1 rounded bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:text-white hover:border-blue-500/40 transition-colors"
          >
            Seg — Sex
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={selectWeekend}
            className="px-2.5 py-1 rounded bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:text-white hover:border-blue-500/40 transition-colors"
          >
            Fins de Semana
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={selectAll}
            className="px-2.5 py-1 rounded bg-[#0F172A] border border-[#1E293B] text-slate-300 hover:text-white hover:border-blue-500/40 transition-colors"
          >
            Todos os Dias
          </button>
          {selectedDays.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={clearAll}
              className="px-2 py-1 text-slate-400 hover:text-rose-400 transition-colors ml-1"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Selected Days Count & Summary */}
        <span className="text-slate-400 font-medium truncate">
          <span className="text-blue-400 font-semibold">{selectedDays.length}</span> dias: {summary}
        </span>
      </div>
    </div>
  );
};
