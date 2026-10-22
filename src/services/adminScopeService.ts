/**
 * Categorias de Administrador da plataforma Nexora.
 *
 * Existem DOIS ecossistemas de administração independentes:
 *
 *   • GENERAL      → painel de admin do Nexora Sign (displays, campanhas,
 *                    playlists, contratos, financeiro…). Continua exactamente
 *                    como estava, em `AppShell` + `navigationGroups`.
 *
 *   • CREATIVE_AI  → painel de admin autónomo do Nexora Creative AI (créditos,
 *                    aprovações, pacotes, utilizadores e analítica de geração).
 *
 * Este módulo é a única fonte de verdade para responder a:
 *   «este utilizador é admin geral, admin do Creative AI, os dois, ou nenhum?»
 *
 * É deliberadamente puro (sem React, sem fetch) para poder ser testado e
 * reutilizado tanto no cliente como em qualquer verificação futura no servidor.
 */
import { Permission } from '../types/auth';

export type AdminScope = 'GENERAL' | 'CREATIVE_AI';

export interface AdminScopeDefinition {
  id: AdminScope;
  label: string;
  shortLabel: string;
  description: string;
  /** Permissão que, por si só, garante entrada neste painel. */
  entryPermission: Permission;
  /** Todas as permissões que pertencem a esta categoria. */
  permissions: Permission[];
  /** Classes tailwind para o badge, seguindo o padrão do ROLES_REGISTRY. */
  badgeColor: string;
  accentColor: string;
}

export const ADMIN_SCOPE_DEFINITIONS: Record<AdminScope, AdminScopeDefinition> = {
  GENERAL: {
    id: 'GENERAL',
    label: 'Admin Geral (Nexora Sign)',
    shortLabel: 'Admin Geral',
    description:
      'Administra a rede de sinalização digital: displays, conteúdos, playlists, campanhas, contratos e financeiro.',
    entryPermission: 'platform.admin',
    permissions: ['platform.admin', 'platform.all'],
    badgeColor: 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/40',
    accentColor: '#2563EB',
  },
  CREATIVE_AI: {
    id: 'CREATIVE_AI',
    label: 'Admin Nexora Creative AI',
    shortLabel: 'Admin Creative AI',
    description:
      'Administra exclusivamente o ecossistema de IA generativa: créditos, aprovações de recarga, pacotes, utilizadores e analítica de geração.',
    entryPermission: 'creativeadmin.access',
    permissions: [
      'creativeadmin.access',
      'creativeadmin.credits',
      'creativeadmin.packages',
      'creativeadmin.analytics',
      'aicredits.read',
      'aicredits.manage',
    ],
    badgeColor: 'bg-[#7C3AED]/15 text-[#C084FC] border-[#7C3AED]/40',
    accentColor: '#7C3AED',
  },
};

export const ADMIN_SCOPES: AdminScopeDefinition[] = Object.values(ADMIN_SCOPE_DEFINITIONS);

/**
 * Super-poder: concede as DUAS categorias. É o único caso em que uma permissão
 * do admin geral abre também o admin do Creative AI — `platform.admin` sozinho
 * NÃO o faz, porque a separação dos dois ecossistemas é intencional.
 */
export const SUPER_ADMIN_PERMISSION: Permission = 'platform.all';

/** Alguma das permissões pertence a esta categoria? */
export function hasAdminScope(permissions: Permission[], scope: AdminScope): boolean {
  if (permissions.includes(SUPER_ADMIN_PERMISSION)) return true;
  const def = ADMIN_SCOPE_DEFINITIONS[scope];
  return def.permissions.some((p) => permissions.includes(p));
}

/** Todas as categorias de admin a que o utilizador pertence. */
export function getAdminScopes(permissions: Permission[]): AdminScope[] {
  return ADMIN_SCOPES.filter((def) => hasAdminScope(permissions, def.id)).map((d) => d.id);
}

/** Pode entrar no painel de admin do Creative AI? */
export function canAccessCreativeAdmin(permissions: Permission[]): boolean {
  return (
    permissions.includes(SUPER_ADMIN_PERMISSION) ||
    permissions.includes(ADMIN_SCOPE_DEFINITIONS.CREATIVE_AI.entryPermission)
  );
}

/** Etiqueta legível para mostrar na gestão de utilizadores. */
export function describeAdminAccess(permissions: Permission[]): string {
  const scopes = getAdminScopes(permissions);
  if (scopes.length === 0) return 'Sem acesso a admin';
  if (scopes.length === ADMIN_SCOPES.length) return 'Admin Geral + Creative AI';
  return ADMIN_SCOPE_DEFINITIONS[scopes[0]].shortLabel;
}

// ─── Secções do painel de admin do Creative AI ───────────────────────────────
// Cada secção declara a permissão necessária. A navegação é gerada a partir
// daqui e filtrada por permissões — uma secção sem permissão nunca aparece.

export interface CreativeAdminSection {
  id: string;
  label: string;
  icon: string;
  description: string;
  requiredPermission: Permission;
}

export const CREATIVE_ADMIN_SECTIONS: CreativeAdminSection[] = [
  {
    id: 'ca-overview',
    label: 'Visão Geral',
    icon: 'LayoutDashboard',
    description: 'Saúde do ecossistema: créditos em circulação, consumo, gerações e pedidos pendentes.',
    requiredPermission: 'creativeadmin.access',
  },
  {
    id: 'ca-users',
    label: 'Utilizadores',
    icon: 'Users',
    description: 'Quem usa o Creative AI, saldo, consumo e volume de gerações por utilizador.',
    requiredPermission: 'creativeadmin.analytics',
  },
  {
    id: 'ca-credits',
    label: 'Gestão de Créditos',
    icon: 'Coins',
    description: 'Saldos por organização, ajustes manuais e livro-razão completo de transações.',
    requiredPermission: 'creativeadmin.credits',
  },
  {
    id: 'ca-approvals',
    label: 'Aprovação de Recargas',
    icon: 'ClipboardCheck',
    description: 'Pedidos de recarga com comprovativo, à espera de aprovação ou rejeição.',
    requiredPermission: 'creativeadmin.credits',
  },
  {
    id: 'ca-packages',
    label: 'Pacotes de Créditos',
    icon: 'Package',
    description: 'Criar, editar, activar e desactivar os pacotes vendidos aos clientes.',
    requiredPermission: 'creativeadmin.packages',
  },
  {
    id: 'ca-models',
    label: 'Modelos & Custos',
    icon: 'Cpu',
    description:
      'Modelos de geração de imagem (GPT Image 2, Nano Banana 2.1) e o custo em créditos de cada estilo.',
    requiredPermission: 'creativeadmin.packages',
  },
  {
    id: 'ca-analytics',
    label: 'Consumo & Estilos',
    icon: 'BarChart3',
    description: 'Créditos consumidos vs restantes, top geradores e estilos/modelos mais utilizados.',
    requiredPermission: 'creativeadmin.analytics',
  },
];

/**
 * Secções visíveis para um conjunto de permissões.
 *
 * Só `platform.all` ignora a filtragem. `platform.admin` (admin geral) NÃO é
 * tratado como super-poder aqui: se não tiver permissões `creativeadmin.*`,
 * não vê secção nenhuma deste painel.
 */
export function getVisibleCreativeAdminSections(
  permissions: Permission[]
): CreativeAdminSection[] {
  const isSuperUser = permissions.includes(SUPER_ADMIN_PERMISSION);
  return CREATIVE_ADMIN_SECTIONS.filter(
    (section) => isSuperUser || permissions.includes(section.requiredPermission)
  );
}

/**
 * Nível de acesso do utilizador ao painel do Creative AI.
 * Decide se a interface mostra apenas leitura ou também acções de escrita.
 */
export function getCreativeAdminAccessLevel(
  permissions: Permission[]
): 'NONE' | 'VIEWER' | 'MANAGER' {
  if (!canAccessCreativeAdmin(permissions)) return 'NONE';
  if (
    permissions.includes(SUPER_ADMIN_PERMISSION) ||
    permissions.includes('creativeadmin.credits') ||
    permissions.includes('creativeadmin.packages')
  ) {
    return 'MANAGER';
  }
  return 'VIEWER';
}
