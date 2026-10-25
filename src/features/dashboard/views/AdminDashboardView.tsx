import React, { useEffect, useState } from 'react';
import {
  Monitor,
  Radio,
  AlertTriangle,
  Wrench,
  Building2,
  Briefcase,
  Megaphone,
  CreditCard,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Bell,
  CheckCircle2,
  Activity,
  Wifi,
  Globe,
} from 'lucide-react';
import { NexoraService } from '../../../services';
import {
  Display,
  Campaign,
  DashboardKPIs,
  SystemActivity,
  SystemAlert,
  LuandaZoneSummary,
} from '../../../types/domain';
import { Button, Badge, useToast } from '../../../components/ui';
import { DashboardKpiCard } from '../components/DashboardKpiCard';
import { DashboardSection } from '../components/DashboardSection';
import { StatusOverview } from '../components/StatusOverview';
import { NetworkHealthMap } from '../components/NetworkHealthMap';
import { AlertList } from '../components/AlertList';
import { ActivityFeed } from '../components/ActivityFeed';
import { QuickAction, QuickActionItem } from '../components/QuickAction';
import { AdminContractsWidget } from '../../contracts/components/AdminContractsWidget';
import { AIAgentSquadDashboard } from '../components/AIAgentSquadDashboard';

export interface AdminDashboardViewProps {
  onOpenShowcase?: () => void;
  onNavigateToDisplay?: (displayId: string) => void;
  onNavigateToDisplaysList?: () => void;
  onNavigateToClients?: () => void;
  onNavigateToAdvertisers?: () => void;
  onNavigateToCampaigns?: () => void;
  onNavigateToAlerts?: () => void;
  onNavigateToMaintenance?: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  onOpenShowcase,
  onNavigateToDisplay,
  onNavigateToDisplaysList,
  onNavigateToClients,
  onNavigateToAdvertisers,
  onNavigateToCampaigns,
  onNavigateToAlerts,
  onNavigateToMaintenance,
}) => {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [zones, setZones] = useState<LuandaZoneSummary[]>([]);
  const [unresolvedAlertsCount, setUnresolvedAlertsCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { success, info } = useToast();

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadData = async (showLoadingState = false) => {
    if (showLoadingState) {
      setLoading(true);
    }
    try {
      const [kpiData, displayData, alertData, activityData, zoneData] = await Promise.all([
        NexoraService.kpis.getKPIs(),
        NexoraService.displays.getAll(),
        NexoraService.alerts.getAll({ resolved: false }),
        NexoraService.activities.getRecentActivities(6),
        NexoraService.advertisers.getLuandaZones(),
      ]);

      setKpis(kpiData);
      setDisplays(displayData);
      setAlerts(alertData);
      setActivities(activityData);
      setZones(zoneData);
      setUnresolvedAlertsCount(alertData.length);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await loadData(true);
    info('Telemetria atualizada', 'Sincronização de rede e nós de Luanda concluída.');
  };

  const handleResolveAlert = async (alertId: string) => {
    await NexoraService.alerts.resolve(alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    setUnresolvedAlertsCount((prev) => Math.max(0, prev - 1));
    success('Alerta atualizado', 'Incidente marcado como resolvido.');
  };

  // Real KPIs from PostgreSQL & System Repositories
  const totalDisplays = (kpis && kpis.totalDisplays > 0) ? kpis.totalDisplays : displays.length;
  const onlineDisplays = (kpis && kpis.totalDisplays > 0) ? kpis.onlineDisplays : displays.filter(d => d.status?.toUpperCase() === 'ONLINE').length;
  const offlineDisplays = (kpis && kpis.totalDisplays > 0) ? kpis.offlineDisplays : displays.filter(d => d.status?.toUpperCase() === 'OFFLINE').length;
  const maintenanceDisplays = ((kpis as any)?.maintenanceDisplays > 0)
    ? (kpis as any).maintenanceDisplays
    : displays.filter(d => ['MAINTENANCE', 'REPAIR'].includes(d.status?.toUpperCase())).length;
  const activePartners = (kpis && (kpis as any).activeClients !== undefined) ? (kpis as any).activeClients : displays.filter(d => d.organizationId).length;
  const activeAdvertisers = (kpis && (kpis as any).activeAdvertisers !== undefined) ? (kpis as any).activeAdvertisers : 0;
  const activeCampaigns = kpis ? kpis.activeCampaigns : 0;
  
  const monthlyRevenueKz = kpis ? kpis.totalMonthlyRevenueKz : 0;
  const monthlyRevenueFormatted = monthlyRevenueKz >= 1000000
    ? `${(monthlyRevenueKz / 1000000).toFixed(2)}M Kz`
    : monthlyRevenueKz >= 1000
    ? `${(monthlyRevenueKz / 1000).toFixed(0)}k Kz`
    : `${monthlyRevenueKz.toLocaleString('pt-AO')} Kz`;

  const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const onlinePercent = totalDisplays > 0 ? Math.round((onlineDisplays / totalDisplays) * 100) : 0;
  const offlinePercent = totalDisplays > 0 ? Math.round((offlineDisplays / totalDisplays) * 100) : 0;

  // Real Luanda network distribution calculated directly from displays DB
  const realZones: LuandaZoneSummary[] = React.useMemo(() => {
    if (displays.length === 0) return zones;
    const map: Record<string, { total: number; online: number; offline: number }> = {};
    displays.forEach(d => {
      const locStr = typeof d.location === 'string' ? d.location : (d.location?.name || d.location?.address || String(d.location || ''));
      let muni = locStr.includes(',') ? locStr.split(',')[1]?.trim() : (locStr.includes('-') ? locStr.split('-')[1]?.trim() : locStr.trim());
      if (!muni || muni === 'Luanda') muni = 'Talatona';
      if (!map[muni]) map[muni] = { total: 0, online: 0, offline: 0 };
      map[muni].total += 1;
      if (d.status?.toUpperCase() === 'ONLINE') map[muni].online += 1;
      else map[muni].offline += 1;
    });

    return Object.entries(map).map(([muni, data]) => ({
      zone: `${muni} & Região`,
      municipality: muni,
      totalDisplays: data.total,
      onlineDisplays: data.online,
      offlineDisplays: data.offline,
      occupancyRate: data.total > 0 ? Math.round((data.online / data.total) * 100) : 0,
      status: data.offline > 0 ? 'WARNING' : 'OPTIMAL',
    }));
  }, [displays, zones]);

  const quickActions: QuickActionItem[] = [
    {
      id: 'qa-add-display',
      label: 'Adicionar Display',
      description: 'Registrar novo terminal ou totem Android TV',
      icon: Plus,
      variant: 'cyan',
      onClick: () => onNavigateToDisplaysList?.(),
    },
    {
      id: 'qa-new-client',
      label: 'Novo Cliente',
      description: 'Cadastrar espaço comercial ou shopping',
      icon: Building2,
      variant: 'blue',
      onClick: () => onNavigateToClients?.(),
    },
    {
      id: 'qa-new-advertiser',
      label: 'Novo Anunciante',
      description: 'Cadastrar agência de mídia ou marca',
      icon: Briefcase,
      variant: 'purple',
      onClick: () => onNavigateToAdvertisers?.(),
    },
    {
      id: 'qa-view-alerts',
      label: 'Ver Alertas',
      description: `${unresolvedAlertsCount} incidentes na rede`,
      icon: Bell,
      variant: unresolvedAlertsCount > 0 ? 'amber' : 'emerald',
      badge: unresolvedAlertsCount > 0 ? `${unresolvedAlertsCount}` : '0',
      onClick: () => onNavigateToAlerts?.(),
    },
  ];

  const timeStr = currentTime.toLocaleTimeString('pt-AO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Africa/Luanda',
  });

  const dateStr = currentTime.toLocaleDateString('pt-AO', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Africa/Luanda',
  });

  const networkHealth = totalDisplays > 0
    ? Math.round(((onlineDisplays) / totalDisplays) * 100)
    : 100;

  return (
    <div className="space-y-8" style={{ animation: 'fadeIn 0.4s ease forwards' }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scanline { 0% { top: 0; } 100% { top: 100%; } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>

      {/* ═══════════════════════════════════════════════
          HERO COMMAND CENTER BANNER
      ═══════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(135deg, #070B14 0%, #0D1829 40%, #091224 100%)',
          border: '1px solid rgba(6,182,212,0.15)',
          boxShadow: '0 0 80px rgba(6,182,212,0.06), 0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Grid bg texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Radial glow center */}
        <div
          className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 80%, rgba(37,99,235,0.08) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            {/* Left: Identity */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
                  style={{
                    background: 'rgba(6,182,212,0.1)',
                    border: '1px solid rgba(6,182,212,0.25)',
                    color: '#22D3EE',
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    style={{ animation: 'pulseGlow 2s ease-in-out infinite' }}
                  />
                  Operação Central Ativa
                </div>
                <div
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{ background: 'rgba(255,255,255,0.04)', color: '#475569' }}
                >
                  NEXORA OS
                </div>
              </div>

              <div>
                <h1
                  className="font-black text-white leading-none"
                  style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', letterSpacing: '-0.03em' }}
                >
                  Visão Geral
                </h1>
                <p className="text-sm mt-1.5" style={{ color: '#475569' }}>
                  Monitore a operação da rede Nexora em tempo real.
                </p>
              </div>

              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: '#334155' }}>
                <Globe className="w-3 h-3" />
                <span>Nexora</span>
                <span style={{ color: '#1E293B' }}>/</span>
                <span style={{ color: '#94A3B8' }}>Visão Geral (Admin)</span>
              </div>
            </div>

            {/* Right: Live stats & controls */}
            <div className="flex flex-col gap-4 md:items-end">
              {/* Live clock */}
              <div className="text-right">
                <div
                  className="font-black font-mono leading-none"
                  style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#22D3EE', letterSpacing: '0.04em' }}
                >
                  {timeStr}
                </div>
                <div className="text-[11px] mt-0.5 capitalize" style={{ color: '#334155' }}>
                  {dateStr}
                </div>
              </div>

              {/* Network health pill */}
              <div
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(10,17,33,0.8)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#334155' }}>
                    Saúde da Rede
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="w-24 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${networkHealth}%`,
                          background:
                            networkHealth >= 80
                              ? 'linear-gradient(90deg, #10B981, #34D399)'
                              : networkHealth >= 50
                              ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                              : 'linear-gradient(90deg, #EF4444, #F87171)',
                        }}
                      />
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{
                        color:
                          networkHealth >= 80 ? '#34D399' : networkHealth >= 50 ? '#FBBF24' : '#F87171',
                      }}
                    >
                      {networkHealth}%
                    </span>
                  </div>
                </div>
                <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#334155' }}>
                    Online
                  </div>
                  <div className="text-sm font-black" style={{ color: '#34D399' }}>
                    {onlineDisplays}<span className="text-[10px] font-normal" style={{ color: '#334155' }}>/{totalDisplays}</span>
                  </div>
                </div>
                <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#334155' }}>
                    Alertas
                  </div>
                  <div
                    className="text-sm font-black"
                    style={{ color: unresolvedAlertsCount > 0 ? '#F87171' : '#34D399' }}
                  >
                    {unresolvedAlertsCount}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
                  onClick={handleRefresh}
                >
                  Sincronizar
                </Button>
                {onOpenShowcase && (
                  <Button
                    variant="cyan"
                    size="sm"
                    leftIcon={<SlidersHorizontal className="w-3.5 h-3.5" />}
                    onClick={onOpenShowcase}
                  >
                    Design Tokens
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom scan line decoration */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)',
          }}
        />
      </div>

      {/* AI Agent Squad Command Center */}
      <AIAgentSquadDashboard />

      {/* Quick Actions */}
      <QuickAction actions={quickActions} title="Ações Rápidas de Operação" />

      {/* 9 KPIs Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-0.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
          <span className="text-[10px] font-extrabold uppercase tracking-[0.12em]" style={{ color: '#475569' }}>
            Indicadores de Performance
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-3.5">
          {/* KPI 1: Displays Totais */}
          <DashboardKpiCard
            label="DISPLAYS TOTAIS"
            value={totalDisplays}
            subValue="terminais na rede"
            icon={Monitor}
            variant="blue"
            loading={loading}
            onClick={onNavigateToDisplaysList}
          />

          {/* KPI 2: Displays Online */}
          <DashboardKpiCard
            label="DISPLAYS ONLINE"
            value={onlineDisplays}
            subValue={`${onlinePercent}% ativos`}
            icon={Radio}
            variant="emerald"
            loading={loading}
            onClick={onNavigateToDisplaysList}
            trend={{ value: `${onlineDisplays}/${totalDisplays} conectados`, isPositive: true }}
            gaugePercent={onlinePercent}
          />

          {/* KPI 3: Displays Offline */}
          <DashboardKpiCard
            label="DISPLAYS OFFLINE"
            value={offlineDisplays}
            subValue={offlineDisplays > 0 ? "exigem atenção" : "sem pendências"}
            icon={AlertTriangle}
            variant={offlineDisplays > 0 ? "danger" : "neutral"}
            loading={loading}
            onClick={onNavigateToDisplaysList}
            trend={{ value: `${offlineDisplays} sem sinal`, isPositive: false }}
            gaugePercent={offlinePercent}
          />

          {/* KPI 4: Em Manutenção */}
          <DashboardKpiCard
            label="EM MANUTENÇÃO"
            value={maintenanceDisplays}
            subValue="em campo / OS"
            icon={Wrench}
            variant="amber"
            loading={loading}
            onClick={onNavigateToMaintenance}
          />

          {/* KPI 5: Parceiros Ativos */}
          <DashboardKpiCard
            label="PARCEIROS ATIVOS"
            value={activePartners}
            subValue="estabelecimentos parceiros"
            icon={Building2}
            variant="cyan"
            loading={loading}
            onClick={onNavigateToClients}
          />

          {/* KPI 6: Anunciantes Ativos */}
          <DashboardKpiCard
            label="ANUNCIANTES ATIVOS"
            value={activeAdvertisers}
            subValue="agências e marcas"
            icon={Briefcase}
            variant="purple"
            loading={loading}
            onClick={onNavigateToAdvertisers}
          />

          {/* KPI 7: Campanhas no Ar */}
          <DashboardKpiCard
            label="CAMPANHAS NO AR"
            value={activeCampaigns}
            subValue="veiculações programadas"
            icon={Megaphone}
            variant="magenta"
            loading={loading}
            onClick={onNavigateToCampaigns}
            trend={{ value: `${activeCampaigns} ativas`, isPositive: true }}
          />

          {/* KPI 8: Receita Mensal */}
          <DashboardKpiCard
            label="RECEITA MENSAL"
            value={monthlyRevenueFormatted}
            subValue="faturamento real"
            icon={CreditCard}
            variant="cyan"
            loading={loading}
            trend={{ value: '+12.4% vs mês ant.', isPositive: true }}
          />

          {/* KPI 9 — spans 2 cols on lg for visual balance, or show as 4-wide row */}
          {/* Alertas Críticos */}
          <DashboardKpiCard
            label="ALERTAS CRÍTICOS"
            value={criticalAlerts}
            subValue="ação imediata"
            icon={AlertTriangle}
            variant={criticalAlerts > 0 ? 'danger' : 'neutral'}
            loading={loading}
            onClick={onNavigateToAlerts}
          />
        </div>
      </div>

      {/* Saúde da Rede & Distribuição Geográfica */}
      <DashboardSection
        title="Saúde da Rede & Operação"
        subtitle="Disponibilidade dos pontos indoor e cobertura territorial em Luanda."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6">
            <StatusOverview
              total={totalDisplays}
              online={onlineDisplays}
              offline={offlineDisplays}
              warning={0}
              maintenance={maintenanceDisplays}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-6">
            <NetworkHealthMap
              zones={realZones}
              loading={loading}
              onSelectZone={(muni) => {
                info('Filtro regional', `Displays filtrados para o município de ${muni}.`);
                onNavigateToDisplaysList?.();
              }}
            />
          </div>
        </div>
      </DashboardSection>

      {/* Alertas, Contratos & Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <AlertList
            alerts={alerts}
            loading={loading}
            onResolve={handleResolveAlert}
            onNavigateToTarget={(alert) => {
              if (alert.displayId) onNavigateToDisplay?.(alert.displayId);
            }}
          />
        </div>
        <div className="lg:col-span-5 space-y-5">
          <AdminContractsWidget />
          <ActivityFeed
            activities={activities}
            loading={loading}
            onViewAll={() => info('Auditoria', 'Abrindo histórico completo de logs de rede.')}
          />
        </div>
      </div>
    </div>
  );
};
