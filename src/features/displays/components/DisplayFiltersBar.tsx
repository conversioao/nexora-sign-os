import React, { useState } from 'react';
import { Search, X, Filter, ChevronDown, ChevronUp, DollarSign, Tag, Megaphone, Shield } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { Select, SelectOption } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { DisplayFiltersState } from '../hooks/useDisplays';

interface DisplayFiltersBarProps {
  filters: DisplayFiltersState;
  onFilterChange: (key: keyof DisplayFiltersState, value: any) => void;
  onResetFilters: () => void;
  municipalities: string[];
  totalFilteredCount: number;
  totalCount: number;
}

export const DisplayFiltersBar: React.FC<DisplayFiltersBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  municipalities,
  totalFilteredCount,
  totalCount,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters =
    filters.search.trim() !== '' ||
    filters.status !== 'ALL' ||
    filters.municipality !== 'ALL' ||
    filters.orientation !== 'ALL' ||
    filters.deviceType !== 'ALL' ||
    filters.commercialStatus !== 'ALL' ||
    filters.commercialModel !== 'ALL' ||
    filters.ownershipType !== 'ALL' ||
    filters.advertisingStatus !== 'ALL' ||
    filters.advertisingEligible !== 'ALL';

  const statusOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todos os Status' },
    { value: 'ONLINE', label: '🟢 Online' },
    { value: 'OFFLINE', label: '🔴 Offline' },
    { value: 'WARNING', label: '🟡 Com Alerta' },
    { value: 'MAINTENANCE', label: '🟠 Em Manutenção' },
    { value: 'SYNCING', label: '🔵 Sincronizando' },
    { value: 'PLAYING', label: '🟢 Em Exibição' },
    { value: 'PAUSED', label: '⚪ Pausado' },
  ];

  const municipalityOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todas as Localizações' },
    ...municipalities.map((mun) => ({
      value: mun,
      label: `Luanda — ${mun}`,
    })),
  ];

  const commercialModelOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todos os Modelos Comerciais' },
    { value: 'RENTAL', label: '🏢 Aluguer Mensal (HW+SaaS)' },
    { value: 'SALE', label: '🏷️ Venda de Hardware' },
    { value: 'SAAS_ONLY', label: '💻 Apenas Licença SaaS' },
    { value: 'EVENT_RENTAL', label: '🎪 Aluguer p/ Eventos' },
    { value: 'INTERNAL', label: '⚡ Rede Própria Nexora' },
    { value: 'HYBRID', label: '🔄 Modelo Híbrido' },
  ];

  const commercialStatusOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todos os Status Comerciais' },
    { value: 'AVAILABLE', label: '✨ Disponível p/ Aluguer/Venda' },
    { value: 'RENTED', label: '💼 Alugado (Contrato Ativo)' },
    { value: 'SOLD', label: '🤝 Vendido ao Cliente' },
    { value: 'EVENT_RESERVED', label: '📅 Reservado p/ Evento' },
    { value: 'INTERNAL_USE', label: '🏢 Uso Interno' },
    { value: 'MAINTENANCE', label: '🔧 Manutenção Comercial' },
  ];

  const ownershipOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todas as Propriedades' },
    { value: 'NEXORA_OWNED', label: '🔵 Propriedade Nexora' },
    { value: 'CLIENT_OWNED', label: '🟣 Propriedade do Cliente' },
    { value: 'PARTNER_OWNED', label: '🟢 Parceiro / Venue' },
    { value: 'LEASED', label: '🟡 Leasing' },
  ];

  const advertisingOptions: SelectOption[] = [
    { value: 'ALL', label: 'Publicidade: Todos' },
    { value: 'true', label: '📢 Anúncios Elegíveis' },
    { value: 'false', label: '🔒 Privado (Sem Anúncios)' },
  ];

  const orientationOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todas as Orientações' },
    { value: 'LANDSCAPE', label: 'Horizontal (16:9)' },
    { value: 'PORTRAIT', label: 'Vertical (9:16)' },
  ];

  const deviceTypeOptions: SelectOption[] = [
    { value: 'ALL', label: 'Todos os Dispositivos' },
    { value: 'ANDROID_TV', label: 'Android TV' },
    { value: 'TV_BOX', label: 'Android TV Box' },
    { value: 'SMART_TV', label: 'Smart TV Indoor' },
    { value: 'TOTEM', label: 'Totem Digital' },
    { value: 'VIDEO_WALL', label: 'Video Wall' },
  ];

  return (
    <div className="space-y-3 bg-[#0B1120]/80 p-4 rounded-xl border border-white/10">
      {/* Primary Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
        {/* Search Input (spans 4 cols on lg) */}
        <div className="sm:col-span-2 lg:col-span-4">
          <Input
            placeholder="Pesquisar display, código, cliente, contrato, local..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            rightIcon={
              filters.search ? (
                <button
                  type="button"
                  onClick={() => onFilterChange('search', '')}
                  className="hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />
        </div>

        {/* Commercial Model Filter */}
        <div className="lg:col-span-3">
          <Select
            options={commercialModelOptions}
            value={filters.commercialModel}
            onChange={(e) => onFilterChange('commercialModel', e.target.value)}
          />
        </div>

        {/* Commercial Status Filter */}
        <div className="lg:col-span-3">
          <Select
            options={commercialStatusOptions}
            value={filters.commercialStatus}
            onChange={(e) => onFilterChange('commercialStatus', e.target.value)}
          />
        </div>

        {/* Toggle Advanced Filters Button */}
        <div className="lg:col-span-2 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full text-xs h-10 border-white/10"
            rightIcon={showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          >
            {showAdvanced ? 'Menos Filtros' : 'Mais Filtros'}
          </Button>
        </div>
      </div>

      {/* Advanced / Secondary Filters Row */}
      {showAdvanced && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/5">
          {/* Operational Status */}
          <div>
            <label className="block text-[11px] text-[#94A3B8] mb-1">Status Operacional</label>
            <Select
              options={statusOptions}
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
            />
          </div>

          {/* Municipality */}
          <div>
            <label className="block text-[11px] text-[#94A3B8] mb-1">Localização (Luanda)</label>
            <Select
              options={municipalityOptions}
              value={filters.municipality}
              onChange={(e) => onFilterChange('municipality', e.target.value)}
            />
          </div>

          {/* Ownership */}
          <div>
            <label className="block text-[11px] text-[#94A3B8] mb-1">Propriedade do Ativo</label>
            <Select
              options={ownershipOptions}
              value={filters.ownershipType}
              onChange={(e) => onFilterChange('ownershipType', e.target.value)}
            />
          </div>

          {/* Advertising Eligibility */}
          <div>
            <label className="block text-[11px] text-[#94A3B8] mb-1">Rede de Anúncios</label>
            <Select
              options={advertisingOptions}
              value={filters.advertisingEligible}
              onChange={(e) => onFilterChange('advertisingEligible', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Filter summary bar & clear button */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs text-[#94A3B8]">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#06B6D4]" />
          <span>
            Mostrando <strong className="text-white">{totalFilteredCount}</strong> de{' '}
            <strong className="text-white">{totalCount}</strong> displays cadastrados
          </span>
          {hasActiveFilters && (
            <span className="text-[#F59E0B] font-medium">• Filtros ativos</span>
          )}
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="text-xs h-7 text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10 cursor-pointer"
            leftIcon={<X className="w-3 h-3" />}
          >
            Limpar Filtros
          </Button>
        )}
      </div>
    </div>
  );
};

