import {
  AdvertisingCampaign,
  AdvertisingCampaignStatus,
  AdvertisingNetworkKPIs,
  AdvertiserDashboardMetrics,
} from '../types/advertising';
import {
  mockAdvertisingCampaigns,
  mockAdvertisingNetworkKPIs,
  mockAdvertiserMetrics,
} from '../data/mockAdvertisingData';

export interface CampaignFilters {
  organizationId?: string;
  advertiserId?: string;
  status?: AdvertisingCampaignStatus | 'ALL';
  search?: string;
}

export interface IAdvertisingCampaignRepository {
  getAll(filters?: CampaignFilters): Promise<AdvertisingCampaign[]>;
  getById(id: string): Promise<AdvertisingCampaign | null>;
  getByAdvertiserId(advertiserId: string): Promise<AdvertisingCampaign[]>;
  getByOrganizationId(organizationId: string): Promise<AdvertisingCampaign[]>;
  getKPIs(organizationId?: string): Promise<AdvertisingNetworkKPIs>;
  getAdvertiserMetrics(advertiserId?: string): Promise<AdvertiserDashboardMetrics>;
  create(data: Partial<AdvertisingCampaign>): Promise<AdvertisingCampaign>;
  update(id: string, data: Partial<AdvertisingCampaign>): Promise<AdvertisingCampaign>;
  updateStatus(id: string, status: AdvertisingCampaignStatus, notes?: string, actorName?: string): Promise<AdvertisingCampaign>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class MockAdvertisingCampaignRepository implements IAdvertisingCampaignRepository {
  private campaigns: AdvertisingCampaign[] = [...mockAdvertisingCampaigns];

  async getAll(filters?: CampaignFilters): Promise<AdvertisingCampaign[]> {
    // Try DB first
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const rows = await res.json();
        const dbCampaigns: AdvertisingCampaign[] = rows.map((c: any) => ({
          id: c.id,
          organizationId: c.organization_id || 'org-publicidade',
          advertiserId: c.advertiser_id || 'adv-001',
          advertiserName: c.advertiser_name || 'Anunciante',
          name: c.name,
          description: c.description || '',
          objective: c.objective || 'BRAND_AWARENESS',
          status: (c.status || 'DRAFT') as AdvertisingCampaignStatus,
          startDate: c.start_date,
          endDate: c.end_date,
          budget: parseFloat(c.budget) || 0,
          currency: 'AOA',
          createdAt: c.created_at,
          updatedAt: c.updated_at || c.created_at,
          dailyFrequency: c.daily_frequency || 6,
          slotDurationSeconds: c.slot_duration || 15,
          targetMunicipalities: [],
          estimatedImpressions: c.estimated_impressions || 0,
          estimatedReach: c.estimated_reach || 0,
          executedPlays: c.executed_plays || 0,
          targetPlays: c.target_plays || 0,
          completionRate: 0,
          uptimePercentage: 100,
          media_url: c.media_url,
          paymentReceiptUrl: c.payment_receipt_url || undefined,
          creatives: c.creatives ? (typeof c.creatives === 'string' ? JSON.parse(c.creatives) : c.creatives) : [],
          displays: c.displays ? (typeof c.displays === 'string' ? JSON.parse(c.displays) : c.displays) : [],
          schedule: c.schedule ? (typeof c.schedule === 'string' ? JSON.parse(c.schedule) : c.schedule) : null,
        }));

        // Filter by organizationId — each org sees ONLY their campaigns
        let result = dbCampaigns;
        if (filters?.organizationId && filters.organizationId !== 'org-nexora') {
          result = result.filter((c) => c.organizationId === filters.organizationId);
        }
        if (filters?.status && filters.status !== 'ALL') {
          result = result.filter((c) => c.status === filters.status);
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter((c) => c.name.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q));
        }
        if (filters?.advertiserId) {
          result = result.filter((c) => c.advertiserId === filters.advertiserId);
        }
        return result;
      }
    } catch (e) {
      console.warn('Failed to load campaigns from DB', e);
    }
    return [];
  }

  async getById(id: string): Promise<AdvertisingCampaign | null> {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const c = await res.json();
        return {
          id: c.id,
          organizationId: c.organization_id || 'org-publicidade',
          advertiserId: c.advertiser_id || 'adv-001',
          advertiserName: c.advertiser_name || 'Anunciante',
          name: c.name,
          description: c.description || '',
          objective: c.objective || 'BRAND_AWARENESS',
          status: (c.status || 'DRAFT') as AdvertisingCampaignStatus,
          startDate: c.start_date,
          endDate: c.end_date,
          budget: parseFloat(c.budget) || 0,
          currency: 'AOA',
          createdAt: c.created_at,
          updatedAt: c.updated_at || c.created_at,
          dailyFrequency: c.daily_frequency || 6,
          slotDurationSeconds: c.slot_duration || 15,
          targetMunicipalities: [],
          estimatedImpressions: c.estimated_impressions || 0,
          estimatedReach: c.estimated_reach || 0,
          executedPlays: c.executed_plays || 0,
          targetPlays: c.target_plays || 0,
          completionRate: 0,
          uptimePercentage: 100,
          creatives: c.creatives ? (typeof c.creatives === 'string' ? JSON.parse(c.creatives) : c.creatives) : [],
          displays: c.displays ? (typeof c.displays === 'string' ? JSON.parse(c.displays) : c.displays) : [],
          schedule: c.schedule ? (typeof c.schedule === 'string' ? JSON.parse(c.schedule) : c.schedule) : null,
          paymentReceiptUrl: c.payment_receipt_url || undefined,
        };
      }
    } catch {}
    const found = this.campaigns.find((c) => c.id === id);
    return found ? { ...found } : null;
  }

  async create(data: Partial<AdvertisingCampaign>): Promise<AdvertisingCampaign> {
    const id = `ad-cmp-${Date.now()}`;
    const newCampaign: AdvertisingCampaign = {
      id,
      organizationId: data.organizationId || 'org-publicidade',
      advertiserId: data.advertiserId || 'adv-001',
      advertiserName: data.advertiserName || 'Anunciante Corporativo',
      name: data.name || 'Nova Campanha de Mídia',
      description: data.description || '',
      objective: data.objective || 'BRAND_AWARENESS',
      status: data.status || 'DRAFT',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      budget: data.budget || 0,
      currency: 'AOA',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dailyFrequency: data.dailyFrequency || 6,
      slotDurationSeconds: data.slotDurationSeconds || 15,
      targetMunicipalities: data.targetMunicipalities || [],
      estimatedImpressions: data.estimatedImpressions || 0,
      estimatedReach: data.estimatedReach || 0,
      executedPlays: 0,
      targetPlays: data.targetPlays || 0,
      completionRate: 0,
      uptimePercentage: 100,
      contractId: data.contractId,
      creatives: data.creatives || [],
      displays: data.displays || [],
      schedule: data.schedule || null,
      media_url: data.media_url || '',
      // O comprovativo tem de entrar no objecto, senão perde-se antes de ser enviado.
      paymentReceiptUrl: (data as any).paymentReceiptUrl || undefined,
    };

    // Persist to DB
    try {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: newCampaign.name,
          description: newCampaign.description,
          objective: newCampaign.objective,
          status: newCampaign.status,
          advertiser_id: newCampaign.advertiserId,
          advertiser_name: newCampaign.advertiserName,
          budget: newCampaign.budget,
          start_date: newCampaign.startDate,
          end_date: newCampaign.endDate,
          daily_frequency: newCampaign.dailyFrequency,
          slot_duration: newCampaign.slotDurationSeconds,
          estimated_impressions: newCampaign.estimatedImpressions,
          estimated_reach: newCampaign.estimatedReach,
          target_plays: newCampaign.targetPlays || 0,
          creatives: JSON.stringify((data as any).creatives || []),
          displays: JSON.stringify((data as any).displays || []),
          schedule: JSON.stringify((data as any).schedule || null),
          organization_id: newCampaign.organizationId,
          media_url: newCampaign.media_url,
          /**
           * ⛔ O COMPROVATIVO DE PAGAMENTO NÃO ERA ENVIADO.
           *
           * O assistente de campanha anexava o comprovativo (`paymentReceiptUrl`)
           * e o serviço passava-o para aqui — mas este corpo do pedido não o
           * incluía. O servidor guardava `payment_receipt_url` a NULL, o painel de
           * admin não tinha nada para mostrar nem para aprovar, e a notificação de
           * "Pagamento/Comprovativo Efetuado" nunca era criada.
           */
          payment_receipt_url: newCampaign.paymentReceiptUrl,
        }),
      });
    } catch (e) {
      console.warn('API error creating campaign', e);
    }

    this.campaigns.unshift(newCampaign);
    return { ...newCampaign };
  }

  async getByAdvertiserId(advertiserId: string): Promise<AdvertisingCampaign[]> {
    const all = await this.getAll();
    return all.filter((c) => c.advertiserId === advertiserId);
  }

  async getByOrganizationId(organizationId: string): Promise<AdvertisingCampaign[]> {
    const all = await this.getAll();
    return all.filter((c) => c.organizationId === organizationId);
  }

  async getKPIs(organizationId?: string): Promise<AdvertisingNetworkKPIs> {
    try {
      const res = await fetch('/api/campaigns/network-kpis');
      if (res.ok) {
        const k = await res.json();
        return {
          totalInventoryDisplays: k.totalDisplays || 0,
          monetizableDisplays: k.monetizedDisplays || 0,
          monetizedDisplays: k.monetizedDisplays || 0,
          totalActiveCampaigns: k.activeCampaigns || 0,
          pendingReviewCampaigns: k.pendingApprovalCampaigns || 0,
          dailyImpressionsNetwork: k.dailyImpressions || 0,
          totalDisplaysAvailable: k.totalDisplays || 0,
          networkOccupancyRate: k.occupancyRate || 0,
          estimatedMonthlyRevenueKz: k.monthlyRevenueKz || 0,
          totalMonthlyRevenueKz: k.monthlyRevenueKz || 0,
          totalEstimatedDailyImpressions: k.dailyImpressions || 0,
          activeAdvertisersCount: k.activeCampaigns || 0,
          proofOfPlayComplianceRate: 99.4,
          networkUptimePercent: 99.8,
          topMunicipalities: [],
          topVenues: [],
        };
      }
    } catch (e) {
      console.warn('Erro ao buscar estatísticas reais de campanha:', e);
    }

    const all = await this.getAll();
    const target = organizationId ? all.filter((c) => c.organizationId === organizationId) : all;
    return {
      ...mockAdvertisingNetworkKPIs,
      totalActiveCampaigns: target.filter((c) => c.status === 'LIVE').length,
      pendingReviewCampaigns: target.filter((c) => c.status === 'PENDING_REVIEW').length,
    };
  }

  async getAdvertiserMetrics(advertiserId?: string): Promise<AdvertiserDashboardMetrics> {
    const all = await this.getAll();
    const userCampaigns = advertiserId ? all.filter((c) => c.advertiserId === advertiserId) : all;
    const activeCount = userCampaigns.filter((c) => c.status === 'LIVE').length;
    const scheduledCount = userCampaigns.filter((c) => c.status === 'SCHEDULED').length;
    const pendingCount = userCampaigns.filter((c) => c.status === 'PENDING_REVIEW').length;
    const totalBudget = userCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const impressions = userCampaigns.reduce((sum, c) => sum + (c.estimatedImpressions || 0), 0);
    const reach = userCampaigns.reduce((sum, c) => sum + (c.estimatedReach || 0), 0);
    return {
      activeCampaignsCount: activeCount,
      scheduledCampaignsCount: scheduledCount,
      pendingReviewsCount: pendingCount,
      totalBudgetUtilizedKz: totalBudget,
      totalEstimatedImpressions: impressions || mockAdvertiserMetrics.totalEstimatedImpressions,
      totalEstimatedReach: reach || mockAdvertiserMetrics.totalEstimatedReach,
      studioIACreditsRemaining: 3420,
    };
  }

  async update(id: string, data: Partial<AdvertisingCampaign>): Promise<AdvertisingCampaign> {
    await new Promise((r) => setTimeout(r, 40));
    const index = this.campaigns.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Campaign ${id} not found`);
    }
    const updated = {
      ...this.campaigns[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    this.campaigns[index] = updated;
    return { ...updated };
  }

  async updateStatus(
    id: string,
    status: AdvertisingCampaignStatus,
    notes?: string,
    actorName?: string
  ): Promise<AdvertisingCampaign> {
    await new Promise((r) => setTimeout(r, 40));
    const index = this.campaigns.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Campaign ${id} not found`);
    }

    const current = this.campaigns[index];
    const updated: AdvertisingCampaign = {
      ...current,
      status,
      reviewNotes: notes !== undefined ? notes : current.reviewNotes,
      updatedAt: new Date().toISOString(),
    };

    if (status === 'APPROVED') {
      updated.approvedBy = actorName || 'Administrador Nexora';
      updated.approvedAt = new Date().toISOString();
    }

    if (status === 'PAUSED') {
      try {
        await fetch(`/api/campaigns/${id}/stop`, { method: 'POST' });
      } catch (e) {
        console.warn('Erro ao chamar stop da campanha na API:', e);
      }
    }

    this.campaigns[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.warn('Erro ao deletar campanha na API:', e);
    }
    this.campaigns = this.campaigns.filter((c) => c.id !== id);
    return { success: true };
  }
}

export const advertisingCampaignRepository = new MockAdvertisingCampaignRepository();
