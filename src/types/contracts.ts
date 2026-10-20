import { OrganizationType } from './auth';

/**
 * Nexora Contract Management Domain Types
 * Distinct separation: ContractTemplate (reusable legal model) vs Contract (specific commercial execution)
 */

export type ContractType =
  | 'DISPLAY_RENTAL'
  | 'DISPLAY_SALE'
  | 'EVENT_RENTAL'
  | 'SAAS_SUBSCRIPTION'
  | 'SERVICE_AGREEMENT'
  | 'MAINTENANCE'
  | 'DISPLAY_RENTAL_AND_SAAS'
  | 'CUSTOM';

export type ContractTemplateStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type ContractStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'PENDING_SIGNATURE'
  | 'PARTIALLY_SIGNED'
  | 'SIGNED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED';

export type ContractPartyType =
  | 'NEXORA'
  | 'CUSTOMER'
  | 'ADVERTISER'
  | 'PARTNER'
  | 'SERVICE_PROVIDER';

export type SignatureStatus =
  | 'NOT_REQUIRED'
  | 'PENDING'
  | 'SIGNED'
  | 'DECLINED';

export type ContractItemType =
  | 'DISPLAY'
  | 'PLAN'
  | 'SUBSCRIPTION'
  | 'ADDON'
  | 'SERVICE'
  | 'INSTALLATION'
  | 'MAINTENANCE'
  | 'EVENT'
  | 'OTHER';

export type ContractEventType =
  | 'CREATED'
  | 'UPDATED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'SIGNATURE_REQUESTED'
  | 'SIGNED'
  | 'ACTIVATED'
  | 'EXPIRED'
  | 'CANCELLED';

/**
 * Reusable Section inside a Contract Template
 */
export interface ContractTemplateSection {
  id: string;
  title: string;
  order: number;
  content: string; // Markdown or formatted text containing {{variables}}
  required?: boolean;
}

/**
 * Reusable Template Model
 */
export interface ContractTemplate {
  id: string;
  code: string; // e.g. "TPL-RENTAL-01"
  name: string;
  description: string;
  contractType: ContractType;
  version: string; // e.g. "1.0", "2.1"
  status: ContractTemplateStatus;
  sections: ContractTemplateSection[];
  variables: string[]; // List of required/supported variable keys
  createdAt: string;
  updatedAt: string;
}

/**
 * Signatory Party on a Contract
 */
export interface ContractParty {
  id: string;
  contractId: string;
  organizationId?: string;
  partyType: ContractPartyType;
  legalName: string;
  tradeName?: string;
  nif: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  province?: string;
  country?: string;
  representativeName: string;
  representativeRole: string;
  signatureStatus: SignatureStatus;
  signedAt?: string;
  signatureIp?: string;
  signatureTrackingId?: string;
}

/**
 * Itemized asset, product, plan, or service included in a Contract
 */
export interface ContractItem {
  id: string;
  contractId: string;
  itemType: ContractItemType;
  referenceId?: string; // Foreign reference to Display, Plan, Subscription, AddOn, etc.
  referenceCode?: string;
  description: string;
  quantity: number;
  unitPrice: number; // in AOA (Kwanzas)
  discount: number; // in AOA or percentage
  total: number; // in AOA
  metadata?: Record<string, any>; // e.g. serialNumber, displayResolution, billingPeriod
}

/**
 * Commercial Contract Entity
 */
export interface Contract {
  id: string;
  contractNumber: string; // Format: NEX-CON-2026-0001
  templateId?: string;
  templateName?: string;
  organizationId: string; // SaaS Tenant Isolation (Customer / Advertiser Organization)
  organizationName?: string;
  organizationCode?: string;
  organizationType?: OrganizationType;
  contractType: ContractType;
  title: string;
  status: ContractStatus;
  startDate: string; // ISO format
  endDate: string; // ISO format
  currency: 'AOA' | 'Kz';
  subtotal: number; // in AOA
  discount: number; // in AOA
  tax: number; // in AOA (e.g. 14% IVA Angola)
  total: number; // in AOA
  notes?: string;
  version: string; // e.g. "1.0"
  paymentTerms?: string; // e.g. "30 dias após emissão da fatura", "Mensal pré-pago"
  autoRenew?: boolean;
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  
  // Pre-calculated or pre-resolved relationships
  partiesCount?: number;
  itemsCount?: number;
  primaryClientName?: string;
  primaryClientNif?: string;
  hasDocument?: boolean;
}

/**
 * Historical event logged during contract lifecycle
 */
export interface ContractEvent {
  id: string;
  contractId: string;
  eventType: ContractEventType;
  actorId?: string;
  actorName: string;
  timestamp: string;
  description: string;
  metadata?: Record<string, any>;
}

/**
 * Rendered Contract Section for the Document Viewer
 */
export interface ContractSection {
  id: string;
  title: string;
  content: string;
  order: number;
}

/**
 * Structured Contract Document Model
 */
export interface ContractDocument {
  contractId: string;
  title: string;
  sections: ContractSection[];
  generatedAt: string;
  version: string;
  headerMetadata?: {
    contractNumber: string;
    templateCode?: string;
    organizationName: string;
    nif: string;
    effectiveDate: string;
    expiryDate: string;
    totalAmountKz: number;
  };
}

/**
 * Context Payload passed to Generator Service
 */
export interface ContractContext {
  organization?: any;
  customer?: any;
  advertiser?: any;
  display?: any;
  displays?: any[];
  subscription?: any;
  plan?: any;
  items?: ContractItem[];
  parties?: ContractParty[];
  dates?: {
    startDate: string;
    endDate: string;
    signingDate?: string;
  };
  prices?: {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    currency: string;
  };
  customVariables?: Record<string, string>;
}

/**
 * Generator Interface for Mock & Future AI Generation
 */
export interface IContractGenerator {
  generate(context: ContractContext, template?: ContractTemplate): Promise<ContractDocument>;
}

/**
 * Digital Signature Provider Interface for Mock & Future Integration
 */
export interface ISignatureProvider {
  requestSignature(
    contractId: string,
    partyIds: string[]
  ): Promise<{ success: boolean; trackingId: string; message: string }>;
  getSignatureStatus(
    contractId: string
  ): Promise<{
    contractId: string;
    status: SignatureStatus;
    parties: { partyId: string; status: SignatureStatus; signedAt?: string }[];
  }>;
  cancelSignatureRequest(
    contractId: string
  ): Promise<{ success: boolean; message: string }>;
  simulateSign(
    contractId: string,
    partyId: string
  ): Promise<{ success: boolean; message: string; signedAt: string }>;
}

/**
 * Filter & KPI Types
 */
export interface ContractFilters {
  search?: string;
  contractType?: ContractType | 'ALL';
  status?: ContractStatus | 'ALL';
  organizationId?: string;
  customerId?: string;
  planId?: string;
  displayId?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  expiringInDays?: number;
}

export interface ContractKPIs {
  totalCount: number;
  draftCount: number;
  pendingApprovalCount: number;
  pendingSignatureCount: number;
  activeCount: number;
  expiringCount: number;
  expiredCount: number;
  cancelledCount: number;
  totalActiveValueKz: number;
}
