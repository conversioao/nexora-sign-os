export type DisplayOrientation = 'LANDSCAPE' | 'PORTRAIT';
export type DisplayStatus = 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'WARNING' | 'SYNCING' | 'PLAYING' | 'PAUSED';
export type DeviceType = 'ANDROID_TV' | 'TV_BOX' | 'SMART_TV' | 'TOTEM' | 'VIDEO_WALL';
export type CampaignStatus = 'ACTIVE' | 'SCHEDULED' | 'PAUSED' | 'COMPLETED' | 'DRAFT';
export type ContentType = 'VIDEO' | 'IMAGE' | 'HTML' | 'STREAM';

/* ==========================================================================
   DISPLAY COMMERCIAL ASSET & SAAS TYPES
   ========================================================================== */

export type DisplayCommercialStatus =
  | 'INVENTORY'             // Em estoque / inventário Nexora disponível
  | 'RESERVED'              // Reservado para proposta / cliente
  | 'INSTALLATION_PENDING'  // Aguardando instalação física / homologação
  | 'ACTIVE'                // Em operação comercial ativa
  | 'SUSPENDED'             // Suspenso comercialmente (inadimplência / solicitação)
  | 'MAINTENANCE'           // Em manutenção técnica / recolhimento
  | 'RETIRED';              // Descomissionado / descontinuado

export type DisplayOwnershipType =
  | 'NEXORA_OWNED'          // Hardware de propriedade da Nexora
  | 'CLIENT_OWNED'          // Hardware adquirido pelo Cliente
  | 'PARTNER_OWNED';        // Hardware de parceiro de mídia / espaço

export type DisplayCommercialModel =
  | 'RENTAL'                // Aluguer mensal com manutenção & software
  | 'SALE'                  // Venda definitiva do hardware + licença SaaS
  | 'EVENT_RENTAL'          // Aluguer temporário / feiras / eventos
  | 'SUBSCRIPTION';         // Subscrição puramente SaaS (BYOD)

export type DisplaySaaSStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CANCELLED';

export type DisplayAdvertisingStatus =
  | 'NOT_AVAILABLE'         // Uso 100% institucional / privado
  | 'AVAILABLE'             // Elegível e disponível para venda de mídia
  | 'RESERVED'              // Grade publicitária reservada
  | 'ACTIVE_CAMPAIGN';       // Veiculando campanhas ativas de anunciantes

export type DisplayCommercialEventType =
  | 'DISPLAY_REGISTERED'
  | 'ASSIGNED_TO_CUSTOMER'
  | 'RENTAL_STARTED'
  | 'RENTAL_ENDED'
  | 'SOLD'
  | 'RETURNED'
  | 'SAAS_ACTIVATED'
  | 'SAAS_SUSPENDED'
  | 'ADVERTISING_ENABLED'
  | 'ADVERTISING_DISABLED'
  | 'MAINTENANCE_LOGGED'
  | 'PRICE_UPDATED';

export interface DisplayCommercialEvent {
  id: string;
  displayId: string;
  timestamp: string;
  type: DisplayCommercialEventType;
  actorId?: string;
  actorName: string;
  organizationId?: string;
  organizationName?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface DisplayPublicAdvertisingProfile {
  availableForAdvertising: boolean;
  orientation: DisplayOrientation;
  locationSummary: string;
  estimatedAudienceDaily: number;
  dailyAvailabilityHours: number;
  pricingPerDayKz: number;
  spotDurationSeconds?: number;
  maxDailyLoops?: number;
}

export interface DisplayCommercialProfile {
  commercialModel: DisplayCommercialModel;
  ownershipType: DisplayOwnershipType;
  ownerOrganizationId: string;       // Organização dona do ativo (ex: 'org-nexora')
  ownerOrganizationName?: string;
  customerOrganizationId?: string;   // Organização que utiliza (ex: 'org-talatona')
  customerOrganizationName?: string;
  tenantOrganizationId?: string;     // Organização com acesso ao dashboard
  commercialStatus: DisplayCommercialStatus;
  startDate?: string;
  endDate?: string;
  monthlyFeeKz?: number;             // Valor mensal em Kz
  salePriceKz?: number;              // Preço de venda em Kz
  dailyRentalRateKz?: number;        // Tarifa diária para eventos em Kz
  currency: 'AOA' | 'USD';
  saasPlanId?: string;               // 'ENTERPRISE' | 'PRO' | 'STARTER'
  saasPlanName?: string;
  saasStatus?: DisplaySaaSStatus;
  advertisingEligible: boolean;
  advertisingStatus?: DisplayAdvertisingStatus;
  eventName?: string;                // Para aluguer de eventos
  eventLocation?: string;
  publicAdvertisingProfile?: DisplayPublicAdvertisingProfile;
  contractNumber?: string;
  notes?: string;
}

export interface DisplayLocation {
  province: string;      // e.g. Luanda
  municipality: string;  // e.g. Talatona, Maianga, Kilamba, Viana, Mutamba, Belas, Cazenga
  venueName: string;     // e.g. Belas Shopping, Shopping Avennida, Aeroporto 4 de Fevereiro
  zone: string;          // e.g. Praça de Alimentação, Entrada Principal, Hall Executivo
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface DisplayNetworkInfo {
  type: 'ETHERNET' | 'WIFI_5G' | 'CELLULAR_4G';
  ipAddress: string;
  macAddress: string;
  signalStrength?: number; // 0 - 100%
  downloadSpeedMbps?: number;
}

export interface DisplayStorageInfo {
  totalGb: number;
  usedGb: number;
}

export interface Display {
  id: string;
  organizationId?: string; // SaaS Tenant Organization Ownership
  code: string;          // e.g. NX-TLT-001, NEX-DS-00027
  name: string;
  clientId?: string;
  clientName?: string;
  status: DisplayStatus;
  isPoweredOn?: boolean;  // Ligado/Desligado (true = ligado & alertas WhatsApp ativos, false = desligado & alertas suprimidos)
  is_powered_on?: boolean;
  location: DisplayLocation;
  deviceType: DeviceType;
  orientation: DisplayOrientation;
  resolution: string;    // e.g. 3840x2160 (4K UHD), 1920x1080 (Full HD)
  screenSizeInches: number;
  currentContent?: string;
  currentPlaylist?: string;
  activeCampaignCount: number;
  temperatureCelsius: number;
  lastHeartbeatAt: string; // ISO string or relative time reference
  lastSyncAt?: string;
  installedAt?: string;
  playerVersion?: string;
  androidVersion?: string;
  network?: DisplayNetworkInfo;
  storage?: DisplayStorageInfo;
  uptimePercentage: number;
  dailyRateKz: number;
  maxAdSlots?: number;
  totalAdSlots?: number;
  remainingAdSlots?: number;
  coverImageUrl?: string;
  estimatedDailyReach?: number;
  notes?: string;

  // Commercial Profile & Dimension
  commercialProfile?: DisplayCommercialProfile;

  // Convenient Top-level Commercial Accessors
  commercialStatus?: DisplayCommercialStatus;
  commercialModel?: DisplayCommercialModel;
  ownershipType?: DisplayOwnershipType;
  ownerOrganizationId?: string;
  customerOrganizationId?: string;
  advertisingEligible?: boolean;
}

export interface DisplayKPIs {
  total: number;
  online: number;
  offline: number;
  maintenance: number;
  warning: number;
  syncing?: number;

  // Commercial KPI dimensions
  nexoraOwned?: number;
  clientOwned?: number;
  partnerOwned?: number;
  inRental?: number;
  sold?: number;
  inSubscription?: number;
  inEventRental?: number;
  availableForAdvertising?: number;
  commercialActive?: number;
  commercialInventory?: number;
  commercialMaintenance?: number;
}

export interface Campaign {
  id: string;
  code: string;
  name: string;
  advertiserName: string;
  clientCategory: string; // e.g. Telecomunicações, Banca, Varejo, Seguros
  status: CampaignStatus;
  targetDisplaysCount: number;
  startDate: string;
  endDate: string;
  budgetKz: number;
  dailyImpressionsGoal: number;
  currentImpressions: number;
  completionPercentage: number;
}

export interface Client {
  id: string;
  name: string;
  tradeName: string;     // Razão Social
  nif: string;
  contactEmail: string;
  phone: string;
  city: string;
  assignedDisplaysCount: number;
  activeContractsCount: number;
  tier: 'ENTERPRISE' | 'PRO' | 'STARTER';
}

export interface AICreditBalance {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  monthlyAllocation: number;
  renewalDate: string;
}

export interface SystemActivity {
  id: string;
  timestamp: string;
  type: 'DISPLAY_CONNECTED' | 'DISPLAY_DISCONNECTED' | 'CAMPAIGN_APPROVED' | 'CONTENT_SYNCED' | 'CREDIT_USED' | 'ALERT';
  title: string;
  description: string;
  severity: 'info' | 'success' | 'warning' | 'danger';
  actor: string;
  targetLocation?: string;
}

export interface DashboardKPIs {
  totalDisplays: number;
  onlineDisplays: number;
  offlineDisplays: number;
  activeCampaigns: number;
  totalMonthlyRevenueKz: number;
  estimatedDailyImpressions: number;
  networkOccupancyRate: number;
  aiCreditsRemaining: number;
}

/* ==========================================================================
   CONTENT / MEDIA LIBRARY DOMAIN TYPES
   ========================================================================== */

export type ContentMediaType = 'IMAGE' | 'VIDEO' | 'PDF' | 'WEB' | 'HTML' | 'WIDGET';

export type ContentStatus =
  | 'DRAFT'
  | 'PROCESSING'
  | 'READY'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'ARCHIVED'
  | 'ERROR';

export type ContentOrientation = 'LANDSCAPE' | 'PORTRAIT' | 'SQUARE';

export interface ContentCreator {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface ContentAssociatedDisplay {
  id: string;
  code: string;
  name: string;
  venueName: string;
  municipality: string;
}

export interface ContentAssociatedPlaylist {
  id: string;
  name: string;
  activeSlotCount: number;
}

export interface ContentAssociatedCampaign {
  id: string;
  name: string;
  advertiserName: string;
}

export interface ContentUsage {
  playlistCount: number;
  displayCount: number;
  campaignCount: number;
  associatedDisplays?: ContentAssociatedDisplay[];
  associatedPlaylists?: ContentAssociatedPlaylist[];
  associatedCampaigns?: ContentAssociatedCampaign[];
}

export interface ContentTechnicalMetadata {
  codec?: string;
  bitrateKbps?: number;
  frameRate?: number;
  fps?: number;
  colorSpace?: string;
  checksum?: string;
  audioChannels?: number;
  pageCount?: number;
  androidCompatibility?: {
    compatible: boolean;
    notes?: string;
  };
}

export interface ContentFolder {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
  color?: string;
}

export interface ContentItem {
  id: string;
  organizationId?: string; // SaaS Tenant Organization Ownership
  code: string; // e.g. "NEX-CNT-0001"
  name: string;
  description?: string;
  type: ContentMediaType;
  status: ContentStatus;
  thumbnailUrl?: string;
  thumbnailGradient?: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number; // in bytes
  duration?: number; // in seconds (for videos)
  width: number;
  height: number;
  aspectRatio: string;
  orientation: ContentOrientation;
  resolution: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: ContentCreator;
  tags: string[];
  folderId?: string;
  folderName?: string;
  usage: ContentUsage;
  metadata: ContentTechnicalMetadata;
}

export interface ContentKPIs {
  total: number;
  videos: number;
  images: number;
  documents: number;
  processing: number;
  ready: number;
  active: number;
  archived: number;
  totalStorageBytes: number;
}

/* ==========================================================================
   PLAYLIST DOMAIN TYPES
   ========================================================================== */

export type PlaylistStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'SCHEDULED'
  | 'ARCHIVED';

export type PlaylistItemTransition = 'NONE' | 'FADE' | 'SLIDE_LEFT' | 'SLIDE_RIGHT' | 'ZOOM';

export interface PlaylistItem {
  id: string;
  playlistId?: string;
  contentId: string;
  position: number; // 1-based index (1, 2, 3...)
  duration: number; // in seconds
  enabled: boolean;
  transition: PlaylistItemTransition;
  repeatCount: number; // default 1
  fitMode?: 'COVER' | 'CONTAIN' | 'STRETCH';
  // Resolved content item for fast rendering in UI without extra joins
  content?: ContentItem;
}

export interface PlaylistAssociatedDisplay {
  id: string;
  code: string;
  name: string;
  venueName: string;
  municipality: string;
  status: DisplayStatus;
}

export interface Playlist {
  id: string;
  organizationId?: string; // SaaS Tenant Organization Ownership
  code: string; // e.g. "NEX-PLY-0001"
  name: string;
  description: string;
  status: PlaylistStatus;
  items: PlaylistItem[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: ContentCreator;
  totalDuration: number; // calculated total duration in seconds of enabled items
  itemCount: number;
  displayCount: number;
  tags: string[];
  thumbnailUrl?: string;
  thumbnailGradient?: string;
  associatedDisplays?: PlaylistAssociatedDisplay[];
  displayId?: string;
  isSystemLocked?: boolean;
  metadata?: {
    orientation?: ContentOrientation | 'MIXED';
    resolution?: string;
    aspectRatio?: string;
    notes?: string;
  };
}

export interface PlaylistKPIs {
  total: number;
  active: number;
  paused: number;
  scheduled: number;
  draft: number;
  archived: number;
  totalDurationSeconds: number;
  associatedDisplaysTotal: number;
}

/* ==========================================================================
   SCHEDULING / PROGRAMAÇÃO DOMAIN TYPES
   ========================================================================== */

export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type ScheduleStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'EXPIRED'
  | 'SCHEDULED'
  | 'CONFLICT';

export type SchedulePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type ScheduleRecurrence = 'ONCE' | 'DAILY' | 'WEEKLY' | 'CUSTOM';

export interface ScheduleConflict {
  conflictingScheduleId: string;
  conflictingScheduleCode: string;
  conflictingScheduleName: string;
  conflictingSchedulePriority: SchedulePriority;
  overlappingDisplayIds: string[];
  overlappingDisplayNames?: string[];
  overlappingDays: DayOfWeek[];
  timeRangeA: string;
  timeRangeB: string;
  dateRangeA: string;
  dateRangeB: string;
  message: string;
}

export interface ConflictResult {
  hasConflict: boolean;
  conflicts: ScheduleConflict[];
}

export interface Schedule {
  id: string;
  organizationId?: string; // SaaS Tenant Organization Ownership
  code: string; // e.g. "NEX-SCH-0001"
  name: string;
  description?: string;
  playlistId: string;
  displayIds: string[];
  status: ScheduleStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "08:00")
  endTime: string;   // HH:mm (e.g. "18:00")
  daysOfWeek: DayOfWeek[];
  timezone: string;  // e.g. 'Africa/Luanda'
  priority: SchedulePriority;
  recurrence: ScheduleRecurrence;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  createdBy: ContentCreator;
  tags?: string[];
  // Optional cached/resolved fields for rendering
  playlistName?: string;
  displayCount?: number;
}

export interface ScheduleKPIs {
  total: number;
  active: number;
  scheduled: number;
  paused: number;
  expired: number;
  draft?: number;
  conflicts: number;
  programmedDisplaysCount?: number;
  targetedDisplaysTotal?: number;
}

/* ==========================================================================
   ALERTS / OPERATIONAL NOTIFICATIONS DOMAIN TYPES
   ========================================================================== */

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertCategory =
  | 'HARDWARE'
  | 'CONNECTIVITY'
  | 'CONTENT'
  | 'SCHEDULE'
  | 'CONTRACT'
  | 'SECURITY';

export interface SystemAlert {
  id: string;
  organizationId: string; // SaaS Tenant Isolation
  displayId?: string;
  displayCode?: string;
  displayName?: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  timestamp: string; // e.g. "Há 18 minutos" or ISO date
  timeAgo: string;
  location?: string;
  actionRequired?: string;
  resolved?: boolean;
}

/* ==========================================================================
   ADVERTISING & MEDIA OPPORTUNITIES DOMAIN TYPES
   ========================================================================== */

export interface MediaOpportunity {
  id: string;
  displayId: string;
  displayCode: string;
  name: string;
  location: string;
  municipality: string;
  orientation: DisplayOrientation;
  deviceType: string;
  resolution: string;
  screenSizeInches: number;
  dailyRateKz: number;
  estimatedDailyAudience: number;
  availability: 'AVAILABLE' | 'HIGH_DEMAND' | 'LIMITED_SLOTS';
  tags: string[];
}

export interface AdvertiserMetrics {
  activeCampaignsCount: number;
  scheduledCampaignsCount: number;
  adsInProductionCount: number;
  availableDisplaysCount: number;
  aiCreditsRemaining: number;
  monthlyInvestmentKz: number;
  estimatedImpressions: number;
  estimatedPlays: number;
  displaysImpacted: number;
  estimatedAudienceReach: number;
}

/* ==========================================================================
   CLIENT CONTRACTS & SUBSCRIPTIONS DOMAIN TYPES
   ========================================================================== */

export interface ClientContract {
  id: string;
  organizationId: string;
  contractNumber: string; // e.g. "CTR-NX-2025-084"
  planName: string;       // e.g. "Nexora Pro", "Nexora Enterprise"
  status: 'ACTIVE' | 'PENDING_RENEWAL' | 'DRAFT' | 'EXPIRED';
  monthlyValueKz: number;
  startDate: string;
  endDate: string;
  displaysAllocated: number;
  slaUptime: string;      // e.g. "99.8%"
  nextBillingDate: string;
  featuresIncluded?: string[];
}

/* ==========================================================================
   FIELD MAINTENANCE & HARDWARE OPERATIONS DOMAIN TYPES
   ========================================================================== */

export type MaintenanceStatus = 'SCHEDULED' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export type MaintenancePriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface FieldMaintenance {
  id: string;
  organizationId: string;
  displayId: string;
  displayCode: string;
  displayName: string;
  location: string;
  issueDescription: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  scheduledDate: string;
  technicianName?: string;
  estimatedTime?: string;
  temperatureCelsius?: number;
  durationMinutes?: number;
}

/* ==========================================================================
   LUANDA REGIONAL DISTRIBUTION DOMAIN TYPES
   ========================================================================== */

export interface LuandaZoneSummary {
  zone: string;
  municipality: string;
  totalDisplays: number;
  onlineDisplays: number;
  offlineDisplays: number;
  occupancyRate: number;
  status: 'OPTIMAL' | 'WARNING' | 'ALERT';
}



