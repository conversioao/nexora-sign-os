import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';

interface LandingNavbarProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: (role?: 'partner' | 'advertiser') => void;
  onOpenPartnerModal?: () => void;
  onOpenAdvertiserModal?: () => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onNavigateToLogin,
  onNavigateToSignUp,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-500 ${
        scrolled
          ? 'backdrop-blur-2xl bg-[#050816]/85 border-b border-white/8 shadow-[0_4px_30px_rgba(0,0,0,0.3)]'
          : 'backdrop-blur-xl bg-[#050816]/40 border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">

        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <Logo variant="full" size="md" />
        </div>

        {/* Navigation Links */}
        <nav className="hidden lg:flex items-center gap-10 text-sm font-medium text-[#94A3B8]">
          <button
            onClick={() => scrollToSection('features')}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none py-1 relative group"
          >
            Plataforma
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#22D3EE] to-[#2563EB] group-hover:w-full transition-all duration-300" />
          </button>
          <button
            onClick={() => scrollToSection('whatsapp')}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none py-1 flex items-center gap-2 relative group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            WhatsApp Realtime
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-emerald-400 to-teal-300 group-hover:w-full transition-all duration-300" />
          </button>
          <button
            onClick={() => scrollToSection('ecosystem')}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none py-1 relative group"
          >
            Ecossistema
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#7C3AED] to-[#D946EF] group-hover:w-full transition-all duration-300" />
          </button>
          <button
            onClick={() => scrollToSection('audience')}
            className="hover:text-white transition-colors cursor-pointer bg-transparent border-none py-1 relative group"
          >
            Rede & Monetização
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#22D3EE] to-[#7C3AED] group-hover:w-full transition-all duration-300" />
          </button>
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onNavigateToLogin}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#94A3B8] hover:text-white hover:bg-white/8 transition-all cursor-pointer"
          >
            Entrar
          </button>

          <button
            onClick={() => onNavigateToSignUp()}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-[#050816] bg-gradient-to-r from-[#22D3EE] to-[#2563EB] hover:shadow-[0_0_25px_rgba(34,211,238,0.45)] transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)]"
          >
            Começar Agora
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl bg-white/5 border border-white/8 text-white cursor-pointer"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#050816]/95 backdrop-blur-2xl border-b border-white/6 px-6 pt-4 pb-8 space-y-4 text-sm font-medium">
          <div className="flex flex-col space-y-3 text-[#94A3B8]">
            <button
              onClick={() => scrollToSection('features')}
              className="text-left py-2 hover:text-white border-b border-white/5 transition-colors"
            >
              Plataforma
            </button>
            <button
              onClick={() => scrollToSection('whatsapp')}
              className="text-left py-2 text-emerald-400 border-b border-white/5 flex items-center justify-between"
            >
              <span>Notificações WhatsApp</span>
              <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">AO VIVO</span>
            </button>
            <button
              onClick={() => scrollToSection('ecosystem')}
              className="text-left py-2 hover:text-white border-b border-white/5 transition-colors"
            >
              Ecossistema
            </button>
            <button
              onClick={() => scrollToSection('audience')}
              className="text-left py-2 hover:text-white border-b border-white/5 transition-colors"
            >
              Rede & Monetização
            </button>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={onNavigateToLogin}
              className="w-full py-3 rounded-xl text-center text-sm font-semibold text-white bg-white/5 border border-white/8"
            >
              Entrar
            </button>
            <button
              onClick={() => onNavigateToSignUp()}
              className="w-full py-3 rounded-xl text-center text-sm font-bold text-[#050816] bg-gradient-to-r from-[#22D3EE] to-[#2563EB] shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            >
              Começar Agora
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
