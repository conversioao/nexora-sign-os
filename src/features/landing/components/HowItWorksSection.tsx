import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, MapPin, Wrench, Cloud, BarChart3, ChevronDown } from 'lucide-react';

interface HowItWorksSectionProps {
  onOpenDetailsModal: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onOpenDetailsModal }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const steps = [
    {
      number: '01',
      title: 'DISPONIBILIZE O ESPAÇO',
      description: 'Identificamos o melhor local para o equipamento no seu estabelecimento comercial.',
      icon: MapPin,
      gradient: 'from-[#2563EB] to-[#22D3EE]',
    },
    {
      number: '02',
      title: 'NEXORA INSTALA',
      description: 'A infraestrutura completa é instalada e integrada à nossa rede nacional.',
      icon: Wrench,
      gradient: 'from-[#22D3EE] to-[#7C3AED]',
    },
    {
      number: '03',
      title: 'A REDE É GERIDA',
      description: 'Conteúdos e campanhas são administrados automaticamente através da plataforma cloud.',
      icon: Cloud,
      gradient: 'from-[#7C3AED] to-[#D946EF]',
    },
    {
      number: '04',
      title: 'VOCÊ ACOMPANHA',
      description: 'Métricas, relatórios e rendimentos ficam disponíveis em tempo real no seu painel.',
      icon: BarChart3,
      gradient: 'from-[#D946EF] to-[#2563EB]',
    },
  ];

  return (
    <section id="how-it-works" className="relative py-24 lg:py-32 bg-[#050816] text-white overflow-hidden">
      {/* Section divider */}
      <div className="landing-section-divider absolute top-0 inset-x-0" />

      {/* Background orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#22D3EE]/4 rounded-full blur-[200px] pointer-events-none" />

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-6"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/25 text-[#22D3EE] text-xs font-semibold tracking-wider uppercase">
              <span>Como Funciona</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight uppercase leading-[1.1]">
              É SIMPLES. É RÁPIDO. <br />
              <span className="bg-gradient-to-r from-[#22D3EE] via-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
                É NEXORA.
              </span>
            </h2>
          </div>

          <button
            onClick={onOpenDetailsModal}
            className="px-6 py-3 rounded-full text-xs font-bold text-white bg-[#0A1020] border border-[#22D3EE]/30 hover:border-[#22D3EE] hover:bg-[#22D3EE]/10 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto shadow-[0_0_15px_rgba(34,211,238,0.12)]"
          >
            <span>Ver detalhes</span>
            <ArrowRight className="w-4 h-4 text-[#22D3EE]" />
          </button>
        </motion.div>

        {/* 4 Connected Steps Flow */}
        <div className="relative">

          {/* Connecting Gradient Line — Desktop */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 1.2, delay: 0.3 }}
            className="hidden lg:block absolute top-12 left-10 right-10 h-[2px] bg-gradient-to-r from-[#2563EB] via-[#22D3EE] via-[#7C3AED] to-[#D946EF] opacity-30 z-0 origin-left"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + idx * 0.15 }}
                  className="flex flex-col items-center text-center group"
                >

                  {/* Step Circle */}
                  <div className="relative mb-8">
                    <div className={`w-24 h-24 rounded-full bg-gradient-to-tr ${step.gradient} p-[2px] shadow-[0_0_30px_rgba(34,211,238,0.2)] group-hover:shadow-[0_0_40px_rgba(34,211,238,0.35)] group-hover:scale-110 transition-all duration-500`}>
                      <div className="w-full h-full rounded-full bg-[#050816] flex items-center justify-center relative">
                        <Icon className="w-9 h-9 text-[#22D3EE] group-hover:scale-110 transition-transform duration-300" />

                        {/* Number Badge */}
                        <div className={`absolute -top-2 -right-2 px-2.5 py-1 rounded-full bg-gradient-to-r ${step.gradient} text-white text-[11px] font-black font-display shadow-lg`}>
                          {step.number}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-2 max-w-xs">
                    <h3 className="text-sm font-bold text-white font-display tracking-tight group-hover:text-[#22D3EE] transition-colors uppercase">
                      {step.title}
                    </h3>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Connected Arrow Indicator for Mobile/Tablet */}
                  {idx < steps.length - 1 && (
                    <div className="lg:hidden mt-6 text-[#22D3EE]/40">
                      <ChevronDown className="w-6 h-6 animate-bounce" />
                    </div>
                  )}

                </motion.div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
};
