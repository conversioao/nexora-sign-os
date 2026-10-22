import React from 'react';
import { AdvertisingOpportunity } from '../../../types/advertising';
import {
  MapPin,
  Users,
  Eye,
  Clock,
  Tv,
  Check,
  Plus,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface OpportunityCardProps {
  opportunity: AdvertisingOpportunity;
  isSelected?: boolean;
  onSelectToggle?: (opportunity: AdvertisingOpportunity) => void;
  onViewDetails: (opportunity: AdvertisingOpportunity) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  isSelected = false,
  onSelectToggle,
  onViewDetails,
}) => {
  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(val) + ' Kz';
  };

  const getStatusBadge = () => {
    switch (opportunity.status) {
      case 'AVAILABLE':
        return <Badge variant="online" size="sm" dot>Disponível</Badge>;
      case 'LIMITED':
        return <Badge variant="warning" size="sm" dot>Poucos Slots</Badge>;
      case 'BOOKED':
        return <Badge variant="offline" size="sm" dot>Lotado</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Indisponível</Badge>;
    }
  };

  const getVenueTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      SHOPPING_CENTER: 'Centro Comercial',
      CORPORATE: 'Edifício Corporativo',
      HOTEL: 'Hotelaria de Luxo',
      TRANSPORT: 'Hub Aeroportuário',
      STREET_TOTEM: 'Totem Urbano Exterior',
      RETAIL_STORE: 'Hipermercado / Varejo',
      RESTAURANT: 'Gastronomia & Lazer',
      GYM: 'Academia & Bem-Estar',
      EVENT_VENUE: 'Espaço de Eventos',
    };
    return map[type] || 'Espaço Comercial';
  };

  return (
    <div
      id={`opp-card-${opportunity.id}`}
      className={`group relative flex flex-col rounded-xl border bg-[#0F172A]/90 backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-[#38BDF8]/50 hover:shadow-lg hover:shadow-[#0284C7]/10 ${
        isSelected
          ? 'border-[#0284C7] ring-2 ring-[#0284C7]/40 shadow-md shadow-[#0284C7]/20'
          : 'border-slate-800'
      }`}
    >
      {/* Top Banner Image with Gradient Overlay */}
      <div className="relative h-44 w-full overflow-hidden bg-slate-900">
        <img
          src={opportunity.imageUrl || opportunity.thumbnailUrl || (opportunity as any).coverImageUrl || (opportunity as any).cover_image_url || opportunity.photos?.[0] || 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=600&auto=format&fit=crop&q=80'}
          alt={opportunity.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {getStatusBadge()}
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-900/80 px-2 py-0.5 text-xs font-medium text-slate-300 backdrop-blur-md border border-slate-700/50">
            <Tv className="w-3 h-3 text-[#38BDF8]" />
            {opportunity.screenSize}
          </span>
        </div>

        {/* Selection Checkbox */}
        {onSelectToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectToggle(opportunity);
            }}
            className={`absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
              isSelected
                ? 'bg-[#0284C7] border-[#38BDF8] text-white shadow-md'
                : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
            }`}
            title={isSelected ? 'Remover da seleção' : 'Selecionar para campanha'}
          >
            {isSelected ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4" />}
          </button>
        )}

        {/* Venue Type & Municipality Overlay */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
          <span className="font-semibold text-[#38BDF8] tracking-wide uppercase text-[11px]">
            {getVenueTypeLabel(opportunity.venueType)}
          </span>
          <span className="flex items-center gap-1 text-slate-400 font-medium">
            <MapPin className="w-3 h-3 text-[#F43F5E]" />
            {opportunity.municipality}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-4">
        <h3
          onClick={() => onViewDetails(opportunity)}
          className="text-base font-semibold text-white leading-snug hover:text-[#38BDF8] cursor-pointer transition-colors line-clamp-1"
          title={opportunity.name}
        >
          {opportunity.name}
        </h3>
        <p className="mt-1 text-xs text-slate-400 line-clamp-1 flex items-center gap-1">
          <span className="text-slate-300 font-medium">{opportunity.venue}</span>
          <span>•</span>
          <span className="text-slate-500">{opportunity.ownerOrganizationName}</span>
        </p>

        {/* Audience & Reach Quick Metrics */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-lg bg-slate-900/70 p-2.5 border border-slate-800/80 text-xs">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 font-medium">
              <Users className="w-3 h-3 text-[#38BDF8]" />
              Alcance Diário
            </span>
            <span className="mt-0.5 text-sm font-bold text-slate-100">
              {opportunity.estimatedDailyReach.toLocaleString('pt-AO')}
            </span>
            <span className="text-[10px] text-slate-400">pessoas / dia</span>
          </div>

          <div className="flex flex-col border-l border-slate-800 pl-2.5">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1 font-medium">
              <Eye className="w-3 h-3 text-[#10B981]" />
              Impressões
            </span>
            <span className="mt-0.5 text-sm font-bold text-slate-100">
              {opportunity.estimatedDailyImpressions.toLocaleString('pt-AO')}
            </span>
            <span className="text-[10px] text-slate-400">exibições / dia</span>
          </div>
        </div>

        {/* Peak Hours & Tags */}
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-[#F59E0B]" />
            <span>Pico: <strong className="text-slate-200">{opportunity.audienceProfile.peakHours[0] || '12:00 - 14:00'}</strong></span>
          </div>
          <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">
            {opportunity.orientation === 'LANDSCAPE' ? 'Horizontal' : 'Vertical'}
          </span>
        </div>

        {/* Slots remaining alert / indicator */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${opportunity.remainingAdSlots === 0 ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`} />
            <span className={`text-[11px] font-bold ${opportunity.remainingAdSlots === 0 ? 'text-rose-400' : 'text-emerald-300 font-mono'}`}>
              {opportunity.remainingAdSlots === 0
                ? 'Sem espaço (Esgotado)'
                : `${opportunity.remainingAdSlots} ${opportunity.remainingAdSlots === 1 ? 'vaga restante' : 'vagas restantes'}`}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800/80 px-2 py-0.5 rounded">
            Total: {opportunity.maxAdSlots || 8} slots
          </span>
        </div>

        {/* Pricing and Action Footer */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
          <div>
            <span className="block text-[10px] text-slate-500 font-medium uppercase tracking-wider">
              A partir de
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-base font-extrabold text-[#38BDF8]">
                {formatKz(opportunity.basePrice)}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">/ dia</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(opportunity)}
              className="text-xs border-slate-700 hover:border-slate-500 text-slate-200"
            >
              Detalhes
            </Button>

            {onSelectToggle && (
              <Button
                variant={isSelected ? 'primary' : 'secondary'}
                size="sm"
                disabled={opportunity.remainingAdSlots === 0}
                onClick={() => onSelectToggle(opportunity)}
                className={`text-xs ${isSelected ? 'bg-[#0284C7] hover:bg-[#0369A1]' : ''} ${opportunity.remainingAdSlots === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {opportunity.remainingAdSlots === 0 ? (
                  'Esgotado'
                ) : isSelected ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Adicionado
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Adicionar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
