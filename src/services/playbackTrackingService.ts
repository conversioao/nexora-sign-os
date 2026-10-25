import { PlaybackEvent } from '../types/advertising';
import { playbackTrackingRepository } from '../repositories/playbackTrackingRepository';
import { advertisingCampaignRepository } from '../repositories/advertisingCampaignRepository';
import { displayRepository } from '../repositories/displayRepository';
import { campaignCreativeRepository } from '../repositories/campaignCreativeRepository';

class PlaybackTrackingService {
  async recordPlayback(event: Omit<PlaybackEvent, 'id' | 'timestamp'>): Promise<PlaybackEvent> {
    const recorded = await playbackTrackingRepository.recordPlayback(event);
    
    // In a real app, this might emit an event to update analytics asynchronously
    
    return recorded;
  }

  async getCampaignPlaybackEvents(campaignId: string): Promise<PlaybackEvent[]> {
    return playbackTrackingRepository.findByCampaignId(campaignId);
  }

  async getDisplayPlaybackEvents(displayId: string): Promise<PlaybackEvent[]> {
    return playbackTrackingRepository.findByDisplayId(displayId);
  }

  async getCreativePlaybackEvents(creativeId: string): Promise<PlaybackEvent[]> {
    return playbackTrackingRepository.findByCreativeId(creativeId);
  }

  async calculatePlayCount(campaignId: string): Promise<number> {
    const events = await this.getCampaignPlaybackEvents(campaignId);
    return events.length;
  }

  async calculateTotalDuration(campaignId: string): Promise<number> {
    const events = await this.getCampaignPlaybackEvents(campaignId);
    return events.reduce((sum, e) => sum + (e.duration || 0), 0);
  }

  async calculateAverageDuration(campaignId: string): Promise<number> {
    const events = await this.getCampaignPlaybackEvents(campaignId);
    if (events.length === 0) return 0;
    const total = events.reduce((sum, e) => sum + (e.duration || 0), 0);
    return total / events.length;
  }

  async calculateCompletionRate(campaignId: string): Promise<number> {
    const events = await this.getCampaignPlaybackEvents(campaignId);
    if (events.length === 0) return 0;
    const completed = events.filter((e) => e.completed).length;
    return (completed / events.length) * 100;
  }
}

export const playbackTrackingService = new PlaybackTrackingService();
