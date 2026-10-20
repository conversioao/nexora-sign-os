import React from 'react';
import { Building2, Calendar, ArrowRight, Sparkles, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Subscription } from '../../../types/saas';
import { formatKz, formatDate, formatInterval } from '../utils/saasFormatters';
import { CommercialModelBadge } from './CommercialModelBadge';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import { Button } from '../../../components/ui/Button';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onSelect: (sub: Subscription) => void;
  onManageStatus?: (sub: Subscription) => void;
}

export const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  onSelect,
  onManageStatus,
}) => {
  if (subscriptions.length === 0) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-12 text-center">
        <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-white">Nenhuma subscrição encontrada</h4>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          Não foram encontradas subscrições com os filtros selecionados. Altere os critérios de pesquisa.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/80 border-b border-slate-800 text-xs font-semibold uppercase text-slate-400 tracking-wider">
            <tr>
              <th className="px-5 py-3.5">Organização</th>
              <th className="px-4 py-3.5">Plano SaaS</th>
              <th className="px-4 py-3.5">Modelo Comercial</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Próxima Renovação</th>
              <th className="px-4 py-3.5">Valor Recorrente</th>
              <th className="px-5 py-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-normal">
            {subscriptions.map((sub) => {
              const activeAddOns = sub.addOns?.filter((a) => a.active) || [];
              const totalAddOnsValue = activeAddOns.reduce((sum, a) => sum + a.unitPrice * a.quantity, 0);
              const totalMonthlyKz = sub.price + totalAddOnsValue;

              return (
                <tr
                  key={sub.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelect(sub)}
                >
                  {/* Org */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700/60 flex items-center justify-center text-cyan-400 shrink-0 font-bold text-xs">
                        {sub.organizationName ? sub.organizationName.substring(0, 2).toUpperCase() : 'OR'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[200px]">
                          {sub.organizationName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          {sub.organizationCode || sub.organizationId}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-4">
                    <div className="font-medium text-white truncate max-w-[170px]">
                      {sub.planName}
                    </div>
                    <div className="text-[11px] font-mono text-cyan-400/90">
                      {sub.planCode}
                    </div>
                  </td>

                  {/* Commercial Model */}
                  <td className="px-4 py-4">
                    <CommercialModelBadge model={sub.commercialModel} size="sm" />
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <SubscriptionStatusBadge status={sub.status} size="sm" />
                  </td>

                  {/* Renewal Date */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatDate(sub.nextRenewalDate)}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Ciclo: {sub.billingInterval === 'MONTHLY' ? 'Mensal' : sub.billingInterval}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="px-4 py-4">
                    <div className="font-bold text-white text-xs">
                      {formatKz(totalMonthlyKz)}
                      <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                        {formatInterval(sub.billingInterval)}
                      </span>
                    </div>
                    {activeAddOns.length > 0 && (
                      <div className="text-[10px] text-violet-400 flex items-center gap-1 mt-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>+{activeAddOns.length} Add-on(s)</span>
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {onManageStatus && (
                        <button
                          onClick={() => onManageStatus(sub)}
                          className="px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                          title="Simular alteração de status"
                        >
                          Status
                        </button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelect(sub)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 p-1.5"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
