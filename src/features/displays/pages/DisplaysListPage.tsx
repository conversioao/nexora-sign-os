import React, { useState } from 'react';
import { useDisplays } from '../hooks/useDisplays';
import { DisplayKpiSummary } from '../components/DisplayKpiSummary';
import { DisplayFiltersBar } from '../components/DisplayFiltersBar';
import { DisplayTable } from '../components/DisplayTable';
import { DisplayMobileCards } from '../components/DisplayMobileCards';
import { AddDisplayModal } from '../components/AddDisplayModal';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { EmptyState, ErrorState } from '../../../components/ui/States';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import { Display } from '../../../types/domain';
import { Plus, RefreshCw, Monitor, AlertCircle } from 'lucide-react';
import { useSession } from '../../../context/SessionContext';

interface DisplaysListPageProps {
  onNavigateToDetail: (displayId: string) => void;
}

export const DisplaysListPage: React.FC<DisplaysListPageProps> = ({
  onNavigateToDetail,
}) => {
  const { showToast } = useToast();
  const { hasPermission } = useSession();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    displays,
    totalCount,
    totalFilteredCount,
    totalPages,
    currentPage,
    pageSize,
    kpis,
    loading,
    error,
    filters,
    sortField,
    sortDirection,
    uniqueMunicipalities,
    setCurrentPage,
    setFilter,
    resetFilters,
    handleSort,
    refresh,
    syncDisplay,
    restartDisplay,
    resetDisplay,
    togglePowerDisplay,
    addDisplay,
    deleteDisplay,
  } = useDisplays(6);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refresh(false);
    showToast({
      type: 'info',
      title: 'Inventário Atualizado',
      message: 'Telemetria e status dos displays foram recarregados com sucesso.',
    });
    setIsRefreshing(false);
  };

  const handleSelectDisplay = (display: Display) => {
    onNavigateToDetail(display.id);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0284C7]/15 text-[#38BDF8] border border-[#0284C7]/20">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-white tracking-tight">
                Displays & Hardware
              </h1>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Monitorize e gerencie os displays da rede Nexora em Luanda.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          {hasPermission('displays.create') && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Adicionar Display
            </Button>
          )}
        </div>
      </div>

      {/* 2. Operational KPIs */}
      <DisplayKpiSummary
        kpis={kpis}
        loading={loading}
        activeStatusFilter={filters.status}
        onSelectStatusFilter={(status) => setFilter('status', status)}
      />

      {/* 3. Filter Bar */}
      <DisplayFiltersBar
        filters={filters}
        onFilterChange={setFilter}
        onResetFilters={resetFilters}
        municipalities={uniqueMunicipalities}
        totalFilteredCount={totalFilteredCount}
        totalCount={totalCount}
      />

      {/* 4. Display Content / Data View */}
      {error ? (
        <ErrorState
          title="Erro ao Carregar Displays"
          message={error}
          onRetry={() => refresh(true)}
        />
      ) : loading ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 p-6 bg-[#0F172A] space-y-4">
            <Skeleton variant="text" className="h-6 w-48" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="card" className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      ) : displays.length === 0 ? (
        <EmptyState
          title="Não encontramos displays correspondentes"
          description="Experimente alterar os filtros selecionados, o município ou os termos da pesquisa."
          actionLabel="Limpar Filtros"
          onAction={resetFilters}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden lg:block">
            <DisplayTable
              displays={displays}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onSelectDisplay={handleSelectDisplay}
              onSyncDisplay={syncDisplay}
              onRestartDisplay={restartDisplay}
              onResetDisplay={resetDisplay}
              onDeleteDisplay={deleteDisplay}
              onTogglePowerDisplay={togglePowerDisplay}
              onEditDisplay={(dsp) => {
                showToast({
                  type: 'info',
                  title: 'Edição de Display',
                  message: `Abertura do formulário de configuração para ${dsp.code}.`,
                });
              }}
            />
          </div>

          {/* Mobile & Tablet Cards View (Hidden on large desktop) */}
          <div className="block lg:hidden">
            <DisplayMobileCards
              displays={displays}
              onSelectDisplay={handleSelectDisplay}
              onSyncDisplay={syncDisplay}
              onRestartDisplay={restartDisplay}
              onResetDisplay={resetDisplay}
              onTogglePowerDisplay={togglePowerDisplay}
              onEditDisplay={(dsp) => {
                showToast({
                  type: 'info',
                  title: 'Edição de Display',
                  message: `Abertura do formulário de configuração para ${dsp.code}.`,
                });
              }}
            />
          </div>

          {/* 5. Pagination */}
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              pageSize={pageSize}
              totalItems={totalFilteredCount}
            />
          </div>
        </div>
      )}

      {/* Add Display Modal */}
      <AddDisplayModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          refresh(true);
        }}
        onAddDisplay={async (data) => {
          const res = await addDisplay(data);
          refresh(true);
          return res;
        }}
      />
    </div>
  );
};
