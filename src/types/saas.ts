import { OrganizationType } from './auth';

/**
 * Nexora SaaS Domain Types
 * Distinct separation: Plan (Commercial Product) vs Subscription (Tenant Contract)
 */

export type BillingInterval = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';

export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED'
  | 'EXPIRED';

export type SubscriptionCommercialModel =
  | 'RENTAL_SAAS'       // Display alugado da Nexora + Licença SaaS
  | 'SALE_SAAS'         // Hardware vendido ao cliente + Licença SaaS
  | 'SUBSCRIPTION_ONLY'; // BYOD: Hardware próprio do cliente + Licença SaaS

export interface PlanFeatures {
  displayManagement: boolean;
  contentManagement: boolean;
  playlistManagement: boolean;
  scheduling: boolean;
  advancedScheduling: boolean;
  teamManagement: boolean;
  analytics: boolean;
  remoteMonitoring: boolean;
  aiImageGeneration: boolean;
  aiVideoGeneration: boolean;
  advertisingMarketplace: boolean;
  prioritySupport: boolean;
  customBranding?: boolean;
  multiZoneLayout?: boolean;
  auditLogs?: boolean;
  slaGuaranteed?: boolean;
}

export interface PlanEntitlements {
  maxDisplays: number;
  maxStorageGB: number;
  maxTeamMembers: number;
  maxPlaylists: number;
  maxSchedules: number;
  monthlyAiCredits: number;
  maxVideoGenerations: number;
}

export interface Plan {
  id: string;
  code: string; // e.g. 'PLAN_STARTER', 'PLAN_PRO', 'PLAN_ENTERPRISE', 'PLAN_BYOD'
  name: string;
  description: string;
  status: PlanStatus;
  billingInterval: BillingInterval;
  basePrice: number; // in AOA (Kwanzas)
  currency: 'AOA';
  displayLimit: number;
  storageLimitGB: number;
  teamMemberLimit: number;
  playlistLimit: number;
  scheduleLimit: number;
  monthlyAiCredits: number;
  features: PlanFeatures;
  entitlements: PlanEntitlements;
  isPopular?: boolean;
  badgeText?: string;
  activeSubscriptionsCount?: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface PlanFilters {
  search?: string;
  status?: PlanStatus | 'ALL';
  billingInterval?: BillingInterval | 'ALL';
}

export interface PlanKPIs {
  totalPlans: number;
  activePlans: number;
  draftPlans: number;
  archivedPlans: number;
  totalSubscribedClients: number;
  estimatedMRRKz: number;
}

export interface AddOn {
  id: string;
  code: string; // e.g. 'ADDON_DISPLAY_EXTRA', 'ADDON_STORAGE_50GB', 'ADDON_AI_CREDITS_1000'
  name: string;
  description: string;
  billingInterval: BillingInterval;
  price: number; // in AOA (Kwanzas)
  currency: 'AOA';
  status: 'ACTIVE' | 'ARCHIVED';
  unitLabel?: string; // e.g. '/display', '/mês'
  category?: 'HARDWARE' | 'STORAGE' | 'AI' | 'SUPPORT' | 'ANALYTICS';
}

export interface SubscriptionAddOn {
  id: string;
  subscriptionId: string;
  addOnId: string;
  addOnCode: string;
  addOnName: string;
  quantity: number;
  unitPrice: number;
  active: boolean;
  addedAt: string;
}

export interface Subscription {
  id: string;
  organizationId: string; // SaaS Tenant Isolation
  organizationName?: string;
  organizationCode?: string;
  organizationType?: OrganizationType;
  planId: string;
  planCode?: string;
  planName?: string;
  status: SubscriptionStatus;
  commercialModel: SubscriptionCommercialModel;
  startDate: string; // ISO
  endDate?: string;  // ISO
  nextRenewalDate: string; // ISO
  billingInterval: BillingInterval;
  price: number; // in AOA (Kwanzas)
  currency: 'AOA';
  displayLimit: number;
  storageLimitGB: number;
  aiCreditsIncluded: number;
  autoRenew: boolean;
  addOns: SubscriptionAddOn[];
  contractId?: string; // Optional reference to Contract
  contractNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionUsage {
  organizationId: string;
  subscriptionId: string;
  displaysUsed: number;
  storageUsedGB: number;
  teamMembersUsed: number;
  playlistsUsed: number;
  schedulesUsed: number;
  aiCreditsUsed: number;
  lastCalculatedAt: string;
}

export interface UsageMetricItem {
  metric: string;
  label: string;
  used: number;
  limit: number;
  unit: string;
  percentage: number;
  remaining: number;
  isNearLimit: boolean; // >= 80%
  isOverLimit: boolean; // >= 100%
  status: 'normal' | 'warning' | 'danger';
}

export interface SubscriptionUsageSummary {
  subscription: Subscription;
  plan: Plan;
  usage: SubscriptionUsage;
  metrics: {
    displays: UsageMetricItem;
    storage: UsageMetricItem;
    teamMembers: UsageMetricItem;
    playlists: UsageMetricItem;
    schedules: UsageMetricItem;
    aiCredits: UsageMetricItem;
  };
  hasAlerts: boolean;
  alerts: string[];
}

export interface SubscriptionFilters {
  search?: string;
  status?: SubscriptionStatus | 'ALL';
  billingInterval?: BillingInterval | 'ALL';
  commercialModel?: SubscriptionCommercialModel | 'ALL';
  planId?: string | 'ALL';
  organizationId?: string; // SaaS Tenant filter
}

export interface SubscriptionKPIs {
  totalSubscriptions: number;
  activeSubscriptions: number;
  trialSubscriptions: number;
  pastDueSubscriptions: number;
  suspendedSubscriptions: number;
  cancelledSubscriptions: number;
  expiredSubscriptions: number;
  estimatedMRRKz: number;
  displaysCoveredBySaaS: number;
}
