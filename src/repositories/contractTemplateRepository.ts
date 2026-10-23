import { ContractTemplate, ContractTemplateStatus, ContractType } from '../types/contracts';
import { mockContractTemplates } from '../data/mockContractData';

export interface IContractTemplateRepository {
  getAll(): Promise<ContractTemplate[]>;
  getActive(): Promise<ContractTemplate[]>;
  getById(id: string): Promise<ContractTemplate | null>;
  getByCode(code: string): Promise<ContractTemplate | null>;
  getByType(type: ContractType): Promise<ContractTemplate[]>;
  create(data: Partial<ContractTemplate>): Promise<ContractTemplate>;
  update(id: string, data: Partial<ContractTemplate>): Promise<ContractTemplate>;
  archive(id: string): Promise<ContractTemplate>;
  delete(id: string): Promise<{ success: boolean }>;
}

export class MockContractTemplateRepository implements IContractTemplateRepository {
  private templates: ContractTemplate[] = [...mockContractTemplates];

  async getAll(): Promise<ContractTemplate[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return [...this.templates];
  }

  async getActive(): Promise<ContractTemplate[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    return this.templates.filter((t) => t.status === 'ACTIVE');
  }

  async getById(id: string): Promise<ContractTemplate | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const template = this.templates.find((t) => t.id === id);
    return template ? { ...template } : null;
  }

  async getByCode(code: string): Promise<ContractTemplate | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const template = this.templates.find((t) => t.code === code);
    return template ? { ...template } : null;
  }

  async getByType(type: ContractType): Promise<ContractTemplate[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    return this.templates.filter((t) => t.contractType === type);
  }

  async create(data: Partial<ContractTemplate>): Promise<ContractTemplate> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const newTemplate: ContractTemplate = {
      id: `tpl-${Date.now().toString(36)}`,
      code: data.code || `TPL-CUSTOM-${Math.floor(10 + Math.random() * 90)}`,
      name: data.name || 'Novo Modelo de Contrato',
      description: data.description || '',
      contractType: data.contractType || 'CUSTOM',
      version: data.version || '1.0',
      status: data.status || 'DRAFT',
      sections: data.sections || [
        {
          id: `sec-${Date.now()}-1`,
          title: 'Cláusula 1ª — Das Disposições Iniciais',
          order: 1,
          content: 'Termos e condições do acordo comercial.',
        },
      ],
      variables: data.variables || ['company_name', 'nif', 'total_amount'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.unshift(newTemplate);
    return { ...newTemplate };
  }

  async update(id: string, data: Partial<ContractTemplate>): Promise<ContractTemplate> {
    await new Promise((resolve) => setTimeout(resolve, 35));
    const index = this.templates.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Template with id ${id} not found`);
    }

    const updated: ContractTemplate = {
      ...this.templates[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.templates[index] = updated;
    return { ...updated };
  }

  async archive(id: string): Promise<ContractTemplate> {
    return this.update(id, { status: 'ARCHIVED' });
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const initialLen = this.templates.length;
    this.templates = this.templates.filter((t) => t.id !== id);
    return { success: this.templates.length < initialLen };
  }
}

export const contractTemplateRepository = new MockContractTemplateRepository();
