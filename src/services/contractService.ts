import {
  Contract,
  ContractDocument,
  ContractEvent,
  ContractFilters,
  ContractItem,
  ContractKPIs,
  ContractParty,
  ContractStatus,
  ContractTemplate,
  IContractGenerator,
  ISignatureProvider,
} from '../types/contracts';
import { IContractRepository, contractRepository } from '../repositories/contractRepository';
import { IContractItemRepository, contractItemRepository } from '../repositories/contractItemRepository';
import { IContractPartyRepository, contractPartyRepository } from '../repositories/contractPartyRepository';
import { IContractEventRepository, contractEventRepository } from '../repositories/contractEventRepository';
import { IContractTemplateRepository, contractTemplateRepository } from '../repositories/contractTemplateRepository';
import { contractGenerator } from './contractGenerationService';
import { signatureProvider } from './signatureProviderService';

export interface CreateContractPayload {
  contract: Partial<Contract>;
  items: Partial<ContractItem>[];
  parties: Partial<ContractParty>[];
  templateId?: string;
  generateDocumentImmediately?: boolean;
}

export class ContractService {
  constructor(
    private contractRepo: IContractRepository = contractRepository,
    private itemRepo: IContractItemRepository = contractItemRepository,
    private partyRepo: IContractPartyRepository = contractPartyRepository,
    private eventRepo: IContractEventRepository = contractEventRepository,
    private templateRepo: IContractTemplateRepository = contractTemplateRepository,
    private generator: IContractGenerator = contractGenerator,
    private signatureService: ISignatureProvider = signatureProvider
  ) {}

  /**
   * Get all contracts with tenant-aware filtering
   */
  async getContracts(filters?: ContractFilters): Promise<Contract[]> {
    return this.contractRepo.getAll(filters);
  }

  /**
   * Get single contract by ID with associated items and parties
   */
  async getContractById(id: string): Promise<Contract | null> {
    return this.contractRepo.getById(id);
  }

  /**
   * Get contract details including full graph: contract, items, parties, events, template, document
   */
  async getContractFullDetails(id: string): Promise<{
    contract: Contract;
    items: ContractItem[];
    parties: ContractParty[];
    events: ContractEvent[];
    template: ContractTemplate | null;
    document: ContractDocument | null;
  } | null> {
    const contract = await this.contractRepo.getById(id);
    if (!contract) return null;

    const [items, parties, events, document] = await Promise.all([
      this.itemRepo.getByContractId(id),
      this.partyRepo.getByContractId(id),
      this.eventRepo.getByContractId(id),
      this.contractRepo.getDocument(id),
    ]);

    let template: ContractTemplate | null = null;
    if (contract.templateId) {
      template = await this.templateRepo.getById(contract.templateId);
    }

    return {
      contract,
      items,
      parties,
      events,
      template,
      document,
    };
  }

  /**
   * Get KPIs with optional tenant isolation
   */
  async getKPIs(organizationId?: string): Promise<ContractKPIs> {
    return this.contractRepo.getKPIs(organizationId);
  }

  /**
   * Complete Contract Creation with Items, Parties, and Optional Document Generation
   */
  async createContract(payload: CreateContractPayload): Promise<Contract> {
    const { contract: contractData, items, parties, templateId, generateDocumentImmediately } = payload;

    // 1. Calculate financial subtotals
    let subtotal = 0;
    for (const it of items) {
      const q = it.quantity || 1;
      const p = it.unitPrice || 0;
      const d = it.discount || 0;
      subtotal += Math.max(0, q * p - d);
    }

    const discount = contractData.discount || 0;
    const tax = contractData.tax !== undefined ? contractData.tax : Math.round((subtotal - discount) * 0.14);
    const total = Math.max(0, subtotal - discount + tax);

    let templateName = contractData.templateName;
    let template: ContractTemplate | null = null;
    if (templateId) {
      template = await this.templateRepo.getById(templateId);
      if (template) {
        templateName = template.name;
      }
    }

    // 2. Create base contract record
    const createdContract = await this.contractRepo.create({
      ...contractData,
      templateId,
      templateName,
      subtotal,
      discount,
      tax,
      total,
      partiesCount: parties.length,
      itemsCount: items.length,
    });

    // 3. Create items
    const createdItems: ContractItem[] = [];
    for (const itemData of items) {
      const item = await this.itemRepo.create({
        ...itemData,
        contractId: createdContract.id,
      });
      createdItems.push(item);
    }

    // 4. Create parties
    const createdParties: ContractParty[] = [];
    for (const partyData of parties) {
      const party = await this.partyRepo.create({
        ...partyData,
        contractId: createdContract.id,
      });
      createdParties.push(party);
    }

    // 5. Generate document if requested
    if (generateDocumentImmediately) {
      const doc = await this.generator.generate(
        {
          items: createdItems,
          parties: createdParties,
          dates: {
            startDate: createdContract.startDate,
            endDate: createdContract.endDate,
          },
          prices: {
            subtotal,
            discount,
            tax,
            total,
            currency: createdContract.currency,
          },
          customVariables: {
            contractId: createdContract.id,
            contractNumber: createdContract.contractNumber,
            company_name: createdContract.primaryClientName || createdContract.organizationName || 'Cliente',
            trade_name: createdContract.organizationName || 'Cliente',
            nif: createdContract.primaryClientNif || '5400000000',
          },
        },
        template || undefined
      );

      await this.contractRepo.saveDocument(createdContract.id, doc);
    }

    return createdContract;
  }

  /**
   * Update Contract Header
   */
  async updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
    return this.contractRepo.update(id, data);
  }

  /**
   * Status workflow transitions
   */
  async submitForApproval(id: string, actorName: string = 'Operador Nexora'): Promise<Contract> {
    return this.contractRepo.updateStatus(id, 'PENDING_APPROVAL', actorName, 'Enviado para aprovação formal.');
  }

  async approveContract(id: string, actorName: string = 'Diretoria Nexora'): Promise<Contract> {
    return this.contractRepo.updateStatus(id, 'PENDING_SIGNATURE', actorName, 'Termos contratuais aprovados.');
  }

  async requestDigitalSignature(id: string, partyIds?: string[]): Promise<Contract> {
    const parties = await this.partyRepo.getByContractId(id);
    const targetPartyIds = partyIds && partyIds.length > 0 ? partyIds : parties.map((p) => p.id);
    
    await this.signatureService.requestSignature(id, targetPartyIds);
    return (await this.contractRepo.getById(id))!;
  }

  async simulateSignature(id: string, partyId: string): Promise<Contract> {
    await this.signatureService.simulateSign(id, partyId);
    return (await this.contractRepo.getById(id))!;
  }

  async activateContract(id: string, actorName: string = 'Administrador Nexora'): Promise<Contract> {
    return this.contractRepo.updateStatus(id, 'ACTIVE', actorName, 'Contrato ativado e em vigor.');
  }

  async cancelContract(id: string, reason: string, actorName: string = 'Administrador Nexora'): Promise<Contract> {
    return this.contractRepo.updateStatus(id, 'CANCELLED', actorName, `Contrato cancelado. Motivo: ${reason}`);
  }

  async duplicateContract(id: string, actorName: string = 'Administrador Nexora'): Promise<Contract> {
    return this.contractRepo.duplicate(id, actorName);
  }

  /**
   * Generate or Regenerate Document for Contract
   */
  async generateDocument(id: string): Promise<ContractDocument> {
    const details = await this.getContractFullDetails(id);
    if (!details) throw new Error(`Contract ${id} not found`);

    const { contract, items, parties, template } = details;

    const doc = await this.generator.generate(
      {
        items,
        parties,
        dates: {
          startDate: contract.startDate,
          endDate: contract.endDate,
        },
        prices: {
          subtotal: contract.subtotal,
          discount: contract.discount,
          tax: contract.tax,
          total: contract.total,
          currency: contract.currency,
        },
        customVariables: {
          contractId: contract.id,
          contractNumber: contract.contractNumber,
          company_name: contract.primaryClientName || contract.organizationName || 'Cliente',
          trade_name: contract.organizationName || 'Cliente',
          nif: contract.primaryClientNif || '5400000000',
          plan_name: contract.title,
        },
      },
      template || undefined
    );

    await this.contractRepo.saveDocument(id, doc);
    await this.eventRepo.logEvent(
      id,
      'UPDATED',
      `Documento contratual gerado com ${doc.sections.length} cláusulas.`,
      'Gerador de Contratos'
    );

    return doc;
  }
}

export const contractService = new ContractService();
