import React from 'react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  DollarSign,
  Tv,
  Info,
} from 'lucide-react';
import { SubscriptionKPIs } from '../../../types/saas';
import { formatKz } from '../utils/saasFormatters';

interface SubscriptionKpiSummaryProps {
  kpis: SubscriptionKPIs | null;
}

export const SubscriptionKpiSummary: React.FC<SubscriptionKpiSummaryProps> = ({ kpis }) => {
  if (!kpis) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Total */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs font-medium">Total Subscrições</span>
          <CreditCard className="w-4 h-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-white">{kpis.totalSubscriptions}</div>
        <span className="text-[10px] text-slate-500 mt-1">Organizações mapeadas</span>
      </div>

      {/* Ativas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-400 mb-1">
          <span className="text-xs font-medium">Ativas</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-white">{kpis.activeSubscriptions}</div>
        <span className="text-[10px] text-emerald-400/80 mt-1">Operacionais</span>
      </div>

      {/* Trial */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-400 mb-1">
          <span className="text-xs font-medium">Em Trial</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-2xl font-bold text-white">{kpis.trialSubscriptions}</div>
        <span className="text-[10px] text-amber-400/80 mt-1">Período de teste</span>
      </div>

      {/* Past Due / Alertas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-orange-400 mb-1">
          <span className="text-xs font-medium">Past Due / Alerta</span>
          <AlertTriangle className="w-4 h-4 text-orange-400" />
        </div>
        <div className="text-2xl font-bold text-white">
          {kpis.pastDueSubscriptions + kpis.suspendedSubscriptions}
        </div>
        <span className="text-[10px] text-orange-400/80 mt-1">
          {kpis.pastDueSubscriptions} past due, {kpis.suspendedSubscriptions} suspensas
        </span>
      </div>

      {/* Displays sob SaaS */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-cyan-400 mb-1">
          <span className="text-xs font-medium">Displays sob SaaS</span>
          <Tv className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="text-2xl font-bold text-white">{kpis.displaysCoveredBySaaS}</div>
        <span className="text-[10px] text-cyan-400/80 mt-1">Telas ativas na rede</span>
      </div>

      {/* MRR Estimado */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-violet-400 mb-1">
          <span className="text-xs font-medium">MRR Estimado</span>
          <DollarSign className="w-4 h-4 text-violet-400" />
        </div>
        <div className="text-lg font-bold text-white truncate" title={formatKz(kpis.estimatedMRRKz)}>
          {formatKz(kpis.estimatedMRRKz)}
        </div>
        <span className="text-[10px] text-violet-300/80 mt-1 flex items-center gap-0.5">
          <Info className="w-2.5 h-2.5" />
          Estimativa mensal
        </span>
      </div>
    </div>
  );
};
