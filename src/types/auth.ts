/**
 * Nexora SaaS Identity & Access Management (IAM) Domain Types
 * Multi-tenant architecture: User -> Membership -> Organization -> Role -> Permissions
 */

export type OrganizationType = 'NEXORA' | 'CLIENT' | 'ADVERTISER' | 'PARTNER' | 'DISPLAY_OWNER' | 'AFFILIATE';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';

export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export type Role =
  | 'NEXORA_ADMIN'
  | 'NEXORA_OPERATOR'
  | 'CLIENT_OWNER'
  | 'CLIENT_MANAGER'
  | 'CLIENT_EDITOR'
  | 'ADVERTISER_OWNER'
  | 'ADVERTISER_MANAGER'
  | 'TECHNICIAN'
  | 'DISPLAY_OWNER'
  | 'AFFILIATE';

export type Permission =
  // Platform Super / Global
  | 'platform.admin'
  | 'platform.all'
  // Affiliates System
  | 'affiliate.dashboard'
  | 'affiliate.referrals'
  | 'affiliate.commissions'
  | 'affiliate.payouts'
  | 'affiliate.manage'
  | 'affiliates.admin'
  // Displays
  | 'displays.read'
  | 'displays.create'
  | 'displays.update'
  | 'displays.delete'
  | 'displays.control'
  | 'displays.commercial.read'
  | 'displays.commercial.manage'
  // Content / Media Library
  | 'content.read'
  | 'content.create'
  | 'content.update'
  | 'content.delete'
  // Playlists
  | 'playlists.read'
  | 'playlists.create'
  | 'playlists.update'
  | 'playlists.delete'
  // Scheduling / Programação
  | 'schedules.read'
  | 'schedules.create'
  | 'schedules.update'
  | 'schedules.delete'
  // Users & Memberships
  | 'users.read'
  | 'users.manage'
  // Organization
  | 'organization.read'
  | 'organization.update'
  // Billing & Finance
  | 'billing.read'
  | 'billing.manage'
  // Contracts & Templates
  | 'contracts.read'
  | 'contracts.create'
  | 'contracts.manage'
  | 'contracts.approve'
  | 'contracts.sign'
  | 'contracts.cancel'
  | 'templates.read'
  | 'templates.manage'
  // Campaigns, Advertising & Marketplace
  | 'campaigns.read'
  | 'campaigns.create'
  | 'campaigns.manage'
  | 'campaigns.approve'
  | 'marketplace.view'
  | 'inventory.read'
  | 'inventory.manage'
  | 'inventory.monetize'
  | 'creative.review'
  // CRM: Customers, Advertisers & Contacts
  | 'customers.read'
  | 'customers.manage'
  | 'advertisers.read'
  | 'advertisers.manage'
  | 'contacts.read'
  | 'contacts.manage'
  // Analytics & Reports
  | 'analytics.read'
  // AI Studio & Credits
  | 'aicredits.read'
  | 'aicredits.manage'
  // ─── Categorias de Admin: painel autónomo do ecossistema Nexora Creative AI ───
  // Distinguem quem entra no admin GERAL (Nexora Sign) de quem entra no admin
  // exclusivo do Creative AI. Ver src/services/adminScopeService.ts.
  | 'creativeadmin.access'
  | 'creativeadmin.credits'
  | 'creativeadmin.packages'
  | 'creativeadmin.analytics'
  // Hardware & Field Maintenance
  | 'maintenance.read'
  | 'maintenance.manage'
  // Device & Player Management
  | 'devices.read'
  | 'devices.manage'
  | 'devices.command'
  | 'devices.register'
  | 'devices.telemetry.read'
  | 'devices.diagnostics'
  | 'devices.update'
  | 'device_groups.manage'
  | 'player_releases.manage'
  // SaaS Plans & Subscriptions
  | 'plans.read'
  | 'plans.manage'
  | 'subscriptions.read'
  | 'subscriptions.manage'
  | 'addons.read'
  | 'addons.manage'
  | 'subscription.usage.read';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  phone?: string;
  jobTitle?: string;
  lastLoginAt?: string; // ISO date string
  createdAt: string;    // ISO date string
}

export interface OrganizationSettings {
  defaultTimezone: string;
  currency: 'AOA' | 'USD' | 'EUR';
  language: 'pt-AO' | 'pt-PT' | 'en';
  allowGuestUploads?: boolean;
  twoFactorRequired?: boolean;
}

export interface Organization {
  id: string;
  code: string; // e.g. "ORG-NEX-001", "ORG-CLT-002"
  name: string;
  tradeName: string; // Razão Social
  type: OrganizationType;
  nif?: string; // Número de Identificação Fiscal (Angola)
  logoUrl?: string;
  logoGradient?: string;
  contactEmail: string;
  phone: string;
  address?: string;
  city: string;
  province: string;
  country: string;
  timezone: string;
  status: 'ACTIVE' | 'TRIAL' | 'SUSPENDED';
  settings?: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  userId: string;
  organizationId: string;
  role: Role;
  status: MembershipStatus;
  joinedAt: string;
  // Optional pre-resolved objects for UI rendering
  user?: User;
  organization?: Organization;
}

export interface RoleDefinition {
  id: Role;
  name: string;
  description: string;
  organizationType: OrganizationType;
  badgeColor: string;
  permissions: Permission[];
}
