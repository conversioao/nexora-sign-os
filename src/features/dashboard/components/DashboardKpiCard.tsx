import React from 'react';
import { Card, CardContent, Skeleton } from '../../../components/ui';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface DashboardKpiCardProps {
  label?: string;
  title?: string;
  value: string | number;
  subValue?: string;
  subtitle?: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }> | React.ReactNode;
  variant?: 'blue' | 'cyan' | 'purple' | 'magenta' | 'amber' | 'emerald' | 'danger' | 'neutral';
  status?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  badge?: React.ReactNode;
  loading?: boolean;
  onClick?: () => void;
  gaugePercent?: number;
}

const VARIANT_CONFIG = {
  blue: {
    iconBg: 'bg-[#2563EB]/10 text-[#60A5FA] border-[#2563EB]/25',
    glow: 'rgba(37,99,235,0.15)',
    accent: '#2563EB',
    accentLight: '#60A5FA',
    gradientFrom: 'from-[#2563EB]/8',
    shimmer: 'rgba(37,99,235,0.4)',
  },
  cyan: {
    iconBg: 'bg-[#06B6D4]/10 text-[#22D3EE] border-[#06B6D4]/25',
    glow: 'rgba(6,182,212,0.15)',
    accent: '#06B6D4',
    accentLight: '#22D3EE',
    gradientFrom: 'from-[#06B6D4]/8',
    shimmer: 'rgba(6,182,212,0.4)',
  },
  purple: {
    iconBg: 'bg-[#7C3AED]/10 text-[#A78BFA] border-[#7C3AED]/25',
    glow: 'rgba(124,58,237,0.15)',
    accent: '#7C3AED',
    accentLight: '#A78BFA',
    gradientFrom: 'from-[#7C3AED]/8',
    shimmer: 'rgba(124,58,237,0.4)',
  },
  magenta: {
    iconBg: 'bg-[#EC4899]/10 text-[#F472B6] border-[#EC4899]/25',
    glow: 'rgba(236,72,153,0.15)',
    accent: '#EC4899',
    accentLight: '#F472B6',
    gradientFrom: 'from-[#EC4899]/8',
    shimmer: 'rgba(236,72,153,0.4)',
  },
  amber: {
    iconBg: 'bg-[#F59E0B]/10 text-[#FBBF24] border-[#F59E0B]/25',
    glow: 'rgba(245,158,11,0.12)',
    accent: '#F59E0B',
    accentLight: '#FBBF24',
    gradientFrom: 'from-[#F59E0B]/6',
    shimmer: 'rgba(245,158,11,0.3)',
  },
  emerald: {
    iconBg: 'bg-[#10B981]/10 text-[#34D399] border-[#10B981]/25',
    glow: 'rgba(16,185,129,0.12)',
    accent: '#10B981',
    accentLight: '#34D399',
    gradientFrom: 'from-[#10B981]/6',
    shimmer: 'rgba(16,185,129,0.3)',
  },
  danger: {
    iconBg: 'bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/25',
    glow: 'rgba(239,68,68,0.15)',
    accent: '#EF4444',
    accentLight: '#F87171',
    gradientFrom: 'from-[#EF4444]/8',
    shimmer: 'rgba(239,68,68,0.3)',
  },
  neutral: {
    iconBg: 'bg-white/5 text-[#94A3B8] border-white/8',
    glow: 'rgba(148,163,184,0.08)',
    accent: '#64748B',
    accentLight: '#94A3B8',
    gradientFrom: 'from-white/3',
    shimmer: 'rgba(148,163,184,0.2)',
  },
};

export const DashboardKpiCard: React.FC<DashboardKpiCardProps> = ({
  label,
  title,
  value,
  subValue,
  subtitle,
  icon,
  variant,
  status,
  trend,
  badge,
  loading = false,
  onClick,
  gaugePercent,
}) => {
  // Resolve fallbacks for backwards compatibility
  const resolvedLabel = label || title || '';
  const resolvedSubValue = subValue || subtitle;
  
  // Resolve variant from status if variant wasn't explicitly passed
  let resolvedVariant = variant;
  if (!resolvedVariant) {
    if (status === 'success' || status === 'online') resolvedVariant = 'emerald';
    else if (status === 'warning') resolvedVariant = 'amber';
    else if (status === 'danger' || status === 'error') resolvedVariant = 'danger';
    else if (status === 'purple') resolvedVariant = 'purple';
    else if (status === 'cyan') resolvedVariant = 'cyan';
    else if (status === 'neutral') resolvedVariant = 'neutral';
    else resolvedVariant = 'blue';
  }

  const cfg = VARIANT_CONFIG[resolvedVariant] || VARIANT_CONFIG.blue;

  // Render icon safely whether passed as component class/function or pre-rendered JSX element
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return icon;
    }
    const IconComp = icon as React.ComponentType<{ className?: string }>;
    return <IconComp className="w-4 h-4" />;
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={`relative group rounded-2xl overflow-hidden transition-all duration-300 ${
        onClick
          ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.985]'
          : ''
      }`}
      style={{
        background:
          'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(10,17,33,0.98) 100%)',
        border: `1px solid rgba(255,255,255,0.07)`,
        boxShadow: onClick
          ? `0 0 0 0 transparent, 0 4px 24px rgba(0,0,0,0.4)`
          : '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Hover glow border overlay */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${cfg.glow} 0%, transparent 60%)`,
          border: `1px solid ${cfg.accent}30`,
        }}
      />

      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] opacity-60 group-hover:opacity-100 transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent, ${cfg.accentLight}, transparent)`,
        }}
      />

      {/* Ambient background glow */}
      <div
        className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle, ${cfg.accent}, transparent 70%)` }}
      />

      <div className="relative p-5 flex flex-col justify-between h-full min-h-[130px] z-10">
        {/* Top row */}
        <div className="flex items-start justify-between mb-4">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: '#64748B', letterSpacing: '0.1em' }}
          >
            {resolvedLabel}
          </span>
          <div
            className={`p-2 rounded-xl border flex items-center justify-center ${cfg.iconBg} transition-all duration-200 group-hover:scale-105`}
          >
            {renderIcon()}
          </div>
        </div>

        {/* Value Section */}
        {loading ? (
          <div className="space-y-2 mt-1">
            <Skeleton height={36} className="w-3/4" />
            <Skeleton height={12} className="w-1/2" />
          </div>
        ) : (
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className="font-black tracking-tight text-white leading-none"
                  style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontFamily: 'inherit' }}
                >
                  {value}
                </span>
                {subValue && (
                  <span className="text-[11px] font-medium" style={{ color: '#475569' }}>
                    {subValue}
                  </span>
                )}
              </div>

              {(trend || badge) && (
                <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                  {trend && (
                    <div
                      className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        trend.isPositive !== false
                          ? 'text-[#10B981] bg-[#10B981]/8 border-[#10B981]/20'
                          : 'text-[#EF4444] bg-[#EF4444]/8 border-[#EF4444]/20'
                      }`}
                    >
                      {trend.isPositive !== false ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      <span>{trend.value}</span>
                    </div>
                  )}
                  {badge}
                </div>
              )}
            </div>

            {/* Circular Gauge */}
            {gaugePercent !== undefined ? (
              <div className="relative w-14 h-14 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke={variant === 'danger' ? '#EF4444' : cfg.accentLight}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${gaugePercent} 100`}
                    style={{ transition: 'stroke-dasharray 0.8s ease' }}
                  />
                </svg>
                <span
                  className="absolute text-[11px] font-black font-mono"
                  style={{ color: variant === 'danger' ? '#EF4444' : cfg.accentLight }}
                >
                  {gaugePercent}%
                </span>
              </div>
            ) : (
              <div className="opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                <svg className="w-16 h-10" viewBox="0 0 100 60" fill="none" stroke={cfg.accentLight} strokeWidth="2.5">
                  <path d="M0 48 Q 25 18, 50 36 T 100 8" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
