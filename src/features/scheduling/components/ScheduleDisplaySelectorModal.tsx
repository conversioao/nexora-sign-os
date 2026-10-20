import React, { useState, useEffect } from 'react';
import { Search, Monitor, MapPin, Check, CheckSquare, Square, Filter } from 'lucide-react';
import { Display } from '../../../types/domain';
import { NexoraService } from '../../../services';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

export interface ScheduleDisplaySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDisplayIds: string[];
  onSaveSelection: (displayIds: string[]) => void;
}

export const ScheduleDisplaySelectorModal: React.FC<ScheduleDisplaySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedDisplayIds,
  onSaveSelection,
}) => {
  const [displays, setDisplays] = useState<Display[]>([]);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMunicipality, setSelectedMunicipality] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTempSelectedIds([...selectedDisplayIds]);
      setLoading(true);
      NexoraService.displays
        .getAll()
        .then((data) => setDisplays(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, selectedDisplayIds]);

  const municipalities = Array.from(
    new Set(displays.map((d) => d.location?.municipality).filter(Boolean))
  ) as string[];

  const filteredDisplays = displays.filter((d) => {
    const venue = d.location?.venueName || '';
    const mun = d.location?.municipality || '';
    const matchesSearch =
      !search.trim() ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      venue.toLowerCase().includes(search.toLowerCase()) ||
      mun.toLowerCase().includes(search.toLowerCase());

    const matchesMunicipality =
      selectedMunicipality === 'ALL' || mun === selectedMunicipality;

    return matchesSearch && matchesMunicipality;
  });

  const toggleDisplay = (id: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = filteredDisplays.map((d) => d.id);
    const combined = Array.from(new Set([...tempSelectedIds, ...ids]));
    setTempSelectedIds(combined);
  };

  const clearAllFiltered = () => {
    const idsToClear = new Set(filteredDisplays.map((d) => d.id));
    setTempSelectedIds((prev) => prev.filter((id) => !idsToClear.has(id)));
  };

  const handleSave = () => {
    onSaveSelection(tempSelectedIds);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Selecionar Displays para Programação"
      description="Escolha quais telas exibirão esta grade de conteúdos."
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">
            <strong className="text-blue-400 font-bold">{tempSelectedIds.length}</strong> de{' '}
            {displays.length} telas selecionadas
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Confirmar Seleção ({tempSelectedIds.length})
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Search & Location Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, shopping, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="sm:w-48">
            <select
              value={selectedMunicipality}
              onChange={(e) => setSelectedMunicipality(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F172A] border border-[#1E293B] rounded-lg text-sm text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">Município: Todos</option>
              {municipalities.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="hover:text-blue-400 underline cursor-pointer"
            >
              Selecionar visíveis ({filteredDisplays.length})
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={clearAllFiltered}
              className="hover:text-rose-400 underline cursor-pointer"
            >
              Desmarcar visíveis
            </button>
          </div>

          <span>Exibindo {filteredDisplays.length} telas</span>
        </div>

        {/* Displays Grid */}
        <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <div className="py-8 text-center text-sm text-slate-400">Carregando displays...</div>
          ) : filteredDisplays.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              Nenhum display encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredDisplays.map((display) => {
                const isSelected = tempSelectedIds.includes(display.id);

                return (
                  <div
                    key={display.id}
                    onClick={() => toggleDisplay(display.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-950/30 border-blue-500 shadow-sm'
                        : 'bg-[#0B132B] border-[#1E293B] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div
                        className={`p-2 rounded-lg ${
                          isSelected
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-400'
                        } shrink-0`}
                      >
                        <Monitor className="w-4 h-4" />
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-semibold text-white truncate">
                            {display.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                          <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span className="truncate">
                            {display.location?.venueName || 'Local não informado'} • {display.location?.municipality || 'Luanda'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Checkbox indicator */}
                    <div className="shrink-0 pl-1">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-white">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border border-slate-600 bg-[#0F172A]" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
