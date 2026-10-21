import React, { useState, useEffect } from 'react';
import {
  AdvertisingOpportunity,
  MarketplaceFilterState,
  AdvertisingCampaign,
  PricingCalculationResult,
} from '../../../types/advertising';
import { advertisingOpportunityRepository } from '../../../repositories/advertisingOpportunityRepository';
import { advertisingPricingService } from '../../../services/advertisingPricingService';
import { OpportunityCard } from '../components/OpportunityCard';
import { OpportunityDetailModal } from '../components/OpportunityDetailModal';
import { MarketplaceFiltersBar } from '../components/MarketplaceFiltersBar';
import { CampaignCreationWizardModal } from '../components/CampaignCreationWizardModal';
import {
  Store,
  Sparkles,
  MapPin,
  Users,
  Eye,
  Tv,
  CheckCircle2,
  SlidersHorizontal,
  Megaphone,
  ArrowRight,
  TrendingUp,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface MarketplacePageProps {
  onNavigateToCampaigns?: () => void;
  onNavigateToCampaignDetail?: (campaignId: string) => void;
  onNavigateToNewDisplay?: () => void;
}

export const MarketplacePage: React.FC<MarketplacePageProps> = ({
  onNavigateToCampaigns,
  onNavigateToCampaignDetail,
  onNavigateToNewDisplay,
}) => {
  const [opportunities, setOpportunities] = useState<AdvertisingOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [filters, setFilters] = useState<MarketplaceFilterState>({
    municipality: 'ALL',
    venueType: 'ALL',
    orientation: 'ALL',
    availability: 'ALL',
    searchQuery: '',
    sortBy: 'POPULARITY',
  });

  // Selected Points for Campaign Cart
  const [selectedOpportunities, setSelectedOpportunities] = useState<AdvertisingOpportunity[]>([]);

  // Modals State
  const [inspectingOpportunity, setInspectingOpportunity] = useState<AdvertisingOpportunity | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardInitialOpps, setWizardInitialOpps] = useState<AdvertisingOpportunity[]>([]);
  const [wizardInitialSpotDuration, setWizardInitialSpotDuration] = useState<number>(15);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const data = await advertisingOpportunityRepository.getAll(filters);
      setOpportunities(data);
    } catch (error) {
      console.error('Failed to load opportunities', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunities();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<MarketplaceFilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      municipality: 'ALL',
      venueType: 'ALL',
      orientation: 'ALL',
      availability: 'ALL',
      searchQuery: '',
      sortBy: 'POPULARITY',
    });
  };

  const handleToggleSelect = (opp: AdvertisingOpportunity) => {
    if (selectedOpportunities.some((o) => o.id === opp.id)) {
      setSelectedOpportunities(selectedOpportunities.filter((o) => o.id !== opp.id));
    } else {
      setSelectedOpportunities([...selectedOpportunities, opp]);
    }
  };

  const handleStartCampaignFromSingle = (
    opp: AdvertisingOpportunity,
    quote: PricingCalculationResult,
    spotDurationSeconds?: number
  ) => {
    setInspectingOpportunity(null);
    setWizardInitialOpps([opp]);
    setWizardInitialSpotDuration(spotDurationSeconds || 15);
    setIsWizardOpen(true);
  };

  const handleStartCampaignFromCart = () => {
    setWizardInitialOpps(selectedOpportunities);
    setWizardInitialSpotDuration(15);
    setIsWizardOpen(true);
  };

  const handleCampaignCreated = (newCampaign: AdvertisingCampaign) => {
    setSelectedOpportunities([]);
    if (onNavigateToCampaignDetail) {
      onNavigateToCampaignDetail(newCampaign.id);
    } else if (onNavigateToCampaigns) {
      onNavigateToCampaigns();
    }
  };

  // Cart financial preview (for 14 days default quote)
  const cartQuote = advertisingPricingService.calculateCampaignQuote(
    selectedOpportunities,
    new Date().toISOString().split('T')[0],
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(val) + ' Kz';
  };

  return (
    <div id="marketplace-page-root" className="flex flex-col gap-6 p-6 max-w-7xl mx-auto min-h-screen">
      {/* Top Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center gap-1 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 px-2.5 py-0.5 text-xs font-semibold text-[#38BDF8]">
              <Store className="w-3.5 h-3.5" />
              Nexora Media Marketplace
            </span>
            <span className="text-xs text-slate-500">Luanda • Angola</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Rede Publicitária & Inventário de Mídia Digital
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 max-w-3xl">
            Descubra pontos premium de Digital Signage em centros comerciais, aeroporto, hotéis 5 estrelas e totens urbanos com estimativas reais de audiência e veiculação garantida.
          </p>
        </div>

        <div className="flex items-center gap-3">

          <Button
            variant="outline"
            size="md"
            onClick={onNavigateToCampaigns}
            className="border-slate-700 text-slate-200 hover:text-white"
          >
            <Megaphone className="w-4 h-4 mr-2 text-[#38BDF8]" />
            Minhas Campanhas
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setWizardInitialOpps(selectedOpportunities.length > 0 ? selectedOpportunities : opportunities.slice(0, 2));
              setIsWizardOpen(true);
            }}
            className="bg-[#0284C7] hover:bg-[#0369A1] shadow-lg shadow-[#0284C7]/20 font-bold"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Criar Nova Campanha
          </Button>
        </div>
      </div>

      {/* Network Overview Mini Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-[#0F172A]/70 p-3.5 backdrop-blur-md">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Tv className="w-3.5 h-3.5 text-[#38BDF8]" />
            Displays Conectados
          </span>
          <p className="text-xl font-black text-white mt-1">{opportunities.length} telas</p>
          <span className="text-[11px] text-emerald-400">99.7% uptime médio</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A]/70 p-3.5 backdrop-blur-md">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-[#06B6D4]" />
            Alcance Total Diário
          </span>
          <p className="text-xl font-black text-white mt-1">
            {opportunities.reduce((acc, o) => acc + (o.estimatedDailyReach || 15000), 0).toLocaleString('pt-AO')}
          </p>
          <span className="text-[11px] text-slate-400">impactos potenciais/dia</span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A]/70 p-3.5 backdrop-blur-md">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#F43F5E]" />
            Municípios Cobertos
          </span>
          <p className="text-xl font-black text-white mt-1">
            {Array.from(new Set(opportunities.map((o) => o.municipality))).length} zonas
          </p>
          <span className="text-[11px] text-slate-400">
            {Array.from(new Set(opportunities.map((o) => o.municipality))).slice(0, 3).join(', ')}...
          </span>
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#0F172A]/70 p-3.5 backdrop-blur-md">
          <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <TrendingUp className="w-3.5 h-3.5 text-[#10B981]" />
            Descontos por Volume
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1">Até -20%</p>
          <span className="text-[11px] text-slate-400">para planos de 30 a 90 dias</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <MarketplaceFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalResultsCount={opportunities.length}
      />

      {/* Opportunities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-80 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <Store className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">Nenhum ponto de mídia encontrado</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Tente ajustar os filtros de município, tipo de espaço ou limpe os termos de pesquisa.
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 border-slate-700">
            Limpar Filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
          {opportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              isSelected={selectedOpportunities.some((o) => o.id === opp.id)}
              onSelectToggle={handleToggleSelect}
              onViewDetails={(target) => setInspectingOpportunity(target)}
            />
          ))}
        </div>
      )}

      {/* Floating Selected Points Bottom Drawer */}
      {selectedOpportunities.length > 0 && (
        <div
          id="marketplace-floating-cart"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-full max-w-3xl rounded-2xl border border-[#0284C7]/60 bg-[#0F172A]/95 p-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-6"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0284C7] text-white font-bold shadow-md">
              {selectedOpportunities.length}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-300">
                {selectedOpportunities.length} {selectedOpportunities.length === 1 ? 'display selecionado' : 'displays selecionados'}
              </span>
              <p className="text-xs text-slate-400">
                Alcance estimado: <strong className="text-white">{cartQuote.totalReach.toLocaleString('pt-AO')} pessoas/dia</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="block text-[10px] text-slate-400 font-medium uppercase">
                Estimativa (14 dias):
              </span>
              <span className="text-sm font-extrabold text-[#38BDF8]">
                {formatKz(cartQuote.totalPrice)}
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedOpportunities([])}
              className="text-xs text-slate-400 hover:text-white"
            >
              Limpar
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleStartCampaignFromCart}
              className="bg-[#0284C7] hover:bg-[#0369A1] shadow-lg shadow-[#0284C7]/20 font-bold"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Montar Campanha
            </Button>
          </div>
        </div>
      )}

      {/* Opportunity Detail Modal */}
      <OpportunityDetailModal
        opportunity={inspectingOpportunity}
        isOpen={!!inspectingOpportunity}
        onClose={() => setInspectingOpportunity(null)}
        onStartCampaign={handleStartCampaignFromSingle}
        isSelected={inspectingOpportunity ? selectedOpportunities.some((o) => o.id === inspectingOpportunity.id) : false}
        onToggleSelect={handleToggleSelect}
      />

      {/* Campaign Creation Wizard Modal */}
      <CampaignCreationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialOpportunities={wizardInitialOpps}
        initialSpotDuration={wizardInitialSpotDuration}
        onCampaignCreated={handleCampaignCreated}
        availableOpportunities={opportunities}
      />
    </div>
  );
};
