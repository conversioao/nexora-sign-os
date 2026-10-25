import React, { useState } from 'react';
import {
  Play,
  Film,
  Monitor,
  Clock,
  MoreVertical,
  Copy,
  Trash2,
  PlaySquare,
  Sparkles,
  ExternalLink,
  Layers,
  PauseCircle,
  PlayCircle,
  Lock,
  FileText,
} from 'lucide-react';
import { Playlist, PlaylistStatus } from '../../../types/domain';
import { Badge } from '../../../components/ui/Badge';
import { Dropdown } from '../../../components/ui/Dropdown';
import { formatDurationClock, STATUS_CONFIG } from '../utils/playlistUtils';

interface PlaylistCardProps {
  playlist: Playlist;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenBuilder: (id: string) => void;
  onOpenPreview: (playlist: Playlist) => void;
  onOpenReport?: (playlist: Playlist) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: PlaylistStatus) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  playlist,
  isSelected,
  onToggleSelect,
  onOpenBuilder,
  onOpenPreview,
  onOpenReport,
  onDuplicate,
  onDelete,
  onStatusChange,
}) => {
  const statusInfo = STATUS_CONFIG[playlist.status] || STATUS_CONFIG.DRAFT;

  // Derive preview collage items if available
  const previewItems = playlist.items?.slice(0, 3) || [];

  return (
    <div
      className={`group relative bg-[#0F172A] border rounded-xl overflow-hidden transition-all duration-200 flex flex-col ${
        isSelected
          ? 'border-[#2563EB] shadow-md shadow-[#2563EB]/20 ring-1 ring-[#2563EB]'
          : 'border-white/10 hover:border-white/20 hover:bg-[#131D31]'
      }`}
    >
      {/* Visual Header / Banner */}
      <div
        className={`relative h-36 bg-gradient-to-br ${
          playlist.thumbnailGradient || 'from-blue-900 via-indigo-950 to-slate-900'
        } p-3 flex flex-col justify-between overflow-hidden cursor-pointer`}
        onClick={() => onOpenBuilder(playlist.id)}
      >
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/5 via-transparent to-black/30 pointer-events-none" />

        {/* Top bar inside banner */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Status Badge */}
          <Badge
            variant={statusInfo.variant}
            size="sm"
            className="backdrop-blur-md shadow-sm"
          >
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotColor}`} />
            {statusInfo.label}
          </Badge>

          {/* Technical code pill & Lock Indicator */}
          <div className="flex items-center gap-1.5">
            {(playlist.isSystemLocked || playlist.displayId) && (
              <span className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md">
                <Lock className="w-2.5 h-2.5" />
                Display
              </span>
            )}
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-black/40 text-[#94A3B8] backdrop-blur-md border border-white/5">
              {playlist.code}
            </span>
          </div>
        </div>

        {/* Center / Preview peek overlay */}
        <div className="relative z-10 flex items-center justify-between mt-auto">
          {/* Duration Badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-[#F8FAFC] text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>{formatDurationClock(playlist.totalDuration)}</span>
          </div>

          {/* Play Preview Hover Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPreview(playlist);
            }}
            title="Visualizar Reprodução"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#2563EB]/90 hover:bg-[#2563EB] text-white text-xs font-medium backdrop-blur-md shadow-lg shadow-black/50 transition-transform active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Preview</span>
          </button>
        </div>

        {/* Mini item slots visualizer */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40 flex">
          {playlist.items && playlist.items.length > 0 ? (
            playlist.items.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  width: `${(item.duration / Math.max(playlist.totalDuration, 1)) * 100}%`,
                }}
                className={`h-full border-r border-black/50 ${
                  item.enabled ? 'bg-[#38BDF8]/60' : 'bg-white/20'
                }`}
                title={`Item ${idx + 1}: ${item.duration}s`}
              />
            ))
          ) : (
            <div className="w-full h-full bg-white/10" />
          )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Title and Dropdown */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3
              onClick={() => onOpenBuilder(playlist.id)}
              className="text-sm font-semibold text-[#F8FAFC] font-display hover:text-[#38BDF8] transition-colors line-clamp-1 cursor-pointer flex-1"
              title={playlist.name}
            >
              {playlist.name}
            </h3>

            {/* Actions Menu */}
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="p-1 rounded text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Ações da playlist"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              }
              items={[
                {
                  id: 'open',
                  label: 'Abrir Construtor',
                  icon: <PlaySquare className="w-3.5 h-3.5 text-[#38BDF8]" />,
                  onClick: () => onOpenBuilder(playlist.id),
                },
                {
                  id: 'preview',
                  label: 'Simulação Preview',
                  icon: <Play className="w-3.5 h-3.5 text-[#10B981]" />,
                  onClick: () => onOpenPreview(playlist),
                },
                {
                  id: 'report',
                  label: 'Relatório PDF / Proof of Play',
                  icon: <FileText className="w-3.5 h-3.5 text-[#06B6D4]" />,
                  onClick: () => onOpenReport && onOpenReport(playlist),
                },
                {
                  id: 'duplicate',
                  label: 'Duplicar Playlist',
                  icon: <Copy className="w-3.5 h-3.5 text-[#C084FC]" />,
                  onClick: () => onDuplicate(playlist.id),
                },
                {
                  id: 'toggle-status',
                  label:
                    playlist.status === 'ACTIVE'
                      ? 'Pausar Playlist'
                      : playlist.status === 'PAUSED'
                      ? 'Ativar Playlist'
                      : 'Definir como Ativa',
                  icon:
                    playlist.status === 'ACTIVE' ? (
                      <PauseCircle className="w-3.5 h-3.5 text-[#F59E0B]" />
                    ) : (
                      <PlayCircle className="w-3.5 h-3.5 text-[#10B981]" />
                    ),
                  onClick: () =>
                    onStatusChange(
                      playlist.id,
                      playlist.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
                    ),
                },
                ...(playlist.isSystemLocked || playlist.displayId
                  ? [
                      {
                        id: 'locked-info',
                        label: 'Vinculada ao Display',
                        icon: <Lock className="w-3.5 h-3.5 text-amber-400" />,
                        onClick: () => {},
                      },
                    ]
                  : [
                      {
                        id: 'delete',
                        label: 'Excluir Playlist',
                        icon: <Trash2 className="w-3.5 h-3.5 text-[#F43F5E]" />,
                        danger: true,
                        onClick: () => onDelete(playlist.id),
                      },
                    ]),
              ]}
            />
          </div>

          {/* Description */}
          <p className="text-xs text-[#94A3B8] line-clamp-2 leading-relaxed mb-3">
            {playlist.description || 'Nenhuma descrição detalhada fornecida.'}
          </p>

          {/* Metrics summary chips */}
          <div className="grid grid-cols-2 gap-2 p-2 bg-[#070B14] rounded-lg border border-white/5 text-xs text-[#94A3B8]">
            <div className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span className="font-mono text-[#F8FAFC]">
                {playlist.itemCount}{' '}
                <span className="text-[#64748B] text-[11px]">
                  {playlist.itemCount === 1 ? 'mídia' : 'mídias'}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-[#EC4899]" />
              <span className="font-mono text-[#F8FAFC]">
                {playlist.displayCount}{' '}
                <span className="text-[#64748B] text-[11px]">
                  {playlist.displayCount === 1 ? 'display' : 'displays'}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        {playlist.tags && playlist.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {playlist.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#94A3B8] border border-white/5"
              >
                #{tag}
              </span>
            ))}
            {playlist.tags.length > 3 && (
              <span className="text-[10px] text-[#64748B]">
                +{playlist.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer info: author and update date */}
        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-[#64748B]">
          <div className="flex items-center gap-1.5 truncate">
            {playlist.createdBy.avatar ? (
              <img
                src={playlist.createdBy.avatar}
                alt={playlist.createdBy.name}
                className="w-4 h-4 rounded-full object-cover"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-[#2563EB]/30 text-[#38BDF8] flex items-center justify-center text-[9px] font-bold">
                {playlist.createdBy.name.charAt(0)}
              </div>
            )}
            <span className="text-[#94A3B8] truncate">{playlist.createdBy.name}</span>
          </div>

          <span className="font-mono text-[10px]">
            {new Date(playlist.updatedAt).toLocaleDateString('pt-PT', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
