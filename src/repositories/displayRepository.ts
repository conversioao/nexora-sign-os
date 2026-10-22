import {
  IDisplayRepository,
  DisplayFilters,
  RentDisplayParams,
  SellDisplayParams,
  EventRentalParams,
} from './types';
import {
  Display,
  DisplayKPIs,
  DisplayStatus,
  DisplayCommercialEvent,
  DisplayCommercialModel,
  DisplayAdvertisingStatus,
} from '../types/domain';
import { mockDisplays, mockCommercialEvents } from '../data/mockData';

// Map displays to specific mock organizations for SaaS isolation
const ORG_DISPLAY_MAP: Record<string, string[]> = {
  'org-talatona': ['dsp-01', 'dsp-02', 'dsp-04', 'dsp-06', 'dsp-08', 'dsp-11'],
  'org-shopping': ['dsp-02', 'dsp-05', 'dsp-07', 'dsp-09'],
  'org-publicidade': ['dsp-03', 'dsp-10'],
  'org-techpartner': ['dsp-01', 'dsp-02', 'dsp-03', 'dsp-04', 'dsp-05', 'dsp-06', 'dsp-07', 'dsp-08', 'dsp-09', 'dsp-10', 'dsp-11', 'dsp-12'],
};

export class MockDisplayRepository implements IDisplayRepository {
  private displays: Display[] = mockDisplays.map((d, index) => ({
    ...d,
    organizationId:
      index % 3 === 0
        ? 'org-talatona'
        : index % 3 === 1
        ? 'org-shopping'
        : 'org-nexora',
  }));

  private events: Record<string, DisplayCommercialEvent[]> = { ...mockCommercialEvents };

  async getAll(filters?: DisplayFilters): Promise<Display[]> {
    try {
      const url = (filters?.organizationId && filters.organizationId !== 'org-nexora')
        ? `/api/displays?organizationId=${encodeURIComponent(filters.organizationId)}`
        : '/api/displays';
      const response = await fetch(url);
      if (response.ok) {
        const dbDisplays = await response.json();
        let list = dbDisplays.map((d: any) => ({
          id: d.id,
          name: d.name,
          deviceType: d.type as any,
          status: d.status as any,
          location: {
            province: 'Luanda',
            municipality: 'Talatona',
            venueName: d.location,
            zone: 'Geral',
            address: d.location,
          },
          currentContent: d.current_content || undefined,
          currentMediaUrl: d.current_media_url || undefined,
          currentPlaylist: d.current_playlist_id || undefined,
          currentPlaylistId: d.current_playlist_id || undefined,
          lastSyncAt: d.last_sync_at ? new Date(d.last_sync_at).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' }) : undefined,
          organizationId: d.organization_id,
          partnerId: d.partner_id,
          code: d.device_code || `NX-${d.id.substring(0, 5).toUpperCase()}`,
          orientation: d.orientation || 'LANDSCAPE',
          resolution: d.resolution || '1920x1080',
          ipAddress: d.ip_address || (d.specs && d.specs.ip) || '192.168.100.162',
          screenSizeInches: 55,
          activeCampaignCount: 0,
          specs: d.specs || {},
          temperatureCelsius: (d.specs && d.specs.temperature) || 38,
          lastHeartbeatAt: d.last_heartbeat_at || new Date().toISOString(),
          uptimePercentage: 99.9,
          dailyRateKz: 5000,
        }));

        if (filters?.status && filters.status !== 'ALL') {
          list = list.filter((d: any) => d.status === filters.status);
        }
        if (filters?.organizationId && filters.organizationId !== 'org-nexora') {
          list = list.filter((d: any) => d.organizationId === filters.organizationId || d.partnerId === filters.organizationId);
        }
        if (filters?.search && filters.search.trim()) {
          const q = filters.search.toLowerCase();
          list = list.filter((d: any) => d.name.toLowerCase().includes(q) || d.location.venueName.toLowerCase().includes(q));
        }
        return list;
      }
    } catch (e) {
      console.warn('API error fetching displays, returning empty list', e);
    }
    return [];
  }

  async getById(id: string): Promise<Display | null> {
    try {
      const all = await this.getAll();
      const found = all.find((d) => d.id === id || d.code.toLowerCase() === id.toLowerCase());
      if (found) return found;
    } catch (e) {}

    return null;
  }

  async getByStatus(status: DisplayStatus): Promise<Display[]> {
    await new Promise((resolve) => setTimeout(resolve, 40));
    return this.displays.filter((d) => d.status === status);
  }

  async getKPIs(organizationId?: string): Promise<DisplayKPIs> {
    let currentDisplays = await this.getAll();

    if (organizationId && organizationId !== 'org-nexora') {
      currentDisplays = currentDisplays.filter((d) => d.organizationId === organizationId);
    }

    const total = currentDisplays.length;
    const online = currentDisplays.filter((d) => d.status === 'ONLINE' || d.status === 'PLAYING').length;
    const offline = currentDisplays.filter((d) => d.status === 'OFFLINE').length;
    const maintenance = currentDisplays.filter((d) => d.status === 'MAINTENANCE').length;
    const warning = currentDisplays.filter((d) => d.status === 'WARNING').length;
    const syncing = currentDisplays.filter((d) => d.status === 'SYNCING').length;

    // Commercial metrics
    const rentedDisplaysCount = currentDisplays.filter(
      (d) => (d.commercialProfile?.commercialModel || d.commercialModel) === 'RENTAL'
    ).length;
    const soldDisplaysCount = currentDisplays.filter(
      (d) => (d.commercialProfile?.commercialModel || d.commercialModel) === 'SALE'
    ).length;
    const inventoryDisplaysCount = currentDisplays.filter(
      (d) => (d.commercialProfile?.commercialStatus || d.commercialStatus) === 'INVENTORY'
    ).length;
    const reservedDisplaysCount = currentDisplays.filter(
      (d) => (d.commercialProfile?.commercialStatus || d.commercialStatus) === 'RESERVED'
    ).length;
    const advertisingEligibleCount = currentDisplays.filter((d) =>
      d.commercialProfile ? d.commercialProfile.advertisingEligible : d.advertisingEligible ?? true
    ).length;

    const totalMonthlyRentalRevenueKz = currentDisplays.reduce((acc, d) => {
      const fee = d.commercialProfile?.monthlyFeeKz || 0;
      return acc + fee;
    }, 0);

    return {
      total,
      online,
      offline,
      maintenance,
      warning,
      syncing,
      inRental: rentedDisplaysCount,
      sold: soldDisplaysCount,
      commercialInventory: inventoryDisplaysCount,
      availableForAdvertising: advertisingEligibleCount,
      commercialActive: rentedDisplaysCount + soldDisplaysCount,
    };
  }

  async create(displayData: Partial<Display>): Promise<Display> {
    const newId = displayData.id || `dsp-${Date.now()}`;
    const locationString = typeof displayData.location === 'object' && displayData.location
      ? `${displayData.location.province || 'Luanda'}, ${displayData.location.municipality || 'Talatona'} - ${displayData.location.venueName || 'EdifÃ­cio'}`
      : String(displayData.location || 'Luanda, Talatona');

    const formattedData = {
      id: newId,
      name: displayData.name || 'Novo Display',
      type: displayData.deviceType || 'TOTEM',
      status: displayData.status || 'OFFLINE',
      location: locationString,
      current_playlist_id: displayData.currentPlaylist || null,
      organization_id: displayData.organizationId || 'org-talatona',
    };

    try {
      const response = await fetch('/api/displays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });
      if (response.ok) {
        const d = await response.json();
        return {
          ...displayData,
          id: d.id,
          name: d.name,
          deviceType: d.type as any,
          status: d.status as any,
          location: {
            province: 'Luanda',
            municipality: 'Talatona',
            venueName: d.location,
            zone: 'Geral',
            address: d.location,
          },
          currentPlaylist: d.current_playlist_id || undefined,
          organizationId: d.organization_id,
          code: `NX-${d.id.substring(0, 5).toUpperCase()}`,
          orientation: 'LANDSCAPE',
          resolution: '1920x1080',
          screenSizeInches: 55,
          activeCampaignCount: 0,
          temperatureCelsius: 38,
          lastHeartbeatAt: new Date().toISOString(),
          uptimePercentage: 99.9,
          dailyRateKz: 5000,
        } as Display;
      }
    } catch (e) {
      console.warn('API error during creation, falling back to mock display creation', e);
    }

    await new Promise((resolve) => setTimeout(resolve, 80));
    const count = this.displays.length + 1;
    const padded = String(count).padStart(5, '0');
    const newCode = displayData.code || `NEX-DS-${padded}`;

    const newDisplay: Display = {
      id: `dsp-${Date.now()}`,
      organizationId: displayData.organizationId || 'org-talatona',
      code: newCode,
      name: displayData.name || `Display ${newCode}`,
      clientId: displayData.clientId || 'clt-01',
      clientName: displayData.clientName || 'Cliente Nexora',
      status: displayData.status || 'ONLINE',
      location: displayData.location || {
        province: 'Luanda',
        municipality: 'Talatona',
        venueName: 'EdifÃ­cio Comercial',
        zone: 'Entrada Principal',
        address: 'Av. Principal, Luanda',
      },
      deviceType: displayData.deviceType || 'ANDROID_TV',
      orientation: displayData.orientation || 'LANDSCAPE',
      resolution: displayData.resolution || '3840x2160 (4K UHD)',
      screenSizeInches: displayData.screenSizeInches || 65,
      activeCampaignCount: 0,
      temperatureCelsius: 38.5,
      lastHeartbeatAt: new Date().toISOString(),
      lastSyncAt: 'Agora mesmo',
      installedAt: '26/08/2026',
      uptimePercentage: 100.0,
      dailyRateKz: displayData.dailyRateKz || 35000,
      storage: { totalGb: 32, usedGb: 6.4 },
      network: { type: 'ETHERNET', ipAddress: '192.168.1.100', macAddress: '00:1A:79:B4:C2:88', downloadSpeedMbps: 50 },
      commercialStatus: displayData.commercialStatus || 'INVENTORY',
      commercialModel: displayData.commercialModel || 'RENTAL',
      ownershipType: displayData.ownershipType || 'NEXORA_OWNED',
      advertisingEligible: displayData.advertisingEligible ?? true,
      commercialProfile: displayData.commercialProfile || {
        commercialModel: displayData.commercialModel || 'RENTAL',
        ownershipType: displayData.ownershipType || 'NEXORA_OWNED',
        ownerOrganizationId: 'org-nexora',
        ownerOrganizationName: 'Nexora Network Luanda',
        commercialStatus: displayData.commercialStatus || 'INVENTORY',
        advertisingEligible: displayData.advertisingEligible ?? true,
        advertisingStatus: 'AVAILABLE',
        currency: 'AOA',
      },
    };

    this.displays.unshift(newDisplay);

    await this.logCommercialEvent({
      displayId: newDisplay.id,
      type: 'DISPLAY_REGISTERED',
      actorName: 'Administrador Nexora',
      organizationName: newDisplay.clientName,
      description: `Display ${newDisplay.name} (${newDisplay.code}) registrado no inventÃ¡rio comercial.`,
    });

    return { ...newDisplay };
  }

  async update(id: string, data: Partial<Display>): Promise<Display> {
    await new Promise((resolve) => setTimeout(resolve, 80));
    const index = this.displays.findIndex((d) => d.id === id);
    if (index === -1) {
      throw new Error(`Display ${id} nÃ£o encontrado`);
    }

    this.displays[index] = {
      ...this.displays[index],
      ...data,
      lastSyncAt: 'Agora mesmo',
    };

    return { ...this.displays[index] };
  }

  async delete(id: string): Promise<{ success: boolean }> {
    try {
      const res = await fetch(`/api/displays/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return { success: true };
      }
      const err = await res.json().catch(() => ({ error: 'Erro ao eliminar display' }));
      throw new Error(err.error || 'Falha ao eliminar display');
    } catch (e: any) {
      throw new Error(e?.message || 'Erro de rede ao eliminar display');
    }
  }

  async sync(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/displays/${id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SYNC_PLAYLIST', payload: {} })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API error syncing display', e);
    }
    return { success: true, message: 'Comando de sincronização pendente' };
  }

  async restartPlayer(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`/api/displays/${id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'RESTART', payload: {} })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API error restarting display', e);
    }
    return { success: true, message: 'Comando de reinicialização pendente' };
  }

  // Commercial Operations Implementation
  async rentDisplay(displayId: string, params: RentDisplayParams): Promise<Display> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const display = this.displays.find((d) => d.id === displayId);
    if (!display) throw new Error(`Display ${displayId} nÃ£o encontrado.`);

    const profile = display.commercialProfile || {
      commercialModel: 'RENTAL' as const,
      ownershipType: 'NEXORA_OWNED' as const,
      ownerOrganizationId: 'org-nexora',
      ownerOrganizationName: 'Nexora Network Luanda',
      currency: 'AOA' as const,
      commercialStatus: 'INVENTORY' as const,
      advertisingEligible: true,
    };

    display.commercialStatus = 'ACTIVE';
    display.commercialModel = 'RENTAL';
    display.customerOrganizationId = params.customerOrganizationId;
    if (params.customerName) display.clientName = params.customerName;

    display.commercialProfile = {
      commercialModel: 'RENTAL',
      ownershipType: profile.ownershipType || 'NEXORA_OWNED',
      ownerOrganizationId: profile.ownerOrganizationId || 'org-nexora',
      ownerOrganizationName: profile.ownerOrganizationName || 'Nexora Network Luanda',
      currency: 'AOA',
      ...profile,
      commercialStatus: 'ACTIVE',
      customerOrganizationId: params.customerOrganizationId,
      customerOrganizationName: params.customerName || 'OrganizaÃ§Ã£o Cliente',
      tenantOrganizationId: params.customerOrganizationId,
      monthlyFeeKz: params.monthlyFeeKz,
      startDate: params.startDate,
      endDate: params.endDate,
      saasPlanId: params.saasPlanId || 'PRO',
      saasPlanName: params.saasPlanName || 'Nexora Signage Pro',
      saasStatus: 'ACTIVE',
      contractNumber: params.contractNumber || `CTR-${Date.now().toString().slice(-6)}`,
      advertisingEligible: params.advertisingEligible ?? true,
      advertisingStatus: params.advertisingEligible ? 'AVAILABLE' : 'NOT_AVAILABLE',
      notes: params.notes || (profile as any).notes,
    };

    await this.logCommercialEvent({
      displayId,
      type: 'RENTAL_STARTED',
      actorName: 'Gestor Comercial Nexora',
      organizationName: params.customerName || 'Cliente',
      description: `InÃ­cio de contrato de aluguer mensal para ${params.customerName || 'Cliente'} (${params.monthlyFeeKz.toLocaleString()} Kz/mÃªs).`,
      metadata: { contractNumber: display.commercialProfile.contractNumber, monthlyFee: params.monthlyFeeKz },
    });

    return { ...display };
  }

  async sellDisplay(displayId: string, params: SellDisplayParams): Promise<Display> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const display = this.displays.find((d) => d.id === displayId);
    if (!display) throw new Error(`Display ${displayId} nÃ£o encontrado.`);

    display.commercialStatus = 'ACTIVE';
    display.commercialModel = 'SALE';
    display.ownershipType = 'CLIENT_OWNED';
    display.ownerOrganizationId = params.customerOrganizationId;
    display.customerOrganizationId = params.customerOrganizationId;
    if (params.customerName) display.clientName = params.customerName;

    display.commercialProfile = {
      commercialModel: 'SALE',
      ownershipType: 'CLIENT_OWNED',
      ownerOrganizationId: params.customerOrganizationId,
      ownerOrganizationName: params.customerName || 'Cliente ProprietÃ¡rio',
      customerOrganizationId: params.customerOrganizationId,
      customerOrganizationName: params.customerName || 'Cliente ProprietÃ¡rio',
      tenantOrganizationId: params.customerOrganizationId,
      commercialStatus: 'ACTIVE',
      startDate: params.date || new Date().toLocaleDateString('pt-AO'),
      salePriceKz: params.salePriceKz,
      currency: 'AOA',
      saasPlanId: params.saasPlanId || 'ENTERPRISE',
      saasPlanName: params.saasPlanName || 'Nexora Signage Enterprise',
      saasStatus: 'ACTIVE',
      advertisingEligible: params.advertisingEligible ?? false,
      advertisingStatus: 'NOT_AVAILABLE',
      notes: params.notes,
    };

    await this.logCommercialEvent({
      displayId,
      type: 'SOLD',
      actorName: 'Diretor Comercial Nexora',
      organizationName: params.customerName || 'Cliente',
      description: `Hardware vendido para ${params.customerName || 'Cliente'} no valor de ${params.salePriceKz.toLocaleString()} Kz.`,
      metadata: { salePriceKz: params.salePriceKz },
    });

    return { ...display };
  }

  async rentForEvent(displayId: string, params: EventRentalParams): Promise<Display> {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const display = this.displays.find((d) => d.id === displayId);
    if (!display) throw new Error(`Display ${displayId} nÃ£o encontrado.`);

    display.commercialStatus = 'RESERVED';
    display.commercialModel = 'EVENT_RENTAL';

    display.commercialProfile = {
      commercialModel: 'EVENT_RENTAL',
      ownershipType: display.commercialProfile?.ownershipType || 'NEXORA_OWNED',
      ownerOrganizationId: display.commercialProfile?.ownerOrganizationId || 'org-nexora',
      ownerOrganizationName: display.commercialProfile?.ownerOrganizationName || 'Nexora Network Luanda',
      currency: 'AOA',
      ...display.commercialProfile,
      commercialStatus: 'RESERVED',
      customerOrganizationId: params.customerOrganizationId,
      customerOrganizationName: params.customerName || 'Organizador de Evento',
      tenantOrganizationId: params.customerOrganizationId,
      startDate: params.startDate,
      endDate: params.endDate,
      dailyRentalRateKz: params.dailyRentalRateKz,
      eventName: params.eventName,
      eventLocation: params.eventLocation,
      advertisingEligible: params.advertisingEligible ?? true,
      advertisingStatus: 'RESERVED',
      notes: params.notes,
    };

    await this.logCommercialEvent({
      displayId,
      type: 'ASSIGNED_TO_CUSTOMER',
      actorName: 'Equipe de Eventos',
      organizationName: params.customerName || params.eventName,
      description: `Reserva para evento "${params.eventName}" em ${params.eventLocation} (${params.dailyRentalRateKz.toLocaleString()} Kz/dia).`,
      metadata: { eventName: params.eventName, startDate: params.startDate, endDate: params.endDate },
    });

    return { ...display };
  }

  async assignCustomer(
    displayId: string,
    customerOrgIdOrData: string | any,
    customerName?: string,
    notes?: string
  ): Promise<Display> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const display = this.displays.find((d) => d.id === displayId);
    if (!display) throw new Error(`Display ${displayId} nÃ£o encontrado.`);

    const customerOrgId = typeof customerOrgIdOrData === 'object'
      ? (customerOrgIdOrData.customerOrganizationId || customerOrgIdOrData.customerOrgId || customerOrgIdOrData.organizationId)
      : customerOrgIdOrData;
    const finalCustomerName = typeof customerOrgIdOrData === 'object'
      ? (customerOrgIdOrData.customerName || customerOrgIdOrData.clientName || customerName)
      : customerName;
    const finalNotes = typeof customerOrgIdOrData === 'object'
      ? (customerOrgIdOrData.notes || notes)
      : notes;

    display.customerOrganizationId = customerOrgId;
    if (finalCustomerName) display.clientName = finalCustomerName;

    display.commercialProfile = {
      commercialModel: display.commercialProfile?.commercialModel || 'RENTAL',
      ownershipType: display.commercialProfile?.ownershipType || 'NEXORA_OWNED',
      ownerOrganizationId: display.commercialProfile?.ownerOrganizationId || 'org-nexora',
      ownerOrganizationName: display.commercialProfile?.ownerOrganizationName || 'Nexora Network Luanda',
      currency: 'AOA',
      advertisingEligible: display.commercialProfile?.advertisingEligible ?? true,
      ...display.commercialProfile,
      customerOrganizationId: customerOrgId,
      customerOrganizationName: finalCustomerName || 'Cliente Associado',
      tenantOrganizationId: customerOrgId,
      commercialStatus: 'ACTIVE',
      notes: finalNotes || display.commercialProfile?.notes,
    };

    await this.logCommercialEvent({
      displayId,
      type: 'ASSIGNED_TO_CUSTOMER',
      actorName: 'Operador Nexora',
      organizationName: finalCustomerName,
      description: `Display associado operacionalmente ao cliente ${finalCustomerName || customerOrgId}.`,
    });

    return { ...display };
  }

  async returnToInventory(displayId: string, notesOrData?: string | any): Promise<Display> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    const display = this.displays.find((d) => d.id === displayId);
    if (!display) throw new Error(`Display ${displayId} nÃ£o encontrado.`);

    const finalNotes = typeof notesOrData === 'object' ? (notesOrData.notes || 'Retornado ao estoque.') : notesOrData;
    const previousClient = display.commercialProfile?.customerOrganizationName || display.clientName;

    display.commercialStatus = 'INVENTORY';
    display.customerOrganizationId = undefined;
    display.clientName = 'InventÃ¡rio DisponÃ­vel';

    display.commercialProfile = {
      commercialModel: 'RENTAL',
      ownershipType: 'NEXORA_OWNED',
      ownerOrganizationId: 'org-nexora',
      ownerOrganizationName: 'Nexora Network Luanda',
      currency: 'AOA',
      advertisingEligible: true,
      ...display.commercialProfile,
      commercialStatus: 'INVENTORY',
      customerOrganizationId: undefined,
      customerOrganizationName: undefined,
      tenantOrganizationId: undefined,
      advertisingStatus: 'AVAILABLE',
      notes: finalNotes || 'Retornado ao estoque de inventÃ¡rio para nova alocaÃ§Ã£o.',
    };

    await this.logCommercialEvent({
      displayId,
      type: 'RETURNED',
      actorName: 'Equipe de LogÃ­stica',
      organizationName: 'Nexora Network',
      description: `Display retornado ao inventÃ¡rio (anteriormente alocado a ${previousClient}).`,
    });

    return { ...display };
  }

  async setAdvertisingEligibility(
    displayId: string,
    eligibleOrData: boolean | any,
    adStatus?: DisplayAdvertisingStatus
  ): Promise<Display> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const display = this.displays.find((d) => d.id === displayId);
    if (!display) throw new Error(`Display ${displayId} nÃ£o encontrado.`);

    const eligible = typeof eligibleOrData === 'object'
      ? (eligibleOrData.advertisingEligible ?? eligibleOrData.eligible ?? true)
      : Boolean(eligibleOrData);
    const calculatedAdStatus: DisplayAdvertisingStatus = typeof eligibleOrData === 'object'
      ? (eligibleOrData.advertisingStatus || (eligible ? 'AVAILABLE' : 'NOT_AVAILABLE'))
      : (adStatus || (eligible ? 'AVAILABLE' : 'NOT_AVAILABLE'));

    display.advertisingEligible = eligible;

    display.commercialProfile = {
      ...display.commercialProfile,
      commercialModel: display.commercialProfile?.commercialModel || 'RENTAL',
      ownershipType: display.commercialProfile?.ownershipType || 'NEXORA_OWNED',
      ownerOrganizationId: display.commercialProfile?.ownerOrganizationId || 'org-nexora',
      advertisingEligible: eligible,
      advertisingStatus: calculatedAdStatus,
    };

    await this.logCommercialEvent({
      displayId,
      type: eligible ? 'ADVERTISING_ENABLED' : 'ADVERTISING_DISABLED',
      actorName: 'Gestor de MÃ­dia',
      description: eligible
        ? 'Display ativado para veiculaÃ§Ã£o de campanhas de anÃºncios.'
        : 'Display bloqueado para publicidade (modo institucional exclusivo).',
    });

    return { ...display };
  }

  async bulkAssignCustomer(
    displayIds: string[],
    customerOrgId: string,
    customerName?: string
  ): Promise<{ success: boolean; count: number }> {
    for (const id of displayIds) {
      await this.assignCustomer(id, customerOrgId, customerName);
    }
    return { success: true, count: displayIds.length };
  }

  async bulkUpdateCommercialModel(
    displayIds: string[],
    commercialModel: DisplayCommercialModel
  ): Promise<{ success: boolean; count: number }> {
    for (const id of displayIds) {
      const d = this.displays.find((item) => item.id === id);
      if (d) {
        d.commercialModel = commercialModel;
        if (d.commercialProfile) {
          d.commercialProfile.commercialModel = commercialModel;
        }
      }
    }
    return { success: true, count: displayIds.length };
  }

  async bulkSetAdvertisingEligibility(
    displayIds: string[],
    eligible: boolean
  ): Promise<{ success: boolean; count: number }> {
    for (const id of displayIds) {
      await this.setAdvertisingEligibility(id, eligible);
    }
    return { success: true, count: displayIds.length };
  }

  async getCommercialHistory(displayId: string): Promise<DisplayCommercialEvent[]> {
    await new Promise((resolve) => setTimeout(resolve, 50));
    return this.events[displayId] || [];
  }

  async logCommercialEvent(
    event: Omit<DisplayCommercialEvent, 'id' | 'timestamp'>
  ): Promise<DisplayCommercialEvent> {
    const newEvent: DisplayCommercialEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toLocaleString('pt-AO'),
    };

    if (!this.events[event.displayId]) {
      this.events[event.displayId] = [];
    }
    this.events[event.displayId].unshift(newEvent);
    return newEvent;
  }
}

export const displayRepository = new MockDisplayRepository();


