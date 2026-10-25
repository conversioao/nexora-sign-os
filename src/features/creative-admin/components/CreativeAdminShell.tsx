/**
 * CreativeAdminShell — moldura do painel de administração do Nexora Creative AI.
 *
 * É deliberadamente um TERCEIRO ambiente, distinto de:
 *   • `AppShell`         → admin/operação do Nexora Sign (inalterado)
 *   • `CreativeAIShell`  → estúdio de criação do utilizador final
 *
 * A navegação é GERADA a partir de `CREATIVE_ADMIN_SECTIONS` e filtrada pelas
 * permissões do utilizador, pelo que uma secção para a qual não tem permissão
 * nunca chega a aparecer — a separação não depende de o utilizador não clicar.
 */
import React from 'react';
import { Logo } from '../../../components/ui/Logo';
import { UserMenu } from '../../../components/layout/UserMenu';
import { useSession } from '../../../context/SessionContext';
import {
  getVisibleCreativeAdminSections,
  getCreativeAdminAccessLevel,
} from '../../../services/adminScopeService';
import { creativeAdminService } from '../services/creativeAdminService';
import {
  LayoutDashboard,
  Users,
  Coins,
  ClipboardCheck,
  Package,
  Cpu,
  BarChart3,
  Menu as MenuIcon,
  X,
  ShieldCheck,
  ArrowLeftRight,
  Loader2,
  Sparkles,
} from 'lucide-react';

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  Coins,
  ClipboardCheck,
  Package,
  Cpu,
  BarChart3,
};

export interface CreativeAdminShellProps {
  children: React.ReactNode;
  activeRoute: string;
  onRouteChange: (routeId: string) => void;
  onSwitchPlatform: () => void;
  onNavigateToSettings?: () => void;
}

export const CreativeAdminShell: React.FC<CreativeAdminShellProps> = ({
  children,
  activeRoute,
  onRouteChange,
  onSwitchPlatform,
  onNavigateToSettings,
}) => {
  const { currentUser, permissions } = useSession();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [pendingRequests, setPendingRequests] = React.useState<number | null>(null);

  /**
   * Área de conteúdo rolável.
   *
   * O scroll vive AQUI dentro, não na janela: o cabeçalho e o menu lateral ficam
   * sempre à vista (ver o comentário da moldura, mais abaixo).
   */
  const contentRef = React.useRef<HTMLElement>(null);

  /** Cada secção abre no TOPO — nunca a meio da anterior. */
  React.useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
  }, [activeRoute]);

  const sections = React.useMemo(
    () => getVisibleCreativeAdminSections(permissions),
    [permissions]
  );
  const accessLevel = getCreativeAdminAccessLevel(permissions);

  // Contador de pedidos pendentes para o badge lateral (atualiza ao mudar de secção)
  React.useEffect(() => {
    let cancelled = false;
    creativeAdminService
      .getOverview()
      .then((o) => {
        if (!cancelled) setPendingRequests(o.requests.pending);
      })
      .catch(() => {
        if (!cancelled) setPendingRequests(null);
      });
    return () => {
      cancelled = true;
    };
  }, [activeRoute]);

  const navigate = (id: string) => {
    onRouteChange(id);
    setIsMobileOpen(false);
  };

  const activeSection = sections.find((s) => s.id === activeRoute) || sections[0];

  const navList = (
    <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
      <span className="text-[10px] font-mono text-slate-500 uppercase px-3 py-1.5 block tracking-wider">
        Ecossistema Creative AI
      </span>
      {sections.map((section) => {
        const Icon = ICONS[section.icon] || LayoutDashboard;
        const isActive = section.id === (activeSection?.id || activeRoute);
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => navigate(section.id)}
            title={section.description}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer text-left ${
              isActive
                ? 'bg-[#170F2E] border border-[#7C3AED]/50 text-[#C084FC] font-bold shadow-md'
                : 'text-slate-300 hover:bg-white/[0.04] border border-transparent hover:text-white'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#C084FC]' : 'text-slate-500'}`} />
            <span className="flex-1 truncate">{section.label}</span>
            {section.id === 'ca-approvals' && pendingRequests !== null && pendingRequests > 0 && (
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {pendingRequests}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    /**
     * ⚠️ ESTRUTURA DE ALTURA — não voltar a `min-h-screen`.
     *
     * Com `min-h-screen` a moldura crescia com o conteúdo e era a JANELA que
     * rolava. Consequências observadas no painel: o cabeçalho (com o logotipo) e
     * o menu lateral saíam do ecrã ao rolar, e a área de conteúdo nunca rolava
     * por si (`scrollHeight === clientHeight` em todas as secções).
     *
     * Agora a moldura mede exactamente uma janela (`app-viewport` = 100dvh, com
     * 100vh de recurso) e não transborda: o cabeçalho fica fixo no topo e só o
     * `<main>` rola. `min-h-0` é obrigatório nos filhos flexíveis — sem ele um
     * item flex recusa encolher abaixo do conteúdo e o transbordo volta.
     */
    <div className="app-viewport w-full bg-[#050914] text-slate-100 flex flex-col font-sans relative overflow-hidden selection:bg-[#7C3AED]/25 selection:text-[#C084FC]">
      {/* Ambiente visual próprio do admin Creative AI (violeta) */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(124,58,237,0.10),rgba(5,9,20,0))] pointer-events-none" />
      <div className="fixed top-1/4 right-0 w-96 h-96 bg-[#7C3AED]/[0.06] rounded-full blur-[160px] pointer-events-none" />

      {/* ─── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="w-full bg-[#0A0714]/90 border-b border-[#7C3AED]/20 px-3 sm:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-40 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Abrir menu"
          >
            <MenuIcon className="w-4 h-4" />
          </button>

          <div
            onClick={() => navigate(sections[0]?.id || 'ca-overview')}
            className="cursor-pointer hover:opacity-95 transition-opacity py-0.5 flex items-center gap-2.5 shrink-0"
          >
            <Logo variant="compact" size="md" />
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/15 border border-[#7C3AED]/40 flex items-center justify-center text-[#C084FC]">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Creative AI</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40">
                  ADMIN
                </span>
              </div>
              <span className="text-[10px] text-slate-500">
                {accessLevel === 'MANAGER' ? 'Acesso total de gestão' : 'Acesso de leitura'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {pendingRequests !== null && pendingRequests > 0 && (
            <button
              type="button"
              onClick={() => navigate('ca-approvals')}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:border-amber-400/60 transition-colors cursor-pointer"
              title="Pedidos de recarga à espera de aprovação"
            >
              <Loader2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-amber-300 font-mono">
                {pendingRequests} pendente{pendingRequests > 1 ? 's' : ''}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onSwitchPlatform}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Trocar de plataforma"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#C084FC]" />
            <span className="hidden sm:inline">Trocar ambiente</span>
          </button>

          <UserMenu
            onNavigateToSettings={onNavigateToSettings || (() => {})}
            onNavigateToUsers={onNavigateToSettings || (() => {})}
          />
        </div>
      </header>

      <div className="flex-1 flex w-full min-h-0 relative z-10 overflow-hidden">
        {/* ─── SIDEBAR DESKTOP ────────────────────────────────────────────── */}
        <aside className="hidden lg:flex w-64 shrink-0 border-r border-white/[0.06] bg-[#080512]/70 backdrop-blur-xl flex-col overflow-hidden">
          {navList}

          <div className="p-3 border-t border-white/[0.06]">
            <div className="rounded-xl bg-[#7C3AED]/[0.08] border border-[#7C3AED]/25 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C084FC]" />
                <span className="text-[10px] font-bold text-[#C084FC] uppercase tracking-wider">
                  Ecossistema isolado
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Este painel gere apenas o Creative AI. O admin do Nexora Sign mantém-se separado.
              </p>
            </div>
            {currentUser?.name && (
              <p className="text-[10px] text-slate-600 text-center mt-2 font-mono truncate">
                {currentUser.name}
              </p>
            )}
          </div>
        </aside>

        {/* ─── SIDEBAR MOBILE ─────────────────────────────────────────────── */}
        {isMobileOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setIsMobileOpen(false)}
              aria-hidden="true"
            />
            <aside className="fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#080512]/98 backdrop-blur-2xl border-r border-[#7C3AED]/25 flex flex-col lg:hidden">
              <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#C084FC]" /> Creative AI Admin
                </span>
                <button
                  type="button"
                  onClick={() => setIsMobileOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {navList}
            </aside>
          </>
        )}

        {/* ─── CONTEÚDO ───────────────────────────────────────────────────── */}
        <main
          ref={contentRef}
          className="flex-1 w-full min-h-0 overflow-y-auto p-3.5 sm:p-6 lg:p-7 flex flex-col custom-scrollbar touch-scroll pb-8"
        >
          {activeSection && (
            <div className="mb-5">
              <h1 className="text-lg sm:text-xl font-extrabold text-white font-display tracking-tight">
                {activeSection.label}
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed">
                {activeSection.description}
              </p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};
