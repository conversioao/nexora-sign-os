import React, { useEffect, useState, useMemo } from 'react';
import {
  Monitor,
  Sparkles,
  Zap,
  Film,
  ListVideo,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Plus,
  RefreshCw,
  HardDrive,
  Coins,
  ShieldCheck,
  Play,
  RotateCw,
  Radio,
  ExternalLink,
  Crown,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon,
  Video,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { NexoraService } from '../../../services';
import { Display, ContentItem, Playlist, Schedule } from '../../../types/domain';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  useToast,
} from '../../../components/ui';
import { NEXORA_BANKING, useNexoraBanking } from '../../../config/nexoraBanking';
import { DashboardKpiCard } from '../components/DashboardKpiCard';
import { DashboardSection } from '../components/DashboardSection';

export interface DisplayOwnerDashboardViewProps {
  onNavigateToDisplay?: (displayId: string) => void;
  onNavigateToDisplaysList?: () => void;
  onNavigateToContent?: () => void;
  onNavigateToPlaylist?: () => void;
  onNavigateToSchedule?: () => void;
  onNavigateToScheduleDetail?: (id: string) => void;
  onNavigateToAICredits?: () => void;
  onNavigateToStudioAI?: () => void;
  onNavigateToBilling?: () => void;
  onSwitchToCreativePlatform?: () => void;
}

export interface SubscriptionInfo {
  planId: string;
  planName: string;
  status: 'trialing' | 'active' | 'expired' | 'canceled' | 'pending_approval' | 'PENDING_APPROVAL';
  displayLimit: number;
  displaysUsed: number;
  trialDaysLeft: number;
  monthlyAiCredits: number;
  priceMonthlyKz: number;
  startDate: string;
  endDate?: string;
  pendingPlan?: {
    id?: string;
    planId: string;
    planName: string;
    amountKz: number;
    status: string;
    createdAt?: string;
  } | null;
}

export const DisplayOwnerDashboardView: React.FC<DisplayOwnerDashboardViewProps> = ({
  onNavigateToDisplay,
  onNavigateToDisplaysList,
  onNavigateToContent,
  onNavigateToPlaylist,
  onNavigateToSchedule,
  onNavigateToAICredits,
  onNavigateToStudioAI,
  onNavigateToBilling,
  onSwitchToCreativePlatform,
}) => {
  const { currentOrganization, currentUser } = useSession();
  const { showToast } = useToast();
  const { banking: nexoraBanking } = useNexoraBanking();

  const [loading, setLoading] = useState(true);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [aiCreditsBalance, setAiCreditsBalance] = useState<number>(150);

  // Subscrição & Limites
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    planId: 'plan-trial-15d',
    planName: 'Nexora Display Trial (15 Dias Grátis)',
    status: 'trialing',
    displayLimit: 1,
    displaysUsed: 0,
    trialDaysLeft: 15,
    monthlyAiCredits: 150,
    priceMonthlyKz: 0,
    startDate: new Date().toISOString(),
  });

  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showLimitReachedModal, setShowLimitReachedModal] = useState(false);
  const [subscribingPlanId, setSubscribingPlanId] = useState<string | null>(null);

  const orgId = currentOrganization?.id || '';

  // Dynamic greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Carregar subscrição
      if (orgId) {
        try {
          const res = await fetch(`/api/saas/my-subscription?organizationId=${encodeURIComponent(orgId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.planId) {
              setSubscription(data);
            }
          }
        } catch {
          // Mantém valor inicial
        }

        // 2. Carregar créditos IA
        try {
          const creditsRes = await fetch(`/api/ai-credits/balance?organizationId=${encodeURIComponent(orgId)}`);
          if (creditsRes.ok) {
            const creditsData = await creditsRes.json();
            if (creditsData?.balance !== undefined) {
              setAiCreditsBalance(creditsData.balance);
            }
          }
        } catch {
          // Fallback
        }
      }

      // 3. Displays, Playlists, Conteúdos
      const [displayList, contentList, playlistList, scheduleList] = await Promise.all([
        NexoraService.displays.getAll({ organizationId: orgId }).catch(() => []),
        NexoraService.contents.getAll({ organizationId: orgId }).catch(() => []),
        NexoraService.playlists.getAll({ organizationId: orgId }).catch(() => []),
        NexoraService.schedules.getAll({ organizationId: orgId }).catch(() => []),
      ]);

      setDisplays(displayList || []);
      setContents(contentList || []);
      setPlaylists(playlistList || []);
      setSchedules(scheduleList || []);

      // Atualiza displays usados no state
      setSubscription((prev) => ({
        ...prev,
        displaysUsed: (displayList || []).length,
      }));
    } catch (err: any) {
      console.error('Erro ao carregar dados do painel do cliente display:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  const onlineDisplaysCount = useMemo(
    () => displays.filter((d) => d.status === 'ONLINE').length,
    [displays]
  );

  const displayUsagePercent = useMemo(() => {
    if (!subscription.displayLimit || subscription.displayLimit <= 0) return 0;
    return Math.min(100, Math.round((displays.length / subscription.displayLimit) * 100));
  }, [displays.length, subscription.displayLimit]);

  const handleAddNewDisplay = () => {
    if (displays.length >= subscription.displayLimit) {
      setShowLimitReachedModal(true);
      return;
    }
    if (onNavigateToDisplaysList) {
      onNavigateToDisplaysList();
    }
  };

  // Estado para compra de plano com comprovativo e coordenadas bancárias
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] = useState<{
    id: string;
    name: string;
    displayLimit: number;
    priceKz: number;
    monthlyAiCredits: number;
  } | null>(null);
  const [proofFile, setProofFile] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string>('');
  const [purchaseNotes, setPurchaseNotes] = useState<string>('');
  const [isSubmittingPurchase, setIsSubmittingPurchase] = useState<boolean>(false);

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleOpenPlanPurchase = (plan: { id: string; name: string; displayLimit: number; priceKz: number; monthlyAiCredits: number }) => {
    setSelectedPlanForPurchase(plan);
    setProofFile(null);
    setProofFileName('');
    setPurchaseNotes('');
  };

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleConfirmPlanPurchase = async () => {
    if (!selectedPlanForPurchase) return;
    if (!proofFile) {
      showToast('Por favor, anexe o comprovativo de transferência bancária.', 'danger');
      return;
    }

    setIsSubmittingPurchase(true);
    try {
      // 1ª tentativa: endpoint oficial de solicitação de compra com comprovativo
      let res = await fetch('/api/subscriptions/purchase-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: orgId,
          organizationName: currentOrganization?.name || 'Cliente Nexora',
          planId: selectedPlanForPurchase.id,
          planName: selectedPlanForPurchase.name,
          amountKz: selectedPlanForPurchase.priceKz,
          proofUrl: proofFile,
          notes: purchaseNotes,
        }),
      });

      // 2ª tentativa se 404: /api/saas/subscribe
      if (!res.ok && res.status === 404) {
        res = await fetch('/api/saas/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: orgId,
            planId: selectedPlanForPurchase.id,
            planName: selectedPlanForPurchase.name,
            amountKz: selectedPlanForPurchase.priceKz,
            proofUrl: proofFile,
            notes: purchaseNotes,
          }),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Falha ao processar solicitação de subscrição.');
      }

      // Registra a solicitação como pendente de aprovação
      setSubscription((prev) => ({
        ...prev,
        pendingPlan: {
          planId: selectedPlanForPurchase.id,
          planName: selectedPlanForPurchase.name,
          amountKz: selectedPlanForPurchase.priceKz,
          status: 'PENDING_APPROVAL',
        },
      }));

      showToast(
        'Comprovativo enviado com sucesso! O plano será ativado após validação do Administrador.',
        'success'
      );
      setSelectedPlanForPurchase(null);
      setShowPlanModal(false);
      setShowLimitReachedModal(false);
      setProofFile(null);
      setProofFileName('');
      setPurchaseNotes('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao enviar comprovativo de pagamento.', 'danger');
    } finally {
      setIsSubmittingPurchase(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    if (planId === 'plan-display-starter') {
      handleOpenPlanPurchase({
        id: 'plan-display-starter',
        name: 'Starter Display',
        displayLimit: 1,
        priceKz: 25000,
        monthlyAiCredits: 300,
      });
    } else if (planId === 'plan-display-business') {
      handleOpenPlanPurchase({
        id: 'plan-display-business',
        name: 'Business Pro',
        displayLimit: 3,
        priceKz: 65000,
        monthlyAiCredits: 800,
      });
    } else if (planId === 'plan-display-pro') {
      handleOpenPlanPurchase({
        id: 'plan-display-pro',
        name: 'Network Prime',
        displayLimit: 10,
        priceKz: 180000,
        monthlyAiCredits: 2500,
      });
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* ─── Header Principal ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/25 font-mono uppercase tracking-wider flex items-center gap-1">
              <Monitor className="w-3 h-3" /> Painel do Cliente · Display Nexora
            </span>
            {subscription.status === 'trialing' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-mono uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> 15 Dias de Degustação Gratuita
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/25 font-mono uppercase tracking-wider">
                {subscription.planName}
              </span>
            )}
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white font-display tracking-tight flex items-center gap-2">
            {greeting}, {currentUser?.name?.split(' ')[0] || 'Cliente'}!
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Gestão unificada dos seus displays, transmissão de mídias e criação com inteligência artificial para o seu negócio.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs border-white/10 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowPlanModal(true)}
            className="text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold border-none shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <Crown className="w-3.5 h-3.5 mr-1.5" />
            Planos de Subscrição
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAddNewDisplay}
            className="text-xs bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#00c2d6] hover:to-blue-700 text-black font-bold border-none shadow-[0_0_20px_rgba(0,229,255,0.3)]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Adicionar Display
          </Button>
        </div>
      </div>

      {/* ─── BANNER ALERTA: SUBSCRIÇÃO PENDENTE DE VALIDAÇÃO PELO ADMIN ─── */}
      {subscription.pendingPlan && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/60 p-4.5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/30 text-lg">
              ⏳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-amber-200">
                  Subscrição do {subscription.pendingPlan.planName} em Análise
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Aguardando Aprovação do Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                O seu comprovativo bancário foi recebido e está a ser conferido pela nossa equipa administrativa. As suas novas telas e créditos de IA serão liberados logo após a aprovação oficial.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPlanModal(true)}
            className="text-xs border-amber-500/40 text-amber-300 hover:bg-amber-500/20 shrink-0"
          >
            Ver Planos
          </Button>
        </div>
      )}

      {/* ─── BANNER 1: TRIAL & CAPACIDADE DE DISPLAYS DO PLANO ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-r from-[#071326] via-[#091D3E] to-[#0A162B] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00E5FF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/30">
                PLANO ATIVO: {subscription.planName}
              </span>
              {subscription.status === 'trialing' && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  ⏳ Restam {subscription.trialDaysLeft} dias de teste grátis
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white font-display">
              {subscription.status === 'trialing'
                ? 'Aproveite os seus 15 Dias de Degustação Grátis!'
                : 'A sua Subscrição de Displays está ativa e operacional'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O seu plano permite até <strong>{subscription.displayLimit} {subscription.displayLimit === 1 ? 'display ativo' : 'displays ativos'}</strong> simultâneos.
              Crie campanhas e exiba os seus menus, promoções e comunicados instantaneamente em cada ponto.
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-md rounded-xl p-4 border border-white/10 min-w-[280px] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                <Monitor className="w-3.5 h-3.5 text-[#00E5FF]" /> Displays em Uso
              </span>
              <span className="text-white font-bold font-mono">
                {displays.length} / {subscription.displayLimit} {displays.length >= subscription.displayLimit ? '(Limite atingido)' : ''}
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-white/5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  displayUsagePercent >= 100
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                    : 'bg-gradient-to-r from-[#00E5FF] to-blue-500'
                }`}
                style={{ width: `${Math.max(5, displayUsagePercent)}%` }}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">
                {subscription.displayLimit - displays.length > 0
                  ? `Disponível: ${subscription.displayLimit - displays.length} display(s)`
                  : 'Nenhum slot livre'}
              </span>
              <button
                onClick={() => setShowPlanModal(true)}
                className="text-[11px] font-bold text-[#00E5FF] hover:underline flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
              >
                Expandir Limite <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BANNER 2: NEXORA CREATIVE AI INTEGRADO ─── */}
      <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-gradient-to-r from-[#170C2D] via-[#120B24] to-[#0A0717] p-5 shadow-[0_10px_35px_rgba(124,58,237,0.2)]">
        <div className="absolute -top-10 -right-10 w-60 h-60 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-[#C084FC] border border-purple-500/40 flex items-center gap-1.5 font-mono">
                <Sparkles className="w-3 h-3 text-[#C084FC]" /> NEXORA CREATIVE AI
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Pronto para Criar
              </span>
            </div>
            <h3 className="text-lg font-bold text-white font-display">
              Gere Vídeos e Banners Publicitários com IA para o seu Display
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Não precisa de designer: o <strong>Nexora Creative AI</strong> cria imagens profissionais, vídeos verticais para totens e animações promocionais automaticamente a partir do seu texto.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-purple-950/40 border border-purple-500/30 rounded-xl px-4 py-3 text-center sm:text-left">
              <span className="text-[10px] uppercase font-mono text-slate-400 block">Saldo de Créditos IA</span>
              <span className="text-xl font-extrabold text-white font-mono flex items-center justify-center sm:justify-start gap-1.5">
                <Coins className="w-4 h-4 text-amber-400" /> {aiCreditsBalance}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToStudioAI || onSwitchToCreativePlatform}
                className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold border-none shadow-[0_0_20px_rgba(124,58,237,0.4)] whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-300" />
                Criar com IA Agora
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={onNavigateToAICredits}
                className="text-xs border-purple-500/30 text-purple-200 hover:bg-purple-900/30"
              >
                Recarregar Créditos
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── KPIS PRINCIPAIS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardKpiCard
          label="Displays Ativos"
          value={`${displays.length} / ${subscription.displayLimit}`}
          subValue={`${onlineDisplaysCount} online agora`}
          icon={Monitor}
          variant={onlineDisplaysCount > 0 ? 'cyan' : 'amber'}
        />

        <DashboardKpiCard
          label="Status da Rede"
          value={displays.length === 0 ? '0%' : `${Math.round((onlineDisplaysCount / Math.max(1, displays.length)) * 100)}%`}
          subValue={onlineDisplaysCount === displays.length && displays.length > 0 ? 'Operação 100% Estável' : 'Requer Atenção'}
          icon={Radio}
          variant={onlineDisplaysCount > 0 ? 'emerald' : 'neutral'}
        />

        <DashboardKpiCard
          label="Playlists & Mídias"
          value={`${playlists.length} Playlists`}
          subValue={`${contents.length} ficheiros na biblioteca`}
          icon={ListVideo}
          variant="purple"
        />

        <DashboardKpiCard
          label="Créditos Creative AI"
          value={`${aiCreditsBalance} Créditos`}
          subValue="Geração de imagens e vídeos"
          icon={Sparkles}
          variant="amber"
        />
      </div>

      {/* ─── SEÇÃO MEUS DISPLAYS & TOTENS ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#00E5FF]" /> Meus Displays Conectados
            </h2>
            <p className="text-xs text-slate-400">
              Controle remoto, status em tempo real e playlists ativas em cada tela.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {displays.length < subscription.displayLimit ? (
              <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
                ✓ Pode adicionar mais {subscription.displayLimit - displays.length} display(s)
              </span>
            ) : (
              <span className="text-[11px] text-amber-400 font-mono hidden sm:inline">
                ⚠️ Limite do plano atingido
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAddNewDisplay}
              className="text-xs border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/10"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Novo Display
            </Button>
          </div>
        </div>

        {displays.length === 0 ? (
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF] flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,229,255,0.2)]">
              <Monitor className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-white">Nenhum Display Conectado Ainda</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Emparelhe o seu primeiro totem ou tela usando o aplicativo Nexora Player para começar a transmitir os seus conteúdos.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddNewDisplay}
              className="text-xs bg-gradient-to-r from-[#00E5FF] to-blue-600 text-black font-bold border-none"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Conectar Primeiro Display
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displays.map((disp) => {
              const isOnline = disp.status === 'ONLINE';
              return (
                <div
                  key={disp.id}
                  className="bg-[#0B101E] border border-white/10 rounded-2xl p-4.5 hover:border-[#00E5FF]/40 transition-all group flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isOnline
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                              : 'bg-slate-800 border border-white/10 text-slate-500'
                          }`}
                        >
                          <Monitor className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-[#00E5FF] transition-colors line-clamp-1">
                            {disp.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {disp.orientation || 'LANDSCAPE'} • {disp.resolution || '1920x1080'}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 ${
                          isOnline
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 animate-pulse'
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Localização:</span>
                        <span className="text-slate-200 font-medium truncate max-w-[150px]">
                          {disp.location?.venueName || disp.location?.address || 'Ponto Comercial'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Playlist Ativa:</span>
                        <span className="text-cyan-400 font-medium truncate max-w-[150px]">
                          {disp.currentPlaylist || 'Playlist Padrão'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Última Conexão:</span>
                        <span className="text-slate-300 font-mono text-[10px]">
                          {disp.lastSyncAt || 'Recentemente'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-2 mt-4">
                    <button
                      onClick={() => onNavigateToDisplay && onNavigateToDisplay(disp.id)}
                      className="text-xs font-semibold text-[#00E5FF] hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                    >
                      Gerir Tela <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onNavigateToPlaylist}
                        className="text-[10px] h-7 px-2 border-white/10 text-slate-300"
                        title="Trocar Conteúdo"
                      >
                        <ListVideo className="w-3 h-3 mr-1" />
                        Playlists
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── ATALHOS RÁPIDOS PARA CRIAÇÃO E CONTEÚDO ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Criar Imagem com IA */}
        <div
          onClick={onNavigateToStudioAI || onSwitchToCreativePlatform}
          className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/30 to-[#0A0D18] border border-purple-500/20 hover:border-purple-500/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
              Gerador de Criativos IA
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Crie fotos de produtos, menus e promoções para colocar direto nas suas playlists.
            </p>
          </div>
          <span className="text-[11px] font-bold text-purple-400 group-hover:underline flex items-center gap-1">
            Criar Imagem com IA →
          </span>
        </div>

        {/* Card 2: Gerar Vídeo com IA */}
        <div
          onClick={onNavigateToStudioAI || onSwitchToCreativePlatform}
          className="p-5 rounded-2xl bg-gradient-to-br from-blue-950/30 to-[#0A0D18] border border-blue-500/20 hover:border-blue-500/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
            <Video className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
              Vídeos Publicitários em Vídeo IA
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vídeos em formato vertical e horizontal de 15 a 30 segundos prontos para totens.
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-400 group-hover:underline flex items-center gap-1">
            Gerar Vídeo Promocional →
          </span>
        </div>

        {/* Card 3: Gestão de Programação */}
        <div
          onClick={onNavigateToSchedule}
          className="p-5 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-[#0A0D18] border border-[#00E5FF]/20 hover:border-[#00E5FF]/40 transition-all cursor-pointer group space-y-3"
        >
          <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/20 border border-[#00E5FF]/30 text-[#00E5FF] flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white group-hover:text-[#00E5FF] transition-colors">
              Agendamento por Horários
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Programe o que passa no almoço, jantar ou finais de semana nos seus displays.
            </p>
          </div>
          <span className="text-[11px] font-bold text-[#00E5FF] group-hover:underline flex items-center gap-1">
            Configurar Horários →
          </span>
        </div>
      </div>

      {/* ─── MODAL: SELEÇÃO E UPGRADE DE PLANOS DE SUBSCRIÇÃO ─── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0B101E] border border-white/15 rounded-3xl max-w-4xl w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto relative shadow-[0_25px_70px_rgba(0,0,0,0.8)]">
            <button
              onClick={() => setShowPlanModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2 max-w-lg mx-auto">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 font-mono uppercase tracking-wider">
                Planos de Subscrição de Software
              </span>
              <h3 className="text-2xl font-extrabold text-white font-display">
                Escolha o Plano Ideal para os seus Displays
              </h3>
              <p className="text-xs text-slate-400">
                Planos flexíveis dimensionados para o número de telas do seu estabelecimento, com créditos de criação do Nexora Creative AI inclusos.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* PLANO 1: Starter */}
              <div
                className={`rounded-2xl p-5 border flex flex-col justify-between relative transition-all ${
                  subscription.planId === 'plan-display-starter'
                    ? 'border-[#00E5FF] bg-[#00E5FF]/5 ring-2 ring-[#00E5FF]/30'
                    : 'border-white/10 bg-slate-900/40 hover:border-white/20'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">1 Display</span>
                    <h4 className="text-base font-bold text-white mt-1">Starter Display</h4>
                    <p className="text-[11px] text-slate-400 leading-snug mt-1">
                      Ideal para recepções, cafés, consultórios e pequenas lojas.
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-2xl font-extrabold text-white font-mono">25.000 Kz</span>
                    <span className="text-xs text-slate-400"> / mês</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span><strong>1 Display Conectado</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>300 Créditos Creative AI/mês</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Playlists & Horários em Nuvem</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>20 GB de Armazenamento</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-5">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={subscribingPlanId === 'plan-display-starter' || subscription.planId === 'plan-display-starter'}
                    onClick={() => handleSelectPlan('plan-display-starter')}
                    className="w-full text-xs font-bold"
                  >
                    {subscription.planId === 'plan-display-starter' ? 'Plano Atual' : 'Selecionar Plano'}
                  </Button>
                </div>
              </div>

              {/* PLANO 2: Business Pro (Popular) */}
              <div
                className={`rounded-2xl p-5 border flex flex-col justify-between relative transition-all ${
                  subscription.planId === 'plan-display-business'
                    ? 'border-[#00E5FF] bg-[#00E5FF]/10 ring-2 ring-[#00E5FF]/40 shadow-[0_0_30px_rgba(0,229,255,0.2)]'
                    : 'border-cyan-500/40 bg-gradient-to-b from-cyan-950/20 to-slate-900/60 shadow-[0_0_20px_rgba(0,229,255,0.1)]'
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-[#00E5FF] to-blue-500 text-black font-mono uppercase tracking-wider">
                  Mais Popular
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-[#00E5FF] font-bold uppercase">Até 3 Displays</span>
                    <h4 className="text-base font-bold text-white mt-1">Business Pro</h4>
                    <p className="text-[11px] text-slate-300 leading-snug mt-1">
                      Para restaurantes (Menu Boards), clínicas e lojas com múltiplas telas.
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-2xl font-extrabold text-white font-mono">65.000 Kz</span>
                    <span className="text-xs text-slate-400"> / mês</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-200 pt-2 border-t border-white/10">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span><strong>Até 3 Displays Conectados</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span><strong>800 Créditos Creative AI/mês</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Sincronização Simultânea de Telas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>50 GB de Armazenamento</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0" />
                      <span>Suporte Técnico Prioritário</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-5">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={subscribingPlanId === 'plan-display-business' || subscription.planId === 'plan-display-business'}
                    onClick={() => handleSelectPlan('plan-display-business')}
                    className="w-full text-xs font-bold bg-[#00E5FF] hover:bg-[#00c2d6] text-black border-none"
                  >
                    {subscription.planId === 'plan-display-business' ? 'Plano Atual' : 'Assinar Business Pro'}
                  </Button>
                </div>
              </div>

              {/* PLANO 3: Network Prime */}
              <div
                className={`rounded-2xl p-5 border flex flex-col justify-between relative transition-all ${
                  subscription.planId === 'plan-display-pro'
                    ? 'border-purple-500 bg-purple-950/20 ring-2 ring-purple-500/30'
                    : 'border-white/10 bg-slate-900/40 hover:border-white/20'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-purple-400 font-bold uppercase">Até 10 Displays</span>
                    <h4 className="text-base font-bold text-white mt-1">Network Prime</h4>
                    <p className="text-[11px] text-slate-400 leading-snug mt-1">
                      Para redes de lojas, franquias, supermercados e centros comerciais.
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-2xl font-extrabold text-white font-mono">180.000 Kz</span>
                    <span className="text-xs text-slate-400"> / mês</span>
                  </div>

                  <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-white/5">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span><strong>Até 10 Displays Conectados</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span><strong>2.500 Créditos Creative AI/mês</strong></span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>150 GB de Armazenamento</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>Gestão Multi-local / Filiais</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>SLA e Atendimento VIP</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-5">
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={subscribingPlanId === 'plan-display-pro' || subscription.planId === 'plan-display-pro'}
                    onClick={() => handleSelectPlan('plan-display-pro')}
                    className="w-full text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-none"
                  >
                    {subscription.planId === 'plan-display-pro' ? 'Plano Atual' : 'Assinar Network'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#00E5FF]" /> Pagamentos via Multicaixa Express, Transferência e Cartão em Kwanzas (AOA).
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Faturação com NIF de Angola
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: LIMITE DE DISPLAYS ATINGIDO ─── */}
      {showLimitReachedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0D1322] border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-5 shadow-[0_20px_50px_rgba(245,158,11,0.2)]">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white font-display">
                Limite de Displays Atingido
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                O seu plano atual (<strong>{subscription.planName}</strong>) permite até <strong>{subscription.displayLimit} display(s)</strong> ativos e você já atingiu esta capacidade ({displays.length}/{subscription.displayLimit}).
              </p>
              <p className="text-xs text-slate-400">
                Faça upgrade do seu plano para liberar mais displays para o seu negócio!
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLimitReachedModal(false)}
                className="flex-1 text-xs border-white/10 text-slate-400"
              >
                Voltar
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowLimitReachedModal(false);
                  setShowPlanModal(true);
                }}
                className="flex-1 text-xs font-bold bg-[#00E5FF] hover:bg-[#00c2d6] text-black border-none"
              >
                Fazer Upgrade Agora
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PAGAMENTO & COORDENADAS BANCÁRIAS (CONFORME PAINEL DO ANUNCIANTE) ─── */}
      {selectedPlanForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0C1222] border border-cyan-500/40 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-[0_25px_60px_rgba(0,229,255,0.2)] max-h-[90vh] overflow-y-auto nexora-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Subscrição de Plano · Pagamento
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Transfira para as coordenadas oficiais da Nexora e anexe o comprovativo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlanForPurchase(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumo do Plano Selecionado */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Plano Selecionado:</p>
                <p className="text-sm font-bold text-white">{selectedPlanForPurchase.name}</p>
                <p className="text-xs text-cyan-400">
                  Capacidade: {selectedPlanForPurchase.displayLimit} Display(s) | {selectedPlanForPurchase.monthlyAiCredits} Créditos Creative AI
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400">Valor Mensal:</p>
                <p className="text-xl font-black text-emerald-400 font-mono">
                  {formatKz(selectedPlanForPurchase.priceKz)}
                </p>
              </div>
            </div>

            {/* Coordenadas Bancárias — EXACTAMENTE CONFORME NO PAINEL DO ANUNCIANTE */}
            <div className="rounded-xl bg-slate-950 p-4 border border-cyan-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-cyan-400" /> Dados para Transferência & Liquidação:
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Moeda: {nexoraBanking.currency}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                <div>
                  <span className="text-slate-500">Beneficiário:</span> <strong className="text-white">{nexoraBanking.beneficiary}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Banco:</span> <strong className="text-white">{nexoraBanking.bankName}</strong>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-500">IBAN:</span> <strong className="text-[#38BDF8] font-mono select-all">{nexoraBanking.iban}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Referência Multicaixa:</span> <strong className="text-amber-400 font-mono">{nexoraBanking.multicaixaReference}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Entidade:</span> <strong className="text-white font-mono">{nexoraBanking.entity}</strong>
                </div>
              </div>
            </div>

            {/* Upload Obrigatório do Comprovativo de Pagamento */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-white flex items-center justify-between">
                <span>Anexar Comprovativo de Pagamento *</span>
                {proofFile && <span className="text-emerald-400 font-semibold text-xs">✓ Anexado com Sucesso</span>}
              </label>

              <div className="border-2 border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-cyan-400/50 transition-colors bg-white/[0.02]">
                {proofFile ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{proofFileName || 'Comprovativo anexado'}</span>
                    </div>

                    {proofFile.startsWith('data:image') && (
                      <div className="max-h-32 overflow-hidden rounded-xl border border-white/10 mx-auto max-w-xs">
                        <img src={proofFile} alt="Preview do Comprovativo" className="w-full object-contain max-h-32" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setProofFile(null);
                        setProofFileName('');
                      }}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Remover e escolher outro arquivo
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block py-2">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto mb-2">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-cyan-400 block">
                      Clique para selecionar o comprovativo
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Formatos aceitos: Imagem (JPG, PNG) ou PDF até 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleProofFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Notas Adicionais */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-300">
                Observações / Telefone de Contato (opcional)
              </label>
              <input
                type="text"
                value={purchaseNotes}
                onChange={(e) => setPurchaseNotes(e.target.value)}
                placeholder="Ex: Pagamento efetuado via Multicaixa Express..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlanForPurchase(null)}
                className="flex-1 text-xs border-white/10 text-slate-400"
              >
                Cancelar
              </Button>

              <Button
                variant="primary"
                size="sm"
                disabled={!proofFile || isSubmittingPurchase}
                onClick={handleConfirmPlanPurchase}
                className="flex-1 text-xs font-bold bg-[#00E5FF] hover:bg-[#00c2d6] text-black border-none"
              >
                {isSubmittingPurchase ? 'A Submeter...' : 'Confirmar e Enviar Comprovativo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
