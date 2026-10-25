import React, { useState } from 'react';
import { AlertTriangle, ChevronRight, ShieldAlert, Layers } from 'lucide-react';
import { ScheduleConflict } from '../../../types/domain';
import { SCHEDULE_PRIORITY_CONFIG } from '../constants/schedulingConstants';

export interface ScheduleConflictBannerProps {
  conflicts: ScheduleConflict[];
  currentScheduleName?: string;
  onResolveClick?: (conflict: ScheduleConflict) => void;
}

export const ScheduleConflictBanner: React.FC<ScheduleConflictBannerProps> = ({
  conflicts,
  currentScheduleName,
  onResolveClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  if (!conflicts || conflicts.length === 0) return null;

  const count = conflicts.length;

  return (
    <div className="bg-amber-950/30 border border-amber-500/50 rounded-xl p-4 shadow-lg shadow-amber-950/20">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <span>{count === 1 ? 'Conflito de Grade Detectado' : `${count} Conflitos de Grade Detectados`}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Atenção Operacional
              </span>
            </h4>
            <p className="text-xs text-amber-200/80 mt-1 max-w-2xl">
              {count === 1
                ? 'Esta programação compartilha displays e horários idênticos com outra regra ativa.'
                : 'Foram detectadas sobreposições de displays e horários com outras programações ativas no sistema.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-medium text-amber-400 hover:text-amber-200 underline cursor-pointer shrink-0"
        >
          {expanded ? 'Ocultar Detalhes' : 'Ver Detalhes'}
        </button>
      </div>

      {/* Expanded Conflict Breakdown */}
      {expanded && (
        <div className="mt-4 space-y-3 pt-3 border-t border-amber-500/20">
          {conflicts.map((conflict, idx) => {
            const priorityConfig = SCHEDULE_PRIORITY_CONFIG[conflict.conflictingSchedulePriority];

            return (
              <div
                key={idx}
                className="bg-[#0B132B] border border-amber-500/30 rounded-lg p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white">
                      {conflict.conflictingScheduleName}
                    </span>
                    <span className="text-xs text-slate-400">({conflict.conflictingScheduleCode})</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${priorityConfig.chipBg}`}
                    >
                      Prioridade: {priorityConfig.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{conflict.message}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span>
                      <strong className="text-slate-200">Horário Colidindo:</strong>{' '}
                      {conflict.timeRangeB}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-200">Displays Afetados:</strong>{' '}
                      {conflict.overlappingDisplayIds.length}
                    </span>
                  </div>
                </div>

                {onResolveClick && (
                  <button
                    type="button"
                    onClick={() => onResolveClick(conflict)}
                    className="self-start md:self-center px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-medium text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>Inspecionar</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
