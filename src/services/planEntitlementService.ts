import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { planRepository } from '../repositories/planRepository';
import { PlanFeatures, PlanEntitlements, SubscriptionUsageSummary } from '../types/saas';

export class PlanEntitlementService {
  /**
   * Checks if an organization's active subscription plan includes a specific commercial feature.
   * Note: This checks commercial capability, NOT RBAC permissions.
   */
  async hasFeature(organizationId: string, featureKey: keyof PlanFeatures): Promise<boolean> {
    const sub = await subscriptionRepository.getByOrganizationId(organizationId);
    if (!sub) return false;

    // Past due or suspended subscriptions may have restricted feature access
    if (sub.status === 'SUSPENDED' || sub.status === 'EXPIRED' || sub.status === 'CANCELLED') {
      return false;
    }

    const plan = await planRepository.getById(sub.planId);
    if (!plan) return false;

    return Boolean(plan.features[featureKey]);
  }

  /**
   * Retrieves the quantitative commercial limit for a specific metric for an organization.
   * Takes into account plan base entitlements and active add-ons.
   */
  async getLimit(organizationId: string, entitlementKey: keyof PlanEntitlements): Promise<number> {
    const sub = await subscriptionRepository.getByOrganizationId(organizationId);
    if (!sub) return 0;

    const plan = await planRepository.getById(sub.planId);
    if (!plan) return 0;

    let baseLimit = plan.entitlements[entitlementKey] || 0;

    // Apply add-ons adjustments
    const addOns = sub.addOns || [];

    if (entitlementKey === 'maxDisplays') {
      const extra = addOns
        .filter((a) => a.active && a.addOnCode.includes('DISPLAY'))
        .reduce((sum, a) => sum + a.quantity, 0);
      return sub.displayLimit + extra;
    }

    if (entitlementKey === 'maxStorageGB') {
      const extra = addOns
        .filter((a) => a.active && a.addOnCode.includes('STORAGE'))
        .reduce((sum, a) => sum + (a.quantity * 50), 0);
      return sub.storageLimitGB + extra;
    }

    if (entitlementKey === 'monthlyAiCredits') {
      const extra = addOns
        .filter((a) => a.active && a.addOnCode.includes('AI_CREDITS'))
        .reduce((sum, a) => sum + (a.quantity * 1000), 0);
      return sub.aiCreditsIncluded + extra;
    }

    if (entitlementKey === 'maxVideoGenerations') {
      const extra = addOns
        .filter((a) => a.active && a.addOnCode.includes('VIDEO'))
        .reduce((sum, a) => sum + (a.quantity * 20), 0);
      return baseLimit + extra;
    }

    return baseLimit;
  }

  /**
   * Checks whether an organization is currently within its entitlement limit for an operation.
   */
  async checkLimit(
    organizationId: string,
    entitlementKey: keyof PlanEntitlements,
    currentCount: number
  ): Promise<{ allowed: boolean; limit: number; remaining: number; percentage: number }> {
    const limit = await this.getLimit(organizationId, entitlementKey);
    if (limit === 0) {
      return { allowed: false, limit: 0, remaining: 0, percentage: 100 };
    }

    const remaining = Math.max(0, limit - currentCount);
    const percentage = Math.round((currentCount / limit) * 100);
    const allowed = currentCount < limit;

    return {
      allowed,
      limit,
      remaining,
      percentage,
    };
  }

  /**
   * Retrieves full usage summary with metrics and warning alerts.
   */
  async getUsageSummary(organizationId: string): Promise<SubscriptionUsageSummary | null> {
    return subscriptionRepository.getUsageSummary(organizationId);
  }

  /**
   * Generates operational and commercial warning alerts for a tenant.
   */
  async getAlertsForUsage(organizationId: string): Promise<string[]> {
    const summary = await this.getUsageSummary(organizationId);
    return summary?.alerts || [];
  }
}

export const planEntitlementService = new PlanEntitlementService();
