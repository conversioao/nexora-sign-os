import React from 'react';
import {
  ListVideo,
  CheckCircle2,
  PauseCircle,
  Calendar,
  Clock,
  Monitor
} from 'lucide-react';
import { PlaylistKPIs } from '../../../types/domain';
import { Skeleton } from '../../../components/ui/Skeleton';
import { formatDurationHuman } from '../utils/playlistUtils';

interface PlaylistKpiSummaryProps {
  kpis: PlaylistKPIs | null;
  isLoading: boolean;
  onFilterStatus?: (status: string) => void;
}

export const PlaylistKpiSummary: React.FC<PlaylistKpiSummaryProps> = ({
  kpis,
  isLoading,
  onFilterStatus,
}) => {
  if (isLoading || !kpis) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-[#0F172A]/80 border border-white/5 rounded-xl p-3.5 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="w-16 h-3 rounded" />
              <Skeleton className="w-6 h-6 rounded-lg" />
            </div>
            <Skeleton className="w-12 h-6 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      id: 'total',
      label: 'Total Playlists',
      value: kpis.total,
      icon: ListVideo,
      iconColor: 'text-[#38BDF8]',
      iconBg: 'bg-[#38BDF8]/10',
      statusFilter: 'ALL',
    },
    {
      id: 'active',
      label: 'Playlists Ativas',
      value: kpis.active,
      icon: CheckCircle2,
      iconColor: 'text-[#10B981]',
      iconBg: 'bg-[#10B981]/10',
      statusFilter: 'ACTIVE',
    },
    {
      id: 'paused',
      label: 'Pausadas',
      value: kpis.paused,
      icon: PauseCircle,
      iconColor: 'text-[#F59E0B]',
      iconBg: 'bg-[#F59E0B]/10',
      statusFilter: 'PAUSED',
    },
    {
      id: 'scheduled',
      label: 'Agendadas',
      value: kpis.scheduled,
      icon: Calendar,
      iconColor: 'text-[#C084FC]',
      iconBg: 'bg-[#C084FC]/10',
      statusFilter: 'SCHEDULED',
    },
    {
      id: 'duration',
      label: 'Duração Total',
      value: formatDurationHuman(kpis.totalDurationSeconds),
      icon: Clock,
      iconColor: 'text-[#06B6D4]',
      iconBg: 'bg-[#06B6D4]/10',
      subtext: 'Loop somado da rede',
    },
    {
      id: 'displays',
      label: 'Displays Vinculados',
      value: kpis.associatedDisplaysTotal,
      icon: Monitor,
      iconColor: 'text-[#EC4899]',
      iconBg: 'bg-[#EC4899]/10',
      subtext: 'Telas com playlist',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((c) => {
        const Icon = c.icon;
        const isClickable = Boolean(c.statusFilter && onFilterStatus);

        return (
          <button
            key={c.id}
            type="button"
            disabled={!isClickable}
            onClick={() => c.statusFilter && onFilterStatus?.(c.statusFilter)}
            className={`text-left bg-[#0F172A]/80 border border-white/5 rounded-xl p-3.5 transition-all duration-200 ${
              isClickable
                ? 'hover:border-white/20 hover:bg-[#131D31] cursor-pointer'
                : 'cursor-default'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-medium text-[#94A3B8] truncate">
                {c.label}
              </span>
              <div className={`p-1.5 rounded-lg ${c.iconBg} ${c.iconColor}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-display text-[#F8FAFC]">
                {c.value}
              </span>
            </div>
            {c.subtext && (
              <span className="text-[10px] text-[#64748B] block mt-0.5 truncate">
                {c.subtext}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
