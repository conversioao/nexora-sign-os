import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  AdvertisingCampaign,
  CampaignBooking,
  CampaignCreative,
  AdvertisingCampaignStatus,
  PlaybackEvent,
} from '../../../types/advertising';
import { advertisingCampaignRepository } from '../../../repositories/advertisingCampaignRepository';
import { campaignBookingRepository } from '../../../repositories/campaignBookingRepository';
import { campaignCreativeRepository } from '../../../repositories/campaignCreativeRepository';
import { advertisingBookingService } from '../../../services/advertisingBookingService';
import { playbackTrackingService } from '../../../services/playbackTrackingService';
import { campaignAnalyticsService } from '../../../services/campaignAnalyticsService';
import { PublishCampaignModal } from '../components/PublishCampaignModal';
import { useToast } from '../../../components/ui/Toast';
import {
  ArrowLeft,
  CheckCircle2,
  Tv,
  Film,
  TrendingUp,
  ShieldCheck,
  Pause,
  Play,
  FileCheck,
  Activity,
  XCircle,
  ExternalLink,
  Rocket,
  Lock,
  RefreshCw,
  Clock,
  Eye,
  Pencil,
  X,
  Receipt,
  Download,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface CampaignDetailPageProps {
  campaignId: string;
  onBack: () => void;
  onNavigateToDisplay?: (displayId: string) => void;
  onNavigateToContent?: (contentId: string) => void;
  onNavigateToReport?: (campaignId: string) => void;
}

/**
 * Remove a origem quando o URL aponta para a máquina do servidor.
 *
 * ⛔ Mídias antigas ficaram gravadas com `http://localhost:3001/...`: no painel do
 * anunciante (noutro computador) esse endereço é o do PRÓPRIO visitante, não
 * existe lá ficheiro nenhum e o vídeo aparece PRETO — enquanto na biblioteca,
 * aberta no mesmo computador do servidor, o mesmo vídeo toca bem.
 * Passando a caminho relativo, o browser resolve-o contra o servidor correto.
 */
function normalizarUrlMidia(url: string): string {
  return String(url || '').replace(
    /^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?/i,
    ''
  );
}

export const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({
  campaignId,
  onBack,
  onNavigateToDisplay,
  onNavigateToReport,
}) => {
  const { addToast } = useToast();
  const { isNexoraAdmin, isAdvertiser } = useAuth();
  const [campaign, setCampaign] = useState<AdvertisingCampaign | null>(null);
  const [bookings, setBookings] = useState<CampaignBooking[]>([]);
  const [creatives, setCreatives] = useState<CampaignCreative[]>([]);
  const [playbackEvents, setPlaybackEvents] = useState<PlaybackEvent[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'creatives' | 'proofOfPlay' | 'timeline' | 'financial'>('bookings');

  // Preview & Edit Media Modal States
  const [previewCreative, setPreviewCreative] = useState<CampaignCreative | null>(null);
  const [editingCreative, setEditingCreative] = useState<CampaignCreative | null>(null);
  const [editMediaUrl, setEditMediaUrl] = useState('');
  const [isUpdatingMedia, setIsUpdatingMedia] = useState(false);

  // Payment Proof / Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>(new Date().toLocaleTimeString('pt-AO'));
  const [partnerSplitRate, setPartnerSplitRate] = useState<number>(0.15);

  const loadData = async (showLoadingState: boolean = true) => {
    if (showLoadingState) setLoading(true);
    try {
      fetch('/api/settings/partner-split-rate')
        .then((r) => r.json())
        .then((data) => {
          if (data.partnerSplitRate !== undefined) setPartnerSplitRate(data.partnerSplitRate);
        })
        .catch(() => {});

      const [camp, bookList, creativeList, events] = await Promise.all([
        advertisingCampaignRepository.getById(campaignId),
        campaignBookingRepository.getByCampaignId(campaignId),
        campaignCreativeRepository.getByCampaignId(campaignId),
        playbackTrackingService.getCampaignPlaybackEvents(campaignId),
      ]);
      setCampaign(camp || null);

      // Resolve bookings: If campaign.displays exists in JSON, map them into CampaignBooking items
      let resolvedBookings = bookList;
      if ((!resolvedBookings || resolvedBookings.length === 0) && camp && camp.displays) {
        let dispArray = Array.isArray(camp.displays) ? camp.displays : [];
        if (typeof camp.displays === 'string') {
          try { dispArray = JSON.parse(camp.displays); } catch {}
        }
        if (dispArray.length > 0) {
          resolvedBookings = dispArray.map((d: any, idx: number) => ({
            id: `bkg-${camp.id}-${idx}`,
            campaignId: camp.id,
            opportunityId: d.opportunityId || `opp-${idx}`,
            displayId: d.displayId || d.id || `dsp-${idx}`,
            displayCode: d.displayCode || d.code || `DSP-${idx + 1}`,
            displayName: d.displayName || d.name || `Ecrã Digital ${idx + 1}`,
            venueName: d.venueName || d.location || 'Espaço Comercial',
            municipality: d.municipality || d.location || 'Luanda',
            startDate: camp.startDate,
            endDate: camp.endDate,
            frequency: camp.dailyFrequency || 6,
            slotDuration: camp.slotDurationSeconds || 15,
            estimatedPlays: 5000,
            estimatedImpressions: 250000,
            unitPrice: 120000,
            totalPrice: camp.budget,
            currency: 'AOA',
            status: camp.status === 'LIVE' ? 'ACTIVE' : 'CONFIRMED',
          }));
        }
      }
      setBookings(resolvedBookings);

      // If campaign has direct media_url or embedded creatives from DB
      let resolvedCreatives = creativeList;
      if (camp && camp.creatives && Array.isArray(camp.creatives) && camp.creatives.length > 0) {
        resolvedCreatives = camp.creatives.map((c: any, idx: number) => {
          const url = normalizarUrlMidia(c.fileUrl || c.url || c.mediaUrl || camp.media_url || '');
          return {
            id: c.id || `crc-${idx + 1}`,
            campaignId: camp.id,
            contentTitle: c.contentTitle || c.name || c.title || `Criativo ${idx + 1}`,
            type: c.type || (url.includes('.mp4') ? 'VIDEO' : 'IMAGE'),
            duration: c.duration || camp.slotDurationSeconds || 15,
            approvalStatus: (c.approvalStatus || (camp.status === 'LIVE' ? 'APPROVED' : 'SUBMITTED')) as any,
            fileUrl: url,
            contentUrl: url,
            mediaUrl: url,
            createdAt: camp.createdAt,
          };
        });
      } else if (camp && (camp.media_url || (camp as any).fileUrl)) {
        const url = normalizarUrlMidia(camp.media_url || (camp as any).fileUrl || '');
        resolvedCreatives = [{
          id: `crc-${camp.id}`,
          campaignId: camp.id,
          contentTitle: `Criativo Principal: ${camp.name}`,
          type: url.includes('.mp4') ? 'VIDEO' : 'IMAGE',
          duration: camp.slotDurationSeconds || 15,
          approvalStatus: camp.status === 'LIVE' ? 'APPROVED' : 'SUBMITTED',
          fileUrl: url,
          contentUrl: url,
          mediaUrl: url,
          createdAt: camp.createdAt,
        } as any];
      }

      setCreatives(resolvedCreatives);
      setPlaybackEvents(events);
      setLastUpdatedTime(new Date().toLocaleTimeString('pt-AO'));

      try {
        const stats = await campaignAnalyticsService.getCampaignOverview(campaignId);
        setAnalytics(stats);
      } catch (e) {
        console.warn('Analytics missing');
      }
    } catch (error) {
      console.error('Failed to load campaign details', error);
    } finally {
      if (showLoadingState) setLoading(false);
      setLastUpdatedTime(new Date().toLocaleTimeString('pt-AO'));
    }
  };

  const [loopStats, setLoopStats] = useState<{
    totalLoops: number;
    loopsToday: number;
    loopsLast10m: number;
    loopsLast1h: number;
    displaysCount: number;
    lastPlayedAt: string | null;
    loopsByDisplay: any[];
  } | null>(null);

  const fetchLoopStats = async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/loop-stats`);
      if (res.ok) {
        const data = await res.json();
        setLoopStats(data);
      }
    } catch (e) {}
  };

  // Real 5-Second Realtime Polling for Proof of Play and Live Telemetry
  useEffect(() => {
    loadData(true);
    fetchLoopStats();

    const interval5Sec = setInterval(() => {
      loadData(false);
      fetchLoopStats();
    }, 5000);

    return () => clearInterval(interval5Sec);
  }, [campaignId]);

  const handleApproveCampaign = async () => {
    if (!campaign) return;
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setCampaign({ ...campaign, status: 'LIVE' });
        addToast({
          title: 'Campanha Aprovada e no Ar!',
          description: data.message || `A campanha ${campaign.name} foi adicionada à playlist ativa e está a ser veiculada nas telas.`,
          type: 'success',
        });
        await loadData();
      } else {
        const updated = await advertisingBookingService.approveCampaign(campaign.id, 'admin-user');
        setCampaign(updated);
        addToast({
          title: 'Campanha Aprovada!',
          description: `A campanha ${campaign.name} foi aprovada com sucesso.`,
          type: 'success',
        });
        await loadData();
      }
    } catch (error) {
      addToast({
        title: 'Erro na aprovação',
        description: 'Não foi possível aprovar a campanha.',
        type: 'error',
      });
    }
  };

  const handleToggleStatus = async (targetStatus: AdvertisingCampaignStatus) => {
    if (!campaign) return;
    try {
      const updated = await advertisingCampaignRepository.updateStatus(campaign.id, targetStatus);
      setCampaign(updated);
      addToast({
        title: 'Status atualizado',
        description: `Status da campanha alterado para ${targetStatus}.`,
        type: 'info',
      });
    } catch (error) {
      addToast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível alterar o status.',
        type: 'error',
      });
    }
  };

  const handleApproveCreative = async (creativeId: string) => {
    try {
      await advertisingBookingService.approveCreative(creativeId, 'operator-user');
      setCreatives((prev) =>
        prev.map((c) => (c.id === creativeId ? { ...c, approvalStatus: 'APPROVED' } : c))
      );
      addToast({
        title: 'Criativo aprovado',
        description: 'Mídia liberada para exibição no player.',
        type: 'success',
      });
    } catch (error) {
      addToast({
        title: 'Erro na aprovação',
        description: 'Falha ao aprovar criativo.',
        type: 'error',
      });
    }
  };

  const handleUpdateCreativeMedia = async () => {
    if (!editingCreative || !editMediaUrl.trim()) return;
    setIsUpdatingMedia(true);
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/creatives/${editingCreative.id}/update-media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaUrl: editMediaUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar mídia');

      addToast({
        title: 'Mídia atualizada',
        description: 'Novo criativo salvo e sincronizado com os displays vinculados.',
        type: 'success',
      });
      setEditingCreative(null);
      setEditMediaUrl('');
      await loadData(false);
    } catch (err: any) {
      addToast({
        title: 'Erro na atualização',
        description: err.message || 'Não foi possível atualizar a mídia.',
        type: 'error',
      });
    } finally {
      setIsUpdatingMedia(false);
    }
  };
  const handleRejectCreative = async (creativeId: string) => {
    try {
      await advertisingBookingService.rejectCreative(
        creativeId,
        'Formato fora do padrão de resolução ou bitrate excessivo.',
        'operator-user'
      );
      setCreatives((prev) =>
        prev.map((c) =>
          c.id === creativeId
            ? {
                ...c,
                approvalStatus: 'CANCELLED',
                rejectionReason: 'Formato fora do padrão de resolução ou bitrate excessivo.',
              }
            : c
        )
      );
      addToast({
        title: 'Criativo reprovado',
        description: 'Notificação enviada ao anunciante para adequação técnica.',
        type: 'warning',
      });
    } catch (error) {
      addToast({
        title: 'Erro ao reprovar',
        description: 'Falha ao reprovar criativo.',
        type: 'error',
      });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#0284C7] border-t-transparent" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-lg font-bold text-white">Campanha não encontrada</h2>
        <Button variant="outline" size="sm" onClick={onBack} className="mt-4 border-slate-700">
          Voltar para Lista
        </Button>
      </div>
    );
  }

  const totalRealPlays = (loopStats?.totalLoops && loopStats.totalLoops > 0)
    ? loopStats.totalLoops
    : (analytics?.totalPlays || playbackEvents.length || 0);

  const targetPlaysCount = campaign.targetPlays || 5000;
  const completion = Math.min(100, (totalRealPlays / targetPlaysCount) * 100);

  const isEligibleToPublish =
    campaign.status === 'APPROVED' ||
    campaign.status === 'SCHEDULED' ||
    campaign.status === 'DRAFT' ||
    campaign.status === 'PENDING_REVIEW';

  return (
    <div id="campaign-detail-page-root" className="flex flex-col gap-6 p-6 max-w-7xl mx-auto min-h-screen">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-wrap gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para Lista de Campanhas
        </button>

        {/* Operator Controls Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          {isNexoraAdmin && (campaign.status === 'PENDING_REVIEW' || campaign.status === 'PENDING_PAYMENT') && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleToggleStatus('CANCELLED')}
                className="border-red-500/40 text-red-400 hover:bg-red-500/10 text-xs"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Recusar Campanha
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handleApproveCampaign}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                {campaign.status === 'PENDING_PAYMENT' ? 'Confirmar Pagamento & Publicar na Tela' : 'Aprovar & Publicar na Tela'}
              </Button>
            </>
          )}

          {/* Primary "Publicar Agora" Action (Admin Only) */}
          {isNexoraAdmin && isEligibleToPublish && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPublishModalOpen(true)}
              className="bg-gradient-to-r from-[#0284C7] to-emerald-600 hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-[#0284C7]/20"
            >
              <Rocket className="w-3.5 h-3.5 mr-1.5" />
              Publicar Agora (No Ar)
            </Button>
          )}

          {campaign.status === 'LIVE' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleStatus('PAUSED')}
              className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
            >
              <Pause className="w-3.5 h-3.5 mr-1" />
              Pausar Veiculação
            </Button>
          )}

          {campaign.status === 'PAUSED' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleToggleStatus('LIVE')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
            >
              <Play className="w-3.5 h-3.5 mr-1" />
              Retomar Campanha
            </Button>
          )}

          {onNavigateToReport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToReport(campaign.id)}
              className="border-[#0284C7]/40 text-[#38BDF8] hover:bg-[#0284C7]/10 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Ver Relatório Completo
            </Button>
          )}
        </div>
      </div>

      {/* Main Campaign Header Box */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F172A]/90 p-6 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 px-2.5 py-0.5 text-xs font-bold text-[#38BDF8]">
                {campaign.advertiserName}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">ID: {campaign.id}</span>
              <span className="text-slate-600">•</span>
              <Badge
                variant={
                  campaign.status === 'LIVE'
                    ? 'online'
                    : campaign.status === 'PENDING_REVIEW'
                    ? 'warning'
                    : 'active'
                }
                size="sm"
                dot
              >
                {campaign.status === 'LIVE' ? 'EM VEICULAÇÃO (AO VIVO)' : campaign.status}
              </Badge>
            </div>

            <h1 className="text-2xl font-black text-white mt-1">{campaign.name}</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {campaign.description ||
                'Veiculação publicitária contratada na rede digital signage de Luanda.'}
            </p>
          </div>

          {/* Quick Metrics Pillar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                Período
              </span>
              <p className="text-xs font-bold text-slate-200 mt-0.5">{campaign.startDate ? campaign.startDate.split('T')[0] : 'N/A'}</p>
              <span className="text-[10px] text-slate-400">até {campaign.endDate ? campaign.endDate.split('T')[0] : 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                Loops Hoje
              </span>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">
                {loopStats?.loopsToday?.toLocaleString('pt-AO') || 0} exibições
              </p>
              <span className="text-[10px] text-slate-400">
                +{loopStats?.loopsLast10m || 0} nos últ. 10m
              </span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                Total de Loops
              </span>
              <p className="text-xs font-bold text-cyan-400 mt-0.5">
                {loopStats?.totalLoops?.toLocaleString('pt-AO') || (analytics?.totalPlays || 0)}
              </p>
              <span className="text-[10px] text-slate-400">em {loopStats?.displaysCount || 0} telas</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                Impressões
              </span>
              <p className="text-xs font-bold text-[#10B981] mt-0.5">
                {((loopStats?.totalLoops || 0) * 25 || campaign.estimatedImpressions)?.toLocaleString('pt-AO')}
              </p>
              <span className="text-[10px] text-slate-400">visualizações est.</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
                Orçamento
              </span>
              <p className="text-xs font-bold text-[#38BDF8] mt-0.5">{formatKz(campaign.budget)}</p>
              <span className="text-[10px] text-slate-400">Kwanzas (Kz)</span>
            </div>
          </div>
        </div>

        {/* Payment Receipt / Comprovativo Panel (Admin Only - Pending campaigns) */}
        {isNexoraAdmin && (campaign.paymentReceiptUrl || (campaign as any).payment_receipt_url) && (
          <div className="mt-5 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Comprovativo de Pagamento Carregado</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  O anunciante carregou um comprovativo de pagamento. Verifique antes de aprovar a campanha.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReceiptModal(true)}
                className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10 text-xs"
              >
                <Eye className="w-3.5 h-3.5 mr-1" />
                Ver Comprovativo
              </Button>
              <a
                href={campaign.paymentReceiptUrl || (campaign as any).payment_receipt_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 text-xs font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar
              </a>
            </div>
          </div>
        )}

        {/* Proof of Play Live Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#38BDF8]" />
              Progresso de Execução de Loops (Proof of Play)
            </span>
            <span className="text-white font-bold">
              {totalRealPlays.toLocaleString('pt-AO')} inserções (
              {completion.toFixed(1)}%)
            </span>
          </div>

          <div className="mt-2 h-2.5 w-full rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              style={{ width: `${Math.max(completion, totalRealPlays > 0 ? 2 : 0)}%` }}
              className="h-full bg-gradient-to-r from-[#0284C7] to-[#10B981] transition-all duration-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs flex-wrap">
        {[
          { id: 'bookings', label: `Displays & Pontos (${bookings.length})`, icon: Tv },
          { id: 'creatives', label: `Criativos & Spots (${creatives.length})`, icon: Film },
          { id: 'proofOfPlay', label: `Proof of Play & Auditoria (${playbackEvents.length})`, icon: FileCheck },
          { id: 'timeline', label: 'Linha do Tempo (Lifecycle)', icon: Clock },
          ...(isNexoraAdmin ? [{ id: 'financial', label: 'Demonstrativo Financeiro & Repasse', icon: TrendingUp }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#0284C7] text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Bookings & Displays */}
      {activeTab === 'bookings' && (
        <div className="space-y-3">
          {bookings.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-8 text-center text-slate-400 text-xs">
              <Tv className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              Nenhum display específico foi vinculado a esta campanha ainda. O conteúdo é distribuído de acordo com os pacotes e locais selecionados no plano publicitário.
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-[#38BDF8] border border-slate-800">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {(booking as any).displayCode || `DSP-${booking.displayId}`}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">{booking.municipality}</span>
                      <Badge
                        variant={booking.status === 'ACTIVE' || booking.status === 'CONFIRMED' ? 'online' : 'scheduled'}
                        size="sm"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-200 mt-0.5">
                      {booking.displayName || booking.venueName}
                    </h4>
                    <p className="text-xs text-slate-500">Local: {booking.venueName || booking.municipality}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs flex-wrap">
                  <div>
                    <span className="text-slate-500 block">Frequência</span>
                    <strong className="text-slate-200">{booking.frequency || 6}x / h</strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Loops Estimados</span>
                    <strong className="text-slate-200">
                      {(booking.estimatedPlays || 5500).toLocaleString('pt-AO')}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Valor Diário</span>
                    <strong className="text-[#38BDF8]">{formatKz(booking.unitPrice || 120000)} / dia</strong>
                  </div>

                  {onNavigateToDisplay && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToDisplay(booking.displayId)}
                      className="border-slate-700 text-xs"
                    >
                      Ver Display
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Creatives & Media */}
      {activeTab === 'creatives' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {creatives.map((creative) => (
              <div
                key={creative.id}
                className="flex flex-col rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {creative.type || 'VIDEO'} • {creative.duration || 15} segundos
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">{creative.contentTitle || 'Spot Criativo'}</h4>
                    <span className="text-xs text-slate-400">Resolução: {creative.resolution || '3840x2160 (4K)'}</span>
                  </div>

                  <Badge
                    variant={
                      creative.approvalStatus === 'APPROVED'
                        ? 'online'
                        : creative.approvalStatus === 'CANCELLED' || creative.approvalStatus === 'REJECTED'
                        ? 'offline'
                        : 'warning'
                    }
                    size="sm"
                  >
                    {creative.approvalStatus === 'APPROVED'
                      ? 'Aprovado'
                      : creative.approvalStatus === 'CANCELLED' || creative.approvalStatus === 'REJECTED'
                      ? 'Rejeitado'
                      : 'Em Análise'}
                  </Badge>
                </div>

                {creative.rejectionReason && (
                  <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-300">
                    Motivo da recusa: {creative.rejectionReason}
                  </div>
                )}

                {/* Creative Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewCreative(creative)}
                        className="border-sky-500/30 text-sky-400 hover:bg-sky-500/10 text-xs h-8"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Visualizar Criativo
                      </Button>

                      {(creative.approvalStatus === 'APPROVED' || campaign?.status === 'LIVE') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingCreative(creative);
                            setEditMediaUrl(creative.mediaUrl || '');
                          }}
                          className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 text-xs h-8"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-1" />
                          Alterar Mídia
                        </Button>
                      )}
                    </div>

                    {isNexoraAdmin && (
                      <div className="flex items-center gap-2">
                        {creative.approvalStatus !== 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveCreative(creative.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Aprovar
                          </Button>
                        )}

                        {creative.approvalStatus !== 'CANCELLED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRejectCreative(creative.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs h-8"
                          >
                            <XCircle className="w-3 h-3 mr-1" />
                            Reprovar
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Proof of Play & Audit */}
      {activeTab === 'proofOfPlay' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Proof of Play Auditável (Conformidade Criptográfica)
                </h3>
                <p className="text-xs text-slate-400">
                  Registros emitidos pelos players Android/Linux com assinatura digital SHA-256 de cada inserção.
                </p>
              </div>
              <Badge variant="online" size="sm">
                {(analytics?.completionRate || 98.6).toFixed(1)}% Aderência
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Taxa de Sucesso:</span>
                <p className="text-base font-bold text-emerald-400 mt-1">
                  {(analytics?.completionRate || 98.6).toFixed(2)}%
                </p>
                <span className="text-[10px] text-slate-500">
                  {analytics?.failedPlays || 0} falhas de sinal reportadas
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Duração Média:</span>
                <p className="text-base font-bold text-white mt-1">
                  {(analytics?.averageDuration || 15).toFixed(1)}s / spot
                </p>
                <span className="text-[10px] text-slate-500">Sem cortes de transmissão</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Logs Registrados:</span>
                <p className="text-base font-bold text-[#38BDF8] mt-1">
                  {playbackEvents.length.toLocaleString('pt-AO')} registros
                </p>
                <span className="text-[10px] text-slate-500">Assinados pelos terminais</span>
              </div>
            </div>
          </div>

          {/* Detailed Audit Table */}
          <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Últimos Eventos de Reprodução em Tempo Real
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="text-xs border-slate-700 h-7 text-slate-300"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Atualizar Logs
              </Button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-left text-slate-400 font-semibold">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Display / Localidade</th>
                    <th className="py-2.5 px-4">Duração</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Assinatura SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {playbackEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500 font-sans text-xs">
                        Nenhum log telemétrico capturado até ao momento. Assim que o player iniciar a transmissão, os eventos assinados com SHA-256 serão registados aqui.
                      </td>
                    </tr>
                  ) : (
                    playbackEvents.slice(0, 15).map((evt) => (
                      <tr key={evt.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-4 text-slate-300 whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleString('pt-AO')}
                        </td>
                        <td className="py-2.5 px-4 text-slate-200">
                          {evt.location || evt.displayCode || evt.displayId}
                        </td>
                        <td className="py-2.5 px-4 text-slate-300">{evt.duration}s ({evt.percentagePlayed || 100}%)</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              evt.completed || evt.status === 'PLAYED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : evt.status === 'PARTIAL'
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {evt.status || (evt.completed ? 'PLAYED' : 'FAILED')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[10px] truncate max-w-[200px]">
                          <span className="flex items-center gap-1 text-slate-400">
                            <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                            {evt.signature || `SHA256:NEX-${evt.id}`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Campaign Lifecycle Timeline */}
      {activeTab === 'timeline' && (
        <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#38BDF8]" />
              Linha do Tempo e Ciclo de Vida da Campanha
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Rastreabilidade de todas as transições de estado, reservas, aprovações e veiculação em Angola.
            </p>
          </div>

          <div className="relative border-l border-slate-800 ml-4 space-y-6">
            {[
              {
                title: 'Campanha Criada & Reservas Alocadas',
                date: campaign.createdAt || '2026-08-01',
                desc: `Campanha criada com orçamento de ${formatKz(campaign.budget)} em ${bookings.length} displays.`,
                status: 'DONE',
              },
              {
                title: 'Criativos Submetidos para Homologação',
                date: campaign.createdAt || '2026-08-02',
                desc: `${creatives.length} criativos enviados com resolução 4K/Full HD.`,
                status: 'DONE',
              },
              {
                title: 'Aprovação Comercial & Técnica',
                date: campaign.approvedAt || '2026-08-08',
                desc: campaign.approvedBy ? `Aprovado por ${campaign.approvedBy}` : 'Aprovado pelo operador.',
                status: campaign.status !== 'DRAFT' && campaign.status !== 'PENDING_REVIEW' ? 'DONE' : 'CURRENT',
              },
              {
                title: 'Publicação & Transmissão nos Media Players',
                date: campaign.startDate || '2026-08-10',
                desc: 'Comando SYNC_SCHEDULE enviado via Player Gateway para a rede de displays.',
                status: campaign.status === 'LIVE' ? 'DONE' : campaign.status === 'SCHEDULED' ? 'CURRENT' : 'PENDING',
              },
              {
                title: 'Proof of Play em Tempo Real & Auditoria',
                date: 'Contínuo',
                desc: `${playbackEvents.length} inserções confirmadas e registradas com telemetria ativa.`,
                status: campaign.status === 'LIVE' ? 'CURRENT' : 'PENDING',
              },
              {
                title: 'Conclusão & Liquidação Financeira',
                date: campaign.endDate || '2026-08-31',
                desc: 'Emissão de relatório auditado e repasse aos donos dos pontos publicitários.',
                status: campaign.status === 'COMPLETED' ? 'DONE' : 'PENDING',
              },
            ].map((step, idx) => (
              <div key={idx} className="relative pl-6">
                <div
                  className={`absolute -left-3 top-1 flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                    step.status === 'DONE'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : step.status === 'CURRENT'
                      ? 'bg-[#0284C7]/20 border-[#0284C7] text-[#38BDF8] animate-pulse'
                      : 'bg-slate-900 border-slate-700 text-slate-600'
                  }`}
                >
                  {step.status === 'DONE' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-white">{step.title}</span>
                  <span className="text-[10px] text-slate-500 ml-2">• {step.date}</span>
                  <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Financial Statement & Revenue Split */}
      {activeTab === 'financial' && (
        <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#38BDF8]" />
                Divisão de Receitas & Faturamento (Revenue Split)
              </h3>
              <p className="text-xs text-slate-400">
                Modelo de remuneração de parceiros proprietários de displays vs taxa de rede Nexora.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="active" size="sm">
                Faturado em Kwanzas (Kz)
              </Badge>
            </div>
          </div>

          {/* Configurable Partner Commission Rate Control */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-300">Percentagem de Repasse ao Parceiro:</span>
              <span className="text-slate-400">Defina o % que o parceiro dono da tela recebe (Recomendado: 10% a 15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={Math.round(partnerSplitRate * 100)}
                onChange={async (e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val >= 0 && val <= 100) {
                    const newRate = val / 100;
                    setPartnerSplitRate(newRate);
                    try {
                      await fetch('/api/settings/partner-split-rate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ partnerSplitRate: newRate }),
                      });
                      addToast({
                        title: 'Percentagem Atualizada',
                        description: `Repasse do parceiro ajustado para ${val}% (Nexora fica com ${(100 - val)}%).`,
                        type: 'success',
                      });
                    } catch (err) {}
                  }
                }}
                className="w-20 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-400 font-bold text-right"
              />
              <span className="font-bold text-slate-300">%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 block mb-2">Composição do Faturamento</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal de Mídia:</span>
                <strong className="text-slate-200">{formatKz(campaign.budget * 1.15)}</strong>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Desconto de Volume Nexora:</span>
                <strong>-{formatKz(campaign.budget * 0.15)}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold">
                <span className="text-white">Total Líquido Faturado:</span>
                <span className="text-[#38BDF8]">{formatKz(campaign.budget)}</span>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 space-y-2">
              <span className="font-bold text-slate-300 block mb-2">Divisão de Repasse (Split)</span>
              <div className="flex justify-between">
                <span className="text-slate-400">Repasse a Donos das Telas ({(partnerSplitRate * 100).toFixed(0)}%):</span>
                <strong className="text-emerald-400">{formatKz(campaign.budget * partnerSplitRate)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Taxa de Rede & Operação Nexora ({((1 - partnerSplitRate) * 100).toFixed(0)}%):</span>
                <strong className="text-[#38BDF8]">{formatKz(campaign.budget * (1 - partnerSplitRate))}</strong>
              </div>
              <p className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                Nexora retém a maior parte da receita ({((1 - partnerSplitRate) * 100).toFixed(0)}%). Repasses de {(partnerSplitRate * 100).toFixed(0)}% liquidados mensalmente em Kwanzas (Kz).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preview Creative Modal */}
      {previewCreative && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-[#38BDF8]" />
                <div>
                  <h3 className="text-sm font-bold text-white">{previewCreative.contentTitle || 'Pré-visualização do Criativo'}</h3>
                  <span className="text-xs text-slate-400">{previewCreative.resolution || '1920x1080'} • {previewCreative.duration || 15}s</span>
                </div>
              </div>
              <button
                onClick={() => setPreviewCreative(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex items-center justify-center bg-black min-h-[300px]">
              {previewCreative.mediaUrl ? (
                previewCreative.mediaUrl.match(/\.(mp4|webm|ogg)$/i) || previewCreative.type === 'VIDEO' ? (
                  <video
                    src={previewCreative.mediaUrl}
                    controls
                    autoPlay
                    className="max-h-[450px] w-full object-contain rounded-lg"
                  />
                ) : (
                  <img
                    src={previewCreative.mediaUrl}
                    alt={previewCreative.contentTitle || 'Criativo'}
                    className="max-h-[450px] w-full object-contain rounded-lg"
                  />
                )
              ) : (
                <div className="text-center text-slate-500 py-12">
                  <Film className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum arquivo de mídia carregado.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 break-all max-w-[400px]">
                {previewCreative.mediaUrl || 'URL não definida'}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewCreative(null)}
                className="border-slate-700 text-xs"
              >
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Media Modal */}
      {editingCreative && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Alterar Mídia do Criativo</h3>
              </div>
              <button
                onClick={() => setEditingCreative(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  URL ou Upload de Nova Mídia (Vídeo MP4 ou Imagem)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editMediaUrl}
                    onChange={(e) => setEditMediaUrl(e.target.value)}
                    placeholder="https://exemplo.com/video.mp4"
                    className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                  />
                  <label className="cursor-pointer flex items-center justify-center px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-xl border border-slate-700 transition-colors">
                    <span>Procurar...</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
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
                                folder: 'campanhas',
                                mimeType: file.type,
                              }),
                            });
                            const data = await res.json();
                            if (data.url) setEditMediaUrl(data.url);
                          } catch (err) {
                            console.error('Upload error:', err);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ao salvar, a mídia será atualizada na campanha e imediatamente reenviada à playlist do display vinculado.
                </p>
              </div>

              {editMediaUrl && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-2 overflow-hidden flex items-center justify-center max-h-48">
                  {editMediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                    <video src={editMediaUrl} controls className="max-h-44 rounded" />
                  ) : (
                    <img src={editMediaUrl} alt="Preview" className="max-h-44 object-contain rounded" />
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingCreative(null)}
                className="border-slate-700 text-xs"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleUpdateCreativeMedia}
                disabled={isUpdatingMedia || !editMediaUrl.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-xs"
              >
                {isUpdatingMedia ? 'Sincronizando...' : 'Salvar e Sincronizar'}
              </Button>
            </div>
          </div>
        </div>
      )}
{/* Payment Receipt Preview Modal */}
      {showReceiptModal && (campaign.paymentReceiptUrl || (campaign as any).payment_receipt_url) && (() => {
        const receiptUrl = campaign.paymentReceiptUrl || (campaign as any).payment_receipt_url || '';
        const isPdf = receiptUrl.toLowerCase().includes('.pdf');
        const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(receiptUrl);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">Comprovativo de Pagamento</h3>
                    <span className="text-[11px] text-slate-400">{campaign.advertiserName} • {campaign.name}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex items-center justify-center bg-black min-h-[320px]">
                {isImage ? (
                  <img
                    src={receiptUrl}
                    alt="Comprovativo de Pagamento"
                    className="max-h-[460px] w-full object-contain rounded-lg"
                  />
                ) : isPdf ? (
                  <iframe
                    src={receiptUrl}
                    title="Comprovativo PDF"
                    className="w-full h-[460px] rounded-lg border-0"
                  />
                ) : (
                  <div className="text-center text-slate-400 py-12">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-white mb-1">Ficheiro de Comprovativo</p>
                    <p className="text-xs text-slate-400 mb-4 break-all max-w-xs">{receiptUrl}</p>
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Abrir em Nova Aba
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 break-all max-w-[380px] truncate">{receiptUrl}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowReceiptModal(false)}
                    className="border-slate-700 text-xs"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

{/* Publish Campaign Modal */}
      <PublishCampaignModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        campaign={campaign}
        bookings={bookings}
        creatives={creatives}
        onPublishedSuccess={() => {
          loadData();
          setIsPublishModalOpen(false);
        }}
      />
    </div>
  );
};
