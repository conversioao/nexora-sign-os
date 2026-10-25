import React from 'react';
import { ContractStatus } from '../../../types/contracts';
import { getContractStatusConfig } from '../utils/contractFormatters';

interface ContractStatusBadgeProps {
  status: ContractStatus;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export const ContractStatusBadge: React.FC<ContractStatusBadgeProps> = ({
  status,
  size = 'md',
  showDot = true,
}) => {
  const config = getContractStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      <span className="whitespace-nowrap">{config.label}</span>
    </span>
  );
};
