import React, { useState, useEffect } from 'react';
import { Search, ListVideo, Clock, Layers, Check, Sparkles } from 'lucide-react';
import { Playlist } from '../../../types/domain';
import { NexoraService } from '../../../services';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export interface SchedulePlaylistSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlaylistId?: string;
  onSelectPlaylist: (playlist: Playlist) => void;
}

export const SchedulePlaylistSelectorModal: React.FC<SchedulePlaylistSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedPlaylistId,
  onSelectPlaylist,
}) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      NexoraService.playlists
        .getAll()
        .then((data) => setPlaylists(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  const filteredPlaylists = playlists.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });

  const handleSelect = (playlist: Playlist) => {
    onSelectPlaylist(playlist);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selecionar Playlist para Programação"
      description="Escolha a grade de conteúdos que será veiculada nesta programação."
      size="lg"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome da playlist, código ou tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Playlist List */}
        <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Carregando playlists...</div>
          ) : filteredPlaylists.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Nenhuma playlist encontrada para o termo pesquisado.
            </div>
          ) : (
            filteredPlaylists.map((playlist) => {
              const isSelected = selectedPlaylistId === playlist.id;

              return (
                <div
                  key={playlist.id}
                  onClick={() => handleSelect(playlist)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/30 border-blue-500 shadow-md shadow-blue-950/20'
                      : 'bg-[#0B132B] border-[#1E293B] hover:border-blue-500/50 hover:bg-[#0F172A]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Thumbnail / Gradient */}
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-br ${
                        playlist.thumbnailGradient || 'from-blue-900 to-slate-900'
                      } flex items-center justify-center text-blue-300 shrink-0 border border-white/10`}
                    >
                      <ListVideo className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{playlist.name}</span>
                        <span className="text-xs text-slate-400 font-mono">({playlist.code})</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{playlist.itemCount || playlist.items?.length || 0} mídias</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          <span>{playlist.totalDuration}s de loop</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Select button / Check indicator */}
                  <div>
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500 text-white shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selecionada</span>
                      </span>
                    ) : (
                      <Button variant="secondary" size="sm">
                        Selecionar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
