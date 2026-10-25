import { DayOfWeek, Schedule } from '../../../types/domain';
import { DAY_SHORT_LABELS, DAY_FULL_LABELS, DAYS_OF_WEEK } from '../constants/schedulingConstants';
import { timeToMinutes } from './scheduleConflictService';

export interface ScheduleOccurrence {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  dayLabel: string;
  formattedDate: string; // e.g. "26 Ago 2026"
  startTime: string;
  endTime: string;
  isToday: boolean;
  isTomorrow: boolean;
  status: 'PAST' | 'NOW' | 'UPCOMING';
}

/**
 * Returns a human-friendly summary text for a list of days of the week.
 * Example: "Segunda a Sexta", "Todos os Dias", "Finais de Semana", "Seg, Qua, Sex"
 */
export function formatDaysSummary(days: DayOfWeek[]): string {
  if (!days || days.length === 0) return 'Nenhum dia selecionado';
  if (days.length === 7) return 'Todos os Dias (Seg a Dom)';

  const set = new Set(days);
  const isWeekdays =
    days.length === 5 &&
    set.has('MON') &&
    set.has('TUE') &&
    set.has('WED') &&
    set.has('THU') &&
    set.has('FRI');

  if (isWeekdays) return 'Segunda a Sexta';

  const isWeekend = days.length === 2 && set.has('SAT') && set.has('SUN');
  if (isWeekend) return 'Finais de Semana (Sáb e Dom)';

  // Return formatted list preserving standard order MON..SUN
  const ordered = DAYS_OF_WEEK.filter((d) => set.has(d));
  return ordered.map((d) => DAY_SHORT_LABELS[d]).join(', ');
}

/**
 * Map JS getDay() (0 = Sun, 1 = Mon, ..., 6 = Sat) to DayOfWeek
 */
export function jsDayToDayOfWeek(jsDay: number): DayOfWeek {
  switch (jsDay) {
    case 0:
      return 'SUN';
    case 1:
      return 'MON';
    case 2:
      return 'TUE';
    case 3:
      return 'WED';
    case 4:
      return 'THU';
    case 5:
      return 'FRI';
    case 6:
      return 'SAT';
    default:
      return 'MON';
  }
}

/**
 * Derives the next N chronological execution windows for a given schedule.
 */
export function getNextOccurrences(schedule: Schedule, count = 5): ScheduleOccurrence[] {
  if (!schedule || !schedule.daysOfWeek || schedule.daysOfWeek.length === 0) {
    return [];
  }

  const occurrences: ScheduleOccurrence[] = [];
  const daysSet = new Set(schedule.daysOfWeek);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startValidDate = new Date(schedule.startDate + 'T00:00:00');
  const endValidDate = new Date(schedule.endDate + 'T23:59:59');

  // Start checking from max(today, startDate)
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (cursor < startValidDate) {
    cursor = new Date(startValidDate);
  }

  // Iterate up to 60 days in the future to find matching occurrences
  let safetyLimit = 60;
  while (occurrences.length < count && safetyLimit > 0) {
    if (cursor > endValidDate) break;

    const dateStr = cursor.toISOString().split('T')[0];
    const jsDay = cursor.getDay();
    const dayOfWeek = jsDayToDayOfWeek(jsDay);

    if (daysSet.has(dayOfWeek)) {
      const isToday = dateStr === todayStr;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const isTomorrow = dateStr === tomorrowStr;

      let status: 'PAST' | 'NOW' | 'UPCOMING' = 'UPCOMING';
      if (isToday) {
        const startMin = timeToMinutes(schedule.startTime);
        const endMin = timeToMinutes(schedule.endTime);

        if (currentMinutes >= startMin && currentMinutes < endMin) {
          status = 'NOW';
        } else if (currentMinutes >= endMin) {
          status = 'PAST';
        }
      }

      // Format date in PT-AO/PT-BR
      const dayNum = cursor.getDate();
      const monthShort = cursor.toLocaleDateString('pt-PT', { month: 'short' }).replace('.', '');
      const year = cursor.getFullYear();
      const formattedDate = `${dayNum} ${monthShort} ${year}`;

      occurrences.push({
        id: `${schedule.id}-${dateStr}`,
        date: dateStr,
        dayOfWeek,
        dayLabel: DAY_FULL_LABELS[dayOfWeek],
        formattedDate,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isToday,
        isTomorrow,
        status,
      });
    }

    // Increment 1 day
    cursor.setDate(cursor.getDate() + 1);
    safetyLimit--;
  }

  return occurrences;
}

/**
 * Checks if schedule is currently in its active broadcast window right now.
 */
export function isCurrentlyBroadcasting(schedule: Schedule): boolean {
  if (schedule.status !== 'ACTIVE') return false;

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (todayStr < schedule.startDate || todayStr > schedule.endDate) {
    return false;
  }

  const currentDay = jsDayToDayOfWeek(now.getDay());
  if (!schedule.daysOfWeek.includes(currentDay)) {
    return false;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMin = timeToMinutes(schedule.startTime);
  const endMin = timeToMinutes(schedule.endTime);

  return currentMinutes >= startMin && currentMinutes < endMin;
}
