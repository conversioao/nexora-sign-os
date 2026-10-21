import { CRMActivity } from '../types/crm';
import { mockCRMActivities } from '../data/mockCrmData';

export interface ICRMActivityRepository {
  getActivities(limit?: number, organizationId?: string): Promise<CRMActivity[]>;
  getByCustomerId(customerId: string): Promise<CRMActivity[]>;
  logActivity(data: Omit<CRMActivity, 'id' | 'timestamp'>): Promise<CRMActivity>;
}

export class MockCRMActivityRepository implements ICRMActivityRepository {
  private activities: CRMActivity[] = [...mockCRMActivities];

  async getActivities(limit = 20, organizationId?: string): Promise<CRMActivity[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    let list = [...this.activities];
    if (organizationId) {
      list = list.filter((a) => a.organizationId === organizationId);
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limit);
  }

  async getByCustomerId(customerId: string): Promise<CRMActivity[]> {
    return this.getActivities(50, customerId);
  }

  async logActivity(data: Omit<CRMActivity, 'id' | 'timestamp'>): Promise<CRMActivity> {
    const newAct: CRMActivity = {
      id: `act-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...data,
    };
    this.activities.unshift(newAct);
    return { ...newAct };
  }
}

export const crmActivityRepository = new MockCRMActivityRepository();
