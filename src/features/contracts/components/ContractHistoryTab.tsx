import React from 'react';
import { ContractEvent, ContractEventType } from '../../../types/contracts';
import { formatContractDate } from '../utils/contractFormatters';
import {
  History,
  FileCheck,
  FilePlus,
  Edit,
  Send,
  PenTool,
  CheckCircle,
  XCircle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ContractHistoryTabProps {
  events: ContractEvent[];
}

export const ContractHistoryTab: React.FC<ContractHistoryTabProps> = ({ events }) => {
  const getEventIcon = (type: ContractEventType) => {
    const props = { className: 'w-4 h-4' };
    switch (type) {
      case 'CREATED':
        return <FilePlus {...props} className="text-cyan-400" />;
      case 'SUBMITTED':
        return <Send {...props} className="text-purple-400" />;
      case 'APPROVED':
        return <FileCheck {...props} className="text-blue-400" />;
      case 'SIGNATURE_REQUESTED':
        return <PenTool {...props} className="text-amber-400" />;
      case 'SIGNED':
        return <CheckCircle {...props} className="text-emerald-400" />;
      case 'ACTIVATED':
        return <Sparkles {...props} className="text-emerald-400" />;
      case 'CANCELLED':
        return <XCircle {...props} className="text-red-400" />;
      case 'EXPIRED':
        return <AlertCircle {...props} className="text-orange-400" />;
      case 'UPDATED':
      default:
        return <Edit {...props} className="text-slate-400" />;
    }
  };

  const getEventBadge = (type: ContractEventType) => {
    switch (type) {
      case 'CREATED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'SUBMITTED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'APPROVED':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'SIGNATURE_REQUESTED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'SIGNED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'ACTIVATED':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'EXPIRED':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="bg-[#121620] border border-slate-800 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">
        <History className="w-4 h-4 text-cyan-400" />
        Linha do Tempo & Histórico de Auditoria do Contrato
      </h3>

      {events.length === 0 ? (
        <p className="text-slate-400 text-xs text-center py-6">
          Nenhum evento histórico registrado.
        </p>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {events.map((event) => (
            <div key={event.id} className="relative group">
              {/* Dot Icon on Timeline */}
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center">
                {getEventIcon(event.eventType)}
              </div>

              {/* Event Content Box */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 hover:border-slate-700/80 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${getEventBadge(
                        event.eventType
                      )}`}
                    >
                      {event.eventType}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {event.actorName}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatContractDate(event.timestamp, true)}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {event.description}
                </p>

                {event.metadata && (
                  <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
                    {JSON.stringify(event.metadata)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
