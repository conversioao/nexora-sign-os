import React, { useState } from 'react';
import { AdvertisingCampaign, CampaignBooking, CampaignCreative } from '../../../types/advertising';
import { deliveryService } from '../../../services/deliveryService';
import { useToast } from '../../../components/ui/Toast';
import {
  X,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Tv,
  Film,
  Calendar,
  Clock,
  Sparkles,
  Loader2,
  DollarSign,
  MapPin,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface PublishCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: AdvertisingCampaign;
  bookings: CampaignBooking[];
  creatives: CampaignCreative[];
  onPublishedSuccess: () => void;
}

type PublishStage = 'PRECHECK' | 'PUBLISHING' | 'SUCCESS';

export const PublishCampaignModal: React.FC<PublishCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  bookings,
  creatives,
  onPublishedSuccess,
}) => {
  const { addToast } = useToast();
  const [stage, setStage] = useState<PublishStage>('PRECHECK');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    'Validando conformidade de criativos e inventário...',
    'Gerando pacotes de distribuição e grade de horários...',
    'Enviando comando SYNC_SCHEDULE aos players via IPlayerGateway...',
    'Aguardando handshake e confirmação de telemetria...',
    'Veiculação confirmada e ativada em tempo real!',
  ];

  if (!isOpen) return null;

  const approvedCreatives = creatives.filter((c) => c.approvalStatus === 'APPROVED');
  const hasApprovedCreative = approvedCreatives.length > 0;
  const hasBookings = bookings.length > 0;

  const handleStartPublish = async () => {
    setStage('PUBLISHING');
    setCurrentStepIndex(0);

    for (let i = 0; i < steps.length - 1; i++) {
      await new Promise((res) => setTimeout(res, 600));
      setCurrentStepIndex(i + 1);
    }

    try {
      await deliveryService.publishCampaign(campaign.id);
      setStage('SUCCESS');
      addToast({
        title: 'Campanha Publicada!',
        description: `A campanha "${campaign.name}" agora está no ar em ${bookings.length} displays.`,
        type: 'success',
      });
      onPublishedSuccess();
    } catch (error) {
      addToast({
        title: 'Erro na publicação',
        description: 'Não foi possível sincronizar com os players.',
        type: 'error',
      });
      setStage('PRECHECK');
    }
  };

  const formatKz = (val: number) => {
    return (
      new Intl.NumberFormat('pt-AO', {
        style: 'decimal',
        maximumFractionDigits: 0,
      }).format(val) + ' Kz'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#0F172A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8]">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Publicar Campanha Agora</h3>
              <p className="text-xs text-slate-400">
                Transmissão direta e ativação nos Media Players em Angola
              </p>
            </div>
          </div>
          {stage !== 'PUBLISHING' && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {stage === 'PRECHECK' && (
            <>
              {/* Campaign summary card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#38BDF8]">
                      {campaign.advertiserName}
                    </span>
                    <h4 className="text-base font-black text-white mt-0.5">{campaign.name}</h4>
                  </div>
                  <Badge variant="scheduled" size="sm">
                    {campaign.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Período</span>
                    <span className="font-semibold text-slate-200">
                      {campaign.startDate} a {campaign.endDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Frequência</span>
                    <span className="font-semibold text-slate-200">
                      {campaign.dailyFrequency || 6}x / hora
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Displays</span>
                    <span className="font-semibold text-slate-200">{bookings.length} telas</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Orçamento</span>
                    <span className="font-semibold text-[#38BDF8]">{formatKz(campaign.budget)}</span>
                  </div>
                </div>
              </div>

              {/* Pre-flight Check list */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Checklist de Validação Pré-Publicação
                </h4>

                <div className="space-y-2 text-xs">
                  {/* Item 1: Criativos */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                    <div className="flex items-center gap-2.5">
                      <Film className="w-4 h-4 text-purple-400" />
                      <div>
                        <span className="text-white font-medium">
                          Criativos Homologados ({approvedCreatives.length}/{creatives.length})
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {hasApprovedCreative
                            ? 'Mídia validada para reprodução contínua.'
                            : 'Atenção: nenhum criativo aprovado ainda.'}
                        </p>
                      </div>
                    </div>
                    {hasApprovedCreative ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                  </div>

                  {/* Item 2: Inventário & Displays */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                    <div className="flex items-center gap-2.5">
                      <Tv className="w-4 h-4 text-[#38BDF8]" />
                      <div>
                        <span className="text-white font-medium">
                          Displays & Conectividade ({bookings.length} pontos)
                        </span>
                        <p className="text-[11px] text-slate-400">
                          {hasBookings
                            ? 'Todos os players selecionados estão sincronizáveis.'
                            : 'Nenhum display reservado.'}
                        </p>
                      </div>
                    </div>
                    {hasBookings ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  {/* Item 3: Hardware & Gateway */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/40">
                    <div className="flex items-center gap-2.5">
                      <Radio className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="text-white font-medium">
                          Gateway de Player (Nexora Realtime Bridge)
                        </span>
                        <p className="text-[11px] text-slate-400">
                          Comando SYNC_SCHEDULE pronto para disparo em lote.
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                </div>
              </div>

              {/* Displays summary list */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Displays Alvo para Transmissão:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-slate-200">{b.displayName || b.venueName}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">{b.municipality}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Publishing Step-by-Step Animation */}
          {stage === 'PUBLISHING' && (
            <div className="py-6 space-y-6 text-center">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">Sincronizando com a Rede de Displays</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Enviando pacotes de grade, criativos em alta definição e instruções de Proof-of-Play.
                </p>
              </div>

              <div className="max-w-md mx-auto space-y-3 text-left">
                {steps.map((s, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs transition-all duration-300 ${
                      idx < currentStepIndex
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                        : idx === currentStepIndex
                        ? 'border-[#0284C7]/50 bg-[#0284C7]/10 text-white font-bold'
                        : 'border-slate-800/40 bg-slate-900/20 text-slate-600'
                    }`}
                  >
                    {idx < currentStepIndex ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : idx === currentStepIndex ? (
                      <Loader2 className="w-4 h-4 text-[#38BDF8] animate-spin shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
                    )}
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Step */}
          {stage === 'SUCCESS' && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Campanha Publicada com Sucesso!</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  A campanha está transmitindo nos players de Luanda. O sistema de telemetria e Proof-of-Play está ativo e gravando os loops.
                </p>
              </div>
              <div className="pt-4 flex justify-center">
                <Button
                  variant="primary"
                  onClick={onClose}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                >
                  Concluir e Ver Métricas ao Vivo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {stage === 'PRECHECK' && (
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4 bg-slate-900/50">
            <Button variant="outline" size="sm" onClick={onClose} className="border-slate-700 text-xs">
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartPublish}
              disabled={!hasBookings}
              className="bg-gradient-to-r from-[#0284C7] to-emerald-600 hover:opacity-90 text-white font-bold text-xs"
            >
              <Rocket className="w-3.5 h-3.5 mr-1.5" />
              Confirmar e Publicar Agora
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
