export interface AffiliateSettings {
  client_saas_commission_pct: number;
  advertiser_campaign_commission_pct: number;
  display_owner_commission_pct: number;
  display_ad_revshare_commission_pct: number;
  minimum_payout_amount_kz: number;
}

export type AffiliateStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

export interface Affiliate {
  id: string;
  userId?: string;
  organizationId?: string;
  name: string;
  email: string;
  phone?: string;
  referralCode: string;
  status: AffiliateStatus;
  customClientSaasPct?: number | null;
  customAdvertiserCampaignPct?: number | null;
  customDisplayOwnerPct?: number | null;
  totalEarnedKz: number;
  totalPaidKz: number;
  pendingBalanceKz: number;
  bankName?: string;
  accountHolder?: string;
  iban?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ReferralType = 'CLIENT' | 'ADVERTISER' | 'DISPLAY_OWNER';

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  referredOrganizationId: string;
  referredName: string;
  referredType: ReferralType;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  totalRevenueGeneratedKz: number;
  totalCommissionsEarnedKz: number;
  firstConversionAt?: string;
  createdAt: string;
}

export type CommissionSourceType = 'SAAS_PLAN' | 'CAMPAIGN' | 'DISPLAY_PLAN' | 'DISPLAY_AD_SALE';

export interface AffiliateCommission {
  id: string;
  affiliateId: string;
  referralId?: string;
  referredName?: string;
  sourceType: CommissionSourceType;
  sourceId?: string;
  sourceDescription: string;
  paymentAmountKz: number;
  commissionRate: number;
  commissionAmountKz: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED';
  approvedAt?: string;
  paidAt?: string;
  createdAt: string;
}

export interface AffiliatePayoutRequest {
  id: string;
  affiliateId: string;
  affiliateName?: string;
  amountKz: number;
  bankName: string;
  accountHolder: string;
  iban: string;
  receiptUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  notes?: string;
  reviewedBy?: string;
  paidAt?: string;
  createdAt: string;
}

export interface RevenueHistoryItem {
  month: string;
  revenueKz: number;
  commissionKz: number;
}

export interface PayoutCycleInfo {
  isCycleOpen: boolean;
  currentCycleName: string;
  nextCycleDate: string;
  daysUntilNextCycle: number;
}

export interface AffiliateDashboardKpi {
  totalEarnedKz: number;
  pendingBalanceKz: number;
  totalPaidKz: number;
  totalRevenueGeneratedKz?: number;
  totalReferralsCount: number;
  activeClientsCount: number;
  activeAdvertisersCount: number;
  activeDisplaysCount: number;
  monthlyRevenueKz: number;
  revenueHistory?: RevenueHistoryItem[];
  payoutCycle?: PayoutCycleInfo;
  recentCommissions: AffiliateCommission[];
  referrals: AffiliateReferral[];
}
