import React from 'react';
import { Contract, ContractParty, ContractTemplate } from '../../../types/contracts';
import {
  formatCurrencyAOA,
  formatContractDate,
  getDaysUntilExpiry,
} from '../utils/contractFormatters';
import { ContractStatusBadge } from './ContractStatusBadge';
import { ContractTypeBadge } from './ContractTypeBadge';
import {
  Calendar,
  DollarSign,
  FileText,
  Clock,
  AlertTriangle,
  Building2,
  UserCheck,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';

interface ContractOverviewTabProps {
  contract: Contract;
  parties: ContractParty[];
  template: ContractTemplate | null;
}

export const ContractOverviewTab: React.FC<ContractOverviewTabProps> = ({
  contract,
  parties,
  template,
}) => {
  const expiryInfo = getDaysUntilExpiry(contract.endDate);
  const clientParty = parties.find((p) => p.partyType !== 'NEXORA') || parties[1];
  const nexoraParty = parties.find((p) => p.partyType === 'NEXORA') || parties[0];

  return (
    <div className="space-y-6">
      {/* Expiry Warning Banner if expiring soon */}
      {contract.status === 'ACTIVE' && expiryInfo.isNear && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3.5 text-amber-300">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm text-amber-200">
              Atenção: Contrato próximo da data de término ({expiryInfo.days} dias restantes)
            </h4>
            <p className="text-xs text-amber-300/80 mt-0.5">
              Este contrato expira em {formatContractDate(contract.endDate)}. Providencie o aditivo de renovação ou contato comercial.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Financial Cards + Validity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Financial Summary Card */}
        <div className="bg-[#121620] border border-slate-800 rounded-xl p-5 md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              Resumo Financeiro & Condições Fiscais
            </h3>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
              Moeda: AOA (Kwanzas)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-900/60 rounded-lg border border-slate-800/80 mb-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Subtotal Líquido</span>
              <span className="text-base font-bold text-white">
                {formatCurrencyAOA(contract.subtotal)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">Descontos</span>
              <span className="text-base font-bold text-slate-300">
                {formatCurrencyAOA(contract.discount)}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block mb-1">IVA (14% Angola)</span>
              <span className="text-base font-bold text-slate-300">
                {formatCurrencyAOA(contract.tax)}
              </span>
            </div>
            <div className="bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
              <span className="text-xs text-cyan-400 block mb-0.5 font-medium">Valor Total</span>
              <span className="text-lg font-bold text-cyan-300">
                {formatCurrencyAOA(contract.total)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-2 text-slate-300">
              <span className="text-slate-400">Condições de Pagamento:</span>
              <span className="font-medium text-white">{contract.paymentTerms || 'Mensal pré-pago'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Renovação Automática:</span>
              <span className="font-semibold text-white">
                {contract.autoRenew ? 'Habilitada (Anual)' : 'Desabilitada'}
              </span>
            </div>
          </div>
        </div>

        {/* Validity & Timeline */}
        <div className="bg-[#121620] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-blue-400" />
              Vigência Contratual
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-xs text-slate-400 block">Data de Início</span>
                <span className="text-sm font-medium text-white">
                  {formatContractDate(contract.startDate)}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Data de Término</span>
                <span className="text-sm font-medium text-white">
                  {formatContractDate(contract.endDate)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Status de Tempo:</span>
              {expiryInfo.isExpired ? (
                <span className="text-red-400 font-semibold">Expirado</span>
              ) : (
                <span className="text-emerald-400 font-semibold">
                  {expiryInfo.days} dias restantes
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Parties Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Outorgante Nexora */}
        <div className="bg-[#121620] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-3">
            <Building2 className="w-4 h-4" />
            Primeira Outorgante (Provedora)
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            {nexoraParty?.legalName || 'Nexora Digital Signage Technologies Lda.'}
          </h4>
          <div className="text-xs text-slate-400 space-y-1">
            <p>NIF: {nexoraParty?.nif || '5417892341'}</p>
            <p>Representante: {nexoraParty?.representativeName || 'Mário Silva'} ({nexoraParty?.representativeRole || 'Diretor Geral'})</p>
            <p>Email: {nexoraParty?.email || 'juridico@nexora.ao'}</p>
          </div>
        </div>

        {/* Outorgante Cliente */}
        <div className="bg-[#121620] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400 mb-3">
            <Building2 className="w-4 h-4" />
            Segunda Outorgante (Contratante)
          </div>
          <h4 className="text-base font-bold text-white mb-1">
            {clientParty?.legalName || contract.organizationName || 'Cliente Nexora'}
          </h4>
          <div className="text-xs text-slate-400 space-y-1">
            <p>NIF: {clientParty?.nif || contract.primaryClientNif || '5400000000'}</p>
            <p>Representante: {clientParty?.representativeName || 'Diretoria Geral'} ({clientParty?.representativeRole || 'Sócio-Gerente'})</p>
            <p>Email: {clientParty?.email || 'contacto@empresa.ao'}</p>
          </div>
        </div>
      </div>

      {/* Internal Notes & Metadata */}
      {contract.notes && (
        <div className="bg-[#121620] border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Observações Comerciais & Notas Internas
          </h3>
          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
            {contract.notes}
          </p>
        </div>
      )}
    </div>
  );
};
