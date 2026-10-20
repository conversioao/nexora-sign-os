import {
  Affiliate,
  AffiliateSettings,
  AffiliateReferral,
  AffiliateCommission,
  AffiliatePayoutRequest,
  AffiliateDashboardKpi,
  AffiliateStatus,
} from '../types/affiliate';
import { getApiUrl } from '../config/api';

function getSessionHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem('nexora_mock_session_state');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.currentOrganization?.id) {
          headers['x-organization-id'] = parsed.currentOrganization.id;
        }
        if (parsed.currentUser?.id) {
          headers['x-user-id'] = parsed.currentUser.id;
        }
        if (parsed.currentUser?.email) {
          headers['x-user-email'] = parsed.currentUser.email;
        }
      }
    }
  } catch {}
  return headers;
}

export interface IAffiliateRepository {
  getSettings(): Promise<AffiliateSettings>;
  updateSettings(data: Partial<AffiliateSettings>): Promise<AffiliateSettings>;
  getMe(): Promise<Affiliate | null>;
  getDashboard(): Promise<AffiliateDashboardKpi>;
  getReferrals(): Promise<AffiliateReferral[]>;
  getCommissions(): Promise<AffiliateCommission[]>;
  getPayouts(): Promise<AffiliatePayoutRequest[]>;
  requestPayout(data: {
    amountKz: number;
    bankName: string;
    accountHolder: string;
    iban: string;
  }): Promise<AffiliatePayoutRequest>;
  updateBankAccount(data: {
    bankName: string;
    accountHolder: string;
    iban: string;
  }): Promise<Affiliate>;
  // Admin Methods
  getAllAffiliates(): Promise<Affiliate[]>;
  updateAffiliateRates(
    id: string,
    rates: {
      customClientSaasPct?: number | null;
      customAdvertiserCampaignPct?: number | null;
      customDisplayOwnerPct?: number | null;
    }
  ): Promise<Affiliate>;
  updateAffiliateStatus(id: string, status: AffiliateStatus): Promise<Affiliate>;
  getAllCommissions(): Promise<AffiliateCommission[]>;
  approveCommission(id: string): Promise<AffiliateCommission>;
  getAllPayouts(): Promise<AffiliatePayoutRequest[]>;
  settlePayout(id: string, notes?: string, receiptUrl?: string): Promise<AffiliatePayoutRequest>;
}

class ApiAffiliateRepository implements IAffiliateRepository {
  async getSettings(): Promise<AffiliateSettings> {
    try {
      const res = await fetch(getApiUrl('/api/admin/affiliates/settings'));
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/admin/affiliates/settings, using defaults', err);
    }
    return {
      client_saas_commission_pct: 10.0,
      advertiser_campaign_commission_pct: 7.0,
      display_owner_commission_pct: 8.0,
      display_ad_revshare_commission_pct: 3.0,
      minimum_payout_amount_kz: 25000,
    };
  }

  async updateSettings(data: Partial<AffiliateSettings>): Promise<AffiliateSettings> {
    const res = await fetch(getApiUrl('/api/admin/affiliates/settings'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Falha ao atualizar percentagens de afiliados');
    return await res.json();
  }

  async getMe(): Promise<Affiliate | null> {
    try {
      const res = await fetch(getApiUrl('/api/affiliates/me'), {
        headers: getSessionHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/affiliates/me', err);
    }
    return null;
  }

  async getDashboard(): Promise<AffiliateDashboardKpi> {
    try {
      const res = await fetch(getApiUrl('/api/affiliates/me/dashboard'), {
        headers: getSessionHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/affiliates/me/dashboard', err);
    }
    return {
      totalEarnedKz: 0,
      pendingBalanceKz: 0,
      totalPaidKz: 0,
      totalRevenueGeneratedKz: 0,
      totalReferralsCount: 0,
      activeClientsCount: 0,
      activeAdvertisersCount: 0,
      activeDisplaysCount: 0,
      monthlyRevenueKz: 0,
      recentCommissions: [],
      referrals: [],
    };
  }

  async getReferrals(): Promise<AffiliateReferral[]> {
    try {
      const res = await fetch(getApiUrl('/api/affiliates/me/referrals'), {
        headers: getSessionHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/affiliates/me/referrals', err);
    }
    return [];
  }

  async getCommissions(): Promise<AffiliateCommission[]> {
    try {
      const res = await fetch(getApiUrl('/api/affiliates/me/commissions'), {
        headers: getSessionHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/affiliates/me/commissions', err);
    }
    return [];
  }

  async getPayouts(): Promise<AffiliatePayoutRequest[]> {
    try {
      const res = await fetch(getApiUrl('/api/affiliates/me/payouts'), {
        headers: getSessionHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/affiliates/me/payouts', err);
    }
    return [];
  }

  async requestPayout(data: {
    amountKz: number;
    bankName: string;
    accountHolder: string;
    iban: string;
  }): Promise<AffiliatePayoutRequest> {
    const res = await fetch(getApiUrl('/api/affiliates/me/payout-request'), {
      method: 'POST',
      headers: getSessionHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Falha ao solicitar saque');
    }
    return await res.json();
  }

  async updateBankAccount(data: {
    bankName: string;
    accountHolder: string;
    iban: string;
  }): Promise<Affiliate> {
    const res = await fetch(getApiUrl('/api/affiliates/me/bank-account'), {
      method: 'PUT',
      headers: getSessionHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || err.message || 'Falha ao atualizar conta bancária');
    }
    return await res.json();
  }

  // Admin Methods
  async getAllAffiliates(): Promise<Affiliate[]> {
    try {
      const res = await fetch(getApiUrl('/api/admin/affiliates'));
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/admin/affiliates', err);
    }
    return [];
  }

  async updateAffiliateRates(
    id: string,
    rates: {
      customClientSaasPct?: number | null;
      customAdvertiserCampaignPct?: number | null;
      customDisplayOwnerPct?: number | null;
    }
  ): Promise<Affiliate> {
    const res = await fetch(getApiUrl(`/api/admin/affiliates/${id}/rates`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rates),
    });
    if (!res.ok) throw new Error('Falha ao atualizar taxas do afiliado');
    return await res.json();
  }

  async updateAffiliateStatus(id: string, status: AffiliateStatus): Promise<Affiliate> {
    const res = await fetch(getApiUrl(`/api/admin/affiliates/${id}/status`), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Falha ao atualizar status do afiliado');
    return await res.json();
  }

  async getAllCommissions(): Promise<AffiliateCommission[]> {
    try {
      const res = await fetch(getApiUrl('/api/admin/affiliates/commissions'));
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/admin/affiliates/commissions', err);
    }
    return [];
  }

  async approveCommission(id: string): Promise<AffiliateCommission> {
    const res = await fetch(getApiUrl(`/api/admin/affiliates/commissions/${id}/approve`), {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Falha ao aprovar comissão');
    return await res.json();
  }

  async getAllPayouts(): Promise<AffiliatePayoutRequest[]> {
    try {
      const res = await fetch(getApiUrl('/api/admin/affiliates/payouts'));
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Failed to fetch /api/admin/affiliates/payouts', err);
    }
    return [];
  }

  async settlePayout(id: string, notes?: string, receiptUrl?: string): Promise<AffiliatePayoutRequest> {
    const res = await fetch(getApiUrl(`/api/admin/affiliates/payouts/${id}/pay`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, receiptUrl }),
    });
    if (!res.ok) throw new Error('Falha ao liquidar pagamento de comissão');
    return await res.json();
  }
}

export const affiliateRepository = new ApiAffiliateRepository();
