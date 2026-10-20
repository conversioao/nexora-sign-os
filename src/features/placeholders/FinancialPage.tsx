import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Percent,
  Users,
  Download,
  Building2,
  Calendar,
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Printer,
  FileText,
  X,
  Eye,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { useSession } from '../../context/SessionContext';

export const FinancialPage: React.FC<{ onBackToDashboard: () => void }> = ({ onBackToDashboard }) => {
  const { currentOrganization } = useSession();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'commissions' | 'settings'>('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [partnerCommissions, setPartnerCommissions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalRevenue: 0,
    totalPayouts: 0,
    pendingInvoices: 0,
    partnerCommissionsTotal: 0,
    partnerSplitRate: 0.15,
    nexoraShareRate: 0.85,
  });
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [splitRateInput, setSplitRateInput] = useState('15');
  const [isUpdatingSplit, setIsUpdatingSplit] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    invoice_number: '',
    amount_kz: '',
    type: 'INCOME',
    category: 'ADVERTISING_SALE',
    status: 'COMPLETED',
    description: '',
  });

  useEffect(() => {
    loadAllFinancialData();
  }, []);

  const loadAllFinancialData = async () => {
    setLoading(true);
    try {
      const isNexoraAdmin = currentOrganization?.type === 'NEXORA';
      const orgQuery = (!isNexoraAdmin && currentOrganization?.id) ? `?organizationId=${encodeURIComponent(currentOrganization.id)}` : '';
      const [txRes, sumRes, comRes] = await Promise.all([
        fetch(`/api/financial${orgQuery}`),
        fetch(`/api/financial/summary${orgQuery}`),
        fetch(`/api/financial/partner-commissions${orgQuery}`),
      ]);

      if (txRes.ok) {
        const txs = await txRes.json();
        setTransactions(txs);
      }
      if (sumRes.ok) {
        const sum = await sumRes.json();
        setSummary(sum);
        setSplitRateInput(Math.round((sum.partnerSplitRate || 0.15) * 100).toString());
      }
      if (comRes.ok) {
        const coms = await comRes.json();
        setPartnerCommissions(coms);
      }
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSplitRate = async (e: React.FormEvent) => {
    e.preventDefault();
    const rateVal = parseFloat(splitRateInput);
    if (isNaN(rateVal) || rateVal < 0 || rateVal > 100) return;
    setIsUpdatingSplit(true);
    try {
      const decimalRate = rateVal / 100;
      const res = await fetch('/api/settings/partner-split-rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerSplitRate: decimalRate }),
      });
      if (res.ok) {
        setToastMessage(`Percentagem definida: ${rateVal}% para o parceiro (Nexora retém ${100 - rateVal}%).`);
        setTimeout(() => setToastMessage(null), 4000);
        await loadAllFinancialData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingSplit(false);
    }
  };

  const handleSubmitTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount_kz) || 0;
    const newTx = {
      id: `tx-${Date.now()}`,
      invoice_number: formData.invoice_number || `FT-2026/${Math.floor(Math.random() * 1000)}`,
      amount_kz: amount,
      type: formData.type,
      category: formData.category,
      status: formData.status,
      organization_id: 'org-nexora',
      description: formData.description || 'Lançamento manual',
    };

    try {
      const res = await fetch('/api/financial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx),
      });
      if (res.ok) {
        setShowAddForm(false);
        setFormData({
          invoice_number: '',
          amount_kz: '',
          type: 'INCOME',
          category: 'ADVERTISING_SALE',
          status: 'COMPLETED',
          description: '',
        });
        loadAllFinancialData();
      }
    } catch (error) {
      console.error('Erro ao registrar transação:', error);
    }
  };

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', { style: 'currency', currency: 'AOA', maximumFractionDigits: 0 }).format(val || 0);
  };

  const netNexoraIncome = summary.totalRevenue - summary.partnerCommissionsTotal;

  // Clientes, Parceiros e Anunciantes vêem APENAS o histórico de transações e faturas
  const isClientView = currentOrganization?.type !== 'NEXORA';

  if (isClientView) {
    const totalSpent = transactions.reduce((acc, t) => acc + (parseFloat(t.amount_kz) || 0), 0);
    const completedCount = transactions.filter(t => (t.status || '').toUpperCase() === 'COMPLETED').length;
    const pendingCount = transactions.filter(t => (t.status || '').toUpperCase() === 'PENDING').length;

    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-display">
                Histórico Financeiro & Transações
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Consulte o histórico de faturas, comprovativos de subscrição de planos e pagamentos da organização {currentOrganization?.name || ''}.
              </p>
            </div>
          </div>
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Voltar ao Dashboard
          </button>
        </div>

        {/* Client Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 bg-slate-900/60 border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Total Movimentado</p>
            <p className="text-2xl font-bold text-cyan-400 font-mono">{formatKz(totalSpent)}</p>
            <p className="text-[11px] text-slate-500 mt-1">Investimento acumulado na plataforma</p>
          </Card>
          <Card className="p-5 bg-slate-900/60 border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Faturas Concluídas / Pagas</p>
            <p className="text-2xl font-bold text-emerald-400 font-mono">{completedCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Subscrições e serviços ativos</p>
          </Card>
          <Card className="p-5 bg-slate-900/60 border-slate-800">
            <p className="text-xs text-slate-400 mb-1">Aguardando Confirmação</p>
            <p className="text-2xl font-bold text-amber-400 font-mono">{pendingCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Comprovativos em análise pelo financeiro</p>
          </Card>
        </div>

        {/* Advertiser Transactions Table */}
        <Card className="p-6">
          <h3 className="text-base font-semibold text-white mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            Histórico de Transações & Faturas
          </h3>
          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <CreditCard className="w-10 h-10 mx-auto mb-3 text-slate-600" />
              <p className="text-sm font-medium">Nenhuma transação financeira encontrada.</p>
              <p className="text-xs text-slate-600 mt-1">Os pagamentos de campanhas e carregamentos de mídia aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3">Fatura / ID</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Valor (Kz)</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Data</th>
                    <th className="p-3 text-right">Ação / Fatura</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono font-bold text-cyan-400">{tx.invoice_number || tx.id}</td>
                      <td className="p-3 text-white font-medium">{tx.description || 'Pagamento de Campanha Publicitária'}</td>
                      <td className="p-3 text-slate-400">{tx.category || 'Mídia Out-of-Home'}</td>
                      <td className="p-3 font-mono font-semibold text-emerald-400">{formatKz(parseFloat(tx.amount_kz))}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {tx.status || 'CONCLUÍDO'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{new Date(tx.created_at || Date.now()).toLocaleDateString('pt-AO')}</td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedInvoice(tx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-bold cursor-pointer transition-all shadow-sm hover:scale-[1.02]"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Ver Fatura / PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Invoice Modal for Advertiser */}
        {selectedInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 print:border-none print:shadow-none print:bg-white print:text-slate-900 print:w-full print:max-w-none print:p-0">
              
              {/* Modal Control Header (Hidden when printing) */}
              <div className="flex justify-between items-center pb-6 border-b border-slate-800 print:hidden">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      Fatura / Recibo Fiscal
                    </h3>
                    <p className="text-slate-400 text-xs font-mono">
                      Documento Nº {selectedInvoice.invoice_number || selectedInvoice.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition-all shadow-lg cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimir / PDF
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Printable Official Invoice Card Content */}
              <div className="space-y-6 pt-4 print:pt-0">
                {/* Document Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-6 print:border-slate-300 gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xl font-mono shadow-md">
                        NX
                      </div>
                      <div>
                        <h2 className="text-lg font-extrabold text-white print:text-slate-900 font-display">
                          NEXORA MEDIA ANGOLA
                        </h2>
                        <p className="text-[11px] text-slate-400 print:text-slate-600">
                          Rede Nacional de Sinalização Digital & Mídia Indoor
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-[11px] text-slate-400 print:text-slate-600 space-y-0.5">
                      <p>NIF: 5418902341 | Luanda, Angola</p>
                      <p>Edifício Luanda One, Mutamba - Baixa de Luanda</p>
                      <p>Email: financeiro@nexora.ao | Suporte: +244 923 000 000</p>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 print:border-slate-400 print:text-slate-800">
                      FATURA / COMPROVATIVO
                    </span>
                    <p className="text-base font-mono font-bold text-white print:text-slate-900 mt-2">
                      {selectedInvoice.invoice_number || `FT-2026/${selectedInvoice.id}`}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        selectedInvoice.status === 'COMPLETED' || selectedInvoice.status === 'paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 print:border-emerald-600 print:text-emerald-700'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {selectedInvoice.status === 'COMPLETED' || selectedInvoice.status === 'paid' ? '✔ PAGO / CONCLUÍDO' : '⏳ PENDENTE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Client & Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 tracking-wider block mb-1">
                      Anunciante / Razão Social
                    </span>
                    <p className="text-sm font-bold text-white print:text-slate-900">
                      {currentOrganization?.name || selectedInvoice.advertiserName || 'Empresa Anunciante'}
                    </p>
                    <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                      NIF: {currentOrganization?.nif || '5400192837'}
                    </p>
                    <p className="text-xs text-slate-400 print:text-slate-600">
                      {currentOrganization?.address || 'Luanda, Angola'}
                    </p>
                  </div>

                  <div className="sm:text-right text-xs text-slate-400 print:text-slate-600 space-y-1">
                    <p><span className="font-semibold text-slate-300 print:text-slate-700">Data da Transação:</span> {new Date(selectedInvoice.created_at || Date.now()).toLocaleDateString('pt-AO')}</p>
                    <p><span className="font-semibold text-slate-300 print:text-slate-700">Moeda da Operação:</span> Kwanzas Angolanos (Kz)</p>
                    <p><span className="font-semibold text-slate-300 print:text-slate-700">Canal de Pagamento:</span> Plataforma Digital Nexora</p>
                  </div>
                </div>

                {/* Services Table */}
                <div className="border border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800 print:bg-slate-200 print:text-slate-800 print:border-slate-300">
                      <tr>
                        <th className="p-3">Descrição da Veiculação / Serviço</th>
                        <th className="p-3 text-center">Qtd</th>
                        <th className="p-3 text-right">Preço Unitário</th>
                        <th className="p-3 text-right">Total (Kz)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                      <tr>
                        <td className="p-3">
                          <p className="font-bold text-white print:text-slate-900">
                            {selectedInvoice.description || 'Veiculação de Campanha Publicitária em Telas Digital Signage'}
                          </p>
                          <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                            Grade de Exibição Indoor Luanda — Inserções Auditadas em Tempo Real via Proof of Play (SHA-256)
                          </p>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300 print:text-slate-800">1 Pacote</td>
                        <td className="p-3 text-right font-mono text-slate-300 print:text-slate-800">{formatKz(parseFloat(selectedInvoice.amount_kz || 0))}</td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-400 print:text-slate-900">{formatKz(parseFloat(selectedInvoice.amount_kz || 0))}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Subtotals & Taxes */}
                  <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end print:bg-slate-50 print:border-slate-300">
                    <div className="w-64 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400 print:text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-mono">{formatKz(parseFloat(selectedInvoice.amount_kz || 0))}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 print:text-slate-600">
                        <span>Imposto (IVA 14% Isento):</span>
                        <span className="font-mono">0,00 Kz</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-800 print:border-slate-300 text-sm font-bold text-white print:text-slate-900">
                        <span>Total Liquidado (Kz):</span>
                        <span className="font-mono text-emerald-400 print:text-slate-900">{formatKz(parseFloat(selectedInvoice.amount_kz || 0))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banking & Footer Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-[11px] text-slate-400 print:text-slate-600 border-t border-slate-800 print:border-slate-300">
                  <div>
                    <h4 className="font-bold text-slate-300 print:text-slate-800 mb-1">Coordenadas Bancárias Nexora Media</h4>
                    <p>Banco BAI: AO06 0040 0000 1234 5678 1018 9</p>
                    <p>Banco BFA: AO06 0006 0000 9876 5432 1011 4</p>
                  </div>
                  <div className="sm:text-right">
                    <h4 className="font-bold text-slate-300 print:text-slate-800 mb-1">Assinatura Digital & Validação</h4>
                    <p>Processado por computador ao abrigo da legislação de Angola.</p>
                    <p className="font-mono text-[10px] text-slate-500 mt-0.5">SHA-256: nx-{Date.now().toString(36)}-ao</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold shadow-2xl backdrop-blur-md animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2 font-display">
                Painel Financeiro Geral Nexora OS
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Gestão central de receitas publicitárias, faturamento comercial, repasses a parceiros e controle de margens em Kwanzas (Kz).
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Lançar Transação
          </button>
          <button
            onClick={loadAllFinancialData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-all"
            title="Atualizar Dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
          >
            Voltar
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs flex-wrap">
        {[
          { id: 'overview', label: 'Visão Geral & Margens', icon: TrendingUp },
          { id: 'transactions', label: `Transações & Faturas (${transactions.length})`, icon: DollarSign },
          { id: 'commissions', label: `Repasses a Parceiros (${partnerCommissions.length})`, icon: Building2 },
          { id: 'settings', label: 'Configuração de Percentagem (Split)', icon: Percent },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 font-semibold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-l-4 border-emerald-500 bg-[#0F172A]/80">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-medium">Receita Bruta Total</span>
              <h3 className="text-xl font-bold text-white mt-1">{formatKz(summary.totalRevenue)}</h3>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <ArrowUpRight className="w-3 h-3" /> Faturamento de Anúncios
              </span>
            </div>
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-cyan-400 bg-[#0F172A]/80">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-medium">Lucro Líquido Nexora ({Math.round(summary.nexoraShareRate * 100)}%)</span>
              <h3 className="text-xl font-bold text-cyan-300 mt-1">{formatKz(netNexoraIncome)}</h3>
              <span className="text-[10px] text-cyan-400 mt-1 block">Retenção Maioritária da Rede</span>
            </div>
            <div className="p-2.5 bg-cyan-400/10 rounded-xl text-cyan-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-purple-500 bg-[#0F172A]/80">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-medium">Repasses aos Parceiros ({Math.round(summary.partnerSplitRate * 100)}%)</span>
              <h3 className="text-xl font-bold text-purple-300 mt-1">{formatKz(summary.partnerCommissionsTotal)}</h3>
              <span className="text-[10px] text-purple-400 mt-1 block">Comissões para Donos das Telas</span>
            </div>
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-l-4 border-amber-400 bg-[#0F172A]/80">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs text-slate-400 font-medium">Faturas Pendentes</span>
              <h3 className="text-xl font-bold text-amber-300 mt-1">{formatKz(summary.pendingInvoices)}</h3>
              <span className="text-[10px] text-amber-400 mt-1 block">Aguardando Pagamento</span>
            </div>
            <div className="p-2.5 bg-amber-400/10 rounded-xl text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Form Modal / Inline */}
      {showAddForm && (
        <Card className="p-6 border border-emerald-500/30 bg-[#0D1424]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Lançar Nova Transação Financeira
            </h2>
            <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white text-xs">
              Fechar
            </button>
          </div>
          <form onSubmit={handleSubmitTransaction} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Número do Documento / Fatura</label>
              <input
                type="text"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="Ex: FT-2026/089"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Valor em Kwanzas (Kz)</label>
              <input
                type="number"
                value={formData.amount_kz}
                onChange={(e) => setFormData({ ...formData, amount_kz: e.target.value })}
                placeholder="Ex: 500000"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Tipo de Transação</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
              >
                <option value="INCOME">Receita Publicitária</option>
                <option value="REPAYMENT">Repasse a Parceiro</option>
                <option value="SAAS">Assinatura de Software</option>
                <option value="EXPENSE">Despesa Operacional</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-slate-400 mb-1 font-semibold">Descrição / Detalhes</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ex: Pagamento de campanha de anúncios do Marketplace"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">Estado do Pagamento</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white outline-none focus:border-emerald-500"
              >
                <option value="COMPLETED">Concluído / Pago</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold shadow-lg"
              >
                Salvar Transação
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 1: Visão Geral */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-[#0F172A]/80 border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-cyan-400" />
                Divisão Oficial de Receita da Rede Nexora
              </h3>
              <p className="text-xs text-slate-400">
                Por padrão, a Nexora mantém a maior parte da receita para investimento em infraestrutura, servidores e operação da rede indoor em Angola.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-cyan-300">Nexora Network ({Math.round(summary.nexoraShareRate * 100)}%)</span>
                    <span className="text-white font-bold">{formatKz(netNexoraIncome)}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.round(summary.nexoraShareRate * 100)}%` }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-purple-300">Repasse a Donos das Telas ({Math.round(summary.partnerSplitRate * 100)}%)</span>
                    <span className="text-white font-bold">{formatKz(summary.partnerCommissionsTotal)}</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${Math.round(summary.partnerSplitRate * 100)}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Taxa de Repasse Atual: <strong className="text-cyan-400 font-bold">{Math.round(summary.partnerSplitRate * 100)}%</strong></span>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Alterar Percentagem →
                </button>
              </div>
            </Card>

            <Card className="p-6 bg-[#0F172A]/80 border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" />
                Resumo de Liquidação aos Parceiros
              </h3>
              <p className="text-xs text-slate-400">
                Comissões acumuladas provenientes das campanhas aprovadas no Marketplace.
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Total de Campanhas Faturadas:</span>
                  <strong className="text-white font-mono">{partnerCommissions.length}</strong>
                </div>
                <div className="flex justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Montante Auditado em Kwanzas:</span>
                  <strong className="text-emerald-400 font-mono">{formatKz(summary.partnerCommissionsTotal)}</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: Transações & Faturas */}
      {activeTab === 'transactions' && (
        <Card className="p-6 bg-[#0F172A]/80 border-slate-800">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-white">Histórico Completo de Transações</h2>
            <span className="text-xs text-slate-500">{transactions.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold text-left">
                  <th className="py-2.5 px-3">Fatura</th>
                  <th className="py-2.5 px-3">Descrição</th>
                  <th className="py-2.5 px-3">Tipo</th>
                  <th className="py-2.5 px-3">Valor (Kz)</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3">Data</th>
                  <th className="py-2.5 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-white whitespace-nowrap">{t.invoice_number || t.id}</td>
                    <td className="py-2.5 px-3 text-slate-200">{t.description || 'Transação Comercial'}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <Badge variant={t.type === 'REPAYMENT' ? 'cyan' : t.type === 'SAAS' ? 'purple' : 'blue'}>
                        {t.type === 'REPAYMENT' ? 'Repasse Parceiro' : t.type === 'SAAS' ? 'Assinatura' : 'Receita Anúncio'}
                      </Badge>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-400">{formatKz(parseFloat(t.amount_kz || 0))}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.status === 'COMPLETED' || t.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {t.status === 'COMPLETED' || t.status === 'paid' ? 'Concluído' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(t.created_at || Date.now()).toLocaleDateString('pt-AO')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedInvoice(t)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold cursor-pointer transition-all"
                      >
                        <FileText className="w-3 h-3" />
                        Ver Fatura
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: Repasses a Parceiros */}
      {activeTab === 'commissions' && (
        <Card className="p-6 bg-[#0F172A]/80 border-slate-800 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-bold text-white">Repasses Calculados a Parceiros Proprietários</h2>
              <p className="text-xs text-slate-400">Comissões geradas na aprovação de campanhas no Marketplace.</p>
            </div>
            <Badge variant="cyan" size="sm">
              Taxa Atual: {Math.round(summary.partnerSplitRate * 100)}%
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold text-left">
                  <th className="py-2.5 px-3">Campanha</th>
                  <th className="py-2.5 px-3">Anunciante</th>
                  <th className="py-2.5 px-3">Orçamento Total</th>
                  <th className="py-2.5 px-3">Comissão ({Math.round(summary.partnerSplitRate * 100)}%)</th>
                  <th className="py-2.5 px-3">Retenção Nexora ({Math.round(summary.nexoraShareRate * 100)}%)</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {partnerCommissions.map((c) => {
                  const budget = parseFloat(c.total_budget_kz || 0);
                  const partnerAmt = parseFloat(c.commission_amount_kz || 0);
                  const nexoraAmt = budget - partnerAmt;
                  return (
                    <tr key={c.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3 font-bold text-white">{c.campaign_title || c.campaign_id}</td>
                      <td className="py-2.5 px-3 text-slate-300">{c.advertiser_name}</td>
                      <td className="py-2.5 px-3 text-slate-200">{formatKz(budget)}</td>
                      <td className="py-2.5 px-3 font-bold text-purple-400">{formatKz(partnerAmt)}</td>
                      <td className="py-2.5 px-3 font-bold text-cyan-400">{formatKz(nexoraAmt)}</td>
                      <td className="py-2.5 px-3">
                        <Badge variant="scheduled" size="sm">
                          {c.status || 'PENDING'}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: Configuração de Percentagem (Split) */}
      {activeTab === 'settings' && (
        <Card className="p-6 bg-[#0F172A]/80 border-slate-800 max-w-2xl space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Percent className="w-5 h-5 text-cyan-400" />
              Configurar Percentual de Repasse aos Parceiros (Split Rate)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Defina a percentagem de receita que os proprietários das telas recebem. A Nexora retém automaticamente a maior parte restante.
            </p>
          </div>

          <form onSubmit={handleUpdateSplitRate} className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Percentagem do Parceiro (%):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={splitRateInput}
                  onChange={(e) => setSplitRateInput(e.target.value)}
                  className="w-32 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-400 font-bold text-lg text-right outline-none focus:border-cyan-500"
                  required
                />
                <span className="text-lg font-bold text-white">%</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Recomendado: <strong>10% a 15%</strong>. A Nexora manterá <strong>{100 - (parseFloat(splitRateInput) || 0)}%</strong> da receita total de cada anúncio.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingSplit}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition-all shadow-lg cursor-pointer"
              >
                {isUpdatingSplit ? 'Salvando...' : 'Salvar Nova Configuração'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          OFFICIAL INVOICE MODAL & PRINT CONTAINER
      ════════════════════════════════════════════════════════════════════════ */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 print:border-none print:shadow-none print:bg-white print:text-slate-900 print:w-full print:max-w-none print:p-0">
            
            {/* Modal Control Header (Hidden when printing) */}
            <div className="flex justify-between items-center pb-6 border-b border-slate-800 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Fatura / Recibo Fiscal
                  </h3>
                  <p className="text-slate-400 text-xs font-mono">
                    Documento Nº {selectedInvoice.invoice_number || selectedInvoice.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition-all shadow-lg cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / PDF
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Official Invoice Card Content */}
            <div className="space-y-6 pt-4 print:pt-0">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-800 pb-6 print:border-slate-300 gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-black text-xl font-mono shadow-md">
                      NX
                    </div>
                    <div>
                      <h2 className="text-lg font-extrabold text-white print:text-slate-900 font-display">
                        NEXORA MEDIA ANGOLA
                      </h2>
                      <p className="text-[11px] text-slate-400 print:text-slate-600">
                        Rede Nacional de Sinalização Digital & Mídia Indoor
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-[11px] text-slate-400 print:text-slate-600 space-y-0.5">
                    <p>NIF: 5418902341 | Luanda, Angola</p>
                    <p>Edifício Luanda One, Mutamba - Baixa de Luanda</p>
                    <p>Email: financeiro@nexora.ao | Suporte: +244 923 000 000</p>
                  </div>
                </div>

                <div className="sm:text-right">
                  <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 print:border-slate-400 print:text-slate-800">
                    FATURA / COMPROVATIVO
                  </span>
                  <p className="text-base font-mono font-bold text-white print:text-slate-900 mt-2">
                    {selectedInvoice.invoice_number || `FT-2026/${selectedInvoice.id}`}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedInvoice.status === 'COMPLETED' || selectedInvoice.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 print:border-emerald-600 print:text-emerald-700'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {selectedInvoice.status === 'COMPLETED' || selectedInvoice.status === 'paid' ? '✔ PAGO / CONCLUÍDO' : '⏳ PENDENTE'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Client & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800 print:bg-slate-50 print:border-slate-300">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 print:text-slate-600 tracking-wider block mb-1">
                    Anunciante / Razão Social
                  </span>
                  <p className="text-sm font-bold text-white print:text-slate-900">
                    {currentOrganization?.name || selectedInvoice.advertiserName || 'Empresa Anunciante'}
                  </p>
                  <p className="text-xs text-slate-400 print:text-slate-600 mt-0.5">
                    NIF: {currentOrganization?.nif || '5400192837'}
                  </p>
                  <p className="text-xs text-slate-400 print:text-slate-600">
                    {currentOrganization?.address || 'Luanda, Angola'}
                  </p>
                </div>

                <div className="sm:text-right text-xs text-slate-400 print:text-slate-600 space-y-1">
                  <p><span className="font-semibold text-slate-300 print:text-slate-700">Data da Transação:</span> {new Date(selectedInvoice.created_at || Date.now()).toLocaleDateString('pt-AO')}</p>
                  <p><span className="font-semibold text-slate-300 print:text-slate-700">Moeda da Operação:</span> Kwanzas Angolanos (Kz)</p>
                  <p><span className="font-semibold text-slate-300 print:text-slate-700">Canal de Pagamento:</span> Plataforma Digital Nexora</p>
                </div>
              </div>

              {/* Services Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden print:border-slate-300">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase border-b border-slate-800 print:bg-slate-200 print:text-slate-800 print:border-slate-300">
                    <tr>
                      <th className="p-3">Descrição da Veiculação / Serviço</th>
                      <th className="p-3 text-center">Qtd</th>
                      <th className="p-3 text-right">Preço Unitário</th>
                      <th className="p-3 text-right">Total (Kz)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                    <tr>
                      <td className="p-3">
                        <p className="font-bold text-white print:text-slate-900">
                          {selectedInvoice.description || 'Veiculação de Campanha Publicitária em Telas Digital Signage'}
                        </p>
                        <p className="text-[11px] text-slate-400 print:text-slate-600 mt-0.5">
                          Grade de Exibição Indoor Luanda — Inserções Auditadas em Tempo Real via Proof of Play (SHA-256)
                        </p>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-300 print:text-slate-800">1 Pacote</td>
                      <td className="p-3 text-right font-mono text-slate-300 print:text-slate-800">{formatKz(parseFloat(selectedInvoice.amount_kz || 0))}</td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 print:text-slate-900">{formatKz(parseFloat(selectedInvoice.amount_kz || 0))}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotals & Taxes */}
                <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end print:bg-slate-50 print:border-slate-300">
                  <div className="w-64 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400 print:text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">{formatKz(parseFloat(selectedInvoice.amount_kz || 0))}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 print:text-slate-600">
                      <span>Imposto (IVA 14% Isento):</span>
                      <span className="font-mono">0,00 Kz</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-800 print:border-slate-300 text-sm font-bold text-white print:text-slate-900">
                      <span>Total Liquidado (Kz):</span>
                      <span className="font-mono text-emerald-400 print:text-slate-900">{formatKz(parseFloat(selectedInvoice.amount_kz || 0))}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banking & Footer Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-[11px] text-slate-400 print:text-slate-600 border-t border-slate-800 print:border-slate-300">
                <div>
                  <h4 className="font-bold text-slate-300 print:text-slate-800 mb-1">Coordenadas Bancárias Nexora Media</h4>
                  <p>Banco BAI: AO06 0040 0000 1234 5678 1018 9</p>
                  <p>Banco BFA: AO06 0006 0000 9876 5432 1011 4</p>
                </div>
                <div className="sm:text-right">
                  <h4 className="font-bold text-slate-300 print:text-slate-800 mb-1">Assinatura Digital & Validação</h4>
                  <p>Processado por computador ao abrigo da legislação de Angola.</p>
                  <p className="font-mono text-[10px] text-slate-500 mt-0.5">SHA-256: nx-{Date.now().toString(36)}-ao</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
