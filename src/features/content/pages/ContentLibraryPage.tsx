import React, { useState } from 'react';
import { Plus, RefreshCw, FolderPlus, UploadCloud, Layers, Trash2 } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { contentRepository } from '../../../repositories/contentRepository';
import { ContentKpiSummary } from '../components/ContentKpiSummary';
import { ContentFiltersBar } from '../components/ContentFiltersBar';
import { ContentCard } from '../components/ContentCard';
import { ContentTable } from '../components/ContentTable';
import { ContentBatchActionBar } from '../components/ContentBatchActionBar';
import { Modal } from '../../../components/ui/Modal';
import { AddContentModal } from '../components/AddContentModal';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { ContentItem, ContentMediaType, ContentStatus } from '../../../types/domain';

interface ContentLibraryPageProps {
  onNavigateToDetail: (id: string) => void;
  onNavigateToPlaylistBuilder?: (playlistId: string) => void;
}

export const ContentLibraryPage: React.FC<ContentLibraryPageProps> = ({
  onNavigateToDetail,
  onNavigateToPlaylistBuilder,
}) => {
  const {
    items,
    paginatedItems,
    kpis,
    folders,
    isLoading,
    isKpiLoading,
    error,
    filters,
    viewMode,
    sortField,
    sortOrder,
    selectedIds,
    currentPage,
    pageSize,
    totalPages,
    totalFilteredCount,
    setViewMode,
    updateFilter,
    resetFilters,
    toggleSelection,
    selectAllCurrentPage,
    clearSelection,
    handleSortChange,
    setCurrentPage,
    uploadContent,
    archiveSelected,
    deleteSelected,
    refresh,
  } = useContent();

  const { addToast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  /** Estado da renomeação de uma mídia (nome é editável; ficheiro/URL não). */
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh();
    setIsRefreshing(false);
    addToast({
      type: 'info',
      title: 'Biblioteca Atualizada',
      message: 'Mídias e métricas sincronizadas com o repositório central.',
    });
  };

  const handleArchiveSingle = async (id: string) => {
    // Select the item and archive
    try {
      await fetch('/api/content/archive-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      });
      await refresh();
      addToast({
        type: 'success',
        title: 'Conteúdo Arquivado',
        message: 'O conteúdo foi movido para o arquivo inativo.',
      });
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível arquivar o conteúdo.' });
    }
  };

  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja eliminar esta mídia? Esta ação não pode ser desfeita.')) return;
    try {
      await fetch(`/api/content/${id}`, { method: 'DELETE' });
      await refresh();
      addToast({
        type: 'success',
        title: 'Mídia Eliminada',
        message: 'O item foi removido permanentemente da biblioteca.',
      });
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível eliminar o conteúdo.' });
    }
  };

  /**
   * RENOMEAR MÍDIA.
   *
   * O nome é o único campo editável: o ficheiro e o URL pertencem ao registo
   * original e mudá-los partiria a veiculação nos displays. A gravação é feita no
   * servidor (PATCH /api/content/:id) — antes, uma alteração local desaparecia no
   * primeiro refresh, porque a lista é recarregada da base de dados.
   */
  const abrirRenomear = (item: ContentItem) => {
    setRenamingId(item.id);
    setRenameValue(item.name || '');
    setRenameError(null);
  };

  const handleRename = async () => {
    if (!renamingId) return;
    const limpo = renameValue.trim();
    if (!limpo) {
      setRenameError('O nome não pode ficar vazio.');
      return;
    }

    setIsRenaming(true);
    setRenameError(null);
    try {
      await contentRepository.rename(renamingId, limpo);
      await refresh();
      setRenamingId(null);
      addToast({
        type: 'success',
        title: 'Mídia renomeada',
        message: `O novo nome é "${limpo}".`,
      });
    } catch (err: any) {
      setRenameError(err?.message || 'Não foi possível renomear a mídia.');
    } finally {
      setIsRenaming(false);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      const res = await fetch('/api/storage/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName: newFolderName.trim() }),
      });
      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Pasta Criada no Storage',
          message: `Pasta "${newFolderName.trim()}" criada com sucesso no SeaweedFS.`,
        });
        setNewFolderName('');
        setIsNewFolderModalOpen(false);
        await refresh();
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Falha ao criar pasta');
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro', message: err.message || 'Falha ao criar pasta' });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async (folderSlug: string, folderName: string) => {
    if (!window.confirm(`Excluir a pasta "${folderName}" e todos os seus arquivos do SeaweedFS? Esta ação é irreversível.`)) return;
    try {
      const res = await fetch(`/api/storage/folders/${folderSlug}`, { method: 'DELETE' });
      if (res.ok) {
        addToast({
          type: 'success',
          title: 'Pasta Excluída',
          message: `Pasta "${folderName}" e seus arquivos foram excluídos do SeaweedFS.`,
        });
        await refresh();
      } else {
        throw new Error('Falha ao excluir pasta');
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro', message: err.message || 'Falha ao excluir pasta' });
    }
  };

  const handleCreatePlaylistFromSelection = async () => {
    if (selectedIds.size === 0) return;
    setIsCreatingPlaylist(true);
    try {
      // Gather selected content items
      const selectedItems = items.filter((c) => selectedIds.has(c.id));
      const playlistItems = selectedItems.map((c, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        mediaUrl: c.fileUrl || (c as any).url || '',
        duration: c.duration || 15,
        name: c.name,
        type: c.type === 'VIDEO' ? 'video' : 'image',
        transition: 'FADE',
        repeatCount: 1,
      }));
      const playlistId = `pl-${Date.now()}`;
      const playlistName = `Nova Playlist (${selectedItems.length} mídias)`;
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: playlistId,
          name: playlistName,
          items_count: selectedItems.length,
          duration: playlistItems.reduce((s, i) => s + i.duration, 0),
          organization_id: 'org-talatona',
          items: playlistItems,
          status: 'ACTIVE',
        }),
      });
      if (res.ok) {
        clearSelection();
        addToast({
          type: 'success',
          title: 'Playlist Criada',
          message: `"${playlistName}" foi criada com ${selectedItems.length} mídias.`,
        });
        if (onNavigateToPlaylistBuilder) onNavigateToPlaylistBuilder(playlistId);
      } else {
        throw new Error('Falha ao criar playlist');
      }
    } catch {
      addToast({ type: 'error', title: 'Erro', message: 'Não foi possível criar a playlist.' });
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const handleUploadSubmit = async (data: Partial<ContentItem>) => {
    await uploadContent(data);
    addToast({
      type: 'success',
      title: 'Upload Concluído',
      message: `"${data.name}" foi catalogado e está pronto para uso.`,
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Conteúdos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Gerencie os conteúdos utilizados na rede Nexora.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Conteúdo</span>
          </Button>
        </div>
      </div>

      {/* Operational KPI Summary */}
      <ContentKpiSummary
        kpis={kpis}
        isLoading={isKpiLoading}
        activeTypeFilter={filters.type}
        activeStatusFilter={filters.status}
        onSelectType={(type: ContentMediaType | 'ALL') => updateFilter('type', type)}
        onSelectStatus={(status: ContentStatus | 'ALL') => updateFilter('status', status)}
      />

      {/* Search & Filter Bar */}
      <ContentFiltersBar
        filters={filters}
        folders={folders}
        viewMode={viewMode}
        sortField={sortField}
        sortOrder={sortOrder}
        totalFilteredCount={totalFilteredCount}
        onFilterChange={updateFilter}
        onResetFilters={resetFilters}
        onViewModeChange={setViewMode}
        onSortChange={handleSortChange}
        onCreateFolder={() => setIsNewFolderModalOpen(true)}
        onDeleteFolder={handleDeleteFolder}
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
              <div
                key={idx}
                className="bg-[#0B1120]/80 border border-white/5 rounded-xl p-3 space-y-3"
              >
                <Skeleton variant="rectangular" height={160} className="rounded-lg" />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="50%" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Erro ao carregar conteúdos"
          message={error}
          onRetry={refresh}
        />
      ) : paginatedItems.length === 0 ? (
        <EmptyState
          title="Nenhum conteúdo encontrado"
          description="Não encontramos mídias correspondentes aos filtros selecionados. Tente alterar os termos da busca ou limpar os filtros."
          actionLabel="Limpar Filtros"
          onAction={resetFilters}
        />
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {paginatedItems.map((content) => (
                <ContentCard
                  key={content.id}
                  content={content}
                  isSelected={selectedIds.has(content.id)}
                  onToggleSelect={toggleSelection}
                  onOpenDetails={onNavigateToDetail}
                  onAddToPlaylist={() => handleCreatePlaylistFromSelection()}
                  onArchive={handleArchiveSingle}
                  onDelete={handleDeleteSingle}
                  onRename={abrirRenomear}
                />
              ))}
            </div>
          )}

          {/* List / Table View */}
          {viewMode === 'list' && (
            <ContentTable
              items={paginatedItems}
              selectedIds={selectedIds}
              sortField={sortField}
              sortOrder={sortOrder}
              onToggleSelect={toggleSelection}
              onSelectAllPage={selectAllCurrentPage}
              onSortChange={handleSortChange}
              onOpenDetails={onNavigateToDetail}
              onAddToPlaylist={() => handleCreatePlaylistFromSelection()}
              onArchive={handleArchiveSingle}
              onDelete={handleDeleteSingle}
              onRename={abrirRenomear}
            />
          )}

          {/* Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              totalItems={totalFilteredCount}
              pageSize={pageSize}
            />
          </div>
        </>
      )}

      {/* Floating Contextual Batch Action Bar */}
      <ContentBatchActionBar
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
        onAddToPlaylist={handleCreatePlaylistFromSelection}
        onArchiveSelected={async () => {
          await archiveSelected();
          await refresh();
          addToast({
            type: 'success',
            title: 'Conteúdos Arquivados',
            message: 'Os itens selecionados foram movidos para o arquivo inativo.',
          });
        }}
        onDeleteSelected={async () => {
          if (!window.confirm(`Eliminar ${selectedIds.size} mídia(s)? Esta ação não pode ser desfeita.`)) return;
          await deleteSelected();
          await refresh();
          addToast({
            type: 'success',
            title: 'Mídias Eliminadas',
            message: 'Os itens selecionados foram removidos permanentemente da biblioteca.',
          });
        }}
      />

      {/* New Folder Modal */}
      <Modal
        isOpen={isNewFolderModalOpen}
        onClose={() => setIsNewFolderModalOpen(false)}
        title="Criar Nova Pasta no SeaweedFS Storage"
        description="Crie uma pasta física no Filer para categorizar mídias por cliente, ponto ou evento."
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nome da Pasta</label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Ex: campanhas_natal, shopping_sul"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-[11px] text-slate-500">A pasta será criada diretamente no volume físico do SeaweedFS (/nexora/&lt;nome&gt;/).</p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsNewFolderModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" size="sm" onClick={handleCreateFolder} disabled={isCreatingFolder || !newFolderName.trim()}>
              {isCreatingFolder ? "Criando..." : "Criar Pasta"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Renomear Mídia */}
      <Modal
        isOpen={Boolean(renamingId)}
        onClose={() => {
          setRenamingId(null);
          setRenameError(null);
        }}
        title="Renomear Mídia"
        description="Altere o nome com que a mídia aparece na biblioteca, nas playlists e nos relatórios."
        size="sm"
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Nome da Mídia</label>
            <input
              type="text"
              autoFocus
              maxLength={200}
              value={renameValue}
              onChange={(e) => {
                setRenameValue(e.target.value);
                setRenameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRenaming) handleRename();
              }}
              placeholder="Ex: Promoção Arroz 5kg — Belas Shopping"
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {renameError && <p className="text-[11px] text-rose-400">{renameError}</p>}
            <p className="text-[11px] text-slate-500">
              O ficheiro, o tipo e a ligação da mídia <strong>não</strong> são alterados — só o nome.
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setRenamingId(null);
                setRenameError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRename}
              disabled={isRenaming || !renameValue.trim()}
            >
              {isRenaming ? 'A guardar...' : 'Guardar Nome'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Upload Content Modal */}
      <AddContentModal
        isOpen={isAddModalOpen}
        folders={folders}
        onClose={() => setIsAddModalOpen(false)}
        onUpload={handleUploadSubmit}
      />
    </div>
  );
};
