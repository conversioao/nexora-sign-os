import { Schedule, ScheduleConflict, ConflictResult, DayOfWeek } from '../../../types/domain';
import { DAY_SHORT_LABELS } from '../constants/schedulingConstants';

/**
 * Utility to convert "HH:mm" to integer minutes from 00:00 (e.g. "08:30" -> 510)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Checks if two time intervals [startA, endA) and [startB, endB) overlap.
 * Assumes times within the same 24-hour cycle.
 */
export function isTimeRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);

  // If a time ends earlier or equal to another starting, no overlap
  return !(minEndA <= minStartB || minStartA >= minEndB);
}

/**
 * Checks if two date ranges [startDateA, endDateA] and [startDateB, endDateB] overlap.
 */
export function isDateRangeOverlapping(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  if (!startA || !endA || !startB || !endB) return false;
  return !(endA < startB || startA > endB);
}

/**
 * Checks if two schedules have overlapping days of the week.
 */
export function getOverlappingDays(daysA: DayOfWeek[], daysB: DayOfWeek[]): DayOfWeek[] {
  const setB = new Set(daysB);
  return daysA.filter((d) => setB.has(d));
}

/**
 * Checks if two schedules have overlapping display IDs.
 */
export function getOverlappingDisplays(displaysA: string[], displaysB: string[]): string[] {
  const setB = new Set(displaysB);
  return displaysA.filter((d) => setB.has(d));
}

/**
 * Detailed conflict detector between target schedule and candidate schedule.
 */
export function checkScheduleOverlap(
  scheduleA: Schedule,
  scheduleB: Schedule,
  displayNamesMap?: Map<string, string>
): ScheduleConflict | null {
  // Same schedule, or one of them is draft/paused/expired
  if (scheduleA.id === scheduleB.id) return null;
  if (scheduleB.status === 'DRAFT' || scheduleB.status === 'PAUSED' || scheduleB.status === 'EXPIRED') {
    return null;
  }

  // 1. Overlapping displays
  const commonDisplays = getOverlappingDisplays(scheduleA.displayIds || [], scheduleB.displayIds || []);
  if (commonDisplays.length === 0) return null;

  // 2. Overlapping date ranges
  const dateOverlap = isDateRangeOverlapping(
    scheduleA.startDate,
    scheduleA.endDate,
    scheduleB.startDate,
    scheduleB.endDate
  );
  if (!dateOverlap) return null;

  // 3. Overlapping days of week
  const commonDays = getOverlappingDays(scheduleA.daysOfWeek || [], scheduleB.daysOfWeek || []);
  if (commonDays.length === 0) return null;

  // 4. Overlapping time intervals
  const timeOverlap = isTimeRangeOverlapping(
    scheduleA.startTime,
    scheduleA.endTime,
    scheduleB.startTime,
    scheduleB.endTime
  );
  if (!timeOverlap) return null;

  // Conflict confirmed!
  const formattedDays = commonDays.map((d) => DAY_SHORT_LABELS[d] || d).join(', ');
  const displayNames = commonDisplays.map((id) => displayNamesMap?.get(id) || id);

  const message = `Sobreposição com "${scheduleB.name}" (${scheduleB.code}) em ${
    commonDisplays.length
  } display(s) [${formattedDays}], entre ${scheduleB.startTime} e ${scheduleB.endTime}.`;

  return {
    conflictingScheduleId: scheduleB.id,
    conflictingScheduleCode: scheduleB.code,
    conflictingScheduleName: scheduleB.name,
    conflictingSchedulePriority: scheduleB.priority,
    overlappingDisplayIds: commonDisplays,
    overlappingDisplayNames: displayNames,
    overlappingDays: commonDays,
    timeRangeA: `${scheduleA.startTime} — ${scheduleA.endTime}`,
    timeRangeB: `${scheduleB.startTime} — ${scheduleB.endTime}`,
    dateRangeA: `${scheduleA.startDate} a ${scheduleA.endDate}`,
    dateRangeB: `${scheduleB.startDate} a ${scheduleB.endDate}`,
    message,
  };
}

/**
 * Analyzes a schedule against a list of existing schedules in the network.
 */
export function detectConflicts(
  targetSchedule: Schedule,
  allSchedules: Schedule[],
  displayNamesMap?: Map<string, string>
): ConflictResult {
  if (!targetSchedule || !allSchedules || allSchedules.length === 0) {
    return { hasConflict: false, conflicts: [] };
  }

  const conflicts: ScheduleConflict[] = [];

  for (const existing of allSchedules) {
    const conflict = checkScheduleOverlap(targetSchedule, existing, displayNamesMap);
    if (conflict) {
      conflicts.push(conflict);
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * Scans all active schedules in the repository to produce a map of conflicts.
 */
export function getAllSystemConflicts(
  schedules: Schedule[],
  displayNamesMap?: Map<string, string>
): Map<string, ScheduleConflict[]> {
  const conflictMap = new Map<string, ScheduleConflict[]>();

  for (let i = 0; i < schedules.length; i++) {
    const a = schedules[i];
    if (a.status === 'DRAFT' || a.status === 'PAUSED' || a.status === 'EXPIRED') continue;

    for (let j = i + 1; j < schedules.length; j++) {
      const b = schedules[j];
      if (b.status === 'DRAFT' || b.status === 'PAUSED' || b.status === 'EXPIRED') continue;

      const conflictAtoB = checkScheduleOverlap(a, b, displayNamesMap);
      if (conflictAtoB) {
        // Record for A
        const listA = conflictMap.get(a.id) || [];
        listA.push(conflictAtoB);
        conflictMap.set(a.id, listA);

        // Record reverse for B
        const conflictBtoA = checkScheduleOverlap(b, a, displayNamesMap);
        if (conflictBtoA) {
          const listB = conflictMap.get(b.id) || [];
          listB.push(conflictBtoA);
          conflictMap.set(b.id, listB);
        }
      }
    }
  }

  return conflictMap;
}
