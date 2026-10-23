import React from 'react';
import { SignatureStatus } from '../../../types/contracts';
import { getSignatureStatusConfig } from '../utils/contractFormatters';
import { CheckCircle2, Clock, AlertCircle, MinusCircle } from 'lucide-react';

interface SignatureStatusBadgeProps {
  status: SignatureStatus;
  size?: 'sm' | 'md';
}

export const SignatureStatusBadge: React.FC<SignatureStatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const config = getSignatureStatusConfig(status);

  const renderIcon = () => {
    const iconProps = { className: size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5' };
    switch (status) {
      case 'SIGNED':
        return <CheckCircle2 {...iconProps} className="text-emerald-400" />;
      case 'PENDING':
        return <Clock {...iconProps} className="text-amber-400" />;
      case 'DECLINED':
        return <AlertCircle {...iconProps} className="text-red-400" />;
      default:
        return <MinusCircle {...iconProps} className="text-slate-400" />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.bg} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {renderIcon()}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
