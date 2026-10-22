import React from 'react';
import { SystemActivity } from '../../../types/domain';
import { Badge, Skeleton, Button } from '../../../components/ui';
import {
  Activity,
  Radio,
  Sparkles,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';

export interface ActivityFeedProps {
  activities: SystemActivity[];
  loading?: boolean;
  onViewAll?: () => void;
  maxItems?: number;
}

const getActivityConfig = (type: SystemActivity['type']) => {
  switch (type) {
    case 'DISPLAY_CONNECTED':
      return { icon: Radio, color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' };
    case 'DISPLAY_DISCONNECTED':
      return { icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)' };
    case 'CAMPAIGN_APPROVED':
      return { icon: Megaphone, color: '#2563EB', bg: 'rgba(37,99,235,0.1)', border: 'rgba(37,99,235,0.2)' };
    case 'CREDIT_USED':
      return { icon: Sparkles, color: '#A855F7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)' };
    case 'CONTENT_SYNCED':
      return { icon: CheckCircle2, color: '#06B6D4', bg: 'rgba(6,182,212,0.1)', border: 'rgba(6,182,212,0.2)' };
    default:
      return { icon: Activity, color: '#64748B', bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.15)' };
  }
};

const getSeverityBadge = (severity: SystemActivity['severity']) => {
  switch (severity) {
    case 'danger':  return <Badge variant="danger" size="sm">Crítico</Badge>;
    case 'warning': return <Badge variant="warning" size="sm">Alerta</Badge>;
    case 'success': return <Badge variant="success" size="sm">Sucesso</Badge>;
    default:        return <Badge variant="info" size="sm">Info</Badge>;
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  onViewAll,
  maxItems = 5,
}) => {
  const displayList = activities.slice(0, maxItems);

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
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.2)',
              color: '#60A5FA',
            }}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Atividade Recente</p>
            <p className="text-[11px]" style={{ color: '#334155' }}>
              Auditoria de eventos e telemetria da rede
            </p>
          </div>
        </div>
        {onViewAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewAll}
            className="text-xs"
            style={{ color: '#22D3EE' }}
          >
            Ver todas <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4 space-y-1">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3 py-2">
                <Skeleton height={28} width={28} className="rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height={14} className="w-3/4" />
                  <Skeleton height={10} className="w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-8 text-center text-[11px]" style={{ color: '#334155' }}>
            Nenhuma atividade registrada no período.
          </div>
        ) : (
          displayList.map((act) => {
            const cfg = getActivityConfig(act.type);
            const Icon = cfg.icon;

            return (
              <div
                key={act.id}
                className="group flex items-start gap-3 p-2.5 rounded-xl transition-colors duration-150"
                style={{ cursor: 'default' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.025)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <div
                  className="p-2 rounded-lg flex-shrink-0 mt-0.5 transition-transform group-hover:scale-105 duration-150"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                    <span
                      className="text-xs font-semibold text-white truncate group-hover:text-cyan-300 transition-colors"
                    >
                      {act.title}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {getSeverityBadge(act.severity)}
                      <span
                        className="text-[10px] flex items-center gap-0.5"
                        style={{ color: '#334155' }}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {act.timestamp}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] line-clamp-2 leading-relaxed" style={{ color: '#475569' }}>
                    {act.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: '#334155' }}>
                    {act.actor && (
                      <span>
                        Por: <strong style={{ color: '#475569' }}>{act.actor}</strong>
                      </span>
                    )}
                    {act.targetLocation && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#22D3EE' }}>{act.targetLocation}</span>
                      </>
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
