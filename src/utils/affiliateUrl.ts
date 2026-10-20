/**
 * Utilitário central de links e domínios do Sistema de Afiliados Nexora.
 * 
 * Domínio oficial de produção: https://www.nexorasign.ao (e nexorasign.ao)
 * 
 * Em ambiente de desenvolvimento local (localhost / 127.0.0.1 / IPs locais):
 * Gera os links apontando obrigatoriamente para o domínio oficial de produção
 * (https://www.nexorasign.ao) para que links copiados, gerados em QR Code ou partilhados
 * via WhatsApp funcionem nos dispositivos dos clientes finais em vez de falharem com localhost.
 * 
 * Em ambiente de produção:
 * Utiliza o domínio real (origin) onde a aplicação está a rodar (ex: https://www.nexorasign.ao ou https://nexorasign.ao).
 */

export const OFFICIAL_PRODUCTION_DOMAIN = 'https://www.nexorasign.ao';

export function getAffiliateBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const hostname = (window.location.hostname || '').toLowerCase();

    // Se for localhost ou IP privado/local, força o domínio de produção oficial
    const isLocal =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('172.') ||
      hostname.endsWith('.local');

    if (isLocal) {
      return OFFICIAL_PRODUCTION_DOMAIN;
    }

    // Se estiver no domínio oficial ou subdomínio (ex: www.nexorasign.ao ou nexorasign.ao)
    if (hostname.includes('nexorasign.ao')) {
      return window.location.origin;
    }

    // Se estiver num deploy da Vercel ou domínio de staging público
    return window.location.origin;
  }

  return OFFICIAL_PRODUCTION_DOMAIN;
}

/**
 * Monta o link de afiliação completo com base no tipo de público-alvo
 */
export function buildAffiliateReferralLink(
  referralCode: string,
  type?: 'ALL' | 'CLIENT' | 'ADVERTISER' | 'DISPLAY_OWNER'
): string {
  const base = getAffiliateBaseUrl();
  const code = (referralCode || '').trim();
  if (!code) return base;

  if (!type || type === 'ALL') {
    return `${base}/?ref=${encodeURIComponent(code)}`;
  }
  return `${base}/?ref=${encodeURIComponent(code)}&type=${type.toLowerCase()}`;
}
