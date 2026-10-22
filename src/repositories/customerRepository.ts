import {
  CustomerProfile,
  CustomerKPIs,
  CustomerFilters,
  CustomerStatus,
  CustomerLifecycleStage,
} from '../types/crm';
import { mockCustomerProfiles, mockContacts } from '../data/mockCrmData';
import { organizationRepository } from './organizationRepository';

export interface ICustomerRepository {
  getAll(filters?: CustomerFilters): Promise<CustomerProfile[]>;
  getById(id: string): Promise<CustomerProfile | null>;
  getByOrgId(orgId: string): Promise<CustomerProfile | null>;
  getKPIs(organizationId?: string): Promise<CustomerKPIs>;
  create(data: Partial<CustomerProfile>): Promise<CustomerProfile>;
  update(id: string, data: Partial<CustomerProfile>): Promise<CustomerProfile>;
  updateStatus(id: string, status: CustomerStatus, lifecycleStage?: CustomerLifecycleStage): Promise<CustomerProfile>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class MockCustomerRepository implements ICustomerRepository {
  private customers: CustomerProfile[] = [...mockCustomerProfiles];

  private enrichCustomer(customer: CustomerProfile): CustomerProfile {
    const primaryContact = mockContacts.find(
      (c) => c.organizationId === customer.organizationId && c.isPrimary
    ) || mockContacts.find((c) => c.organizationId === customer.organizationId);

    return {
      ...customer,
      primaryContact,
    };
  }

  async getAll(filters?: CustomerFilters): Promise<CustomerProfile[]> {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const rows = await res.json();
        let dbCustomers: CustomerProfile[] = rows.map((r: any) => ({
          id: r.id,
          organizationId: r.id,
          customerCode: r.customer_code || `CLT-${r.id}`,
          legalName: r.legal_name || r.trade_name || 'Cliente Sem Nome',
          tradeName: r.trade_name || r.legal_name || 'Cliente Sem Nome',
          nif: r.nif || 'NIF não cadastrado',
          industry: r.industry || 'Comércio & Serviços',
          phone: r.phone || '',
          email: r.email || '',
          municipality: r.municipality || 'Luanda',
          city: 'Luanda',
          country: 'Angola',
          status: r.status || 'ACTIVE',
          lifecycleStage: r.status || 'ACTIVE',
          leadSource: 'DIRECT_SALES',
          planName: r.plan_name || 'Nexora Business Pro',
          monthlyFeeKz: parseFloat(r.monthly_fee_kz) || 850000,
          createdAt: r.created_at || new Date().toISOString(),
          updatedAt: r.created_at || new Date().toISOString(),
          displayCount: parseInt(r.display_count || '0'),
          onlineDisplayCount: parseInt(r.display_count || '0'),
          playlistCount: 1,
          scheduleCount: 1,
        }));

        let result = dbCustomers.map((c) => this.enrichCustomer(c));

        if (filters?.status && filters.status !== 'ALL') {
          result = result.filter((c) => c.status === filters.status);
        }
        if (filters?.search?.trim()) {
          const q = filters.search.toLowerCase().trim();
          result = result.filter((c) => c.tradeName.toLowerCase().includes(q) || c.legalName.toLowerCase().includes(q));
        }
        return result;
      }
    } catch (e) {
      console.warn('Erro ao buscar clientes no DB:', e);
    }
    return [];
  }

  async getById(id: string): Promise<CustomerProfile | null> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const customer = this.customers.find((c) => c.id === id || c.organizationId === id);
    if (!customer) return null;
    return this.enrichCustomer(customer);
  }

  async getByOrgId(orgId: string): Promise<CustomerProfile | null> {
    return this.getById(orgId);
  }

  async getKPIs(organizationId?: string): Promise<CustomerKPIs> {
    const allCustomers = await this.getAll();
    const list = organizationId
      ? allCustomers.filter((c) => c.organizationId === organizationId)
      : allCustomers;

    const totalCustomers = list.length;
    const activeCustomers = list.filter((c) => c.status === 'ACTIVE').length;
    const prospectCustomers = list.filter((c) => c.status === 'PROSPECT').length;
    const inactiveCustomers = list.filter((c) => c.status === 'INACTIVE' || c.status === 'SUSPENDED').length;
    const installedDisplays = list.reduce((sum, c) => sum + (c.displayCount || 0), 0);
    const estimatedMonthlyRevenueKz = list
      .filter((c) => c.status === 'ACTIVE')
      .reduce((sum, c) => sum + (c.monthlyFeeKz || 0), 0);

    return {
      totalCustomers,
      activeCustomers,
      prospectCustomers,
      inactiveCustomers,
      installedDisplays,
      estimatedMonthlyRevenueKz,
    };
  }

  async create(data: Partial<CustomerProfile>): Promise<CustomerProfile> {
    await new Promise((resolve) => setTimeout(resolve, 80));

    // Ensure corresponding Organization exists or create it
    let orgId = data.organizationId;
    if (!orgId) {
      const createdOrg = await organizationRepository.create({
        name: data.tradeName || data.legalName || 'Novo Cliente',
        tradeName: data.legalName || data.tradeName,
        type: 'CLIENT',
        nif: data.nif,
        contactEmail: data.email || 'comercial@cliente.ao',
        phone: data.phone || '+244 923 000 000',
        address: data.address || 'Luanda',
        city: data.city || 'Luanda',
        province: data.municipality || 'Luanda',
        country: data.country || 'Angola',
        timezone: 'Africa/Luanda',
      });
      orgId = createdOrg.id;
    }

    const newProfile: CustomerProfile = {
      id: orgId,
      organizationId: orgId,
      customerCode: data.customerCode || `CLT-${String(this.customers.length + 1).padStart(3, '0')}`,
      legalName: data.legalName || data.tradeName || 'Razão Social Cliente Lda.',
      tradeName: data.tradeName || data.legalName || 'Nome Fantasia Cliente',
      nif: data.nif || '5400000000',
      industry: data.industry || 'Restauração & Lazer',
      phone: data.phone || '+244 923 000 000',
      email: data.email || 'geral@empresa.ao',
      website: data.website || '',
      address: data.address || 'Luanda, Angola',
      municipality: data.municipality || 'Talatona',
      city: data.city || 'Luanda',
      country: data.country || 'Angola',
      status: data.status || 'ACTIVE',
      lifecycleStage: data.lifecycleStage || 'ACTIVE',
      leadSource: data.leadSource || 'DIRECT_SALES',
      planName: data.planName || 'Nexora Business Pro',
      monthlyFeeKz: data.monthlyFeeKz || 850000,
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      displayCount: data.displayCount || 0,
      onlineDisplayCount: data.onlineDisplayCount || 0,
      playlistCount: data.playlistCount || 0,
      scheduleCount: data.scheduleCount || 0,
      lastActivityAt: new Date().toISOString(),
    };

    this.customers.unshift(newProfile);
    return this.enrichCustomer(newProfile);
  }

  async update(id: string, data: Partial<CustomerProfile>): Promise<CustomerProfile> {
    await new Promise((resolve) => setTimeout(resolve, 60));
    const index = this.customers.findIndex((c) => c.id === id || c.organizationId === id);
    if (index === -1) {
      throw new Error(`Cliente com ID ${id} não encontrado.`);
    }

    const updated: CustomerProfile = {
      ...this.customers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.customers[index] = updated;
    return this.enrichCustomer(updated);
  }

  async updateStatus(
    id: string,
    status: CustomerStatus,
    lifecycleStage?: CustomerLifecycleStage
  ): Promise<CustomerProfile> {
    const stage = lifecycleStage || (status === 'ACTIVE' ? 'ACTIVE' : status === 'PROSPECT' ? 'PROSPECT' : 'INACTIVE');
    return this.update(id, { status, lifecycleStage: stage });
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const initialLen = this.customers.length;
    this.customers = this.customers.filter((c) => c.id !== id && c.organizationId !== id);
    return { success: this.customers.length < initialLen };
  }
}

export const customerRepository = new MockCustomerRepository();
