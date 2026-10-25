/**
 * Modelos & Custos — página de administração dos MODELOS de geração de imagem
 * e do CUSTO EM CRÉDITOS de cada estilo.
 *
 * Porque existe: o custo de uma geração não é o mesmo para todos os modelos nem
 * para todos os estilos. O GPT Image 2 e o Nano Banana 2.1 têm preços de API
 * diferentes, e um estilo mais exigente pode consumir mais. Aqui define-se a
 * grelha modelo × estilo; é ELA que decide o débito, porque o servidor passou a
 * calcular o custo (o valor enviado pelo browser deixou de ser aceite).
 *
 * Regras de preço, por ordem de prioridade no servidor:
 *   1. preço do ESTILO nesse modelo (esta grelha);
 *   2. custo BASE do modelo (coluna "Custo base");
 *   3. 8 créditos, se nada estiver definido.
 */
import React, { useMemo, useState } from 'react';
import { creativeAdminService } from '../services/creativeAdminService';
import { useAdminData } from '../hooks/useAdminData';
import { useSession } from '../../../context/SessionContext';
import { AdminImageModel, GenerationCosts } from '../types';
import { Panel, Loading, ErrorState, EmptyState, StatusBadge, fmtNum } from '../components/ui';
import { CREATIVE_AGENTS_DEFINITIONS } from '../../../types/creativeAgents';
import { Cpu, Save, Info, Check, Sparkles, AlertTriangle, Film } from 'lucide-react';

const INPUT_CLASS =
  'w-full bg-[#080612] border border-white/10 focus:border-[#00E5FF] rounded-lg px-2 py-1.5 text-xs text-white outline-none font-mono';

const LABEL_CLASS = 'block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1';

/** Chave da célula da grelha: modelo + estilo. */
const chave = (modelId: string, styleId: string) => `${modelId}::${styleId}`;

export interface CreativeAdminModelsPageProps {
  canManage: boolean;
}

export const CreativeAdminModelsPage: React.FC<CreativeAdminModelsPageProps> = ({ canManage }) => {
  const { currentUser } = useSession();
  const actor = currentUser?.name || 'Administrador';

  const { data, loading, error, reload } = useAdminData<AdminImageModel[]>(
    () => creativeAdminService.getModels(),
    []
  );

  /**
   * Custos de geração de STORYBOARD e VÍDEO — definidos aqui pelo administrador.
   *
   * São tabelas separadas dos modelos de imagem: o storyboard é uma imagem mas
   * não é um "modelo" escolhível, e o vídeo é outro serviço (Omni Flash). O valor
   * 0 significa "não cobra", pelo que activar a cobrança é sempre uma decisão
   * explícita.
   */
  const custosGeracao = useAdminData<GenerationCosts>(
    () => creativeAdminService.getGenerationCosts(),
    []
  );

  const [custoStoryboard, setCustoStoryboard] = useState<string>('');
  const [custoVideoPorDuracao, setCustoVideoPorDuracao] = useState<Record<string, string>>({});
  const [aGravarCustos, setAGravarCustos] = useState(false);

  /** Células editadas: `modelo::estilo` → texto do campo. */
  const [edicoes, setEdicoes] = useState<Record<string, string>>({});
  const [baseEdicoes, setBaseEdicoes] = useState<Record<string, string>>({});
  const [aGravar, setAGravar] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const modelos = data || [];
  const estilos = CREATIVE_AGENTS_DEFINITIONS;

  /** Custo base em edição (ou o que veio do servidor). */
  const custoBase = (m: AdminImageModel): number =>
    baseEdicoes[m.id] !== undefined ? Number(baseEdicoes[m.id]) || 0 : m.defaultCost;

  /** Custo efetivo de um estilo: preço próprio → custo base. */
  const custoEfetivo = (m: AdminImageModel, styleId: string): number => {
    const editado = edicoes[chave(m.id, styleId)];
    if (editado !== undefined && editado !== '') return Number(editado) || 0;
    const doServidor = m.styleCosts?.[styleId];
    return doServidor !== undefined ? doServidor : custoBase(m);
  };

  const totalPersonalizados = useMemo(
    () => modelos.reduce((acc, m) => acc + Object.keys(m.styleCosts || {}).length, 0),
    [modelos]
  );

  const alterar = (modelId: string, styleId: string, valor: string) => {
    setEdicoes((prev) => ({ ...prev, [chave(modelId, styleId)]: valor }));
  };

  /**
   * Grava os custos de STORYBOARD (por estilo) e VÍDEO (por duração).
   * Só envia o que mudou — evita reescrever a tabela inteira a cada clique.
   */
  const guardarCustosGeracao = async () => {
    setMensagem(null);
    setErroAcao(null);

    const base = custosGeracao.data;
    if (!base) return;

    const costs: Array<{ kind: 'STORYBOARD' | 'VIDEO'; variant: string; creditCost: number }> = [];

    // Storyboard: valor base ('*') e, se preenchido, por estilo
    if (custoStoryboard !== '' && Number(custoStoryboard) !== (base.storyboard['*'] ?? 0)) {
      costs.push({ kind: 'STORYBOARD', variant: '*', creditCost: Number(custoStoryboard) });
    }

    // Vídeo: por duração (4/6/8/10s)
    for (const [duracao, valor] of Object.entries(custoVideoPorDuracao)) {
      if (valor === '') continue;
      const atual = base.video[duracao];
      if (atual === undefined || Number(valor) !== atual) {
        costs.push({ kind: 'VIDEO', variant: duracao, creditCost: Number(valor) });
      }
    }

    if (costs.length === 0) {
      setMensagem('Nada para guardar — nenhum custo de geração mudou.');
      return;
    }

    setAGravarCustos(true);
    try {
      const res = await creativeAdminService.saveGenerationCosts(costs, actor);
      setMensagem(
        `${res.saved} custo(s) de geração guardado(s). Passa a ser cobrado nas próximas gerações.`
      );
      setCustoStoryboard('');
      setCustoVideoPorDuracao({});
      custosGeracao.reload();
    } catch (e: any) {
      setErroAcao(e?.message || 'Falha ao guardar os custos de geração.');
    } finally {
      setAGravarCustos(false);
    }
  };

  const guardar = async () => {
    setMensagem(null);
    setErroAcao(null);

    const prices: Array<{ modelId: string; styleId: string; creditCost: number }> = [];

    // 1) Custos base
    for (const m of modelos) {
      const bruto = baseEdicoes[m.id];
      if (bruto === undefined || bruto === '') continue;
      const valor = Math.round(Number(bruto));
      if (!Number.isFinite(valor) || valor < 0) {
        setErroAcao(`Custo base inválido para "${m.label}".`);
        return;
      }
      if (valor !== m.defaultCost) prices.push({ modelId: m.id, styleId: '*', creditCost: valor });
    }

    // 2) Custos por estilo
    for (const [k, bruto] of Object.entries(edicoes)) {
      if (bruto === '') continue;
      const [modelId, styleId] = k.split('::');
      const valor = Math.round(Number(bruto));
      if (!Number.isFinite(valor) || valor < 0) {
        setErroAcao(`Custo inválido para ${styleId} em ${modelId}.`);
        return;
      }
      const original = modelos.find((m) => m.id === modelId)?.styleCosts?.[styleId];
      if (original === valor) continue;
      prices.push({ modelId, styleId, creditCost: valor });
    }

    if (prices.length === 0) {
      setMensagem('Nada para guardar — nenhum valor mudou.');
      return;
    }

    setAGravar(true);
    try {
      const res = await creativeAdminService.saveModelPricing(prices, actor);
      setMensagem(`${res.saved} preço(s) guardado(s). O novo custo aplica-se já às próximas gerações.`);
      setEdicoes({});
      setBaseEdicoes({});
      reload();
    } catch (e: any) {
      setErroAcao(e?.message || 'Falha ao guardar os custos.');
    } finally {
      setAGravar(false);
    }
  };

  const alternarAtivo = async (m: AdminImageModel) => {
    setErroAcao(null);
    try {
      await creativeAdminService.saveModel(
        {
          id: m.id,
          label: m.label,
          apiModel: m.apiModel,
          provider: m.provider,
          description: m.description,
          supportsImageInput: m.supportsImageInput,
          active: !m.active,
          sortOrder: m.sortOrder,
        },
        actor
      );
      setMensagem(`Modelo "${m.label}" ${m.active ? 'desactivado' : 'activado'}.`);
      reload();
    } catch (e: any) {
      setErroAcao(e?.message || 'Falha ao actualizar o modelo.');
    }
  };

  if (loading) return <Loading label="A carregar modelos e custos…" />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0C0A18] via-[#120C24] to-[#0C0A18] border border-white/[0.07] p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/12 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white">Modelos de Geração & Custos em Créditos</h1>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              Escolha o modelo que desenha as imagens e defina quanto custa cada estilo. O preço do
              estilo tem prioridade sobre o custo base do modelo; sem nada definido, aplicam-se{' '}
              <span className="text-slate-300 font-semibold">8 créditos</span>.
            </p>
          </div>
        </div>
      </div>

      {(mensagem || erroAcao) && (
        <div
          className={`flex items-start gap-2 rounded-xl border px-3 py-2 text-[11px] ${
            erroAcao
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          }`}
        >
          {erroAcao ? (
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          ) : (
            <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          )}
          <span>{erroAcao || mensagem}</span>
        </div>
      )}

      {/* Modelos disponíveis */}
      {/* ─── CUSTOS DE GERAÇÃO: STORYBOARD E VÍDEO ───────────────────────────── */}
      <Panel
        title="Custo de geração — Storyboard e Vídeo"
        subtitle="Quanto custa gerar um storyboard e criar um vídeo. 0 = não cobra nada."
        actions={
          canManage ? (
            <button
              type="button"
              onClick={guardarCustosGeracao}
              disabled={aGravarCustos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00E5FF] hover:brightness-110 text-slate-950 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {aGravarCustos ? 'A guardar…' : 'Guardar custos de geração'}
            </button>
          ) : (
            <span className="text-[10px] text-slate-500">Apenas leitura</span>
          )
        }
      >
        {custosGeracao.loading ? (
          <Loading label="A carregar custos de geração…" />
        ) : custosGeracao.error ? (
          <ErrorState message={custosGeracao.error} onRetry={custosGeracao.reload} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Storyboard */}
            <div className="rounded-xl border border-white/[0.07] bg-[#080612] p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-xs font-bold text-white">Storyboard (5 cenas)</span>
                <span className="text-[9px] font-mono text-slate-500">
                  cobrado por storyboard gerado
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Cada storyboard gera uma imagem de 5 painéis na kie.ai. O custo por estilo pode ser
                afinado mais tarde; aqui define-se o valor base.
              </p>
              <div>
                <label className={LABEL_CLASS}>Custo base (créditos)</label>
                <input
                  type="number"
                  min={0}
                  disabled={!canManage}
                  placeholder={String(custosGeracao.data?.storyboard['*'] ?? 0)}
                  value={custoStoryboard}
                  onChange={(e) => setCustoStoryboard(e.target.value)}
                  className={INPUT_CLASS}
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  Actual: <strong className="text-slate-300">{fmtNum(custosGeracao.data?.storyboard['*'] ?? 0)}</strong>{' '}
                  créditos {Number(custosGeracao.data?.storyboard['*'] ?? 0) === 0 ? '(não cobra)' : ''}
                </span>
              </div>

              {Object.keys(custosGeracao.data?.storyboard || {}).filter((k) => k !== '*').length > 0 && (
                <div className="pt-1 border-t border-white/[0.06]">
                  <label className={LABEL_CLASS}>Custos por estilo já definidos</label>
                  <ul className="text-[10px] text-slate-400 space-y-0.5">
                    {Object.entries(custosGeracao.data!.storyboard)
                      .filter(([k]) => k !== '*')
                      .map(([estilo, valor]) => (
                        <li key={estilo}>
                          • <span className="text-slate-300 font-mono">{estilo}</span> = {fmtNum(valor)} créditos
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Vídeo */}
            <div className="rounded-xl border border-white/[0.07] bg-[#080612] p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">Vídeo (Google Omni Flash)</span>
                <span className="text-[9px] font-mono text-slate-500">cobrado por vídeo criado</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                A kie.ai só aceita 4, 6, 8 ou 10 segundos. Defina o custo de cada duração — assim um
                spot de 10s pode custar mais do que uma vinheta de 4s.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {['4', '6', '8', '10'].map((duracao) => (
                  <div key={duracao}>
                    <label className={LABEL_CLASS}>{duracao} segundos</label>
                    <input
                      type="number"
                      min={0}
                      disabled={!canManage}
                      placeholder={String(custosGeracao.data?.video[duracao] ?? custosGeracao.data?.video['*'] ?? 0)}
                      value={custoVideoPorDuracao[duracao] ?? ''}
                      onChange={(e) =>
                        setCustoVideoPorDuracao((prev) => ({ ...prev, [duracao]: e.target.value }))
                      }
                      className={INPUT_CLASS}
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5">
                      actual:{' '}
                      {fmtNum(custosGeracao.data?.video[duracao] ?? custosGeracao.data?.video['*'] ?? 0)} créditos
                    </span>
                  </div>
                ))}
              </div>

              <span className="text-[10px] text-slate-500 block">
                Base (todas as durações):{' '}
                <strong className="text-slate-300">{fmtNum(custosGeracao.data?.video['*'] ?? 0)}</strong> créditos
                {Number(custosGeracao.data?.video['*'] ?? 0) === 0 ? ' (não cobra)' : ''}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 mt-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 px-3 py-2">
          <Info className="w-3.5 h-3.5 text-emerald-300 mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-300 leading-relaxed">
            O valor é aplicado pelo <strong>servidor</strong> no momento da cobrança (o browser não
            decide preços). Se a geração falhar, os créditos são devolvidos automaticamente.
          </p>
        </div>
      </Panel>

      {/* ─── MODELOS DE IMAGEM ──────────────────────────────────────────────── */}
      <Panel
        title="Modelos de imagem"
        subtitle={`${modelos.length} modelo(s) · ${totalPersonalizados} preço(s) por estilo definido(s)`}
        actions={
          canManage ? (
            <button
              type="button"
              onClick={guardar}
              disabled={aGravar}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00E5FF] hover:brightness-110 text-slate-950 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {aGravar ? 'A guardar…' : 'Guardar custos'}
            </button>
          ) : (
            <span className="text-[10px] text-slate-500">Apenas leitura</span>
          )
        }
      >
        {modelos.length === 0 ? (
          <EmptyState message="Nenhum modelo registado. O servidor cria o GPT Image 2 e o Nano Banana 2.1 automaticamente na primeira leitura." />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {modelos.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-white/[0.07] bg-[#080612] p-3 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
                    <span className="text-xs font-bold text-white truncate">{m.label}</span>
                    <StatusBadge status={m.active ? 'ACTIVE' : 'ARCHIVED'} />
                  </div>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => alternarAtivo(m)}
                      className="text-[10px] px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-300 cursor-pointer shrink-0"
                    >
                      {m.active ? 'Desactivar' : 'Activar'}
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-500 font-mono break-all">
                  id: {m.id} · API: {m.apiModel} · {m.provider}
                </p>
                {m.description && (
                  <p className="text-[10px] text-slate-400 leading-relaxed">{m.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className={LABEL_CLASS}>Custo base (créditos)</label>
                    <input
                      type="number"
                      min={0}
                      disabled={!canManage}
                      value={baseEdicoes[m.id] ?? String(m.defaultCost)}
                      onChange={(e) =>
                        setBaseEdicoes((prev) => ({ ...prev, [m.id]: e.target.value }))
                      }
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Preços por estilo</label>
                    <div className="text-xs font-mono text-slate-300 py-1.5">
                      {Object.keys(m.styleCosts || {}).length} definido(s)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Grelha estilo × modelo */}
      <Panel
        title="Custo por estilo"
        subtitle="Deixe vazio para usar o custo base do modelo. Os valores são em créditos por imagem gerada."
      >
        <div className="flex items-start gap-2 mb-3 rounded-xl bg-[#00E5FF]/[0.06] border border-[#00E5FF]/20 px-3 py-2">
          <Info className="w-3.5 h-3.5 text-[#00E5FF] mt-0.5 shrink-0" />
          <p className="text-[10px] text-slate-300 leading-relaxed">
            Esta grelha é aplicada pelo SERVIDOR no momento do débito — <strong>não</strong> pelo
            browser. Alterar aqui muda imediatamente o que é cobrado em cada geração, para todos os
            utilizadores.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-500">
                <th className="text-left font-mono py-2 pr-3 sticky left-0 bg-[#0C0A18]">Estilo / agente</th>
                {modelos.map((m) => (
                  <th key={m.id} className="text-left font-mono py-2 px-2 whitespace-nowrap">
                    {m.label}
                    <span className="block text-[9px] text-slate-600 normal-case">
                      base {fmtNum(custoBase(m))} créditos
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {estilos.map((estilo) => (
                <tr key={estilo.id} className="hover:bg-white/[0.02]">
                  <td className="py-2 pr-3 sticky left-0 bg-[#0C0A18]">
                    <div className="font-semibold text-slate-200">{estilo.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{estilo.id}</div>
                  </td>
                  {modelos.map((m) => {
                    const personalizado = m.styleCosts?.[estilo.id];
                    return (
                      <td key={m.id} className="py-2 px-2 align-top">
                        <input
                          type="number"
                          min={0}
                          disabled={!canManage}
                          placeholder={String(custoBase(m))}
                          value={
                            edicoes[chave(m.id, estilo.id)] ??
                            (personalizado !== undefined ? String(personalizado) : '')
                          }
                          onChange={(e) => alterar(m.id, estilo.id, e.target.value)}
                          className={`${INPUT_CLASS} w-24`}
                          title={
                            personalizado !== undefined
                              ? `Preço próprio: ${personalizado} créditos`
                              : `Usa o custo base do modelo (${custoBase(m)} créditos)`
                          }
                        />
                        <span className="block text-[9px] mt-0.5 text-slate-500">
                          cobra {fmtNum(custoEfetivo(m, estilo.id))}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
