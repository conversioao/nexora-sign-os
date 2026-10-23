import { CampaignCreative, CreativeApprovalStatus } from '../types/advertising';
import { mockCampaignCreatives } from '../data/mockAdvertisingData';

export interface ICampaignCreativeRepository {
  getAll(): Promise<CampaignCreative[]>;
  getByCampaignId(campaignId: string): Promise<CampaignCreative[]>;
  getById(id: string): Promise<CampaignCreative | null>;
  create(data: Partial<CampaignCreative>): Promise<CampaignCreative>;
  update(id: string, data: Partial<CampaignCreative>): Promise<CampaignCreative>;
  updateStatus(
    id: string,
    status: CreativeApprovalStatus,
    notes?: string,
    reviewedBy?: string
  ): Promise<CampaignCreative>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class MockCampaignCreativeRepository implements ICampaignCreativeRepository {
  private creatives: CampaignCreative[] = [...mockCampaignCreatives];

  async getAll(): Promise<CampaignCreative[]> {
    await new Promise((r) => setTimeout(r, 25));
    return [...this.creatives];
  }

  async getByCampaignId(campaignId: string): Promise<CampaignCreative[]> {
    await new Promise((r) => setTimeout(r, 25));
    return this.creatives.filter((c) => c.campaignId === campaignId);
  }

  async getById(id: string): Promise<CampaignCreative | null> {
    await new Promise((r) => setTimeout(r, 20));
    const item = this.creatives.find((c) => c.id === id);
    return item ? { ...item } : null;
  }

  async create(data: Partial<CampaignCreative>): Promise<CampaignCreative> {
    await new Promise((r) => setTimeout(r, 30));
    const newCreative: CampaignCreative = {
      id: `crc-${Date.now().toString().slice(-4)}`,
      campaignId: data.campaignId || 'ad-cmp-001',
      contentId: data.contentId || 'cnt-001',
      contentTitle: data.contentTitle || 'Criativo de Campanha',
      type: data.type || 'VIDEO',
      duration: data.duration || 15,
      approvalStatus: data.approvalStatus || 'SUBMITTED',
      reviewNotes: data.reviewNotes || '',
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.creatives.push(newCreative);
    return { ...newCreative };
  }

  async update(id: string, data: Partial<CampaignCreative>): Promise<CampaignCreative> {
    await new Promise((r) => setTimeout(r, 30));
    const index = this.creatives.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Creative ${id} not found`);
    }
    const updated = { ...this.creatives[index], ...data };
    this.creatives[index] = updated;
    return { ...updated };
  }

  async updateStatus(
    id: string,
    status: CreativeApprovalStatus,
    notes?: string,
    reviewedBy?: string
  ): Promise<CampaignCreative> {
    await new Promise((r) => setTimeout(r, 30));
    const index = this.creatives.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Creative ${id} not found`);
    }
    const current = this.creatives[index];
    const updated: CampaignCreative = {
      ...current,
      approvalStatus: status,
      reviewNotes: notes !== undefined ? notes : current.reviewNotes,
      reviewedBy: reviewedBy || current.reviewedBy || 'Operador Nexora Mídia',
      reviewedAt: new Date().toISOString(),
    };
    this.creatives[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((r) => setTimeout(r, 25));
    this.creatives = this.creatives.filter((c) => c.id !== id);
    return { success: true };
  }
}

export const campaignCreativeRepository = new MockCampaignCreativeRepository();
