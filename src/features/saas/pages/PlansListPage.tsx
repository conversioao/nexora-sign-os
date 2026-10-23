import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Sparkles,
  Layers,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Building,
  CreditCard,
  Clock,
  ShieldCheck,
  FileText,
  Save,
  Check,
  X,
  ExternalLink,
  Phone,
  Mail,
  Hash,
} from 'lucide-react';
import { usePlans } from '../hooks/usePlans';
import { useSession } from '../../../context/SessionContext';
import { Plan } from '../../../types/saas';
import { PlanKpiSummary } from '../components/PlanKpiSummary';
import { PlanFiltersBar } from '../components/PlanFiltersBar';
import { PlanCard } from '../components/PlanCard';
import { CreatePlanModal } from '../components/CreatePlanModal';
import { Button } from '../../../components/ui/Button';
import {
  BankingDetails,
  NEXORA_BANKING,
  fetchGlobalBankingDetails,
  saveGlobalBankingDetails,
} from '../../../config/nexoraBanking';
import { formatKz } from '../utils/saasFormatters';

interface PlansListPageProps {
  onNavigateToDetail?: (planId: string) => void;
}

export const PlansListPage: React.FC<PlansListPageProps> = ({ onNavigateToDetail }) => {
  const { currentOrganization, currentMembership } = useSession();
  const isNexoraAdmin =
    currentOrganization?.type === 'NEXORA' || currentMembership?.role === 'NEXORA_ADMIN';

  // Tabs
  const [activeTab, setActiveTab] = useState<'catalog' | 'approvals' | 'banking'>('catalog');

  // Plans state
  const { plans, kpis, filters, setFilters, loading, error, refresh, createPlan, updatePlan } =
    usePlans();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanForEdit, setSelectedPlanForEdit] = useState<Plan | null>(null);

  // Subscriptions & Approvals state
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectModalSub, setRejectModalSub] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [subFilter, setSubFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'ACTIVE' | 'CANCELLED'>('PENDING_APPROVAL');

  // Banking Details state
  const [bankDetails, setBankDetails] = useState<BankingDetails>(NEXORA_BANKING);
  const [loadingBank, setLoadingBank] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState<string | null>(null);
  const [bankErrorMsg, setBankErrorMsg] = useState<string | null>(null);

  // Fetch subscriptions
  const fetchSubscriptions = useCallback(async () => {
    try {
      setLoadingSubs(true);
      const res = await fetch('/api/subscriptions');
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar subscrições:', err);
    } finally {
      setLoadingSubs(false);
    }
  }, []);

  // Fetch global bank details
  const loadBankDetails = useCallback(async () => {
    try {
      setLoadingBank(true);
      const data = await fetchGlobalBankingDetails();
      setBankDetails(data);
    } catch (err) {
      console.error('Erro ao carregar coordenadas bancárias:', err);
    } finally {
      setLoadingBank(false);
    }
  }, []);

  useEffect(() => {
    if (isNexoraAdmin) {
      fetchSubscriptions();
      loadBankDetails();
    }
  }, [isNexoraAdmin, fetchSubscriptions, loadBankDetails]);

  const pendingApprovalsCount = subscriptions.filter(
    (s) => s.status === 'PENDING_APPROVAL'
  ).length;

  const handleOpenCreate = () => {
    setSelectedPlanForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (plan: Plan) => {
    setSelectedPlanForEdit(plan);
    setIsModalOpen(true);
  };

  const handleSelectPlan = (plan: Plan) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(plan.id);
    }
  };

  const handleModalSubmit = async (planData: Partial<Plan>) => {
    if (selectedPlanForEdit) {
      await updatePlan(selectedPlanForEdit.id, planData);
    } else {
      await createPlan(planData);
    }
  };

  const handleApproveSubscription = async (subId: string) => {
    try {
      setApprovingId(subId);
      const res = await fetch(`/api/subscriptions/${subId}/approve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        alert(`✅ Subscrição aprovada com sucesso! Contrato gerado: ${data.contractNumber || 'Oficial'}`);
        await fetchSubscriptions();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Erro ao aprovar: ${err.error || 'Falha na requisição'}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setApprovingId(null);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectModalSub) return;
    try {
      setRejectingId(rejectModalSub.id);
      const res = await fetch(`/api/subscriptions/${rejectModalSub.id}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectionReason || 'Comprovativo não identificado ou transferência inválida' }),
      });
      if (res.ok) {
        setRejectModalSub(null);
        setRejectionReason('');
        await fetchSubscriptions();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Erro ao rejeitar: ${err.error || 'Falha na requisição'}`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setRejectingId(null);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setBankSuccessMsg(null);
    setBankErrorMsg(null);
    const result = await saveGlobalBankingDetails(bankDetails);
    if (result.success) {
      setBankSuccessMsg('Coordenadas bancárias oficiais gravadas com sucesso!');
      setTimeout(() => setBankSuccessMsg(null), 4000);
    } else {
      setBankErrorMsg(result.error || 'Erro ao guardar dados');
    }
    setSavingBank(false);
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (subFilter === 'ALL') return true;
    return sub.status === subFilter;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              SaaS & Gestão Comercial
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">Pacotes de Planos & Faturamento</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Gestão de planos, aprovação de pagamentos por transferência bancária e coordenadas globais.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refresh();
              if (isNexoraAdmin) fetchSubscriptions();
            }}
            disabled={loading || loadingSubs}
            className="text-xs border-white/10 text-slate-300 hover:bg-white/5"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${loading || loadingSubs ? 'animate-spin' : ''}`}
            />
            Atualizar
          </Button>

          {isNexoraAdmin && activeTab === 'catalog' && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Criar Novo Plano
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs for Admin */}
      {isNexoraAdmin && (
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Catálogo de Planos</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
              {plans.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
              activeTab === 'approvals'
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Aprovações de Subscrições</span>
            {pendingApprovalsCount > 0 ? (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
                {pendingApprovalsCount} pendente{pendingApprovalsCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-400">
                0
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('banking')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'banking'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Coordenadas Bancárias Globais</span>
          </button>
        </div>
      )}

      {/* ────────────────── TAB 1: CATÁLOGO DE PLANOS ────────────────── */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* KPI Metrics */}
          <PlanKpiSummary kpis={kpis} />

          {/* Error state */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search and Filters */}
          <PlanFiltersBar filters={filters} onChange={setFilters} />

          {/* Plans Catalog Grid */}
          {loading && plans.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-900 border border-slate-800 rounded-xl h-96 p-6" />
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center">
              <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-white">Nenhum plano encontrado</h4>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
                Não existem planos correspondentes aos filtros selecionados. Tente ajustar a busca.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSelectPlan}
                  onEdit={handleOpenEdit}
                  showAdminActions={isNexoraAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 2: APROVAÇÕES DE SUBSCRIÇÕES ────────────────── */}
      {activeTab === 'approvals' && (
        <div className="space-y-6">
          {/* Subscriptions Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSubFilter('PENDING_APPROVAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  subFilter === 'PENDING_APPROVAL'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Aguardando Aprovação ({pendingApprovalsCount})
              </button>
              <button
                onClick={() => setSubFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  subFilter === 'ACTIVE'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Aprovadas / Ativas (
                {subscriptions.filter((s) => s.status === 'ACTIVE').length})
              </button>
              <button
                onClick={() => setSubFilter('CANCELLED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  subFilter === 'CANCELLED'
                    ? 'bg-rose-500 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Rejeitadas / Canceladas (
                {subscriptions.filter((s) => s.status === 'CANCELLED').length})
              </button>
              <button
                onClick={() => setSubFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  subFilter === 'ALL'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Todas ({subscriptions.length})
              </button>
            </div>

            <span className="text-[11px] text-slate-400">
              Total listadas: <strong>{filteredSubscriptions.length}</strong>
            </span>
          </div>

          {/* Subscriptions List */}
          {loadingSubs ? (
            <div className="p-12 text-center text-slate-400 animate-pulse">
              Carregando solicitações de planos e comprovativos...
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-12 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-400/50 mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhuma solicitação pendente</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Não existem pedidos de subscrição aguardando validação para o filtro selecionado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredSubscriptions.map((sub) => {
                const isPending = sub.status === 'PENDING_APPROVAL';
                const isApproved = sub.status === 'ACTIVE';
                const isCancelled = sub.status === 'CANCELLED';

                return (
                  <div
                    key={sub.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isPending
                        ? 'bg-gradient-to-r from-amber-500/[0.04] to-transparent border-amber-500/30'
                        : isApproved
                        ? 'bg-slate-900/60 border-emerald-500/20'
                        : 'bg-slate-900/40 border-white/5 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Organization & Plan details */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              isPending
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : isApproved
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {isPending
                              ? '⏳ Aguarda Aprovação'
                              : isApproved
                              ? '✓ Ativo & Licenciado'
                              : '✕ Rejeitado / Cancelado'}
                          </span>

                          <span className="text-xs text-slate-400 font-mono">ID: {sub.id}</span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs text-slate-400">
                            {new Date(sub.created_at).toLocaleDateString('pt-AO', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base font-bold text-white flex items-center gap-2">
                            <span>{sub.organization_name || sub.organization_id}</span>
                            <span className="text-xs font-normal text-slate-400 font-mono">
                              ({sub.organization_id})
                            </span>
                          </h4>

                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
                            {sub.organization_email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                {sub.organization_email}
                              </span>
                            )}
                            {sub.organization_phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-500" />
                                {sub.organization_phone}
                              </span>
                            )}
                            {sub.organization_nif && (
                              <span className="flex items-center gap-1">
                                <Hash className="w-3.5 h-3.5 text-slate-500" />
                                NIF: {sub.organization_nif}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Plan & Value */}
                        <div className="flex items-center gap-4 pt-1">
                          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
                            Plano: {sub.plan_name || sub.plan_id}
                          </span>
                          <span className="text-sm font-black text-emerald-400 font-mono">
                            {formatKz(Number(sub.amount_kz) || 0)}
                          </span>
                        </div>

                        {sub.notes && (
                          <p className="text-xs text-slate-400 bg-black/20 p-2 rounded-lg border border-white/5 max-w-xl">
                            <strong className="text-slate-300">Notas:</strong> {sub.notes}
                          </p>
                        )}
                      </div>

                      {/* Right: Proof thumbnail & Action buttons */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        {/* Comprovativo Button / Thumbnail */}
                        {sub.proof_url ? (
                          <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-white/10">
                            {sub.proof_url.startsWith('data:image') ||
                            sub.proof_url.match(/\.(jpeg|jpg|png|webp)/i) ? (
                              <img
                                src={sub.proof_url}
                                alt="Comprovativo"
                                className="w-12 h-12 object-cover rounded-lg border border-white/10 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setPreviewProofUrl(sub.proof_url)}
                              />
                            ) : (
                              <div
                                className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 cursor-pointer"
                                onClick={() => setPreviewProofUrl(sub.proof_url)}
                              >
                                <FileText className="w-6 h-6" />
                              </div>
                            )}

                            <div>
                              <p className="text-[11px] font-semibold text-white">Comprovativo</p>
                              <button
                                type="button"
                                onClick={() => setPreviewProofUrl(sub.proof_url)}
                                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none p-0"
                              >
                                <Eye className="w-3 h-3" /> Ver em tela cheia
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic px-3 py-2 bg-slate-950 rounded-xl border border-white/5">
                            Sem comprovativo
                          </span>
                        )}

                        {/* Actions */}
                        {isPending && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setRejectModalSub(sub);
                                setRejectionReason('');
                              }}
                              className="px-3.5 py-2 rounded-xl border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              Rejeitar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleApproveSubscription(sub.id)}
                              disabled={approvingId === sub.id}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{approvingId === sub.id ? 'Aprovando...' : 'Aprovar Pagamento'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────── TAB 3: COORDENADAS BANCÁRIAS GLOBAIS ────────────────── */}
      {activeTab === 'banking' && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Coordenadas Bancárias Oficiais</h3>
                  <p className="text-xs text-slate-400">
                    Estas informações são exibidas para todos os anunciantes e operadores no checkout da plataforma.
                  </p>
                </div>
              </div>
            </div>

            {bankSuccessMsg && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{bankSuccessMsg}</span>
              </div>
            )}

            {bankErrorMsg && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bankErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveBankDetails} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Beneficiário Oficial *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankDetails.beneficiary}
                    onChange={(e) => setBankDetails({ ...bankDetails, beneficiary: e.target.value })}
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Instituição Bancária *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankDetails.bankName}
                    onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    IBAN (Angola AO06...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankDetails.iban}
                    onChange={(e) => setBankDetails({ ...bankDetails, iban: e.target.value })}
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Referência Multicaixa Pagamentos
                  </label>
                  <input
                    type="text"
                    value={bankDetails.multicaixaReference}
                    onChange={(e) =>
                      setBankDetails({ ...bankDetails, multicaixaReference: e.target.value })
                    }
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Entidade Multicaixa
                  </label>
                  <input
                    type="text"
                    value={bankDetails.entity}
                    onChange={(e) => setBankDetails({ ...bankDetails, entity: e.target.value })}
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Moeda</label>
                  <input
                    type="text"
                    value={bankDetails.currency}
                    onChange={(e) => setBankDetails({ ...bankDetails, currency: e.target.value })}
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">SWIFT / BIC</label>
                  <input
                    type="text"
                    value={bankDetails.swift || ''}
                    onChange={(e) => setBankDetails({ ...bankDetails, swift: e.target.value })}
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Instruções de Pagamento / Notas no Modal de Compra
                  </label>
                  <textarea
                    rows={3}
                    value={bankDetails.notes || ''}
                    onChange={(e) => setBankDetails({ ...bankDetails, notes: e.target.value })}
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={savingBank}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingBank ? 'Guardando...' : 'Salvar Coordenadas Oficiais'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: VER COMPROVATIVO EM TELA CHEIA ────────────────── */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-4xl w-full bg-[#0B101E] border border-white/20 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Comprovativo de Pagamento</span>
              </h3>
              <div className="flex items-center gap-2">
                <a
                  href={previewProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download="comprovativo-nexora"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-cyan-400 text-xs font-semibold flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir Original
                </a>
                <button
                  onClick={() => setPreviewProofUrl(null)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black/40 rounded-2xl min-h-[300px]">
              {previewProofUrl.startsWith('data:image') ||
              previewProofUrl.match(/\.(jpeg|jpg|png|webp)/i) ? (
                <img
                  src={previewProofUrl}
                  alt="Comprovativo ampliado"
                  className="max-h-[70vh] w-auto object-contain rounded-xl shadow-lg"
                />
              ) : previewProofUrl.includes('application/pdf') ||
                previewProofUrl.endsWith('.pdf') ? (
                <iframe
                  src={previewProofUrl}
                  title="PDF do comprovativo"
                  className="w-full h-[70vh] rounded-xl border border-white/10"
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-12 h-12 text-slate-500 mx-auto" />
                  <p className="text-sm text-slate-300">Documento anexado pelo cliente</p>
                  <a
                    href={previewProofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    Abrir Documento
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────── MODAL: REJEITAR SUBSCRIÇÃO COM MOTIVO ────────────────── */}
      {rejectModalSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative max-w-md w-full bg-[#0B101E] border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/30">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Rejeitar Solicitação de Plano</h3>
                <p className="text-xs text-slate-400">
                  {rejectModalSub.organization_name || rejectModalSub.organization_id} ·{' '}
                  {rejectModalSub.plan_name}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Motivo da Rejeição (o cliente receberá notificação)
              </label>
              <textarea
                rows={3}
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Comprovativo ilegível, valor divergente ou transferência não creditada na conta BAI."
                className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalSub(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-xs font-semibold hover:bg-white/5"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejectingId === rejectModalSub.id}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition-all disabled:opacity-50"
              >
                {rejectingId === rejectModalSub.id ? 'Rejeitando...' : 'Confirmar Rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <CreatePlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialPlan={selectedPlanForEdit}
      />
    </div>
  );
};
