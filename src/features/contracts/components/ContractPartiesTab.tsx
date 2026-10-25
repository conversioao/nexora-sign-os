import React from 'react';
import { ContractParty } from '../../../types/contracts';
import { SignatureStatusBadge } from './SignatureStatusBadge';
import { formatContractDate } from '../utils/contractFormatters';
import { Building2, User, Mail, Phone, MapPin, PenTool, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface ContractPartiesTabProps {
  parties: ContractParty[];
  onSimulateSign: (partyId: string) => void;
  actionLoading?: boolean;
}

export const ContractPartiesTab: React.FC<ContractPartiesTabProps> = ({
  parties,
  onSimulateSign,
  actionLoading,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {parties.map((party) => {
          const isSigned = party.signatureStatus === 'SIGNED';
          const isNexora = party.partyType === 'NEXORA';

          return (
            <div
              key={party.id}
              className={`bg-[#121620] border rounded-xl p-5 flex flex-col justify-between relative overflow-hidden transition-all ${
                isSigned ? 'border-emerald-500/30' : 'border-slate-800'
              }`}
            >
              {/* Header Badge & Party Type */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      isNexora
                        ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {isNexora ? '1ª Outorgante (Provedora)' : '2ª Outorgante (Contratante)'}
                  </span>
                  <SignatureStatusBadge status={party.signatureStatus} size="sm" />
                </div>

                <h4 className="text-base font-bold text-white mb-1">
                  {party.legalName}
                </h4>
                {party.tradeName && party.tradeName !== party.legalName && (
                  <p className="text-xs text-slate-400 mb-3">
                    Nome Comercial: <span className="text-slate-300">{party.tradeName}</span>
                  </p>
                )}

                {/* Company Details */}
                <div className="space-y-2 text-xs text-slate-300 mb-4 bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-semibold w-16">NIF:</span>
                    <span className="font-mono text-white font-medium">{party.nif}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{party.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{party.phone}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <span className="text-slate-400">{party.address}</span>
                  </div>
                </div>

                {/* Legal Representative Details */}
                <div className="pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Representante Legal Autorizado:</span>
                  </div>
                  <div className="font-semibold text-white text-xs pl-5.5">
                    {party.representativeName}
                  </div>
                  <div className="text-[11px] text-slate-400 pl-5.5">
                    {party.representativeRole}
                  </div>
                </div>
              </div>

              {/* Signature Status & Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {isSigned ? (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Assinado em {formatContractDate(party.signedAt, true)}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-amber-400 flex items-center gap-1.5">
                    <span>Aguardando assinatura</span>
                  </div>
                )}

                {!isSigned && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSimulateSign(party.id)}
                    disabled={actionLoading}
                    className="text-xs bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20"
                  >
                    <PenTool className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
                    Simular Assinatura
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
