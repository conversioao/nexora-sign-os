/**
 * UserManagementPage — criação de CONTAS REAIS e atribuição de NÍVEIS DE ACESSO.
 *
 * Duas mudanças de conceito em relação à versão anterior:
 *
 *   1. Deixou de existir um pedido de adesão por aceitar. Criar uma conta aqui
 *      cria MESMO a conta: o administrador define a password inicial, o servidor
 *      guarda-a com hash e o titular entra de imediato.
 *      (O servidor marca a conta com `must_change_password`, por isso a troca
 *      da password é pedida no primeiro início de sessão.)
 *   2. Deixou de se escolher um "papel" fixo do código. Escolhe-se um NÍVEL DE
 *      ACESSO: um nome + um conjunto de GRUPOS de funcionalidades, catálogo
 *      partilhado em `lib/accessLevels.ts`. É isto que permite, por exemplo,
 *      uma conta que só tem a Gestão de Negócios do Nexora Sign ou uma que só
 *      tem o painel de administração do Creative AI. As permissões são
 *      resolvidas pelo SERVIDOR a partir do nível, no momento do login.
 *
 * A API (`adminUserService`) é protegida NO SERVIDOR pelo cabeçalho
 * `x-nexora-admin-key`. Por isso a página tem DUAS guardas independentes:
 *
 *   1. permissão de sessão `users.manage` → decide o que se pode FAZER
 *      (criar conta, mudar nível, redefinir password, remover);
 *   2. chave de administração → decide o que se pode LER/ESCREVER na API.
 *
 * Esconder controlos no cliente não é segurança: quem manda é a chave, que o
 * servidor verifica em cada pedido. Sem chave guardada nem sequer se pede a
 * lista — mostra-se o ecrã de desbloqueio.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  ShieldOff,
  ShieldAlert,
  Mail,
  CheckCircle2,
  Clock,
  Trash2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Building2,
  Layers,
  X,
} from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { Role, Permission, OrganizationType } from '../../../types/auth';
import {
  ROLE_LABELS,
  ROLES_REGISTRY,
  ORGANIZATION_TYPE_LABELS,
} from '../../../services/permissionService';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { useToast } from '../../../components/ui/Toast';
import {
  adminUserService,
  fetchOrganizations,
  generateStrongPassword,
  getAdminKey,
  setAdminKey,
  clearAdminKey,
  AdminUserRow,
} from '../../root-access/services/adminUserService';
import {
  ACCESS_GROUPS,
  PANEL_LABELS,
  permissionsForGroups,
  permissionsForBuiltInLevel,
  BUILT_IN_ACCESS_LEVELS,
  AccessGroup,
} from '../../../lib/accessLevels';

/** Papéis antigos que ainda concedem administração de plataforma. */
const PLATFORM_ADMIN_ROLES = ['NEXORA_ADMIN', 'NEXORA_OPERATOR'];

// ─── Níveis de acesso ────────────────────────────────────────────────────────

/**
 * Forma de um nível tal como é usado nesta página.
 *
 * Vem de `GET /api/access-levels`; `permissions`/`permissionCount` são
 * opcionais porque também construímos níveis a partir do catálogo local
 * (`BUILT_IN_ACCESS_LEVELS`), que não os traz.
 */
type AccessLevelOption = {
  id: string;
  name: string;
  description: string;
  groups: string[];
  isSystem: boolean;
  userCount?: number;
  permissionCount: number;
  permissions?: Permission[];
  /** 'ACTIVE' | 'ARCHIVED' — os arquivados não devem ser atribuídos. */
  status?: string;
};

/** Índice local dos grupos: evita repetir `find` em cada render. */
const GROUP_BY_ID: Record<string, AccessGroup> = Object.fromEntries(
  ACCESS_GROUPS.map((g) => [g.id, g])
);

/** Painéis concedidos por um conjunto de grupos (ordem do catálogo, sem repetições). */
const panelsOfGroups = (groupIds: string[]): AccessGroup['panel'][] => {
  const panels: AccessGroup['panel'][] = [];
  (groupIds || []).forEach((id) => {
    const panel = GROUP_BY_ID[id]?.panel;
    if (panel && !panels.includes(panel)) panels.push(panel);
  });
  return panels;
};

/** Cores por painel — a mesma linguagem visual nas etiquetas e na pré-visualização. */
const PANEL_BADGE_CLASS: Record<AccessGroup['panel'], string> = {
  SIGN: 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/30',
  CREATIVE_AI: 'bg-[#7C3AED]/15 text-[#C084FC] border-[#7C3AED]/30',
  PLATFORM: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
};

/**
 * Um nível concede administração da plataforma quando inclui o grupo
 * `platform.root`. É o mesmo critério que o servidor usa (a permissão
 * `platform.admin` pertence a esse grupo), por isso a UI não pode discordar
 * dele — e é este o sinal que obriga à confirmação explícita.
 */
const grantsPlatformAdmin = (level?: AccessLevelOption | null): boolean =>
  Boolean(level?.groups?.includes('platform.root'));

/** Permissões efectivas de um nível, mesmo quando o servidor não as devolve. */
const permissionsOfLevel = (level: AccessLevelOption): Permission[] =>
  Array.isArray(level.permissions) && level.permissions.length > 0
    ? level.permissions
    : permissionsForGroups(level.groups);

/** Contagem de permissões a mostrar ao administrador. */
const permissionCountOf = (level: AccessLevelOption): number =>
  typeof level.permissionCount === 'number' && level.permissionCount > 0
    ? level.permissionCount
    : permissionsOfLevel(level).length;

/**
 * Níveis a partir do catálogo LOCAL (`accessLevels.ts`).
 *
 * Serve de rede de segurança: se `GET /api/access-levels` falhar (servidor
 * em baixo, chave ainda por validar), o ecrã continua utilizável em vez de
 * ficar sem forma de criar contas. O servidor resolve estes níveis
 * pré-definidos na mesma, mesmo que a tabela `access_levels` não esteja semeada.
 */
const builtInLevelOptions = (): AccessLevelOption[] =>
  BUILT_IN_ACCESS_LEVELS.map((lvl) => {
    const permissions = permissionsForBuiltInLevel(lvl.id) || [];
    return {
      id: lvl.id,
      name: lvl.name,
      description: lvl.description,
      groups: lvl.groups,
      isSystem: lvl.isSystem,
      permissionCount: permissions.length,
      permissions,
    };
  });

/**
 * Etiquetas dos painéis concedidos por um nível.
 * Usadas em três sítios (cartão do nível, pré-visualização e linha da tabela),
 * por isso vivem num componente próprio em vez de JSX repetido.
 */
const PanelBadges: React.FC<{ panels: AccessGroup['panel'][] }> = ({ panels }) => (
  <>
    {panels.map((p) => (
      <span
        key={p}
        className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${PANEL_BADGE_CLASS[p]}`}
      >
        <ShieldCheck className="w-2.5 h-2.5" />
        {PANEL_LABELS[p]}
      </span>
    ))}
  </>
);

/**
 * Estado mostrado na coluna «Estado».
 *
 * A API NÃO devolve um estado de conta (a tabela `users` não tem essa coluna):
 * devolve apenas se a conta tem password e se essa password já está hasheada.
 * Derivamos o estado daí, em vez de inventar um estado que o servidor não
 * conhece — e é também este valor que alimenta o filtro de estado.
 */
type DerivedStatus = 'ACTIVE' | 'PENDING_PASSWORD' | 'LEGACY';

const getDerivedStatus = (user: AdminUserRow): DerivedStatus => {
  if (!user.hasPassword) return 'PENDING_PASSWORD'; // ainda sem password utilizável
  if (!user.passwordIsHashed) return 'LEGACY'; // conta anterior ao hashing (texto simples)
  return 'ACTIVE';
};

export const UserManagementPage: React.FC = () => {
  const { currentUser, currentOrganization, hasPermission } = useSession();
  const { showToast } = useToast();

  const canManage = hasPermission('users.manage');
  // Guardamos só o id da organização: o objecto do contexto muda de identidade
  // e faria o `useCallback` de carregamento (e o efeito) repetir-se sem motivo.
  const currentOrganizationId = currentOrganization?.id || '';

  // ─── Chave de administração ────────────────────────────────────────────────
  const [keyInput, setKeyInput] = useState('');
  const [unlocked, setUnlocked] = useState(() => Boolean(getAdminKey()));
  const [revealKey, setRevealKey] = useState(false);

  // ─── Dados vindos do servidor ──────────────────────────────────────────────
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [orgs, setOrgs] = useState<{ id: string; name: string; type: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /**
   * Contador que só serve para forçar um render (entra na `key` do seletor de
   * nível de cada linha). É preciso porque o `<select>` é controlado: quando o
   * administrador CANCELA a confirmação de uma promoção nada muda no estado e,
   * sem isto, o browser ficaria a mostrar o nível que não foi aplicado.
   */
  const [renderTick, setRenderTick] = useState(0);

  // ─── Níveis de acesso disponíveis ──────────────────────────────────────────
  const [levels, setLevels] = useState<AccessLevelOption[]>([]);
  /** true = a lista veio do catálogo local (o pedido ao servidor falhou). */
  const [levelsFromFallback, setLevelsFromFallback] = useState(false);

  // ─── Filtros (client-side, sobre a lista real) ─────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // ─── Formulário de criação (painel inline, como em root-access) ────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  /** Id do NÍVEL DE ACESSO escolhido (a API guarda-o na coluna `role`). */
  const [levelId, setLevelId] = useState<string>('');
  const [organizationId, setOrganizationId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPlatformAdmin, setConfirmPlatformAdmin] = useState(false);

  // ─── Password gerada (visível uma única vez) ───────────────────────────────
  const [createdPassword, setCreatedPassword] = useState<{ email: string; password: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  /**
   * Trata falhas da API.
   *
   * 401/403 = chave em falta ou inválida: o `adminUserService` já apagou a
   * chave guardada, por isso voltamos ao ecrã de desbloqueio e mostramos a
   * mensagem que o SERVIDOR devolveu (não uma inventada pelo cliente).
   */
  const handleApiError = useCallback((err: any, fallback: string) => {
    setError(err?.message || fallback);
    if (err?.status === 401 || err?.status === 403) {
      setUnlocked(false);
      setUsers([]);
    }
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [list, organizations] = await Promise.all([
        adminUserService.list(),
        fetchOrganizations(),
      ]);
      setUsers(list);
      setOrgs(organizations);
      // Pré-selecciona a organização da sessão — é o contexto natural desta
      // página — desde que exista na lista devolvida pelo servidor.
      setOrganizationId((prev) => {
        if (prev) return prev;
        const sessionOrg = organizations.find((o) => o.id === currentOrganizationId);
        return sessionOrg?.id || organizations[0]?.id || '';
      });
      setUnlocked(true);
    } catch (err: any) {
      handleApiError(err, 'Falha ao carregar os utilizadores.');
    } finally {
      setIsLoading(false);
    }
  }, [currentOrganizationId, handleApiError]);

  /**
   * Carrega os níveis de acesso disponíveis.
   *
   * Feito com `fetch` directo (e não pelo `adminUserService`, que só fala de
   * utilizadores) mas com a MESMA chave de administração no cabeçalho
   * `x-nexora-admin-key`: o endpoint é protegido no servidor tal como os
   * restantes. Em caso de falha — ou de lista vazia, que deixaria o ecrã sem
   * forma de criar contas — cai no catálogo local `BUILT_IN_ACCESS_LEVELS`.
   */
  const loadAccessLevels = useCallback(async () => {
    try {
      const res = await fetch('/api/access-levels', {
        headers: { 'x-nexora-admin-key': getAdminKey() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const rows: any[] = Array.isArray(data) ? data : [];
      const mapped: AccessLevelOption[] = rows
        .filter((r) => r && r.id)
        .map((r) => {
          const groups: string[] = Array.isArray(r.groups) ? r.groups.map(String) : [];
          const permissions: Permission[] = Array.isArray(r.permissions)
            ? r.permissions
            : permissionsForGroups(groups);
          return {
            id: String(r.id),
            name: String(r.name || r.id),
            description: String(r.description || ''),
            groups,
            isSystem: Boolean(r.isSystem),
            userCount: typeof r.userCount === 'number' ? r.userCount : undefined,
            permissionCount:
              typeof r.permissionCount === 'number' ? r.permissionCount : permissions.length,
            permissions,
            status: r.status ? String(r.status) : undefined,
          };
        });

      if (mapped.length === 0) throw new Error('O servidor não devolveu níveis de acesso.');
      setLevels(mapped);
      setLevelsFromFallback(false);
    } catch {
      // FALLBACK OFFLINE: catálogo local, para a página continuar a funcionar.
      setLevels(builtInLevelOptions());
      setLevelsFromFallback(true);
    }
  }, []);

  // Sem chave guardada NÃO se chama a API: fica o ecrã de desbloqueio.
  useEffect(() => {
    if (getAdminKey()) load();
  }, [load]);

  // Os níveis só fazem sentido depois de a chave estar validada pelo servidor.
  useEffect(() => {
    if (unlocked) loadAccessLevels();
  }, [unlocked, loadAccessLevels]);

  /**
   * Níveis que podem ser ATRIBUÍDOS. Os arquivados continuam a valer para
   * mostrar o nível actual de uma conta, mas não devem ser oferecidos a novas
   * atribuições. Se estiverem todos arquivados mostramo-los na mesma: mais vale
   * poder escolher um do que não conseguir criar contas de todo.
   */
  const selectableLevels = useMemo(() => {
    const active = levels.filter(
      (l) => String(l.status || 'ACTIVE').toUpperCase() !== 'ARCHIVED'
    );
    return active.length > 0 ? active : levels;
  }, [levels]);

  /** Índice por id para resolver o nome do nível de cada conta. */
  const levelById = useMemo(() => {
    const map: Record<string, AccessLevelOption> = {};
    // Os pré-definidos entram primeiro e a lista do servidor sobrepõe-se: assim
    // uma conta com um nível que já não vem na lista (arquivado, por exemplo)
    // continua a mostrar um nome legível.
    builtInLevelOptions().forEach((l) => {
      map[l.id] = l;
    });
    levels.forEach((l) => {
      map[l.id] = l;
    });
    return map;
  }, [levels]);

  /**
   * Nível pré-selecionado: nunca um que conceda administração da plataforma —
   * uma distracção não deve criar um super-administrador. Se todos concederem,
   * fica o primeiro e a confirmação explícita continua a ser obrigatória.
   */
  useEffect(() => {
    if (selectableLevels.length === 0) return;
    setLevelId((prev) => {
      if (prev && selectableLevels.some((l) => l.id === prev)) return prev;
      const safe = selectableLevels.find((l) => !grantsPlatformAdmin(l));
      return (safe || selectableLevels[0]).id;
    });
  }, [selectableLevels]);

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
    setCreatedPassword(null);
  };

  const selectedLevel = useMemo(
    () => levels.find((l) => l.id === levelId) || null,
    [levels, levelId]
  );
  const selectedLevelGrantsAdmin = grantsPlatformAdmin(selectedLevel);
  /** Grupos do nível escolhido, resolvidos para o catálogo (label + painel). */
  const selectedGroups = useMemo(
    () =>
      (selectedLevel?.groups || [])
        .map((id) => GROUP_BY_ID[id])
        .filter((g): g is AccessGroup => Boolean(g)),
    [selectedLevel]
  );

  // ─── Criar conta ───────────────────────────────────────────────────────────
  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setError(null);

    // Validação local: resposta imediata, sem gastar um pedido ao servidor.
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError('Indique um email válido.');
      return;
    }
    if (fullName.trim().length < 3) {
      setError('Indique o nome completo (mínimo 3 caracteres).');
      return;
    }
    if (!levelId) {
      setError('Escolha o nível de acesso da conta.');
      return;
    }
    if (!organizationId) {
      setError('Escolha a organização do utilizador.');
      return;
    }
    if (password.length < 8) {
      setError('A password da conta deve ter pelo menos 8 caracteres.');
      return;
    }
    // O servidor recusa criar um nível com administração da plataforma sem
    // confirmação explícita — validamos aqui para dar a resposta antes do pedido.
    if (selectedLevelGrantsAdmin && !confirmPlatformAdmin) {
      setError(
        `O nível «${selectedLevel?.name || levelId}» concede administração de plataforma. ` +
          'Marque a confirmação para continuar.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await adminUserService.create({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        // A coluna `role` guarda o ID DO NÍVEL DE ACESSO: o servidor aceita-o
        // aqui (e também em `accessLevelId`). O serviço não é alterado por isso.
        role: levelId,
        organizationId,
        password,
        confirmPlatformAdmin,
      });
      // A password é mostrada uma única vez, para poder ser entregue ao titular:
      // a conta já é real e pode iniciar sessão com ela imediatamente.
      setCreatedPassword({ email: created.email, password });
      showToast({
        type: 'success',
        title: `Conta ${created.email} criada.`,
        message: `Nível de acesso atribuído: ${
          levelById[String(created.role)]?.name || selectedLevel?.name || levelId
        }.`,
      });
      setEmail('');
      setFullName('');
      setPassword('');
      setConfirmPlatformAdmin(false);
      await load();
    } catch (err: any) {
      handleApiError(err, 'Falha ao criar a conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Alterar o nível de acesso de uma conta ────────────────────────────────
  const changeLevel = async (user: AdminUserRow, newLevelId: string) => {
    if (!canManage || newLevelId === String(user.role)) return;

    const newLevel = levelById[newLevelId];

    // Subir para um nível com administração da plataforma dá controlo total,
    // incluindo esta própria página: confirmação explícita, como o servidor exige.
    if (grantsPlatformAdmin(newLevel)) {
      const ok = window.confirm(
        `Alterar o nível de ${user.email} para «${newLevel?.name || newLevelId}»?\n\n` +
          'Este nível concede administração da plataforma: controlo total, incluindo criar e ' +
          'remover administradores e alterar níveis de acesso.'
      );
      if (!ok) {
        // Nada foi alterado: força um render para o `<select>` voltar ao nível
        // real da conta (ver `renderTick`).
        setRenderTick((n) => n + 1);
        return;
      }
    }

    setBusyId(user.id);
    setError(null);
    try {
      await adminUserService.update(user.id, { role: newLevelId, confirmPlatformAdmin: true });
      showToast({
        type: 'success',
        title: `Nível de ${user.email} alterado para ${newLevel?.name || newLevelId}.`,
      });
      await load();
    } catch (err: any) {
      handleApiError(err, 'Falha ao alterar o nível de acesso.');
    } finally {
      setBusyId(null);
    }
  };

  // ─── Remover utilizador ────────────────────────────────────────────────────
  const removeUser = async (user: AdminUserRow) => {
    if (!canManage) return;
    // Dupla guarda: o botão já está desactivado para a própria conta, mas
    // remover a sessão em uso é irreversível — não pode depender só da UI.
    if (currentUser?.id === user.id) return;

    const ok = window.confirm(
      `Remover definitivamente ${user.email}?\n\n` +
        'A conta perde imediatamente o acesso à plataforma. Esta operação não pode ser desfeita.'
    );
    if (!ok) return;

    setBusyId(user.id);
    setError(null);
    try {
      await adminUserService.remove(user.id);
      showToast({ type: 'success', title: `Utilizador ${user.email} removido.` });
      await load();
    } catch (err: any) {
      handleApiError(err, 'Falha ao remover o utilizador.');
    } finally {
      setBusyId(null);
    }
  };

  // ─── Redefinir password ────────────────────────────────────────────────────
  const resetPassword = async (user: AdminUserRow) => {
    if (!canManage) return;
    const newPassword = generateStrongPassword();
    const ok = window.confirm(
      `Redefinir a password de ${user.email}?\n\n` +
        'A nova password é gerada agora e mostrada uma única vez. Entregue-a por um canal seguro.'
    );
    if (!ok) return;

    setBusyId(user.id);
    setError(null);
    try {
      await adminUserService.update(user.id, { password: newPassword });
      setCreatedPassword({ email: user.email, password: newPassword });
      showToast({ type: 'success', title: `Password de ${user.email} redefinida.` });
      await load();
    } catch (err: any) {
      handleApiError(err, 'Falha ao redefinir a password.');
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

  /** Nome legível do nível de uma conta (nível, papel antigo ou id em bruto). */
  const levelNameFor = (user: AdminUserRow): string => {
    const raw = String(user.role);
    return levelById[raw]?.name || ROLE_LABELS[raw as Role] || raw;
  };

  // ─── Filtragem client-side da lista real ───────────────────────────────────
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return users.filter((u) => {
      const levelName = levelNameFor(u);
      const matchesSearch =
        !q ||
        String(u.fullName || '').toLowerCase().includes(q) ||
        String(u.email || '').toLowerCase().includes(q) ||
        String(u.organizationName || '').toLowerCase().includes(q) ||
        String(u.organizationId || '').toLowerCase().includes(q) ||
        levelName.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || getDerivedStatus(u) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter, levelById]);

  /** Coluna de acções só existe para quem pode gerir. */
  const columnCount = canManage ? 7 : 6;

  /** Etiqueta de estado derivada — com a razão no `title`, para não induzir em erro. */
  const renderStatusBadge = (user: AdminUserRow) => {
    const status = getDerivedStatus(user);
    if (status === 'ACTIVE') {
      return (
        <span title="Conta com password definida e guardada com hash scrypt: pode iniciar sessão.">
          <Badge variant="online" size="sm" icon={<CheckCircle2 className="w-3 h-3 text-[#10B981]" />}>
            Ativo
          </Badge>
        </span>
      );
    }
    if (status === 'PENDING_PASSWORD') {
      return (
        <span title="Conta ainda sem password definida (conta semeada de demonstração): ninguém consegue iniciar sessão com ela. Use «Redefinir» para definir uma password.">
          <Badge variant="warning" size="sm" icon={<Clock className="w-3 h-3 text-[#F59E0B]" />}>
            Password por definir
          </Badge>
        </span>
      );
    }
    return (
      <span title="Conta anterior ao hashing: a password está em texto simples. Use «Redefinir» para a migrar para scrypt.">
        <Badge variant="pending" size="sm" icon={<ShieldAlert className="w-3 h-3 text-[#C084FC]" />}>
          Password Antiga
        </Badge>
      </span>
    );
  };

  const headerCard = (
    <div className="p-6 rounded-3xl bg-[#0B1120] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white font-display">
            Gestão de Utilizadores & Membros
          </h1>
          {unlocked && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-semibold">
              {users.length} {users.length === 1 ? 'utilizador' : 'utilizadores'}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {unlocked ? (
            <>
              Contas reais do servidor: cada conta é criada com a sua própria password e pode
              iniciar sessão de imediato, com o nível de acesso que lhe for atribuído aqui. Sessão
              iniciada como{' '}
              <span className="text-slate-200 font-semibold">{currentUser?.name || '—'}</span>
              {currentOrganization?.name ? (
                <>
                  {' '}
                  · organização{' '}
                  <span className="text-slate-200 font-semibold">{currentOrganization.name}</span>
                </>
              ) : null}
              .
            </>
          ) : (
            <>
              Acesso restrito: é necessária a chave de administração do servidor para listar ou
              alterar utilizadores.
            </>
          )}
        </p>
      </div>

      {unlocked && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={load}
            disabled={isLoading}
            className="px-3 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            title="Voltar a pedir a lista ao servidor"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Recarregar
          </button>
          <button
            type="button"
            onClick={lock}
            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-semibold text-rose-300 cursor-pointer flex items-center gap-1.5"
            title="Esquecer a chave guardada nesta sessão"
          >
            <Lock className="w-3.5 h-3.5" /> Bloquear
          </button>
          {canManage && (
            <button
              type="button"
              onClick={() => setIsCreateOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isCreateOpen ? 'Fechar Formulário' : 'Criar Conta'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  // ─── Ecrã de desbloqueio ───────────────────────────────────────────────────
  // Mesmo comportamento da página root-access: sem chave não se pede nada ao
  // servidor, e uma chave inválida (401/403) traz-nos de volta para aqui.
  if (!unlocked) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto pb-12">
        {headerCard}

        <div className="flex justify-center py-4">
          <form
            onSubmit={unlock}
            className="max-w-md w-full p-6 rounded-3xl bg-[#0B1120] border border-white/10 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 flex items-center justify-center text-[#60A5FA]">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Acesso Restrito</h2>
                <p className="text-[11px] text-slate-400">
                  Gestão de utilizadores e administradores da plataforma
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Introduza a chave de administração definida no servidor (
              <code className="text-cyan-400 font-mono">NEXORA_ADMIN_KEY</code>). Sem ela, o servidor
              recusa qualquer operação — a chave não existe no código do site e fica guardada apenas
              nesta sessão do browser.
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

            <button
              type="submit"
              disabled={isLoading || !keyInput.trim()}
              className="w-full px-3 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] disabled:opacity-50 text-xs font-bold text-white cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="w-3.5 h-3.5" />
              {isLoading ? 'A validar…' : 'Desbloquear'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Consola ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {headerCard}

      {error && (
        <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-[11px] text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* ─── Password da conta (mostrada uma única vez) ───────────────────── */}
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
            Entregue esta password ao titular por um canal seguro. A conta já está activa e pode
            iniciar sessão imediatamente; o sistema pede-lhe que defina uma password própria no
            primeiro início de sessão. Esta password não volta a ser mostrada — o servidor guarda
            apenas o hash scrypt.
          </p>
        </div>
      )}

      {/* ─── Criar conta de utilizador (painel inline, não modal) ─────────── */}
      {canManage && isCreateOpen && (
        <section className="rounded-3xl bg-[#0B1120] border border-white/10 overflow-hidden shadow-xl">
          <header className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                Criar conta de utilizador
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="p-1 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg cursor-pointer"
              title="Fechar formulário"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <form onSubmit={submitCreate} className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: teresa.f@empresa.ao"
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Nome completo *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ex: Teresa Fernandes"
                  className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Organização *
                </label>
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full bg-[#070B14] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  {orgs.length === 0 && <option value="">(nenhuma organização encontrada)</option>}
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Password inicial * (mínimo 8 caracteres)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Defina ou gere uma password forte"
                    className="flex-1 bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPassword(generateStrongPassword())}
                    className="px-3 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer whitespace-nowrap"
                  >
                    Gerar forte
                  </button>
                </div>
              </div>
            </div>

            {/* ─── Nível de acesso: cartões, não uma lista suspensa ───────── */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <label className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  <Layers className="w-3.5 h-3.5" /> Nível de acesso *
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  {levelsFromFallback ? (
                    <span
                      className="text-amber-300"
                      title="Não foi possível ler os níveis do servidor: está a ser usado o catálogo local de accessLevels.ts. O servidor resolve estes níveis na mesma."
                    >
                      catálogo local (servidor indisponível)
                    </span>
                  ) : (
                    `${selectableLevels.length} níveis disponíveis`
                  )}
                </span>
              </div>

              {selectableLevels.length === 0 ? (
                <p className="text-[11px] text-slate-500 p-3 rounded-xl bg-white/[0.02] border border-white/10">
                  A carregar níveis de acesso…
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {selectableLevels.map((lvl) => {
                    const isSelected = lvl.id === levelId;
                    const adminLevel = grantsPlatformAdmin(lvl);
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          setLevelId(lvl.id);
                          // A confirmação pertence ao nível escolhido: ao trocar
                          // de nível, a confirmação anterior deixa de valer.
                          setConfirmPlatformAdmin(false);
                        }}
                        aria-pressed={isSelected}
                        className={`text-left p-3 rounded-xl border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500/10 border-cyan-500/50'
                            : 'bg-white/[0.02] border-white/10 hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-white">{lvl.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                          {lvl.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <PanelBadges panels={panelsOfGroups(lvl.groups)} />
                          <span className="text-[9px] font-mono text-slate-500">
                            {permissionCountOf(lvl)} permissões
                          </span>
                          {typeof lvl.userCount === 'number' && (
                            <span className="text-[9px] font-mono text-slate-500">
                              · {lvl.userCount} conta{lvl.userCount === 1 ? '' : 's'}
                            </span>
                          )}
                          {adminLevel && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-300 bg-amber-500/10">
                              <AlertTriangle className="w-2.5 h-2.5" /> administração
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ─── Pré-visualização: exactamente o que este nível concede ──── */}
            {selectedLevel && (
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    Pré-visualização · «{selectedLevel.name}»
                  </span>
                  <span className="text-[10px] font-mono text-slate-300">
                    {permissionCountOf(selectedLevel)} permissões
                  </span>
                </div>

                {selectedLevel.description && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {selectedLevel.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    Painéis:
                  </span>
                  {panelsOfGroups(selectedLevel.groups).length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono text-slate-500">
                      <ShieldOff className="w-2.5 h-2.5" /> nenhum
                    </span>
                  ) : (
                    <PanelBadges panels={panelsOfGroups(selectedLevel.groups)} />
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    Grupos de funcionalidades concedidos
                  </span>
                  {selectedGroups.length === 0 ? (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldOff className="w-3 h-3" /> Este nível não concede nenhum grupo de
                      funcionalidades conhecido.
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {selectedGroups.map((g) => (
                        <li key={g.id} className="flex items-start gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span className="text-[11px] text-slate-200 leading-relaxed">
                            {g.label}
                            <span className="text-slate-500"> · {PANEL_LABELS[g.panel]}</span>
                            <span className="block text-[10px] text-slate-500">{g.description}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* ─── Administração da plataforma: aviso + confirmação ────────── */}
            {selectedLevelGrantsAdmin && (
              <>
                <div className="rounded-xl bg-rose-500/[0.07] border border-rose-500/30 p-3 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-300" />
                  <p className="text-[11px] text-rose-200 leading-relaxed">
                    O nível «{selectedLevel?.name}» inclui a{' '}
                    <strong>Administração da Plataforma</strong>: concede controlo total, incluindo
                    criar e remover administradores e alterar níveis de acesso. Atribua-o apenas a
                    quem deve poder gerir o sistema.
                  </p>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/[0.07] border border-amber-500/25 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmPlatformAdmin}
                    onChange={(e) => setConfirmPlatformAdmin(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[11px] text-amber-200 leading-relaxed">
                    Confirmo que quero criar uma conta com{' '}
                    <strong>administração da plataforma</strong>. Este nível concede acesso global,
                    incluindo a esta página de gestão de acessos.
                  </span>
                </label>
              </>
            )}

            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                {isSubmitting ? 'A criar conta…' : 'Criar conta'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ─── Pesquisa e filtro (client-side, sobre a lista real) ──────────── */}
      <div className="p-4 rounded-2xl bg-[#0B1120] border border-white/10 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por nome, email, organização ou nível..."
            className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-500 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#070B14] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">Todos os Estados</option>
            <option value="ACTIVE">Apenas Ativos</option>
            <option value="PENDING_PASSWORD">Password por definir</option>
            <option value="LEGACY">Password Antiga (texto simples)</option>
          </select>
        </div>
      </div>

      {/* ─── Tabela de utilizadores ───────────────────────────────────────── */}
      <div className="rounded-3xl bg-[#0B1120] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/[0.02] border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400 font-display">
              <tr>
                <th className="px-6 py-4">Utilizador</th>
                <th className="px-4 py-4">Organização</th>
                <th className="px-4 py-4">Nível de acesso</th>
                <th className="px-4 py-4">Estado</th>
                <th className="px-4 py-4">Password</th>
                <th className="px-4 py-4">Criado em</th>
                {canManage && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-12 text-center text-slate-400">
                    A carregar utilizadores do servidor...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-12 text-center text-slate-400">
                    Nenhum utilizador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const rawRole = String(u.role);
                  const levelDef = levelById[rawRole];
                  const levelName = levelNameFor(u);
                  // Contas antigas (papel do código, não nível): mostramos a
                  // contagem de permissões do papel para o administrador saber o
                  // que está a substituir quando escolher um nível.
                  const legacyPermissionCount = levelDef
                    ? 0
                    : ROLES_REGISTRY[rawRole as Role]?.permissions.length || 0;
                  const rowPanels = levelDef ? panelsOfGroups(levelDef.groups) : [];
                  const isLegacyAdmin = !levelDef && PLATFORM_ADMIN_ROLES.includes(rawRole);
                  const isCurrentSelectable = selectableLevels.some((l) => l.id === rawRole);
                  const isSelf = currentUser?.id === u.id;
                  const isBusy = busyId === u.id;
                  const orgTypeDef = u.organizationType
                    ? ORGANIZATION_TYPE_LABELS[u.organizationType as OrganizationType]
                    : undefined;

                  return (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Utilizador */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.fullName} size="md" />
                          <div>
                            <p className="font-bold text-white text-xs">
                              {u.fullName}
                              {isSelf && (
                                <span className="ml-1.5 text-[10px] font-semibold text-cyan-400">
                                  · você
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                              <Mail className="w-3 h-3 text-slate-500" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Organização */}
                      <td className="px-4 py-4">
                        <p className="text-xs text-slate-200 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                          {u.organizationName || u.organizationId}
                        </p>
                        {u.organizationType && (
                          <span
                            title={orgTypeDef?.label || u.organizationType}
                            className={`inline-block mt-1 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                              orgTypeDef?.badge || 'bg-white/5 text-slate-400 border-white/10'
                            }`}
                          >
                            {u.organizationType}
                          </span>
                        )}
                      </td>

                      {/* Nível de acesso (editável) + painéis que concede */}
                      <td className="px-4 py-4">
                        {canManage ? (
                          <select
                            key={`level-${u.id}-${renderTick}`}
                            value={rawRole}
                            onChange={(e) => changeLevel(u, e.target.value)}
                            disabled={isBusy}
                            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/10 bg-[#070B14] text-slate-200 cursor-pointer outline-none disabled:opacity-50 max-w-[220px]"
                          >
                            {/* Se o valor actual já não estiver na lista (conta
                                antiga ou nível arquivado) mostramo-lo na mesma:
                                sem esta opção o <select> apontaria para outro
                                nível sem ninguém ter mudado nada. A `key` inclui
                                o `renderTick` para o seletor ser remontado com o
                                valor real quando uma mudança é cancelada. */}
                            {!isCurrentSelectable && (
                              <option value={rawRole}>
                                {levelName}
                                {levelDef ? ' (indisponível)' : ' (papel antigo)'}
                              </option>
                            )}
                            {/* Mesma lista de níveis da criação da conta. */}
                            {selectableLevels.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg border border-white/10 text-slate-300">
                            {levelName}
                          </span>
                        )}

                        <p className="text-[10px] text-slate-400 mt-1 max-w-xs">
                          {levelDef
                            ? levelDef.description
                            : `Papel antigo «${levelName}» (anterior aos níveis de acesso). Escolha um nível para o migrar.`}
                        </p>

                        {levelDef ? (
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {rowPanels.length === 0 ? (
                              <span className="text-[9px] font-mono text-slate-600 flex items-center gap-1">
                                <ShieldOff className="w-2.5 h-2.5" /> sem painel
                              </span>
                            ) : (
                              <PanelBadges panels={rowPanels} />
                            )}
                            <span className="text-[9px] font-mono text-slate-500">
                              {permissionCountOf(levelDef)} permissões
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-1">
                            <ShieldOff className="w-3 h-3" />
                            {legacyPermissionCount > 0
                              ? `${legacyPermissionCount} permissões do papel antigo`
                              : 'Sem permissões reconhecidas'}
                            {isLegacyAdmin && ' · administração de plataforma'}
                          </p>
                        )}
                      </td>

                      {/* Estado (derivado do que a API expõe) */}
                      <td className="px-4 py-4">{renderStatusBadge(u)}</td>

                      {/* Password */}
                      <td className="px-4 py-4">
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
                            title="Sem password definida: ninguém consegue iniciar sessão com esta conta até lhe ser atribuída uma password."
                          >
                            sem password
                          </span>
                        )}
                      </td>

                      {/* Data de criação da conta */}
                      <td className="px-4 py-4 text-slate-400 text-xs font-mono whitespace-nowrap">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Acções */}
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => resetPassword(u)}
                              disabled={isBusy}
                              className="px-2 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[10px] font-semibold text-slate-200 cursor-pointer disabled:opacity-40 flex items-center gap-1"
                              title="Gerar uma nova password para este utilizador"
                            >
                              <KeyRound className="w-3 h-3" /> Redefinir
                            </button>

                            <button
                              type="button"
                              onClick={() => removeUser(u)}
                              disabled={isBusy || isSelf}
                              className="p-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              title={
                                isSelf
                                  ? 'Não pode remover a sua própria conta — é a sessão que está a usar agora.'
                                  : 'Remover Utilizador'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Nota de rodapé (linguagem da página root-access) ─────────────── */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] px-4 py-3 text-[11px] text-slate-400 leading-relaxed space-y-1.5">
        <p className="flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-300" />
          <span>
            <strong>Criar Conta</strong> cria uma conta real, pronta a usar: a password definida
            aqui é a que o titular usa para entrar e a conta fica activa de imediato (com troca de
            password pedida no primeiro início de sessão).
          </span>
        </p>
        <p>
          O <strong>Nível de acesso</strong> é o que decide o que a conta vê e faz: cada nível é uma
          combinação de grupos de funcionalidades e o servidor resolve as permissões a partir dele no
          login. Níveis com <strong>Administração da Plataforma</strong> exigem confirmação
          explícita, porque concedem controlo sobre todos os outros níveis.
        </p>
        <p>
          O <strong>Estado</strong> é derivado do que a API expõe (tem password? está hasheada?): o
          servidor não guarda um estado de conta separado, por isso não há suspensões nesta lista.{' '}
          <span className="font-mono text-amber-300">Password por definir</span> são contas ainda sem
          password utilizável — ninguém entra com elas até usar <strong>Redefinir</strong>.
        </p>
        <p>
          Estes dados vêm do servidor: cada pedido leva a chave de administração e é o servidor que
          autoriza. A chave fica apenas nesta sessão do browser e o botão <strong>Bloquear</strong>{' '}
          esquece-a.
        </p>
      </div>
    </div>
  );
};
