import {
  ContractTemplate,
  ContractTemplateStatus,
  ContractType,
} from '../types/contracts';
import {
  IContractTemplateRepository,
  contractTemplateRepository,
} from '../repositories/contractTemplateRepository';

export class ContractTemplateService {
  constructor(
    private templateRepo: IContractTemplateRepository = contractTemplateRepository
  ) {}

  async getAllTemplates(): Promise<ContractTemplate[]> {
    return this.templateRepo.getAll();
  }

  async getActiveTemplates(): Promise<ContractTemplate[]> {
    return this.templateRepo.getActive();
  }

  async getTemplateById(id: string): Promise<ContractTemplate | null> {
    return this.templateRepo.getById(id);
  }

  async getTemplatesByType(type: ContractType): Promise<ContractTemplate[]> {
    return this.templateRepo.getByType(type);
  }

  async createTemplate(data: Partial<ContractTemplate>): Promise<ContractTemplate> {
    if (!data.name || data.name.trim() === '') {
      throw new Error('O nome do template é obrigatório');
    }
    return this.templateRepo.create(data);
  }

  async updateTemplate(id: string, data: Partial<ContractTemplate>): Promise<ContractTemplate> {
    return this.templateRepo.update(id, data);
  }

  async archiveTemplate(id: string): Promise<ContractTemplate> {
    return this.templateRepo.archive(id);
  }

  async deleteTemplate(id: string): Promise<{ success: boolean }> {
    return this.templateRepo.delete(id);
  }
}

export const contractTemplateService = new ContractTemplateService();
