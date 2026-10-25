import React from 'react';
import {
  Tv,
  HardDrive,
  Users,
  Sparkles,
  ListMusic,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { SubscriptionUsageSummary, UsageMetricItem } from '../../../types/saas';

interface SubscriptionUsageCardsProps {
  summary: SubscriptionUsageSummary | null;
}

export const SubscriptionUsageCards: React.FC<SubscriptionUsageCardsProps> = ({ summary }) => {
  if (!summary) return null;

  const { metrics, alerts, hasAlerts } = summary;

  const metricCards: Array<{
    item: UsageMetricItem;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = [
    {
      item: metrics.displays,
      icon: Tv,
      color: 'text-cyan-400',
    },
    {
      item: metrics.storage,
      icon: HardDrive,
      color: 'text-blue-400',
    },
    {
      item: metrics.aiCredits,
      icon: Sparkles,
      color: 'text-violet-400',
    },
    {
      item: metrics.teamMembers,
      icon: Users,
      color: 'text-emerald-400',
    },
    {
      item: metrics.playlists,
      icon: ListMusic,
      color: 'text-pink-400',
    },
    {
      item: metrics.schedules,
      icon: Calendar,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Alert Banner if any metric is near/over limit or subscription is past due */}
      {hasAlerts && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h5 className="text-xs font-semibold text-amber-300">
                Atenção ao Consumo & Entitlements da Organização
              </h5>
              <ul className="text-xs text-slate-300 space-y-0.5">
                {alerts.map((alert, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-amber-400" />
                    <span>{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map(({ item, icon: Icon, color }) => {
          const isUnlimited = item.limit === 0 && item.metric === 'displays';
          const isDanger = item.status === 'danger';
          const isWarning = item.status === 'warning';

          const progressBarColor = isDanger
            ? 'bg-rose-500'
            : isWarning
            ? 'bg-amber-500'
            : 'bg-gradient-to-r from-cyan-500 to-blue-500';

          return (
            <div
              key={item.metric}
              className={`bg-slate-900/90 border rounded-xl p-4 transition-all ${
                isDanger
                  ? 'border-rose-500/40 bg-rose-950/10'
                  : isWarning
                  ? 'border-amber-500/40 bg-amber-950/10'
                  : 'border-slate-800'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                </div>

                {isWarning && !isDanger && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    80%+ Usado
                  </span>
                )}
                {isDanger && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Limite Atingido
                  </span>
                )}
                {!isWarning && !isDanger && (
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Normal
                  </span>
                )}
              </div>

              {/* Numbers */}
              <div className="flex items-baseline justify-between mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-white">
                    {typeof item.used === 'number' ? item.used.toLocaleString('pt-AO') : item.used}
                  </span>
                  <span className="text-xs text-slate-400">
                    / {isUnlimited ? 'Ilimitado' : `${item.limit.toLocaleString('pt-AO')} ${item.unit}`}
                  </span>
                </div>
                {!isUnlimited && (
                  <span className="text-xs font-medium text-slate-400">
                    {item.percentage}%
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              {!isUnlimited && (
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${progressBarColor}`}
                    style={{ width: `${Math.min(100, item.percentage)}%` }}
                  />
                </div>
              )}

              {/* Footer info */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  {isUnlimited
                    ? 'Veiculação em rede'
                    : item.remaining === 0
                    ? 'Sem saldo restante'
                    : `${item.remaining} ${item.unit} restantes`}
                </span>
                <span className="text-slate-500 text-[10px]">
                  {item.metric === 'aiCredits' ? 'Ciclo mensal' : 'Capacidade'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
