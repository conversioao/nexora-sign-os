import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CustomerProfile,
  CustomerKPIs,
  CustomerStatus,
  CustomerLifecycleStage,
  ANGOLA_MUNICIPALITIES,
  CUSTOMER_INDUSTRIES,
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
  Building2,
  UserPlus,
  Search,
  Filter,
  Monitor,
  MoreVertical,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { CustomerKpiCards } from '../components/CustomerKpiCards';
import { CustomerLifecycleBadge } from '../components/CustomerLifecycleBadge';
import { CreateCustomerModal } from '../components/CreateCustomerModal';
import { useToast } from '../../../components/ui/Toast';

interface ClientsListPageProps {
  onNavigateToDetail: (customerId: string) => void;
}

export const ClientsListPage: React.FC<ClientsListPageProps> = ({ onNavigateToDetail }) => {
  const { currentOrganization } = useSession();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [kpis, setKpis] = useState<CustomerKPIs>({
    totalCustomers: 0,
    activeCustomers: 0,
    prospectCustomers: 0,
    inactiveCustomers: 0,
    installedDisplays: 0,
    estimatedMonthlyRevenueKz: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('ALL');
  const [municipalityFilter, setMunicipalityFilter] = useState<string>('ALL');
  const [industryFilter, setIndustryFilter] = useState<string>('ALL');
  const [planFilter, setPlanFilter] = useState<string>('ALL');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isNexoraInternal = currentOrganization?.type === 'NEXORA';
  const orgFilterId = isNexoraInternal ? undefined : currentOrganization?.id;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedCustomers, fetchedKpis] = await Promise.all([
        NexoraService.customers.getAll({
          organizationId: orgFilterId,
        }),
        NexoraService.customers.getKPIs(orgFilterId),
      ]);
      setCustomers(fetchedCustomers);
      setKpis(fetchedKpis);
    } catch {
      addToast({ type: 'danger', title: 'Erro ao carregar', message: 'Falha ao carregar lista de clientes.' });
    } finally {
      setLoading(false);
    }
  }, [orgFilterId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (lifecycleFilter !== 'ALL' && c.lifecycleStage !== lifecycleFilter) return false;
      if (municipalityFilter !== 'ALL' && c.municipality.toLowerCase() !== municipalityFilter.toLowerCase()) return false;
      if (industryFilter !== 'ALL' && c.industry.toLowerCase() !== industryFilter.toLowerCase()) return false;
      if (planFilter !== 'ALL' && c.planName !== planFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const contactName = c.primaryContact?.name.toLowerCase() || '';
        const contactPhone = c.primaryContact?.phone.toLowerCase() || '';
        const match =
          c.tradeName.toLowerCase().includes(q) ||
          c.legalName.toLowerCase().includes(q) ||
          c.customerCode.toLowerCase().includes(q) ||
          c.nif.includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.municipality.toLowerCase().includes(q) ||
          contactName.includes(q) ||
          contactPhone.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [customers, searchTerm, statusFilter, lifecycleFilter, municipalityFilter, industryFilter, planFilter]);

  const handleToggleStatus = async (customer: CustomerProfile) => {
    const nextStatus: CustomerStatus = customer.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const nextStage: CustomerLifecycleStage = nextStatus === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    try {
      await NexoraService.customers.updateStatus(customer.id, nextStatus, nextStage);
      await NexoraService.crmActivities.logActivity({
        actorId: 'usr-mario',
        actorName: 'Mário Silva',
        organizationId: customer.organizationId,
        entityType: 'CUSTOMER',
        entityId: customer.id,
        entityName: customer.tradeName,
        action: nextStatus === 'ACTIVE' ? 'Cliente Reativado' : 'Cliente Suspenso',
        description: `Estado do cliente ${customer.tradeName} alterado para ${nextStatus}.`,
      });
      addToast({
        type: 'info',
        title: 'Estado Atualizado',
        message: `${customer.tradeName} agora está ${nextStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}.`,
      });
      loadData();
    } catch {
      addToast({ type: 'danger', title: 'Erro', message: 'Falha ao alterar estado do cliente.' });
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
        title="CRM de Clientes & Espaços"
        description="Gestão operacional e comercial de organizações parceiras com displays instalados."
        badge={
          <Badge variant="cyan" size="sm">
            {customers.length} Clientes Cadastrados
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
              Novo Cliente
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <CustomerKpiCards kpis={kpis} loading={loading} />

      {/* Filter Toolbar */}
      <Card glow="none" className="p-4">
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 w-full">
              <Input
                placeholder="Pesquisar por nome, NIF, código, contacto, telefone ou município..."
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
                  { value: 'SUSPENDED', label: 'Suspensos' },
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
              <Filter className="w-3 h-3 text-[#06B6D4]" />
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

            <div className="w-40">
              <Select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Segmento (Todos)' },
                  ...CUSTOMER_INDUSTRIES.map((ind) => ({ value: ind, label: ind })),
                ]}
              />
            </div>

            <div className="w-44">
              <Select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                options={[
                  { value: 'ALL', label: 'Plano (Todos)' },
                  { value: 'Nexora Starter', label: 'Nexora Starter' },
                  { value: 'Nexora Business Pro', label: 'Nexora Business Pro' },
                  { value: 'Nexora Enterprise', label: 'Nexora Enterprise' },
                ]}
              />
            </div>

            {(searchTerm ||
              statusFilter !== 'ALL' ||
              lifecycleFilter !== 'ALL' ||
              municipalityFilter !== 'ALL' ||
              industryFilter !== 'ALL' ||
              planFilter !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-[#06B6D4] hover:underline ml-auto"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setLifecycleFilter('ALL');
                  setMunicipalityFilter('ALL');
                  setIndustryFilter('ALL');
                  setPlanFilter('ALL');
                }}
              >
                Limpar Filtros
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Customers Table */}
      <Card glow="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.03] text-[#94A3B8] border-b border-white/5 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Organização / Razão Social</th>
                <th className="py-3.5 px-3">Código</th>
                <th className="py-3.5 px-3">Segmento & Local</th>
                <th className="py-3.5 px-3">Displays</th>
                <th className="py-3.5 px-3">Plano SaaS</th>
                <th className="py-3.5 px-3">Ciclo Comercial</th>
                <th className="py-3.5 px-3">Contacto Principal</th>
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
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Building2 className="w-10 h-10 text-[#64748B] mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-[#F8FAFC]">Nenhum cliente encontrado</p>
                    <p className="text-xs text-[#94A3B8] mt-1">Ajuste os filtros ou registe uma nova organização.</p>
                    <Button
                      variant="cyan"
                      size="sm"
                      className="mt-4"
                      leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                      onClick={() => setIsCreateModalOpen(true)}
                    >
                      Cadastrar Cliente
                    </Button>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const onlineCount = customer.onlineDisplayCount || 0;
                  const totalDisplays = customer.displayCount || 0;

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => onNavigateToDetail(customer.id)}
                    >
                      {/* Name & Legal */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B132B] to-[#1E293B] border border-white/10 flex items-center justify-center text-xs font-bold text-[#06B6D4] flex-shrink-0 group-hover:border-[#06B6D4]/40 transition-colors">
                            {customer.tradeName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-sm text-[#F8FAFC] group-hover:text-[#06B6D4] transition-colors truncate block">
                              {customer.tradeName}
                            </span>
                            <span className="text-[11px] text-[#64748B] truncate block">
                              {customer.legalName} • NIF: {customer.nif}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Code */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/5 text-[#CBD5E1] border border-white/10">
                          {customer.customerCode}
                        </span>
                      </td>

                      {/* Industry & Municipality */}
                      <td className="py-3.5 px-3">
                        <span className="text-xs text-[#CBD5E1] block font-medium">
                          {customer.industry}
                        </span>
                        <span className="text-[11px] text-[#64748B] block truncate">
                          {customer.municipality}, {customer.city}
                        </span>
                      </td>

                      {/* Displays */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-[#06B6D4]" />
                          <span className="text-xs font-bold text-[#F8FAFC]">{totalDisplays} telas</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 font-medium block">
                          {onlineCount} online
                        </span>
                      </td>

                      {/* Plan & Value */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#F8FAFC] block">
                          {customer.planName}
                        </span>
                        <span className="text-[11px] text-emerald-400 font-medium">
                          {formatKz(customer.monthlyFeeKz)} /mês
                        </span>
                      </td>

                      {/* Lifecycle Stage */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <CustomerLifecycleBadge stage={customer.lifecycleStage} size="sm" />
                      </td>

                      {/* Primary Contact */}
                      <td className="py-3.5 px-3">
                        {customer.primaryContact ? (
                          <div className="min-w-0">
                            <span className="text-xs font-medium text-[#F8FAFC] block truncate">
                              {customer.primaryContact.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-[#64748B]">
                              <span className="truncate">{customer.primaryContact.phone}</span>
                              {customer.primaryContact.email && (
                                <a
                                  href={`mailto:${customer.primaryContact.email}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:text-[#06B6D4]"
                                  title={customer.primaryContact.email}
                                >
                                  <Mail className="w-3 h-3" />
                                </a>
                              )}
                              {customer.primaryContact.phone && (
                                <a
                                  href={`tel:${customer.primaryContact.phone}`}
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
                            <IconButton variant="ghost" size="sm" aria-label="Ações da organização">
                              <MoreVertical className="w-3.5 h-3.5 text-[#94A3B8]" />
                            </IconButton>
                          }
                          items={[
                            {
                              label: 'Ver Ficha Completa',
                              icon: <Eye className="w-3.5 h-3.5 text-[#06B6D4]" />,
                              onClick: () => onNavigateToDetail(customer.id),
                            },
                            {
                              label: 'Editar Cadastro',
                              icon: <Edit2 className="w-3.5 h-3.5 text-blue-400" />,
                              onClick: () => onNavigateToDetail(customer.id),
                            },
                            {
                              label: customer.status === 'ACTIVE' ? 'Suspender Organização' : 'Ativar Organização',
                              icon:
                                customer.status === 'ACTIVE' ? (
                                  <XCircle className="w-3.5 h-3.5 text-amber-400" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ),
                              onClick: () => handleToggleStatus(customer),
                            },
                            {
                              label: 'Excluir da Base',
                              icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
                              onClick: async () => {
                                if (window.confirm(`Tem certeza que deseja apagar ${customer.tradeName}?`)) {
                                  try {
                                    await NexoraService.customers.delete(customer.id);
                                    addToast({ type: 'success', title: 'Excluído', message: 'Organização removida com sucesso.' });
                                    loadData();
                                  } catch (e) {
                                    addToast({ type: 'danger', title: 'Erro', message: 'Falha ao excluir organização.' });
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

      {/* Create Modal */}
      <CreateCustomerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
