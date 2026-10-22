import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Radio,
  X,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import { Tooltip } from '../ui/Tooltip';
import { Badge } from '../ui/Badge';
import { navigationGroups } from './navigationConfig';
import { useSession } from '../../context/SessionContext';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  activePlatform?: 'creative-ai' | 'sign' | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  activeRoute,
  onRouteChange,
  isMobileOpen,
  onCloseMobile,
  activePlatform,
}) => {
  const { hasAnyPermission, hasPermission, currentOrganization, currentMembership, currentRole } = useSession();

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[#050914]/85 backdrop-blur-md z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#070B18] border-r border-white/[0.06] transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-[76px]' : 'w-[264px]'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-white/[0.06] flex-shrink-0 bg-[#070B18]/50">
          <div className="flex items-center overflow-hidden py-1">
            {isCollapsed ? (
              <Logo variant="iconOnly" size="md" />
            ) : (
              <div className="flex flex-col">
                <Logo variant="compact" size="md" />
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-[#64748B] hover:text-white hover:bg-white/[0.06] border border-white/[0.06] transition-colors cursor-pointer"
            aria-label={isCollapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[#64748B] hover:text-white hover:bg-white/5 cursor-pointer"
            aria-label="Fechar Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-6 nexora-scrollbar">
          {navigationGroups
            .filter((group) => {
              if (activePlatform === 'creative-ai') {
                return group.id === 'studio';
              } else {
                return group.id !== 'studio';
              }
            })
            .map((group) => {
              // Check group level permissions if defined
              if (group.requiredPermissions && !hasAnyPermission(group.requiredPermissions)) {
                return null;
              }

              // Filter items accessible by the current permissions & roles
              const isNexoraAdmin = currentRole === 'NEXORA_ADMIN' || currentMembership?.role === 'NEXORA_ADMIN' || currentOrganization?.type === 'NEXORA';
              const isAffiliate = currentRole === 'AFFILIATE' || currentMembership?.role === 'AFFILIATE' || currentOrganization?.type === 'AFFILIATE';
              const isAdvertiser = !isAffiliate && (currentOrganization?.type === 'ADVERTISER' || currentMembership?.role === 'ADVERTISER_OWNER' || currentMembership?.role === 'ADVERTISER_MANAGER');
              const isPartner = !isAffiliate && (currentOrganization?.type === 'CLIENT' || currentMembership?.role === 'CLIENT_OWNER' || currentMembership?.role === 'CLIENT_MANAGER');
              const isDisplayOwner = !isAffiliate && (currentOrganization?.type === 'DISPLAY_OWNER' || currentMembership?.role === 'DISPLAY_OWNER');
              const isClient = !isAffiliate && (isPartner || isDisplayOwner || (!isNexoraAdmin && !isAdvertiser));

              // Se o utilizador for AFILIADO:
              if (isAffiliate) {
                if (group.id !== 'core' && group.id !== 'affiliate-program' && group.id !== 'organization-mgmt') {
                  return null;
                }
              } else if (!isNexoraAdmin) {
                // Não-afiliados (clientes e anunciantes) não vêem o menu de afiliados
                if (group.id === 'affiliate-program') {
                  return null;
                }
              }

              const accessibleItems = group.items.filter((item) => {
                if (isAffiliate) {
                  return (
                    item.id === 'overview' ||
                    item.id === 'affiliate-network' ||
                    item.id === 'affiliate-commissions' ||
                    item.id === 'affiliate-links' ||
                    item.id === 'affiliate-payouts' ||
                    item.id === 'org-settings'
                  );
                }

                if (item.id === 'admin-affiliates') {
                  return isNexoraAdmin;
                }

                if (isAdvertiser && (item.id === 'partners' || item.id === 'plans' || item.id === 'packages')) {
                  return false;
                }

                // Cliente NÃO deve ver "Pacotes de Anúncios" e nem "Gestão de Devices"
                if (isClient && (item.id === 'plans' || item.id === 'devices')) {
                  return false;
                }

                // Cliente DEVE ver seus Displays e Minha Subscrição
                if (item.id === 'displays' || item.id === 'my-subscription') {
                  return true;
                }

                if (item.id === 'commissions') {
                  return isPartner;
                }
                if (item.requiredPermissions && item.requiredPermissions.length > 0) {
                  return hasAnyPermission(item.requiredPermissions);
                }
                return true;
              });

              if (accessibleItems.length === 0) return null;

              return (
                <div key={group.id} className="space-y-1.5">
                  {!isCollapsed && (
                    <h4 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#475569] font-display select-none">
                      {group.label}
                    </h4>
                  )}

                  {accessibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeRoute === item.id;

                    const buttonContent = (
                      <button
                        key={item.id}
                        type="button"
                        disabled={item.disabled}
                        onClick={() => {
                          onRouteChange(item.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 cursor-pointer select-none relative group ${
                          isActive
                            ? 'text-white font-semibold'
                            : 'text-[#94A3B8] hover:text-white hover:bg-white/[0.04] font-medium'
                        }`}
                        style={
                          isActive
                            ? activePlatform === 'creative-ai'
                              ? {
                                  background: 'linear-gradient(90deg, #FF6B00 0%, #FF8A00 100%)',
                                  boxShadow: '0 0 20px rgba(255, 107, 0, 0.45)',
                                  color: '#020617',
                                }
                              : {
                                  background: 'linear-gradient(90deg, #1677FF 0%, #3B82F6 40%, #6D3DF5 100%)',
                                  boxShadow: '0 0 20px rgba(22, 119, 255, 0.45)',
                                }
                            : {}
                        }
                      >
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            isActive
                              ? activePlatform === 'creative-ai'
                                ? 'text-slate-950 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                                : 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                              : 'text-[#64748B] group-hover:text-[#38BDF8]'
                          }`}
                        />

                        {!isCollapsed && (
                          <span className="truncate flex-1 text-left tracking-wide">{item.label}</span>
                        )}

                        {!isCollapsed && item.badge && (
                          <Badge
                            variant={item.badgeVariant || 'neutral'}
                            size="sm"
                            className="ml-auto flex-shrink-0"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </button>
                    );

                    if (isCollapsed) {
                      return (
                        <Tooltip key={item.id} content={item.label} position="right" className="w-full">
                          {buttonContent}
                        </Tooltip>
                      );
                    }

                    return buttonContent;
                  })}
                </div>
              );
            })}
        </div>

        {/* Bottom NEXORA SIGN Card */}
        {!isCollapsed && (
          <div className="p-3 m-3 rounded-2xl relative overflow-hidden group bg-gradient-to-br from-[#0D152B] to-[#070B18] border border-fuchsia-500/20 shadow-[0_0_25px_rgba(217,70,239,0.08)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-600/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-600/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white tracking-wide font-display">NEXORA SIGN</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-tight">
                  Gestão completa dos teus displays.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRouteChange('overview')}
                className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30 hover:scale-105 transition-transform cursor-pointer"
                aria-label="Aceder Nexora Sign"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Footer info & Telemetry Pulse */}
        <div className="p-3.5 border-t border-white/[0.06] flex items-center justify-between bg-[#070B18] flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse flex-shrink-0 shadow-[0_0_8px_#10B981]" />
            {!isCollapsed && (
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-semibold text-[#F8FAFC] truncate flex items-center gap-1">
                  <Radio className="w-3 h-3 text-[#00E5FF]" /> {currentOrganization?.name || 'Luanda Central'}
                </span>
                <span className="text-[10px] text-[#64748B] font-mono">
                  {currentOrganization?.timezone || 'Africa/Luanda'}
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

