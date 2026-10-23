import React from 'react';
import {
  Play,
  Film,
  Monitor,
  Clock,
  MoreVertical,
  Copy,
  Trash2,
  PlaySquare,
  PauseCircle,
  PlayCircle,
  ExternalLink,
  Lock,
  FileText,
} from 'lucide-react';
import { Playlist, PlaylistStatus } from '../../../types/domain';
import { Badge } from '../../../components/ui/Badge';
import { Dropdown } from '../../../components/ui/Dropdown';
import { formatDurationClock, STATUS_CONFIG } from '../utils/playlistUtils';

interface PlaylistTableProps {
  playlists: Playlist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onOpenBuilder: (id: string) => void;
  onOpenPreview: (playlist: Playlist) => void;
  onOpenReport?: (playlist: Playlist) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: PlaylistStatus) => void;
}

export const PlaylistTable: React.FC<PlaylistTableProps> = ({
  playlists,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onOpenBuilder,
  onOpenPreview,
  onOpenReport,
  onDuplicate,
  onDelete,
  onStatusChange,
}) => {
  const allSelected = playlists.length > 0 && playlists.every((p) => selectedIds.has(p.id));

  return (
    <div className="bg-[#0B1120] border border-white/5 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto nexora-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#070B14] uppercase font-semibold text-[#64748B] text-[11px] tracking-wider border-b border-white/10 select-none">
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded bg-[#0F172A] border-white/20 text-[#2563EB] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3">Playlist</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Conteúdos</th>
              <th className="px-4 py-3">Duração Total</th>
              <th className="px-4 py-3">Displays</th>
              <th className="px-4 py-3">Autor</th>
              <th className="px-4 py-3">Atualização</th>
              <th className="w-24 px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/5 text-[#94A3B8]">
            {playlists.map((playlist) => {
              const isSelected = selectedIds.has(playlist.id);
              const statusInfo = STATUS_CONFIG[playlist.status] || STATUS_CONFIG.DRAFT;

              return (
                <tr
                  key={playlist.id}
                  className={`hover:bg-white/[0.03] transition-colors duration-150 group ${
                    isSelected ? 'bg-[#2563EB]/10' : ''
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="px-4 py-3.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(playlist.id)}
                      className="rounded bg-[#0F172A] border-white/20 text-[#2563EB] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                    />
                  </td>

                  {/* Playlist Name & Thumbnail Banner */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => onOpenBuilder(playlist.id)}
                        className={`w-11 h-11 rounded-lg bg-gradient-to-br ${
                          playlist.thumbnailGradient || 'from-blue-900 to-indigo-950'
                        } border border-white/10 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity`}
                      >
                        <PlaySquare className="w-5 h-5 text-white/80" />
                      </div>
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => onOpenBuilder(playlist.id)}
                          className="text-xs font-semibold text-[#F8FAFC] hover:text-[#38BDF8] transition-colors truncate block text-left font-display cursor-pointer"
                          title={playlist.name}
                        >
                          {playlist.name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-[#64748B]">
                            {playlist.code}
                          </span>
                          {(playlist.isSystemLocked || playlist.displayId) && (
                            <span className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Lock className="w-2.5 h-2.5" />
                              Display
                            </span>
                          )}
                          {playlist.tags && playlist.tags.length > 0 && (
                            <span className="text-[10px] text-[#94A3B8] bg-white/5 px-1.5 py-0.2 rounded">
                              #{playlist.tags[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3.5">
                    <Badge variant={statusInfo.variant} size="sm">
                      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusInfo.dotColor}`} />
                      {statusInfo.label}
                    </Badge>
                  </td>

                  {/* Contents count */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#F8FAFC]">
                      <Film className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span>{playlist.itemCount}</span>
                      <span className="text-[11px] text-[#64748B]">
                        {playlist.itemCount === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3.5 font-mono text-xs text-[#F8FAFC]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                      <span>{formatDurationClock(playlist.totalDuration)}</span>
                    </div>
                  </td>

                  {/* Displays count */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 font-mono text-xs text-[#F8FAFC]">
                      <Monitor className="w-3.5 h-3.5 text-[#EC4899]" />
                      <span>{playlist.displayCount}</span>
                      <span className="text-[11px] text-[#64748B]">
                        {playlist.displayCount === 1 ? 'tela' : 'telas'}
                      </span>
                    </div>
                  </td>

                  {/* Author */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 truncate max-w-[120px]">
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
                      <span className="text-[#94A3B8] text-xs truncate">
                        {playlist.createdBy.name}
                      </span>
                    </div>
                  </td>

                  {/* Last updated */}
                  <td className="px-4 py-3.5 font-mono text-[11px] text-[#64748B]">
                    {new Date(playlist.updatedAt).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>

                  {/* Actions column */}
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {/* Quick Preview Button */}
                      <button
                        type="button"
                        onClick={() => onOpenPreview(playlist)}
                        title="Simular Reprodução"
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#10B981] hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                      </button>

                      {/* Open Builder Button */}
                      <button
                        type="button"
                        onClick={() => onOpenBuilder(playlist.id)}
                        title="Abrir Construtor"
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#38BDF8] hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <PlaySquare className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu */}
                      <Dropdown
                        trigger={
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                            aria-label="Mais opções"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        }
                        items={[
                          {
                            id: 'builder',
                            label: 'Editar no Construtor',
                            icon: <PlaySquare className="w-3.5 h-3.5 text-[#38BDF8]" />,
                            onClick: () => onOpenBuilder(playlist.id),
                          },
                          {
                            id: 'preview',
                            label: 'Visualizar Preview',
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
