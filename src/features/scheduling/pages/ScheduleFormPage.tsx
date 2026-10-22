import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Calendar,
  Layers,
  Monitor,
  Save,
  AlertTriangle,
  Globe,
  Plus,
  X,
  Sparkles,
  CheckCircle2,
  ListVideo,
} from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { Button } from '../../../components/ui/Button';
import { NexoraService } from '../../../services';
import {
  DayOfWeek,
  Playlist,
  Schedule,
  SchedulePriority,
  ScheduleRecurrence,
  ScheduleStatus,
} from '../../../types/domain';
import {
  SUPPORTED_TIMEZONES,
  DEFAULT_TIMEZONE,
  SCHEDULE_PRIORITY_LABELS,
  SCHEDULE_STATUS_LABELS,
  SCHEDULE_RECURRENCE_LABELS,
} from '../constants/schedulingConstants';
import { DaysOfWeekSelector } from '../components/DaysOfWeekSelector';
import { SchedulePlaylistSelectorModal } from '../components/SchedulePlaylistSelectorModal';
import { ScheduleDisplaySelectorModal } from '../components/ScheduleDisplaySelectorModal';
import { ScheduleConflictBanner } from '../components/ScheduleConflictBanner';
import { detectConflicts } from '../services/scheduleConflictService';
import { mockDisplays } from '../../../data/mockData';

export interface ScheduleFormPageProps {
  scheduleId?: string | null;
  onBack: () => void;
  onSaveSuccess: (savedId: string) => void;
}

export const ScheduleFormPage: React.FC<ScheduleFormPageProps> = ({
  scheduleId,
  onBack,
  onSaveSuccess,
}) => {
  const isEditing = Boolean(scheduleId);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SchedulePriority>('NORMAL');
  const [status, setStatus] = useState<ScheduleStatus>('ACTIVE');
  const [recurrence, setRecurrence] = useState<ScheduleRecurrence>('WEEKLY');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [selectedDisplayIds, setSelectedDisplayIds] = useState<string[]>(['dsp-01']);
  const [tags, setTags] = useState<string[]>(['Digital Signage']);
  const [tagInput, setTagInput] = useState('');

  // Modals & Async
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false);
  const [displayModalOpen, setDisplayModalOpen] = useState(false);
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Display map for conflict formatting
  const displayNamesMap = useMemo(() => {
    const map = new Map<string, string>();
    mockDisplays.forEach((d) => map.set(d.id, `${d.name} (${d.code})`));
    return map;
  }, []);

  // Load existing data if editing, and all schedules for conflict detection
  useEffect(() => {
    async function init() {
      try {
        const [fetchedAllSchedules, playlists] = await Promise.all([
          NexoraService.schedules.getAll(),
          NexoraService.playlists.getAll(),
        ]);
        setAllSchedules(fetchedAllSchedules);

        if (isEditing && scheduleId) {
          const schedule = await NexoraService.schedules.getById(scheduleId);
          if (schedule) {
            setName(schedule.name);
            setDescription(schedule.description || '');
            setPriority(schedule.priority);
            setStatus(schedule.status);
            setRecurrence(schedule.recurrence);
            setStartDate(schedule.startDate);
            setEndDate(schedule.endDate);
            setStartTime(schedule.startTime);
            setEndTime(schedule.endTime);
            setDaysOfWeek(schedule.daysOfWeek);
            setTimezone(schedule.timezone || DEFAULT_TIMEZONE);
            setSelectedPlaylistId(schedule.playlistId);
            setSelectedDisplayIds(schedule.displayIds || []);
            setTags(schedule.tags || []);

            const p = playlists.find((item) => item.id === schedule.playlistId);
            if (p) setSelectedPlaylist(p);
          }
        } else {
          // Default first playlist
          if (playlists.length > 0) {
            setSelectedPlaylistId(playlists[0].id);
            setSelectedPlaylist(playlists[0]);
          }
        }
      } catch (err) {
        console.error('Error initializing form:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [scheduleId, isEditing]);

  // Real-time live conflict calculation
  const liveConflicts = useMemo(() => {
    if (!selectedPlaylistId || selectedDisplayIds.length === 0 || daysOfWeek.length === 0) {
      return { hasConflict: false, conflicts: [] };
    }

    const previewSchedule: Schedule = {
      id: scheduleId || 'temp-preview',
      code: 'PREVIEW',
      name: name || 'Nova Programação',
      playlistId: selectedPlaylistId,
      displayIds: selectedDisplayIds,
      status: status,
      startDate,
      endDate,
      startTime,
      endTime,
      daysOfWeek,
      timezone,
      priority,
      recurrence,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: { id: 'usr-preview', name: 'User' },
    };

    return detectConflicts(previewSchedule, allSchedules, displayNamesMap);
  }, [
    scheduleId,
    name,
    selectedPlaylistId,
    selectedDisplayIds,
    status,
    startDate,
    endDate,
    startTime,
    endTime,
    daysOfWeek,
    timezone,
    priority,
    recurrence,
    allSchedules,
    displayNamesMap,
  ]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = 'O nome da programação é obrigatório.';
    if (!selectedPlaylistId) errs.playlist = 'Selecione uma playlist.';
    if (selectedDisplayIds.length === 0) errs.displays = 'Selecione pelo menos um display.';
    if (daysOfWeek.length === 0) errs.days = 'Selecione pelo menos um dia da semana.';
    if (endDate < startDate) errs.dates = 'A data final deve ser posterior ou igual à data inicial.';
    if (startTime >= endTime) errs.times = 'O horário de término deve ser posterior ao horário de início.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: Partial<Schedule> = {
        name: name.trim(),
        description: description.trim(),
        priority,
        status,
        recurrence,
        startDate,
        endDate,
        startTime,
        endTime,
        daysOfWeek,
        timezone,
        playlistId: selectedPlaylistId,
        displayIds: selectedDisplayIds,
        tags,
      };

      if (isEditing && scheduleId) {
        const updated = await NexoraService.schedules.update(scheduleId, payload);
        onSaveSuccess(updated.id);
      } else {
        const created = await NexoraService.schedules.create(payload);
        onSaveSuccess(created.id);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <CalendarClock className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Carregando dados da programação...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-lg bg-[#0B132B] border border-[#1E293B] hover:border-slate-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isEditing ? 'Editar Programação' : 'Nova Programação'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Defina a grade de veiculação da playlist, telas associadas, horários e dias da semana.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button variant="secondary" type="button" onClick={onBack}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            loading={saving}
            icon={<Save className="w-4 h-4" />}
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Programação'}
          </Button>
        </div>
      </div>

      {/* Live Conflict Warning Banner if detected */}
      {liveConflicts.hasConflict && (
        <ScheduleConflictBanner
          conflicts={liveConflicts.conflicts}
          currentScheduleName={name || 'Esta Programação'}
        />
      )}

      {/* Main Form Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Basic info & Timing */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Basic Info Card */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-blue-400" />
              <span>Identificação & Metadados</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nome da Programação <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Horário Comercial — Shopping Talatona"
                className="w-full px-3.5 py-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descrição ou Observações Operacionais
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Instruções de exibição, regras específicas ou propósito da grade..."
                className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Prioridade de Exibição
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as SchedulePriority)}
                  className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="LOW">⚪ {SCHEDULE_PRIORITY_LABELS.LOW} (Baixa prioridade)</option>
                  <option value="NORMAL">🔵 {SCHEDULE_PRIORITY_LABELS.NORMAL} (Padrão de veiculação)</option>
                  <option value="HIGH">🟡 {SCHEDULE_PRIORITY_LABELS.HIGH} (Alta prioridade)</option>
                  <option value="URGENT">🔴 {SCHEDULE_PRIORITY_LABELS.URGENT} (Sobrepõe grades)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Em caso de conflito, a prioridade mais alta é reproduzida pelo player.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Status Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ScheduleStatus)}
                  className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="ACTIVE">🟢 {SCHEDULE_STATUS_LABELS.ACTIVE}</option>
                  <option value="SCHEDULED">🔵 {SCHEDULE_STATUS_LABELS.SCHEDULED}</option>
                  <option value="PAUSED">🟡 {SCHEDULE_STATUS_LABELS.PAUSED}</option>
                  <option value="DRAFT">⚪ {SCHEDULE_STATUS_LABELS.DRAFT}</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Timing & Days of Week Card */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Horários & Calendário de Veiculação</span>
            </h3>

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data Inicial de Vigência <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Data Final de Vigência <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            {errors.dates && <p className="text-xs text-rose-400">{errors.dates}</p>}

            {/* Time Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Horário de Início <span className="text-rose-400">*</span>
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Horário de Término <span className="text-rose-400">*</span>
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            {errors.times && <p className="text-xs text-rose-400">{errors.times}</p>}

            {/* Recurrence Type & Timezone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Padrão de Recorrência
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value as ScheduleRecurrence)}
                  className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="WEEKLY">{SCHEDULE_RECURRENCE_LABELS.WEEKLY}</option>
                  <option value="DAILY">{SCHEDULE_RECURRENCE_LABELS.DAILY}</option>
                  <option value="ONCE">{SCHEDULE_RECURRENCE_LABELS.ONCE}</option>
                  <option value="CUSTOM">{SCHEDULE_RECURRENCE_LABELS.CUSTOM}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Fuso Horário Operacional
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer font-mono text-xs"
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label} ({tz.utcOffset})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Days of Week Selector */}
            <div className="pt-2 border-t border-[#1E293B]">
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Dias da Semana de Exibição <span className="text-rose-400">*</span>
              </label>
              <DaysOfWeekSelector
                selectedDays={daysOfWeek}
                onChange={setDaysOfWeek}
              />
              {errors.days && <p className="text-xs text-rose-400 mt-1">{errors.days}</p>}
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Playlist & Displays selectors */}
        <div className="space-y-6">
          {/* 1. Playlist Selection Card */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Playlist Selecionada</span>
              </h3>
              <button
                type="button"
                onClick={() => setPlaylistModalOpen(true)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                Trocar
              </button>
            </div>

            {selectedPlaylist ? (
              <div className="p-3.5 bg-[#0F172A] border border-blue-500/40 rounded-xl space-y-2.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg bg-gradient-to-br ${
                      selectedPlaylist.thumbnailGradient || 'from-blue-900 to-slate-900'
                    } flex items-center justify-center text-blue-300 shrink-0`}
                  >
                    <ListVideo className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-white block truncate">
                      {selectedPlaylist.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {selectedPlaylist.code}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-300 pt-2 border-t border-[#1E293B]">
                  <span>{selectedPlaylist.itemCount || selectedPlaylist.items?.length || 0} mídias</span>
                  <span className="text-cyan-400 font-semibold">{selectedPlaylist.totalDuration}s loop</span>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setPlaylistModalOpen(true)}
                className="p-6 border border-dashed border-slate-700 hover:border-blue-500 rounded-xl text-center cursor-pointer transition-colors"
              >
                <ListVideo className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-blue-400 block">
                  Clique para selecionar uma playlist
                </span>
              </div>
            )}
            {errors.playlist && <p className="text-xs text-rose-400">{errors.playlist}</p>}
          </div>

          {/* 2. Displays Selection Card */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span>Displays Selecionados ({selectedDisplayIds.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => setDisplayModalOpen(true)}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline cursor-pointer"
              >
                Alterar
              </button>
            </div>

            {selectedDisplayIds.length > 0 ? (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {selectedDisplayIds.map((dispId) => {
                  const disp = mockDisplays.find((d) => d.id === dispId);
                  return (
                    <div
                      key={dispId}
                      className="p-2.5 bg-[#0F172A] border border-[#1E293B] rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-semibold text-white truncate block">
                          {disp ? disp.name : dispId}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {disp?.location?.venueName || 'Local não informado'} • {disp?.location?.municipality || 'Luanda'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                        {disp?.code}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                onClick={() => setDisplayModalOpen(true)}
                className="p-6 border border-dashed border-slate-700 hover:border-blue-500 rounded-xl text-center cursor-pointer transition-colors"
              >
                <Monitor className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <span className="text-xs font-semibold text-blue-400 block">
                  Clique para associar displays
                </span>
              </div>
            )}
            {errors.displays && <p className="text-xs text-rose-400">{errors.displays}</p>}
          </div>

          {/* 3. Tags Card */}
          <div className="bg-[#0B132B]/80 border border-[#1E293B] rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tags & Categorização
            </h3>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Adicionar tag..."
                className="flex-1 px-3 py-1.5 bg-[#0F172A] border border-[#1E293B] rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              <Button type="button" variant="secondary" size="sm" onClick={handleAddTag}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-400 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Playlist Selector Modal */}
      <SchedulePlaylistSelectorModal
        isOpen={playlistModalOpen}
        onClose={() => setPlaylistModalOpen(false)}
        selectedPlaylistId={selectedPlaylistId}
        onSelectPlaylist={(p) => {
          setSelectedPlaylistId(p.id);
          setSelectedPlaylist(p);
        }}
      />

      {/* Display Selector Modal */}
      <ScheduleDisplaySelectorModal
        isOpen={displayModalOpen}
        onClose={() => setDisplayModalOpen(false)}
        selectedDisplayIds={selectedDisplayIds}
        onSaveSelection={(ids) => setSelectedDisplayIds(ids)}
      />
    </form>
  );
};
