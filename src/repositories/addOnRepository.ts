import { AddOn, BillingInterval } from '../types/saas';
import { mockAddOns } from '../data/mockSaasData';

export interface IAddOnRepository {
  getAll(status?: AddOn['status']): Promise<AddOn[]>;
  getById(id: string): Promise<AddOn | null>;
  getByCode(code: string): Promise<AddOn | null>;
  create(data: Partial<AddOn>): Promise<AddOn>;
  update(id: string, data: Partial<AddOn>): Promise<AddOn>;
}

export class MockAddOnRepository implements IAddOnRepository {
  private addOns: AddOn[] = [...mockAddOns];

  async getAll(status?: AddOn['status']): Promise<AddOn[]> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    if (!status) return [...this.addOns];
    return this.addOns.filter((a) => a.status === status);
  }

  async getById(id: string): Promise<AddOn | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const found = this.addOns.find((a) => a.id === id || a.code === id);
    return found ? { ...found } : null;
  }

  async getByCode(code: string): Promise<AddOn | null> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const found = this.addOns.find((a) => a.code.toLowerCase() === code.toLowerCase());
    return found ? { ...found } : null;
  }

  async create(data: Partial<AddOn>): Promise<AddOn> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const newAddOn: AddOn = {
      id: `addon-${Date.now()}`,
      code: data.code || `ADDON_${Date.now()}`,
      name: data.name || 'Novo Add-On',
      description: data.description || 'Descrição do módulo adicional.',
      billingInterval: data.billingInterval || 'MONTHLY',
      price: Number(data.price) || 10000,
      currency: 'AOA',
      status: data.status || 'ACTIVE',
      unitLabel: data.unitLabel || '/mês',
      category: data.category || 'STORAGE',
    };
    this.addOns.push(newAddOn);
    return newAddOn;
  }

  async update(id: string, data: Partial<AddOn>): Promise<AddOn> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const index = this.addOns.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Add-on não encontrado');
    const updated = { ...this.addOns[index], ...data };
    this.addOns[index] = updated;
    return updated;
  }
}

export const addOnRepository = new MockAddOnRepository();
