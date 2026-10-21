import React from 'react';
import { DisplayKPIs } from '../../../types/domain';
import { Card, CardContent } from '../../../components/ui/Card';
import { Monitor, Wifi, WifiOff, Wrench, AlertTriangle } from 'lucide-react';
import { Skeleton } from '../../../components/ui/Skeleton';

interface DisplayKpiSummaryProps {
  kpis: DisplayKPIs;
  loading?: boolean;
  activeStatusFilter?: string;
  onSelectStatusFilter?: (status: string) => void;
}

export const DisplayKpiSummary: React.FC<DisplayKpiSummaryProps> = ({
  kpis,
  loading = false,
  activeStatusFilter = 'ALL',
  onSelectStatusFilter,
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="card" className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const items = [
    {
      id: 'ALL',
      label: 'Total de Displays',
      value: kpis.total,
      icon: <Monitor className="w-4 h-4 text-[#38BDF8]" />,
      accentColor: 'text-[#38BDF8]',
      borderColor: 'hover:border-[#38BDF8]/40',
      activeBorder: 'border-[#38BDF8]/60 bg-[#38BDF8]/5',
      badgeText: 'Rede Ativa',
      badgeBg: 'bg-[#0284C7]/15 text-[#38BDF8]',
    },
    {
      id: 'ONLINE',
      label: 'Online & Transmitindo',
      value: kpis.online,
      icon: <Wifi className="w-4 h-4 text-[#10B981]" />,
      accentColor: 'text-[#10B981]',
      borderColor: 'hover:border-[#10B981]/40',
      activeBorder: 'border-[#10B981]/60 bg-[#10B981]/5',
      badgeText: `${kpis.total > 0 ? Math.round((kpis.online / kpis.total) * 100) : 0}% Uptime`,
      badgeBg: 'bg-[#10B981]/15 text-[#10B981]',
    },
    {
      id: 'OFFLINE',
      label: 'Offline / Sem Sinal',
      value: kpis.offline,
      icon: <WifiOff className="w-4 h-4 text-[#EF4444]" />,
      accentColor: 'text-[#EF4444]',
      borderColor: 'hover:border-[#EF4444]/40',
      activeBorder: 'border-[#EF4444]/60 bg-[#EF4444]/5',
      badgeText: kpis.offline > 0 ? 'Ação Necessária' : 'Zero Quedas',
      badgeBg: 'bg-[#EF4444]/15 text-[#EF4444]',
    },
    {
      id: 'MAINTENANCE',
      label: 'Em Manutenção',
      value: kpis.maintenance,
      icon: <Wrench className="w-4 h-4 text-[#F59E0B]" />,
      accentColor: 'text-[#F59E0B]',
      borderColor: 'hover:border-[#F59E0B]/40',
      activeBorder: 'border-[#F59E0B]/60 bg-[#F59E0B]/5',
      badgeText: 'Técnico em Campo',
      badgeBg: 'bg-[#F59E0B]/15 text-[#F59E0B]',
    },
    {
      id: 'WARNING',
      label: 'Com Alerta / Atenção',
      value: kpis.warning,
      icon: <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />,
      accentColor: 'text-[#F59E0B]',
      borderColor: 'hover:border-[#F59E0B]/40',
      activeBorder: 'border-[#F59E0B]/60 bg-[#F59E0B]/5',
      badgeText: 'Temperatura / Rede',
      badgeBg: 'bg-[#F59E0B]/15 text-[#F59E0B]',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {items.map((item) => {
        const isSelected = activeStatusFilter === item.id;
        return (
          <Card
            key={item.id}
            onClick={() => onSelectStatusFilter && onSelectStatusFilter(item.id)}
            className={`transition-all duration-200 cursor-pointer ${item.borderColor} ${
              isSelected ? item.activeBorder : 'border-white/10'
            }`}
          >
            <CardContent className="p-4 flex flex-col justify-between h-full">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-medium text-[#94A3B8] truncate">{item.label}</span>
                <div className="p-1.5 rounded-lg bg-white/5 flex-shrink-0">{item.icon}</div>
              </div>
              <div className="flex items-baseline justify-between gap-2 mt-1">
                <span className={`text-2xl font-bold font-display tracking-tight ${item.accentColor}`}>
                  {item.value}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeBg}`}>
                  {item.badgeText}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
