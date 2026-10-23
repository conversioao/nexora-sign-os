import React from 'react';

export interface DashboardSectionProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  subtitle,
  badge,
  actions,
  children,
  className = '',
}) => {
  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-0.5 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
            <h3 className="text-base font-bold text-white tracking-tight" style={{ fontFamily: 'inherit' }}>
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-[11px] pl-3 leading-relaxed" style={{ color: '#475569' }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>

      {/* Separator */}
      <div
        className="h-px w-full"
        style={{
          background:
            'linear-gradient(90deg, rgba(6,182,212,0.3) 0%, rgba(255,255,255,0.05) 40%, transparent 100%)',
        }}
      />

      <div>{children}</div>
    </section>
  );
};
