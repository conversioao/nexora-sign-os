import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, Sparkles } from 'lucide-react';

interface FinalCTASectionProps {
  onOpenPartnerModal: () => void;
  onOpenAdvertiserModal: () => void;
}

export const FinalCTASection: React.FC<FinalCTASectionProps> = ({
  onOpenPartnerModal,
  onOpenAdvertiserModal,
}) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section className="relative py-28 lg:py-36 bg-[#050816] text-white overflow-hidden">
      {/* Section divider */}
      <div className="landing-section-divider absolute top-0 inset-x-0" />

      {/* Background Panoramic Image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity"
        style={{ backgroundImage: `url('/assets/hero_totem_boutique.png')` }}
      />

      {/* Deep Navy Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/80 to-[#050816]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#050816] via-transparent to-[#050816]" />

      {/* Electric Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#22D3EE]/10 rounded-full blur-[180px] pointer-events-none landing-pulse-glow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-[#7C3AED]/10 rounded-full blur-[160px] pointer-events-none" />

      <div ref={sectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">

        {/* Top Glow Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#0A1020] border border-[#22D3EE]/30 text-xs font-semibold text-[#22D3EE] shadow-[0_0_25px_rgba(34,211,238,0.15)]"
        >
          <Sparkles className="w-4 h-4 text-[#22D3EE]" />
          <span>EXPANSÃO DA REDE MÍDIA INDOOR EM ANGOLA</span>
        </motion.div>

        {/* Main Title */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-tight tracking-tight uppercase"
        >
          PRONTO PARA FAZER PARTE <br />
          DA REDE{' '}
          <span className="bg-gradient-to-r from-[#22D3EE] via-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent landing-gradient-shift bg-[length:200%_200%]">
            NEXORA?
          </span>
        </motion.h2>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base sm:text-lg text-[#94A3B8] max-w-2xl mx-auto leading-relaxed"
        >
          Seja um parceiro ou anunciante. Conecte a sua marca ao público certo em pontos estratégicos por todo o país.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-5 pt-4"
        >
          <button
            onClick={onOpenPartnerModal}
            className="px-8 py-4 rounded-full text-sm font-bold text-[#050816] bg-gradient-to-r from-[#22D3EE] via-[#2563EB] to-[#22D3EE] bg-[length:200%_auto] hover:bg-right transition-all duration-500 shadow-[0_0_35px_rgba(34,211,238,0.35)] hover:shadow-[0_0_50px_rgba(34,211,238,0.5)] cursor-pointer flex items-center gap-2 transform hover:-translate-y-1"
          >
            <span>Quero ser Parceiro</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenAdvertiserModal}
            className="px-8 py-4 rounded-full text-sm font-bold text-white bg-[#0A1020] border border-white/15 hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/10 transition-all duration-300 cursor-pointer shadow-lg transform hover:-translate-y-1"
          >
            Anunciar na NEXORA
          </button>
        </motion.div>

      </div>
    </section>
  );
};
