import React from 'react';
import { ContractItem, ContractItemType } from '../../../types/contracts';
import { formatCurrencyAOA } from '../utils/contractFormatters';
import {
  Tv,
  Cloud,
  Layers,
  Wrench,
  Calendar,
  Sparkles,
  Briefcase,
  HelpCircle,
} from 'lucide-react';

interface ContractItemsTabProps {
  items: ContractItem[];
}

export const ContractItemsTab: React.FC<ContractItemsTabProps> = ({ items }) => {
  const getItemIcon = (type: ContractItemType) => {
    const props = { className: 'w-4 h-4' };
    switch (type) {
      case 'DISPLAY':
        return <Tv {...props} className="text-cyan-400" />;
      case 'PLAN':
      case 'SUBSCRIPTION':
        return <Cloud {...props} className="text-blue-400" />;
      case 'ADDON':
        return <Sparkles {...props} className="text-purple-400" />;
      case 'MAINTENANCE':
        return <Wrench {...props} className="text-pink-400" />;
      case 'EVENT':
        return <Calendar {...props} className="text-amber-400" />;
      case 'SERVICE':
      case 'INSTALLATION':
        return <Briefcase {...props} className="text-emerald-400" />;
      default:
        return <HelpCircle {...props} className="text-slate-400" />;
    }
  };

  const getItemTypeBadge = (type: ContractItemType) => {
    switch (type) {
      case 'DISPLAY':
        return (
          <span className="text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
            Display / Totem
          </span>
        );
      case 'PLAN':
      case 'SUBSCRIPTION':
        return (
          <span className="text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
            Plano SaaS
          </span>
        );
      case 'ADDON':
        return (
          <span className="text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
            Add-on
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="text-[11px] font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded">
            Manutenção / SLA
          </span>
        );
      case 'EVENT':
        return (
          <span className="text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
            Evento
          </span>
        );
      case 'INSTALLATION':
      case 'SERVICE':
        return (
          <span className="text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
            Serviço
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2 py-0.5 rounded">
            Outro
          </span>
        );
    }
  };

  const totalCalculated = items.reduce((acc, item) => acc + item.total, 0);

  return (
    <div className="space-y-4">
      <div className="bg-[#121620] border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Itens Contratuais & Serviços Vinculados ({items.length})
          </h3>
          <span className="text-xs text-slate-400">
            Total Líquido dos Itens: <strong className="text-white">{formatCurrencyAOA(totalCalculated)}</strong>
          </span>
        </div>

        {items.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            Nenhum item contratual discriminado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Item / Tipo</th>
                  <th className="py-3 px-4">Descrição Detalhada</th>
                  <th className="py-3 px-4 text-center">Qtd.</th>
                  <th className="py-3 px-4 text-right">Preço Unitário</th>
                  <th className="py-3 px-4 text-right">Desconto</th>
                  <th className="py-3 px-4 text-right">Total (AOA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        {getItemIcon(item.itemType)}
                        {getItemTypeBadge(item.itemType)}
                      </div>
                      {item.referenceCode && (
                        <span className="text-[10px] font-mono text-slate-500 block mt-1">
                          Ref: {item.referenceCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-white text-xs">
                        {item.description}
                      </div>
                      {item.metadata && (
                        <div className="text-[11px] text-slate-400 mt-1 space-x-2">
                          {Object.entries(item.metadata).map(([k, v]) => (
                            <span key={k} className="inline-block bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                              {k}: {String(v)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-white">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {formatCurrencyAOA(item.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {item.discount > 0 ? formatCurrencyAOA(item.discount) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-cyan-300">
                      {formatCurrencyAOA(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
