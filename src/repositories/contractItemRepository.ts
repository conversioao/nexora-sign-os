import { ContractItem, ContractItemType } from '../types/contracts';
import { mockContractItems } from '../data/mockContractData';

export interface IContractItemRepository {
  getByContractId(contractId: string): Promise<ContractItem[]>;
  getById(id: string): Promise<ContractItem | null>;
  getByReferenceId(referenceId: string): Promise<ContractItem[]>;
  create(data: Partial<ContractItem>): Promise<ContractItem>;
  createMany(items: Partial<ContractItem>[]): Promise<ContractItem[]>;
  update(id: string, data: Partial<ContractItem>): Promise<ContractItem>;
  delete(id: string): Promise<{ success: boolean }>;
  deleteByContractId(contractId: string): Promise<{ success: boolean }>;
}

export class MockContractItemRepository implements IContractItemRepository {
  private items: ContractItem[] = [...mockContractItems];

  async getByContractId(contractId: string): Promise<ContractItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    return this.items.filter((i) => i.contractId === contractId);
  }

  async getById(id: string): Promise<ContractItem | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const item = this.items.find((i) => i.id === id);
    return item ? { ...item } : null;
  }

  async getByReferenceId(referenceId: string): Promise<ContractItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    return this.items.filter((i) => i.referenceId === referenceId);
  }

  async create(data: Partial<ContractItem>): Promise<ContractItem> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const qty = data.quantity || 1;
    const unitPrice = data.unitPrice || 0;
    const discount = data.discount || 0;
    const total = Math.max(0, qty * unitPrice - discount);

    const newItem: ContractItem = {
      id: `item-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      contractId: data.contractId || '',
      itemType: data.itemType || 'OTHER',
      referenceId: data.referenceId,
      referenceCode: data.referenceCode,
      description: data.description || 'Item Contratual',
      quantity: qty,
      unitPrice,
      discount,
      total,
      metadata: data.metadata,
    };

    this.items.push(newItem);
    return { ...newItem };
  }

  async createMany(itemsData: Partial<ContractItem>[]): Promise<ContractItem[]> {
    const created: ContractItem[] = [];
    for (const itemData of itemsData) {
      const item = await this.create(itemData);
      created.push(item);
    }
    return created;
  }

  async update(id: string, data: Partial<ContractItem>): Promise<ContractItem> {
    await new Promise((resolve) => setTimeout(resolve, 25));
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`ContractItem with id ${id} not found`);
    }

    const current = this.items[index];
    const qty = data.quantity !== undefined ? data.quantity : current.quantity;
    const unitPrice = data.unitPrice !== undefined ? data.unitPrice : current.unitPrice;
    const discount = data.discount !== undefined ? data.discount : current.discount;
    const total = Math.max(0, qty * unitPrice - discount);

    const updated: ContractItem = {
      ...current,
      ...data,
      quantity: qty,
      unitPrice,
      discount,
      total,
    };

    this.items[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const initialLen = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    return { success: this.items.length < initialLen };
  }

  async deleteByContractId(contractId: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    this.items = this.items.filter((i) => i.contractId !== contractId);
    return { success: true };
  }
}

export const contractItemRepository = new MockContractItemRepository();
