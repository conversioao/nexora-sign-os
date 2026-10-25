import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Building2,
  Briefcase,
  Monitor,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Coins,
  ChevronLeft,
  Network,
  Eye,
  X,
  CalendarDays,
  DollarSign,
  BarChart3,
  UserPlus,
  Star,
  Activity,
  Zap,
  ArrowDownRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { affiliateRepository } from '../../../repositories/affiliateRepository';
import { AffiliateReferral, ReferralType } from '../../../types/affiliate';
import { WhatsAppNotificationSettingsCard } from '../../../components/notifications/WhatsAppNotificationSettingsCard';

interface AffiliateReferralsPageProps {
  onBack?: () => void;
}

export const AffiliateReferralsPage: React.FC<AffiliateReferralsPageProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | ReferralType>('ALL');
  const [selectedReferral, setSelectedReferral] = useState<AffiliateReferral | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'revenue' | 'commission'>('date');

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    setLoading(true);
    try {
      const data = await affiliateRepository.getReferrals();
      setReferrals(data);
    } catch (err) {
      console.error('Erro ao carregar rede:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = referrals
    .filter((r) => {
      const matchesSearch = r.referredName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || r.referredType === typeFilter;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'revenue') {
        return parseFloat(String(b.totalRevenueGeneratedKz || 0)) - parseFloat(String(a.totalRevenueGeneratedKz || 0));
      }
      if (sortBy === 'commission') {
        return parseFloat(String(b.totalCommissionsEarnedKz || 0)) - parseFloat(String(a.totalCommissionsEarnedKz || 0));
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalClients = referrals.filter((r) => r.referredType === 'CLIENT').length;
  const totalAdvertisers = referrals.filter((r) => r.referredType === 'ADVERTISER').length;
  const totalDisplays = referrals.filter((r) => r.referredType === 'DISPLAY_OWNER').length;
  const totalEarned = referrals.reduce((sum, r) => sum + parseFloat(String(r.totalCommissionsEarnedKz || 0)), 0);
  const totalRevenue = referrals.reduce((sum, r) => sum + parseFloat(String(r.totalRevenueGeneratedKz || 0)), 0);
  const activeCount = referrals.filter((r) => r.status === 'ACTIVE').length;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CLIENT': return <Building2 className="w-4 h-4" />;
      case 'ADVERTISER': return <Briefcase className="w-4 h-4" />;
      case 'DISPLAY_OWNER': return <Monitor className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'CLIENT': return 'Parceiro / Estabelecimento';
      case 'ADVERTISER': return 'Anunciante';
      case 'DISPLAY_OWNER': return 'Proprietário de Display';
      default: return 'Outro';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'CLIENT': return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', glow: 'shadow-cyan-500/10' };
      case 'ADVERTISER': return { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/20', glow: 'shadow-pink-500/10' };
      case 'DISPLAY_OWNER': return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-500/10' };
      default: return { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', glow: 'shadow-slate-500/10' };
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Ativo & Recorrente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        {status === 'PENDING' ? 'Pendente' : status === 'CHURNED' ? 'Inativo' : status}
      </span>
    );
  };

  // ─── Empty State ──────────────────────────────────────────────────────────────
  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 px-6">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 flex items-center justify-center mb-6 border border-white/[0.06]">
        <Network className="w-10 h-10 text-emerald-400/60" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">A sua rede está vazia</h3>
      <p className="text-slate-400 text-sm text-center max-w-md leading-relaxed">
        Ainda não tem parceiros, anunciantes ou clientes na sua rede.
        Partilhe os seus links de divulgação para começar a construir a sua rede e ganhar comissões recorrentes.
      </p>
      <div className="mt-6 flex items-center gap-2 text-emerald-400 text-xs font-medium">
        <Zap className="w-4 h-4" />
        Use os seus Links de Divulgação para expandir a sua rede
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Network className="w-6 h-6 text-emerald-400" />
              Minha Rede
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Visualize todos os parceiros, anunciantes e clientes trazidos por si que geram comissão recorrente.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {referrals.length} {referrals.length === 1 ? 'membro' : 'membros'} na rede
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* ─── KPI Cards ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total na Rede */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#090E1A] to-[#0C1220] border border-white/[0.06] relative overflow-hidden group hover:border-emerald-500/20 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-white font-mono">{referrals.length}</div>
          <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Total na Rede</span>
        </div>

        {/* Estabelecimentos */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#090E1A] to-[#0C1220] border border-white/[0.06] relative overflow-hidden group hover:border-cyan-500/20 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono">{totalClients}</div>
          <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Parceiros</span>
        </div>

        {/* Anunciantes */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#090E1A] to-[#0C1220] border border-white/[0.06] relative overflow-hidden group hover:border-pink-500/20 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/5 rounded-full blur-2xl group-hover:bg-pink-500/10 transition-all" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-pink-500/10 flex items-center justify-center">
              <Briefcase className="w-3.5 h-3.5 text-pink-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-pink-400 font-mono">{totalAdvertisers}</div>
          <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Anunciantes</span>
        </div>

        {/* Displays */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#090E1A] to-[#0C1220] border border-white/[0.06] relative overflow-hidden group hover:border-amber-500/20 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Monitor className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <div className="text-xl font-bold text-amber-400 font-mono">{totalDisplays}</div>
          <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Displays</span>
        </div>

        {/* Faturamento Gerado */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#090E1A] to-[#0C1220] border border-white/[0.06] relative overflow-hidden group hover:border-blue-500/20 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <div className="text-lg font-bold text-blue-400 font-mono">{totalRevenue.toLocaleString('pt-AO')}</div>
          <span className="text-[10px] font-semibold uppercase text-slate-500 tracking-wider">Faturamento (KZ)</span>
        </div>

        {/* Comissões Geradas */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#090E1A] to-[#101824] border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/30 transition-all shadow-lg shadow-emerald-500/5">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">{totalEarned.toLocaleString('pt-AO')}</div>
          <span className="text-[10px] font-semibold uppercase text-emerald-500/80 tracking-wider">Comissões (KZ)</span>
        </div>
      </div>

      {/* Alertas WhatsApp do Afiliado (Novos Indicados, Mensalidades e Anúncios Pagos) */}
      <WhatsAppNotificationSettingsCard roleOverride="AFFILIATE" compact />

      {/* ─── Filters & Search & Sort ─────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-[#090E1A] border border-white/[0.06] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar por nome do parceiro, anunciante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070B14] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Tipo:
          </span>
          {([
            { key: 'ALL' as const, label: 'Todos', color: 'emerald' },
            { key: 'CLIENT' as const, label: 'Parceiros', color: 'cyan' },
            { key: 'ADVERTISER' as const, label: 'Anunciantes', color: 'pink' },
            { key: 'DISPLAY_OWNER' as const, label: 'Displays', color: 'amber' },
          ]).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                typeFilter === key
                  ? `bg-${color}-500 text-slate-950 shadow-md shadow-${color}-500/20`
                  : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
              }`}
              style={typeFilter === key ? {
                backgroundColor: color === 'emerald' ? '#10b981' : color === 'cyan' ? '#06b6d4' : color === 'pink' ? '#ec4899' : '#f59e0b',
                color: '#0f172a',
              } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#070B14] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500/50 cursor-pointer"
          >
            <option value="date">Mais Recente</option>
            <option value="revenue">Maior Faturamento</option>
            <option value="commission">Maior Comissão</option>
          </select>
        </div>
      </div>

      {/* ─── Network Grid / Table ────────────────────────────────────────────── */}
      {loading ? (
        <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] py-20 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full mx-auto mb-4" />
          <p className="text-slate-500 text-xs">A carregar a sua rede...</p>
        </div>
      ) : filtered.length === 0 && referrals.length === 0 ? (
        <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] overflow-hidden">
          <EmptyState />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] py-16 text-center">
          <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-xs">Nenhum membro encontrado com os filtros selecionados.</p>
        </div>
      ) : (
        <>
          {/* Card Grid View */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((ref) => {
              const colors = getTypeColor(ref.referredType);
              const revenue = parseFloat(String(ref.totalRevenueGeneratedKz || 0));
              const commission = parseFloat(String(ref.totalCommissionsEarnedKz || 0));

              return (
                <div
                  key={ref.id}
                  onClick={() => setSelectedReferral(ref)}
                  className={`group relative p-5 rounded-2xl bg-gradient-to-br from-[#090E1A] to-[#0C1220] border ${colors.border} hover:border-opacity-60 transition-all cursor-pointer hover:shadow-lg ${colors.glow} hover:translate-y-[-2px]`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
                        {getTypeIcon(ref.referredType)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white truncate max-w-[180px]">{ref.referredName}</h3>
                        <p className={`text-[10px] font-semibold uppercase ${colors.text} tracking-wider`}>
                          {getTypeLabel(ref.referredType)}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(ref.status || 'ACTIVE')}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">Faturamento</span>
                      <span className="text-sm font-bold text-white font-mono">{revenue.toLocaleString('pt-AO')} <span className="text-[10px] text-slate-400">KZ</span></span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10">
                      <span className="text-[9px] uppercase tracking-wider text-emerald-500/70 font-semibold block mb-1">Sua Comissão</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">+{commission.toLocaleString('pt-AO')} <span className="text-[10px] text-emerald-500/60">KZ</span></span>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" />
                      Na rede desde {new Date(ref.createdAt).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 group-hover:text-emerald-400 transition-colors">
                      <Eye className="w-3 h-3" />
                      <span>Ver detalhe</span>
                    </div>
                  </div>

                  {/* Hover glow accent */}
                  <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />
                </div>
              );
            })}
          </div>

          {/* Summary Bar */}
          <div className="p-4 rounded-2xl bg-[#090E1A] border border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span>A exibir <span className="text-white font-semibold">{filtered.length}</span> de <span className="text-white font-semibold">{referrals.length}</span> membros</span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {activeCount} ativos
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Comissão total acumulada: <span className="text-emerald-400 font-bold font-mono">{totalEarned.toLocaleString('pt-AO')} KZ</span>
            </div>
          </div>
        </>
      )}

      {/* ─── Detail Modal ────────────────────────────────────────────────────── */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#050914]/90 backdrop-blur-sm" onClick={() => setSelectedReferral(null)} />
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0C1220] to-[#090E1A] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden">
            {/* Modal Header Glow */}
            {(() => {
              const colors = getTypeColor(selectedReferral.referredType);
              const revenue = parseFloat(String(selectedReferral.totalRevenueGeneratedKz || 0));
              const commission = parseFloat(String(selectedReferral.totalCommissionsEarnedKz || 0));
              const commissionRate = revenue > 0 ? ((commission / revenue) * 100).toFixed(1) : '0.0';

              return (
                <>
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                    selectedReferral.referredType === 'CLIENT' ? 'from-cyan-500 to-blue-500'
                    : selectedReferral.referredType === 'ADVERTISER' ? 'from-pink-500 to-rose-500'
                    : 'from-amber-500 to-orange-500'
                  }`} />

                  <div className="p-6">
                    {/* Close */}
                    <button
                      onClick={() => setSelectedReferral(null)}
                      className="absolute top-4 right-4 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Entity Info */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-14 h-14 rounded-2xl ${colors.bg} ${colors.text} flex items-center justify-center`}>
                        {getTypeIcon(selectedReferral.referredType)}
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-white">{selectedReferral.referredName}</h2>
                        <p className={`text-xs font-semibold uppercase ${colors.text} tracking-wider`}>
                          {getTypeLabel(selectedReferral.referredType)}
                        </p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 mb-6">
                      {getStatusBadge(selectedReferral.status || 'ACTIVE')}
                      <span className="text-xs text-slate-400">
                        Na rede desde {new Date(selectedReferral.createdAt).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    {/* Detail Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart3 className="w-4 h-4 text-blue-400" />
                          <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Faturamento Total</span>
                        </div>
                        <div className="text-xl font-bold text-white font-mono">{revenue.toLocaleString('pt-AO')} <span className="text-xs text-slate-400">KZ</span></div>
                      </div>
                      <div className="p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15">
                        <div className="flex items-center gap-2 mb-2">
                          <Coins className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] uppercase tracking-wider text-emerald-500/70 font-semibold">Sua Comissão</span>
                        </div>
                        <div className="text-xl font-bold text-emerald-400 font-mono">+{commission.toLocaleString('pt-AO')} <span className="text-xs text-emerald-500/60">KZ</span></div>
                      </div>
                    </div>

                    {/* Additional Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-xs text-slate-400 flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5" />
                          Taxa de Comissão Aplicada
                        </span>
                        <span className="text-xs font-bold text-white font-mono">{commissionRate}%</span>
                      </div>
                      {selectedReferral.firstConversionAt && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                          <span className="text-xs text-slate-400 flex items-center gap-2">
                            <Star className="w-3.5 h-3.5" />
                            Primeira Conversão
                          </span>
                          <span className="text-xs font-bold text-white">
                            {new Date(selectedReferral.firstConversionAt).toLocaleDateString('pt-AO', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                        <span className="text-xs text-slate-400 flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5" />
                          ID da Organização
                        </span>
                        <span className="text-[10px] font-mono text-slate-300 bg-white/[0.04] px-2 py-0.5 rounded">
                          {selectedReferral.referredOrganizationId || 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Recurrence Info */}
                    <div className="mt-5 p-4 rounded-xl bg-gradient-to-r from-emerald-500/[0.05] to-cyan-500/[0.05] border border-emerald-500/10">
                      <div className="flex items-start gap-3">
                        <Zap className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-emerald-400 mb-1">Comissão Recorrente Ativa</h4>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            Sempre que <span className="text-white font-medium">{selectedReferral.referredName}</span> gerar faturamento
                            {selectedReferral.referredType === 'CLIENT' ? ' via subscrição SaaS' :
                             selectedReferral.referredType === 'ADVERTISER' ? ' via campanhas publicitárias' :
                             ' via publicidade em displays'},
                            receberá automaticamente a sua percentagem de comissão sobre o valor pago.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
