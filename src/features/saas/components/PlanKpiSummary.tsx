import React from 'react';
import { Layers, CheckCircle2, Users, DollarSign, Info } from 'lucide-react';
import { PlanKPIs } from '../../../types/saas';
import { formatKz } from '../utils/saasFormatters';

interface PlanKpiSummaryProps {
  kpis: PlanKPIs | null;
}

export const PlanKpiSummary: React.FC<PlanKpiSummaryProps> = ({ kpis }) => {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Plans */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <Layers className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">Total de Planos</p>
          <h4 className="text-2xl font-bold text-white mt-0.5">{kpis.totalPlans}</h4>
          <span className="text-[11px] text-slate-500">
            {kpis.draftPlans > 0 ? `${kpis.draftPlans} em rascunho` : 'Catálogo comercial'}
          </span>
        </div>
      </div>

      {/* Active Plans */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">Planos Ativos</p>
          <h4 className="text-2xl font-bold text-white mt-0.5">{kpis.activePlans}</h4>
          <span className="text-[11px] text-emerald-400">Disponíveis para venda</span>
        </div>
      </div>

      {/* Subscribed Clients */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
          <Users className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400">Organizações Subscritas</p>
          <h4 className="text-2xl font-bold text-white mt-0.5">{kpis.totalSubscribedClients}</h4>
          <span className="text-[11px] text-cyan-400">Contratos SaaS ativos</span>
        </div>
      </div>

      {/* Estimated MRR */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
          <DollarSign className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-slate-400">MRR Recorrente</p>
            <span className="text-[10px] bg-violet-500/20 text-violet-300 px-1.5 py-0.2 rounded font-medium">
              Estimativa
            </span>
          </div>
          <h4 className="text-xl font-bold text-white mt-0.5 truncate">
            {formatKz(kpis.estimatedMRRKz)}
          </h4>
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-500" />
            Base contratual mensal
          </span>
        </div>
      </div>
    </div>
  );
};
