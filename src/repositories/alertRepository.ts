import { SystemAlert, AlertSeverity } from '../types/domain';
import { mockAlerts } from '../data/mockAlertData';

export interface AlertFilters {
  organizationId?: string;
  severity?: AlertSeverity | 'ALL';
  resolved?: boolean;
  search?: string;
}

export interface IAlertRepository {
  getAll(filters?: AlertFilters): Promise<SystemAlert[]>;
  getById(id: string): Promise<SystemAlert | null>;
  getUnresolvedCount(organizationId?: string): Promise<number>;
  resolve(id: string): Promise<SystemAlert | null>;
  dismiss(id: string): Promise<boolean>;
  createAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'timeAgo'> & { timestamp?: string }): Promise<SystemAlert>;
}

export class MockAlertRepository implements IAlertRepository {
  private alerts: SystemAlert[] = [...mockAlerts];

  async getAll(filters?: AlertFilters): Promise<SystemAlert[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    let list = [...this.alerts];

    if (filters?.organizationId && filters.organizationId !== 'org-nexora') {
      list = list.filter((a) => a.organizationId === filters.organizationId);
    }

    if (filters?.severity && filters.severity !== 'ALL') {
      list = list.filter((a) => a.severity === filters.severity);
    }

    if (filters?.resolved !== undefined) {
      list = list.filter((a) => (a.resolved || false) === filters.resolved);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.displayName && a.displayName.toLowerCase().includes(q)) ||
          (a.location && a.location.toLowerCase().includes(q))
      );
    }

    return list;
  }

  async getById(id: string): Promise<SystemAlert | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const alert = this.alerts.find((a) => a.id === id);
    return alert ? { ...alert } : null;
  }

  async getUnresolvedCount(organizationId?: string): Promise<number> {
    const list = await this.getAll({
      organizationId,
      resolved: false,
    });
    return list.length;
  }

  async resolve(id: string): Promise<SystemAlert | null> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const idx = this.alerts.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.alerts[idx] = {
      ...this.alerts[idx],
      resolved: true,
    };
    return { ...this.alerts[idx] };
  }

  async dismiss(id: string): Promise<boolean> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const initialLen = this.alerts.length;
    this.alerts = this.alerts.filter((a) => a.id !== id);
    return this.alerts.length < initialLen;
  }

  async createAlert(alert: Omit<SystemAlert, 'id' | 'timestamp' | 'timeAgo'> & { timestamp?: string }): Promise<SystemAlert> {
    const timestamp = alert.timestamp || new Date().toISOString();
    const newAlert: SystemAlert = {
      ...alert,
      id: `alt-${Date.now()}`,
      timestamp,
      timeAgo: 'Agora mesmo',
      resolved: alert.resolved ?? false,
    };
    this.alerts.unshift(newAlert);
    return newAlert;
  }
}

export const alertRepository = new MockAlertRepository();
