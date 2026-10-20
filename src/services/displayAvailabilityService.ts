import {
  Display,
  DisplayCommercialStatus,
  DisplayOwnershipType,
  DisplayCommercialModel,
  DisplayAdvertisingStatus,
} from '../types/domain';

export interface AvailabilityResult {
  available: boolean;
  reason?: string;
}

/**
 * Display Availability & Eligibility Service
 * Evaluates commercial constraints, status transitions, and ad inventory eligibility.
 */
export class DisplayAvailabilityService {
  /**
   * Evaluates if a display is available for monthly rental contract.
   * Eligible if owned by Nexora (or partner) and in INVENTORY or RESERVED status.
   */
  isAvailableForRental(display: Display): AvailabilityResult {
    const profile = display.commercialProfile;
    const ownership = profile?.ownershipType || display.ownershipType || 'NEXORA_OWNED';
    const status = profile?.commercialStatus || display.commercialStatus || 'INVENTORY';

    if (ownership === 'CLIENT_OWNED') {
      return {
        available: false,
        reason: 'O equipamento é de propriedade do cliente (não elegível para aluguer).',
      };
    }

    if (status === 'RETIRED') {
      return {
        available: false,
        reason: 'O display está descontinuado / descomissionado.',
      };
    }

    if (status === 'ACTIVE' && profile?.customerOrganizationId) {
      return {
        available: false,
        reason: `Já está alugado para ${profile.customerOrganizationName || 'outro cliente'}.`,
      };
    }

    return { available: true };
  }

  /**
   * Evaluates if a display is available for direct purchase / sale to a customer.
   */
  isAvailableForSale(display: Display): AvailabilityResult {
    const profile = display.commercialProfile;
    const ownership = profile?.ownershipType || display.ownershipType || 'NEXORA_OWNED';
    const status = profile?.commercialStatus || display.commercialStatus || 'INVENTORY';

    if (ownership === 'CLIENT_OWNED') {
      return {
        available: false,
        reason: 'O hardware já foi vendido e pertence ao cliente.',
      };
    }

    if (status === 'RETIRED') {
      return {
        available: false,
        reason: 'O display está descontinuado do inventário.',
      };
    }

    return { available: true };
  }

  /**
   * Evaluates if a display can be allocated for a short-term temporary event.
   */
  isAvailableForEventRental(display: Display): AvailabilityResult {
    const profile = display.commercialProfile;
    const status = profile?.commercialStatus || display.commercialStatus || 'INVENTORY';
    const ownership = profile?.ownershipType || display.ownershipType || 'NEXORA_OWNED';

    if (ownership === 'CLIENT_OWNED') {
      return {
        available: false,
        reason: 'Hardware de cliente privado não pode ser alocado para eventos externos.',
      };
    }

    if (status === 'ACTIVE' && profile?.commercialModel === 'RENTAL') {
      return {
        available: false,
        reason: 'Display alocado em contrato de longo prazo.',
      };
    }

    return { available: true };
  }

  /**
   * Evaluates if a display is available for advertising inventory.
   * Must have advertisingEligible true and operational status ONLINE / PLAYING.
   */
  isAvailableForAdvertising(display: Display): AvailabilityResult {
    const profile = display.commercialProfile;
    const eligible = profile ? profile.advertisingEligible : display.advertisingEligible ?? true;
    const adStatus = profile?.advertisingStatus || 'AVAILABLE';

    if (!eligible) {
      return {
        available: false,
        reason: 'Display configurado como 100% privado / institucional (não monetizável).',
      };
    }

    if (display.status === 'OFFLINE' || display.status === 'MAINTENANCE') {
      return {
        available: false,
        reason: `Display indisponível operacionalmente (${display.status}).`,
      };
    }

    if (adStatus === 'NOT_AVAILABLE') {
      return {
        available: false,
        reason: 'Grade de anúncios desativada comercialmente.',
      };
    }

    return { available: true };
  }

  /**
   * Checks if display can be assigned or transferred to a customer organization.
   */
  isAvailableForAssignment(display: Display): AvailabilityResult {
    const profile = display.commercialProfile;
    const status = profile?.commercialStatus || display.commercialStatus || 'INVENTORY';

    if (status === 'RETIRED') {
      return { available: false, reason: 'Display descomissionado.' };
    }

    return { available: true };
  }
}

export const displayAvailabilityService = new DisplayAvailabilityService();
