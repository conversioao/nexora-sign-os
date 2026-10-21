import React from 'react';
import {
  Film,
  Image as ImageIcon,
  FileText,
  MoreVertical,
  Layers,
  Monitor,
  Eye,
  PlusCircle,
  Download,
  Archive,
  Trash2,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import { ContentItem } from '../../../types/domain';
import { Badge } from '../../../components/ui/Badge';
import { Dropdown } from '../../../components/ui/Dropdown';
import {
  formatFileSize,
  formatDuration,
  getContentStatusBadge,
  getContentTypeInfo,
} from '../utils/contentFormatters';
import { ContentSortField, SortOrder } from '../hooks/useContent';

interface ContentTableProps {
  items: ContentItem[];
  selectedIds: Set<string>;
  sortField: ContentSortField;
  sortOrder: SortOrder;
  onToggleSelect: (id: string) => void;
  onSelectAllPage: () => void;
  onSortChange: (field: ContentSortField) => void;
  onOpenDetails: (id: string) => void;
  onAddToPlaylist: (content: ContentItem) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  /** Renomear a mídia (só o nome; o ficheiro e o URL não mudam). */
  onRename: (content: ContentItem) => void;
}

export const ContentTable: React.FC<ContentTableProps> = ({
  items,
  selectedIds,
  sortField,
  sortOrder,
  onToggleSelect,
  onSelectAllPage,
  onSortChange,
  onOpenDetails,
  onAddToPlaylist,
  onArchive,
  onDelete,
  onRename,
}) => {
  const isAllPageSelected =
    items.length > 0 && items.every((item) => selectedIds.has(item.id));

  const renderSortIcon = (field: ContentSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-400" />
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/10 bg-[#0B1120]/90">
      <table className="w-full text-left text-sm border-collapse">
        {/* Table Header */}
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.02] text-xs font-semibold text-slate-400">
            {/* Checkbox Header */}
            <th className="w-12 px-4 py-3.5 text-center">
              <input
                type="checkbox"
                checked={isAllPageSelected}
                onChange={onSelectAllPage}
                className="w-4 h-4 rounded border-white/20 bg-[#030712] text-blue-600 focus:ring-blue-500/40 cursor-pointer"
              />
            </th>

            {/* Mídia & Nome */}
            <th className="px-4 py-3.5 min-w-[260px]">
              <button
                type="button"
                onClick={() => onSortChange('name')}
                className="flex items-center gap-1.5 hover:text-white transition-colors group"
              >
                <span>Conteúdo & Código</span>
                {renderSortIcon('name')}
              </button>
            </th>

            {/* Formato / Tipo */}
            <th className="px-4 py-3.5 min-w-[130px]">Tipo / Formato</th>

            {/* Resolução & Orientação */}
            <th className="px-4 py-3.5 min-w-[150px]">Resolução</th>

            {/* Tamanho & Duração */}
            <th className="px-4 py-3.5 min-w-[140px]">
              <button
                type="button"
                onClick={() => onSortChange('fileSize')}
                className="flex items-center gap-1.5 hover:text-white transition-colors group"
              >
                <span>Tamanho / Duração</span>
                {renderSortIcon('fileSize')}
              </button>
            </th>

            {/* Status */}
            <th className="px-4 py-3.5 min-w-[120px]">Status</th>

            {/* Utilização */}
            <th className="px-4 py-3.5 min-w-[140px]">
              <button
                type="button"
                onClick={() => onSortChange('usage')}
                className="flex items-center gap-1.5 hover:text-white transition-colors group"
              >
                <span>Uso na Rede</span>
                {renderSortIcon('usage')}
              </button>
            </th>

            {/* Data */}
            <th className="px-4 py-3.5 min-w-[120px]">
              <button
                type="button"
                onClick={() => onSortChange('createdAt')}
                className="flex items-center gap-1.5 hover:text-white transition-colors group"
              >
                <span>Adicionado em</span>
                {renderSortIcon('createdAt')}
              </button>
            </th>

            {/* Ações */}
            <th className="w-16 px-4 py-3.5 text-right">Ações</th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-white/5 text-slate-300 text-xs">
          {items.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const statusBadge = getContentStatusBadge(item.status);
            const typeInfo = getContentTypeInfo(item.type);

            const menuItems = [
              {
                id: 'view',
                label: 'Ver Detalhes',
                icon: <Eye className="w-4 h-4 text-blue-400" />,
                onClick: () => onOpenDetails(item.id),
              },
              {
                id: 'add-playlist',
                label: 'Adicionar à Playlist',
                icon: <PlusCircle className="w-4 h-4 text-emerald-400" />,
                onClick: () => onAddToPlaylist(item),
              },
              {
                id: 'rename',
                label: 'Renomear Mídia',
                icon: <Pencil className="w-4 h-4 text-cyan-300" />,
                onClick: () => onRename(item),
              },
              {
                id: 'download',
                label: 'Baixar Original',
                icon: <Download className="w-4 h-4 text-slate-300" />,
                onClick: () => {},
              },
              {
                id: 'archive',
                label: 'Arquivar',
                icon: <Archive className="w-4 h-4 text-amber-400" />,
                onClick: () => onArchive(item.id),
              },
              {
                id: 'delete',
                label: 'Excluir',
                icon: <Trash2 className="w-4 h-4 text-red-400" />,
                danger: true,
                onClick: () => onDelete(item.id),
              },
            ];

            return (
              <tr
                key={item.id}
                onClick={() => onOpenDetails(item.id)}
                className={`transition-colors cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-600/10 hover:bg-blue-600/15'
                    : 'hover:bg-white/[0.03]'
                }`}
              >
                {/* Checkbox Column */}
                <td
                  className="px-4 py-3 text-center"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSelect(item.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(item.id)}
                    className="w-4 h-4 rounded border-white/20 bg-[#030712] text-blue-600 focus:ring-blue-500/40 cursor-pointer"
                  />
                </td>

                {/* Conteúdo & Nome */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* Mini Thumbnail Representation */}
                    <div
                      className={`w-11 h-8 rounded border border-white/15 overflow-hidden flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${
                        item.thumbnailGradient || 'from-slate-800 to-slate-950'
                      }`}
                    >
                      {item.type === 'VIDEO' && <Film className="w-3.5 h-3.5 text-[#38BDF8]" />}
                      {item.type === 'IMAGE' && <ImageIcon className="w-3.5 h-3.5 text-[#60A5FA]" />}
                      {item.type === 'PDF' && <FileText className="w-3.5 h-3.5 text-[#C084FC]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-white group-hover:text-blue-400 transition-colors truncate max-w-[260px]">
                          {item.name}
                        </p>
                        {(item.tags?.includes('Creative AI') || (item.metadata as any)?.source === 'creative-ai' || item.folderId === 'fld-creative-ai' || item.name?.startsWith('[Creative AI]')) && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-[9px] font-mono font-bold flex-shrink-0">
                            <Sparkles className="w-2.5 h-2.5 text-[#00E5FF]" /> Creative AI
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-mono text-slate-400">{item.code}</span>
                        {item.folderName && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">{item.folderName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Tipo / Formato */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-200">{typeInfo.shortLabel}</span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {item.mimeType.split('/')[1]?.toUpperCase()}
                    </span>
                  </div>
                </td>

                {/* Resolução & Orientação */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-slate-200">{item.resolution.split(' ')[0]}</span>
                    <span className="text-[10px] text-slate-400">
                      {item.orientation === 'LANDSCAPE'
                        ? '16:9 Landscape'
                        : item.orientation === 'PORTRAIT'
                        ? '9:16 Portrait'
                        : '1:1 Square'}
                    </span>
                  </div>
                </td>

                {/* Tamanho & Duração */}
                <td className="px-4 py-3">
                  <div className="flex flex-col font-mono">
                    <span className="text-slate-200">{formatFileSize(item.fileSize)}</span>
                    {item.duration ? (
                      <span className="text-[10px] text-[#38BDF8]">
                        {formatDuration(item.duration)}
                      </span>
                    ) : item.metadata.pageCount ? (
                      <span className="text-[10px] text-[#C084FC]">
                        {item.metadata.pageCount} págs
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Estático</span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <Badge variant={statusBadge.variant} size="sm" dot>
                    {statusBadge.label}
                  </Badge>
                </td>

                {/* Utilização */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span
                      className="inline-flex items-center gap-1 text-[11px]"
                      title="Playlists vinculadas"
                    >
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-200 font-mono">
                        {item.usage.playlistCount}
                      </strong>
                    </span>
                    <span
                      className="inline-flex items-center gap-1 text-[11px]"
                      title="Displays transmitindo"
                    >
                      <Monitor className="w-3.5 h-3.5 text-slate-400" />
                      <strong className="text-slate-200 font-mono">
                        {item.usage.displayCount}
                      </strong>
                    </span>
                  </div>
                </td>

                {/* Data de Criação */}
                <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                  {new Date(item.createdAt).toLocaleDateString('pt-AO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>

                {/* Ações */}
                <td
                  className="px-4 py-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Dropdown
                    items={menuItems}
                    trigger={
                      <button
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    }
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
