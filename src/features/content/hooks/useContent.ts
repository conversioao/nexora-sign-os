import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ContentItem,
  ContentKPIs,
  ContentFolder,
  ContentMediaType,
  ContentStatus,
  ContentOrientation,
} from '../../../types/domain';
import { ContentFilters } from '../../../repositories/types';
import { NexoraService } from '../../../services';
import { useSession } from '../../../context/SessionContext';

export type ContentSortField =
  | 'name'
  | 'createdAt'
  | 'updatedAt'
  | 'fileSize'
  | 'duration'
  | 'usage';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'grid' | 'list';

export interface UseContentState {
  items: ContentItem[];
  kpis: ContentKPIs | null;
  folders: ContentFolder[];
  isLoading: boolean;
  isKpiLoading: boolean;
  error: string | null;
  filters: ContentFilters;
  viewMode: ViewMode;
  sortField: ContentSortField;
  sortOrder: SortOrder;
  selectedIds: Set<string>;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalFilteredCount: number;
  paginatedItems: ContentItem[];
}

export function useContent() {
  const { currentOrganization } = useSession();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [kpis, setKpis] = useState<ContentKPIs | null>(null);
  const [folders, setFolders] = useState<ContentFolder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isKpiLoading, setIsKpiLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<ContentFilters>({
    search: '',
    type: 'ALL',
    status: 'ALL',
    orientation: 'ALL',
    folderId: 'fld-all',
    tag: 'ALL',
  });

  // Display & Navigation
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<ContentSortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = viewMode === 'grid' ? 8 : 10;

  const orgId = currentOrganization?.id;

  // Load KPIs and Folders
  const loadMetadata = useCallback(async () => {
    setIsKpiLoading(true);
    try {
      const [kpiData, folderData] = await Promise.all([
        NexoraService.contents.getKPIs(orgId),
        NexoraService.contents.getFolders(),
      ]);
      setKpis(kpiData);
      setFolders(folderData);
    } catch (err) {
      console.error('Error fetching content metadata:', err);
    } finally {
      setIsKpiLoading(false);
    }
  }, [orgId]);

  // Load Content Items based on current filters and organizationId
  const loadContents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeFilters = orgId ? { ...filters, organizationId: orgId } : filters;
      const data = await NexoraService.contents.getAll(activeFilters);
      setItems(data);
    } catch (err) {
      console.error('Error fetching contents:', err);
      setError('Falha ao carregar a biblioteca de conteúdos.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, orgId]);

  useEffect(() => {
    loadMetadata();
  }, [loadMetadata]);

  useEffect(() => {
    loadContents();
  }, [loadContents]);

  // Handle Sort
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'pt');
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'fileSize':
          comparison = a.fileSize - b.fileSize;
          break;
        case 'duration':
          comparison = (a.duration || 0) - (b.duration || 0);
          break;
        case 'usage':
          comparison =
            ((a.usage?.displayCount || 0) + (a.usage?.playlistCount || 0)) -
            ((b.usage?.displayCount || 0) + (b.usage?.playlistCount || 0));
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [items, sortField, sortOrder]);

  // Pagination calculation
  const totalFilteredCount = sortedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  // Ensure current page does not overflow
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedItems.slice(startIndex, startIndex + pageSize);
  }, [sortedItems, currentPage, pageSize]);

  // Filter setters
  const updateFilter = useCallback((key: keyof ContentFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'ALL',
      status: 'ALL',
      orientation: 'ALL',
      folderId: 'fld-all',
      tag: 'ALL',
    });
    setCurrentPage(1);
  }, []);

  // Selection handlers
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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allCurrentSelected = paginatedItems.every((item) => next.has(item.id));
      if (allCurrentSelected) {
        paginatedItems.forEach((item) => next.delete(item.id));
      } else {
        paginatedItems.forEach((item) => next.add(item.id));
      }
      return next;
    });
  }, [paginatedItems]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Sort handlers
  const handleSortChange = useCallback((field: ContentSortField) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('asc');
      return field;
    });
  }, []);

  // Actions
  const uploadContent = useCallback(
    async (data: Partial<ContentItem>) => {
      const payload = { ...data, organizationId: currentOrganization?.id };
      const created = await NexoraService.contents.create(payload);
      await Promise.all([loadContents(), loadMetadata()]);
      return created;
    },
    [loadContents, loadMetadata, currentOrganization]
  );

  const archiveSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await NexoraService.contents.archive(Array.from(selectedIds));
    clearSelection();
    await Promise.all([loadContents(), loadMetadata()]);
  }, [selectedIds, clearSelection, loadContents, loadMetadata]);

  const deleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await NexoraService.contents.delete(Array.from(selectedIds));
    clearSelection();
    await Promise.all([loadContents(), loadMetadata()]);
  }, [selectedIds, clearSelection, loadContents, loadMetadata]);

  return {
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
    setSortField,
    setSortOrder,
    setCurrentPage,
    uploadContent,
    archiveSelected,
    deleteSelected,
    refresh: useCallback(async () => {
      await Promise.all([loadContents(), loadMetadata()]);
    }, [loadContents, loadMetadata]),
  };
}
