import { useState, useEffect, useCallback } from 'react';
import { Plan, PlanFilters, PlanKPIs, PlanStatus } from '../../../types/saas';
import { NexoraService } from '../../../services';

export function usePlans(initialFilters?: PlanFilters) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [kpis, setKpis] = useState<PlanKPIs | null>(null);
  const [filters, setFilters] = useState<PlanFilters>(initialFilters || { status: 'ALL', billingInterval: 'ALL', search: '' });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, kpisData] = await Promise.all([
        NexoraService.plans.getAll(filters),
        NexoraService.plans.getKPIs(),
      ]);
      setPlans(plansData);
      setKpis(kpisData);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar catálogo de planos.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const updateStatus = async (id: string, status: PlanStatus) => {
    try {
      const updated = await NexoraService.plans.updateStatus(id, status);
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      const newKpis = await NexoraService.plans.getKPIs();
      setKpis(newKpis);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Falha ao alterar status do plano.');
    }
  };

  const createPlan = async (data: Partial<Plan>) => {
    try {
      const created = await NexoraService.plans.create(data);
      setPlans((prev) => [created, ...prev]);
      const newKpis = await NexoraService.plans.getKPIs();
      setKpis(newKpis);
      return created;
    } catch (err: any) {
      throw new Error(err?.message || 'Falha ao criar plano.');
    }
  };

  const updatePlan = async (id: string, data: Partial<Plan>) => {
    try {
      const updated = await NexoraService.plans.update(id, data);
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      const newKpis = await NexoraService.plans.getKPIs();
      setKpis(newKpis);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Falha ao atualizar plano.');
    }
  };

  const deletePlan = async (id: string) => {
    try {
      await NexoraService.plans.delete(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      const newKpis = await NexoraService.plans.getKPIs();
      setKpis(newKpis);
    } catch (err: any) {
      throw new Error(err?.message || 'Falha ao remover plano.');
    }
  };

  return {
    plans,
    kpis,
    filters,
    setFilters,
    loading,
    error,
    refresh: fetchPlans,
    updateStatus,
    createPlan,
    updatePlan,
    deletePlan,
  };
}
