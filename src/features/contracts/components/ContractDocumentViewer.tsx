import React from 'react';
import { Contract, ContractDocument, ContractParty } from '../../../types/contracts';
import { formatCurrencyAOA, formatContractDate } from '../utils/contractFormatters';
import { Printer, Download, Sparkles, CheckCircle2, ShieldCheck, FileCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ContractDocumentViewerProps {
  contract: Contract;
  document: ContractDocument | null;
  parties: ContractParty[];
  onGenerateDocument?: () => void;
  generating?: boolean;
}

export const ContractDocumentViewer: React.FC<ContractDocumentViewerProps> = ({
  contract,
  document,
  parties,
  onGenerateDocument,
  generating,
}) => {
  const handlePrint = () => {
    window.print();
  };

  if (!document) {
    return (
      <div className="bg-[#121620] border border-slate-800 rounded-xl p-8 text-center max-w-2xl mx-auto my-8">
        <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
          <FileCheck className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Nenhum Documento Gerado Ainda
        </h3>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Este contrato está cadastrado no sistema, mas a minuta formal do documento ainda não foi compilada a partir do template legal.
        </p>
        <Button
          onClick={onGenerateDocument}
          disabled={generating}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generating ? 'Compilando Minuta...' : 'Gerar Minuta do Documento'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-[#121620] border border-slate-800 rounded-xl p-3 px-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Versão do Documento: <span className="text-white font-medium">{document.version}</span>
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs text-slate-400">
            Gerado em: <span className="text-white font-medium">{formatContractDate(document.generatedAt, true)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onGenerateDocument && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGenerateDocument}
              disabled={generating}
              className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              {generating ? 'Regenerando...' : 'Regenerar Minuta'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* Styled Printable Legal Sheet */}
      <div className="bg-[#0f131c] border border-slate-700/80 rounded-xl p-8 sm:p-12 shadow-2xl text-slate-200 font-sans max-w-4xl mx-auto print:bg-white print:text-black print:p-0 print:border-none print:shadow-none">
        {/* Header Branding */}
        <div className="border-b border-slate-700 pb-6 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:border-black">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-lg tracking-wider">
                N
              </div>
              <span className="text-xl font-bold tracking-tight text-white print:text-black">
                NEXORA <span className="text-cyan-400 print:text-black">SIGNAGE</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Nexora Digital Signage Technologies Lda. • NIF: 5417892341
            </p>
            <p className="text-xs text-slate-400 print:text-slate-600">
              Edifício Sky One, 14º Andar, Av. Lenine, Luanda — Angola
            </p>
          </div>

          <div className="text-left sm:text-right bg-slate-800/40 p-3 rounded-lg border border-slate-700/60 print:border-black print:bg-slate-100">
            <span className="text-[10px] uppercase font-semibold text-cyan-400 print:text-black tracking-wider block">
              Número Oficial
            </span>
            <span className="text-base font-mono font-bold text-white print:text-black">
              {contract.contractNumber}
            </span>
            <div className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
              Ref. Jurídica: {document.headerMetadata?.templateCode || 'TPL-NEXORA-STD'}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h2 className="text-lg sm:text-xl font-bold tracking-wide text-white uppercase print:text-black underline underline-offset-8 decoration-cyan-500/50">
            {document.title || contract.title}
          </h2>
        </div>

        {/* Clauses List */}
        <div className="space-y-8 text-sm leading-relaxed text-slate-300 print:text-slate-900">
          {document.sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <h4 className="font-semibold text-white print:text-black text-sm uppercase tracking-wide border-l-2 border-cyan-500 pl-2.5 print:border-black">
                {section.title}
              </h4>
              <div className="whitespace-pre-line pl-3 text-slate-300 print:text-slate-800 font-normal leading-6">
                {section.content}
              </div>
            </div>
          ))}
        </div>

        {/* Signatures Grid */}
        <div className="mt-14 pt-8 border-t border-slate-700 print:border-black">
          <h4 className="text-xs font-semibold uppercase text-slate-400 print:text-black mb-8 text-center tracking-widest">
            Subscrição e Firmas dos Outorgantes
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {parties.map((party) => {
              const isSigned = party.signatureStatus === 'SIGNED';
              return (
                <div
                  key={party.id}
                  className="border border-slate-700/60 rounded-xl p-5 bg-slate-900/40 relative overflow-hidden print:border-black print:bg-transparent"
                >
                  {isSigned && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 print:border-black print:text-black">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Assinado Digitalmente
                    </div>
                  )}

                  <div className="text-xs text-slate-400 mb-1">
                    {party.partyType === 'NEXORA'
                      ? 'Pela Primeira Outorgante (NEXORA):'
                      : 'Pela Segunda Outorgante (CLIENTE):'}
                  </div>
                  <div className="font-bold text-white print:text-black text-sm mb-1">
                    {party.legalName}
                  </div>
                  <div className="text-xs text-slate-400 print:text-slate-600 mb-4">
                    NIF: {party.nif}
                  </div>

                  <div className="pt-6 border-t border-dashed border-slate-700 print:border-black mt-4">
                    <div className="text-xs font-semibold text-slate-200 print:text-black">
                      {party.representativeName}
                    </div>
                    <div className="text-[11px] text-slate-400 print:text-slate-600">
                      {party.representativeRole}
                    </div>
                    {isSigned && party.signedAt && (
                      <div className="text-[10px] font-mono text-emerald-400 print:text-slate-800 mt-2">
                        Carimbo de data/hora: {formatContractDate(party.signedAt, true)}
                        {party.signatureTrackingId && (
                          <div>ID Certificado: {party.signatureTrackingId}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legal Disclaimer Footer */}
        <div className="mt-12 pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center print:text-slate-600 print:border-black">
          Documento elaborado e registrado na plataforma Nexora Cloud Signage Angola sob as diretrizes do Código Comercial e Tributário vigente.
        </div>
      </div>
    </div>
  );
};
