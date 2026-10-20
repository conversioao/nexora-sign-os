import React from 'react';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  RotateCcw,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  X
} from 'lucide-react';
import { PlaylistFilters } from '../../../repositories/types';
import { PlaylistSortField, SortOrder, ViewMode } from '../hooks/usePlaylists';
import { PlaylistStatus } from '../../../types/domain';

interface PlaylistFiltersBarProps {
  filters: PlaylistFilters;
  viewMode: ViewMode;
  sortField: PlaylistSortField;
  sortOrder: SortOrder;
  totalCount: number;
  onUpdateFilter: (key: keyof PlaylistFilters, value: any) => void;
  onResetFilters: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSortFieldChange: (field: PlaylistSortField) => void;
  onToggleSortOrder: () => void;
}

export const PlaylistFiltersBar: React.FC<PlaylistFiltersBarProps> = ({
  filters,
  viewMode,
  sortField,
  sortOrder,
  totalCount,
  onUpdateFilter,
  onResetFilters,
  onViewModeChange,
  onSortFieldChange,
  onToggleSortOrder,
}) => {
  const statusTabs: { id: PlaylistStatus | 'ALL'; label: string }[] = [
    { id: 'ALL', label: 'Todas' },
    { id: 'ACTIVE', label: 'Ativas' },
    { id: 'PAUSED', label: 'Pausadas' },
    { id: 'SCHEDULED', label: 'Agendadas' },
    { id: 'DRAFT', label: 'Rascunhos' },
    { id: 'ARCHIVED', label: 'Arquivadas' },
  ];

  const hasActiveFilters = Boolean(
    filters.search || (filters.status && filters.status !== 'ALL') || (filters.tag && filters.tag !== 'ALL')
  );

  return (
    <div className="bg-[#0B1120] border border-white/5 rounded-xl p-3.5 mb-6 space-y-3">
      {/* Top row: Search, Sort, View mode */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onUpdateFilter('search', e.target.value)}
            placeholder="Pesquisar por nome, descrição, tags ou autor..."
            className="w-full h-9 pl-9 pr-8 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]/40 transition-all"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onUpdateFilter('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-white/10 rounded-lg px-2.5 h-9">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#64748B]" />
            <select
              value={sortField}
              onChange={(e) => onSortFieldChange(e.target.value as PlaylistSortField)}
              className="bg-transparent text-xs text-[#94A3B8] focus:outline-none cursor-pointer pr-1"
            >
              <option value="updatedAt" className="bg-[#0B1120] text-[#F8FAFC]">
                Última Atualização
              </option>
              <option value="name" className="bg-[#0B1120] text-[#F8FAFC]">
                Nome (A-Z)
              </option>
              <option value="totalDuration" className="bg-[#0B1120] text-[#F8FAFC]">
                Duração Total
              </option>
              <option value="itemCount" className="bg-[#0B1120] text-[#F8FAFC]">
                Qtd. de Mídias
              </option>
              <option value="displayCount" className="bg-[#0B1120] text-[#F8FAFC]">
                Displays Vinculados
              </option>
            </select>

            {/* Asc/Desc toggle */}
            <button
              type="button"
              onClick={onToggleSortOrder}
              title={sortOrder === 'asc' ? 'Ordem Crescente' : 'Ordem Decrescente'}
              className="p-1 text-[#94A3B8] hover:text-white rounded hover:bg-white/5"
            >
              {sortOrder === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-[#38BDF8]" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-[#38BDF8]" />
              )}
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-[#070B14] border border-white/10 rounded-lg p-0.5 h-9">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              title="Visualização em Grade"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              title="Visualização em Tabela"
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-2.5 h-9 text-xs text-[#F43F5E] hover:bg-[#F43F5E]/10 border border-[#F43F5E]/30 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Status Pills & Total count */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5 overflow-x-auto nexora-scrollbar">
        <div className="flex items-center gap-1.5 flex-nowrap">
          {statusTabs.map((tab) => {
            const isSelected = (filters.status || 'ALL') === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onUpdateFilter('status', tab.id)}
                className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2563EB]/20 text-[#38BDF8] border border-[#2563EB]/50'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-[#64748B] font-mono whitespace-nowrap pl-2">
          {totalCount} {totalCount === 1 ? 'playlist' : 'playlists'}
        </span>
      </div>
    </div>
  );
};
