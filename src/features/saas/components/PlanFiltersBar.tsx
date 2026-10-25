import React from 'react';
import { Search, Filter } from 'lucide-react';
import { PlanFilters, PlanStatus, BillingInterval } from '../../../types/saas';

interface PlanFiltersBarProps {
  filters: PlanFilters;
  onChange: (filters: PlanFilters) => void;
}

export const PlanFiltersBar: React.FC<PlanFiltersBarProps> = ({ filters, onChange }) => {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 mb-6 flex flex-col md:flex-row items-center gap-3">
      {/* Search Bar */}
      <div className="relative flex-1 w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Pesquisar por nome, código ou descrição do plano..."
          value={filters.search || ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
        />
      </div>

      <div className="flex items-center gap-2.5 w-full md:w-auto">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-500 font-medium">Status:</span>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onChange({ ...filters, status: e.target.value as PlanStatus | 'ALL' })}
            className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="bg-slate-900 text-white">Todos os Status</option>
            <option value="ACTIVE" className="bg-slate-900 text-emerald-400">Ativos</option>
            <option value="DRAFT" className="bg-slate-900 text-amber-400">Rascunho</option>
            <option value="ARCHIVED" className="bg-slate-900 text-slate-400">Arquivados</option>
          </select>
        </div>

        {/* Interval Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
          <span className="text-slate-500 font-medium">Ciclo:</span>
          <select
            value={filters.billingInterval || 'ALL'}
            onChange={(e) =>
              onChange({ ...filters, billingInterval: e.target.value as BillingInterval | 'ALL' })
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
