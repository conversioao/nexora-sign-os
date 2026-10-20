/**
 * Aprovação de Recargas — pedidos de crédito com comprovativo.
 *
 * Aprovar credita a conta no servidor e é registado no livro-razão com o nome de
 * quem aprovou. Rejeitar exige motivo. Um pedido já aprovado não pode ser
 * rejeitado (o servidor bloqueia) porque os créditos já foram entregues — para
 * reverter, o caminho correcto é um ajuste negativo na Gestão de Créditos.
 */
import React from 'react';
import { useSession } from '../../../context/SessionContext';
import { creativeAdminService } from '../services/creativeAdminService';
import { useAdminData } from '../hooks/useAdminData';
import { AdminPurchaseRequest } from '../types';
import {
  Panel,
  StatCard,
  Loading,
  ErrorState,
  EmptyState,
  StatusBadge,
  fmtNum,
  fmtKz,
  fmtDate,
  fmtRelative,
} from '../components/ui';
import {
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  Wallet,
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

export const CreativeAdminApprovalsPage: React.FC<{ canManage: boolean }> = ({ canManage }) => {
  const { currentUser } = useSession();
  const actor = currentUser?.name || 'Admin';

  const requests = useAdminData(() => creativeAdminService.getRequests(), []);
  const [tab, setTab] = React.useState<Tab>('PENDING');
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [rejecting, setRejecting] = React.useState<AdminPurchaseRequest | null>(null);
  const [rejectReason, setRejectReason] = React.useState('');
  const [viewingReceipt, setViewingReceipt] = React.useState<AdminPurchaseRequest | null>(null);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const all = requests.data || [];

  const counts = React.useMemo(
    () => ({
      pending: all.filter((r) => r.status === 'PENDING').length,
      approved: all.filter((r) => r.status === 'APPROVED').length,
      rejected: all.filter((r) => r.status === 'REJECTED').length,
      pendingCredits: all
        .filter((r) => r.status === 'PENDING')
        .reduce((s, r) => s + r.credits, 0),
      pendingValue: all.filter((r) => r.status === 'PENDING').reduce((s, r) => s + r.priceKz, 0),
    }),
    [all]
  );

  const visible = React.useMemo(() => {
    if (tab === 'ALL') return all;
    return all.filter((r) => r.status === tab);
  }, [all, tab]);

  const approve = async (request: AdminPurchaseRequest) => {
    const confirmed = window.confirm(
      `Aprovar a recarga de ${fmtNum(request.credits)} créditos para "${request.organizationName || request.organizationId}"?\n\n` +
        `Valor: ${fmtKz(request.priceKz)}\nPacote: ${request.packageName}\n\n` +
        'Os créditos são creditados imediatamente e a operação fica registada no livro-razão.'
    );
    if (!confirmed) return;

    setBusyId(request.id);
    setActionError(null);
    setFlash(null);
    try {
      const res = await creativeAdminService.approveRequest(request.id, actor);
      setFlash(
        `Recarga aprovada para ${request.organizationName || request.organizationId}: +${fmtNum(request.credits)} cr. Novo saldo: ${fmtNum(res.newBalance)} cr.`
      );
      requests.reload();
    } catch (err: any) {
      setActionError(err?.message || 'Falha ao aprovar o pedido.');
    } finally {
      setBusyId(null);
    }
  };

  const submitReject = async () => {
    if (!rejecting) return;
    if (!rejectReason.trim()) {
      setActionError('Indique o motivo da rejeição — fica visível para o cliente.');
      return;
    }
    setBusyId(rejecting.id);
    setActionError(null);
    setFlash(null);
    try {
      await creativeAdminService.rejectRequest(rejecting.id, rejectReason.trim(), actor);
      setFlash(`Pedido de ${rejecting.organizationName || rejecting.organizationId} rejeitado.`);
      setRejecting(null);
      setRejectReason('');
      requests.reload();
    } catch (err: any) {
      setActionError(err?.message || 'Falha ao rejeitar o pedido.');
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'PENDING', label: 'Pendentes', count: counts.pending },
    { id: 'APPROVED', label: 'Aprovados', count: counts.approved },
    { id: 'REJECTED', label: 'Rejeitados', count: counts.rejected },
    { id: 'ALL', label: 'Todos', count: all.length },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Pedidos pendentes"
          value={fmtNum(counts.pending)}
          hint={counts.pending > 0 ? 'requerem decisão' : 'nada em espera'}
          icon={<Clock className="w-3.5 h-3.5" />}
          tone={counts.pending > 0 ? 'amber' : 'slate'}
        />
        <StatCard
          label="Créditos por entregar"
          value={fmtNum(counts.pendingCredits)}
          hint={fmtKz(counts.pendingValue)}
          icon={<Wallet className="w-3.5 h-3.5" />}
          tone="violet"
        />
        <StatCard
          label="Aprovados"
          value={fmtNum(counts.approved)}
          hint="créditos já entregues"
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          tone="emerald"
        />
        <StatCard
          label="Rejeitados"
          value={fmtNum(counts.rejected)}
          hint="sem entrega de créditos"
          icon={<XCircle className="w-3.5 h-3.5" />}
          tone="rose"
        />
      </div>

      {flash && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 text-[11px] text-emerald-200">
          {flash}
        </div>
      )}
      {actionError && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-[11px] text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {actionError}
        </div>
      )}

      {/* ─── Formulário de rejeição ──────────────────────────────────────── */}
      {rejecting && canManage && (
        <Panel
          title={`Rejeitar pedido · ${rejecting.organizationName || rejecting.organizationId}`}
          subtitle={`${fmtNum(rejecting.credits)} créditos · ${fmtKz(rejecting.priceKz)} · pacote ${rejecting.packageName}`}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Motivo da rejeição (visível para o cliente)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={2}
                placeholder="Ex: comprovativo ilegível — reenvie a foto do depósito"
                className="w-full bg-[#070512] border border-white/10 focus:border-[#7C3AED] rounded-lg px-3 py-2 text-sm text-white focus:outline-none resize-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={submitReject}
                disabled={busyId === rejecting.id}
                className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
              >
                {busyId === rejecting.id ? 'A rejeitar…' : 'Confirmar rejeição'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejecting(null);
                  setRejectReason('');
                }}
                className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </Panel>
      )}

      {/* ─── Lista de pedidos ────────────────────────────────────────────── */}
      <Panel
        title="Pedidos de recarga"
        subtitle="Pedidos submetidos pelos clientes com comprovativo de pagamento"
        padded={false}
        actions={
          <button
            type="button"
            onClick={requests.reload}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 cursor-pointer"
            title="Recarregar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="flex items-center gap-1 px-4 pt-3 pb-1 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                tab === t.id
                  ? 'bg-[#7C3AED]/20 border border-[#7C3AED]/40 text-[#C084FC]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {t.label}
              <span className="text-[9px] font-mono opacity-70">{t.count}</span>
            </button>
          ))}
        </div>

        {requests.loading ? (
          <Loading label="A carregar pedidos…" />
        ) : requests.error ? (
          <ErrorState message={requests.error} onRetry={requests.reload} />
        ) : visible.length === 0 ? (
          <EmptyState
            message={
              tab === 'PENDING'
                ? 'Não há pedidos pendentes. Quando um cliente submeter uma recarga com comprovativo, aparece aqui para aprovação.'
                : 'Sem pedidos neste estado.'
            }
          />
        ) : (
          <div className="p-4 space-y-2.5">
            {visible.map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-[#0A0816] border border-white/[0.07] p-3.5 flex flex-col lg:flex-row lg:items-center gap-3"
              >
                <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {r.organizationName || r.organizationId}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {r.userName || r.userId} · {fmtRelative(r.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Pacote</p>
                    <p className="text-xs text-slate-200 truncate">{r.packageName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Valor</p>
                    <p className="text-xs text-slate-200 font-mono">
                      {fmtNum(r.credits)} cr · {fmtKz(r.priceKz)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Pagamento</p>
                    <p className="text-xs text-slate-200 truncate">{r.paymentMethod}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <StatusBadge status={r.status} />

                  {r.receiptUrl && (
                    <button
                      type="button"
                      onClick={() => setViewingReceipt(r)}
                      className="px-2 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[10px] font-semibold text-slate-200 cursor-pointer flex items-center gap-1"
                    >
                      <Receipt className="w-3 h-3" /> Comprovativo
                    </button>
                  )}

                  {r.status === 'PENDING' && canManage && (
                    <>
                      <button
                        type="button"
                        onClick={() => approve(r)}
                        disabled={busyId === r.id}
                        className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-[10px] font-bold text-white cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {busyId === r.id ? 'A aprovar…' : 'Aprovar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejecting(r);
                          setRejectReason('');
                          setActionError(null);
                        }}
                        className="px-2.5 py-1 rounded-md bg-rose-600/80 hover:bg-rose-500 text-[10px] font-bold text-white cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Rejeitar
                      </button>
                    </>
                  )}

                  {r.status !== 'PENDING' && (
                    <span className="text-[9px] text-slate-500 font-mono whitespace-nowrap">
                      {r.reviewedBy ? `${r.reviewedBy} · ` : ''}
                      {fmtDate(r.reviewedAt)}
                    </span>
                  )}
                </div>

                {r.status === 'REJECTED' && r.rejectionReason && (
                  <p className="lg:w-full text-[10px] text-rose-300/80 border-t border-white/[0.05] pt-2">
                    Motivo: {r.rejectionReason}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {!canManage && (
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-2.5 text-[11px] text-slate-400 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-300" />
          O seu perfil tem acesso de leitura a este painel. Aprovar e rejeitar recargas exige a permissão
          <span className="font-mono text-slate-300"> creativeadmin.credits</span>.
        </div>
      )}

      {/* ─── Visualizador de comprovativo ────────────────────────────────── */}
      {viewingReceipt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[#0C0A18] border border-[#7C3AED]/30 rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  Comprovativo · {viewingReceipt.organizationName || viewingReceipt.organizationId}
                </p>
                <p className="text-[10px] text-slate-500">
                  {viewingReceipt.receiptFileName || 'ficheiro'} · {fmtKz(viewingReceipt.priceKz)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto custom-scrollbar bg-black/40">
              <img
                src={viewingReceipt.receiptUrl}
                alt="Comprovativo de pagamento"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
