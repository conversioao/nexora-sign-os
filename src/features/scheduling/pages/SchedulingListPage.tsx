import React, { useState } from 'react';
import {
  CalendarClock,
  Plus,
  RefreshCw,
  Trash2,
  Play,
  Pause,
  AlertTriangle,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { useSchedules } from '../hooks/useSchedules';
import { ScheduleKpiSummary } from '../components/ScheduleKpiSummary';
import { ScheduleFiltersBar } from '../components/ScheduleFiltersBar';
import { ScheduleTable } from '../components/ScheduleTable';
import { ScheduleCalendarView } from '../components/ScheduleCalendarView';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { Modal } from '../../../components/ui/Modal';
import { Schedule, ScheduleConflict } from '../../../types/domain';
import { SCHEDULE_PRIORITY_CONFIG } from '../constants/schedulingConstants';

export interface SchedulingListPageProps {
  onNavigateToDetail: (id: string) => void;
  onNavigateToCreate: () => void;
  onNavigateToEdit: (id: string) => void;
}

export const SchedulingListPage: React.FC<SchedulingListPageProps> = ({
  onNavigateToDetail,
  onNavigateToCreate,
  onNavigateToEdit,
}) => {
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');

  // Hooks & state
  const {
    schedules,
    kpis,
    filters,
    loading,
    actionLoading,
    selectedIds,
    conflictMap,
    updateFilters,
    resetFilters,
    reload,
    toggleStatus,
    duplicateSchedule,
    deleteSchedules,
    toggleSelect,
    selectAll,
    setSelectedIds,
  } = useSchedules();

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<string[]>([]);
  const [deleteTitle, setDeleteTitle] = useState('');
  const [deleteDesc, setDeleteDesc] = useState('');

  // Conflict inspecting modal
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [activeConflictSchedule, setActiveConflictSchedule] = useState<Schedule | null>(null);
  const [activeConflictsList, setActiveConflictsList] = useState<ScheduleConflict[]>([]);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleViewDetail = (schedule: Schedule) => {
    onNavigateToDetail(schedule.id);
  };

  const handleEdit = (schedule: Schedule) => {
    onNavigateToEdit(schedule.id);
  };

  const handleDuplicate = async (schedule: Schedule) => {
    try {
      const dup = await duplicateSchedule(schedule.id);
      showToast(`Programação "${dup.name}" criada com sucesso.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (schedule: Schedule) => {
    const nextStatus = schedule.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    await toggleStatus(schedule.id, nextStatus);
    showToast(
      `Programação "${schedule.name}" agora está ${
        nextStatus === 'ACTIVE' ? 'Ativa' : 'Pausada'
      }.`
    );
  };

  const handleDeleteSingle = (schedule: Schedule) => {
    setItemsToDelete([schedule.id]);
    setDeleteTitle(`Excluir Programação`);
    setDeleteDesc(
      `Tem certeza que deseja excluir "${schedule.name}" (${schedule.code})? Esta ação não pode ser desfeita.`
    );
    setDeleteModalOpen(true);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setItemsToDelete(selectedIds);
    setDeleteTitle(`Excluir ${selectedIds.length} Programações`);
    setDeleteDesc(
      `Tem certeza que deseja excluir as ${selectedIds.length} programações selecionadas? Esta ação não pode ser desfeita.`
    );
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteSchedules(itemsToDelete);
      setDeleteModalOpen(false);
      showToast(`${itemsToDelete.length} programação(ões) excluída(s) com sucesso.`);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShowConflict = (schedule: Schedule, conflicts: ScheduleConflict[]) => {
    setActiveConflictSchedule(schedule);
    setActiveConflictsList(conflicts);
    setConflictModalOpen(true);
  };

  const handleBulkStatusChange = async (newStatus: 'ACTIVE' | 'PAUSED') => {
    for (const id of selectedIds) {
      await toggleStatus(id, newStatus);
    }
    setSelectedIds([]);
    showToast(
      `${selectedIds.length} programações atualizadas para ${
        newStatus === 'ACTIVE' ? 'Ativo' : 'Pausado'
      }.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Programação / Scheduling"
        description="Automatize os horários, recorrências e regras de veiculação das playlists no parque de displays."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={reload}
              disabled={loading || actionLoading}
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            >
              Atualizar
            </Button>
            <Button
              variant="primary"
              onClick={onNavigateToCreate}
              icon={<Plus className="w-4 h-4" />}
            >
              Nova Programação
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <ScheduleKpiSummary
        kpis={kpis}
        onFilterActive={() => updateFilters({ status: 'ACTIVE' })}
        onFilterScheduled={() => updateFilters({ status: 'SCHEDULED' })}
        onFilterConflict={() => {
          if (kpis.conflicts > 0) {
            showToast(`${kpis.conflicts} conflitos identificados na grade.`);
          }
        }}
      />

      {/* Filters Bar & View Switcher */}
      <ScheduleFiltersBar
        filters={filters}
        onUpdateFilters={updateFilters}
        onResetFilters={resetFilters}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-950/40 border border-blue-600/50 rounded-xl p-3 px-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-blue-950/20">
          <div className="flex items-center gap-2 text-sm text-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>
              <strong>{selectedIds.length}</strong> programação(ões) selecionada(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkStatusChange('ACTIVE')}
              icon={<Play className="w-3.5 h-3.5 text-emerald-400" />}
            >
              Ativar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleBulkStatusChange('PAUSED')}
              icon={<Pause className="w-3.5 h-3.5 text-amber-400" />}
            >
              Pausar
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDeleteSelected}
              icon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Excluir
            </Button>
          </div>
        </div>
      )}

      {/* View Switcher Output */}
      {viewMode === 'LIST' ? (
        <ScheduleTable
          schedules={schedules}
          conflictMap={conflictMap}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          onViewDetail={handleViewDetail}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onToggleStatus={handleToggleStatus}
          onDelete={handleDeleteSingle}
          onShowConflict={handleShowConflict}
        />
      ) : (
        <ScheduleCalendarView
          schedules={schedules}
          conflictMap={conflictMap}
          onSelectSchedule={handleViewDetail}
          onEditSchedule={handleEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={deleteTitle}
        description={deleteDesc}
        loading={actionLoading}
      />

      {/* Conflict Inspector Modal */}
      <Modal
        isOpen={conflictModalOpen}
        onClose={() => setConflictModalOpen(false)}
        title={
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span>Conflitos de Grade Detectados</span>
          </div>
        }
        description={`Detalhamento de sobreposições para "${activeConflictSchedule?.name}"`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            A programação selecionada colide com as seguintes regras de transmissão ativas nos mesmos displays e horários:
          </p>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {activeConflictsList.map((conflict, idx) => {
              const pConfig = SCHEDULE_PRIORITY_CONFIG[conflict.conflictingSchedulePriority];

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#0F172A] border border-amber-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      {conflict.conflictingScheduleName} ({conflict.conflictingScheduleCode})
                    </span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${pConfig.chipBg}`}>
                      Prioridade: {pConfig.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{conflict.message}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-1">
                    <div>
                      <strong className="text-slate-200">Horário da outra regra:</strong>{' '}
                      {conflict.timeRangeB}
                    </div>
                    <div>
                      <strong className="text-slate-200">Displays afetados:</strong>{' '}
                      {conflict.overlappingDisplayIds.length}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setConflictModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
