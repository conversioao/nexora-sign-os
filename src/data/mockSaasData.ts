import { Plan, AddOn, Subscription, SubscriptionUsage } from '../types/saas';

/**
 * Nexora Commercial SaaS Plans Catalog
 * Pricing in AOA (Kwanzas) - Angola
 */
export const mockPlans: Plan[] = [
  {
    id: 'plan-starter-01',
    code: 'PLAN_STARTER',
    name: 'Plano Starter (3 Telas)',
    description: 'Ideal para comércios, clínicas e recepções que necessitam de até 3 telas sincronizadas com grade de programação simples.',
    status: 'ACTIVE',
    billingInterval: 'MONTHLY',
    basePrice: 75000,
    currency: 'AOA',
    displayLimit: 3,
    storageLimitGB: 15,
    teamMemberLimit: 2,
    playlistLimit: 10,
    scheduleLimit: 10,
    monthlyAiCredits: 150,
    isPopular: false,
    badgeText: 'Essencial',
    features: {
      displayManagement: true,
      contentManagement: true,
      playlistManagement: true,
      scheduling: true,
      advancedScheduling: false,
      teamManagement: true,
      analytics: true,
      remoteMonitoring: true,
      aiImageGeneration: true,
      aiVideoGeneration: false,
      advertisingMarketplace: false,
      prioritySupport: false,
      multiZoneLayout: false,
      slaGuaranteed: false,
    },
    entitlements: {
      maxDisplays: 3,
      maxStorageGB: 15,
      maxTeamMembers: 2,
      maxPlaylists: 10,
      maxSchedules: 10,
      monthlyAiCredits: 150,
      maxVideoGenerations: 0,
    },
    activeSubscriptionsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  },
  {
    id: 'plan-pro-02',
    code: 'PLAN_PRO',
    name: 'Plano Pro (10 Telas)',
    description: 'A solução mais recomendada para redes em expansão, com Sentinel AI de monitoramento, suporte a multi-zonas e geração criativa com IA.',
    status: 'ACTIVE',
    billingInterval: 'MONTHLY',
    basePrice: 180000,
    currency: 'AOA',
    displayLimit: 10,
    storageLimitGB: 50,
    teamMemberLimit: 5,
    playlistLimit: 30,
    scheduleLimit: 30,
    monthlyAiCredits: 500,
    isPopular: true,
    badgeText: 'Mais Popular',
    features: {
      displayManagement: true,
      contentManagement: true,
      playlistManagement: true,
      scheduling: true,
      advancedScheduling: true,
      teamManagement: true,
      analytics: true,
      remoteMonitoring: true,
      aiImageGeneration: true,
      aiVideoGeneration: true,
      advertisingMarketplace: true,
      prioritySupport: true,
      multiZoneLayout: true,
      slaGuaranteed: true,
    },
    entitlements: {
      maxDisplays: 10,
      maxStorageGB: 50,
      maxTeamMembers: 5,
      maxPlaylists: 30,
      maxSchedules: 30,
      monthlyAiCredits: 500,
      maxVideoGenerations: 20,
    },
    activeSubscriptionsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  },
  {
    id: 'plan-enterprise-03',
    code: 'PLAN_ENTERPRISE',
    name: 'Plano Enterprise (30 Telas)',
    description: 'Projetado para grandes redes de totens, shoppings e aeroportos com alta exigência de uptime, integração corporativa e gerente de conta 24/7.',
    status: 'ACTIVE',
    billingInterval: 'MONTHLY',
    basePrice: 390000,
    currency: 'AOA',
    displayLimit: 30,
    storageLimitGB: 150,
    teamMemberLimit: 15,
    playlistLimit: 100,
    scheduleLimit: 100,
    monthlyAiCredits: 1500,
    isPopular: false,
    badgeText: 'Escala Máxima',
    features: {
      displayManagement: true,
      contentManagement: true,
      playlistManagement: true,
      scheduling: true,
      advancedScheduling: true,
      teamManagement: true,
      analytics: true,
      remoteMonitoring: true,
      aiImageGeneration: true,
      aiVideoGeneration: true,
      advertisingMarketplace: true,
      prioritySupport: true,
      multiZoneLayout: true,
      customBranding: true,
      auditLogs: true,
      slaGuaranteed: true,
    },
    entitlements: {
      maxDisplays: 30,
      maxStorageGB: 150,
      maxTeamMembers: 15,
      maxPlaylists: 100,
      maxSchedules: 100,
      monthlyAiCredits: 1500,
      maxVideoGenerations: 60,
    },
    activeSubscriptionsCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-10-18T00:00:00.000Z',
  },
];

/**
 * Commercial SaaS Add-Ons Catalog
 */
export const mockAddOns: AddOn[] = [];

/**
 * Tenant Subscriptions
 */
export const mockSubscriptions: Subscription[] = [];

/**
 * Mock Usage tracking for each tenant organization
 */
export const mockSubscriptionUsages: SubscriptionUsage[] = [];
