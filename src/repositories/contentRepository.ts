import { ContentItem, ContentKPIs, ContentFolder } from '../types/domain';
import { IContentRepository, ContentFilters } from './types';
import { mockContentItems, mockContentFolders } from '../data/mockContentData';
import { getApiUrl } from '../config/api';

class MockContentRepository implements IContentRepository {
  private items: ContentItem[] = mockContentItems.map((item, idx) => ({
    ...item,
    organizationId:
      idx % 3 === 0
        ? 'org-talatona'
        : idx % 3 === 1
        ? 'org-shopping'
        : 'org-nexora',
  }));

  private folders: ContentFolder[] = [...mockContentFolders];

  async getAll(filters?: ContentFilters): Promise<ContentItem[]> {
    try {
      const fetchPath = filters?.organizationId 
        ? `/api/content?organizationId=${encodeURIComponent(filters.organizationId)}`
        : '/api/content';
      const response = await fetch(getApiUrl(fetchPath));
      if (response.ok) {
        const data = await response.json();
        let items: ContentItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          type: (d.type || 'IMAGE').toUpperCase(),
          status: 'READY',
          fileUrl: d.url,
          url: d.url,
          thumbnailUrl: d.url,
          duration: d.duration || 15,
          fileSize: d.file_size || 5000000,
          width: 1920,
          height: 1080,
          aspectRatio: '16:9',
          orientation: 'LANDSCAPE',
          resolution: '1920x1080 (Full HD)',
          organizationId: d.organization_id || (filters?.organizationId ? filters.organizationId : ''),
          code: 'CNT-' + d.id.substring(0, 8).toUpperCase(),
          mimeType: (d.type || '').toLowerCase() === 'video' ? 'video/mp4' : 'image/png',
          createdBy: { id: 'usr-1', name: 'Administrador Nexora', role: 'Administrador de Mídia' },
          tags: ['Campanha', 'Luanda', 'Publicidade'],
          folderId: 'fld-campanhas',
          folderName: 'Campanhas Comerciais',
          usage: {
            playlistCount: 0,
            displayCount: 0,
            campaignCount: 0,
            associatedDisplays: [],
            associatedPlaylists: [],
            associatedCampaigns: [],
          },
          metadata: {
            codec: (d.type || '').toLowerCase() === 'video' ? 'H.264 / AVC' : 'PNG / JPEG / WebP',
            bitrateKbps: (d.type || '').toLowerCase() === 'video' ? 8500 : 0,
            frameRate: 60,
            fps: 60,
            colorSpace: 'sRGB / Rec.709',
            pageCount: 1,
            androidCompatibility: {
              compatible: true,
              notes: 'Decodificação acelerada por hardware no Android AOSP',
            },
          },
          createdAt: d.created_at || new Date().toISOString(),
          updatedAt: d.created_at || new Date().toISOString(),
        }));

        if (filters?.organizationId) {
          items = items.filter((item) => item.organizationId === filters.organizationId);
        }

        return items;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  async getById(id: string): Promise<ContentItem | null> {
    const all = await this.getAll();
    const found = all.find((item) => item.id === id || item.code.toLowerCase() === id.toLowerCase());
    return found ? { ...found } : null;
  }

  async getKPIs(organizationId?: string): Promise<ContentKPIs> {
    const all = await this.getAll();
    let targetItems = all;
    if (organizationId) {
      targetItems = targetItems.filter(
        (i) => i.organizationId === organizationId
      );
    }

    const total = targetItems.length;
    const videos = targetItems.filter((i) => i.type === 'VIDEO').length;
    const images = targetItems.filter((i) => i.type === 'IMAGE').length;
    const documents = targetItems.filter((i) => i.type === 'PDF').length;
    const processing = targetItems.filter((i) => i.status === 'PROCESSING').length;
    const ready = targetItems.filter((i) => i.status === 'READY').length;
    const active = targetItems.filter((i) => i.status === 'ACTIVE' || i.status === 'READY').length;
    const archived = targetItems.filter((i) => i.status === 'ARCHIVED').length;
    const totalStorageBytes = targetItems.reduce((acc, i) => acc + (i.fileSize || 0), 0);

    return {
      total,
      videos,
      images,
      documents,
      processing,
      ready,
      active,
      archived,
      totalStorageBytes,
    };
  }

  async getFolders(organizationId?: string): Promise<ContentFolder[]> {
    const allItems = await this.getAll();
    let currentItems = allItems;
    if (organizationId && organizationId !== 'org-nexora') {
      currentItems = allItems.filter(
        (i) => i.organizationId === organizationId || !i.organizationId
      );
    }

    // Try to load real folders from SeaweedFS API
    try {
      const res = await fetch('/api/storage/folders');
      if (res.ok) {
        const data = await res.json();
        const serverFolders: string[] = data.folders || [];

        const folderColors = ['#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#F97316'];
        const mappedFolders: ContentFolder[] = [
          { id: 'fld-all', name: 'Todas as Mídias', slug: 'todas', itemCount: currentItems.length, color: '#3B82F6' },
          ...serverFolders.map((fName, idx) => ({
            id: 'fld-' + fName,
            name: fName.charAt(0).toUpperCase() + fName.slice(1).replace(/[-_]/g, ' '),
            slug: fName,
            itemCount: currentItems.filter((item: any) => (item.folderId === 'fld-' + fName || item.folderName?.toLowerCase() === fName.toLowerCase() || item.url?.includes('/' + fName + '/'))).length,
            color: folderColors[idx % folderColors.length],
          }))
        ];
        this.folders = mappedFolders;
        return mappedFolders;
      }
    } catch {}

    return this.folders.map((fld) => {
      if (fld.id === 'fld-all') {
        return { ...fld, itemCount: currentItems.length };
      }
      const count = currentItems.filter((i) => i.folderId === fld.id).length;
      return { ...fld, itemCount: count };
    });
  }

  async create(data: Partial<ContentItem>): Promise<ContentItem> {
    await new Promise((resolve) => setTimeout(resolve, 100));

    const itemId = data.id || `cnt-${Date.now()}`;
    const newIndex = this.items.length + 1;
    const code = data.code || `NEX-CNT-${String(newIndex).padStart(5, '0')}`;
    const now = new Date().toISOString();

    const newItem: ContentItem = {
      id: itemId,
      organizationId: data.organizationId || 'org-talatona',
      code,
      name: data.name || 'Novo Conteúdo Sem Título',
      description: data.description || '',
      type: data.type || 'IMAGE',
      status: data.status || 'READY',
      thumbnailUrl: data.thumbnailUrl || (data as any).url || data.fileUrl || '',
      thumbnailGradient: data.thumbnailGradient || 'from-blue-900 via-indigo-950 to-slate-900',
      fileUrl: data.fileUrl || (data as any).url || data.thumbnailUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
      mimeType:
        data.mimeType ||
        (data.type === 'VIDEO' ? 'video/mp4' : data.type === 'PDF' ? 'application/pdf' : 'image/png'),
      fileSize: data.fileSize || 10485760, // 10MB default
      duration: data.duration,
      width: data.width || 1920,
      height: data.height || 1080,
      aspectRatio: data.aspectRatio || '16:9',
      orientation: data.orientation || 'LANDSCAPE',
      resolution: data.resolution || `${data.width || 1920}x${data.height || 1080}`,
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || {
        id: 'usr-current',
        name: 'Operador Nexora',
        role: 'Administrador de Mídia',
      },
      tags: data.tags || ['Novo', 'Upload'],
      folderId: data.folderId || 'fld-campanhas',
      folderName: data.folderName || 'Campanhas Comerciais',
      usage: data.usage || {
        playlistCount: 0,
        displayCount: 0,
        campaignCount: 0,
        associatedDisplays: [],
        associatedPlaylists: [],
        associatedCampaigns: [],
      },
      metadata: data.metadata || {
        codec: data.type === 'VIDEO' ? 'H.264 / AVC' : 'PNG / JPEG / WebP',
        bitrateKbps: data.type === 'VIDEO' ? 8500 : 0,
        fps: 60,
        colorSpace: 'sRGB',
        pageCount: 1,
      },
    };

    const existingIdx = this.items.findIndex(
      (item) => item.id === itemId || (data.fileUrl && item.fileUrl === data.fileUrl && item.fileUrl.length > 5)
    );
    if (existingIdx >= 0) {
      this.items[existingIdx] = { ...this.items[existingIdx], ...newItem };
    } else {
      this.items.unshift(newItem);
    }

    try {
      await fetch(getApiUrl('/api/content'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newItem.id,
          name: newItem.name,
          type: (newItem.type || 'IMAGE').toLowerCase(),
          url: newItem.fileUrl || (newItem as any).url || 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
          duration: newItem.duration || 15,
          file_size: newItem.fileSize || 5000000,
          organization_id: newItem.organizationId,
        }),
      });
    } catch (e) {
      console.warn('Failed to insert content item into database', e);
    }

    return { ...newItem };
  }

  async update(id: string, data: Partial<ContentItem>): Promise<ContentItem> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Item de conteÃºdo com id ${id} nÃ£o encontrado.`);
    }

    const updated: ContentItem = {
      ...this.items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.items[index] = updated;
    return { ...updated };
  }

  /**
   * Renomeia uma mídia na biblioteca.
   *
   * ⛔ O `update()` genérico só alterava a lista EM MEMÓRIA — a página recarrega
   * do servidor, pelo que o nome novo desaparecia ao actualizar. Este método
   * grava mesmo na base de dados (`PATCH /api/content/:id`).
   */
  async rename(id: string, name: string): Promise<ContentItem> {
    const limpo = name.trim();
    if (!limpo) throw new Error('O nome da mídia não pode ficar vazio.');

    const res = await fetch(getApiUrl(`/api/content/${encodeURIComponent(id)}`), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: limpo }),
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error((erro as any)?.error || `Não foi possível renomear (HTTP ${res.status}).`);
    }

    const linha = await res.json();

    // Mantém a lista local coerente para quem já a tem carregada.
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.items[index] = { ...this.items[index], name: limpo, updatedAt: new Date().toISOString() };
    }

    return { ...(this.items[index] || ({} as ContentItem)), ...linha, name: limpo } as ContentItem;
  }

  async archive(ids: string[]): Promise<{ count: number; success: boolean }> {
    // Call real API
    try {
      await fetch(getApiUrl('/api/content/archive-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch (e) {
      console.warn('Failed to archive content in database', e);
    }
    // Also update in-memory
    this.items = this.items.map((item) => {
      if (ids.includes(item.id)) return { ...item, status: 'ARCHIVED' as any, updatedAt: new Date().toISOString() };
      return item;
    });
    return { count: ids.length, success: true };
  }

  async delete(ids: string[]): Promise<{ count: number; success: boolean }> {
    // Call real API
    try {
      await fetch(getApiUrl('/api/content/delete-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch (e) {
      console.warn('Failed to delete content in database', e);
    }
    // Also update in-memory
    const initialLen = this.items.length;
    this.items = this.items.filter((item) => !ids.includes(item.id));
    const count = initialLen - this.items.length;
    return { count, success: true };
  }

  async addTag(id: string, tag: string): Promise<ContentItem> {
    const item = await this.getById(id);
    if (!item) throw new Error('Item nÃ£o encontrado');

    const cleanTag = tag.trim();
    if (!cleanTag || item.tags.includes(cleanTag)) return item;

    return this.update(id, {
      tags: [...item.tags, cleanTag],
    });
  }
}

export const contentRepository = new MockContentRepository();

