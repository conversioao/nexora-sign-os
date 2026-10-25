/**
 * Pacotes de Créditos — CRUD dos pacotes que os clientes compram no Creative AI.
 *
 * O editor é um painel em linha, e não um modal: evita armadilhas de foco e
 * deixa o catálogo visível enquanto se edita, o que ajuda a comparar preços.
 *
 * A validação é feita no cliente ANTES de chamar a API — um nome vazio ou
 * créditos a zero nunca chegam ao servidor, e o erro aparece junto do campo.
 */
import React from 'react';
import { creativeAdminService } from '../services/creativeAdminService';
import { useAdminData } from '../hooks/useAdminData';
import { useSession } from '../../../context/SessionContext';
import { AdminCreditPackage, PackageInput } from '../types';
import {
  Panel,
  Loading,
  ErrorState,
  EmptyState,
  StatusBadge,
  fmtNum,
  fmtKz,
} from '../components/ui';
import { Package, Plus, Pencil, Archive, Check, Info, X, Clock, Star } from 'lucide-react';

/**
 * Estado do formulário. Tudo em texto (mesmo os números) para que um campo
 * possa ficar vazio enquanto se escreve, sem o React o forçar a 0.
 */
interface PackageFormState {
  id?: string;
  name: string;
  description: string;
  credits: string;
  priceKz: string;
  validityDays: string;
  benefits: string;
  popular: boolean;
  status: string;
  sortOrder: string;
}

const EMPTY_FORM: PackageFormState = {
  name: '',
  description: '',
  credits: '100',
  priceKz: '0',
  validityDays: '30',
  benefits: '',
  popular: false,
  status: 'ACTIVE',
  sortOrder: '0',
};

const formFromPackage = (pkg: AdminCreditPackage): PackageFormState => ({
  id: pkg.id,
  name: pkg.name || '',
  description: pkg.description || '',
  credits: String(pkg.credits ?? ''),
  priceKz: String(pkg.priceKz ?? ''),
  validityDays: String(pkg.validityDays ?? ''),
  benefits: (pkg.benefits || []).join('\n'),
  popular: !!pkg.popular,
  status: pkg.status || 'ACTIVE',
  sortOrder: String(pkg.sortOrder ?? 0),
});

const LABEL_CLASS = 'block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1';

export interface CreativeAdminPackagesPageProps {
  canManage: boolean;
}

export const CreativeAdminPackagesPage: React.FC<CreativeAdminPackagesPageProps> = ({ canManage }) => {
  const { currentUser } = useSession();
  const packages = useAdminData(() => creativeAdminService.getPackages(true), []);

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [form, setForm] = React.useState<PackageFormState>(EMPTY_FORM);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  // Quem assina a operação no livro-razão do servidor (`x-nexora-actor`).
  const actor = currentUser?.name || 'Admin';

  const list = packages.data || [];

  // ─── Editor ────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError(null);
    setSuccess(null);
    setEditorOpen(true);
  };

  const openEdit = (pkg: AdminCreditPackage) => {
    setForm(formFromPackage(pkg));
    setErrors({});
    setFormError(null);
    setSuccess(null);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setErrors({});
    setFormError(null);
  };

  const setField = (field: keyof PackageFormState, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Limpa o erro do campo assim que o utilizador o corrige.
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /** Validação no cliente. Devolve `false` sem tocar na API quando há erros. */
  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = 'Indique o nome do pacote.';

    const credits = Number(form.credits);
    if (form.credits.trim() === '' || !Number.isFinite(credits) || credits <= 0) {
      next.credits = 'Os créditos têm de ser um número maior que zero.';
    }

    const price = Number(form.priceKz);
    if (form.priceKz.trim() === '' || !Number.isFinite(price) || price < 0) {
      next.priceKz = 'O preço tem de ser um número igual ou superior a zero.';
    }

    const validity = Number(form.validityDays);
    if (form.validityDays.trim() === '' || !Number.isFinite(validity) || validity < 0) {
      next.validityDays = 'A validade tem de ser um número de dias igual ou superior a zero.';
    }

    const order = Number(form.sortOrder);
    if (form.sortOrder.trim() !== '' && !Number.isFinite(order)) {
      next.sortOrder = 'A ordem tem de ser um número.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(null);
    setFormError(null);

    if (!validate()) return;

    const input: PackageInput = {
      id: form.id,
      name: form.name.trim(),
      description: form.description.trim(),
      credits: Number(form.credits),
      priceKz: Number(form.priceKz),
      validityDays: Number(form.validityDays),
      benefits: form.benefits
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean),
      popular: form.popular,
      status: form.status,
      sortOrder: Number(form.sortOrder) || 0,
    };
    // Um pacote novo não deve levar `id` — o servidor é que o atribui.
    if (!input.id) delete input.id;

    setSaving(true);
    try {
      await creativeAdminService.savePackage(input, actor);
      setSuccess(
        form.id ? `Pacote «${input.name}» atualizado com sucesso.` : `Pacote «${input.name}» criado com sucesso.`
      );
      setEditorOpen(false);
      setForm(EMPTY_FORM);
      setErrors({});
      packages.reload();
    } catch (err: any) {
      setFormError(err?.message || 'Não foi possível guardar o pacote.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Arquivo ───────────────────────────────────────────────────────────────
  const handleArchive = async (pkg: AdminCreditPackage) => {
    const confirmed = window.confirm(
      `Arquivar o pacote «${pkg.name}»?\n\n` +
        'O pacote deixa de aparecer aos clientes e não pode ser comprado, mas mantém-se no histórico: ' +
        'as compras e os pedidos já registados não são apagados. Pode voltar a activá-lo editando-o mais tarde.'
    );
    if (!confirmed) return;

    setSuccess(null);
    setActionError(null);
    setBusyId(pkg.id);
    try {
      await creativeAdminService.archivePackage(pkg.id, actor);
      setSuccess(`Pacote «${pkg.name}» arquivado.`);
      packages.reload();
    } catch (err: any) {
      setActionError(err?.message || 'Não foi possível arquivar o pacote.');
    } finally {
      setBusyId(null);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-[#050914] border rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
      errors[field]
        ? 'border-rose-500/50 focus:border-rose-400'
        : 'border-white/[0.08] focus:border-[#7C3AED]/60'
    }`;

  return (
    <div className="space-y-5">
      {/* ─── Aviso de leitura ────────────────────────────────────────────── */}
      {!canManage && (
        <div className="flex items-start gap-2.5 rounded-2xl bg-[#7C3AED]/[0.07] border border-[#7C3AED]/25 p-3">
          <Info className="w-4 h-4 text-[#C084FC] shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Está em <strong className="text-white">modo de leitura</strong>: a sua conta não tem permissão
            para criar, editar ou arquivar pacotes. Os valores abaixo são apenas informativos.
          </p>
        </div>
      )}

      {/* ─── Faixa de sucesso / erro da última operação ──────────────────── */}
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/[0.1] border border-emerald-500/30 px-3 py-2">
          <Check className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <p className="text-[11px] text-emerald-200 flex-1">{success}</p>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className="text-emerald-300/70 hover:text-emerald-200 cursor-pointer shrink-0"
            title="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-500/[0.1] border border-rose-500/30 px-3 py-2">
          <Info className="w-3.5 h-3.5 text-rose-300 shrink-0" />
          <p className="text-[11px] text-rose-200 flex-1">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-rose-300/70 hover:text-rose-200 cursor-pointer shrink-0"
            title="Fechar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ─── Editor em linha (acima da grelha) ───────────────────────────── */}
      {canManage && editorOpen && (
        <Panel
          title={form.id ? 'Editar pacote' : 'Novo pacote'}
          subtitle="Os campos são validados antes de guardar. Um benefício por linha."
          actions={
            <button
              type="button"
              onClick={closeEditor}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer"
              title="Fechar editor"
            >
              <X className="w-3 h-3" /> Fechar
            </button>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Nome */}
              <div className="lg:col-span-2">
                <label className={LABEL_CLASS} htmlFor="pkg-name">
                  Nome
                </label>
                <input
                  id="pkg-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Ex.: Pacote Criador"
                  className={inputClass('name')}
                />
                {errors.name && <p className="text-[10px] text-rose-400 mt-1">{errors.name}</p>}
              </div>

              {/* Estado */}
              <div>
                <label className={LABEL_CLASS} htmlFor="pkg-status">
                  Estado
                </label>
                <select
                  id="pkg-status"
                  value={form.status}
                  onChange={(e) => setField('status', e.target.value)}
                  className={`${inputClass('status')} cursor-pointer`}
                >
                  <option value="ACTIVE">ACTIVE — visível aos clientes</option>
                  <option value="INACTIVE">INACTIVE — oculto</option>
                </select>
              </div>

              {/* Descrição */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={LABEL_CLASS} htmlFor="pkg-description">
                  Descrição
                </label>
                <input
                  id="pkg-description"
                  type="text"
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  placeholder="Ex.: Para equipas que produzem todos os dias"
                  className={inputClass('description')}
                />
              </div>

              {/* Créditos */}
              <div>
                <label className={LABEL_CLASS} htmlFor="pkg-credits">
                  Créditos
                </label>
                <input
                  id="pkg-credits"
                  type="number"
                  min="1"
                  step="1"
                  value={form.credits}
                  onChange={(e) => setField('credits', e.target.value)}
                  className={inputClass('credits')}
                />
                {errors.credits && <p className="text-[10px] text-rose-400 mt-1">{errors.credits}</p>}
              </div>

              {/* Preço */}
              <div>
                <label className={LABEL_CLASS} htmlFor="pkg-price">
                  Preço Kz
                </label>
                <input
                  id="pkg-price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.priceKz}
                  onChange={(e) => setField('priceKz', e.target.value)}
                  className={inputClass('priceKz')}
                />
                {errors.priceKz && <p className="text-[10px] text-rose-400 mt-1">{errors.priceKz}</p>}
              </div>

              {/* Validade */}
              <div>
                <label className={LABEL_CLASS} htmlFor="pkg-validity">
                  Validade em dias
                </label>
                <input
                  id="pkg-validity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.validityDays}
                  onChange={(e) => setField('validityDays', e.target.value)}
                  className={inputClass('validityDays')}
                />
                {errors.validityDays && (
                  <p className="text-[10px] text-rose-400 mt-1">{errors.validityDays}</p>
                )}
              </div>

              {/* Ordem */}
              <div>
                <label className={LABEL_CLASS} htmlFor="pkg-order">
                  Ordem
                </label>
                <input
                  id="pkg-order"
                  type="number"
                  step="1"
                  value={form.sortOrder}
                  onChange={(e) => setField('sortOrder', e.target.value)}
                  className={inputClass('sortOrder')}
                />
                {errors.sortOrder && <p className="text-[10px] text-rose-400 mt-1">{errors.sortOrder}</p>}
              </div>

              {/* Popular */}
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.popular}
                    onChange={(e) => setField('popular', e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-[#050914] accent-[#7C3AED] cursor-pointer"
                  />
                  <span className="text-xs text-slate-300">Destacar como popular</span>
                </label>
              </div>

              {/* Benefícios */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={LABEL_CLASS} htmlFor="pkg-benefits">
                  Benefícios (um por linha)
                </label>
                <textarea
                  id="pkg-benefits"
                  rows={4}
                  value={form.benefits}
                  onChange={(e) => setField('benefits', e.target.value)}
                  placeholder={'Ex.:\n100 gerações de imagem\nAcesso aos modelos avançados'}
                  className={`${inputClass('benefits')} resize-y font-sans`}
                />
              </div>
            </div>

            {formError && (
              <p className="text-[11px] text-rose-300 bg-rose-500/[0.08] border border-rose-500/25 rounded-xl px-3 py-2">
                {formError}
              </p>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-3.5 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#7C3AED]/85 text-[11px] font-bold text-white cursor-pointer disabled:opacity-60"
              >
                {saving ? 'A guardar…' : form.id ? 'Guardar alterações' : 'Criar pacote'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {/* ─── Catálogo ────────────────────────────────────────────────────── */}
      <Panel
        title="Catálogo de pacotes"
        subtitle={
          packages.loading || packages.error
            ? 'Inclui pacotes inativos e arquivados'
            : `${fmtNum(list.length)} pacote(s) · inclui inativos e arquivados`
        }
        actions={
          canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7C3AED] hover:bg-[#7C3AED]/85 text-[11px] font-bold text-white cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Novo pacote
            </button>
          )
        }
      >
        {packages.loading ? (
          <Loading label="A carregar pacotes de créditos…" />
        ) : packages.error ? (
          <ErrorState message={packages.error} onRetry={packages.reload} />
        ) : list.length === 0 ? (
          <EmptyState message="Ainda não há pacotes de créditos. Crie o primeiro pacote para que os clientes possam recarregar." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {list.map((pkg) => {
              const perCredit = pkg.credits > 0 ? Math.round(pkg.priceKz / pkg.credits) : null;
              const archived = pkg.status !== 'ACTIVE';
              return (
                <div
                  key={pkg.id}
                  className={`rounded-2xl bg-[#050914] border p-4 flex flex-col gap-3 transition-colors ${
                    archived
                      ? 'border-white/[0.05] opacity-80'
                      : 'border-white/[0.07] hover:border-[#7C3AED]/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-bold text-white truncate">{pkg.name}</h3>
                        {pkg.popular && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40">
                            <Star className="w-2.5 h-2.5" /> POPULAR
                          </span>
                        )}
                      </div>
                      {pkg.description && (
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{pkg.description}</p>
                      )}
                    </div>
                    <StatusBadge status={pkg.status} />
                  </div>

                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="text-xl font-extrabold text-white font-mono tracking-tight">
                        {fmtNum(pkg.credits)}
                      </p>
                      <p className="text-[10px] text-slate-500">créditos</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#C084FC] font-mono">{fmtKz(pkg.priceKz)}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {perCredit === null ? '— por crédito' : `${fmtNum(perCredit)} Kz por crédito`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {fmtNum(pkg.validityDays)} dias
                    </span>
                    <span>ordem {fmtNum(pkg.sortOrder)}</span>
                  </div>

                  {pkg.benefits && pkg.benefits.length > 0 && (
                    <ul className="space-y-1 pt-2.5 border-t border-white/[0.06]">
                      {pkg.benefits.map((benefit, i) => (
                        <li
                          key={`${pkg.id}-benefit-${i}`}
                          className="flex items-start gap-1.5 text-[11px] text-slate-300"
                        >
                          <Check className="w-3 h-3 text-[#22D3EE] shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {canManage && (
                    <div className="flex items-center gap-2 pt-2.5 mt-auto border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => openEdit(pkg)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[10px] font-semibold text-slate-200 cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      {!archived && (
                        <button
                          type="button"
                          onClick={() => handleArchive(pkg)}
                          disabled={busyId === pkg.id}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-rose-500/[0.12] border border-white/10 hover:border-rose-500/30 text-[10px] font-semibold text-slate-400 hover:text-rose-200 cursor-pointer disabled:opacity-60"
                        >
                          <Archive className="w-3 h-3" />
                          {busyId === pkg.id ? 'A arquivar…' : 'Arquivar'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canManage && !packages.loading && !packages.error && (
          <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
            <Package className="w-3 h-3 inline-block mr-1 -mt-0.5 text-[#C084FC]" />
            Os pacotes arquivados mantêm-se no histórico para auditoria, mas deixam de aparecer aos clientes.
          </p>
        )}
      </Panel>
    </div>
  );
};
