import React from 'react';
import { Card, CardContent, Progress, Skeleton, Button } from '../../../components/ui';
import { LucideIcon, ArrowRight } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  value?: string | number;
  secondaryValue?: string;
  progress?: {
    current: number;
    total: number;
    unit?: string;
    variant?: 'blue' | 'cyan' | 'purple' | 'magenta' | 'gradient';
  };
  metrics?: Array<{
    label: string;
    value: string | number;
  }>;
  cta?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'cyan' | 'outline' | 'ghost';
  };
  loading?: boolean;
  variant?: 'default' | 'highlight';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  value,
  secondaryValue,
  progress,
  metrics,
  cta,
  loading = false,
  variant = 'default',
}) => {
  return (
    <Card
      className={`h-full flex flex-col justify-between ${
        variant === 'highlight' ? 'border-[#06B6D4]/30 bg-gradient-to-b from-[#131D31] to-[#0D1527]' : ''
      }`}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] font-sans">
              {title}
            </span>
            {subtitle && <p className="text-[11px] text-[#64748B] leading-snug">{subtitle}</p>}
          </div>
          <div className="p-2 rounded-lg bg-white/5 text-[#06B6D4] border border-white/5 flex-shrink-0">
            <Icon className="w-4 h-4" />
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="space-y-2">
            <Skeleton height={28} className="w-1/2" />
            <Skeleton height={12} className="w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Primary Value */}
            {value && (
              <div className="flex items-baseline gap-2">
                <span className="font-display text-2xl font-bold text-white tracking-tight">
                  {value}
                </span>
                {secondaryValue && (
                  <span className="text-xs text-[#64748B] font-medium">{secondaryValue}</span>
                )}
              </div>
            )}

            {/* Progress bar if present */}
            {progress && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-[#94A3B8]">
                  <span>Uso Atual</span>
                  <span className="font-semibold text-white">
                    {progress.current} / {progress.total} {progress.unit || ''} (
                    {Math.round((progress.current / (progress.total || 1)) * 100)}%)
                  </span>
                </div>
                <Progress
                  value={(progress.current / (progress.total || 1)) * 100}
                  variant={progress.variant || 'cyan'}
                  size="sm"
                />
              </div>
            )}

            {/* Sub-metrics list */}
            {metrics && metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-white/5">
                {metrics.map((m, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] text-[#64748B] uppercase block font-medium">
                      {m.label}
                    </span>
                    <span className="text-xs font-bold text-white mt-0.5 block">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA Button */}
        {cta && !loading && (
          <div className="pt-2">
            <Button
              variant={cta.variant || 'outline'}
              size="sm"
              className="w-full justify-between text-xs"
              onClick={cta.onClick}
            >
              <span>{cta.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
