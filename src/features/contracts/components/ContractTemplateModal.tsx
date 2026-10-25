import React, { useState } from 'react';
import { ContractTemplate, ContractType } from '../../../types/contracts';
import { X, Plus, Trash2, Save, FileText } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ContractTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template?: ContractTemplate | null;
  onSave: (data: Partial<ContractTemplate>) => Promise<void>;
}

export const ContractTemplateModal: React.FC<ContractTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onSave,
}) => {
  const isEditing = !!template;

  const [code, setCode] = useState(template?.code || 'TPL-CUSTOM-01');
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [contractType, setContractType] = useState<ContractType>(
    template?.contractType || 'DISPLAY_RENTAL_AND_SAAS'
  );
  const [version, setVersion] = useState(template?.version || '1.0');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>(
    template?.status || 'ACTIVE'
  );

  const [sections, setSections] = useState(
    template?.sections || [
      {
        id: 'sec-1',
        title: 'Cláusula 1ª — Das Partes Contratantes',
        order: 1,
        content:
          'Pelo presente instrumento particular, de um lado NEXORA DIGITAL SIGNAGE LDA. e de outro lado {{trade_name}} (NIF {{nif}})...',
      },
      {
        id: 'sec-2',
        title: 'Cláusula 2ª — Do Objeto e Preço',
        order: 2,
        content:
          'O presente contrato tem por objeto o fornecimento tecnológico no valor global de {{total_amount}}...',
      },
    ]
  );

  const [loading, setLoading] = useState(false);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: `sec-${Date.now()}`,
        title: `Cláusula ${prev.length + 1}ª — Nova Cláusula`,
        order: prev.length + 1,
        content: 'Texto e termos da cláusula jurídica...',
      },
    ]);
  };

  const removeSection = (idx: number) => {
    setSections((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSection = (idx: number, field: 'title' | 'content', val: string) => {
    setSections((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await onSave({
        code,
        name,
        description,
        contractType,
        version,
        status,
        sections,
        variables: [
          'company_name',
          'trade_name',
          'nif',
          'address',
          'representative_name',
          'representative_role',
          'start_date',
          'end_date',
          'total_amount',
        ],
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#0f131c] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
        <div className="p-5 px-6 border-b border-slate-800 flex items-center justify-between bg-[#121620]">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 block mb-0.5">
              Configuração de Modelo Legal
            </span>
            <h2 className="text-lg font-bold text-white">
              {isEditing ? 'Editar Modelo de Contrato' : 'Novo Modelo de Contrato'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Código Identificador</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Nome do Modelo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Aluguer de Hardware & SaaS"
                className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipo de Contrato</label>
              <select
                value={contractType}
                onChange={(e) => setContractType(e.target.value as ContractType)}
                className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="DISPLAY_RENTAL_AND_SAAS">Aluguer + SaaS</option>
                <option value="DISPLAY_RENTAL">Aluguer de Hardware</option>
                <option value="DISPLAY_SALE">Venda de Hardware</option>
                <option value="SAAS_SUBSCRIPTION">Subscrição SaaS</option>
                <option value="EVENT_RENTAL">Aluguer para Eventos</option>
                <option value="MAINTENANCE">Manutenção & SLA</option>
                <option value="SERVICE_AGREEMENT">Prestação de Serviços</option>
                <option value="CUSTOM">Customizado</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Versão</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="ACTIVE">Ativo (Pronto para Uso)</option>
                <option value="DRAFT">Rascunho (Em Elaboração)</option>
                <option value="ARCHIVED">Arquivado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Descrição / Finalidade</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#121620] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            />
          </div>

          {/* Sections / Clauses list */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
                Cláusulas Contratuais ({sections.length})
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addSection}
                className="text-xs"
              >
                <Plus className="w-3 h-3 mr-1" /> + Nova Cláusula
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id || idx}
                  className="bg-[#121620] border border-slate-800 rounded-xl p-3.5 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={sec.title}
                      onChange={(e) => updateSection(idx, 'title', e.target.value)}
                      className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-xs text-white font-semibold flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeSection(idx)}
                      className="text-red-400 hover:text-red-300 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={sec.content}
                    onChange={(e) => updateSection(idx, 'content', e.target.value)}
                    className="w-full bg-slate-900/60 border border-slate-800 rounded p-2 text-xs text-slate-200"
                    placeholder="Suporta interpolação de variáveis: {{company_name}}, {{nif}}, {{total_amount}}..."
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 px-6 border-t border-slate-800 bg-[#121620] flex items-center justify-end gap-3 -mx-6 -mb-6 mt-6">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading}
              className="text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {loading ? 'Salvando...' : 'Salvar Modelo'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
