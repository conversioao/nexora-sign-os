import { User, Organization, Membership, Permission, Role } from '../types/auth';
import { mockUsers, mockOrganizations, mockMemberships } from '../data/mockAuthData';
import { permissionService } from './permissionService';

export interface DemoProfileOption {
  key: string;
  label: string;
  sublabel: string;
  user: User;
  organization: Organization;
  membership: Membership;
  role: Role;
  iconName: string;
}

export const DEMO_PROFILES: DemoProfileOption[] = [
  {
    key: 'NEXORA_ADMIN',
    label: 'Nexora Admin (Global)',
    sublabel: 'Mário Silva • Nexora Angola',
    user: mockUsers[0], // usr-mario
    organization: mockOrganizations[0], // org-nexora
    membership: mockMemberships[0], // mem-mario-nexora
    role: 'NEXORA_ADMIN',
    iconName: 'ShieldCheck',
  },
  {
    key: 'NEXORA_OPERATOR',
    label: 'Operador Nexora NOC',
    sublabel: 'Nelson Rocha • Nexora Angola',
    user: mockUsers[5], // usr-nelson
    organization: mockOrganizations[0], // org-nexora
    membership: mockMemberships[2], // mem-nelson-nexora
    role: 'NEXORA_OPERATOR',
    iconName: 'Radio',
  },
  {
    key: 'CLIENT_OWNER',
    label: 'Cliente Proprietário (Owner)',
    sublabel: 'Carlos Manuel • Restaurante Talatona',
    user: mockUsers[1], // usr-carlos
    organization: mockOrganizations[1], // org-talatona
    membership: mockMemberships[3], // mem-carlos-talatona
    role: 'CLIENT_OWNER',
    iconName: 'Building',
  },
  {
    key: 'CLIENT_MANAGER',
    label: 'Cliente Gestor de Shopping',
    sublabel: 'Ana Silva • Shopping Demo Luanda',
    user: mockUsers[2], // usr-ana
    organization: mockOrganizations[2], // org-shopping
    membership: mockMemberships[5], // mem-ana-shopping
    role: 'CLIENT_MANAGER',
    iconName: 'Building2',
  },
  {
    key: 'CLIENT_EDITOR',
    label: 'Cliente Editor de Conteúdo',
    sublabel: 'Patrícia Gomes • Restaurante Talatona',
    user: mockUsers[6], // usr-patricia
    organization: mockOrganizations[1], // org-talatona
    membership: mockMemberships[4], // mem-patricia-talatona
    role: 'CLIENT_EDITOR',
    iconName: 'Film',
  },
  {
    key: 'ADVERTISER_OWNER',
    label: 'Anunciante / Agência',
    sublabel: 'João Costa • Publicidade AO Demo',
    user: mockUsers[3], // usr-joao
    organization: mockOrganizations[3], // org-publicidade
    membership: mockMemberships[7], // mem-joao-publicidade
    role: 'ADVERTISER_OWNER',
    iconName: 'Briefcase',
  },
  {
    key: 'TECHNICIAN',
    label: 'Técnico de Campo (Hardware)',
    sublabel: 'Miguel Santos • TechSignage Angola',
    user: mockUsers[4], // usr-miguel
    organization: mockOrganizations[5], // org-techpartner
    membership: mockMemberships[8] || mockMemberships[0], // mem-miguel-tech
    role: 'TECHNICIAN',
    iconName: 'Wrench',
  },
  {
    key: 'AFFILIATE',
    label: 'Afiliado & Embaixador Nexora',
    sublabel: 'Marcos Afonso • Afiliados & Parcerias',
    user: mockUsers.find(u => u.id === 'usr-afiliado') || mockUsers[0],
    organization: mockOrganizations.find(o => o.id === 'org-afiliado-demo') || mockOrganizations[0],
    membership: mockMemberships.find(m => m.id === 'mem-afiliado-demo') || mockMemberships[0],
    role: 'AFFILIATE',
    iconName: 'Users',
  },
];

export interface SessionState {
  currentUser: User | null;
  currentOrganization: Organization | null;
  currentMembership: Membership | null;
  userMemberships: Membership[];
  availableOrganizations: Organization[];
  permissions: Permission[];
  isAuthenticated: boolean;
  isDemoMode: boolean;
}

/**
 * Helper to build complete session state for a chosen user + org membership.
 */
export function buildSessionForProfile(profileKey: string): SessionState {
  const profile = DEMO_PROFILES.find((p) => p.key === profileKey) || DEMO_PROFILES[0];
  const userMemberships = mockMemberships.filter((m) => m.userId === profile.user.id);
  const availableOrganizations = mockOrganizations.filter((org) =>
    userMemberships.some((m) => m.organizationId === org.id)
  );

  const permissions = permissionService.getPermissionsForRole(profile.role);

  return {
    currentUser: { ...profile.user },
    currentOrganization: { ...profile.organization },
    currentMembership: { ...profile.membership },
    userMemberships,
    availableOrganizations,
    permissions,
    isAuthenticated: true,
    isDemoMode: true,
  };
}

export function buildSessionForUserAndOrg(userId: string, orgId: string): SessionState | null {
  const user = mockUsers.find((u) => u.id === userId);
  const organization = mockOrganizations.find((o) => o.id === orgId);
  const membership = mockMemberships.find((m) => m.userId === userId && m.organizationId === orgId);

  if (!user || !organization || !membership) return null;

  const userMemberships = mockMemberships.filter((m) => m.userId === userId);
  const availableOrganizations = mockOrganizations.filter((org) =>
    userMemberships.some((m) => m.organizationId === org.id)
  );

  const permissions = permissionService.getPermissionsForRole(membership.role);

  return {
    currentUser: { ...user },
    currentOrganization: { ...organization },
    currentMembership: { ...membership },
    userMemberships,
    availableOrganizations,
    permissions,
    isAuthenticated: true,
    isDemoMode: true,
  };
}
