import React from 'react';
import { SystemAlert, AlertSeverity } from '../../../types/domain';
import { Badge, Button, Skeleton } from '../../../components/ui';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  MapPin,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

export interface AlertListProps {
  alerts: SystemAlert[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  onResolve?: (id: string) => void;
  onNavigateToTarget?: (alert: SystemAlert) => void;
  maxItems?: number;
}

const SEVERITY_CONFIG = {
  CRITICAL: {
    Icon: AlertTriangle,
    badge: <Badge variant="danger" size="sm">Crítico</Badge>,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.05)',
    border: 'rgba(239,68,68,0.15)',
    accent: 'rgba(239,68,68,0.6)',
  },
  WARNING: {
    Icon: AlertCircle,
    badge: <Badge variant="warning" size="sm">Alerta</Badge>,
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.05)',
    border: 'rgba(245,158,11,0.15)',
    accent: 'rgba(245,158,11,0.5)',
  },
  INFO: {
    Icon: Info,
    badge: <Badge variant="info" size="sm">Info</Badge>,
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.04)',
    border: 'rgba(6,182,212,0.12)',
    accent: 'rgba(6,182,212,0.4)',
  },
};

export const AlertList: React.FC<AlertListProps> = ({
  alerts,
  loading = false,
  title = 'Alertas que Exigem Atenção',
  subtitle = 'Incidentes operacionais e avisos preventivos',
  onResolve,
  onNavigateToTarget,
  maxItems = 5,
}) => {
  const displayList = alerts.slice(0, maxItems);

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(10,17,33,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex flex-row items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#F87171',
            }}
          >
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-[11px]" style={{ color: '#334155' }}>
              {subtitle}
            </p>
          </div>
        </div>
        {alerts.length > 0 && (
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#F87171',
            }}
          >
            {alerts.length} {alerts.length === 1 ? 'pendência' : 'pendências'}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4 space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 space-y-2">
                <Skeleton height={16} className="w-3/4" />
                <Skeleton height={12} className="w-full" />
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-10 text-center space-y-2.5">
            <div
              className="w-10 h-10 mx-auto rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}
            >
              <CheckCircle className="w-5 h-5" style={{ color: '#10B981' }} />
            </div>
            <p className="text-xs font-semibold text-white">Nenhum alerta crítico ativo</p>
            <p className="text-[11px]" style={{ color: '#334155' }}>
              Todos os displays e serviços operando dentro dos parâmetros normais.
            </p>
          </div>
        ) : (
          displayList.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
            const Icon = cfg.Icon;

            return (
              <div
                key={alert.id}
                className="group relative rounded-xl p-3 transition-all duration-200"
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                }}
              >
                {/* Left accent stripe */}
                <div
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full"
                  style={{ background: cfg.accent }}
                />

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pl-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className="p-1.5 rounded-lg flex-shrink-0 mt-0.5"
                      style={{
                        background: `${cfg.color}12`,
                        border: `1px solid ${cfg.color}25`,
                        color: cfg.color,
                      }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">
                          {alert.title}
                        </span>
                        {cfg.badge}
                        {alert.displayCode && (
                          <span
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                            style={{
                              color: '#22D3EE',
                              background: 'rgba(6,182,212,0.1)',
                              border: '1px solid rgba(6,182,212,0.2)',
                            }}
                          >
                            {alert.displayCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: '#64748B' }}>
                        {alert.description}
                      </p>
                      <div
                        className="flex items-center gap-3 text-[10px] flex-wrap"
                        style={{ color: '#334155' }}
                      >
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {alert.timeAgo}
                        </span>
                        {alert.location && (
                          <span className="flex items-center gap-1" style={{ color: '#475569' }}>
                            <MapPin className="w-2.5 h-2.5" />
                            {alert.location}
                          </span>
                        )}
                        {alert.actionRequired && (
                          <span className="font-medium" style={{ color: '#FBBF24' }}>
                            Ação: {alert.actionRequired}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-start flex-shrink-0">
                    {onNavigateToTarget && alert.displayId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        style={{ color: '#22D3EE' }}
                        onClick={() => onNavigateToTarget(alert)}
                      >
                        Ver Display <ChevronRight className="w-3 h-3 ml-0.5" />
                      </Button>
                    )}
                    {onResolve && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] h-7 px-2"
                        onClick={() => onResolve(alert.id)}
                      >
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
