import React from 'react';
import { ShieldAlert, ArrowLeft, Building, Sparkles, RefreshCw } from 'lucide-react';
import { useSession } from '../../../context/SessionContext';
import { Permission } from '../../../types/auth';
import { ROLE_LABELS } from '../../../services/permissionService';

export interface AccessDeniedPageProps {
  requiredPermission?: Permission;
  requiredPermissions?: Permission[];
  onBackToDashboard: () => void;
  onSwitchProfile?: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredPermission,
  requiredPermissions,
  onBackToDashboard,
}) => {
  const { currentOrganization, currentMembership, switchDemoProfile, isDemoMode } = useSession();

  const roleLabel = currentMembership ? ROLE_LABELS[currentMembership.role] : 'Sem perfil';

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-[#0B1120] border border-rose-500/20 shadow-2xl shadow-rose-950/40 text-center relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400 shadow-inner shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-white font-display mb-2">
          Acesso Restrito
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed mb-6">
          O seu perfil atual não possui as permissões necessárias para visualizar este módulo ou executar esta ação na organização <span className="text-slate-200 font-semibold">{currentOrganization?.name}</span>.
        </p>

        {/* Diagnostic Card */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left mb-6 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Organização:</span>
            <span className="font-semibold text-slate-200">{currentOrganization?.name}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Seu Perfil / Role:</span>
            <span className="font-semibold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              {roleLabel}
            </span>
          </div>
          {(requiredPermission || (requiredPermissions && requiredPermissions.length > 0)) && (
            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[11px]">
              <span className="text-slate-400">Permissão Requerida:</span>
              <code className="text-cyan-400 font-mono bg-cyan-950/40 px-1.5 py-0.5 rounded">
                {requiredPermission || requiredPermissions?.join(' ou ')}
              </code>
            </div>
          )}
        </div>

        {/* Quick Demo Switcher if in Demo Mode */}
        {isDemoMode && (
          <div className="mb-6 p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deseja testar como Administrador?</span>
            </div>
            <button
              type="button"
              onClick={() => switchDemoProfile('NEXORA_ADMIN')}
              className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Alternar para Nexora Admin (Acesso Total)</span>
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Início</span>
          </button>
        </div>
      </div>
    </div>
  );
};
