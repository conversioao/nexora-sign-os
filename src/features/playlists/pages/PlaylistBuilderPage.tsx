import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Play,
  Save,
  Clock,
  Layers,
  Sparkles,
  Monitor,
  Film,
  AlertCircle,
  Tag,
  Check,
  FileEdit,
  Trash2,
  Copy
} from 'lucide-react';
import { usePlaylistBuilder } from '../hooks/usePlaylistBuilder';
import { PlaylistHeader } from '../components/PlaylistHeader';
import { PlaylistItemRow } from '../components/PlaylistItemRow';
import { ContentSelectorModal } from '../components/ContentSelectorModal';
import { PlaylistPreviewModal } from '../components/PlaylistPreviewModal';
import { AssociatedDisplaysModal } from '../components/AssociatedDisplaysModal';
import { Button } from '../../../components/ui/Button';
import { formatDurationClock } from '../utils/playlistUtils';
import { PlaylistStatus } from '../../../types/domain';
import { useSession } from '../../../context/SessionContext';

interface PlaylistBuilderPageProps {
  playlistId: string;
  onBack: () => void;
  onNavigateToBuilder: (id: string) => void;
  onDeletePlaylist?: () => void;
}

export const PlaylistBuilderPage: React.FC<PlaylistBuilderPageProps> = ({
  playlistId,
  onBack,
  onNavigateToBuilder,
  onDeletePlaylist,
}) => {
  const { currentOrganization, currentMembership } = useSession();
  const isPartner = currentOrganization?.type === 'CLIENT' || currentMembership?.role === 'CLIENT_OWNER' || currentMembership?.role === 'CLIENT_MANAGER';
  const {
    playlist,
    isLoading,
    isSaving,
    error,
    isDirty,
    calculatedTotalDuration,
    addItem,
    addMultipleItems,
    removeItem,
    reorderItems,
    moveItemUp,
    moveItemDown,
    updateItem,
    updatePlaylistInfo,
    savePlaylist,
    duplicate,
    updateAssociatedDisplays,
    reload,
  } = usePlaylistBuilder(playlistId);

  // Modals
  const [isContentSelectorOpen, setIsContentSelectorOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDisplaysModalOpen, setIsDisplaysModalOpen] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    try {
      await savePlaylist();
      setSaveSuccessNotification(true);
      setTimeout(() => setSaveSuccessNotification(false), 3000);
    } catch (err) {
      alert('Erro ao salvar as alterações da playlist.');
    }
  };

  const handleDuplicate = async () => {
    try {
      const dup = await duplicate();
      if (dup) {
        onNavigateToBuilder(dup.id);
      }
    } catch (err) {
      alert('Erro ao duplicar a playlist.');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    if (!window.confirm(`Tem certeza que deseja eliminar a playlist "${playlist.name}"? Esta ação não pode ser desfeita.`)) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' });
      if (onDeletePlaylist) onDeletePlaylist();
      else onBack();
    } catch (err) {
      alert('Erro ao eliminar a playlist.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <div className="h-16 bg-[#0F172A] border border-white/5 rounded-2xl animate-pulse" />
        <div className="h-96 bg-[#0F172A] border border-white/5 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-[#F43F5E]/10 text-[#F43F5E] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#F8FAFC]">Playlist não encontrada</h2>
        <p className="text-xs text-[#94A3B8]">{error || 'A playlist solicitada não existe.'}</p>
        <Button variant="primary" size="sm" onClick={onBack}>
          Voltar para a Lista
        </Button>
      </div>
    );
  }

  const rawItems = playlist.items || [];
  // For partners, only display the partner's own media items (exclude advertiser/admin campaigns)
  const items = isPartner
    ? rawItems.filter((it: any) => !it.campaignId && !it.advertiserName && !it.isSystemAd)
    : rawItems;

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col pb-16">
      {/* Fixed / Sticky Header */}
      <PlaylistHeader
        playlist={playlist}
        isDirty={isDirty}
        isSaving={isSaving}
        calculatedDuration={calculatedTotalDuration}
        disableAddContent={isPartner && items.length >= 3}
        onBack={onBack}
        onSave={handleSave}
        onPreview={() => setIsPreviewOpen(true)}
        onDuplicate={handleDuplicate}
        onAddContent={() => {
          if (isPartner && items.length >= 3) return;
          setIsContentSelectorOpen(true);
        }}
        onManageDisplays={() => setIsDisplaysModalOpen(true)}
        onStatusChange={(status: PlaylistStatus) => updatePlaylistInfo({ status })}
      />

      {/* Save Success Banner */}
      {saveSuccessNotification && (
        <div className="bg-[#10B981]/20 border-b border-[#10B981]/40 px-6 py-2 text-center text-xs text-[#10B981] font-medium animate-slideDown flex items-center justify-center gap-2">
          <Check className="w-4 h-4" />
          <span>Alterações da playlist salvas com sucesso no repositório!</span>
        </div>
      )}

      {/* Builder Layout */}
      <div className="p-6 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Section: Timeline Sequence */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sequence Bar Title & Quick Add */}
          <div className="flex items-center justify-between bg-[#0B1120] border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#38BDF8]">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#F8FAFC] font-display">
                  {isPartner ? 'Mídias da Playlist do Display (Máx 3 Mídias)' : 'Sequência Cronológica de Reprodução'}
                </h2>
                <p className="text-[11px] text-[#94A3B8]">
                  {isPartner 
                    ? 'Cada display do parceiro permite até 3 mídias de 10 segundos cada.' 
                    : 'Arraste ou use as setas para definir a ordem sequencial dos blocos.'}
                </p>
              </div>
            </div>

            {items.length >= 3 && isPartner ? (
              <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                Limite (3 Mídias)
              </span>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsContentSelectorOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-[#2563EB] hover:bg-[#1D4ED8]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Mídia</span>
              </Button>
            )}
          </div>

          {/* Timeline Items List */}
          {items.length === 0 ? (
            <div className="bg-[#0F172A] border border-dashed border-white/15 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 text-[#38BDF8] flex items-center justify-center">
                <Film className="w-7 h-7" />
              </div>
              <div className="max-w-md">
                <h3 className="text-sm font-semibold text-[#F8FAFC] font-display">
                  Sua playlist está vazia
                </h3>
                <p className="text-xs text-[#94A3B8] mt-1">
                  Adicione vídeos, imagens promocionais ou comunicados para montar a grade de veiculação.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsContentSelectorOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Escolher da Biblioteca</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {items.map((item, index) => (
                <PlaylistItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  totalItems={items.length}
                  disableDurationEdit={isPartner}
                  onMoveUp={moveItemUp}
                  onMoveDown={moveItemDown}
                  onUpdateDuration={(id, dur) => updateItem(id, { duration: isPartner ? 10 : dur })}
                  onUpdateTransition={(id, tr) => updateItem(id, { transition: tr })}
                  onUpdateRepeat={(id, rep) => updateItem(id, { repeatCount: rep })}
                  onToggleEnabled={(id) => updateItem(id, { enabled: !item.enabled })}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Section: Playlist Metadata & Connected Displays */}
        <div className="space-y-4">
          {/* Metadata Card */}
          <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4 space-y-3.5">
            <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider font-display flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Configurações da Grade</span>
            </h3>

            {/* Name */}
            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                Nome da Playlist
              </label>
              <input
                type="text"
                value={playlist.name}
                onChange={(e) => updatePlaylistInfo({ name: e.target.value })}
                className="w-full h-8 px-2.5 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                Descrição & Roteiro
              </label>
              <textarea
                rows={2}
                value={playlist.description}
                onChange={(e) => updatePlaylistInfo({ description: e.target.value })}
                className="w-full p-2.5 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                Etiquetas / Tags
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {playlist.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Connected Displays Card */}
          <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider font-display flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-[#EC4899]" />
                <span>Displays Associados</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsDisplaysModalOpen(true)}
                className="text-[11px] text-[#38BDF8] hover:underline cursor-pointer"
              >
                Gerenciar
              </button>
            </div>

            {playlist.associatedDisplays && playlist.associatedDisplays.length > 0 ? (
              <div className="space-y-2">
                {playlist.associatedDisplays.map((disp) => (
                  <div
                    key={disp.id}
                    className="p-2 rounded-lg bg-[#070B14] border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#F8FAFC] truncate text-[11px]">
                        {disp.name}
                      </p>
                      <p className="text-[10px] text-[#64748B] truncate">
                        {disp.venueName} • {disp.municipality}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {disp.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#070B14] border border-dashed border-white/10 text-center">
                <p className="text-xs text-[#64748B] mb-2">
                  Nenhum display físico vinculado no momento.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDisplaysModalOpen(true)}
                  className="text-xs h-7 px-2"
                >
                  Vincular Displays
                </Button>
              </div>
            )}
          </div>

          {/* Technical Specs Summary */}
          <div className="bg-[#0B1120] border border-white/10 rounded-xl p-4 space-y-2 text-xs text-[#94A3B8]">
            <h4 className="font-semibold text-[#F8FAFC] text-[11px] uppercase tracking-wider">
              Resumo Técnico do Loop
            </h4>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span>Duração Total:</span>
              <span className="font-mono text-[#F8FAFC] font-bold">
                {formatDurationClock(calculatedTotalDuration)}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-white/5">
              <span>Orientação Alvo:</span>
              <span className="text-[#F8FAFC]">
                {playlist.metadata?.orientation === 'PORTRAIT'
                  ? 'Vertical (9:16)'
                  : 'Horizontal (16:9)'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Total de Mídias Ativas:</span>
              <span className="font-mono text-[#38BDF8]">
                {items.filter((i) => i.enabled).length} de {items.length}
              </span>
            </div>
          </div>

          {/* Danger Zone — Delete Playlist */}
          <div className="bg-[#0B1120] border border-[#F43F5E]/20 rounded-xl p-4 space-y-2">
            <h4 className="font-semibold text-[#F43F5E] text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Trash2 className="w-3.5 h-3.5" />
              Zona de Perigo
            </h4>
            <p className="text-[11px] text-[#64748B]">
              Eliminar esta playlist permanentemente. Esta ação não pode ser revertida.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeletePlaylist}
              disabled={isDeleting}
              className="w-full text-xs h-8 border-[#F43F5E]/30 text-[#F43F5E] hover:bg-[#F43F5E]/10 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'A eliminar...' : 'Eliminar Playlist'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ContentSelectorModal
        isOpen={isContentSelectorOpen}
        onClose={() => setIsContentSelectorOpen(false)}
        onSelectItems={addMultipleItems}
      />

      <PlaylistPreviewModal
        isOpen={isPreviewOpen}
        playlist={playlist}
        onClose={() => setIsPreviewOpen(false)}
      />

      <AssociatedDisplaysModal
        isOpen={isDisplaysModalOpen}
        playlist={playlist}
        onClose={() => setIsDisplaysModalOpen(false)}
        onSave={updateAssociatedDisplays}
      />
    </div>
  );
};
