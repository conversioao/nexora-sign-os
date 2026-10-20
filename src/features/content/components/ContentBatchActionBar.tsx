import React from 'react';
import { Layers, Archive, Trash2, X, PlusCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ContentBatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAddToPlaylist: () => void;
  onArchiveSelected: () => void;
  onDeleteSelected: () => void;
}

export const ContentBatchActionBar: React.FC<ContentBatchActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onAddToPlaylist,
  onArchiveSelected,
  onDeleteSelected,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-3 bg-[#0F172A]/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl px-5 py-3 shadow-2xl shadow-black/80 ring-1 ring-blue-500/20">
        {/* Count indicator */}
        <div className="flex items-center gap-2 pr-3 border-r border-white/10 text-xs">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold font-mono flex items-center justify-center text-xs">
            {selectedCount}
          </span>
          <span className="font-medium text-white hidden sm:inline">
            {selectedCount === 1 ? 'conteúdo selecionado' : 'conteúdos selecionados'}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Adicionar à Playlist */}
          <Button
            variant="cyan"
            size="sm"
            onClick={onAddToPlaylist}
            className="flex items-center gap-1.5 text-xs shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Adicionar à Playlist</span>
          </Button>

          {/* Arquivar */}
          <Button
            variant="secondary"
            size="sm"
            onClick={onArchiveSelected}
            className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white"
          >
            <Archive className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Arquivar</span>
          </Button>

          {/* Excluir */}
          <Button
            variant="danger"
            size="sm"
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excluir</span>
          </Button>
        </div>

        {/* Clear selection */}
        <button
          type="button"
          onClick={onClearSelection}
          className="p-1.5 ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          title="Desmarcar todos"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
