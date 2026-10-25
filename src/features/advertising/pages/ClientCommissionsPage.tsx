import React, { useState, useEffect } from 'react';
import { useSession } from '../../../context/SessionContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import {
  Coins,
  TrendingUp,
  Megaphone,
  Monitor,
  Building2,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Wallet,
  Landmark,
  FileCheck,
  RefreshCw,
  Sliders,
  DollarSign,
  Receipt,
  X,
  Download,
  ExternalLink,
} from 'lucide-react';
import { WhatsAppNotificationSettingsCard } from '../../../components/notifications/WhatsAppNotificationSettingsCard';

interface CommissionItem {
  id: string;
  advertiserName: string;
  campaignTitle: string;
  displayCode: string;
  displayVenue: string;
  period: string;
  grossAmountKz: number;
  commissionRate: number; // e.g. 0.30
  commissionAmountKz: number;
  status: 'PENDING' | 'PAID' | 'PROCESSING';
  paidAt?: string;
  receiptUrl?: string;  // settlement receipt from admin
}

export const ClientCommissionsPage: React.FC = () => {
  const { currentOrganization } = useSession();
  const { showToast } = useToast();
  const [commissions, setCommissions] = useState<CommissionItem[]>([]);
  const [iban, setIban] = useState<string>('AO06.0040.0000.1234.5678.9012.3');
  const [isEditingIban, setIsEditingIban] = useState<boolean>(false);
  const [tempIban, setTempIban] = useState<string>('');
  const [bankName, setBankName] = useState<string>('Banco BAI');
  const [accountHolder, setAccountHolder] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Receipt preview modal
  const [receiptModal, setReceiptModal] = useState<{ url: string; label: string } | null>(null);

  const fetchBankAccountsAndCommissions = async () => {
    try {
      const orgId = currentOrganization?.id || 'org-talatona';
      const [commRes, bankRes, notifRes] = await Promise.all([
        fetch(`/api/commissions/client/${orgId}`),
        fetch(`/api/bank-accounts/client/${orgId}`),
        fetch(`/api/notifications/client/${orgId}`),
      ]);

      if (commRes.ok) {
        const data = await commRes.json();
        // Map receipt_url from API into our typed model
        const mapped = (data.commissions || []).map((c: any) => ({
          ...c,
          receiptUrl: c.receiptUrl || c.receipt_url || undefined,
        }));
        setCommissions(mapped);
      }
      if (bankRes.ok) {
        const bankData = await bankRes.json();
        if (bankData.length > 0) {
          const defaultBank = bankData[0];
          setIban(defaultBank.iban || '');
          setBankName(defaultBank.bank_name || 'Banco BAI');
          setAccountHolder(defaultBank.account_holder || '');
          setAccountNumber(defaultBank.account_number || '');
        }
      }
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotifications(Array.isArray(notifData) ? notifData : notifData.notifications || []);
      }
    } catch (e) {
      console.warn('Error fetching commissions/bank data', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBankAccountsAndCommissions();
  }, [currentOrganization?.id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBankAccountsAndCommissions();
    showToast({
      type: 'info',
      title: 'Comissões & Notificações Atualizadas',
      message: 'Os valores e estado dos repasses foram sincronizados.',
    });
  };

  const handleSaveIban = async () => {
    if (!tempIban.trim()) return;
    try {
      const orgId = currentOrganization?.id || 'org-talatona';
      const res = await fetch(`/api/bank-accounts/client/${orgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName,
          accountHolder: accountHolder || currentOrganization?.name || 'Parceiro',
          iban: tempIban.trim(),
          accountNumber,
        }),
      });
      if (res.ok) {
        setIban(tempIban.trim());
        setIsEditingIban(false);
        showToast({
          type: 'success',
          title: 'Dados Bancários Registados',
          message: 'Conta bancária guardada para receber comissões e repasses.',
        });
        fetchBankAccountsAndCommissions();
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erro ao guardar conta', message: e?.message });
    }
  };

  const totalAccumulated = commissions.reduce((sum, item) => sum + item.commissionAmountKz, 0);
  const totalPending = commissions
    .filter((item) => item.status === 'PENDING' || item.status === 'PROCESSING')
    .reduce((sum, item) => sum + item.commissionAmountKz, 0);
  const totalPaid = commissions
    .filter((item) => item.status === 'PAID')
    .reduce((sum, item) => sum + item.commissionAmountKz, 0);
  const activeAdvertisersCount = new Set(commissions.map((c) => c.advertiserName)).size;

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Rentabilização de Espaço
            </span>
            <span className="text-xs text-slate-400">• Loja / Parceiro</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white">
            Minhas Comissões de Mídia
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Acompanhe o repasse de receita gerado por cada anunciante veiculado nos displays da sua loja ({currentOrganization?.name || 'Seu Estabelecimento'}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Sincronizar Ganhos
          </Button>
        </div>
      </div>

      {/* Notifications Banner */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <div
              key={notif.id}
              className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{notif.title}</h4>
                  <p className="text-slate-300 text-[11px] mt-0.5">{notif.message}</p>
                </div>
              </div>

              {notif.receipt_url && (
                <a
                  href={notif.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 shrink-0 transition-all cursor-pointer"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Ver Comprovativo Bancário
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0B132B]/60 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total Acumulado</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white font-mono tracking-tight">
                {formatKz(totalAccumulated)}
              </span>
              <p className="text-[11px] text-cyan-400/80 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Repasse total calculado
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B132B]/60 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">A Receber (Pendente)</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
                {formatKz(totalPending)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Liquidação no fim do mês pela Nexora
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B132B]/60 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Já Liquidado / Pago</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                {formatKz(totalPaid)}
              </span>
              <p className="text-[11px] text-emerald-400/80 mt-1">
                Transferido para a sua conta
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B132B]/60 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Anunciantes Ativos</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
                <Megaphone className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white font-mono tracking-tight">
                {activeAdvertisersCount}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Marcas veiculando no seu espaço
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas WhatsApp do Parceiro (Comissões & Status dos Displays) */}
      <WhatsAppNotificationSettingsCard roleOverride="DISPLAY_OWNER" />

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Commission Transactions Table */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-[#0F172A] border-white/10">
            <CardHeader className="pb-3 border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Histórico de Comissões por Anunciante
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400">
                    Discriminação das veiculações e valores creditados à sua organização
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loading ? (
                <div className="p-6 space-y-3">
                  <Skeleton variant="card" className="h-14 w-full" />
                  <Skeleton variant="card" className="h-14 w-full" />
                  <Skeleton variant="card" className="h-14 w-full" />
                </div>
              ) : commissions.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-3">
                    <Coins className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Nenhuma comissão registada ainda</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                    Assim que um anunciante contratar espaço de mídia para os displays da sua loja através do Marketplace, os repasses aparecerão aqui automaticamente.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-900/40 text-slate-400">
                        <th className="py-3 px-4 font-semibold">Anunciante & Campanha</th>
                        <th className="py-3 px-4 font-semibold">Display / Ponto</th>
                        <th className="py-3 px-4 font-semibold">Período</th>
                        <th className="py-3 px-4 font-semibold text-right">Fatura Total</th>
                        <th className="py-3 px-4 font-semibold text-right">Sua Comissão</th>
                        <th className="py-3 px-4 font-semibold text-center">Estado</th>
                        <th className="py-3 px-4 font-semibold text-center">Comprovativo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {commissions.map((item) => (
                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{item.advertiserName}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.campaignTitle}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-mono text-cyan-400 font-semibold">{item.displayCode}</div>
                            <div className="text-[11px] text-slate-400">{item.displayVenue}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {item.period}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                            {formatKz(item.grossAmountKz)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono font-bold text-emerald-400">
                              {formatKz(item.commissionAmountKz)}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Split: {(item.commissionRate * 100).toFixed(0)}%
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {item.status === 'PAID' ? (
                              <Badge variant="online" size="sm" dot>Liquidado</Badge>
                            ) : item.status === 'PROCESSING' ? (
                              <Badge variant="warning" size="sm" dot>Em Processamento</Badge>
                            ) : (
                              <Badge variant="neutral" size="sm" dot>Pendente</Badge>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {item.receiptUrl ? (
                              <button
                                onClick={() => setReceiptModal({ url: item.receiptUrl!, label: item.campaignTitle })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-[11px] font-semibold transition-colors"
                              >
                                <Receipt className="w-3 h-3" />
                                Ver
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-600">{item.status === 'PAID' ? '—' : 'Pendente'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Banking Info & Payout Policy */}
        <div className="space-y-4">
          <Card className="bg-[#0F172A] border-white/10">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                <Landmark className="w-4 h-4 text-cyan-400" />
                Dados Bancários para Repasse
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Conta bancária onde a Nexora credita as suas comissões mensais
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div>
                <span className="text-[11px] text-slate-400 font-medium">IBAN Registado (Angola)</span>
                {isEditingIban ? (
                  <div className="mt-2 space-y-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Nome do Banco</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Ex: Banco BAI, BFA, BIC..."
                        className="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">Titular da Conta</label>
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="Nome da empresa ou proprietário"
                        className="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">IBAN (Angola)</label>
                      <input
                        type="text"
                        value={tempIban}
                        onChange={(e) => setTempIban(e.target.value)}
                        placeholder="AO06.0040..."
                        className="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" onClick={handleSaveIban} className="w-full bg-cyan-600 hover:bg-cyan-500">
                        Guardar Conta
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setIsEditingIban(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex flex-col gap-1 bg-slate-900/60 p-3 rounded-lg border border-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200">{bankName}</span>
                      <button
                        onClick={() => {
                          setTempIban(iban);
                          setIsEditingIban(true);
                        }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                      >
                        Editar Conta
                      </button>
                    </div>
                    {accountHolder && <span className="text-[11px] text-slate-400">Titular: {accountHolder}</span>}
                    <span className="font-mono text-xs text-cyan-300 font-semibold mt-1">{iban}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-lg space-y-2 text-xs">
                <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-cyan-400" /> Regra de Repasse Nexora
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  As comissões são liquidadas no último dia útil de cada mês diretamente por transferência bancária, com emissão do respetivo extrato de liquidação de mídia.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Receipt Preview Modal */}
      {receiptModal && (() => {
        const { url, label } = receiptModal;
        const isPdf = url.toLowerCase().includes('.pdf');
        const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(url);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4" onClick={() => setReceiptModal(null)}>
            <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Comprovativo de Liquidação</h3>
                    <span className="text-[11px] text-slate-400">{label}</span>
                  </div>
                </div>
                <button onClick={() => setReceiptModal(null)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center justify-center bg-black min-h-[320px]">
                {isImage ? (
                  <img src={url} alt="Comprovativo" className="max-h-[460px] w-full object-contain" />
                ) : isPdf ? (
                  <iframe src={url} title="Comprovativo" className="w-full h-[460px] border-0" />
                ) : (
                  <div className="text-center text-slate-400 py-12">
                    <Receipt className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-semibold text-white mb-4">Comprovativo de Transferência Bancária</p>
                    <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir Ficheiro
                    </a>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-800 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500 break-all max-w-[380px] truncate">{url}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors">
                    <Download className="w-3.5 h-3.5" /> Baixar
                  </a>
                  <button onClick={() => setReceiptModal(null)} className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors">
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
