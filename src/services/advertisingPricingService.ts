import {
  AdvertisingOpportunity,
  CampaignBooking,
  PricingCalculationResult
} from '../types/advertising';

export interface PricingCalculationParams {
  opportunity: AdvertisingOpportunity;
  startDate: string;
  endDate: string;
  spotDuration?: number; // 10, 15, or 30 seconds
  mediaFormat?: 'IMAGE' | 'VIDEO';
  existingPlaylistDuration?: number; // seconds (default 120s)
  dailyFrequency?: number; // insertions per hour
  customDiscountPercentage?: number;
}

export class AdvertisingPricingService {
  /**
   * Calculates duration in days between two YYYY-MM-DD dates (inclusive)
   */
  calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
  }

  /**
   * Automatic volume discount based on duration (days)
   */
  getDurationDiscountPercentage(days: number): number {
    if (days >= 90) return 20; // 20% discount for quarterly
    if (days >= 30) return 15; // 15% discount for monthly
    if (days >= 14) return 10; // 10% discount for 2 weeks
    if (days >= 7) return 5;   // 5% discount for 1 week
    return 0;
  }

  /**
   * Get duration and media format multiplier
   */
  getFormatDurationMultiplier(spotDuration: number = 15, mediaFormat: 'IMAGE' | 'VIDEO' = 'IMAGE'): number {
    let durationMult = 1.0;
    if (spotDuration <= 10) durationMult = 0.75;
    else if (spotDuration >= 30) durationMult = 1.8;
    else durationMult = 1.0; // 15s base

    const formatMult = mediaFormat === 'VIDEO' ? 1.25 : 1.0;
    return durationMult * formatMult;
  }

  /**
   * Calculate precise commercial pricing quote for an opportunity and period
   */
  calculateBookingPrice(params: PricingCalculationParams): PricingCalculationResult {
    const {
      opportunity,
      startDate,
      endDate,
      spotDuration = 15,
      mediaFormat = 'IMAGE',
      existingPlaylistDuration = 120,
      customDiscountPercentage
    } = params;

    const days = this.calculateDays(startDate, endDate);
    const baseDailyPrice = opportunity.basePrice;

    // Apply format & spot duration multiplier
    const formatMult = this.getFormatDurationMultiplier(spotDuration, mediaFormat);
    const subtotal = baseDailyPrice * days * formatMult;

    // Determine discount percentage
    const durationDiscount = this.getDurationDiscountPercentage(days);
    const discountPercentage = customDiscountPercentage !== undefined ? customDiscountPercentage : durationDiscount;
    const discountAmount = Math.round(subtotal * (discountPercentage / 100));
    const totalPrice = Math.max(0, subtotal - discountAmount);

    // 13 Hours Daily Operation Math (46,800 seconds per day)
    const operationalSecondsPerDay = 13 * 3600; // 46,800s
    const totalLoopDuration = existingPlaylistDuration + spotDuration;
    
    // Daily loops & hourly frequency based on actual playlist length
    const dailyPlays = Math.floor(operationalSecondsPerDay / totalLoopDuration);
    const hourlyFrequency = Math.floor(3600 / totalLoopDuration);
    const estimatedPlays = dailyPlays * days;

    // Impressions calculation based on display daily reach and operational ratio
    const reachPerPlay = (opportunity.estimatedDailyReach || 10000) / Math.max(1, dailyPlays);
    const estimatedImpressions = Math.round(estimatedPlays * reachPerPlay);

    // CPM = (Total Price / Estimated Impressions) * 1000
    const estimatedCPM = estimatedImpressions > 0
      ? Math.round((totalPrice / estimatedImpressions) * 1000)
      : 0;

    // Space owner revenue share (80% space owner, 20% Nexora commission)
    const spaceOwnerRevenue = Math.round(totalPrice * 0.8);
    const nexoraCommission = totalPrice - spaceOwnerRevenue;

    return {
      days,
      baseDailyPrice,
      subtotal: Math.round(subtotal),
      discountPercentage,
      discountAmount,
      totalPrice: Math.round(totalPrice),
      currency: opportunity.currency || 'AOA',
      estimatedImpressions,
      estimatedPlays,
      estimatedCPM,
      estimatedReach: Math.floor(estimatedImpressions * 0.4),
      spaceOwnerRevenue,
      nexoraCommission,
    };
  }

  /**
   * Calculate aggregate multi-screen campaign quote
   */
  calculateCampaignQuote(
    opportunities: AdvertisingOpportunity[],
    startDate: string,
    endDate: string,
    spotDuration: number = 15,
    mediaFormat: 'IMAGE' | 'VIDEO' = 'IMAGE',
    existingPlaylistDuration: number = 120
  ): {
    totalPrice: number;
    subtotal: number;
    totalDiscount: number;
    currency: string;
    totalEstimatedImpressions: number;
    totalEstimatedPlays: number;
    totalReach: number;
    screenCount: number;
    days: number;
    hourlyFrequency: number;
    dailyPlaysPerScreen: number;
    breakdown: Array<{
      opportunity: AdvertisingOpportunity;
      quote: PricingCalculationResult;
    }>;
  } {
    const days = this.calculateDays(startDate, endDate);
    let totalPrice = 0;
    let subtotal = 0;
    let totalDiscount = 0;
    let totalEstimatedImpressions = 0;
    let totalEstimatedPlays = 0;
    let totalReach = 0;

    const totalLoopDuration = existingPlaylistDuration + spotDuration;
    const dailyPlaysPerScreen = Math.floor((13 * 3600) / totalLoopDuration);
    const hourlyFrequency = Math.floor(3600 / totalLoopDuration);

    const breakdown = opportunities.map((opp) => {
      const quote = this.calculateBookingPrice({
        opportunity: opp,
        startDate,
        endDate,
        spotDuration,
        mediaFormat,
        existingPlaylistDuration,
      });

      totalPrice += quote.totalPrice;
      subtotal += quote.subtotal;
      totalDiscount += quote.discountAmount;
      totalEstimatedImpressions += quote.estimatedImpressions;
      totalEstimatedPlays += quote.estimatedPlays;
      totalReach += opp.estimatedDailyReach;

      return {
        opportunity: opp,
        quote,
      };
    });

    return {
      totalPrice,
      subtotal,
      totalDiscount,
      currency: opportunities[0]?.currency || 'AOA',
      totalEstimatedImpressions,
      totalEstimatedPlays,
      totalReach,
      screenCount: opportunities.length,
      days,
      hourlyFrequency,
      dailyPlaysPerScreen,
      breakdown,
    };
  }

  /**
   * Format Kz currency display
   */
  formatCurrency(value: number, currency: string = 'AOA'): string {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: currency === 'AOA' ? 'AOA' : currency,
      maximumFractionDigits: 0,
    }).format(value).replace('AOA', 'Kz');
  }
}

export const advertisingPricingService = new AdvertisingPricingService();
