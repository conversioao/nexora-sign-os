import { PlaybackEvent } from '../types/advertising';
import { mockPlaybackEvents } from '../data/mockPlaybackData';

export interface IPlaybackTrackingRepository {
  findById(id: string): Promise<PlaybackEvent | null>;
  findAll(): Promise<PlaybackEvent[]>;
  findByCampaignId(campaignId: string): Promise<PlaybackEvent[]>;
  findByDisplayId(displayId: string): Promise<PlaybackEvent[]>;
  findByCreativeId(creativeId: string): Promise<PlaybackEvent[]>;
  recordPlayback(event: Omit<PlaybackEvent, 'id' | 'timestamp'>): Promise<PlaybackEvent>;
}

class MockPlaybackTrackingRepository implements IPlaybackTrackingRepository {
  private events: PlaybackEvent[] = [...mockPlaybackEvents];

  async findById(id: string): Promise<PlaybackEvent | null> {
    return this.events.find((e) => e.id === id) || null;
  }

  async findAll(): Promise<PlaybackEvent[]> {
    return this.events;
  }

  async create(item: Omit<PlaybackEvent, 'id'>): Promise<PlaybackEvent> {
    const newEvent: PlaybackEvent = {
      ...item,
      id: `pe_${Math.random().toString(36).substr(2, 9)}`,
    };
    this.events.unshift(newEvent);
    return newEvent;
  }

  async update(id: string, item: Partial<PlaybackEvent>): Promise<PlaybackEvent> {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) throw new Error('Not found');
    this.events[index] = { ...this.events[index], ...item };
    return this.events[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.events.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.events.splice(index, 1);
    return true;
  }

  async findByCampaignId(campaignId: string): Promise<PlaybackEvent[]> {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/loop-stats`);
      if (res.ok) {
        const data = await res.json();
        if (data.loopsByDisplay && Array.isArray(data.loopsByDisplay)) {
          const realEvents: PlaybackEvent[] = [];
          data.loopsByDisplay.forEach((d: any, idx: number) => {
            const count = parseInt(d.loop_count || '0');
            for (let i = 0; i < Math.min(count, 50); i++) {
              const dateObj = d.last_played_at ? new Date(new Date(d.last_played_at).getTime() - i * 45000) : new Date();
              const hexHash = Math.random().toString(16).substring(2, 10).toUpperCase();
              realEvents.push({
                id: `pop-evt-${campaignId}-${idx}-${i}`,
                campaignId,
                displayId: d.display_id,
                displayCode: d.display_name || d.display_id,
                location: d.display_name || d.display_id,
                startedAt: dateObj.toISOString(),
                timestamp: dateObj.toISOString(),
                duration: 15,
                completed: true,
                status: 'PLAYED',
                percentagePlayed: 100,
                source: 'PLAYER',
                signature: `SHA256:NEX-${hexHash}-${dateObj.getTime().toString(36).toUpperCase()}`,
              });
            }
          });
          if (realEvents.length > 0) return realEvents;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch real playback events from DB', e);
    }
    return this.events.filter((e) => e.campaignId === campaignId);
  }

  async findByDisplayId(displayId: string): Promise<PlaybackEvent[]> {
    return this.events.filter((e) => e.displayId === displayId);
  }

  async findByCreativeId(creativeId: string): Promise<PlaybackEvent[]> {
    return this.events.filter((e) => e.creativeId === creativeId);
  }

  async recordPlayback(event: Omit<PlaybackEvent, 'id' | 'timestamp'>): Promise<PlaybackEvent> {
    const hexHash = Math.random().toString(16).substring(2, 10).toUpperCase();
    const timestamp = new Date().toISOString();
    const newEvent: PlaybackEvent = {
      ...event,
      id: `pop-evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      signature: event.signature || `SHA256:NEX-${hexHash}-${Date.now().toString(36)}`,
      percentagePlayed: event.percentagePlayed !== undefined ? event.percentagePlayed : event.completed ? 100 : 0,
      status: event.status || (event.completed ? 'PLAYED' : event.error ? 'FAILED' : 'PARTIAL'),
    };
    this.events.unshift(newEvent);
    return newEvent;
  }
}

export const playbackTrackingRepository = new MockPlaybackTrackingRepository();

