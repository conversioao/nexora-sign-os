import React, { useState, useEffect } from 'react';
import { MediaInventory } from '../../../types/advertising';
import { mediaInventoryRepository } from '../../../repositories/mediaInventoryRepository';
import { mediaInventoryService } from '../../../services/mediaInventoryService';
import { useToast } from '../../../components/ui/Toast';
import {
  TrendingUp,
  Tv,
  DollarSign,
  Calendar,
  Settings,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  MapPin,
  Sliders,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface MediaInventoryPageProps {
  onNavigateToDisplay?: (displayId: string) => void;
  onNavigateToMarketplace?: () => void;
}

export const MediaInventoryPage: React.FC<MediaInventoryPageProps> = ({
  onNavigateToDisplay,
  onNavigateToMarketplace,
}) => {
  const { addToast } = useToast();
  const [inventoryList, setInventoryList] = useState<MediaInventory[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<MediaInventory | null>(null);

  // Edit config state
  const [basePrice, setBasePrice] = useState<number>(100000);
  const [minDays, setMinDays] = useState<number>(3);
  const [isAdvertisingEnabled, setIsMonetizable] = useState<boolean>(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, clientMetrics] = await Promise.all([
        mediaInventoryRepository.getAll(),
        mediaInventoryService.getClientMonetizationMetrics('org-001'),
      ]);
      setInventoryList(list);
      setMetrics(clientMetrics);
    } catch (error) {
      console.error('Failed to load media inventory', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenConfig = (item: MediaInventory) => {
    setEditingItem(item);
    setBasePrice(item.basePrice);
    setMinDays(item.minimumBookingDays);
    setIsMonetizable(item.isAdvertisingEnabled);
  };

  const handleSaveConfig = async () => {
    if (!editingItem) return;
    try {
      const updated = await mediaInventoryService.toggleDisplayMonetization(
        editingItem.displayId,
        isAdvertisingEnabled,
        {
          basePrice: basePrice,
          minimumBookingDays: minDays,
        }
      );

      setInventoryList((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setEditingItem(null);
      addToast({
        title: 'Monetização Atualizada',
        description: `Configurações da tela ${editingItem.displayCode} salvas com sucesso.`,
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar as configurações de monetização.',
        type: 'error',
      });
    }
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(val) + ' Kz';
  };

  return (
    <div id="media-inventory-page-root" className="flex flex-col gap-6 p-6 max-w-7xl mx-auto min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              Gestão de Inventário & Monetização
            </span>
            <span className="text-xs text-slate-500">Rentabilização de Telas</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Monetização de Displays & Repasse de Mídia
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Disponibilize slots ociosos de suas telas para anunciantes externos e gere receita recorrente com divisão de repasse automática.
          </p>
        </div>

        {onNavigateToMarketplace && (
          <Button
            variant="outline"
            size="md"
            onClick={onNavigateToMarketplace}
            className="border-slate-700 text-slate-200"
          >
            Ver no Marketplace
          </Button>
        )}
      </div>

      {/* Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Tv className="w-3.5 h-3.5 text-[#38BDF8]" />
              Telas Monetizáveis
            </span>
            <p className="text-2xl font-black text-white mt-1">
              {metrics.monetizedDisplays} / {metrics.totalDisplays}
            </p>
            <span className="text-[11px] text-emerald-400">
              {Math.round((metrics.monetizedDisplays / metrics.totalDisplays) * 100)}% das suas telas ativas
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-[#06B6D4]" />
              Ocupação Média de Slots
            </span>
            <p className="text-2xl font-black text-white mt-1">
              {metrics.averageOccupancyRate}%
            </p>
            <span className="text-[11px] text-slate-400">Slots publicitários preenchidos</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <DollarSign className="w-3.5 h-3.5 text-[#10B981]" />
              Receita Mensal Estimada
            </span>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {formatKz(metrics.estimatedMonthlyEarningsKz)}
            </p>
            <span className="text-[11px] text-slate-400">Repasse líquido em Kz</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md">
            <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Próxima Liquidação
            </span>
            <p className="text-xl font-bold text-slate-200 mt-1">
              {metrics.nextPayoutDate}
            </p>
            <span className="text-[11px] text-slate-400">Depósito direto via BAI</span>
          </div>
        </div>
      )}

      {/* Inventory Table */}
      <div className="rounded-xl border border-slate-800 bg-[#0F172A]/90 backdrop-blur-md overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-white">Inventário de Displays da Organização</h3>
            <p className="text-xs text-slate-400">
              Configure preços base por dia e autorize veiculação de marcas parceiras
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {inventoryList.map((item) => (
            <div
              key={item.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-slate-900/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-[#38BDF8] border border-slate-800">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{item.displayCode}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400">{item.municipality}</span>
                    {item.isAdvertisingEnabled ? (
                      <Badge variant="online" size="sm" dot>Monetização Ativa</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">Privado / Desativado</Badge>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-200 mt-0.5">{item.venueName}</h4>
                  <span className="text-slate-500">
                    Ocupação de slots: <strong className="text-slate-300">{item.occupancyRate}%</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6">
                <div>
                  <span className="text-slate-500 block">Preço Base Diário</span>
                  <strong className="text-base font-bold text-[#38BDF8]">
                    {formatKz(item.basePrice)}
                  </strong>
                </div>

                <div>
                  <span className="text-slate-500 block">Reserva Mínima</span>
                  <strong className="text-slate-200">{item.minimumBookingDays} dias</strong>
                </div>

                <div className="flex items-center gap-2">
                  {onNavigateToDisplay && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToDisplay(item.displayId)}
                      className="border-slate-700 text-xs"
                    >
                      Ver Tela
                    </Button>
                  )}

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenConfig(item)}
                    className="bg-[#0284C7] hover:bg-[#0369A1] text-xs font-semibold"
                  >
                    <Settings className="w-3.5 h-3.5 mr-1" />
                    Configurar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-[#0F172A] p-6 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Configurar Monetização</h3>
                <p className="text-xs text-slate-400">{editingItem.displayCode} • {editingItem.venueName}</p>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 py-4 text-xs">
              {/* Toggle isAdvertisingEnabled */}
              <div className="flex items-center justify-between rounded-xl bg-slate-900/80 p-3 border border-slate-800">
                <div>
                  <span className="font-bold text-white">Disponibilizar no Marketplace</span>
                  <p className="text-slate-400 text-[11px]">
                    Permitir que anunciantes externos comprem slots publicitários nesta tela.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isAdvertisingEnabled}
                  onChange={(e) => setIsMonetizable(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-700 text-[#0284C7] focus:ring-0"
                />
              </div>

              {/* Base Price */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Preço Base por Dia (Kwanzas - Kz)
                </label>
                <input
                  type="number"
                  step={5000}
                  value={basePrice}
                  onChange={(e) => setBasePrice(Math.max(10000, parseInt(e.target.value) || 0))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-[#0284C7] focus:outline-none"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Valor sugerido para a região: 80.000 Kz a 180.000 Kz / dia
                </span>
              </div>

              {/* Minimum Booking Days */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Período Mínimo de Veiculação (Dias)
                </label>
                <select
                  value={minDays}
                  onChange={(e) => setMinDays(parseInt(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-[#0284C7] focus:outline-none"
                >
                  <option value={1}>1 dia (Eventos)</option>
                  <option value={3}>3 dias (Padrão Curto)</option>
                  <option value={7}>7 dias (Semanal)</option>
                  <option value={15}>15 dias (Quinzenal)</option>
                  <option value={30}>30 dias (Mensal)</option>
                </select>
              </div>

              {/* Revenue Split Info */}
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-[11px] text-emerald-300 space-y-1">
                <strong>Repasse Garantido Nexora: 70%</strong>
                <p>
                  Você receberá 70% de todo valor faturado dos anunciantes veiculados nesta tela, com liquidação mensal auditada.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingItem(null)}
                className="border-slate-700"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveConfig}
                className="bg-[#0284C7] hover:bg-[#0369A1] font-bold"
              >
                Salvar Configurações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
