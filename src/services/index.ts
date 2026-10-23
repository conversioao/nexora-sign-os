export * from "./studioService";
export * from './advertisingPricingService';
export * from './advertisingBookingService';
export * from './contractService';
export * from './contractGenerationService';
export * from './contractTemplateService';
export * from './displayAvailabilityService';
export * from './mediaInventoryService';
export * from './permissionService';
export * from './planEntitlementService';
export * from './planService';
export * from './sessionService';
export * from './signatureProviderService';
export * from './subscriptionService';
export * from './deviceService';

import { displayRepository } from '../repositories/displayRepository';
import { customerRepository } from '../repositories/customerRepository';
import { contactRepository } from '../repositories/contactRepository';
import { crmActivityRepository } from '../repositories/crmActivityRepository';
import { userRepository } from '../repositories/userRepository';
import { alertRepository } from '../repositories/alertRepository';
import { advertiserRepository } from '../repositories/advertiserRepository';
import { advertisingOpportunityRepository } from '../repositories/advertisingOpportunityRepository';
import { advertisingCampaignRepository } from '../repositories/advertisingCampaignRepository';
import { maintenanceRepository } from '../repositories/maintenanceRepository';
import { contentRepository } from '../repositories/contentRepository';
import { organizationRepository } from '../repositories/organizationRepository';
import { planRepository } from '../repositories/planRepository';
import { subscriptionRepository } from '../repositories/subscriptionRepository';
import { addOnRepository } from '../repositories/addOnRepository';
import { scheduleRepository } from '../repositories/scheduleRepository';
import { playlistRepository } from '../repositories/playlistRepository';
import { contractRepository } from '../repositories/contractRepository';
import { kpiRepository, activityRepository } from '../repositories/campaignRepository';

// Unified NexoraService delegating to operational repositories
export const NexoraService = {
  kpis: {
    getKPIs: async (organizationId?: string) => kpiRepository.getKPIs(organizationId),
  },
  displays: {
    getAll: async (filters?: any) => displayRepository.getAll(filters),
    getKPIs: async (organizationId?: string) => displayRepository.getKPIs(organizationId),
    sync: async (id: string) => displayRepository.sync(id),
    restartPlayer: async (id: string) => displayRepository.restartPlayer(id),
    create: async (data: any) => displayRepository.create(data),
    rentDisplay: async (id: string, params: any) => displayRepository.rentDisplay(id, params),
    sellDisplay: async (id: string, params: any) => displayRepository.sellDisplay(id, params),
    rentForEvent: async (id: string, params: any) => displayRepository.rentForEvent(id, params),
    assignCustomer: async (id: string, customerOrgIdOrData: any, customerName?: string, notes?: string) =>
      displayRepository.assignCustomer(id, customerOrgIdOrData, customerName, notes),
    returnToInventory: async (id: string, notesOrData?: any) => displayRepository.returnToInventory(id, notesOrData),
    setAdvertisingEligibility: async (id: string, eligibleOrData: any, adStatus?: any) =>
      displayRepository.setAdvertisingEligibility(id, eligibleOrData, adStatus),
    getById: async (id: string) => displayRepository.getById(id),
    delete: async (id: string) => displayRepository.delete(id),
  },
  customers: {
    getAll: async (filters?: any) => customerRepository.getAll(filters),
    getById: async (id: string) => customerRepository.getById(id),
    getKPIs: async (organizationId?: string) => customerRepository.getKPIs(organizationId),
    updateStatus: async (id: string, status: any, stage?: any) => customerRepository.updateStatus(id, status, stage),
    create: async (data: any) => customerRepository.create(data),
    delete: async (id: string) => customerRepository.delete(id),
  },
  contacts: {
    getByCustomer: async (customerId: string) => contactRepository.getByCustomerId(customerId),
    getByOrganizationId: async (orgId: string) => contactRepository.getByOrganizationId(orgId),
    setPrimary: async (contactId: string, orgId: string) => contactRepository.setPrimary(contactId, orgId),
    toggleStatus: async (contactId: string, status: any) => contactRepository.toggleStatus(contactId, status),
    update: async (contactId: string, data: any) => contactRepository.update(contactId, data),
    create: async (data: any) => contactRepository.create(data),
  },
  crmActivities: {
    getByCustomer: async (customerId: string) => crmActivityRepository.getByCustomerId(customerId),
    getActivities: async (limit?: number, orgId?: string) => crmActivityRepository.getActivities(limit, orgId),
    logActivity: async (data: any) => crmActivityRepository.logActivity(data),
  },
  users: {
    getAll: async () => userRepository.getAllUsers(),
    updateRole: async (membershipId: string, role: any) => userRepository.updateMemberRole(membershipId, role),
    removeUser: async (userId: string) => userRepository.removeMember(userId),
    inviteUser: async (params: any) => userRepository.inviteMember(params),
    getMembersByOrganization: async (orgId: string) => userRepository.getMembersByOrganization(orgId),
    inviteMember: async (params: any) => userRepository.inviteMember(params),
    updateMemberRole: async (membershipId: string, role: any) => userRepository.updateMemberRole(membershipId, role),
    toggleMemberStatus: async (membershipId: string, status: any) => userRepository.toggleMemberStatus(membershipId, status),
    removeMember: async (membershipId: string) => userRepository.removeMember(membershipId),
  },
  alerts: {
    getAll: async (filters?: any) => alertRepository.getAll(filters),
    resolve: async (id: string) => alertRepository.resolve(id),
  },
  activities: {
    getRecentActivities: async (limit = 10, orgId?: string) => activityRepository.getRecentActivities(limit, orgId),
  },
  advertisers: {
    getLuandaZones: async () => advertiserRepository.getLuandaZones(),
    getOpportunities: async (municipality?: string) => advertiserRepository.getOpportunities(municipality),
    getMetrics: async (orgId?: string) => advertiserRepository.getMetrics(orgId),
    getProfileById: async (id: string) => advertiserRepository.getProfileById(id),
    updateProfileStatus: async (id: string, status: any, stage?: any) => advertiserRepository.updateProfileStatus(id, status, stage),
    getAllProfiles: async (filters?: any) => advertiserRepository.getAllProfiles(filters),
    getProfileKPIs: async (orgId?: string) => advertiserRepository.getProfileKPIs(orgId),
    getCampaigns: async (orgId?: string) => advertiserRepository.getCampaigns(orgId),
    createProfile: async (data: any) => advertiserRepository.createProfile(data),
    deleteProfile: async (id: string) => advertiserRepository.deleteProfile(id),
  },
  maintenance: {
    getAll: async (filters?: any) => maintenanceRepository.getAll(filters),
    getKPIs: async (organizationId?: string) => maintenanceRepository.getKPIs(organizationId),
    updateStatus: async (id: string, status: any) => maintenanceRepository.updateStatus(id, status),
  },
  contents: {
    getAll: async (filters?: any) => contentRepository.getAll(filters),
    getKPIs: async (organizationId?: string) => contentRepository.getKPIs(organizationId),
    getFolders: async (organizationId?: string) => contentRepository.getFolders(organizationId),
    create: async (data: any) => contentRepository.create(data),
    archive: async (ids: string[]) => contentRepository.archive(ids),
    delete: async (ids: string[]) => contentRepository.delete(ids),
    getById: async (id: string) => contentRepository.getById(id),
    addTag: async (id: string, tag: string) => contentRepository.addTag(id, tag),
  },
  organizations: {
    getAll: async () => organizationRepository.getAll(),
    create: async (data: any) => organizationRepository.create(data),
  },
  plans: {
    getAll: async (filters?: any) => planRepository.getAll(filters),
    getKPIs: async () => planRepository.getKPIs(),
    updateStatus: async (id: string, status: any) => planRepository.updateStatus(id, status),
    create: async (data: any) => planRepository.create(data),
    getById: async (id: string) => planRepository.getById(id),
    update: async (id: string, data: any) => planRepository.update(id, data),
    delete: async (id: string) => planRepository.delete(id),
  },
  subscriptions: {
    getAll: async (filters?: any) => subscriptionRepository.getAll(filters),
    getKPIs: async () => subscriptionRepository.getKPIs(),
    updateStatus: async (id: string, status: any) => subscriptionRepository.updateStatus(id, status),
    addAddOn: async (id: string, addOnId: string, quantity?: number) => subscriptionRepository.addAddOn(id, addOnId, quantity),
    removeAddOn: async (id: string, subAddOnId: string) => subscriptionRepository.removeAddOn(id, subAddOnId),
    getById: async (id: string) => subscriptionRepository.getById(id),
    getUsageSummary: async (organizationId: string) => subscriptionRepository.getUsageSummary(organizationId),
  },
  subscriptionService: {
    getAvailableAddOns: async () => addOnRepository.getAll('ACTIVE'),
  },
  schedules: {
    getAll: async (filters?: any) => scheduleRepository.getAll(filters),
    getKPIs: async (organizationId?: string) => scheduleRepository.getKPIs(organizationId),
    toggleStatus: async (id: string, _nextStatus?: any) => scheduleRepository.toggleStatus(id),
    duplicate: async (id: string) => scheduleRepository.duplicate(id),
    delete: async (ids: string[]) => scheduleRepository.delete(ids),
    getById: async (id: string) => scheduleRepository.getById(id),
    update: async (id: string, data: any) => scheduleRepository.update(id, data),
    create: async (data: any) => scheduleRepository.create(data),
  },
  playlists: {
    getAll: async (filters?: any) => playlistRepository.getAll(filters),
    getKPIs: async (organizationId?: string) => playlistRepository.getKPIs(organizationId),
    getById: async (id: string) => playlistRepository.getById(id),
    update: async (id: string, data: any, options?: { removedItemIds?: string[] }) =>
      playlistRepository.update(id, data, options),
    create: async (data: any) => playlistRepository.create(data),
    duplicate: async (id: string) => playlistRepository.duplicate(id),
    associateDisplays: async (id: string, displayIds: string[]) => playlistRepository.associateDisplays(id, displayIds),
    delete: async (ids: string[]) => playlistRepository.delete(ids),
  },
  contracts: {
    getByOrganizationId: async (orgId: string) => contractRepository.getByOrganizationId(orgId),
  },
  campaigns: {
    getAll: async (orgId?: string) => advertisingCampaignRepository.getAll(orgId ? { organizationId: orgId } : undefined),
  },
};

