import React from 'react';
import { ComponentSize } from '../../types/theme';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  size?: ComponentSize;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  active = false,
  className = '',
  disabled,
  ...props
}) => {
  const sizeStyles: Record<ComponentSize, string> = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-lg text-sm',
    lg: 'w-12 h-12 rounded-xl text-base',
  };

  const variantStyles = {
    primary: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white border border-blue-400/20',
    secondary: 'bg-[#131D31] hover:bg-[#18243D] text-[#F8FAFC] border border-white/10',
    ghost: active
      ? 'bg-[#2563EB]/15 text-[#06B6D4] border border-[#06B6D4]/30'
      : 'bg-transparent hover:bg-white/5 text-[#94A3B8] hover:text-[#F8FAFC]',
    outline: 'bg-transparent hover:bg-white/5 text-[#F8FAFC] border border-white/15 hover:border-white/30',
    danger: 'bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] border border-red-500/20',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
};
