/**
 * Visão Geral — página de entrada do painel de admin do Creative AI.
 * Responde em segundos a: «o ecossistema está saudável?».
 */
import React from 'react';
import { creativeAdminService } from '../services/creativeAdminService';
import { useAdminData } from '../hooks/useAdminData';
import {
  Panel,
  StatCard,
  Loading,
  ErrorState,
  EmptyState,
  RatioBar,
  fmtNum,
  fmtKz,
  fmtDay,
  fmtRelative,
} from '../components/ui';
import {
  Coins,
  Sparkles,
  Clock,
  TrendingDown,
  Users,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  BarChart3,
  UserCog,
} from 'lucide-react';

export const CreativeAdminOverviewPage: React.FC<{ onNavigate?: (route: string) => void }> = ({
  onNavigate,
}) => {
  const overview = useAdminData(() => creativeAdminService.getOverview(), []);
  const users = useAdminData(() => creativeAdminService.getUsers(), []);
  const styles = useAdminData(() => creativeAdminService.getStyleUsage(), []);
  const trend = useAdminData(() => creativeAdminService.getTrend(14), []);

  if (overview.loading) return <Loading label="A carregar a saúde do ecossistema…" />;
  if (overview.error)
    return <ErrorState message={overview.error} onRetry={overview.reload} />;
  if (!overview.data) return <EmptyState message="Sem dados de créditos." />;

  const o = overview.data;
  const topUsers = (users.data || []).slice(0, 5);
  const topStyles = (styles.data || []).slice(0, 5);
  const maxUserGen = Math.max(1, ...topUsers.map((u) => u.generations));
  const maxStyleGen = Math.max(1, ...topStyles.map((s) => s.generations));
  const maxTrend = Math.max(1, ...(trend.data || []).map((p) => p.consumed));

  return (
    <div className="space-y-5">
      {/* ─── KPIs principais ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Créditos em circulação"
          value={fmtNum(o.credits.inCirculation)}
          hint={`${o.credits.accounts} conta(s) com saldo`}
          icon={<Wallet className="w-3.5 h-3.5" />}
          tone="violet"
        />
        <StatCard
          label="Créditos consumidos"
          value={fmtNum(o.credits.consumed)}
          hint={`${fmtNum(o.credits.consumedLast30d)} nos últimos 30 dias`}
          icon={<TrendingDown className="w-3.5 h-3.5" />}
          tone="cyan"
        />
        <StatCard
          label="Gerações totais"
          value={fmtNum(o.generations.total)}
          hint={`${fmtNum(o.generations.last30d)} nos últimos 30 dias`}
          icon={<Sparkles className="w-3.5 h-3.5" />}
          tone="emerald"
        />
        <StatCard
          label="Recargas pendentes"
          value={fmtNum(o.requests.pending)}
          hint={o.requests.pending > 0 ? `${fmtKz(o.requests.pendingRevenueKz)} em espera` : 'nada em espera'}
          icon={<Clock className="w-3.5 h-3.5" />}
          tone={o.requests.pending > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* ─── Linha secundária de indicadores ─────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Taxa de sucesso"
          value={o.generations.successRate === null ? '—' : `${o.generations.successRate}%`}
          hint={`${fmtNum(o.generations.completed)} ok · ${fmtNum(o.generations.failed)} falhas`}
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          tone={o.generations.successRate !== null && o.generations.successRate < 80 ? 'amber' : 'emerald'}
        />
        <StatCard
          label="Em processamento"
          value={fmtNum(o.generations.running)}
          hint="jobs a correr agora"
          icon={<Clock className="w-3.5 h-3.5" />}
          tone="cyan"
        />
        <StatCard
          label="Utilizadores ativos"
          value={fmtNum(o.generations.distinctUsers)}
          hint={`${fmtNum(o.credits.granted)} cr oferecidos`}
          icon={<Users className="w-3.5 h-3.5" />}
          tone="violet"
        />
        <StatCard
          label="Saldos baixos"
          value={fmtNum(o.credits.lowBalanceAccounts)}
          hint={
            o.credits.blockedAccounts > 0
              ? `${o.credits.blockedAccounts} conta(s) bloqueada(s)`
              : 'nenhuma conta bloqueada'
          }
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          tone={o.credits.lowBalanceAccounts > 0 ? 'amber' : 'slate'}
        />
      </div>

      {/* ─── Receita ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Panel title="Receita de recargas" subtitle="Valor dos pedidos já aprovados">
          <div className="space-y-3">
            <div>
              <span className="text-2xl font-extrabold text-emerald-300 font-mono">
                {fmtKz(o.requests.approvedRevenueKz)}
              </span>
              <p className="text-[10px] text-slate-500 mt-1">
                {fmtNum(o.requests.approved)} pedido(s) aprovado(s) · {fmtNum(o.requests.rejected)} rejeitado(s)
              </p>
            </div>
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Créditos comprados</span>
                <span className="font-mono text-white">{fmtNum(o.credits.purchased)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Créditos estornados</span>
                <span className="font-mono text-white">{fmtNum(o.credits.refunded)}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Créditos gastos em gerações</span>
                <span className="font-mono text-white">{fmtNum(o.generations.creditsSpent)}</span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          title="Consumo (14 dias)"
          subtitle="Créditos gastos por dia"
          actions={
            onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('ca-analytics')}
                className="text-[10px] font-bold text-[#C084FC] hover:underline cursor-pointer flex items-center gap-1"
              >
                <BarChart3 className="w-3 h-3" /> Analítica
              </button>
            )
          }
        >
          {(trend.data || []).length === 0 ? (
            <EmptyState message="Ainda não há consumo registado no período." />
          ) : (
            <div className="flex items-end gap-1 h-28">
              {(trend.data || []).map((p) => (
                <div key={p.day} className="flex-1 flex flex-col items-center gap-1 group" title={`${p.day}: ${p.consumed} cr · ${p.generations} gerações`}>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#7C3AED]/40 to-[#C084FC] group-hover:from-[#7C3AED]/60 transition-all"
                    style={{ height: `${Math.max(3, (p.consumed / maxTrend) * 100)}%` }}
                  />
                  <span className="text-[8px] text-slate-600 font-mono rotate-0">{fmtDay(p.day).split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Pedidos de recarga"
          subtitle="Fluxo de aprovação"
          actions={
            onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('ca-approvals')}
                className="text-[10px] font-bold text-[#C084FC] hover:underline cursor-pointer"
              >
                Abrir
              </button>
            )
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/[0.07] border border-amber-500/25">
              <span className="text-[11px] font-semibold text-amber-200">Pendentes</span>
              <span className="text-sm font-mono font-bold text-amber-300">{fmtNum(o.requests.pending)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/[0.07] border border-emerald-500/25">
              <span className="text-[11px] font-semibold text-emerald-200">Aprovados</span>
              <span className="text-sm font-mono font-bold text-emerald-300">{fmtNum(o.requests.approved)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-rose-500/[0.07] border border-rose-500/25">
              <span className="text-[11px] font-semibold text-rose-200">Rejeitados</span>
              <span className="text-sm font-mono font-bold text-rose-300">{fmtNum(o.requests.rejected)}</span>
            </div>
            {o.requests.pending > 0 && (
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {fmtNum(o.requests.pendingCredits)} créditos e {fmtKz(o.requests.pendingRevenueKz)} à espera de decisão.
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* ─── Rankings ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel
          title="Quem mais gera"
          subtitle="Top utilizadores por volume de gerações"
          actions={
            onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('ca-users')}
                className="text-[10px] font-bold text-[#C084FC] hover:underline cursor-pointer flex items-center gap-1"
              >
                <UserCog className="w-3 h-3" /> Ver todos
              </button>
            )
          }
        >
          {users.loading ? (
            <Loading label="A carregar utilizadores…" />
          ) : topUsers.length === 0 ? (
            <EmptyState message="Ainda não há gerações registadas. Assim que um utilizador gerar um criativo, aparece aqui." />
          ) : (
            <div className="space-y-3">
              {topUsers.map((u, i) => (
                <div key={`${u.userId}-${u.organizationId}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-md bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[9px] font-mono font-bold text-[#C084FC] flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{u.userName}</p>
                        <p className="text-[9px] text-slate-500 truncate">{u.organizationName}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-white">{fmtNum(u.generations)}</p>
                      <p className="text-[9px] text-slate-500 font-mono">{fmtNum(u.creditsSpent)} cr</p>
                    </div>
                  </div>
                  <RatioBar value={u.generations} max={maxUserGen} />
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Estilos mais utilizados"
          subtitle="Agentes/modelos preferidos pelos utilizadores"
          actions={
            onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('ca-analytics')}
                className="text-[10px] font-bold text-[#C084FC] hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            )
          }
        >
          {styles.loading ? (
            <Loading label="A carregar estilos…" />
          ) : topStyles.length === 0 ? (
            <EmptyState message="Ainda não há estilos utilizados." />
          ) : (
            <div className="space-y-3">
              {topStyles.map((s) => (
                <div key={`${s.styleId}-${s.model}`} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.styleId}</p>
                      <p className="text-[9px] text-slate-500 truncate font-mono">
                        {s.model} · {fmtNum(s.distinctUsers)} utilizador(es)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-bold text-white">{fmtNum(s.generations)}</p>
                      <p className="text-[9px] text-slate-500 font-mono">{fmtNum(s.creditsSpent)} cr</p>
                    </div>
                  </div>
                  <RatioBar value={s.generations} max={maxStyleGen} tone="bg-[#06B6D4]" />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {o.generations.total === 0 && (
        <Panel title="Como começar" subtitle="O ecossistema ainda não tem atividade">
          <p className="text-xs text-slate-400 leading-relaxed">
            Ainda não há gerações registadas no servidor. Assim que um utilizador gerar um criativo no
            estúdio (Nexora Creative AI → Gerar Imagem), os créditos são debitados e o job registado
            aqui, com utilizador, estilo e custo. As estatísticas desta página passam então a ter dados.
          </p>
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            Última atividade registada: {fmtRelative(
              (users.data || [])
                .map((u) => u.lastGenerationAt)
                .filter(Boolean)
                .sort()
                .pop() as string | undefined
            )}
          </p>
        </Panel>
      )}
    </div>
  );
};
