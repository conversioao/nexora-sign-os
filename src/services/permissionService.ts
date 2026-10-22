import { Permission, Role, RoleDefinition, OrganizationType } from '../types/auth';

/**
 * Registry of all Roles with their associated granular permissions.
 * Follows the principle of least privilege while providing complete access for NEXORA_ADMIN.
 */
export const ROLES_REGISTRY: Record<Role, RoleDefinition> = {
  NEXORA_ADMIN: {
    id: 'NEXORA_ADMIN',
    name: 'Administrador Nexora',
    description: 'Acesso irrestrito a todas as organizações, configurações globais e infraestrutura.',
    organizationType: 'NEXORA',
    badgeColor: 'bg-[#2563EB]/15 text-[#60A5FA] border-[#2563EB]/40',
    permissions: [
      'platform.admin',
      'platform.all',
      'displays.read',
      'displays.create',
      'displays.update',
      'displays.delete',
      'displays.control',
      'displays.commercial.read',
      'displays.commercial.manage',
      'content.read',
      'content.create',
      'content.update',
      'content.delete',
      'playlists.read',
      'playlists.create',
      'playlists.update',
      'playlists.delete',
      'schedules.read',
      'schedules.create',
      'schedules.update',
      'schedules.delete',
      'users.read',
      'users.manage',
      'organization.read',
      'organization.update',
      'billing.read',
      'billing.manage',
      'contracts.read',
      'contracts.create',
      'contracts.manage',
      'contracts.approve',
      'contracts.sign',
      'contracts.cancel',
      'templates.read',
      'templates.manage',
      'campaigns.read',
      'campaigns.create',
      'campaigns.manage',
      'campaigns.approve',
      'marketplace.view',
      'inventory.read',
      'inventory.manage',
      'inventory.monetize',
      'creative.review',
      'customers.read',
      'customers.manage',
      'advertisers.read',
      'advertisers.manage',
      'contacts.read',
      'contacts.manage',
      'analytics.read',
      'aicredits.read',
      'aicredits.manage',
      // Categoria: Admin do Nexora Creative AI (acesso total ao ecossistema)
      'creativeadmin.access',
      'creativeadmin.credits',
      'creativeadmin.packages',
      'creativeadmin.analytics',
      'maintenance.read',
      'maintenance.manage',
      'plans.read',
      'plans.manage',
      'subscriptions.read',
      'subscriptions.manage',
      'addons.read',
      'addons.manage',
      'subscription.usage.read',
      'affiliates.admin',
      'affiliate.dashboard',
      'affiliate.referrals',
      'affiliate.commissions',
      'affiliate.payouts',
      'affiliate.manage',
    ],
  },
  NEXORA_OPERATOR: {
    id: 'NEXORA_OPERATOR',
    name: 'Operador de Rede Nexora',
    description: 'Gestão operacional de displays, aprovação de conteúdos, playlists e suporte a clientes.',
    organizationType: 'NEXORA',
    badgeColor: 'bg-[#0284C7]/15 text-[#38BDF8] border-[#0284C7]/40',
    permissions: [
      'displays.read',
      'displays.create',
      'displays.update',
      'displays.control',
      'displays.commercial.read',
      'displays.commercial.manage',
      'content.read',
      'content.create',
      'content.update',
      'playlists.read',
      'playlists.create',
      'playlists.update',
      'schedules.read',
      'schedules.create',
      'schedules.update',
      'users.read',
      'organization.read',
      'campaigns.read',
      'campaigns.approve',
      'marketplace.view',
      'inventory.read',
      'inventory.manage',
      'creative.review',
      'customers.read',
      'advertisers.read',
      'contacts.read',
      'contacts.manage',
      'analytics.read',
      'aicredits.read',
      // Categoria: Operador do Creative AI â€” entra no painel mas só observa
      // (sem aprovar créditos, sem editar pacotes).
      'creativeadmin.access',
      'creativeadmin.analytics',
      'maintenance.read',
      'maintenance.manage',
      'plans.read',
      'subscriptions.read',
      'addons.read',
      'subscription.usage.read',
    ],
  },
  CLIENT_OWNER: {
    id: 'CLIENT_OWNER',
    name: 'Parceiro Proprietário (Owner)',
    description: 'Acesso às informações dos displays associados, comissões, mídias do parceiro e contratos.',
    organizationType: 'CLIENT',
    badgeColor: 'bg-[#06B6D4]/15 text-[#22D3EE] border-[#06B6D4]/40',
    permissions: [
      'displays.read',
      'displays.update',
      'displays.control',
      'inventory.monetize',
      'content.read',
      'content.create',
      'content.update',
      'content.delete',
      'playlists.read',
      // O parceiro gere as playlists dos SEUS displays â€” sem `create` não conseguia
      // criar nenhuma sequência (só editar as que já existissem).
      'playlists.create',
      'playlists.update',
      // Créditos do Creative AI: sem esta permissão o painel de créditos (e os
      // pacotes para recarga) ficava fechado ao parceiro.
      'aicredits.read',
      'organization.read',
      'organization.update',
      'contracts.read',
      'contracts.sign',
      'analytics.read',
    ],
  },
  CLIENT_MANAGER: {
    id: 'CLIENT_MANAGER',
    name: 'Gestor do Parceiro (Manager)',
    description: 'Gestão de mídias e acompanhamento de displays do parceiro.',
    organizationType: 'CLIENT',
    badgeColor: 'bg-[#0EA5E9]/15 text-[#7DD3FC] border-[#0EA5E9]/40',
    permissions: [
      'displays.read',
      'content.read',
      'content.create',
      'content.update',
      'playlists.read',
      // Gestor do parceiro: cria e ajusta sequências e consulta os créditos de IA.
      'playlists.create',
      'aicredits.read',
      'organization.read',
      'analytics.read',
    ],
  },
  CLIENT_EDITOR: {
    id: 'CLIENT_EDITOR',
    name: 'Editor de Conteúdo',
    description: 'Upload e criação de mídias e montagem de sequências em playlists pré-aprovadas.',
    organizationType: 'CLIENT',
    badgeColor: 'bg-[#8B5CF6]/15 text-[#C4B5FD] border-[#8B5CF6]/40',
    permissions: [
      'displays.read',
      'content.read',
      'content.create',
      'content.update',
      'playlists.read',
      'playlists.create',
      'playlists.update',
      'schedules.read',
      'organization.read',
    ],
  },
  ADVERTISER_OWNER: {
    id: 'ADVERTISER_OWNER',
    name: 'Proprietário Anunciante',
    description: 'Gestão de campanhas publicitárias, contratação de pacotes de mídia e histórico financeiro.',
    organizationType: 'ADVERTISER',
    badgeColor: 'bg-[#EC4899]/15 text-[#F472B6] border-[#EC4899]/40',
    permissions: [
      'marketplace.view',
      'campaigns.read',
      'campaigns.create',
      'campaigns.manage',
      'content.read',
      'content.create',
      'content.update',
      'content.delete',
      'billing.read',
      'contracts.read',
      'contracts.sign',
      'analytics.read',
      'plans.read',
      // Créditos do Creative AI: o anunciante compra créditos para gerar
      // criativos, por isso tem de ver o saldo e os pacotes de recarga.
      'aicredits.read',
      'organization.read',
      'organization.update',
    ],
  },
  ADVERTISER_MANAGER: {
    id: 'ADVERTISER_MANAGER',
    name: 'Gestor de Mídia & Campanhas',
    description: 'Criação e acompanhamento de criativos e métricas de campanhas publicitárias.',
    organizationType: 'ADVERTISER',
    badgeColor: 'bg-[#F43F5E]/15 text-[#FDA4AF] border-[#F43F5E]/40',
    permissions: [
      'marketplace.view',
      'campaigns.read',
      'campaigns.create',
      'campaigns.manage',
      'content.read',
      'content.create',
      'content.update',
      'analytics.read',
      'plans.read',
      'aicredits.read',
      'organization.read',
    ],
  },
  TECHNICIAN: {
    id: 'TECHNICIAN',
    name: 'Técnico de Campo & Manutenção',
    description: 'Diagnóstico remoto de hardware, reinicialização de players e telemetria de rede.',
    organizationType: 'PARTNER',
    badgeColor: 'bg-[#F59E0B]/15 text-[#FBBF24] border-[#F59E0B]/40',
    permissions: [
      'displays.read',
      'displays.control',
      'maintenance.read',
      'maintenance.manage',
      'organization.read',
    ],
  },
  DISPLAY_OWNER: {
    id: 'DISPLAY_OWNER',
    name: 'Cliente Proprietário de Display',
    description: 'Proprietário de displays e totens Nexora com gestão de telas, criação via IA e subscrições.',
    organizationType: 'DISPLAY_OWNER',
    badgeColor: 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/40',
    permissions: [
      'displays.read',
      'displays.create',
      'displays.update',
      'displays.delete',
      'displays.control',
      'content.read',
      'content.create',
      'content.update',
      'content.delete',
      'playlists.read',
      'playlists.create',
      'playlists.update',
      'playlists.delete',
      'schedules.read',
      'schedules.create',
      'schedules.update',
      'schedules.delete',
      'devices.read',
      'devices.manage',
      'devices.command',
      'devices.register',
      'aicredits.read',
      'billing.read',
      'contracts.read',
      'plans.read',
      'subscriptions.read',
      'subscription.usage.read',
      'organization.read',
      'organization.update',
      'analytics.read',
    ],
  },
  AFFILIATE: {
    id: 'AFFILIATE',
    name: 'Afiliado Nexora Parcerias',
    description: 'Gestão de afilhados, acompanhamento de lucros recorrentes, comissões e links de indicação.',
    organizationType: 'AFFILIATE',
    badgeColor: 'bg-[#10B981]/15 text-[#34D399] border-[#10B981]/40',
    permissions: [
      'affiliate.dashboard',
      'affiliate.referrals',
      'affiliate.commissions',
      'affiliate.payouts',
      'organization.read',
      'organization.update',
    ],
  },
};

export const ORGANIZATION_TYPE_LABELS: Record<OrganizationType, { label: string; badge: string }> = {
  NEXORA: {
    label: 'Nexora Interna (Plataforma)',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  CLIENT: {
    label: 'Parceiro de Espaço (Ponto Comercial)',
    badge: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  DISPLAY_OWNER: {
    label: 'Cliente Proprietário de Display (Totens/Telas)',
    badge: 'bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/30',
  },
  ADVERTISER: {
    label: 'Organização Anunciante (Mídia & Marcas)',
    badge: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  },
  PARTNER: {
    label: 'Parceiro Técnico / Integração',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  AFFILIATE: {
    label: 'Afiliado & Embaixador Comercial',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
};

export const ROLE_LABELS: Record<Role, string> = {
  NEXORA_ADMIN: 'Admin Global',
  NEXORA_OPERATOR: 'Operador Nexora',
  CLIENT_OWNER: 'Proprietário (Owner)',
  CLIENT_MANAGER: 'Gestor de Espaços',
  CLIENT_EDITOR: 'Editor de Conteúdo',
  ADVERTISER_OWNER: 'Proprietário Anunciante',
  ADVERTISER_MANAGER: 'Gestor de Mídia',
  TECHNICIAN: 'Técnico de Campo',
  DISPLAY_OWNER: 'Cliente Proprietário de Display',
  AFFILIATE: 'Afiliado & Embaixador Nexora',
};

/**
 * Central Permission Service
 * All permission checking is routed here instead of inline role checks.
 */
export const permissionService = {
  /**
   * Checks if user has a specific permission.
   * If user has 'platform.admin' or 'platform.all', it grants full access.
   */
  hasPermission(userPermissions: Permission[], requiredPermission: Permission): boolean {
    if (!userPermissions || userPermissions.length === 0) return false;
    if (userPermissions.includes('platform.admin') || userPermissions.includes('platform.all')) {
      return true;
    }
    return userPermissions.includes(requiredPermission);
  },

  /**
   * Checks if user has at least one of the provided permissions.
   */
  hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    if (!userPermissions || userPermissions.length === 0) return false;
    if (userPermissions.includes('platform.admin') || userPermissions.includes('platform.all')) {
      return true;
    }
    return requiredPermissions.some((perm) => userPermissions.includes(perm));
  },

  /**
   * Checks if user has all of the provided permissions.
   */
  hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    if (!userPermissions || userPermissions.length === 0) return false;
    if (userPermissions.includes('platform.admin') || userPermissions.includes('platform.all')) {
      return true;
    }
    return requiredPermissions.every((perm) => userPermissions.includes(perm));
  },

  /**
   * Retrieves the permissions array for a specific role.
   */
  getPermissionsForRole(role: Role): Permission[] {
    const roleDef = ROLES_REGISTRY[role];
    return roleDef ? [...roleDef.permissions] : [];
  },

  /**
   * Retrieves definition info for a specific role.
   */
  getRoleDefinition(role: Role): RoleDefinition {
    return ROLES_REGISTRY[role] || ROLES_REGISTRY.CLIENT_EDITOR;
  },

  /**
   * Returns available roles that can be assigned within a specific organization type.
   */
  getRolesForOrganizationType(type: OrganizationType): RoleDefinition[] {
    return Object.values(ROLES_REGISTRY).filter((r) => r.organizationType === type);
  },
};
