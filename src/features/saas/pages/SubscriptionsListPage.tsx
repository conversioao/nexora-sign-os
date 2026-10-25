import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus, Building2, AlertCircle } from 'lucide-react';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { Subscription, SubscriptionStatus, AddOn } from '../../../types/saas';
import { SubscriptionKpiSummary } from '../components/SubscriptionKpiSummary';
import { SubscriptionFiltersBar } from '../components/SubscriptionFiltersBar';
import { SubscriptionTable } from '../components/SubscriptionTable';
import { SubscriptionStatusModal } from '../components/SubscriptionStatusModal';
import { NexoraService } from '../../../services';
import { Button } from '../../../components/ui/Button';
import { useSession } from '../../../context/SessionContext';

interface SubscriptionsListPageProps {
  onNavigateToDetail?: (subscriptionId: string) => void;
}

export const SubscriptionsListPage: React.FC<SubscriptionsListPageProps> = ({
  onNavigateToDetail,
}) => {
  const { currentOrganization } = useSession();
  const {
    subscriptions,
    kpis,
    filters,
    setFilters,
    loading,
    error,
    refresh,
    updateStatus,
    addAddOn,
    removeAddOn,
  } = useSubscriptions();

  const [selectedSubForModal, setSelectedSubForModal] = useState<Subscription | null>(null);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);

  useEffect(() => {
    NexoraService.subscriptionService.getAvailableAddOns().then(setAvailableAddOns);
  }, []);

  const handleSelectSubscription = (sub: Subscription) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(sub.id);
    }
  };

  const handleOpenStatusModal = (sub: Subscription) => {
    setSelectedSubForModal(sub);
  };

  const handleStatusUpdate = async (id: string, status: SubscriptionStatus) => {
    await updateStatus(id, status);
    if (selectedSubForModal && selectedSubForModal.id === id) {
      setSelectedSubForModal((prev) => (prev ? { ...prev, status } : null));
    }
  };

  const handleAddAddOn = async (subscriptionId: string, addOnId: string, quantity: number) => {
    const updated = await addAddOn(subscriptionId, addOnId, quantity);
    if (selectedSubForModal && selectedSubForModal.id === subscriptionId) {
      setSelectedSubForModal(updated);
    }
  };

  const handleRemoveAddOn = async (subscriptionId: string, subAddOnId: string) => {
    const updated = await removeAddOn(subscriptionId, subAddOnId);
    if (selectedSubForModal && selectedSubForModal.id === subscriptionId) {
      setSelectedSubForModal(updated);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              SaaS & Contratos Recorrentes
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Gestão de Subscrições</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Acompanhamento de planos contratados por organização, ciclos de renovação e status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <SubscriptionKpiSummary kpis={kpis} />

      {/* Error state */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters */}
      <SubscriptionFiltersBar filters={filters} onChange={setFilters} />

      {/* Table */}
      {loading && subscriptions.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 animate-pulse">
          A carregar subscrições ativas...
        </div>
      ) : (
        <SubscriptionTable
          subscriptions={subscriptions}
          onSelect={handleSelectSubscription}
          onManageStatus={handleOpenStatusModal}
        />
      )}

      {/* Status & Add-ons Modal */}
      <SubscriptionStatusModal
        isOpen={Boolean(selectedSubForModal)}
        onClose={() => setSelectedSubForModal(null)}
        subscription={selectedSubForModal}
        availableAddOns={availableAddOns}
        onUpdateStatus={handleStatusUpdate}
        onAddAddOn={handleAddAddOn}
        onRemoveAddOn={handleRemoveAddOn}
      />
    </div>
  );
};
