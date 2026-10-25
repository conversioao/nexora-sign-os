/**
 * SaaS formatting utilities for Nexora
 * Prices in Angolan Kwanzas (Kz / AOA)
 */

export function formatKz(amount: number): string {
  if (isNaN(amount) || amount === undefined || amount === null) return '0 Kz';
  return new Intl.NumberFormat('pt-AO', {
    style: 'currency',
    currency: 'AOA',
    maximumFractionDigits: 0,
  }).format(amount).replace('AOA', 'Kz');
}

export function formatInterval(interval: string): string {
  switch (interval) {
    case 'MONTHLY':
      return '/mês';
    case 'QUARTERLY':
      return '/trimestre';
    case 'YEARLY':
      return '/ano';
    case 'CUSTOM':
      return ' (personalizado)';
    default:
      return '';
  }
}

export function formatIntervalFull(interval: string): string {
  switch (interval) {
    case 'MONTHLY':
      return 'Mensal';
    case 'QUARTERLY':
      return 'Trimestral';
    case 'YEARLY':
      return 'Anual';
    case 'CUSTOM':
      return 'Personalizado';
    default:
      return interval;
  }
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-AO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatCommercialModel(model?: string): { label: string; description: string; short: string } {
  switch (model) {
    case 'RENTAL_SAAS':
      return {
        label: 'Aluguel Nexora + SaaS',
        description: 'Hardware alugado da Nexora com licença e manutenção inclusas',
        short: 'Aluguel + SaaS',
      };
    case 'SALE_SAAS':
      return {
        label: 'Hardware Adquirido + SaaS',
        description: 'Equipamento próprio comprado da Nexora com licença ativa',
        short: 'Venda + SaaS',
      };
    case 'SUBSCRIPTION_ONLY':
      return {
        label: 'BYOD (Hardware Próprio)',
        description: 'Licenciamento de software em terminais próprios do cliente',
        short: 'BYOD / SaaS Only',
      };
    default:
      return {
        label: 'Licença SaaS',
        description: 'Subscrição padrão de software',
        short: 'SaaS',
      };
  }
}
