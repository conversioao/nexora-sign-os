import { AdvertisingCampaign, CampaignDeliveryStatus } from '../types/advertising';
import { advertisingCampaignRepository } from '../repositories/advertisingCampaignRepository';
import { campaignBookingRepository } from '../repositories/campaignBookingRepository';
import { campaignCreativeRepository } from '../repositories/campaignCreativeRepository';
import { playerGateway } from '../gateways/playerGateway';
import { alertRepository } from '../repositories/alertRepository';
import { playbackTrackingService } from './playbackTrackingService';

export interface IDeliveryService {
  publishCampaign(campaignId: string): Promise<boolean>;
  pauseCampaign(campaignId: string): Promise<boolean>;
  resumeCampaign(campaignId: string): Promise<boolean>;
  stopCampaign(campaignId: string): Promise<boolean>;
  scheduleCampaign(campaignId: string, startDate: string): Promise<boolean>;
  getDeliveryStatus(campaignId: string): Promise<CampaignDeliveryStatus>;
}

class MockDeliveryService implements IDeliveryService {
  async publishCampaign(campaignId: string): Promise<boolean> {
    const campaign = await advertisingCampaignRepository.getById(campaignId);
    if (!campaign) return false;

    const [bookings, creatives] = await Promise.all([
      campaignBookingRepository.getByCampaignId(campaignId),
      campaignCreativeRepository.getByCampaignId(campaignId),
    ]);

    // 1. Trigger backend approval and playlist injection
    try {
      await fetch(`/api/campaigns/${campaignId}/approve`, { method: 'POST' });
    } catch (e) {
      console.warn('Backend approve call error, updating repository directly', e);
    }

    // 2. Update Campaign to LIVE
    await advertisingCampaignRepository.update(campaignId, {
      status: 'LIVE',
      updatedAt: new Date().toISOString(),
    });

    // 3. Update Bookings to ACTIVE
    for (const b of bookings) {
      await campaignBookingRepository.update(b.id, { status: 'ACTIVE' });
      // Notify Player Gateway for each display
      try {
        await playerGateway.sendCommand(b.displayId, 'REFRESH_CONTENT' as any);
      } catch (e) {
        console.warn('Gateway command error', e);
      }
    }

    // 3. Emit initial proof of play events
    const primaryCreative = creatives[0];
    for (const b of bookings) {
      await playbackTrackingService.recordPlayback({
        campaignId,
        creativeId: primaryCreative?.id || 'crc-live',
        contentId: primaryCreative?.contentId || 'cnt-live',
        displayId: b.displayId,
        deviceId: `dev-${b.displayId}`,
        startedAt: new Date(Date.now() - 30000).toISOString(),
        endedAt: new Date().toISOString(),
        duration: primaryCreative?.duration || 15,
        completed: true,
        source: 'PLAYER',
        percentagePlayed: 100,
        status: 'PLAYED',
        location: b.displayName || b.venueName || b.municipality,
        displayCode: (b as any).displayCode || `NEX-DS-${b.displayId}`,
      });
    }

    // 4. Create real-time notification alert
    await alertRepository.createAlert({
      organizationId: campaign.organizationId || 'org-publicidade',
      title: `Campanha "${campaign.name}" Publicada!`,
      description: `Grade publicitária sincronizada com ${bookings.length} displays em Luanda. Veiculação em tempo real iniciada.`,
      severity: 'INFO',
      category: 'SCHEDULE',
      location: campaign.targetMunicipalities?.join(', ') || 'Luanda',
      actionRequired: 'Monitorar métricas de Proof-of-Play no dashboard.',
      resolved: false,
    });

    return true;
  }

  async pauseCampaign(campaignId: string): Promise<boolean> {
    const campaign = await advertisingCampaignRepository.getById(campaignId);
    if (!campaign) return false;

    await advertisingCampaignRepository.update(campaignId, { status: 'PAUSED' });
    const bookings = await campaignBookingRepository.getByCampaignId(campaignId);
    for (const b of bookings) {
      await campaignBookingRepository.update(b.id, { status: 'HELD' });
    }

    await alertRepository.createAlert({
      organizationId: campaign.organizationId || 'org-publicidade',
      title: `Campanha "${campaign.name}" Pausada`,
      description: `A veiculação da campanha foi temporariamente suspensa nos displays.`,
      severity: 'WARNING',
      category: 'SCHEDULE',
      location: 'Rede Nexora',
      resolved: false,
    });

    return true;
  }

  async resumeCampaign(campaignId: string): Promise<boolean> {
    const campaign = await advertisingCampaignRepository.getById(campaignId);
    if (!campaign) return false;

    await advertisingCampaignRepository.update(campaignId, { status: 'LIVE' });
    const bookings = await campaignBookingRepository.getByCampaignId(campaignId);
    for (const b of bookings) {
      await campaignBookingRepository.update(b.id, { status: 'ACTIVE' });
    }
    return true;
  }

  async stopCampaign(campaignId: string): Promise<boolean> {
    const campaign = await advertisingCampaignRepository.getById(campaignId);
    if (!campaign) return false;

    await advertisingCampaignRepository.update(campaignId, { status: 'COMPLETED' });
    const bookings = await campaignBookingRepository.getByCampaignId(campaignId);
    for (const b of bookings) {
      await campaignBookingRepository.update(b.id, { status: 'COMPLETED' });
    }
    return true;
  }

  async scheduleCampaign(campaignId: string, startDate: string): Promise<boolean> {
    const campaign = await advertisingCampaignRepository.getById(campaignId);
    if (!campaign) return false;

    await advertisingCampaignRepository.update(campaignId, {
      status: 'SCHEDULED',
      startDate,
    });
    return true;
  }

  async getDeliveryStatus(campaignId: string): Promise<CampaignDeliveryStatus> {
    const campaign = await advertisingCampaignRepository.getById(campaignId);
    if (!campaign) return 'FAILED';

    switch (campaign.status) {
      case 'DRAFT':
      case 'PENDING_REVIEW':
      case 'APPROVED':
        return 'NOT_STARTED';
      case 'SCHEDULED':
        return 'QUEUED';
      case 'LIVE':
        return 'DELIVERING';
      case 'PAUSED':
        return 'PAUSED';
      case 'COMPLETED':
      case 'CANCELLED':
        return 'COMPLETED';
      default:
        return 'FAILED';
    }
  }
}

export const deliveryService = new MockDeliveryService();

