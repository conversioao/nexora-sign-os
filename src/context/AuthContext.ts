import { useSession } from './SessionContext';

export function useAuth() {
  const session = useSession();

  const isNexoraAdmin =
    session.currentRole === 'NEXORA_ADMIN' ||
    session.currentRole === 'NEXORA_OPERATOR' ||
    session.currentOrganization?.type === 'NEXORA';

  const isClient =
    session.currentRole === 'CLIENT_OWNER' ||
    session.currentRole === 'CLIENT_MANAGER' ||
    session.currentRole === 'CLIENT_EDITOR' ||
    session.currentOrganization?.type === 'CLIENT';

  const isAdvertiser =
    session.currentRole === 'ADVERTISER_OWNER' ||
    session.currentRole === 'ADVERTISER_MANAGER' ||
    session.currentOrganization?.type === 'ADVERTISER';

  const can = (permission: string) => {
    return session.hasPermission(permission as any);
  };

  return {
    ...session,
    user: session.currentUser,
    isNexoraAdmin,
    isClient,
    isAdvertiser,
    can,
  };
}
