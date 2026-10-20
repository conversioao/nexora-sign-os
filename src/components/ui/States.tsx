import React from 'react';
import { FolderX, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './Button';

// Empty State
export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FolderX className="w-10 h-10 text-[#64748B]" />,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-white/10 bg-[#0B1120]/40 ${className}`}>
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-4 text-[#06B6D4]">
        {icon}
      </div>
      <h3 className="font-display font-semibold text-base text-[#F8FAFC] mb-1">{title}</h3>
      <p className="text-xs text-[#94A3B8] max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

// Error State
export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Ocorreu um erro',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-red-500/20 bg-[#251014]/60 ${className}`}>
      <div className="p-3 rounded-xl bg-red-500/10 text-[#EF4444] mb-3">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="font-display font-semibold text-base text-white mb-1">{title}</h3>
      <p className="text-xs text-red-200/80 max-w-md mb-4">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry}>
          Tentar Novamente
        </Button>
      )}
    </div>
  );
};

// Loading State
export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Carregando dados da infraestrutura...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <div className="relative flex items-center justify-center mb-4">
        <div className="w-12 h-12 rounded-full border-2 border-white/10 border-t-[#06B6D4] animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-[#2563EB]/40 animate-pulse" />
        </div>
      </div>
      <p className="text-xs font-medium text-[#94A3B8] tracking-wide animate-pulse">{label}</p>
    </div>
  );
};
