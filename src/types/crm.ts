/**
 * Nexora Operational CRM Domain Types
 * Specialized Digital Signage CRM models:
 * Organization (Tenant) + CustomerProfile / AdvertiserProfile + Contact + Lifecycle
 */

export type CustomerLifecycleStage =
  | 'LEAD'
  | 'PROSPECT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SUSPENDED'
  | 'CHURNED';

export type CustomerStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'PROSPECT'
  | 'SUSPENDED'
  | 'CHURNED';

export type ContactStatus = 'ACTIVE' | 'INACTIVE';

export type LeadSource =
  | 'WEBSITE'
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'REFERRAL'
  | 'DIRECT_SALES'
  | 'EVENT'
  | 'PARTNER'
  | 'OTHER';

export type CustomerPlanTier =
  | 'NEXORA_STARTER'
  | 'NEXORA_BUSINESS_PRO'
  | 'NEXORA_ENTERPRISE'
  | 'NEXORA_CUSTOM';

export interface Contact {
  id: string;
  organizationId: string;
  name: string;
  role: string;
  department?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  isPrimary: boolean;
  status: ContactStatus;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt?: string;
}

export interface CustomerProfile {
  id: string; // matches organizationId for 1-to-1 extension
  organizationId: string;
  customerCode: string; // e.g. "CLT-001", "CLT-002"
  legalName: string; // Razão Social (e.g. "Gastronomia & Lazer Talatona Lda.")
  tradeName: string; // Nome Comercial (e.g. "Restaurante Talatona")
  nif: string; // Número de Identificação Fiscal (Angola)
  industry: string; // Segmento (e.g. "Restauração & Lazer", "Retalho & Shoppings", "Banca & Finanças")
  phone: string;
  email: string;
  website?: string;
  address: string;
  municipality: string; // e.g. "Talatona", "Maianga", "Kilamba", "Belas", "Viana", "Ingombota", "Cazenga"
  city: string; // default "Luanda"
  country: string; // default "Angola"
  status: CustomerStatus;
  lifecycleStage: CustomerLifecycleStage;
  leadSource: LeadSource;
  planName: string; // e.g. "Nexora Business Pro", "Nexora Enterprise"
  monthlyFeeKz: number; // in AOA / Kwanzas
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string

  profileType?: 'PARTNER' | 'CLIENT'; // PARTNER = Loja/Espaço com Displays; CLIENT = Comprador de Display/SaaS próprio
  commissionRate?: number; // Porcentagem de comissão por veiculação (%)
  maxMediaPerDisplay?: number; // Limite de mídias por display do parceiro

  // Resolved metrics & relations for operational UI
  primaryContact?: Contact;
  displayCount?: number;
  onlineDisplayCount?: number;
  playlistCount?: number;
  scheduleCount?: number;
  lastActivityAt?: string;
  totalCommissionsKz?: number; // Acumulado em Kwanzas (AOA)
}

export interface AdvertiserProfile {
  id: string; // matches organizationId for 1-to-1 extension
  organizationId: string;
  advertiserCode: string; // e.g. "ADV-001", "ADV-002"
  legalName: string; // Razão Social
  tradeName: string; // Nome Comercial
  nif: string; // Número de Identificação Fiscal (Angola)
  industry: string; // e.g. "Telecomunicações", "Bebidas & Consumo", "Agência de Publicidade"
  phone: string;
  email: string;
  website?: string;
  address: string;
  municipality: string;
  city: string;
  country: string;
  status: CustomerStatus;
  lifecycleStage: CustomerLifecycleStage;
  leadSource: LeadSource;
  monthlyBudgetEstimateKz: number; // in AOA
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Resolved metrics & relations
  primaryContact?: Contact;
  activeCampaignsCount?: number;
  totalCampaignsCount?: number;
  aiCreditsRemaining?: number;
  lastActivityAt?: string;
}

export interface CustomerKPIs {
  totalCustomers: number;
  activeCustomers: number;
  prospectCustomers: number;
  inactiveCustomers: number;
  installedDisplays: number;
  estimatedMonthlyRevenueKz: number;
}

export interface AdvertiserKPIs {
  totalAdvertisers: number;
  activeAdvertisers: number;
  prospectAdvertisers: number;
  activeCampaigns: number;
  estimatedMonthlyInvestmentKz: number;
}

export interface CRMActivity {
  id: string;
  actorId: string;
  actorName: string;
  organizationId: string;
  entityType: 'CUSTOMER' | 'ADVERTISER' | 'CONTACT' | 'DISPLAY' | 'PLAYLIST' | 'SCHEDULE' | 'ORGANIZATION';
  entityId: string;
  entityName: string;
  action: string; // e.g. "Cliente criado", "Contacto adicionado", "Display instalado", "Status alterado"
  description: string;
  timestamp: string; // ISO date string
  metadata?: Record<string, unknown>;
}

export interface CustomerFilters {
  search?: string; // search in name, code, nif, contact name, phone
  status?: CustomerStatus | 'ALL';
  municipality?: string | 'ALL';
  industry?: string | 'ALL';
  lifecycleStage?: CustomerLifecycleStage | 'ALL';
  planName?: string | 'ALL';
  organizationId?: string;
}

export interface AdvertiserFilters {
  search?: string;
  status?: CustomerStatus | 'ALL';
  municipality?: string | 'ALL';
  industry?: string | 'ALL';
  lifecycleStage?: CustomerLifecycleStage | 'ALL';
  organizationId?: string;
}

export interface ContactFilters {
  organizationId?: string;
  search?: string;
  status?: ContactStatus | 'ALL';
}

export const ANGOLA_MUNICIPALITIES = [
  'Talatona',
  'Belas',
  'Viana',
  'Kilamba',
  'Maianga',
  'Ingombota',
  'Cazenga',
  'Rangel',
  'Samba',
  'Cacuaco',
] as const;

export const CUSTOMER_INDUSTRIES = [
  'Restauração & Lazer',
  'Retalho & Shoppings',
  'Banca & Finanças',
  'Saúde & Clínicas',
  'Hotelaria & Turismo',
  'Supermercados & Hiper',
  'Ginásios & Fitness',
  'Educação & Universidades',
  'Automóvel & Concessionárias',
  'Outros',
] as const;

export const ADVERTISER_INDUSTRIES = [
  'Telecomunicações',
  'Bebidas & Consumo Rápido',
  'Banca & Seguros',
  'Agência de Publicidade',
  'Eventos & Entretenimento',
  'Automóvel & Energia',
  'Imobiliário',
  'Tecnologia',
  'Outros',
] as const;

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WEBSITE: 'Website Nexora',
  WHATSAPP: 'WhatsApp Comercial',
  INSTAGRAM: 'Instagram / Redes Sociais',
  REFERRAL: 'Indicação / Recomendação',
  DIRECT_SALES: 'Venda Direta / Prospecção',
  EVENT: 'Feira / Evento Corporativo',
  PARTNER: 'Parceiro Integrador',
  OTHER: 'Outro Canal',
};

export const LIFECYCLE_STAGE_LABELS: Record<CustomerLifecycleStage, { label: string; color: string; step: number }> = {
  LEAD: { label: 'Lead', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30', step: 1 },
  PROSPECT: { label: 'Prospect', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', step: 2 },
  ACTIVE: { label: 'Ativo', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', step: 3 },
  INACTIVE: { label: 'Inativo', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', step: 4 },
  SUSPENDED: { label: 'Suspenso', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', step: 5 },
  CHURNED: { label: 'Churned', color: 'bg-red-500/20 text-red-400 border-red-500/30', step: 6 },
};

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, { label: string; variant: 'emerald' | 'amber' | 'cyan' | 'purple' | 'neutral' | 'magenta' }> = {
  ACTIVE: { label: 'Ativo', variant: 'emerald' },
  PROSPECT: { label: 'Prospect', variant: 'cyan' },
  INACTIVE: { label: 'Inativo', variant: 'amber' },
  SUSPENDED: { label: 'Suspenso', variant: 'magenta' },
  CHURNED: { label: 'Cancelado', variant: 'neutral' },
};
