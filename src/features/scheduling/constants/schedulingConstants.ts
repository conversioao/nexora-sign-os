import { DayOfWeek, SchedulePriority, ScheduleRecurrence, ScheduleStatus } from '../../../types/domain';

export const DEFAULT_TIMEZONE = 'Africa/Luanda';

export interface TimezoneOption {
  value: string;
  label: string;
  utcOffset: string;
}

export const SUPPORTED_TIMEZONES: TimezoneOption[] = [
  {
    value: 'Africa/Luanda',
    label: 'Luanda, Angola (WAT)',
    utcOffset: 'UTC+1',
  },
  {
    value: 'Africa/Johannesburg',
    label: 'Joanesburgo, África do Sul (SAST)',
    utcOffset: 'UTC+2',
  },
  {
    value: 'Europe/Lisbon',
    label: 'Lisboa, Portugal (WET/WEST)',
    utcOffset: 'UTC+0 / UTC+1',
  },
  {
    value: 'America/Sao_Paulo',
    label: 'São Paulo, Brasil (BRT)',
    utcOffset: 'UTC-3',
  },
  {
    value: 'UTC',
    label: 'Tempo Universal Coordenado (UTC)',
    utcOffset: 'UTC+0',
  },
];

export const DAYS_OF_WEEK: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export const DAY_SHORT_LABELS: Record<DayOfWeek, string> = {
  MON: 'SEG',
  TUE: 'TER',
  WED: 'QUA',
  THU: 'QUI',
  FRI: 'SEX',
  SAT: 'SÁB',
  SUN: 'DOM',
};

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
  MON: 'Segunda-feira',
  TUE: 'Terça-feira',
  WED: 'Quarta-feira',
  THU: 'Quinta-feira',
  FRI: 'Sexta-feira',
  SAT: 'Sábado',
  SUN: 'Domingo',
};

export const SCHEDULE_PRIORITY_LABELS: Record<SchedulePriority, string> = {
  LOW: 'Baixa',
  NORMAL: 'Normal',
  HIGH: 'Alta',
  URGENT: 'Urgente',
};

export const SCHEDULE_PRIORITY_CONFIG: Record<
  SchedulePriority,
  {
    label: string;
    badgeVariant: 'neutral' | 'blue' | 'warning' | 'danger';
    bgGradient: string;
    borderColor: string;
    textColor: string;
    chipBg: string;
  }
> = {
  LOW: {
    label: 'Baixa',
    badgeVariant: 'neutral',
    bgGradient: 'from-slate-800 to-slate-900',
    borderColor: 'border-slate-700',
    textColor: 'text-slate-400',
    chipBg: 'bg-slate-800 text-slate-300',
  },
  NORMAL: {
    label: 'Normal',
    badgeVariant: 'blue',
    bgGradient: 'from-blue-900/60 to-slate-900',
    borderColor: 'border-blue-700/50',
    textColor: 'text-[#38BDF8]',
    chipBg: 'bg-[#2563EB]/20 text-[#38BDF8]',
  },
  HIGH: {
    label: 'Alta',
    badgeVariant: 'warning',
    bgGradient: 'from-amber-950/60 to-slate-900',
    borderColor: 'border-amber-700/50',
    textColor: 'text-amber-400',
    chipBg: 'bg-amber-500/20 text-amber-300',
  },
  URGENT: {
    label: 'Urgente',
    badgeVariant: 'danger',
    bgGradient: 'from-rose-950/70 to-slate-900',
    borderColor: 'border-rose-700/60',
    textColor: 'text-rose-400',
    chipBg: 'bg-rose-500/20 text-rose-300',
  },
};

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  EXPIRED: 'Expirado',
  SCHEDULED: 'Agendado',
  CONFLICT: 'Em Conflito',
};

export const SCHEDULE_STATUS_VARIANTS: Record<
  ScheduleStatus,
  'neutral' | 'success' | 'warning' | 'danger' | 'info'
> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  PAUSED: 'warning',
  EXPIRED: 'neutral',
  SCHEDULED: 'info',
  CONFLICT: 'danger',
};

export const SCHEDULE_RECURRENCE_LABELS: Record<ScheduleRecurrence, string> = {
  ONCE: 'Data Única / Evento',
  DAILY: 'Diariamente',
  WEEKLY: 'Semanal',
  CUSTOM: 'Personalizada',
};
