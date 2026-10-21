import React from 'react';
import { Schedule } from '../../../types/domain';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Skeleton } from '../../../components/ui';
import { CalendarClock, Clock, ArrowRight, Layers } from 'lucide-react';

export interface SchedulePreviewProps {
  schedules: Schedule[];
  loading?: boolean;
  onNavigateToScheduling?: () => void;
  onNavigateToScheduleDetail?: (id: string) => void;
  maxItems?: number;
}

export const SchedulePreview: React.FC<SchedulePreviewProps> = ({
  schedules,
  loading = false,
  onNavigateToScheduling,
  onNavigateToScheduleDetail,
  maxItems = 4,
}) => {
  const displayList = schedules.slice(0, maxItems);

  return (
    <Card className="h-full flex flex-col justify-between">
      <CardHeader className="pb-3 border-b border-white/[0.06] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-[#38BDF8]">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-white font-display">Próximas Reproduções</CardTitle>
            <p className="text-[11px] text-[#94A3B8]">Grade e slots ativos nas suas telas</p>
          </div>
        </div>
        {onNavigateToScheduling && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToScheduling}
            className="text-xs text-[#00E5FF] hover:text-white"
          >
            Ver grade <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-4 flex-1 divide-y divide-white/[0.06]">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 py-2">
                <Skeleton height={32} width={50} className="rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton height={14} className="w-3/4" />
                  <Skeleton height={10} className="w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div className="py-8 text-center text-[#64748B] text-xs">
            Nenhuma programação ativa configurada.
          </div>
        ) : (
          displayList.map((sch) => (
            <div
              key={sch.id}
              onClick={() => onNavigateToScheduleDetail?.(sch.id)}
              className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group hover:bg-white/[0.03] -mx-2 px-3 rounded-xl transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Time badge */}
                <div className="px-2.5 py-1.5 rounded-lg bg-[#1677FF]/15 border border-[#1677FF]/30 text-[#38BDF8] font-mono text-xs font-semibold flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{sch.startTime}</span>
                </div>

                {/* Schedule Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white group-hover:text-[#00E5FF] transition-colors truncate">
                      {sch.name}
                    </span>
                    <Badge variant={sch.status === 'ACTIVE' ? 'active' : 'scheduled'} size="sm">
                      {sch.status === 'ACTIVE' ? 'No Ar' : sch.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#94A3B8] truncate">
                    <span className="flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5 text-[#64748B]" />
                      {sch.playlistName || 'Playlist Principal'}
                    </span>
                    <span>•</span>
                    <span>Término: {sch.endTime}</span>
                  </div>
                </div>
              </div>

              {/* Displays tag */}
              <div className="flex-shrink-0 text-right">
                <span className="text-[11px] font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
                  {sch.displayIds?.length || 1} {sch.displayIds?.length === 1 ? 'tela' : 'telas'}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

