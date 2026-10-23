import React, { useState, useEffect } from 'react';
import {
  Users,
  Coins,
  TrendingUp,
  ArrowUpRight,
  Copy,
  Check,
  Share2,
  Building2,
  Briefcase,
  Monitor,
  Wallet,
  Clock,
  Sparkles,
  QrCode,
  Calendar,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  CreditCard,
  Building,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { affiliateRepository } from '../../../repositories/affiliateRepository';
import {
  AffiliateDashboardKpi,
  Affiliate,
  AffiliateCommission,
  AffiliateSettings,
  RevenueHistoryItem,
  PayoutCycleInfo,
} from '../../../types/affiliate';
import { ANGOLA_BANKS, formatAngolaIban } from '../../../data/angolaBanks';
import { getAffiliateBaseUrl } from '../../../utils/affiliateUrl';

interface AffiliateDashboardViewProps {
  onNavigateToReferrals?: () => void;
  onNavigateToCommissions?: () => void;
  onNavigateToLinks?: () => void;
  onNavigateToPayouts?: () => void;
}

export const AffiliateDashboardView: React.FC<AffiliateDashboardViewProps> = ({
  onNavigateToReferrals,
  onNavigateToCommissions,
  onNavigateToLinks,
  onNavigateToPayouts,
}) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Affiliate | null>(null);
  const [dashboardData, setDashboardData] = useState<AffiliateDashboardKpi | null>(null);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Bank Modal states
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSuccess, setBankSuccess] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Payout Modal states
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [meData, dashData, setts] = await Promise.all([
        affiliateRepository.getMe(),
        affiliateRepository.getDashboard(),
        affiliateRepository.getSettings(),
      ]);
      setProfile(meData);
      setDashboardData(dashData);
      setSettings(setts);

      if (meData?.bankName) setBankName(meData.bankName);
      if (meData?.accountHolder) setAccountHolder(meData.accountHolder);
      if (meData?.iban) setIban(meData.iban);
    } catch (err) {
      console.error('Erro ao carregar dados do afiliado:', err);
    } finally {
      setLoading(false);
    }
  };

  const referralCode = profile?.referralCode || '';
  const baseUrl = getAffiliateBaseUrl();
  const referralLink = referralCode ? `${baseUrl}/?ref=${referralCode}` : baseUrl;

  const copyToClipboard = (text: string, type: 'link' | 'code') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(
      `Olá! Recomendo a plataforma líder de Mídia Digital Indoor da Nexora em Angola. Registre seu estabelecimento ou faça anúncios digitais com benefícios exclusivos através deste link: ${referralLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankSaving(true);
    setBankError(null);
    try {
      if (!bankName || !accountHolder || !iban) {
        throw new Error('Por favor, preencha todos os campos bancários.');
      }
      const updated = await affiliateRepository.updateBankAccount({
        bankName,
        accountHolder,
        iban,
      });
      setProfile((prev) => (prev ? { ...prev, bankName, accountHolder, iban } : null));
      setBankSuccess(true);
      setTimeout(() => {
        setBankSuccess(false);
        setShowBankModal(false);
        loadData();
      }, 1500);
    } catch (err: any) {
      setBankError(err.message || 'Falha ao salvar conta bancária.');
    } finally {
      setBankSaving(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError(null);
    try {
      const amount = parseFloat(payoutAmount);
      if (!amount || isNaN(amount)) throw new Error('Insira um valor válido em Kwanzas.');
      if (!profile?.bankName || !profile?.iban) {
        throw new Error('Configure seus dados bancários antes de solicitar um saque.');
      }
      await affiliateRepository.requestPayout({
        amountKz: amount,
        bankName: profile.bankName,
        accountHolder: profile.accountHolder || profile.name,
        iban: profile.iban,
      });
      setPayoutSuccess(true);
      setTimeout(() => {
        setPayoutSuccess(false);
        setShowPayoutModal(false);
        setPayoutAmount('');
        loadData();
      }, 2000);
    } catch (err: any) {
      setPayoutError(err.message || 'Falha ao solicitar saque');
    } finally {
      setPayoutLoading(false);
    }
  };

  const activeClientPct = profile?.customClientSaasPct ?? settings?.client_saas_commission_pct ?? 10.0;
  const activeAdvPct = profile?.customAdvertiserCampaignPct ?? settings?.advertiser_campaign_commission_pct ?? 7.0;
  const activeDispPct = profile?.customDisplayOwnerPct ?? settings?.display_owner_commission_pct ?? 8.0;

  const cycle: PayoutCycleInfo = dashboardData?.payoutCycle || {
    isCycleOpen: false,
    currentCycleName: 'Janela de Saque Fechada',
    nextCycleDate: '15 do próximo mês',
    daysUntilNextCycle: 0,
  };

  const totalPartnersCount = (dashboardData?.activeClientsCount || 0) + (dashboardData?.activeDisplaysCount || 0);
  const totalAdvertisersCount = dashboardData?.activeAdvertisersCount || 0;
  const totalRevenueKz = dashboardData?.totalRevenueGeneratedKz || 0;

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium font-sans">Carregando painel de afiliado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* ─── HERO HEADER ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B1528] via-[#0F1E38] to-[#08101E] border border-emerald-500/20 p-6 lg:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Painel Exclusivo de Afiliados & Embaixadores Nexora
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
              Olá, {profile?.name || 'Afiliado Nexora'}
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Visão geral do seu negócio e ganhos contínuos. Acompanhe parceiros cadastrados, anunciantes ativos, volume faturado e comissões recorrentes em tempo real.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" />
              {profile?.bankName ? 'Conta Bancária Configurada' : 'Configurar Conta Bancária'}
            </button>
            <button
              onClick={() => setShowPayoutModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all duration-200 cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              Solicitar Saque
            </button>
            <button
              onClick={shareOnWhatsApp}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-medium text-xs transition-colors cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
          </div>
        </div>

        {/* Banner do Link e Código Real de Indicação */}
        <div className="mt-6 pt-6 border-t border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Seu Código de Indicação Oficial</p>
              <p className="text-lg font-bold text-emerald-400 font-mono tracking-wider truncate">
                {referralCode || 'Aguardando Código...'}
              </p>
            </div>
            {referralCode && (
              <button
                onClick={() => copyToClipboard(referralCode, 'code')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copiado!' : 'Copiar'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Link Direto de Cadastro</p>
              <p className="text-xs text-slate-300 font-mono truncate">{referralLink}</p>
            </div>
            {referralCode && (
              <button
                onClick={() => copyToClipboard(referralLink, 'link')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copiado!' : 'Copiar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── CICLO DE PAGAMENTO WIDGET ────────────────────────────────────────── */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        cycle.isCycleOpen
          ? 'bg-gradient-to-r from-emerald-950/40 via-[#0B1528] to-teal-950/40 border-emerald-500/40'
          : 'bg-[#090E1A] border-amber-500/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${
              cycle.isCycleOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Ciclo de Liquidação Bancária:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  cycle.isCycleOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {cycle.isCycleOpen ? 'Janela Aberta' : 'Janela Fechada'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {cycle.isCycleOpen
                  ? `${cycle.currentCycleName}. As solicitações feitas agora serão liquidadas diretamente pelo financeiro Nexora.`
                  : `Os saques ocorrem no meio do mês (dia 15) e no final do mês. Próxima janela: ${cycle.nextCycleDate} (${cycle.daysUntilNextCycle} dias restantes).`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-center">
            {onNavigateToPayouts && (
              <button
                onClick={onNavigateToPayouts}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                Ver Carteira & Histórico <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 4 KPIS COMPLETOS DA VISÃO GERAL ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Parceiros */}
        <div className="p-5 rounded-2xl bg-[#090E1A] border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Parceiros / Estabelecimentos</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalPartnersCount} <span className="text-xs text-cyan-400 font-sans font-normal">estabelecimentos</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {dashboardData?.activeClientsCount || 0} restaurantes/lojas • {dashboardData?.activeDisplaysCount || 0} telas
          </p>
        </div>

        {/* Total de Anunciantes */}
        <div className="p-5 rounded-2xl bg-[#090E1A] border border-pink-500/20 hover:border-pink-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Anunciantes Indicados</span>
            <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalAdvertisersCount} <span className="text-xs text-pink-400 font-sans font-normal">marcas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Empresas e marcas rodando campanhas pagas
          </p>
        </div>

        {/* Faturamento Total Gerado na Rede */}
        <div className="p-5 rounded-2xl bg-[#090E1A] border border-emerald-500/20 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Faturamento Gerado</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalRevenueKz.toLocaleString('pt-AO')} <span className="text-xs text-emerald-400">KZ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Volume transacionado pelos seus indicados
          </p>
        </div>

        {/* Saldo Disponível para Saque */}
        <div className="p-5 rounded-2xl bg-[#090E1A] border border-emerald-500/30 hover:border-emerald-500/50 transition-colors bg-gradient-to-b from-[#090E1A] to-emerald-950/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Saldo Disponível</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {(dashboardData?.pendingBalanceKz || 0).toLocaleString('pt-AO')} <span className="text-xs text-emerald-400">KZ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            Total acumulado: {(dashboardData?.totalEarnedKz || 0).toLocaleString('pt-AO')} KZ
          </p>
        </div>
      </div>

      {/* ─── GRÁFICO DE RECEITA & COMISSÕES ───────────────────────────────────── */}
      <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Evolução da Receita & Comissões Geradas
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhamento mensal da receita transacionada pela sua rede e das suas comissões recebidas.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500" />
              <span className="text-slate-300">Faturamento da Rede (KZ)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-slate-300">Sua Comissão (KZ)</span>
            </div>
          </div>
        </div>

        {/* Visual Chart Graphic (SVG Based) */}
        {totalRevenueKz === 0 && (dashboardData?.totalEarnedKz || 0) === 0 ? (
          <div className="py-14 text-center rounded-xl bg-white/[0.01] border border-dashed border-white/[0.08] flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Sua conta é nova e está virgem</p>
            <p className="text-xs text-slate-400 max-w-md mt-1">
              Assim que os primeiros estabelecimentos ou anunciantes se cadastrarem com seu link de divulgação, o gráfico exibirá automaticamente o faturamento real e as comissões geradas.
            </p>
            {onNavigateToLinks && (
              <button
                onClick={onNavigateToLinks}
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
              >
                Acessar Links de Divulgação
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-64 w-full flex items-end gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-white/[0.08]">
              {(dashboardData?.revenueHistory || []).map((item, idx) => {
                const maxVal = Math.max(
                  ...((dashboardData?.revenueHistory || []).map((h) => h.revenueKz)),
                  1000000
                );
                const revHeight = Math.max(8, Math.round((item.revenueKz / maxVal) * 100));
                const commHeight = Math.max(6, Math.round(((item.commissionKz * 8) / maxVal) * 100));

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1.5 h-full">
                      {/* Bar 1: Faturamento */}
                      <div
                        style={{ height: `${revHeight}%` }}
                        className="w-1/2 max-w-[28px] bg-gradient-to-t from-cyan-600/40 to-cyan-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125 relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[9px] text-cyan-300 font-mono whitespace-nowrap pointer-events-none z-20">
                          {item.revenueKz.toLocaleString('pt-AO')} KZ
                        </div>
                      </div>

                      {/* Bar 2: Comissoes */}
                      <div
                        style={{ height: `${commHeight}%` }}
                        className="w-1/2 max-w-[28px] bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-300 group-hover:brightness-125 relative"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-white/10 rounded text-[9px] text-emerald-300 font-mono whitespace-nowrap pointer-events-none z-20">
                          +{item.commissionKz.toLocaleString('pt-AO')} KZ
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">{item.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-mono">
              <span>0 KZ</span>
              <span>Volume Histórico Acumulado</span>
              <span>{totalRevenueKz.toLocaleString('pt-AO')} KZ</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── DADOS BANCÁRIOS CONFIGURADOS ─────────────────────────────────────── */}
      <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Conta Bancária para Recebimento em Angola
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Conta configurada para liquidação automática e transferências no meio e fim do mês.
            </p>
          </div>
          <button
            onClick={() => setShowBankModal(true)}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            {profile?.bankName ? 'Alterar Dados Bancários' : 'Adicionar Conta Bancária'}
          </button>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Banco Selecionado</span>
            <p className="text-sm font-bold text-white mt-0.5">
              {profile?.bankName || 'Nenhum banco configurado'}
            </p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Titular / Beneficiário</span>
            <p className="text-sm font-bold text-white mt-0.5">
              {profile?.accountHolder || profile?.name || '—'}
            </p>
          </div>
          <div>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">IBAN de Angola (AO06)</span>
            <p className="text-sm font-mono font-bold text-cyan-400 mt-0.5 truncate">
              {profile?.iban ? formatAngolaIban(profile.iban) : 'Não informado'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── TABELA DE PARCEIROS E ANUNCIANTES INDICADOS (REAIS) ───────────────── */}
      <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Parceiros & Anunciantes Cadastrados com Seu Código
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Lista real de empresas associadas à sua carteira de indicação.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {dashboardData?.totalReferralsCount || 0} cadastros
          </span>
        </div>

        {(!dashboardData?.referrals || dashboardData.referrals.length === 0) ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            Nenhum parceiro ou anunciante indicado ainda. Compartilhe seu link exclusivo para começar a receber comissões recorrentes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Nome da Organização</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-right">Faturamento Gerado</th>
                  <th className="py-3 px-4 text-right">Comissões Pagas a Você</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {dashboardData.referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {ref.referredName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        ref.referredType === 'CLIENT'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : ref.referredType === 'ADVERTISER'
                          ? 'bg-pink-500/10 text-pink-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {ref.referredType === 'CLIENT' ? 'Estabelecimento (SaaS)' : ref.referredType === 'ADVERTISER' ? 'Anunciante' : 'Dono de Display'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {parseFloat(String(ref.totalRevenueGeneratedKz || 0)).toLocaleString('pt-AO')} KZ
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      +{parseFloat(String(ref.totalCommissionsEarnedKz || 0)).toLocaleString('pt-AO')} KZ
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: CONFIGURAR CONTA BANCÁRIA (ANGOLA) ────────────────────────── */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1120] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Configurar Conta Bancária (Angola)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe a conta para onde o financeiro da Nexora transferirá as suas comissões nos dias de liquidação.
            </p>

            {bankSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Conta bancária guardada com sucesso!</span>
              </div>
            ) : (
              <form onSubmit={handleSaveBank} className="space-y-4">
                {bankError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {bankError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Banco de Angola
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    required
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="">Selecione o seu banco...</option>
                    {ANGOLA_BANKS.map((b) => (
                      <option key={b.code} value={b.fullName}>
                        {b.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nome Completo do Titular / Beneficiário
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Nome conforme consta no comprovativo bancário"
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    IBAN de Angola (AO06)
                  </label>
                  <input
                    type="text"
                    required
                    value={iban}
                    onChange={(e) => setIban(e.target.value.toUpperCase())}
                    placeholder="AO06 0000 0000 0000 0000 0000 0"
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowBankModal(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={bankSaving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    {bankSaving ? 'Salvando...' : 'Guardar Conta'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: SOLICITAR SAQUE ───────────────────────────────────────────── */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1120] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              Solicitar Saque de Comissões
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Os valores serão transferidos diretamente para os seus dados bancários registrados.
            </p>

            {payoutSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Solicitação de saque enviada com sucesso! O comprovativo será anexado após liquidação.</span>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                {payoutError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {payoutError}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Saldo Disponível:</span>
                    <span className="text-white font-mono font-bold">
                      {(dashboardData?.pendingBalanceKz || 0).toLocaleString('pt-AO')} KZ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Mínimo para Saque:</span>
                    <span className="text-emerald-400 font-mono">
                      {(settings?.minimum_payout_amount_kz || 25000).toLocaleString('pt-AO')} KZ
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status do Ciclo:</span>
                    <span className={`font-semibold ${cycle.isCycleOpen ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {cycle.isCycleOpen ? 'Janela Aberta' : 'Janela Fechada'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Valor a Sacar (KZ)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={settings?.minimum_payout_amount_kz || 25000}
                      max={dashboardData?.pendingBalanceKz || 0}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="Ex: 50000"
                      className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setPayoutAmount(String(dashboardData?.pendingBalanceKz || 0))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider"
                    >
                      Total
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Destino do Pagamento</p>
                  <p className="font-semibold text-white mt-0.5">{profile?.bankName || 'Nenhum banco configurado'}</p>
                  <p className="text-cyan-400 font-mono text-[11px] truncate">{profile?.iban || 'IBAN não cadastrado'}</p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPayoutModal(false)}
                    className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={payoutLoading || (dashboardData?.pendingBalanceKz || 0) < (settings?.minimum_payout_amount_kz || 25000)}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                  >
                    {payoutLoading ? 'Enviando...' : 'Confirmar Saque'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
