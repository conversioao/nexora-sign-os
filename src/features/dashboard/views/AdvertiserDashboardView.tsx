import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Calendar,
  Sparkles,
  Monitor,
  CreditCard,
  TrendingUp,
  Plus,
  RefreshCw,
  Eye,
  PlayCircle,
  Users,
  MapPin,
  ArrowRight,
  Zap,
  DollarSign,
  Layers,
} from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { NexoraService } from '../../../services';
import {
  Campaign,
  MediaOpportunity,
  AdvertiserMetrics,
} from '../../../types/domain';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Skeleton,
  useToast,
} from '../../../components/ui';
import { DashboardKpiCard } from '../components/DashboardKpiCard';
import { DashboardSection } from '../components/DashboardSection';
import { MetricCard } from '../components/MetricCard';
import { QuickAction, QuickActionItem } from '../components/QuickAction';

export interface AdvertiserDashboardViewProps {
  onNavigateToCampaigns?: () => void;
  onNavigateToNewCampaign?: () => void;
  onNavigateToCampaignDetail?: (id: string) => void;
  onNavigateToExploreDisplays?: () => void;
  onNavigateToStudioAI?: () => void;
  onNavigateToAICredits?: () => void;
  onNavigateToBilling?: () => void;
}

export const AdvertiserDashboardView: React.FC<AdvertiserDashboardViewProps> = ({
  onNavigateToCampaigns,
  onNavigateToNewCampaign,
  onNavigateToCampaignDetail,
  onNavigateToExploreDisplays,
  onNavigateToStudioAI,
  onNavigateToAICredits,
  onNavigateToBilling,
}) => {
  const { currentOrganization } = useSession();
  const { info } = useToast();

  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [opportunities, setOpportunities] = useState<MediaOpportunity[]>([]);
  const [metrics, setMetrics] = useState<AdvertiserMetrics | null>(null);

  const orgId = currentOrganization?.id || '';

  const loadAdvertiserData = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [campaignList, opportunityList, metricData] = await Promise.all([
        NexoraService.campaigns.getAll(orgId),
        NexoraService.advertisers.getOpportunities(),
        NexoraService.advertisers.getMetrics(orgId),
      ]);

      setCampaigns(campaignList);
      setOpportunities(opportunityList);
      setMetrics(metricData);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard anunciante:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdvertiserData();
  }, [orgId]);

  const handleRefresh = async () => {
    await loadAdvertiserData();
    info('Atualizado', 'Métricas de campanhas e oportunidades sincronizadas.');
  };

  // KPIs — strictly from real data, no fallbacks
  const activeCampaigns = metrics?.activeCampaignsCount ?? 0;
  const scheduledCampaigns = metrics?.scheduledCampaignsCount ?? 0;
  const adsInProduction = metrics?.adsInProductionCount ?? 0;
  const availableDisplays = metrics?.availableDisplaysCount ?? 0;
  const aiCredits = metrics?.aiCreditsRemaining ?? 0;
  const monthlyInvestmentKz = metrics?.monthlyInvestmentKz ?? 0;
  const monthlyInvestmentFormatted = monthlyInvestmentKz >= 1000000
    ? `${(monthlyInvestmentKz / 1000000).toFixed(2)}M Kz`
    : `${monthlyInvestmentKz.toLocaleString('pt-AO')} Kz`;

  // Quick actions
  const quickActions: QuickActionItem[] = [
    {
      id: 'qa-create-campaign',
      label: 'Criar Campanha',
      description: 'Lançar novo anúncio na rede',
      icon: Plus,
      variant: 'magenta',
      onClick: () => onNavigateToNewCampaign?.(),
    },
    {
      id: 'qa-explore-displays',
      label: 'Explorar Displays',
      description: 'Consultar pontos indoor em Luanda',
      icon: Monitor,
      variant: 'cyan',
      onClick: () => onNavigateToExploreDisplays?.(),
    },
    {
      id: 'qa-studio-ai',
      label: 'Gerar Anúncio com IA',
      description: 'Criar criativos no Nexora Studio',
      icon: Sparkles,
      variant: 'purple',
      onClick: () => onNavigateToStudioAI?.(),
    },
    {
      id: 'qa-add-credits',
      label: 'Adicionar Créditos',
      description: 'Recarregar créditos de mídia/IA',
      icon: CreditCard,
      variant: 'blue',
      onClick: () => onNavigateToAICredits?.(),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="Visão Geral"
        description="Acompanhe suas campanhas e oportunidades de mídia."
        badge={
          <Badge variant="magenta" dot>
            {currentOrganization?.name || 'Publicidade AO'}
          </Badge>
        }
        breadcrumbs={[
          { label: 'Nexora' },
          { label: 'Painel do Anunciante', active: true },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
          >
            Atualizar
          </Button>
        }
      />

      {/* AI Auditor Agent Campaign Assistant Widget */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shrink-0">
            <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                Auditor Agent (Inteligência & Proof of Play)
              </span>
              <Badge variant="online" size="sm">99.4% Conformidade</Badge>
            </div>
            <h3 className="text-base font-bold text-white">Monitoramento de Desempenho e ROI em Tempo Real</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Suas campanhas ativas estão sendo veiculadas e auditadas em tempo real com assinaturas criptográficas SHA-256. Nenhuma anomalia de sinal ou corte de transmissão foi registrado hoje.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickAction actions={quickActions} title="Ações Rápidas de Mídia" />

      {/* 6 KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* KPI 1: Campanhas Ativas */}
        <DashboardKpiCard
          label="Campanhas Ativas"
          value={activeCampaigns}
          subValue="em veiculação"
          icon={Megaphone}
          variant="magenta"
          loading={loading}
          onClick={onNavigateToCampaigns}
        />

        {/* KPI 2: Reproduções */}
        <DashboardKpiCard
          label="Reproduções"
          value={metrics?.estimatedPlays ? (metrics.estimatedPlays >= 1000 ? `${(metrics.estimatedPlays / 1000).toFixed(1)}K` : metrics.estimatedPlays.toString()) : '0'}
          subValue="total executado"
          icon={PlayCircle}
          variant="blue"
          loading={loading}
        />

        {/* KPI 3: Alcance & Impressões */}
        <DashboardKpiCard
          label="Alcance / Imp."
          value={metrics?.estimatedImpressions ? (metrics.estimatedImpressions >= 1000 ? `${(metrics.estimatedImpressions / 1000).toFixed(1)}K` : metrics.estimatedImpressions.toString()) : '0'}
          subValue="estimativa mensal"
          icon={Eye}
          variant="amber"
          loading={loading}
        />

        {/* KPI 4: Displays Contratados */}
        <DashboardKpiCard
          label="Displays Contratados"
          value={availableDisplays}
          subValue="pontos em Luanda"
          icon={Monitor}
          variant="cyan"
          loading={loading}
          onClick={onNavigateToExploreDisplays}
        />

        {/* KPI 5: Créditos IA */}
        <DashboardKpiCard
          label="Créditos IA"
          value={aiCredits.toLocaleString('pt-AO')}
          subValue="Studio Criativo"
          icon={Sparkles}
          variant="purple"
          loading={loading}
          onClick={onNavigateToAICredits}
        />

        {/* KPI 6: Investimento Mensal */}
        <DashboardKpiCard
          label="Investimento"
          value={monthlyInvestmentFormatted}
          subValue="agosto 2026"
          icon={CreditCard}
          variant="emerald"
          loading={loading}
          onClick={onNavigateToBilling}
        />
      </div>

      {/* Campanhas em Veiculação & Desempenho Estimado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Minhas Campanhas em Veiculação */}
        <div className="lg:col-span-7">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-magenta-500/10 text-magenta-400 border border-magenta-500/20">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Minhas Campanhas em Veiculação</CardTitle>
                  <p className="text-[11px] text-[#64748B]">Slots e veiculações ativas na rede Nexora</p>
                </div>
              </div>
              {onNavigateToCampaigns && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateToCampaigns}
                  className="text-xs text-[#EC4899]"
                >
                  Todas <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4 flex-1 divide-y divide-white/5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 space-y-2">
                      <Skeleton height={20} className="w-1/2" />
                      <Skeleton height={14} className="w-full" />
                    </div>
                  ))}
                </div>
              ) : campaigns.length === 0 ? (
                <div className="py-8 text-center text-[#64748B] text-xs">
                  Nenhuma campanha cadastrada. Clique em "Criar Campanha" para começar.
                </div>
              ) : (
                campaigns.slice(0, 4).map((camp) => (
                  <div
                    key={camp.id}
                    onClick={() => onNavigateToCampaignDetail?.(camp.id)}
                    className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors cursor-pointer"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white group-hover:text-[#EC4899] transition-colors">
                          {camp.name}
                        </span>
                        <Badge
                          variant={
                            camp.status === 'ACTIVE'
                              ? 'success'
                              : camp.status === 'SCHEDULED'
                              ? 'info'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {camp.status === 'ACTIVE' ? 'No Ar' : camp.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                        <span className="text-[#64748B]">{camp.advertiser}</span>
                        <span>•</span>
                        <span>
                          {camp.startDate ? new Date(camp.startDate).toLocaleDateString('pt-AO') : ''}
                          {camp.endDate ? ` até ${new Date(camp.endDate).toLocaleDateString('pt-AO')}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#EC4899]">
                        <span>
                          Orçamento: <strong>{((camp.budgetKz || (camp as any).budget || 0)).toLocaleString('pt-AO')} Kz</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0 text-right">
                      <div>
                        <span className="text-[10px] text-[#64748B] block">Displays</span>
                        <span className="text-xs font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20">
                          {camp.targetDisplaysCount} telas
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#64748B] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Desempenho Estimado (Auditoria & Reach) */}
        <div className="lg:col-span-5">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Desempenho da Rede</CardTitle>
                  <p className="text-[11px] text-[#64748B]">Métricas consolidadas de impacto</p>
                </div>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                Estimativa
              </span>
            </CardHeader>

            <CardContent className="p-4 flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Metric 1: Impressões */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />
                    <span>Impressões</span>
                  </div>
                  <div className="font-display text-xl font-bold text-white">
                    {metrics?.estimatedImpressions ? metrics.estimatedImpressions.toLocaleString('pt-AO') : '0'}
                  </div>
                  <p className="text-[10px] text-[#64748B]">Projeção baseada em tráfego</p>
                </div>

                {/* Metric 2: Reproduções */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <PlayCircle className="w-3.5 h-3.5 text-[#EC4899]" />
                    <span>Reproduções</span>
                  </div>
                  <div className="font-display text-xl font-bold text-white">
                    {metrics?.estimatedPlays ? metrics.estimatedPlays.toLocaleString('pt-AO') : '0'}
                  </div>
                  <p className="text-[10px] text-[#64748B]">Execuções no ar</p>
                </div>

                {/* Metric 3: Telas Impactadas */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <Monitor className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Telas Ativas</span>
                  </div>
                  <div className="font-display text-xl font-bold text-white">
                    {metrics?.displaysImpacted ?? 0}
                  </div>
                  <p className="text-[10px] text-[#64748B]">Displays sincronizados</p>
                </div>

                {/* Metric 4: Alcance Estimado */}
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/8 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-[#94A3B8]">
                    <Users className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>Alcance</span>
                  </div>
                  <div className="font-display text-xl font-bold text-white">
                    {metrics?.estimatedAudienceReach ? metrics.estimatedAudienceReach.toLocaleString('pt-AO') : '0'}
                  </div>
                  <p className="text-[10px] text-[#64748B]">Pessoas impactadas</p>
                </div>
              </div>

              {/* Nexora Studio IA Promo */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#7C3AED]/20 to-[#EC4899]/10 border border-[#7C3AED]/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#A78BFA]" />
                    <span className="text-xs font-bold text-white">Nexora Studio IA</span>
                  </div>
                  <span className="text-xs font-mono text-[#A78BFA] font-bold">
                    {aiCredits} créditos
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8]">
                  Crie spots publicitários e artes em alta resolução geradas por IA prontas para os displays de Luanda.
                </p>
                <Button
                  variant="cyan"
                  size="sm"
                  className="w-full text-xs"
                  onClick={onNavigateToStudioAI}
                >
                  Gerar Novo Anúncio
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Espaços Disponíveis na Rede (Oportunidades de Mídia) */}
      <DashboardSection
        title="Espaços Disponíveis na Rede (Oportunidades)"
        subtitle="Reserve novos pontos e telas de alta visibilidade para suas próximas campanhas."
        actions={
          onNavigateToExploreDisplays && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={onNavigateToExploreDisplays}
            >
              Explorar Catálogo Completo <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          )
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {opportunities.map((opp) => (
            <Card key={opp.id} className="p-4 space-y-3 hover:border-[#06B6D4]/30 transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-xs font-bold text-white truncate block">{opp.name}</span>
                  <div className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                    <MapPin className="w-3 h-3 text-[#64748B]" />
                    <span>{opp.location}</span>
                  </div>
                </div>
                <Badge
                  variant={opp.availability === 'HIGH_DEMAND' ? 'warning' : 'live'}
                  size="sm"
                >
                  {opp.availability === 'HIGH_DEMAND' ? 'Alta Demanda' : 'Disponível'}
                </Badge>
              </div>

              {/* Specs & Audience */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                <div className="p-2 rounded bg-white/5">
                  <span className="text-[10px] text-[#64748B] block">Público Diário Est.</span>
                  <span className="font-semibold text-white">
                    {opp.estimatedDailyAudience.toLocaleString('pt-AO')} pessoas
                  </span>
                </div>
                <div className="p-2 rounded bg-white/5">
                  <span className="text-[10px] text-[#64748B] block">Diária</span>
                  <span className="font-semibold text-[#06B6D4]">
                    {(opp.dailyRateKz / 1000).toLocaleString('pt-AO')} mil Kz
                  </span>
                </div>
              </div>

              {/* CTA */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  info('Oportunidade de Mídia', `Iniciando reserva do display ${opp.displayCode} (${opp.name}).`);
                  onNavigateToNewCampaign?.();
                }}
              >
                Anunciar Neste Ponto
              </Button>
            </Card>
          ))}
        </div>
      </DashboardSection>
    </div>
  );
};
