import React, { useState, useEffect, useCallback } from 'react';
import {
  CustomerProfile,
  Contact,
  CRMActivity,
  CustomerLifecycleStage,
  CustomerStatus,
} from '../../../types/crm';
import { Display, ContentItem, Playlist, Schedule } from '../../../types/domain';
import { NexoraService } from '../../../services';
import { PageHeader } from '../../../components/layout/PageHeader';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  IconButton,
} from '../../../components/ui';
import {
  Building2,
  ArrowLeft,
  Monitor,
  ListOrdered,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
} from 'lucide-react';
import { CustomerLifecyclePipeline } from '../components/CustomerLifecycleBadge';
import { ContactListCard } from '../components/ContactListCard';
import { AddContactModal } from '../components/AddContactModal';
import { QuickActionsCard } from '../components/QuickActionsCard';
import { CRMActivityTimeline } from '../components/CRMActivityTimeline';
import { useToast } from '../../../components/ui/Toast';
import { SubscriptionUsageSummary } from '../../../types/saas';
import { CommercialModelBadge } from '../../saas/components/CommercialModelBadge';
import { SubscriptionStatusBadge } from '../../saas/components/SubscriptionStatusBadge';
import { SubscriptionUsageCards } from '../../saas/components/SubscriptionUsageCards';
import { PlanFeatureGrid } from '../../saas/components/PlanFeatureGrid';
import { formatDate } from '../../saas/utils/saasFormatters';

interface ClientDetailPageProps {
  customerId: string;
  onBack: () => void;
  onNavigateToDisplay?: (displayId: string) => void;
  onNavigateToPlaylist?: (playlistId: string) => void;
}

type TabType =
  | 'overview'
  | 'displays'
  | 'contents'
  | 'playlists'
  | 'schedules'
  | 'contacts'
  | 'plan'
  | 'activities';

export const ClientDetailPage: React.FC<ClientDetailPageProps> = ({
  customerId,
  onBack,
  onNavigateToDisplay,
  onNavigateToPlaylist,
}) => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<CRMActivity[]>([]);
  const [displays, setDisplays] = useState<Display[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionUsageSummary | null>(null);

  // Contact Modal
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [contactToEdit, setContactToEdit] = useState<Contact | null>(null);

  const loadCustomerData = useCallback(async () => {
    setLoading(true);
    try {
      const cust = await NexoraService.customers.getById(customerId);
      if (!cust) {
        addToast({ type: 'danger', title: 'Não Encontrado', message: 'Cliente não localizado.' });
        onBack();
        return;
      }
      setCustomer(cust);

      // Fetch related data in parallel
      const [fetchedContacts, fetchedActs, fetchedDisplays, fetchedContents, fetchedPlaylists, fetchedSchedules, fetchedSubSummary] =
        await Promise.all([
          NexoraService.contacts.getByOrganizationId(cust.organizationId),
          NexoraService.crmActivities.getActivities(20, cust.organizationId),
          NexoraService.displays.getAll({ organizationId: cust.organizationId }),
          NexoraService.contents.getAll({ organizationId: cust.organizationId }),
          NexoraService.playlists.getAll({ organizationId: cust.organizationId }),
          NexoraService.schedules.getAll({ organizationId: cust.organizationId }),
          NexoraService.subscriptions.getUsageSummary(cust.organizationId).catch(() => null),
        ]);

      setContacts(fetchedContacts);
      setActivities(fetchedActs);
      setDisplays(fetchedDisplays);
      setContents(fetchedContents);
      setPlaylists(fetchedPlaylists);
      setSchedules(fetchedSchedules);
      setSubscriptionSummary(fetchedSubSummary);
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao carregar os dados do cliente.' });
    } finally {
      setLoading(false);
    }
  }, [customerId, addToast, onBack]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleStageChange = async (newStage: CustomerLifecycleStage) => {
    if (!customer) return;
    try {
      const newStatus: CustomerStatus =
        newStage === 'ACTIVE'
          ? 'ACTIVE'
          : newStage === 'PROSPECT' || newStage === 'LEAD'
          ? 'PROSPECT'
          : newStage === 'SUSPENDED'
          ? 'SUSPENDED'
          : 'INACTIVE';

      const updated = await NexoraService.customers.updateStatus(customer.id, newStatus, newStage);
      setCustomer(updated);

      await NexoraService.crmActivities.logActivity({
        actorId: 'usr-mario',
        actorName: 'Mário Silva',
        organizationId: customer.organizationId,
        entityType: 'CUSTOMER',
        entityId: customer.id,
        entityName: customer.tradeName,
        action: 'Etapa Comercial Atualizada',
        description: `Ciclo de vida do cliente avançado para "${newStage}".`,
      });

      addToast({
        type: 'success',
        title: 'Etapa Atualizada',
        message: `Cliente agora está na etapa ${newStage}.`,
      });
      loadCustomerData();
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao atualizar etapa comercial.' });
    }
  };

  const handleSetPrimaryContact = async (contactId: string) => {
    if (!customer) return;
    try {
      const updatedList = await NexoraService.contacts.setPrimary(customer.organizationId, contactId);
      setContacts(updatedList);
      addToast({ type: 'success', title: 'Ponto Focal Atualizado', message: 'Contacto principal definido com sucesso.' });
      loadCustomerData();
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Não foi possível definir o contacto principal.' });
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
      loadCustomerData();
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

  if (loading && !customer) {
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

  if (!customer) return null;

  const onlineDisplaysCount = displays.filter((d) => d.status === 'ONLINE').length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs mb-3 text-[#94A3B8] hover:text-[#F8FAFC]"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onBack}
        >
          Voltar à Lista de Clientes
        </Button>

        <PageHeader
          title={customer.tradeName}
          description={`${customer.legalName} • NIF: ${customer.nif} • ${customer.municipality}, ${customer.city}`}
          badge={
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[#CBD5E1]">
                {customer.customerCode}
              </span>
              <Badge
                variant={customer.status === 'ACTIVE' ? 'emerald' : 'amber'}
                size="sm"
              >
                {customer.status === 'ACTIVE' ? 'Ativo' : 'Inativo / Suspenso'}
              </Badge>
            </div>
          }
        />
      </div>

      {/* Lifecycle Stage Pipeline */}
      <CustomerLifecyclePipeline
        currentStage={customer.lifecycleStage}
        onStageChange={handleStageChange}
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 border-b border-white/10 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Visão Geral', icon: Building2, count: undefined },
          { id: 'displays', label: 'Displays Alocados', icon: Monitor, count: displays.length },
          { id: 'contents', label: 'Biblioteca de Mídias', icon: Layers, count: contents.length },
          { id: 'playlists', label: 'Playlists', icon: ListOrdered, count: playlists.length },
          { id: 'schedules', label: 'Programação', icon: Calendar, count: schedules.length },
          { id: 'contacts', label: 'Equipa & Contactos', icon: Users, count: contacts.length },
          { id: 'plan', label: 'Plano & Contrato', icon: CreditCard, count: undefined },
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
                  ? 'bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/30'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-[#06B6D4]/20 text-[#06B6D4]' : 'bg-white/10 text-[#94A3B8]'
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
                    <span>Telas no Local</span>
                    <Monitor className="w-3.5 h-3.5 text-[#06B6D4]" />
                  </div>
                  <p className="text-xl font-bold text-[#F8FAFC]">{displays.length}</p>
                  <p className="text-[10px] text-emerald-400 font-medium">{onlineDisplaysCount} online</p>
                </CardContent>
              </Card>

              <Card glow="none" className="p-3.5">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] mb-1">
                    <span>Playlists Ativas</span>
                    <ListOrdered className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <p className="text-xl font-bold text-[#F8FAFC]">{playlists.length}</p>
                  <p className="text-[10px] text-[#64748B]">Grades de mídia</p>
                </CardContent>
              </Card>

              <Card glow="none" className="p-3.5">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] mb-1">
                    <span>Programações</span>
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-xl font-bold text-[#F8FAFC]">{schedules.length}</p>
                  <p className="text-[10px] text-[#64748B]">Slots temporais</p>
                </CardContent>
              </Card>

              <Card glow="none" className="p-3.5">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between text-[#94A3B8] text-[11px] mb-1">
                    <span>Mensalidade</span>
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-lg font-bold text-emerald-400 truncate">{formatKz(customer.monthlyFeeKz)}</p>
                  <p className="text-[10px] text-[#64748B]">{customer.planName}</p>
                </CardContent>
              </Card>
            </div>

            {/* Cadastro & Informações Institucionais */}
            <Card glow="none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#06B6D4]" />
                  Dados Cadastrais da Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#64748B] block mb-0.5">Nome Comercial / Fantasia</span>
                    <span className="font-semibold text-[#F8FAFC]">{customer.tradeName}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">Razão Social (Legal)</span>
                    <span className="font-semibold text-[#CBD5E1]">{customer.legalName}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">NIF (Angola)</span>
                    <span className="font-mono text-[#CBD5E1]">{customer.nif}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">Segmento de Negócio</span>
                    <Badge variant="cyan" size="sm">
                      {customer.industry}
                    </Badge>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">Canal de Captação (Lead Source)</span>
                    <span className="text-[#CBD5E1]">{customer.leadSource}</span>
                  </div>

                  <div>
                    <span className="text-[#64748B] block mb-0.5">Data de Registo</span>
                    <span className="text-[#CBD5E1]">
                      {new Date(customer.createdAt).toLocaleDateString('pt-AO')}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5">
                  <span className="text-[#64748B] text-xs block mb-1">Localização Física</span>
                  <div className="flex items-start gap-2 text-xs text-[#CBD5E1]">
                    <MapPin className="w-4 h-4 text-[#06B6D4] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-[#F8FAFC]">{customer.address}</p>
                      <p className="text-[11px] text-[#94A3B8]">
                        Município de {customer.municipality}, Província de {customer.city}, {customer.country}
                      </p>
                    </div>
                  </div>
                </div>

                {customer.notes && (
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[#64748B] text-xs block mb-1">Notas Comerciais Internas</span>
                    <p className="text-xs text-[#94A3B8] bg-white/[0.02] p-3 rounded-xl border border-white/5 leading-relaxed">
                      {customer.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact List */}
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

          {/* Side Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActionsCard
              type="CLIENT"
              onAddContact={() => {
                setContactToEdit(null);
                setIsAddContactModalOpen(true);
              }}
              onEditProfile={() => {
                addToast({ type: 'info', title: 'Edição', message: 'Abrindo formulário de edição de cliente...' });
              }}
              onViewDisplays={() => setActiveTab('displays')}
              onViewPlaylists={() => setActiveTab('playlists')}
              onViewSchedules={() => setActiveTab('schedules')}
              onViewContracts={() => setActiveTab('plan')}
            />

            {/* Primary Contact Card */}
            {customer.primaryContact && (
              <Card glow="none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#06B6D4]" />
                    Ponto Focal Principal
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#06B6D4] to-[#2563EB] text-white flex items-center justify-center font-bold text-sm">
                      {customer.primaryContact.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#F8FAFC]">
                        {customer.primaryContact.name}
                      </p>
                      <p className="text-[11px] text-[#94A3B8]">{customer.primaryContact.role}</p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-[#CBD5E1]">
                    {customer.primaryContact.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#64748B]" />
                        <a
                          href={`mailto:${customer.primaryContact.email}`}
                          className="hover:text-[#06B6D4] truncate"
                        >
                          {customer.primaryContact.email}
                        </a>
                      </div>
                    )}
                    {customer.primaryContact.phone && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#64748B]" />
                          <span>{customer.primaryContact.phone}</span>
                        </div>
                        {customer.primaryContact.whatsapp && (
                          <a
                            href={`https://wa.me/${customer.primaryContact.whatsapp.replace(/[^0-9]/g, '')}`}
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

            {/* Recent Timeline */}
            <CRMActivityTimeline activities={activities.slice(0, 5)} />
          </div>
        </div>
      )}

      {/* Displays Tab */}
      {activeTab === 'displays' && (
        <Card glow="none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#06B6D4]" />
                Displays Instalados neste Cliente ({displays.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {displays.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <Monitor className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-[#F8FAFC]">Nenhum display alocado</p>
                <p className="text-xs text-[#94A3B8]">Associe telas da rede Nexora a este espaço comercial.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {displays.map((display) => (
                  <div
                    key={display.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-semibold text-xs text-[#F8FAFC] block">{display.name}</span>
                        <span className="text-[11px] text-[#64748B]">{display.location}</span>
                      </div>
                      <Badge
                        variant={display.status === 'ONLINE' ? 'emerald' : 'danger'}
                        size="sm"
                        className="text-[10px]"
                      >
                        {display.status}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-xs text-[#94A3B8] pt-2 border-t border-white/5">
                      <div className="flex items-center justify-between">
                        <span>Resolução:</span>
                        <span className="font-mono text-[#CBD5E1]">{display.resolution}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Orientação:</span>
                        <span className="text-[#CBD5E1]">{display.orientation}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Último Ping:</span>
                        <span className="text-[#64748B]">
                          {display.lastPing ? new Date(display.lastPing).toLocaleTimeString('pt-AO') : 'Recente'}
                        </span>
                      </div>
                    </div>

                    {onNavigateToDisplay && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 text-xs text-[#06B6D4]"
                        onClick={() => onNavigateToDisplay(display.id)}
                      >
                        Monitorizar Display
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contents Tab */}
      {activeTab === 'contents' && (
        <Card glow="none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#06B6D4]" />
              Biblioteca de Mídias & Conteúdos ({contents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contents.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <Layers className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-[#F8FAFC]">Nenhum conteúdo na biblioteca</p>
                <p className="text-xs text-[#94A3B8]">Faça upload de vídeos e imagens para este cliente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {contents.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="aspect-video bg-black/40 rounded-lg mb-2 overflow-hidden flex items-center justify-center relative">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-[#64748B]" />
                      )}
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-mono text-white">
                        {item.duration}s
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[#F8FAFC] truncate">{item.title}</p>
                    <p className="text-[10px] text-[#64748B]">{item.type} • {item.resolution}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Playlists Tab */}
      {activeTab === 'playlists' && (
        <Card glow="none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <ListOrdered className="w-4 h-4 text-[#06B6D4]" />
              Playlists Ativas ({playlists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {playlists.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <ListOrdered className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-[#F8FAFC]">Nenhuma playlist configurada</p>
                <p className="text-xs text-[#94A3B8]">Crie playlists com conteúdos para reprodução nas telas.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#F8FAFC]">{pl.name}</p>
                      <p className="text-[11px] text-[#64748B]">
                        {pl.itemCount || pl.items?.length || 0} itens • Duração: {pl.totalDuration || 60}s
                      </p>
                    </div>
                    {onNavigateToPlaylist && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => onNavigateToPlaylist(pl.id)}
                      >
                        Abrir Playlist
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <Card glow="none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#06B6D4]" />
              Programações & Grades Horárias ({schedules.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-white/[0.02] border border-white/5">
                <Calendar className="w-8 h-8 text-[#64748B] mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-[#F8FAFC]">Nenhuma programação agendada</p>
                <p className="text-xs text-[#94A3B8]">Defina horários e dias da semana para veiculação.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedules.map((sc) => (
                  <div
                    key={sc.id}
                    className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-[#F8FAFC]">{sc.name}</p>
                      <p className="text-[11px] text-[#64748B]">
                        Dias: {sc.daysOfWeek?.join(', ') || 'Todos'} • {sc.startTime} - {sc.endTime}
                      </p>
                    </div>
                    <Badge variant={sc.isActive ? 'emerald' : 'neutral'} size="sm">
                      {sc.isActive ? 'Ativo' : 'Pausado'}
                    </Badge>
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

      {/* Plan & Contract Tab */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {subscriptionSummary && subscriptionSummary.subscription && subscriptionSummary.plan ? (
            <div className="space-y-6">
              {/* SaaS Subscription Header */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <CommercialModelBadge model={subscriptionSummary.subscription.commercialModel} />
                    <SubscriptionStatusBadge status={subscriptionSummary.subscription.status} />
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{subscriptionSummary.plan.name}</span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                      {subscriptionSummary.plan.code}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Subscrição ID: <span className="font-mono text-slate-300">{subscriptionSummary.subscription.id}</span> • Próxima Renovação: <span className="text-cyan-300 font-semibold">{formatDate(subscriptionSummary.subscription.nextRenewalDate)}</span>
                  </p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 shrink-0 min-w-[200px]">
                  <span className="text-[11px] text-slate-400">Total Mensal Contratado</span>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {formatKz(
                      (subscriptionSummary.subscription.price || 0) +
                      (subscriptionSummary.subscription.addOns?.reduce((s, a) => s + (a.active ? a.unitPrice * a.quantity : 0), 0) || 0)
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-400">Kwanzas de Angola (AOA)</span>
                </div>
              </div>

              {/* Real-time Usage vs Quotas */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Consumo & Entitlements da Organização
                </h4>
                <SubscriptionUsageCards summary={subscriptionSummary} />
              </div>

              {/* Plan Features Included */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                  Recursos Habilitados pelo Plano {subscriptionSummary.plan.name}
                </h4>
                <PlanFeatureGrid features={subscriptionSummary.plan.features || []} interactive={false} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card glow="none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#06B6D4]" />
                    Subscrição SaaS Digital Signage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div>
                      <span className="text-[#64748B] block text-[11px]">Plano Contratado</span>
                      <span className="font-bold text-sm text-[#F8FAFC]">{customer.planName}</span>
                    </div>
                    <Badge variant="cyan" size="md">
                      Vigente
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Valor Mensal:</span>
                      <span className="font-bold text-sm text-emerald-400">{formatKz(customer.monthlyFeeKz)} /mês</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Moeda & Faturação:</span>
                      <span className="text-[#CBD5E1]">Kwanzas de Angola (AOA)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">SLA de Disponibilidade:</span>
                      <span className="text-emerald-400 font-semibold">99.5% Uptime Garantido</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#94A3B8]">Suporte Técnico:</span>
                      <span className="text-[#CBD5E1]">Atendimento Dedicado Luanda</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card glow="none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#06B6D4]" />
                    Ciclo de Faturamento & Próximas Renovações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[#64748B] text-[11px]">Ciclo Atual</span>
                    <p className="font-semibold text-[#F8FAFC]">01 a 30 do Mês Corrente</p>
                    <p className="text-[11px] text-emerald-400">Emissão de Fatura Pró-forma no dia 25</p>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-[#64748B] text-[11px]">Responsável Financeiro</span>
                    <p className="font-semibold text-[#CBD5E1]">
                      {customer.primaryContact?.name || 'Administração Geral'}
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      {customer.primaryContact?.email || customer.email}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
        organizationId={customer.organizationId}
        organizationName={customer.tradeName}
        contactToEdit={contactToEdit}
        onSuccess={() => {
          loadCustomerData();
        }}
      />
    </div>
  );
};
