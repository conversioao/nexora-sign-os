import { FieldMaintenance, MaintenanceStatus, MaintenancePriority } from '../types/domain';
import { mockMaintenanceList } from '../data/mockAlertData';

export interface MaintenanceFilters {
  organizationId?: string;
  status?: MaintenanceStatus | 'ALL';
  priority?: MaintenancePriority | 'ALL';
  search?: string;
}

export interface MaintenanceKPIs {
  total: number;
  critical: number;
  scheduled: number;
  inProgress: number;
  pending: number;
  completed: number;
}

export interface IMaintenanceRepository {
  getAll(filters?: MaintenanceFilters): Promise<FieldMaintenance[]>;
  getById(id: string): Promise<FieldMaintenance | null>;
  getKPIs(organizationId?: string): Promise<MaintenanceKPIs>;
  updateStatus(id: string, status: MaintenanceStatus): Promise<FieldMaintenance | null>;
}

export class MockMaintenanceRepository implements IMaintenanceRepository {
  private items: FieldMaintenance[] = [...mockMaintenanceList];

  async getAll(filters?: MaintenanceFilters): Promise<FieldMaintenance[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    let list = [...this.items];

    if (filters?.organizationId && filters.organizationId !== 'org-nexora') {
      list = list.filter((m) => m.organizationId === filters.organizationId);
    }

    if (filters?.status && filters.status !== 'ALL') {
      list = list.filter((m) => m.status === filters.status);
    }

    if (filters?.priority && filters.priority !== 'ALL') {
      list = list.filter((m) => m.priority === filters.priority);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.displayName.toLowerCase().includes(q) ||
          m.displayCode.toLowerCase().includes(q) ||
          m.issueDescription.toLowerCase().includes(q) ||
          m.location.toLowerCase().includes(q) ||
          (m.technicianName && m.technicianName.toLowerCase().includes(q))
      );
    }

    return list;
  }

  async getById(id: string): Promise<FieldMaintenance | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const found = this.items.find((m) => m.id === id);
    return found ? { ...found } : null;
  }

  async getKPIs(organizationId?: string): Promise<MaintenanceKPIs> {
    const list = await this.getAll({ organizationId });
    return {
      total: list.length,
      critical: list.filter((m) => m.priority === 'CRITICAL').length,
      scheduled: list.filter((m) => m.status === 'SCHEDULED').length,
      inProgress: list.filter((m) => m.status === 'IN_PROGRESS').length,
      pending: list.filter((m) => m.status === 'PENDING').length,
      completed: list.filter((m) => m.status === 'COMPLETED').length,
    };
  }

  async updateStatus(id: string, status: MaintenanceStatus): Promise<FieldMaintenance | null> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const idx = this.items.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    this.items[idx] = {
      ...this.items[idx],
      status,
    };
    return { ...this.items[idx] };
  }
}

export const maintenanceRepository = new MockMaintenanceRepository();
