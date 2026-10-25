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
  Clock,
  CheckCircle2,
  Info
} from 'lucide-react';
import { StatusType } from '../../types/theme';

export interface StatusIndicatorProps {
  status: StatusType | string;
  label?: string;
  showPulse?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  showPulse = true,
  showIcon = false,
  size = 'md',
  className = '',
}) => {
  const normalized = (status ? status.toLowerCase() : 'info') as StatusType;

  const config: Record<
    StatusType,
    {
      color: string;
      bg: string;
      text: string;
      defaultLabel: string;
      icon: React.ReactNode;
      pulse: boolean;
    }
  > = {
    online: {
      color: 'bg-[#10B981]',
      bg: 'bg-[#10B981]/15',
      text: 'text-[#10B981]',
      defaultLabel: 'Online',
      icon: <Wifi className="w-3.5 h-3.5 text-[#10B981]" />,
      pulse: true,
    },
    offline: {
      color: 'bg-[#EF4444]',
      bg: 'bg-[#EF4444]/15',
      text: 'text-[#EF4444]',
      defaultLabel: 'Offline',
      icon: <WifiOff className="w-3.5 h-3.5 text-[#EF4444]" />,
      pulse: false,
    },
    warning: {
      color: 'bg-[#F59E0B]',
      bg: 'bg-[#F59E0B]/15',
      text: 'text-[#F59E0B]',
      defaultLabel: 'Alerta',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />,
      pulse: true,
    },
    error: {
      color: 'bg-[#EF4444]',
      bg: 'bg-[#EF4444]/15',
      text: 'text-[#EF4444]',
      defaultLabel: 'Erro Crítico',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#EF4444]" />,
      pulse: true,
    },
    maintenance: {
      color: 'bg-[#F59E0B]',
      bg: 'bg-[#F59E0B]/15',
      text: 'text-[#F59E0B]',
      defaultLabel: 'Manutenção',
      icon: <Wrench className="w-3.5 h-3.5 text-[#F59E0B]" />,
      pulse: true,
    },
    syncing: {
      color: 'bg-[#06B6D4]',
      bg: 'bg-[#06B6D4]/15',
      text: 'text-[#06B6D4]',
      defaultLabel: 'Sincronizando',
      icon: <RefreshCw className="w-3.5 h-3.5 text-[#06B6D4] animate-spin" />,
      pulse: true,
    },
    playing: {
      color: 'bg-[#10B981]',
      bg: 'bg-[#10B981]/15',
      text: 'text-[#10B981]',
      defaultLabel: 'Em Exibição',
      icon: <Play className="w-3.5 h-3.5 text-[#10B981]" />,
      pulse: true,
    },
    paused: {
      color: 'bg-[#94A3B8]',
      bg: 'bg-white/10',
      text: 'text-[#94A3B8]',
      defaultLabel: 'Pausado',
      icon: <Pause className="w-3.5 h-3.5 text-[#94A3B8]" />,
      pulse: false,
    },
    scheduled: {
      color: 'bg-[#06B6D4]',
      bg: 'bg-[#06B6D4]/15',
      text: 'text-[#06B6D4]',
      defaultLabel: 'Programado',
      icon: <CalendarClock className="w-3.5 h-3.5 text-[#06B6D4]" />,
      pulse: false,
    },
    active: {
      color: 'bg-[#2563EB]',
      bg: 'bg-[#2563EB]/15',
      text: 'text-[#38BDF8]',
      defaultLabel: 'Ativo',
      icon: <Zap className="w-3.5 h-3.5 text-[#38BDF8]" />,
      pulse: true,
    },
    inactive: {
      color: 'bg-[#64748B]',
      bg: 'bg-white/5',
      text: 'text-[#64748B]',
      defaultLabel: 'Inativo',
      icon: <Ban className="w-3.5 h-3.5 text-[#64748B]" />,
      pulse: false,
    },
    draft: {
      color: 'bg-[#94A3B8]',
      bg: 'bg-white/10',
      text: 'text-[#94A3B8]',
      defaultLabel: 'Rascunho',
      icon: <FileEdit className="w-3.5 h-3.5 text-[#94A3B8]" />,
      pulse: false,
    },
    pending: {
      color: 'bg-[#C084FC]',
      bg: 'bg-[#7C3AED]/15',
      text: 'text-[#C084FC]',
      defaultLabel: 'Pendente',
      icon: <Clock className="w-3.5 h-3.5 text-[#C084FC]" />,
      pulse: true,
    },
    success: {
      color: 'bg-[#10B981]',
      bg: 'bg-[#10B981]/15',
      text: 'text-[#10B981]',
      defaultLabel: 'Concluído',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />,
      pulse: false,
    },
    info: {
      color: 'bg-[#06B6D4]',
      bg: 'bg-[#06B6D4]/15',
      text: 'text-[#06B6D4]',
      defaultLabel: 'Informação',
      icon: <Info className="w-3.5 h-3.5 text-[#06B6D4]" />,
      pulse: false,
    },
  };

  const cur = config[normalized] || config.info;

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 whitespace-nowrap select-none ${className}`}>
      {showIcon ? (
        <span className="flex-shrink-0">{cur.icon}</span>
      ) : (
        <span className="relative flex items-center justify-center flex-shrink-0">
          {showPulse && cur.pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cur.color}`}
            />
          )}
          <span className={`relative inline-flex rounded-full ${dotSizes[size]} ${cur.color}`} />
        </span>
      )}
      {label !== undefined ? (
        label && <span className={`text-xs font-medium ${cur.text}`}>{label}</span>
      ) : (
        <span className={`text-xs font-medium ${cur.text}`}>{cur.defaultLabel}</span>
      )}
    </div>
  );
};

