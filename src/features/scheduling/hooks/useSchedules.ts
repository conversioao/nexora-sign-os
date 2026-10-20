import { useState, useEffect, useCallback, useMemo } from 'react';
import { Schedule, ScheduleKPIs, ScheduleStatus, SchedulePriority, ScheduleRecurrence, ScheduleConflict } from '../../../types/domain';
import { ScheduleFilters } from '../../../repositories/types';
import { NexoraService } from '../../../services';
import { getAllSystemConflicts } from '../services/scheduleConflictService';
import { mockDisplays } from '../../../data/mockData';

export function useSchedules(initialFilters?: ScheduleFilters) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [kpis, setKpis] = useState<ScheduleKPIs>({
    total: 0,
    active: 0,
    scheduled: 0,
    paused: 0,
    expired: 0,
    conflicts: 0,
    programmedDisplaysCount: 0,
  });
  const [filters, setFilters] = useState<ScheduleFilters>({
    search: '',
    status: 'ALL',
    priority: 'ALL',
    recurrence: 'ALL',
    playlistId: 'ALL',
    displayId: 'ALL',
    ...initialFilters,
  });
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Map of display names for conflict messages
  const displayNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    mockDisplays.forEach((d) => map.set(d.id, `${d.name} (${d.code})`));
    return map;
  }, []);

  // System-wide conflict map
  const conflictMap = useMemo(() => {
    return getAllSystemConflicts(schedules, displayNamesMap);
  }, [schedules, displayNamesMap]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedSchedules, fetchedKpis] = await Promise.all([
        NexoraService.schedules.getAll(filters),
        NexoraService.schedules.getKPIs(),
      ]);
      setSchedules(fetchedSchedules);
      setKpis(fetchedKpis);
    } catch (error) {
      console.error('Error loading schedules:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateFilters = (newFilters: Partial<ScheduleFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'ALL',
      priority: 'ALL',
      recurrence: 'ALL',
      playlistId: 'ALL',
      displayId: 'ALL',
    });
  };

  const toggleStatus = async (id: string, newStatus: ScheduleStatus) => {
    setActionLoading(true);
    try {
      await NexoraService.schedules.toggleStatus(id, newStatus);
      await loadData();
    } catch (error) {
      console.error('Error toggling status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const duplicateSchedule = async (id: string) => {
    setActionLoading(true);
    try {
      const dup = await NexoraService.schedules.duplicate(id);
      await loadData();
      return dup;
    } catch (error) {
      console.error('Error duplicating schedule:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSchedules = async (ids: string[]) => {
    setActionLoading(true);
    try {
      const res = await NexoraService.schedules.delete(ids);
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      await loadData();
      return res;
    } catch (error) {
      console.error('Error deleting schedules:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === schedules.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(schedules.map((s) => s.id));
    }
  };

  return {
    schedules,
    kpis,
    filters,
    loading,
    actionLoading,
    selectedIds,
    conflictMap,
    displayNamesMap,
    updateFilters,
    resetFilters,
    reload: loadData,
    toggleStatus,
    duplicateSchedule,
    deleteSchedules,
    toggleSelect,
    selectAll,
    setSelectedIds,
  };
}
