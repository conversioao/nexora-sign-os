import { Playlist, PlaylistItem, PlaylistKPIs } from '../types/domain';
import { IPlaylistRepository, PlaylistFilters } from './types';
import { mockPlaylists } from '../data/mockPlaylistData';
import { normalizePlaylistItems } from '../lib/mediaItems';

// Shared API content cache — populated on first use
let _apiContentCache: any[] = [];
async function loadApiContent(): Promise<any[]> {
  if (_apiContentCache.length > 0) return _apiContentCache;
  try {
    const res = await fetch('/api/content');
    if (res.ok) {
      const data = await res.json();
      _apiContentCache = data.map((d: any) => ({
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
    }
  } catch (e) {
    console.warn('Failed to load content cache in playlistRepository', e);
  }
  return _apiContentCache;
}

class MockPlaylistRepository implements IPlaylistRepository {
  private playlists: Playlist[] = mockPlaylists.map((p, idx) => ({
    ...p,
    organizationId:
      idx % 3 === 0
        ? 'org-talatona'
        : idx % 3 === 1
        ? 'org-shopping'
        : 'org-nexora',
  }));

  /**
   * Helper to attach resolved ContentItem to each PlaylistItem for snappy UI rendering.
   * Resolution order:
   *  1. item.content (already attached in memory)
   *  2. API content cache (matched by contentId)
   *  3. Saved mediaUrl/name/type on the item itself (persisted via savePlaylist)
   */
  private enrichPlaylist(playlist: Playlist): Playlist {
    const enrichedItems = (playlist.items || []).map((item, index) => {
      // 1. Already has content attached
      if (item.content && (item.content.fileUrl || (item.content as any).url || item.content.thumbnailUrl)) {
        return { ...item, position: index + 1 };
      }

      // 2. Check API content cache
      const cachedContent = _apiContentCache.find((c) => c.id === item.contentId);
      if (cachedContent) {
        return {
          ...item,
          position: index + 1,
          content: { ...cachedContent },
        };
      }

      // 3. Reconstruct from saved item metadata (mediaUrl/name/type saved in savePlaylist)
      const savedMediaUrl = (item as any).mediaUrl || (item as any).url || '';
      const savedName = (item as any).name || (item as any).title || `Item ${index + 1}`;
      const savedType = (item as any).type || (savedMediaUrl.toLowerCase().includes('.mp4') ? 'VIDEO' : 'IMAGE');

      const reconstructedContent = {
        id: item.contentId || item.id,
        name: savedName,
        type: savedType.toUpperCase(),
        fileUrl: savedMediaUrl,
        url: savedMediaUrl,
        thumbnailUrl: savedMediaUrl,
        duration: item.duration || 15,
        status: 'READY',
        width: 1920,
        height: 1080,
        aspectRatio: '16:9',
        orientation: 'LANDSCAPE',
        resolution: '1920x1080',
        code: `CNT-${index + 1}`,
        mimeType: savedType.toUpperCase() === 'VIDEO' ? 'video/mp4' : 'image/png',
        tags: ['Playlist'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: { id: 'usr-1', name: 'Admin Nexora' },
        usage: { playlistCount: 1, displayCount: 1, campaignCount: 1 },
        metadata: { codec: savedType.toUpperCase() === 'VIDEO' ? 'H.264 / AVC' : 'PNG / JPEG', fps: 60 },
      } as any;

      return {
        ...item,
        position: index + 1,
        content: reconstructedContent,
      };
    });

    // Auto calculate total duration of enabled items considering repeat count
    const totalDuration = enrichedItems
      .filter((item) => item.enabled !== false)
      .reduce((sum, item) => sum + (item.duration || 10) * (item.repeatCount || 1), 0);

    return {
      ...playlist,
      items: enrichedItems,
      itemCount: enrichedItems.length,
      totalDuration,
      displayCount: playlist.associatedDisplays ? playlist.associatedDisplays.length : 0,
    };
  }

  async getAll(filters?: PlaylistFilters): Promise<Playlist[]> {
    // Preload API content cache so enrichPlaylist can resolve thumbnails
    await loadApiContent();
    try {
      const fetchUrl = filters?.organizationId
        ? `/api/playlists?organizationId=${encodeURIComponent(filters.organizationId)}`
        : '/api/playlists';
      const response = await fetch(fetchUrl);
      if (response.ok) {
        const dbPlaylists = await response.json();
        let result = dbPlaylists.map((p: any) => {
          const rawItems = typeof p.items === 'string' ? JSON.parse(p.items) : (p.items || []);
          return {
            id: p.id,
            name: p.name,
            code: `PL-${p.id.substring(0, 4).toUpperCase()}`,
            description: p.description || 'Playlist real do banco de dados',
            items: rawItems,
            itemCount: p.items_count || rawItems.length,
            totalDuration: p.duration || 60,
            status: p.status || 'ACTIVE',
            tags: ['Publicidade', 'Grade'],
            organizationId: p.organization_id || (filters?.organizationId ? filters.organizationId : ''),
            displayId: p.display_id || undefined,
            isSystemLocked: Boolean(p.is_system_locked || p.display_id),
            createdBy: { id: 'usr-admin', name: 'Admin Nexora' },
            createdAt: p.created_at || new Date().toISOString(),
            displayCount: p.display_count || 0,
          };
        });

        if (filters) {
          if (filters.organizationId && filters.organizationId !== 'org-nexora') {
            result = result.filter((p: any) => p.organizationId === filters.organizationId);
          }
          if (filters.search && filters.search.trim()) {
            const query = filters.search.toLowerCase().trim();
            result = result.filter((p: any) => p.name.toLowerCase().includes(query));
          }
        }
        return result.map((r: any) => this.enrichPlaylist(r));
      }
    } catch (e) {
      console.warn('API error fetching playlists, returning empty list', e);
    }
    return [];
  }

  async getById(id: string): Promise<Playlist | null> {
    // Preload API content cache so enrichPlaylist can resolve thumbnails
    await loadApiContent();

    const found = this.playlists.find((p) => p.id === id);
    if (found) return this.enrichPlaylist(found);

    try {
      const all = await this.getAll();
      const dbFound = all.find((p) => p.id === id || p.code === id);
      if (dbFound) {
        return this.enrichPlaylist(dbFound);
      }
    } catch {}
    return null;
  }

  async getKPIs(organizationId?: string): Promise<PlaylistKPIs> {
    // Use real DB data
    const all = await this.getAll();
    let targetPlaylists = all;
    if (organizationId && organizationId !== 'org-nexora') {
      targetPlaylists = all.filter(
        (p) => p.organizationId === organizationId || !p.organizationId
      );
    }

    const total = targetPlaylists.length;
    const active = targetPlaylists.filter((p) => p.status === 'ACTIVE').length;
    const paused = targetPlaylists.filter((p) => p.status === 'PAUSED').length;
    const scheduled = targetPlaylists.filter((p) => p.status === 'SCHEDULED').length;
    const draft = targetPlaylists.filter((p) => p.status === 'DRAFT').length;
    const archived = targetPlaylists.filter((p) => p.status === 'ARCHIVED').length;

    const totalDurationSeconds = targetPlaylists.reduce((sum, p) => sum + (p.totalDuration || 0), 0);

    const allDisplayIds = new Set<string>();
    targetPlaylists.forEach((p) => {
      p.associatedDisplays?.forEach((d) => allDisplayIds.add(d.id));
    });

    return {
      total,
      active,
      paused,
      scheduled,
      draft,
      archived,
      totalDurationSeconds,
      associatedDisplaysTotal: allDisplayIds.size,
    };
  }

  async create(data: Partial<Playlist>): Promise<Playlist> {
    const newIndex = this.playlists.length + 1;
    const code = `NEX-PLY-${String(newIndex).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newPlaylist: Playlist = {
      id: data.id || `ply-${Date.now()}`,
      /**
       * ⛔ `|| 'org-talatona'` fazia com que TODA a playlist criada sem organização
       * explícita fosse gravada na conta de outro cliente: o parceiro criava a
       * playlist, ela aparecia-lhe na lista filtrada da SUA organização (nunca
       * aparecia) e ficava a pertencer a terceiros. Sem organização no pedido, o
       * servidor decide (e valida) — não se inventa um dono.
       */
      organizationId: data.organizationId || '',
      code,
      name: data.name || 'Nova Playlist',
      description: data.description || '',
      status: data.status || 'ACTIVE',
      tags: data.tags || ['Geral'],
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || {
        id: 'usr-current',
        name: 'Operador Nexora',
        role: 'Administrador de Grade',
      },
      items: data.items || [],
      itemCount: (data.items || []).length,
      totalDuration: (data.items || []).reduce((sum, i) => sum + (i.duration || 10), 0),
      displayCount: (data.associatedDisplays || []).length,
      associatedDisplays: data.associatedDisplays || [],
      metadata: data.metadata || {
        orientation: 'LANDSCAPE',
        resolution: '1920x1080',
        aspectRatio: '16:9',
      },
    };

    this.playlists.unshift(newPlaylist);

    try {
      await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newPlaylist.id,
          name: newPlaylist.name,
          items_count: newPlaylist.itemCount,
          duration: newPlaylist.totalDuration,
          organization_id: newPlaylist.organizationId,
        }),
      });
    } catch (e) {
      console.warn('API error creating playlist', e);
    }

    return this.enrichPlaylist(newPlaylist);
  }

  async update(
    id: string,
    data: Partial<Playlist>,
    options?: { removedItemIds?: string[] }
  ): Promise<Playlist> {
    // Ensure API content cache is loaded so enrichPlaylist can resolve thumbnails
    await loadApiContent();

    let index = this.playlists.findIndex((p) => p.id === id);
    if (index === -1) {
      const dbPl: Playlist = {
        id,
        name: data.name || 'Playlist',
        code: `PL-${id.substring(0, 4).toUpperCase()}`,
        status: data.status || 'ACTIVE',
        description: data.description || '',
        items: data.items || [],
        itemCount: (data.items || []).length,
        totalDuration: data.totalDuration || 60,
        tags: data.tags || [],
        organizationId: data.organizationId || 'org-talatona',
        displayCount: 0,
        associatedDisplays: [],
        createdBy: { id: 'usr-admin', name: 'Admin Nexora' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.playlists.unshift(dbPl);
      index = 0;
    }

    const updated: Playlist = {
      ...this.playlists[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.playlists[index] = updated;

    // Build serializable items list (strip circular content refs for storage)
    const storableItems = normalizePlaylistItems(updated.items || []).map((item: any) => ({
      id: item.id,
      contentId: item.contentId,
      position: item.position,
      duration: item.duration,
      enabled: item.enabled,
      transition: item.transition,
      repeatCount: item.repeatCount,
      mediaUrl: item.mediaUrl,
      url: item.url,
      fileUrl: item.fileUrl,
      name: item.name,
      type: item.type,
      // Preserve campaign metadata so the server can identify and protect these items
      ...(item.campaignId ? { campaignId: item.campaignId } : {}),
      ...(item.advertiserName ? { advertiserName: item.advertiserName } : {}),
    }));

    try {
      const apiRes = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: updated.id,
          name: updated.name,
          items_count: storableItems.length,
          duration: updated.totalDuration || 60,
          organization_id: updated.organizationId,
          items: storableItems,
          status: updated.status || 'ACTIVE',
          // Informa o servidor do que foi removido de propósito, para ele não
          // "ressuscitar" mídias de campanha que o utilizador apagou da playlist.
          removedItemIds: options?.removedItemIds || [],
        }),
      });
      if (!apiRes.ok) {
        const errBody = await apiRes.json().catch(() => ({ error: `HTTP ${apiRes.status}` }));
        console.error('[playlistRepository] Falha ao salvar playlist na API:', errBody);
        throw new Error(errBody?.error || `Falha ao salvar playlist (HTTP ${apiRes.status})`);
      }
    } catch (e) {
      console.warn('[playlistRepository] API error updating playlist:', e);
      throw e;
    }

    return this.enrichPlaylist(updated);
  }

  async duplicate(id: string): Promise<Playlist> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const source = await this.getById(id);
    if (!source) {
      throw new Error(`Playlist com id ${id} não encontrada para duplicação.`);
    }

    const newIndex = this.playlists.length + 1;
    const code = `NEX-PLY-${String(newIndex).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const duplicatedItems: PlaylistItem[] = (source.items || []).map((item) => ({
      ...item,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    }));

    const duplicatedPlaylist: Playlist = {
      ...source,
      id: `ply-${Date.now()}`,
      code,
      name: `${source.name} (Cópia)`,
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
      items: duplicatedItems,
      itemCount: duplicatedItems.length,
      associatedDisplays: [],
      displayCount: 0,
    };

    this.playlists.unshift(duplicatedPlaylist);
    return this.enrichPlaylist(duplicatedPlaylist);
  }

  async delete(ids: string[]): Promise<{ count: number; success: boolean }> {
    // Call real API for each id
    for (const id of ids) {
      try {
        const res = await fetch(`/api/playlists/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.error) {
            throw new Error(data.error);
          }
        }
      } catch (e: any) {
        console.warn(`Failed to delete playlist ${id}`, e);
        throw e;
      }
    }
    // Also update in-memory
    const initialLen = this.playlists.length;
    this.playlists = this.playlists.filter((p) => !ids.includes(p.id));
    const count = initialLen - this.playlists.length;
    return { count, success: true };
  }

  async addItem(playlistId: string, contentId: string, duration?: number): Promise<Playlist> {
    const playlist = await this.getById(playlistId);
    if (!playlist) throw new Error('Playlist não encontrada');

    const itemDuration = duration || 15;

    const newItem: PlaylistItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contentId,
      position: playlist.items.length + 1,
      duration: itemDuration,
      repeatCount: 1,
      enabled: true,
      transition: 'FADE',
      fitMode: 'COVER',
    };

    const updatedItems = [...playlist.items, newItem];
    return this.update(playlistId, { items: updatedItems });
  }

  async removeItem(playlistId: string, itemId: string): Promise<Playlist> {
    const playlist = await this.getById(playlistId);
    if (!playlist) throw new Error('Playlist não encontrada');

    const updatedItems = playlist.items
      .filter((i) => i.id !== itemId)
      .map((item, idx) => ({ ...item, position: idx + 1 }));

    return this.update(playlistId, { items: updatedItems });
  }

  async reorderItems(playlistId: string, itemIdsInOrder: string[]): Promise<Playlist> {
    const playlist = await this.getById(playlistId);
    if (!playlist) throw new Error('Playlist não encontrada');

    const reordered: PlaylistItem[] = [];
    itemIdsInOrder.forEach((id, index) => {
      const item = playlist.items.find((i) => i.id === id);
      if (item) {
        reordered.push({ ...item, position: index + 1 });
      }
    });

    return this.update(playlistId, { items: reordered });
  }

  async updateItem(playlistId: string, itemId: string, data: Partial<PlaylistItem>): Promise<Playlist> {
    const playlist = await this.getById(playlistId);
    if (!playlist) throw new Error('Playlist não encontrada');

    const updatedItems = playlist.items.map((item) => {
      if (item.id === itemId) {
        return { ...item, ...data };
      }
      return item;
    });

    return this.update(playlistId, { items: updatedItems });
  }

  async associateDisplays(playlistId: string, displayIds: string[]): Promise<Playlist> {
    const playlist = await this.getById(playlistId);
    if (!playlist) throw new Error('Playlist não encontrada');

    /**
     * ⛔ Antes, a associação era apenas local: gravava `associatedDisplays` no
     * objecto em memória e o DISPLAY nunca era avisado (nem
     * `displays.current_playlist_id` mudava). O utilizador associava a playlist,
     * mexia nas mídias, e o display continuava com o conteúdo antigo.
     *
     * Agora o servidor grava a associação e envia o conteúdo no momento.
     */
    try {
      const res = await fetch(`/api/playlists/${encodeURIComponent(playlistId)}/associate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ displayIds }),
      });

      if (!res.ok) {
        const erro = await res.json().catch(() => ({}));
        throw new Error((erro as any)?.error || `Falha ao associar (HTTP ${res.status}).`);
      }

      console.log(`🔗 [Playlists] Associação gravada no servidor e enviada aos displays: ${displayIds.join(', ')}`);
    } catch (e: any) {
      // Uma falha aqui tem de ser VISÍVEL: associar sem enviar era o defeito antigo.
      throw new Error(e?.message || 'Não foi possível associar a playlist aos displays.');
    }

    // Recarrega do servidor para a UI mostrar a associação real
    return (await this.getById(playlistId)) || playlist;
  }
}

export const playlistRepository = new MockPlaylistRepository();
