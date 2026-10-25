import React, { useState, useEffect } from 'react';
import { ToastProvider } from './components/ui/Toast';
import { SessionProvider, useSession } from './context/SessionContext';
import { BackgroundGenerationProvider } from './context/BackgroundGenerationContext';
import { PWAInstallPrompt } from './components/pwa/PWAInstallPrompt';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { AppShell } from './components/layout/AppShell';
import { CreativeAIShell } from './components/layout/CreativeAIShell';
import { CreativeAdminShell } from './features/creative-admin/components/CreativeAdminShell';
import { CreativeAdminOverviewPage } from './features/creative-admin/pages/OverviewPage';
import { CreativeAdminUsersPage } from './features/creative-admin/pages/UsersPage';
import { CreativeAdminCreditsPage } from './features/creative-admin/pages/CreditsPage';
import { CreativeAdminApprovalsPage } from './features/creative-admin/pages/ApprovalsPage';
import { CreativeAdminPackagesPage } from './features/creative-admin/pages/PackagesPage';
import { CreativeAdminModelsPage } from './features/creative-admin/pages/ModelsPage';
import { CreativeAdminAnalyticsPage } from './features/creative-admin/pages/AnalyticsPage';
import {
  canAccessCreativeAdmin,
  getVisibleCreativeAdminSections,
} from './services/adminScopeService';
import { DashboardShell } from './features/dashboard/DashboardShell';
import { DesignSystemShowcase } from './features/showcase/DesignSystemShowcase';
import { PlaceholderModule } from './features/placeholders/PlaceholderModule';
import { DisplaysListPage } from './features/displays/pages/DisplaysListPage';
import { DisplayDetailPage } from './features/displays/pages/DisplayDetailPage';
import { ContentLibraryPage } from './features/content/pages/ContentLibraryPage';
import { ContentDetailPage } from './features/content/pages/ContentDetailPage';
import { PlaylistsListPage } from './features/playlists/pages/PlaylistsListPage';
import { PlaylistBuilderPage } from './features/playlists/pages/PlaylistBuilderPage';
import { SchedulingListPage } from './features/scheduling/pages/SchedulingListPage';
import { ScheduleDetailPage } from './features/scheduling/pages/ScheduleDetailPage';
import { ScheduleFormPage } from './features/scheduling/pages/ScheduleFormPage';
import { ClientsListPage } from './features/crm/pages/ClientsListPage';
import { ClientDetailPage } from './features/crm/pages/ClientDetailPage';
import { AdvertisersListPage } from './features/crm/pages/AdvertisersListPage';
import { AdvertiserDetailPage } from './features/crm/pages/AdvertiserDetailPage';
import { PartnersListPage } from './features/partners/pages/PartnersListPage';
import { OrganizationSettingsPage } from './features/organization/pages/OrganizationSettingsPage';
import { UserManagementPage } from './features/organization/pages/UserManagementPage';
import { PlansListPage } from './features/saas/pages/PlansListPage';
import { PlanDetailPage } from './features/saas/pages/PlanDetailPage';
import { SubscriptionsListPage } from './features/saas/pages/SubscriptionsListPage';
import { SubscriptionDetailPage } from './features/saas/pages/SubscriptionDetailPage';
import { MySubscriptionPage } from './features/saas/pages/MySubscriptionPage';
import { ContractsListPage } from './features/contracts/pages/ContractsListPage';
import { ContractDetailPage } from './features/contracts/pages/ContractDetailPage';
import { ContractTemplatesPage } from './features/contracts/pages/ContractTemplatesPage';
import { MarketplacePage } from './features/advertising/pages/MarketplacePage';
import { CampaignsListPage } from './features/advertising/pages/CampaignsListPage';
import { CampaignDetailPage } from './features/advertising/pages/CampaignDetailPage';
import { CampaignBuilderPage } from './features/advertising/pages/CampaignBuilderPage';
import { CampaignReportPage } from './features/advertising/pages/CampaignReportPage';
import { MediaInventoryPage } from './features/advertising/pages/MediaInventoryPage';
import { ClientCommissionsPage } from './features/advertising/pages/ClientCommissionsPage';
import { AdminPayoutsPage } from './features/contracts/pages/AdminPayoutsPage';
import { DevicesListPage } from './features/devices/pages/DevicesListPage';
import { DeviceDetailPage } from './features/devices/pages/DeviceDetailPage';
import { PlayerSimulatorPage } from './features/devices/pages/PlayerSimulatorPage';
import { WebcamAuditPage } from './features/devices/pages/WebcamAuditPage';
import { NotificationsPage } from './features/notifications/pages/NotificationsPage';
import { DatabaseBackupsPage } from './features/admin/pages/DatabaseBackupsPage';
import { CampaignSimulatorPage } from './features/developer/pages/CampaignSimulatorPage';
import { LoginPage } from './features/auth/pages/LoginPage';
import { ChangePasswordPage } from './features/auth/pages/ChangePasswordPage';
import { SignUpPage } from './features/auth/pages/SignUpPage';
import { NexoraLandingPage } from './features/landing/pages/NexoraLandingPage';
import { Logo } from './components/ui/Logo';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { AccessDeniedPage } from './features/auth/pages/AccessDeniedPage';
import { RootAccessPage } from './features/root-access/pages/RootAccessPage';
import { forceReleaseBodyScroll } from './lib/scrollLock';
import { StudioDashboardPage } from './features/studio/pages/StudioDashboardPage';
import { ImageGeneratorPage } from './features/studio/pages/ImageGeneratorPage';
import { VideoGeneratorPage } from './features/studio/pages/VideoGeneratorPage';
import { StudioLibraryPage } from './features/studio/pages/StudioLibraryPage';
import { CreditsPage } from './features/studio/pages/CreditsPage';
import { FinancialPage } from './features/placeholders/FinancialPage';
import { MaintenancePage } from './features/placeholders/MaintenancePage';
import { SettingsPage } from './features/placeholders/SettingsPage';
import { AIAgentKioskPage } from './features/dashboard/views/AIAgentKioskPage';
import { AffiliateReferralsPage } from './features/affiliates/pages/AffiliateReferralsPage';
import { AffiliateCommissionsPage } from './features/affiliates/pages/AffiliateCommissionsPage';
import { AffiliateLinksPage } from './features/affiliates/pages/AffiliateLinksPage';
import { AffiliatePayoutsPage } from './features/affiliates/pages/AffiliatePayoutsPage';
import { AdminAffiliatesPage } from './features/affiliates/admin/AdminAffiliatesPage';
import { WhatsAppAdminPage } from './features/whatsapp-admin/pages/WhatsAppAdminPage';
import { CreateAdminQuickModal } from './components/modals/CreateAdminQuickModal';
import {
  Megaphone,
  FileText,
  CreditCard,
  Sparkles,
  Wrench,
  Settings,
  Monitor,
  ShieldCheck,
} from 'lucide-react';

/**
 * Remonta a subárvore quando a CONTA activa muda.
 *
 * As páginas do Creative AI guardam o histórico de conversas/spots em estado
 * local (memória) e em `localStorage`. Trocar de organização com a página
 * montada deixava a memória com os itens da organização anterior — que eram
 * apresentados e reenviados para a organização nova (fuga de dados entre
 * contas). Mudar a `key` do Fragment obriga o React a desmontar e a montar de
 * novo, para que cada conta leia apenas o seu próprio histórico.
 */
function AccountScope({ scope, children }: { scope: string; children?: any }) {
  return <React.Fragment key={scope}>{children}</React.Fragment>;
}

function AppContent() {
  const {
    isAuthenticated,
    permissions,
    currentUser,
    currentOrganization,
    mustChangePassword,
    pendingCredentials,
    clearMustChangePassword,
    logout,
  } = useSession();

  /**
   * Escopo da CONTA activa para as páginas do Creative AI.
   *
   * Usado como `key` das páginas do estúdio: ao trocar de organização (ou de
   * conta) o painel é REMONTADO. Sem isto, o histórico de conversas/spots da
   * organização anterior continuava em memória e era reenviado para a
   * organização nova como se fosse dela.
   */
  const accountScopeKey = currentOrganization?.id || 'sem-organizacao';
  const [platform, setPlatform] = useState<'creative-ai' | 'sign' | 'creative-admin' | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('nexora_active_platform');
        if (stored === 'sign' || stored === 'creative-ai' || stored === 'creative-admin') return stored;
      }
    } catch {}
    return 'sign'; // Default to Nexora Sign
  });

  const [activeRoute, setActiveRoute] = useState<string>(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('nexora_active_route');
        if (stored) return stored;
      }
    } catch {}
    return 'overview';
  });

  const [authView, setAuthView] = useState<'landing' | 'login' | 'signup'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const search = window.location.search;
        const path = window.location.pathname;
        if (search.includes('ref=') || path.includes('register') || path.includes('signup')) {
          const urlParams = new URLSearchParams(search);
          const ref = urlParams.get('ref');
          const type = urlParams.get('type');
          if (ref) localStorage.setItem('nexora_referral_code', ref.trim());
          if (type) localStorage.setItem('nexora_referral_type', type.trim());
          return 'signup';
        }
      }
    } catch {}
    return 'landing';
  });

  // Selected item states
  const [selectedDisplayId, setSelectedDisplayId] = useState<string | null>(() => {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem('nexora_selected_display_id');
      }
    } catch {}
    return null;
  });

  // Sync platform, route and display to localStorage
  useEffect(() => {
    try {
      if (platform) localStorage.setItem('nexora_active_platform', platform);
      else localStorage.removeItem('nexora_active_platform');
    } catch {}
  }, [platform]);

  useEffect(() => {
    try {
      if (activeRoute) localStorage.setItem('nexora_active_route', activeRoute);
    } catch {}

    // Rede de segurança do scroll: se algum modal tiver deixado a trava do body
    // presa (por exemplo, montado dentro de um painel escondido por CSS em vez
    // de desmontado), mudar de rota liberta-a. Sem isto, a página deixava de
    // rolar em toda a aplicação.
    forceReleaseBodyScroll();
  }, [activeRoute]);

  useEffect(() => {
    try {
      if (selectedDisplayId) localStorage.setItem('nexora_selected_display_id', selectedDisplayId);
      else localStorage.removeItem('nexora_selected_display_id');
    } catch {}
  }, [selectedDisplayId]);

  // Reset platform selection when logging out.
  // Também limpa rotas do painel de admin do Creative AI (`ca-*`): a rota é
  // persistida, e sem isto o próximo início de sessão (possivelmente com um
  // perfil sem permissão) abria directamente no painel e caía em "Acesso Restrito".
  useEffect(() => {
    if (!isAuthenticated) {
      setPlatform('sign');
      setActiveRoute((current) => (current.startsWith('ca-') ? 'overview' : current));
    }
  }, [isAuthenticated]);

  // ─── Atalho para a consola de administradores (rota não listada) ───────────
  // A aplicação navega por estado e não por URL, por isso uma rota escondida
  // ─── Modal de Criação Rápida de Administrador (Atalho Global Ctrl + Shift + A) ───
  const [isAdminCreateModalOpen, setIsAdminCreateModalOpen] = useState(false);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      // Atalho: Ctrl + Shift + A ou Cmd + Shift + A ou Alt + Shift + A
      const isKeyA = e.key === 'a' || e.key === 'A' || e.code === 'KeyA';
      const hasModifiers = (e.ctrlKey || e.metaKey || e.altKey) && e.shiftKey;

      if (isKeyA && hasModifiers) {
        e.preventDefault();
        setIsAdminCreateModalOpen(true);
        return;
      }

      // Atalho legado Ctrl+Shift+Alt+R: abre a consola root-access
      if (e.ctrlKey && e.shiftKey && e.altKey && (e.key === 'R' || e.key === 'r' || e.code === 'KeyR')) {
        const isPlatformAdmin =
          permissions.includes('platform.all') || permissions.includes('platform.admin');
        if (isPlatformAdmin) {
          e.preventDefault();
          setPlatform('sign');
          setActiveRoute('root-access');
        }
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [permissions]);

  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [isEditingSchedule, setIsEditingSchedule] = useState<boolean>(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState<boolean>(false);

  // CRM Selected items
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string | null>(null);

  // SaaS Selected items
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);

  // Contracts Selected items
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  // Advertising & Marketplace Selected items
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Device Management Selected items
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  // If user is not authenticated, show Landing Page / Login / Sign up screens
  if (!isAuthenticated) {
    return (
      <>
        <CreateAdminQuickModal
          isOpen={isAdminCreateModalOpen}
          onClose={() => setIsAdminCreateModalOpen(false)}
        />
        {authView === 'landing' ? (
          <NexoraLandingPage
            onNavigateToLogin={() => setAuthView('login')}
            onNavigateToSignUp={() => setAuthView('signup')}
          />
        ) : authView === 'signup' ? (
          <SignUpPage
            onSuccess={() => setActiveRoute('overview')}
            onNavigateToLogin={() => setAuthView('login')}
            onNavigateToLanding={() => setAuthView('landing')}
          />
        ) : (
          <LoginPage
            onSuccess={() => setActiveRoute('overview')}
            onNavigateToSignUp={() => setAuthView('signup')}
            onNavigateToLanding={() => setAuthView('landing')}
          />
        )}
      </>
    );
  }

  // ─── Primeiro acesso: alteração OBRIGATÓRIA da palavra-passe ───────────────
  if (mustChangePassword) {
    return (
      <>
        <CreateAdminQuickModal
          isOpen={isAdminCreateModalOpen}
          onClose={() => setIsAdminCreateModalOpen(false)}
        />
        <ChangePasswordPage
          email={pendingCredentials?.email || currentUser?.email || ''}
          currentPassword={pendingCredentials?.password || ''}
          onSuccess={clearMustChangePassword}
          onLogout={logout}
        />
      </>
    );
  }

  // Selection screen if user is logged in but hasn't picked a platform
  if (platform === null) {
    return (
      <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] flex flex-col justify-center items-center p-6 relative overflow-hidden">
        <CreateAdminQuickModal
          isOpen={isAdminCreateModalOpen}
          onClose={() => setIsAdminCreateModalOpen(false)}
        />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl w-full text-center space-y-8 relative z-10">
          <div className="flex justify-center mb-2">
            <Logo variant="full" size="lg" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-display text-white">Selecione a Plataforma Nexora</h2>
            <p className="text-xs text-[#94A3B8]">Escolha o ambiente de trabalho que deseja aceder hoje.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <button
              onClick={() => {
                setPlatform('sign');
                setActiveRoute('overview');
              }}
              className="p-6 rounded-2xl bg-[#131D31] border border-white/5 hover:border-[#06B6D4]/30 hover:bg-[#18243D] text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-64 group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-[#06B6D4]/10 border border-[#06B6D4]/20 flex items-center justify-center text-[#06B6D4]">
                  <Monitor className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white font-display">Nexora Sign</h3>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    Gestão e controle de displays físicos, totens de Mídia Indoor, agendamento de campanhas comerciais e relatórios de métricas em tempo real.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#06B6D4] group-hover:underline flex items-center gap-1">
                Aceder Plataforma de Sinalização →
              </span>
            </button>

            <button
              onClick={() => {
                setPlatform('creative-ai');
                setActiveRoute('studio-dash');
              }}
              className="p-6 rounded-2xl bg-[#131D31] border border-white/5 hover:border-[#7C3AED]/30 hover:bg-[#18243D] text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-64 group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white font-display">Nexora Creative AI</h3>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    Criação automatizada de conteúdos publicitários, vídeos verticais e templates inteligentes alimentada por IA generativa integrada.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[#C084FC] group-hover:underline flex items-center gap-1">
                Aceder Plataforma de Criação →
              </span>
            </button>

            {/* Terceiro ambiente: painel de admin do ecossistema Creative AI.
                Só aparece a quem tem a categoria de admin correspondente — a
                separação entre os dois admins começa aqui. */}
            {canAccessCreativeAdmin(permissions) && (
              <button
                onClick={() => {
                  setPlatform('creative-admin');
                  setActiveRoute('ca-overview');
                }}
                className="p-6 rounded-2xl bg-[#131D31] border border-white/5 hover:border-[#7C3AED]/30 hover:bg-[#18243D] text-left transition-all hover:scale-[1.02] flex flex-col justify-between h-64 group cursor-pointer md:col-span-2"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-mono font-bold px-2 py-1 rounded bg-[#7C3AED]/20 text-[#C084FC] border border-[#7C3AED]/40">
                      ADMINISTRAÇÃO
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white font-display">
                      Creative AI · Admin
                    </h3>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                      Controlo do ecossistema de IA generativa: utilizadores e consumo, gestão e
                      aprovação de créditos, pacotes, top geradores e estilos mais utilizados.
                      Ambiente isolado do admin do Nexora Sign.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#C084FC] group-hover:underline flex items-center gap-1">
                  Aceder Painel de Administração →
                </span>
              </button>
            )}
          </div>

          <div className="pt-6 border-t border-white/5 flex justify-center">
            <button
              onClick={() => {
                setAuthView('landing');
                window.location.reload();
              }}
              className="text-[11px] text-[#64748B] hover:text-[#94A3B8] hover:underline cursor-pointer bg-transparent border-none"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleNavigateToDisplay = (displayId: string) => {
    setSelectedDisplayId(displayId);
    setActiveRoute('displays');
  };

  const handleNavigateToContent = (contentId: string) => {
    setSelectedContentId(contentId);
    setActiveRoute('content');
  };

  const handleNavigateToPlaylist = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setActiveRoute('playlists');
  };

  const handleNavigateToSchedule = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId);
    setIsEditingSchedule(false);
    setIsCreatingSchedule(false);
    setActiveRoute('scheduling');
  };

  const handleNavigateToCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setActiveRoute('clients');
  };

  const handleNavigateToAdvertiser = (advertiserId: string) => {
    setSelectedAdvertiserId(advertiserId);
    setActiveRoute('advertisers');
  };

  const handleNavigateToPlan = (planId: string) => {
    setSelectedPlanId(planId);
    setActiveRoute('plans');
  };

  const handleNavigateToSubscription = (subscriptionId: string) => {
    setSelectedSubscriptionId(subscriptionId);
    setActiveRoute('subscriptions');
  };

  const handleNavigateToContract = (contractId: string) => {
    setSelectedContractId(contractId);
    setActiveRoute('contracts');
  };

  const handleNavigateToCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setActiveRoute('campaigns');
  };

  const handleNavigateToDevice = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    setActiveRoute('devices');
  };

  const renderContent = () => {
    if (activeRoute === 'landing') {
      return (
        <NexoraLandingPage
          onNavigateToLogin={() => setAuthView('login')}
          onNavigateToSignUp={() => setAuthView('signup')}
        />
      );
    }

    if (activeRoute === 'showcase') {
      return <DesignSystemShowcase onBackToDashboard={() => setActiveRoute('overview')} />;
    }

    // ─── Rota escondida: gestão de administradores da plataforma ────────────
    // NÃO consta de `navigationConfig`, por isso não aparece em nenhum menu.
    // Acede-se apenas escrevendo a rota. O que protege de facto é a chave de
    // servidor (NEXORA_ADMIN_KEY) exigida em cada pedido — esconder a rota não
    // é, por si só, um controlo de segurança.
    if (activeRoute === 'root-access' || activeRoute === '/admin/root') {
      const isPlatformAdmin =
        permissions.includes('platform.all') || permissions.includes('platform.admin');

      if (!isPlatformAdmin) {
        return (
          <AccessDeniedPage
            requiredPermission="platform.admin"
            onBackToDashboard={() => setActiveRoute('overview')}
          />
        );
      }
      return <RootAccessPage onLeave={() => setActiveRoute('overview')} />;
    }

    if (activeRoute === 'overview') {
      return (
        <ProtectedRoute
          requiredPermissions={['displays.read', 'content.read', 'analytics.read', 'platform.admin', 'campaigns.read', 'affiliate.dashboard']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <DashboardShell
            onOpenShowcase={() => setActiveRoute('showcase')}
            onNavigateToDisplay={handleNavigateToDisplay}
            onNavigateToDisplaysList={() => {
              setSelectedDisplayId(null);
              setActiveRoute('displays');
            }}
            onNavigateToContent={() => {
              setSelectedContentId(null);
              setActiveRoute('content');
            }}
            onNavigateToPlaylist={() => {
              setSelectedPlaylistId(null);
              setActiveRoute('playlists');
            }}
            onNavigateToSchedule={() => {
              setSelectedScheduleId(null);
              setIsCreatingSchedule(false);
              setIsEditingSchedule(false);
              setActiveRoute('scheduling');
            }}
            onNavigateToScheduleDetail={(id) => handleNavigateToSchedule(id)}
            onNavigateToClients={() => {
              setSelectedCustomerId(null);
              setActiveRoute('clients');
            }}
            onNavigateToAdvertisers={() => {
              setSelectedAdvertiserId(null);
              setActiveRoute('advertisers');
            }}
            onNavigateToCampaigns={() => {
              setSelectedCampaignId(null);
              setActiveRoute('campaigns');
            }}
            onNavigateToNewCampaign={() => {
              setSelectedCampaignId(null);
              setActiveRoute('campaign-builder');
            }}
            onNavigateToAICredits={() => setActiveRoute('aicredits')}
            onNavigateToStudioAI={() => {
              setPlatform('creative-ai');
              setActiveRoute('studio-dash');
            }}
            onNavigateToContracts={() => setActiveRoute('contracts')}
            onNavigateToBilling={() => setActiveRoute('billing')}
            onNavigateToAlerts={() => setActiveRoute('diagnostics')}
            onNavigateToMaintenance={() => setActiveRoute('maintenance')}
            onNavigateToOfflineDisplays={() => {
              setSelectedDisplayId(null);
              setActiveRoute('displays');
            }}
            onNavigateToDiagnostics={() => setActiveRoute('diagnostics')}
            onNavigateToDevices={() => {
              setSelectedDeviceId(null);
              setActiveRoute('devices');
            }}
            onNavigateToReferrals={() => setActiveRoute('affiliate-network')}
            onNavigateToCommissions={() => setActiveRoute('affiliate-commissions')}
            onNavigateToLinks={() => setActiveRoute('affiliate-links')}
            onNavigateToPayouts={() => setActiveRoute('affiliate-payouts')}
          />
        </ProtectedRoute>
      );
    }

    // CRM Routes: Clients
    if (activeRoute === 'clients') {
      return (
        <ProtectedRoute
          requiredPermission="customers.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedCustomerId ? (
            <ClientDetailPage
              customerId={selectedCustomerId}
              onBack={() => setSelectedCustomerId(null)}
              onNavigateToDisplay={handleNavigateToDisplay}
              onNavigateToPlaylist={handleNavigateToPlaylist}
            />
          ) : (
            <ClientsListPage
              onNavigateToDetail={(id) => setSelectedCustomerId(id)}
            />
          )}
        </ProtectedRoute>
      );
    }

    // CRM Routes: Advertisers
    if (activeRoute === 'advertisers') {
      return (
        <ProtectedRoute
          requiredPermission="advertisers.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedAdvertiserId ? (
            <AdvertiserDetailPage
              advertiserId={selectedAdvertiserId}
              onBack={() => setSelectedAdvertiserId(null)}
              onNavigateToCampaigns={() => setActiveRoute('campaigns')}
            />
          ) : (
            <AdvertisersListPage
              onNavigateToDetail={(id) => setSelectedAdvertiserId(id)}
            />
          )}
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'partners') {
      return <PartnersListPage />;
    }

    if (activeRoute === 'displays') {
      return (
        <ProtectedRoute
          requiredPermission="displays.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedDisplayId ? (
            <DisplayDetailPage
              displayId={selectedDisplayId}
              onBackToList={() => setSelectedDisplayId(null)}
            />
          ) : (
            <DisplaysListPage
              onNavigateToDetail={(id) => setSelectedDisplayId(id)}
            />
          )}
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'content') {
      return (
        <ProtectedRoute
          requiredPermission="content.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedContentId ? (
            <ContentDetailPage
              contentId={selectedContentId}
              onBack={() => setSelectedContentId(null)}
              onNavigateToDisplay={handleNavigateToDisplay}
            />
          ) : (
            <ContentLibraryPage
              onNavigateToDetail={(id) => setSelectedContentId(id)}
              onNavigateToPlaylistBuilder={(id) => {
                setSelectedPlaylistId(id);
                setActiveRoute('playlists');
              }}
            />
          )}
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'playlists') {
      return (
        <ProtectedRoute
          requiredPermission="playlists.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedPlaylistId ? (
            <PlaylistBuilderPage
              playlistId={selectedPlaylistId}
              onBack={() => setSelectedPlaylistId(null)}
              onNavigateToBuilder={(id) => setSelectedPlaylistId(id)}
              onDeletePlaylist={() => setSelectedPlaylistId(null)}
            />
          ) : (
            <PlaylistsListPage
              onNavigateToBuilder={(id) => setSelectedPlaylistId(id)}
            />
          )}
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'scheduling') {
      return (
        <ProtectedRoute
          requiredPermission="schedules.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {isCreatingSchedule ? (
            <ScheduleFormPage
              onBack={() => setIsCreatingSchedule(false)}
              onSaveSuccess={(newId) => {
                setIsCreatingSchedule(false);
                setSelectedScheduleId(newId);
              }}
            />
          ) : isEditingSchedule && selectedScheduleId ? (
            <ScheduleFormPage
              scheduleId={selectedScheduleId}
              onBack={() => setIsEditingSchedule(false)}
              onSaveSuccess={(updatedId) => {
                setIsEditingSchedule(false);
                setSelectedScheduleId(updatedId);
              }}
            />
          ) : selectedScheduleId ? (
            <ScheduleDetailPage
              scheduleId={selectedScheduleId}
              onBack={() => setSelectedScheduleId(null)}
              onNavigateToEdit={(id) => {
                setSelectedScheduleId(id);
                setIsEditingSchedule(true);
              }}
              onNavigateToPlaylist={handleNavigateToPlaylist}
              onNavigateToDisplay={handleNavigateToDisplay}
            />
          ) : (
            <SchedulingListPage
              onNavigateToDetail={(id) => {
                setSelectedScheduleId(id);
                setIsEditingSchedule(false);
                setIsCreatingSchedule(false);
              }}
              onNavigateToCreate={() => {
                setIsCreatingSchedule(true);
                setIsEditingSchedule(false);
              }}
              onNavigateToEdit={(id) => {
                setSelectedScheduleId(id);
                setIsEditingSchedule(true);
                setIsCreatingSchedule(false);
              }}
            />
          )}
        </ProtectedRoute>
      );
    }

    // Organization & User Management Routes
    if (activeRoute === 'org-settings' || activeRoute === '/settings/organization') {
      return (
        <ProtectedRoute
          requiredPermission="organization.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <OrganizationSettingsPage
            onNavigateToUsers={() => setActiveRoute('users-mgmt')}
          />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'users-mgmt' || activeRoute === '/settings/users') {
      return (
        <ProtectedRoute
          requiredPermission="users.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <UserManagementPage />
        </ProtectedRoute>
      );
    }

    // SaaS Routes: Plans
    if (activeRoute === 'plans' || activeRoute === '/plans') {
      return (
        <ProtectedRoute
          requiredPermission="plans.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedPlanId ? (
            <PlanDetailPage
              planId={selectedPlanId}
              onBack={() => setSelectedPlanId(null)}
              onNavigateToSubscription={handleNavigateToSubscription}
            />
          ) : (
            <PlansListPage
              onNavigateToDetail={(id) => setSelectedPlanId(id)}
            />
          )}
        </ProtectedRoute>
      );
    }

    // AI Agent Squad Kiosk Mode
    if (activeRoute === 'ai-kiosk' || activeRoute === '/ai-kiosk') {
      return (
        <ProtectedRoute
          requiredPermission="platform.admin"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AIAgentKioskPage onBack={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    // WhatsApp Business & Agentes Evolution API Admin Page
    if (activeRoute === 'whatsapp-admin' || activeRoute === '/admin/whatsapp') {
      return (
        <ProtectedRoute
          requiredPermission="platform.admin"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <WhatsAppAdminPage />
        </ProtectedRoute>
      );
    }

    // Gestão de Backups do Banco SQL & Disaster Recovery (Admin)
    if (activeRoute === 'database-backups' || activeRoute === '/admin/backups') {
      return (
        <ProtectedRoute
          requiredPermission="platform.admin"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <DatabaseBackupsPage />
        </ProtectedRoute>
      );
    }

    // SaaS Routes: My Subscription (Client Organization view)
    if (activeRoute === 'my-subscription' || activeRoute === '/my-subscription') {
      return (
        <ProtectedRoute
          requiredPermission="subscription.usage.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <MySubscriptionPage
            onExplorePlans={() => {
              setSelectedPlanId(null);
              setActiveRoute('plans');
            }}
          />
        </ProtectedRoute>
      );
    }

    // Contracts Routes
    if (activeRoute === 'contracts' || activeRoute === '/contracts') {
      return (
        <ProtectedRoute
          requiredPermission="contracts.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedContractId ? (
            <ContractDetailPage
              contractId={selectedContractId}
              onBack={() => setSelectedContractId(null)}
            />
          ) : (
            <ContractsListPage
              onNavigateToDetail={(id) => setSelectedContractId(id)}
              onNavigateToTemplates={() => setActiveRoute('contract-templates')}
              onNavigateToPlans={() => setActiveRoute('my-subscription')}
            />
          )}
        </ProtectedRoute>
      );
    }

    // Contract Templates Route (Admin)
    if (activeRoute === 'contract-templates' || activeRoute === '/contract-templates') {
      return (
        <ProtectedRoute
          requiredPermission="templates.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <ContractTemplatesPage
            onBack={() => setActiveRoute('contracts')}
          />
        </ProtectedRoute>
      );
    }

    // Advertising & Marketplace Routes: Marketplace
    if (activeRoute === 'marketplace' || activeRoute === '/marketplace') {
      return (
        <ProtectedRoute
          requiredPermissions={['marketplace.view', 'campaigns.read']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <MarketplacePage
            onNavigateToCampaigns={() => {
              setSelectedCampaignId(null);
              setActiveRoute('campaigns');
            }}
            onNavigateToCampaignDetail={(id) => handleNavigateToCampaign(id)}
            onNavigateToNewDisplay={() => {
              setSelectedDisplayId(null);
              setActiveRoute('displays');
            }}
          />
        </ProtectedRoute>
      );
    }

    // Advertising & Marketplace Routes: Campaigns
    if (activeRoute === 'campaign-builder' || activeRoute === '/advertising/campaigns/new') {
      return (
        <ProtectedRoute
          requiredPermission="campaigns.create"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <CampaignBuilderPage
            onBack={() => setActiveRoute('campaigns')}
            onSave={(campaign) => {
              setSelectedCampaignId(null);
              setActiveRoute('campaigns');
            }}
          />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'campaign-report') {
      return (
        <ProtectedRoute
          requiredPermission="campaigns.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedCampaignId ? (
            <CampaignReportPage
              campaignId={selectedCampaignId}
              onBack={() => setActiveRoute('campaigns')}
            />
          ) : (
            <CampaignsListPage
              onNavigateToDetail={(id) => setSelectedCampaignId(id)}
              onNavigateToMarketplace={() => setActiveRoute('marketplace')}
            />
          )}
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'campaigns' || activeRoute === '/campaigns') {
      return (
        <ProtectedRoute
          requiredPermission="campaigns.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedCampaignId ? (
            <CampaignDetailPage
              campaignId={selectedCampaignId}
              onBack={() => setSelectedCampaignId(null)}
              onNavigateToDisplay={handleNavigateToDisplay}
              onNavigateToContent={handleNavigateToContent}
              onNavigateToReport={(id) => {
                setSelectedCampaignId(id);
                setActiveRoute('campaign-report');
              }}
            />
          ) : (
            <CampaignsListPage
              onNavigateToDetail={(id) => setSelectedCampaignId(id)}
              onNavigateToMarketplace={() => setActiveRoute('marketplace')}
              onNavigateToNewCampaign={() => setActiveRoute('campaign-builder')}
            />
          )}
        </ProtectedRoute>
      );
    }

    // Advertising & Marketplace Routes: Media Inventory & Monetization
    if (activeRoute === 'inventory' || activeRoute === '/inventory' || activeRoute === 'media-inventory') {
      return (
        <ProtectedRoute
          requiredPermission="inventory.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <MediaInventoryPage
            onNavigateToDisplay={handleNavigateToDisplay}
            onNavigateToMarketplace={() => setActiveRoute('marketplace')}
          />
        </ProtectedRoute>
      );
    }

    // Client/Store Owner: Minhas Comissões & Ganhos
    if (activeRoute === 'commissions' || activeRoute === '/commissions') {
      return (
        <ProtectedRoute
          requiredPermission="inventory.monetize"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <ClientCommissionsPage />
        </ProtectedRoute>
      );
    }

    // Nexora Admin: Contas a Pagar a Proprietários (Payouts)
    if (activeRoute === 'payouts' || activeRoute === '/admin/payouts') {
      return (
        <ProtectedRoute
          requiredPermission="platform.admin"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AdminPayoutsPage />
        </ProtectedRoute>
      );
    }

    // Nexora Admin: Gestão de Afiliados & Configuração de Percentagens de Recorrência
    if (activeRoute === 'admin-affiliates' || activeRoute === '/admin/affiliates') {
      return (
        <ProtectedRoute
          requiredPermission="platform.admin"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AdminAffiliatesPage onBack={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    // Afiliado: Minha Rede (Parceiros, Anunciantes, Clientes)
    if (activeRoute === 'affiliate-network' || activeRoute === '/affiliates/network' || activeRoute === 'affiliate-referrals' || activeRoute === '/affiliates/referrals') {
      return (
        <ProtectedRoute
          requiredPermission="affiliate.dashboard"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AffiliateReferralsPage onBack={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    // Afiliado: Extrato de Comissões Recorrentes
    if (activeRoute === 'affiliate-commissions' || activeRoute === '/affiliates/commissions') {
      return (
        <ProtectedRoute
          requiredPermission="affiliate.commissions"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AffiliateCommissionsPage onBack={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    // Afiliado: Links de Divulgação
    if (activeRoute === 'affiliate-links' || activeRoute === '/affiliates/links') {
      return (
        <ProtectedRoute
          requiredPermission="affiliate.dashboard"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AffiliateLinksPage onBack={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    // Afiliado: Carteira & Saques
    if (activeRoute === 'affiliate-payouts' || activeRoute === '/affiliates/payouts') {
      return (
        <ProtectedRoute
          requiredPermission="affiliate.payouts"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AffiliatePayoutsPage onBack={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    // Developer & Devices Routes
    if (activeRoute === 'devices' || activeRoute === '/devices') {
      return (
        <ProtectedRoute
          requiredPermission="displays.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          {selectedDeviceId ? (
            <DeviceDetailPage
              deviceId={selectedDeviceId}
              onBack={() => setSelectedDeviceId(null)}
            />
          ) : (
            <DevicesListPage
              onNavigateToDetail={(id) => setSelectedDeviceId(id)}
            />
          )}
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'player-simulator' || activeRoute === '/developer/player-simulator') {
      return (
        <ProtectedRoute
          requiredPermission="displays.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <PlayerSimulatorPage />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'webcam-audit') {
      return (
        <ProtectedRoute
          requiredPermission="displays.read"
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <WebcamAuditPage />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'notifications') {
      return (
        <NotificationsPage onBack={() => setActiveRoute('overview')} />
      );
    }
    if (activeRoute === 'campaign-simulator' || activeRoute === '/developer/campaign-simulator') {
      return (
        <ProtectedRoute
          requiredPermissions={['platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <CampaignSimulatorPage />
        </ProtectedRoute>
      );
    }

    // Nexora Studio IA Routes
    if (activeRoute === 'studio-dash' || activeRoute === 'studio' || activeRoute === '/studio') {
      return (
        <ProtectedRoute
          requiredPermissions={['content.create', 'campaigns.create', 'platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <StudioDashboardPage
            onNavigate={(path) => {
              const routeMap: Record<string, string> = {
                '/studio': 'studio-dash',
                '/studio/image': 'studio-image',
                '/studio/video': 'studio-video',
                '/studio/library': 'studio-library',
                '/studio/credits': 'studio-credits',
              };
              setActiveRoute(routeMap[path] || path);
            }}
          />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'studio-image' || activeRoute === '/studio/image') {
      return (
        <ProtectedRoute
          requiredPermissions={['content.create', 'campaigns.create', 'platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AccountScope scope={accountScopeKey}>
            <ImageGeneratorPage
              onBack={() => setActiveRoute('studio-dash')}
              onNavigate={(path) => {
                const routeMap: Record<string, string> = {
                  '/studio': 'studio-dash',
                  '/studio/image': 'studio-image',
                  '/studio/video': 'studio-video',
                  '/studio/library': 'studio-library',
                  '/studio/credits': 'studio-credits',
                };
                setActiveRoute(routeMap[path] || path);
              }}
            />
          </AccountScope>
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'studio-video' || activeRoute === '/studio/video') {
      return (
        <ProtectedRoute
          requiredPermissions={['content.create', 'campaigns.create', 'platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <AccountScope scope={accountScopeKey}>
            <VideoGeneratorPage
              onBack={() => setActiveRoute('studio-dash')}
              onNavigate={(path) => {
                const routeMap: Record<string, string> = {
                  '/studio': 'studio-dash',
                  '/studio/image': 'studio-image',
                  '/studio/video': 'studio-video',
                  '/studio/library': 'studio-library',
                  '/studio/credits': 'studio-credits',
                };
                setActiveRoute(routeMap[path] || path);
              }}
            />
          </AccountScope>
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'studio-library' || activeRoute === '/studio/library') {
      return (
        <ProtectedRoute
          requiredPermissions={['content.read', 'campaigns.read', 'platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <StudioLibraryPage
            onBack={() => setActiveRoute('studio-dash')}
          />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'studio-credits' || activeRoute === '/studio/credits' || activeRoute === 'ai-credits' || activeRoute === 'aicredits') {
      return (
        <ProtectedRoute
          requiredPermissions={['aicredits.read', 'billing.read', 'platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <CreditsPage
            onBack={() => setActiveRoute('studio-dash')}
          />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'financial' || activeRoute === '/financial') {
      return (
        <ProtectedRoute
          requiredPermissions={['billing.read', 'platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <FinancialPage onBackToDashboard={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'maintenance' || activeRoute === '/maintenance') {
      return (
        <ProtectedRoute
          requiredPermissions={['maintenance.read', 'platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <MaintenancePage onBackToDashboard={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    if (activeRoute === 'settings' || activeRoute === '/settings') {
      return (
        <ProtectedRoute
          requiredPermissions={['organization.read', 'platform.admin']}
          onNavigateHome={() => setActiveRoute('overview')}
        >
          <SettingsPage onBackToDashboard={() => setActiveRoute('overview')} />
        </ProtectedRoute>
      );
    }

    // Module definitions for other sections
    const moduleMap: Record<
      string,
      {
        title: string;
        description: string;
        icon: React.ReactNode;
        features: string[];
      }
    > = {
      'ai-credits': {
        title: 'Nexora Studio IA & Créditos',
        description: 'Geração de vídeos publicitários com IA, adaptação visual inteligente e saldo de créditos.',
        icon: <Sparkles className="w-5 h-5 text-[#C084FC]" />,
        features: [
          'Geração e resizing inteligente de criativos para formatos indoor',
          'Consumo e recarga de créditos com histórico detalhado',
          'Adaptação de texto, legendas e narração sintética',
          'Renderização automatizada na nuvem',
        ],
      },
    };

    const currentMod = moduleMap[activeRoute];
    if (currentMod) {
      return (
        <PlaceholderModule
          id={activeRoute}
          title={currentMod.title}
          description={currentMod.description}
          icon={currentMod.icon}
          expectedFeatures={currentMod.features}
          onBackToDashboard={() => setActiveRoute('overview')}
        />
      );
    }

    return <DashboardShell onOpenShowcase={() => setActiveRoute('showcase')} />;
  };

  // ─── Ambiente 3: painel de admin do Nexora Creative AI ─────────────────────
  // Renderizado ANTES do isCreativePlatform para que as rotas `ca-*` não caiam
  // no estúdio. Exige a categoria de admin do Creative AI.
  const isCreativeAdminPlatform =
    platform === 'creative-admin' || activeRoute.startsWith('ca-');

  if (isCreativeAdminPlatform) {
    if (!canAccessCreativeAdmin(permissions)) {
      // Nota: usa-se `canAccessCreativeAdmin` e não `ProtectedRoute` de propósito.
      // O `permissionService` concede tudo a quem tem `platform.admin`, o que
      // deixaria um admin geral entrar no painel do Creative AI e destruiria a
      // separação dos dois ecossistemas que este painel existe para garantir.
      return (
        <AccessDeniedPage
          requiredPermission="creativeadmin.access"
          onBackToDashboard={() => {
            setPlatform(null);
            setActiveRoute('overview');
          }}
        />
      );
    }

    const visibleSections = getVisibleCreativeAdminSections(permissions);
    const activeSection = visibleSections.find((s) => s.id === activeRoute) || visibleSections[0];
    const canManageCredits = permissions.includes('platform.all') || permissions.includes('creativeadmin.credits');
    const canManagePackages = permissions.includes('platform.all') || permissions.includes('creativeadmin.packages');

    return (
      <CreativeAdminShell
        activeRoute={activeSection?.id || 'ca-overview'}
        onRouteChange={setActiveRoute}
        onSwitchPlatform={() => {
          setPlatform(null);
          setActiveRoute('overview');
        }}
        onNavigateToSettings={() => {
          setPlatform('sign');
          setActiveRoute('settings');
        }}
      >
        {activeSection?.id === 'ca-users' && <CreativeAdminUsersPage />}
        {activeSection?.id === 'ca-credits' && (
          <CreativeAdminCreditsPage canManage={canManageCredits} />
        )}
        {activeSection?.id === 'ca-approvals' && (
          <CreativeAdminApprovalsPage canManage={canManageCredits} />
        )}
        {activeSection?.id === 'ca-packages' && (
          <CreativeAdminPackagesPage canManage={canManagePackages} />
        )}
        {activeSection?.id === 'ca-models' && (
          <CreativeAdminModelsPage canManage={canManagePackages} />
        )}
        {activeSection?.id === 'ca-analytics' && <CreativeAdminAnalyticsPage />}
        {(activeSection?.id === 'ca-overview' || !activeSection) && (
          <CreativeAdminOverviewPage onNavigate={setActiveRoute} />
        )}
      </CreativeAdminShell>
    );
  }

  const isCreativePlatform =
    platform === 'creative-ai' ||
    activeRoute.startsWith('studio') ||
    activeRoute === 'aicredits' ||
    activeRoute === 'ai-credits';

  if (isCreativePlatform) {
    return (
      <CreativeAIShell
        activeRoute={activeRoute}
        onRouteChange={(routeId) => {
          const routeMap: Record<string, string> = {
            '/studio': 'studio-dash',
            '/studio/image': 'studio-image',
            '/studio/video': 'studio-video',
            '/studio/library': 'studio-library',
            '/studio/credits': 'studio-credits',
          };
          setActiveRoute(routeMap[routeId] || routeId);
        }}
        onSwitchPlatform={() => {
          setPlatform('sign');
          setActiveRoute('overview');
        }}
        onNavigateToOrgSettings={() => {
          setPlatform('sign');
          setActiveRoute('org-settings');
        }}
      >
        <CreateAdminQuickModal
          isOpen={isAdminCreateModalOpen}
          onClose={() => setIsAdminCreateModalOpen(false)}
        />
        {renderContent()}
      </CreativeAIShell>
    );
  }

  return (
    <>
      <CreateAdminQuickModal
        isOpen={isAdminCreateModalOpen}
        onClose={() => setIsAdminCreateModalOpen(false)}
      />
      <AppShell
        activeRoute={activeRoute}
        activePlatform={platform}
        onSwitchPlatform={() => setPlatform(null)}
        onRouteChange={(routeId) => {
          if (routeId === 'displays') setSelectedDisplayId(null);
          if (routeId === 'content') setSelectedContentId(null);
          if (routeId === 'playlists') setSelectedPlaylistId(null);
          if (routeId === 'clients') setSelectedCustomerId(null);
          if (routeId === 'advertisers') setSelectedAdvertiserId(null);
          if (routeId === 'plans' || routeId === '/plans') setSelectedPlanId(null);
          if (routeId === 'subscriptions' || routeId === '/subscriptions') setSelectedSubscriptionId(null);
          if (routeId === 'contracts' || routeId === '/contracts') setSelectedContractId(null);
          if (routeId === 'campaigns' || routeId === '/campaigns') setSelectedCampaignId(null);
          if (routeId === 'scheduling') {
            setSelectedScheduleId(null);
            setIsEditingSchedule(false);
            setIsCreatingSchedule(false);
          }
          setActiveRoute(routeId);
        }}
        onOpenComponentGallery={() => setActiveRoute('showcase')}
        onNavigateToOrgSettings={() => setActiveRoute('org-settings')}
        onNavigateToUsers={() => setActiveRoute('users-mgmt')}
        onNavigateToSettings={() => setActiveRoute('settings')}
        onNavigateToPartners={() => setActiveRoute('partners')}
        onNavigateToNotifications={() => setActiveRoute('notifications')}
      >
        {renderContent()}
      </AppShell>
    </>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <BackgroundGenerationProvider>
          <OfflineIndicator />
          <AppContent />
          <PWAInstallPrompt />
        </BackgroundGenerationProvider>
      </ToastProvider>
    </SessionProvider>
  );
}


