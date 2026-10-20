import { useState, useEffect, useCallback } from 'react';
import {
  Subscription,
  SubscriptionFilters,
  SubscriptionKPIs,
  SubscriptionStatus,
} from '../../../types/saas';
import { NexoraService } from '../../../services';

export function useSubscriptions(initialFilters?: SubscriptionFilters) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [kpis, setKpis] = useState<SubscriptionKPIs | null>(null);
  const [filters, setFilters] = useState<SubscriptionFilters>(
    initialFilters || {
      status: 'ALL',
      billingInterval: 'ALL',
      commercialModel: 'ALL',
      search: '',
    }
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [subsData, kpisData] = await Promise.all([
        NexoraService.subscriptions.getAll(filters),
        NexoraService.subscriptions.getKPIs(),
      ]);
      setSubscriptions(subsData);
      setKpis(kpisData);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar subscrições.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const updateStatus = async (id: string, status: SubscriptionStatus) => {
    try {
      const updated = await NexoraService.subscriptions.updateStatus(id, status);
      setSubscriptions((prev) => prev.map((s) => (s.id === id ? updated : s)));
      const newKpis = await NexoraService.subscriptions.getKPIs();
      setKpis(newKpis);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Falha ao alterar status da subscrição.');
    }
  };

  const addAddOn = async (subscriptionId: string, addOnId: string, quantity: number = 1) => {
    try {
      const updated = await NexoraService.subscriptions.addAddOn(subscriptionId, addOnId, quantity);
      setSubscriptions((prev) => prev.map((s) => (s.id === subscriptionId ? updated : s)));
      const newKpis = await NexoraService.subscriptions.getKPIs();
      setKpis(newKpis);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Falha ao adicionar add-on.');
    }
  };

  const removeAddOn = async (subscriptionId: string, subAddOnId: string) => {
    try {
      const updated = await NexoraService.subscriptions.removeAddOn(subscriptionId, subAddOnId);
      setSubscriptions((prev) => prev.map((s) => (s.id === subscriptionId ? updated : s)));
      const newKpis = await NexoraService.subscriptions.getKPIs();
      setKpis(newKpis);
      return updated;
    } catch (err: any) {
      throw new Error(err?.message || 'Falha ao remover add-on.');
    }
  };

  return {
    subscriptions,
    kpis,
    filters,
    setFilters,
    loading,
    error,
    refresh: fetchSubscriptions,
    updateStatus,
    addAddOn,
    removeAddOn,
  };
}
