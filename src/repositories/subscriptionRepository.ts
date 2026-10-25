import {
  Subscription,
  SubscriptionFilters,
  SubscriptionKPIs,
  SubscriptionStatus,
  SubscriptionUsage,
  SubscriptionUsageSummary,
  SubscriptionCommercialModel,
  UsageMetricItem,
} from '../types/saas';
import {
  mockSubscriptions,
  mockSubscriptionUsages,
  mockPlans,
  mockAddOns,
} from '../data/mockSaasData';
import { mockOrganizations } from '../data/mockAuthData';

export interface ISubscriptionRepository {
  getAll(filters?: SubscriptionFilters): Promise<Subscription[]>;
  getById(id: string): Promise<Subscription | null>;
  getByOrganizationId(orgId: string): Promise<Subscription | null>;
  getUsage(orgId: string): Promise<SubscriptionUsage | null>;
  getUsageSummary(orgId: string): Promise<SubscriptionUsageSummary | null>;
  getKPIs(): Promise<SubscriptionKPIs>;
  create(data: Partial<Subscription>): Promise<Subscription>;
  update(id: string, data: Partial<Subscription>): Promise<Subscription>;
  updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription>;
  addAddOn(subscriptionId: string, addOnId: string, quantity?: number): Promise<Subscription>;
  removeAddOn(subscriptionId: string, subAddOnId: string): Promise<Subscription>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class MockSubscriptionRepository implements ISubscriptionRepository {
  private subscriptions: Subscription[] = [...mockSubscriptions];
  private usages: SubscriptionUsage[] = [...mockSubscriptionUsages];

  private enrichSubscription(sub: Subscription): Subscription {
    const org = mockOrganizations.find((o) => o.id === sub.organizationId);
    const plan = mockPlans.find((p) => p.id === sub.planId);

    return {
      ...sub,
      organizationName: sub.organizationName || org?.name || 'Organização Titular',
      organizationCode: sub.organizationCode || org?.code || 'ORG-UNKNOWN',
      organizationType: sub.organizationType || org?.type || 'CLIENT',
      planName: sub.planName || plan?.name || 'Plano Personalizado',
      planCode: sub.planCode || plan?.code || 'PLAN_CUSTOM',
    };
  }

  async getAll(filters?: SubscriptionFilters): Promise<Subscription[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    let result = this.subscriptions.map((s) => this.enrichSubscription(s));

    if (!filters) return result;

    if (filters.organizationId) {
      result = result.filter((s) => s.organizationId === filters.organizationId);
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((s) => s.status === filters.status);
    }

    if (filters.billingInterval && filters.billingInterval !== 'ALL') {
      result = result.filter((s) => s.billingInterval === filters.billingInterval);
    }

    if (filters.commercialModel && filters.commercialModel !== 'ALL') {
      result = result.filter((s) => s.commercialModel === filters.commercialModel);
    }

    if (filters.planId && filters.planId !== 'ALL') {
      result = result.filter((s) => s.planId === filters.planId);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          (s.organizationName?.toLowerCase().includes(q) ?? false) ||
          (s.organizationCode?.toLowerCase().includes(q) ?? false) ||
          (s.planName?.toLowerCase().includes(q) ?? false) ||
          s.id.toLowerCase().includes(q)
      );
    }

    return result;
  }

  async getById(id: string): Promise<Subscription | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const found = this.subscriptions.find((s) => s.id === id);
    if (!found) return null;
    return this.enrichSubscription(found);
  }

  async getByOrganizationId(orgId: string): Promise<Subscription | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const found = this.subscriptions.find((s) => s.organizationId === orgId);
    if (!found) return null;
    return this.enrichSubscription(found);
  }

  async getUsage(orgId: string): Promise<SubscriptionUsage | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const found = this.usages.find((u) => u.organizationId === orgId);
    if (found) return { ...found };

    // If not found, return default zero usage
    const sub = this.subscriptions.find((s) => s.organizationId === orgId);
    if (!sub) return null;

    return {
      organizationId: orgId,
      subscriptionId: sub.id,
      displaysUsed: 0,
      storageUsedGB: 0,
      teamMembersUsed: 1,
      playlistsUsed: 0,
      schedulesUsed: 0,
      aiCreditsUsed: 0,
      lastCalculatedAt: new Date().toISOString(),
    };
  }

  async getUsageSummary(orgId: string): Promise<SubscriptionUsageSummary | null> {
    const sub = await this.getByOrganizationId(orgId);
    if (!sub) return null;

    const plan = mockPlans.find((p) => p.id === sub.planId) || mockPlans[0];
    const usage = (await this.getUsage(orgId)) || {
      organizationId: orgId,
      subscriptionId: sub.id,
      displaysUsed: 0,
      storageUsedGB: 0,
      teamMembersUsed: 1,
      playlistsUsed: 0,
      schedulesUsed: 0,
      aiCreditsUsed: 0,
      lastCalculatedAt: new Date().toISOString(),
    };

    const buildMetric = (
      metric: string,
      label: string,
      used: number,
      limit: number,
      unit: string
    ): UsageMetricItem => {
      const percentage = limit > 0 ? Math.round((used / limit) * 100) : 0;
      const remaining = Math.max(0, limit - used);
      const isNearLimit = percentage >= 80;
      const isOverLimit = percentage >= 100;
      const status = isOverLimit ? 'danger' : isNearLimit ? 'warning' : 'normal';

      return {
        metric,
        label,
        used,
        limit,
        unit,
        percentage,
        remaining,
        isNearLimit,
        isOverLimit,
        status,
      };
    };

    // Calculate AI Credits limit including plan base and any add-ons
    const extraCredits = (sub.addOns || [])
      .filter((a) => a.active && a.addOnCode.includes('AI_CREDITS'))
      .reduce((sum, a) => sum + (a.quantity * 1000), 0);
    const totalAiCreditsLimit = sub.aiCreditsIncluded + extraCredits;

    // Calculate Storage limit including plan base and add-ons
    const extraStorageGB = (sub.addOns || [])
      .filter((a) => a.active && a.addOnCode.includes('STORAGE'))
      .reduce((sum, a) => sum + (a.quantity * 50), 0);
    const totalStorageLimitGB = sub.storageLimitGB + extraStorageGB;

    const metrics = {
      displays: buildMetric('displays', 'Displays / Terminais', usage.displaysUsed, sub.displayLimit, 'telas'),
      storage: buildMetric('storage', 'Armazenamento em Nuvem', usage.storageUsedGB, totalStorageLimitGB, 'GB'),
      teamMembers: buildMetric('teamMembers', 'Membros de Equipa', usage.teamMembersUsed, plan.teamMemberLimit, 'usuários'),
      playlists: buildMetric('playlists', 'Playlists Criadas', usage.playlistsUsed, plan.playlistLimit, 'playlists'),
      schedules: buildMetric('schedules', 'Grades de Programação', usage.schedulesUsed, plan.scheduleLimit, 'grades'),
      aiCredits: buildMetric('aiCredits', 'Créditos de IA (Studio & Vídeo)', usage.aiCreditsUsed, totalAiCreditsLimit, 'créditos'),
    };

    const alerts: string[] = [];
    if (metrics.displays.isNearLimit && metrics.displays.limit > 0) {
      alerts.push(`Uso de displays próximo do limite (${metrics.displays.used}/${metrics.displays.limit} telas - ${metrics.displays.percentage}%).`);
    }
    if (metrics.storage.isNearLimit) {
      alerts.push(`Armazenamento próximo do limite (${metrics.storage.used}GB de ${metrics.storage.limit}GB - ${metrics.storage.percentage}%).`);
    }
    if (metrics.aiCredits.isNearLimit) {
      alerts.push(`Créditos de IA próximos do esgotamento (${metrics.aiCredits.used}/${metrics.aiCredits.limit} - ${metrics.aiCredits.percentage}%).`);
    }
    if (sub.status === 'PAST_DUE') {
      alerts.push('Subscrição com pagamento pendente (Past Due). Regularize para evitar suspensão.');
    }
    if (sub.status === 'SUSPENDED') {
      alerts.push('Subscrição suspensa. A transmissão de novas mídias está restrita.');
    }

    return {
      subscription: sub,
      plan,
      usage,
      metrics,
      hasAlerts: alerts.length > 0,
      alerts,
    };
  }

  async getKPIs(): Promise<SubscriptionKPIs> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const totalSubscriptions = this.subscriptions.length;
    const activeSubscriptions = this.subscriptions.filter((s) => s.status === 'ACTIVE').length;
    const trialSubscriptions = this.subscriptions.filter((s) => s.status === 'TRIAL').length;
    const pastDueSubscriptions = this.subscriptions.filter((s) => s.status === 'PAST_DUE').length;
    const suspendedSubscriptions = this.subscriptions.filter((s) => s.status === 'SUSPENDED').length;
    const cancelledSubscriptions = this.subscriptions.filter((s) => s.status === 'CANCELLED').length;
    const expiredSubscriptions = this.subscriptions.filter((s) => s.status === 'EXPIRED').length;

    const estimatedMRRKz = this.subscriptions
      .filter((s) => s.status === 'ACTIVE')
      .reduce((sum, s) => {
        const addOnsTotal = (s.addOns || []).reduce((aSum, a) => aSum + (a.active ? a.unitPrice * a.quantity : 0), 0);
        return sum + s.price + addOnsTotal;
      }, 0);

    const displaysCoveredBySaaS = this.usages.reduce((sum, u) => sum + u.displaysUsed, 0);

    return {
      totalSubscriptions,
      activeSubscriptions,
      trialSubscriptions,
      pastDueSubscriptions,
      suspendedSubscriptions,
      cancelledSubscriptions,
      expiredSubscriptions,
      estimatedMRRKz,
      displaysCoveredBySaaS,
    };
  }

  async create(data: Partial<Subscription>): Promise<Subscription> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const plan = mockPlans.find((p) => p.id === data.planId) || mockPlans[0];
    const org = mockOrganizations.find((o) => o.id === data.organizationId);

    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      organizationId: data.organizationId || 'org-talatona',
      organizationName: org?.name || data.organizationName || 'Nova Organização',
      organizationCode: org?.code || data.organizationCode || 'ORG-NEW',
      organizationType: org?.type || (data.organizationType as any) || 'CLIENT',
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      status: data.status || 'ACTIVE',
      commercialModel: data.commercialModel || 'RENTAL_SAAS',
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate,
      nextRenewalDate:
        data.nextRenewalDate ||
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      billingInterval: data.billingInterval || plan.billingInterval || 'MONTHLY',
      price: data.price !== undefined ? Number(data.price) : plan.basePrice,
      currency: 'AOA',
      displayLimit: data.displayLimit !== undefined ? Number(data.displayLimit) : plan.displayLimit,
      storageLimitGB: data.storageLimitGB !== undefined ? Number(data.storageLimitGB) : plan.storageLimitGB,
      aiCreditsIncluded:
        data.aiCreditsIncluded !== undefined ? Number(data.aiCreditsIncluded) : plan.monthlyAiCredits,
      autoRenew: data.autoRenew ?? true,
      addOns: data.addOns || [],
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.subscriptions.unshift(newSub);

    // Initialize usage entry
    this.usages.push({
      organizationId: newSub.organizationId,
      subscriptionId: newSub.id,
      displaysUsed: 0,
      storageUsedGB: 0,
      teamMembersUsed: 1,
      playlistsUsed: 0,
      schedulesUsed: 0,
      aiCreditsUsed: 0,
      lastCalculatedAt: new Date().toISOString(),
    });

    return this.enrichSubscription(newSub);
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const index = this.subscriptions.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Subscrição ${id} não encontrada.`);
    }

    const updated: Subscription = {
      ...this.subscriptions[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.subscriptions[index] = updated;
    return this.enrichSubscription(updated);
  }

  async updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    return this.update(id, { status });
  }

  async addAddOn(subscriptionId: string, addOnId: string, quantity: number = 1): Promise<Subscription> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const sub = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) throw new Error(`Subscrição ${subscriptionId} não encontrada.`);

    const addOnDef = mockAddOns.find((a) => a.id === addOnId);
    if (!addOnDef) throw new Error(`Add-On ${addOnId} não encontrado.`);

    sub.addOns = sub.addOns || [];

    const existingIndex = sub.addOns.findIndex((a) => a.addOnId === addOnId);
    if (existingIndex >= 0) {
      sub.addOns[existingIndex].quantity += quantity;
      sub.addOns[existingIndex].active = true;
    } else {
      sub.addOns.push({
        id: `subaddon-${Date.now()}`,
        subscriptionId: sub.id,
        addOnId: addOnDef.id,
        addOnCode: addOnDef.code,
        addOnName: addOnDef.name,
        quantity,
        unitPrice: addOnDef.price,
        active: true,
        addedAt: new Date().toISOString(),
      });
    }

    sub.updatedAt = new Date().toISOString();
    return this.enrichSubscription(sub);
  }

  async removeAddOn(subscriptionId: string, subAddOnId: string): Promise<Subscription> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const sub = this.subscriptions.find((s) => s.id === subscriptionId);
    if (!sub) throw new Error(`Subscrição ${subscriptionId} não encontrada.`);

    sub.addOns = sub.addOns || [];
    sub.addOns = sub.addOns.filter((a) => a.id !== subAddOnId && a.addOnId !== subAddOnId);
    sub.updatedAt = new Date().toISOString();
    return this.enrichSubscription(sub);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const index = this.subscriptions.findIndex((s) => s.id === id);
    if (index === -1) return { success: false };
    this.subscriptions.splice(index, 1);
    return { success: true };
  }
}

export const subscriptionRepository = new MockSubscriptionRepository();
