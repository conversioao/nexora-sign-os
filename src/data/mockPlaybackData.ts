import { PlaybackEvent } from '../types/advertising';

/**
 * Mock Proof of Play audit log events for Luanda Digital Out-of-Home network
 */
const generateMockEvents = (): PlaybackEvent[] => {
  const events: PlaybackEvent[] = [];
  const now = Date.now();

  const campaignConfigs = [
    {
      campaignId: 'ad-cmp-001',
      creativeId: 'crc-001',
      contentId: 'cnt-001',
      displays: [
        { id: 'dsp-01', code: 'NEX-DS-00001', loc: 'Talatona Shopping — Atrium Central 4K' },
        { id: 'dsp-03', code: 'NEX-DS-00003', loc: 'Aeroporto 4 de Fevereiro — VIP' },
        { id: 'dsp-06', code: 'NEX-DS-00006', loc: 'Marginal de Luanda — Totem LED' },
      ],
      duration: 30,
      count: 120,
    },
    {
      campaignId: 'ad-cmp-002',
      creativeId: 'crc-002',
      contentId: 'cnt-002',
      displays: [
        { id: 'dsp-02', code: 'NEX-DS-00002', loc: 'Mutamba Plaza — Torre Executiva' },
        { id: 'dsp-05', code: 'NEX-DS-00005', loc: 'Epic Sana Luanda — Lobby' },
      ],
      duration: 15,
      count: 90,
    },
  ];

  let idCounter = 1000;

  campaignConfigs.forEach((cfg) => {
    for (let i = 0; i < cfg.count; i++) {
      const disp = cfg.displays[i % cfg.displays.length];
      const minutesAgo = Math.floor(Math.random() * (14 * 24 * 60)); // past 14 days
      const startTime = new Date(now - minutesAgo * 60 * 1000);
      const isFailed = i === 13 || i === 47; // small realistic failure rate
      const isPartial = i === 22 || i === 71;

      const duration = isFailed ? 0 : isPartial ? Math.floor(cfg.duration * 0.6) : cfg.duration;
      const endTime = new Date(startTime.getTime() + duration * 1000);
      const status = isFailed ? 'FAILED' : isPartial ? 'PARTIAL' : 'PLAYED';

      const hexHash = Math.random().toString(16).substring(2, 10).toUpperCase();

      events.push({
        id: `pop-evt-${idCounter++}`,
        campaignId: cfg.campaignId,
        creativeId: cfg.creativeId,
        contentId: cfg.contentId,
        displayId: disp.id,
        deviceId: `dev-${disp.id}`,
        startedAt: startTime.toISOString(),
        endedAt: endTime.toISOString(),
        duration,
        completed: !isFailed && !isPartial,
        error: isFailed ? 'Network packet loss or screen power interruption' : undefined,
        timestamp: startTime.toISOString(),
        source: 'PLAYER',
        percentagePlayed: isFailed ? 0 : isPartial ? 60 : 100,
        status: status as any,
        location: disp.loc,
        displayCode: disp.code,
        signature: `SHA256:NEX-${hexHash}-${startTime.getTime().toString(36)}`,
      });
    }
  });

  // Sort descending by timestamp
  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const mockPlaybackEvents: PlaybackEvent[] = generateMockEvents();
