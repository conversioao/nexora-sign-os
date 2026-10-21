import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { User, Organization, Membership, Permission, Role, OrganizationType } from '../types/auth';
import {
  DEMO_PROFILES,
  buildSessionForProfile,
  buildSessionForUserAndOrg,
  SessionState,
} from '../services/sessionService';
import { permissionService } from '../services/permissionService';
import { organizationRepository } from '../repositories/organizationRepository';
import { mockUsers, mockOrganizations, mockMemberships } from '../data/mockAuthData';

export interface SessionContextType {
  // Current Session States
  currentUser: User | null;
  currentOrganization: Organization | null;
  currentMembership: Membership | null;
  userMemberships: Membership[];
  availableOrganizations: Organization[];
  permissions: Permission[];
  currentRole: Role;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  isLoading: boolean;
  /**
   * Login/perfis de demonstração activos (decidido pelo SERVIDOR em
   * `/api/auth/config`). Quando falso, não existe caminho de autenticação local.
   */
  demoLoginEnabled: boolean;
  /**
   * `true` enquanto a conta ainda usar a palavra-passe inicial definida pelo
   * administrador (campo `mustChangePassword` devolvido por `/api/auth/login`).
   * Enquanto for `true`, a aplicação não pode renderizar nenhuma shell.
   */
  mustChangePassword: boolean;
  /**
   * Credenciais usadas no login que acabou de acontecer, guardadas apenas em
   * MEMÓRIA para que o ecrã de alteração de palavra-passe possa enviar a
   * palavra-passe actual sem a voltar a pedir. `null` quando não são
   * necessárias (login normal) ou quando já foram consumidas.
   */
  pendingCredentials: { email: string; password: string } | null;

  // Actions
  switchOrganization: (organizationId: string) => Promise<void>;
  switchDemoProfile: (profileKey: string) => void;
  login: (email: string, password?: string, remember?: boolean) => Promise<boolean>;
  loginDemo: (profileKey: string) => void;
  logout: () => void;
  /** Conclui o primeiro acesso: baixa a marca e descarta as credenciais em memória. */
  clearMustChangePassword: () => void;
  updateOrganization: (data: Partial<Organization>) => Promise<Organization>;

  // Granular Permission Helpers
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const LOCAL_STORAGE_SESSION_KEY = 'nexora_mock_session_state';

/**
 * Cache da configuração de autenticação do servidor.
 *
 * Serve para o caso em que o backend está inacessível: sem esta cache não
 * saberíamos se o modo de demonstração está ligado, e a resposta segura é
 * assumir que NÃO está. O valor só passa a `true` depois de o servidor o
 * confirmar uma vez.
 */
const DEMO_MODE_CACHE_KEY = 'nexora_demo_login_enabled';

/**
 * Lê a marca "tem de alterar a palavra-passe" da sessão persistida.
 *
 * PORQUE se persiste: sem isto, bastava recarregar a página (ou fechar e reabrir
 * o separador) para contornar o bloqueio do primeiro acesso e voltar a entrar na
 * aplicação com a palavra-passe inicial — que o administrador conhece.
 *
 * PORQUE só a marca (e nunca as credenciais): a marca é um booleano inofensivo,
 * mas `pendingCredentials` contém a palavra-passe em texto simples. Guardá-la em
 * localStorage deixaria a palavra-passe legível no browser, pelo que ela vive
 * apenas em memória e desaparece em cada recarregamento.
 */
function readPersistedMustChangePassword(): boolean {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    // As mesmas três condições que o arranque da sessão exige: assim a marca
    // nunca bloqueia um utilizador que não seria considerado autenticado.
    const hasSession = Boolean(
      parsed?.currentUser && parsed?.currentOrganization && parsed?.currentMembership
    );
    return parsed?.mustChangePassword === true && hasSession;
  } catch {
    // Sessão ilegível: a resposta segura é não bloquear (o servidor continua a
    // ser a autoridade sobre a palavra-passe).
    return false;
  }
}

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to NEXORA_ADMIN on initial load for a smooth developer/preview experience
  const [session, setSession] = useState<SessionState>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.currentUser && parsed?.currentOrganization && parsed?.currentMembership) {
          return {
            ...parsed,
            permissions: parsed.permissions || permissionService.getPermissionsForRole(parsed.currentMembership.role),
            userMemberships: parsed.userMemberships || [parsed.currentMembership],
            availableOrganizations: parsed.availableOrganizations || [parsed.currentOrganization],
            isAuthenticated: true,
            isDemoMode: false,
          };
        }
      }
    } catch {
      // Ignore local storage parse issues
    }
    return {
      currentUser: null,
      currentOrganization: null,
      currentMembership: null,
      userMemberships: [],
      availableOrganizations: [],
      permissions: [],
      isAuthenticated: false,
      isDemoMode: false,
    };
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Primeiro acesso pendente (ver `readPersistedMustChangePassword`).
   * Arranca a partir da sessão persistida para que um recarregamento da página
   * volte a mostrar o ecrã de alteração em vez de deixar passar.
   */
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(
    readPersistedMustChangePassword
  );

  /**
   * Credenciais do login que acabou de acontecer — apenas em MEMÓRIA, de
   * propósito: são necessárias para enviar `currentPassword` sem voltar a
   * perguntá-la, mas uma palavra-passe em texto simples nunca vai para
   * localStorage nem sobrevive a um recarregamento.
   */
  const [pendingCredentials, setPendingCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  /**
   * Modo de demonstração — decidido pelo SERVIDOR, nunca pelo cliente.
   *
   * Valor inicial `false` (seguro): só passa a `true` depois de o servidor o
   * confirmar em `/api/auth/config`. A última resposta conhecida fica em cache
   * para o caso de o backend estar inacessível; se nunca houve resposta, assume
   * desactivado.
   */
  const [demoLoginEnabled, setDemoLoginEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(DEMO_MODE_CACHE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    let cancelled = false;

    fetch('/api/auth/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (cancelled || !cfg) return;
        const enabled = Boolean(cfg.demoLoginEnabled);
        setDemoLoginEnabled(enabled);
        try {
          localStorage.setItem(DEMO_MODE_CACHE_KEY, String(enabled));
        } catch {}
      })
      .catch(() => {
        // Servidor inacessível: mantém-se o último valor conhecido (ou false)
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync to local storage for persistence across reloads
  useEffect(() => {
    if (session.isAuthenticated && session.currentUser && session.currentOrganization) {
      try {
        localStorage.setItem(
          LOCAL_STORAGE_SESSION_KEY,
          JSON.stringify({
            currentUser: session.currentUser,
            currentOrganization: session.currentOrganization,
            currentMembership: session.currentMembership,
            isAuthenticated: session.isAuthenticated,
            // Persistidas para que um recarregamento não faça a sessão voltar ao
            // registo fixo de perfis: as permissões são definidas no servidor
            // (níveis de acesso criados pelo administrador) e sem isto o cliente
            // deduzia-as do papel — dando permissões erradas ou nenhumas.
            permissions: session.permissions,
            // Persistido para o bloqueio do primeiro acesso sobreviver a um
            // recarregamento. É removido do armazenamento em `logout()` e
            // reescrito como `false` por `clearMustChangePassword()`.
            mustChangePassword,
          })
        );
      } catch {
        // Storage failover
      }
    } else {
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }
  }, [session, mustChangePassword]);

  const switchOrganization = useCallback(
    async (organizationId: string) => {
      if (!session.currentUser) return;
      setIsLoading(true);

      // Find membership for this user in the target org
      let membership = mockMemberships.find(
        (m) => m.userId === session.currentUser!.id && m.organizationId === organizationId
      );

      // If user is Nexora Admin or in demo mode, allow universal cross-organization switching
      if (!membership && (session.currentMembership?.role === 'NEXORA_ADMIN' || session.isDemoMode)) {
        membership = {
          id: `mem-cross-${organizationId}`,
          userId: session.currentUser!.id,
          organizationId: organizationId,
          role: 'CLIENT_OWNER',
          status: 'ACTIVE',
          joinedAt: new Date().toISOString(),
        };
      }

      const org = await organizationRepository.getById(organizationId);

      if (org && membership) {
        const permissions = permissionService.getPermissionsForRole(membership.role);
        setSession((prev) => ({
          ...prev,
          currentOrganization: org,
          currentMembership: membership!,
          permissions,
        }));
      }

      setIsLoading(false);
    },
    [session.currentUser, session.currentMembership, session.isDemoMode]
  );

  const switchDemoProfile = useCallback(
    (profileKey: string) => {
      // Trocar de perfil é uma funcionalidade de demonstração: concederia
      // NEXORA_ADMIN com um clique. Com o modo desactivado, não faz nada.
      if (!demoLoginEnabled) {
        console.warn(
          '🔒 Troca de perfil de demonstração bloqueada: desactivada no servidor (NEXORA_ALLOW_DEMO_LOGIN).'
        );
        return;
      }
      setIsLoading(true);
      const newSession = buildSessionForProfile(profileKey);
      setSession(newSession);
      // Perfil de demonstração não tem palavra-passe inicial de administrador:
      // não faz sentido manter o bloqueio do primeiro acesso.
      setMustChangePassword(false);
      setPendingCredentials(null);
      setIsLoading(false);
    },
    [demoLoginEnabled]
  );

  const loginDemo = useCallback(
    (profileKey: string) => {
      if (!demoLoginEnabled) {
        console.warn('🔒 Login de demonstração bloqueado: desactivado no servidor.');
        return;
      }
      setIsLoading(true);
      const newSession = buildSessionForProfile(profileKey);
      setSession(newSession);
      setMustChangePassword(false);
      setPendingCredentials(null);
      setIsLoading(false);
    },
    [demoLoginEnabled]
  );

  const login = useCallback(
    async (email: string, password?: string): Promise<boolean> => {
      setIsLoading(true);

      const normalizedEmail = email.trim().toLowerCase();
      const targetEmail =
        normalizedEmail === 'admin@nexoramidia.com' ? 'admin@nexora.ao' : normalizedEmail;

      // ─── 1. Caminho principal: o SERVIDOR decide ───────────────────────────
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password }),
        });

        if (response.ok) {
          const payload = await response.json();
          const { user, organization } = payload;
          const primaryMembership = {
            id: `mem-${user.id}-db`,
            userId: user.id,
            organizationId: organization.id,
            role: user.role as Role,
            status: 'ACTIVE',
            joinedAt: new Date().toISOString(),
          };

          // ─── Permissões: vêm do SERVIDOR ───────────────────────────────────
          // Os níveis de acesso são definidos no servidor (incluindo níveis
          // criados pelo administrador), por isso deduzi-las do registo fixo de
          // perfis daria permissões erradas — ou nenhumas. O registo local fica
          // apenas como último recurso, para quando a resposta não traz o campo
          // (servidor mais antigo). Um array vazio é respeitado tal como vem:
          // significa mesmo "este nível não concede nada".
          const permissions: Permission[] = Array.isArray(payload?.permissions)
            ? (payload.permissions as Permission[])
            : permissionService.getPermissionsForRole(user.role as Role);

          // ─── Primeiro acesso: palavra-passe inicial ainda em uso ───────────
          // O ecrã de alteração precisa da palavra-passe actual para provar a
          // identidade à API. Fica só em memória (nunca em localStorage) e é
          // descartada assim que a troca termina.
          const mustChange = Boolean(payload?.mustChangePassword);
          setMustChangePassword(mustChange);
          setPendingCredentials(
            mustChange
              ? {
                  // `user.email` é o e-mail canónico da conta (o servidor aceita
                  // alias no login, mas não na troca de palavra-passe).
                  email: user.email || normalizedEmail,
                  password: password || '',
                }
              : null
          );

          const validOrgType = (
            organization.type || (user.role === 'NEXORA_ADMIN' ? 'NEXORA' : 'CLIENT')
          ).toUpperCase();
          const formattedOrganization = {
            ...organization,
            type: validOrgType as OrganizationType,
            code: organization.code || `ORG-${organization.id.substring(0, 4).toUpperCase()}`,
            city: organization.city || 'Luanda',
          };

          setSession({
            currentUser: user,
            currentOrganization: formattedOrganization,
            currentMembership: primaryMembership,
            userMemberships: [primaryMembership],
            availableOrganizations: [formattedOrganization],
            permissions,
            currentRole: user.role as Role,
            isAuthenticated: true,
            isDemoMode: false,
          });
          setIsLoading(false);
          return true;
        }

        // O servidor respondeu e RECUSOU as credenciais. Não existe caminho
        // alternativo: antes, este caso caía na procura por email nos dados de
        // demonstração, pelo que uma password errada acabava por autenticar.
        console.warn(`🔒 Login recusado pelo servidor (HTTP ${response.status}).`);
        setIsLoading(false);
        return false;
      } catch (e) {
        console.warn('Servidor de autenticação inacessível:', e);
      }

      // ─── 2. Servidor inacessível: só há caminho local em demonstração ──────
      // Um backend em baixo não pode transformar-se numa porta aberta. Se o
      // modo de demonstração não estiver confirmado, recusar é a resposta certa.
      if (!demoLoginEnabled) {
        console.warn(
          '🔒 Servidor inacessível e o modo de demonstração está desactivado — login recusado.'
        );
        setIsLoading(false);
        return false;
      }

      const user = mockUsers.find((u) => {
        const uEmail = u.email.toLowerCase();
        return (
          uEmail === normalizedEmail ||
          uEmail === targetEmail ||
          (uEmail === 'mario@nexora.ao' && targetEmail === 'admin@nexora.ao')
        );
      });

      if (!user) {
        setIsLoading(false);
        return false;
      }

    const memberships = mockMemberships.filter((m) => m.userId === user.id);
    const primaryMembership = memberships[0] || {
      id: `mem-${user.id}-default`,
      userId: user.id,
      organizationId: mockOrganizations[0].id,
      role: 'CLIENT_OWNER' as Role,
      status: 'ACTIVE',
      joinedAt: new Date().toISOString(),
    };

    const primaryOrg =
      mockOrganizations.find((o) => o.id === primaryMembership.organizationId) ||
      mockOrganizations[0];

    const availableOrganizations = mockOrganizations.filter((org) =>
      memberships.some((m) => m.organizationId === org.id)
    );

    const permissions = permissionService.getPermissionsForRole(primaryMembership.role);

    // Caminho local (servidor em baixo): não existe conta criada por
    // administrador neste modo, logo não há primeiro acesso a forçar. Limpar a
    // marca evita que um estado anterior bloqueie um login de demonstração.
    setMustChangePassword(false);
    setPendingCredentials(null);

    setSession({
      currentUser: user,
      currentOrganization: primaryOrg,
      currentMembership: primaryMembership,
      userMemberships: memberships,
      availableOrganizations:
        availableOrganizations.length > 0 ? availableOrganizations : [primaryOrg],
      permissions,
      currentRole: primaryMembership.role,
      isAuthenticated: true,
      isDemoMode: false,
    });

    setIsLoading(false);
    return true;
    },
    [demoLoginEnabled]
  );

  const logout = useCallback(() => {
    setSession({
      currentUser: null,
      currentOrganization: null,
      currentMembership: null,
      userMemberships: [],
      availableOrganizations: [],
      permissions: [],
      isAuthenticated: false,
      isDemoMode: false,
    });
    // Uma saída de sessão tem de limpar TUDO o que é específico do utilizador:
    // a marca do primeiro acesso (senão o próximo login, possivelmente de outra
    // pessoa, voltaria a ver o ecrã de troca) e as credenciais em memória.
    setMustChangePassword(false);
    setPendingCredentials(null);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  }, []);

  /**
   * Chamada depois de o servidor confirmar a troca de palavra-passe: o bloqueio
   * do primeiro acesso termina e as credenciais temporárias são descartadas.
   */
  const clearMustChangePassword = useCallback(() => {
    setMustChangePassword(false);
    setPendingCredentials(null);
  }, []);

  const updateOrganization = useCallback(
    async (data: Partial<Organization>): Promise<Organization> => {
      if (!session.currentOrganization) {
        throw new Error('Nenhuma organização ativa selecionada.');
      }

      const updated = await organizationRepository.update(session.currentOrganization.id, data);
      setSession((prev) => ({
        ...prev,
        currentOrganization: updated,
      }));
      return updated;
    },
    [session.currentOrganization]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissionService.hasPermission(session.permissions, permission);
    },
    [session.permissions]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissionService.hasAnyPermission(session.permissions, permissions);
    },
    [session.permissions]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissionService.hasAllPermissions(session.permissions, permissions);
    },
    [session.permissions]
  );

  const currentRole: Role = session.currentMembership?.role || 'CLIENT_EDITOR';

  const value = useMemo<SessionContextType>(
    () => ({
      currentUser: session.currentUser,
      currentOrganization: session.currentOrganization,
      currentMembership: session.currentMembership,
      userMemberships: session.userMemberships,
      availableOrganizations: session.availableOrganizations,
      permissions: session.permissions,
      currentRole,
      isAuthenticated: session.isAuthenticated,
      isDemoMode: session.isDemoMode,
      isLoading,
      demoLoginEnabled,
      mustChangePassword,
      pendingCredentials,
      switchOrganization,
      switchDemoProfile,
      login,
      loginDemo,
      logout,
      clearMustChangePassword,
      updateOrganization,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [
      session,
      currentRole,
      isLoading,
      demoLoginEnabled,
      mustChangePassword,
      pendingCredentials,
      switchOrganization,
      switchDemoProfile,
      login,
      loginDemo,
      logout,
      clearMustChangePassword,
      updateOrganization,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    ]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
