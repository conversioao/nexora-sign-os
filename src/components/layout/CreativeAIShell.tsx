import React from 'react';
import { Logo } from '../ui/Logo';
import { OrganizationSwitcher } from './OrganizationSwitcher';
import { UserMenu } from './UserMenu';
import { useSession } from '../../context/SessionContext';
import { useBgGeneration } from '../../context/BackgroundGenerationContext';
import { studioService } from '../../services/studioService';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Video,
  FolderHeart,
  Coins,
  Monitor,
  Loader2,
  Sparkles,
} from 'lucide-react';

export interface CreativeAIShellProps {
  children: React.ReactNode;
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  onSwitchPlatform: () => void;
  onNavigateToOrgSettings?: () => void;
}

export const CreativeAIShell: React.FC<CreativeAIShellProps> = ({
  children,
  activeRoute,
  onRouteChange,
  onSwitchPlatform,
  onNavigateToOrgSettings,
}) => {
  const { currentOrganization } = useSession();
  const orgId = currentOrganization?.id || 'org-publicidade';
  const { jobs } = useBgGeneration();
  const activeJobs = jobs.filter((j) => j.status === 'QUEUED' || j.status === 'PROCESSING');

  /**
   * Área de conteúdo rolável (ver a nota de estrutura no `return`).
   * O scroll do estúdio acontece aqui dentro, para que o cabeçalho com o
   * logotipo e o dock lateral fiquem sempre visíveis.
   */
  const contentRef = React.useRef<HTMLElement>(null);

  /** Cada página do estúdio abre no TOPO. */
  React.useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeRoute]);

  const [creditBalance, setCreditBalance] = React.useState<number>(4500);

  React.useEffect(() => {
    const loadBalance = async () => {
      try {
        const bal = await studioService.getBalance(orgId);
        setCreditBalance(bal);
      } catch {}
    };
    loadBalance();
    const interval = setInterval(loadBalance, 8000);
    return () => clearInterval(interval);
  }, [orgId]);

  const isDashActive = activeRoute === 'studio-dash' || activeRoute === 'studio' || activeRoute === '/studio';
  const isImageActive = activeRoute === 'studio-image' || activeRoute === '/studio/image';
  const isVideoActive = activeRoute === 'studio-video' || activeRoute === '/studio/video';
  const isLibraryActive = activeRoute === 'studio-library' || activeRoute === '/studio/library';
  const isCreditsActive = activeRoute === 'studio-credits' || activeRoute === '/studio/credits' || activeRoute === 'aicredits' || activeRoute === 'ai-credits';

  return (
    /**
     * ⚠️ ESTRUTURA DE ALTURA — não voltar a `min-h-screen`.
     *
     * Com `min-h-screen` a moldura crescia com o conteúdo e rolava a JANELA
     * inteira: o cabeçalho (logotipo) e o dock lateral saíam do ecrã, e a área
     * de conteúdo nunca rolava por si. Aqui a moldura mede exactamente uma
     * janela (`app-viewport` = 100dvh com 100vh de recurso) e não transborda —
     * só o `<main>` rola. `min-h-0` nos filhos flexíveis é o que permite ao
     * `<main>` encolher e ganhar o seu próprio scroll.
     */
    <div className="app-viewport w-full bg-[#050914] text-slate-100 flex flex-col font-sans relative overflow-hidden selection:bg-[#00E5FF]/25 selection:text-[#00E5FF]">
      {/* Background Ambient Mesh Gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(0,229,255,0.06),rgba(5,9,20,0))] pointer-events-none" />
      <div className="fixed top-1/3 right-10 w-96 h-96 bg-[#1677FF]/05 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-96 h-96 bg-[#6D3DF5]/05 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* ─── FULL WIDTH TOP HEADER BAR (COMO NEXORA SIGN) ─────────────────── */}
      <header className="w-full bg-[#080D1A]/90 border-b border-white/[0.08] px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-40 backdrop-blur-xl shrink-0">
        
        {/* Brand Logo on Left */}
        <div
          onClick={() => onRouteChange('studio-dash')}
          className="cursor-pointer hover:opacity-95 transition-opacity py-0.5 flex items-center gap-2 sm:gap-3 shrink-0"
        >
          <Logo variant="compact" size="md" />
        </div>

        {/* Segmented Top Switcher Tabs (Desktop / Tablet) */}
        <div className="hidden sm:flex items-center bg-[#0F1626] p-1 rounded-2xl border border-white/[0.08] shadow-inner overflow-x-auto nexora-scrollbar no-scrollbar touch-scroll">
          <button
            type="button"
            onClick={() => onRouteChange('studio-dash')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
              isDashActive
                ? 'bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] text-slate-950 font-extrabold shadow-[0_2px_16px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] font-medium'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => onRouteChange('studio-image')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
              isImageActive
                ? 'bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] text-slate-950 font-extrabold shadow-[0_2px_16px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] font-medium'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Gerar Imagem</span>
          </button>

          <button
            type="button"
            onClick={() => onRouteChange('studio-video')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
              isVideoActive
                ? 'bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] text-slate-950 font-extrabold shadow-[0_2px_16px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] font-medium'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Gerar Vídeo</span>
          </button>

          <button
            type="button"
            onClick={() => onRouteChange('studio-library')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs transition-all cursor-pointer shrink-0 ${
              isLibraryActive
                ? 'bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] text-slate-950 font-extrabold shadow-[0_2px_16px_rgba(0,229,255,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04] font-medium'
            }`}
          >
            <FolderHeart className="w-3.5 h-3.5" />
            <span>Galeria</span>
          </button>
        </div>

        {/* Right Header Status, Org & Credits */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Multi-Tenant Org Switcher */}
          <div className="hidden md:block">
            <OrganizationSwitcher onNavigateToOrgSettings={onNavigateToOrgSettings} />
          </div>

          {/* Credits Pill */}
          <div
            onClick={() => onRouteChange('studio-credits')}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer group ${
              isCreditsActive
                ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.2)]'
                : 'bg-[#0F1626] border-white/[0.08] hover:border-[#00E5FF]/40'
            }`}
            title="Ver e Recarregar Créditos IA"
          >
            <div className="w-5 h-5 rounded-lg bg-[#00E5FF]/15 flex items-center justify-center text-[#00E5FF]">
              <Coins className="w-3 h-3" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-slate-400 font-mono uppercase leading-tight hidden xs:inline">Saldo</span>
              <span className="text-xs font-bold font-mono text-white group-hover:text-[#00E5FF] transition-colors leading-tight">
                {creditBalance.toLocaleString()} cr
              </span>
            </div>
          </div>

          {/* Indicador de Gerações em Andamento */}
          {activeJobs.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F1626] border border-[#00E5FF]/30 animate-in fade-in duration-300">
              <Loader2 className="w-3.5 h-3.5 text-[#00E5FF] animate-spin" />
              <span className="text-[11px] font-bold text-[#00E5FF] font-mono">
                {activeJobs.length} a gerar
              </span>
            </div>
          )}

          {/* Switch to Nexora Sign platform */}
          <button
            type="button"
            onClick={onSwitchPlatform}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation"
            title="Voltar ao Nexora Sign"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Nexora Sign</span>
          </button>

          {/* User Menu */}
          <UserMenu
            onNavigateToSettings={() => onRouteChange('settings')}
            onNavigateToUsers={() => onRouteChange('users-mgmt')}
          />
        </div>
      </header>

      {/* ─── FULL SCREEN WORKSPACE BODY (DOCK + CONTENT) ────────────────────── */}
      <div className="flex-1 flex w-full min-h-0 relative z-10 overflow-hidden">
        
        {/* LEFT VERTICAL DOCK (FULL HEIGHT - DESKTOP) */}
        <aside className="hidden lg:flex w-[72px] shrink-0 border-r border-white/[0.06] bg-[#070C18]/60 backdrop-blur-xl flex-col items-center justify-start gap-3.5 py-4 overflow-y-auto nexora-scrollbar">
          {/* Dashboard */}
          <button
            type="button"
            onClick={() => onRouteChange('studio-dash')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isDashActive
                ? 'bg-gradient-to-tr from-[#00E5FF] to-[#1677FF] text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-105'
                : 'bg-[#0E1528] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
            }`}
            title="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>

          {/* Gerar Imagem */}
          <button
            type="button"
            onClick={() => onRouteChange('studio-image')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isImageActive
                ? 'bg-gradient-to-tr from-[#00E5FF] to-[#1677FF] text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-105'
                : 'bg-[#0E1528] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
            }`}
            title="Gerar Imagem"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Gerar Vídeo */}
          <button
            type="button"
            onClick={() => onRouteChange('studio-video')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isVideoActive
                ? 'bg-gradient-to-tr from-[#00E5FF] to-[#1677FF] text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-105'
                : 'bg-[#0E1528] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
            }`}
            title="Gerar Vídeo"
          >
            <Video className="w-5 h-5" />
          </button>

          {/* Galeria */}
          <button
            type="button"
            onClick={() => onRouteChange('studio-library')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isLibraryActive
                ? 'bg-gradient-to-tr from-[#00E5FF] to-[#1677FF] text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-105'
                : 'bg-[#0E1528] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] hover:border-white/20'
            }`}
            title="Galeria"
          >
            <FolderHeart className="w-5 h-5" />
          </button>

          <div className="w-8 h-[1px] bg-white/[0.06] my-1" />

          {/* Créditos */}
          <button
            type="button"
            onClick={() => onRouteChange('studio-credits')}
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer ${
              isCreditsActive
                ? 'bg-gradient-to-tr from-[#00E5FF] to-[#1677FF] text-slate-950 shadow-[0_0_20px_rgba(0,229,255,0.4)] scale-105'
                : 'bg-[#0E1528] border border-white/[0.08] text-slate-400 hover:text-emerald-400 hover:bg-white/[0.08] hover:border-emerald-400/30'
            }`}
            title="Recarregar Créditos"
          >
            <Coins className="w-5 h-5" />
          </button>
        </aside>

        {/* ACTIVE PAGE CONTENT (OCUPA 100% DO ESPAÇO COM SCROLL SUAVE E PADDING FLUIDO) */}
        <main
          ref={contentRef}
          className="flex-1 w-full min-h-0 overflow-y-auto p-3 sm:p-6 lg:p-7 flex flex-col custom-scrollbar touch-scroll pb-24 sm:pb-6"
        >
          {children}
        </main>
      </div>

      {/* ─── MOBILE CREATIVE AI BOTTOM BAR (SMARTPHONE PWA DOCK) ─── */}
      <nav
        aria-label="Navegação Rápida Studio AI"
        className="fixed bottom-0 left-0 right-0 z-30 bg-[#070B18]/95 border-t border-white/[0.08] backdrop-blur-xl sm:hidden flex items-center justify-around px-2 py-2 pb-safe"
        style={{
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <button
          type="button"
          onClick={() => onRouteChange('studio-dash')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer ${
            isDashActive ? 'text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => onRouteChange('studio-image')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer ${
            isImageActive ? 'text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Imagem</span>
        </button>

        <button
          type="button"
          onClick={() => onRouteChange('studio-video')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer ${
            isVideoActive ? 'text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Video className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Vídeo</span>
        </button>

        <button
          type="button"
          onClick={() => onRouteChange('studio-library')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer ${
            isLibraryActive ? 'text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderHeart className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Galeria</span>
        </button>

        <button
          type="button"
          onClick={() => onRouteChange('studio-credits')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-2 rounded-xl transition-all touch-manipulation cursor-pointer ${
            isCreditsActive ? 'text-[#00E5FF] font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Coins className="w-4 h-4" />
          <span className="text-[10px] tracking-tight">Créditos</span>
        </button>
      </nav>
    </div>
  );
};
