import { MediaOpportunity, AdvertiserMetrics, Campaign, LuandaZoneSummary } from '../types/domain';
import { mockMediaOpportunities, mockLuandaZones } from '../data/mockAlertData';
import { mockCampaigns } from '../data/mockData';
import {
  AdvertiserProfile,
  AdvertiserKPIs,
  AdvertiserFilters,
  CustomerStatus,
  CustomerLifecycleStage,
} from '../types/crm';
import { mockAdvertiserProfiles, mockContacts } from '../data/mockCrmData';
import { organizationRepository } from './organizationRepository';

export interface IAdvertiserRepository {
  // Operational CRM Profiles
  getAllProfiles(filters?: AdvertiserFilters): Promise<AdvertiserProfile[]>;
  getProfileById(id: string): Promise<AdvertiserProfile | null>;
  getProfileByOrgId(orgId: string): Promise<AdvertiserProfile | null>;
  getProfileKPIs(organizationId?: string): Promise<AdvertiserKPIs>;
  createProfile(data: Partial<AdvertiserProfile>): Promise<AdvertiserProfile>;
  updateProfile(id: string, data: Partial<AdvertiserProfile>): Promise<AdvertiserProfile>;
  updateProfileStatus(id: string, status: CustomerStatus, lifecycleStage?: CustomerLifecycleStage): Promise<AdvertiserProfile>;
  deleteProfile(id: string): Promise<{ success: boolean }>;

  // Existing Media opportunities & metrics
  getOpportunities(municipality?: string): Promise<MediaOpportunity[]>;
  getMetrics(organizationId?: string): Promise<AdvertiserMetrics>;
  getCampaigns(organizationId?: string): Promise<Campaign[]>;
  getLuandaZones(): Promise<LuandaZoneSummary[]>;
}

export class MockAdvertiserRepository implements IAdvertiserRepository {
  private opportunities: MediaOpportunity[] = [...mockMediaOpportunities];
  private profiles: AdvertiserProfile[] = [...mockAdvertiserProfiles];

  private enrichProfile(profile: AdvertiserProfile): AdvertiserProfile {
    const primaryContact = mockContacts.find(
      (c) => c.organizationId === profile.organizationId && c.isPrimary
    ) || mockContacts.find((c) => c.organizationId === profile.organizationId);

    return {
      ...profile,
      primaryContact,
    };
  }

  async getAllProfiles(filters?: AdvertiserFilters): Promise<AdvertiserProfile[]> {
    try {
      const res = await fetch('/api/advertisers');
      if (res.ok) {
        const rows = await res.json();
        let dbProfiles: AdvertiserProfile[] = rows.map((r: any) => ({
          id: r.id,
          organizationId: r.id,
          advertiserCode: `ADV-${r.id}`,
          legalName: r.company_name || r.trade_name || 'Anunciante Corporativo',
          tradeName: r.trade_name || r.company_name || 'Anunciante Corporativo',
          nif: r.nif || '5400000000',
          industry: r.category || 'Varejo & Serviços',
          phone: r.phone || '',
          email: r.email || '',
          address: r.address || 'Luanda',
          municipality: r.city || 'Luanda',
          city: r.city || 'Luanda',
          country: r.country || 'Angola',
          status: r.status || 'ACTIVE',
          lifecycleStage: r.status || 'ACTIVE',
          leadSource: 'DIRECT_SALES',
          monthlyBudgetEstimateKz: parseFloat(r.total_invested_kz) || 0,
          activeCampaignsCount: parseInt(r.active_campaigns || '0'),
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.created_at || new Date().toISOString(),
        }));

        let result = dbProfiles.map((p) => this.enrichProfile(p));
        if (filters?.status && filters.status !== 'ALL') {
          result = result.filter((p) => p.status === filters.status);
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter((p) => p.tradeName.toLowerCase().includes(q) || p.legalName.toLowerCase().includes(q));
        }
        return result;
      }
    } catch (e) {
      console.warn('Erro ao buscar anunciantes no DB:', e);
    }
    return [];
  }

  async getProfileById(id: string): Promise<AdvertiserProfile | null> {
    try {
      const res = await fetch(`/api/advertisers/${id}`);
      if (res.ok) {
        const r = await res.json();
        const profile: AdvertiserProfile = {
          id: r.id,
          organizationId: r.id,
          advertiserCode: `ADV-${r.id}`,
          legalName: r.name || r.trade_name || 'Anunciante Corporativo',
          tradeName: r.trade_name || r.name || 'Anunciante Corporativo',
          nif: r.nif || '5400000000',
          industry: r.industry || 'Varejo & Serviços',
          phone: r.phone || '',
          email: r.email || '',
          address: r.address || 'Luanda',
          municipality: r.city || 'Luanda',
          city: r.city || 'Luanda',
          country: r.country || 'Angola',
          status: r.status || 'ACTIVE',
          lifecycleStage: r.status || 'ACTIVE',
          leadSource: 'DIRECT_SALES',
          monthlyBudgetEstimateKz: parseFloat(r.total_invested_kz) || 0,
          activeCampaignsCount: Array.isArray(r.campaigns) ? r.campaigns.filter((c: any) => ['LIVE', 'ACTIVE', 'RUNNING'].includes(c.status?.toUpperCase())).length : 0,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.created_at || new Date().toISOString(),
        };
        return this.enrichProfile(profile);
      }
    } catch (e) {
      console.warn('Erro ao carregar detalhes do anunciante no DB:', e);
    }
    const profile = this.profiles.find((p) => p.id === id || p.organizationId === id);
    if (!profile) return null;
    return this.enrichProfile(profile);
  }

  async getProfileByOrgId(orgId: string): Promise<AdvertiserProfile | null> {
    return this.getProfileById(orgId);
  }

  async getProfileKPIs(organizationId?: string): Promise<AdvertiserKPIs> {
    const list = await this.getAllProfiles({ organizationId });

    const totalAdvertisers = list.length;
    const activeAdvertisers = list.filter((p) => p.status === 'ACTIVE').length;
    const prospectAdvertisers = list.filter((p) => p.status === 'PROSPECT').length;
    const activeCampaigns = list.reduce((sum, p) => sum + (p.activeCampaignsCount || 0), 0);
    const estimatedMonthlyInvestmentKz = list.reduce((sum, p) => sum + (p.monthlyBudgetEstimateKz || 0), 0);

    return {
      totalAdvertisers,
      activeAdvertisers,
      prospectAdvertisers,
      activeCampaigns,
      estimatedMonthlyInvestmentKz,
    };
  }

  async createProfile(data: Partial<AdvertiserProfile>): Promise<AdvertiserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    let orgId = data.organizationId;
    if (!orgId) {
      const createdOrg = await organizationRepository.create({
        name: data.tradeName || data.legalName || 'Novo Anunciante',
        tradeName: data.legalName || data.tradeName,
        type: 'ADVERTISER',
        nif: data.nif,
        contactEmail: data.email || 'comercial@anunciante.ao',
        phone: data.phone || '+244 923 000 000',
        address: data.address || 'Luanda',
        city: data.city || 'Luanda',
        province: data.municipality || 'Luanda',
        country: data.country || 'Angola',
        timezone: 'Africa/Luanda',
      });
      orgId = createdOrg.id;
    }

    const newProfile: AdvertiserProfile = {
      id: orgId,
      organizationId: orgId,
      advertiserCode: data.advertiserCode || `ADV-${String(this.profiles.length + 1).padStart(3, '0')}`,
      legalName: data.legalName || data.tradeName || 'Razão Social Anunciante Lda.',
      tradeName: data.tradeName || data.legalName || 'Nome Comercial Anunciante',
      nif: data.nif || '5400000000',
      industry: data.industry || 'Telecomunicações',
      phone: data.phone || '+244 923 000 000',
      email: data.email || 'mídia@empresa.ao',
      website: data.website || '',
      address: data.address || 'Luanda, Angola',
      municipality: data.municipality || 'Ingombota',
      city: data.city || 'Luanda',
      country: data.country || 'Angola',
      status: data.status || 'ACTIVE',
      lifecycleStage: data.lifecycleStage || 'ACTIVE',
      leadSource: data.leadSource || 'DIRECT_SALES',
      monthlyBudgetEstimateKz: data.monthlyBudgetEstimateKz || 0,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeCampaignsCount: data.activeCampaignsCount || 0,
      totalCampaignsCount: data.totalCampaignsCount || 0,
      aiCreditsRemaining: data.aiCreditsRemaining || 0,
      lastActivityAt: new Date().toISOString(),
    };

    this.profiles.unshift(newProfile);
    return this.enrichProfile(newProfile);
  }

  async updateProfile(id: string, data: Partial<AdvertiserProfile>): Promise<AdvertiserProfile> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const index = this.profiles.findIndex((p) => p.id === id || p.organizationId === id);
    if (index === -1) {
      throw new Error(`Anunciante com ID ${id} não encontrado.`);
    }

    const updated: AdvertiserProfile = {
      ...this.profiles[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.profiles[index] = updated;
    return this.enrichProfile(updated);
  }

  async updateProfileStatus(
    id: string,
    status: CustomerStatus,
    lifecycleStage?: CustomerLifecycleStage
  ): Promise<AdvertiserProfile> {
    const stage = lifecycleStage || (status === 'ACTIVE' ? 'ACTIVE' : status === 'PROSPECT' ? 'PROSPECT' : 'INACTIVE');
    return this.updateProfile(id, { status, lifecycleStage: stage });
  }

  async deleteProfile(id: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const initialLen = this.profiles.length;
    this.profiles = this.profiles.filter((p) => p.id !== id && p.organizationId !== id);
    return { success: this.profiles.length < initialLen };
  }

  // Media opportunities — fetch real displays from DB
  async getOpportunities(municipality?: string): Promise<MediaOpportunity[]> {
    try {
      const base = '/api/displays?onlyNetwork=true';
      const url = municipality && municipality !== 'ALL'
        ? `${base}&municipality=${encodeURIComponent(municipality)}`
        : base;
      const res = await fetch(url);
      if (res.ok) {
        const displays: any[] = await res.json();
        const realOpportunities: MediaOpportunity[] = (Array.isArray(displays) ? displays : [])
          .filter((d: any) => {
            const isNetwork = d.is_network_display === true || d.organization_id === 'org-nexora';
            return isNetwork;
          })
          .slice(0, 12)
          .map((d: any) => ({
            id: `opp-${d.id}`,
            displayId: d.id,
            displayCode: d.code || d.id,
            name: d.name || `Display ${d.code || d.id}`,
            location: d.location || d.venue_name || 'Luanda, Angola',
            municipality: d.municipality || d.province || 'Luanda',
            venueName: d.venue_name || d.location || 'Espaço Comercial',
            venueType: d.venue_type || d.establishment_type || 'Comercial',
            deviceType: d.device_type || d.deviceType || 'TV_BOX',
            resolution: d.resolution || '1920x1080',
            orientation: d.orientation || 'LANDSCAPE',
            screenSizeInches: parseFloat(d.screen_size_inches || d.screenSizeInches || '55'),
            estimatedDailyAudience: parseInt(d.daily_audience || d.estimated_daily_audience || '1500'),
            dailyRateKz: parseFloat(d.daily_rate_kz || d.price_per_day || '4000'),
            availability: d.status === 'ONLINE' ? 'AVAILABLE' : 'HIGH_DEMAND',
            tags: d.tags ? (Array.isArray(d.tags) ? d.tags : [d.tags]) : [],
          }));
        if (realOpportunities.length > 0) return realOpportunities;
      }
    } catch (e) {
      console.warn('Erro ao buscar displays reais para oportunidades:', e);
    }
    // Fallback to mock only if API fails
    if (municipality && municipality !== 'ALL') {
      return this.opportunities.filter((o) => o.municipality === municipality);
    }
    return [...this.opportunities];
  }

  async getMetrics(organizationId?: string): Promise<AdvertiserMetrics> {
    try {
      const [campaignsRes, displaysRes, loopsRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/displays'),
        fetch('/api/ai-agents/status').catch(() => null),
      ]);

      let activeCampaignsCount = 0;
      let scheduledCampaignsCount = 0;
      let adsInProductionCount = 0;
      let monthlyInvestmentKz = 0;
      let availableDisplaysCount = 0;
      let estimatedPlays = 0;
      let estimatedImpressions = 0;
      let estimatedAudienceReach = 0;
      let campaignIds: string[] = [];

      if (campaignsRes.ok) {
        const campaigns = await campaignsRes.json();
        const myCampaigns = organizationId
          ? campaigns.filter((c: any) => c.organization_id === organizationId || c.organizationId === organizationId)
          : campaigns;
        
        activeCampaignsCount = myCampaigns.filter((c: any) => ['ACTIVE', 'RUNNING', 'LIVE'].includes((c.status || '').toUpperCase())).length;
        scheduledCampaignsCount = myCampaigns.filter((c: any) => c.status === 'SCHEDULED').length;
        adsInProductionCount = myCampaigns.filter((c: any) => ['DRAFT', 'PENDING'].includes(c.status || '')).length;
        monthlyInvestmentKz = myCampaigns.reduce((sum: number, c: any) => sum + (parseFloat(c.budget) || 0), 0);
        campaignIds = myCampaigns.map((c: any) => c.id);

        // Count unique contracted displays for this advertiser
        const targetedDisplaysSet = new Set<string>();
        myCampaigns.forEach((c: any) => {
          let targetList: any[] = [];
          if (typeof c.displays === 'string') {
            try { targetList = JSON.parse(c.displays); } catch { if (c.displays) targetList = [c.displays]; }
          } else if (Array.isArray(c.displays)) {
            targetList = c.displays;
          }
          if (targetList.length === 0) {
            if (typeof c.target_displays === 'string') {
              try { targetList = JSON.parse(c.target_displays); } catch { if (c.target_displays) targetList = [c.target_displays]; }
            } else if (Array.isArray(c.target_displays)) {
              targetList = c.target_displays;
            }
          }
          targetList.forEach((td: any) => {
            const idStr = typeof td === 'string' ? td : (td?.id || td?.displayId || String(td));
            if (idStr && idStr !== '[object Object]') targetedDisplaysSet.add(idStr);
          });
        });
        availableDisplaysCount = targetedDisplaysSet.size;

        // Fallback: If advertiser has active campaigns, fetch network displays count if set was empty
        if (availableDisplaysCount === 0 && myCampaigns.length > 0) {
          try {
            const allDispRes = await fetch('/api/displays');
            if (allDispRes.ok) {
              const allDisp = await allDispRes.json();
              availableDisplaysCount = allDisp.length || myCampaigns.length;
            } else {
              availableDisplaysCount = myCampaigns.length;
            }
          } catch {
            availableDisplaysCount = myCampaigns.length;
          }
        }

        if (myCampaigns.length > 0) {
          try {
            const statsPromises = campaignIds.map(async (cid) => {
              try {
                const statsRes = await fetch(`/api/campaigns/${cid}/loop-stats`);
                if (statsRes.ok) {
                  return await statsRes.json();
                }
              } catch {}
              return null;
            });
            const allStats = await Promise.all(statsPromises);
            for (const statsData of allStats) {
              if (statsData) {
                const loops = Number(statsData.totalLoops) || 0;
                estimatedPlays += loops;
                estimatedImpressions += Number(statsData.impressions) || (loops * 25);
                estimatedAudienceReach += Number(statsData.reach) || (loops * 18);
              }
            }
          } catch {}
        }
      }

      // If org has no campaigns, all metrics must be strictly 0
      const hasData = campaignIds.length > 0;

      return {
        activeCampaignsCount,
        scheduledCampaignsCount,
        adsInProductionCount,
        availableDisplaysCount: hasData ? availableDisplaysCount : 0,
        aiCreditsRemaining: hasData ? 100 : 0,
        monthlyInvestmentKz,
        estimatedImpressions: hasData ? estimatedImpressions : 0,
        estimatedPlays: hasData ? estimatedPlays : 0,
        displaysImpacted: hasData ? availableDisplaysCount : 0,
        estimatedAudienceReach: hasData ? estimatedAudienceReach : 0,
      };
    } catch (e) {
      console.warn('API error fetching advertiser metrics', e);
    }

    return {
      activeCampaignsCount: 0,
      scheduledCampaignsCount: 0,
      adsInProductionCount: 0,
      availableDisplaysCount: 0,
      aiCreditsRemaining: 0,
      monthlyInvestmentKz: 0,
      estimatedImpressions: 0,
      estimatedPlays: 0,
      displaysImpacted: 0,
      estimatedAudienceReach: 0,
    };
  }

  async getCampaigns(organizationId?: string): Promise<Campaign[]> {
    try {
      const url = organizationId ? `/api/campaigns?organization_id=${encodeURIComponent(organizationId)}` : '/api/campaigns';
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch campaigns', e);
    }
    return [];
  }

  async getLuandaZones(): Promise<LuandaZoneSummary[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return [...mockLuandaZones];
  }
}

export const advertiserRepository = new MockAdvertiserRepository();
