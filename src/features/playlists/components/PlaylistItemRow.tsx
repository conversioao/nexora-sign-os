import React from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  Clock,
  Sparkles,
  Repeat,
  Eye,
  EyeOff,
  Video,
  Image as ImageIcon,
  FileText,
  Play,
  Lock
} from 'lucide-react';
import { PlaylistItem, PlaylistItemTransition } from '../../../types/domain';
import { TRANSITION_LABELS, formatDurationClock } from '../utils/playlistUtils';

interface PlaylistItemRowProps {
  item: PlaylistItem;
  index: number;
  totalItems: number;
  disableDurationEdit?: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onUpdateDuration: (itemId: string, duration: number) => void;
  onUpdateTransition: (itemId: string, transition: PlaylistItemTransition) => void;
  onUpdateRepeat: (itemId: string, repeatCount: number) => void;
  onToggleEnabled: (itemId: string) => void;
  onRemove: (itemId: string) => void;
}

export const PlaylistItemRow: React.FC<PlaylistItemRowProps> = ({
  item,
  index,
  totalItems,
  disableDurationEdit = false,
  onMoveUp,
  onMoveDown,
  onUpdateDuration,
  onUpdateTransition,
  onUpdateRepeat,
  onToggleEnabled,
  onRemove,
}) => {
  const content = item.content;
  const mediaUrl = content?.fileUrl || (content as any)?.url || (item as any)?.mediaUrl || '';
  const mediaType = (content?.type || (item as any)?.type || '').toUpperCase();
  const isVideo = mediaType === 'VIDEO' || mediaUrl.toLowerCase().includes('.mp4') || mediaUrl.toLowerCase().includes('.webm') || mediaUrl.toLowerCase().includes('.mov') || mediaUrl.toLowerCase().includes('video');
  const isDoc = mediaType === 'PDF';

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      onUpdateDuration(item.id, val);
    }
  };

  const handleStepDuration = (delta: number) => {
    const nextVal = Math.max(1, (item.duration || 10) + delta);
    onUpdateDuration(item.id, nextVal);
  };

  return (
    <div
      className={`group relative bg-[#0F172A] border rounded-xl p-3.5 transition-all duration-200 flex flex-col md:flex-row items-stretch md:items-center gap-3.5 ${
        item.enabled
          ? 'border-white/10 hover:border-white/20 hover:bg-[#131D31]'
          : 'border-white/5 bg-[#0A0E1A] opacity-60'
      }`}
    >
      {/* Left section: Order Number, Drag Handle, Reorder Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Position Badge */}
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
            item.enabled
              ? 'bg-[#2563EB]/20 text-[#38BDF8] border border-[#2563EB]/40'
              : 'bg-white/5 text-[#64748B]'
          }`}
        >
          {item.position || index + 1}
        </div>

        {/* Up / Down Reorder buttons */}
        <div className="flex flex-col gap-0.5">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="p-0.5 text-[#64748B] hover:text-white disabled:opacity-20 disabled:hover:text-[#64748B] cursor-pointer"
            title="Mover para cima"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === totalItems - 1}
            className="p-0.5 text-[#64748B] hover:text-white disabled:opacity-20 disabled:hover:text-[#64748B] cursor-pointer"
            title="Mover para baixo"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Thumbnail Preview */}
        <div
          className={`relative w-16 h-12 rounded-lg bg-gradient-to-br ${
            content?.thumbnailGradient || 'from-slate-800 to-slate-950'
          } border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0`}
        >
          {isVideo && mediaUrl ? (
            <video
              src={mediaUrl}
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (content?.thumbnailUrl || mediaUrl) ? (
            <img
              src={content?.thumbnailUrl || mediaUrl}
              alt={content?.name || 'Mídia'}
              className="w-full h-full object-cover"
            />
          ) : isDoc ? (
            <FileText className="w-5 h-5 text-[#EC4899]" />
          ) : (
            <ImageIcon className="w-5 h-5 text-[#10B981]" />
          )}

          {/* Video badge if video */}
          {isVideo && (
            <div className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/70 text-[9px] font-mono text-white">
              Vídeo
            </div>
          )}
        </div>
      </div>

      {/* Center Section: Content Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4
            className="text-xs font-semibold text-[#F8FAFC] truncate font-display"
            title={content?.name || 'Mídia sem nome'}
          >
            {content?.name || `Conteúdo (${item.contentId})`}
          </h4>

          {content?.code && (
            <span className="font-mono text-[10px] text-[#64748B]">
              {content.code}
            </span>
          )}

          {content?.orientation && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 text-[#94A3B8] border border-white/5">
              {content.orientation === 'PORTRAIT' ? 'Vertical' : 'Horizontal'}
            </span>
          )}

          {content?.resolution && (
            <span className="text-[10px] font-mono text-[#64748B]">
              {content.resolution}
            </span>
          )}
          {/* Advertiser & Campaign Attribution Badge */}
          {(item as any)?.advertiserName || (content as any)?.advertiserName ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
              <span>📢 Anunciante: {(item as any)?.advertiserName || (content as any)?.advertiserName}</span>
              {((item as any)?.campaignTitle || (content as any)?.campaignTitle) && (
                <span className="text-amber-300/80">({(item as any)?.campaignTitle || (content as any)?.campaignTitle})</span>
              )}
            </span>
          ) : null}
        </div>

        <p className="text-[11px] text-[#64748B] truncate mt-0.5">
          {content?.description || 'Nenhum resumo técnico cadastrado para esta mídia.'}
        </p>
      </div>

      {/* Right Section: Duration, Transition, Repeat, Active Toggle, Remove */}
      <div className="flex items-center gap-3 flex-wrap md:flex-nowrap justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-2.5 md:pt-0">
        {/* Duration Control */}
        {disableDurationEdit ? (
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-amber-500/30 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-mono font-bold" title="Duração fixa em 10 segundos para mídias de parceiro">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>10s (Fixo)</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-[#070B14] border border-white/10 rounded-lg px-2 py-1">
            <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
            <button
              type="button"
              onClick={() => handleStepDuration(-5)}
              className="w-5 h-5 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/5 rounded text-xs cursor-pointer"
              title="-5 segundos"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={3600}
              value={item.duration}
              onChange={handleDurationChange}
              className="w-10 bg-transparent text-center text-xs font-mono font-bold text-[#F8FAFC] focus:outline-none"
            />
            <span className="text-[10px] text-[#64748B] pr-0.5">s</span>
            <button
              type="button"
              onClick={() => handleStepDuration(5)}
              className="w-5 h-5 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/5 rounded text-xs cursor-pointer"
              title="+5 segundos"
            >
              +
            </button>
          </div>
        )}

        {/* Transition Selector */}
        <div className="flex items-center gap-1 bg-[#070B14] border border-white/10 rounded-lg px-2 py-1">
          <Sparkles className="w-3 h-3 text-[#C084FC]" />
          <select
            value={item.transition || 'FADE'}
            onChange={(e) => onUpdateTransition(item.id, e.target.value as PlaylistItemTransition)}
            className="bg-transparent text-[11px] text-[#94A3B8] focus:outline-none cursor-pointer pr-1"
          >
            <option value="NONE" className="bg-[#0B1120] text-white">Sem Transição</option>
            <option value="FADE" className="bg-[#0B1120] text-white">Fade</option>
            <option value="SLIDE_LEFT" className="bg-[#0B1120] text-white">Slide Esquerda</option>
            <option value="SLIDE_RIGHT" className="bg-[#0B1120] text-white">Slide Direita</option>
            <option value="ZOOM" className="bg-[#0B1120] text-white">Zoom</option>
          </select>
        </div>

        {/* Repeat Selector */}
        <div className="flex items-center gap-1 bg-[#070B14] border border-white/10 rounded-lg px-2 py-1">
          <Repeat className="w-3 h-3 text-[#38BDF8]" />
          <select
            value={item.repeatCount || 1}
            onChange={(e) => onUpdateRepeat(item.id, parseInt(e.target.value, 10))}
            className="bg-transparent text-[11px] text-[#94A3B8] focus:outline-none cursor-pointer pr-1"
            title="Repetições por ciclo"
          >
            <option value={1} className="bg-[#0B1120] text-white">1x</option>
            <option value={2} className="bg-[#0B1120] text-white">2x</option>
            <option value={3} className="bg-[#0B1120] text-white">3x</option>
          </select>
        </div>

        {/* Enable / Disable toggle button */}
        <button
          type="button"
          onClick={() => onToggleEnabled(item.id)}
          title={item.enabled ? 'Desativar este item do loop' : 'Ativar este item no loop'}
          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
            item.enabled
              ? 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/20'
              : 'bg-white/5 text-[#64748B] border-white/10 hover:text-white'
          }`}
        >
          {item.enabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>

        {/* Remove item button */}
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          title="Remover da playlist"
          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F43F5E] hover:bg-[#F43F5E]/10 border border-transparent hover:border-[#F43F5E]/20 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
