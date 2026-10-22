import React from 'react';
import { CustomerLifecycleStage, LIFECYCLE_STAGE_LABELS } from '../../../types/crm';
import { CheckCircle2, Clock, PlayCircle, PauseCircle, AlertTriangle, XCircle } from 'lucide-react';

interface CustomerLifecycleBadgeProps {
  stage: CustomerLifecycleStage;
  showStep?: boolean;
  size?: 'sm' | 'md';
}

export const CustomerLifecycleBadge: React.FC<CustomerLifecycleBadgeProps> = ({
  stage,
  showStep = false,
  size = 'md',
}) => {
  const config = LIFECYCLE_STAGE_LABELS[stage] || LIFECYCLE_STAGE_LABELS.ACTIVE;

  const getIcon = () => {
    switch (stage) {
      case 'LEAD':
        return <Clock className="w-3 h-3" />;
      case 'PROSPECT':
        return <PlayCircle className="w-3 h-3" />;
      case 'ACTIVE':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'INACTIVE':
        return <PauseCircle className="w-3 h-3" />;
      case 'SUSPENDED':
        return <AlertTriangle className="w-3 h-3" />;
      case 'CHURNED':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.color} ${sizeClasses} whitespace-nowrap`}
    >
      {getIcon()}
      <span>
        {showStep ? `${config.step}. ` : ''}
        {config.label}
      </span>
    </span>
  );
};

interface CustomerLifecyclePipelineProps {
  currentStage: CustomerLifecycleStage;
  className?: string;
  onStageChange?: (newStage: CustomerLifecycleStage) => void;
}

export const CustomerLifecyclePipeline: React.FC<CustomerLifecyclePipelineProps> = ({
  currentStage,
  className = '',
  onStageChange,
}) => {
  const stages: CustomerLifecycleStage[] = ['LEAD', 'PROSPECT', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'CHURNED'];
  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className={`p-3 rounded-xl bg-[#0F172A]/80 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
        {stages.map((stage, idx) => {
          const config = LIFECYCLE_STAGE_LABELS[stage];
          const isCurrent = stage === currentStage;
          const isPast = idx < currentIndex && currentStage !== 'CHURNED' && currentStage !== 'SUSPENDED';

          let stateStyle = 'bg-white/5 text-[#94A3B8] border-white/5 opacity-60';
          if (isCurrent) {
            stateStyle = `${config.color} font-semibold ring-2 ring-[#06B6D4]/30`;
          } else if (isPast) {
            stateStyle = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
          }

          return (
            <button
              key={stage}
              type="button"
              disabled={!onStageChange}
              onClick={() => onStageChange && onStageChange(stage)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all whitespace-nowrap ${stateStyle} ${
                onStageChange ? 'hover:opacity-100 cursor-pointer' : 'cursor-default'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-mono">
                {idx + 1}
              </span>
              <span>{config.label}</span>
              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4] animate-pulse ml-0.5" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
