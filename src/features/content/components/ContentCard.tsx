import React from 'react';
import {
  MoreVertical,
  Layers,
  Monitor,
  Eye,
  Pencil,
  PlusCircle,
  Download,
  Archive,
  Trash2,
  HardDrive,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ContentItem } from '../../../types/domain';
import { ContentVisualThumbnail } from './ContentVisualThumbnail';
import { Badge } from '../../../components/ui/Badge';
import { Dropdown } from '../../../components/ui/Dropdown';
import {
  formatFileSize,
  formatDuration,
  getContentStatusBadge,
  getContentTypeInfo,
} from '../utils/contentFormatters';

interface ContentCardProps {
  content: ContentItem;
  isSelected?: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (id: string) => void;
  onAddToPlaylist: (content: ContentItem) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  /** Renomear a mídia (só o nome; o ficheiro e o URL não mudam). */
  onRename: (content: ContentItem) => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  content,
  isSelected = false,
  onToggleSelect,
  onOpenDetails,
  onAddToPlaylist,
  onArchive,
  onDelete,
  onRename,
}) => {
  const statusBadge = getContentStatusBadge(content.status);
  const typeInfo = getContentTypeInfo(content.type);

  const menuItems = [
    {
      id: 'view',
      label: 'Ver Detalhes & Metadados',
      icon: <Eye className="w-4 h-4 text-blue-400" />,
      onClick: () => onOpenDetails(content.id),
    },
    {
      id: 'add-playlist',
      label: 'Adicionar à Playlist',
      icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
      onClick: () => onAddToPlaylist(content),
    },
    {
      id: 'rename',
      label: 'Renomear Mídia',
      icon: <Pencil className="w-4 h-4 text-cyan-300" />,
      onClick: () => onRename(content),
    },
    {
      id: 'download',
      label: 'Baixar Arquivo Original',
      icon: <Download className="w-4 h-4 text-slate-300" />,
      onClick: () => {
        // Mock download trigger
        const link = document.createElement('a');
        link.href = '#';
        link.download = content.name;
        // visual feedback only
      },
    },
    {
      id: 'archive',
      label: 'Arquivar Conteúdo',
      icon: <Archive className="w-4 h-4 text-amber-400" />,
      onClick: () => onArchive(content.id),
    },
    {
      id: 'delete',
      label: 'Excluir da Biblioteca',
      icon: <Trash2 className="w-4 h-4 text-red-400" />,
      danger: true,
      onClick: () => onDelete(content.id),
    },
  ];

  return (
    <div
      onClick={() => onOpenDetails(content.id)}
      className={`group relative bg-[#0B1120]/90 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/10 shadow-lg shadow-blue-500/10'
          : 'border-white/10 hover:border-white/25 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-0.5'
      }`}
    >
      {/* Top Media Preview Section */}
      <div className="p-3 pb-0 relative">
        {/* Selection Checkbox Overlay */}
        <div
          className="absolute top-5 left-5 z-20"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(content.id);
          }}
        >
          <div
            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-black/60 backdrop-blur-md border-white/30 hover:border-white opacity-80 group-hover:opacity-100'
            }`}
          >
            {isSelected && (
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
              </svg>
            )}
          </div>
        </div>

        {/* Dropdown Menu Overlay */}
        <div
          className="absolute top-5 right-5 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <Dropdown
            items={menuItems}
            trigger={
              <button
                type="button"
                className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-slate-300 hover:text-white hover:bg-black/90 transition-colors shadow-sm"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            }
          />
        </div>

        {/* Visual Thumbnail */}
        <ContentVisualThumbnail content={content} />
      </div>

      {/* Card Content & Metadata */}
      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Tags & Folder */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-[10px] font-mono text-slate-400 truncate">
                {content.folderName || 'Geral'}
              </span>
              {(content.tags?.includes('Creative AI') || (content.metadata as any)?.source === 'creative-ai' || content.folderId === 'fld-creative-ai' || content.name?.startsWith('[Creative AI]')) && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-[9px] font-mono font-bold flex-shrink-0 shadow-[0_0_10px_rgba(0,229,255,0.15)]">
                  <Sparkles className="w-2.5 h-2.5 text-[#00E5FF]" /> Creative AI
                </span>
              )}
            </div>
            <Badge variant={statusBadge.variant} size="sm" dot>
              {statusBadge.label}
            </Badge>
          </div>

          {/* Title */}
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-1 flex-1">
              {content.name}
            </h3>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRename(content);
              }}
              title="Renomear mídia"
              className="p-1 rounded text-slate-500 hover:text-cyan-300 hover:bg-white/10 transition-all cursor-pointer opacity-80 group-hover:opacity-100 shrink-0"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Technical summary line */}
          <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-1">
            <span className="font-mono">{formatFileSize(content.fileSize)}</span>
            <span>•</span>
            <span className="truncate">{content.resolution || 'HD'}</span>
            {content.duration ? (
              <>
                <span>•</span>
                <span className="font-mono text-slate-300">{formatDuration(content.duration)}</span>
              </>
            ) : null}
          </p>
        </div>

        {/* Network & Playlist Usage Footer */}
        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1"
              title={`Usado em ${content.usage?.playlistCount || 0} playlists`}
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-slate-300">{content.usage?.playlistCount || 0}</span>
            </span>

            <span
              className="inline-flex items-center gap-1"
              title={`Vinculado a ${content.usage?.displayCount || 0} displays em Luanda`}
            >
              <Monitor className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-slate-300">{content.usage?.displayCount || 0}</span>
            </span>
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(content.createdAt).toLocaleDateString('pt-AO', {
              day: '2-digit',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    </div>
  );
};
