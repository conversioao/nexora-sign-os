import { Permission, Role } from './auth';

export type UserRole = 'ADMIN' | 'CLIENT' | 'ADVERTISER' | 'TECH';

export interface NavItem {
  id: string;
  label: string;
  iconName: string;
  path: string;
  badge?: string | number;
  badgeVariant?: 'blue' | 'cyan' | 'purple' | 'magenta' | 'neutral';
  roles?: UserRole[];
  requiredPermissions?: Permission[];
  disabled?: boolean;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  roles?: UserRole[];
  requiredPermissions?: Permission[];
}
