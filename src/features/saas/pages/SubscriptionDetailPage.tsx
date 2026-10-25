import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Sparkles,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Edit3,
  Layers,
  Plus,
  Trash2,
  Tv,
} from 'lucide-react';
import { Subscription, SubscriptionUsageSummary, SubscriptionStatus, AddOn } from '../../../types/saas';
import { NexoraService } from '../../../services';
import { formatKz, formatDate, formatInterval, formatCommercialModel } from '../utils/saasFormatters';
import { CommercialModelBadge } from '../components/CommercialModelBadge';
import { SubscriptionStatusBadge } from '../components/SubscriptionStatusBadge';
import { SubscriptionUsageCards } from '../components/SubscriptionUsageCards';
import { SubscriptionStatusModal } from '../components/SubscriptionStatusModal';
import { PlanFeatureGrid } from '../components/PlanFeatureGrid';
import { Button } from '../../../components/ui/Button';

interface SubscriptionDetailPageProps {
  subscriptionId: string;
  onBack: () => void;
  onNavigateToPlan?: (planId: string) => void;
}

export const SubscriptionDetailPage: React.FC<SubscriptionDetailPageProps> = ({
  subscriptionId,
  onBack,
  onNavigateToPlan,
}) => {
  const [summary, setSummary] = useState<SubscriptionUsageSummary | null>(null);
  const [availableAddOns, setAvailableAddOns] = useState<AddOn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const sub = await NexoraService.subscriptions.getById(subscriptionId);
      if (!sub) {
        setError('Subscrição não encontrada.');
        return;
      }

      const [usageSummary, addOns] = await Promise.all([
        NexoraService.subscriptions.getUsageSummary(sub.organizationId),
        NexoraService.subscriptionService.getAvailableAddOns(),
      ]);

      setSummary(usageSummary);
      setAvailableAddOns(addOns);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados da subscrição.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [subscriptionId]);

  const handleUpdateStatus = async (id: string, status: SubscriptionStatus) => {
    await NexoraService.subscriptions.updateStatus(id, status);
    await fetchSubscriptionData();
  };

  const handleAddAddOn = async (subId: string, addOnId: string, quantity: number) => {
    await NexoraService.subscriptions.addAddOn(subId, addOnId, quantity);
    await fetchSubscriptionData();
  };

  const handleRemoveAddOn = async (subId: string, subAddOnId: string) => {
    await NexoraService.subscriptions.removeAddOn(subId, subAddOnId);
    await fetchSubscriptionData();
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        A carregar dados da subscrição SaaS...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar às Subscrições
        </Button>
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
          {error || 'Subscrição não encontrada.'}
        </div>
      </div>
    );
  }

  const { subscription: sub, plan } = summary;
  const activeAddOns = sub.addOns?.filter((a) => a.active) || [];
  const addOnsTotalKz = activeAddOns.reduce((sum, a) => sum + a.unitPrice * a.quantity, 0);
  const totalMonthlyKz = sub.price + addOnsTotalKz;
  const modelInfo = formatCommercialModel(sub.commercialModel);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Back & Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Voltar à Lista de Subscrições
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            className="text-xs"
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
            Gerir Status & Add-ons
          </Button>
        </div>
      </div>

      {/* Main Subscription Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <CommercialModelBadge model={sub.commercialModel} />
              <SubscriptionStatusBadge status={sub.status} />
              <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                {sub.id}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <Building2 className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">{sub.organizationName}</h1>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Organização ID: <span className="font-mono text-slate-300">{sub.organizationId}</span> | Código:{' '}
              <span className="font-mono text-cyan-400">{sub.organizationCode || 'N/A'}</span>
            </p>
          </div>

          {/* Pricing Summary Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0 min-w-[280px]">
            <span className="text-xs font-medium text-slate-400">Total Mensal Recorrente</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-extrabold text-white">{formatKz(totalMonthlyKz)}</span>
              <span className="text-xs text-slate-400 font-medium">
                {formatInterval(sub.billingInterval)}
              </span>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 space-y-1 border-t border-slate-800/80 pt-2">
              <div className="flex justify-between">
                <span>Plano Base ({sub.planName}):</span>
                <span className="text-white font-medium">{formatKz(sub.price)}</span>
              </div>
              {activeAddOns.length > 0 && (
                <div className="flex justify-between text-violet-400">
                  <span>Add-ons ({activeAddOns.length}):</span>
                  <span>+{formatKz(addOnsTotalKz)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeline & Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <span className="text-slate-500 font-medium block">Plano Contratado</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-semibold text-white">{sub.planName}</span>
              {onNavigateToPlan && (
                <button
                  onClick={() => onNavigateToPlan(sub.planId)}
                  className="text-[11px] text-cyan-400 hover:underline"
                >
                  Ver plano →
                </button>
              )}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <span className="text-slate-500 font-medium block">Data de Início</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatDate(sub.startDate)}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <span className="text-slate-500 font-medium block">Próxima Renovação</span>
            <div className="flex items-center gap-1.5 mt-1 font-semibold text-cyan-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatDate(sub.nextRenewalDate)}</span>
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <span className="text-slate-500 font-medium block">Modelo de Hardware</span>
            <span className="font-semibold text-slate-300 block mt-1">
              {modelInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Usage Telemetry vs Limits */}
      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-bold text-white">Consumo de Recursos & Limites de Contrato</h2>
          <p className="text-xs text-slate-400">
            Telemetria em tempo real das cotas de telas, armazenamento, inteligência artificial e usuários.
          </p>
        </div>

        <SubscriptionUsageCards summary={summary} />
      </div>

      {/* Add-ons Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span>Módulos Adicionais (Add-ons) Contratados ({activeAddOns.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Extensões de capacidade adicionadas ao plano base.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            className="text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Contratar Add-on
          </Button>
        </div>

        {activeAddOns.length === 0 ? (
          <div className="p-6 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs">
            Nenhum add-on ativo nesta subscrição. É possível expandir telas, storage ou créditos IA a qualquer momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAddOns.map((addon) => (
              <div
                key={addon.id}
                className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-white">{addon.addOnName}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Qtd: {addon.quantity} × {formatKz(addon.unitPrice)}/mês
                  </div>
                  <span className="text-[10px] text-violet-400 font-mono">
                    Total: {formatKz(addon.unitPrice * addon.quantity)}/mês
                  </span>
                </div>

                <button
                  onClick={() => handleRemoveAddOn(sub.id, addon.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                  title="Remover add-on"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Features Included */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-1">Recursos Habilitados pelo Plano</h3>
        <p className="text-xs text-slate-400 mb-5">
          Lista de capacidades ativas para esta organização conforme o plano {plan.name}.
        </p>

        <PlanFeatureGrid features={plan.features} interactive={false} />
      </div>

      {/* Status & Add-ons Modal */}
      <SubscriptionStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        subscription={sub}
        availableAddOns={availableAddOns}
        onUpdateStatus={handleUpdateStatus}
        onAddAddOn={handleAddAddOn}
        onRemoveAddOn={handleRemoveAddOn}
      />
    </div>
  );
};
