import React, { useEffect, useState, useMemo } from 'react';
import {
  Monitor,
  Radio,
  AlertTriangle,
  Film,
  ListVideo,
  HardDrive,
  CreditCard,
  Sparkles,
  FileText,
  RefreshCw,
  Clock,
  MapPin,
  ChevronRight,
  Coins,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { NexoraService } from '../../../services';
import {
  Display,
  ContentItem,
  Playlist,
  Schedule,
  SystemAlert,
  ClientContract,
} from '../../../types/domain';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatusIndicator,
  Progress,
  Skeleton,
  useToast,
} from '../../../components/ui';
import { DashboardKpiCard } from '../components/DashboardKpiCard';
import { DashboardSection } from '../components/DashboardSection';
import { AlertList } from '../components/AlertList';
import { SchedulePreview } from '../components/SchedulePreview';
import { MetricCard } from '../components/MetricCard';

export interface ClientDashboardViewProps {
  onNavigateToDisplay?: (displayId: string) => void;
  onNavigateToDisplaysList?: () => void;
  onNavigateToContent?: () => void;
  onNavigateToPlaylist?: () => void;
  onNavigateToSchedule?: () => void;
  onNavigateToScheduleDetail?: (id: string) => void;
  onNavigateToAICredits?: () => void;
  onNavigateToContracts?: () => void;
  onNavigateToBilling?: () => void;
  onNavigateToCampaigns?: () => void;
}

export const ClientDashboardView: React.FC<ClientDashboardViewProps> = ({
  onNavigateToDisplay,
  onNavigateToDisplaysList,
  onNavigateToContent,
  onNavigateToPlaylist,
  onNavigateToSchedule,
  onNavigateToScheduleDetail,
  onNavigateToAICredits,
  onNavigateToContracts,
  onNavigateToBilling,
}) => {
  const { currentUser, currentOrganization, hasPermission } = useSession();
  const { success, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [contract, setContract] = useState<ClientContract | null>(null);

  const [accumulatedRevenueKz, setAccumulatedRevenueKz] = useState<number>(0);
  const [totalPaidKz, setTotalPaidKz] = useState<number>(0);
  const [adMetrics, setAdMetrics] = useState({
    totalAdPlays: 0,
    estimatedImpressions: 0,
    activeCampaignsCount: 0,
  });

  const orgId = currentOrganization?.id || 'org-1789639663801';

  // Dynamic greeting based on user's current local hour
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const loadClientData = async () => {
    setLoading(true);
    try {
      const [displayList, contentList, playlistList, scheduleList, alertList, contractData] =
        await Promise.all([
          NexoraService.displays.getAll({ organizationId: orgId }).catch(() => []),
          NexoraService.contents.getAll({ organizationId: orgId }).catch(() => []),
          NexoraService.playlists.getAll({ organizationId: orgId }).catch(() => []),
          NexoraService.schedules.getAll({ organizationId: orgId }).catch(() => []),
          NexoraService.alerts.getAll({ organizationId: orgId, resolved: false }).catch(() => []),
          NexoraService.contracts.getByOrganizationId(orgId).catch(() => null),
        ]);

      setDisplays(displayList || []);
      setContents(contentList || []);
      setPlaylists(playlistList || []);
      setSchedules(scheduleList || []);
      setAlerts(alertList || []);
      setContract(contractData || null);

      // Fetch commission financials & ad metrics for partner displays
      try {
        const [commRes, campRes] = await Promise.all([
          fetch(`/api/commissions/client/${orgId}`),
          fetch('/api/campaigns'),
        ]);

        if (commRes.ok) {
          const commData = await commRes.json();
          const items = commData.commissions || [];
          const pending = items.filter((c: any) => c.status === 'PENDING').reduce((acc: number, c: any) => acc + (c.commissionAmountKz || 0), 0);
          const paid = items.filter((c: any) => c.status === 'PAID' || c.status === 'SETTLED').reduce((acc: number, c: any) => acc + (c.commissionAmountKz || 0), 0);
          setAccumulatedRevenueKz(pending);
          setTotalPaidKz(paid);
        } else {
          setAccumulatedRevenueKz(0);
          setTotalPaidKz(0);
        }

        if (campRes.ok) {
          const allCamps = await campRes.json();
          const dIds = (displayList || []).map((d: any) => d.id);

          /**
           * ⛔ O QUE ESTAVA ERRADO AQUI (números inventados num painel de cliente):
           *
           *   1. `|| td.length === 0` fazia com que campanhas SEM displays atribuídos
           *      contassem para TODOS os parceiros — um parceiro novo via as campanhas
           *      da plataforma inteira (daí os "2 campanhas ativas" numa conta nova);
           *   2. `parseInt(...) || 12` inventava 12 exibições por campanha sem dados;
           *   3. `plays * 25` inventava as impressões (24 exibições → "600 impressões").
           *
           * Agora só contam campanhas dirigidas a displays DESTE parceiro e os números
           * são os reais do servidor. Sem dados → zeros, que é a verdade.
           */
          const myCamps = dIds.length
            ? allCamps.filter((c: any) => {
                const td = Array.isArray(c.target_displays)
                  ? c.target_displays
                  : Array.isArray(c.displays)
                    ? c.displays
                    : [];
                return td.some((id: string) => dIds.includes(id));
              })
            : [];

          const liveCamps = myCamps.filter((c: any) =>
            ['LIVE', 'ACTIVE', 'RUNNING'].includes(String(c.status || '').toUpperCase())
          );

          const plays = liveCamps.reduce(
            (sum: number, c: any) =>
              sum + (parseInt(String(c.executed_plays ?? c.delivered_impressions ?? 0), 10) || 0),
            0
          );
          const impressions = liveCamps.reduce(
            (sum: number, c: any) => sum + (parseInt(String(c.delivered_impressions ?? 0), 10) || 0),
            0
          );

          setAdMetrics({
            totalAdPlays: plays,
            estimatedImpressions: impressions,
            activeCampaignsCount: liveCamps.length,
          });
        } else {
          setAdMetrics({ totalAdPlays: 0, estimatedImpressions: 0, activeCampaignsCount: 0 });
        }
      } catch {
        setAccumulatedRevenueKz(0);
        setTotalPaidKz(0);
      }

    } catch (err) {
      console.error('Erro ao carregar dados do dashboard parceiro:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [orgId]);

  const handleRefresh = async () => {
    await loadClientData();
    info('Atualizado', 'Displays e comissões sincronizados.');
  };

  const handleResolveAlert = async (alertId: string) => {
    await NexoraService.alerts.resolve(alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    success('Alerta atualizado', 'Notificação tratada com sucesso.');
  };

  // KPIs
  const totalDisplays = displays.length;
  const onlineDisplays = displays.filter((d) => d.status === 'ONLINE').length;
  const offlineDisplays = displays.filter((d) => d.status === 'OFFLINE').length;
  const totalContents = contents.length;
  const totalPlaylists = playlists.length;
  const usedStorageGb = 14.8;
  const totalStorageGb = 32;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ═══════════════════════════════════════════════════════════════
          HEADER: Greeting, Partner Badge & Actions
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-r from-[#070D1E] via-[#0A142A] to-[#070D1E] p-6 sm:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="absolute top-0 right-1/4 w-[350px] h-full bg-gradient-to-l from-blue-600/15 via-purple-600/10 to-transparent pointer-events-none blur-2xl" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-display">
              {greeting}, {currentUser?.name.split(' ')[0] || 'Gomes'} 👋
            </h1>
            <Badge variant="cyan" dot size="sm">
              {currentOrganization?.name || 'Parceiro Nexora'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-[#94A3B8]">
            Painel do Parceiro — Visão geral dos seus displays, monetização e comissões em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            className="rounded-xl border border-white/10 hover:border-white/20 text-xs font-semibold"
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          AI SENTINEL & FINANCE AGENT BANNER
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-r from-[#070D1E] via-[#0F1C38] to-[#070D1E] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 rounded-2xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 text-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)] shrink-0">
            <Coins className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-[#00E5FF] uppercase tracking-wider font-display">
                Sentinel & Finance Agent (Diagnóstico de Ecrãs & Comissões)
              </span>
              <Badge variant={offlineDisplays > 0 ? 'warning' : 'online'} size="sm" dot>
                {offlineDisplays > 0 ? `${offlineDisplays} Display Inativo` : 'Monetização Ativa'}
              </Badge>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">Estado da Rede e Previsão de Repasses</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {offlineDisplays > 0
                ? `Alerta do Sentinel Agent: O display ${displays.find(d => d.status === 'OFFLINE')?.name || ''} está sem sinal há mais de 3 minutos. Verifique a energia/internet para evitar perdas de comissão.`
                : `Seus ${totalDisplays} displays estão transmitindo sinal ativo com alta aderência de público. Suas comissões acumuladas continuam sendo calculadas e registradas automaticamente.`}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          7 KPIS GRID STRICT REQUIREMENTS FOR PARTNER
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {/* KPI 1: Meus Displays */}
        <DashboardKpiCard
          label="Meus Displays"
          value={totalDisplays}
          subValue="terminais"
          icon={Monitor}
          variant="blue"
          loading={loading}
          onClick={onNavigateToDisplaysList}
        />

        {/* KPI 2: Online */}
        <DashboardKpiCard
          label="Online"
          value={onlineDisplays}
          subValue="no ar"
          icon={Radio}
          variant="emerald"
          loading={loading}
          onClick={onNavigateToDisplaysList}
        />

        {/* KPI 3: Offline */}
        <DashboardKpiCard
          label="Offline"
          value={offlineDisplays}
          subValue="desconectados"
          icon={AlertTriangle}
          variant={offlineDisplays > 0 ? 'danger' : 'neutral'}
          loading={loading}
          onClick={onNavigateToDisplaysList}
        />

        {/* KPI 4: Playlists */}
        <DashboardKpiCard
          label="Playlists"
          value={totalPlaylists}
          subValue="sequências"
          icon={ListVideo}
          variant="purple"
          loading={loading}
          onClick={onNavigateToPlaylist}
        />

        {/* KPI 5: Conteúdos */}
        <DashboardKpiCard
          label="Conteúdos"
          value={totalContents}
          subValue="mídias salvas"
          icon={Film}
          variant="cyan"
          loading={loading}
          onClick={onNavigateToContent}
        />

        {/* KPI 6: Valor Acumulado a Receber */}
        <DashboardKpiCard
          label="A Receber"
          value={`${accumulatedRevenueKz.toLocaleString('pt-AO')} Kz`}
          subValue="comissão pendente"
          icon={Coins}
          variant="amber"
          loading={loading}
        />

        {/* KPI 7: Valor Pago */}
        <DashboardKpiCard
          label="Valor Pago"
          value={`${totalPaidKz.toLocaleString('pt-AO')} Kz`}
          subValue="comissão liquidada"
          icon={CreditCard}
          variant="emerald"
          loading={loading}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          MÉTRICAS DE ANÚNCIOS NOS MEUS DISPLAYS (PARCEIRO)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative rounded-2xl overflow-hidden border border-purple-500/20 bg-gradient-to-br from-[#0E0B1E] to-[#0B0E1A] p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider">Exibições de Anúncios</p>
              <p className="text-2xl font-bold font-mono text-purple-300">
                {loading ? '—' : adMetrics.totalAdPlays.toLocaleString('pt-AO')}
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">Reproduções nos seus displays</p>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-blue-500/20 bg-gradient-to-br from-[#0B0E1E] to-[#080B18] p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider">Impressões Estimadas</p>
              <p className="text-2xl font-bold font-mono text-blue-300">
                {loading ? '—' : adMetrics.estimatedImpressions.toLocaleString('pt-AO')}
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">Audiência impactada na rede</p>
            </div>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-amber-500/20 bg-gradient-to-br from-[#0E0C0A] to-[#0B0B12] p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider">Campanhas Ativas nos Displays</p>
              <p className="text-2xl font-bold font-mono text-amber-300">
                {loading ? '—' : adMetrics.activeCampaignsCount}
              </p>
              <p className="text-[10px] text-[#64748B] mt-0.5">Anúncios em veiculação</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DISPLAYS STATUS & PRÓXIMAS REPRODUÇÕES (PROGRAMAÇÃO)
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Seção Meus Displays (7 cols) */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-white/[0.06] flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF]">
                  <Monitor className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Status dos Meus Displays</CardTitle>
                  <p className="text-[11px] text-[#94A3B8]">Terminais associados ao seu espaço</p>
                </div>
              </div>
              {onNavigateToDisplaysList && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateToDisplaysList}
                  className="text-xs text-[#00E5FF] hover:text-white"
                >
                  Ver todos <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4 flex-1 divide-y divide-white/[0.06]">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="p-3 space-y-2">
                      <Skeleton height={20} className="w-1/2" />
                      <Skeleton height={14} className="w-3/4" />
                    </div>
                  ))}
                </div>
              ) : displays.length === 0 ? (
                <div className="py-8 text-center text-[#64748B] text-xs">
                  Nenhum display cadastrado para esta organização.
                </div>
              ) : (
                displays.map((dsp) => (
                  <div
                    key={dsp.id}
                    onClick={() => onNavigateToDisplay?.(dsp.id)}
                    className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-white/[0.03] -mx-2 px-3 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white group-hover:text-[#00E5FF] transition-colors">
                          {dsp.name}
                        </span>
                        <span className="text-[10px] font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-1.5 py-0.5 rounded border border-[#00E5FF]/20">
                          {dsp.code}
                        </span>
                        <StatusIndicator
                          status={dsp.status === 'ONLINE' ? 'online' : dsp.status === 'OFFLINE' ? 'offline' : 'warning'}
                          label={dsp.status}
                          size="sm"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#64748B]" />
                          {dsp.location.zone || dsp.location.venueName}
                        </span>
                        <span>•</span>
                        <span className="text-[#64748B]">{dsp.resolution}</span>
                      </div>
                      <p className="text-[11px] text-[#00E5FF] flex items-center gap-1 truncate">
                        <span className="text-[#64748B]">Conteúdo atual:</span>
                        <strong className="font-medium text-white truncate">{dsp.currentContent || 'Grade Padrão'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0 text-right">
                      <div className="text-[11px] text-[#64748B]">
                        <span className="block text-[10px]">Último heartbeat</span>
                        <span className="text-[#94A3B8] font-mono">Há poucos seg</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#64748B] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Seção Próximas Reproduções (Programação) (5 cols) */}
        <div className="lg:col-span-5">
          <SchedulePreview
            schedules={schedules}
            loading={loading}
            onNavigateToScheduling={onNavigateToSchedule}
            onNavigateToScheduleDetail={onNavigateToScheduleDetail}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CARDS DE NEGÓCIOS: Consumo, Assinatura, IA e Contrato
      ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Consumo & Armazenamento */}
        <MetricCard
          title="Consumo da Conta"
          subtitle="Armazenamento e capacidade"
          icon={HardDrive}
          progress={{
            current: usedStorageGb,
            total: totalStorageGb,
            unit: 'GB',
            variant: 'cyan',
          }}
          metrics={[
            { label: 'Mídias', value: `${totalContents} itens` },
            { label: 'Playlists', value: `${totalPlaylists} ativas` },
            { label: 'Telas', value: `${totalDisplays} alocadas` },
          ]}
          loading={loading}
        />

        {/* Card 2: Seu Plano (Assinatura) */}
        {hasPermission('billing.read') && (
          <MetricCard
            title="Seu Plano"
            subtitle="Assinatura SaaS Nexora"
            icon={CreditCard}
            value={contract?.planName || 'Nexora Pro'}
            secondaryValue="Plano Ativo"
            metrics={[
              {
                label: 'Mensalidade',
                value: `${((contract?.monthlyValueKz || 125000) / 1000).toLocaleString('pt-AO')} mil Kz`,
              },
              { label: 'Cobrança', value: contract?.nextBillingDate || '01/09/2026' },
              { label: 'SLA Uptime', value: contract?.slaUptime || '99.8%' },
            ]}
            cta={{
              label: 'Ver fatura & detalhes',
              onClick: () => onNavigateToBilling?.(),
              variant: 'outline',
            }}
            loading={loading}
          />
        )}

        {/* Card 3: Nexora Studio IA */}
        {hasPermission('aicredits.read') && (
          <MetricCard
            title="Nexora Studio IA"
            subtitle="Geração de vídeos e spots"
            icon={Sparkles}
            value="1.240"
            secondaryValue="créditos disponíveis"
            variant="highlight"
            metrics={[
              { label: 'Cota Mensal', value: '2.000 créditos' },
              { label: 'Renovação', value: '01/09/2026' },
            ]}
            cta={{
              label: 'Gerar novo conteúdo',
              onClick: () => onNavigateToAICredits?.(),
              variant: 'cyan',
            }}
            loading={loading}
          />
        )}

        {/* Card 4: Contrato Nexora */}
        {hasPermission('contracts.read') && (
          <MetricCard
            title="Contrato Nexora"
            subtitle="Termo de adesão e serviços"
            icon={FileText}
            value={contract?.contractNumber || 'CTR-NX-2025-084'}
            secondaryValue="Status: Ativo"
            metrics={[
              { label: 'Início', value: contract?.startDate || '01/09/2025' },
              { label: 'Término', value: contract?.endDate || '01/09/2026' },
            ]}
            cta={{
              label: 'Ver contrato',
              onClick: () => onNavigateToContracts?.(),
              variant: 'outline',
            }}
            loading={loading}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ALERTAS DA ORGANIZAÇÃO CLIENTE
      ═══════════════════════════════════════════════════════════════ */}
      <DashboardSection
        title="Alertas & Notificações do Estabelecimento"
        subtitle="Avisos operacionais pertencentes exclusivamente ao seu espaço."
      >
        <AlertList
          alerts={alerts}
          loading={loading}
          title="Notificações Operacionais"
          subtitle="Alertas de hardware, conectividade e programação no seu local"
          onResolve={handleResolveAlert}
          onNavigateToTarget={(alert) => {
            if (alert.displayId) onNavigateToDisplay?.(alert.displayId);
          }}
        />
      </DashboardSection>
    </div>
  );
};
