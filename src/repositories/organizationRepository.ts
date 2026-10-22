import { Organization } from '../types/auth';
import { mockOrganizations } from '../data/mockAuthData';

export interface IOrganizationRepository {
  getAll(): Promise<Organization[]>;
  getById(id: string): Promise<Organization | null>;
  getByCode(code: string): Promise<Organization | null>;
  create(data: Partial<Organization>): Promise<Organization>;
  update(id: string, data: Partial<Organization>): Promise<Organization>;
}

class MockOrganizationRepository implements IOrganizationRepository {
  private organizations: Organization[] = [...mockOrganizations];

  async getAll(): Promise<Organization[]> {
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch /api/organizations', err);
    }
    return [];
  }

  async getById(id: string): Promise<Organization | null> {
    const org = this.organizations.find((o) => o.id === id);
    return org ? { ...org } : null;
  }

  async getByCode(code: string): Promise<Organization | null> {
    const org = this.organizations.find((o) => o.code === code);
    return org ? { ...org } : null;
  }

  async create(data: Partial<Organization>): Promise<Organization> {
    const newOrg: Organization = {
      id: `org-${Date.now().toString(36)}`,
      code: data.code || `ORG-CLT-${Math.floor(100 + Math.random() * 900)}`,
      name: data.name || 'Nova Organização',
      tradeName: data.tradeName || data.name || 'Nova Organização Lda.',
      type: data.type || 'CLIENT',
      nif: data.nif || '5400000000',
      logoGradient: data.logoGradient || 'from-blue-600 to-cyan-500',
      contactEmail: data.contactEmail || 'contacto@empresa.ao',
      phone: data.phone || '+244 923 000 000',
      address: data.address || 'Luanda, Angola',
      city: data.city || 'Luanda',
      province: data.province || 'Luanda',
      country: data.country || 'Angola',
      timezone: data.timezone || 'Africa/Luanda',
      status: 'ACTIVE',
      settings: {
        defaultTimezone: 'Africa/Luanda',
        currency: 'AOA',
        language: 'pt-AO',
        ...data.settings,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.organizations.unshift(newOrg);
    return { ...newOrg };
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    const index = this.organizations.findIndex((o) => o.id === id);
    if (index === -1) {
      throw new Error(`Organização com ID ${id} não encontrada.`);
    }

    const updated: Organization = {
      ...this.organizations[index],
      ...data,
      settings: {
        ...this.organizations[index].settings,
        ...(data.settings || {}),
        defaultTimezone: data.settings?.defaultTimezone || this.organizations[index].settings?.defaultTimezone || 'Africa/Luanda',
        currency: data.settings?.currency || this.organizations[index].settings?.currency || 'AOA',
        language: data.settings?.language || this.organizations[index].settings?.language || 'pt-AO',
      },
      updatedAt: new Date().toISOString(),
    };

    this.organizations[index] = updated;
    return { ...updated };
  }
}

export const organizationRepository = new MockOrganizationRepository();
