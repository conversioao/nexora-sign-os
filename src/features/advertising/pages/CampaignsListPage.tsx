import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useSession } from '../../../context/SessionContext';
import {
  AdvertisingCampaign,
  AdvertisingCampaignStatus,
  AdvertisingNetworkKPIs,
} from '../../../types/advertising';
import { advertisingCampaignRepository } from '../../../repositories/advertisingCampaignRepository';
import { advertisingOpportunityRepository } from '../../../repositories/advertisingOpportunityRepository';
import { CampaignCreationWizardModal } from '../components/CampaignCreationWizardModal';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  Tv,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Sparkles,
  SlidersHorizontal,
  DollarSign,
  Play,
  Pause,
  Trash2,
  Receipt,
  X,
  Download,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';

export interface CampaignsListPageProps {
  onNavigateToDetail: (campaignId: string) => void;
  onNavigateToMarketplace?: () => void;
  onNavigateToNewCampaign?: () => void;
}

export const CampaignsListPage: React.FC<CampaignsListPageProps> = ({
  onNavigateToDetail,
  onNavigateToMarketplace,
  onNavigateToNewCampaign
}) => {
  const { addToast } = useToast();
  const { isNexoraAdmin, isAdvertiser } = useAuth();
  const { currentOrganization } = useSession();
  const [campaigns, setCampaigns] = useState<AdvertisingCampaign[]>([]);
  const [kpis, setKpis] = useState<AdvertisingNetworkKPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AdvertisingCampaignStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [availableOpps, setAvailableOpps] = useState<any[]>([]);
  const [campaignLoopStats, setCampaignLoopStats] = useState<Record<string, { totalLoops: number; todayLoops: number }>>({});

  // Receipt preview modal state
  const [receiptPreview, setReceiptPreview] = useState<{ url: string; campaignName: string } | null>(null);;

  const loadData = async () => {
    setLoading(true);
    try {
      const [campaignList, kpiData, opps] = await Promise.all([
        advertisingCampaignRepository.getAll({
          status: statusFilter,
          search: searchQuery,
          organizationId: currentOrganization?.id && currentOrganization.id !== 'org-nexora' ? currentOrganization.id : undefined,
        }),
        advertisingCampaignRepository.getKPIs(),
        advertisingOpportunityRepository.getAll(),
      ]);
      setCampaigns(campaignList);
      setKpis(kpiData);
      setAvailableOpps(opps);
      setLoading(false);

      // Fetch loop stats asynchronously in background without blocking rendering
      const statsMap: Record<string, { totalLoops: number; todayLoops: number }> = {};
      Promise.all(
        campaignList.map(async (c) => {
          try {
            const res = await fetch(`/api/campaigns/${c.id}/loop-stats`);
            if (res.ok) {
              const data = await res.json();
              statsMap[c.id] = {
                totalLoops: data.totalLoops || 0,
                todayLoops: data.todayLoops || 0,
              };
            }
          } catch (err) {}
        })
      ).then(() => setCampaignLoopStats({ ...statsMap }));
    } catch (error) {
      console.error('Failed to load campaigns data', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, searchQuery, currentOrganization]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const socket = (window as any).io ? (window as any).io() : null;
    if (!socket) return;

    const handleImpression = (data: { campaignId: string; deliveredImpressions: number }) => {
      if (!data?.campaignId) return;
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === data.campaignId
            ? { ...c, deliveredImpressions: data.deliveredImpressions }
            : c
        )
      );
      setCampaignLoopStats((prev) => {
        const current = prev[data.campaignId] || { totalLoops: 0, todayLoops: 0 };
        return {
          ...prev,
          [data.campaignId]: {
            totalLoops: data.deliveredImpressions || current.totalLoops + 1,
            todayLoops: current.todayLoops + 1,
          },
        };
      });
    };

    socket.on('campaign:impression_update', handleImpression);
    socket.on('playback:loop_update', (data: any) => {
      if (data?.campaignId) {
        handleImpression({ campaignId: data.campaignId, deliveredImpressions: data.deliveredImpressions });
      }
    });

    return () => {
      socket.off('campaign:impression_update', handleImpression);
    };
  }, []);

  const handleToggleCampaignStatus = async (campaign: AdvertisingCampaign, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newStatus: AdvertisingCampaignStatus = campaign.status === 'LIVE' ? 'PAUSED' : 'LIVE';
      const updated = await advertisingCampaignRepository.updateStatus(campaign.id, newStatus);
      setCampaigns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      addToast({
        title: newStatus === 'LIVE' ? 'Campanha retomada' : 'Campanha pausada',
        description: `A veiculação de ${campaign.name} foi ${newStatus === 'LIVE' ? 'reativada' : 'temporariamente suspensa'}.`,
        type: 'info',
      });
    } catch (error) {
      addToast({
        title: 'Erro ao alterar status',
        description: 'Não foi possível alterar o status da campanha.',
        type: 'error',
      });
    }
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(val) + ' Kz';
  };

  const getStatusBadge = (status: AdvertisingCampaignStatus) => {
    switch (status) {
      case 'LIVE':
        return <Badge variant="online" size="sm" dot>No Ar (Em Exibição)</Badge>;
      case 'SCHEDULED':
        return <Badge variant="scheduled" size="sm" dot>Agendada</Badge>;
      case 'PENDING_PAYMENT':
        return <Badge variant="warning" size="sm" dot>Aguardando Pagamento</Badge>;
      case 'PENDING_REVIEW':
        return <Badge variant="warning" size="sm" dot>Aguardando Validação</Badge>;
      case 'APPROVED':
        return <Badge variant="active" size="sm">Aprovada</Badge>;
      case 'PAUSED':
        return <Badge variant="paused" size="sm">Pausada</Badge>;
      case 'COMPLETED':
        return <Badge variant="neutral" size="sm">Concluída</Badge>;
      case 'DRAFT':
        return <Badge variant="draft" size="sm">Rascunho</Badge>;
      case 'CANCELLED':
        return <Badge variant="offline" size="sm">Recusada</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{status}</Badge>;
    }
  };

  return (
    <div id="campaigns-list-page-root" className="flex flex-col gap-6 p-6 max-w-7xl mx-auto min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 items-center gap-1 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 px-2.5 py-0.5 text-xs font-semibold text-[#38BDF8]">
              <Megaphone className="w-3.5 h-3.5" />
              Gestão de Mídia & Publicidade
            </span>
            <span className="text-xs text-slate-500">Nexora Advertising</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">
            Campanhas Publicitárias & Veiculações
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Acompanhe o desempenho de veiculação, status de aprovação técnica, comprovantes de exibição (Proof of Play) e orçamentos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onNavigateToMarketplace && (
            <Button
              variant="primary"
              size="md"
              onClick={onNavigateToMarketplace}
              className="bg-[#0284C7] hover:bg-[#0369A1] shadow-lg shadow-[#0284C7]/20 font-bold"
            >
              <Megaphone className="w-4 h-4 mr-1.5" />
              Contratar Mídia no Marketplace
            </Button>
          )}
        </div>
      </div>

      {/* KPI Overview Cards - User Scoped */}
      {(() => {
        const isUserScoped = currentOrganization?.id && currentOrganization.id !== 'org-nexora';
        const userActiveCount = isUserScoped ? campaigns.filter(c => c.status === 'LIVE').length : (kpis?.totalActiveCampaigns || 0);
        const userPendingCount = isUserScoped ? campaigns.filter(c => c.status === 'PENDING_REVIEW' || c.status === 'PENDING_PAYMENT').length : (kpis?.pendingReviewCampaigns || 0);
        const userTotalBudget = isUserScoped ? campaigns.reduce((acc, c) => acc + (c.budget || 0), 0) : (kpis?.totalMonthlyRevenueKz ?? kpis?.estimatedMonthlyRevenueKz ?? 0);
        const userImpressions = isUserScoped ? campaigns.reduce((acc, c) => acc + (c.estimatedImpressions || 0), 0) : (kpis?.dailyImpressionsNetwork ?? kpis?.totalEstimatedDailyImpressions ?? 0);

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Megaphone className="w-3.5 h-3.5 text-[#38BDF8]" />
                Campanhas Ativas
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {userActiveCount}
              </p>
              <span className="text-[11px] text-emerald-400">
                +{userPendingCount} em análise/aprov.
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Eye className="w-3.5 h-3.5 text-[#10B981]" />
                {isUserScoped ? 'Impactos Estimados' : 'Impressões Diárias Rede'}
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {userImpressions.toLocaleString('pt-AO')}
              </p>
              <span className="text-[11px] text-slate-400">
                {isUserScoped ? 'Impactos da sua conta' : `Taxa de ocupação: ${kpis?.networkOccupancyRate}%`}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <Tv className="w-3.5 h-3.5 text-[#06B6D4]" />
                Telas Contratadas
              </span>
              <p className="text-2xl font-black text-white mt-1">
                {isUserScoped 
                  ? Array.from(new Set(campaigns.flatMap(c => c.displays || []))).length 
                  : (kpis?.monetizableDisplays || kpis?.totalInventoryDisplays || kpis?.totalDisplays || 0)}
              </p>
              <span className="text-[11px] text-slate-400">
                {isUserScoped ? 'Displays veiculando suas mídias' : `Rede comercializável (${kpis?.totalDisplaysAvailable ?? 0} livres)`}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#0F172A]/80 p-4 backdrop-blur-md">
              <span className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-[#F59E0B]" />
                {isUserScoped ? 'Investimento Total' : 'Volume Mensal Comercial'}
              </span>
              <p className="text-2xl font-black text-[#38BDF8] mt-1">
                {formatKz(userTotalBudget)}
              </p>
              <span className="text-[11px] text-slate-400">
                {isUserScoped ? 'Investimento na plataforma' : 'Faturamento projetado no mês'}
              </span>
            </div>
          </div>
        );
      })()}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0F172A]/90 p-4">
        {/* Search */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por campanha ou anunciante..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-[#0284C7] focus:outline-none"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto text-xs">
          {[
            { value: 'ALL', label: 'Todas' },
            { value: 'LIVE', label: 'No Ar' },
            { value: 'PENDING_PAYMENT', label: 'Aguardando Pagamento' },
            { value: 'PENDING_REVIEW', label: 'Em Análise / Aprovação' },
            { value: 'SCHEDULED', label: 'Agendadas' },
            { value: 'DRAFT', label: 'Rascunhos' },
            { value: 'COMPLETED', label: 'Concluídas' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value as any)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === tab.value
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <Megaphone className="w-12 h-12 text-slate-600 mb-3" />
          <h3 className="text-lg font-bold text-white">Nenhuma campanha encontrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            Crie sua primeira campanha com slots publicitários em Luanda.
          </p>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsWizardOpen(true)}
            className="mt-4 bg-[#0284C7]"
          >
            Criar Campanha
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((camp) => {
            const stats = campaignLoopStats[camp.id];
            const executedPlays = stats ? stats.totalLoops : (camp.executedPlays || 0);

            // Calculate dynamic target plays if not explicitly set
            let targetPlays = camp.targetPlays;
            if (!targetPlays || targetPlays <= 0) {
              const start = new Date(camp.startDate).getTime();
              const end = new Date(camp.endDate).getTime();
              const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))) || 30;
              const displayCount = Math.max(1, (camp.displays || []).length);
              const freqPerDay = (camp.dailyFrequency || 6) * 16; // loops per day per display (16h operating day)
              targetPlays = days * freqPerDay * displayCount;
            }

            const completion = targetPlays > 0 ? Math.min(100, Math.round((executedPlays / targetPlays) * 100)) : 0;

            return (
              <div
                key={camp.id}
                onClick={() => onNavigateToDetail(camp.id)}
                className="group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-xl border border-slate-800 bg-[#0F172A]/80 p-5 backdrop-blur-md hover:border-[#0284C7]/50 hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Left Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(camp.status)}
                    <span className="text-xs font-bold text-[#38BDF8]">
                      {camp.advertiserName}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">
                      {camp.targetMunicipalities?.join(', ') || 'Luanda'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mt-1 group-hover:text-[#38BDF8] transition-colors truncate">
                    {camp.name}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {camp.description || 'Campanha de veiculação em Digital Signage na rede Nexora.'}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {camp.startDate} até {camp.endDate}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      {camp.dailyFrequency || 6} loops / hora
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-200">
                      <Eye className="w-3.5 h-3.5 text-[#10B981]" />
                      {camp.estimatedImpressions?.toLocaleString('pt-AO')} impressões
                    </span>
                  </div>
                </div>

                {/* Middle Execution Progress (Proof of Play) */}
                <div className="w-full md:w-56 flex flex-col justify-center rounded-lg bg-slate-950/60 p-3 border border-slate-800/80">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-400">Execução de Loops:</span>
                    <span className="text-white font-bold">{completion}%</span>
                  </div>

                  <div className="mt-1.5 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${completion}%` }}
                      className={`h-full transition-all ${
                        camp.status === 'LIVE'
                          ? 'bg-[#10B981]'
                          : camp.status === 'SCHEDULED'
                          ? 'bg-[#06B6D4]'
                          : 'bg-slate-600'
                      }`}
                    />
                  </div>

                  <span className="mt-1 text-[10px] text-slate-500 text-right">
                    {executedPlays.toLocaleString('pt-AO')} de {targetPlays.toLocaleString('pt-AO')} plays
                  </span>
                </div>

                {/* Right Budget & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="block text-[10px] text-slate-500 font-medium uppercase">
                      Investimento
                    </span>
                    <span className="text-base font-extrabold text-[#38BDF8]">
                      {formatKz(camp.budget)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isNexoraAdmin && (camp.status === 'PENDING_REVIEW' || camp.status === 'PENDING_PAYMENT') && (
                      <>
                        {/* Payment receipt preview button when receipt exists */}
                        {((camp as any).payment_receipt_url || camp.paymentReceiptUrl) && (
                          <button
                            type="button"
                            title="Ver Comprovativo de Pagamento"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptPreview({
                                url: (camp as any).payment_receipt_url || camp.paymentReceiptUrl || '',
                                campaignName: camp.name,
                              });
                            }}
                            className="flex h-8 items-center gap-1.5 px-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-xs font-semibold transition-colors"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Comprovativo
                          </button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            try {
                              const res = await fetch(`/api/campaigns/${camp.id}/approve`, { method: 'POST' });
                              if (res.ok) {
                                addToast({
                                  title: 'Campanha Aprovada!',
                                  description: `A campanha ${camp.name} foi aprovada e já está no ar na playlist do display.`,
                                  type: 'success',
                                });
                                loadData();
                              }
                            } catch (err) {
                              addToast({
                                title: 'Erro na aprovação',
                                description: 'Não foi possível aprovar a campanha.',
                                type: 'error',
                              });
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Aprovar &amp; Publicar
                        </Button>
                      </>
                    )}



                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm(`Tem certeza que deseja eliminar a campanha "${camp.name}"?`)) {
                          try {
                            await advertisingCampaignRepository.delete(camp.id);
                            addToast({
                              title: 'Campanha Eliminada',
                              description: `A campanha ${camp.name} foi removida.`,
                              type: 'success',
                            });
                            loadData();
                          } catch (err) {
                            addToast({
                              title: 'Erro ao eliminar',
                              description: 'Não foi possível eliminar a campanha.',
                              type: 'error',
                            });
                          }
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      title="Eliminar Campanha"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigateToDetail(camp.id)}
                      className="border-slate-700 text-xs"
                    >
                      Detalhes
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Wizard Modal */}
      <CampaignCreationWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCampaignCreated={(newCmp) => {
          loadData();
          onNavigateToDetail(newCmp.id);
        }}
        availableOpportunities={availableOpps}
      />

      {/* Payment Receipt Preview Modal */}
      {receiptPreview && (() => {
        const { url, campaignName } = receiptPreview;
        const isPdf = url.toLowerCase().includes('.pdf');
        const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setReceiptPreview(null)}>
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Comprovativo de Pagamento</h3>
                    <span className="text-[11px] text-slate-400">{campaignName}</span>
                  </div>
                </div>
                <button onClick={() => setReceiptPreview(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex items-center justify-center bg-black min-h-[300px]">
                {isImage ? (
                  <img src={url} alt="Comprovativo" className="max-h-[440px] w-full object-contain rounded-lg" />
                ) : isPdf ? (
                  <iframe src={url} title="Comprovativo PDF" className="w-full h-[440px] rounded-lg border-0" />
                ) : (
                  <div className="text-center text-slate-400 py-10">
                    <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-white mb-4">Ficheiro de Comprovativo</p>
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir Ficheiro
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors">
                  <Download className="w-3.5 h-3.5" /> Baixar Comprovativo
                </a>
                <button onClick={() => setReceiptPreview(null)} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
