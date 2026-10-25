/**
 * Consumo & Estilos — analítica do Creative AI.
 *
 * Junta três leituras que se explicam umas às outras: os indicadores globais
 * (quanto se consumiu nos últimos 30 dias), o consumo dia a dia (quando) e o
 * ranking de estilos/modelos (com que agentes). Cada bloco carrega de forma
 * independente — se o servidor falhar numa das chamadas, as outras continuam a
 * mostrar dados em vez de deixar a página inteira em branco.
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
  Th,
  Td,
  fmtNum,
  fmtDay,
  fmtRelative,
} from '../components/ui';
import { Coins, Sparkles, CheckCircle2, Calculator, BarChart3, Trophy } from 'lucide-react';

export const CreativeAdminAnalyticsPage: React.FC = () => {
  const overview = useAdminData(() => creativeAdminService.getOverview(), []);
  const styles = useAdminData(() => creativeAdminService.getStyleUsage(), []);
  const trend = useAdminData(() => creativeAdminService.getTrend(30), []);

  const o = overview.data;

  // ─── Série diária ──────────────────────────────────────────────────────────
  const points = trend.data || [];
  const maxTrend = Math.max(1, ...points.map((p) => p.consumed));
  const totalTrend = points.reduce((sum, p) => sum + (p.consumed || 0), 0);
  const peak = points.reduce(
    (best, p) => (p.consumed > (best?.consumed || 0) ? p : best),
    points[0]
  );

  // ─── Estilos / modelos (mais usados primeiro) ──────────────────────────────
  const styleRows = React.useMemo(
    () => [...(styles.data || [])].sort((a, b) => (b.generations || 0) - (a.generations || 0)),
    [styles.data]
  );
  const topStyles = styleRows.slice(0, 3);
  const maxStyleGen = Math.max(1, ...styleRows.map((s) => s.generations));

  // Custo médio: sem gerações não há média — mostra-se «—» em vez de dividir por zero.
  const avgCost =
    o && o.generations.total > 0 ? Math.round(o.generations.creditsSpent / o.generations.total) : null;

  return (
    <div className="space-y-5">
      {/* ─── KPIs (30 dias) ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {overview.loading ? (
          <div className="sm:col-span-2 xl:col-span-4 rounded-2xl bg-[#0C0A18] border border-white/[0.07]">
            <Loading label="A carregar indicadores…" />
          </div>
        ) : overview.error ? (
          <div className="sm:col-span-2 xl:col-span-4 rounded-2xl bg-[#0C0A18] border border-white/[0.07]">
            <ErrorState message={overview.error} onRetry={overview.reload} />
          </div>
        ) : !o ? (
          <div className="sm:col-span-2 xl:col-span-4 rounded-2xl bg-[#0C0A18] border border-white/[0.07]">
            <EmptyState message="Sem indicadores de consumo para mostrar." />
          </div>
        ) : (
          <>
            <StatCard
              label="Créditos consumidos (30d)"
              value={fmtNum(o.credits.consumedLast30d)}
              hint={`${fmtNum(o.credits.consumed)} desde sempre`}
              icon={<Coins className="w-3.5 h-3.5" />}
              tone="violet"
            />
            <StatCard
              label="Gerações (30d)"
              value={fmtNum(o.generations.last30d)}
              hint={`${fmtNum(o.generations.total)} no total · ${fmtNum(o.generations.running)} a correr`}
              icon={<Sparkles className="w-3.5 h-3.5" />}
              tone="cyan"
            />
            <StatCard
              label="Taxa de sucesso"
              value={o.generations.successRate === null ? '—' : `${o.generations.successRate}%`}
              hint={`${fmtNum(o.generations.completed)} ok · ${fmtNum(o.generations.failed)} falhas`}
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              tone={o.generations.successRate !== null && o.generations.successRate < 80 ? 'amber' : 'emerald'}
            />
            <StatCard
              label="Custo médio por geração"
              value={avgCost === null ? '—' : `${fmtNum(avgCost)} cr`}
              hint={
                avgCost === null
                  ? 'sem gerações para calcular a média'
                  : `${fmtNum(o.generations.creditsSpent)} cr em ${fmtNum(o.generations.total)} gerações`
              }
              icon={<Calculator className="w-3.5 h-3.5" />}
              tone="slate"
            />
          </>
        )}
      </div>

      {/* ─── Consumo diário (30 dias) ────────────────────────────────────── */}
      <Panel
        title="Consumo diário (30 dias)"
        subtitle="Créditos gastos por dia"
        actions={
          <span className="text-[10px] font-mono text-slate-500">
            pico {fmtNum(maxTrend)} cr
          </span>
        }
      >
        {trend.loading ? (
          <Loading label="A carregar o consumo…" />
        ) : trend.error ? (
          <ErrorState message={trend.error} onRetry={trend.reload} />
        ) : points.length === 0 ? (
          <EmptyState message="Ainda não há consumo registado nos últimos 30 dias." />
        ) : (
          <div className="space-y-3">
            <div className="flex items-end gap-1 h-40">
              {points.map((p, i) => (
                <div
                  key={p.day}
                  className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1 group"
                  title={`${fmtDay(p.day)} · ${fmtNum(p.consumed)} cr consumidos · ${fmtNum(p.added)} cr adicionados · ${fmtNum(p.generations)} gerações`}
                >
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#7C3AED]/40 to-[#C084FC] group-hover:from-[#7C3AED]/70 group-hover:to-white transition-all"
                    style={{ height: `${Math.max(3, (p.consumed / maxTrend) * 100)}%` }}
                  />
                  <span className="text-[8px] text-slate-600 font-mono h-3 shrink-0">
                    {i % 5 === 0 || i === points.length - 1 ? fmtDay(p.day).split(' ')[0] : ''}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-slate-500">
              <span>
                Total: <span className="text-slate-300">{fmtNum(totalTrend)} cr</span>
              </span>
              <span>
                Média diária:{' '}
                <span className="text-slate-300">{fmtNum(Math.round(totalTrend / points.length))} cr</span>
              </span>
              <span>
                Melhor dia:{' '}
                <span className="text-[#C084FC]">
                  {peak ? `${fmtDay(peak.day)} (${fmtNum(peak.consumed)} cr)` : '—'}
                </span>
              </span>
            </div>
          </div>
        )}
      </Panel>

      {/* ─── Estilos e modelos ───────────────────────────────────────────── */}
      <Panel
        title="Estilos e modelos"
        subtitle="Os agentes mais usados, por volume de gerações"
        actions={
          <span className="text-[10px] font-mono text-slate-500">
            {fmtNum(styleRows.length)} estilo(s)/modelo(s)
          </span>
        }
      >
        {styles.loading ? (
          <Loading label="A carregar estilos…" />
        ) : styles.error ? (
          <ErrorState message={styles.error} onRetry={styles.reload} />
        ) : styleRows.length === 0 ? (
          <EmptyState message="Ainda não há estilos utilizados. Assim que houver gerações, o ranking aparece aqui." />
        ) : (
          <>
            {/* Top 3 em destaque, antes da tabela completa */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {topStyles.map((s, i) => (
                <div
                  key={`top-${s.styleId}-${s.model}`}
                  className="rounded-xl bg-[#050914] border border-white/[0.07] p-3 space-y-2 hover:border-[#7C3AED]/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-[10px] font-mono font-bold text-[#C084FC] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{s.styleId}</p>
                      <p className="text-[9px] text-slate-500 font-mono truncate">{s.model}</p>
                    </div>
                    {i === 0 && <Trophy className="w-3.5 h-3.5 text-[#C084FC] ml-auto shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-400">{fmtNum(s.generations)} gerações</span>
                    <span className="text-[#22D3EE]">{fmtNum(s.creditsSpent)} cr</span>
                  </div>
                  <RatioBar value={s.generations} max={maxStyleGen} />
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Estilo</Th>
                    <Th>Modelo</Th>
                    <Th align="right">Gerações</Th>
                    <Th align="right">Utilizadores distintos</Th>
                    <Th align="right">Créditos</Th>
                    <Th align="right">Sucesso</Th>
                    <Th align="right">Último uso</Th>
                  </tr>
                </thead>
                <tbody>
                  {styleRows.map((s, i) => {
                    const attempts = (s.completed || 0) + (s.failed || 0);
                    const rate = attempts > 0 ? Math.round(((s.completed || 0) / attempts) * 100) : null;
                    return (
                      <tr key={`${s.styleId}-${s.model}`} className="hover:bg-white/[0.02]">
                        <Td>
                          <span className="text-[10px] font-mono text-slate-500">{i + 1}</span>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2 min-w-0">
                            <BarChart3 className="w-3.5 h-3.5 text-[#C084FC] shrink-0" />
                            <span className="text-xs font-semibold text-white truncate">{s.styleId}</span>
                          </div>
                        </Td>
                        <Td>
                          <span className="text-[11px] font-mono text-slate-400">{s.model}</span>
                        </Td>
                        <Td align="right">
                          <span className="font-mono font-bold text-white">{fmtNum(s.generations)}</span>
                          <div className="w-20 ml-auto mt-1">
                            <RatioBar value={s.generations} max={maxStyleGen} />
                          </div>
                        </Td>
                        <Td align="right">
                          <span className="font-mono text-slate-300">{fmtNum(s.distinctUsers)}</span>
                        </Td>
                        <Td align="right">
                          <span className="font-mono text-white">{fmtNum(s.creditsSpent)}</span>
                        </Td>
                        <Td align="right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                              {fmtNum(s.completed)} ok · {fmtNum(s.failed)} falhas
                            </span>
                            <div className="w-16">
                              <RatioBar
                                value={s.completed}
                                max={attempts}
                                tone={rate !== null && rate < 80 ? 'bg-amber-500' : 'bg-emerald-500'}
                              />
                            </div>
                            <span className="text-[10px] font-mono text-slate-300 w-9 text-right">
                              {rate === null ? '—' : `${rate}%`}
                            </span>
                          </div>
                        </Td>
                        <Td align="right">
                          <span className="text-[11px] text-slate-400 whitespace-nowrap">
                            {fmtRelative(s.lastUsedAt)}
                          </span>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>
    </div>
  );
};
