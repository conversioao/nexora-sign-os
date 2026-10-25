import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

export interface QuickActionItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'cyan' | 'purple' | 'magenta' | 'amber' | 'emerald' | 'danger' | 'neutral';
  onClick: () => void;
  badge?: string;
}

export interface QuickActionProps {
  actions: QuickActionItem[];
  title?: string;
}

const ACCENT_MAP = {
  blue:    { color: '#2563EB', light: '#60A5FA', bg: 'rgba(37,99,235,0.1)',   border: 'rgba(37,99,235,0.25)' },
  cyan:    { color: '#06B6D4', light: '#22D3EE', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)' },
  purple:  { color: '#7C3AED', light: '#A78BFA', bg: 'rgba(124,58,237,0.1)', border: 'rgba(124,58,237,0.25)' },
  magenta: { color: '#EC4899', light: '#F472B6', bg: 'rgba(236,72,153,0.1)', border: 'rgba(236,72,153,0.25)' },
  amber:   { color: '#F59E0B', light: '#FBBF24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
  emerald: { color: '#10B981', light: '#34D399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)' },
  danger:  { color: '#EF4444', light: '#F87171', bg: 'rgba(239,68,68,0.1)',  border: 'rgba(239,68,68,0.25)'  },
  neutral: { color: '#475569', light: '#94A3B8', bg: 'rgba(71,85,105,0.08)', border: 'rgba(255,255,255,0.08)' },
};

export const QuickAction: React.FC<QuickActionProps> = ({
  actions,
  title = 'Ações Rápidas',
}) => {
  return (
    <div className="space-y-3">
      {title && (
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: '#475569' }}
          >
            {title}
          </span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          const accent = ACCENT_MAP[act.variant || 'cyan'];

          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className="group relative overflow-hidden rounded-2xl text-left transition-all duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(10,17,33,0.98) 100%)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
                padding: '14px 16px',
              }}
            >
              {/* Hover glow */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: `linear-gradient(135deg, ${accent.bg} 0%, transparent 60%)`,
                  borderRadius: 'inherit',
                  border: `1px solid ${accent.border}`,
                }}
              />

              {/* Top shimmer on hover */}
              <div
                className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${accent.light}, transparent)`,
                }}
              />

              <div className="relative flex items-center gap-3 z-10">
                {/* Icon bubble */}
                <div
                  className="p-2.5 rounded-xl flex-shrink-0 transition-all duration-200 group-hover:scale-105"
                  style={{
                    background: accent.bg,
                    border: `1px solid ${accent.border}`,
                    color: accent.light,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-semibold text-white truncate group-hover:transition-colors duration-200"
                      style={{}}
                    >
                      {act.label}
                    </span>
                    {act.badge && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{
                          background: accent.bg,
                          color: accent.light,
                          border: `1px solid ${accent.border}`,
                        }}
                      >
                        {act.badge}
                      </span>
                    )}
                  </div>
                  {act.description && (
                    <p
                      className="text-[11px] truncate mt-0.5"
                      style={{ color: '#475569' }}
                    >
                      {act.description}
                    </p>
                  )}
                </div>

                <ChevronRight
                  className="w-4 h-4 flex-shrink-0 ml-1 transition-all duration-200 group-hover:translate-x-0.5"
                  style={{ color: '#334155' }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
