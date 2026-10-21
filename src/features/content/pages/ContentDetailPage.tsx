import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Film,
  Image as ImageIcon,
  FileText,
  Layers,
  Monitor,
  PlusCircle,
  Download,
  Trash2,
  Share2,
  Calendar,
  User,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Tag,
  Folder,
  Hash,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { ContentItem } from '../../../types/domain';
import { NexoraService } from '../../../services';
import { ContentPreviewViewer } from '../components/ContentPreviewViewer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/ui/States';
import { useToast } from '../../../components/ui/Toast';
import {
  formatFileSize,
  formatDuration,
  formatOrientationLabel,
  getContentStatusBadge,
  getContentTypeInfo,
  formatDateRelative,
} from '../utils/contentFormatters';

interface ContentDetailPageProps {
  contentId: string;
  onBack: () => void;
  onNavigateToDisplay?: (displayId: string) => void;
}

export const ContentDetailPage: React.FC<ContentDetailPageProps> = ({
  contentId,
  onBack,
  onNavigateToDisplay,
}) => {
  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isAddingTag, setIsAddingTag] = useState<boolean>(false);
  const { addToast } = useToast();

  const loadContentDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const item = await NexoraService.contents.getById(contentId);
      if (!item) {
        setError(`Conteúdo não encontrado para o ID "${contentId}".`);
      } else {
        setContent(item);
      }
    } catch (err) {
      console.error('Error fetching content detail:', err);
      setError('Erro ao carregar os detalhes do conteúdo.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadContentDetail();
  }, [contentId]);

  const handleAddToPlaylist = () => {
    addToast({
      type: 'info',
      title: 'Gestão de Playlists',
      message: 'Playlist management será disponibilizado na próxima etapa.',
    });
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !content) return;
    try {
      const updated = await NexoraService.contents.addTag(content.id, newTagInput.trim());
      setContent(updated);
      setNewTagInput('');
      setIsAddingTag(false);
      addToast({
        type: 'success',
        title: 'Tag Adicionada',
        message: `Tag "${newTagInput.trim()}" associada com sucesso.`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="text" width={240} height={28} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton variant="rectangular" height={360} className="rounded-2xl" />
            <Skeleton variant="rectangular" height={200} className="rounded-xl" />
          </div>
          <div className="lg:col-span-5 space-y-4">
            <Skeleton variant="rectangular" height={300} className="rounded-xl" />
            <Skeleton variant="rectangular" height={260} className="rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="py-12">
        <ErrorState
          title="Não foi possível carregar o conteúdo"
          message={error || 'O registro solicitado não existe no repositório.'}
          actionLabel="Voltar para Biblioteca"
          onAction={onBack}
        />
      </div>
    );
  }

  const statusBadge = getContentStatusBadge(content.status);
  const typeInfo = getContentTypeInfo(content.type);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-[#0B1120] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-colors group shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Conteúdos</span>
              <span className="text-xs text-slate-400">/</span>
              <span className="text-xs font-mono text-blue-400">{content.code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              {content.name}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="cyan"
            size="sm"
            onClick={handleAddToPlaylist}
            className="flex items-center gap-1.5 text-xs shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar à Playlist</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              addToast({
                type: 'info',
                title: 'Download Iniciado',
                message: `Baixando arquivo original (${content.mimeType}).`,
              });
            }}
            className="flex items-center gap-1.5 text-xs"
          >
            <Download className="w-4 h-4 text-slate-300" />
            <span className="hidden sm:inline">Baixar</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              addToast({
                type: 'warning',
                title: 'Exclusão de Mídia',
                message: 'Para excluir, utilize o painel de gerenciamento de permissões.',
              });
            }}
            className="p-2"
            title="Excluir Mídia"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Media Preview & Technical Specs (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive Player / Media Preview */}
          <div className="bg-[#0B1120]/90 rounded-2xl border border-white/10 p-4 shadow-xl">
            <ContentPreviewViewer content={content} />

            {/* Sub-bar under player */}
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Badge variant={statusBadge.variant} size="md" dot>
                  {statusBadge.label}
                </Badge>
                <Badge variant={typeInfo.badgeVariant} size="md">
                  {typeInfo.label}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                <span>{formatFileSize(content.fileSize)}</span>
                <span>•</span>
                <span>{content.resolution}</span>
                {content.duration && (
                  <>
                    <span>•</span>
                    <span className="text-[#38BDF8]">{formatDuration(content.duration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Technical Specifications Card */}
          <div className="bg-[#0B1120]/90 rounded-2xl border border-white/10 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Especificações Técnicas & Codecs
              </h3>
              <span className="text-[11px] font-mono text-slate-400">Digital Signage Specs</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">Tipo MIME</span>
                <span className="font-mono text-slate-200 font-medium">{content.mimeType}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">Resolução Nativa</span>
                <span className="font-mono text-slate-200 font-medium">{content.resolution}</span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">Aspect Ratio / Modo</span>
                <span className="font-mono text-slate-200 font-medium">
                  {content.aspectRatio} ({formatOrientationLabel(content.orientation)})
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">Codec de Mídia</span>
                <span className="font-mono text-slate-200 font-medium">
                  {content.metadata?.codec || 'Standard RGB/JPEG'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">Taxa de Quadros / Bits</span>
                <span className="font-mono text-slate-200 font-medium">
                  {content.metadata?.frameRate ? `${content.metadata.frameRate} fps` : '60 fps'}
                  {content.metadata?.bitrateKbps ? ` • ${(content.metadata.bitrateKbps / 1000).toFixed(1)} Mbps` : ''}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 block text-[11px]">Espaço de Cor</span>
                <span className="font-mono text-slate-200 font-medium">
                  {content.metadata?.colorSpace || 'sRGB BT.709'}
                </span>
              </div>
            </div>

            {/* Checksum & Security */}
            {content.metadata?.checksum && (
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 space-y-1">
                <span className="text-[10px] uppercase font-mono text-slate-400 tracking-wider flex items-center gap-1">
                  <Hash className="w-3 h-3 text-blue-400" />
                  Checksum de Integridade (SHA-256)
                </span>
                <p className="text-[11px] font-mono text-slate-300 break-all select-all">
                  {content.metadata.checksum}
                </p>
              </div>
            )}
          </div>

          {/* Android TV Player Compatibility Card */}
          <div className="bg-[#0B1120]/90 rounded-2xl border border-white/10 p-5 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Compatibilidade com Nexora Player (Android / Totens)</span>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Formato 100% Homologado para Execução</p>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">
                  {content.metadata.androidCompatibility.notes ||
                    'Compatível com decodificação por hardware em todos os players Android TV e Totens da rede Luanda.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Network Distribution & Usage (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Usage Counters Box */}
          <div className="bg-[#0B1120]/90 rounded-2xl border border-white/10 p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                Utilização na Rede Nexora
              </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Digital Signage
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 block mb-1">Playlists Vinculadas</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-white font-mono">
                    {content.usage?.playlistCount || 0}
                  </span>
                  <span className="text-[11px] text-slate-400">grades</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 block mb-1">Displays Transmitindo</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-[#38BDF8] font-mono">
                    {content.usage?.displayCount || 0}
                  </span>
                  <span className="text-[11px] text-slate-400">telas ativas</span>
                </div>
              </div>
            </div>

            {/* Connected Displays List */}
            {content.usage.associatedDisplays && content.usage.associatedDisplays.length > 0 && (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-300 block">
                  Pontos de Exibição em Luanda:
                </span>
                <div className="space-y-1.5">
                  {content.usage.associatedDisplays.map((dsp) => (
                    <div
                      key={dsp.id}
                      onClick={() => onNavigateToDisplay && onNavigateToDisplay(dsp.id)}
                      className="p-2.5 rounded-lg bg-black/40 hover:bg-white/5 border border-white/5 transition-colors flex items-center justify-between text-xs cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Monitor className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate group-hover:text-blue-400 transition-colors">
                            {dsp.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {dsp.venueName} • {dsp.municipality}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                        {dsp.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Associated Playlists List */}
            {content.usage.associatedPlaylists && content.usage.associatedPlaylists.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-xs font-semibold text-slate-300 block">
                  Grades de Programação:
                </span>
                <div className="space-y-1.5">
                  {content.usage.associatedPlaylists.map((ply) => (
                    <div
                      key={ply.id}
                      className="p-2.5 rounded-lg bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span className="font-medium text-slate-200">{ply.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ply.activeSlotCount} spots
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note on mock relationships */}
            <p className="text-[11px] text-slate-400 italic pt-1">
              * Relações e vínculos de grade sincronizados com o motor de Digital Signage.
            </p>
          </div>

          {/* Metadata & Audit Information */}
          <div className="bg-[#0B1120]/90 rounded-2xl border border-white/10 p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <Folder className="w-4 h-4 text-amber-400" />
              Organização & Autoria
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pasta de Destino</span>
                <span className="font-medium text-slate-200">{content.folderName || 'Geral'}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Criado Por</span>
                <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{content.createdBy.name}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Data de Cadastro</span>
                <span className="font-mono text-slate-300">
                  {formatDateRelative(content.createdAt)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Última Atualização</span>
                <span className="font-mono text-slate-300">
                  {formatDateRelative(content.updatedAt)}
                </span>
              </div>
            </div>

            {/* Tags Cloud */}
            <div className="pt-3 border-t border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                  Tags de Classificação
                </span>
                {!isAddingTag && (
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    Adicionar
                  </button>
                )}
              </div>

              {isAddingTag && (
                <form onSubmit={handleAddTag} className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Nova tag..."
                    className="flex-1 bg-[#030712] border border-white/15 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                  <Button type="submit" variant="primary" size="sm" className="px-2 py-1 text-xs">
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsAddingTag(false);
                      setNewTagInput('');
                    }}
                    className="px-2 py-1 text-xs"
                  >
                    Cancelar
                  </Button>
                </form>
              )}

              <div className="flex flex-wrap gap-1.5 pt-1">
                {content.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
