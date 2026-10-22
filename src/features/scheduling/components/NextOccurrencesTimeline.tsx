import React from 'react';
import { Calendar, Clock, Globe, PlayCircle, CheckCircle2 } from 'lucide-react';
import { ScheduleOccurrence } from '../services/scheduleRecurrenceService';

export interface NextOccurrencesTimelineProps {
  occurrences: ScheduleOccurrence[];
  timezone?: string;
  isPaused?: boolean;
}

export const NextOccurrencesTimeline: React.FC<NextOccurrencesTimelineProps> = ({
  occurrences,
  timezone = 'Africa/Luanda',
  isPaused = false,
}) => {
  if (isPaused) {
    return (
      <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400 mb-2">
          <Clock className="w-5 h-5" />
        </div>
        <h5 className="text-sm font-semibold text-slate-300">Programação Pausada</h5>
        <p className="text-xs text-slate-400 mt-1">
          Nenhuma execução programada enquanto o status estiver como Pausado ou Rascunho.
        </p>
      </div>
    );
  }

  if (!occurrences || occurrences.length === 0) {
    return (
      <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 text-center">
        <p className="text-xs text-slate-400">
          Nenhuma ocorrência futura encontrada dentro da janela de validade da programação.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Próximas Execuções</span>
        </h4>
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Globe className="w-3 h-3 text-cyan-400" />
          <span>{timezone} (WAT)</span>
        </span>
      </div>

      <div className="space-y-2">
        {occurrences.map((item, index) => {
          const isNow = item.status === 'NOW';

          return (
            <div
              key={item.id || index}
              className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                isNow
                  ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm shadow-emerald-950/20'
                  : item.isToday
                  ? 'bg-blue-950/20 border-blue-600/40'
                  : 'bg-[#0F172A] border-[#1E293B]'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Visual Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isNow
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : item.isToday
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isNow ? (
                    <PlayCircle className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{item.formattedDate}</span>
                    <span className="text-[11px] text-slate-400">({item.dayLabel})</span>
                    {item.isToday && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        Hoje
                      </span>
                    )}
                    {item.isTomorrow && (
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        Amanhã
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Janela:{' '}
                    <strong className="text-slate-200">
                      {item.startTime} — {item.endTime}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Status pill */}
              <div>
                {isNow ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Ao Vivo</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Agendado</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
