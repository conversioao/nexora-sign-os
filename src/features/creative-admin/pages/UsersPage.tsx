/**
 * Utilizadores — quem usa o Creative AI, quanto gera e quanto consome.
 *
 * Responde a duas perguntas de operação: «quem está a usar o estúdio?» e «quem
 * parou?». A lista chega inteira do servidor, pelo que a pesquisa e a ordenação
 * são feitas no cliente: são dezenas de linhas, não milhares, e assim filtrar é
 * instantâneo em vez de disparar um pedido por cada tecla escrita.
 */
import React from 'react';
import { creativeAdminService } from '../services/creativeAdminService';
import { useAdminData } from '../hooks/useAdminData';
import { CreativeUserRow } from '../types';
import {
  Panel,
  StatCard,
  Loading,
  ErrorState,
  EmptyState,
  RatioBar,
  Th,
  Td,
  fmtNum,
  fmtRelative,
} from '../components/ui';
import { Users, Sparkles, Coins, Activity, Search, ArrowDownWideNarrow } from 'lucide-react';

/** Critérios de ordenação oferecidos ao administrador. */
type SortKey = 'generations' | 'credits' | 'recent';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Taxa de sucesso de um utilizador, em percentagem.
 * Devolve `null` quando não há tentativas concluídas nem falhadas — nesse caso a
 * célula mostra «—» em vez de um 0% enganador.
 */
const successRateOf = (u: CreativeUserRow): number | null => {
  const attempts = (u.completed || 0) + (u.failed || 0);
  if (attempts <= 0) return null;
  return Math.round(((u.completed || 0) / attempts) * 100);
};

export const CreativeAdminUsersPage: React.FC = () => {
  const users = useAdminData(() => creativeAdminService.getUsers(), []);
  const [search, setSearch] = React.useState('');
  const [sortBy, setSortBy] = React.useState<SortKey>('generations');

  const rows = users.data || [];

  // ─── Indicadores agregados ─────────────────────────────────────────────────
  const totals = rows.reduce(
    (acc, u) => {
      acc.generations += u.generations || 0;
      acc.completed += u.completed || 0;
      acc.failed += u.failed || 0;
      acc.creditsSpent += u.creditsSpent || 0;
      return acc;
    },
    { generations: 0, completed: 0, failed: 0, creditsSpent: 0 }
  );

  const organizations = new Set(rows.map((u) => u.organizationId)).size;
  const now = Date.now();
  const activeLast7d = rows.filter(
    (u) => u.lastGenerationAt && now - new Date(u.lastGenerationAt).getTime() < SEVEN_DAYS_MS
  ).length;
  const idle = rows.length - activeLast7d;
  const avgCredits = totals.generations > 0 ? Math.round(totals.creditsSpent / totals.generations) : 0;

  // ─── Pesquisa e ordenação (no cliente) ─────────────────────────────────────
  const visible = React.useMemo(() => {
    const source = users.data || [];
    const term = search.trim().toLowerCase();

    const filtered = term
      ? source.filter((u) =>
          [u.userName, u.userEmail, u.organizationName]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(term))
        )
      : source;

    const sorted = [...filtered];
    if (sortBy === 'credits') {
      sorted.sort((a, b) => (b.creditsSpent || 0) - (a.creditsSpent || 0));
    } else if (sortBy === 'recent') {
      // Quem nunca gerou fica no fim: string vazia ordena depois de qualquer ISO.
      sorted.sort((a, b) => (b.lastGenerationAt || '').localeCompare(a.lastGenerationAt || ''));
    } else {
      sorted.sort((a, b) => (b.generations || 0) - (a.generations || 0));
    }
    return sorted;
  }, [users.data, search, sortBy]);

  if (users.loading) return <Loading label="A carregar utilizadores do Creative AI…" />;
  if (users.error) return <ErrorState message={users.error} onRetry={users.reload} />;
  if (rows.length === 0)
    return (
      <EmptyState message="Ainda não há utilizadores com atividade no Creative AI. Assim que alguém gerar um criativo, aparece aqui com o respectivo consumo." />
    );

  return (
    <div className="space-y-5">
      {/* ─── KPIs ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard
          label="Utilizadores"
          value={fmtNum(rows.length)}
          hint={`${fmtNum(organizations)} organização(ões) representada(s)`}
          icon={<Users className="w-3.5 h-3.5" />}
          tone="violet"
        />
        <StatCard
          label="Gerações totais"
          value={fmtNum(totals.generations)}
          hint={`${fmtNum(totals.completed)} ok · ${fmtNum(totals.failed)} falhas`}
          icon={<Sparkles className="w-3.5 h-3.5" />}
          tone="cyan"
        />
        <StatCard
          label="Créditos gastos"
          value={fmtNum(totals.creditsSpent)}
          hint={totals.generations > 0 ? `${fmtNum(avgCredits)} cr por geração em média` : 'sem gerações registadas'}
          icon={<Coins className="w-3.5 h-3.5" />}
          tone="emerald"
        />
        <StatCard
          label="Ativos (7 dias)"
          value={fmtNum(activeLast7d)}
          hint={idle > 0 ? `${fmtNum(idle)} sem gerações recentes` : 'todos com atividade recente'}
          icon={<Activity className="w-3.5 h-3.5" />}
          tone={activeLast7d > 0 ? 'violet' : 'slate'}
        />
      </div>

      {/* ─── Tabela ──────────────────────────────────────────────────────── */}
      <Panel
        title="Utilizadores do Creative AI"
        subtitle={`${fmtNum(visible.length)} de ${fmtNum(rows.length)} utilizador(es)`}
      >
        {/* Pesquisa e ordenação: filtram apenas o que já está carregado. */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Procurar por nome, email ou organização…"
              className="w-full bg-[#050914] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7C3AED]/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ArrowDownWideNarrow className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-[#050914] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#7C3AED]/60 cursor-pointer"
            >
              <option value="generations">Mais gerações</option>
              <option value="credits">Mais créditos gastos</option>
              <option value="recent">Atividade mais recente</option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState message={`Nenhum utilizador corresponde a «${search.trim()}». Limpe a pesquisa para voltar a ver a lista completa.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <Th>Utilizador</Th>
                  <Th>Organização</Th>
                  <Th align="right">Gerações</Th>
                  <Th align="right">Créditos gastos</Th>
                  <Th align="right">Saldo da organização</Th>
                  <Th align="right">Última atividade</Th>
                  <Th align="right">Sucesso</Th>
                </tr>
              </thead>
              <tbody>
                {visible.map((u) => {
                  const rate = successRateOf(u);
                  return (
                    <tr key={`${u.userId}-${u.organizationId}`} className="hover:bg-white/[0.02]">
                      <Td>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{u.userName}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {u.userEmail || 'sem email'}
                            {u.userRole ? ` · ${u.userRole}` : ''}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <span className="text-[11px] text-slate-300">{u.organizationName}</span>
                      </Td>
                      <Td align="right">
                        <span className="font-mono font-bold text-white">{fmtNum(u.generations)}</span>
                        <span className="block text-[9px] text-slate-500 font-mono whitespace-nowrap">
                          {fmtNum(u.completed)} ok · {fmtNum(u.failed)} falhas
                        </span>
                      </Td>
                      <Td align="right">
                        <span className="font-mono text-white">{fmtNum(u.creditsSpent)}</span>
                      </Td>
                      <Td align="right">
                        {u.organizationBalance === null || u.organizationBalance === undefined ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <span className="font-mono text-slate-300">{fmtNum(u.organizationBalance)}</span>
                        )}
                        <span className="block text-[9px] text-slate-600">saldo partilhado</span>
                      </Td>
                      <Td align="right">
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">
                          {fmtRelative(u.lastGenerationAt)}
                        </span>
                      </Td>
                      <Td align="right">
                        {rate === null ? (
                          <span className="text-slate-500">—</span>
                        ) : (
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[10px] font-mono text-slate-400 w-8 text-right">{rate}%</span>
                            <div className="w-16">
                              <RatioBar
                                value={rate}
                                max={100}
                                tone={rate < 80 ? 'bg-amber-500' : 'bg-emerald-500'}
                              />
                            </div>
                          </div>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
