import { Contact, ContactFilters, ContactStatus } from '../types/crm';
import { mockContacts } from '../data/mockCrmData';

export interface IContactRepository {
  getAll(filters?: ContactFilters): Promise<Contact[]>;
  getByOrganizationId(organizationId: string): Promise<Contact[]>;
  getByCustomerId(customerId: string): Promise<Contact[]>;
  getById(id: string): Promise<Contact | null>;
  create(data: Partial<Contact>): Promise<Contact>;
  update(id: string, data: Partial<Contact>): Promise<Contact>;
  delete(id: string): Promise<{ success: boolean }>;
  setPrimary(organizationId: string, contactId: string): Promise<Contact[]>;
  toggleStatus(id: string, status: ContactStatus): Promise<Contact>;
}

export class MockContactRepository implements IContactRepository {
  private contacts: Contact[] = [...mockContacts];

  async getAll(filters?: ContactFilters): Promise<Contact[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    let result = [...this.contacts];

    if (!filters) return result;

    if (filters.organizationId) {
      result = result.filter((c) => c.organizationId === filters.organizationId);
    }

    if (filters.status && filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.role.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.whatsapp && c.whatsapp.includes(q)) ||
          (c.department && c.department.toLowerCase().includes(q))
      );
    }

    return result;
  }

  async getByOrganizationId(organizationId: string): Promise<Contact[]> {
    return this.getAll({ organizationId });
  }

  async getByCustomerId(customerId: string): Promise<Contact[]> {
    return this.getAll({ organizationId: customerId });
  }

  async getById(id: string): Promise<Contact | null> {
    await new Promise((resolve) => setTimeout(resolve, 30));
    const contact = this.contacts.find((c) => c.id === id);
    return contact ? { ...contact } : null;
  }

  async create(data: Partial<Contact>): Promise<Contact> {
    await new Promise((resolve) => setTimeout(resolve, 50));

    const orgId = data.organizationId || 'org-talatona';
    const isFirstContact = !this.contacts.some((c) => c.organizationId === orgId);
    const isPrimary = data.isPrimary !== undefined ? data.isPrimary : isFirstContact;

    // If marked as primary, reset existing primary contacts for this org
    if (isPrimary) {
      this.contacts = this.contacts.map((c) =>
        c.organizationId === orgId ? { ...c, isPrimary: false } : c
      );
    }

    const newContact: Contact = {
      id: `ct-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      organizationId: orgId,
      name: data.name || 'Novo Contacto',
      role: data.role || 'Responsável',
      department: data.department || 'Operações',
      email: data.email || 'contacto@empresa.ao',
      phone: data.phone || '+244 923 000 000',
      whatsapp: data.whatsapp || data.phone || '',
      isPrimary,
      status: data.status || 'ACTIVE',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.contacts.unshift(newContact);
    return { ...newContact };
  }

  async update(id: string, data: Partial<Contact>): Promise<Contact> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const index = this.contacts.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error(`Contacto com ID ${id} não encontrado.`);
    }

    const current = this.contacts[index];

    if (data.isPrimary && !current.isPrimary) {
      this.contacts = this.contacts.map((c) =>
        c.organizationId === current.organizationId ? { ...c, isPrimary: false } : c
      );
    }

    const updated: Contact = {
      ...this.contacts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    this.contacts[index] = updated;
    return { ...updated };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    const initialLen = this.contacts.length;
    this.contacts = this.contacts.filter((c) => c.id !== id);
    return { success: this.contacts.length < initialLen };
  }

  async setPrimary(organizationId: string, contactId: string): Promise<Contact[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    this.contacts = this.contacts.map((c) => {
      if (c.organizationId === organizationId) {
        return {
          ...c,
          isPrimary: c.id === contactId,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    return this.getByOrganizationId(organizationId);
  }

  async toggleStatus(id: string, status: ContactStatus): Promise<Contact> {
    return this.update(id, { status });
  }
}

export const contactRepository = new MockContactRepository();
