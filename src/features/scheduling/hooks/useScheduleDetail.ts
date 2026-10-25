import { useState, useEffect, useCallback, useMemo } from 'react';
import { Schedule, Playlist, Display, ScheduleConflict } from '../../../types/domain';
import { NexoraService } from '../../../services';
import { mockDisplays } from '../../../data/mockData';
import { detectConflicts } from '../services/scheduleConflictService';
import { getNextOccurrences, isCurrentlyBroadcasting, ScheduleOccurrence } from '../services/scheduleRecurrenceService';

export function useScheduleDetail(id: string) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const displayNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    mockDisplays.forEach((d) => map.set(d.id, `${d.name} (${d.code})`));
    return map;
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [fetchedSchedule, fetchedPlaylists, allDisps, fetchedAllSchedules] = await Promise.all([
        NexoraService.schedules.getById(id),
        NexoraService.playlists.getAll(),
        NexoraService.displays.getAll(),
        NexoraService.schedules.getAll(),
      ]);

      setSchedule(fetchedSchedule);
      setAllSchedules(fetchedAllSchedules);

      if (fetchedSchedule) {
        // Resolve playlist
        const p = fetchedPlaylists.find((item) => item.id === fetchedSchedule.playlistId);
        setPlaylist(p || null);

        // Resolve displays
        const disps = allDisps.filter((d) => (fetchedSchedule.displayIds || []).includes(d.id));
        setDisplays(disps);
      }
    } catch (error) {
      console.error('Error loading schedule details:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived conflict analysis
  const conflictResult = useMemo(() => {
    if (!schedule) return { hasConflict: false, conflicts: [] as ScheduleConflict[] };
    return detectConflicts(schedule, allSchedules, displayNamesMap);
  }, [schedule, allSchedules, displayNamesMap]);

  // Derived next occurrences
  const occurrences: ScheduleOccurrence[] = useMemo(() => {
    if (!schedule) return [];
    return getNextOccurrences(schedule, 6);
  }, [schedule]);

  // Is currently broadcasting right now
  const isPlayingNow = useMemo(() => {
    if (!schedule) return false;
    return isCurrentlyBroadcasting(schedule);
  }, [schedule]);

  const toggleStatus = async () => {
    if (!schedule) return;
    setActionLoading(true);
    try {
      const nextStatus = schedule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      const updated = await NexoraService.schedules.toggleStatus(schedule.id, nextStatus);
      setSchedule(updated);
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const duplicateSchedule = async () => {
    if (!schedule) return null;
    setActionLoading(true);
    try {
      return await NexoraService.schedules.duplicate(schedule.id);
    } catch (error) {
      console.error('Error duplicating:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSchedule = async () => {
    if (!schedule) return;
    setActionLoading(true);
    try {
      return await NexoraService.schedules.delete([schedule.id]);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    schedule,
    playlist,
    displays,
    occurrences,
    isPlayingNow,
    conflictResult,
    loading,
    actionLoading,
    reload: loadData,
    toggleStatus,
    duplicateSchedule,
    deleteSchedule,
  };
}
