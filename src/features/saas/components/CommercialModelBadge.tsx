import React from 'react';
import { Tv, ShoppingBag, Laptop } from 'lucide-react';
import { SubscriptionCommercialModel } from '../../../types/saas';

interface CommercialModelBadgeProps {
  model: SubscriptionCommercialModel;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const CommercialModelBadge: React.FC<CommercialModelBadgeProps> = ({
  model,
  size = 'md',
  showIcon = true,
}) => {
  const config = {
    RENTAL_SAAS: {
      label: 'Aluguel + SaaS',
      icon: Tv,
      className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    },
    SALE_SAAS: {
      label: 'Venda + SaaS',
      icon: ShoppingBag,
      className: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30',
    },
    SUBSCRIPTION_ONLY: {
      label: 'BYOD / SaaS Only',
      icon: Laptop,
      className: 'bg-violet-500/10 text-violet-400 border border-violet-500/30',
    },
  }[model] || {
    label: model,
    icon: Tv,
    className: 'bg-slate-500/10 text-slate-400 border border-slate-500/30',
  };

  const Icon = config.icon;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium whitespace-nowrap ${paddingClass} ${config.className}`}
    >
      {showIcon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{config.label}</span>
    </span>
  );
};
