import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AdvertiserProfile,
  AdvertiserKPIs,
  CustomerStatus,
  CustomerLifecycleStage,
  ANGOLA_MUNICIPALITIES,
  ADVERTISER_INDUSTRIES,
  LIFECYCLE_STAGE_LABELS,
} from '../../../types/crm';
import { NexoraService } from '../../../services';
import { useSession } from '../../../context/SessionContext';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Button,
  Input,
  Select,
  Badge,
  Card,
  Dropdown,
  IconButton,
} from '../../../components/ui';
import {
  Briefcase,
  UserPlus,
  Search,
  Filter,
  Megaphone,
  MoreVertical,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AdvertiserKpiCards } from '../components/AdvertiserKpiCards';
import { CustomerLifecycleBadge } from '../components/CustomerLifecycleBadge';
import { CreateAdvertiserModal } from '../components/CreateAdvertiserModal';
import { useToast } from '../../../components/ui/Toast';

interface AdvertisersListPageProps {
  onNavigateToDetail: (advertiserId: string) => void;
}

export const AdvertisersListPage: React.FC<AdvertisersListPageProps> = ({ onNavigateToDetail }) => {
  const { currentOrganization } = useSession();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [advertisers, setAdvertisers] = useState<AdvertiserProfile[]>([]);
  const [kpis, setKpis] = useState<AdvertiserKPIs>({
    totalAdvertisers: 0,
    activeAdvertisers: 0,
    prospectAdvertisers: 0,
    activeCampaigns: 0,
    estimatedMonthlyInvestmentKz: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('ALL');
  const [municipalityFilter, setMunicipalityFilter] = useState<string>('ALL');
  const [industryFilter, setIndustryFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isNexoraInternal = currentOrganization?.type === 'NEXORA';
  const orgFilterId = isNexoraInternal ? undefined : currentOrganization?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedProfiles, fetchedKpis] = await Promise.all([
        NexoraService.advertisers.getAllProfiles({
          organizationId: orgFilterId,
        }),
        NexoraService.advertisers.getProfileKPIs(orgFilterId),
      ]);
      setAdvertisers(fetchedProfiles);
      setKpis(fetchedKpis);
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao carregar anunciantes.' });
    } finally {
      setLoading(false);
    }
  }, [orgFilterId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredAdvertisers = useMemo(() => {
    return advertisers.filter((adv) => {
      if (statusFilter !== 'ALL' && adv.status !== statusFilter) return false;
      if (lifecycleFilter !== 'ALL' && adv.lifecycleStage !== lifecycleFilter) return false;
      if (municipalityFilter !== 'ALL' && adv.municipality.toLowerCase() !== municipalityFilter.toLowerCase()) return false;
      if (industryFilter !== 'ALL' && adv.industry.toLowerCase() !== industryFilter.toLowerCase()) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const contactName = adv.primaryContact?.name.toLowerCase() || '';
        const contactPhone = adv.primaryContact?.phone.toLowerCase() || '';
        const match =
          adv.tradeName.toLowerCase().includes(q) ||
          adv.legalName.toLowerCase().includes(q) ||
          adv.advertiserCode.toLowerCase().includes(q) ||
          adv.nif.includes(q) ||
          adv.phone.toLowerCase().includes(q) ||
          adv.email.toLowerCase().includes(q) ||
          adv.municipality.toLowerCase().includes(q) ||
          contactName.includes(q) ||
          contactPhone.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [advertisers, searchTerm, statusFilter, lifecycleFilter, municipalityFilter, industryFilter]);

  const handleToggleStatus = async (adv: AdvertiserProfile) => {
    const nextStatus: CustomerStatus = adv.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const nextStage: CustomerLifecycleStage = nextStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      await NexoraService.advertisers.updateProfileStatus(adv.id, nextStatus, nextStage);
      await NexoraService.crmActivities.logActivity({
        actorId: 'usr-mario',
        actorName: 'Mário Silva',
        organizationId: adv.organizationId,
        entityType: 'ADVERTISER',
        entityId: adv.id,
        entityName: adv.tradeName,
        action: nextStatus === 'ACTIVE' ? 'Anunciante Reativado' : 'Anunciante Suspenso',
        description: `Estado do anunciante ${adv.tradeName} alterado para ${nextStatus}.`,
      });
      addToast({
        type: 'info',
        title: 'Estado Atualizado',
        message: `${adv.tradeName} agora está ${nextStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}.`,
      });
      loadData();
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao alterar estado do anunciante.' });
    }
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('Kz', '').trim() + ' Kz';
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <PageHeader
        title="CRM de Anunciantes & Agências"
        description="Gestão de marcas parceiras, orçamentos publicitários, campanhas e pontos focais de mídia."
        badge={
          <Badge variant="cyan" size="sm">
            {advertisers.length} Anunciantes Cadastrados
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={loadData}
              disabled={loading}
            >
              Atualizar
            </Button>
            <Button
              variant="cyan"
              size="sm"
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Novo Anunciante
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <AdvertiserKpiCards kpis={kpis} loading={loading} />

      {/* Filter Toolbar */}
      <Card glow="none" className="p-4">
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Pesquisar por marca, agência, NIF, código, contacto ou município..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-[#64748B]" />}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Todos os Estados' },
                  { value: 'ACTIVE', label: 'Ativos' },
                  { value: 'PROSPECT', label: 'Prospects' },
                  { value: 'INACTIVE', label: 'Inativos' },
                ]}
              />

              <Select
                value={lifecycleFilter}
                onChange={(e) => setLifecycleFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Todos os Ciclos' },
                  ...Object.entries(LIFECYCLE_STAGE_LABELS).map(([k, v]) => ({
                    value: k,
                    label: `${v.step}. ${v.label}`,
                  })),
                ]}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5 text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1 font-medium text-[#CBD5E1]">
              <Filter className="w-3 h-3 text-[#EC4899]" />
              Filtros Rápidos:
            </span>

            <div className="w-36">
              <Select
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Município (Todos)' },
                  ...ANGOLA_MUNICIPALITIES.map((m) => ({ value: m, label: m })),
                ]}
              />
            </div>

            <div className="w-44">
              <Select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Segmento (Todos)' },
                  ...ADVERTISER_INDUSTRIES.map((ind) => ({ value: ind, label: ind })),
                ]}
              />
            </div>

            {(searchTerm ||
              statusFilter !== 'ALL' ||
              lifecycleFilter !== 'ALL' ||
              municipalityFilter !== 'ALL' ||
              industryFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#EC4899] hover:underline ml-auto"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setLifecycleFilter('ALL');
                  setMunicipalityFilter('ALL');
                  setIndustryFilter('ALL');
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Advertisers Table */}
      <Card glow="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-[#94A3B8] border-b border-white/5 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Marca / Anunciante</th>
                <th className="py-3.5 px-3">Código</th>
                <th className="py-3.5 px-3">Segmento & Sede</th>
                <th className="py-3.5 px-3">Campanhas</th>
                <th className="py-3.5 px-3">Orçamento Mensal</th>
                <th className="py-3.5 px-3">Ciclo Comercial</th>
                <th className="py-3.5 px-3">Ponto Focal Mídia</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={8} className="py-4 px-4">
                      <div className="h-6 bg-white/5 rounded" />
                    </td>
                  </tr>
                ))
              ) : filteredAdvertisers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Briefcase className="w-10 h-10 text-[#64748B] mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-[#F8FAFC]">Nenhum anunciante encontrado</p>
                    <p className="text-xs text-[#94A3B8] mt-1">Registe uma nova marca ou agência parceira.</p>
                    <Button
                      variant="cyan"
                      size="sm"
                      className="mt-4"
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Cadastrar Anunciante
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredAdvertisers.map((adv) => {
                  const activeCamps = adv.activeCampaignsCount || 0;

                  return (
                    <tr
                      key={adv.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => onNavigateToDetail(adv.id)}
                    >
                      {/* Name & Trade */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-950 to-[#1E293B] border border-pink-500/20 flex items-center justify-center text-xs font-bold text-pink-400 flex-shrink-0 group-hover:border-pink-500/40 transition-colors">
                            {adv.tradeName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-sm text-[#F8FAFC] group-hover:text-pink-400 transition-colors truncate block">
                              {adv.tradeName}
                            </span>
                            <span className="text-[11px] text-[#64748B] truncate block">
                              {adv.legalName} • NIF: {adv.nif}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/5 text-[#CBD5E1] border border-white/10">
                          {adv.advertiserCode}
                        </span>
                      </td>

                      {/* Industry & Municipality */}
                      <td className="py-3.5 px-3">
                        <span className="text-xs text-[#CBD5E1] block font-medium">
                          {adv.industry}
                        </span>
                        <span className="text-[11px] text-[#64748B] block truncate">
                          {adv.municipality}, Luanda
                        </span>
                      </td>

                      {/* Campaigns */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Megaphone className="w-3.5 h-3.5 text-pink-400" />
                          <span className="text-xs font-bold text-[#F8FAFC]">{activeCamps} ativas</span>
                        </div>
                        <span className="text-[10px] text-[#64748B] block">
                          {adv.totalCampaignsCount || activeCamps} veiculações
                        </span>
                      </td>

                      {/* Monthly Budget */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-xs font-bold text-emerald-400 block">
                          {formatKz(adv.monthlyBudgetEstimateKz)}
                        </span>
                        <span className="text-[10px] text-[#64748B] flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                          {adv.aiCreditsRemaining || 0} créditos IA
                        </span>
                      </td>

                      {/* Lifecycle Stage */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <CustomerLifecycleBadge stage={adv.lifecycleStage} size="sm" />
                      </td>

                      {/* Primary Contact */}
                      <td className="py-3.5 px-3">
                        {adv.primaryContact ? (
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-[#F8FAFC] block truncate">
                              {adv.primaryContact.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                              <span className="truncate">{adv.primaryContact.phone}</span>
                              {adv.primaryContact.email && (
                                <a
                                  href={`mailto:${adv.primaryContact.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-pink-400"
                                  title={adv.primaryContact.email}
                                >
                                  <Mail className="w-3 h-3" />
                                </a>
                              )}
                              {adv.primaryContact.phone && (
                                <a
                                  href={`tel:${adv.primaryContact.phone}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-emerald-400"
                                  title="Ligar"
                                >
                                  <Phone className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#64748B] italic">Sem ponto focal</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Dropdown
                          trigger={
                            <IconButton variant="ghost" size="sm" aria-label="Ações do anunciante">
                              <MoreVertical className="w-3.5 h-3.5 text-[#94A3B8]" />
                            </IconButton>
                          }
                          items={[
                            {
                              label: 'Ver Ficha do Anunciante',
                              icon: <Eye className="w-3.5 h-3.5 text-pink-400" />,
                              onClick: () => onNavigateToDetail(adv.id),
                            },
                            {
                              label: 'Editar Cadastro',
                              icon: <Edit2 className="w-3.5 h-3.5 text-blue-400" />,
                              onClick: () => onNavigateToDetail(adv.id),
                            },
                            {
                              label: adv.status === 'ACTIVE' ? 'Suspender Anunciante' : 'Ativar Anunciante',
                              icon:
                                adv.status === 'ACTIVE' ? (
                                  <XCircle className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ),
                              onClick: () => handleToggleStatus(adv),
                            },
                            {
                              label: 'Excluir Anunciante',
                              icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
                              onClick: async () => {
                                if (window.confirm(`Tem certeza que deseja apagar ${adv.tradeName}?`)) {
                                  try {
                                    await NexoraService.advertisers.deleteProfile(adv.id);
                                    addToast({ type: 'success', title: 'Excluído', message: 'Anunciante removido com sucesso.' });
                                    loadData();
                                  } catch (e) {
                                    addToast({ type: 'danger', title: 'Erro', message: 'Falha ao excluir anunciante.' });
                                  }
                                }
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Advertiser Modal */}
      <CreateAdvertiserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
