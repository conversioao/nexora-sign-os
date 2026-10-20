import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  Calendar,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Tv,
  Users,
  Check,
  Upload,
  FileText,
  AlertCircle,
  Eye,
  X,
  CreditCard,
  Building,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { useToast } from '../../../components/ui/Toast';
import { Button } from '../../../components/ui/Button';
import { mockPlans } from '../../../data/mockSaasData';
import { NEXORA_BANKING, useNexoraBanking } from '../../../config/nexoraBanking';

interface MySubscriptionPageProps {
  onExplorePlans?: () => void;
}

export const MySubscriptionPage: React.FC<MySubscriptionPageProps> = () => {
  const { currentOrganization, currentMembership, currentRole } = useSession();
  const { showToast } = useToast();
  const { banking: nexoraBanking } = useNexoraBanking();

  const isNexoraAdmin =
    currentRole === 'NEXORA_ADMIN' ||
    currentMembership?.role === 'NEXORA_ADMIN' ||
    currentOrganization?.type === 'NEXORA';

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<any | null>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeProofModal, setActiveProofModal] = useState<string | null>(null);

  // Formatar valores em Kwanzas
  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const loadSubscriptions = async () => {
    setLoading(true);
    try {
      const orgParam =
        !isNexoraAdmin && currentOrganization?.id
          ? `?organizationId=${encodeURIComponent(currentOrganization.id)}`
          : '';
      const res = await fetch(`/api/subscriptions${orgParam}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Erro ao carregar subscrições:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [currentOrganization?.id, isNexoraAdmin]);

  // Subscrição atual da organização do usuário
  const myOrgSub = subscriptions.find(
    (s) => s.organization_id === currentOrganization?.id && s.status !== 'CANCELLED'
  );

  // Solicitações pendentes para o Admin aprovar
  const pendingRequests = isNexoraAdmin
    ? subscriptions.filter((s) => s.status === 'PENDING_APPROVAL')
    : [];

  // Lidar com seleção de arquivo de comprovativo (converter para base64 para preview e persistência)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('O comprovativo deve ter no máximo 5MB.', 'danger');
      return;
    }

    setProofFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setProofFile(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Enviar solicitação de compra do plano
  const handleConfirmPurchase = async () => {
    if (!selectedPlanForPurchase) return;
    if (!proofFile) {
      showToast('Por favor, anexe o comprovativo de transferência bancária.', 'danger');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/subscriptions/purchase-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: currentOrganization?.id || 'org-nova',
          organizationName: currentOrganization?.name || 'Minha Organização',
          planId: selectedPlanForPurchase.id,
          planName: selectedPlanForPurchase.name,
          amountKz: selectedPlanForPurchase.basePrice,
          proofUrl: proofFile,
          notes: purchaseNotes,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Falha ao processar solicitação.');
      }

      showToast(
        'Plano ativado com sucesso! As suas telas e créditos de IA já estão disponíveis.',
        'success'
      );
      setSelectedPlanForPurchase(null);
      setProofFile(null);
      setProofFileName('');
      setPurchaseNotes('');
      await loadSubscriptions();
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar comprovativo.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin: Aprovar subscrição
  const handleApproveSubscription = async (subId: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/approve`, {
        method: 'PATCH',
      });
      if (res.ok) {
        const data = await res.json();
        showToast(
          `Plano aprovado com sucesso! Contrato oficial Nº ${data.contractNumber || ''} gerado automaticamente.`,
          'success'
        );
        await loadSubscriptions();
      } else {
        showToast('Não foi possível aprovar a subscrição.', 'danger');
      }
    } catch (err) {
      showToast('Erro de comunicação com o servidor.', 'danger');
    }
  };

  // Admin: Rejeitar subscrição
  const handleRejectSubscription = async (subId: string) => {
    const reason = window.prompt('Informe o motivo da recusa do comprovativo:');
    if (!reason) return;

    try {
      const res = await fetch(`/api/subscriptions/${subId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        showToast('Subscrição rejeitada e cliente notificado.', 'warning');
        await loadSubscriptions();
      }
    } catch (err) {
      showToast('Erro ao rejeitar solicitação.', 'danger');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-[#00E5FF] uppercase tracking-wider font-mono">
              Planos & Subscrições Oficiais
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display flex items-center gap-2.5">
            <Crown className="w-7 h-7 text-[#00E5FF]" />
            Subscrição SaaS & Telas
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
            Escolha o plano ideal para a capacidade de displays e totens da sua organização. O contrato comercial é emitido automaticamente com vigência oficial de 12 meses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadSubscriptions}
            disabled={loading}
            className="text-xs border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar Status
          </Button>
        </div>
      </div>

      {/* ── SEÇÃO DO ADMIN: Solicitações de Subscrição com Comprovativo para Aprovação ── */}
      {isNexoraAdmin && (
        <div className="bg-[#0B101E]/90 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Painel de Aprovação de Subscrições (Administrador)
                </h3>
                <p className="text-xs text-slate-400">
                  Valide os comprovativos bancários enviados pelos clientes para ativar o plano e gerar o contrato automaticamente.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
              {pendingRequests.length} Aguardando Validação
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-white/5 rounded-2xl bg-slate-900/40">
              Nenhuma solicitação de subscrição pendente de aprovação no momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-white/10">
                  <tr>
                    <th className="p-3">Organização ID</th>
                    <th className="p-3">Plano</th>
                    <th className="p-3">Valor</th>
                    <th className="p-3">Data</th>
                    <th className="p-3">Comprovativo</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {pendingRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-medium text-white">{req.organization_id}</td>
                      <td className="p-3 font-bold text-cyan-400">{req.plan_name || req.plan_id}</td>
                      <td className="p-3 font-mono text-emerald-400">{formatKz(parseFloat(req.amount_kz))}</td>
                      <td className="p-3 text-slate-400">{new Date(req.created_at).toLocaleDateString('pt-AO')}</td>
                      <td className="p-3">
                        {req.proof_url ? (
                          <button
                            onClick={() => setActiveProofModal(req.proof_url)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold hover:bg-cyan-500/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver Comprovativo
                          </button>
                        ) : (
                          <span className="text-slate-500 italic">Sem anexo</span>
                        )}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => handleApproveSubscription(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all"
                        >
                          Aprovar Plano & Gerar Contrato
                        </button>
                        <button
                          onClick={() => handleRejectSubscription(req.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-bold cursor-pointer transition-all"
                        >
                          Recusar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── STATUS DA SUBSCRIÇÃO DA ORGANIZAÇÃO ATUAL ── */}
      {myOrgSub && (
        <div className="bg-[#0B101E]/80 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider font-mono border ${
                    myOrgSub.status === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : myOrgSub.status === 'PENDING_APPROVAL'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border-white/10'
                  }`}
                >
                  {myOrgSub.status === 'ACTIVE'
                    ? '● Plano Ativo'
                    : myOrgSub.status === 'PENDING_APPROVAL'
                    ? '⏳ Em Análise pelo Financeiro'
                    : myOrgSub.status}
                </span>
                <span className="text-xs text-slate-400">
                  Organização: <strong>{currentOrganization?.name}</strong>
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">
                {myOrgSub.plan_name || 'Subscrição Contratada'}
              </h2>
              <p className="text-xs text-slate-400">
                {myOrgSub.status === 'PENDING_APPROVAL'
                  ? 'O seu comprovativo bancário foi recebido e está em validação. Logo que for aprovado, seu contrato será gerado e as telas ativadas.'
                  : 'Sua subscrição está ativa com capacidade de telas e geração de mídia por IA liberada.'}
              </p>
            </div>

            {myOrgSub.proof_url && (
              <button
                onClick={() => setActiveProofModal(myOrgSub.proof_url)}
                className="px-4 py-2 rounded-xl bg-slate-900 border border-white/10 text-cyan-400 text-xs font-bold hover:bg-slate-800 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <FileText className="w-4 h-4" />
                <span>Ver Comprovativo Enviado</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 3 PLANOS OFICIAIS EXIBIDOS NO PAINEL DO CLIENTE ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#00E5FF]" />
            Catálogo de Planos Oficiais Nexora
          </h2>
          <p className="text-xs text-slate-400">
            Selecione o plano desejado para iniciar o processo de subscrição e ativação da sua rede de telas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {mockPlans.map((plan) => {
            const isCurrentActive = myOrgSub?.plan_id === plan.id && myOrgSub?.status === 'ACTIVE';
            const isCurrentPending = myOrgSub?.plan_id === plan.id && myOrgSub?.status === 'PENDING_APPROVAL';

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-[#0B152A] via-[#081020] to-[#060B16] border-[#00E5FF]/60 shadow-[0_0_35px_rgba(0,229,255,0.2)] ring-1 ring-[#00E5FF]/30 -translate-y-1'
                    : 'bg-[#0A0F1D]/80 border-white/10 hover:border-white/20 shadow-xl'
                }`}
              >
                {/* Popular Badge */}
                {plan.badgeText && (
                  <div className="absolute top-4 right-5">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase font-mono tracking-wider border shadow-sm ${
                        plan.isPopular
                          ? 'bg-[#00E5FF] text-slate-950 border-[#00E5FF]'
                          : 'bg-white/10 text-white border-white/20'
                      }`}
                    >
                      {plan.badgeText}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-white font-display">{plan.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price Block */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                        {formatKz(plan.basePrice)}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ mês</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Vigência contratual de 12 meses</p>
                  </div>

                  {/* Key Limits Specs */}
                  <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-white/10 text-xs">
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <Tv className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400">Displays</p>
                        <p className="font-bold text-white">Até {plan.displayLimit} Telas</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400">Creative IA</p>
                        <p className="font-bold text-white">{plan.monthlyAiCredits} Créditos/mês</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400">Armazenamento</p>
                        <p className="font-bold text-white">{plan.storageLimitGB} GB Cloud</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5">
                      <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-slate-400">Utilizadores</p>
                        <p className="font-bold text-white">{plan.teamMemberLimit} Acessos</p>
                      </div>
                    </div>
                  </div>

                  {/* Feature Checklist */}
                  <div className="space-y-2 pt-1 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Transmissão remota em tempo real</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Agendamento inteligente & playlists</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Geração de imagens publicitárias com IA</span>
                    </div>
                    {plan.features.aiVideoGeneration && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>Geração de vídeos publicitários com IA</span>
                      </div>
                    )}
                    {plan.features.prioritySupport && (
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Suporte técnico prioritário 24/7</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Emissão e assinatura de contrato digital</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Action Button */}
                <div className="pt-6">
                  {isCurrentActive ? (
                    <div className="w-full py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-center font-bold text-xs">
                      ✓ Seu Plano Atual Ativo
                    </div>
                  ) : isCurrentPending ? (
                    <div className="w-full py-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-center font-bold text-xs">
                      ⏳ Pagamento em Validação
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedPlanForPurchase(plan)}
                      className={`w-full py-3.5 px-4 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 uppercase font-display tracking-wider ${
                        plan.isPopular
                          ? 'bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#00E5FF]/90 hover:to-blue-600/90 text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.3)]'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                      }`}
                    >
                      <Crown className="w-4 h-4" />
                      <span>Subscrever {plan.name.split(' ')[1]}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── MODAL DE COMPRA / SUBSCRIÇÃO COM DADOS BANCÁRIOS E COMPROVATIVO ── */}
      {selectedPlanForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-[#0B101E] border border-white/15 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-100 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF]">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">
                    Processo de Subscrição — {selectedPlanForPurchase.name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Efetue a transferência e anexe o comprovativo para liberação e geração do contrato.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPlanForPurchase(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo do Plano */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Plano Selecionado:</p>
                <p className="text-sm font-bold text-white">{selectedPlanForPurchase.name}</p>
                <p className="text-xs text-cyan-400">
                  Capacidade: {selectedPlanForPurchase.displayLimit} Telas | {selectedPlanForPurchase.storageLimitGB} GB Cloud
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Valor Mensal:</p>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  {formatKz(selectedPlanForPurchase.basePrice)}
                </p>
              </div>
            </div>

            {/* Coordenadas Bancárias — EXACTAMENTE as mesmas do painel do
                anunciante (pagamento de campanha). Fonte única: NEXORA_BANKING. */}
            <div className="p-4 rounded-2xl bg-[#070D1E] border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 uppercase font-mono flex items-center gap-1.5">
                  <Building className="w-4 h-4" /> Coordenadas Bancárias Oficiais (Angola)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Moeda: {nexoraBanking.currency}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-slate-400">Beneficiário:</p>
                  <p className="font-bold text-white">{nexoraBanking.beneficiary}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-slate-400">Banco:</p>
                  <p className="font-bold text-white">{nexoraBanking.bankName}</p>
                </div>
                <div className="sm:col-span-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-slate-400">IBAN:</p>
                  <p className="font-mono font-bold text-cyan-300 select-all">
                    {nexoraBanking.iban}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-slate-400">Referência Multicaixa:</p>
                  <p className="font-mono font-bold text-amber-300">{nexoraBanking.multicaixaReference}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <p className="text-[10px] text-slate-400">Entidade:</p>
                  <p className="font-mono font-bold text-white">{nexoraBanking.entity}</p>
                </div>
              </div>
            </div>

            {/* Campo de Upload do Comprovativo */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                Anexar Comprovativo de Transferência Bancária *
              </label>

              <div className="border-2 border-dashed border-white/15 rounded-2xl p-5 text-center hover:border-cyan-400/50 transition-colors">
                {proofFile ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{proofFileName || 'Comprovativo anexado'}</span>
                    </div>

                    {proofFile.startsWith('data:image') && (
                      <div className="max-h-40 overflow-hidden rounded-xl border border-white/10 mx-auto max-w-xs">
                        <img src={proofFile} alt="Preview do Comprovativo" className="w-full object-contain" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        setProofFileName('');
                      }}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Remover e escolher outro arquivo
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-300 font-medium">
                      Clique para selecionar ou arraste o ficheiro
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Formatos aceites: Imagem (PNG, JPG) ou PDF (até 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Notas adicionais */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Observações ou Referência Bancária (Opcional)
              </label>
              <input
                type="text"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="ex: Transferência via BAI Directo em nome da empresa"
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlanForPurchase(null)}
                className="text-xs"
              >
                Cancelar
              </Button>

              <button
                type="button"
                disabled={!proofFile || isSubmitting}
                onClick={handleConfirmPurchase}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#00E5FF]/90 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>A enviar comprovativo...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Pagamento & Submeter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE VISUALIZAÇÃO DE COMPROVATIVO ── */}
      {activeProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00E5FF]" />
                Comprovativo de Transferência Bancária
              </h4>
              <button
                onClick={() => setActiveProofModal(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-800 bg-black/50 p-2 flex items-center justify-center">
              {activeProofModal.startsWith('data:image') ? (
                <img
                  src={activeProofModal}
                  alt="Comprovativo"
                  className="max-h-[65vh] object-contain mx-auto"
                />
              ) : (
                <div className="p-8 text-center text-slate-300 space-y-3">
                  <FileText className="w-12 h-12 text-[#00E5FF] mx-auto" />
                  <p className="text-xs">Documento de Comprovativo em anexo.</p>
                  <a
                    href={activeProofModal}
                    download="comprovativo-pagamento"
                    className="inline-block px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    Baixar Documento
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
