import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, CheckCircle2, Share } from 'lucide-react';
import { Logo } from '../ui/Logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already installed / running in standalone mode
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) {
      return;
    }

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if dismissed recently (within 7 days)
    const lastDismissed = localStorage.getItem('nexora_pwa_dismissed');
    if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    // Android / Desktop Chrome BeforeInstallPrompt handler
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Wait 3 seconds after loading to show banner smoothly
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // App installed event
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // If iOS and not standalone, show after a delay
    if (isIosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstalledSuccess(true);
      setTimeout(() => setInstalledSuccess(false), 5000);
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('nexora_pwa_dismissed', Date.now().toString());
  };

  if (isStandalone || (!showPrompt && !installedSuccess)) {
    return null;
  }

  // Success Toast
  if (installedSuccess) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-[#07101F]/95 border border-emerald-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white">Nexora OS Instalado!</h4>
          <p className="text-[11px] text-slate-400">Acesse o app diretamente da tela inicial.</p>
        </div>
      </div>
    );
  }

  return (
    <aside
      aria-label="Instalação do Aplicativo Nexora OS"
      className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-50 bg-[#091024]/95 border border-[#00E5FF]/30 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(0,229,255,0.15)] backdrop-blur-2xl animate-in slide-in-from-bottom-6 duration-400"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00E5FF]/20 to-[#1677FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] shrink-0">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold text-white">Instalar App Nexora</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#00E5FF]/20 text-[#00E5FF] text-[9px] font-mono font-bold">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Instale para acesso rápido em tela cheia e experiência fluida.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          aria-label="Fechar banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isIOS ? (
        <div className="mt-3 p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px] text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
            <Share className="w-3.5 h-3.5" />
            <span>No iPhone / iPad:</span>
          </div>
          <p className="text-[10.5px] text-slate-400">
            Toque no botão <strong className="text-white">Compartilhar</strong> no Safari e selecione <strong className="text-white">"Adicionar à Tela de Início"</strong>.
          </p>
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#1677FF] hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-lg shadow-cyan-500/25 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Instalar Aplicativo</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Depois
          </button>
        </div>
      )}
    </aside>
  );
};
