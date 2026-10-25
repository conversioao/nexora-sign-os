import React, { useEffect, useState } from 'react';
import { Contract } from '../../../types/contracts';
import { contractService } from '../../../services/contractService';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrencyAOA, formatContractDate } from '../utils/contractFormatters';
import { ContractStatusBadge } from './ContractStatusBadge';
import { FileText, ArrowUpRight, ShieldCheck, Clock } from 'lucide-react';

interface ClientContractsWidgetProps {
  onNavigateToContracts?: () => void;
}

export const ClientContractsWidget: React.FC<ClientContractsWidgetProps> = ({
  onNavigateToContracts,
}) => {
  const { currentOrganization } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!currentOrganization?.id) return;
      try {
        const list = await contractService.getContracts({
          organizationId: currentOrganization.id,
        });
        setContracts(list);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentOrganization?.id]);

  if (loading) {
    return <div className="bg-[#121620] border border-slate-800 rounded-xl p-5 animate-pulse h-48" />;
  }

  const activeContract = contracts.find((c) => c.status === 'ACTIVE') || contracts[0];

  return (
    <div className="bg-[#121620] border border-slate-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Meu Contrato Comercial</h3>
            <p className="text-[11px] text-slate-400">Termos, vigência e SLA</p>
          </div>
        </div>
        <button
          onClick={() => onNavigateToContracts?.()}
          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium cursor-pointer"
        >
          Ver Detalhes <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {activeContract ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-cyan-400">
              {activeContract.contractNumber}
            </span>
            <ContractStatusBadge status={activeContract.status} size="sm" />
          </div>

          <h4 className="text-xs font-semibold text-white">
            {activeContract.title}
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Vigência</span>
              <span className="text-slate-200 font-medium">
                Até {formatContractDate(activeContract.endDate)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Valor Recorrente</span>
              <span className="text-cyan-300 font-bold font-mono">
                {formatCurrencyAOA(activeContract.total)}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 text-center py-4">
          Nenhum contrato ativo registrado para esta organização.
        </p>
      )}
    </div>
  );
};
