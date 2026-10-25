import { useState, useEffect, useCallback } from 'react';
import { Contract, ContractFilters, ContractKPIs } from '../../../types/contracts';
import { contractService } from '../../../services/contractService';
import { useAuth } from '../../../context/AuthContext';

export function useContracts(initialFilters?: ContractFilters) {
  const { currentOrganization, isNexoraAdmin } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [kpis, setKpis] = useState<ContractKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ContractFilters>({
    contractType: 'ALL',
    status: 'ALL',
    search: '',
    ...initialFilters,
  });

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Enforce multi-tenant isolation: if not Nexora Admin, lock organizationId to current organization
      const effectiveOrgId = isNexoraAdmin
        ? filters.organizationId
        : currentOrganization?.id;

      // Se não for Administrador Nexora e a organização ainda não carregou, não buscar tudo da base
      if (!isNexoraAdmin && !effectiveOrgId) {
        setContracts([]);
        setLoading(false);
        return;
      }

      const effectiveFilters: ContractFilters = {
        ...filters,
        organizationId: effectiveOrgId,
      };

      const [data, kpiData] = await Promise.all([
        contractService.getContracts(effectiveFilters),
        contractService.getKPIs(effectiveOrgId),
      ]);

      setContracts(data);
      setKpis(kpiData);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err.message || 'Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  }, [filters, currentOrganization?.id, isNexoraAdmin]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const updateFilters = (newFilters: Partial<ContractFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      contractType: 'ALL',
      status: 'ALL',
      search: '',
    });
  };

  return {
    contracts,
    kpis,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh: fetchContracts,
  };
}
