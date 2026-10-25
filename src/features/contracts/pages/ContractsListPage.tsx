import React, { useState } from 'react';
import { useContracts } from '../hooks/useContracts';
import { useAuth } from '../../../context/AuthContext';
import { ContractStatus, ContractType } from '../../../types/contracts';
import { formatCurrencyAOA, formatContractDate, getDaysUntilExpiry } from '../utils/contractFormatters';
import { ContractStatusBadge } from '../components/ContractStatusBadge';
import { ContractTypeBadge } from '../components/ContractTypeBadge';
import { ContractCreationWizardModal } from '../components/ContractCreationWizardModal';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Layers,
  Clock,
  ShieldCheck,
  Building2,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ContractsListPageProps {
  onNavigateToDetail?: (id: string) => void;
  onNavigateToTemplates?: () => void;
  onNavigateToPlans?: () => void;
}

export const ContractsListPage: React.FC<ContractsListPageProps> = ({
  onNavigateToDetail,
  onNavigateToTemplates,
  onNavigateToPlans,
}) => {
  const { isNexoraAdmin, currentOrganization, user } = useAuth();
  const { contracts, kpis, loading, error, filters, updateFilters, resetFilters, refresh } =
    useContracts();

  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleContractClick = (id: string) => {
    if (onNavigateToDetail) {
      onNavigateToDetail(id);
    }
  };

  const handleContractCreated = (newId: string) => {
    setIsWizardOpen(false);
    refresh();
    handleContractClick(newId);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Módulo Comercial & Jurídico
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="w-7 h-7 text-cyan-400" />
            Contratos Comerciais
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            {isNexoraAdmin
              ? 'Gestão centralizada de vendas de hardware, aluguer de totens, licenciamento SaaS e eventos em Angola.'
              : `Contratos e termos comerciais da organização ${currentOrganization?.name || ''}.`}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isNexoraAdmin && onNavigateToTemplates && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToTemplates}
              className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <BookOpen className="w-4 h-4 mr-1.5 text-purple-400" />
              Modelos de Contrato
            </Button>
          )}

          {isNexoraAdmin && (
            <Button
              size="sm"
              onClick={() => setIsWizardOpen(true)}
              className="text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold shadow-lg shadow-cyan-500/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Novo Contrato
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#121620] border border-slate-800 rounded-xl p-4.5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase font-medium tracking-wide">
              Contratos Ativos
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {kpis?.activeCount ?? contracts.filter((c) => c.status === 'ACTIVE').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Vigentes e em operação
          </span>
        </div>

        <div className="bg-[#121620] border border-slate-800 rounded-xl p-4.5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase font-medium tracking-wide">
              Pendentes de Assinatura
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300">
            {kpis?.pendingSignatureCount ?? contracts.filter((c) => c.status === 'PENDING_SIGNATURE').length}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Aguardando firma digital dos signatários
          </span>
        </div>

        <div className="bg-[#121620] border border-slate-800 rounded-xl p-4.5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase font-medium tracking-wide">
              Receita Contratada Ativa
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-300 font-mono truncate">
            {formatCurrencyAOA(kpis?.totalActiveValueKz)}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Soma global em Kwanzas (AOA)
          </span>
        </div>

        <div className="bg-[#121620] border border-slate-800 rounded-xl p-4.5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-slate-400 uppercase font-medium tracking-wide">
              Próximos do Fim (30d)
            </span>
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-300">
            {kpis?.expiringSoonCount ?? 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Necessitam aditivo ou renovação
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por número, título, NIF..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Type Filter */}
          <select
            value={filters.contractType || 'ALL'}
            onChange={(e) => updateFilters({ contractType: e.target.value as any })}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todos os Tipos</option>
            <option value="DISPLAY_RENTAL_AND_SAAS">Aluguer + SaaS</option>
            <option value="DISPLAY_RENTAL">Aluguer de Hardware</option>
            <option value="DISPLAY_SALE">Venda de Hardware</option>
            <option value="SAAS_SUBSCRIPTION">Subscrição SaaS</option>
            <option value="EVENT_RENTAL">Aluguer para Evento</option>
            <option value="MAINTENANCE">Manutenção & SLA</option>
            <option value="SERVICE_AGREEMENT">Prestação de Serviços</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => updateFilters({ status: e.target.value as any })}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="PENDING_SIGNATURE">Pendente de Assinatura</option>
            <option value="PARTIALLY_SIGNED">Parcialmente Assinado</option>
            <option value="PENDING_APPROVAL">Em Aprovação</option>
            <option value="DRAFT">Rascunho</option>
            <option value="EXPIRED">Expirado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>

          {(filters.search || filters.contractType !== 'ALL' || filters.status !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="text-xs text-slate-400 border-slate-800 hover:text-white"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-[#121620] border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Carregando contratos comerciais...
          </div>
        ) : contracts.length === 0 ? (
          <div className="p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_25px_rgba(0,229,255,0.15)]">
              <FileText className="w-8 h-8 text-[#00E5FF]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {isNexoraAdmin ? 'Nenhum contrato encontrado' : 'Contrato em Aguardo de Subscrição'}
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-6">
              {isNexoraAdmin
                ? 'Não foram localizados registros com os critérios atuais ou ainda não existem contratos criados no sistema.'
                : 'A sua organização ainda não possui um contrato ativo. O seu contrato oficial de prestação de serviços e licenciamento da rede Nexora será gerado e assinado digitalmente de forma 100% automática logo após a subscrição e ativação do seu plano.'}
            </p>
            {isNexoraAdmin ? (
              <Button
                size="sm"
                onClick={() => setIsWizardOpen(true)}
                className="text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Criar Primeiro Contrato
              </Button>
            ) : (
              onNavigateToPlans && (
                <Button
                  size="sm"
                  onClick={onNavigateToPlans}
                  className="text-xs bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-[#00E5FF]/90 hover:to-blue-600/90 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Conhecer Planos & Gerar Contrato
                </Button>
              )
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Número / Título</th>
                  <th className="py-3.5 px-4">Contratante / NIF</th>
                  <th className="py-3.5 px-4">Modelo Comercial</th>
                  <th className="py-3.5 px-4">Vigência</th>
                  <th className="py-3.5 px-4 text-right">Valor Total (AOA)</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {contracts.map((contract) => {
                  const expiryInfo = getDaysUntilExpiry(contract.endDate);

                  return (
                    <tr
                      key={contract.id}
                      onClick={() => handleContractClick(contract.id)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    >
                      {/* Contract Number & Title */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-cyan-400 text-xs">
                          {contract.contractNumber}
                        </div>
                        <div className="text-slate-200 font-medium text-xs mt-0.5 truncate max-w-xs group-hover:text-white">
                          {contract.title}
                        </div>
                        {contract.templateName && (
                          <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                            {contract.templateName}
                          </div>
                        )}
                      </td>

                      {/* Organization & NIF */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white text-xs">
                          {contract.organizationName || 'Cliente Nexora'}
                        </div>
                        {contract.primaryClientNif && (
                          <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                            NIF: {contract.primaryClientNif}
                          </div>
                        )}
                      </td>

                      {/* Contract Type */}
                      <td className="py-3.5 px-4">
                        <ContractTypeBadge type={contract.contractType} size="sm" />
                      </td>

                      {/* Validity Dates */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 text-xs">
                          {formatContractDate(contract.startDate)} → {formatContractDate(contract.endDate)}
                        </div>
                        {contract.status === 'ACTIVE' && expiryInfo.isNear && (
                          <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> {expiryInfo.days} dias restantes
                          </span>
                        )}
                      </td>

                      {/* Value Total in AOA */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono font-bold text-slate-100 text-xs block">
                          {formatCurrencyAOA(contract.total)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {contract.paymentTerms || 'Mensal'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <ContractStatusBadge status={contract.status} size="sm" />
                      </td>

                      {/* Actions Link */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="text-cyan-400 text-xs font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Ver <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Creation Wizard Modal */}
      <ContractCreationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={handleContractCreated}
      />
    </div>
  );
};
