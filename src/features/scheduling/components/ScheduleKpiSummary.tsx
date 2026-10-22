import React from 'react';
import { CalendarClock, AlertTriangle, Monitor, CheckCircle2, PauseCircle } from 'lucide-react';
import { ScheduleKPIs } from '../../../types/domain';

export interface ScheduleKpiSummaryProps {
  kpis: ScheduleKPIs;
  onFilterConflict?: () => void;
  onFilterActive?: () => void;
  onFilterScheduled?: () => void;
}

export const ScheduleKpiSummary: React.FC<ScheduleKpiSummaryProps> = ({
  kpis,
  onFilterConflict,
  onFilterActive,
  onFilterScheduled,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* 1. Ativas */}
      <div
        onClick={onFilterActive}
        className="bg-[#0B132B]/80 border border-[#1E293B] hover:border-emerald-500/50 rounded-xl p-4 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Ativas Agora</span>
          <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{kpis.active}</span>
          <span className="text-xs text-slate-400">de {kpis.total} totais</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Em veiculação</span>
        </div>
      </div>

      {/* 2. Agendadas */}
      <div
        onClick={onFilterScheduled}
        className="bg-[#0B132B]/80 border border-[#1E293B] hover:border-blue-500/50 rounded-xl p-4 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Programadas</span>
          <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:scale-105 transition-transform">
            <CalendarClock className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">{kpis.scheduled}</span>
          <span className="text-xs text-slate-400">no calendário</span>
        </div>
        <div className="mt-2 text-xs text-blue-400">Início futuro programado</div>
      </div>

      {/* 3. Conflitos Detectados */}
      <div
        onClick={onFilterConflict}
        className={`border rounded-xl p-4 transition-all cursor-pointer group ${
          kpis.conflicts > 0
            ? 'bg-amber-950/20 border-amber-600/40 hover:border-amber-500 shadow-lg shadow-amber-950/10'
            : 'bg-[#0B132B]/80 border-[#1E293B] hover:border-slate-600'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Conflitos de Grade</span>
          <span
            className={`p-2 rounded-lg ${
              kpis.conflicts > 0
                ? 'bg-amber-500/20 text-amber-400 group-hover:scale-105'
                : 'bg-slate-800 text-slate-400'
            } transition-transform`}
          >
            <AlertTriangle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span
            className={`text-2xl font-bold tracking-tight ${
              kpis.conflicts > 0 ? 'text-amber-400' : 'text-white'
            }`}
          >
            {kpis.conflicts}
          </span>
          <span className="text-xs text-slate-400">detectados</span>
        </div>
        <div className="mt-2 text-xs text-amber-400 font-medium">
          {kpis.conflicts > 0 ? 'Requer atenção operacional' : 'Grade sem sobreposições'}
        </div>
      </div>

      {/* 4. Displays Programados */}
      <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Displays Cobertos</span>
          <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Monitor className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {kpis.programmedDisplaysCount}
          </span>
          <span className="text-xs text-slate-400">telas ativas</span>
        </div>
        <div className="mt-2 text-xs text-cyan-400">Com programação válida</div>
      </div>

      {/* 5. Pausadas / Expiradas */}
      <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Pausadas / Expiradas</span>
          <span className="p-2 rounded-lg bg-slate-800 text-slate-400">
            <PauseCircle className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-slate-300 tracking-tight">
            {kpis.paused + kpis.expired}
          </span>
          <span className="text-xs text-slate-400">
            ({kpis.paused} p / {kpis.expired} exp)
          </span>
        </div>
        <div className="mt-2 text-xs text-slate-400">Fora de circulação</div>
      </div>
    </div>
  );
};
