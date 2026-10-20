import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  CreditCard,
  ChevronLeft,
  Check,
  Calendar,
  FileText,
  ExternalLink,
  Download,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { affiliateRepository } from '../../../repositories/affiliateRepository';
import {
  Affiliate,
  AffiliatePayoutRequest,
  AffiliateSettings,
  PayoutCycleInfo,
  AffiliateDashboardKpi,
} from '../../../types/affiliate';
import { ANGOLA_BANKS, formatAngolaIban } from '../../../data/angolaBanks';

interface AffiliatePayoutsPageProps {
  onBack?: () => void;
}

export const AffiliatePayoutsPage: React.FC<AffiliatePayoutsPageProps> = ({ onBack }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Affiliate | null>(null);
  const [payouts, setPayouts] = useState<AffiliatePayoutRequest[]>([]);
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [dashboardData, setDashboardData] = useState<AffiliateDashboardKpi | null>(null);

  // Form states
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [iban, setIban] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Bank update state
  const [savingBank, setSavingBank] = useState(false);
  const [bankSavedMsg, setBankSavedMsg] = useState(false);

  // Comprovativo Modal state
  const [viewReceiptPayout, setViewReceiptPayout] = useState<AffiliatePayoutRequest | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [me, pList, setts, dash] = await Promise.all([
        affiliateRepository.getMe(),
        affiliateRepository.getPayouts(),
        affiliateRepository.getSettings(),
        affiliateRepository.getDashboard(),
      ]);
      setProfile(me);
      setPayouts(pList);
      setSettings(setts);
      setDashboardData(dash);

      if (me?.bankName) setBankName(me.bankName);
      if (me?.accountHolder) setAccountHolder(me.accountHolder);
      if (me?.iban) setIban(me.iban);
    } catch (err) {
      console.error('Erro ao carregar dados de saques:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    setErrorMsg(null);
    try {
      if (!bankName || !accountHolder || !iban) {
        throw new Error('Preencha o banco, titular e IBAN.');
      }
      await affiliateRepository.updateBankAccount({
        bankName,
        accountHolder,
        iban,
      });
      setBankSavedMsg(true);
      setTimeout(() => setBankSavedMsg(false), 3000);
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao guardar dados bancários');
    } finally {
      setSavingBank(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const parsedAmount = parseFloat(amount);
      if (!parsedAmount || isNaN(parsedAmount)) throw new Error('Insira um valor numérico válido.');
      if (!bankName || !accountHolder || !iban) {
        throw new Error('Configure seus dados bancários antes de solicitar o saque.');
      }
      await affiliateRepository.requestPayout({
        amountKz: parsedAmount,
        bankName,
        accountHolder,
        iban,
      });
      setSuccessMsg(true);
      setAmount('');
      setTimeout(() => {
        setSuccessMsg(false);
        loadData();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao solicitar saque');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingBalance = profile?.pendingBalanceKz || 0;
  const totalPaid = profile?.totalPaidKz || 0;
  const minPayout = settings?.minimum_payout_amount_kz || 25000;

  const cycle: PayoutCycleInfo = dashboardData?.payoutCycle || {
    isCycleOpen: false,
    currentCycleName: 'Janela de Saque Fechada',
    nextCycleDate: '15 do próximo mês',
    daysUntilNextCycle: 0,
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
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
              <Wallet className="w-6 h-6 text-emerald-400" />
              Carteira & Saques de Comissões
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Configure sua conta bancária de Angola e acompanhe transferências e comprovativos de pagamento.
            </p>
          </div>
        </div>
      </div>

      {/* Ciclo de Pagamento Banner */}
      <div className={`p-5 rounded-2xl border transition-all ${
        cycle.isCycleOpen
          ? 'bg-gradient-to-r from-emerald-950/40 via-[#0B1528] to-teal-950/40 border-emerald-500/40'
          : 'bg-[#090E1A] border-amber-500/20'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl flex-shrink-0 ${
              cycle.isCycleOpen ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Ciclo Oficial de Liquidação:
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  cycle.isCycleOpen
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {cycle.isCycleOpen ? 'Janela Aberta' : 'Janela Fechada'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                {cycle.isCycleOpen
                  ? `${cycle.currentCycleName}. As solicitações de saque enviadas agora serão analisadas e pagas pelo financeiro da Nexora com envio do comprovativo bancário.`
                  : `Regra de Ciclo: Os saques são processados no meio do mês (dia 15) e no final do mês (dia 30/31). Próxima janela abre em: ${cycle.nextCycleDate} (${cycle.daysUntilNextCycle} dias restantes).`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#090E1A] border border-emerald-500/20">
          <span className="text-[11px] font-semibold uppercase text-emerald-400">Saldo Disponível para Saque</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {pendingBalance.toLocaleString('pt-AO')} <span className="text-xs text-emerald-400">KZ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Mínimo por solicitação: <span className="text-white font-mono">{minPayout.toLocaleString('pt-AO')} KZ</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090E1A] border border-blue-500/20">
          <span className="text-[11px] font-semibold uppercase text-blue-400">Total Já Transferido</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {totalPaid.toLocaleString('pt-AO')} <span className="text-xs text-blue-400">KZ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Liquidado diretamente na sua conta bancária</p>
        </div>

        <div className="p-5 rounded-2xl bg-[#090E1A] border border-white/[0.06]">
          <span className="text-[11px] font-semibold uppercase text-slate-400">Total Acumulado na Nexora</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">
            {((profile?.totalEarnedKz || 0)).toLocaleString('pt-AO')} <span className="text-xs text-slate-400">KZ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">Soma de comissões aprovadas e pagas</p>
        </div>
      </div>

      {/* Grid: Configuração Bancária + Solicitação de Saque */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Dados Bancários e Solicitação */}
        <div className="space-y-6 lg:col-span-1">
          {/* Caixa 1: Configurar Conta Bancária de Angola */}
          <div className="p-6 rounded-2xl bg-[#090E1A] border border-white/[0.06]">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-400" />
              Sua Conta Bancária (Angola)
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe a conta onde deseja receber as transferências interbancárias.
            </p>

            {bankSavedMsg && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                Dados bancários atualizados com sucesso!
              </div>
            )}

            <form onSubmit={handleSaveBankDetails} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Banco de Angola</label>
                <select
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-[#070B14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
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
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Nome do Titular / Beneficiário</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Nome completo do beneficiário"
                  className="w-full bg-[#070B14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">IBAN de Angola (AO06)</label>
                <input
                  type="text"
                  required
                  value={iban}
                  onChange={(e) => setIban(e.target.value.toUpperCase())}
                  placeholder="AO06 0000 0000 0000 0000 0000 0"
                  className="w-full bg-[#070B14] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={savingBank}
                className="w-full py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingBank ? 'Guardando...' : 'Guardar Dados Bancários'}
              </button>
            </form>
          </div>

          {/* Caixa 2: Solicitar Saque */}
          <div className="p-6 rounded-2xl bg-[#090E1A] border border-emerald-500/20">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              Solicitar Transferência
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              {cycle.isCycleOpen
                ? 'O ciclo está aberto. Informe o valor desejado para receber na sua conta bancária.'
                : `Atenção: Os saques só são permitidos na janela do meio e fim do mês (${cycle.nextCycleDate}).`}
            </p>

            {successMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2.5">
                <Check className="w-4 h-4 flex-shrink-0" />
                <span>Solicitação de saque enviada com sucesso!</span>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Valor do Saque (KZ)</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min={minPayout}
                      max={pendingBalance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Mínimo: ${minPayout.toLocaleString('pt-AO')} KZ`}
                      className="w-full bg-[#070B14] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setAmount(String(pendingBalance))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-400 uppercase tracking-wider"
                    >
                      Máximo
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Conta Destino</p>
                  <p className="font-semibold text-white mt-0.5">{bankName || 'Nenhum banco configurado'}</p>
                  <p className="text-cyan-400 font-mono text-[11px] truncate">{iban || 'IBAN não cadastrado'}</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || pendingBalance < minPayout || !cycle.isCycleOpen}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
                >
                  {submitting
                    ? 'Processando...'
                    : !cycle.isCycleOpen
                    ? 'Janela Fechada (Aguardar Ciclo)'
                    : pendingBalance < minPayout
                    ? 'Saldo Insuficiente'
                    : 'Confirmar Pedido de Saque'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Coluna 3: Histórico de Saques com Acesso aos Comprovativos */}
        <div className="lg:col-span-2 rounded-2xl bg-[#090E1A] border border-white/[0.06] p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Histórico de Saques & Comprovativos de Transferência
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Consulte os saques solicitados, confirmação de liquidação e comprovativos bancários emitidos.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-400">{payouts.length} solicitações</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">Carregando histórico...</div>
            ) : payouts.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs rounded-xl bg-white/[0.01] border border-dashed border-white/[0.08]">
                Nenhuma solicitação de saque realizada ainda. Quando você solicitar um saque no ciclo, ele aparecerá aqui.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/[0.02] border-b border-white/[0.06] text-slate-400 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Valor</th>
                      <th className="py-3 px-3">Banco / IBAN</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-center">Comprovativo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                          {new Date(p.createdAt).toLocaleDateString('pt-AO')}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-white">
                          {parseFloat(String(p.amountKz || 0)).toLocaleString('pt-AO')} KZ
                        </td>
                        <td className="py-3.5 px-3 text-slate-300">
                          <div className="font-semibold text-white">{p.bankName}</div>
                          <div className="font-mono text-[10px] text-slate-400 truncate max-w-[170px]">{p.iban}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                              p.status === 'PAID'
                                ? 'bg-blue-500/10 text-blue-400'
                                : p.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}
                          >
                            {p.status === 'PAID' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Liquidado
                              </>
                            ) : p.status === 'PENDING' ? (
                              <>
                                <Clock className="w-3 h-3" /> Em Análise
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" /> Recusado
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {p.status === 'PAID' ? (
                            <button
                              onClick={() => setViewReceiptPayout(p)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[11px] font-semibold transition-colors cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              Ver Comprovativo
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Aguardando liquidação</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── MODAL: VISUALIZAR COMPROVATIVO DE PAGAMENTO ──────────────────────── */}
      {viewReceiptPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1120] border border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Comprovativo de Transferência Bancária
              </h3>
              <button
                onClick={() => setViewReceiptPayout(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                  Valor Liquidado com Sucesso
                </span>
                <div className="text-2xl font-black text-white font-mono mt-1">
                  {parseFloat(String(viewReceiptPayout.amountKz || 0)).toLocaleString('pt-AO')} KZ
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Liquidado em {viewReceiptPayout.paidAt ? new Date(viewReceiptPayout.paidAt).toLocaleDateString('pt-AO') : 'Hoje'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Banco de Destino:</span>
                  <span className="text-white font-bold">{viewReceiptPayout.bankName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Titular da Conta:</span>
                  <span className="text-white">{viewReceiptPayout.accountHolder}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IBAN Creditado:</span>
                  <span className="text-cyan-400 truncate max-w-[220px]">{viewReceiptPayout.iban}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Observações / Ref:</span>
                  <span className="text-slate-300 max-w-[220px] text-right truncate">
                    {viewReceiptPayout.notes || 'Transferência Direta via EMIS / BNA'}
                  </span>
                </div>
              </div>

              {viewReceiptPayout.receiptUrl ? (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-emerald-500/30 space-y-3">
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Anexo Oficial do Banco Disponível
                  </span>
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-black/40 border border-white/10">
                    <span className="text-xs text-slate-300 truncate font-mono">
                      {viewReceiptPayout.receiptUrl}
                    </span>
                    <a
                      href={viewReceiptPayout.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors flex-shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> Abrir Anexo
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 text-slate-400 text-xs flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Transferência confirmada pelo departamento financeiro da Nexora Angola.</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewReceiptPayout(null)}
                  className="px-5 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
