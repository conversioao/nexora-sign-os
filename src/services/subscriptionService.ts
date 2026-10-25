import { subscriptionRepository, ISubscriptionRepository } from '../repositories/subscriptionRepository';
import { addOnRepository, IAddOnRepository } from '../repositories/addOnRepository';
import {
  Subscription,
  SubscriptionFilters,
  SubscriptionKPIs,
  SubscriptionStatus,
  SubscriptionUsage,
  SubscriptionUsageSummary,
  AddOn,
} from '../types/saas';

export class SubscriptionService {
  constructor(
    private readonly subRepo: ISubscriptionRepository = subscriptionRepository,
    private readonly addOnRepo: IAddOnRepository = addOnRepository
  ) {}

  async getSubscriptions(filters?: SubscriptionFilters): Promise<Subscription[]> {
    return this.subRepo.getAll(filters);
  }

  async getSubscriptionById(id: string): Promise<Subscription | null> {
    return this.subRepo.getById(id);
  }

  async getSubscription(organizationId: string): Promise<Subscription | null> {
    return this.subRepo.getByOrganizationId(organizationId);
  }

  async getSubscriptionStatus(organizationId: string): Promise<SubscriptionStatus | 'NO_SUBSCRIPTION'> {
    const sub = await this.subRepo.getByOrganizationId(organizationId);
    return sub ? sub.status : 'NO_SUBSCRIPTION';
  }

  async getSubscriptionUsage(organizationId: string): Promise<SubscriptionUsage | null> {
    return this.subRepo.getUsage(organizationId);
  }

  async getSubscriptionUsageSummary(organizationId: string): Promise<SubscriptionUsageSummary | null> {
    return this.subRepo.getUsageSummary(organizationId);
  }

  async getKPIs(): Promise<SubscriptionKPIs> {
    return this.subRepo.getKPIs();
  }

  async createSubscription(data: Partial<Subscription>): Promise<Subscription> {
    return this.subRepo.create(data);
  }

  async updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
    return this.subRepo.update(id, data);
  }

  async updateSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    return this.subRepo.updateStatus(id, status);
  }

  async addAddOn(subscriptionId: string, addOnId: string, quantity: number = 1): Promise<Subscription> {
    return this.subRepo.addAddOn(subscriptionId, addOnId, quantity);
  }

  async removeAddOn(subscriptionId: string, subAddOnId: string): Promise<Subscription> {
    return this.subRepo.removeAddOn(subscriptionId, subAddOnId);
  }

  async getAvailableAddOns(): Promise<AddOn[]> {
    return this.addOnRepo.getAll('ACTIVE');
  }

  async deleteSubscription(id: string): Promise<{ success: boolean }> {
    return this.subRepo.delete(id);
  }
}

export const subscriptionService = new SubscriptionService();
