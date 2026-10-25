import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserRole } from '../../types/navigation';
import {
  LayoutDashboard,
  Tv,
  Megaphone,
  Sparkles,
  Menu as MenuIcon,
} from 'lucide-react';

export interface AppShellProps {
  children: React.ReactNode;
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onOpenComponentGallery?: () => void;
  onNavigateToOrgSettings?: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPartners?: () => void;
  onNavigateToNotifications?: () => void;
  activePlatform?: 'creative-ai' | 'sign' | null;
  onSwitchPlatform?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeRoute,
  onRouteChange,
  currentRole,
  onRoleChange,
  onOpenComponentGallery,
  onNavigateToOrgSettings,
  onNavigateToUsers,
  onNavigateToSettings,
  onNavigateToPartners,
  onNavigateToNotifications,
  activePlatform,
  onSwitchPlatform,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050914] text-[#F8FAFC] flex flex-col selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        activeRoute={activeRoute}
        onRouteChange={(route) => {
          onRouteChange(route);
          setIsMobileOpen(false);
        }}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        activePlatform={activePlatform}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]'
        }`}
      >
        {/* Topbar Header */}
        <Topbar
          currentRole={currentRole}
          onRoleChange={onRoleChange}
          onOpenMobileMenu={() => setIsMobileOpen(true)}
          onOpenComponentGallery={onOpenComponentGallery}
          onNavigateToOrgSettings={onNavigateToOrgSettings}
          onNavigateToUsers={onNavigateToUsers}
          onNavigateToSettings={onNavigateToSettings}
          onNavigateToPartners={onNavigateToPartners}
          onNavigateToNotifications={onNavigateToNotifications}
          activePlatform={activePlatform}
          onSwitchPlatform={onSwitchPlatform}
        />

        {/* Dynamic Page Content with responsive fluid padding and bottom bar clearance */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto pb-24 sm:pb-8">
          {children}
        </main>
      </div>

      {/* ─── MOBILE PWA BOTTOM NAVIGATION BAR (APENAS SMARTPHONE / ECRÃS PEQUENOS) ─── */}
      <nav
        aria-label="Navegação Mobile Rápida"
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#070B18]/95 border-t border-white/[0.08] backdrop-blur-xl sm:hidden flex items-center justify-around px-2 py-2 pb-safe"
        style={{
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Dashboard */}
        <button
          type="button"
          onClick={() => onRouteChange('overview')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all touch-manipulation cursor-pointer ${
            activeRoute === 'overview'
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Painel</span>
        </button>

        {/* Displays */}
        <button
          type="button"
          onClick={() => onRouteChange('displays')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all touch-manipulation cursor-pointer ${
            activeRoute === 'displays' || activeRoute.startsWith('display')
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Displays</span>
        </button>

        {/* Campanhas */}
        <button
          type="button"
          onClick={() => onRouteChange('campaigns')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all touch-manipulation cursor-pointer ${
            activeRoute === 'campaigns' || activeRoute.startsWith('campaign')
              ? 'text-cyan-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Campanhas</span>
        </button>

        {/* Creative AI Shortcut */}
        {onSwitchPlatform && (
          <button
            type="button"
            onClick={onSwitchPlatform}
            className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-purple-400 hover:text-purple-300 transition-all touch-manipulation cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] tracking-tight font-semibold">Studio AI</span>
          </button>
        )}

        {/* Full Menu Drawer Toggle */}
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-white transition-all touch-manipulation cursor-pointer"
        >
          <MenuIcon className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Mais</span>
        </button>
      </nav>
    </div>
  );
};


