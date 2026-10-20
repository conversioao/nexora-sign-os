import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, Layout, Tv, Smartphone, Sparkles, ChevronRight, ExternalLink } from 'lucide-react';

interface EcosystemSectionProps {
  onOpenProductModal: (productName: string) => void;
}

export const EcosystemSection: React.FC<EcosystemSectionProps> = ({ onOpenProductModal }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const products = [
    {
      id: 'sign',
      title: 'NEXORA SIGN',
      subtitle: 'Plataforma CMS Cloud',
      description: 'Gestão remota de ecrãs, agendamento de conteúdos e estatísticas de exibição em tempo real.',
      icon: Layout,
      tag: 'SOFTWARE CMS',
      image: '/assets/nexora_sign_dashboard.png',
      gradient: 'from-[#22D3EE] to-[#2563EB]',
      glowColor: 'rgba(34, 211, 238, 0.15)',
      hoverBorder: 'hover:border-[#22D3EE]/40',
    },
    {
      id: 'player',
      title: 'NEXORA PLAYER',
      subtitle: 'Hardware Dedicated OS',
      description: 'Dispositivo ultraestável com armazenamento local e sincronização contínua de conteúdos.',
      icon: Tv,
      tag: 'HARDWARE & OS',
      image: '/assets/nexora_player_device.png',
      gradient: 'from-[#2563EB] to-[#7C3AED]',
      glowColor: 'rgba(37, 99, 235, 0.15)',
      hoverBorder: 'hover:border-[#2563EB]/40',
    },
    {
      id: 't32',
      title: 'NEXORA T32',
      subtitle: 'Totem Digital Indoor 32"',
      description: 'Display vertical premium de alto brilho concebido para restaurantes, lojas e hotéis.',
      icon: Smartphone,
      tag: 'EQUIPAMENTO',
      image: '/assets/nexora_t32_totem.png',
      gradient: 'from-[#7C3AED] to-[#D946EF]',
      glowColor: 'rgba(124, 58, 237, 0.15)',
      hoverBorder: 'hover:border-[#7C3AED]/40',
    },
    {
      id: 'creative-ai',
      title: 'NEXORA CREATIVE AI',
      subtitle: 'Gerador de Vinhetas IA',
      description: 'Crie artes e anúncios de alta qualidade adaptados aos ecrãs com inteligência artificial.',
      icon: Sparkles,
      tag: 'IA GENERATIVA',
      image: '/assets/nexora_creative_ai.png',
      gradient: 'from-[#D946EF] to-[#22D3EE]',
      glowColor: 'rgba(217, 70, 239, 0.15)',
      hoverBorder: 'hover:border-[#D946EF]/40',
    },
  ];

  return (
    <section id="ecosystem" className="relative py-24 lg:py-32 bg-[#050816] text-white overflow-hidden">
      {/* Section divider */}
      <div className="landing-section-divider absolute top-0 inset-x-0" />

      {/* Background orbs */}
      <div className="absolute top-20 -right-40 w-[600px] h-[600px] bg-[#7C3AED]/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-20 -left-40 w-[500px] h-[500px] bg-[#22D3EE]/5 rounded-full blur-[180px] pointer-events-none" />

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/10 border border-[#7C3AED]/25 text-[#C084FC] text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tecnologia Proprietária</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white uppercase leading-[1.08]">
              ECOSSISTEMA INTEGRADO DE <br />
              <span className="bg-gradient-to-r from-[#22D3EE] via-[#7C3AED] to-[#D946EF] bg-clip-text text-transparent">
                MÍDIA DIGITAL INDOOR
              </span>
            </h2>
            <p className="text-[#94A3B8] text-sm max-w-xl leading-relaxed">
              Quatro componentes interconectados para maximizar a eficácia dos anúncios e a monetização dos espaços.
            </p>
          </div>

          <button
            onClick={() => onOpenProductModal('Ecossistema Nexora')}
            className="px-6 py-3 rounded-full text-xs font-bold text-white bg-[#0A1020] border border-[#7C3AED]/30 hover:border-[#7C3AED] hover:bg-[#7C3AED]/10 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto uppercase tracking-wider shadow-[0_0_15px_rgba(124,58,237,0.15)]"
          >
            <span>Ver Especificações</span>
            <ChevronRight className="w-4 h-4 text-[#C084FC]" />
          </button>
        </motion.div>

        {/* 4 Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, i) => {
            const Icon = product.icon;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
                onClick={() => onOpenProductModal(product.title)}
                className={`group landing-glass-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer ${product.hoverBorder} relative overflow-hidden`}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                  style={{ boxShadow: `inset 0 0 60px ${product.glowColor}` }}
                />

                {/* Top: Icon + Badge */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/6 relative z-10">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${product.gradient} p-[1px]`}>
                    <div className="w-full h-full rounded-xl bg-[#050816] flex items-center justify-center group-hover:bg-[#0A1020] transition-colors">
                      <Icon className="w-4.5 h-4.5 text-white/80" />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#64748B] bg-white/[0.04] px-2 py-1 rounded-md border border-white/6 uppercase tracking-wider group-hover:text-[#94A3B8] transition-colors">
                    {product.tag}
                  </span>
                </div>

                {/* Image Preview */}
                <div className="h-44 w-full rounded-xl overflow-hidden relative mb-4 bg-[#0A1020] border border-white/5">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover object-center opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 filter grayscale-[40%] group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-transparent" />
                </div>

                {/* Content */}
                <div className="space-y-2 relative z-10">
                  <h3 className="text-sm font-bold font-display text-white uppercase group-hover:text-[#22D3EE] transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-[11px] text-[#C084FC]/80 uppercase font-semibold tracking-wide">
                    {product.subtitle}
                  </p>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Bottom Action */}
                <div className="pt-4 mt-4 border-t border-white/6 flex items-center justify-between text-xs font-semibold text-[#64748B] group-hover:text-[#22D3EE] transition-colors relative z-10">
                  <span className="uppercase tracking-wider">Detalhes técnicos</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
