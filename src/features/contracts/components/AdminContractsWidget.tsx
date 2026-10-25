import React, { useEffect, useState } from 'react';
import { Contract, ContractKPIs } from '../../../types/contracts';
import { contractService } from '../../../services/contractService';
import { formatCurrencyAOA, formatContractDate } from '../utils/contractFormatters';
import { ContractStatusBadge } from './ContractStatusBadge';
import { ContractTypeBadge } from './ContractTypeBadge';
import { FileText, ArrowUpRight, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AdminContractsWidgetProps {
  onNavigateToContracts?: () => void;
  onNavigateToContract?: (id: string) => void;
}

export const AdminContractsWidget: React.FC<AdminContractsWidgetProps> = ({
  onNavigateToContracts,
  onNavigateToContract,
}) => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [kpis, setKpis] = useState<ContractKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [list, kpiData] = await Promise.all([
          contractService.getContracts(),
          contractService.getKPIs(),
        ]);
        setContracts(list.slice(0, 5));
        setKpis(kpiData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-5 animate-pulse h-64" />
    );
  }

  return (
    <div className="bg-[#121620] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Contratos Comerciais</h3>
              <p className="text-[11px] text-slate-400">Gestão de hardware, SaaS e eventos</p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToContracts?.()}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Mini KPIs */}
        <div className="grid grid-cols-3 gap-2.5 mb-4">
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Ativos</span>
            <span className="text-sm font-bold text-emerald-400">{kpis?.activeCount || 0}</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Assinaturas</span>
            <span className="text-sm font-bold text-amber-400">{kpis?.pendingSignatureCount || 0}</span>
          </div>
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
            <span className="text-[10px] text-slate-400 block uppercase font-medium">Receita Ativa</span>
            <span className="text-xs font-bold text-cyan-300 font-mono">
              {formatCurrencyAOA(kpis?.totalActiveValueKz)}
            </span>
          </div>
        </div>

        {/* Recent Contracts List */}
        <div className="space-y-2">
          {contracts.map((con) => (
            <div
              key={con.id}
              onClick={() => onNavigateToContract?.(con.id) || onNavigateToContracts?.()}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/60 transition-colors text-xs cursor-pointer"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[11px] font-semibold text-cyan-400">
                    {con.contractNumber}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-white font-medium truncate">{con.organizationName}</span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">{con.title}</div>
              </div>
              <div className="text-right shrink-0">
                <ContractStatusBadge status={con.status} size="sm" showDot={false} />
                <span className="text-[10px] font-mono text-slate-400 block mt-1">
                  {formatCurrencyAOA(con.total)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
