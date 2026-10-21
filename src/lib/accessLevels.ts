/**
 * Níveis de acesso do Nexora OS.
 *
 * Um "nível de acesso" é um nome + um conjunto de GRUPOS de funcionalidades.
 * Em vez de obrigar o administrador a escolher 100 permissões soltas, escolhe
 * áreas compreensíveis — «só a Gestão de Negócios», «só o painel do Creative
 * AI» — e o mapeamento para permissões granulares vive aqui, num único sítio.
 *
 * Este módulo é deliberadamente PURO (sem React, sem base de dados) porque é
 * usado pelos dois lados:
 *   • o SERVIDOR resolve as permissões de um nível no momento do login;
 *   • o CLIENTE mostra as caixas de seleção e a pré-visualização do que cada
 *     nível concede.
 * Assim o ecrã nunca pode discordar daquilo que o servidor aplica.
 *
 * As permissões em si continuam a ser o único formato que o resto do sistema
 * conhece (`permissionService.hasPermission`). Nada muda aí.
 */
import { Permission } from '../types/auth';

export interface AccessGroup {
  id: string;
  label: string;
  description: string;
  permissions: Permission[];
  /** Painel a que o grupo pertence, para agrupar visualmente. */
  panel: 'SIGN' | 'CREATIVE_AI' | 'PLATFORM';
}

/**
 * Grupos de funcionalidades. Os identificadores são estáveis: são gravados na
 * base de dados dentro do nível de acesso, por isso mudar um id parte os níveis
 * já criados.
 */
export const ACCESS_GROUPS: AccessGroup[] = [
  // ─── Nexora Sign ───────────────────────────────────────────────────────────
  {
    id: 'sign.core',
    label: 'Operação de Displays',
    description: 'Displays, biblioteca de mídia, playlists e programação.',
    panel: 'SIGN',
    permissions: [
      'displays.read', 'displays.create', 'displays.update', 'displays.delete', 'displays.control',
      'content.read', 'content.create', 'content.update', 'content.delete',
      'playlists.read', 'playlists.create', 'playlists.update', 'playlists.delete',
      'schedules.read', 'schedules.create', 'schedules.update', 'schedules.delete',
    ],
  },
  {
    id: 'sign.campaigns',
    label: 'Campanhas & Marketplace',
    description: 'Campanhas publicitárias, aprovações, inventário e comissões.',
    panel: 'SIGN',
    permissions: [
      'campaigns.read', 'campaigns.create', 'campaigns.manage', 'campaigns.approve',
      'marketplace.view',
      'inventory.read', 'inventory.manage', 'inventory.monetize',
      'creative.review',
    ],
  },
  {
    id: 'sign.business',
    label: 'Gestão de Negócios',
    description:
      'Clientes, anunciantes, parceiros, pacotes de anúncios, contratos e financeiro. É o grupo típico de um funcionário comercial ou administrativo.',
    panel: 'SIGN',
    permissions: [
      'customers.read', 'customers.manage',
      'advertisers.read', 'advertisers.manage',
      'contacts.read', 'contacts.manage',
      'plans.read', 'plans.manage',
      'subscriptions.read', 'subscriptions.manage',
      'addons.read', 'addons.manage',
      'subscription.usage.read',
      'contracts.read', 'contracts.create', 'contracts.manage', 'contracts.approve',
      'contracts.sign', 'contracts.cancel',
      'templates.read', 'templates.manage',
      'billing.read', 'billing.manage',
      'analytics.read',
    ],
  },
  {
    id: 'sign.organization',
    label: 'Organização & Utilizadores',
    description: 'Dados da organização e gestão de utilizadores e permissões.',
    panel: 'SIGN',
    permissions: ['organization.read', 'organization.update', 'users.read', 'users.manage'],
  },
  {
    id: 'sign.operations',
    label: 'Inovação & Operações',
    description: 'Gestão de devices, manutenção de rede e configurações da plataforma.',
    panel: 'SIGN',
    permissions: [
      'devices.read', 'devices.manage', 'devices.command', 'devices.register',
      'devices.telemetry.read', 'devices.diagnostics', 'devices.update',
      'device_groups.manage', 'player_releases.manage',
      'maintenance.read', 'maintenance.manage',
      'aicredits.read',
    ],
  },

  // ─── Nexora Creative AI ────────────────────────────────────────────────────
  {
    id: 'creative.admin',
    label: 'Painel Admin do Creative AI',
    description:
      'Acesso ao painel de administração do ecossistema de IA generativa (visão geral, utilizadores e analítica).',
    panel: 'CREATIVE_AI',
    permissions: ['creativeadmin.access', 'creativeadmin.analytics'],
  },
  {
    id: 'creative.credits',
    label: 'Créditos & Aprovações (Creative AI)',
    description: 'Gerir saldos, aprovar recargas e ajustar créditos do Creative AI.',
    panel: 'CREATIVE_AI',
    permissions: ['creativeadmin.credits', 'aicredits.read', 'aicredits.manage'],
  },
  {
    id: 'creative.packages',
    label: 'Pacotes de Créditos (Creative AI)',
    description: 'Criar, editar e arquivar os pacotes vendidos aos clientes.',
    panel: 'CREATIVE_AI',
    permissions: ['creativeadmin.packages'],
  },

  // ─── Plataforma ────────────────────────────────────────────────────────────
  {
    id: 'platform.root',
    label: 'Administração da Plataforma',
    description:
      'Criação de contas e níveis de acesso, e acesso ao painel de administradores. Concede poder sobre todos os outros níveis — atribuir com cuidado.',
    panel: 'PLATFORM',
    permissions: ['platform.admin', 'platform.all'],
  },
];

export const ACCESS_GROUP_BY_ID: Record<string, AccessGroup> = Object.fromEntries(
  ACCESS_GROUPS.map((g) => [g.id, g])
);

export const PANEL_LABELS: Record<AccessGroup['panel'], string> = {
  SIGN: 'Nexora Sign',
  CREATIVE_AI: 'Nexora Creative AI',
  PLATFORM: 'Plataforma',
};

/** Todas as permissões conhecidas, na ordem em que os grupos as declaram. */
export function allKnownPermissions(): Permission[] {
  const seen = new Set<Permission>();
  ACCESS_GROUPS.forEach((g) => g.permissions.forEach((p) => seen.add(p)));
  return Array.from(seen);
}

/** Permissões resultantes de um conjunto de grupos (união, sem repetições). */
export function permissionsForGroups(groupIds: string[]): Permission[] {
  const result = new Set<Permission>();
  (groupIds || []).forEach((id) => {
    const group = ACCESS_GROUP_BY_ID[id];
    if (group) group.permissions.forEach((p) => result.add(p));
  });
  return Array.from(result);
}

/** Grupos que contêm uma dada permissão (para reconstruir a UI a partir de um nível). */
export function groupsContainingPermission(permission: Permission): string[] {
  return ACCESS_GROUPS.filter((g) => g.permissions.includes(permission)).map((g) => g.id);
}

/**
 * Níveis pré-definidos, semeados na base de dados.
 * Cobrem exactamente os casos pedidos: acesso total, só gestão de negócios e só
 * o painel do Creative AI. O administrador pode criar outros combinando grupos.
 */
export interface BuiltInAccessLevel {
  id: string;
  name: string;
  description: string;
  groups: string[];
  isSystem: boolean;
}

export const BUILT_IN_ACCESS_LEVELS: BuiltInAccessLevel[] = [
  {
    id: 'lvl-super-admin',
    name: 'Administrador Geral',
    description:
      'Acesso total a tudo o que existe: Nexora Sign, Creative AI e administração da plataforma. É o nível de quem gere o sistema.',
    groups: ACCESS_GROUPS.map((g) => g.id),
    isSystem: true,
  },
  {
    id: 'lvl-business-manager',
    name: 'Gestor de Negócios',
    description:
      'Acesso ao painel do Nexora Sign apenas na área comercial: clientes, anunciantes, parceiros, pacotes, contratos e financeiro. Sem acesso a displays, conteúdos ou programação.',
    groups: ['sign.business', 'sign.organization'],
    isSystem: true,
  },
  {
    id: 'lvl-creative-admin',
    name: 'Admin do Creative AI',
    description:
      'Acesso exclusivo ao painel de administração do Nexora Creative AI — créditos, aprovações, pacotes e analítica de geração. Sem acesso ao Nexora Sign.',
    groups: ['creative.admin', 'creative.credits', 'creative.packages'],
    isSystem: true,
  },
  {
    id: 'lvl-creative-viewer',
    name: 'Observador do Creative AI',
    description:
      'Vê o painel do Creative AI e a sua analítica, mas não aprova recargas nem altera pacotes.',
    groups: ['creative.admin'],
    isSystem: true,
  },
  {
    id: 'lvl-operations',
    name: 'Operador de Rede',
    description:
      'Operação diária do Nexora Sign: displays, conteúdos, playlists, programação e manutenção de rede. Sem área comercial nem financeira.',
    groups: ['sign.core', 'sign.operations'],
    isSystem: true,
  },
];

/**
 * Resolve as permissões de um nível.
 * Se o id não corresponder a nenhum nível conhecido, devolve `null` para que
 * quem chama decida (o servidor cai no registo de papéis antigo).
 */
export function permissionsForBuiltInLevel(levelId: string): Permission[] | null {
  const level = BUILT_IN_ACCESS_LEVELS.find((l) => l.id === levelId);
  return level ? permissionsForGroups(level.groups) : null;
}
