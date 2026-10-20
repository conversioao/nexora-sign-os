import { Plan, PlanFilters, PlanKPIs, PlanStatus } from '../types/saas';
import { mockPlans, mockSubscriptions } from '../data/mockSaasData';

export interface IPlanRepository {
  getAll(filters?: PlanFilters): Promise<Plan[]>;
  getActive(): Promise<Plan[]>;
  getById(id: string): Promise<Plan | null>;
  getByCode(code: string): Promise<Plan | null>;
  getKPIs(): Promise<PlanKPIs>;
  create(data: Partial<Plan>): Promise<Plan>;
  update(id: string, data: Partial<Plan>): Promise<Plan>;
  updateStatus(id: string, status: PlanStatus): Promise<Plan>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class MockPlanRepository implements IPlanRepository {
  private plans: Plan[] = [...mockPlans];

  private enrichPlan(plan: Plan): Plan {
    // Count active subscriptions for this plan
    const activeSubs = mockSubscriptions.filter(
      (sub) => sub.planId === plan.id && (sub.status === 'ACTIVE' || sub.status === 'TRIAL')
    ).length;

    return {
      ...plan,
      activeSubscriptionsCount: activeSubs,
    };
  }

  async getAll(filters?: PlanFilters): Promise<Plan[]> {
    try {
      const res = await fetch('/api/plans');
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const dbPlans: Plan[] = rows.map((r: any) => ({
            id: r.id,
            code: r.code || r.id,
            name: r.name,
            description: r.description || '',
            status: (r.status || 'ACTIVE').toUpperCase() as any,
            billingInterval: (r.billing_interval || 'MONTHLY').toUpperCase() as any,
            basePrice: parseFloat(r.base_price || r.price_monthly_kz || 250000),
            currency: 'AOA',
            displayLimit: parseInt(r.display_limit || 5),
            storageLimitGB: parseInt(r.storage_limit_gb || 20),
            teamMemberLimit: parseInt(r.team_member_limit || 3),
            playlistLimit: parseInt(r.playlist_limit || 10),
            scheduleLimit: parseInt(r.schedule_limit || 10),
            monthlyAiCredits: parseInt(r.monthly_ai_credits || 500),
            badgeText: r.badge_text || undefined,
            isPopular: Boolean(r.is_popular),
            features: typeof r.features === 'string' ? JSON.parse(r.features) : (r.features || {}),
            entitlements: typeof r.entitlements === 'string' ? JSON.parse(r.entitlements) : (r.entitlements || {}),
            activeSubscriptionsCount: 1,
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.created_at || new Date().toISOString(),
          }));
          this.plans = dbPlans;
        }
      }
    } catch (e) {
      console.warn('Fallback to local plans repository cache:', e);
    }

    let result = this.plans.map((p) => this.enrichPlan(p));

    if (!filters) return result;

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((p) => p.status === filters.status);
    }

    if (filters.billingInterval && filters.billingInterval !== 'ALL') {
      result = result.filter((p) => p.billingInterval === filters.billingInterval);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    return result;
  }

  async getActive(): Promise<Plan[]> {
    return this.getAll({ status: 'ACTIVE' });
  }

  async getById(id: string): Promise<Plan | null> {
    const all = await this.getAll();
    const found = all.find((p) => p.id === id || p.code === id);
    if (!found) return null;
    return this.enrichPlan(found);
  }

  async getByCode(code: string): Promise<Plan | null> {
    const all = await this.getAll();
    const found = all.find((p) => p.code.toLowerCase() === code.toLowerCase());
    if (!found) return null;
    return this.enrichPlan(found);
  }

  async getKPIs(): Promise<PlanKPIs> {
    const plans = await this.getAll();
    const totalPlans = plans.length;
    const activePlans = plans.filter((p) => p.status === 'ACTIVE').length;
    const draftPlans = plans.filter((p) => p.status === 'DRAFT').length;
    const archivedPlans = plans.filter((p) => p.status === 'ARCHIVED').length;

    const totalSubscribedClients = mockSubscriptions.filter(
      (s) => s.status === 'ACTIVE' || s.status === 'TRIAL'
    ).length;

    const estimatedMRRKz = mockSubscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => {
        const addOnsTotal = (s.addOns || []).reduce((aSum, a) => aSum + (a.active ? a.unitPrice * a.quantity : 0), 0);
        return sum + s.price + addOnsTotal;
      }, 0);

    return {
      totalPlans,
      activePlans,
      draftPlans,
      archivedPlans,
      totalSubscribedClients,
      estimatedMRRKz,
    };
  }

  async create(data: Partial<Plan>): Promise<Plan> {
    const newPlan: Plan = {
      id: data.id || `plan-${Date.now()}`,
      code: data.code || `PLAN_CUSTOM_${Date.now()}`,
      name: data.name || 'Novo Plano SaaS',
      description: data.description || 'Descrição do plano de digital signage.',
      status: data.status || 'ACTIVE',
      billingInterval: data.billingInterval || 'MONTHLY',
      basePrice: Number(data.basePrice) || 250000,
      currency: 'AOA',
      displayLimit: Number(data.displayLimit) || 5,
      storageLimitGB: Number(data.storageLimitGB) || 20,
      teamMemberLimit: Number(data.teamMemberLimit) || 3,
      playlistLimit: Number(data.playlistLimit) || 10,
      scheduleLimit: Number(data.scheduleLimit) || 10,
      monthlyAiCredits: Number(data.monthlyAiCredits) || 500,
      features: data.features || {
        displayManagement: true,
        contentManagement: true,
        playlistManagement: true,
        scheduling: true,
        advancedScheduling: false,
        teamManagement: false,
        analytics: false,
        remoteMonitoring: true,
        aiImageGeneration: true,
        aiVideoGeneration: false,
        advertisingMarketplace: false,
        prioritySupport: false,
      },
      entitlements: data.entitlements || {
        maxDisplays: Number(data.displayLimit) || 5,
        maxStorageGB: Number(data.storageLimitGB) || 20,
        maxTeamMembers: Number(data.teamMemberLimit) || 3,
        maxPlaylists: Number(data.playlistLimit) || 10,
        maxSchedules: Number(data.scheduleLimit) || 10,
        monthlyAiCredits: Number(data.monthlyAiCredits) || 500,
        maxVideoGenerations: 0,
      },
      badgeText: data.badgeText,
      isPopular: data.isPopular || false,
      activeSubscriptionsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newPlan.id,
          code: newPlan.code,
          name: newPlan.name,
          description: newPlan.description,
          status: newPlan.status,
          billing_interval: newPlan.billingInterval,
          base_price: newPlan.basePrice,
          display_limit: newPlan.displayLimit,
          storage_limit_gb: newPlan.storageLimitGB,
          team_member_limit: newPlan.teamMemberLimit,
          playlist_limit: newPlan.playlistLimit,
          schedule_limit: newPlan.scheduleLimit,
          monthly_ai_credits: newPlan.monthlyAiCredits,
          badge_text: newPlan.badgeText,
          is_popular: newPlan.isPopular,
          features: newPlan.features,
          entitlements: newPlan.entitlements,
        }),
      });
      if (res.ok) {
        const createdRow = await res.json();
        newPlan.id = createdRow.id;
      }
    } catch (e) {
      console.warn('Erro ao salvar plano no PostgreSQL backend:', e);
    }

    const existingIndex = this.plans.findIndex((p) => p.id === newPlan.id);
    if (existingIndex >= 0) {
      this.plans[existingIndex] = newPlan;
    } else {
      this.plans.unshift(newPlan);
    }
    return newPlan;
  }

  async update(id: string, data: Partial<Plan>): Promise<Plan> {
    const existing = this.plans.find((p) => p.id === id);
    const updated = await this.create({ ...(existing || {}), ...data, id });
    return updated;
  }

  async updateStatus(id: string, status: PlanStatus): Promise<Plan> {
    return this.update(id, { status });
  }

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      await fetch(`/api/plans/${id}`, { method: 'DELETE' });
    } catch (e) {}
    const index = this.plans.findIndex((p) => p.id === id);
    if (index === -1) return { success: false };
    this.plans.splice(index, 1);
    return { success: true };
  }
}

export const planRepository = new MockPlanRepository();
