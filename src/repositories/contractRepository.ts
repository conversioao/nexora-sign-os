import {
  Contract,
  ContractFilters,
  ContractKPIs,
  ContractStatus,
  ContractType,
  ContractDocument,
} from '../types/contracts';
import { mockContracts, mockContractDocuments } from '../data/mockContractData';
import { contractItemRepository } from './contractItemRepository';
import { contractPartyRepository } from './contractPartyRepository';
import { contractEventRepository } from './contractEventRepository';

export interface IContractRepository {
  getAll(filters?: ContractFilters): Promise<Contract[]>;
  getById(id: string): Promise<Contract | null>;
  getByContractNumber(contractNumber: string): Promise<Contract | null>;
  getByOrganizationId(organizationId: string): Promise<Contract[]>;
  getKPIs(organizationId?: string): Promise<ContractKPIs>;
  getDocument(contractId: string): Promise<ContractDocument | null>;
  saveDocument(contractId: string, document: ContractDocument): Promise<ContractDocument>;
  create(data: Partial<Contract>): Promise<Contract>;
  update(id: string, data: Partial<Contract>): Promise<Contract>;
  updateStatus(id: string, status: ContractStatus, actorName?: string, notes?: string): Promise<Contract>;
  duplicate(id: string, actorName?: string): Promise<Contract>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class MockContractRepository implements IContractRepository {
  private contracts: Contract[] = [...mockContracts];
  private documents: Record<string, ContractDocument> = { ...mockContractDocuments };

  private enrichContract(contract: Contract): Contract {
    return {
      ...contract,
    };
  }

  async getAll(filters?: ContractFilters): Promise<Contract[]> {
    try {
      const orgParam = filters?.organizationId ? `?organizationId=${encodeURIComponent(filters.organizationId)}` : '';
      const res = await fetch(`/api/contracts${orgParam}`);
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows)) {
          let dbContracts: Contract[] = rows.map((r: any) => ({
            id: r.id,
            organizationId: r.organization_id || '',
            contractNumber: r.contract_number || `CTR-${r.id}`,
            title: r.title || 'Contrato Nexora Digital Signage',
            contractType: (r.type || 'SAAS_SUBSCRIPTION') as ContractType,
            status: (r.status || 'ACTIVE') as ContractStatus,
            startDate: r.start_date || new Date().toISOString().split('T')[0],
            endDate: r.end_date || new Date(Date.now() + 365*86400000).toISOString().split('T')[0],
            billingFrequency: 'MONTHLY',
            currency: 'AOA',
            monthlyValueKz: parseFloat(r.monthly_value_kz) || 250000,
            totalContractValueKz: parseFloat(r.total_value_kz) || 3000000,
            clientName: r.client_name || 'Cliente Corporativo',
            subtotal: parseFloat(r.total_value_kz) || 3000000,
            discount: 0,
            tax: 0,
            total: parseFloat(r.total_value_kz) || 3000000,
            createdBy: 'user-admin',
            version: '1.0',
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || r.created_at || new Date().toISOString(),
          }));

          // Se o filtro especificou organizationId, retornar estritamente os contratos dessa organização
          if (filters?.organizationId) {
            let filtered = dbContracts.filter((c) => c.organizationId === filters.organizationId);
            if (filters?.status && filters.status !== 'ALL') {
              filtered = filtered.filter((c) => c.status === filters.status);
            }
            if (filters?.contractType && filters.contractType !== 'ALL') {
              filtered = filtered.filter((c) => c.contractType === filters.contractType);
            }
            return filtered;
          }

          let result = dbContracts.map((c) => this.enrichContract(c));
          if (filters?.status && filters.status !== 'ALL') {
            result = result.filter((c) => c.status === filters.status);
          }
          if (filters?.contractType && filters.contractType !== 'ALL') {
            result = result.filter((c) => c.contractType === filters.contractType);
          }
          return result;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar contratos do banco:', e);
    }

    let result = this.contracts.map((c) => this.enrichContract(c));

    if (!filters) return result;

    // Tenant isolation filter
    if (filters.organizationId) {
      result = result.filter((c) => c.organizationId === filters.organizationId);
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.contractType && filters.contractType !== 'ALL') {
      result = result.filter((c) => c.contractType === filters.contractType);
    }

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      result = result.filter((c) => {
        return (
          c.contractNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          (c.organizationName && c.organizationName.toLowerCase().includes(q)) ||
          (c.primaryClientName && c.primaryClientName.toLowerCase().includes(q)) ||
          (c.primaryClientNif && c.primaryClientNif.includes(q))
        );
      });
    }

    if (filters.startDateFrom) {
      result = result.filter((c) => new Date(c.startDate) >= new Date(filters.startDateFrom!));
    }

    if (filters.startDateTo) {
      result = result.filter((c) => new Date(c.startDate) <= new Date(filters.startDateTo!));
    }

    if (filters.endDateFrom) {
      result = result.filter((c) => new Date(c.endDate) >= new Date(filters.endDateFrom!));
    }

    if (filters.endDateTo) {
      result = result.filter((c) => new Date(c.endDate) <= new Date(filters.endDateTo!));
    }

    if (filters.expiringInDays !== undefined) {
      const now = new Date();
      const target = new Date();
      target.setDate(now.getDate() + filters.expiringInDays);
      result = result.filter((c) => {
        if (c.status !== 'ACTIVE') return false;
        const end = new Date(c.endDate);
        return end >= now && end <= target;
      });
    }

    return result;
  }

  async getById(id: string): Promise<Contract | null> {
    try {
      const res = await fetch(`/api/contracts/${id}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const r = await res.json();
        if (r && r.id) {
          const mappedContract: Contract = {
            id: r.id,
            organizationId: r.organization_id || 'org-talatona',
            contractNumber: r.contract_number || r.id,
            title: r.title || 'Contrato Comercial',
            contractType: (r.type || 'COMMERCIAL_DISPLAY') as ContractType,
            status: (r.status || 'ACTIVE') as ContractStatus,
            startDate: r.start_date || new Date().toISOString().split('T')[0],
            endDate: r.end_date || new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
            currency: 'AOA',
            subtotal: parseFloat(r.total_value_kz) || 0,
            discount: 0,
            tax: 0,
            total: parseFloat(r.total_value_kz) || 0,
            createdBy: 'user-admin',
            version: '1.0',
            createdAt: r.created_at || new Date().toISOString(),
            updatedAt: r.updated_at || r.created_at || new Date().toISOString(),
            primaryClientName: r.client_name || 'Parceiro Comercial',
          };
          return this.enrichContract(mappedContract);
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar contrato por ID da API:', e);
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
    const contract = this.contracts.find((c) => c.id === id);
    return contract ? this.enrichContract(contract) : null;
  }

  async getByContractNumber(contractNumber: string): Promise<Contract | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const contract = this.contracts.find((c) => c.contractNumber === contractNumber);
    return contract ? this.enrichContract(contract) : null;
  }

  async getByOrganizationId(organizationId: string): Promise<Contract[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    return this.contracts
      .filter((c) => c.organizationId === organizationId)
      .map((c) => this.enrichContract(c));
  }

  async getKPIs(organizationId?: string): Promise<ContractKPIs> {
    const dataset = await this.getAll({ organizationId });

    const now = new Date();
    const next30Days = new Date();
    next30Days.setDate(now.getDate() + 30);

    const draftCount = dataset.filter((c) => c.status === 'DRAFT').length;
    const pendingApprovalCount = dataset.filter((c) => c.status === 'PENDING_APPROVAL').length;
    const pendingSignatureCount = dataset.filter(
      (c) => c.status === 'PENDING_SIGNATURE' || c.status === 'PARTIALLY_SIGNED'
    ).length;
    const activeContracts = dataset.filter((c) => c.status === 'ACTIVE');
    const activeCount = activeContracts.length;
    
    const expiringCount = dataset.filter((c) => {
      if (c.status !== 'ACTIVE') return false;
      const end = new Date(c.endDate);
      return end >= now && end <= next30Days;
    }).length;

    const expiredCount = dataset.filter((c) => {
      if (c.status === 'EXPIRED') return true;
      if (c.status === 'ACTIVE') {
        return new Date(c.endDate) < now;
      }
      return false;
    }).length;

    const cancelledCount = dataset.filter((c) => c.status === 'CANCELLED').length;
    const totalActiveValueKz = activeContracts.reduce((acc, c) => acc + (c.total || (c as any).totalContractValueKz || 0), 0);

    return {
      totalCount: dataset.length,
      draftCount,
      pendingApprovalCount,
      pendingSignatureCount,
      activeCount,
      expiringCount,
      expiredCount,
      cancelledCount,
      totalActiveValueKz,
    };
  }

  async getDocument(contractId: string): Promise<ContractDocument | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return this.documents[contractId] ? { ...this.documents[contractId] } : null;
  }

  async saveDocument(contractId: string, document: ContractDocument): Promise<ContractDocument> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    this.documents[contractId] = { ...document };
    
    // Update contract hasDocument flag
    const index = this.contracts.findIndex((c) => c.id === contractId);
    if (index !== -1) {
      this.contracts[index].hasDocument = true;
      this.contracts[index].updatedAt = new Date().toISOString();
    }

    return { ...document };
  }

  private generateContractNumber(): string {
    const year = new Date().getFullYear();
    const count = this.contracts.length + 1;
    const padded = String(count).padStart(4, '0');
    return `NEX-CON-${year}-${padded}`;
  }

  async create(data: Partial<Contract>): Promise<Contract> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const subtotal = data.subtotal || 0;
    const discount = data.discount || 0;
    const tax = data.tax !== undefined ? data.tax : Math.round((subtotal - discount) * 0.14);
    const total = data.total !== undefined ? data.total : Math.max(0, subtotal - discount + tax);

    const newContract: Contract = {
      id: `con-${Date.now().toString(36)}`,
      contractNumber: data.contractNumber || this.generateContractNumber(),
      templateId: data.templateId,
      templateName: data.templateName,
      organizationId: data.organizationId || 'org-talatona',
      organizationName: data.organizationName || 'Organização Cliente',
      organizationCode: data.organizationCode,
      organizationType: data.organizationType || 'CLIENT',
      contractType: data.contractType || 'DISPLAY_RENTAL_AND_SAAS',
      title: data.title || 'Novo Contrato Comercial',
      status: data.status || 'DRAFT',
      startDate: data.startDate || new Date().toISOString(),
      endDate: data.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      currency: 'AOA',
      subtotal,
      discount,
      tax,
      total,
      notes: data.notes || '',
      version: data.version || '1.0',
      paymentTerms: data.paymentTerms || 'Mensal pré-pago a 30 dias',
      autoRenew: data.autoRenew ?? true,
      createdBy: data.createdBy || 'usr-admin-01',
      createdByName: data.createdByName || 'Administrador Nexora',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      partiesCount: data.partiesCount || 2,
      itemsCount: data.itemsCount || 1,
      primaryClientName: data.primaryClientName || data.organizationName,
      primaryClientNif: data.primaryClientNif,
      hasDocument: false,
    };

    this.contracts.unshift(newContract);

    // Log creation event
    await contractEventRepository.logEvent(
      newContract.id,
      'CREATED',
      `Contrato ${newContract.contractNumber} criado com status ${newContract.status}.`,
      newContract.createdByName || 'Sistema',
      newContract.createdBy
    );

    return { ...newContract };
  }

  async update(id: string, data: Partial<Contract>): Promise<Contract> {
    await new Promise((resolve) => setTimeout(resolve, 35));
    const index = this.contracts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Contract with id ${id} not found`);
    }

    const current = this.contracts[index];
    const subtotal = data.subtotal !== undefined ? data.subtotal : current.subtotal;
    const discount = data.discount !== undefined ? data.discount : current.discount;
    const tax = data.tax !== undefined ? data.tax : Math.round((subtotal - discount) * 0.14);
    const total = data.total !== undefined ? data.total : Math.max(0, subtotal - discount + tax);

    const updated: Contract = {
      ...current,
      ...data,
      subtotal,
      discount,
      tax,
      total,
      updatedAt: new Date().toISOString(),
    };

    this.contracts[index] = updated;

    await contractEventRepository.logEvent(
      id,
      'UPDATED',
      `Dados do contrato atualizados.`,
      'Operador Nexora'
    );

    return { ...updated };
  }

  async updateStatus(
    id: string,
    status: ContractStatus,
    actorName: string = 'Administrador Nexora',
    notes?: string
  ): Promise<Contract> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const index = this.contracts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Contract with id ${id} not found`);
    }

    const current = this.contracts[index];
    const previousStatus = current.status;

    const updated: Contract = {
      ...current,
      status,
      notes: notes ? `${current.notes || ''}\n${notes}`.trim() : current.notes,
      updatedAt: new Date().toISOString(),
    };

    this.contracts[index] = updated;

    // Map status change to event type
    let eventType: any = 'UPDATED';
    if (status === 'PENDING_APPROVAL') eventType = 'SUBMITTED';
    else if (status === 'PENDING_SIGNATURE') eventType = 'SIGNATURE_REQUESTED';
    else if (status === 'SIGNED') eventType = 'SIGNED';
    else if (status === 'ACTIVE') eventType = 'ACTIVATED';
    else if (status === 'EXPIRED') eventType = 'EXPIRED';
    else if (status === 'CANCELLED') eventType = 'CANCELLED';

    await contractEventRepository.logEvent(
      id,
      eventType,
      `Status alterado de ${previousStatus} para ${status}.${notes ? ` Nota: ${notes}` : ''}`,
      actorName
    );

    return { ...updated };
  }

  async duplicate(id: string, actorName: string = 'Administrador Nexora'): Promise<Contract> {
    await new Promise((resolve) => setTimeout(resolve, 45));
    const original = await this.getById(id);
    if (!original) {
      throw new Error(`Contract with id ${id} not found for duplication`);
    }

    const newContract = await this.create({
      ...original,
      id: undefined,
      contractNumber: this.generateContractNumber(),
      title: `${original.title} (Cópia)`,
      status: 'DRAFT',
      version: '1.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Duplicate Items
    const originalItems = await contractItemRepository.getByContractId(id);
    if (originalItems.length > 0) {
      await contractItemRepository.createMany(
        originalItems.map((item) => ({
          ...item,
          id: undefined,
          contractId: newContract.id,
        }))
      );
    }

    // Duplicate Parties (reset signatures)
    const originalParties = await contractPartyRepository.getByContractId(id);
    if (originalParties.length > 0) {
      await contractPartyRepository.createMany(
        originalParties.map((party) => ({
          ...party,
          id: undefined,
          contractId: newContract.id,
          signatureStatus: party.signatureStatus === 'NOT_REQUIRED' ? 'NOT_REQUIRED' : 'PENDING',
          signedAt: undefined,
          signatureIp: undefined,
          signatureTrackingId: undefined,
        }))
      );
    }

    await contractEventRepository.logEvent(
      newContract.id,
      'CREATED',
      `Contrato duplicado a partir do contrato original ${original.contractNumber}.`,
      actorName
    );

    return newContract;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const initialLen = this.contracts.length;
    this.contracts = this.contracts.filter((c) => c.id !== id);
    delete this.documents[id];
    await contractItemRepository.deleteByContractId(id);
    await contractPartyRepository.deleteByContractId(id);
    return { success: this.contracts.length < initialLen };
  }
}

export const contractRepository = new MockContractRepository();
