/**
 * RootAccessPage — criação e gestão de administradores da plataforma.
 *
 * ⚠️ ESTA PÁGINA NÃO ESTÁ NA NAVEGAÇÃO, DE PROPÓSITO.
 *
 * O acesso faz-se apenas por rota directa (`root-access`). Mas isso é
 * conveniência, NÃO segurança: esconder uma rota num SPA não protege nada, já
 * que o código vai no bundle e qualquer pessoa pode escrever o endereço.
 *
 * A protecção real está no servidor: cada pedido leva o cabeçalho
 * `x-nexora-admin-key`, comparado com `NEXORA_ADMIN_KEY` (variável de ambiente
 * que nunca chega ao browser). Sem a chave correcta, o servidor recusa — mesmo
 * que alguém encontre esta página.
 */
import React from 'react';
import { useSession } from '../../../context/SessionContext';
import { ROLES_REGISTRY, ROLE_LABELS } from '../../../services/permissionService';
import { getAdminScopes, ADMIN_SCOPE_DEFINITIONS } from '../../../services/adminScopeService';
import { Permission, Role } from '../../../types/auth';
import {
  adminUserService,
  fetchOrganizations,
  generateStrongPassword,
  getAdminKey,
  setAdminKey,
  clearAdminKey,
  AdminUserRow,
} from '../services/adminUserService';
import {
  ShieldCheck,
  ShieldOff,
  KeyRound,
  Plus,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Lock,
  UserPlus,
  Building2,
} from 'lucide-react';

const PLATFORM_ADMIN_ROLES = ['NEXORA_ADMIN', 'NEXORA_OPERATOR'];

export const RootAccessPage: React.FC<{ onLeave?: () => void }> = ({ onLeave }) => {
  const { currentUser } = useSession();

  const [keyInput, setKeyInput] = React.useState('');
  const [unlocked, setUnlocked] = React.useState(() => Boolean(getAdminKey()));
  const [revealKey, setRevealKey] = React.useState(false);

  const [users, setUsers] = React.useState<AdminUserRow[]>([]);
  const [orgs, setOrgs] = React.useState<{ id: string; name: string; type: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [flash, setFlash] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = React.useState<{ email: string; password: string } | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Formulário de criação
  const [email, setEmail] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [role, setRole] = React.useState<string>('NEXORA_OPERATOR');
  const [organizationId, setOrganizationId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPlatformAdmin, setConfirmPlatformAdmin] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, organizations] = await Promise.all([
        adminUserService.list(),
        fetchOrganizations(),
      ]);
      setUsers(list);
      setOrgs(organizations);
      setOrganizationId((prev) => prev || organizations[0]?.id || '');
      setUnlocked(true);
    } catch (err: any) {
      setError(err?.message || 'Falha ao carregar os utilizadores.');
      setUnlocked(false);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (getAdminKey()) load();
  }, [load]);

  const unlock = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminKey(keyInput.trim());
    setKeyInput('');
    load();
  };

  const lock = () => {
    clearAdminKey();
    setUnlocked(false);
    setUsers([]);
    setError(null);
    setFlash(null);
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFlash(null);

    // Validação local: dá resposta imediata sem gastar um pedido ao servidor
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Indique um email válido.');
      return;
    }
    if (fullName.trim().length < 3) {
      setError('Indique o nome completo.');
      return;
    }
    if (!organizationId) {
      setError('Escolha a organização.');
      return;
    }
    if (password.length < 8) {
      setError('A password deve ter pelo menos 8 caracteres.');
      return;
    }
    if (PLATFORM_ADMIN_ROLES.includes(role) && !confirmPlatformAdmin) {
      setError(
        `O papel ${ROLE_LABELS[role as Role] || role} concede administração de plataforma. ` +
          'Marque a confirmação para continuar.'
      );
      return;
    }

    setLoading(true);
    try {
      const created = await adminUserService.create({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        role,
        organizationId,
        password,
        confirmPlatformAdmin,
      });
      setCreatedPassword({ email: created.email, password });
      setFlash(`Administrador ${created.email} criado com o papel ${ROLE_LABELS[created.role as Role] || created.role}.`);
      setEmail('');
      setFullName('');
      setPassword('');
      setConfirmPlatformAdmin(false);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Falha ao criar o utilizador.');
    } finally {
      setLoading(false);
    }
  };

  const changeRole = async (user: AdminUserRow, newRole: string) => {
    const promoting = PLATFORM_ADMIN_ROLES.includes(newRole) && !PLATFORM_ADMIN_ROLES.includes(String(user.role));
    if (promoting) {
      const ok = window.confirm(
        `Promover ${user.email} para ${ROLE_LABELS[newRole as Role] || newRole}?\n\n` +
          'Este papel concede administração de plataforma, incluindo acesso a esta própria página.'
      );
      if (!ok) return;
    }
    setBusyId(user.id);
    setError(null);
    try {
      await adminUserService.update(user.id, { role: newRole, confirmPlatformAdmin: true });
      setFlash(`Papel de ${user.email} alterado para ${ROLE_LABELS[newRole as Role] || newRole}.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Falha ao alterar o papel.');
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (user: AdminUserRow) => {
    const ok = window.confirm(
      `Remover definitivamente ${user.email}?\n\nO utilizador perde imediatamente o acesso à plataforma.`
    );
    if (!ok) return;
    setBusyId(user.id);
    setError(null);
    try {
      await adminUserService.remove(user.id);
      setFlash(`Utilizador ${user.email} removido.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Falha ao remover o utilizador.');
    } finally {
      setBusyId(null);
    }
  };

  const resetPassword = async (user: AdminUserRow) => {
    const newPassword = generateStrongPassword();
    const ok = window.confirm(
      `Redefinir a password de ${user.email}?\n\n` +
        'A nova password é gerada e mostrada uma única vez. O utilizador deve alterá-la depois.'
    );
    if (!ok) return;
    setBusyId(user.id);
    setError(null);
    try {
      await adminUserService.update(user.id, { password: newPassword });
      setCreatedPassword({ email: user.email, password: newPassword });
      setFlash(`Password de ${user.email} redefinida.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Falha ao redefinir a password.');
    } finally {
      setBusyId(null);
    }
  };

  const copyPassword = () => {
    if (!createdPassword) return;
    navigator.clipboard?.writeText(createdPassword.password).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => {}
    );
  };

  const selectedRoleDef = ROLES_REGISTRY[role as Role];
  const selectedScopes = selectedRoleDef ? getAdminScopes(selectedRoleDef.permissions as Permission[]) : [];

  // ─── Ecrã de desbloqueio ───────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <form
          onSubmit={unlock}
          className="max-w-md w-full p-6 rounded-2xl bg-[#0B1120] border border-white/10 space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#60A5FA]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">Acesso Restrito</h1>
              <p className="text-[11px] text-slate-400">Gestão de administradores da plataforma</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Introduza a chave de administração definida no servidor (
            <code className="text-cyan-400 font-mono">NEXORA_ADMIN_KEY</code>). Sem ela, o servidor
            recusa qualquer operação — a chave não existe no código do site.
          </p>

          <div className="relative">
            <input
              type={revealKey ? 'text' : 'password'}
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              autoFocus
              placeholder="Chave de administração"
              className="w-full bg-[#070512] border border-white/10 focus:border-[#2563EB] rounded-lg px-3 py-2.5 pr-10 text-sm text-white font-mono focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setRevealKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              title={revealKey ? 'Ocultar' : 'Mostrar'}
            >
              {revealKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 px-3 py-2.5 text-[11px] text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !keyInput.trim()}
              className="flex-1 px-3 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {loading ? 'A validar…' : 'Desbloquear'}
            </button>
            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="px-3 py-2.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Sair
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // ─── Consola ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#60A5FA]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white font-display">
              Administradores da Plataforma
            </h1>
            <p className="text-[11px] text-slate-400">
              Criação de contas e atribuição de níveis de acesso. Sessão iniciada como{' '}
              <span className="text-slate-300">{currentUser?.name || '—'}</span>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Recarregar
          </button>
          <button
            type="button"
            onClick={lock}
            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-semibold text-rose-300 cursor-pointer flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" /> Bloquear
          </button>
        </div>
      </div>

      {flash && (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2.5 text-[11px] text-emerald-200">
          {flash}
        </div>
      )}
      {error && (
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-3.5 py-2.5 text-[11px] text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* ─── Password gerada (mostrada uma única vez) ────────────────────── */}
      {createdPassword && (
        <div className="rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold text-amber-200">
              Password de {createdPassword.email} — visível apenas agora
            </span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-[#070512] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white break-all">
              {createdPassword.password}
            </code>
            <button
              type="button"
              onClick={copyPassword}
              className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="text-[10px] text-amber-200/70 leading-relaxed">
            Entregue esta password por um canal seguro. Ela não volta a ser mostrada — o servidor
            guarda apenas o hash scrypt.
          </p>
        </div>
      )}

      {/* ─── Criar administrador ─────────────────────────────────────────── */}
      <section className="rounded-2xl bg-[#0B1120] border border-white/[0.07] overflow-hidden">
        <header className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#60A5FA]" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Criar utilizador com acesso à plataforma
          </h2>
        </header>

        <form onSubmit={submitCreate} className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="novo.admin@nexora.ao"
                className="w-full bg-[#070512] border border-white/10 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Nome completo *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Ana Fernandes"
                className="w-full bg-[#070512] border border-white/10 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Nível de acesso (papel) *
              </label>
              <select
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setConfirmPlatformAdmin(false);
                }}
                className="w-full bg-[#070512] border border-white/10 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white focus:outline-none cursor-pointer"
              >
                {Object.values(ROLES_REGISTRY).map((rd) => (
                  <option key={rd.id} value={rd.id}>
                    {rd.name}
                    {PLATFORM_ADMIN_ROLES.includes(rd.id) ? ' — ADMINISTRAÇÃO' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Organização *
              </label>
              <select
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                className="w-full bg-[#070512] border border-white/10 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white focus:outline-none cursor-pointer"
              >
                {orgs.length === 0 && <option value="">(nenhuma organização encontrada)</option>}
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                Password inicial * (mínimo 8 caracteres)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Defina ou gere uma password forte"
                  className="flex-1 bg-[#070512] border border-white/10 focus:border-[#2563EB] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPassword(generateStrongPassword())}
                  className="px-3 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
                >
                  Gerar forte
                </button>
              </div>
            </div>
          </div>

          {/* Pré-visualização do que o papel concede */}
          {selectedRoleDef && (
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.07] p-3 space-y-2">
              <p className="text-[11px] text-slate-400 leading-relaxed">{selectedRoleDef.description}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  Painéis de admin:
                </span>
                {selectedScopes.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-500">
                    <ShieldOff className="w-2.5 h-2.5" /> nenhum
                  </span>
                ) : (
                  selectedScopes.map((scope) => {
                    const def = ADMIN_SCOPE_DEFINITIONS[scope];
                    return (
                      <span
                        key={scope}
                        className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${def.badgeColor}`}
                      >
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {def.shortLabel}
                      </span>
                    );
                  })
                )}
                <span className="text-[10px] text-slate-500 font-mono ml-2">
                  {selectedRoleDef.permissions.length} permissões
                </span>
              </div>
            </div>
          )}

          {PLATFORM_ADMIN_ROLES.includes(role) && (
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/25 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmPlatformAdmin}
                onChange={(e) => setConfirmPlatformAdmin(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
              />
              <span className="text-[11px] text-amber-200 leading-relaxed">
                Confirmo que quero criar um <strong>administrador de plataforma</strong>. Este nível
                concede acesso global, incluindo a esta página de gestão de acessos.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-xs font-bold text-white cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            {loading ? 'A criar…' : 'Criar utilizador'}
          </button>
        </form>
      </section>

      {/* ─── Utilizadores existentes ─────────────────────────────────────── */}
      <section className="rounded-2xl bg-[#0B1120] border border-white/[0.07] overflow-hidden">
        <header className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#60A5FA]" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Utilizadores ({users.length})
            </h2>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            {users.filter((u) => PLATFORM_ADMIN_ROLES.includes(String(u.role))).length} com administração
          </span>
        </header>

        {loading && users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">A carregar…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">Sem utilizadores.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Utilizador', 'Organização', 'Nível de acesso', 'Password', 'Criado', 'Ações'].map(
                    (h, i) => (
                      <th
                        key={h}
                        className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/[0.06] whitespace-nowrap ${
                          i === 5 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isPlatformAdmin = PLATFORM_ADMIN_ROLES.includes(String(u.role));
                  const roleDef = ROLES_REGISTRY[u.role as Role];
                  const scopes = roleDef ? getAdminScopes(roleDef.permissions as Permission[]) : [];
                  const isSelf = u.id === currentUser?.id;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02]">
                      <td className="px-3 py-2.5 border-b border-white/[0.04]">
                        <p className="text-xs font-semibold text-white">{u.fullName}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {u.email}
                          {isSelf && <span className="text-[#60A5FA]"> · você</span>}
                        </p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-300 border-b border-white/[0.04]">
                        {u.organizationName || u.organizationId}
                      </td>
                      <td className="px-3 py-2.5 border-b border-white/[0.04]">
                        <select
                          value={String(u.role)}
                          onChange={(e) => changeRole(u, e.target.value)}
                          disabled={busyId === u.id}
                          className={`text-[10px] font-semibold px-2 py-1 rounded-lg border bg-[#070512] cursor-pointer outline-none disabled:opacity-50 ${
                            roleDef?.badgeColor || 'border-white/10 text-slate-300'
                          }`}
                        >
                          {Object.values(ROLES_REGISTRY).map((rd) => (
                            <option key={rd.id} value={rd.id}>
                              {rd.name}
                            </option>
                          ))}
                        </select>
                        <div className="flex flex-wrap items-center gap-1 mt-1.5">
                          {scopes.length === 0 ? (
                            <span className="text-[9px] font-mono text-slate-600 flex items-center gap-1">
                              <ShieldOff className="w-2.5 h-2.5" /> sem admin
                            </span>
                          ) : (
                            scopes.map((s) => {
                              const def = ADMIN_SCOPE_DEFINITIONS[s];
                              return (
                                <span
                                  key={s}
                                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${def.badgeColor}`}
                                >
                                  {def.shortLabel}
                                </span>
                              );
                            })
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-white/[0.04]">
                        {u.passwordIsHashed ? (
                          <span className="text-[10px] font-mono text-emerald-300">scrypt</span>
                        ) : u.hasPassword ? (
                          <span
                            className="text-[10px] font-mono text-amber-300 cursor-help"
                            title="Password guardada em texto simples (conta anterior ao hashing). Use «Redefinir» para a migrar."
                          >
                            texto simples
                          </span>
                        ) : (
                          <span
                            className="text-[10px] font-mono text-rose-300 cursor-help"
                            title="Sem password definida: qualquer password autentica esta conta (conta semeada de demonstração)."
                          >
                            sem password
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-[10px] text-slate-500 font-mono border-b border-white/[0.04] whitespace-nowrap">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-PT') : '—'}
                      </td>
                      <td className="px-3 py-2.5 border-b border-white/[0.04] text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => resetPassword(u)}
                            disabled={busyId === u.id}
                            className="px-2 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[10px] font-semibold text-slate-200 cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            title="Gerar nova password"
                          >
                            <KeyRound className="w-3 h-3" /> Redefinir
                          </button>
                          <button
                            type="button"
                            onClick={() => removeUser(u)}
                            disabled={busyId === u.id || isSelf}
                            className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 cursor-pointer disabled:opacity-30"
                            title={isSelf ? 'Não pode remover a sua própria conta' : 'Remover utilizador'}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] px-3.5 py-3 text-[11px] text-slate-400 leading-relaxed space-y-1.5">
        <p className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-300" />
          <span>
            Esta página não aparece na navegação. Ainda assim, esconder uma rota não é segurança: o
            que impede a criação de administradores por terceiros é a chave do servidor, verificada
            em cada pedido.
          </span>
        </p>
        <p>
          Contas marcadas como <span className="font-mono text-amber-300">texto simples</span> ou{' '}
          <span className="font-mono text-rose-300">sem password</span> são anteriores ao hashing.
          Recomenda-se usar <strong>Redefinir</strong> para as migrar para scrypt, e desactivar o
          login de demonstração antes de colocar isto em produção.
        </p>
      </div>
    </div>
  );
};
