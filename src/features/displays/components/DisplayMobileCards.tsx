import React from 'react';
import { Display } from '../../../types/domain';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Dropdown, DropdownItem } from '../../../components/ui/Dropdown';
import { Button } from '../../../components/ui/Button';
import {
  MoreVertical,
  Eye,
  RefreshCw,
  Edit2,
  Power,
  MapPin,
  Tv,
  Film,
  Clock,
  Smartphone,
  LayoutGrid,
  Layers,
  Monitor,
  ShoppingBag,
  DollarSign,
  Sparkles,
  UserCheck,
  RotateCcw,
  Megaphone,
  Unlink,
} from 'lucide-react';
import {
  formatHeartbeatTime,
  formatDeviceTypeLabel,
  formatCurrencyKz,
  formatCommercialModel,
  formatCommercialStatus,
  mapDisplayStatusToVariant,
} from '../utils/displayFormatters';
import { CommercialActionType } from './DisplayCommercialActionModal';

interface DisplayMobileCardsProps {
  displays: Display[];
  onSelectDisplay: (display: Display) => void;
  onSyncDisplay: (id: string) => void;
  onRestartDisplay: (id: string) => void;
  onResetDisplay?: (id: string) => void;
  onEditDisplay?: (display: Display) => void;
  onCommercialAction?: (display: Display, action: CommercialActionType) => void;
  onTogglePowerDisplay?: (id: string, isPowered: boolean) => void;
}

export const DisplayMobileCards: React.FC<DisplayMobileCardsProps> = ({
  displays,
  onSelectDisplay,
  onSyncDisplay,
  onRestartDisplay,
  onResetDisplay,
  onEditDisplay,
  onCommercialAction,
  onTogglePowerDisplay,
}) => {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'ANDROID_TV':
        return <Tv className="w-3.5 h-3.5 text-[#38BDF8]" />;
      case 'TV_BOX':
        return <Layers className="w-3.5 h-3.5 text-[#818CF8]" />;
      case 'TOTEM':
        return <Smartphone className="w-3.5 h-3.5 text-[#F472B6]" />;
      case 'VIDEO_WALL':
        return <LayoutGrid className="w-3.5 h-3.5 text-[#C084FC]" />;
      default:
        return <Monitor className="w-3.5 h-3.5 text-[#94A3B8]" />;
    }
  };

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
      {displays.map((display) => {
        const statusConfig = mapDisplayStatusToVariant(display.status);
        const hb = formatHeartbeatTime(display.lastHeartbeatAt);
        const profile = display.commercialProfile;
        const commModel = formatCommercialModel(profile?.commercialModel || display.commercialModel);
        const commStatus = formatCommercialStatus(profile?.commercialStatus || display.commercialStatus);
        const customerName = profile?.customerOrganizationName || display.clientName;
        const isAdEligible = profile?.advertisingEligible ?? display.advertisingEligible ?? false;
        const isPowered = display.isPoweredOn ?? display.is_powered_on ?? true;

        const actionItems: DropdownItem[] = [
          {
            id: 'details',
            label: 'Ver Detalhes & Comercial',
            icon: <Eye className="w-3.5 h-3.5" />,
            onClick: () => onSelectDisplay(display),
          },
          {
            id: 'toggle-power',
            label: isPowered ? 'Desligar Display (Silenciar WhatsApp)' : 'Ligar Display (Ativar Alertas WhatsApp)',
            icon: <Power className={`w-3.5 h-3.5 ${isPowered ? 'text-amber-400' : 'text-emerald-400'}`} />,
            onClick: () => onTogglePowerDisplay && onTogglePowerDisplay(display.id, !isPowered),
          },
          {
            id: 'rent',
            label: 'Alugar Display',
            icon: <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />,
            onClick: () => onCommercialAction && onCommercialAction(display, 'RENT'),
          },
          {
            id: 'sell',
            label: 'Vender Hardware',
            icon: <DollarSign className="w-3.5 h-3.5 text-indigo-400" />,
            onClick: () => onCommercialAction && onCommercialAction(display, 'SELL'),
          },
          {
            id: 'event',
            label: 'Alugar p/ Evento',
            icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
            onClick: () => onCommercialAction && onCommercialAction(display, 'EVENT'),
          },
          {
            id: 'assign',
            label: 'Associar a Cliente',
            icon: <UserCheck className="w-3.5 h-3.5 text-teal-400" />,
            onClick: () => onCommercialAction && onCommercialAction(display, 'ASSIGN_CUSTOMER'),
          },
          {
            id: 'ads',
            label: 'Configurar Publicidade',
            icon: <Megaphone className="w-3.5 h-3.5 text-cyan-400" />,
            onClick: () => onCommercialAction && onCommercialAction(display, 'ADVERTISING_SETTINGS'),
          },
          {
            id: 'return',
            label: 'Retornar ao Inventário',
            icon: <RotateCcw className="w-3.5 h-3.5 text-slate-400" />,
            onClick: () => onCommercialAction && onCommercialAction(display, 'RETURN_INVENTORY'),
          },
          {
            id: 'sync',
            label: 'Sincronizar Grade',
            icon: <RefreshCw className="w-3.5 h-3.5" />,
            onClick: () => onSyncDisplay(display.id),
          },
          {
            id: 'reset',
            label: 'Resetar Conexão',
            icon: <Unlink className="w-3.5 h-3.5 text-amber-400" />,
            onClick: () => {
              if (window.confirm(`Tem certeza que deseja resetar a TV Box ${display.name} (${display.code})? O dispositivo voltará à tela inicial para novo PIN.`)) {
                onResetDisplay && onResetDisplay(display.id);
              }
            },
          },
          {
            id: 'restart',
            label: 'Reiniciar Player',
            icon: <Power className="w-3.5 h-3.5" />,
            danger: true,
            onClick: () => onRestartDisplay(display.id),
          },
        ];

        return (
          <Card
            key={display.id}
            className="hover:border-white/20 transition-all duration-200 cursor-pointer"
            onClick={() => onSelectDisplay(display)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Header: Code + Status + Commercial Badge + Action Dropdown */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono text-xs font-semibold text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20">
                    {display.code}
                  </span>
                  <Badge variant={statusConfig.variant} icon dot size="sm">
                    {statusConfig.label}
                  </Badge>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${commStatus.colorClass}`}>
                    {commStatus.label}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePowerDisplay && onTogglePowerDisplay(display.id, !isPowered);
                    }}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-all cursor-pointer ${
                      isPowered
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                    title={
                      isPowered
                        ? 'Display LIGADO (Alertas WhatsApp ativos). Clique para desligar.'
                        : 'Display DESLIGADO (Alertas WhatsApp silenciados). Clique para ligar.'
                    }
                  >
                    <Power className={`w-2.5 h-2.5 ${isPowered ? 'text-emerald-400' : 'text-amber-400'}`} />
                    {isPowered ? 'Ligado' : 'Desligado'}
                  </button>
                </div>

                <div
                  className="dropdown-trigger-area"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropdown
                    align="right"
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-[#94A3B8] hover:text-white"
                        aria-label={`Ações para ${display.code}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    }
                    items={actionItems}
                  />
                </div>
              </div>

              {/* Title & Client */}
              <div>
                <h4 className="font-display font-semibold text-sm text-white leading-snug">
                  {display.name}
                </h4>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className="text-xs text-[#CBD5E1] truncate">
                    {customerName || <span className="text-emerald-400 italic">Disponível no Inventário</span>}
                  </p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${commModel.badgeClass}`}>
                    {commModel.shortLabel}
                  </span>
                </div>
              </div>

              {/* Location & Specs Chips */}
              <div className="space-y-1.5 text-xs text-[#94A3B8]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#06B6D4] flex-shrink-0" />
                  <span className="truncate">
                    {display.location.municipality} • {display.location.venueName}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded text-[11px] text-[#CBD5E1]">
                      {getDeviceIcon(display.deviceType)}
                      {formatDeviceTypeLabel(display.deviceType)}
                    </span>
                    <span className="bg-white/5 px-2 py-0.5 rounded text-[11px] text-[#CBD5E1]">
                      {display.orientation === 'PORTRAIT' ? '9:16' : '16:9'}
                    </span>
                  </div>

                  <div className="font-mono text-xs font-semibold text-[#10B981]">
                    {profile?.monthlyFeeKz
                      ? `${formatCurrencyKz(profile.monthlyFeeKz)}/mês`
                      : profile?.salePriceKz
                      ? `${formatCurrencyKz(profile.salePriceKz)}`
                      : `${formatCurrencyKz(display.dailyRateKz)}/dia`}
                  </div>
                </div>
              </div>

              {/* Content or Ad pill */}
              <div className="bg-[#0B1120] p-2.5 rounded-lg border border-white/5 text-xs flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[#38BDF8] font-medium text-[11px] truncate">
                  <Film className="w-3 h-3 shrink-0" />
                  <span className="truncate text-[#E2E8F0]">{display.currentContent || 'Grade Padrão Nexora'}</span>
                </div>
                {isAdEligible && (
                  <span className="text-[10px] text-emerald-400 font-medium shrink-0 ml-2">📢 Anúncios</span>
                )}
              </div>

              {/* Footer: Heartbeat */}
              <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-[#64748B]">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  <span
                    className={`font-mono ${
                      hb.isCritical ? 'text-[#EF4444] font-medium' : hb.isStale ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
                    }`}
                  >
                    Heartbeat: {hb.label}
                  </span>
                </div>
                <span className="text-[#38BDF8] font-medium hover:underline text-xs">
                  Ver Detalhes →
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

