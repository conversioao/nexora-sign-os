import { Schedule, ScheduleKPIs, ScheduleStatus } from '../types/domain';
import { IScheduleRepository, ScheduleFilters } from './types';
import { getAllSystemConflicts } from '../features/scheduling/services/scheduleConflictService';

function parseJsonField(val: any, fallback: any): any {
  if (!val) return fallback;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return val;
}

function mapRow(s: any): Schedule {
  return {
    id: s.id,
    name: s.name,
    code: s.code || `SCH-${s.id.substring(0, 4).toUpperCase()}`,
    description: s.description || '',
    status: (s.status || 'ACTIVE') as any,
    playlistId: s.playlist_id || '',
    playlistName: s.playlist_name || 'Playlist Programada',
    startDate: s.start_date || new Date().toISOString().split('T')[0],
    endDate: s.end_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    startTime: s.start_time || '08:00',
    endTime: s.end_time || '22:00',
    priority: (s.priority || 'NORMAL') as any,
    recurrence: (s.recurrence || 'WEEKLY') as any,
    daysOfWeek: parseJsonField(s.days_of_week, ['MON', 'TUE', 'WED', 'THU', 'FRI']),
    displayIds: parseJsonField(s.display_ids, []),
    displayCount: 1,
    timezone: s.timezone || 'Africa/Luanda',
    organizationId: s.organization_id || 'org-talatona',
    tags: parseJsonField(s.tags, []),
    createdBy: { id: 'usr-1', name: 'Operador Nexora' },
    createdAt: s.created_at || new Date().toISOString(),
    updatedAt: s.updated_at || s.created_at || new Date().toISOString(),
  };
}

class NexoraScheduleRepository implements IScheduleRepository {
  private cache: Schedule[] = [];

  private enrich(sch: Schedule): Schedule {
    return {
      ...sch,
      playlistName: sch.playlistName || 'Playlist Programada',
      displayCount: sch.displayIds ? sch.displayIds.length : 0,
    };
  }

  async getAll(filters?: ScheduleFilters): Promise<Schedule[]> {
    try {
      const res = await fetch('/api/schedules');
      if (res.ok) {
        const rows = await res.json();
        let result: Schedule[] = rows.map(mapRow);
        this.cache = result;
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter((s) => s.name.toLowerCase().includes(q));
        }
        return result.map((s) => this.enrich(s));
      }
    } catch (e) {
      console.warn('API error fetching schedules', e);
    }
    return this.cache.map((s) => this.enrich(s));
  }

  async getById(id: string): Promise<Schedule | null> {
    try {
      const res = await fetch(`/api/schedules/${id}`);
      if (res.ok) {
        const s = await res.json();
        return this.enrich(mapRow(s));
      }
    } catch {}
    await this.getAll();
    const found = this.cache.find((s) => s.id === id);
    return found ? this.enrich({ ...found }) : null;
  }

  async getKPIs(organizationId?: string): Promise<ScheduleKPIs> {
    const all = await this.getAll();
    let target = all;
    if (organizationId && organizationId !== 'org-nexora') {
      target = all.filter((s) => !s.organizationId || s.organizationId === organizationId);
    }
    const total = target.length;
    const active = target.filter((s) => s.status === 'ACTIVE').length;
    const paused = target.filter((s) => s.status === 'PAUSED').length;
    const scheduled = target.filter((s) => s.status === 'SCHEDULED').length;
    const expired = target.filter((s) => s.status === 'EXPIRED').length;
    const draft = target.filter((s) => s.status === 'DRAFT').length;
    const conflictMap = getAllSystemConflicts(target);
    const conflicts = conflictMap.size;
    const allDisplayIds = new Set<string>();
    target.forEach((s) => s.displayIds?.forEach((dId) => allDisplayIds.add(dId)));
    return { total, active, paused, scheduled, expired, draft, conflicts, targetedDisplaysTotal: allDisplayIds.size };
  }

  async create(data: Partial<Schedule>): Promise<Schedule> {
    const id = `sch-${Date.now()}`;
    const code = `NEX-SCH-${String(Date.now()).slice(-6)}`;
    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      id,
      organizationId: data.organizationId || 'org-talatona',
      code,
      name: data.name || 'Nova Programacao',
      description: data.description || '',
      playlistId: data.playlistId || '',
      displayIds: data.displayIds || [],
      status: data.status || 'ACTIVE',
      startDate: data.startDate || now.split('T')[0],
      endDate: data.endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      startTime: data.startTime || '08:00',
      endTime: data.endTime || '22:00',
      daysOfWeek: data.daysOfWeek || ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      timezone: data.timezone || 'Africa/Luanda',
      priority: data.priority || 'NORMAL',
      recurrence: data.recurrence || 'WEEKLY',
      createdAt: now,
      updatedAt: now,
      createdBy: data.createdBy || { id: 'usr-current', name: 'Operador Nexora', role: 'Programador' },
      tags: data.tags || [],
    };
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: newSchedule.name,
          description: newSchedule.description,
          status: newSchedule.status,
          priority: newSchedule.priority,
          recurrence: newSchedule.recurrence,
          start_date: newSchedule.startDate,
          end_date: newSchedule.endDate,
          start_time: newSchedule.startTime,
          end_time: newSchedule.endTime,
          days_of_week: JSON.stringify(newSchedule.daysOfWeek),
          playlist_id: newSchedule.playlistId,
          display_ids: JSON.stringify(newSchedule.displayIds),
          timezone: newSchedule.timezone,
          tags: JSON.stringify(newSchedule.tags),
          organization_id: newSchedule.organizationId,
          code,
        }),
      });
    } catch (e) { console.warn('API error creating schedule', e); }
    this.cache.unshift(newSchedule);
    return this.enrich(newSchedule);
  }

  async update(id: string, data: Partial<Schedule>): Promise<Schedule> {
    let existing = await this.getById(id);
    if (!existing) throw new Error(`Programacao com id ${id} nao encontrada.`);
    const updated: Schedule = { ...existing, ...data, id, updatedAt: new Date().toISOString() };
    const idx = this.cache.findIndex((s) => s.id === id);
    if (idx >= 0) this.cache[idx] = updated; else this.cache.unshift(updated);
    try {
      await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: updated.name,
          description: updated.description,
          status: updated.status,
          priority: updated.priority,
          recurrence: updated.recurrence,
          start_date: updated.startDate,
          end_date: updated.endDate,
          start_time: updated.startTime,
          end_time: updated.endTime,
          days_of_week: JSON.stringify(updated.daysOfWeek),
          playlist_id: updated.playlistId,
          display_ids: JSON.stringify(updated.displayIds),
          timezone: updated.timezone,
          tags: JSON.stringify(updated.tags),
          organization_id: updated.organizationId,
          code: updated.code,
        }),
      });
    } catch (e) { console.warn('API error updating schedule', e); }
    return this.enrich(updated);
  }

  async duplicate(id: string): Promise<Schedule> {
    const source = await this.getById(id);
    if (!source) throw new Error(`Programacao com id ${id} nao encontrada para duplicacao.`);
    return this.create({ ...source, name: `${source.name} (Copia)`, status: 'DRAFT' });
  }

  async delete(ids: string[]): Promise<{ count: number; success: boolean }> {
    for (const id of ids) {
      try { await fetch(`/api/schedules/${id}`, { method: 'DELETE' }); } catch {}
    }
    const before = this.cache.length;
    this.cache = this.cache.filter((s) => !ids.includes(s.id));
    return { count: before - this.cache.length, success: true };
  }

  async toggleStatus(id: string): Promise<Schedule> {
    const sch = await this.getById(id);
    if (!sch) throw new Error('Programacao nao encontrada');
    const newStatus: ScheduleStatus = sch.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    return this.update(id, { status: newStatus });
  }
}

export const scheduleRepository = new NexoraScheduleRepository();