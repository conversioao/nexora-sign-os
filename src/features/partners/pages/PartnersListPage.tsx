import React, { useState, useEffect } from 'react';
import { useSession } from '../../../context/SessionContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import {
  Store,
  Monitor,
  Coins,
  Search,
  RefreshCw,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Plus,
  CheckCircle2
} from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  nif: string;
  location: string;
  displayCount: number;
  monthlyCommissionKz: number;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  contactPerson: string;
  phone: string;
  displays?: any[];
}

export const PartnersListPage: React.FC = () => {
  const { currentOrganization, currentUser, currentRole } = useSession();
  const { addToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Installation Requests State
  const [installationRequests, setInstallationRequests] = useState<any[]>([]);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'partners' | 'requests'>('partners');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Form State for Installation Request
  const [reqForm, setReqForm] = useState({
    store_name: '',
    trade_name: '',
    nif: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    municipality: 'Talatona',
    province: 'Luanda',
    venue_type: 'RETAIL',
    estimated_daily_footfall: '5000',
    target_audience: 'Famílias, Profissionais, Consumidores',
    requested_totem_type: 'TOTEM_VERTICAL',
    notes: '',
  });

  const isAdmin = (currentRole as string) === 'NEXORA_ADMIN' || (currentRole as string) === 'PLATFORM_ADMIN' || (currentUser as any)?.role === 'NEXORA_ADMIN';

  const fetchInstallationRequests = async () => {
    try {
      const url = isAdmin
        ? '/api/partner/installation-requests'
        : `/api/partner/installation-requests?organization_id=${currentOrganization?.id || ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setInstallationRequests(data);
        localStorage.setItem('nexora_installation_requests_cache', JSON.stringify(data));
        return;
      }
    } catch (e) {
      console.warn('Backend indisponível para solicitações, usando cache local:', e);
    }
    const local = localStorage.getItem('nexora_installation_requests_cache');
    if (local) {
      try {
        setInstallationRequests(JSON.parse(local));
      } catch {}
    }
  };

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const [orgsRes, displaysRes] = await Promise.all([
        fetch('/api/organizations?type=CLIENT,PARTNER'),
        fetch('/api/displays'),
      ]);

      const orgs = orgsRes.ok ? await orgsRes.json() : [];
      const displays = displaysRes.ok ? await displaysRes.json() : [];

      const partnerMap: Record<string, Partner> = {};

      orgs.forEach((o: any) => {
        partnerMap[o.id] = {
          id: o.id,
          name: o.name || o.tradeName || 'Parceiro Comercial',
          nif: o.nif || '5400000000',
          location: o.city || o.municipality || 'Luanda, Angola',
          displayCount: 0,
          monthlyCommissionKz: 0,
          status: o.status || 'ACTIVE',
          contactPerson: o.contactPerson || o.name || 'Gerente',
          phone: o.phone || '+244 923 000 000',
          displays: [],
        };
      });

      displays.forEach((d: any) => {
        const clientKey = d.organization_id || d.partner_id || d.client_name || 'other';
        if (partnerMap[clientKey]) {
          partnerMap[clientKey].displayCount += 1;
          partnerMap[clientKey].monthlyCommissionKz += (parseFloat(d.monthly_fee) || 120000) * 0.15;
          partnerMap[clientKey].displays?.push(d);
        } else {
          const pName = d.client_name || d.venue_name || `Parceiro ${d.name}`;
          if (!partnerMap[pName]) {
            partnerMap[pName] = {
              id: d.id,
              name: pName,
              nif: '5409823002',
              location: d.location || 'Luanda, Angola',
              displayCount: 0,
              monthlyCommissionKz: (parseFloat(d.monthly_fee) || 120000) * 0.15,
              status: 'ACTIVE',
              contactPerson: d.contact_person || 'Responsável do Local',
              phone: d.phone || '+244 923 000 000',
              displays: [],
            };
          }
          partnerMap[pName].displayCount += 1;
          partnerMap[pName].displays?.push(d);
        }
      });

      setPartners(Object.values(partnerMap));
      await fetchInstallationRequests();
    } catch (e) {
      console.warn('Erro ao carregar parceiros:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [currentOrganization]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.store_name || !reqForm.contact_person || !reqForm.phone || !reqForm.address || !reqForm.municipality) {
      addToast({
        type: 'error',
        title: 'Campos Obrigatórios',
        message: 'Por favor, preencha o Nome da Loja, Responsável, Telefone, Endereço e Município.',
      });
      return;
    }

    setIsSubmittingRequest(true);
    const newReqItem = {
      id: `req-inst-${Date.now()}`,
      organization_id: currentOrganization?.id || null,
      store_name: reqForm.store_name,
      trade_name: reqForm.trade_name || reqForm.store_name,
      nif: reqForm.nif,
      contact_person: reqForm.contact_person,
      phone: reqForm.phone,
      email: reqForm.email,
      address: reqForm.address,
      municipality: reqForm.municipality,
      province: reqForm.province,
      venue_type: reqForm.venue_type,
      estimated_daily_footfall: Number(reqForm.estimated_daily_footfall) || 5000,
      target_audience: reqForm.target_audience,
      requested_totem_type: reqForm.requested_totem_type,
      notes: reqForm.notes,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/partner/installation-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReqItem),
      });

      if (res.ok) {
        const saved = await res.json();
        setInstallationRequests((prev) => [saved, ...prev]);
      } else {
        setInstallationRequests((prev) => [newReqItem, ...prev]);
      }
    } catch (err) {
      setInstallationRequests((prev) => [newReqItem, ...prev]);
    }

    // Save to local storage for instant sync
    const currentList = JSON.parse(localStorage.getItem('nexora_installation_requests_cache') || '[]');
    localStorage.setItem('nexora_installation_requests_cache', JSON.stringify([newReqItem, ...currentList]));

    addToast({
      type: 'success',
      title: 'Solicitação Enviada com Sucesso!',
      message: 'Sua solicitação de instalação de Totem foi gravada e enviada à equipa Nexora para avaliação.',
    });
    setIsRequestModalOpen(false);
    setReqForm({
      store_name: '',
      trade_name: '',
      nif: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      municipality: 'Talatona',
      province: 'Luanda',
      venue_type: 'RETAIL',
      estimated_daily_footfall: '5000',
      target_audience: 'Famílias, Consumidores',
      requested_totem_type: 'TOTEM_VERTICAL',
      notes: '',
    });
    setIsSubmittingRequest(false);
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await fetch(`/api/partner/installation-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        addToast({
          type: 'success',
          title: status === 'APPROVED' ? 'Solicitação Aprovada' : 'Solicitação Rejeitada',
          message: status === 'APPROVED' ? 'O Totem foi pré-cadastrado no inventário de displays.' : 'Solicitação marcada como recusada.',
        });
        await fetchPartners();
      } else {
        throw new Error('Falha ao atualizar status');
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro', message: err.message });
    }
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 })
      .format(val)
      .replace('AOA', 'Kz');
  };

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Rede de Estabelecimentos Parceiros
            </span>
            <span className="text-xs text-slate-400">• Proprietários de Espaço</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white">
            Parceiros de Mídia & Espaços Comerciais
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie os proprietários de lojas, restaurantes e malls que disponibilizam displays para a rede publicitária Nexora.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRequestModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Solicitar Instalação de Totem
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPartners}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sincronizar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#0F172A] border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Total de Parceiros</span>
              <p className="text-2xl font-bold text-white mt-1">{partners.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Store className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F172A] border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Displays Alocados</span>
              <p className="text-2xl font-bold text-white mt-1">
                {partners.reduce((sum, p) => sum + p.displayCount, 0)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Monitor className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0F172A] border-white/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Comissão Total Repassada/Mês</span>
              <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">
                {formatKz(partners.reduce((sum, p) => sum + p.monthlyCommissionKz, 0))}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Coins className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0F172A] p-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar parceiro por nome ou localização..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Partners List Table */}
      <Card className="bg-[#0F172A] border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Carregando parceiros...</div>
          ) : filteredPartners.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Nenhum parceiro registrado.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400">
                  <th className="py-3 px-4 font-semibold">Parceiro & Estabelecimento</th>
                  <th className="py-3 px-4 font-semibold">Localização</th>
                  <th className="py-3 px-4 font-semibold text-center">Displays</th>
                  <th className="py-3 px-4 font-semibold text-right">Comissão Mensal</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPartners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white text-sm">{partner.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>NIF: {partner.nif}</span>
                        <span>•</span>
                        <span>{partner.contactPerson}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {partner.location}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                        {partner.displayCount} telas
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatKz(partner.monthlyCommissionKz)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="online" size="sm" dot>Ativo</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedPartner(partner)}
                        className="text-[11px] h-7 px-2.5 border-slate-700 hover:border-cyan-500 text-cyan-400"
                      >
                        Ver Detalhes
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'partners'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Rede de Parceiros Ativos ({partners.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <span>Solicitações de Instalação</span>
          {installationRequests.filter((r) => r.status === 'PENDING').length > 0 && (
            <span className="bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full text-[10px]">
              {installationRequests.filter((r) => r.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'partners' && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-[#0F172A] border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Total de Parceiros</span>
                  <p className="text-2xl font-bold text-white mt-1">{partners.length}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Store className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0F172A] border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Displays Alocados</span>
                  <p className="text-2xl font-bold text-white mt-1">
                    {partners.reduce((sum, p) => sum + p.displayCount, 0)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Monitor className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0F172A] border-white/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Comissão Total Repassada/Mês</span>
                  <p className="text-2xl font-bold text-cyan-400 font-mono mt-1">
                    {formatKz(partners.reduce((sum, p) => sum + p.monthlyCommissionKz, 0))}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Coins className="w-5 h-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search Bar */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0F172A] p-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar parceiro por nome ou localização..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Partners List Table */}
          <Card className="bg-[#0F172A] border-white/10">
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs">Carregando parceiros...</div>
              ) : filteredPartners.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Nenhum parceiro registrado.</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400">
                      <th className="py-3 px-4 font-semibold">Parceiro & Estabelecimento</th>
                      <th className="py-3 px-4 font-semibold">Localização</th>
                      <th className="py-3 px-4 font-semibold text-center">Displays</th>
                      <th className="py-3 px-4 font-semibold text-right">Comissão Mensal</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPartners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-sm">{partner.name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>NIF: {partner.nif}</span>
                            <span>•</span>
                            <span>{partner.contactPerson}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {partner.location}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                            {partner.displayCount} telas
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                          {formatKz(partner.monthlyCommissionKz)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge variant="online" size="sm" dot>Ativo</Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPartner(partner)}
                            className="text-[11px] h-7 px-2.5 border-slate-700 hover:border-cyan-500 text-cyan-400"
                          >
                            Ver Detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Installation Requests Tab */}
      {activeTab === 'requests' && (
        <Card className="bg-[#0F172A] border-white/10">
          <CardContent className="p-0">
            {installationRequests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Store className="w-12 h-12 mx-auto text-slate-600" />
                <h3 className="text-base font-bold text-white">Nenhuma Solicitação de Instalação</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Parceiros podem solicitar a instalação de novos Totens de Mídia Indoor preenchendo o formulário de localização e fluxo de clientes.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsRequestModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Criar Nova Solicitação
                </Button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/60 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Estabelecimento / Loja</th>
                    <th className="py-3 px-4 font-semibold">Contato Obrigatório</th>
                    <th className="py-3 px-4 font-semibold">Endereço & Local</th>
                    <th className="py-3 px-4 font-semibold">Fluxo Diário Estimado</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    {isAdmin && <th className="py-3 px-4 font-semibold text-right">Ação Admin</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {installationRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white text-sm">{req.store_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {req.trade_name ? `Razão: ${req.trade_name}` : ''} {req.nif ? `• NIF: ${req.nif}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{req.phone}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{req.contact_person} ({req.email || 'Sem email'})</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="flex items-center gap-1 text-white font-medium">
                          <MapPin className="w-3.5 h-3.5 text-amber-400" />
                          <span>{req.address}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 ml-4">
                          {req.municipality}, {req.province || 'Luanda'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold">
                        ~{(Number(req.estimated_daily_footfall) || 5000).toLocaleString()} pessoas/dia
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {req.status === 'APPROVED' ? 'Aprovado' : req.status === 'REJECTED' ? 'Recusado' : 'Pendente de Aprovação'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex justify-end gap-1.5">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                                className="h-7 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-500"
                              >
                                Aprovar Instalação
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                                className="h-7 text-[10px] px-2 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                              >
                                Rejeitar
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Concluído</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal: Solicitação de Instalação de Totem */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl space-y-4 my-8">
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-[#131D31]">
              <div>
                <h3 className="text-base font-bold text-white">Solicitar Instalação de Totem Nexora</h3>
                <p className="text-xs text-slate-400">Preencha os dados da sua loja/estabelecimento para avaliação técnica da equipa</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-5 space-y-4 text-xs">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">1. Dados do Estabelecimento</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      Nome Comercial da Loja <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Resto-Bar Kwanza"
                      value={reqForm.store_name}
                      onChange={(e) => setReqForm({ ...reqForm, store_name: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      NIF (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 5409812903"
                      value={reqForm.nif}
                      onChange={(e) => setReqForm({ ...reqForm, nif: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      Pessoa de Contato / Responsável <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Carlos Silva (Gerente)"
                      value={reqForm.contact_person}
                      onChange={(e) => setReqForm({ ...reqForm, contact_person: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      Telefone para Contato <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: +244 923 111 222"
                      value={reqForm.phone}
                      onChange={(e) => setReqForm({ ...reqForm, phone: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Email de Contato</label>
                  <input
                    type="email"
                    placeholder="Ex: contacto@restobarkwanza.ao"
                    value={reqForm.email}
                    onChange={(e) => setReqForm({ ...reqForm, email: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">2. Localização & Endereço</h4>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                    Endereço Completo (Rua, Número, Ponto de Referência) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rua Luanda Sul, Edifício 4, Loja B (Frente ao BFA)"
                    value={reqForm.address}
                    onChange={(e) => setReqForm({ ...reqForm, address: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">
                      Município <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={reqForm.municipality}
                      onChange={(e) => setReqForm({ ...reqForm, municipality: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="Talatona">Talatona</option>
                      <option value="Belas">Belas</option>
                      <option value="Luanda">Luanda (Baixa/Ingombota)</option>
                      <option value="Viana">Viana</option>
                      <option value="Cazenga">Cazenga</option>
                      <option value="Kilamba Kiaxi">Kilamba Kiaxi</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">Tipo de Espaço</label>
                    <select
                      value={reqForm.venue_type}
                      onChange={(e) => setReqForm({ ...reqForm, venue_type: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="RETAIL">Loja de Varejo / Supermercado</option>
                      <option value="RESTAURANT">Restaurante / Bar / Lounge</option>
                      <option value="CLINIC">Clínica / Centro Médico</option>
                      <option value="GYM">Academia / Centro Esportivo</option>
                      <option value="MALL">Shopping Center / Mall</option>
                      <option value="OTHER">Outro Espaço de Alto Fluxo</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-white/5">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">3. Público e Circulação</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">Fluxo Diário Estimado (Pessoas)</label>
                    <input
                      type="number"
                      placeholder="Ex: 5000"
                      value={reqForm.estimated_daily_footfall}
                      onChange={(e) => setReqForm({ ...reqForm, estimated_daily_footfall: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-300 font-semibold mb-1">Modelo de Totem Desejado</label>
                    <select
                      value={reqForm.requested_totem_type}
                      onChange={(e) => setReqForm({ ...reqForm, requested_totem_type: e.target.value })}
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="TOTEM_VERTICAL">Totem Vertical 55" (Dupla Face / LED)</option>
                      <option value="WALL_MOUNT">Display de Parede Horizontal 65"</option>
                      <option value="KIOSK_INTERACTIVE">Kiosk Touchscreen Interativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Público-Alvo Predominante</label>
                  <input
                    type="text"
                    placeholder="Ex: Famílias de Classe A/B, Executivos, Jovens"
                    value={reqForm.target_audience}
                    onChange={(e) => setReqForm({ ...reqForm, target_audience: e.target.value })}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsRequestModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmittingRequest}>
                  {isSubmittingRequest ? 'Enviando...' : 'Enviar Solicitação'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Details Modal */}
      {selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedPartner.name}</h3>
                <p className="text-xs text-slate-400">Detalhes Cadastrais e Displays Associados</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPartner(null)} className="text-slate-400">
                ✕
              </Button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500">NIF / Identificação Fiscal</span>
                  <p className="font-bold text-white mt-0.5">{selectedPartner.nif}</p>
                </div>
                <div>
                  <span className="text-slate-500">Localização</span>
                  <p className="font-bold text-white mt-0.5">{selectedPartner.location}</p>
                </div>
                <div>
                  <span className="text-slate-500">Contato Responsável</span>
                  <p className="font-bold text-white mt-0.5">{selectedPartner.contactPerson} ({selectedPartner.phone})</p>
                </div>
                <div>
                  <span className="text-slate-500">Comissão Mensal</span>
                  <p className="font-bold text-emerald-400 mt-0.5">{formatKz(selectedPartner.monthlyCommissionKz)}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-2">Displays Vinculados ({selectedPartner.displays?.length || 0})</h4>
                {(!selectedPartner.displays || selectedPartner.displays.length === 0) ? (
                  <p className="text-slate-500 text-xs italic">Nenhum display físico vinculado no momento.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedPartner.displays.map((disp: any) => (
                      <div key={disp.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                        <div>
                          <strong className="text-white">{disp.name}</strong>
                          <span className="text-slate-500 block text-[10px]">{disp.code || disp.device_code} • {disp.location}</span>
                        </div>
                        <Badge variant={disp.status === 'ONLINE' ? 'online' : 'offline'} size="sm">
                          {disp.status || 'ONLINE'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setSelectedPartner(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
