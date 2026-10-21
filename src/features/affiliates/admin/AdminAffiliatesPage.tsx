import React, { useState, useEffect } from 'react';
import {
  Users,
  Percent,
  Coins,
  Settings,
  Save,
  Check,
  AlertCircle,
  Building2,
  Briefcase,
  Monitor,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  Sliders,
  DollarSign,
  ChevronLeft,
  UploadCloud,
  FileText,
  Trash2,
  Eye,
} from 'lucide-react';
import { affiliateRepository } from '../../../repositories/affiliateRepository';
import {
  Affiliate,
  AffiliateSettings,
  AffiliatePayoutRequest,
  AffiliateCommission,
} from '../../../types/affiliate';

interface AdminAffiliatesPageProps {
  onBack?: () => void;
}

export const AdminAffiliatesPage: React.FC<AdminAffiliatesPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'affiliates' | 'payouts' | 'commissions'>('settings');
  const [loading, setLoading] = useState(true);

  // Settings State
  const [settings, setSettings] = useState<AffiliateSettings>({
    client_saas_commission_pct: 10.0,
    advertiser_campaign_commission_pct: 7.0,
    display_owner_commission_pct: 8.0,
    display_ad_revshare_commission_pct: 3.0,
    minimum_payout_amount_kz: 25000,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedSuccess, setSettingsSavedSuccess] = useState(false);

  // Affiliates State
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [editingRatesModal, setEditingRatesModal] = useState(false);
  const [customClientPct, setCustomClientPct] = useState<string>('');
  const [customAdvPct, setCustomAdvPct] = useState<string>('');
  const [customDispPct, setCustomDispPct] = useState<string>('');
  const [updatingRates, setUpdatingRates] = useState(false);

  // Payouts State
  const [payouts, setPayouts] = useState<AffiliatePayoutRequest[]>([]);
  const [selectedPayout, setSelectedPayout] = useState<AffiliatePayoutRequest | null>(null);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [settlingPayout, setSettlingPayout] = useState(false);

  // Commissions State
  const [commissions, setCommissions] = useState<AffiliateCommission[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [setts, affs, pList, cList] = await Promise.all([
        affiliateRepository.getSettings(),
        affiliateRepository.getAllAffiliates(),
        affiliateRepository.getAllPayouts(),
        affiliateRepository.getAllCommissions(),
      ]);
      setSettings(setts);
      setAffiliates(affs);
      setPayouts(pList);
      setCommissions(cList);
    } catch (err) {
      console.error('Erro ao carregar dados do admin de afiliados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const updated = await affiliateRepository.updateSettings(settings);
      setSettings(updated);
      setSettingsSavedSuccess(true);
      setTimeout(() => setSettingsSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Erro ao salvar percentagens:', err);
      alert('Erro ao salvar configurações de comissão.');
    } finally {
      setSavingSettings(false);
    }
  };

  const openEditRates = (aff: Affiliate) => {
    setSelectedAffiliate(aff);
    setCustomClientPct(aff.customClientSaasPct !== undefined && aff.customClientSaasPct !== null ? String(aff.customClientSaasPct) : '');
    setCustomAdvPct(aff.customAdvertiserCampaignPct !== undefined && aff.customAdvertiserCampaignPct !== null ? String(aff.customAdvertiserCampaignPct) : '');
    setCustomDispPct(aff.customDisplayOwnerPct !== undefined && aff.customDisplayOwnerPct !== null ? String(aff.customDisplayOwnerPct) : '');
    setEditingRatesModal(true);
  };

  const handleSaveCustomRates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliate) return;
    setUpdatingRates(true);
    try {
      await affiliateRepository.updateAffiliateRates(selectedAffiliate.id, {
        customClientSaasPct: customClientPct !== '' ? parseFloat(customClientPct) : null,
        customAdvertiserCampaignPct: customAdvPct !== '' ? parseFloat(customAdvPct) : null,
        customDisplayOwnerPct: customDispPct !== '' ? parseFloat(customDispPct) : null,
      });
      setEditingRatesModal(false);
      loadAllData();
    } catch (err) {
      console.error('Erro ao atualizar taxas personalizadas:', err);
      alert('Erro ao atualizar taxas do afiliado.');
    } finally {
      setUpdatingRates(false);
    }
  };

  const handleToggleStatus = async (aff: Affiliate) => {
    const nextStatus = aff.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await affiliateRepository.updateAffiliateStatus(aff.id, nextStatus);
      loadAllData();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const [payoutReceiptUrl, setPayoutReceiptUrl] = useState('');
  const [payoutFileName, setPayoutFileName] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);

  const handleReceiptFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('O tamanho do ficheiro não pode exceder 10 MB.');
      return;
    }

    setIsUploadingReceipt(true);
    setPayoutFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPayoutReceiptUrl(reader.result);
      }
      setIsUploadingReceipt(false);
    };
    reader.onerror = () => {
      alert('Erro ao carregar o ficheiro de comprovativo.');
      setIsUploadingReceipt(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSettlePayout = async () => {
    if (!selectedPayout) return;
    setSettlingPayout(true);
    try {
      await affiliateRepository.settlePayout(selectedPayout.id, payoutNotes, payoutReceiptUrl);
      setSelectedPayout(null);
      setPayoutNotes('');
      setPayoutReceiptUrl('');
      setPayoutFileName('');
      loadAllData();
    } catch (err) {
      console.error('Erro ao liquidar saque:', err);
      alert('Erro ao liquidar saque.');
    } finally {
      setSettlingPayout(false);
    }
  };

  const totalAffiliatePending = affiliates.reduce((sum, a) => sum + parseFloat(String(a.pendingBalanceKz || 0)), 0);
  const totalAffiliatePaid = affiliates.reduce((sum, a) => sum + parseFloat(String(a.totalPaidKz || 0)), 0);
  const pendingPayoutsCount = payouts.filter((p) => p.status === 'PENDING').length;

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
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-1">
              Administração Global
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-emerald-400" />
              Gestão de Afiliados & Comissões Recorrentes
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Configure as taxas percentuais de comissão para cada recorrência, audite afilhados e aprove saques.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[#090E1A] border border-white/[0.06] rounded-2xl">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            Taxas de Recorrência
          </button>
          <button
            onClick={() => setActiveTab('affiliates')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'affiliates'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Afiliados ({affiliates.length})
          </button>
          <button
            onClick={() => setActiveTab('payouts')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'payouts'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Saques {pendingPayoutsCount > 0 && `(${pendingPayoutsCount})`}
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'commissions'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Extrato Geral
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#090E1A] border border-white/[0.06]">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total de Afiliados</span>
          <div className="text-xl font-bold text-white mt-1">{affiliates.length} cadastrados</div>
        </div>
        <div className="p-4 rounded-2xl bg-[#090E1A] border border-amber-500/20">
          <span className="text-[11px] font-semibold uppercase text-amber-400">Comissões Pendentes de Saque</span>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            {totalAffiliatePending.toLocaleString('pt-AO')} KZ
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#090E1A] border border-blue-500/20">
          <span className="text-[11px] font-semibold uppercase text-blue-400">Total Já Pago a Afiliados</span>
          <div className="text-xl font-bold text-blue-400 font-mono mt-1">
            {totalAffiliatePaid.toLocaleString('pt-AO')} KZ
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-[#090E1A] border border-emerald-500/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-400">Pedidos de Saque Aguardando</span>
          <div className="text-xl font-bold text-emerald-400 mt-1">{pendingPayoutsCount} solicitações</div>
        </div>
      </div>

      {/* ─── TAB 1: CONFIGURADOR DE PERCENTAGENS DE RECORRÊNCIA (SOLICITAÇÃO PRINCIPAL DO USUÁRIO) ─── */}
      {activeTab === 'settings' && (
        <div className="rounded-2xl bg-[#090E1A] border border-emerald-500/20 p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-emerald-400" />
                Definição de Percentagens para cada Recorrência
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ajuste os percentuais que os afiliados recebem de forma contínua em cada tipo de pagamento dos seus afilhados.
              </p>
            </div>
            {settingsSavedSuccess && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-fade-in">
                <Check className="w-4 h-4" />
                Percentagens atualizadas com sucesso no banco de dados!
              </div>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Recorrência 1: Estabelecimentos (CLIENT) */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-cyan-500/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Recorrência: Estabelecimentos (CLIENT)</h3>
                    <p className="text-[11px] text-slate-400">Sobre planos SaaS mensais pagos pelo ponto comercial</p>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Comissão Recorrente Mensal (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={settings.client_saas_commission_pct}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          client_saas_commission_pct: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Exemplo: Plano de 250.000 KZ/mês → Afiliado recebe{' '}
                    <span className="text-cyan-400 font-bold font-mono">
                      {((250000 * settings.client_saas_commission_pct) / 100).toLocaleString('pt-AO')} KZ
                    </span>{' '}
                    todo mês enquanto o cliente continuar ativo.
                  </p>
                </div>
              </div>

              {/* Recorrência 2: Anunciantes (ADVERTISER) */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-pink-500/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Recorrência: Anunciantes (ADVERTISER)</h3>
                    <p className="text-[11px] text-slate-400">Sobre cada campanha publicitária contratada</p>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Comissão Recorrente por Campanha (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={settings.advertiser_campaign_commission_pct}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          advertiser_campaign_commission_pct: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-pink-400 font-mono font-bold focus:outline-none focus:border-pink-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Exemplo: Campanha de 750.000 KZ → Afiliado recebe{' '}
                    <span className="text-pink-400 font-bold font-mono">
                      {((750000 * settings.advertiser_campaign_commission_pct) / 100).toLocaleString('pt-AO')} KZ
                    </span>{' '}
                    a cada nova veiculação paga pelo anunciante.
                  </p>
                </div>
              </div>

              {/* Recorrência 3: Donos de Display (DISPLAY_OWNER) */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-emerald-500/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Recorrência: Donos de Displays</h3>
                    <p className="text-[11px] text-slate-400">Sobre subscrições de totens e telas na rede</p>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Comissão Recorrente Mensal (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={settings.display_owner_commission_pct}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          display_owner_commission_pct: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Exemplo: Subscrição de 850.000 KZ → Afiliado recebe{' '}
                    <span className="text-emerald-400 font-bold font-mono">
                      {((850000 * settings.display_owner_commission_pct) / 100).toLocaleString('pt-AO')} KZ
                    </span>{' '}
                    recorrente mensalmente.
                  </p>
                </div>
              </div>

              {/* Recorrência 4: Anúncios Veiculados no Display Indicado */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-purple-500/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Recorrência: RevShare de Anúncios no Display</h3>
                    <p className="text-[11px] text-slate-400">Afiliado que trouxe o ponto ganha quando anúncio exibe nele</p>
                  </div>
                </div>
                <div className="pt-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Comissão por Veiculação no Display (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      required
                      value={settings.display_ad_revshare_commission_pct}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          display_ad_revshare_commission_pct: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-purple-400 font-mono font-bold focus:outline-none focus:border-purple-500"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    O afiliado que instalou o display recebe comissão passiva contínua sempre que marcas anunciarem naquele ponto.
                  </p>
                </div>
              </div>
            </div>

            {/* Configuração de Saque Mínimo */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Valor Mínimo para Solicitação de Saque</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Valor em Kwanzas necessário para que o afiliado possa solicitar transferência bancária.
                </p>
              </div>
              <div className="w-48">
                <div className="relative">
                  <input
                    type="number"
                    step="5000"
                    min="5000"
                    required
                    value={settings.minimum_payout_amount_kz}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        minimum_payout_amount_kz: parseFloat(e.target.value) || 25000,
                      })
                    }
                    className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-emerald-400 font-bold">KZ</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savingSettings ? 'Salvando...' : 'Salvar Percentagens no Banco de Dados'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB 2: LISTA DE AFILIADOS E AJUSTE INDIVIDUAL DE TAXAS ───────────────── */}
      {activeTab === 'affiliates' && (
        <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Todos os Afiliados Cadastrados</h3>
            <span className="text-xs text-slate-400 font-mono">{affiliates.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Afiliado</th>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Taxas Ativas</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Saldo Pendente</th>
                  <th className="py-3 px-4 text-right">Total Pago</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {affiliates.map((aff) => {
                  const clientPct = aff.customClientSaasPct ?? settings.client_saas_commission_pct;
                  const advPct = aff.customAdvertiserCampaignPct ?? settings.advertiser_campaign_commission_pct;

                  return (
                    <tr key={aff.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div>
                          <p className="font-bold">{aff.name}</p>
                          <p className="text-[11px] text-slate-400 font-normal">{aff.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-xs">
                        {aff.referralCode}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-300">
                        <div>
                          Clientes: <span className="text-cyan-400 font-mono font-bold">{clientPct}%</span>
                        </div>
                        <div>
                          Anunciantes: <span className="text-pink-400 font-mono font-bold">{advPct}%</span>
                        </div>
                        {(aff.customClientSaasPct !== null && aff.customClientSaasPct !== undefined) && (
                          <span className="text-[9px] text-amber-400 font-bold uppercase">(Taxa Personalizada)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full font-medium ${
                            aff.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          {aff.status === 'ACTIVE' ? 'Ativo' : 'Suspenso'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {parseFloat(String(aff.pendingBalanceKz || 0)).toLocaleString('pt-AO')} KZ
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {parseFloat(String(aff.totalPaidKz || 0)).toLocaleString('pt-AO')} KZ
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditRates(aff)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            Editar Taxas
                          </button>
                          <button
                            onClick={() => handleToggleStatus(aff)}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            {aff.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 3: SAQUES & LIQUIDAÇÃO ───────────────────────────────────────── */}
      {activeTab === 'payouts' && (
        <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Solicitações de Transferência Bancária</h3>
            <span className="text-xs text-amber-400 font-semibold">{pendingPayoutsCount} pendentes de pagamento</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Afiliado</th>
                  <th className="py-3 px-4">Valor</th>
                  <th className="py-3 px-4">Banco & IBAN</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(p.createdAt).toLocaleDateString('pt-AO')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {p.affiliateName || 'Afiliado'}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {parseFloat(String(p.amountKz || 0)).toLocaleString('pt-AO')} KZ
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-semibold">{p.bankName} • {p.accountHolder}</div>
                      <div className="font-mono text-[10px] text-slate-400">{p.iban}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full font-medium ${
                          p.status === 'PAID'
                            ? 'bg-blue-500/10 text-blue-400'
                            : p.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {p.status === 'PAID' ? 'Liquidado' : 'Aguardando Pagamento'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.status === 'PENDING' ? (
                        <button
                          onClick={() => setSelectedPayout(p)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Liquidar Saque
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono">Pago</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: EXTRATO GERAL DE COMISSÕES ─────────────────────────────────── */}
      {activeTab === 'commissions' && (
        <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Todas as Comissões Recorrentes da Plataforma</h3>
            <span className="text-xs text-slate-400 font-mono">{commissions.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Afiliado Beneficiário</th>
                  <th className="py-3 px-4">Origem / Evento</th>
                  <th className="py-3 px-4">Descrição</th>
                  <th className="py-3 px-4 text-right">Valor Pago</th>
                  <th className="py-3 px-4 text-center">Taxa</th>
                  <th className="py-3 px-4 text-right">Comissão</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {commissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(comm.createdAt).toLocaleDateString('pt-AO')}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white">
                      {comm.affiliateName || 'Afiliado'}
                    </td>
                    <td className="py-3.5 px-4">
                      {comm.sourceType === 'SAAS_PLAN' ? (
                        <span className="text-cyan-400 font-medium">Plano Estabelecimento</span>
                      ) : comm.sourceType === 'CAMPAIGN' ? (
                        <span className="text-pink-400 font-medium">Campanha Anúncio</span>
                      ) : (
                        <span className="text-emerald-400 font-medium">Display Owner</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                      {comm.sourceDescription}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                      {parseFloat(String(comm.paymentAmountKz || 0)).toLocaleString('pt-AO')} KZ
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-400">
                      {comm.commissionRate}%
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      +{parseFloat(String(comm.commissionAmountKz || 0)).toLocaleString('pt-AO')} KZ
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] rounded-full font-medium ${
                          comm.status === 'PAID'
                            ? 'bg-blue-500/10 text-blue-400'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}
                      >
                        {comm.status === 'PAID' ? 'Pago' : 'Aprovado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDITAR TAXAS PERSONALIZADAS DO AFILIADO ──────────────────── */}
      {editingRatesModal && selectedAffiliate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1120] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Taxas Personalizadas: {selectedAffiliate.name}
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Defina percentagens exclusivas para este afiliado. Deixe em branco para usar as taxas globais padrão.
            </p>

            <form onSubmit={handleSaveCustomRates} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Taxa Estabelecimentos / SaaS (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={customClientPct}
                  onChange={(e) => setCustomClientPct(e.target.value)}
                  placeholder={`Padrão Global: ${settings.client_saas_commission_pct}%`}
                  className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2 text-xs text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Taxa Campanhas / Anunciantes (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={customAdvPct}
                  onChange={(e) => setCustomAdvPct(e.target.value)}
                  placeholder={`Padrão Global: ${settings.advertiser_campaign_commission_pct}%`}
                  className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2 text-xs text-pink-400 font-mono font-bold focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Taxa Donos de Displays (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={customDispPct}
                  onChange={(e) => setCustomDispPct(e.target.value)}
                  placeholder={`Padrão Global: ${settings.display_owner_commission_pct}%`}
                  className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setEditingRatesModal(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updatingRates}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {updatingRates ? 'Salvando...' : 'Salvar Taxas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: LIQUIDAR SAQUE ───────────────────────────────────────────── */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1120] border border-white/10 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Confirmar Liquidação de Saque
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Confirme que realizou a transferência bancária para o afiliado.
            </p>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2 mb-4 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Afiliado:</span>
                <span className="text-white font-bold">{selectedPayout.affiliateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor a Transferir:</span>
                <span className="text-emerald-400 font-bold">
                  {parseFloat(String(selectedPayout.amountKz || 0)).toLocaleString('pt-AO')} KZ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Banco:</span>
                <span className="text-white">{selectedPayout.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Titular:</span>
                <span className="text-white">{selectedPayout.accountHolder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IBAN:</span>
                <span className="text-cyan-400 truncate max-w-[200px]">{selectedPayout.iban}</span>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Comprovativo de Pagamento (Upload Imagem ou PDF) *
              </label>

              {payoutReceiptUrl ? (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 truncate">
                    {payoutReceiptUrl.startsWith('data:image') || payoutReceiptUrl.match(/\.(jpeg|jpg|png|webp)/i) ? (
                      <img
                        src={payoutReceiptUrl}
                        alt="Preview comprovativo"
                        className="w-10 h-10 object-cover rounded-lg border border-emerald-500/30 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}
                    <div className="truncate text-left">
                      <p className="text-xs font-bold text-white truncate">
                        {payoutFileName || 'Comprovativo de Pagamento'}
                      </p>
                      <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ficheiro carregado com sucesso
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPayoutReceiptUrl('');
                      setPayoutFileName('');
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Remover ficheiro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-white/[0.02] hover:bg-emerald-500/[0.03]">
                    <UploadCloud className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="text-xs font-semibold text-white">
                      Clique para carregar o comprovativo ou arraste até aqui
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Suporta Imagens (PNG, JPG, WEBP) ou PDF (até 10MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleReceiptFileUpload}
                      className="hidden"
                    />
                  </label>
                  {isUploadingReceipt && (
                    <p className="text-[11px] text-cyan-400 animate-pulse text-center mt-1">
                      A processar ficheiro...
                    </p>
                  )}
                </div>
              )}

              {/* Opção alternativa de URL */}
              <div className="pt-1">
                <input
                  type="text"
                  value={payoutReceiptUrl.startsWith('data:') ? '' : payoutReceiptUrl}
                  onChange={(e) => {
                    setPayoutReceiptUrl(e.target.value);
                    setPayoutFileName('Link Externo');
                  }}
                  placeholder="Ou cole o link direto do comprovativo (https://...)"
                  className="w-full bg-[#070B14] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <p className="text-[10px] text-slate-400">
                O afilhado terá acesso imediato a este comprovativo na sua aba de extratos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedPayout(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-slate-300 text-xs font-semibold hover:bg-white/5 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleSettlePayout}
                disabled={settlingPayout}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                {settlingPayout ? 'Liquidando...' : 'Confirmar Pagamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
