import React, { useState } from 'react';
import { useContractDetail } from '../hooks/useContractDetail';
import { useAuth } from '../../../context/AuthContext';
import { ContractStatusBadge } from '../components/ContractStatusBadge';
import { ContractTypeBadge } from '../components/ContractTypeBadge';
import { ContractOverviewTab } from '../components/ContractOverviewTab';
import { ContractDocumentViewer } from '../components/ContractDocumentViewer';
import { ContractItemsTab } from '../components/ContractItemsTab';
import { ContractPartiesTab } from '../components/ContractPartiesTab';
import { ContractHistoryTab } from '../components/ContractHistoryTab';
import { ContractRelationshipsTab } from '../components/ContractRelationshipsTab';
import { formatCurrencyAOA, formatContractDate } from '../utils/contractFormatters';
import {
  ChevronLeft,
  FileText,
  Layers,
  Users,
  History,
  Link2,
  Send,
  CheckCircle2,
  PenTool,
  Sparkles,
  Copy,
  XCircle,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ContractDetailPageProps {
  contractId?: string;
  onBack?: () => void;
}

export const ContractDetailPage: React.FC<ContractDetailPageProps> = ({
  contractId,
  onBack,
}) => {
  const { isNexoraAdmin, can } = useAuth();

  const {
    contract,
    items,
    parties,
    events,
    template,
    document,
    loading,
    actionLoading,
    error,
    refresh,
    submitForApproval,
    approveContract,
    requestSignature,
    simulateSign,
    activateContract,
    cancelContract,
    generateDocument,
    duplicateContract,
  } = useContractDetail(contractId);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'document' | 'items' | 'parties' | 'history' | 'relationships'
  >('overview');

  const [cancelPromptOpen, setCancelPromptOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const handleBack = () => {
    if (onBack) {
      onBack();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 text-sm">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Carregando detalhes do contrato...
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-8 text-center max-w-lg mx-auto my-12">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Contrato Não Encontrado</h3>
        <p className="text-xs text-slate-400 mb-4">{error || 'O identificador informado não existe ou você não possui permissão para visualizá-lo.'}</p>
        <Button size="sm" onClick={handleBack} className="text-xs">
          Voltar para Lista de Contratos
        </Button>
      </div>
    );
  }

  const handleDuplicate = async () => {
    const copy = await duplicateContract();
    if (copy) {
      handleBack();
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) return;
    await cancelContract(cancelReason);
    setCancelPromptOpen(false);
    setCancelReason('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumbs & Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar aos Contratos
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">ID Interno: {contract.id}</span>
        </div>
      </div>

      {/* Contract Detail Header Card */}
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="font-mono text-base font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                {contract.contractNumber}
              </span>
              <ContractStatusBadge status={contract.status} />
              <ContractTypeBadge type={contract.contractType} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {contract.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-2">
              <span>
                Organização: <strong className="text-white">{contract.organizationName}</strong>
              </span>
              <span>•</span>
              <span>
                NIF: <strong className="text-slate-300">{contract.primaryClientNif || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Vigência: <strong className="text-slate-300">{formatContractDate(contract.startDate)} até {formatContractDate(contract.endDate)}</strong>
              </span>
              <span>•</span>
              <span>
                Total: <strong className="text-cyan-300 font-mono font-bold">{formatCurrencyAOA(contract.total)}</strong>
              </span>
            </div>
          </div>

          {/* Workflow Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* DRAFT -> SUBMIT */}
            {contract.status === 'DRAFT' && isNexoraAdmin && (
              <Button
                size="sm"
                onClick={submitForApproval}
                disabled={actionLoading}
                className="text-xs bg-purple-600 hover:bg-purple-500 text-white font-semibold"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Submeter p/ Aprovação
              </Button>
            )}

            {/* PENDING_APPROVAL -> APPROVE */}
            {contract.status === 'PENDING_APPROVAL' && isNexoraAdmin && (
              <Button
                size="sm"
                onClick={approveContract}
                disabled={actionLoading}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-semibold"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Aprovar Contrato
              </Button>
            )}

            {/* PENDING_SIGNATURE or PARTIALLY_SIGNED -> REQUEST SIGNATURE */}
            {(contract.status === 'PENDING_SIGNATURE' || contract.status === 'PARTIALLY_SIGNED') && isNexoraAdmin && (
              <Button
                size="sm"
                onClick={() => requestSignature()}
                disabled={actionLoading}
                className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                <PenTool className="w-3.5 h-3.5 mr-1.5" />
                Notificar Signatários
              </Button>
            )}

            {/* SIGNED -> ACTIVATE */}
            {contract.status === 'SIGNED' && isNexoraAdmin && (
              <Button
                size="sm"
                onClick={activateContract}
                disabled={actionLoading}
                className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Ativar Contrato
              </Button>
            )}

            {/* Duplicate */}
            {isNexoraAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                disabled={actionLoading}
                className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
              >
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Duplicar / Renovar
              </Button>
            )}

            {/* Cancel (if active or pending) */}
            {contract.status !== 'CANCELLED' && isNexoraAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancelPromptOpen(true)}
                disabled={actionLoading}
                className="text-xs text-red-400 border-red-500/30 hover:bg-red-500/10"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Prompt Dialog */}
      {cancelPromptOpen && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-red-300 uppercase">
            Confirmação de Rescisão / Cancelamento de Contrato
          </h4>
          <p className="text-xs text-red-200">
            Informe a justificativa comercial ou jurídica para o cancelamento deste contrato ({contract.contractNumber}):
          </p>
          <input
            type="text"
            placeholder="Ex: Rescisão amigável por encerramento de atividades..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full bg-slate-900 border border-red-500/40 rounded-lg p-2 text-xs text-white"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelPromptOpen(false)}
              className="text-xs"
            >
              Voltar
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmCancel}
              className="text-xs bg-red-600 hover:bg-red-500 text-white font-semibold"
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div className="border-b border-slate-800 flex items-center gap-1 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'overview', label: 'Visão Geral', icon: FileText },
          { id: 'document', label: 'Minuta & Documento', icon: FileCheck },
          { id: 'items', label: `Itens Contratuais (${items.length})`, icon: Layers },
          { id: 'parties', label: `Outorgantes (${parties.length})`, icon: Users },
          { id: 'history', label: `Histórico (${events.length})`, icon: History },
          { id: 'relationships', label: 'Vínculos & Ativos', icon: Link2 },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 py-3 px-4 border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'overview' && (
          <ContractOverviewTab
            contract={contract}
            parties={parties}
            template={template}
          />
        )}

        {activeTab === 'document' && (
          <ContractDocumentViewer
            contract={contract}
            document={document}
            parties={parties}
            onGenerateDocument={generateDocument}
            generating={actionLoading}
          />
        )}

        {activeTab === 'items' && <ContractItemsTab items={items} />}

        {activeTab === 'parties' && (
          <ContractPartiesTab
            parties={parties}
            onSimulateSign={simulateSign}
            actionLoading={actionLoading}
          />
        )}

        {activeTab === 'history' && <ContractHistoryTab events={events} />}

        {activeTab === 'relationships' && (
          <ContractRelationshipsTab
            contract={contract}
            items={items}
            template={template}
          />
        )}
      </div>
    </div>
  );
};
