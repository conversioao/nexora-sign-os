import {
  Display,
  Campaign,
  DashboardKPIs,
  SystemActivity,
  DisplayKPIs,
  DisplayCommercialModel,
  DisplayOwnershipType,
  DisplayCommercialStatus,
  DisplayAdvertisingStatus,
  DisplayCommercialEvent,
  ContentItem,
  ContentKPIs,
  ContentFolder,
  ContentMediaType,
  ContentStatus,
  ContentOrientation,
  Playlist,
  PlaylistItem,
  PlaylistKPIs,
  PlaylistStatus,
  Schedule,
  ScheduleKPIs,
  ScheduleStatus,
  SchedulePriority,
  ScheduleRecurrence,
} from '../types/domain';
import { IOrganizationRepository } from './organizationRepository';
import { IUserRepository, UserMemberRecord } from './userRepository';

export interface RentDisplayParams {
  customerOrganizationId: string;
  customerName?: string;
  monthlyFeeKz: number;
  startDate: string;
  endDate?: string;
  saasPlanId?: string;
  saasPlanName?: string;
  advertisingEligible?: boolean;
  contractNumber?: string;
  notes?: string;
}

export interface SellDisplayParams {
  customerOrganizationId: string;
  customerName?: string;
  salePriceKz: number;
  date?: string;
  saasPlanId?: string;
  saasPlanName?: string;
  advertisingEligible?: boolean;
  notes?: string;
}

export interface EventRentalParams {
  eventName: string;
  eventLocation: string;
  customerOrganizationId?: string;
  customerName?: string;
  startDate: string;
  endDate: string;
  dailyRentalRateKz: number;
  advertisingEligible?: boolean;
  notes?: string;
}

export interface DisplayFilters {
  search?: string;
  status?: Display['status'] | 'ALL';
  deviceType?: Display['deviceType'] | 'ALL';
  municipality?: string | 'ALL';
  commercialModel?: DisplayCommercialModel | 'ALL';
  ownershipType?: DisplayOwnershipType | 'ALL';
  commercialStatus?: DisplayCommercialStatus | 'ALL';
  advertisingStatus?: DisplayAdvertisingStatus | 'ALL';
  advertisingEligible?: boolean | 'ALL';
  customerOrganizationId?: string | 'ALL';
  organizationId?: string; // SaaS Tenant isolation filter
}

export interface IDisplayRepository {
  getAll(filters?: DisplayFilters): Promise<Display[]>;
  getById(id: string): Promise<Display | null>;
  getByStatus(status: Display['status']): Promise<Display[]>;
  getKPIs(organizationId?: string): Promise<DisplayKPIs>;
  create(displayData: Partial<Display>): Promise<Display>;
  update(id: string, data: Partial<Display>): Promise<Display>;
  delete(id: string): Promise<{ success: boolean }>;
  sync(id: string): Promise<{ success: boolean; message: string }>;
  restartPlayer(id: string): Promise<{ success: boolean; message: string }>;

  // Commercial Operations
  rentDisplay(displayId: string, params: RentDisplayParams | any): Promise<Display>;
  sellDisplay(displayId: string, params: SellDisplayParams | any): Promise<Display>;
  rentForEvent(displayId: string, params: EventRentalParams | any): Promise<Display>;
  assignCustomer(displayId: string, customerOrgIdOrData: string | any, customerName?: string, notes?: string): Promise<Display>;
  returnToInventory(displayId: string, notesOrData?: string | any): Promise<Display>;
  setAdvertisingEligibility(displayId: string, eligibleOrData: boolean | any, adStatus?: DisplayAdvertisingStatus): Promise<Display>;
  bulkAssignCustomer(displayIds: string[], customerOrgId: string, customerName?: string): Promise<{ success: boolean; count: number }>;
  bulkUpdateCommercialModel(displayIds: string[], commercialModel: DisplayCommercialModel): Promise<{ success: boolean; count: number }>;
  bulkSetAdvertisingEligibility(displayIds: string[], eligible: boolean): Promise<{ success: boolean; count: number }>;
  getCommercialHistory(displayId: string): Promise<DisplayCommercialEvent[]>;
  logCommercialEvent(event: Omit<DisplayCommercialEvent, 'id' | 'timestamp'>): Promise<DisplayCommercialEvent>;
}

export interface ContentFilters {
  search?: string;
  type?: ContentMediaType | 'ALL';
  status?: ContentStatus | 'ALL';
  orientation?: ContentOrientation | 'ALL';
  folderId?: string | 'ALL';
  tag?: string | 'ALL';
  organizationId?: string; // SaaS Tenant isolation filter
}

export interface IContentRepository {
  getAll(filters?: ContentFilters): Promise<ContentItem[]>;
  getById(id: string): Promise<ContentItem | null>;
  getKPIs(organizationId?: string): Promise<ContentKPIs>;
  getFolders(organizationId?: string): Promise<ContentFolder[]>;
  create(data: Partial<ContentItem>): Promise<ContentItem>;
  update(id: string, data: Partial<ContentItem>): Promise<ContentItem>;
  archive(ids: string[]): Promise<{ count: number; success: boolean }>;
  delete(ids: string[]): Promise<{ count: number; success: boolean }>;
  addTag(id: string, tag: string): Promise<ContentItem>;
}

export interface PlaylistFilters {
  search?: string;
  status?: PlaylistStatus | 'ALL';
  tag?: string | 'ALL';
  organizationId?: string; // SaaS Tenant isolation filter
}

export interface IPlaylistRepository {
  getAll(filters?: PlaylistFilters): Promise<Playlist[]>;
  getById(id: string): Promise<Playlist | null>;
  getKPIs(organizationId?: string): Promise<PlaylistKPIs>;
  create(data: Partial<Playlist>): Promise<Playlist>;
  /**
   * `options.removedItemIds` informa o servidor de que itens foram removidos
   * deliberadamente, para que a proteção de mídias de campanha não os reponha.
   */
  update(
    id: string,
    data: Partial<Playlist>,
    options?: { removedItemIds?: string[] }
  ): Promise<Playlist>;
  duplicate(id: string): Promise<Playlist>;
  delete(ids: string[]): Promise<{ count: number; success: boolean }>;
  addItem(playlistId: string, contentId: string, duration?: number): Promise<Playlist>;
  removeItem(playlistId: string, itemId: string): Promise<Playlist>;
  reorderItems(playlistId: string, itemIdsInOrder: string[]): Promise<Playlist>;
  updateItem(playlistId: string, itemId: string, data: Partial<PlaylistItem>): Promise<Playlist>;
  associateDisplays(playlistId: string, displayIds: string[]): Promise<Playlist>;
}

export interface ScheduleFilters {
  search?: string;
  status?: ScheduleStatus | 'ALL';
  priority?: SchedulePriority | 'ALL';
  recurrence?: ScheduleRecurrence | 'ALL';
  playlistId?: string | 'ALL';
  displayId?: string | 'ALL';
  organizationId?: string; // SaaS Tenant isolation filter
}

export interface IScheduleRepository {
  getAll(filters?: ScheduleFilters): Promise<Schedule[]>;
  getById(id: string): Promise<Schedule | null>;
  getKPIs(organizationId?: string): Promise<ScheduleKPIs>;
  create(data: Partial<Schedule>): Promise<Schedule>;
  update(id: string, data: Partial<Schedule>): Promise<Schedule>;
  duplicate(id: string): Promise<Schedule>;
  delete(ids: string[]): Promise<{ count: number; success: boolean }>;
  toggleStatus(id: string, newStatus?: ScheduleStatus): Promise<Schedule>;
}

export interface ICampaignRepository {
  getAll(organizationId?: string): Promise<Campaign[]>;
  getById(id: string): Promise<Campaign | null>;
}

export interface IKPIRepository {
  getKPIs(organizationId?: string): Promise<DashboardKPIs>;
}

export interface IActivityRepository {
  getRecentActivities(limit?: number, organizationId?: string): Promise<SystemActivity[]>;
}

export type { ICustomerRepository } from './customerRepository';
export type { IContactRepository } from './contactRepository';
export type { ICRMActivityRepository } from './crmActivityRepository';
export type { IAdvertiserRepository } from './advertiserRepository';
export type { IPlanRepository } from './planRepository';
export type { ISubscriptionRepository } from './subscriptionRepository';
export type { IAddOnRepository } from './addOnRepository';
export type { IOrganizationRepository, IUserRepository, UserMemberRecord };
export * from '../types/saas';

