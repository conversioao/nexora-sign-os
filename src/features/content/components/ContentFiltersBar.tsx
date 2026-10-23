import React from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  RotateCcw,
  Folder,
  Plus,
  Trash2,
  ArrowUpDown,
  X,
  Tag,
} from 'lucide-react';
import {
  ContentMediaType,
  ContentStatus,
  ContentOrientation,
  ContentFolder,
} from '../../../types/domain';
import { ContentFilters } from '../../../repositories/types';
import { ContentSortField, SortOrder, ViewMode } from '../hooks/useContent';
import { Button } from '../../../components/ui/Button';

interface ContentFiltersBarProps {
  filters: ContentFilters;
  folders: ContentFolder[];
  viewMode: ViewMode;
  sortField: ContentSortField;
  sortOrder: SortOrder;
  totalFilteredCount: number;
  onFilterChange: (key: keyof ContentFilters, value: any) => void;
  onResetFilters: () => void;
  onViewModeChange: (mode: ViewMode) => void;
  onSortChange: (field: ContentSortField) => void;
  onCreateFolder?: () => void;
  onDeleteFolder?: (folderSlug: string, folderName: string) => void;
}

export const ContentFiltersBar: React.FC<ContentFiltersBarProps> = ({
  filters,
  folders,
  viewMode,
  sortField,
  sortOrder,
  totalFilteredCount,
  onFilterChange,
  onResetFilters,
  onViewModeChange,
  onSortChange,
  onCreateFolder,
  onDeleteFolder,
}) => {
  const isFiltered =
    !!filters.search ||
    filters.type !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.orientation !== 'ALL' ||
    (filters.folderId && filters.folderId !== 'fld-all' && filters.folderId !== 'ALL') ||
    (filters.tag && filters.tag !== 'ALL');

  return (
    <div className="space-y-3.5 mb-6">
      {/* Folder Navigation Pills */}
      {folders.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {folders.map((folder) => {
            const isSelected =
              (folder.id === 'fld-all' && (!filters.folderId || filters.folderId === 'fld-all' || filters.folderId === 'ALL')) ||
              filters.folderId === folder.id;

            const isCustomFolder = folder.id !== 'fld-all' && !['fld-campanhas', 'fld-institucional', 'fld-varejo', 'fld-eventos'].includes(folder.id);

            return (
              <div
                key={folder.id}
                className={`group inline-flex items-center rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-blue-600/15 border-blue-500/40 text-blue-400 font-semibold shadow-sm'
                    : 'bg-[#0B1120]/70 border-white/10 text-slate-400 hover:text-white hover:border-white/20 hover:bg-white/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onFilterChange('folderId', folder.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5"
                >
                  <Folder
                    className="w-3.5 h-3.5"
                    style={{ color: isSelected ? '#60A5FA' : folder.color || '#94A3B8' }}
                  />
                  <span>{folder.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isSelected ? 'bg-blue-500/30 text-blue-300' : 'bg-white/5 text-slate-400'
                    }`}
                  >
                    {folder.itemCount}
                  </span>
                </button>

                {isCustomFolder && onDeleteFolder && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFolder(folder.slug, folder.name);
                    }}
                    title="Excluir Pasta do Storage"
                    className="p-1.5 pr-2 text-slate-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {onCreateFolder && (
            <button
              type="button"
              onClick={onCreateFolder}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>Nova Pasta</span>
            </button>
          )}
        </div>
      )}

      {/* Main Filter & Search Control Bar */}
      <div className="p-3 bg-[#0B1120]/90 border border-white/10 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange('search', e.target.value)}
            placeholder="Pesquisar por título, código (NEX-CNT), tag, cliente ou autor..."
            className="w-full bg-[#030712] border border-white/10 rounded-lg pl-9 pr-8 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 transition-colors"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Middle: Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo de Mídia */}
          <select
            value={filters.type || 'ALL'}
            onChange={(e) => onFilterChange('type', e.target.value as ContentMediaType | 'ALL')}
            className="bg-[#030712] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
          >
            <option value="ALL">Todos os Formatos</option>
            <option value="VIDEO">Vídeo (MP4/HEVC)</option>
            <option value="IMAGE">Imagem (PNG/JPG)</option>
            <option value="PDF">Documento (PDF)</option>
            <option value="HTML">Web / HTML5</option>
            <option value="WIDGET">Widgets</option>
          </select>

          {/* Status */}
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange('status', e.target.value as ContentStatus | 'ALL')}
            className="bg-[#030712] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativo na Rede</option>
            <option value="READY">Pronto</option>
            <option value="SCHEDULED">Programado</option>
            <option value="PROCESSING">Processando</option>
            <option value="DRAFT">Rascunho</option>
            <option value="ARCHIVED">Arquivado</option>
            <option value="ERROR">Com Erro</option>
          </select>

          {/* Orientação */}
          <select
            value={filters.orientation || 'ALL'}
            onChange={(e) =>
              onFilterChange('orientation', e.target.value as ContentOrientation | 'ALL')
            }
            className="bg-[#030712] border border-white/10 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
          >
            <option value="ALL">Todas as Orientações</option>
            <option value="LANDSCAPE">Horizontal (16:9)</option>
            <option value="PORTRAIT">Vertical (9:16)</option>
            <option value="SQUARE">Quadrado (1:1)</option>
          </select>

          {/* Ordenação */}
          <div className="relative">
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                onSortChange(field as ContentSortField);
              }}
              className="bg-[#030712] border border-white/10 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500/60 transition-colors cursor-pointer"
            >
              <option value="createdAt-desc">Mais Recentes</option>
              <option value="createdAt-asc">Mais Antigos</option>
              <option value="name-asc">Nome (A - Z)</option>
              <option value="name-desc">Nome (Z - A)</option>
              <option value="fileSize-desc">Maior Tamanho</option>
              <option value="duration-desc">Maior Duração</option>
              <option value="usage-desc">Mais Utilizados</option>
            </select>
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
              title="Limpar todos os filtros"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">Limpar</span>
            </button>
          )}
        </div>

        {/* Right: View Mode Toggle & Result Count */}
        <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
          <span className="text-xs text-slate-400 whitespace-nowrap font-mono">
            <strong className="text-white">{totalFilteredCount}</strong> mídias
          </span>

          <div className="flex items-center bg-[#030712] border border-white/10 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Grade"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Visualização em Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
