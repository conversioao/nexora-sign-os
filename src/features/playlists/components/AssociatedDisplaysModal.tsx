import React, { useState, useEffect } from 'react';
import {
  X,
  Monitor,
  Search,
  Check,
  MapPin,
  Sparkles
} from 'lucide-react';
import { Playlist, Display } from '../../../types/domain';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

interface AssociatedDisplaysModalProps {
  isOpen: boolean;
  playlist: Playlist;
  onClose: () => void;
  onSave: (displayIds: string[]) => Promise<any>;
}

export const AssociatedDisplaysModal: React.FC<AssociatedDisplaysModalProps> = ({
  isOpen,
  playlist,
  onClose,
  onSave,
}) => {
  const initialIds = (playlist.associatedDisplays || []).map((d) => d.id);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialIds));
  const [search, setSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [displaysList, setDisplaysList] = useState<any[]>([]);

  // Load real displays from API
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/displays')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDisplaysList(data.map((d: any) => ({
            id: d.id,
            name: d.name,
            code: d.device_code || `NX-${d.id.substring(0, 5).toUpperCase()}`,
            status: d.status || 'OFFLINE',
            orientation: d.orientation || 'LANDSCAPE',
            location: {
              venueName: d.location || 'Luanda',
              municipality: 'Talatona',
            },
          })));
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleDisplay = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filteredDisplays = displaysList.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      (d.location.venueName || '').toLowerCase().includes(q) ||
      (d.location.municipality || '').toLowerCase().includes(q)
    );
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(Array.from(selectedIds));
      onClose();
    } catch (err) {
      console.error('Error associating displays:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070B14]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#EC4899]/10 text-[#EC4899]">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#F8FAFC] font-display">
                Displays Vinculados à Playlist
              </h2>
              <p className="text-xs text-[#94A3B8]">
                Selecione os displays físicos que reproduzirão "{playlist.name}".
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

        {/* Search */}
        <div className="p-4 border-b border-white/5 bg-[#0F172A]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por display, shopping ou município..."
              className="w-full h-9 pl-9 pr-3 bg-[#070B14] border border-white/10 rounded-lg text-xs text-[#F8FAFC] placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]"
            />
          </div>
        </div>

        {/* Displays list */}
        <div className="flex-1 p-4 overflow-y-auto nexora-scrollbar space-y-2">
          {filteredDisplays.map((display) => {
            const isSelected = selectedIds.has(display.id);

            return (
              <div
                key={display.id}
                onClick={() => toggleDisplay(display.id)}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-[#2563EB]/15 border-[#2563EB] shadow-sm'
                    : 'bg-[#0F172A] border-white/5 hover:border-white/15 hover:bg-[#131D31]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#2563EB] text-white'
                        : 'border border-white/20 bg-[#070B14]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#F8FAFC] truncate font-display">
                        {display.name}
                      </span>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        {display.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B]">
                      <MapPin className="w-3 h-3 text-[#94A3B8]" />
                      <span className="truncate">{display.location.venueName} — {display.location.municipality}</span>
                      <span>•</span>
                      <span className="text-[10px] uppercase font-mono">{display.orientation}</span>
                    </div>
                  </div>
                </div>

                <Badge
                  variant={display.status === 'ONLINE' ? 'success' : display.status === 'WARNING' ? 'warning' : 'neutral'}
                  size="sm"
                >
                  {display.status}
                </Badge>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#070B14] flex items-center justify-between">
          <div className="text-xs text-[#94A3B8]">
            <span className="font-semibold text-white font-mono">{selectedIds.size}</span> displays selecionados
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={handleSave}
              className="flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Salvar Vínculos ({selectedIds.size})</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
