import React, { useState, useEffect, useCallback } from 'react';
import {
  AdvertiserProfile,
  Contact,
  CRMActivity,
  CustomerLifecycleStage,
  CustomerStatus,
} from '../../../types/crm';
import { Campaign } from '../../../types/domain';
import { NexoraService } from '../../../services';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../../components/ui';
import {
  Briefcase,
  ArrowLeft,
  Megaphone,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Activity,
  Calendar,
  Users,
} from 'lucide-react';
import { CustomerLifecyclePipeline } from '../components/CustomerLifecycleBadge';
import { ContactListCard } from '../components/ContactListCard';
import { AddContactModal } from '../components/AddContactModal';
import { QuickActionsCard } from '../components/QuickActionsCard';
import { CRMActivityTimeline } from '../components/CRMActivityTimeline';
import { useToast } from '../../../components/ui/Toast';

interface AdvertiserDetailPageProps {
  advertiserId: string;
  onBack: () => void;
  onNavigateToCampaigns?: () => void;
}

type TabType = 'overview' | 'campaigns' | 'contacts' | 'budget' | 'activities';

export const AdvertiserDetailPage: React.FC<AdvertiserDetailPageProps> = ({
  advertiserId,
  onBack,
  onNavigateToCampaigns,
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  const [advertiser, setAdvertiser] = useState<AdvertiserProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  // Contact Modal
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);

  const loadAdvertiserData = useCallback(async () => {
    setLoading(true);
    try {
      const profile = await NexoraService.advertisers.getProfileById(advertiserId);
      if (!profile) {
        addToast({ type: 'danger', title: 'Não Encontrado', message: 'Anunciante não localizado.' });
        onBack();
        return;
      }
      setAdvertiser(profile);

      const [fetchedContacts, fetchedActs, fetchedCampaigns] = await Promise.all([
        NexoraService.contacts.getByOrganizationId(profile.organizationId),
        NexoraService.crmActivities.getActivities(20, profile.organizationId),
        NexoraService.advertisers.getCampaigns(profile.organizationId),
      ]);

      setContacts(fetchedContacts);
      setActivities(fetchedActs);
      setCampaigns(fetchedCampaigns);
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao carregar anunciante.' });
    } finally {
      setLoading(false);
    }
  }, [advertiserId, addToast, onBack]);

  useEffect(() => {
    loadAdvertiserData();
  }, [loadAdvertiserData]);

  const handleStageChange = async (newStage: CustomerLifecycleStage) => {
    if (!advertiser) return;
    try {
      const newStatus: CustomerStatus =
        newStage === 'ACTIVE'
          ? 'ACTIVE'
          : newStage === 'PROSPECT' || newStage === 'LEAD'
          ? 'PROSPECT'
          : newStage === 'SUSPENDED'
          ? 'SUSPENDED'
          : 'INACTIVE';

      const updated = await NexoraService.advertisers.updateProfileStatus(advertiser.id, newStatus, newStage);
      setAdvertiser(updated);

      await NexoraService.crmActivities.logActivity({
        actorId: 'usr-mario',
        actorName: 'Mário Silva',
        organizationId: advertiser.organizationId,
        entityType: 'ADVERTISER',
        entityId: advertiser.id,
        entityName: advertiser.tradeName,
        action: 'Ciclo do Anunciante Atualizado',
        description: `Etapa comercial alterada para "${newStage}".`,
      });

      addToast({
        type: 'success',
        title: 'Etapa Atualizada',
        message: `Anunciante agora está na etapa ${newStage}.`,
      });
      loadAdvertiserData();
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao atualizar etapa comercial.' });
    }
  };

  const handleSetPrimaryContact = async (contactId: string) => {
    if (!advertiser) return;
    try {
      const updatedList = await NexoraService.contacts.setPrimary(advertiser.organizationId, contactId);
      setContacts(updatedList);
      addToast({ type: 'success', title: 'Ponto Focal Atualizado', message: 'Contacto principal definido.' });
      loadAdvertiserData();
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao atualizar contacto.' });
    }
  };

  const handleToggleContactStatus = async (contact: Contact) => {
    try {
      const nextStatus = contact.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await NexoraService.contacts.toggleStatus(contact.id, nextStatus);
      addToast({
        type: 'info',
        title: 'Contacto Atualizado',
        message: `${contact.name} agora está ${nextStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}.`,
      });
      loadAdvertiserData();
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao atualizar estado do contacto.' });
    }
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('Kz', '').trim() + ' Kz';
  };

  if (loading && !advertiser) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="h-10 bg-white/5 animate-pulse rounded-lg w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!advertiser) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Back & Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs mb-3 text-[#94A3B8] hover:text-[#F8FAFC]"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onBack}
        >
          Voltar à Lista de Anunciantes
        </Button>

        <PageHeader
          title={advertiser.tradeName}
          description={`${advertiser.legalName} • NIF: ${advertiser.nif} • ${advertiser.municipality}, Luanda`}
          badge={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-300">
                {advertiser.advertiserCode}
              </span>
              <Badge
                variant={advertiser.status === 'ACTIVE' ? 'emerald' : 'amber'}
                size="sm"
              >
                {advertiser.status === 'ACTIVE' ? 'Ativo' : 'Inativo / Suspenso'}
              </Badge>
            </div>
          }
        />
      </div>

      {/* Lifecycle Pipeline */}
      <CustomerLifecyclePipeline
        currentStage={advertiser.lifecycleStage}
        onStageChange={handleStageChange}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Briefcase, count: undefined },
          { id: 'campaigns', label: 'Campanhas & Mídia', icon: Megaphone, count: campaigns.length },
          { id: 'contacts', label: 'Gestores de Conta & Mídia', icon: Users, count: contacts.length },
          { id: 'budget', label: 'Orçamento & Créditos IA', icon: CreditCard, count: undefined },
          { id: 'activities', label: 'Atividade & Auditoria', icon: Activity, count: activities.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-[#94A3B8]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card glow="none" className="p-3.5">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] mb-1">
                    <span>Campanhas Ativas</span>
                    <Megaphone className="w-3.5 h-3.5 text-pink-400" />
                  </div>
                  <p className="text-xl font-bold text-[#F8FAFC]">{advertiser.activeCampaignsCount || campaigns.length}</p>
                  <p className="text-[10px] text-[#64748B]">Na rede de telas</p>
                </CardContent>
              </Card>

              <Card glow="none" className="p-3.5">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] mb-1">
                    <span>Orçamento Mensal</span>
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-lg font-bold text-emerald-400 truncate">
                    {formatKz(advertiser.monthlyBudgetEstimateKz)}
                  </p>
                  <p className="text-[10px] text-[#64748B]">Estimativa em AOA</p>
                </CardContent>
              </Card>

              <Card glow="none" className="p-3.5">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] mb-1">
                    <span>Créditos de IA</span>
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold text-purple-400">{advertiser.aiCreditsRemaining || 0}</p>
                  <p className="text-[10px] text-[#64748B]">Para geração de mídias</p>
                </CardContent>
              </Card>

              <Card glow="none" className="p-3.5">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] mb-1">
                    <span>Contactos</span>
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <p className="text-xl font-bold text-[#F8FAFC]">{contacts.length}</p>
                  <p className="text-[10px] text-[#64748B]">Gestores da conta</p>
                </CardContent>
              </Card>
            </div>

            {/* Cadastro Institucional */}
            <Card glow="none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-pink-400" />
                  Ficha Cadastral da Marca / Anunciante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Nome Comercial / Marca</span>
                    <span className="font-semibold text-[#F8FAFC]">{advertiser.tradeName}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">Razão Social (Legal)</span>
                    <span className="font-semibold text-[#CBD5E1]">{advertiser.legalName}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">NIF (Angola)</span>
                    <span className="font-mono text-[#CBD5E1]">{advertiser.nif}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">Segmento de Mercado</span>
                    <Badge variant="cyan" size="sm">
                      {advertiser.industry}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">Canal de Origem</span>
                    <span className="text-[#CBD5E1]">{advertiser.leadSource}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">Data de Registo</span>
                    <span className="text-[#CBD5E1]">
                      {new Date(advertiser.createdAt).toLocaleDateString('pt-AO')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <span className="text-[#64748B] text-xs block mb-1">Sede / Endereço Comercial</span>
                  <div className="flex items-start gap-2 text-xs text-[#CBD5E1]">
                    <MapPin className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#F8FAFC]">{advertiser.address}</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Município de {advertiser.municipality}, Província de {advertiser.city}, {advertiser.country}
                      </p>
                    </div>
                  </div>
                </div>

                {advertiser.notes && (
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[#64748B] text-xs block mb-1">Notas Comerciais & Estratégia</span>
                    <p className="text-xs text-[#94A3B8] bg-white/[0.02] p-3 rounded-xl border border-white/5 leading-relaxed">
                      {advertiser.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contacts list */}
            <ContactListCard
              contacts={contacts}
              onAddContact={() => {
                setContactToEdit(null);
                setIsAddContactModalOpen(true);
              }}
              onEditContact={(contact) => {
                setContactToEdit(contact);
                setIsAddContactModalOpen(true);
              }}
              onSetPrimary={handleSetPrimaryContact}
              onToggleStatus={handleToggleContactStatus}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <QuickActionsCard
              type="ADVERTISER"
              onAddContact={() => {
                setContactToEdit(null);
                setIsAddContactModalOpen(true);
              }}
              onEditProfile={() => {
                addToast({ type: 'info', title: 'Edição', message: 'Abrindo formulário de anunciante...' });
              }}
              onViewCampaigns={onNavigateToCampaigns}
              onViewAICredits={() => setActiveTab('budget')}
              onViewContracts={() => setActiveTab('budget')}
            />

            {/* Primary Contact */}
            {advertiser.primaryContact && (
              <Card glow="none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-400" />
                    Ponto Focal de Mídia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      {advertiser.primaryContact.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#F8FAFC]">
                        {advertiser.primaryContact.name}
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">{advertiser.primaryContact.role}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-[#CBD5E1]">
                    {advertiser.primaryContact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                        <a
                          href={`mailto:${advertiser.primaryContact.email}`}
                          className="hover:text-pink-400 truncate"
                        >
                          {advertiser.primaryContact.email}
                        </a>
                      </div>
                    )}
                    {advertiser.primaryContact.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{advertiser.primaryContact.phone}</span>
                        </div>
                        {advertiser.primaryContact.whatsapp && (
                          <a
                            href={`https://wa.me/${advertiser.primaryContact.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-emerald-400 hover:underline"
                          >
                            WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activities Timeline */}
            <CRMActivityTimeline activities={activities.slice(0, 5)} />
          </div>
        </div>
      )}

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <Card glow="none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-pink-400" />
                Campanhas Publicitárias na Rede Nexora ({campaigns.length})
              </CardTitle>
              {onNavigateToCampaigns && (
                <Button variant="cyan" size="sm" onClick={onNavigateToCampaigns}>
                  Criar Nova Campanha
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <Megaphone className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-[#F8FAFC]">Nenhuma campanha cadastrada</p>
                <p className="text-xs text-[#94A3B8]">Crie veiculações de mídia para os displays disponíveis.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-[#F8FAFC]">{camp.name}</p>
                        <Badge
                          variant={
                            camp.status === 'ACTIVE'
                              ? 'emerald'
                              : camp.status === 'SCHEDULED'
                              ? 'cyan'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {camp.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#64748B]">
                        <span>Telas: {camp.displayCount || camp.displays?.length || 0}</span>
                        <span>•</span>
                        <span>
                          Período: {camp.startDate} até {camp.endDate}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {camp.budget ? formatKz(camp.budget) : 'Orçamento Ativo'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <ContactListCard
          contacts={contacts}
          onAddContact={() => {
            setContactToEdit(null);
            setIsAddContactModalOpen(true);
          }}
          onEditContact={(contact) => {
            setContactToEdit(contact);
            setIsAddContactModalOpen(true);
          }}
          onSetPrimary={handleSetPrimaryContact}
          onToggleStatus={handleToggleContactStatus}
        />
      )}

      {/* Budget Tab */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card glow="none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Orçamento Publicitário Estimado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <span className="text-[#64748B] text-[11px]">Investimento Mensal Previsto</span>
                <p className="text-xl font-bold text-emerald-400 font-mono">
                  {formatKz(advertiser.monthlyBudgetEstimateKz)}
                </p>
                <p className="text-[11px] text-[#64748B]">Faturação direta em Kwanzas (AOA)</p>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Condição de Pagamento:</span>
                  <span className="text-[#CBD5E1]">Pré-pago / 30 dias após veiculação</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#94A3B8]">Relatórios de Prova de Exibição:</span>
                  <span className="text-emerald-400 font-semibold">Incluído (Proof of Play)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card glow="none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Créditos de Produção Criativa com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                <span className="text-purple-300 text-[11px]">Saldo Disponível</span>
                <p className="text-xl font-bold text-purple-400 font-mono">
                  {advertiser.aiCreditsRemaining || 0} Créditos
                </p>
                <p className="text-[11px] text-[#94A3B8]">
                  Permite gerar vídeos dinâmicos, spots e adaptação automática para displays em Luanda.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <CRMActivityTimeline activities={activities} />
      )}

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddContactModalOpen}
        onClose={() => {
          setIsAddContactModalOpen(false);
          setContactToEdit(null);
        }}
        organizationId={advertiser.organizationId}
        organizationName={advertiser.tradeName}
        contactToEdit={contactToEdit}
        onSuccess={() => {
          loadAdvertiserData();
        }}
      />
    </div>
  );
};
