import React, { useState } from 'react';
import {
  ListVideo,
  Plus,
  RefreshCw,
  Trash2,
  Copy,
  AlertTriangle,
  Layers,
  Sparkles
} from 'lucide-react';
import { usePlaylists } from '../hooks/usePlaylists';
import { PlaylistKpiSummary } from '../components/PlaylistKpiSummary';
import { PlaylistFiltersBar } from '../components/PlaylistFiltersBar';
import { PlaylistCard } from '../components/PlaylistCard';
import { PlaylistTable } from '../components/PlaylistTable';
import { NewPlaylistModal } from '../components/NewPlaylistModal';
import { PlaylistPreviewModal } from '../components/PlaylistPreviewModal';
import { PlaylistReportModal } from '../components/PlaylistReportModal';
import { Button } from '../../../components/ui/Button';
import { Playlist } from '../../../types/domain';
import { useToast } from '../../../components/ui/Toast';

interface PlaylistsListPageProps {
  onNavigateToBuilder: (playlistId: string) => void;
}

export const PlaylistsListPage: React.FC<PlaylistsListPageProps> = ({
  onNavigateToBuilder,
}) => {
  const { addToast } = useToast();
  const {
    playlists,
    sortedPlaylists,
    paginatedPlaylists,
    kpis,
    isLoading,
    isKpiLoading,
    error,
    filters,
    viewMode,
    sortField,
    sortOrder,
    selectedIds,
    currentPage,
    totalPages,
    totalFilteredCount,
    setViewMode,
    setSortField,
    setSortOrder,
    setCurrentPage,
    updateFilter,
    resetFilters,
    toggleSelection,
    selectAllCurrentPage,
    clearSelection,
    createPlaylist,
    duplicatePlaylist,
    deletePlaylists,
    updatePlaylistStatus,
    refresh,
  } = usePlaylists();

  // Modals
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [previewPlaylist, setPreviewPlaylist] = useState<Playlist | null>(null);
  const [reportPlaylist, setReportPlaylist] = useState<Playlist | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
  };

  const handleCreate = async (data: Partial<Playlist>) => {
    const created = await createPlaylist(data);
    onNavigateToBuilder(created.id);
    return created;
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const selectedList = playlists.filter((p) => selectedIds.has(p.id));
    const lockedCount = selectedList.filter((p) => p.isSystemLocked || p.displayId).length;
    if (lockedCount > 0) {
      addToast({
        title: 'Exclusão Bloqueada',
        description: `${lockedCount} das playlists selecionadas estão vinculadas permanentemente a displays e só podem ser excluídas ao remover o display correspondente.`,
        type: 'warning',
      });
      return;
    }

    if (
      window.confirm(
        `Tem certeza que deseja excluir ${selectedIds.size} playlist(s)? Esta ação não pode ser desfeita.`
      )
    ) {
      try {
        await deletePlaylists(Array.from(selectedIds));
        addToast({
          title: 'Playlists Excluídas',
          description: `${selectedIds.size} playlist(s) removida(s) com sucesso.`,
          type: 'success',
        });
      } catch (err: any) {
        addToast({
          title: 'Erro ao excluir',
          description: err?.message || 'Falha ao excluir playlist(s).',
          type: 'error',
        });
      }
    }
  };

  const handleDeleteSingle = async (id: string) => {
    const target = playlists.find((p) => p.id === id);
    if (target?.isSystemLocked || target?.displayId) {
      addToast({
        title: 'Playlist Protegida do Display',
        description: `A playlist "${target.name}" está vinculada ao display e não pode ser eliminada individualmente. Ela só é removida quando o display correspondente for excluído.`,
        type: 'warning',
      });
      return;
    }

    if (window.confirm('Tem certeza que deseja excluir esta playlist?')) {
      try {
        await deletePlaylists([id]);
        addToast({
          title: 'Playlist Excluída',
          description: 'A playlist foi removida com sucesso.',
          type: 'success',
        });
      } catch (err: any) {
        addToast({
          title: 'Erro ao excluir',
          description: err?.message || 'Falha ao excluir playlist.',
          type: 'error',
        });
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-[#2563EB]/10 text-[#38BDF8]">
              <ListVideo className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] font-display">
              Playlists & Grades de Exibição
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Organize conteúdos em sequências cronometradas para distribuição nos displays da rede.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            isLoading={isRefreshing}
            className="flex items-center gap-1.5 text-xs bg-white/5 border-white/10 text-[#94A3B8] hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-[#2563EB]/25"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Playlist</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <PlaylistKpiSummary
        kpis={kpis}
        isLoading={isKpiLoading}
        onFilterStatus={(st) => updateFilter('status', st)}
      />

      {/* Filters Bar */}
      <PlaylistFiltersBar
        filters={filters}
        viewMode={viewMode}
        sortField={sortField}
        sortOrder={sortOrder}
        totalCount={totalFilteredCount}
        onUpdateFilter={updateFilter}
        onResetFilters={resetFilters}
        onViewModeChange={setViewMode}
        onSortFieldChange={setSortField}
        onToggleSortOrder={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      />

      {/* Bulk Actions Floating Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-[#2563EB]/15 border border-[#2563EB]/40 rounded-xl p-3 flex items-center justify-between gap-4 animate-slideDown">
          <div className="flex items-center gap-2 text-xs text-[#38BDF8] font-medium">
            <span className="font-mono font-bold">{selectedIds.size}</span> playlists selecionadas
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearSelection}
              className="text-xs h-8 px-2.5 text-[#94A3B8] border-white/10"
            >
              Desmarcar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteSelected}
              className="text-xs h-8 px-2.5 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Selecionadas</span>
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-[#0F172A] border border-white/5 rounded-xl h-64 animate-pulse p-4 flex flex-col justify-between"
            >
              <div className="h-28 bg-white/5 rounded-lg mb-3" />
              <div className="space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedPlaylists.length === 0 ? (
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#2563EB]/10 text-[#38BDF8] flex items-center justify-center">
            <ListVideo className="w-8 h-8" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-semibold text-[#F8FAFC] font-display">
              Nenhuma playlist encontrada
            </h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              Não encontramos nenhuma playlist correspondente aos filtros aplicados ou sua biblioteca ainda não possui sequências criadas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Limpar Filtros
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Nova Playlist</span>
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedPlaylists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              isSelected={selectedIds.has(playlist.id)}
              onToggleSelect={toggleSelection}
              onOpenBuilder={onNavigateToBuilder}
              onOpenPreview={setPreviewPlaylist}
              onOpenReport={setReportPlaylist}
              onDuplicate={duplicatePlaylist}
              onDelete={handleDeleteSingle}
              onStatusChange={updatePlaylistStatus}
            />
          ))}
        </div>
      ) : (
        <PlaylistTable
          playlists={paginatedPlaylists}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelection}
          onSelectAll={selectAllCurrentPage}
          onOpenBuilder={onNavigateToBuilder}
          onOpenPreview={setPreviewPlaylist}
          onOpenReport={setReportPlaylist}
          onDuplicate={duplicatePlaylist}
          onDelete={handleDeleteSingle}
          onStatusChange={updatePlaylistStatus}
        />
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs text-[#94A3B8]">
          <span>
            Mostrando página <strong className="text-white">{currentPage}</strong> de{' '}
            <strong className="text-white">{totalPages}</strong> ({totalFilteredCount} total)
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
              className="h-8 px-2.5 text-xs"
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
              className="h-8 px-2.5 text-xs"
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewPlaylistModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreate={handleCreate}
      />

      <PlaylistPreviewModal
        isOpen={Boolean(previewPlaylist)}
        playlist={previewPlaylist}
        onClose={() => setPreviewPlaylist(null)}
      />

      <PlaylistReportModal
        isOpen={Boolean(reportPlaylist)}
        playlist={reportPlaylist}
        onClose={() => setReportPlaylist(null)}
      />
    </div>
  );
};
