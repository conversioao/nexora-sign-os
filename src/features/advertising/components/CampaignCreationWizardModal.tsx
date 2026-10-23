import React, { useState, useEffect } from 'react';
import {
  AdvertisingOpportunity,
  AdvertisingCampaign,
  PricingCalculationResult,
  CampaignObjective,
} from '../../../types/advertising';
import { ContentItem } from '../../../types/domain';
import { mockContentItems } from '../../../data/mockContentData';
import { mockAdvertiserProfiles } from '../../../data/mockCrmData';
import { advertisingPricingService } from '../../../services/advertisingPricingService';
import { advertisingBookingService } from '../../../services/advertisingBookingService';
import { useToast } from '../../../components/ui/Toast';
import {
  X,
  Sparkles,
  Megaphone,
  Tv,
  Film,
  CheckCircle2,
  Calendar,
  Layers,
  MapPin,
  Users,
  Eye,
  DollarSign,
  Clock,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useSession } from '../../../context/SessionContext';
import { NEXORA_BANKING } from '../../../config/nexoraBanking';

export interface CampaignCreationWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOpportunities?: AdvertisingOpportunity[];
  initialSpotDuration?: number;
  onCampaignCreated: (campaign: AdvertisingCampaign) => void;
  availableOpportunities: AdvertisingOpportunity[];
}

export const CampaignCreationWizardModal: React.FC<CampaignCreationWizardModalProps> = ({
  isOpen,
  onClose,
  initialOpportunities = [],
  initialSpotDuration = 15,
  onCampaignCreated,
  availableOpportunities,
}) => {
  const { addToast } = useToast();
  const { currentOrganization } = useSession();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'TRANSFER' | 'MULTICAIXA' | 'IBAN'>('MULTICAIXA');

  // Form State - Step 1: General Info & Live Price Simulator
  const [campaignName, setCampaignName] = useState('');
  const [advertiserId, setAdvertiserId] = useState(mockAdvertiserProfiles[0]?.id || 'adv-001');
  const [objective, setObjective] = useState<CampaignObjective>('PRODUCT_LAUNCH');
  const [startMode, setStartMode] = useState<'NOW'>('NOW');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  // Default to minimum 7 days
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [mediaFormat, setMediaFormat] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [dailyFrequency, setDailyFrequency] = useState(6);
  const [spotDuration, setSpotDuration] = useState<number>(initialSpotDuration || 15);
  const [campaignDescription, setCampaignDescription] = useState('');
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState<string>('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  useEffect(() => {
    if (initialSpotDuration) {
      setSpotDuration(initialSpotDuration);
    }
  }, [initialSpotDuration]);

  // Form State - Step 2: Selected Opportunities
  const [selectedOpps, setSelectedOpps] = useState<AdvertisingOpportunity[]>(initialOpportunities);

  // Form State - Step 3: Selected Creatives
  const [availableCreatives, setAvailableCreatives] = useState<ContentItem[]>(mockContentItems);
  const [selectedCreativeIds, setSelectedCreativeIds] = useState<string[]>([]);

  useEffect(() => {
    // Fetch real content items from database filtered by active organization
    const fetchCreatives = async () => {
      try {
        const fetchUrl = currentOrganization?.id && currentOrganization.id !== 'org-nexora'
          ? `/api/content?organizationId=${encodeURIComponent(currentOrganization.id)}`
          : '/api/content';
        const res = await fetch(fetchUrl);
        if (res.ok) {
          const items: any[] = await res.json();
          if (items && Array.isArray(items)) {
            let filteredItems = items;
            if (currentOrganization?.id && currentOrganization.id !== 'org-nexora') {
              filteredItems = items.filter((it: any) => it.organization_id === currentOrganization.id || !it.organization_id);
            }
            const mapped = filteredItems.map((it) => ({
              id: it.id,
              name: it.title || it.name || 'Mídia Cadastrada',
              code: `MED-${it.id}`,
              type: (it.type || 'IMAGE').toUpperCase(),
              duration: it.duration || 15,
              resolution: it.resolution || '1920x1080',
              fileUrl: it.url || it.file_url || '',
              url: it.url || it.file_url || '',
              fileSize: it.file_size || 1024 * 1024,
              mimeType: it.type === 'VIDEO' ? 'video/mp4' : 'image/jpeg',
              width: 1920,
              height: 1080,
              description: it.description || 'Mídia da biblioteca do anunciante',
              status: 'READY' as const,
              createdAt: it.created_at || new Date().toISOString(),
              updatedAt: it.updated_at || new Date().toISOString(),
              createdBy: it.created_by || 'anunciante',
              organizationId: it.organization_id || currentOrganization?.id || 'org-publicidade',
              tags: it.tags || [],
            })) as unknown as ContentItem[];
            setAvailableCreatives(mapped);
          }
        }
      } catch (err) {
        console.warn('Erro ao buscar mídias cadastradas da API:', err);
      }
    };
    fetchCreatives();
  }, [currentOrganization]);

  useEffect(() => {
    if (initialOpportunities.length > 0) {
      setSelectedOpps(initialOpportunities);
    }
  }, [initialOpportunities]);

  if (!isOpen) return null;

  const selectedAdvertiser = mockAdvertiserProfiles.find((a) => a.id === advertiserId) || mockAdvertiserProfiles[0];

  // Calculate days difference with 7-day minimum enforcement
  const sDate = new Date(startDate);
  const eDate = new Date(endDate);
  const diffTime = Math.max(0, eDate.getTime() - sDate.getTime());
  const calculatedDays = Math.max(7, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Live Multi-Screen Quote with Spot Duration & 13h Operating Day Math
  const campaignQuote = advertisingPricingService.calculateCampaignQuote(
    selectedOpps.length > 0 ? selectedOpps : availableOpportunities.slice(0, 1),
    startDate,
    endDate,
    spotDuration,
    mediaFormat,
    120 // average existing playlist duration in seconds
  );

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(val) + ' Kz';
  };

  const handleToggleOpportunity = (opp: AdvertisingOpportunity) => {
    if (selectedOpps.some((o) => o.id === opp.id)) {
      setSelectedOpps(selectedOpps.filter((o) => o.id !== opp.id));
    } else {
      setSelectedOpps([...selectedOpps, opp]);
    }
  };

  const handleToggleCreative = (contentId: string) => {
    if (selectedCreativeIds.includes(contentId)) {
      setSelectedCreativeIds([]);
    } else {
      setSelectedCreativeIds([contentId]);
      addToast({
        title: 'Mídia selecionada',
        description: 'Cada campanha no Marketplace inclui exatamente 1 mídia.',
        type: 'info',
      });
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!campaignName.trim()) {
        addToast({
          title: 'Nome obrigatório',
          description: 'Por favor, insira o nome da campanha.',
          type: 'warning',
        });
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (selectedOpps.length === 0) {
        addToast({
          title: 'Nenhum display selecionado',
          description: 'Selecione pelo menos 1 ponto de mídia para veicular a campanha.',
          type: 'warning',
        });
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      setCurrentStep(5);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as any);
    }
  };

  const handleFinishAndSubmit = async (asDraft: boolean = false) => {
    try {
      setIsSubmitting(true);

      const selectedCreativesData = availableCreatives
        .filter((c) => selectedCreativeIds.includes(c.id))
        .map((c) => ({
          contentId: c.id,
          contentTitle: c.name,
          type: c.type as 'VIDEO' | 'IMAGE',
          duration: spotDuration || c.duration || 15,
          fileUrl: (c as any).fileUrl || (c as any).url || '',
        }));

      const result = await advertisingBookingService.createCampaignWithBookings({
        campaign: {
          name: campaignName,
          organizationId: currentOrganization?.id || 'org-publicidade',
          advertiserId: selectedAdvertiser.id,
          advertiserName: selectedAdvertiser.tradeName || selectedAdvertiser.legalName,
          objective,
          description: campaignDescription,
          startDate,
          endDate,
          dailyFrequency: campaignQuote.hourlyFrequency,
          slotDurationSeconds: spotDuration || 15,
          status: asDraft ? 'DRAFT' : 'PENDING_REVIEW',
          paymentReceiptUrl: paymentReceiptUrl || undefined,
        },
        selectedOpportunityIds: selectedOpps.map((o) => o.id),
        creatives: selectedCreativesData,
      });

      addToast({
        title: asDraft ? 'Rascunho salvo!' : 'Campanha Submetida para Aprovação!',
        description: asDraft
          ? `A campanha ${result.campaign.name} foi salva como rascunho.`
          : `A campanha ${result.campaign.name} foi submetida com o comprovativo de pagamento. Aguarde a validação do administrador para o início da veiculação.`,
        type: 'success',
      });

      onCampaignCreated(result.campaign);
      onClose();
    } catch (error: any) {
      addToast({
        title: 'Erro ao criar campanha',
        description: error?.message || 'Ocorreu um erro ao processar a campanha.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="campaign-wizard-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div
        id="campaign-wizard-modal-container"
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-700 bg-[#0F172A] text-slate-100 shadow-2xl overflow-hidden"
      >
        {/* Header with Step Indicator */}
        <div className="flex flex-col border-b border-slate-800 bg-slate-900/80 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0284C7]/20 text-[#38BDF8] border border-[#0284C7]/30">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Criador de Campanha Publicitária</h2>
                <p className="text-xs text-slate-400">
                  Planeamento de veiculação e alocação de rede em Luanda
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stepper Progress Bar */}
          <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
            {[
              { num: 1, label: 'Geral' },
              { num: 2, label: 'Displays' },
              { num: 3, label: 'Mídias' },
              { num: 4, label: 'Revisão' },
              { num: 5, label: 'Pagamento' },
            ].map((step) => (
              <div
                key={step.num}
                className={`flex items-center gap-2 pb-2 border-b-2 transition-all ${
                  currentStep === step.num
                    ? 'border-[#0284C7] text-white font-semibold'
                    : currentStep > step.num
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-slate-800 text-slate-500'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                    currentStep === step.num
                      ? 'bg-[#0284C7] text-white'
                      : currentStep > step.num
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {currentStep > step.num ? '✓' : step.num}
                </div>
                <span className="hidden sm:inline text-xs">{step.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* STEP 1: General Info & Live Simulator */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Nome da Campanha <span className="text-[#F43F5E]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Campanha Unitel 5G Mais Perto de Si — Q3"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-[#0284C7] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Anunciante / Empresa Contratante <span className="text-[#F43F5E]">*</span>
                  </label>
                  <select
                    value={advertiserId}
                    onChange={(e) => setAdvertiserId(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-[#0284C7] focus:outline-none"
                  >
                    {mockAdvertiserProfiles.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.tradeName || adv.legalName} ({adv.industry})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Objetivo Principal
                  </label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value as CampaignObjective)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-[#0284C7] focus:outline-none"
                  >
                    <option value="PRODUCT_LAUNCH">Lançamento de Produto</option>
                    <option value="BRAND_AWARENESS">Notoriedade de Marca (Branding)</option>
                    <option value="PROMOTION">Promoção & Vendas Sazonais</option>
                    <option value="LEAD_GENERATION">Geração de Leads & Cadastros</option>
                    <option value="EVENT">Divulgação de Evento</option>
                    <option value="RECRUITMENT">Recrutamento Institucional</option>
                  </select>
                </div>

                {/* Immediate Publication Banner (Agendamento Futuro Removido) */}
                <div className="md:col-span-2 p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                      ⚡
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Publicação Imediata do Anúncio</div>
                      <div className="text-[11px] text-slate-400">
                        O anúncio começará a veicular na playlist assim que o pagamento for confirmado pelo administrador.
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/30">
                    Início Imediato
                  </span>
                </div>

                {/* Live Pricing Simulator Widget (Min 7 Days, Spot Duration 10/15/30s & Media Format) */}
                <div className="md:col-span-2 rounded-xl bg-slate-950 p-4 border border-cyan-500/30 space-y-4 shadow-lg">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Simulador em Tempo Real (Painel do Anunciante)
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                      {calculatedDays} dias contratados
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Duração do Spot (10s, 15s, 30s) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        ⏱️ Tempo de Exibição (Spot)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[10, 15, 30].map((sec) => (
                          <button
                            key={sec}
                            type="button"
                            onClick={() => setSpotDuration(sec)}
                            className={`py-2 px-1 rounded-lg border text-center font-mono font-bold text-xs transition-all ${
                              spotDuration === sec
                                ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400'
                                : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                            }`}
                          >
                            {sec}s
                            <div className="text-[9px] font-sans font-normal opacity-75">
                              {sec === 10 ? 'Econômico' : sec === 15 ? 'Padrão' : 'Premium'}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Formato do Anúncio (Imagem vs Vídeo) */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        🎞️ Formato do Conteúdo
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setMediaFormat('IMAGE')}
                          className={`py-2 px-2 rounded-lg border text-left transition-all ${
                            mediaFormat === 'IMAGE'
                              ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold ring-1 ring-cyan-400'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">🖼️ Imagem</div>
                          <div className="text-[9px] text-slate-400">Tarifa Base</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setMediaFormat('VIDEO')}
                          className={`py-2 px-2 rounded-lg border text-left transition-all ${
                            mediaFormat === 'VIDEO'
                              ? 'border-cyan-400 bg-cyan-500/20 text-white font-bold ring-1 ring-cyan-400'
                              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="text-xs font-bold">🎬 Vídeo HD</div>
                          <div className="text-[9px] text-cyan-300">+25% Dinâmico</div>
                        </button>
                      </div>
                    </div>

                    {/* Dias Contratados Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-semibold">Período de Veiculação:</span>
                        <span className="text-cyan-400 font-bold font-mono">{calculatedDays} Dias</span>
                      </div>
                      <input
                        type="range"
                        min={7}
                        max={90}
                        value={calculatedDays}
                        onChange={(e) => {
                          const numDays = Math.max(7, Number(e.target.value));
                          const s = new Date(startDate);
                          const newEnd = new Date(s.getTime() + numDays * 86400000);
                          setEndDate(newEnd.toISOString().split('T')[0]);
                        }}
                        className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer mt-2"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500">
                        <span>7d (Min)</span>
                        <span>15d (-5%)</span>
                        <span>30d (-15%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Real-time Math Outputs (13h Daily Operation) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-900 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Frequência Estimada</div>
                      <div className="text-sm font-bold text-cyan-400 font-mono mt-0.5">
                        ~{campaignQuote.hourlyFrequency}x / hora
                      </div>
                      <div className="text-[9px] text-slate-500">Base: Playlist + {spotDuration}s</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Inserções Diárias</div>
                      <div className="text-sm font-bold text-indigo-400 font-mono mt-0.5">
                        ~{campaignQuote.dailyPlaysPerScreen}x / dia
                      </div>
                      <div className="text-[9px] text-slate-500">Displays ligados ~13h</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">Alcance de Impressões</div>
                      <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                        {campaignQuote.totalEstimatedImpressions.toLocaleString('pt-AO')}
                      </div>
                      <div className="text-[9px] text-slate-500">Previsto p/ {calculatedDays} dias</div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-500/40">
                      <div className="text-[10px] text-cyan-300 uppercase font-bold">Simulação em Tempo Real</div>
                      <div className="text-sm font-black text-white font-mono mt-0.5">
                        {formatKz(campaignQuote.totalPrice)}
                      </div>
                      <div className="text-[9px] text-emerald-400 font-semibold">
                        {selectedOpps.length > 0 ? `${selectedOpps.length} display(s)` : 'Tarifa por 1 display'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Descrição ou Observações do Anunciante
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instruções de público-alvo ou briefing para o gestor..."
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-[#0284C7] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Display Selection & Live Quote */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">
                  Pontos Selecionados: <strong className="text-white">{selectedOpps.length} displays</strong>
                </span>
                <span className="text-xs text-[#38BDF8]">
                  {campaignQuote.days} dias de veiculação • {campaignQuote.totalEstimatedPlays.toLocaleString('pt-AO')} inserções previstas
                </span>
              </div>

              {/* Grid of All Available Opportunities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                {availableOpportunities.map((opp) => {
                  const isChecked = selectedOpps.some((o) => o.id === opp.id);
                  const oppQuote = advertisingPricingService.calculateBookingPrice({
                    opportunity: opp,
                    startDate,
                    endDate,
                    dailyFrequency,
                  });

                  return (
                    <div
                      key={opp.id}
                      onClick={() => handleToggleOpportunity(opp)}
                      className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#0284C7] bg-[#0284C7]/15 ring-1 ring-[#0284C7]'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 rounded border-slate-700 text-[#0284C7] focus:ring-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white truncate">{opp.name}</h4>
                          <span className="text-xs font-bold text-[#38BDF8]">
                            {formatKz(oppQuote.totalPrice)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-[#F43F5E]" />
                          <span>{opp.venue} • {opp.municipality}</span>
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{opp.screenSize} ({opp.orientation})</span>
                          <span>{opp.estimatedDailyReach.toLocaleString('pt-AO')} pessoas/dia</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Quote Summary Bar */}
              <div className="mt-4 rounded-xl bg-slate-950 p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Alcance Total Estimado:</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {campaignQuote.totalReach.toLocaleString('pt-AO')} pessoas / dia
                  </p>
                </div>

                <div>
                  <span className="text-slate-400">Impressões Totais:</span>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {campaignQuote.totalEstimatedImpressions.toLocaleString('pt-AO')}
                  </p>
                </div>

                {campaignQuote.totalDiscount > 0 && (
                  <div>
                    <span className="text-slate-400">Desconto de Volume:</span>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">
                      -{formatKz(campaignQuote.totalDiscount)}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-slate-400">Orçamento Total ({campaignQuote.days} dias):</span>
                  <p className="text-base font-extrabold text-[#38BDF8] mt-0.5">
                    {formatKz(campaignQuote.totalPrice)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Creatives & Media Selection */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Associar Criativos da Biblioteca de Mídia</h3>
                  <p className="text-xs text-slate-400">
                    Selecione os vídeos e spots que serão transmitidos nos displays selecionados
                  </p>
                </div>
                <span className="text-xs font-semibold text-[#38BDF8]">
                  {selectedCreativeIds.length} selecionados
                </span>
              </div>

              {/* Filtered list of available creatives based on mediaFormat chosen in Step 1 */}
              {(() => {
                const filteredCreatives = availableCreatives.filter((item) => {
                  const type = (item.type || '').toUpperCase();
                  const url = (item.fileUrl || (item as any).url || '').toLowerCase();
                  const isVid = type === 'VIDEO' || url.includes('.mp4') || url.includes('.webm') || url.includes('.mov');
                  return mediaFormat === 'VIDEO' ? isVid : !isVid;
                });

                if (filteredCreatives.length === 0) {
                  return (
                    <div className="rounded-xl border border-[#0284C7]/30 bg-[#0284C7]/10 p-4 text-center text-xs text-slate-300 space-y-2">
                      <p>⚠️ Nenhuma mídia do tipo <strong>{mediaFormat === 'VIDEO' ? 'Vídeo' : 'Imagem'}</strong> encontrada na sua biblioteca.</p>
                      <p className="text-[11px] text-slate-400">Cadastre uma nova mídia no menu <em>Biblioteca de Mídias</em> ou escolha outro formato no Passo 1.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredCreatives.map((item) => {
                      const isChecked = selectedCreativeIds.includes(item.id);

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleToggleCreative(item.id)}
                          className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                            isChecked
                              ? 'border-[#0284C7] bg-[#0284C7]/15 ring-1 ring-[#0284C7]'
                              : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-1 h-4 w-4 rounded border-slate-700 text-[#0284C7] focus:ring-0"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300 font-medium">
                                {item.type}
                              </span>
                              <span>•</span>
                              <span className="text-cyan-300 font-semibold">{spotDuration || item.duration || 15}s (Duração escolhida)</span>
                              <span>•</span>
                              <span>{item.resolution || '1920x1080'}</span>
                            </div>
                            <p className="mt-1 text-[10px] text-slate-500 truncate">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {selectedCreativeIds.length === 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                  ⚠️ Nenhum criativo associado. Você poderá associar mídias posteriormente antes do início da veiculação.
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Review & Submission */}
          {currentStep === 4 && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                  <h3 className="text-sm font-bold text-white">Resumo Geral da Campanha</h3>
                  <Badge variant="active" size="sm">Pronta para Submissão</Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-slate-400">Nome:</span>
                    <strong className="block text-slate-200 mt-0.5">{campaignName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Anunciante:</span>
                    <strong className="block text-slate-200 mt-0.5">{selectedAdvertiser.tradeName || selectedAdvertiser.legalName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Período:</span>
                    <strong className="block text-slate-200 mt-0.5">{startDate} até {endDate} ({campaignQuote.days} dias)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Frequência:</span>
                    <strong className="block text-slate-200 mt-0.5">{dailyFrequency} inserções / hora</strong>
                  </div>
                </div>
              </div>

              {/* Booked Displays List */}
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Telas & Displays Alocados ({selectedOpps.length})
                </h4>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {selectedOpps.map((opp) => (
                    <div key={opp.id} className="flex justify-between items-center bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80 text-slate-300">
                      <span>{opp.name} ({opp.venue} • {opp.municipality})</span>
                      <span className="font-semibold text-slate-200">{formatKz(opp.basePrice)} / dia</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Total Box */}
              <div className="rounded-xl bg-gradient-to-br from-[#0284C7]/20 via-slate-900 to-slate-950 border border-[#0284C7]/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-slate-400">Investimento Total Proposto:</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-2xl font-extrabold text-[#38BDF8]">
                      {formatKz(campaignQuote.totalPrice)}
                    </span>
                    {campaignQuote.totalDiscount > 0 && (
                      <span className="text-xs text-emerald-400">
                        (Economia de {formatKz(campaignQuote.totalDiscount)} por volume)
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Inclui veiculação contínua, Proof of Play auditável e relatórios de telemetria
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="md"
                    disabled={isSubmitting}
                    onClick={() => handleFinishAndSubmit(true)}
                    className="border-slate-700"
                  >
                    Salvar Rascunho
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(5)}
                    className="bg-[#0284C7] hover:bg-[#0369A1] shadow-lg shadow-[#0284C7]/25 font-bold"
                  >
                    Prosseguir para Pagamento
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Payment / Checkout */}
          {currentStep === 5 && (
            <div className="space-y-5 text-xs">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      Checkout & Pagamento da Campanha
                    </h3>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      Selecione a forma de liquidação para validar a reserva dos slots nas telas
                    </p>
                  </div>
                  <Badge variant="warning" size="sm">Aguardando Pagamento</Badge>
                </div>

                {/* Amount to Pay Card */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-4 flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 text-xs">Total a Liquidar:</span>
                    <div className="text-2xl font-black text-emerald-400 mt-0.5">
                      {formatKz(campaignQuote.totalPrice)}
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Campanha de {campaignQuote.days} dias • {selectedOpps.length} telas • {campaignQuote.totalEstimatedPlays.toLocaleString('pt-AO')} spots
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400">Moeda</span>
                    <div className="text-base font-bold text-white">Kwanza (AOA)</div>
                  </div>
                </div>

                {/* Payment Methods Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Método de Pagamento:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MULTICAIXA')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMethod === 'MULTICAIXA'
                          ? 'border-[#0284C7] bg-[#0284C7]/20 ring-1 ring-[#0284C7]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">Multicaixa Express</div>
                      <div className="text-[10px] text-slate-400 mt-1">Pagamento via referência ou telemóvel</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('IBAN')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMethod === 'IBAN'
                          ? 'border-[#0284C7] bg-[#0284C7]/20 ring-1 ring-[#0284C7]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">Transferência / IBAN</div>
                      <div className="text-[10px] text-slate-400 mt-1">BFA, BAI, Millennium Atlântico</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('TRANSFER')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMethod === 'TRANSFER'
                          ? 'border-[#0284C7] bg-[#0284C7]/20 ring-1 ring-[#0284C7]'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">Conta Corrente</div>
                      <div className="text-[10px] text-slate-400 mt-1">Faturamento 30 dias (Empresas)</div>
                    </button>
                  </div>
                </div>

                {/* Bank Details / Payment Info Box */}
                <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Dados para Transferência & Liquidação:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                    <div>
                      <span className="text-slate-500">Beneficiário:</span> <strong className="text-white">{NEXORA_BANKING.beneficiary}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Banco:</span> <strong className="text-white">{NEXORA_BANKING.bankName}</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500">IBAN:</span> <strong className="text-[#38BDF8] font-mono">{NEXORA_BANKING.iban}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Referência Multicaixa:</span> <strong className="text-amber-400 font-mono">{NEXORA_BANKING.multicaixaReference}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Entidade:</span> <strong className="text-white font-mono">{NEXORA_BANKING.entity}</strong>
                    </div>
                  </div>
                </div>

                {/* Mandatory Payment Receipt Upload */}
                <div className="rounded-xl bg-slate-900 border border-[#0284C7]/40 p-4 space-y-2">
                  <label className="block text-xs font-bold text-white flex items-center justify-between">
                    <span>Anexar Comprovativo de Pagamento *</span>
                    {paymentReceiptUrl && <span className="text-emerald-400 font-semibold">✓ Anexado com Sucesso</span>}
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0284C7]/20 hover:bg-[#0284C7]/30 border border-[#0284C7]/50 rounded-xl text-xs font-bold text-[#38BDF8] cursor-pointer transition-all">
                      <span>{isUploadingReceipt ? '⏳ A Carregar Comprovativo...' : paymentReceiptUrl ? '📎 Trocar Comprovativo Anexado' : '📄 Anexar Comprovativo (PDF / Imagem)'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        className="hidden"
                        disabled={isUploadingReceipt}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setIsUploadingReceipt(true);
                          const reader = new FileReader();
                          reader.onload = async (ev) => {
                            const base64 = ev.target?.result as string;
                            try {
                              const res = await fetch('/api/storage/upload', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  fileBase64: base64,
                                  fileName: file.name,
                                  folder: 'comprovativos',
                                  mimeType: file.type,
                                }),
                              });
                              const data = await res.json();
                              if (data.url) {
                                setPaymentReceiptUrl(data.url);
                                addToast({ title: 'Comprovativo Anexado!', description: 'Arquivo registrado para validação do administrador.', type: 'success' });
                              }
                            } catch (err) {
                              addToast({ title: 'Erro de Upload', description: 'Não foi possível enviar o comprovativo.', type: 'error' });
                            } finally {
                              setIsUploadingReceipt(false);
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    O envio do comprovativo é indispensável para a análise e aprovação imediata do administrador.
                  </p>
                </div>

                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-[11px] text-blue-300 flex items-center gap-2">
                  <Clock className="w-4 h-4 shrink-0 text-blue-400" />
                  <span>
                    Após submeter, a campanha entrará em revisão com o status <strong>Pendente de Pagamento</strong>. O administrador irá conferir o comprovativo e aprovar a transmissão automática.
                  </span>
                </div>
              </div>

              {/* Action Submit */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="md"
                  disabled={isSubmitting}
                  onClick={() => handleFinishAndSubmit(true)}
                  className="border-slate-700"
                >
                  Salvar Rascunho
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  onClick={() => handleFinishAndSubmit(false)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Pagamento e Submeter
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-900/60 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={currentStep === 1 ? onClose : handlePreviousStep}
            className="border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            {currentStep === 1 ? 'Cancelar' : 'Voltar'}
          </Button>

          {currentStep < 5 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleNextStep}
              className="bg-[#0284C7] hover:bg-[#0369A1]"
            >
              Avançar
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
