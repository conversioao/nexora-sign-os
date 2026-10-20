import React from 'react';
import { ContractType } from '../../../types/contracts';
import { getContractTypeConfig } from '../utils/contractFormatters';
import {
  Layers,
  Tv,
  ShoppingCart,
  Cloud,
  Calendar,
  Wrench,
  Briefcase,
  FileText,
} from 'lucide-react';

interface ContractTypeBadgeProps {
  type: ContractType;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export const ContractTypeBadge: React.FC<ContractTypeBadgeProps> = ({
  type,
  showIcon = true,
  size = 'md',
}) => {
  const config = getContractTypeConfig(type);

  const renderIcon = () => {
    const iconProps = { className: size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5' };
    switch (type) {
      case 'DISPLAY_RENTAL_AND_SAAS':
        return <Layers {...iconProps} />;
      case 'DISPLAY_RENTAL':
        return <Tv {...iconProps} />;
      case 'DISPLAY_SALE':
        return <ShoppingCart {...iconProps} />;
      case 'SAAS_SUBSCRIPTION':
        return <Cloud {...iconProps} />;
      case 'EVENT_RENTAL':
        return <Calendar {...iconProps} />;
      case 'MAINTENANCE':
        return <Wrench {...iconProps} />;
      case 'SERVICE_AGREEMENT':
        return <Briefcase {...iconProps} />;
      default:
        return <FileText {...iconProps} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${config.badgeColor} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {showIcon && renderIcon()}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
