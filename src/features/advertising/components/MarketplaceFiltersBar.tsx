import React from 'react';
import { MarketplaceFilterState } from '../../../types/advertising';
import {
  Search,
  Filter,
  SlidersHorizontal,
  MapPin,
  Building,
  RotateCcw,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export interface MarketplaceFiltersBarProps {
  filters: MarketplaceFilterState;
  onFilterChange: (newFilters: Partial<MarketplaceFilterState>) => void;
  onResetFilters: () => void;
  totalResultsCount: number;
}

export const MarketplaceFiltersBar: React.FC<MarketplaceFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  totalResultsCount,
}) => {
  const municipalities = [
    { value: 'ALL', label: 'Todos os Municípios' },
    { value: 'Talatona', label: 'Talatona' },
    { value: 'Maianga', label: 'Maianga' },
    { value: 'Ingombota', label: 'Ingombota / Centro' },
    { value: 'Mutamba', label: 'Mutamba' },
    { value: 'Belas', label: 'Belas' },
    { value: 'Kilamba', label: 'Kilamba' },
    { value: 'Viana', label: 'Viana' },
  ];

  const venueTypes = [
    { value: 'ALL', label: 'Todos os Espaços' },
    { value: 'SHOPPING_CENTER', label: 'Shoppings' },
    { value: 'CORPORATE', label: 'Corporativo / Bancos' },
    { value: 'HOTEL', label: 'Hotéis 5 Estrelas' },
    { value: 'TRANSPORT', label: 'Aeroporto & Transportes' },
    { value: 'STREET_TOTEM', label: 'Totens Urbanos' },
    { value: 'RETAIL_STORE', label: 'Hipermercados & Varejo' },
  ];

  return (
    <div
      id="marketplace-filters-container"
      className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-[#0F172A]/90 p-4 backdrop-blur-md"
    >
      {/* Top Search and Sort Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Field */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por nome do shopping, edifício, bairro ou tag..."
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-9 pr-4 py-2 text-sm text-white placeholder-slate-400 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFilterChange({ searchQuery: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right side Sort & Reset */}
        <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-3 text-xs">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 hidden sm:inline">Ordenar:</span>
            <select
              value={filters.sortBy || 'POPULARITY'}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-[#0284C7] focus:outline-none"
            >
              <option value="POPULARITY">Recomendados / Destaques</option>
              <option value="REACH_DESC">Maior Alcance Diário</option>
              <option value="PRICE_ASC">Menor Preço Diário</option>
              <option value="PRICE_DESC">Maior Preço Diário</option>
              <option value="NAME">Ordem Alfabética</option>
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Limpar Filtros
          </Button>
        </div>
      </div>

      {/* Filter Chips / Dropdowns Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
        {/* Municipality Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Município de Luanda
          </label>
          <select
            value={filters.municipality || 'ALL'}
            onChange={(e) => onFilterChange({ municipality: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-[#0284C7] focus:outline-none"
          >
            {municipalities.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Venue Type Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Tipo de Estabelecimento
          </label>
          <select
            value={filters.venueType || 'ALL'}
            onChange={(e) => onFilterChange({ venueType: e.target.value as any })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-[#0284C7] focus:outline-none"
          >
            {venueTypes.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </div>

        {/* Orientation Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Orientação do Display
          </label>
          <select
            value={filters.orientation || 'ALL'}
            onChange={(e) => onFilterChange({ orientation: e.target.value as any })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-[#0284C7] focus:outline-none"
          >
            <option value="ALL">Todas as Orientações</option>
            <option value="LANDSCAPE">Horizontal (Landscape 16:9)</option>
            <option value="PORTRAIT">Vertical (Portrait 9:16)</option>
          </select>
        </div>

        {/* Availability Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase tracking-wider">
            Disponibilidade de Slots
          </label>
          <select
            value={filters.availability || 'ALL'}
            onChange={(e) => onFilterChange({ availability: e.target.value as any })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-[#0284C7] focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="AVAILABLE">Disponível Agora</option>
            <option value="LIMITED">Poucos Slots Restantes</option>
          </select>
        </div>
      </div>

      {/* Result Count Status Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
        <span>
          Exibindo <strong className="text-white font-bold">{totalResultsCount}</strong> pontos de mídia disponíveis para veiculação
        </span>
        <span className="text-[11px] text-[#38BDF8]">
          Preços em Kwanzas (Kz) com descontos progressivos por volume
        </span>
      </div>
    </div>
  );
};
