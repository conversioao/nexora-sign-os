import { ICampaignRepository, IKPIRepository, IActivityRepository } from './types';
import { Campaign, DashboardKPIs, SystemActivity } from '../types/domain';
import { mockCampaigns, mockKPIs, mockActivities } from '../data/mockData';

export class MockCampaignRepository implements ICampaignRepository {
  async getAll(organizationId?: string): Promise<Campaign[]> {
    try {
      const res = await fetch('/api/campaigns');
      if (res.ok) {
        const rows = await res.json();
        if (rows.length > 0) {
          return rows.map((c: any) => ({
            id: c.id,
            name: c.name,
            code: `CMP-${c.id.substring(0, 4).toUpperCase()}`,
            status: (c.status || 'ACTIVE').toUpperCase(),
            clientName: c.advertiser_id || 'Anunciante Nexora',
            startDate: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '2026-01-01',
            endDate: c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : '2026-12-31',
            budgetKz: parseFloat(c.budget) || 150000,
            spentKz: parseFloat(c.spent) || 0,
            assignedDisplaysCount: 1,
            impressionsDelivered: 0,
            impressionsTarget: 50000,
            organizationId: c.advertiser_id,
          }));
        }
      }
    } catch (e) {
      console.warn('API error fetching campaigns', e);
    }
    return [];
  }

  async getById(id: string): Promise<Campaign | null> {
    const all = await this.getAll();
    const found = all.find((c) => c.id === id);
    return found ? { ...found } : null;
  }
}

export class MockKPIRepository implements IKPIRepository {
  async getKPIs(organizationId?: string): Promise<DashboardKPIs> {
    try {
      // Try /api/dashboard/stats endpoint first for exact DB telemetry
      const statsRes = await fetch('/api/dashboard/stats');
      if (statsRes.ok) {
        const stats = await statsRes.json();
        return {
          totalDisplays: stats.totalDisplays || 0,
          onlineDisplays: stats.onlineDisplays || 0,
          offlineDisplays: stats.offlineDisplays || 0,
          maintenanceDisplays: stats.maintenanceDisplays || 0,
          activeClients: stats.activeClients || 0,
          activeAdvertisers: stats.activeAdvertisers || 0,
          activeCampaigns: stats.activeCampaigns || 0,
          totalMonthlyRevenueKz: stats.totalMonthlyRevenueKz || 0,
          estimatedDailyImpressions: (stats.onlineDisplays || 0) * 1000,
          networkOccupancyRate: stats.totalDisplays > 0 ? Math.round(((stats.onlineDisplays || 0) / stats.totalDisplays) * 100) : 0,
          aiCreditsRemaining: 3420,
        } as any;
      }

      const [displaysRes, campaignsRes, customersRes, advertisersRes, maintenanceRes] = await Promise.all([
        fetch('/api/displays'),
        fetch('/api/campaigns'),
        fetch('/api/customers').catch(() => null),
        fetch('/api/advertisers').catch(() => null),
        fetch('/api/maintenance/tickets').catch(() => null),
      ]);

      const displays: any[] = displaysRes.ok ? await displaysRes.json() : [];
      const campaigns: any[] = campaignsRes.ok ? await campaignsRes.json() : [];
      const customers: any[] = (customersRes && customersRes.ok) ? await customersRes.json() : [];
      const advertisers: any[] = (advertisersRes && advertisersRes.ok) ? await advertisersRes.json() : [];
      const maintenance: any[] = (maintenanceRes && maintenanceRes.ok) ? await maintenanceRes.json() : [];

      const totalDisplays = displays.length;
      const onlineDisplays = displays.filter((d: any) => d.status?.toUpperCase() === 'ONLINE').length;
      const offlineDisplays = displays.filter((d: any) => d.status?.toUpperCase() === 'OFFLINE').length;
      const maintenanceDisplays = displays.filter((d: any) => ['MAINTENANCE', 'REPAIR'].includes(d.status?.toUpperCase())).length || (maintenance.filter((m: any) => m.status === 'open').length);

      const activeCampaigns = campaigns.filter((c: any) => ['LIVE', 'ACTIVE', 'RUNNING', 'APPROVED'].includes((c.status || '').toUpperCase())).length;
      const totalMonthlyRevenueKz = campaigns.reduce((sum: number, c: any) => sum + (parseFloat(c.budget) || 0), 0);

      return {
        totalDisplays,
        onlineDisplays,
        offlineDisplays,
        maintenanceDisplays,
        activeClients: customers.length,
        activeAdvertisers: advertisers.length,
        activeCampaigns,
        totalMonthlyRevenueKz,
        estimatedDailyImpressions: onlineDisplays * 1000,
        networkOccupancyRate: totalDisplays > 0 ? Math.round((onlineDisplays / totalDisplays) * 100) : 0,
        aiCreditsRemaining: 3420,
      } as any;
    } catch (e) {
      console.warn('Error fetching real KPIs:', e);
    }

    return {
      totalDisplays: 0,
      onlineDisplays: 0,
      offlineDisplays: 0,
      activeCampaigns: 0,
      totalMonthlyRevenueKz: 0,
      estimatedDailyImpressions: 0,
      networkOccupancyRate: 0,
      aiCreditsRemaining: 0,
    };
  }
}

export class MockActivityRepository implements IActivityRepository {
  async getRecentActivities(limit = 10, organizationId?: string): Promise<SystemActivity[]> {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const notifs = data.notifications || [];
        if (notifs.length > 0) {
          return notifs.slice(0, limit).map((n: any) => ({
            id: n.id,
            timestamp: new Date(n.createdAt).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }),
            type: n.type === 'DISPLAY_ONLINE' ? 'DISPLAY_CONNECTED' : (n.type === 'DISPLAY_OFFLINE' ? 'DISPLAY_DISCONNECTED' : 'CAMPAIGN_APPROVED'),
            title: n.title,
            description: n.message,
            severity: n.type === 'DISPLAY_OFFLINE' ? 'danger' : 'info',
            actor: 'Agente Nexora OS',
            targetLocation: 'Luanda',
          }));
        }
      }
    } catch (e) {}
    return mockActivities.slice(0, limit);
  }
}

export const campaignRepository = new MockCampaignRepository();
export const kpiRepository = new MockKPIRepository();
export const activityRepository = new MockActivityRepository();
