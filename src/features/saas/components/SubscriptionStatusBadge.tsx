import React from 'react';
import { CheckCircle2, Clock, AlertCircle, AlertTriangle, XCircle, Ban } from 'lucide-react';
import { SubscriptionStatus } from '../../../types/saas';

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus;
  size?: 'sm' | 'md';
}

export const SubscriptionStatusBadge: React.FC<SubscriptionStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const config = {
    ACTIVE: {
      label: 'Ativa',
      icon: CheckCircle2,
      className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    },
    TRIAL: {
      label: 'Trial (Avaliação)',
      icon: Clock,
      className: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    },
    PAST_DUE: {
      label: 'Past Due (Pendente)',
      icon: AlertTriangle,
      className: 'bg-orange-500/10 text-orange-400 border border-orange-500/30',
    },
    SUSPENDED: {
      label: 'Suspensa',
      icon: AlertCircle,
      className: 'bg-rose-500/10 text-rose-400 border border-rose-500/30',
    },
    CANCELLED: {
      label: 'Cancelada',
      icon: Ban,
      className: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
    },
    EXPIRED: {
      label: 'Expirada',
      icon: XCircle,
      className: 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/30',
    },
  }[status] || {
    label: status,
    icon: CheckCircle2,
    className: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
  };

  const Icon = config.icon;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${paddingClass} ${config.className}`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
    </span>
  );
};
