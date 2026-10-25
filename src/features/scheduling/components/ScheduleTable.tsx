import React from 'react';
import {
  MoreVertical,
  Play,
  Pause,
  Copy,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  Monitor,
  Clock,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Schedule, ScheduleConflict, ScheduleStatus } from '../../../types/domain';
import { Badge } from '../../../components/ui/Badge';
import {
  SCHEDULE_PRIORITY_CONFIG,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_VARIANTS,
  DAY_SHORT_LABELS,
} from '../constants/schedulingConstants';
import { formatDaysSummary } from '../services/scheduleRecurrenceService';

export interface ScheduleTableProps {
  schedules: Schedule[];
  conflictMap: Map<string, ScheduleConflict[]>;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onViewDetail: (schedule: Schedule) => void;
  onEdit: (schedule: Schedule) => void;
  onDuplicate: (schedule: Schedule) => void;
  onToggleStatus: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
  onShowConflict: (schedule: Schedule, conflicts: ScheduleConflict[]) => void;
}

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
  schedules,
  conflictMap,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onViewDetail,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  onShowConflict,
}) => {
  const allSelected = schedules.length > 0 && selectedIds.length === schedules.length;

  if (schedules.length === 0) {
    return (
      <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Calendar className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-white">Nenhuma programação encontrada</h4>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Tente ajustar os filtros de busca ou crie uma nova regra de agendamento de playlist.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl overflow-hidden shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[#1E293B] bg-[#070B14]/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4 w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded bg-[#0F172A] border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                />
              </th>
              <th className="py-3.5 px-4">Programação</th>
              <th className="py-3.5 px-4">Playlist</th>
              <th className="py-3.5 px-4">Displays</th>
              <th className="py-3.5 px-4">Horário & Dias</th>
              <th className="py-3.5 px-4">Vigência</th>
              <th className="py-3.5 px-4">Prioridade</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]/70">
            {schedules.map((schedule) => {
              const isSelected = selectedIds.includes(schedule.id);
              const conflicts = conflictMap.get(schedule.id) || [];
              const hasConflict = conflicts.length > 0;
              const priorityConfig = SCHEDULE_PRIORITY_CONFIG[schedule.priority];
              const daysSummary = formatDaysSummary(schedule.daysOfWeek);

              return (
                <tr
                  key={schedule.id}
                  className={`hover:bg-[#0F172A]/70 transition-colors group ${
                    isSelected ? 'bg-blue-950/20' : ''
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="py-3.5 px-4">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(schedule.id)}
                      className="rounded bg-[#0F172A] border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </td>

                  {/* Name & Code */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onViewDetail(schedule)}
                          className="font-semibold text-white hover:text-blue-400 text-sm text-left transition-colors cursor-pointer"
                        >
                          {schedule.name}
                        </button>
                        {hasConflict && (
                          <button
                            type="button"
                            onClick={() => onShowConflict(schedule, conflicts)}
                            title="Conflito detectado com outra regra de grade"
                            className="text-amber-400 hover:text-amber-300 p-0.5 rounded cursor-pointer"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          {schedule.code}
                        </span>
                        {schedule.tags && schedule.tags.length > 0 && (
                          <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800/80">
                            {schedule.tags[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Playlist */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 shrink-0">
                        <Layers className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-medium text-slate-200 truncate max-w-[140px]">
                        {schedule.playlistName}
                      </span>
                    </div>
                  </td>

                  {/* Displays */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0F172A] border border-[#1E293B] text-xs font-medium text-cyan-300">
                        <Monitor className="w-3 h-3 text-cyan-400" />
                        <span>{schedule.displayCount || schedule.displayIds?.length || 0} telas</span>
                      </span>
                    </div>
                  </td>

                  {/* Time & Days */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span>
                          {schedule.startTime} — {schedule.endTime}
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">{daysSummary}</span>
                    </div>
                  </td>

                  {/* Date Range */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col text-xs text-slate-300">
                      <span>{schedule.startDate}</span>
                      <span className="text-[11px] text-slate-400">até {schedule.endDate}</span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border ${priorityConfig.chipBg} ${priorityConfig.borderColor}`}
                    >
                      <span>{priorityConfig.label}</span>
                    </span>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-1">
                      <Badge variant={SCHEDULE_STATUS_VARIANTS[schedule.status]} size="sm">
                        {SCHEDULE_STATUS_LABELS[schedule.status]}
                      </Badge>
                      {hasConflict && (
                        <span className="text-[10px] text-amber-400 font-medium">
                          {conflicts.length} conflito(s)
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onViewDetail(schedule)}
                        title="Ver Detalhes"
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(schedule)}
                        title="Editar Programação"
                        className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(schedule)}
                        title={schedule.status === 'ACTIVE' ? 'Pausar Programação' : 'Ativar Programação'}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        {schedule.status === 'ACTIVE' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => onDuplicate(schedule)}
                        title="Duplicar Programação"
                        className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(schedule)}
                        title="Excluir Programação"
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
