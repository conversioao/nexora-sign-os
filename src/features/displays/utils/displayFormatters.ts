import { BadgeVariant, StatusType } from '../../../types/theme';
import {
  DeviceType,
  DisplayOrientation,
  DisplayStatus,
  DisplayCommercialStatus,
  DisplayCommercialModel,
  DisplayOwnershipType,
  DisplayAdvertisingStatus,
  DisplaySaaSStatus,
} from '../../../types/domain';

/**
 * Formats a heartbeat timestamp or string into a relative human-readable label
 * with status indicators for stale/offline states.
 */
export function formatHeartbeatTime(heartbeat: string): {
  label: string;
  isRecent: boolean;
  isStale: boolean;
  isCritical: boolean;
} {
  if (!heartbeat) {
    return { label: 'Sem registro de heartbeat', isRecent: false, isStale: true, isCritical: true };
  }

  // If it's already a descriptive PT string, check contents
  if (heartbeat.startsWith('Há') || heartbeat.startsWith('Sem conexão')) {
    const isStale = heartbeat.includes('horas') || heartbeat.includes('Sem conexão') || heartbeat.includes('dias');
    const isCritical = heartbeat.includes('4h') || heartbeat.includes('Sem conexão');
    return {
      label: heartbeat,
      isRecent: !isStale,
      isStale,
      isCritical,
    };
  }

  // Try parsing ISO date
  const date = new Date(heartbeat);
  if (isNaN(date.getTime())) {
    return { label: heartbeat, isRecent: true, isStale: false, isCritical: false };
  }

  const now = new Date();
  const diffSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffSeconds < 20) {
    return { label: 'há poucos segundos', isRecent: true, isStale: false, isCritical: false };
  }
  if (diffSeconds < 60) {
    return { label: `há ${diffSeconds}s`, isRecent: true, isStale: false, isCritical: false };
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    const isStale = diffMinutes > 15;
    return { label: `há ${diffMinutes} min`, isRecent: !isStale, isStale, isCritical: false };
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return { label: `há ${diffHours}h`, isRecent: false, isStale: true, isCritical: diffHours >= 3 };
  }

  const diffDays = Math.floor(diffHours / 24);
  return { label: `sem sinal há ${diffDays}d`, isRecent: false, isStale: true, isCritical: true };
}

/**
 * Returns user-friendly label for DeviceType
 */
export function formatDeviceTypeLabel(type: DeviceType): string {
  const map: Record<DeviceType, string> = {
    ANDROID_TV: 'Android TV',
    TV_BOX: 'Android TV Box',
    SMART_TV: 'Smart TV Indoor',
    TOTEM: 'Totem Digital',
    VIDEO_WALL: 'Video Wall',
  };
  return map[type] || type;
}

/**
 * Returns user-friendly label for DisplayOrientation
 */
export function formatOrientationLabel(orientation: DisplayOrientation): string {
  if (orientation === 'LANDSCAPE') return 'Horizontal (16:9)';
  if (orientation === 'PORTRAIT') return 'Vertical Horário (9:16)';
  if (orientation === 'LANDSCAPE_REVERSED') return 'Horizontal Invertido (16:9 ↺)';
  if (orientation === 'PORTRAIT_REVERSED') return 'Vertical Anti-Horário (9:16 ↺)';
  return orientation;
}

/**
 * Map DisplayStatus to StatusType / BadgeVariant
 */
export function mapDisplayStatusToVariant(status: DisplayStatus): {
  variant: BadgeVariant;
  statusType: StatusType;
  label: string;
} {
  switch (status) {
    case 'ONLINE':
      return { variant: 'online', statusType: 'online', label: 'Online' };
    case 'OFFLINE':
      return { variant: 'offline', statusType: 'offline', label: 'Offline' };
    case 'MAINTENANCE':
      return { variant: 'maintenance', statusType: 'maintenance', label: 'Manutenção' };
    case 'WARNING':
      return { variant: 'warning', statusType: 'warning', label: 'Alerta' };
    case 'SYNCING':
      return { variant: 'syncing', statusType: 'syncing', label: 'Sincronizando' };
    case 'PLAYING':
      return { variant: 'playing', statusType: 'playing', label: 'Em Exibição' };
    case 'PAUSED':
      return { variant: 'paused', statusType: 'paused', label: 'Pausado' };
    default:
      return { variant: 'neutral', statusType: 'info', label: status };
  }
}

/**
 * Commercial Profile Formatters
 */
export function formatCommercialStatus(status?: DisplayCommercialStatus): {
  label: string;
  variant: BadgeVariant;
  colorClass: string;
} {
  switch (status) {
    case 'INVENTORY':
      return { label: 'Disponível (Inventário)', variant: 'live', colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    case 'ACTIVE':
      return { label: 'Ativo em Operação', variant: 'active', colorClass: 'text-sky-400 bg-sky-500/10 border-sky-500/30' };
    case 'RESERVED':
      return { label: 'Reservado', variant: 'pending', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    case 'INSTALLATION_PENDING':
      return { label: 'Instalação Pendente', variant: 'warning', colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    case 'SUSPENDED':
      return { label: 'Suspenso', variant: 'error', colorClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    case 'MAINTENANCE':
      return { label: 'Manutenção Comercial', variant: 'maintenance', colorClass: 'text-orange-400 bg-orange-500/10 border-orange-500/30' };
    case 'RETIRED':
      return { label: 'Descomissionado', variant: 'inactive', colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
    default:
      return { label: 'Não Definido', variant: 'neutral', colorClass: 'text-slate-400 bg-slate-500/10 border-slate-500/30' };
  }
}

export function formatCommercialModel(model?: DisplayCommercialModel): {
  label: string;
  shortLabel: string;
  badgeClass: string;
} {
  switch (model) {
    case 'RENTAL':
      return { label: 'Aluguer Mensal (Hardware + SaaS)', shortLabel: 'Aluguer', badgeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/30' };
    case 'SALE':
      return { label: 'Venda de Hardware + SaaS', shortLabel: 'Venda HW', badgeClass: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' };
    case 'SUBSCRIPTION':
      return { label: 'Apenas Subscrição SaaS (BYOD)', shortLabel: 'SaaS Puro', badgeClass: 'bg-teal-500/15 text-teal-400 border-teal-500/30' };
    case 'EVENT_RENTAL':
      return { label: 'Aluguer Temporário de Evento', shortLabel: 'Evento', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    default:
      return { label: 'Aluguer Mensal', shortLabel: 'Aluguer', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  }
}

export function formatOwnershipType(type?: DisplayOwnershipType): {
  label: string;
  badgeClass: string;
} {
  switch (type) {
    case 'NEXORA_OWNED':
      return { label: 'Propriedade Nexora', badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
    case 'CLIENT_OWNED':
      return { label: 'Propriedade do Cliente', badgeClass: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
    case 'PARTNER_OWNED':
      return { label: 'Parceiro / Venue', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    default:
      return { label: 'Propriedade Nexora', badgeClass: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
  }
}

export function formatAdvertisingStatus(status?: DisplayAdvertisingStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'AVAILABLE':
      return { label: 'Disponível p/ Mídia Externa', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    case 'NOT_AVAILABLE':
      return { label: 'Uso 100% Exclusivo / Privado', badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
    case 'RESERVED':
      return { label: 'Espaço Publicitário Reservado', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'ACTIVE_CAMPAIGN':
      return { label: 'Campanha de Anunciante Ativa', badgeClass: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' };
    default:
      return { label: 'Uso Privado', badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
  }
}

export function formatSaaSStatus(status?: DisplaySaaSStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'ACTIVE':
      return { label: 'SaaS Ativo', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    case 'TRIAL':
      return { label: 'Período de Testes (Trial)', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'PAST_DUE':
      return { label: 'SaaS com Pagamento Pendente', badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
    case 'SUSPENDED':
      return { label: 'SaaS Suspenso', badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
    case 'CANCELLED':
      return { label: 'SaaS Cancelado', badgeClass: 'bg-slate-500/15 text-slate-400 border-slate-500/30' };
    default:
      return { label: 'Ativo', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
  }
}

/**
 * Format currency in Angolan Kwanzas (Kz)
 */
export function formatCurrencyKz(value: number): string {
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('AOA', 'Kz');
}

