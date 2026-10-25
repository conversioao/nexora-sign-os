import React, { useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Calendar,
  Layers,
  Monitor,
  Edit,
  Play,
  Pause,
  Copy,
  Trash2,
  AlertTriangle,
  Globe,
  MapPin,
  ExternalLink,
  Film,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useScheduleDetail } from '../hooks/useScheduleDetail';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { ScheduleConflictBanner } from '../components/ScheduleConflictBanner';
import { NextOccurrencesTimeline } from '../components/NextOccurrencesTimeline';
import {
  SCHEDULE_PRIORITY_CONFIG,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_STATUS_VARIANTS,
  SCHEDULE_RECURRENCE_LABELS,
  DAYS_OF_WEEK,
  DAY_SHORT_LABELS,
  DAY_FULL_LABELS,
} from '../constants/schedulingConstants';
import { formatDaysSummary } from '../services/scheduleRecurrenceService';

export interface ScheduleDetailPageProps {
  scheduleId: string;
  onBack: () => void;
  onNavigateToEdit: (id: string) => void;
  onNavigateToPlaylist?: (playlistId: string) => void;
  onNavigateToDisplay?: (displayId: string) => void;
}

export const ScheduleDetailPage: React.FC<ScheduleDetailPageProps> = ({
  scheduleId,
  onBack,
  onNavigateToEdit,
  onNavigateToPlaylist,
  onNavigateToDisplay,
}) => {
  const {
    schedule,
    playlist,
    displays,
    occurrences,
    isPlayingNow,
    conflictResult,
    loading,
    actionLoading,
    toggleStatus,
    duplicateSchedule,
    deleteSchedule,
  } = useScheduleDetail(scheduleId);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <CalendarClock className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Carregando detalhes da programação...</p>
        </div>
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="bg-[#0B132B] border border-[#1E293B] rounded-xl p-12 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Programação não encontrada</h3>
        <p className="text-sm text-slate-400">
          A programação com o identificador "{scheduleId}" não existe ou foi removida.
        </p>
        <Button variant="secondary" onClick={onBack}>
          Voltar para Programações
        </Button>
      </div>
    );
  }

  const priorityConfig = SCHEDULE_PRIORITY_CONFIG[schedule.priority];
  const daysSummary = formatDaysSummary(schedule.daysOfWeek);

  const handleEdit = () => {
    onNavigateToEdit(schedule.id);
  };

  const handleToggle = async () => {
    await toggleStatus();
    showToast(
      `Programação agora está ${schedule.status === 'ACTIVE' ? 'Pausada' : 'Ativa'}.`
    );
  };

  const handleDuplicate = async () => {
    const dup = await duplicateSchedule();
    if (dup) {
      showToast(`Programação duplicada com sucesso.`);
      onNavigateToEdit(dup.id);
    }
  };

  const handleDelete = async () => {
    await deleteSchedule();
    onBack();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/50 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg bg-[#0B132B] border border-[#1E293B] hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Voltar para a lista"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">{schedule.name}</h1>
              <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                {schedule.code}
              </span>
              <Badge variant={SCHEDULE_STATUS_VARIANTS[schedule.status]}>
                {SCHEDULE_STATUS_LABELS[schedule.status]}
              </Badge>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${priorityConfig.chipBg} ${priorityConfig.borderColor}`}
              >
                Prioridade {priorityConfig.label}
              </span>
              {isPlayingNow && (
                <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Em Exibição Ao Vivo</span>
                </span>
              )}
            </div>

            {schedule.description && (
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">{schedule.description}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleToggle}
            icon={
              schedule.status === 'ACTIVE' ? (
                <Pause className="w-4 h-4 text-amber-400" />
              ) : (
                <Play className="w-4 h-4 text-emerald-400" />
              )
            }
          >
            {schedule.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
            icon={<Edit className="w-4 h-4 text-blue-400" />}
          >
            Editar
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDuplicate}
            icon={<Copy className="w-4 h-4 text-cyan-400" />}
          >
            Duplicar
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Excluir
          </Button>
        </div>
      </div>

      {/* Conflict Banner if detected */}
      {conflictResult.hasConflict && (
        <ScheduleConflictBanner
          conflicts={conflictResult.conflicts}
          currentScheduleName={schedule.name}
        />
      )}

      {/* Main Grid: Left Details & Right Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Schedule Timing & Recurrence Rules */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>Regras de Horário & Recorrência</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Horário Diário */}
              <div className="p-3.5 bg-[#0F172A] border border-[#1E293B] rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Horário de Exibição</span>
                <span className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>
                    {schedule.startTime} às {schedule.endTime}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Janela de reprodução nos displays
                </span>
              </div>

              {/* Período de Vigência */}
              <div className="p-3.5 bg-[#0F172A] border border-[#1E293B] rounded-lg">
                <span className="text-xs text-slate-400 block mb-1">Período de Vigência</span>
                <span className="text-base font-bold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>
                    {schedule.startDate} a {schedule.endDate}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tipo: {SCHEDULE_RECURRENCE_LABELS[schedule.recurrence]}
                </span>
              </div>
            </div>

            {/* Dias da Semana */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Dias da Semana Ativos:</span>
                <span className="text-xs text-blue-400 font-medium">{daysSummary}</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isActive = schedule.daysOfWeek.includes(day);

                  return (
                    <div
                      key={day}
                      title={DAY_FULL_LABELS[day]}
                      className={`flex flex-col items-center justify-center py-2 rounded-lg border text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-blue-600/30 border-blue-500 text-blue-200'
                          : 'bg-[#0F172A] border-[#1E293B] text-slate-600'
                      }`}
                    >
                      <span>{DAY_SHORT_LABELS[day]}</span>
                      <span
                        className={`w-1.5 h-1.5 mt-1 rounded-full ${
                          isActive ? 'bg-blue-400' : 'bg-transparent'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timezone */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1E293B]">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Fuso Horário Operacional:</span>
              </span>
              <strong className="text-slate-200 font-mono">
                {schedule.timezone || 'Africa/Luanda'} (WAT - UTC+1)
              </strong>
            </div>
          </div>

          {/* 2. Associated Playlist Details */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Playlist Vinculada</span>
              </h3>

              {playlist && onNavigateToPlaylist && (
                <button
                  type="button"
                  onClick={() => onNavigateToPlaylist(playlist.id)}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir Playlist</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {playlist ? (
              <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-xl space-y-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${
                      playlist.thumbnailGradient || 'from-blue-900 to-slate-900'
                    } flex items-center justify-center text-blue-300 shrink-0 border border-white/10`}
                  >
                    <Film className="w-6 h-6" />
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-white">{playlist.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                      {playlist.description || 'Sem descrição cadastrada'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span className="text-cyan-400 font-semibold">
                        {playlist.items?.length || 0} mídias no loop
                      </span>
                      <span>•</span>
                      <span className="text-blue-400 font-semibold">
                        {playlist.totalDuration}s de duração total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Playlist items mini sequence preview */}
                {playlist.items && playlist.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#1E293B]">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Sequência de Mídias ({playlist.items.length}):
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {playlist.items.map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="flex items-center gap-2 bg-[#0B132B] border border-[#1E293B] rounded-lg p-2 shrink-0 min-w-[140px]"
                        >
                          <span className="text-[10px] font-bold text-blue-400 w-4">
                            #{idx + 1}
                          </span>
                          <div className="truncate">
                            <span className="text-xs font-semibold text-white truncate block">
                              {item.content?.name || `Mídia #${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {item.duration}s • {item.content?.type || 'VÍDEO'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[#0F172A] border border-[#1E293B] rounded-xl text-center text-xs text-slate-400">
                Playlist vinculada: <strong>{schedule.playlistName}</strong>
              </div>
            )}
          </div>

          {/* 3. Allocated Displays List */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Displays Alocados ({displays.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Transmitindo para {displays.length} tela(s)
              </span>
            </div>

            {displays.length === 0 ? (
              <div className="p-6 bg-[#0F172A] border border-[#1E293B] rounded-xl text-center text-xs text-slate-400">
                Nenhum display vinculado a esta programação.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displays.map((display) => (
                  <div
                    key={display.id}
                    onClick={() => onNavigateToDisplay && onNavigateToDisplay(display.id)}
                    className="p-3 bg-[#0F172A] border border-[#1E293B] rounded-xl flex items-center justify-between gap-3 hover:border-slate-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 rounded-lg bg-blue-950/60 text-blue-400 border border-blue-800/40 shrink-0">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">
                          {display.name}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">
                            {display.location?.venueName || 'Local não informado'} • {display.location?.municipality || 'Luanda'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        display.status === 'ONLINE'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {display.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 span): Next Occurrences & Metadata */}
        <div className="space-y-6">
          {/* Next Occurrences Timeline */}
          <NextOccurrencesTimeline
            occurrences={occurrences}
            timezone={schedule.timezone}
            isPaused={schedule.status === 'PAUSED' || schedule.status === 'DRAFT'}
          />

          {/* Audit & Metadata */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Informações de Auditoria
            </h4>

            <div className="space-y-3 text-xs">
              {schedule.createdBy && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Criado por:</span>
                  <div className="flex items-center gap-1.5 text-right">
                    {schedule.createdBy.avatar && (
                      <img
                        src={schedule.createdBy.avatar}
                        alt={schedule.createdBy.name}
                        className="w-5 h-5 rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <span className="font-semibold text-slate-200">
                      {schedule.createdBy.name}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Data de Criação:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(schedule.createdAt).toLocaleDateString('pt-PT')}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Última Atualização:</span>
                <span className="text-slate-200 font-mono">
                  {new Date(schedule.updatedAt).toLocaleDateString('pt-PT')}
                </span>
              </div>

              {schedule.tags && schedule.tags.length > 0 && (
                <div className="pt-2 border-t border-[#1E293B]">
                  <span className="text-slate-400 block mb-1.5">Tags:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {schedule.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Excluir Programação"
        description={`Tem certeza que deseja excluir "${schedule.name}" (${schedule.code})? Esta ação não pode ser desfeita.`}
        loading={actionLoading}
      />
    </div>
  );
};
