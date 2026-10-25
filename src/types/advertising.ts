/**
 * Nexora Advertising & Media Network Domain Types
 * Digital Signage Advertising Marketplace, Media Inventory, Campaigns & Bookings
 */

import { DisplayOrientation } from './domain';

/* ==========================================================================
   VENUE & AUDIENCE TYPES
   ========================================================================== */

export type VenueType =
  | 'SHOPPING_CENTER'
  | 'RETAIL_STORE'
  | 'RESTAURANT'
  | 'HOTEL'
  | 'GYM'
  | 'EVENT_VENUE'
  | 'CORPORATE'
  | 'STREET_TOTEM'
  | 'TRANSPORT'
  | 'OTHER';

export type AdvertiserCategory =
  | 'RETAIL'
  | 'FOOD'
  | 'TELECOM'
  | 'BANKING'
  | 'FINANCE'
  | 'REAL_ESTATE'
  | 'AUTOMOTIVE'
  | 'EDUCATION'
  | 'HEALTH'
  | 'ENTERTAINMENT'
  | 'EVENTS'
  | 'OTHER';

export interface AudienceProfile {
  ageRanges: Record<string, number>; // e.g. { '18-24': 15, '25-34': 40, '35-44': 25, '45+': 20 } in %
  genderDistribution: {
    male: number;   // in %
    female: number; // in %
  };
  estimatedFootfall: number; // Daily foot traffic / circulation
  peakHours: string[];       // e.g. ['12:00 - 14:00', '18:00 - 21:00']
  weekdayProfile: string;    // Description of Monday-Friday audience
  weekendProfile: string;    // Description of Saturday-Sunday audience
  audienceCategories: string[]; // e.g. ['Executivos', 'Alta Renda', 'Famílias', 'Jovens']
  socioeconomicTier?: 'A/B' | 'B/C' | 'C/D' | 'TODAS';
}

/* ==========================================================================
   MEDIA INVENTORY
   ========================================================================== */

export type MediaInventoryStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'FULL'
  | 'SUSPENDED'
  | 'UNAVAILABLE';

export type PricingModel =
  | 'PER_DAY'
  | 'PER_WEEK'
  | 'PER_MONTH'
  | 'PER_PLAY'
  | 'PER_IMPRESSION'
  | 'PER_CAMPAIGN';

export type InventorySlotStatus =
  | 'AVAILABLE'
  | 'HELD'
  | 'BOOKED'
  | 'BLOCKED';

export interface InventorySlot {
  id: string;
  inventoryId: string;
  date: string;       // YYYY-MM-DD
  startTime: string;  // HH:mm
  endTime: string;    // HH:mm
  duration: number;   // seconds (e.g. 15)
  status: InventorySlotStatus;
  bookingId?: string;
}

export interface MediaInventory {
  id: string;
  displayId: string;
  organizationId: string; // Owner organization
  isAdvertisingEnabled: boolean;
  inventoryType: string;  // e.g. 'DIGITAL_TOTEM', 'INDOOR_SCREEN', 'STORE_DISPLAY'
  slotDuration: number;   // Standard slot duration in seconds (e.g. 15)
  dailySlots: number;     // Number of slots available per day
  monthlyCapacity: number;// Total slots per month
  basePrice: number;      // Base price in currency
  currency: 'AOA';
  pricingModel: PricingModel;
  minimumBookingDays: number;
  maximumBookingDays: number;
  availableFrom: string;  // ISO Date string
  availableUntil?: string;// ISO Date string
  status: MediaInventoryStatus;
  allowedCategories?: AdvertiserCategory[];
  blockedCategories?: AdvertiserCategory[];
  allowedTimeRanges?: string; // e.g. "06:00 - 23:00"
  occupiedSlotsPercentage?: number;
  currentActiveCampaignsCount?: number;
  monthlyEstimatedRevenue?: number;
}

/* ==========================================================================
   ADVERTISING OPPORTUNITY (MARKETPLACE)
   ========================================================================== */

export type OpportunityStatus =
  | 'AVAILABLE'
  | 'LIMITED'
  | 'BOOKED'
  | 'SUSPENDED';

export interface AdvertisingOpportunity {
  id: string;
  displayId: string;
  inventoryId: string;
  organizationId: string;
  name: string;
  description: string;
  location: string;
  municipality: string; // Talatona, Maianga, Mutamba, Viana, Kilamba, Belas, Ingombota, etc.
  neighborhood?: string;
  venue: string;
  venueType: VenueType;
  address: string;
  latitude: number;
  longitude: number;
  orientation: DisplayOrientation; // 'LANDSCAPE' | 'PORTRAIT'
  screenSize: string;              // '55"', '65"', '75"', 'Totem 55"'
  resolution: string;              // '1080x1920', '3840x2160', etc.
  estimatedDailyReach: number;
  estimatedMonthlyReach: number;
  estimatedDailyImpressions: number;
  audienceProfile: AudienceProfile;
  basePrice: number;
  currency: 'AOA';
  status: OpportunityStatus;
  pricingModel: PricingModel;
  spotDurationSeconds: number;
  maxDailyLoops?: number;
  photos?: string[];
  thumbnailUrl?: string;
  tags?: string[];
  ownerOrganizationName?: string;
  displayCode?: string;
  maxAdSlots?: number;
  totalAdSlots?: number;
  remainingAdSlots?: number;
}

/* ==========================================================================
   CAMPAIGN & BOOKINGS
   ========================================================================== */

export type CampaignObjective =
  | 'BRAND_AWARENESS'
  | 'PROMOTION'
  | 'PRODUCT_LAUNCH'
  | 'EVENT'
  | 'LOCAL_BUSINESS'
  | 'LEAD_GENERATION'
  | 'OTHER';

export type AdvertisingCampaignStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SCHEDULED'
  | 'LIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface AdvertisingCampaign {
  id: string;
  organizationId: string;
  advertiserId: string;
  advertiserName: string;
  name: string;
  description: string;
  objective: CampaignObjective;
  status: AdvertisingCampaignStatus;
  startDate: string; // ISO or YYYY-MM-DD
  endDate: string;   // ISO or YYYY-MM-DD
  budget: number;
  currency: 'AOA';
  createdAt: string;
  updatedAt: string;
  contractId?: string; // Optional linkage to formal contract
  targetMunicipalities?: string[];
  dailyFrequency?: number; // insertions per hour/day
  slotDurationSeconds?: number;
  reviewNotes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  // Performance metrics (Mock with ESTIMATED label)
  estimatedImpressions?: number;
  estimatedReach?: number;
  executedPlays?: number;
  targetPlays?: number;
  completionRate?: number; // percentage (e.g. 98.4%)
  uptimePercentage?: number;
  // Extended builder fields
  creatives?: any[];
  displays?: any[];
  schedule?: any;
  media_url?: string;
  paymentReceiptUrl?: string;
}

export type CampaignBookingStatus =
  | 'DRAFT'
  | 'HELD'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface CampaignBooking {
  id: string;
  campaignId: string;
  opportunityId: string;
  displayId: string;
  displayLocationSummary?: string;
  displayName?: string;
  venueName?: string;
  municipality?: string;
  startDate: string;
  endDate: string;
  frequency: number; // plays per hour/day
  slotDuration: number; // seconds
  estimatedPlays: number;
  estimatedImpressions: number;
  unitPrice: number;
  totalPrice: number;
  currency: 'AOA';
  status: CampaignBookingStatus;
}

export type CreativeApprovalStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export interface CampaignCreative {
  id: string;
  campaignId: string;
  advertiserId?: string;
  name?: string;
  contentId?: string; // Reference to existing ContentItem
  contentTitle?: string;
  type?: 'VIDEO' | 'IMAGE' | 'PDF' | 'HTML' | 'STREAM';
  format?: string;
  orientation?: DisplayOrientation;
  contentUrl?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  fileSize?: number;
  resolution?: string;
  duration?: number;
  status?: string;
  approvalStatus: CreativeApprovalStatus;
  rejectionReason?: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export type CampaignDeliveryStatus =
  | 'NOT_STARTED'
  | 'QUEUED'
  | 'DELIVERING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED';

export interface CampaignPlacement {
  id: string;
  campaignId: string;
  displayId: string;
  deviceId?: string;
  bookingId?: string;
  startDate: string;
  endDate: string;
  status: string;
  playCount: number;
  totalPlayDuration: number; // in seconds
  lastPlayedAt?: string;
}

export type PlaybackEventSource = 'PLAYER' | 'MOCK';

export type PlaybackEventStatus = 'PLAYED' | 'PARTIAL' | 'FAILED' | 'SKIPPED';

export interface PlaybackEvent {
  id: string;
  campaignId?: string;
  creativeId?: string;
  displayId?: string;
  deviceId?: string;
  playlistId?: string;
  contentId?: string;
  startedAt: string;
  endedAt?: string;
  duration: number; // in seconds
  completed: boolean;
  error?: string;
  timestamp: string;
  source: PlaybackEventSource;
  percentagePlayed?: number;
  status?: PlaybackEventStatus;
  location?: string;
  displayCode?: string;
  signature?: string;
}

export interface CampaignAnalytics {
  campaignId: string;
  totalPlays: number;
  completedPlays: number;
  failedPlays: number;
  totalDuration: number;
  averageDuration: number;
  completionRate: number;
  uniqueDisplays: number;
  activeDisplays: number;
  estimatedImpressions: number;
  estimatedReach: number;
  estimatedFrequency: number;
  spent: number;
  costPerPlay: number;
  lastPlaybackAt?: string;
}

/* ==========================================================================
   MARKETPLACE FILTERS & KPIS
   ========================================================================== */

export interface MarketplaceFilterState {
  searchQuery: string;
  municipality: string;
  venueType: string;
  orientation: string;
  screenSize: string;
  resolution: string;
  priceMin?: number;
  priceMax?: number;
  availability: string;
  audienceCategory: string;
  pricingModel: string;
  sortBy: 'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'REACH_DESC' | 'NAME';
}

export interface AdvertisingNetworkKPIs {
  totalInventoryDisplays: number;
  monetizableDisplays: number;
  monetizedDisplays?: number;
  activeAdvertisersCount?: number;
  proofOfPlayComplianceRate?: number;
  networkUptimePercent?: number;
  totalActiveCampaigns: number;
  pendingReviewCampaigns: number;
  networkOccupancyRate: number;
  estimatedMonthlyRevenueKz: number;
  totalEstimatedDailyImpressions: number;
  dailyImpressionsNetwork?: number;
  totalDisplaysAvailable?: number;
  totalMonthlyRevenueKz?: number;
  topMunicipalities: { municipality: string; displayCount: number; impressions: number }[];
  topVenues: { venueName: string; venueType: VenueType; displayCount: number }[];
}

export interface AdvertiserDashboardMetrics {
  activeCampaignsCount: number;
  scheduledCampaignsCount: number;
  pendingReviewsCount: number;
  totalBudgetUtilizedKz: number;
  totalEstimatedImpressions: number;
  totalEstimatedReach: number;
  studioIACreditsRemaining: number;
}

export interface ClientMonetizationMetrics {
  totalEligibleDisplays: number;
  activeAdvertisingDisplays: number;
  averageOccupancyRate: number;
  estimatedMonthlyRevenueKz: number;
  activeCampaignsInNetworkCount: number;
  nextPayoutDate?: string;
}
export interface PricingCalculationResult {
  baseDailyPrice: number;
  subtotal: number;
  discountPercentage: number;
  discountAmount: number;
  totalPrice: number;
  days: number;
  estimatedImpressions: number;
  estimatedPlays: number;
  estimatedReach: number;
  estimatedCPM?: number;
  currency?: string;
  spaceOwnerRevenue?: number;
  nexoraCommission?: number;
}
