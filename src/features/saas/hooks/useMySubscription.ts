import { useState, useEffect, useCallback } from 'react';
import { SubscriptionUsageSummary } from '../../../types/saas';
import { NexoraService } from '../../../services';

export function useMySubscription(organizationId?: string) {
  const [summary, setSummary] = useState<SubscriptionUsageSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    if (!organizationId) {
      setSummary(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await NexoraService.subscriptions.getUsageSummary(organizationId);
      setSummary(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados da subscrição.');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    subscription: summary?.subscription || null,
    plan: summary?.plan || null,
    usage: summary?.usage || null,
    metrics: summary?.metrics || null,
    alerts: summary?.alerts || [],
    hasAlerts: summary?.hasAlerts || false,
    loading,
    error,
    refresh: fetchSummary,
  };
}
