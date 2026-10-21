import {
  MediaInventory,
  ClientMonetizationMetrics,
} from '../types/advertising';
import { mediaInventoryRepository } from '../repositories/mediaInventoryRepository';
import { advertisingOpportunityRepository } from '../repositories/advertisingOpportunityRepository';
import { displayRepository } from '../repositories/displayRepository';
import { mockClientMonetizationMetrics } from '../data/mockAdvertisingData';

export class MediaInventoryService {
  /**
   * Get all media inventories for an organization
   */
  async getInventories(organizationId?: string): Promise<MediaInventory[]> {
    return mediaInventoryRepository.getAll(organizationId);
  }

  /**
   * Toggle advertising monetization on a display and sync with AdvertisingOpportunity
   */
  async toggleDisplayMonetization(
    displayId: string,
    enabled: boolean,
    config?: Partial<MediaInventory>
  ): Promise<MediaInventory> {
    const existing = await mediaInventoryRepository.getByDisplayId(displayId);
    const display = await displayRepository.getById(displayId);

    let updatedInventory: MediaInventory;

    if (existing) {
      updatedInventory = await mediaInventoryRepository.update(existing.id, {
        isAdvertisingEnabled: enabled,
        status: enabled ? 'AVAILABLE' : 'UNAVAILABLE',
        ...config,
      });
    } else {
      updatedInventory = await mediaInventoryRepository.create({
        displayId,
        organizationId: display?.clientId || 'org-talatona',
        isAdvertisingEnabled: enabled,
        status: enabled ? 'AVAILABLE' : 'UNAVAILABLE',
        basePrice: config?.basePrice || 120000,
        ...config,
      });
    }

    // Sync corresponding Marketplace opportunity status
    const opp = await advertisingOpportunityRepository.getByDisplayId(displayId);
    if (opp) {
      await advertisingOpportunityRepository.update(opp.id, {
        status: enabled ? 'AVAILABLE' : 'SUSPENDED',
        basePrice: updatedInventory.basePrice,
      });
    }

    return updatedInventory;
  }

  /**
   * Get space owner monetization performance metrics
   */
  async getClientMonetizationMetrics(organizationId?: string): Promise<ClientMonetizationMetrics> {
    const inventories = await mediaInventoryRepository.getAll(organizationId);
    const eligibleCount = inventories.length || mockClientMonetizationMetrics.totalEligibleDisplays;
    const activeCount = inventories.filter((i) => i.isAdvertisingEnabled).length || mockClientMonetizationMetrics.activeAdvertisingDisplays;
    const estimatedRevenue = inventories.reduce((sum, i) => sum + (i.monthlyEstimatedRevenue || 0), 0) || mockClientMonetizationMetrics.estimatedMonthlyRevenueKz;

    return {
      totalEligibleDisplays: eligibleCount,
      activeAdvertisingDisplays: activeCount,
      averageOccupancyRate: 82.4,
      estimatedMonthlyRevenueKz: estimatedRevenue,
      activeCampaignsInNetworkCount: 6,
      nextPayoutDate: '05/09/2026',
    };
  }
}

export const mediaInventoryService = new MediaInventoryService();
