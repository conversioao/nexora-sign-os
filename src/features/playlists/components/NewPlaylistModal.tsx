import React, { useState } from 'react';
import {
  X,
  ListVideo,
  Plus,
  Sparkles,
  Layers,
  Palette
} from 'lucide-react';
import { Playlist, PlaylistStatus, ContentOrientation } from '../../../types/domain';
import { Button } from '../../../components/ui/Button';

interface NewPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: Partial<Playlist>) => Promise<Playlist>;
}

const GRADIENT_PRESETS = [
  { id: 'blue-indigo', label: 'Azul Nexora', value: 'from-blue-900 via-indigo-950 to-slate-900' },
  { id: 'purple-fuchsia', label: 'Roxo Malls', value: 'from-purple-900 via-fuchsia-950 to-neutral-950' },
  { id: 'teal-sky', label: 'Turquesa Corporativo', value: 'from-teal-900 via-sky-950 to-slate-950' },
  { id: 'amber-orange', label: 'Âmbar Totem', value: 'from-amber-700 via-orange-900 to-stone-950' },
  { id: 'emerald-slate', label: 'Esmeralda Varejo', value: 'from-emerald-800 via-teal-950 to-slate-900' },
  { id: 'slate-zinc', label: 'Grafite Minimal', value: 'from-slate-800 via-slate-900 to-zinc-950' },
];

export const NewPlaylistModal: React.FC<NewPlaylistModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Geral']);
  const [orientation, setOrientation] = useState<ContentOrientation | 'MIXED'>('LANDSCAPE');
  const [status, setStatus] = useState<PlaylistStatus>('DRAFT');
  const [selectedGradient, setSelectedGradient] = useState(GRADIENT_PRESETS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Por favor, informe o nome da playlist.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate({
        name: name.trim(),
        description: description.trim(),
        tags,
        status,
        thumbnailGradient: selectedGradient,
        metadata: {
          orientation,
          aspectRatio: orientation === 'LANDSCAPE' ? '16:9' : orientation === 'PORTRAIT' ? '9:16' : 'Variado',
          resolution: orientation === 'LANDSCAPE' ? '1920x1080 (Full HD)' : '1080x1920 (Vertical)',
        },
      });
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setTags(['Geral']);
      setStatus('DRAFT');
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar a playlist.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070B14]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#2563EB]/10 text-[#38BDF8]">
              <ListVideo className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC] font-display">
                Criar Nova Playlist
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Configure uma nova sequência para veiculação nos displays.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[#64748B] hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto nexora-scrollbar">
          {error && (
            <div className="p-3 rounded-lg bg-[#F43F5E]/10 border border-[#F43F5E]/20 text-[#F43F5E] text-xs">
              {error}
            </div>
          )}

          {/* Name Field */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Nome da Playlist <span className="text-[#F43F5E]">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Promoções de Setembro — Talatona Mall"
              className="w-full h-10 px-3 bg-[#070B14] border border-white/10 rounded-lg text-sm text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
            />
          </div>

          {/* Description Field */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Descrição do Roteiro / Objetivo
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o público-alvo, horários ou locais de veiculação..."
              className="w-full p-3 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8] focus:ring-1 focus:ring-[#38BDF8]"
            />
          </div>

          {/* Orientation & Initial Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Orientação das Telas
              </label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value as any)}
                className="w-full h-10 px-3 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="LANDSCAPE" className="bg-[#0B1120]">Horizontal (16:9)</option>
                <option value="PORTRAIT" className="bg-[#0B1120]">Vertical (9:16 - Totens)</option>
                <option value="MIXED" className="bg-[#0B1120]">Misto / Flexível</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlaylistStatus)}
                className="w-full h-10 px-3 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] focus:outline-none focus:border-[#38BDF8]"
              >
                <option value="DRAFT" className="bg-[#0B1120]">Rascunho (Em edição)</option>
                <option value="ACTIVE" className="bg-[#0B1120]">Ativa (Disponível p/ Displays)</option>
                <option value="SCHEDULED" className="bg-[#0B1120]">Agendada</option>
              </select>
            </div>
          </div>

          {/* Color Preset Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Identidade Visual do Card</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {GRADIENT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedGradient(preset.value)}
                  className={`h-9 rounded-lg bg-gradient-to-r ${preset.value} border p-1 text-[10px] font-medium text-white/90 truncate flex items-center justify-center transition-transform active:scale-95 ${
                    selectedGradient === preset.value
                      ? 'border-white ring-2 ring-[#38BDF8]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">
              Tags / Etiquetas
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Adicionar tag e pressionar Enter..."
                className="flex-1 h-9 px-3 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-[#F8FAFC] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#2563EB]/15 text-[#38BDF8] border border-[#2563EB]/30"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
            >
              Criar e Abrir Construtor
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
