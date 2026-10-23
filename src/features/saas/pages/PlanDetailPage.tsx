import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Tv,
  HardDrive,
  Users,
  Sparkles,
  Layers,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Edit3,
} from 'lucide-react';
import { Plan, Subscription } from '../../../types/saas';
import { NexoraService } from '../../../services';
import { formatKz, formatInterval, formatDate } from '../utils/saasFormatters';
import { PlanFeatureGrid } from '../components/PlanFeatureGrid';
import { SubscriptionStatusBadge } from '../components/SubscriptionStatusBadge';
import { CommercialModelBadge } from '../components/CommercialModelBadge';
import { CreatePlanModal } from '../components/CreatePlanModal';
import { Button } from '../../../components/ui/Button';
import { useSession } from '../../../context/SessionContext';

interface PlanDetailPageProps {
  planId: string;
  onBack: () => void;
  onNavigateToSubscription?: (subscriptionId: string) => void;
}

export const PlanDetailPage: React.FC<PlanDetailPageProps> = ({
  planId,
  onBack,
  onNavigateToSubscription,
}) => {
  const { currentOrganization, currentMembership } = useSession();
  const isNexoraAdmin = currentOrganization?.type === 'NEXORA' || currentMembership?.role === 'NEXORA_ADMIN';
  const [plan, setPlan] = useState<Plan | null>(null);
  const [subscribers, setSubscribers] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchPlanData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [planData, allSubs] = await Promise.all([
        NexoraService.plans.getById(planId),
        NexoraService.subscriptions.getAll(),
      ]);

      if (!planData) {
        setError('Plano não encontrado.');
        return;
      }

      setPlan(planData);
      setSubscribers(allSubs.filter((s) => s.planId === planData.id));
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar dados do plano.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, [planId]);

  const handleUpdatePlan = async (updatedData: Partial<Plan>) => {
    if (!plan) return;
    try {
      const updated = await NexoraService.plans.update(plan.id, updatedData);
      setPlan(updated);
    } catch (err: any) {
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 animate-pulse">
        A carregar especificações do plano...
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Voltar aos Planos
        </Button>
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
          {error || 'Plano não encontrado.'}
        </div>
      </div>
    );
  }

  const activeSubscribersCount = subscribers.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'TRIAL'
  ).length;

  const totalMRRFromPlan = subscribers
    .filter((s) => s.status === 'ACTIVE')
    .reduce((sum, s) => {
      const addOnsTotal = (s.addOns || []).reduce((aSum, a) => aSum + (a.active ? a.unitPrice * a.quantity : 0), 0);
      return sum + s.price + addOnsTotal;
    }, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack} className="text-xs">
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Voltar ao Catálogo de Planos
        </Button>

        {isNexoraAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              className="text-xs"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Editar Especificações
            </Button>
          </div>
        )}
      </div>

      {/* Plan Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 uppercase">
                {plan.code}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                  plan.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                {plan.status === 'ACTIVE' ? 'Plano Ativo' : plan.status}
              </span>
              {plan.isPopular && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {plan.badgeText || 'Mais Popular'}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-white">{plan.name}</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              {plan.description}
            </p>
          </div>

          {/* Pricing Box & Subscribe Flow */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shrink-0 min-w-[260px] flex flex-col justify-between">
            <div>
              <span className="text-xs font-medium text-slate-400">Preço do Pacote (Validade 30 Dias)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-extrabold text-white">{formatKz(plan.basePrice)}</span>
                <span className="text-xs text-slate-400 font-medium">/ 30 dias</span>
              </div>
              <p className="text-[10px] text-emerald-400 mt-1">
                ✓ Atribuição automática de vaga garantida
              </p>
            </div>

            {!isNexoraAdmin && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  alert(`Pacote "${plan.name}" assinado com sucesso por 30 dias!\n\nOs displays com vagas disponíveis foram alocados automaticamente à sua conta.`);
                }}
                className="mt-3 w-full bg-[#0284C7] hover:bg-[#0369A1] font-bold text-xs py-2 shadow-lg shadow-[#0284C7]/20"
              >
                Assinar Pacote (30 Dias)
              </Button>
            )}
          </div>
        </div>

        {/* Quant limits grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Tv className="w-3.5 h-3.5 text-cyan-400" />
              <span>Displays Máx</span>
            </div>
            <div className="text-lg font-bold text-white">
              {plan.displayLimit === 0 ? 'Slots Rede' : `${plan.displayLimit} Telas`}
            </div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-blue-400" />
              <span>Storage SSD</span>
            </div>
            <div className="text-lg font-bold text-white">{plan.storageLimitGB} GB</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Equipa</span>
            </div>
            <div className="text-lg font-bold text-white">{plan.teamMemberLimit} Usuários</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-pink-400" />
              <span>Playlists</span>
            </div>
            <div className="text-lg font-bold text-white">{plan.playlistLimit}</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Agendamentos</span>
            </div>
            <div className="text-lg font-bold text-white">{plan.scheduleLimit}</div>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/60">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span>Créditos IA</span>
            </div>
            <div className="text-lg font-bold text-white">{plan.monthlyAiCredits.toLocaleString('pt-AO')}</div>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span>Matriz de Recursos & Entitlements</span>
        </h3>
        <p className="text-xs text-slate-400 mb-5">
          Funcionalidades que são ativadas para os tenants vinculados a este plano.
        </p>

        <PlanFeatureGrid features={plan.features} interactive={false} />
      </div>

      {/* Subscribed Organizations */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <span>Organizações Subscritas neste Plano ({subscribers.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tenants que atualmente possuem subscrição ativa, em trial ou suspensa neste plano.
            </p>
          </div>
        </div>

        {subscribers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs">
            Nenhuma organização vinculada a este plano até o momento.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-3">Organização</th>
                  <th className="p-3">Modelo Comercial</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Início</th>
                  <th className="p-3">Próxima Renovação</th>
                  <th className="p-3">Preço Recorrente</th>
                  <th className="p-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-normal">
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white">
                      {sub.organizationName}
                      <span className="block text-[10px] font-mono text-slate-500 font-normal">
                        {sub.organizationCode || sub.organizationId}
                      </span>
                    </td>
                    <td className="p-3">
                      <CommercialModelBadge model={sub.commercialModel} size="sm" />
                    </td>
                    <td className="p-3">
                      <SubscriptionStatusBadge status={sub.status} size="sm" />
                    </td>
                    <td className="p-3 text-slate-400">{formatDate(sub.startDate)}</td>
                    <td className="p-3 text-slate-300">{formatDate(sub.nextRenewalDate)}</td>
                    <td className="p-3 font-bold text-white">{formatKz(sub.price)}</td>
                    <td className="p-3 text-right">
                      {onNavigateToSubscription && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onNavigateToSubscription(sub.id)}
                          className="text-cyan-400 hover:text-cyan-300 text-xs px-2 py-1"
                        >
                          Ver Subscrição
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <CreatePlanModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdatePlan}
        initialPlan={plan}
      />
    </div>
  );
};
