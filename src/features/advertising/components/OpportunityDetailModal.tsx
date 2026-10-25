import React, { useState } from 'react';
import { AdvertisingOpportunity, PricingCalculationResult } from '../../../types/advertising';
import { advertisingPricingService } from '../../../services/advertisingPricingService';
import {
  MapPin,
  Users,
  Eye,
  Tv,
  Clock,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Sliders,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Building,
  Info,
  X,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface OpportunityDetailModalProps {
  opportunity: AdvertisingOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onStartCampaign: (opportunity: AdvertisingOpportunity, quote: PricingCalculationResult, spotDurationSeconds?: number) => void;
  isSelected?: boolean;
  onToggleSelect?: (opportunity: AdvertisingOpportunity) => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  isOpen,
  onClose,
  onStartCampaign,
  isSelected = false,
  onToggleSelect,
}) => {
  if (!isOpen || !opportunity) return null;

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [bookingDays, setBookingDays] = useState(14);
  const [dailyFrequency, setDailyFrequency] = useState(6);
  const [spotDuration, setSpotDuration] = useState<10 | 15 | 30>(15);

  // Compute live quote based on interactive slider
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + bookingDays * 86400000).toISOString().split('T')[0];

  const quote = advertisingPricingService.calculateBookingPrice({
    opportunity,
    startDate,
    endDate,
    dailyFrequency,
  });

  // Adjust total quote proportionally if spot duration is 30s (+50%) or 10s (-15%)
  const durationMultiplier = spotDuration === 30 ? 1.5 : spotDuration === 10 ? 0.85 : 1.0;
  const adjustedTotalPrice = Math.round(quote.totalPrice * durationMultiplier);
  const adjustedSubtotal = Math.round(quote.subtotal * durationMultiplier);

  const photos = opportunity.photos && opportunity.photos.length > 0
    ? opportunity.photos
    : [opportunity.imageUrl || opportunity.thumbnailUrl || (opportunity as any).coverImageUrl || (opportunity as any).cover_image_url || 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1000&auto=format&fit=crop&q=80'];

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(val) + ' Kz';
  };

  return (
    <div
      id="opportunity-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="opportunity-detail-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700/80 bg-[#0F172A] text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#38BDF8] uppercase tracking-wider">
                {opportunity.venue}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">{opportunity.displayCode}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-0.5">{opportunity.name}</h2>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Gallery & Quick Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Gallery (7 cols) */}
            <div className="md:col-span-7 flex flex-col gap-2">
              <div className="relative h-64 w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800">
                <img
                  src={photos[activePhotoIndex]}
                  alt={opportunity.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge variant="online" size="sm" dot>Disponível na Rede</Badge>
                  <span className="rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-md border border-white/10">
                    {opportunity.screenSize}
                  </span>
                </div>
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div className="flex gap-2">
                  {photos.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`h-14 w-20 overflow-hidden rounded-lg border-2 transition-all ${
                        activePhotoIndex === idx
                          ? 'border-[#0284C7] ring-2 ring-[#0284C7]/40'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={p} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Specs & Location (5 cols) */}
            <div className="md:col-span-5 flex flex-col justify-between rounded-xl bg-slate-900/60 border border-slate-800 p-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#F43F5E]" />
                  Localização & Ponto
                </span>
                <p className="mt-1.5 text-sm font-medium text-slate-200">
                  {opportunity.address || opportunity.location}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 font-medium">
                    Município: {opportunity.municipality}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-slate-300 font-medium">
                    Bairro: {opportunity.neighborhood || 'Central'}
                  </span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolução:</span>
                  <strong className="text-slate-200">{opportunity.resolution}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Orientação:</span>
                  <strong className="text-slate-200">
                    {opportunity.orientation === 'LANDSCAPE' ? 'Horizontal (Landscape)' : 'Vertical (Portrait)'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duração do Spot:</span>
                  <strong className="text-slate-200">{opportunity.spotDurationSeconds || 15} segundos</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Proprietário da Tela:</span>
                  <strong className="text-slate-200">{opportunity.ownerOrganizationName}</strong>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Capacidade da Grade:</span>
                  <span className="font-mono font-bold text-slate-200">{opportunity.maxAdSlots || 8} slots totais</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vagas / Espaço Restante:</span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                    opportunity.remainingAdSlots === 0 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {opportunity.remainingAdSlots === 0 
                      ? '0 Vagas (Tela Lotada)' 
                      : `${opportunity.remainingAdSlots} ${opportunity.remainingAdSlots === 1 ? 'vaga disponível' : 'vagas disponíveis'}`}
                  </span>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap gap-1.5">
                {opportunity.tags?.map((t, idx) => (
                  <span
                    key={idx}
                    className="rounded-md bg-[#0284C7]/15 border border-[#0284C7]/30 px-2 py-0.5 text-[11px] font-medium text-[#38BDF8]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Audience Demographics & Behavioral Profile */}
          <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#38BDF8]" />
                Perfil de Audiência & Demografia Estimada
              </h3>
              <span className="rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 px-2.5 py-0.5 text-xs font-semibold">
                Classe Socioeconómica {opportunity.audienceProfile.socioeconomicTier}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Daily Reach & Footfall */}
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
                <span className="text-xs text-slate-400">Fluxo Diário Estimado</span>
                <p className="text-lg font-bold text-white mt-0.5">
                  {opportunity.estimatedDailyReach.toLocaleString('pt-AO')} pessoas
                </p>
                <span className="text-[11px] text-slate-500">
                  ~{(opportunity.estimatedDailyReach * 30).toLocaleString('pt-AO')} pessoas / mês
                </span>
              </div>

              {/* Gender Breakdown */}
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
                <span className="text-xs text-slate-400">Distribuição por Gênero</span>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden flex">
                    <div
                      style={{ width: `${opportunity.audienceProfile.genderDistribution.male}%` }}
                      className="bg-[#0284C7]"
                      title={`Masculino: ${opportunity.audienceProfile.genderDistribution.male}%`}
                    />
                    <div
                      style={{ width: `${opportunity.audienceProfile.genderDistribution.female}%` }}
                      className="bg-[#EC4899]"
                      title={`Feminino: ${opportunity.audienceProfile.genderDistribution.female}%`}
                    />
                  </div>
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span className="text-[#38BDF8]">Masc: {opportunity.audienceProfile.genderDistribution.male}%</span>
                  <span className="text-[#F472B6]">Fem: {opportunity.audienceProfile.genderDistribution.female}%</span>
                </div>
              </div>

              {/* Peak Hours */}
              <div className="rounded-lg bg-slate-950/60 border border-slate-800/80 p-3">
                <span className="text-xs text-slate-400">Horários de Maior Concentração</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {opportunity.audienceProfile.peakHours.map((hour, idx) => (
                    <span
                      key={idx}
                      className="rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 text-xs font-semibold"
                    >
                      {hour}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Behavioral notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="rounded-lg bg-slate-950/40 p-3 border border-slate-800/60">
                <strong className="block text-slate-200 font-semibold mb-1">Dias Úteis (Segunda a Sexta):</strong>
                <p className="text-slate-400">{opportunity.audienceProfile.weekdayProfile}</p>
              </div>
              <div className="rounded-lg bg-slate-950/40 p-3 border border-slate-800/60">
                <strong className="block text-slate-200 font-semibold mb-1">Finais de Semana & Feriados:</strong>
                <p className="text-slate-400">{opportunity.audienceProfile.weekendProfile}</p>
              </div>
            </div>
          </div>

          {/* Interactive Pricing Simulator & Quote */}
          <div className="rounded-xl bg-gradient-to-br from-[#0284C7]/15 via-slate-900/80 to-slate-900 border border-[#0284C7]/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#38BDF8]" />
                Simulador de Investimento & Volume
              </h3>
              {quote.discountPercentage > 0 && (
                <span className="rounded-full bg-[#10B981]/20 text-[#34D399] border border-[#10B981]/40 px-3 py-0.5 text-xs font-bold animate-pulse">
                  Desconto de Volume: -{quote.discountPercentage}% aplicado
                </span>
              )}
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Período de Veiculação:</span>
                  <span className="font-bold text-[#38BDF8]">{bookingDays} dias ({quote.days} dias faturados)</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={90}
                  step={1}
                  value={bookingDays}
                  onChange={(e) => setBookingDays(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#0284C7]"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>3 dias (mínimo)</span>
                  <span>15 dias (-10%)</span>
                  <span>30 dias (-15%)</span>
                  <span>90 dias (-20%)</span>
                </div>
              </div>

              {/* Daily Frequency Selector */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">Frequência por Hora:</span>
                  <span className="font-bold text-[#38BDF8]">{dailyFrequency} inserções / hora</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[4, 6, 8, 12].map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setDailyFrequency(freq)}
                      className={`rounded-lg py-1.5 text-xs font-semibold border transition-all ${
                        dailyFrequency === freq
                          ? 'bg-[#0284C7] border-[#38BDF8] text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {freq}x / h
                    </button>
                  ))}
                </div>
                <span className="block text-[10px] text-slate-400">
                  Total diário estimado: {dailyFrequency * 16} exibições por dia.
                </span>
              </div>

              {/* Spot Duration Selector (10s, 15s, 30s) */}
              <div className="md:col-span-2 space-y-2 pt-2 border-t border-slate-800">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    Duração do Spot no Loop da Tela:
                  </span>
                  <span className="font-bold text-[#38BDF8]">{spotDuration} segundos por inserção</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 15, 30].map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setSpotDuration(dur as any)}
                      className={`rounded-xl py-2.5 px-3 text-xs font-semibold border transition-all flex flex-col items-center gap-1 ${
                        spotDuration === dur
                          ? 'bg-[#0284C7] border-[#38BDF8] text-white shadow-md ring-1 ring-[#38BDF8]'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm font-bold">{dur} Segundos</span>
                      <span className="text-[10px] text-slate-300">
                        {dur === 10 ? 'Spot Rápido (-15%)' : dur === 15 ? 'Padrão da Grade' : 'Spot Estendido (+50%)'}
                      </span>
                    </button>
                  ))}
                </div>
                <span className="block text-[10px] text-slate-400">
                  O tempo definido aqui será aplicado automaticamente à playlist do display quando a campanha for veiculada.
                </span>
              </div>
            </div>

            {/* Quote Financial Breakdown */}
            <div className="mt-4 rounded-xl bg-slate-950/80 p-4 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400">Preço Base Diário:</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {formatKz(opportunity.basePrice)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Total de Exibições (Loops):</span>
                <p className="text-sm font-bold text-slate-200 mt-0.5">
                  {quote.estimatedPlays.toLocaleString('pt-AO')} plays
                </p>
              </div>
              <div>
                <span className="text-slate-400">Duração / Spot:</span>
                <p className="text-sm font-bold text-[#38BDF8] mt-0.5">
                  {spotDuration}s por exibição
                </p>
              </div>
              <div>
                <span className="text-slate-400">CPM Estimado:</span>
                <p className="text-sm font-bold text-[#10B981] mt-0.5">
                  {formatKz(quote.estimatedCPM)} / mil
                </p>
              </div>
            </div>

            {/* Total Highlight */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 border-t border-slate-800">
              <div>
                <span className="text-xs text-slate-400">Valor Total do Período ({bookingDays} dias • {spotDuration}s):</span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-extrabold text-[#38BDF8]">
                    {formatKz(adjustedTotalPrice)}
                  </span>
                  {quote.discountAmount > 0 && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatKz(adjustedSubtotal)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {onToggleSelect && (
                  <Button
                    variant={isSelected ? 'secondary' : 'outline'}
                    size="md"
                    onClick={() => onToggleSelect(opportunity)}
                    className="border-slate-700"
                  >
                    {isSelected ? 'Remover da Seleção' : 'Adicionar à Seleção'}
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onStartCampaign(opportunity, { ...quote, totalPrice: adjustedTotalPrice, subtotal: adjustedSubtotal }, spotDuration)}
                  className="bg-[#0284C7] hover:bg-[#0369A1] shadow-lg shadow-[#0284C7]/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Criar Campanha com Este Ponto
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
