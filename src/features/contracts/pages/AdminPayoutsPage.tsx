import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import {
  CreditCard,
  Building2,
  Coins,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Landmark,
  ArrowUpRight,
  ShieldCheck,
  Download,
  Send
} from 'lucide-react';

interface VenuePayoutItem {
  id: string;
  organizationId: string;
  organizationName: string;
  advertiserName: string;
  campaignTitle: string;
  displayCode: string;
  displayVenue: string;
  municipality: string;
  displaysCount: number;
  totalAdGrossKz: number;
  commissionRate: number;
  commissionAmountKz: number;
  bankName: string;
  accountHolder: string;
  iban: string;
  accountNumber?: string;
  period: string;
  status: 'PENDING' | 'SETTLED';
  receiptUrl?: string | null;
  settledAt?: string | null;
}

export const AdminPayoutsPage: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [payouts, setPayouts] = useState<VenuePayoutItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'SETTLED'>('ALL');
  const [settlingId, setSettlingId] = useState<string | null>(null);

  // Modals state
  const [selectedPayout, setSelectedPayout] = useState<VenuePayoutItem | null>(null);
  const [isSettleModalOpen, setIsSettleModalOpen] = useState<boolean>(false);
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fetchPayouts = async () => {
    try {
      const res = await fetch('/api/commissions/admin/payouts');
      if (res.ok) {
        const data = await res.json();
        setPayouts(data);
      } else {
        setPayouts([]);
      }
    } catch (e) {
      console.warn('Error fetching payouts', e);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchPayouts();
    showToast({
      type: 'info',
      title: 'Folha de Repasses Sincronizada',
      message: 'Os cálculos e contas dos parceiros foram atualizados.',
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const res = await fetch('/api/storage/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64,
            fileName: file.name,
            folder: 'comprovativos',
            mimeType: file.type,
          }),
        });
        const data = await res.json();
        if (data.url) {
          setReceiptUrl(data.url);
          showToast({ type: 'success', title: 'Comprovativo Carregado', message: file.name });
        }
      } catch (err: any) {
        showToast({ type: 'error', title: 'Erro ao carregar ficheiro', message: err?.message });
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmSettle = async () => {
    if (!selectedPayout) return;
    setSettlingId(selectedPayout.id);
    try {
      const res = await fetch(`/api/commissions/admin/payouts/${selectedPayout.id}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptUrl: receiptUrl || null }),
      });
      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Repasse Liquidado!',
          message: `O comprovativo de pagamento foi enviado ao parceiro "${selectedPayout.organizationName}".`,
        });
        setIsSettleModalOpen(false);
        setSelectedPayout(null);
        setReceiptUrl('');
        fetchPayouts();
      }
    } catch (e: any) {
      showToast({
        type: 'error',
        title: 'Erro ao Liquidar',
        message: e?.message || 'Não foi possível liquidar o repasse.',
      });
    } finally {
      setSettlingId(null);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchesSearch =
      p.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.campaignTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.iban.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalGrossMedia = payouts.reduce((sum, p) => sum + p.totalAdGrossKz, 0);
  const totalCommissionDue = payouts.reduce((sum, p) => sum + p.commissionAmountKz, 0);
  const totalPaid = payouts
    .filter((p) => p.status === 'SETTLED')
    .reduce((sum, p) => sum + p.commissionAmountKz, 0);
  const totalPending = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + p.commissionAmountKz, 0);

  const formatKz = (val: number) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(val).replace('AOA', 'Kz');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
              Módulo Financeiro Real
            </span>
            <span className="text-xs text-slate-400">• Nexora Admin</span>
          </div>
          <h1 className="text-2xl font-bold font-display text-white">
            Contas a Pagar aos Parceiros
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Folha real de liquidação de repasses publicitários aos lojistas e estabelecimentos parceiros.
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
            Atualizar Folha
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#0B132B]/60 border-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Total de Mídia Bruta</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-white font-mono tracking-tight">
                {formatKz(totalGrossMedia)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Faturamento bruto dos anúncios</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B132B]/60 border-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400">Comissões Geradas</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-cyan-400 font-mono tracking-tight">
                {formatKz(totalCommissionDue)}
              </span>
              <p className="text-[11px] text-cyan-400/80 mt-1">Repasses aos parceiros</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B132B]/60 border-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-400">Pendente a Liquidar</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-amber-400 font-mono tracking-tight">
                {formatKz(totalPending)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">Aguardando transferência bancária</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0B132B]/60 border-white/10 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400">Total Liquidado</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                {formatKz(totalPaid)}
              </span>
              <p className="text-[11px] text-emerald-400/80 mt-1">Comprovativos enviados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0F172A] p-3 rounded-xl border border-white/10">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquisar parceiro, campanha ou IBAN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Filtrar:</span>
          {(['ALL', 'PENDING', 'SETTLED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {st === 'ALL' ? 'Todos' : st === 'PENDING' ? 'Pendentes' : 'Liquidados'}
            </button>
          ))}
        </div>
      </div>

      {/* Payouts Table */}
      <Card className="bg-[#0F172A] border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton variant="card" className="h-14 w-full" />
              <Skeleton variant="card" className="h-14 w-full" />
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Nenhuma comissão de parceiro encontrada para pagamento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-900/40 text-slate-400">
                    <th className="py-3 px-4 font-semibold">Parceiro / Loja</th>
                    <th className="py-3 px-4 font-semibold">Campanha / Tela</th>
                    <th className="py-3 px-4 font-semibold text-right">Mídia Bruta</th>
                    <th className="py-3 px-4 font-semibold text-center">% Split</th>
                    <th className="py-3 px-4 font-semibold text-right">A Pagar (Líquido)</th>
                    <th className="py-3 px-4 font-semibold">Conta Bancária / IBAN</th>
                    <th className="py-3 px-4 font-semibold text-center">Estado</th>
                    <th className="py-3 px-4 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPayouts.map((item) => (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{item.organizationName}</div>
                        <div className="text-[11px] text-slate-400">Titular: {item.accountHolder}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">{item.campaignTitle}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">{item.displayCode} ({item.displayVenue})</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                        {formatKz(item.totalAdGrossKz)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-semibold text-cyan-300">
                        {(item.commissionRate * 100).toFixed(0)}%
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                        {formatKz(item.commissionAmountKz)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        <div className="text-slate-200 font-semibold">{item.bankName}</div>
                        <div className="text-cyan-300">{item.iban}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.status === 'SETTLED' ? (
                          <Badge variant="online" size="sm" dot>Liquidado</Badge>
                        ) : (
                          <Badge variant="warning" size="sm" dot>Pendente</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status === 'PENDING' ? (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedPayout(item);
                              setReceiptUrl('');
                              setIsSettleModalOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] py-1 px-2.5 h-auto cursor-pointer"
                            leftIcon={<CreditCard className="w-3 h-3" />}
                          >
                            Pagar & Enviar
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {item.receiptUrl ? (
                              <a
                                href={item.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline bg-cyan-500/10 px-2 py-1 rounded"
                              >
                                <Download className="w-3 h-3" /> Ver Comprovativo
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">Liquidado</span>
                            )}
                          </div>
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

      {/* Modal de Liquidação & Anexo de Comprovativo */}
      {isSettleModalOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0F172A] border border-cyan-500/30 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-cyan-400" />
                Liquidar Comissão do Parceiro
              </h3>
              <button
                onClick={() => setIsSettleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Parceiro Beneficiário:</span>
                <span className="font-semibold text-white">{selectedPayout.organizationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Campanha:</span>
                <span className="font-medium text-cyan-300">{selectedPayout.campaignTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Valor a Transferir:</span>
                <span className="font-mono text-base font-bold text-emerald-400">
                  {formatKz(selectedPayout.commissionAmountKz)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-slate-400">Banco:</span>
                <span className="text-slate-200">{selectedPayout.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IBAN:</span>
                <span className="font-mono text-cyan-300 font-semibold">{selectedPayout.iban}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Anexar Comprovativo de Transferência (PDF / Imagem):
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="w-full text-xs text-slate-400 bg-slate-900 border border-white/10 rounded-lg p-2 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-cyan-500/20 file:text-cyan-300 file:font-semibold"
              />
              {isUploading && <p className="text-[11px] text-cyan-400 animate-pulse">A carregar ficheiro...</p>}
              {receiptUrl && (
                <div className="text-[11px] text-emerald-400 bg-emerald-500/10 p-2 rounded border border-emerald-500/20 flex items-center justify-between">
                  <span>✓ Comprovativo carregado com sucesso</span>
                  <a href={receiptUrl} target="_blank" rel="noreferrer" className="underline font-bold">Ver</a>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setIsSettleModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                loading={settlingId === selectedPayout.id}
                onClick={handleConfirmSettle}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
              >
                Confirmar Liquidação
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
