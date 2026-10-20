import React from 'react';
import {
  ArrowLeft,
  Save,
  Play,
  Copy,
  Plus,
  Monitor,
  Clock,
  Film,
  Layers,
  Sparkles,
  Check,
  AlertCircle
} from 'lucide-react';
import { Playlist, PlaylistStatus } from '../../../types/domain';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { formatDurationClock, STATUS_CONFIG } from '../utils/playlistUtils';

interface PlaylistHeaderProps {
  playlist: Playlist;
  isDirty: boolean;
  isSaving: boolean;
  calculatedDuration: number;
  disableAddContent?: boolean;
  onBack: () => void;
  onSave: () => void;
  onPreview: () => void;
  onDuplicate: () => void;
  onAddContent: () => void;
  onManageDisplays: () => void;
  onStatusChange: (status: PlaylistStatus) => void;
}

export const PlaylistHeader: React.FC<PlaylistHeaderProps> = ({
  playlist,
  isDirty,
  isSaving,
  calculatedDuration,
  disableAddContent,
  onBack,
  onSave,
  onPreview,
  onDuplicate,
  onAddContent,
  onManageDisplays,
  onStatusChange,
}) => {
  const statusInfo = STATUS_CONFIG[playlist.status] || STATUS_CONFIG.DRAFT;

  return (
    <div className="bg-[#0B1120] border-b border-white/10 px-6 py-4 sticky top-0 z-30 shadow-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Back button + Title & Code + Status */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer flex-shrink-0"
            title="Voltar para a lista de playlists"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-bold text-[#F8FAFC] font-display truncate max-w-md">
                {playlist.name}
              </h1>

              <span className="font-mono text-xs text-[#64748B] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                {playlist.code}
              </span>

              {/* Status Selector */}
              <select
                value={playlist.status}
                onChange={(e) => onStatusChange(e.target.value as PlaylistStatus)}
                className="bg-[#070B14] border border-white/10 rounded-lg text-xs font-semibold text-[#F8FAFC] px-2.5 py-1 focus:outline-none focus:border-[#38BDF8] cursor-pointer"
              >
                <option value="DRAFT" className="bg-[#0B1120]">Rascunho</option>
                <option value="ACTIVE" className="bg-[#0B1120]">Ativa</option>
                <option value="PAUSED" className="bg-[#0B1120]">Pausada</option>
                <option value="SCHEDULED" className="bg-[#0B1120]">Agendada</option>
                <option value="ARCHIVED" className="bg-[#0B1120]">Arquivada</option>
              </select>

              {/* Unsaved Changes Indicator */}
              {isDirty && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-[#F59E0B] bg-[#F59E0B]/10 px-2 py-0.5 rounded-full border border-[#F59E0B]/30 animate-pulse">
                  <AlertCircle className="w-3 h-3" />
                  Alterações não salvas
                </span>
              )}
            </div>

            {/* Subtitle / Description */}
            <p className="text-xs text-[#94A3B8] truncate mt-0.5 max-w-xl">
              {playlist.description || 'Sequência de reprodução de mídia digital.'}
            </p>
          </div>
        </div>

        {/* Center / Right: Metrics & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap justify-end">
          {/* Quick Metrics */}
          <div className="flex items-center gap-3 bg-[#070B14] border border-white/10 px-3 py-1.5 rounded-xl text-xs">
            {/* Total Duration */}
            <div className="flex items-center gap-1.5 text-[#F8FAFC] font-mono">
              <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
              <span className="font-semibold">{formatDurationClock(calculatedDuration)}</span>
              <span className="text-[10px] text-[#64748B]">loop</span>
            </div>

            <div className="w-px h-3.5 bg-white/10" />

            {/* Total Items */}
            <div className="flex items-center gap-1.5 text-[#F8FAFC] font-mono">
              <Film className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="font-semibold">{playlist.items?.length || 0}</span>
              <span className="text-[10px] text-[#64748B]">itens</span>
            </div>

            <div className="w-px h-3.5 bg-white/10" />

            {/* Displays Link */}
            <button
              type="button"
              onClick={onManageDisplays}
              className="flex items-center gap-1.5 text-[#EC4899] hover:underline cursor-pointer font-mono"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="font-semibold">{playlist.displayCount || 0}</span>
              <span className="text-[10px] text-[#94A3B8]">displays</span>
            </button>
          </div>

          {/* Action: Add Content */}
          <Button
            variant="outline"
            size="sm"
            onClick={onAddContent}
            disabled={disableAddContent}
            className={`flex items-center gap-1.5 text-xs ${
              disableAddContent
                ? 'opacity-40 cursor-not-allowed bg-white/5 border-white/5 text-slate-500'
                : 'bg-white/5 border-white/10 hover:bg-white/10 text-[#F8FAFC]'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>Adicionar Mídia</span>
          </Button>

          {/* Action: Live Simulation Preview */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onPreview}
            disabled={!playlist.items || playlist.items.length === 0}
            className="flex items-center gap-1.5 text-xs bg-[#06B6D4]/15 hover:bg-[#06B6D4]/25 text-[#06B6D4] border border-[#06B6D4]/30"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Simular Preview</span>
          </Button>

          {/* Action: Duplicate */}
          <Button
            variant="outline"
            size="sm"
            onClick={onDuplicate}
            className="flex items-center gap-1.5 text-xs bg-white/5 border-white/10 hover:bg-white/10 text-[#94A3B8]"
            title="Duplicar esta playlist"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>

          {/* Action: Save Changes */}
          <Button
            variant={isDirty ? 'primary' : 'outline'}
            size="sm"
            onClick={onSave}
            isLoading={isSaving}
            className={`flex items-center gap-1.5 text-xs ${
              isDirty
                ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg shadow-[#2563EB]/25'
                : 'bg-white/5 text-[#94A3B8] border-white/10'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isDirty ? 'Salvar Alterações' : 'Salvo'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
