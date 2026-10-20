import { CampaignBooking } from '../types/advertising';
import { mockCampaignBookings } from '../data/mockAdvertisingData';

export interface ICampaignBookingRepository {
  getAll(): Promise<CampaignBooking[]>;
  getByCampaignId(campaignId: string): Promise<CampaignBooking[]>;
  getByOpportunityId(opportunityId: string): Promise<CampaignBooking[]>;
  getByDisplayId(displayId: string): Promise<CampaignBooking[]>;
  create(data: Partial<CampaignBooking>): Promise<CampaignBooking>;
  createBulk(items: Partial<CampaignBooking>[]): Promise<CampaignBooking[]>;
  update(id: string, data: Partial<CampaignBooking>): Promise<CampaignBooking>;
  delete(id: string): Promise<{ success: boolean }>;
  deleteByCampaignId(campaignId: string): Promise<{ success: boolean }>;
}

export class MockCampaignBookingRepository implements ICampaignBookingRepository {
  private bookings: CampaignBooking[] = [...mockCampaignBookings];

  async getAll(): Promise<CampaignBooking[]> {
    await new Promise((r) => setTimeout(r, 25));
    return [...this.bookings];
  }

  async getByCampaignId(campaignId: string): Promise<CampaignBooking[]> {
    await new Promise((r) => setTimeout(r, 25));
    return this.bookings.filter((b) => b.campaignId === campaignId);
  }

  async getByOpportunityId(opportunityId: string): Promise<CampaignBooking[]> {
    await new Promise((r) => setTimeout(r, 25));
    return this.bookings.filter((b) => b.opportunityId === opportunityId);
  }

  async getByDisplayId(displayId: string): Promise<CampaignBooking[]> {
    await new Promise((r) => setTimeout(r, 25));
    return this.bookings.filter((b) => b.displayId === displayId);
  }

  async create(data: Partial<CampaignBooking>): Promise<CampaignBooking> {
    await new Promise((r) => setTimeout(r, 30));
    const newBooking: CampaignBooking = {
      id: `bkg-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 100)}`,
      campaignId: data.campaignId || 'ad-cmp-001',
      opportunityId: data.opportunityId || 'opp-01',
      displayId: data.displayId || 'dsp-01',
      displayName: data.displayName || 'Display Selecionado',
      venueName: data.venueName || 'Espaço',
      municipality: data.municipality || 'Luanda',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      frequency: data.frequency || 6,
      slotDuration: data.slotDuration || 15,
      estimatedPlays: data.estimatedPlays || 5000,
      estimatedImpressions: data.estimatedImpressions || 250000,
      unitPrice: data.unitPrice || 100000,
      totalPrice: data.totalPrice || 1000000,
      currency: 'AOA',
      status: data.status || 'CONFIRMED',
      ...data,
    };
    this.bookings.push(newBooking);
    return { ...newBooking };
  }

  async createBulk(items: Partial<CampaignBooking>[]): Promise<CampaignBooking[]> {
    await new Promise((r) => setTimeout(r, 50));
    const created: CampaignBooking[] = [];
    for (const item of items) {
      const b = await this.create(item);
      created.push(b);
    }
    return created;
  }

  async update(id: string, data: Partial<CampaignBooking>): Promise<CampaignBooking> {
    await new Promise((r) => setTimeout(r, 30));
    const index = this.bookings.findIndex((b) => b.id === id);
    if (index === -1) {
      throw new Error(`Booking ${id} not found`);
    }
    const updated = { ...this.bookings[index], ...data };
    this.bookings[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((r) => setTimeout(r, 25));
    this.bookings = this.bookings.filter((b) => b.id !== id);
    return { success: true };
  }

  async deleteByCampaignId(campaignId: string): Promise<{ success: boolean }> {
    await new Promise((r) => setTimeout(r, 25));
    this.bookings = this.bookings.filter((b) => b.campaignId !== campaignId);
    return { success: true };
  }
}

export const campaignBookingRepository = new MockCampaignBookingRepository();
