import React from 'react';
import {
  Wifi,
  WifiOff,
  AlertTriangle,
  AlertCircle,
  Wrench,
  RefreshCw,
  Play,
  Pause,
  CalendarClock,
  Zap,
  Ban,
  FileEdit,
  Clock
} from 'lucide-react';
import { BadgeVariant } from '../../types/theme';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  icon?: boolean | React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  icon = false,
  className = '',
}) => {
  const variantStyles: Record<
    BadgeVariant,
    { bg: string; text: string; border: string; dotColor: string; defaultIcon?: React.ReactNode }
  > = {
    online: {
      bg: 'bg-[#10B981]/15',
      text: 'text-[#10B981]',
      border: 'border-[#10B981]/30',
      dotColor: 'bg-[#10B981]',
      defaultIcon: <Wifi className="w-3 h-3 text-[#10B981]" />,
    },
    offline: {
      bg: 'bg-[#EF4444]/15',
      text: 'text-[#EF4444]',
      border: 'border-[#EF4444]/30',
      dotColor: 'bg-[#EF4444]',
      defaultIcon: <WifiOff className="w-3 h-3 text-[#EF4444]" />,
    },
    warning: {
      bg: 'bg-[#F59E0B]/15',
      text: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/30',
      dotColor: 'bg-[#F59E0B]',
      defaultIcon: <AlertTriangle className="w-3 h-3 text-[#F59E0B]" />,
    },
    error: {
      bg: 'bg-[#EF4444]/15',
      text: 'text-[#EF4444]',
      border: 'border-[#EF4444]/30',
      dotColor: 'bg-[#EF4444]',
      defaultIcon: <AlertCircle className="w-3 h-3 text-[#EF4444]" />,
    },
    maintenance: {
      bg: 'bg-[#F59E0B]/15',
      text: 'text-[#F59E0B]',
      border: 'border-[#F59E0B]/30',
      dotColor: 'bg-[#F59E0B]',
      defaultIcon: <Wrench className="w-3 h-3 text-[#F59E0B]" />,
    },
    syncing: {
      bg: 'bg-[#06B6D4]/15',
      text: 'text-[#06B6D4]',
      border: 'border-[#06B6D4]/30',
      dotColor: 'bg-[#06B6D4]',
      defaultIcon: <RefreshCw className="w-3 h-3 text-[#06B6D4] animate-spin" />,
    },
    playing: {
      bg: 'bg-[#10B981]/15',
      text: 'text-[#10B981]',
      border: 'border-[#10B981]/30',
      dotColor: 'bg-[#10B981]',
      defaultIcon: <Play className="w-3 h-3 text-[#10B981]" />,
    },
    paused: {
      bg: 'bg-white/10',
      text: 'text-[#94A3B8]',
      border: 'border-white/15',
      dotColor: 'bg-[#94A3B8]',
      defaultIcon: <Pause className="w-3 h-3 text-[#94A3B8]" />,
    },
    scheduled: {
      bg: 'bg-[#06B6D4]/15',
      text: 'text-[#06B6D4]',
      border: 'border-[#06B6D4]/30',
      dotColor: 'bg-[#06B6D4]',
      defaultIcon: <CalendarClock className="w-3 h-3 text-[#06B6D4]" />,
    },
    active: {
      bg: 'bg-[#2563EB]/15',
      text: 'text-[#38BDF8]',
      border: 'border-[#2563EB]/35',
      dotColor: 'bg-[#06B6D4]',
      defaultIcon: <Zap className="w-3 h-3 text-[#38BDF8]" />,
    },
    inactive: {
      bg: 'bg-white/5',
      text: 'text-[#64748B]',
      border: 'border-white/10',
      dotColor: 'bg-[#64748B]',
      defaultIcon: <Ban className="w-3 h-3 text-[#64748B]" />,
    },
    draft: {
      bg: 'bg-white/5',
      text: 'text-[#94A3B8]',
      border: 'border-white/10',
      dotColor: 'bg-[#64748B]',
      defaultIcon: <FileEdit className="w-3 h-3 text-[#94A3B8]" />,
    },
    pending: {
      bg: 'bg-[#7C3AED]/15',
      text: 'text-[#C084FC]',
      border: 'border-[#7C3AED]/30',
      dotColor: 'bg-[#C084FC]',
      defaultIcon: <Clock className="w-3 h-3 text-[#C084FC]" />,
    },
    live: {
      bg: 'bg-[#2563EB]/15',
      text: 'text-[#38BDF8]',
      border: 'border-[#2563EB]/35',
      dotColor: 'bg-[#06B6D4]',
      defaultIcon: <Zap className="w-3 h-3 text-[#38BDF8]" />,
    },
    blue: {
      bg: 'bg-[#2563EB]/15',
      text: 'text-[#60A5FA]',
      border: 'border-[#2563EB]/30',
      dotColor: 'bg-[#2563EB]',
    },
    purple: {
      bg: 'bg-[#7C3AED]/15',
      text: 'text-[#C084FC]',
      border: 'border-[#7C3AED]/30',
      dotColor: 'bg-[#7C3AED]',
    },
    cyan: {
      bg: 'bg-[#06B6D4]/15',
      text: 'text-[#22D3EE]',
      border: 'border-[#06B6D4]/30',
      dotColor: 'bg-[#06B6D4]',
    },
    magenta: {
      bg: 'bg-[#EC4899]/15',
      text: 'text-[#F472B6]',
      border: 'border-[#EC4899]/30',
      dotColor: 'bg-[#EC4899]',
    },
    neutral: {
      bg: 'bg-white/5',
      text: 'text-[#E2E8F0]',
      border: 'border-white/10',
      dotColor: 'bg-[#94A3B8]',
    },
  };

  const style = variantStyles[variant] || variantStyles.neutral;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  const iconElement =
    typeof icon === 'boolean'
      ? icon
        ? style.defaultIcon
        : null
      : icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border whitespace-nowrap select-none ${style.bg} ${style.text} ${style.border} ${sizeClass} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${style.dotColor}`} />
      )}
      {iconElement && <span className="flex-shrink-0">{iconElement}</span>}
      {children}
    </span>
  );
};

