/**
 * Gestão de Créditos — saldos por organização, ajustes manuais e livro-razão.
 *
 * É a secção onde o admin mexe em dinheiro, por isso todas as escritas exigem
 * MOTIVO (fica gravado no livro-razão com o nome de quem executou) e o valor é
 * sempre pré-visualizado antes de ser aplicado.
 */
import React from 'react';
import { useSession } from '../../../context/SessionContext';
import { creativeAdminService } from '../services/creativeAdminService';
import { useAdminData } from '../hooks/useAdminData';
import { CreditAccountRow, AdminCreditTransaction } from '../types';
import {
  Panel,
  StatCard,
  Loading,
  ErrorState,
  EmptyState,
  StatusBadge,
  Th,
  Td,
  fmtNum,
  fmtKz,
  fmtDate,
} from '../components/ui';
import {
  Wallet,
  TrendingDown,
  AlertTriangle,
  Coins,
  Plus,
  Minus,
  Ban,
  Lock,
  Unlock,
  Search,
  RefreshCw,
} from 'lucide-react';
import { isConsumptionType } from '../../../lib/creditMath';

type AdjustTarget = { organizationId: string; organizationName: string; balance: number } | null;

export const CreativeAdminCreditsPage: React.FC<{ canManage: boolean }> = ({ canManage }) => {
  const { currentUser } = useSession();
  const actor = currentUser?.name || 'Admin';

  const accounts = useAdminData(() => creativeAdminService.getAccounts(), []);
  const ledger = useAdminData(() => creativeAdminService.getTransactions({ limit: 150 }), []);

  const [search, setSearch] = React.useState('');
  const [adjustTarget, setAdjustTarget] = React.useState<AdjustTarget>(null);
  const [adjustAmount, setAdjustAmount] = React.useState('100');
  const [adjustReason, setAdjustReason] = React.useState('');
  const [adjustError, setAdjustError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [ledgerType, setLedgerType] = React.useState<string>('');

  const rows = React.useMemo(() => {
    const list = accounts.data || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.organizationName.toLowerCase().includes(q) ||
        a.organizationId.toLowerCase().includes(q)
    );
  }, [accounts.data, search]);

  const ledgerRows = React.useMemo(() => {
    const list = ledger.data?.transactions || [];
    return ledgerType ? list.filter((t) => t.type === ledgerType) : list;
  }, [ledger.data, ledgerType]);

  const totals = React.useMemo(() => {
    const list = accounts.data || [];
    return {
      balance: list.reduce((s, a) => s + a.balance, 0),
      consumed: list.reduce((s, a) => s + a.totalConsumed, 0),
      purchased: list.reduce((s, a) => s + a.totalPurchased, 0),
      low: list.filter((a) => a.balance <= a.lowBalanceThreshold).length,
    };
  }, [accounts.data]);

  const openAdjust = (row: CreditAccountRow) => {
    setAdjustTarget({
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      balance: row.balance,
    });
    setAdjustAmount('100');
    setAdjustReason('');
    setAdjustError(null);
    setFlash(null);
  };

  const numericAmount = Number(adjustAmount);
  const amountIsValid = adjustAmount.trim() !== '' && Number.isFinite(numericAmount) && numericAmount !== 0;
  const projected = adjustTarget ? adjustTarget.balance + (amountIsValid ? numericAmount : 0) : 0;
  const wouldGoNegative = adjustTarget !== null && amountIsValid && projected < 0;

  const submitAdjust = async () => {
    if (!adjustTarget) return;
    setAdjustError(null);

    if (!amountIsValid) {
      setAdjustError('Indique um valor diferente de zero. Use positivo para creditar e negativo para debitar.');
      return;
    }
    if (!adjustReason.trim()) {
      setAdjustError('O motivo é obrigatório — fica registado no livro-razão.');
      return;
    }
    if (wouldGoNegative) {
      setAdjustError(
        `O saldo ficaria negativo (${projected} cr). O servidor recusa saldos negativos.`
      );
      return;
    }

    setSaving(true);
    try {
      const tx = await creativeAdminService.adjustCredits({
        organizationId: adjustTarget.organizationId,
        amount: numericAmount,
        reason: adjustReason.trim(),
        performedBy: actor,
      });
      setFlash(
        `Ajuste aplicado a ${adjustTarget.organizationName}: ${numericAmount > 0 ? '+' : ''}${numericAmount} cr. Novo saldo: ${fmtNum(tx.balanceAfter)} cr.`
      );
      setAdjustTarget(null);
      accounts.reload();
      ledger.reload();
    } catch (err: any) {
      setAdjustError(err?.message || 'Falha ao aplicar o ajuste.');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async (row: CreditAccountRow) => {
    const next = !row.blocked;
    const confirmed = window.confirm(
      next
        ? `Bloquear o consumo de créditos de "${row.organizationName}"? A organização deixa de conseguir gerar criativos até ser desbloqueada.`
        : `Desbloquear "${row.organizationName}"? A organização volta a poder consumir créditos.`
    );
    if (!confirmed) return;
    try {
      await creativeAdminService.setAccountOptions({
        organizationId: row.organizationId,
        blocked: next,
        performedBy: actor,
      });
      setFlash(
        `"${row.organizationName}" foi ${next ? 'bloqueada' : 'desbloqueada'} para consumo de créditos.`
      );
      accounts.reload();
    } catch (err: any) {
      setFlash(null);
      setAdjustError(err?.message || 'Falha ao alterar o estado da conta.');
    }
  };

  const ledgerTypeOptions = ['', 'USAGE', 'PURCHASE', 'GRANT', 'REFUND', 'ADJUSTMENT', 'EXPIRATION'];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Saldo total em circulação"
          value={fmtNum(totals.balance)}
          hint={`${(accounts.data || []).length} conta(s)`}
          icon={<Wallet className="w-3.5 h-3.5" />}
        />
        <StatCard
          label="Consumido acumulado"
          value={fmtNum(totals.consumed)}
          hint="soma de todos os consumos"
          icon={<TrendingDown className="w-3.5 h-3.5" />}
          tone="cyan"
        />
        <StatCard
          label="Comprado acumulado"
          value={fmtNum(totals.purchased)}
          hint="recargas aprovadas"
          icon={<Coins className="w-3.5 h-3.5" />}
          tone="emerald"
        />
        <StatCard
          label="Saldos baixos"
          value={fmtNum(totals.low)}
          hint="no limite de alerta ou abaixo"
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          tone={totals.low > 0 ? 'amber' : 'slate'}
        />
      </div>

      {flash && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 text-[11px] text-emerald-200">
          {flash}
        </div>
      )}

      {/* ─── Painel de ajuste manual ─────────────────────────────────────── */}
      {adjustTarget && canManage && (
        <Panel
          title={`Ajuste manual · ${adjustTarget.organizationName}`}
          subtitle="Positivo credita, negativo debita. O motivo é obrigatório e fica no livro-razão."
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Valor (créditos)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustAmount(String(Math.abs(numericAmount || 0) * -1 || -100))}
                  className="w-8 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-center cursor-pointer hover:bg-rose-500/20"
                  title="Debitar"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="flex-1 bg-[#070512] border border-white/10 focus:border-[#7C3AED] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAdjustAmount(String(Math.abs(numericAmount || 0) || 100))}
                  className="w-8 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-center cursor-pointer hover:bg-emerald-500/20"
                  title="Creditar"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="md:col-span-6">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Motivo (obrigatório)
              </label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Ex: compensação por falha de geração / oferta comercial acordada"
                className="w-full bg-[#070512] border border-white/10 focus:border-[#7C3AED] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex items-center gap-2">
              <button
                type="button"
                onClick={submitAdjust}
                disabled={saving}
                className="flex-1 px-3 py-2 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] disabled:opacity-50 text-xs font-bold text-white cursor-pointer"
              >
                {saving ? 'A aplicar…' : 'Aplicar ajuste'}
              </button>
              <button
                type="button"
                onClick={() => setAdjustTarget(null)}
                className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
            </div>

            <div className="md:col-span-12 flex flex-wrap items-center gap-4 pt-1">
              <span className="text-[11px] text-slate-400">
                Saldo actual: <span className="font-mono text-white">{fmtNum(adjustTarget.balance)} cr</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Após ajuste:{' '}
                <span className={`font-mono font-bold ${wouldGoNegative ? 'text-rose-400' : 'text-emerald-300'}`}>
                  {amountIsValid ? fmtNum(projected) : '—'} cr
                </span>
              </span>
              {wouldGoNegative && (
                <span className="text-[11px] text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> O saldo não pode ficar negativo
                </span>
              )}
            </div>
          </div>

          {adjustError && (
            <p className="mt-3 text-[11px] text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {adjustError}
            </p>
          )}
        </Panel>
      )}

      {/* ─── Contas ──────────────────────────────────────────────────────── */}
      <Panel
        title="Saldos por organização"
        subtitle="Consumido vs restante, atividade e estado da conta"
        padded={false}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar organização…"
                className="bg-[#070512] border border-white/10 focus:border-[#7C3AED] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-white focus:outline-none w-44"
              />
            </div>
            <button
              type="button"
              onClick={accounts.reload}
              className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 cursor-pointer"
              title="Recarregar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      >
        {accounts.loading ? (
          <Loading label="A carregar contas…" />
        ) : accounts.error ? (
          <ErrorState message={accounts.error} onRetry={accounts.reload} />
        ) : rows.length === 0 ? (
          <EmptyState message="Sem contas de créditos. Uma conta é criada automaticamente na primeira geração de uma organização." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Organização</Th>
                  <Th align="right">Saldo</Th>
                  <Th align="right">Consumido</Th>
                  <Th align="right">Comprado</Th>
                  <Th align="right">Gerações</Th>
                  <Th align="center">Pedidos</Th>
                  <Th align="center">Estado</Th>
                  <Th align="right">Ações</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.organizationId} className="hover:bg-white/[0.02]">
                    <Td>
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">{a.organizationName}</p>
                        <p className="text-[9px] text-slate-500 font-mono truncate">{a.organizationId}</p>
                      </div>
                    </Td>
                    <Td align="right">
                      <span
                        className={`font-mono font-bold ${
                          a.balance <= a.lowBalanceThreshold ? 'text-amber-300' : 'text-white'
                        }`}
                      >
                        {fmtNum(a.balance)}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-slate-300">{fmtNum(a.totalConsumed)}</span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-slate-300">{fmtNum(a.totalPurchased)}</span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-slate-300">{fmtNum(a.generations)}</span>
                    </Td>
                    <Td align="center">
                      {a.pendingRequests > 0 ? (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {a.pendingRequests}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">—</span>
                      )}
                    </Td>
                    <Td align="center">
                      {a.blocked ? (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                          BLOQUEADA
                        </span>
                      ) : (
                        <StatusBadge status="ACTIVE" />
                      )}
                    </Td>
                    <Td align="right">
                      {canManage ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openAdjust(a)}
                            className="px-2 py-1 rounded-md bg-[#7C3AED]/15 hover:bg-[#7C3AED]/25 border border-[#7C3AED]/30 text-[10px] font-bold text-[#C084FC] cursor-pointer"
                          >
                            Ajustar
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleBlocked(a)}
                            className="p-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 cursor-pointer"
                            title={a.blocked ? 'Desbloquear consumo' : 'Bloquear consumo'}
                          >
                            {a.blocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-600 flex items-center justify-end gap-1">
                          <Ban className="w-3 h-3" /> só leitura
                        </span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ─── Livro-razão ─────────────────────────────────────────────────── */}
      <Panel
        title="Livro-razão de créditos"
        subtitle={`${fmtNum(ledger.data?.total || 0)} transacção(ões) registada(s) no servidor`}
        padded={false}
        actions={
          <select
            value={ledgerType}
            onChange={(e) => setLedgerType(e.target.value)}
            className="bg-[#070512] border border-white/10 focus:border-[#7C3AED] rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none cursor-pointer"
          >
            {ledgerTypeOptions.map((t) => (
              <option key={t} value={t}>
                {t === '' ? 'Todos os tipos' : t}
              </option>
            ))}
          </select>
        }
      >
        {ledger.loading ? (
          <Loading label="A carregar o livro-razão…" />
        ) : ledger.error ? (
          <ErrorState message={ledger.error} onRetry={ledger.reload} />
        ) : ledgerRows.length === 0 ? (
          <EmptyState message="Sem transacções para este filtro." />
        ) : (
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-[#0C0A18] z-10">
                <tr>
                  <Th>Data</Th>
                  <Th>Tipo</Th>
                  <Th>Organização</Th>
                  <Th>Utilizador</Th>
                  <Th>Motivo</Th>
                  <Th align="right">Valor</Th>
                  <Th align="right">Saldo após</Th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((t: AdminCreditTransaction) => (
                  <tr key={t.id} className="hover:bg-white/[0.02]">
                    <Td className="whitespace-nowrap text-slate-400">{fmtDate(t.timestamp)}</Td>
                    <Td>
                      <StatusBadge status={t.type} />
                    </Td>
                    <Td className="truncate max-w-[160px]">{t.organizationName || t.organizationId}</Td>
                    <Td className="truncate max-w-[140px] text-slate-400">{t.userName || '—'}</Td>
                    <Td className="max-w-[320px]">
                      <span className="text-slate-400 truncate block" title={t.reason}>
                        {t.reason || '—'}
                      </span>
                      {t.performedBy && (
                        <span className="text-[9px] text-slate-600">por {t.performedBy}</span>
                      )}
                    </Td>
                    <Td align="right">
                      <span
                        className={`font-mono font-bold ${
                          isConsumptionType(t.type as any) ? 'text-slate-300' : 'text-emerald-300'
                        }`}
                      >
                        {isConsumptionType(t.type as any) ? '-' : '+'}
                        {fmtNum(t.amount)}
                      </span>
                    </Td>
                    <Td align="right">
                      <span className="font-mono text-slate-400">
                        {t.balanceAfter === null ? '—' : fmtNum(t.balanceAfter)}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ─── Receita acumulada por saldo ─────────────────────────────────── */}
      <Panel title="Notas de leitura" subtitle="Como interpretar estes números">
        <ul className="text-[11px] text-slate-400 space-y-1.5 leading-relaxed list-disc pl-4">
          <li>
            <strong className="text-slate-300">Restante</strong> é o saldo disponível;{' '}
            <strong className="text-slate-300">consumido</strong> é o acumulado de sempre (não reinicia).
          </li>
          <li>
            A soma das colunas <em>valor</em> do livro-razão é igual ao saldo de cada organização — as
            duas vistas nunca divergem porque o saldo é actualizado na mesma transacção SQL.
          </li>
          <li>
            Um ajuste negativo é a forma correcta de corrigir uma conta creditada por engano. Rejeitar um
            pedido já aprovado <em>não</em> estorna créditos — o servidor bloqueia essa operação de propósito.
          </li>
          <li>
            Contas bloqueadas recusam consumo, mas continuam a poder receber recargas aprovadas.
          </li>
        </ul>
      </Panel>
    </div>
  );
};
