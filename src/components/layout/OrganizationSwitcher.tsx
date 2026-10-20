import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Building,
  Briefcase,
  Monitor,
  Wrench,
  Check,
  ChevronDown,
  Sparkles,
  Settings,
  PlusCircle,
  ExternalLink,
  Users,
} from 'lucide-react';
import { useSession } from '../../context/SessionContext';
import { OrganizationType } from '../../types/auth';
import { ORGANIZATION_TYPE_LABELS } from '../../services/permissionService';

const TYPE_ICONS: Record<OrganizationType, React.ElementType> = {
  NEXORA: Building2,
  CLIENT: Building,
  DISPLAY_OWNER: Monitor,
  ADVERTISER: Briefcase,
  PARTNER: Wrench,
  AFFILIATE: Users,
};

export const OrganizationSwitcher: React.FC<{
  onNavigateToOrgSettings?: () => void;
}> = ({ onNavigateToOrgSettings }) => {
  const { currentOrganization, availableOrganizations, switchOrganization, isDemoMode, hasPermission } =
    useSession();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentOrganization) return null;

  const orgType = (currentOrganization.type || 'NEXORA').toUpperCase() as OrganizationType;
  const CurrentIcon = TYPE_ICONS[orgType] || Building2;
  const currentTypeInfo = ORGANIZATION_TYPE_LABELS[orgType] || {
    label: 'Organização',
    badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#06B6D4]"
        title="Alternar Organização Ativa"
      >
        <div
          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
            currentOrganization.logoGradient || 'from-blue-600 to-cyan-500'
          } flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-blue-500/20`}
        >
          <CurrentIcon className="w-3.5 h-3.5" />
        </div>

        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-100 group-hover:text-white max-w-[140px] md:max-w-[180px] truncate font-display">
              {currentOrganization.name}
            </span>
            <span
              className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${currentTypeInfo.badge}`}
            >
              {currentOrganization.type === 'PARTNER' || currentOrganization.type === 'CLIENT' ? 'PARCEIRO' : (currentOrganization.type === 'ADVERTISER' ? 'ANUNCIANTE' : currentOrganization.type || 'NEXORA')}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {currentOrganization.code || 'ORG'} • {currentOrganization.city || 'Luanda'}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#0F172A] border border-white/15 shadow-2xl shadow-black/80 backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-white/10 bg-white/[0.02]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-display">
                Organizações Disponíveis
              </span>
              {isDemoMode && (
                <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Multi-Tenant Demo
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">
              Selecione o tenant para carregar telas, mídias e grades específicas:
            </p>
          </div>

          <div className="p-1.5 max-h-72 overflow-y-auto space-y-1 nexora-scrollbar">
            {availableOrganizations.map((org) => {
              const isSelected = org.id === currentOrganization.id;
              const safeType = (org.type || 'NEXORA').toUpperCase() as OrganizationType;
              const OrgIcon = TYPE_ICONS[safeType] || Building2;
              const typeMeta = ORGANIZATION_TYPE_LABELS[safeType] || {
                label: 'Organização',
                badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
              };

              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={async () => {
                    await switchOrganization(org.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border border-blue-500/40 text-white'
                      : 'hover:bg-white/[0.05] border border-transparent text-slate-[#94A3B8]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                        org.logoGradient || 'from-slate-700 to-slate-800'
                      } flex items-center justify-center text-white flex-shrink-0`}
                    >
                      <OrgIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold truncate text-slate-200">
                          {org.name}
                        </span>
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded border ${typeMeta.badge}`}
                        >
                          {org.type === 'PARTNER' || org.type === 'CLIENT' ? 'PARCEIRO' : (org.type === 'ADVERTISER' ? 'ANUNCIANTE' : org.type || 'NEXORA')}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {org.city} • {org.tradeName}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 ml-2">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Org settings link */}
          {hasPermission('organization.read') && (
            <div className="p-2 border-t border-white/10 bg-white/[0.01] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onNavigateToOrgSettings) onNavigateToOrgSettings();
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer text-xs font-medium"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Configurações desta Organização</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
