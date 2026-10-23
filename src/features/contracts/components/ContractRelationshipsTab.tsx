import React from 'react';
import { Contract, ContractItem, ContractTemplate } from '../../../types/contracts';
import { Building2, Tv, Cloud, FileText, ArrowUpRight, ExternalLink } from 'lucide-react';

interface ContractRelationshipsTabProps {
  contract: Contract;
  items: ContractItem[];
  template: ContractTemplate | null;
}

export const ContractRelationshipsTab: React.FC<ContractRelationshipsTabProps> = ({
  contract,
  items,
  template,
}) => {
  const displayItems = items.filter((i) => i.itemType === 'DISPLAY');
  const planItems = items.filter((i) => i.itemType === 'PLAN' || i.itemType === 'SUBSCRIPTION');
  const addonItems = items.filter((i) => i.itemType === 'ADDON');

  return (
    <div className="space-y-6">
      {/* Grid of Linked Entities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Linked Organization / Customer */}
        <div className="bg-[#121620] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-cyan-400">
              <Building2 className="w-4 h-4" />
              Organização / Cliente Contratante
            </div>
            <span className="text-xs text-slate-400">Tenant Registrado</span>
          </div>

          <h4 className="text-base font-bold text-white mb-1">
            {contract.organizationName || 'Cliente Nexora'}
          </h4>
          <div className="text-xs text-slate-400 space-y-1">
            <p>Tipo de Organização: <span className="text-slate-300 font-medium">{contract.organizationType || 'CLIENT'}</span></p>
            <p>ID do Tenant: <span className="font-mono text-slate-300">{contract.organizationId}</span></p>
            {contract.organizationCode && (
              <p>Código: <span className="font-mono text-slate-300">{contract.organizationCode}</span></p>
            )}
          </div>
        </div>

        {/* Linked Template */}
        <div className="bg-[#121620] border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-purple-400">
              <FileText className="w-4 h-4" />
              Template Jurídico de Origem
            </div>
          </div>

          {template ? (
            <div>
              <h4 className="text-base font-bold text-white mb-1">{template.name}</h4>
              <div className="text-xs text-slate-400 space-y-1">
                <p>Código: <span className="font-mono text-slate-300">{template.code}</span></p>
                <p>Versão: <span className="text-slate-300">{template.version}</span></p>
                <p>Cláusulas: <span className="text-slate-300">{template.sections?.length || 0} seções configuradas</span></p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              {contract.templateName || 'Contrato customizado sem template padronizado.'}
            </p>
          )}
        </div>
      </div>

      {/* Linked Displays */}
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            Displays & Totens Vinculados a este Contrato ({displayItems.length})
          </h3>
        </div>

        {displayItems.length === 0 ? (
          <p className="text-xs text-slate-400">
            Nenhum display específico vinculado individualmente nos itens deste contrato.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex items-start justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-white">{item.description}</div>
                  {item.referenceCode && (
                    <span className="text-[10px] font-mono text-cyan-400 block mt-0.5">
                      Código: {item.referenceCode}
                    </span>
                  )}
                  {item.metadata?.location && (
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Local: {item.metadata.location}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Linked SaaS Plan & Subscriptions */}
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-400" />
            Licenciamento SaaS & Módulos da Plataforma
          </h3>
        </div>

        <div className="space-y-3">
          {planItems.map((planItem) => (
            <div
              key={planItem.id}
              className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 mr-2">
                  Plano Base
                </span>
                <span className="text-xs font-semibold text-white">{planItem.description}</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {planItem.total.toLocaleString()} Kz
              </span>
            </div>
          ))}

          {addonItems.map((addon) => (
            <div
              key={addon.id}
              className="bg-slate-900/60 border border-slate-800 rounded-lg p-3.5 flex items-center justify-between"
            >
              <div>
                <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 mr-2">
                  Add-on
                </span>
                <span className="text-xs font-semibold text-white">{addon.description}</span>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-bold">
                {addon.total.toLocaleString()} Kz
              </span>
            </div>
          ))}

          {planItems.length === 0 && addonItems.length === 0 && (
            <p className="text-xs text-slate-400">
              Este contrato não inclui licenças SaaS recorrentes adicionais.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
