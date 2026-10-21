import { useState, useEffect, useMemo, useCallback } from 'react';
import { NexoraService } from '../../../services';
import {
  Display,
  DisplayKPIs,
  DisplayCommercialModel,
  DisplayOwnershipType,
  DisplayCommercialStatus,
  DisplayAdvertisingStatus,
} from '../../../types/domain';
import {
  RentDisplayParams,
  SellDisplayParams,
  EventRentalParams,
} from '../../../repositories/types';
import { useToast } from '../../../components/ui/Toast';
import { useSession } from '../../../context/SessionContext';

export type DisplaySortField = 'name' | 'status' | 'location' | 'heartbeat' | 'commercialModel' | 'monthlyFee';
export type SortDirection = 'asc' | 'desc';

export interface DisplayFiltersState {
  search: string;
  status: string;
  municipality: string;
  orientation: string;
  deviceType: string;
  commercialStatus: DisplayCommercialStatus | 'ALL';
  commercialModel: DisplayCommercialModel | 'ALL';
  ownershipType: DisplayOwnershipType | 'ALL';
  advertisingStatus: DisplayAdvertisingStatus | 'ALL';
  advertisingEligible: string; // 'ALL' | 'true' | 'false'
}

export function useDisplays(initialPageSize: number = 8) {
  const { showToast } = useToast();
  const { currentOrganization } = useSession();
  const [rawData, setRawData] = useState<Display[]>([]);
  const [kpis, setKpis] = useState<DisplayKPIs>({
    total: 0,
    online: 0,
    offline: 0,
    maintenance: 0,
    warning: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [filters, setFilters] = useState<DisplayFiltersState>({
    search: '',
    status: 'ALL',
    municipality: 'ALL',
    orientation: 'ALL',
    deviceType: 'ALL',
    commercialStatus: 'ALL',
    commercialModel: 'ALL',
    ownershipType: 'ALL',
    advertisingStatus: 'ALL',
    advertisingEligible: 'ALL',
  });

  // Sort States
  const [sortField, setSortField] = useState<DisplaySortField>('heartbeat');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Fetch from service with multi-tenant isolation
  const fetchData = useCallback(async (showLoadingSpinner: boolean = true) => {
    if (showLoadingSpinner) setLoading(true);
    setError(null);
    try {
      const orgId = currentOrganization?.id;
      const [displaysResult, kpisResult] = await Promise.all([
        NexoraService.displays.getAll({ organizationId: orgId }),
        NexoraService.displays.getKPIs(orgId),
      ]);
      setRawData(displaysResult);
      setKpis(kpisResult);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível carregar a lista de displays.');
    } finally {
      setLoading(false);
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle filter changes (resets to page 1)
  const setFilter = useCallback((key: keyof DisplayFiltersState, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'ALL',
      municipality: 'ALL',
      orientation: 'ALL',
      deviceType: 'ALL',
      commercialStatus: 'ALL',
      commercialModel: 'ALL',
      ownershipType: 'ALL',
      advertisingStatus: 'ALL',
      advertisingEligible: 'ALL',
    });
    setCurrentPage(1);
  }, []);

  // Handle sorting toggle
  const handleSort = useCallback((field: DisplaySortField) => {
    setSortField((currentField) => {
      if (currentField === field) {
        setSortDirection((currentDir) => (currentDir === 'asc' ? 'desc' : 'asc'));
        return currentField;
      }
      setSortDirection('asc');
      return field;
    });
  }, []);

  // Filtered dataset
  const filteredDisplays = useMemo(() => {
    return rawData.filter((item) => {
      // 1. Search text
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesCode = item.code.toLowerCase().includes(query);
        const matchesClient = (item.clientName || '').toLowerCase().includes(query);
        const matchesCustomerOrg = (item.commercialProfile?.customerOrganizationName || '').toLowerCase().includes(query);
        const matchesVenue = item.location.venueName.toLowerCase().includes(query);
        const matchesMunicipality = item.location.municipality.toLowerCase().includes(query);
        const matchesContent = (item.currentContent || '').toLowerCase().includes(query);
        const matchesContract = (item.commercialProfile?.contractNumber || '').toLowerCase().includes(query);

        if (
          !matchesName &&
          !matchesCode &&
          !matchesClient &&
          !matchesCustomerOrg &&
          !matchesVenue &&
          !matchesMunicipality &&
          !matchesContent &&
          !matchesContract
        ) {
          return false;
        }
      }

      // 2. Status
      if (filters.status !== 'ALL' && item.status !== filters.status) {
        return false;
      }

      // 3. Municipality
      if (filters.municipality !== 'ALL' && item.location.municipality !== filters.municipality) {
        return false;
      }

      // 4. Orientation
      if (filters.orientation !== 'ALL' && item.orientation !== filters.orientation) {
        return false;
      }

      // 5. Device Type
      if (filters.deviceType !== 'ALL' && item.deviceType !== filters.deviceType) {
        return false;
      }

      // 6. Commercial Status
      const commStatus = item.commercialProfile?.commercialStatus || item.commercialStatus;
      if (filters.commercialStatus !== 'ALL' && commStatus !== filters.commercialStatus) {
        return false;
      }

      // 7. Commercial Model
      const commModel = item.commercialProfile?.commercialModel || item.commercialModel;
      if (filters.commercialModel !== 'ALL' && commModel !== filters.commercialModel) {
        return false;
      }

      // 8. Ownership Type
      const ownership = item.commercialProfile?.ownershipType || item.ownershipType;
      if (filters.ownershipType !== 'ALL' && ownership !== filters.ownershipType) {
        return false;
      }

      // 9. Advertising Status
      if (filters.advertisingStatus !== 'ALL' && item.commercialProfile?.advertisingStatus !== filters.advertisingStatus) {
        return false;
      }

      // 10. Advertising Eligible
      if (filters.advertisingEligible !== 'ALL') {
        const eligible = item.commercialProfile ? item.commercialProfile.advertisingEligible : item.advertisingEligible;
        const targetBool = filters.advertisingEligible === 'true';
        if (eligible !== targetBool) return false;
      }

      return true;
    });
  }, [rawData, filters]);

  // Sorted dataset
  const sortedDisplays = useMemo(() => {
    const list = [...filteredDisplays];
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name, 'pt-AO');
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'location') {
        const locA = `${a.location.municipality} ${a.location.venueName}`;
        const locB = `${b.location.municipality} ${b.location.venueName}`;
        comparison = locA.localeCompare(locB, 'pt-AO');
      } else if (sortField === 'commercialModel') {
        const modA = a.commercialProfile?.commercialModel || a.commercialModel || '';
        const modB = b.commercialProfile?.commercialModel || b.commercialModel || '';
        comparison = modA.localeCompare(modB);
      } else if (sortField === 'monthlyFee') {
        const feeA = a.commercialProfile?.monthlyFeeKz || 0;
        const feeB = b.commercialProfile?.monthlyFeeKz || 0;
        comparison = feeB - feeA;
      } else if (sortField === 'heartbeat') {
        const timeA = new Date(a.lastHeartbeatAt).getTime() || 0;
        const timeB = new Date(b.lastHeartbeatAt).getTime() || 0;
        comparison = timeB - timeA;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return list;
  }, [filteredDisplays, sortField, sortDirection]);

  // Paginated data
  const totalFilteredCount = sortedDisplays.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / pageSize));

  const paginatedDisplays = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDisplays.slice(start, start + pageSize);
  }, [sortedDisplays, currentPage, pageSize]);

  // Unique Municipalities from data for filter dropdown
  const uniqueMunicipalities = useMemo(() => {
    const set = new Set<string>();
    rawData.forEach((d) => {
      if (d.location.municipality) set.add(d.location.municipality);
    });
    return Array.from(set).sort();
  }, [rawData]);

  // Actions
  const syncDisplay = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/displays/${id}/sync`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          showToast({ type: 'success', message: data.message || 'Sincronização enviada para a TV Box.', title: 'Grade Sincronizada' });
          fetchData(false);
        } else {
          throw new Error(data.error || 'Falha ao sincronizar display');
        }
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Falha ao sincronizar display', title: 'Erro de Comando' });
      }
    },
    [showToast, fetchData]
  );

  const restartDisplay = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/displays/${id}/sync`, { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          showToast({ type: 'info', message: 'Comando de reinicialização enviado para o player.', title: 'Comando Remoto Enviado' });
          fetchData(false);
        } else {
          throw new Error(data.error || 'Falha ao reiniciar player');
        }
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Falha ao reiniciar player', title: 'Erro' });
      }
    },
    [showToast, fetchData]
  );

  const resetDisplay = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/displays/${id}/reset`, { method: 'POST' });
        if (res.ok) {
          showToast({
            type: 'info',
            message: 'O comando de reset foi despachado. A TV Box desconectou e gerará novo código PIN.',
            title: 'Dispositivo Resetado',
          });
          fetchData(false);
        } else {
          throw new Error('Falha na resposta do servidor.');
        }
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Falha ao resetar conexão', title: 'Erro de Reset' });
      }
    },
    [showToast, fetchData]
  );

  const addDisplay = useCallback(
    async (data: Partial<Display>) => {
      try {
        const payload = { ...data, organizationId: currentOrganization?.id };
        const created = await NexoraService.displays.create(payload);
        showToast({
          type: 'success',
          message: `Display ${created.code} cadastrado com sucesso na rede de Luanda.`,
          title: 'Display Adicionado',
        });
        await fetchData(false);
        return created;
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Erro ao criar display', title: 'Falha no Cadastro' });
        throw err;
      }
    },
    [showToast, fetchData]
  );

  // Commercial Operations
  const rentDisplay = useCallback(
    async (id: string, params: RentDisplayParams) => {
      try {
        const updated = await NexoraService.displays.rentDisplay(id, params);
        showToast({
          type: 'success',
          message: `Display ${updated.code} alugado com sucesso para ${params.customerName || 'o cliente'}.`,
          title: 'Contrato de Aluguer Ativado',
        });
        await fetchData(false);
        return updated;
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Erro ao processar aluguer', title: 'Falha Comercial' });
        throw err;
      }
    },
    [showToast, fetchData]
  );

  const sellDisplay = useCallback(
    async (id: string, params: SellDisplayParams) => {
      try {
        const updated = await NexoraService.displays.sellDisplay(id, params);
        showToast({
          type: 'success',
          message: `Display ${updated.code} vendido com sucesso para ${params.customerName || 'o cliente'}.`,
          title: 'Venda de Hardware Concluída',
        });
        await fetchData(false);
        return updated;
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Erro ao processar venda', title: 'Falha Comercial' });
        throw err;
      }
    },
    [showToast, fetchData]
  );

  const rentForEvent = useCallback(
    async (id: string, params: EventRentalParams) => {
      try {
        const updated = await NexoraService.displays.rentForEvent(id, params);
        showToast({
          type: 'success',
          message: `Display ${updated.code} reservado com sucesso para "${params.eventName}".`,
          title: 'Aluguer de Evento Confirmado',
        });
        await fetchData(false);
        return updated;
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Erro ao reservar display', title: 'Falha Comercial' });
        throw err;
      }
    },
    [showToast, fetchData]
  );

  const assignCustomer = useCallback(
    async (id: string, customerOrgId: string, customerName?: string, notes?: string) => {
      try {
        const updated = await NexoraService.displays.assignCustomer(id, customerOrgId, customerName, notes);
        showToast({
          type: 'success',
          message: `Display ${updated.code} associado à organização ${customerName || customerOrgId}.`,
          title: 'Associação Atualizada',
        });
        await fetchData(false);
        return updated;
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Erro ao associar cliente', title: 'Falha' });
        throw err;
      }
    },
    [showToast, fetchData]
  );

  const returnToInventory = useCallback(
    async (id: string, notes?: string) => {
      try {
        const updated = await NexoraService.displays.returnToInventory(id, notes);
        showToast({
          type: 'info',
          message: `Display ${updated.code} retornado ao inventário disponível.`,
          title: 'Disponibilidade Atualizada',
        });
        await fetchData(false);
        return updated;
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Erro ao retornar ao inventário', title: 'Falha' });
        throw err;
      }
    },
    [showToast, fetchData]
  );

  const setAdvertisingEligibility = useCallback(
    async (id: string, eligible: boolean, adStatus?: DisplayAdvertisingStatus) => {
      try {
        const updated = await NexoraService.displays.setAdvertisingEligibility(id, eligible, adStatus);
        showToast({
          type: 'success',
          message: eligible
            ? `Display ${updated.code} habilitado para inventário publicitário.`
            : `Display ${updated.code} desabilitado para anúncios (100% privado).`,
          title: 'Elegibilidade de Anúncios Atualizada',
        });
        await fetchData(false);
        return updated;
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Erro ao alterar elegibilidade', title: 'Falha' });
        throw err;
      }
    },
    [showToast, fetchData]
  );

  const deleteDisplay = useCallback(
    async (id: string) => {
      try {
        await NexoraService.displays.delete(id);
        showToast({
          type: 'success',
          message: 'Display eliminado com sucesso e desconectado da TV Box.',
          title: 'Display Eliminado',
        });
        await fetchData(false);
        return { success: true };
      } catch (err: any) {
        showToast({ type: 'error', message: err?.message || 'Erro ao eliminar display', title: 'Falha' });
        throw err;
      }
    },
    [showToast, fetchData]
  );

  return {
    displays: paginatedDisplays,
    allFilteredDisplays: sortedDisplays,
    totalCount: rawData.length,
    totalFilteredCount,
    totalPages,
    currentPage,
    pageSize,
    kpis,
    loading,
    error,
    filters,
    sortField,
    sortDirection,
    uniqueMunicipalities,
    setCurrentPage,
    setPageSize,
    setFilter,
    resetFilters,
    handleSort,
    refresh: fetchData,
    syncDisplay,
    restartDisplay,
    resetDisplay,
    addDisplay,
    rentDisplay,
    sellDisplay,
    rentForEvent,
    assignCustomer,
    returnToInventory,
    setAdvertisingEligibility,
    deleteDisplay,
  };
}
