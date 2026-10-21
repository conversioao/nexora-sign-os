import React from 'react';
import { Logo } from '../../../components/ui/Logo';
import { Instagram, Linkedin, Youtube } from 'lucide-react';

interface LandingFooterProps {
  onNavigateToLogin: () => void;
  onNavigateToSignUp: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onNavigateToLogin,
  onNavigateToSignUp,
}) => {
  return (
    <footer className="relative bg-[#050816] text-[#94A3B8] pt-20 pb-12 text-xs overflow-hidden">
      {/* Section divider */}
      <div className="landing-section-divider absolute top-0 inset-x-0" />

      {/* Subtle background orb */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#22D3EE]/3 rounded-full blur-[200px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Top Grid: Logo & 5 Navigation Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 pb-12 border-b border-white/6">

          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-5">
            <Logo variant="full" size="md" />
            <p className="text-xs text-[#64748B] max-w-sm leading-relaxed">
              Empresa angolana de mídia digital indoor. Infraestrutura tecnológica conectando anunciantes e parceiros em todo o país.
            </p>
            <div className="pt-1 flex items-center gap-3">
              {[
                { icon: Instagram, label: 'Instagram' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Youtube, label: 'YouTube' },
              ].map((social) => {
                const SocialIcon = social.icon;
                return (
                  <a
                    key={social.label}
                    href="#"
                    aria-label={social.label}
                    className="w-9 h-9 rounded-full bg-[#0A1020] border border-white/6 flex items-center justify-center text-[#64748B] hover:text-[#22D3EE] hover:border-[#22D3EE]/30 transition-all duration-300"
                  >
                    <SocialIcon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Col 1: Produtos */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">PRODUTOS</h4>
            <ul className="space-y-2.5 text-[#64748B]">
              <li><a href="#ecosystem" className="hover:text-[#22D3EE] transition-colors">NEXORA SIGN</a></li>
              <li><a href="#ecosystem" className="hover:text-[#22D3EE] transition-colors">NEXORA PLAYER</a></li>
              <li><a href="#ecosystem" className="hover:text-[#22D3EE] transition-colors">NEXORA T32</a></li>
              <li><a href="#ecosystem" className="hover:text-[#22D3EE] transition-colors">NEXORA CREATIVE AI</a></li>
            </ul>
          </div>

          {/* Col 2: Para Parceiros */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">PARA PARCEIROS</h4>
            <ul className="space-y-2.5 text-[#64748B]">
              <li><a href="#how-it-works" className="hover:text-[#22D3EE] transition-colors">Como Funciona</a></li>
              <li><a href="#audience" className="hover:text-[#22D3EE] transition-colors">Vantagens</a></li>
              <li><button onClick={onNavigateToSignUp} className="hover:text-[#22D3EE] transition-colors text-left bg-transparent border-none p-0 cursor-pointer">Cadastrar Espaço</button></li>
              <li><a href="#testimonials" className="hover:text-[#22D3EE] transition-colors">Depoimentos</a></li>
            </ul>
          </div>

          {/* Col 3: Para Anunciantes */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">PARA ANUNCIANTES</h4>
            <ul className="space-y-2.5 text-[#64748B]">
              <li><a href="#content-showcase" className="hover:text-[#22D3EE] transition-colors">Como Anunciar</a></li>
              <li><a href="#content-showcase" className="hover:text-[#22D3EE] transition-colors">Formatos HD</a></li>
              <li><button onClick={onNavigateToSignUp} className="hover:text-[#22D3EE] transition-colors text-left bg-transparent border-none p-0 cursor-pointer">Criar Campanha</button></li>
              <li><a href="#content-showcase" className="hover:text-[#22D3EE] transition-colors">Cases em Luanda</a></li>
            </ul>
          </div>

          {/* Col 4: Empresa */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-display">EMPRESA</h4>
            <ul className="space-y-2.5 text-[#64748B]">
              <li><a href="#testimonials" className="hover:text-[#22D3EE] transition-colors">Sobre Nós</a></li>
              <li><a href="#testimonials" className="hover:text-[#22D3EE] transition-colors">Contacto</a></li>
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-[#22D3EE] transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#475569]">
          <p>© 2026 NEXORA. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#0A1020] border border-white/6 text-white/80 text-xs font-medium">
            <span>🇦🇴</span>
            <span>Angola (Kz)</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
