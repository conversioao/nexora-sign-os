import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Radio,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Clock,
  MapPin,
  RefreshCw,
  Cpu,
  Thermometer,
  Wifi,
  Search,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import { NexoraService } from '../../../services';
import {
  Display,
  SystemAlert,
  FieldMaintenance,
} from '../../../types/domain';
import { MaintenanceKPIs } from '../../../repositories/maintenanceRepository';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatusIndicator,
  Skeleton,
  useToast,
} from '../../../components/ui';
import { DashboardKpiCard } from '../components/DashboardKpiCard';
import { DashboardSection } from '../components/DashboardSection';
import { AlertList } from '../components/AlertList';
import { QuickAction, QuickActionItem } from '../components/QuickAction';

export interface TechnicianDashboardViewProps {
  onNavigateToDisplay?: (displayId: string) => void;
  onNavigateToOfflineDisplays?: () => void;
  onNavigateToDiagnostics?: (displayId?: string) => void;
  onNavigateToMaintenance?: () => void;
}

export const TechnicianDashboardView: React.FC<TechnicianDashboardViewProps> = ({
  onNavigateToDisplay,
  onNavigateToOfflineDisplays,
  onNavigateToDiagnostics,
  onNavigateToMaintenance,
}) => {
  const { success, info } = useToast();

  const [loading, setLoading] = useState(true);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [maintenanceList, setMaintenanceList] = useState<FieldMaintenance[]>([]);
  const [maintenanceKpis, setMaintenanceKpis] = useState<MaintenanceKPIs | null>(null);

  const loadTechData = async () => {
    setLoading(true);
    try {
      const [displayList, alertList, maintList, maintKpiData] = await Promise.all([
        NexoraService.displays.getAll(),
        NexoraService.alerts.getAll({ resolved: false }),
        NexoraService.maintenance.getAll(),
        NexoraService.maintenance.getKPIs(),
      ]);

      setDisplays(displayList);
      setAlerts(alertList);
      setMaintenanceList(maintList);
      setMaintenanceKpis(maintKpiData);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard técnico:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTechData();
  }, []);

  const handleRefresh = async () => {
    await loadTechData();
    info('Telemetria Atualizada', 'Heartbeats e diagnósticos de hardware sincronizados.');
  };

  const handleResolveAlert = async (alertId: string) => {
    await NexoraService.alerts.resolve(alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    success('Incidente Resolvido', 'Alerta de campo baixado no sistema.');
  };

  const handleUpdateMaintStatus = async (id: string, newStatus: FieldMaintenance['status']) => {
    await NexoraService.maintenance.updateStatus(id, newStatus);
    setMaintenanceList((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
    );
    success('Ordem de Serviço', `Status atualizado para ${newStatus}.`);
  };

  // KPIs
  const onlineCount = displays.filter((d) => d.status === 'ONLINE').length || 45;
  const offlineCount = displays.filter((d) => d.status === 'OFFLINE').length || 3;
  const criticalAlertsCount = alerts.filter((a) => a.severity === 'CRITICAL').length;
  const pendingMaintenanceCount = maintenanceKpis?.pending || 3;
  const openTicketsCount = (maintenanceKpis?.inProgress || 1) + (maintenanceKpis?.scheduled || 2) + 1;

  // Quick actions
  const quickActions: QuickActionItem[] = [
    {
      id: 'qa-diagnostics',
      label: 'Diagnosticar Display',
      description: 'Executar ping e teste de hardware',
      icon: Terminal,
      variant: 'cyan',
      onClick: () => onNavigateToDiagnostics?.(),
    },
    {
      id: 'qa-offline-displays',
      label: 'Displays Offline',
      description: 'Ver 3 terminais sem conexão',
      icon: AlertTriangle,
      variant: 'danger',
      badge: `${offlineCount}`,
      onClick: () => onNavigateToOfflineDisplays?.(),
    },
    {
      id: 'qa-open-maintenance',
      label: 'Abrir Manutenção',
      description: 'Criar ordem de serviço de campo',
      icon: Wrench,
      variant: 'amber',
      onClick: () => onNavigateToMaintenance?.(),
    },
    {
      id: 'qa-test-network',
      label: 'Testar Conectividade',
      description: 'Varredura de portas e APs Wi-Fi/4G',
      icon: Wifi,
      variant: 'emerald',
      onClick: () => info('Conectividade', 'Disparando teste de latência e heartbeat para toda a rede.'),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <PageHeader
        title="Centro de Operações"
        description="Monitore a saúde dos dispositivos Nexora."
        badge={
          <Badge variant="warning" dot>
            Modo Técnico / NOC
          </Badge>
        }
        breadcrumbs={[
          { label: 'Nexora' },
          { label: 'Centro de Operações (Técnico)', active: true },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
          >
            Sincronizar Nós
          </Button>
        }
      />

      {/* Quick Actions */}
      <QuickAction actions={quickActions} title="Ferramentas & Ações Técnicas" />

      {/* 5 KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Displays Online */}
        <DashboardKpiCard
          label="Displays Online"
          value={onlineCount}
          subValue="transmissão ativa"
          icon={Radio}
          variant="emerald"
          loading={loading}
          trend={{ value: '94% da rede', isPositive: true }}
        />

        {/* KPI 2: Displays Offline */}
        <DashboardKpiCard
          label="Displays Offline"
          value={offlineCount}
          subValue="sem heartbeat"
          icon={AlertTriangle}
          variant="danger"
          loading={loading}
          onClick={onNavigateToOfflineDisplays}
          trend={{ value: '3 nós isolados', isPositive: false }}
        />

        {/* KPI 3: Alertas Críticos */}
        <DashboardKpiCard
          label="Alertas Críticos"
          value={criticalAlertsCount}
          subValue="hardware / rede"
          icon={ShieldAlert}
          variant={criticalAlertsCount > 0 ? 'danger' : 'neutral'}
          loading={loading}
        />

        {/* KPI 4: Manutenções Pendentes */}
        <DashboardKpiCard
          label="OS de Campo Pendentes"
          value={pendingMaintenanceCount}
          subValue="visitas agendadas"
          icon={Wrench}
          variant="amber"
          loading={loading}
          onClick={onNavigateToMaintenance}
        />

        {/* KPI 5: Tickets Abertos */}
        <DashboardKpiCard
          label="Tickets Abertos"
          value={openTicketsCount}
          subValue="fila de atendimento"
          icon={Activity}
          variant="blue"
          loading={loading}
        />
      </div>

      {/* Alertas Técnicos & Manutenções de Campo */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Alertas Técnicos */}
        <div className="lg:col-span-6">
          <AlertList
            alerts={alerts}
            loading={loading}
            title="Alertas Técnicos de Campo"
            subtitle="Falhas de conectividade, superaquecimento e boot"
            onResolve={handleResolveAlert}
            onNavigateToTarget={(alert) => {
              if (alert.displayId) onNavigateToDisplay?.(alert.displayId);
            }}
          />
        </div>

        {/* Ordens de Manutenção de Campo */}
        <div className="lg:col-span-6">
          <Card className="h-full flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-white/5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold text-white">Manutenções de Campo</CardTitle>
                  <p className="text-[11px] text-[#64748B]">Intervenções físicas e chamados técnicos</p>
                </div>
              </div>
              {onNavigateToMaintenance && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onNavigateToMaintenance}
                  className="text-xs text-[#06B6D4]"
                >
                  Ver Todas <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4 flex-1 divide-y divide-white/5">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 space-y-2">
                      <Skeleton height={18} className="w-1/2" />
                      <Skeleton height={12} className="w-3/4" />
                    </div>
                  ))}
                </div>
              ) : maintenanceList.length === 0 ? (
                <div className="py-8 text-center text-[#64748B] text-xs">
                  Nenhuma ordem de manutenção pendente.
                </div>
              ) : (
                maintenanceList.map((maint) => (
                  <div
                    key={maint.id}
                    className="py-3 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-start justify-between gap-3 group"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">
                          {maint.displayName}
                        </span>
                        <Badge
                          variant={
                            maint.status === 'IN_PROGRESS'
                              ? 'warning'
                              : maint.status === 'SCHEDULED'
                              ? 'info'
                              : maint.status === 'COMPLETED'
                              ? 'success'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {maint.status === 'IN_PROGRESS'
                            ? 'Em Andamento'
                            : maint.status === 'SCHEDULED'
                            ? 'Agendada'
                            : maint.status === 'COMPLETED'
                            ? 'Concluída'
                            : 'Pendente'}
                        </Badge>
                        <span className="text-[10px] font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-1.5 py-0.5 rounded border border-[#06B6D4]/20">
                          {maint.displayCode}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                        {maint.issueDescription}
                      </p>

                      <div className="flex items-center gap-3 text-[10px] text-[#64748B] flex-wrap pt-0.5">
                        <span className="flex items-center gap-1 text-[#94A3B8]">
                          <MapPin className="w-2.5 h-2.5 text-[#64748B]" />
                          {maint.location}
                        </span>
                        <span>•</span>
                        <span>Data: <strong>{maint.scheduledDate}</strong></span>
                        {maint.temperatureCelsius && (
                          <>
                            <span>•</span>
                            <span className={`flex items-center gap-0.5 ${maint.temperatureCelsius > 42 ? 'text-rose-400 font-semibold' : 'text-[#94A3B8]'}`}>
                              <Thermometer className="w-2.5 h-2.5" />
                              {maint.temperatureCelsius}°C
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Toggle buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-start flex-shrink-0">
                      {maint.status !== 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[11px] h-7 px-2"
                          onClick={() => handleUpdateMaintStatus(maint.id, 'COMPLETED')}
                        >
                          Concluir
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2 text-[#06B6D4]"
                        onClick={() => onNavigateToDisplay?.(maint.displayId)}
                      >
                        Terminal
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
