import React from 'react';
import { Search, RotateCcw, List, Calendar, SlidersHorizontal } from 'lucide-react';
import { ScheduleFilters } from '../../../repositories/types';
import { SchedulePriority, ScheduleRecurrence, ScheduleStatus } from '../../../types/domain';
import {
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_PRIORITY_LABELS,
  SCHEDULE_RECURRENCE_LABELS,
} from '../constants/schedulingConstants';

export interface ScheduleFiltersBarProps {
  filters: ScheduleFilters;
  onUpdateFilters: (filters: Partial<ScheduleFilters>) => void;
  onResetFilters: () => void;
  viewMode: 'LIST' | 'CALENDAR';
  onChangeViewMode: (mode: 'LIST' | 'CALENDAR') => void;
}

export const ScheduleFiltersBar: React.FC<ScheduleFiltersBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  viewMode,
  onChangeViewMode,
}) => {
  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.status !== 'ALL' ||
    filters.priority !== 'ALL' ||
    filters.recurrence !== 'ALL' ||
    filters.playlistId !== 'ALL' ||
    filters.displayId !== 'ALL';

  return (
    <div className="bg-[#0B132B]/90 border border-[#1E293B] rounded-xl p-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Search & Filters */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        {/* Search input */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar programação, playlist, código ou tag..."
            value={filters.search || ''}
            onChange={(e) => onUpdateFilters({ search: e.target.value })}
            className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Status Dropdown */}
        <div className="min-w-[140px]">
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onUpdateFilters({ status: e.target.value as ScheduleStatus | 'ALL' })}
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Status: Todos</option>
            <option value="ACTIVE">{SCHEDULE_STATUS_LABELS.ACTIVE}</option>
            <option value="SCHEDULED">{SCHEDULE_STATUS_LABELS.SCHEDULED}</option>
            <option value="PAUSED">{SCHEDULE_STATUS_LABELS.PAUSED}</option>
            <option value="EXPIRED">{SCHEDULE_STATUS_LABELS.EXPIRED}</option>
            <option value="DRAFT">{SCHEDULE_STATUS_LABELS.DRAFT}</option>
          </select>
        </div>

        {/* Priority Dropdown */}
        <div className="min-w-[140px]">
          <select
            value={filters.priority || 'ALL'}
            onChange={(e) =>
              onUpdateFilters({ priority: e.target.value as SchedulePriority | 'ALL' })
            }
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Prioridade: Todas</option>
            <option value="URGENT">🔴 {SCHEDULE_PRIORITY_LABELS.URGENT}</option>
            <option value="HIGH">🟡 {SCHEDULE_PRIORITY_LABELS.HIGH}</option>
            <option value="NORMAL">🔵 {SCHEDULE_PRIORITY_LABELS.NORMAL}</option>
            <option value="LOW">⚪ {SCHEDULE_PRIORITY_LABELS.LOW}</option>
          </select>
        </div>

        {/* Recurrence Dropdown */}
        <div className="min-w-[140px]">
          <select
            value={filters.recurrence || 'ALL'}
            onChange={(e) =>
              onUpdateFilters({ recurrence: e.target.value as ScheduleRecurrence | 'ALL' })
            }
            className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            <option value="ALL">Recorrência: Todas</option>
            <option value="WEEKLY">{SCHEDULE_RECURRENCE_LABELS.WEEKLY}</option>
            <option value="DAILY">{SCHEDULE_RECURRENCE_LABELS.DAILY}</option>
            <option value="ONCE">{SCHEDULE_RECURRENCE_LABELS.ONCE}</option>
            <option value="CUSTOM">{SCHEDULE_RECURRENCE_LABELS.CUSTOM}</option>
          </select>
        </div>

        {/* Reset Filter button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Limpar filtros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        )}
      </div>

      {/* View Switcher: List vs Calendar */}
      <div className="flex items-center bg-[#0F172A] p-1 border border-[#1E293B] rounded-lg self-start md:self-auto">
        <button
          type="button"
          onClick={() => onChangeViewMode('LIST')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'LIST'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          <span>Lista</span>
        </button>
        <button
          type="button"
          onClick={() => onChangeViewMode('CALENDAR')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            viewMode === 'CALENDAR'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Calendário</span>
        </button>
      </div>
    </div>
  );
};
