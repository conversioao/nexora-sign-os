import {
  LayoutDashboard,
  Monitor,
  Film,
  ListVideo,
  Megaphone,
  Building2,
  Briefcase,
  FileText,
  CreditCard,
  Sparkles,
  Wrench,
  Settings,
  Users,
  Building,
  Layers,
  ShieldCheck,
  BookOpen,
  Store,
  TrendingUp,
  Image,
  Video,
  FolderHeart,
  Coins,
  LucideIcon,
  Camera,
  Crown,
  Link2,
  Wallet,
  Percent,
  Network,
} from 'lucide-react';
import { UserRole } from '../../types/navigation';
import { Permission } from '../../types/auth';

export interface ExtendedNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: string | number;
  badgeVariant?: 'blue' | 'cyan' | 'purple' | 'magenta' | 'neutral';
  roles?: UserRole[];
  requiredPermissions?: Permission[];
  disabled?: boolean;
}

export interface ExtendedNavGroup {
  id: string;
  label: string;
  items: ExtendedNavItem[];
  roles?: UserRole[];
  requiredPermissions?: Permission[];
}

export const navigationGroups: ExtendedNavGroup[] = [

  {
    id: 'studio',
    label: 'Nexora Studio IA',
    items: [
      {
        id: 'studio-dash',
        label: 'Dashboard',
        icon: Sparkles,
        path: '/studio',
      },
      {
        id: 'studio-image',
        label: 'Gerar Imagem',
        icon: Image,
        path: '/studio/image',
      },
      {
        id: 'studio-video',
        label: 'Gerar Vídeo',
        icon: Video,
        path: '/studio/video',
      },
      {
        id: 'studio-library',
        label: 'Biblioteca',
        icon: FolderHeart,
        path: '/studio/library',
      },
      {
        id: 'studio-credits',
        label: 'Créditos',
        icon: Coins,
        path: '/studio/credits',
      }
    ],
  },

  {
    id: 'core',
    label: 'Principal',
    items: [
      {
        id: 'overview',
        label: 'Visão Geral',
        icon: LayoutDashboard,
        path: '/overview',
        requiredPermissions: ['displays.read', 'content.read', 'analytics.read', 'platform.admin'],
      },
      {
        id: 'my-subscription',
        label: 'Minha Subscrição (Telas & Planos)',
        icon: Crown,
        path: '/my-subscription',
        requiredPermissions: ['subscription.usage.read', 'subscriptions.read', 'displays.read'],
      },
      {
        id: 'displays',
        label: 'Meus Displays',
        icon: Monitor,
        path: '/displays',
        requiredPermissions: ['displays.read'],
      },
      {
        id: 'content',
        label: 'Biblioteca de Mídia',
        icon: Film,
        path: '/content',
        
        
        requiredPermissions: ['content.read'],
      },
      {
        id: 'playlists',
        label: 'Playlists',
        icon: ListVideo,
        path: '/playlists',
        
        
        requiredPermissions: ['playlists.read'],
      },
      {
        id: 'campaigns',
        label: 'Campanhas',
        icon: Megaphone,
        path: '/campaigns',
        
        
        requiredPermissions: ['campaigns.read'],
      },
      {
        id: 'marketplace',
        label: 'Marketplace de Mídia',
        icon: Store,
        path: '/marketplace',
        requiredPermissions: ['marketplace.view'],
      },
      {
        id: 'inventory',
        label: 'Inventário & Monetização',
        icon: TrendingUp,
        path: '/inventory',
        requiredPermissions: ['inventory.read'],
      },
      {
        id: 'commissions',
        label: 'Minhas Comissões',
        icon: Coins,
        path: '/commissions',
        requiredPermissions: ['inventory.monetize'],
      },
    ],
  },
  {
    id: 'management',
    label: 'Gestão & Negócios',
    items: [
      {
        id: 'clients',
        label: 'Clientes',
        icon: Building2,
        path: '/clients',
        requiredPermissions: ['customers.read', 'platform.admin'],
      },
      {
        id: 'advertisers',
        label: 'Anunciantes',
        icon: Briefcase,
        path: '/advertisers',
        requiredPermissions: ['advertisers.read', 'platform.admin'],
      },
      {
        id: 'partners',
        label: 'Parceiros (Espaços & Totens)',
        icon: Store,
        path: '/partners',
        requiredPermissions: ['customers.read', 'platform.admin'],
      },
      {
        id: 'plans',
        label: 'Pacotes de Planos',
        icon: Layers,
        path: '/plans',
        requiredPermissions: ['plans.read', 'platform.admin'],
      },
      {
        id: 'ai-kiosk',
        label: 'Painel Kiosk Agentes IA',
        icon: Sparkles,
        path: '/ai-kiosk',
        requiredPermissions: ['platform.admin'],
      },
      {
        id: 'payouts',
        label: 'Contas a Pagar (Proprietários)',
        icon: CreditCard,
        path: '/admin/payouts',
        requiredPermissions: ['platform.admin'],
      },
      {
        id: 'admin-affiliates',
        label: 'Afiliados & Recorrência',
        icon: Percent,
        path: '/admin/affiliates',
        badge: 'Recorrência',
        badgeVariant: 'cyan',
        requiredPermissions: ['affiliates.admin', 'platform.admin'],
      },
      {
        id: 'contracts',
        label: 'Contratos',
        icon: FileText,
        path: '/contracts',
        requiredPermissions: ['contracts.read'],
      },
      {
        id: 'financial',
        label: 'Financeiro',
        icon: CreditCard,
        path: '/financial',
        requiredPermissions: ['billing.read'],
      },
    ],
  },
  {
    id: 'affiliate-program',
    label: 'Programa de Afiliados',
    items: [
      {
        id: 'affiliate-network',
        label: 'Minha Rede',
        icon: Network,
        path: '/affiliates/network',
        requiredPermissions: ['affiliate.dashboard'],
      },
      {
        id: 'affiliate-commissions',
        label: 'Comissões Recorrentes',
        icon: Coins,
        path: '/affiliates/commissions',
        requiredPermissions: ['affiliate.commissions'],
      },
      {
        id: 'affiliate-links',
        label: 'Links de Divulgação',
        icon: Link2,
        path: '/affiliates/links',
        requiredPermissions: ['affiliate.dashboard'],
      },
      {
        id: 'affiliate-payouts',
        label: 'Carteira & Saques',
        icon: Wallet,
        path: '/affiliates/payouts',
        requiredPermissions: ['affiliate.payouts'],
      },
    ],
  },
  {
    id: 'organization-mgmt',
    label: 'Organização & Acesso',
    items: [
      {
        id: 'org-settings',
        label: 'Dados da Organização',
        icon: Building,
        path: '/settings/organization',
        requiredPermissions: ['organization.read'],
      },
      {
        id: 'users-mgmt',
        label: 'Gestão de Utilizadores',
        icon: Users,
        path: '/settings/users',
        requiredPermissions: ['users.manage'],
      },
    ],
  },
  {
    id: 'innovation-ops',
    label: 'Inovação & Operações',
    items: [
      {
        id: 'devices',
        label: 'Gestão de Devices',
        icon: Monitor,
        path: '/devices',
        requiredPermissions: ['devices.read'],
      },

      {
        id: 'ai-credits',
        label: 'IA & Créditos',
        icon: Sparkles,
        path: '/ai-credits',
        
        
        requiredPermissions: ['aicredits.read'],
      },
      {
        id: 'maintenance',
        label: 'Manutenção & Rede',
        icon: Wrench,
        path: '/maintenance',
        
        
        requiredPermissions: ['maintenance.read'],
      },
      {
        id: 'settings',
        label: 'Configurações',
        icon: Settings,
        path: '/settings',
        requiredPermissions: ['organization.read', 'platform.admin'],
      },
    ],
  },
];


