import { useState, useEffect, useCallback, useMemo } from 'react';
import { Playlist, PlaylistKPIs, PlaylistStatus } from '../../../types/domain';
import { PlaylistFilters } from '../../../repositories/types';
import { NexoraService } from '../../../services';
import { useSession } from '../../../context/SessionContext';

export type PlaylistSortField =
  | 'name'
  | 'updatedAt'
  | 'totalDuration'
  | 'itemCount'
  | 'displayCount'
  | 'createdAt';

export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export function usePlaylists() {
  const { currentOrganization } = useSession();
  const orgId = currentOrganization?.id;

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [kpis, setKpis] = useState<PlaylistKPIs | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isKpiLoading, setIsKpiLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<PlaylistFilters>({
    search: '',
    status: 'ALL',
    tag: 'ALL',
  });

  // Display, Sorting & Pagination
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<PlaylistSortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = viewMode === 'grid' ? 8 : 10;

  // Load KPIs
  const loadKpis = useCallback(async () => {
    setIsKpiLoading(true);
    try {
      const data = await NexoraService.playlists.getKPIs(orgId);
      setKpis(data);
    } catch (err) {
      console.error('Error loading playlist KPIs:', err);
    } finally {
      setIsKpiLoading(false);
    }
  }, [orgId]);

  // Load Playlists scoped to current org
  const loadPlaylists = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeFilters = orgId ? { ...filters, organizationId: orgId } : filters;
      const data = await NexoraService.playlists.getAll(activeFilters);
      setPlaylists(data);
    } catch (err) {
      console.error('Error loading playlists:', err);
      setError('Não foi possível carregar as playlists. Verifique a conexão com o repositório.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, orgId]);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    loadKpis();
  }, [loadKpis]);

  // Client-side Sorting
  const sortedPlaylists = useMemo(() => {
    const items = [...playlists];
    return items.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pt-PT', { sensitivity: 'base' });
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'totalDuration':
          comparison = a.totalDuration - b.totalDuration;
          break;
        case 'itemCount':
          comparison = a.itemCount - b.itemCount;
          break;
        case 'displayCount':
          comparison = a.displayCount - b.displayCount;
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [playlists, sortField, sortOrder]);

  // Pagination
  const totalFilteredCount = sortedPlaylists.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  const paginatedPlaylists = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedPlaylists.slice(startIndex, startIndex + pageSize);
  }, [sortedPlaylists, currentPage, pageSize]);

  // Reset to page 1 on filter changes
  const updateFilter = useCallback((key: keyof PlaylistFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'ALL',
      tag: 'ALL',
    });
    setCurrentPage(1);
  }, []);

  // Selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllCurrentPage = useCallback(() => {
    setSelectedIds(new Set(paginatedPlaylists.map((p) => p.id)));
  }, [paginatedPlaylists]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Actions
  const createPlaylist = async (data: Partial<Playlist>) => {
    // A playlist pertence SEMPRE à organização da sessão. Sem isto, a criação
    // caía numa organização por omissão e a playlist "desaparecia" da lista do
    // parceiro que a criou.
    const created = await NexoraService.playlists.create({
      ...data,
      organizationId: data.organizationId || currentOrganization?.id || '',
    });
    await Promise.all([loadPlaylists(), loadKpis()]);
    return created;
  };

  const duplicatePlaylist = async (id: string) => {
    const duplicated = await NexoraService.playlists.duplicate(id);
    await Promise.all([loadPlaylists(), loadKpis()]);
    return duplicated;
  };

  const deletePlaylists = async (ids: string[]) => {
    const res = await NexoraService.playlists.delete(ids);
    clearSelection();
    await Promise.all([loadPlaylists(), loadKpis()]);
    return res;
  };

  const updatePlaylistStatus = async (id: string, status: PlaylistStatus) => {
    const updated = await NexoraService.playlists.update(id, { status });
    await Promise.all([loadPlaylists(), loadKpis()]);
    return updated;
  };

  const refresh = async () => {
    await Promise.all([loadPlaylists(), loadKpis()]);
  };

  return {
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
    pageSize,
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
  };
}
