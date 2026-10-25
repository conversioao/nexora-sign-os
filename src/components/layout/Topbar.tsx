import React from 'react';
import {
  Menu,
  Search,
  Bell,
  Activity,
  ShieldCheck,
  Monitor,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { UserRole } from '../../types/navigation';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { UserMenu } from './UserMenu';
import { useSession } from '../../context/SessionContext';

export interface TopbarProps {
  currentRole?: UserRole;
  onRoleChange?: (role: UserRole) => void;
  onOpenMobileMenu: () => void;
  onOpenComponentGallery?: () => void;
  onNavigateToOrgSettings?: () => void;
  onNavigateToUsers?: () => void;
  onNavigateToSettings?: () => void;
  onNavigateToPartners?: () => void;
  onNavigateToNotifications?: () => void;
  activePlatform?: 'creative-ai' | 'sign' | null;
  onSwitchPlatform?: () => void;
}

interface RawNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function getNotifIcon(type: string) {
  const t = (type || '').toUpperCase();
  if (t.includes('OFFLINE')) return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
  if (t.includes('ONLINE')) return <Monitor className="w-3.5 h-3.5 text-emerald-400" />;
  if (t.includes('ALERT')) return <Activity className="w-3.5 h-3.5 text-amber-400" />;
  return <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />;
}

function timeShort(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onNavigateToOrgSettings,
  onNavigateToUsers,
  onNavigateToSettings,
  onNavigateToNotifications,
  activePlatform,
  onSwitchPlatform,
}) => {
  const { currentOrganization } = useSession();

  const [rawNotifications, setRawNotifications] = React.useState<RawNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
        setRawNotifications(data.notifications || []);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const markAsRead = async (id: string) => {
    try { await fetch('/api/notifications/' + id + '/read', { method: 'PATCH' }); } catch {}
    setRawNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const top5 = rawNotifications.slice(0, 5);

  return (
    <header className="h-16 sm:h-20 nexora-glass-header sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 gap-2">
      {/* Left: Mobile hamburger & Organization Switcher */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden flex items-center justify-center w-9 h-9 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/5 border border-white/5 cursor-pointer shrink-0 touch-manipulation"
          aria-label="Abrir Navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Multi-Tenant Organization Switcher */}
        <div className="min-w-0">
          <OrganizationSwitcher onNavigateToOrgSettings={onNavigateToOrgSettings} />
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="hidden md:flex items-center flex-1 max-w-xl mx-4 lg:mx-6">
        <div className="relative w-full group">
          <Search className="w-4 h-4 text-[#64748B] group-focus-within:text-[#00E5FF] absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors" />
          <input
            type="text"
            placeholder="Pesquisar por displays, locais, campanhas, parceiros..."
            className="w-full bg-[#091024]/75 hover:bg-[#0C1530] focus:bg-[#0D1836] border border-white/[0.08] focus:border-[#00E5FF]/40 rounded-xl pl-10 pr-12 py-2.5 text-xs text-white placeholder-[#64748B] transition-all outline-none shadow-[0_2px_12px_rgba(0,0,0,0.3)] focus:shadow-[0_0_20px_rgba(0,229,255,0.15)]"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-[#64748B] bg-white/[0.05] border border-white/10 rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Actions, Notifications & User Menu */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Switch Platform Shortcut if available */}
        {activePlatform && onSwitchPlatform && (
          <button
            type="button"
            onClick={onSwitchPlatform}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0D152B] hover:bg-[#131D3B] text-slate-300 hover:text-white border border-white/10 transition-all cursor-pointer"
            title="Alternar entre Nexora Sign e Nexora Creative AI"
          >
            {activePlatform === 'creative-ai' ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Nexora Creative AI</span>
                <span className="md:hidden">Creative AI</span>
              </>
            ) : (
              <>
                <Monitor className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Nexora Sign</span>
                <span className="md:hidden">Sign</span>
              </>
            )}
          </button>
        )}

        {/* Notifications Button */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen(prev => !prev)}
            className="relative p-2 sm:p-2.5 rounded-xl text-[#94A3B8] hover:text-white hover:bg-white/[0.05] border border-white/[0.06] transition-colors cursor-pointer touch-manipulation"
            aria-label="Notificações"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EC4899] shadow-[0_0_8px_#EC4899]" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-80 bg-[#091024]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#00E5FF]" />
                  <span className="text-xs font-semibold text-white">Notificações em Tempo Real</span>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#EC4899]/20 border border-[#EC4899]/30 text-[#EC4899] text-[10px] font-bold">
                    {unreadCount} novas
                  </span>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {top5.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2 text-slate-500">
                    <CheckCircle2 className="w-6 h-6" />
                    <p className="text-xs">Nenhuma notificação recente</p>
                  </div>
                ) : (
                  top5.map(n => (
                    <button
                      key={n.id}
                      onClick={() => { markAsRead(n.id); }}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${
                        !n.isRead ? 'bg-cyan-500/[0.04]' : ''
                      }`}
                    >
                      <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                        !n.isRead ? 'bg-cyan-500/15 border border-cyan-500/30' : 'bg-slate-800 border border-slate-700'
                      }`}>
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-xs font-semibold truncate ${ !n.isRead ? 'text-white' : 'text-slate-300' }`}>
                            {n.title}
                          </p>
                          {!n.isRead && <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{n.message}</p>
                        <p className="text-[10px] text-slate-600 mt-1">{timeShort(n.createdAt)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-white/10">
                <button
                  onClick={() => { setNotifOpen(false); onNavigateToNotifications?.(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/5 transition-colors"
                >
                  <span>Ver Todas as Notificações</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu with RBAC Profile Switcher & Logout */}
        <UserMenu
          onNavigateToUsers={onNavigateToUsers}
          onNavigateToOrgSettings={onNavigateToOrgSettings}
          onNavigateToSettings={onNavigateToSettings}
        />
      </div>
    </header>
  );
};

