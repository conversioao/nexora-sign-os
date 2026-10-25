import React, { useState } from 'react';
import { useContractTemplates } from '../hooks/useContractTemplates';
import { ContractTemplate } from '../../../types/contracts';
import { ContractTemplateModal } from '../components/ContractTemplateModal';
import { ContractTypeBadge } from '../components/ContractTypeBadge';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Archive,
  ChevronLeft,
  FileCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ContractTemplatesPageProps {
  onBack?: () => void;
}

export const ContractTemplatesPage: React.FC<ContractTemplatesPageProps> = ({ onBack }) => {
  const { templates, loading, createTemplate, updateTemplate, archiveTemplate, deleteTemplate } =
    useContractTemplates();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleOpenCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: ContractTemplate) => {
    setSelectedTemplate(t);
    setIsModalOpen(true);
  };

  const handleSave = async (data: Partial<ContractTemplate>) => {
    if (selectedTemplate) {
      await updateTemplate(selectedTemplate.id, data);
    } else {
      await createTemplate(data);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar para Contratos
        </button>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Biblioteca Jurídica Nexora
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-purple-400" />
            Modelos de Contrato
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Padronização de minutas jurídicas com suporte a cláusulas dinâmicas e interpolação de variáveis.
          </p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/20"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Novo Modelo
        </Button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Carregando modelos de contrato...
        </div>
      ) : templates.length === 0 ? (
        <div className="p-12 text-center bg-[#121620] border border-slate-800 rounded-xl">
          <FileCode className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white mb-1">Nenhum modelo cadastrado</h3>
          <p className="text-slate-400 text-xs mb-4">Crie templates para agilizar a elaboração de novos contratos.</p>
          <Button size="sm" onClick={handleOpenCreate} className="text-xs bg-purple-600">
            Cadastrar Primeiro Modelo
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className="bg-[#121620] border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    {tpl.code}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                      tpl.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : tpl.status === 'DRAFT'
                        ? 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        : 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                    }`}
                  >
                    {tpl.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-1">{tpl.name}</h3>
                <p className="text-xs text-slate-400 mb-3 line-clamp-2">{tpl.description}</p>

                <div className="mb-4">
                  <ContractTypeBadge type={tpl.contractType} size="sm" />
                </div>

                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80 space-y-1 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Versão:</span>
                    <span className="font-mono text-white">v{tpl.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cláusulas:</span>
                    <span className="font-semibold text-white">{tpl.sections.length} seções</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Variáveis:</span>
                    <span className="font-mono text-cyan-400">{tpl.variables?.length || 0} suportadas</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEdit(tpl)}
                  className="text-xs text-slate-300 hover:text-white"
                >
                  <Edit className="w-3.5 h-3.5 mr-1" />
                  Editar Minuta
                </Button>

                <div className="flex items-center gap-1">
                  {tpl.status !== 'ARCHIVED' && (
                    <button
                      onClick={() => archiveTemplate(tpl.id)}
                      className="p-1.5 text-slate-400 hover:text-orange-400 rounded hover:bg-slate-800"
                      title="Arquivar Modelo"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTemplate(tpl.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800"
                    title="Excluir Modelo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Modal */}
      <ContractTemplateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        template={selectedTemplate}
        onSave={handleSave}
      />
    </div>
  );
};
