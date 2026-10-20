import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  variant?: 'blue' | 'cyan' | 'purple' | 'magenta' | 'success' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  variant = 'gradient',
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  const variantGradients = {
    blue: 'bg-[#2563EB]',
    cyan: 'bg-[#06B6D4]',
    purple: 'bg-[#7C3AED]',
    magenta: 'bg-[#EC4899]',
    success: 'bg-[#10B981]',
    gradient: 'bg-gradient-to-r from-[#06B6D4] via-[#2563EB] to-[#7C3AED]',
  };

  return (
    <div className={`w-full flex flex-col gap-1.5 ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs font-semibold text-[#94A3B8]">
          <span>Progresso</span>
          <span className="text-white font-mono">{percentage.toFixed(0)}%</span>
        </div>
      )}
      <div className={`w-full bg-[#0B1120] rounded-full overflow-hidden border border-white/10 ${sizeClasses[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${variantGradients[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
