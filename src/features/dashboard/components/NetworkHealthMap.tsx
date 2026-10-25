import React from 'react';
import { LuandaZoneSummary } from '../../../types/domain';
import { Skeleton, Badge } from '../../../components/ui';
import { MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface NetworkHealthMapProps {
  zones: LuandaZoneSummary[];
  loading?: boolean;
  onSelectZone?: (municipality: string) => void;
}

export const NetworkHealthMap: React.FC<NetworkHealthMapProps> = ({
  zones,
  loading = false,
  onSelectZone,
}) => {
  const totalDisplays = zones.reduce((acc, z) => acc + z.totalDisplays, 0);
  const totalOnline = zones.reduce((acc, z) => acc + z.onlineDisplays, 0);

  return (
    <div
      className="h-full flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(10,17,33,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex flex-row items-center justify-between"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-lg"
            style={{
              background: 'rgba(37,99,235,0.1)',
              border: '1px solid rgba(37,99,235,0.2)',
              color: '#60A5FA',
            }}
          >
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Distribuição da Rede (Luanda)</p>
            <p className="text-[11px]" style={{ color: '#334155' }}>
              Densidade e status de displays por município
            </p>
          </div>
        </div>

        <Badge variant="live" dot>
          {totalOnline}/{totalDisplays} Telas Ativas
        </Badge>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} height={80} />
            ))}
          </div>
        ) : zones.length === 0 ? (
          <div className="py-10 text-center">
            <MapPin className="w-8 h-8 mx-auto mb-2 opacity-20" style={{ color: '#94A3B8' }} />
            <p className="text-xs" style={{ color: '#334155' }}>
              Nenhuma zona registada ainda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {zones.map((zone) => {
              const hasAlert = zone.offlineDisplays > 0;
              const pct = zone.occupancyRate;

              return (
                <button
                  key={zone.zone}
                  type="button"
                  onClick={() => onSelectZone?.(zone.municipality)}
                  className="group w-full text-left rounded-xl p-3.5 transition-all duration-200 hover:-translate-y-0.5 focus:outline-none"
                  style={{
                    background: hasAlert
                      ? 'rgba(239,68,68,0.04)'
                      : 'rgba(255,255,255,0.02)',
                    border: hasAlert
                      ? '1px solid rgba(239,68,68,0.18)'
                      : '1px solid rgba(255,255,255,0.07)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = hasAlert
                      ? 'rgba(239,68,68,0.35)'
                      : 'rgba(6,182,212,0.25)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = hasAlert
                      ? 'rgba(239,68,68,0.18)'
                      : 'rgba(255,255,255,0.07)';
                  }}
                >
                  {/* Zone header */}
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${hasAlert ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                      />
                      <span className="text-xs font-semibold text-white truncate">
                        {zone.municipality}
                      </span>
                    </div>
                    <span
                      className="text-[10px] font-mono font-bold flex-shrink-0"
                      style={{ color: hasAlert ? '#F87171' : '#34D399' }}
                    >
                      {pct}%
                    </span>
                  </div>

                  {/* Mini progress bar */}
                  <div
                    className="h-1 w-full rounded-full mb-2.5"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: hasAlert
                          ? 'linear-gradient(90deg, #EF4444, #F87171)'
                          : 'linear-gradient(90deg, #10B981, #34D399)',
                      }}
                    />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-baseline gap-1">
                      <span className="font-black text-white text-sm">
                        {zone.onlineDisplays}
                      </span>
                      <span style={{ color: '#334155' }}>/ {zone.totalDisplays} telas</span>
                    </div>

                    {hasAlert ? (
                      <span
                        className="flex items-center gap-0.5 font-semibold text-[10px]"
                        style={{ color: '#F87171' }}
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {zone.offlineDisplays} off
                      </span>
                    ) : (
                      <span
                        className="flex items-center gap-0.5 font-semibold text-[10px]"
                        style={{ color: '#34D399' }}
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        100% OK
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
