import React from 'react';
import { Search, Filter } from 'lucide-react';
import {
  SubscriptionFilters,
  SubscriptionStatus,
  SubscriptionCommercialModel,
  BillingInterval,
} from '../../../types/saas';

interface SubscriptionFiltersBarProps {
  filters: SubscriptionFilters;
  onChange: (filters: SubscriptionFilters) => void;
}

export const SubscriptionFiltersBar: React.FC<SubscriptionFiltersBarProps> = ({
  filters,
  onChange,
}) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 mb-6 flex flex-col lg:flex-row items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Pesquisar por organização, código, plano ou ID de subscrição..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) =>
              onChange({ ...filters, status: e.target.value as SubscriptionStatus | 'ALL' })
            }
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todos os Status</option>
            <option value="ACTIVE" className="bg-slate-900 text-emerald-400">Ativa</option>
            <option value="TRIAL" className="bg-slate-900 text-amber-400">Trial</option>
            <option value="PAST_DUE" className="bg-slate-900 text-orange-400">Past Due</option>
            <option value="SUSPENDED" className="bg-slate-900 text-rose-400">Suspensa</option>
            <option value="CANCELLED" className="bg-slate-900 text-slate-400">Cancelada</option>
            <option value="EXPIRED" className="bg-slate-900 text-neutral-400">Expirada</option>
          </select>
        </div>

        {/* Commercial Model Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <span className="text-slate-500 font-medium">Modelo:</span>
          <select
            value={filters.commercialModel || 'ALL'}
            onChange={(e) =>
              onChange({
                ...filters,
                commercialModel: e.target.value as SubscriptionCommercialModel | 'ALL',
              })
            }
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todos os Modelos</option>
            <option value="RENTAL_SAAS" className="bg-slate-900 text-white">Aluguel + SaaS</option>
            <option value="SALE_SAAS" className="bg-slate-900 text-white">Venda + SaaS</option>
            <option value="SUBSCRIPTION_ONLY" className="bg-slate-900 text-white">BYOD / SaaS Only</option>
          </select>
        </div>

        {/* Interval Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <span className="text-slate-500 font-medium">Ciclo:</span>
          <select
            value={filters.billingInterval || 'ALL'}
            onChange={(e) =>
              onChange({
                ...filters,
                billingInterval: e.target.value as BillingInterval | 'ALL',
              })
            }
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todos os Ciclos</option>
            <option value="MONTHLY" className="bg-slate-900 text-white">Mensal</option>
            <option value="QUARTERLY" className="bg-slate-900 text-white">Trimestral</option>
            <option value="YEARLY" className="bg-slate-900 text-white">Anual</option>
          </select>
        </div>
      </div>
    </div>
  );
};
