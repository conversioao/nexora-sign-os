import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Star, ArrowRight, Quote, Sparkles } from 'lucide-react';

interface TestimonialsSectionProps {
  onOpenTestimonialsModal: () => void;
}

/* Premium initials-based avatar component */
const TestimonialAvatar: React.FC<{ initials: string; gradient: string }> = ({ initials, gradient }) => (
  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${gradient} p-[2px] shadow-lg shrink-0`}>
    <div className="w-full h-full rounded-full bg-[#050816] flex items-center justify-center">
      <span className="text-xs font-black text-white font-display tracking-tight">{initials}</span>
    </div>
  </div>
);

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ onOpenTestimonialsModal }) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const testimonials = [
    {
      id: 1,
      quote: 'Excelente solução para o nosso espaço. A instalação foi rápida e o suporte é ótimo. Os nossos clientes adoram o conteúdo dinâmico.',
      name: 'Carlos Manuel',
      role: 'Proprietário de Loja',
      location: 'Talatona, Luanda',
      initials: 'CM',
      gradient: 'from-[#2563EB] to-[#22D3EE]',
      stars: 5,
    },
    {
      id: 2,
      quote: 'Os conteúdos são sempre atuais e trazem mais movimento para a loja. A plataforma é muito intuitiva e os relatórios são detalhados.',
      name: 'Ana Beatriz',
      role: 'Gerente de Restaurante',
      location: 'Ilha de Luanda',
      initials: 'AB',
      gradient: 'from-[#7C3AED] to-[#D946EF]',
      stars: 5,
    },
    {
      id: 3,
      quote: 'Uma parceria que agrega valor ao nosso negócio. A receita passiva mensal superou as nossas expectativas iniciais.',
      name: 'Paulo Mendes',
      role: 'Administrador de Supermercado',
      location: 'Maianga, Luanda',
      initials: 'PM',
      gradient: 'from-[#22D3EE] to-[#7C3AED]',
      stars: 5,
    },
  ];

  return (
    <section id="testimonials" className="relative py-24 lg:py-32 bg-[#050816] text-white overflow-hidden">
      {/* Section divider */}
      <div className="landing-section-divider absolute top-0 inset-x-0" />

      {/* Background orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#2563EB]/5 rounded-full blur-[200px] pointer-events-none" />

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/25 text-[#22D3EE] text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Casos de Sucesso em Angola</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight uppercase leading-[1.1]">
              O QUE DIZEM OS <br />
              <span className="bg-gradient-to-r from-[#22D3EE] via-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
                NOSSOS PARCEIROS?
              </span>
            </h2>
          </div>

          <button
            onClick={onOpenTestimonialsModal}
            className="px-6 py-3 rounded-full text-xs font-bold text-white bg-[#0A1020] border border-[#22D3EE]/30 hover:border-[#22D3EE] hover:bg-[#22D3EE]/10 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto shadow-[0_0_15px_rgba(34,211,238,0.12)]"
          >
            <span>Ver todos</span>
            <ArrowRight className="w-4 h-4 text-[#22D3EE]" />
          </button>
        </motion.div>

        {/* 3 Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.12 }}
              className="landing-glass-card rounded-2xl p-6 flex flex-col justify-between relative group"
            >
              {/* Quote icon */}
              <Quote className="w-8 h-8 text-[#22D3EE]/10 absolute top-5 right-5 group-hover:text-[#22D3EE]/20 transition-colors" />

              <div className="space-y-4 relative z-10">
                {/* Rating Stars */}
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(t.stars)].map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-current" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-sm text-[#CBD5E1] leading-relaxed italic">
                  "{t.quote}"
                </p>
              </div>

              {/* Author Footer */}
              <div className="pt-6 mt-6 border-t border-white/6 flex items-center gap-3">
                <TestimonialAvatar initials={t.initials} gradient={t.gradient} />
                <div>
                  <h4 className="text-sm font-bold text-white font-display">{t.name}</h4>
                  <p className="text-[11px] text-[#22D3EE]">{t.role}</p>
                  <p className="text-[10px] text-[#64748B]">{t.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
