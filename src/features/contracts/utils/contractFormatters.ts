import { ContractStatus, ContractType, SignatureStatus } from '../../../types/contracts';

/**
 * Format currency in AOA (Kwanzas)
 */
export function formatCurrencyAOA(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 Kz';
  return (
    new Intl.NumberFormat('pt-AO', {
      maximumFractionDigits: 0,
    }).format(amount) + ' Kz'
  );
}

/**
 * Format ISO Date to PT-AO format
 */
export function formatContractDate(dateStr?: string, includeTime = false): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    if (includeTime) {
      return new Intl.DateTimeFormat('pt-AO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    }
    return new Intl.DateTimeFormat('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Calculate days remaining until expiry
 */
export function getDaysUntilExpiry(endDateStr?: string): { days: number; isExpired: boolean; isNear: boolean } {
  if (!endDateStr) return { days: 0, isExpired: false, isNear: false };
  const now = new Date();
  const end = new Date(endDateStr);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return {
    days: diffDays,
    isExpired: diffDays < 0,
    isNear: diffDays >= 0 && diffDays <= 30,
  };
}

/**
 * Label and styling for Contract Status
 */
export function getContractStatusConfig(status: ContractStatus) {
  switch (status) {
    case 'ACTIVE':
      return {
        label: 'Ativo',
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'SIGNED':
      return {
        label: 'Assinado',
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
        dot: 'bg-cyan-400',
      };
    case 'PENDING_SIGNATURE':
      return {
        label: 'Pendente de Assinatura',
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'PARTIALLY_SIGNED':
      return {
        label: 'Parcialmente Assinado',
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
        dot: 'bg-blue-400',
      };
    case 'PENDING_APPROVAL':
      return {
        label: 'Em Aprovação',
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/30',
        dot: 'bg-purple-400',
      };
    case 'DRAFT':
      return {
        label: 'Rascunho',
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: 'bg-slate-400',
      };
    case 'EXPIRED':
      return {
        label: 'Expirado',
        bg: 'bg-orange-500/10',
        text: 'text-orange-400',
        border: 'border-orange-500/30',
        dot: 'bg-orange-400',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelado',
        bg: 'bg-red-500/10',
        text: 'text-red-400',
        border: 'border-red-500/30',
        dot: 'bg-red-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-500/10',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: 'bg-slate-400',
      };
  }
}

/**
 * Label and styling for Contract Type
 */
export function getContractTypeConfig(type: ContractType) {
  switch (type) {
    case 'DISPLAY_RENTAL_AND_SAAS':
      return {
        label: 'Aluguer + SaaS',
        description: 'Locação de Displays com Licenciamento da Plataforma Cloud',
        badgeColor: 'bg-[#3B82F6]/10 text-[#60A5FA] border-[#3B82F6]/30',
        iconName: 'Layers',
      };
    case 'DISPLAY_RENTAL':
      return {
        label: 'Aluguer Hardware',
        description: 'Locação Mensal de Totens e Painéis',
        badgeColor: 'bg-[#06B6D4]/10 text-[#22D3EE] border-[#06B6D4]/30',
        iconName: 'Tv',
      };
    case 'DISPLAY_SALE':
      return {
        label: 'Venda de Hardware',
        description: 'Transmissão Definitiva de Propriedade',
        badgeColor: 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/30',
        iconName: 'ShoppingCart',
      };
    case 'SAAS_SUBSCRIPTION':
      return {
        label: 'Subscrição SaaS',
        description: 'Licenciamento da Plataforma Cloud (BYOD)',
        badgeColor: 'bg-[#8B5CF6]/10 text-[#A78BFA] border-[#8B5CF6]/30',
        iconName: 'Cloud',
      };
    case 'EVENT_RENTAL':
      return {
        label: 'Aluguer para Evento',
        description: 'Locação Temporária para Feiras e Exposições',
        badgeColor: 'bg-[#F59E0B]/10 text-[#FBBF24] border-[#F59E0B]/30',
        iconName: 'Calendar',
      };
    case 'MAINTENANCE':
      return {
        label: 'Manutenção & SLA',
        description: 'Acordo de Nível de Serviço e Assistência Técnica',
        badgeColor: 'bg-[#EC4899]/10 text-[#F472B6] border-[#EC4899]/30',
        iconName: 'Wrench',
      };
    case 'SERVICE_AGREEMENT':
      return {
        label: 'Prestação de Serviços',
        description: 'Criação de Conteúdo e Operação Técnica Especializada',
        badgeColor: 'bg-[#14B8A6]/10 text-[#2DD4BF] border-[#14B8A6]/30',
        iconName: 'Briefcase',
      };
    case 'CUSTOM':
      return {
        label: 'Customizado',
        description: 'Contrato Personalizado Multilateral',
        badgeColor: 'bg-[#64748B]/10 text-[#94A3B8] border-[#64748B]/30',
        iconName: 'FileText',
      };
    default:
      return {
        label: type,
        description: '',
        badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        iconName: 'FileText',
      };
  }
}

/**
 * Signature Status Config
 */
export function getSignatureStatusConfig(status: SignatureStatus) {
  switch (status) {
    case 'SIGNED':
      return {
        label: 'Assinado Eletronicamente',
        bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
      };
    case 'PENDING':
      return {
        label: 'Aguardando Assinatura',
        bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
      };
    case 'DECLINED':
      return {
        label: 'Recusado pelo Signatário',
        bg: 'bg-red-500/10 text-red-400 border-red-500/30',
        dot: 'bg-red-400',
      };
    case 'NOT_REQUIRED':
    default:
      return {
        label: 'Não Requer Assinatura',
        bg: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
        dot: 'bg-slate-400',
      };
  }
}
