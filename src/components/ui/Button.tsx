import React from 'react';
import { Loader2 } from 'lucide-react';
import { ButtonVariant, ComponentSize } from '../../types/theme';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ComponentSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const isButtonLoading = isLoading || loading;
  const sizeStyles: Record<ComponentSize, string> = {
    sm: 'px-3 py-1.5 text-xs font-medium gap-1.5 rounded-lg h-8',
    md: 'px-4 py-2 text-sm font-medium gap-2 rounded-lg h-10',
    lg: 'px-5 py-2.5 text-base font-semibold gap-2.5 rounded-xl h-12',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#2563EB] hover:bg-[#1D4ED8] active:bg-[#1E40AF] text-white shadow-lg shadow-[#2563EB]/20 border border-blue-400/20 focus-visible:ring-2 focus-visible:ring-[#2563EB]/50',
    secondary:
      'bg-[#131D31] hover:bg-[#18243D] active:bg-[#24324D] text-[#F8FAFC] border border-white/10 hover:border-white/20 focus-visible:ring-2 focus-visible:ring-white/20',
    outline:
      'bg-transparent hover:bg-white/5 active:bg-white/10 text-[#F8FAFC] border border-white/20 hover:border-white/40 focus-visible:ring-2 focus-visible:ring-white/20',
    ghost:
      'bg-transparent hover:bg-white/5 active:bg-white/10 text-[#94A3B8] hover:text-[#F8FAFC] border border-transparent focus-visible:ring-2 focus-visible:ring-white/20',
    danger:
      'bg-[#EF4444] hover:bg-[#DC2626] active:bg-[#B91C1C] text-white shadow-lg shadow-[#EF4444]/20 border border-red-400/20 focus-visible:ring-2 focus-visible:ring-[#EF4444]/50',
    cyan:
      'bg-[#06B6D4] hover:bg-[#0891B2] active:bg-[#0E7490] text-[#070B14] font-semibold shadow-lg shadow-[#06B6D4]/20 border border-cyan-300/30 focus-visible:ring-2 focus-visible:ring-[#06B6D4]/50',
    magenta:
      'bg-[#EC4899] hover:bg-[#DB2777] active:bg-[#BE185D] text-white shadow-lg shadow-[#EC4899]/20 border border-pink-400/20 focus-visible:ring-2 focus-visible:ring-[#EC4899]/50',
  };

  const isDisabled = disabled || isButtonLoading;

  return (
    <button
      disabled={isDisabled}
      className={`inline-flex items-center justify-center select-none transition-all duration-200 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isButtonLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {!isButtonLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!isButtonLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
