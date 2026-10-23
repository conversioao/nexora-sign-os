import { MediaInventory, MediaInventoryStatus } from '../types/advertising';
import { mockMediaInventories } from '../data/mockAdvertisingData';

export interface IMediaInventoryRepository {
  getAll(organizationId?: string): Promise<MediaInventory[]>;
  getById(id: string): Promise<MediaInventory | null>;
  getByDisplayId(displayId: string): Promise<MediaInventory | null>;
  create(data: Partial<MediaInventory>): Promise<MediaInventory>;
  update(id: string, data: Partial<MediaInventory>): Promise<MediaInventory>;
  updateByDisplayId(displayId: string, data: Partial<MediaInventory>): Promise<MediaInventory>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class MockMediaInventoryRepository implements IMediaInventoryRepository {
  private inventories: MediaInventory[] = [...mockMediaInventories];

  async getAll(organizationId?: string): Promise<MediaInventory[]> {
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          let list: MediaInventory[] = rows.map((r: any) => ({
            id: r.id,
            displayId: r.displayId,
            organizationId: r.organizationId || 'org-nexora',
            isAdvertisingEnabled: r.isAdvertisingEnabled ?? true,
            inventoryType: r.inventoryType || 'INDOOR_SCREEN',
            slotDuration: 15,
            dailySlots: 240,
            monthlyCapacity: 7200,
            basePrice: r.basePrice || 120000,
            currency: 'AOA',
            pricingModel: 'PER_DAY',
            minimumBookingDays: 3,
            maximumBookingDays: 90,
            availableFrom: new Date().toISOString(),
            status: r.isAdvertisingEnabled ? 'AVAILABLE' : 'UNAVAILABLE',
            allowedCategories: ['RETAIL', 'TELECOM', 'BANKING', 'FOOD'],
            blockedCategories: [],
            allowedTimeRanges: '08:00 - 22:00',
            occupiedSlotsPercentage: r.occupiedSlotsPercentage || 75,
            currentActiveCampaignsCount: 2,
            monthlyEstimatedRevenue: r.monthlyEstimatedRevenue || 36000,
            displayCode: r.displayCode,
            displayName: r.displayName,
            location: r.location,
          }));
          if (organizationId) {
            list = list.filter((inv) => inv.organizationId === organizationId);
          }
          return list;
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar inventário de mídia da API:', e);
    }

    if (organizationId) {
      return this.inventories.filter((inv) => inv.organizationId === organizationId);
    }
    return [...this.inventories];
  }

  async getById(id: string): Promise<MediaInventory | null> {
    await new Promise((r) => setTimeout(r, 20));
    const inv = this.inventories.find((i) => i.id === id);
    return inv ? { ...inv } : null;
  }

  async getByDisplayId(displayId: string): Promise<MediaInventory | null> {
    await new Promise((r) => setTimeout(r, 20));
    const inv = this.inventories.find((i) => i.displayId === displayId);
    return inv ? { ...inv } : null;
  }

  async create(data: Partial<MediaInventory>): Promise<MediaInventory> {
    await new Promise((r) => setTimeout(r, 40));
    const newInventory: MediaInventory = {
      id: `inv-${Date.now().toString().slice(-4)}`,
      displayId: data.displayId || 'dsp-01',
      organizationId: data.organizationId || 'org-nexora',
      isAdvertisingEnabled: data.isAdvertisingEnabled ?? true,
      inventoryType: data.inventoryType || 'INDOOR_SCREEN',
      slotDuration: data.slotDuration || 15,
      dailySlots: data.dailySlots || 240,
      monthlyCapacity: data.monthlyCapacity || 7200,
      basePrice: data.basePrice || 100000,
      currency: 'AOA',
      pricingModel: data.pricingModel || 'PER_DAY',
      minimumBookingDays: data.minimumBookingDays || 1,
      maximumBookingDays: data.maximumBookingDays || 90,
      availableFrom: data.availableFrom || new Date().toISOString(),
      status: data.status || 'AVAILABLE',
      allowedCategories: data.allowedCategories || ['RETAIL', 'TELECOM', 'BANKING', 'FOOD'],
      blockedCategories: data.blockedCategories || [],
      allowedTimeRanges: data.allowedTimeRanges || '08:00 - 22:00',
      occupiedSlotsPercentage: data.occupiedSlotsPercentage || 0,
      currentActiveCampaignsCount: 0,
      monthlyEstimatedRevenue: 0,
      ...data,
    };
    this.inventories.unshift(newInventory);
    return { ...newInventory };
  }

  async update(id: string, data: Partial<MediaInventory>): Promise<MediaInventory> {
    await new Promise((r) => setTimeout(r, 40));
    const index = this.inventories.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`MediaInventory ${id} not found`);
    }
    const updated = { ...this.inventories[index], ...data };
    this.inventories[index] = updated;
    return { ...updated };
  }

  async updateByDisplayId(displayId: string, data: Partial<MediaInventory>): Promise<MediaInventory> {
    await new Promise((r) => setTimeout(r, 40));
    const index = this.inventories.findIndex((i) => i.displayId === displayId);
    if (index === -1) {
      // Create if doesn't exist
      return this.create({ displayId, ...data });
    }
    const updated = { ...this.inventories[index], ...data };
    this.inventories[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((r) => setTimeout(r, 30));
    this.inventories = this.inventories.filter((i) => i.id !== id);
    return { success: true };
  }
}

export const mediaInventoryRepository = new MockMediaInventoryRepository();
