import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Playlist, PlaylistItem, PlaylistItemTransition, PlaylistStatus } from '../../../types/domain';
import { NexoraService } from '../../../services';
import { normalizePlaylistItems } from '../../../lib/mediaItems';

// Internal cache of real content items from API
let _contentCache: any[] = [];

export function invalidateContentCache() {
  _contentCache = [];
}

async function getContentFromApi(forceRefresh = false): Promise<any[]> {
  if (_contentCache.length > 0 && !forceRefresh) return _contentCache;
  _contentCache = []; // clear before refetch
  try {
    const res = await fetch('/api/content');
    if (res.ok) {
      const data = await res.json();
      _contentCache = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        type: (d.type || 'IMAGE').toUpperCase(),
        fileUrl: d.url,
        url: d.url,
        thumbnailUrl: d.url,
        duration: d.duration || 15,
        status: 'READY',
        code: 'CNT-' + d.id.substring(0, 8).toUpperCase(),
        resolution: '1920x1080 (Full HD)',
        orientation: 'LANDSCAPE',
        mimeType: (d.type || '').toLowerCase() === 'video' ? 'video/mp4' : 'image/png',
      }));
      return _contentCache;
    }
  } catch (e) {
    console.warn('Failed to load content from API', e);
  }
  return [];
}

export function usePlaylistBuilder(playlistId: string) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // IDs removidos explicitamente nesta sessão de edição. Enviados ao servidor no
  // save para ele não repor (proteção de itens de campanha) a mídia que o
  // utilizador apagou de propósito.
  const removedItemIdsRef = useRef<Set<string>>(new Set());

  // Load Playlist
  const loadPlaylist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    // Preload content cache
    await getContentFromApi();
    try {
      const data = await NexoraService.playlists.getById(playlistId);
      if (!data) {
        setError(`Playlist com ID "${playlistId}" não foi encontrada no repositório.`);
      } else {
        setPlaylist(data);
        setIsDirty(false);
        // Estado recarregado do servidor: deixa de haver remoções pendentes
        removedItemIdsRef.current = new Set();
      }
    } catch (err) {
      console.error('Error loading playlist:', err);
      setError('Erro ao carregar os detalhes da playlist.');
    } finally {
      setIsLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  // Recalculate duration & item count dynamically
  const calculatedTotalDuration = useMemo(() => {
    if (!playlist || !playlist.items) return 0;
    return playlist.items
      .filter((item) => item.enabled)
      .reduce((sum, item) => sum + (item.duration || 10) * (item.repeatCount || 1), 0);
  }, [playlist]);

  // Add a single content item
  const addItem = useCallback(
    async (contentId: string, customDuration?: number) => {
      if (!playlist) return;
      const contentList = await getContentFromApi();
      const content = contentList.find((c) => c.id === contentId);
      const defaultDuration = customDuration || (content?.duration ? content.duration : 15);

      const newItem: PlaylistItem = {
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        playlistId: playlist.id,
        contentId,
        position: (playlist.items || []).length + 1,
        duration: defaultDuration,
        enabled: true,
        transition: 'FADE',
        repeatCount: 1,
        content: content ? { ...content } : undefined,
      };

      setPlaylist((prev) => {
        if (!prev) return null;
        const newItems = [...(prev.items || []), newItem];
        return {
          ...prev,
          items: newItems,
          itemCount: newItems.length,
        };
      });
      setIsDirty(true);
    },
    [playlist]
  );

  // Add multiple content items from modal
  const addMultipleItems = useCallback(
    async (contentIds: string[], campaignMeta?: { campaignId?: string; clientId?: string; clientName?: string; campaignName?: string; duration?: number; startDate?: string; endDate?: string; budgetKz?: number }) => {
      if (!playlist || contentIds.length === 0) return;
      invalidateContentCache();
      const contentList = await getContentFromApi(true);

      const newItems: PlaylistItem[] = contentIds.map((contentId, idx) => {
        const content = contentList.find((c) => c.id === contentId);
        const itemDuration = campaignMeta?.duration || 10;
        const mediaUrl = content?.fileUrl || content?.url || content?.thumbnailUrl || '';
        const mediaName = content?.name || 'Mídia Cadastrada';
        const mediaType = (content?.type || (mediaUrl.toLowerCase().includes('.mp4') ? 'VIDEO' : 'IMAGE')).toUpperCase();
        return {
          id: `item-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
          playlistId: playlist.id,
          contentId,
          position: (playlist.items || []).length + idx + 1,
          duration: itemDuration,
          enabled: true,
          transition: 'FADE',
          repeatCount: 1,
          mediaUrl,
          name: mediaName,
          type: mediaType,
          campaignId: campaignMeta?.campaignId,
          campaignTitle: campaignMeta?.campaignName,
          advertiserName: campaignMeta?.clientName,
          advertiserId: campaignMeta?.clientId,
          budgetKz: campaignMeta?.budgetKz,
          startDate: campaignMeta?.startDate,
          endDate: campaignMeta?.endDate,
          content: content ? { ...content, fileUrl: mediaUrl, url: mediaUrl, type: mediaType, duration: itemDuration } : ({
            id: contentId,
            name: mediaName,
            type: mediaType,
            fileUrl: mediaUrl,
            url: mediaUrl,
            thumbnailUrl: mediaUrl,
            duration: itemDuration,
            status: 'READY',
          } as any),
        };
      });

      setPlaylist((prev) => {
        if (!prev) return null;
        const combined = [...(prev.items || []), ...newItems];
        return {
          ...prev,
          items: combined,
          itemCount: combined.length,
        };
      });
      setIsDirty(true);
    },
    [playlist]
  );

  // Remove an item
  const removeItem = useCallback((itemId: string) => {
    // Regista a remoção explícita (para o servidor a respeitar no save)
    removedItemIdsRef.current.add(itemId);
    setPlaylist((prev) => {
      if (!prev) return null;
      const filtered = (prev.items || []).filter((i) => i.id !== itemId);
      const reindexed = filtered.map((item, idx) => ({
        ...item,
        position: idx + 1,
      }));
      return {
        ...prev,
        items: reindexed,
        itemCount: reindexed.length,
      };
    });
    setIsDirty(true);
  }, []);

  // Reorder items
  const reorderItems = useCallback((startIndex: number, endIndex: number) => {
    setPlaylist((prev) => {
      if (!prev || !prev.items) return prev;
      const result = Array.from(prev.items);
      const removed = result.splice(startIndex, 1)[0];
      if (!removed) return prev;
      result.splice(endIndex, 0, removed);

      const reindexed = result.map((item: PlaylistItem, idx: number) => ({
        ...item,
        position: idx + 1,
      }));

      return {
        ...prev,
        items: reindexed,
      };
    });
    setIsDirty(true);
  }, []);

  // Move item up/down
  const moveItemUp = useCallback((index: number) => {
    if (index <= 0) return;
    reorderItems(index, index - 1);
  }, [reorderItems]);

  const moveItemDown = useCallback((index: number) => {
    setPlaylist((prev) => {
      if (!prev || !prev.items || index >= prev.items.length - 1) return prev;
      const result = Array.from(prev.items);
      const removed = result.splice(index, 1)[0];
      if (!removed) return prev;
      result.splice(index + 1, 0, removed);
      return {
        ...prev,
        items: result.map((item: PlaylistItem, idx: number) => ({ ...item, position: idx + 1 })),
      };
    });
    setIsDirty(true);
  }, [reorderItems]);

  // Update item properties (duration, transition, repeatCount, enabled)
  const updateItem = useCallback((itemId: string, data: Partial<PlaylistItem>) => {
    setPlaylist((prev) => {
      if (!prev || !prev.items) return prev;
      const updatedItems = prev.items.map((item) => {
        if (item.id === itemId) {
          return { ...item, ...data };
        }
        return item;
      });
      return {
        ...prev,
        items: updatedItems,
      };
    });
    setIsDirty(true);
  }, []);

  // Update playlist info (name, description, status, tags)
  const updatePlaylistInfo = useCallback((data: Partial<Playlist>) => {
    setPlaylist((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ...data,
      };
    });
    setIsDirty(true);
  }, []);

  // Save changes to repository
  const savePlaylist = useCallback(async () => {
    if (!playlist) return null;
    setIsSaving(true);
    try {
      const cleanItems = normalizePlaylistItems(playlist.items || []).map((i: any) => ({
        id: i.id,
        playlistId: playlist.id,
        contentId: i.contentId,
        position: i.position,
        duration: i.duration,
        enabled: i.enabled,
        transition: i.transition,
        repeatCount: i.repeatCount,
        mediaUrl: i.mediaUrl,
        url: i.url,
        fileUrl: i.fileUrl,
        name: i.name,
        type: i.type,
        // Preserve campaignId so the server can identify campaign-injected items
        ...(i.campaignId ? { campaignId: i.campaignId } : {}),
        ...(i.advertiserName ? { advertiserName: i.advertiserName } : {}),
      }));

      const updated = await NexoraService.playlists.update(
        playlist.id,
        {
          name: playlist.name,
          description: playlist.description,
          status: playlist.status,
          tags: playlist.tags,
          items: cleanItems,
          totalDuration: calculatedTotalDuration,
          metadata: playlist.metadata,
          associatedDisplays: playlist.associatedDisplays,
          organizationId: playlist.organizationId,
        },
        { removedItemIds: Array.from(removedItemIdsRef.current) }
      );

      // Remoções já persistidas — limpa para não voltarem a ser enviadas
      removedItemIdsRef.current = new Set();

      setPlaylist(updated);
      setIsDirty(false);
      return updated;
    } catch (err) {
      console.error('Error saving playlist:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [playlist, calculatedTotalDuration]);

  // Duplicate playlist
  const duplicate = useCallback(async () => {
    if (!playlist) return null;
    const duplicated = await NexoraService.playlists.duplicate(playlist.id);
    return duplicated;
  }, [playlist]);

  // Update Associated Displays
  const updateAssociatedDisplays = useCallback(
    async (displayIds: string[]) => {
      if (!playlist) return;
      const updated = await NexoraService.playlists.associateDisplays(playlist.id, displayIds);
      setPlaylist(updated);
      setIsDirty(false);
      return updated;
    },
    [playlist]
  );

  return {
    playlist,
    isLoading,
    isSaving,
    error,
    isDirty,
    calculatedTotalDuration,
    addItem,
    addMultipleItems,
    removeItem,
    reorderItems,
    moveItemUp,
    moveItemDown,
    updateItem,
    updatePlaylistInfo,
    savePlaylist,
    duplicate,
    updateAssociatedDisplays,
    reload: loadPlaylist,
  };
}
