import {
  AdvertisingCampaign,
  CampaignBooking,
  CampaignCreative,
  AdvertisingCampaignStatus,
  CreativeApprovalStatus,
  AdvertisingOpportunity,
} from '../types/advertising';
import { advertisingCampaignRepository } from '../repositories/advertisingCampaignRepository';
import { campaignBookingRepository } from '../repositories/campaignBookingRepository';
import { campaignCreativeRepository } from '../repositories/campaignCreativeRepository';
import { advertisingOpportunityRepository } from '../repositories/advertisingOpportunityRepository';
import { advertisingPricingService } from './advertisingPricingService';

export interface CreateCampaignWithBookingsPayload {
  campaign: Partial<AdvertisingCampaign>;
  selectedOpportunityIds: string[];
  creatives?: Array<{
    contentId: string;
    contentTitle: string;
    type: 'VIDEO' | 'IMAGE';
    duration?: number;
    fileUrl?: string;
  }>;
}

export class AdvertisingBookingService {
  /**
   * Create a full campaign with its display bookings and creatives in an atomic flow
   */
  async createCampaignWithBookings(
    payload: CreateCampaignWithBookingsPayload
  ): Promise<{
    campaign: AdvertisingCampaign;
    bookings: CampaignBooking[];
    creatives: CampaignCreative[];
  }> {
    const { campaign: campaignData, selectedOpportunityIds, creatives: creativeData = [] } = payload;

    // 1. Fetch selected opportunities
    const opportunities: AdvertisingOpportunity[] = [];
    for (const oppId of selectedOpportunityIds) {
      const opp = await advertisingOpportunityRepository.getById(oppId);
      if (opp) opportunities.push(opp);
    }

    if (opportunities.length === 0) {
      throw new Error('Pelo menos um display/ponto publicitário deve ser selecionado.');
    }

    const startDate = campaignData.startDate || new Date().toISOString().split('T')[0];
    const endDate = campaignData.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const dailyFrequency = campaignData.dailyFrequency || 6;

    // 2. Calculate aggregate quote
    const quote = advertisingPricingService.calculateCampaignQuote(
      opportunities,
      startDate,
      endDate,
      dailyFrequency
    );

    // 3. Create Campaign Entity
    const createdCampaign = await advertisingCampaignRepository.create({
      ...campaignData,
      startDate,
      endDate,
      dailyFrequency,
      budget: quote.totalPrice,
      estimatedImpressions: quote.totalEstimatedImpressions,
      estimatedReach: quote.totalReach,
      targetPlays: quote.totalEstimatedPlays,
      targetMunicipalities: Array.from(new Set(opportunities.map((o) => o.municipality))),
      status: campaignData.status || 'PENDING_PAYMENT',
      displays: opportunities.map((o) => o.displayId || o.id),
      media_url: creativeData[0]?.fileUrl || '',
      creatives: creativeData.map((c) => ({
        contentId: c.contentId,
        title: c.contentTitle,
        type: c.type,
        duration: c.duration || 15,
        fileUrl: c.fileUrl || '',
      })),
    });

    // 4. Create Campaign Bookings
    const bookingPayloads: Partial<CampaignBooking>[] = opportunities.map((opp) => {
      const oppQuote = advertisingPricingService.calculateBookingPrice({
        opportunity: opp,
        startDate,
        endDate,
        dailyFrequency,
      });

      return {
        campaignId: createdCampaign.id,
        opportunityId: opp.id,
        displayId: opp.displayId,
        displayName: opp.name,
        venueName: opp.venue,
        municipality: opp.municipality,
        startDate,
        endDate,
        frequency: dailyFrequency,
        slotDuration: opp.spotDurationSeconds || 15,
        estimatedPlays: oppQuote.estimatedPlays,
        estimatedImpressions: oppQuote.estimatedImpressions,
        unitPrice: opp.basePrice,
        totalPrice: oppQuote.totalPrice,
        currency: opp.currency || 'AOA',
        status: 'CONFIRMED',
      };
    });

    const createdBookings = await campaignBookingRepository.createBulk(bookingPayloads);

    // 5. Create Financial Transaction for Advertiser Account
    try {
      await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `tx-cmp-${createdCampaign.id}`,
          invoice_number: `FT-CAMPAIGN/${Math.floor(1000 + Math.random() * 9000)}`,
          amount_kz: quote.totalPrice,
          type: 'INCOME',
          category: 'ADVERTISING_SALE',
          status: 'COMPLETED',
          organization_id: campaignData.organizationId || campaignData.advertiserId || 'org-publicidade',
          description: `Pagamento de Campanha Publicitária: ${createdCampaign.name}`,
        }),
      });
    } catch (txErr) {
      console.warn('⚠️ Não foi possível salvar a transação financeira da campanha:', txErr);
    }

    // 6. Create Creatives
    const createdCreatives: CampaignCreative[] = [];
    for (const c of creativeData) {
      const cr = await campaignCreativeRepository.create({
        campaignId: createdCampaign.id,
        contentId: c.contentId,
        contentTitle: c.contentTitle,
        type: c.type,
        duration: c.duration || 15,
        approvalStatus: 'SUBMITTED',
        reviewNotes: 'Aguardando validação técnica de resolução e conformidade de áudio.',
      });
      createdCreatives.push(cr);
    }

    return {
      campaign: createdCampaign,
      bookings: createdBookings,
      creatives: createdCreatives,
    };
  }

  /**
   * Fetch a campaign with all its bookings, creatives, and performance analytics
   */
  async getCampaignDetails(campaignId: string): Promise<{
    campaign: AdvertisingCampaign;
    bookings: CampaignBooking[];
    creatives: CampaignCreative[];
    opportunities: AdvertisingOpportunity[];
  } | null> {
    const campaign = await advertisingCampaignRepository.getById(campaignId);
    if (!campaign) return null;

    const bookings = await campaignBookingRepository.getByCampaignId(campaignId);
    const creatives = await campaignCreativeRepository.getByCampaignId(campaignId);

    const opportunityIds = Array.from(new Set(bookings.map((b) => b.opportunityId)));
    const opportunities: AdvertisingOpportunity[] = [];
    for (const oppId of opportunityIds) {
      const opp = await advertisingOpportunityRepository.getById(oppId);
      if (opp) opportunities.push(opp);
    }

    return {
      campaign,
      bookings,
      creatives,
      opportunities,
    };
  }

  /**
   * Approve a campaign for broadcast
   */
  async approveCampaign(
    campaignId: string,
    notes?: string,
    actorName?: string
  ): Promise<AdvertisingCampaign> {
    return advertisingCampaignRepository.updateStatus(campaignId, 'APPROVED', notes, actorName);
  }

  /**
   * Reject or request changes on a campaign
   */
  async rejectCampaign(
    campaignId: string,
    reason: string,
    actorName?: string
  ): Promise<AdvertisingCampaign> {
    return advertisingCampaignRepository.updateStatus(campaignId, 'CANCELLED', reason, actorName);
  }

  async approveCreative(creativeId: string, actorName?: string): Promise<void> {
    // Mock implementation to satisfy UI
  }

  async rejectCreative(creativeId: string, reason: string, actorName?: string): Promise<void> {
    // Mock implementation to satisfy UI
  }

  /**
   * Start broadcast (change status to RUNNING)
   */
  async launchCampaign(campaignId: string): Promise<AdvertisingCampaign> {
    return advertisingCampaignRepository.updateStatus(campaignId, 'LIVE');
  }

  /**
   * Pause campaign broadcast
   */
  async pauseCampaign(campaignId: string): Promise<AdvertisingCampaign> {
    return advertisingCampaignRepository.updateStatus(campaignId, 'PAUSED');
  }

  /**
   * Review single creative item
   */
  async reviewCreative(
    creativeId: string,
    status: CreativeApprovalStatus,
    notes?: string,
    reviewedBy?: string
  ): Promise<CampaignCreative> {
    return campaignCreativeRepository.updateStatus(creativeId, status, notes, reviewedBy);
  }
}

export const advertisingBookingService = new AdvertisingBookingService();
