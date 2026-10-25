import { CampaignAnalytics, PlaybackEvent } from '../types/advertising';
import { playbackTrackingService } from './playbackTrackingService';
import { advertisingCampaignRepository } from '../repositories/advertisingCampaignRepository';

class CampaignAnalyticsService {
  async getCampaignOverview(campaignId: string): Promise<CampaignAnalytics> {
    const campaign = await advertisingCampaignRepository.getById(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const events = await playbackTrackingService.getCampaignPlaybackEvents(campaignId);
    
    const completedPlays = events.filter(e => e.completed).length;
    const failedPlays = events.filter(e => !!e.error).length;
    const totalDuration = events.reduce((sum, e) => sum + (e.duration || 0), 0);
    const averageDuration = events.length > 0 ? totalDuration / events.length : 0;
    const completionRate = events.length > 0 ? (completedPlays / events.length) * 100 : 0;
    
    const uniqueDisplays = new Set(events.map(e => e.displayId).filter(Boolean)).size;
    
    // Sort events by timestamp descending
    const sortedEvents = [...events].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const lastPlaybackAt = sortedEvents.length > 0 ? sortedEvents[0].timestamp : undefined;

    // Simple mock logic for impressions/reach
    const estimatedImpressions = events.length * 15;
    const estimatedReach = events.length * 8;
    const estimatedFrequency = estimatedImpressions > 0 ? estimatedImpressions / estimatedReach : 0;

    const costPerPlay = events.length > 0 ? campaign.budget / events.length : 0;

    return {
      campaignId,
      totalPlays: events.length,
      completedPlays,
      failedPlays,
      totalDuration,
      averageDuration,
      completionRate,
      uniqueDisplays,
      activeDisplays: uniqueDisplays,
      estimatedImpressions,
      estimatedReach,
      estimatedFrequency,
      spent: campaign.budget, // For mock purposes, using the full budget
      costPerPlay,
      lastPlaybackAt
    };
  }

  async getCampaignTimeline(campaignId: string): Promise<{ date: string; plays: number }[]> {
    const events = await playbackTrackingService.getCampaignPlaybackEvents(campaignId);
    const timelineMap = new Map<string, number>();

    events.forEach(e => {
      const date = new Date(e.timestamp).toISOString().split('T')[0];
      timelineMap.set(date, (timelineMap.get(date) || 0) + 1);
    });

    return Array.from(timelineMap.entries()).map(([date, plays]) => ({ date, plays })).sort((a, b) => a.date.localeCompare(b.date));
  }

  async getDisplayPerformance(campaignId: string): Promise<any[]> {
    const events = await playbackTrackingService.getCampaignPlaybackEvents(campaignId);
    const displayMap = new Map<string, PlaybackEvent[]>();

    events.forEach(e => {
      if (e.displayId) {
        const list = displayMap.get(e.displayId) || [];
        list.push(e);
        displayMap.set(e.displayId, list);
      }
    });

    return Array.from(displayMap.entries()).map(([displayId, evs]) => {
      const completed = evs.filter(e => e.completed).length;
      return {
        displayId,
        plays: evs.length,
        duration: evs.reduce((s, e) => s + e.duration, 0),
        completionRate: evs.length > 0 ? (completed / evs.length) * 100 : 0,
        estimatedImpressions: evs.length * 15
      };
    });
  }

  async getCreativePerformance(campaignId: string): Promise<any[]> {
    const events = await playbackTrackingService.getCampaignPlaybackEvents(campaignId);
    const creativeMap = new Map<string, PlaybackEvent[]>();

    events.forEach(e => {
      if (e.creativeId) {
        const list = creativeMap.get(e.creativeId) || [];
        list.push(e);
        creativeMap.set(e.creativeId, list);
      }
    });

    return Array.from(creativeMap.entries()).map(([creativeId, evs]) => {
      const completed = evs.filter(e => e.completed).length;
      return {
        creativeId,
        plays: evs.length,
        duration: evs.reduce((s, e) => s + e.duration, 0),
        completionRate: evs.length > 0 ? (completed / evs.length) * 100 : 0
      };
    });
  }

  async getGeographicPerformance(campaignId: string): Promise<any[]> {
    // In a real implementation, we'd join with display location data.
    // Here we'll just mock some data based on the events.
    const regions = ['Talatona', 'Maianga', 'Mutamba', 'Viana', 'Kilamba', 'Belas'];
    const events = await playbackTrackingService.getCampaignPlaybackEvents(campaignId);
    
    // Distribute randomly for mock
    return regions.map(region => ({
      region,
      plays: Math.floor(events.length / regions.length) + Math.floor(Math.random() * 10),
      estimatedReach: Math.floor(events.length * 8 / regions.length),
      impressions: Math.floor(events.length * 15 / regions.length),
      duration: Math.floor((events.reduce((s, e) => s + e.duration, 0)) / regions.length)
    }));
  }

  async getRealtimeReport(campaignId: string): Promise<any> {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/realtime-report`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Realtime report API fetch failed, fallback to local analytics:', e);
    }
    return null;
  }
}

export const campaignAnalyticsService = new CampaignAnalyticsService();
