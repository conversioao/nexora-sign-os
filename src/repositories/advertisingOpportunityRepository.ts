import {
  AdvertisingOpportunity,
  MarketplaceFilterState,
  OpportunityStatus,
} from '../types/advertising';

export interface IAdvertisingOpportunityRepository {
  getAll(filters?: Partial<MarketplaceFilterState>): Promise<AdvertisingOpportunity[]>;
  getById(id: string): Promise<AdvertisingOpportunity | null>;
  getByDisplayId(displayId: string): Promise<AdvertisingOpportunity | null>;
  getSimilar(id: string, limit?: number): Promise<AdvertisingOpportunity[]>;
  create(data: Partial<AdvertisingOpportunity>): Promise<AdvertisingOpportunity>;
  update(id: string, data: Partial<AdvertisingOpportunity>): Promise<AdvertisingOpportunity>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class RealAdvertisingOpportunityRepository implements IAdvertisingOpportunityRepository {
  async getAll(filters?: Partial<MarketplaceFilterState>): Promise<AdvertisingOpportunity[]> {
    try {
      const res = await fetch('/api/displays');
      const dbDisplays = await res.json();
      const onlineDisplays = dbDisplays.filter((d: any) => (d.status || '').toUpperCase() === 'ONLINE');

      let result: AdvertisingOpportunity[] = onlineDisplays.map((d: any) => {
        let specs: any = {};
        try {
          specs = typeof d.specs === 'string' ? JSON.parse(d.specs) : (d.specs || {});
        } catch {}

        const maxSlots = Number(d.max_ad_slots) || Number(specs.max_ad_slots) || 8;
        const occupied = Math.max(
          Number(d.playlist_items_count) || 0,
          Number(d.active_campaign_count) || 0
        );
        const remaining = Math.max(0, maxSlots - occupied);
        const isFull = remaining === 0;

        const locParts = (d.location || 'Talatona, Luanda').split(',');
        const venue = locParts[0]?.trim() || d.name;
        const municipality = locParts[1]?.trim() || 'Talatona';

        return {
          id: d.id,
          displayId: d.id,
          inventoryId: `inv-${d.id}`,
          organizationId: d.organization_id || 'org-talatona',
          name: d.name,
          description: `Ponto digital ${d.name} em ${d.location || 'Luanda'}. Transmissão em alta resolução e monitoramento em tempo real.`,
          location: d.location || 'Luanda, Angola',
          municipality: municipality,
          venue: venue,
          venueType: d.type === 'TOTEM' ? 'SHOPPING_CENTER' : 'RETAIL_STORE',
          address: d.location || 'Luanda',
          latitude: -8.9168,
          longitude: 13.1895,
          orientation: d.orientation || 'LANDSCAPE',
          screenSize: specs.platform ? `${specs.platform} HD` : '55"',
          resolution: d.resolution || specs.resolution || '1920x1080',
          imageUrl: d.cover_image_url || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
          estimatedDailyReach: Number(d.estimated_daily_reach) || 15000,
          estimatedMonthlyReach: (Number(d.estimated_daily_reach) || 15000) * 30,
          estimatedDailyImpressions: (Number(d.estimated_daily_reach) || 15000) * 2,
          basePrice: Number(d.daily_rate_kz) || 95000,
          currency: 'AOA',
          status: isFull ? 'BOOKED' : 'AVAILABLE',
          pricingModel: 'PER_DAY',
          spotDurationSeconds: 15,
          displayCode: d.device_code || d.id,
          maxAdSlots: maxSlots,
          totalAdSlots: maxSlots,
          remainingAdSlots: remaining,
          audienceProfile: {
            ageRanges: { '18-24': 20, '25-34': 40, '35-44': 25, '45+': 15 },
            genderDistribution: { male: 50, female: 50 },
            estimatedFootfall: 35000,
            peakHours: ['12:00 - 14:00', '18:00 - 21:00'],
            weekdayProfile: 'Fluxo contínuo de clientes e consumidores de alta renda.',
            weekendProfile: 'Famílias e jovens em lazer e compras.',
            audienceCategories: ['Executivos', 'Varejo', 'Geral'],
            socioeconomicTier: 'A/B',
          },
        };
      });

      if (!filters) return result;

      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const q = filters.searchQuery.toLowerCase().trim();
        result = result.filter(
          (o) =>
            o.name.toLowerCase().includes(q) ||
            o.venue.toLowerCase().includes(q) ||
            o.municipality.toLowerCase().includes(q) ||
            o.location.toLowerCase().includes(q)
        );
      }

      if (filters.venueType && filters.venueType !== 'ALL') {
        result = result.filter((o) => o.venueType === filters.venueType);
      }

      if (filters.municipality && filters.municipality !== 'ALL') {
        result = result.filter(
          (o) => o.municipality.toLowerCase().includes(filters.municipality!.toLowerCase()) ||
                 o.location.toLowerCase().includes(filters.municipality!.toLowerCase())
        );
      }

      if (filters.orientation && filters.orientation !== 'ALL') {
        result = result.filter((o) => o.orientation === filters.orientation);
      }

      if (filters.availability && filters.availability !== 'ALL') {
        result = result.filter((o) => o.status === filters.availability);
      }

      return result;
    } catch (err) {
      console.error('Erro ao carregar oportunidades de displays reais:', err);
      return [];
    }
  }

  async getById(id: string): Promise<AdvertisingOpportunity | null> {
    const list = await this.getAll();
    return list.find((o) => o.id === id) || null;
  }

  async getByDisplayId(displayId: string): Promise<AdvertisingOpportunity | null> {
    const list = await this.getAll();
    return list.find((o) => o.displayId === displayId) || null;
  }

  async getSimilar(id: string, limit: number = 3): Promise<AdvertisingOpportunity[]> {
    const list = await this.getAll();
    return list.filter((o) => o.id !== id).slice(0, limit);
  }

  async create(data: Partial<AdvertisingOpportunity>): Promise<AdvertisingOpportunity> {
    const opp: any = { ...data, id: data.id || `opp-${Date.now()}` };
    return opp;
  }

  async update(id: string, data: Partial<AdvertisingOpportunity>): Promise<AdvertisingOpportunity> {
    const opp: any = { ...data, id };
    return opp;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    return { success: true };
  }
}

export const advertisingOpportunityRepository = new RealAdvertisingOpportunityRepository();
