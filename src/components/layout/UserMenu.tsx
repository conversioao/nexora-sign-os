import React, { useState, useRef, useEffect } from 'react';
import {
  User as UserIcon,
  ShieldCheck,
  Building,
  Briefcase,
  Wrench,
  Sparkles,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Check,
  Radio,
  Film,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { DEMO_PROFILES } from '../../services/sessionService';
import { ROLE_LABELS, ROLES_REGISTRY } from '../../services/permissionService';
import { Avatar } from '../ui/Avatar';

const ROLE_ICON_MAP: Record<string, React.ElementType> = {
  ShieldCheck,
  Radio,
  Building,
  Building2: Building,
  Film,
  Briefcase,
  Wrench,
};

export const UserMenu: React.FC<{
  onNavigateToUsers?: () => void;
  onNavigateToOrgSettings?: () => void;
  onNavigateToSettings?: () => void;
}> = ({ onNavigateToUsers, onNavigateToOrgSettings, onNavigateToSettings }) => {
  const {
    currentUser,
    currentMembership,
    currentOrganization,
    switchDemoProfile,
    isDemoMode,
    demoLoginEnabled,
    logout,
    hasPermission,
  } = useSession();

  const [isOpen, setIsOpen] = useState(false);
  const [showDemoSelector, setShowDemoSelector] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowDemoSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser || !currentMembership) return null;

  const currentRoleDef = ROLES_REGISTRY[currentMembership.role];
  const roleLabel = ROLE_LABELS[currentMembership.role] || currentMembership.role;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#06B6D4]"
      >
        <Avatar
          name={currentUser.name}
          src={currentUser.avatar}
          size="sm"
          status="online"
        />

        <div className="hidden md:flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-100 group-hover:text-white max-w-[120px] truncate">
              {currentUser.name}
            </span>
          </div>
          <span className="text-[10px] text-cyan-400 font-medium truncate">
            {roleLabel}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Content */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0F172A] border border-white/15 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Info */}
          <div className="p-3.5 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <Avatar
                name={currentUser.name}
                src={currentUser.avatar}
                size="md"
                status="online"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate font-display">
                  {currentUser.name}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-semibold px-2 py-0.5 rounded-md border ${currentRoleDef.badgeColor}`}
                  >
                    {roleLabel}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    • {currentOrganization?.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-1.5 space-y-0.5">
            {hasPermission('users.read') && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToUsers) onNavigateToUsers();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Gestão de Utilizadores</span>
              </button>
            )}

            {hasPermission('organization.read') && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToOrgSettings) onNavigateToOrgSettings();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <Building className="w-4 h-4 text-blue-400" />
                <span>Dados da Organização</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onNavigateToSettings) onNavigateToSettings();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Preferências da Plataforma</span>
            </button>
          </div>

          {/* Profile Switcher Section — apenas para Nexora Admin E apenas quando o
              modo de demonstração está activo no SERVIDOR. Trocar de perfil
              concede NEXORA_ADMIN com um clique, por isso não pode existir em
              produção: o servidor é quem decide, não o cliente. */}
          {currentMembership.role === 'NEXORA_ADMIN' && demoLoginEnabled && (
            <div className="p-2 border-t border-white/10 bg-white/[0.02]">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Alternar Utilizador & Perfil</span>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <div className="mt-1 space-y-1 max-h-48 overflow-y-auto">
                {DEMO_PROFILES.map((prof) => {
                  const isSelected = currentUser.id === prof.user.id;
                  return (
                    <button
                      key={prof.key}
                      type="button"
                      onClick={() => {
                        switchDemoProfile(prof.key);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#0284C7]/20 border border-[#0284C7]/40 text-white font-medium'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-semibold truncate">{prof.label}</div>
                        <div className="text-[10px] text-slate-400 truncate">{prof.sublabel}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Logout */}
          <div className="p-2 border-t border-white/10 bg-white/[0.01]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Terminar Sessão (Logout)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
