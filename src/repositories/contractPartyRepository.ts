import { ContractParty, SignatureStatus } from '../types/contracts';
import { mockContractParties } from '../data/mockContractData';

export interface IContractPartyRepository {
  getByContractId(contractId: string): Promise<ContractParty[]>;
  getById(id: string): Promise<ContractParty | null>;
  create(data: Partial<ContractParty>): Promise<ContractParty>;
  createMany(parties: Partial<ContractParty>[]): Promise<ContractParty[]>;
  update(id: string, data: Partial<ContractParty>): Promise<ContractParty>;
  updateSignatureStatus(
    id: string,
    status: SignatureStatus,
    signedAt?: string,
    signatureIp?: string
  ): Promise<ContractParty>;
  delete(id: string): Promise<{ success: boolean }>;
  deleteByContractId(contractId: string): Promise<{ success: boolean }>;
}

export class MockContractPartyRepository implements IContractPartyRepository {
  private parties: ContractParty[] = [...mockContractParties];

  async getByContractId(contractId: string): Promise<ContractParty[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    return this.parties.filter((p) => p.contractId === contractId);
  }

  async getById(id: string): Promise<ContractParty | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const party = this.parties.find((p) => p.id === id);
    return party ? { ...party } : null;
  }

  async create(data: Partial<ContractParty>): Promise<ContractParty> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const newParty: ContractParty = {
      id: `pty-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      contractId: data.contractId || '',
      organizationId: data.organizationId,
      partyType: data.partyType || 'CUSTOMER',
      legalName: data.legalName || 'Entidade Contratante',
      tradeName: data.tradeName,
      nif: data.nif || '5400000000',
      email: data.email || 'contacto@empresa.ao',
      phone: data.phone || '+244 923 000 000',
      address: data.address || 'Luanda, Angola',
      city: data.city || 'Luanda',
      province: data.province || 'Luanda',
      country: data.country || 'Angola',
      representativeName: data.representativeName || 'Representante Legal',
      representativeRole: data.representativeRole || 'Diretor Geral',
      signatureStatus: data.signatureStatus || 'PENDING',
      signedAt: data.signedAt,
      signatureIp: data.signatureIp,
      signatureTrackingId: data.signatureTrackingId,
    };

    this.parties.push(newParty);
    return { ...newParty };
  }

  async createMany(partiesData: Partial<ContractParty>[]): Promise<ContractParty[]> {
    const created: ContractParty[] = [];
    for (const partyData of partiesData) {
      const party = await this.create(partyData);
      created.push(party);
    }
    return created;
  }

  async update(id: string, data: Partial<ContractParty>): Promise<ContractParty> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const index = this.parties.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`ContractParty with id ${id} not found`);
    }

    const updated: ContractParty = {
      ...this.parties[index],
      ...data,
    };

    this.parties[index] = updated;
    return { ...updated };
  }

  async updateSignatureStatus(
    id: string,
    status: SignatureStatus,
    signedAt?: string,
    signatureIp?: string
  ): Promise<ContractParty> {
    return this.update(id, {
      signatureStatus: status,
      signedAt: status === 'SIGNED' ? signedAt || new Date().toISOString() : undefined,
      signatureIp: signatureIp || '197.234.12.99',
    });
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const initialLen = this.parties.length;
    this.parties = this.parties.filter((p) => p.id !== id);
    return { success: this.parties.length < initialLen };
  }

  async deleteByContractId(contractId: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    this.parties = this.parties.filter((p) => p.contractId !== contractId);
    return { success: true };
  }
}

export const contractPartyRepository = new MockContractPartyRepository();
