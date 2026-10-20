import React from 'react';
import { useSession } from '../../../context/SessionContext';
import { Permission } from '../../../types/auth';
import { AccessDeniedPage } from '../pages/AccessDeniedPage';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  onNavigateHome: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredPermissions,
  onNavigateHome,
}) => {
  const { isAuthenticated, hasPermission, hasAnyPermission } = useSession();

  if (!isAuthenticated) {
    return (
      <AccessDeniedPage
        requiredPermission={requiredPermission}
        requiredPermissions={requiredPermissions}
        onBackToDashboard={onNavigateHome}
      />
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <AccessDeniedPage
        requiredPermission={requiredPermission}
        onBackToDashboard={onNavigateHome}
      />
    );
  }

  if (requiredPermissions && requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return (
      <AccessDeniedPage
        requiredPermissions={requiredPermissions}
        onBackToDashboard={onNavigateHome}
      />
    );
  }

  return <>{children}</>;
};
