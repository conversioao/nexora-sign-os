import React from 'react';
import { Skeleton } from '../../../components/ui';
import { Radio, ShieldCheck, AlertCircle, Wrench } from 'lucide-react';

export interface StatusOverviewProps {
  total: number;
  online: number;
  offline: number;
  warning?: number;
  maintenance: number;
  loading?: boolean;
  title?: string;
  subtitle?: string;
}

export const StatusOverview: React.FC<StatusOverviewProps> = ({
  total,
  online,
  offline,
  warning = 0,
  maintenance,
  loading = false,
  title = 'Saúde da Rede & Displays',
  subtitle = 'Disponibilidade e telemetria operacional em tempo real',
}) => {
  const safeTotal = total > 0 ? total : 1;
  const onlinePct = Math.round((online / safeTotal) * 100);
  const offlinePct = Math.round((offline / safeTotal) * 100);
  const warningPct = Math.round((warning / safeTotal) * 100);
  const maintPct = Math.round((maintenance / safeTotal) * 100);

  const uptimeRate = total > 0 ? (((online + warning) / total) * 100).toFixed(1) : '100.0';

  const statItems = [
    {
      label: 'Online',
      value: online,
      pct: onlinePct,
      color: '#10B981',
      bg: 'rgba(16,185,129,0.07)',
      border: 'rgba(16,185,129,0.18)',
      dot: true,
      pulse: true,
    },
    {
      label: 'Offline',
      value: offline,
      pct: offlinePct,
      color: '#EF4444',
      bg: 'rgba(239,68,68,0.07)',
      border: 'rgba(239,68,68,0.18)',
      dot: true,
      pulse: false,
    },
    {
      label: 'Em Alerta',
      value: warning,
      pct: warningPct,
      color: '#F59E0B',
      bg: 'rgba(245,158,11,0.07)',
      border: 'rgba(245,158,11,0.18)',
      dot: false,
      pulse: false,
      Icon: AlertCircle,
    },
    {
      label: 'Manutenção',
      value: maintenance,
      pct: maintPct,
      color: '#3B82F6',
      bg: 'rgba(59,130,246,0.07)',
      border: 'rgba(59,130,246,0.18)',
      dot: false,
      pulse: false,
      Icon: Wrench,
    },
  ];

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
              background: 'rgba(6,182,212,0.1)',
              border: '1px solid rgba(6,182,212,0.2)',
              color: '#22D3EE',
            }}
          >
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-[11px]" style={{ color: '#334155' }}>
              {subtitle}
            </p>
          </div>
        </div>

        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
            color: '#10B981',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{uptimeRate}% Uptime</span>
        </div>
      </div>

      <div className="px-5 py-4 flex-1 flex flex-col gap-5">
        {loading ? (
          <div className="space-y-4">
            <Skeleton height={20} className="w-full rounded-full" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={56} />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Multi-segmented health bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px]" style={{ color: '#475569' }}>
                <span className="font-medium">Disponibilidade da Rede</span>
                <span className="font-semibold" style={{ color: '#94A3B8' }}>
                  {online}/{total} Displays Operacionais ({onlinePct}%)
                </span>
              </div>
              <div
                className="h-2 w-full rounded-full overflow-hidden flex"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                {onlinePct > 0 && (
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${onlinePct}%`,
                      background: 'linear-gradient(90deg, #10B981, #34D399)',
                      borderRadius: offlinePct === 0 && maintPct === 0 && warningPct === 0 ? '999px' : '999px 0 0 999px',
                    }}
                  />
                )}
                {warningPct > 0 && (
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${warningPct}%`, background: '#F59E0B' }}
                  />
                )}
                {maintPct > 0 && (
                  <div
                    className="h-full transition-all duration-700"
                    style={{ width: `${maintPct}%`, background: '#3B82F6' }}
                  />
                )}
                {offlinePct > 0 && (
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${offlinePct}%`,
                      background: 'linear-gradient(90deg, #EF4444, #F87171)',
                      borderRadius: '0 999px 999px 0',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {statItems.map((s) => (
                <div
                  key={s.label}
                  className="p-3.5 rounded-xl flex flex-col gap-1.5"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}
                >
                  <div className="flex items-center gap-1.5">
                    {s.dot ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${s.pulse ? 'animate-pulse' : ''}`}
                        style={{ background: s.color }}
                      />
                    ) : (
                      s.Icon && <s.Icon className="w-3 h-3" style={{ color: s.color }} />
                    )}
                    <span className="text-[11px] font-semibold" style={{ color: s.color }}>
                      {s.label}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xl font-black text-white">{s.value}</span>
                    <span className="text-[10px] font-mono" style={{ color: s.color, opacity: 0.8 }}>
                      {s.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
