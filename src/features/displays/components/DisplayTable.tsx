import React from 'react';
import { Display } from '../../../types/domain';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Dropdown, DropdownItem } from '../../../components/ui/Dropdown';
import { Button } from '../../../components/ui/Button';
import {
  MoreVertical,
  Eye,
  RefreshCw,
  Edit2,
  Power,
  Pause,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tv,
  LayoutGrid,
  Smartphone,
  Layers,
  ShoppingBag,
  Sparkles,
  DollarSign,
  UserCheck,
  RotateCcw,
  Megaphone,
  Unlink,
  Trash2,
} from 'lucide-react';
import { DisplaySortField, SortDirection } from '../hooks/useDisplays';
import {
  formatHeartbeatTime,
  formatDeviceTypeLabel,
  formatCurrencyKz,
  formatCommercialModel,
  formatCommercialStatus,
  mapDisplayStatusToVariant,
} from '../utils/displayFormatters';
import { CommercialActionType } from './DisplayCommercialActionModal';

interface DisplayTableProps {
  displays: Display[];
  sortField: DisplaySortField;
  sortDirection: SortDirection;
  onSort: (field: DisplaySortField) => void;
  onSelectDisplay: (display: Display) => void;
  onSyncDisplay: (id: string) => void;
  onRestartDisplay: (id: string) => void;
  onResetDisplay?: (id: string) => void;
  onEditDisplay?: (display: Display) => void;
  onDeleteDisplay?: (id: string) => void;
  onCommercialAction?: (display: Display, action: CommercialActionType) => void;
}

export const DisplayTable: React.FC<DisplayTableProps> = ({
  displays,
  sortField,
  sortDirection,
  onSort,
  onSelectDisplay,
  onSyncDisplay,
  onRestartDisplay,
  onResetDisplay,
  onEditDisplay,
  onDeleteDisplay,
  onCommercialAction,
}) => {
  const renderSortIcon = (field: DisplaySortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-[#64748B] opacity-60 ml-1 inline" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#06B6D4] ml-1 inline" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#06B6D4] ml-1 inline" />
    );
  };

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
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0F172A]">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/10 bg-[#0B1120]/70">
            {/* Status Operacional */}
            <TableHead
              className="cursor-pointer select-none hover:text-white transition-colors"
              onClick={() => onSort('status')}
            >
              <div className="flex items-center">
                Status {renderSortIcon('status')}
              </div>
            </TableHead>

            {/* Display / ID */}
            <TableHead
              className="cursor-pointer select-none hover:text-white transition-colors min-w-[200px]"
              onClick={() => onSort('name')}
            >
              <div className="flex items-center">
                Display & Código {renderSortIcon('name')}
              </div>
            </TableHead>

            {/* Location */}
            <TableHead
              className="cursor-pointer select-none hover:text-white transition-colors min-w-[170px]"
              onClick={() => onSort('location')}
            >
              <div className="flex items-center">
                Localização {renderSortIcon('location')}
              </div>
            </TableHead>

            {/* Modelo & Status Comercial */}
            <TableHead
              className="cursor-pointer select-none hover:text-white transition-colors min-w-[180px]"
              onClick={() => onSort('commercialModel')}
            >
              <div className="flex items-center">
                Modelo & Comercial {renderSortIcon('commercialModel')}
              </div>
            </TableHead>

            {/* Cliente / Titular */}
            <TableHead className="min-w-[150px]">Cliente / Organização</TableHead>

            {/* Valor / Mensalidade */}
            <TableHead
              className="cursor-pointer select-none hover:text-white transition-colors min-w-[130px]"
              onClick={() => onSort('monthlyFee')}
            >
              <div className="flex items-center">
                Tarifa / Mensalidade {renderSortIcon('monthlyFee')}
              </div>
            </TableHead>

            {/* Publicidade Programática */}
            <TableHead className="min-w-[120px]">Publicidade</TableHead>

            {/* Heartbeat */}
            <TableHead
              className="cursor-pointer select-none hover:text-white transition-colors min-w-[130px]"
              onClick={() => onSort('heartbeat')}
            >
              <div className="flex items-center">
                Heartbeat {renderSortIcon('heartbeat')}
              </div>
            </TableHead>

            {/* Actions */}
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {displays.map((display) => {
            const statusConfig = mapDisplayStatusToVariant(display.status);
            const hb = formatHeartbeatTime(display.lastHeartbeatAt);
            const profile = display.commercialProfile;
            const commModel = formatCommercialModel(profile?.commercialModel || display.commercialModel);
            const commStatus = formatCommercialStatus(profile?.commercialStatus || display.commercialStatus);
            const customerName = profile?.customerOrganizationName || display.clientName;
            const isAdEligible = profile?.advertisingEligible ?? display.advertisingEligible ?? false;

            const actionItems: DropdownItem[] = [
              {
                id: 'details',
                label: 'Ver Detalhes & Comercial',
                icon: <Eye className="w-3.5 h-3.5" />,
                onClick: () => onSelectDisplay(display),
              },
              {
                id: 'rent',
                label: 'Alugar Display (Contrato)',
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
                label: 'Alugar p/ Evento Pontual',
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
                label: 'Monetização de Anúncios',
                icon: <Megaphone className="w-3.5 h-3.5 text-cyan-400" />,
                onClick: () => onCommercialAction && onCommercialAction(display, 'ADVERTISING_SETTINGS'),
              },
              {
                id: 'return',
                label: 'Retornar ao Inventário Livre',
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
                onClick: () => onRestartDisplay(display.id),
              },
              {
                id: 'delete',
                label: 'Excluir Display',
                icon: <Trash2 className="w-3.5 h-3.5 text-rose-400" />,
                danger: true,
                onClick: () => {
                  if (window.confirm(`Tem certeza que deseja excluir permanentemente o display "${display.name}" (${display.code})? Esta ação não pode ser desfeita.`)) {
                    onDeleteDisplay && onDeleteDisplay(display.id);
                  }
                },
              },
            ];

            return (
              <TableRow
                key={display.id}
                className="hover:bg-white/[0.03] transition-colors group cursor-pointer"
                onClick={(e) => {
                  // Avoid triggering row click when clicking actions dropdown
                  if ((e.target as HTMLElement).closest('.dropdown-trigger-area')) return;
                  onSelectDisplay(display);
                }}
              >
                {/* Status */}
                <TableCell>
                  <Badge variant={statusConfig.variant} icon dot size="sm">
                    {statusConfig.label}
                  </Badge>
                </TableCell>

                {/* Display Identity */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="font-display font-medium text-white text-xs group-hover:text-[#38BDF8] transition-colors">
                      {display.name}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-[10px] font-semibold text-[#06B6D4] bg-[#06B6D4]/10 px-1.5 py-0.2 rounded border border-[#06B6D4]/20">
                        {display.code}
                      </span>
                      <span className="text-[10px] text-[#64748B]">{display.screenSizeInches}"</span>
                      <span className="text-[10px] text-[#64748B]">{display.orientation === 'PORTRAIT' ? '9:16' : '16:9'}</span>
                    </div>
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-[#F8FAFC]">
                      {display.location.municipality}
                    </span>
                    <span className="text-[11px] text-[#94A3B8] truncate max-w-[160px]" title={display.location.venueName}>
                      {display.location.venueName}
                    </span>
                  </div>
                </TableCell>

                {/* Modelo & Status Comercial */}
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${commModel.badgeClass}`}>
                      {commModel.shortLabel}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${commStatus.colorClass}`}>
                      {commStatus.label}
                    </span>
                  </div>
                </TableCell>

                {/* Cliente / Titular */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-medium text-[#CBD5E1] truncate max-w-[140px]" title={customerName || 'Inventário Livre Nexora'}>
                      {customerName || <span className="text-emerald-400 italic">Disponível</span>}
                    </span>
                    {profile?.contractNumber && (
                      <span className="text-[10px] font-mono text-[#64748B]">
                        {profile.contractNumber}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Valor / Mensalidade */}
                <TableCell>
                  <div className="flex flex-col gap-0.5">
                    {profile?.monthlyFeeKz ? (
                      <span className="text-xs font-mono font-semibold text-[#10B981]">
                        {formatCurrencyKz(profile.monthlyFeeKz)}
                        <span className="text-[10px] text-[#64748B] font-normal">/mês</span>
                      </span>
                    ) : profile?.salePriceKz ? (
                      <span className="text-xs font-mono font-semibold text-indigo-400">
                        {formatCurrencyKz(profile.salePriceKz)}
                        <span className="text-[10px] text-[#64748B] font-normal"> (venda)</span>
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-[#38BDF8]">
                        {formatCurrencyKz(display.dailyRateKz)}
                        <span className="text-[10px] text-[#64748B] font-normal">/dia</span>
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Publicidade Programática */}
                <TableCell>
                  {isAdEligible ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <Megaphone className="w-2.5 h-2.5" /> Anúncios
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                      Privado
                    </span>
                  )}
                </TableCell>

                {/* Heartbeat */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-block w-1.5 h-1.5 rounded-full ${
                        hb.isCritical
                          ? 'bg-[#EF4444]'
                          : hb.isStale
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#10B981]'
                      }`}
                    />
                    <span
                      className={`text-xs font-mono ${
                        hb.isCritical
                          ? 'text-[#EF4444] font-medium'
                          : hb.isStale
                          ? 'text-[#F59E0B]'
                          : 'text-[#94A3B8]'
                      }`}
                    >
                      {hb.label}
                    </span>
                  </div>
                </TableCell>

                {/* Actions Dropdown */}
                <TableCell className="text-right dropdown-trigger-area">
                  <Dropdown
                    align="right"
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-[#94A3B8] hover:text-white"
                        aria-label={`Ações para ${display.code}`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    }
                    items={actionItems}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

