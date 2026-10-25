import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import {
  MessageSquare, ShieldCheck, Activity, Zap, Radio, Bell,
  ArrowUpRight, Check, Sparkles, TrendingDown, Eye, Clock,
  AlertTriangle, BarChart3, Wifi
} from 'lucide-react';

interface FeaturesSectionProps {
  onOpenPartnerModal: () => void;
  onOpenAdvertiserModal: () => void;
}

/* ─── Animated Counter ─── */
const AnimatedStat: React.FC<{ value: string; label: string; suffix?: string; delay?: number }> = ({
  value, label, suffix = '', delay = 0
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay }}
      className="text-center px-4 sm:px-6"
    >
      <div className="text-3xl sm:text-4xl lg:text-5xl font-black font-display bg-gradient-to-r from-[#22D3EE] via-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
        {value}{suffix}
      </div>
      <p className="text-xs sm:text-sm text-[#94A3B8] mt-1 uppercase tracking-wider font-semibold">{label}</p>
    </motion.div>
  );
};

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({
  onOpenPartnerModal,
  onOpenAdvertiserModal,
}) => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  const challengeRef = useRef(null);
  const challengeInView = useInView(challengeRef, { once: true, margin: '-80px' });

  const solutionRef = useRef(null);
  const solutionInView = useInView(solutionRef, { once: true, margin: '-80px' });

  return (
    <section id="features" className="relative overflow-hidden">

      {/* ═══════════════════════════════════════
          PART 1 — Visual Transition: Stats Bar
         ═══════════════════════════════════════ */}
      <div className="relative py-16 lg:py-20 bg-[#050816]">
        {/* Gradient divider top */}
        <div className="landing-section-divider absolute top-0 inset-x-0" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            <AnimatedStat value="500+" label="Ecrãs Activos" delay={0} />
            <AnimatedStat value="2M+" label="Impressões / Mês" delay={0.15} />
            <AnimatedStat value="120+" label="Parceiros Comerciais" delay={0.3} />
            <AnimatedStat value="98" label="Uptime Garantido" suffix="%" delay={0.45} />
          </div>
        </div>

        {/* Gradient divider bottom */}
        <div className="landing-section-divider absolute bottom-0 inset-x-0" />
      </div>

      {/* ═══════════════════════════════════════
          PART 2 — O Desafio: Traditional Advertising
         ═══════════════════════════════════════ */}
      <div ref={challengeRef} className="relative py-24 lg:py-32 bg-[#050816]">
        {/* Background orbs */}
        <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[180px] pointer-events-none landing-pulse-glow" />
        <div className="absolute bottom-1/4 -right-40 w-[400px] h-[400px] bg-orange-500/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left: Challenge description */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={challengeInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>O Problema da Publicidade Tradicional</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white uppercase leading-[1.1]">
                A PUBLICIDADE <br />
                <span className="bg-gradient-to-r from-orange-400 via-red-400 to-rose-500 bg-clip-text text-transparent">
                  ESTÁTICA MORREU.
                </span>
              </h2>

              <p className="text-[#94A3B8] text-base leading-relaxed max-w-lg">
                Outdoors, panfletos e cartazes não acompanham o ritmo do consumidor moderno.
                Sem métricas, sem flexibilidade, sem impacto mensurável.
              </p>
            </motion.div>

            {/* Right: Pain points cards */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={challengeInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {[
                { icon: TrendingDown, title: 'Sem Métricas', desc: 'Impossível medir o retorno do investimento em publicidade física.' },
                { icon: Clock, title: 'Lento para Atualizar', desc: 'Mudar uma campanha leva dias ou semanas inteiras.' },
                { icon: Eye, title: 'Baixo Impacto', desc: 'Material estático é ignorado pelo consumidor moderno.' },
                { icon: AlertTriangle, title: 'Custo Elevado', desc: 'Impressão, distribuição e desperdício de materiais acumulam custos.' },
              ].map((pain, i) => (
                <motion.div
                  key={pain.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={challengeInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                  className="landing-glass-card rounded-2xl p-5 space-y-3 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                    <pain.icon className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold font-display uppercase text-white">{pain.title}</h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">{pain.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          PART 3 — A Solução NEXORA
         ═══════════════════════════════════════ */}
      <div ref={solutionRef} className="relative py-28 bg-[#050816]">
        {/* Glow orbs */}
        <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[160px] pointer-events-none" />
        <div className="absolute bottom-10 -right-32 w-[500px] h-[500px] bg-emerald-500/6 rounded-full blur-[160px] pointer-events-none" />

        {/* Section divider */}
        <div className="landing-section-divider absolute top-0 inset-x-0" />

        <div ref={sectionRef} className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">

          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={solutionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            className="text-center space-y-4 max-w-3xl mx-auto mb-20"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wider uppercase backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Marketplace DOOH Nº 1 em Angola</span>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black font-display tracking-tight text-white uppercase leading-[1.08]">
              A PLATAFORMA LÍDER DE <br />
              <span className="bg-gradient-to-r from-[#22D3EE] via-[#2563EB] to-emerald-400 bg-clip-text text-transparent">
                MÍDIA INDOOR EM ANGOLA
              </span>
            </h2>

            <p className="text-[#94A3B8] text-base font-light max-w-2xl mx-auto leading-relaxed">
              Tecnologia cloud de ponta que conecta anunciantes a estabelecimentos parceiros com total transparência e comunicação em tempo real.
            </p>
          </motion.div>

          {/* WhatsApp Realtime Feature Block */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={solutionInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            id="whatsapp"
            className="mb-20 rounded-3xl border border-white/8 bg-[#0A1020]/60 p-8 sm:p-12 relative overflow-hidden backdrop-blur-xl shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

              {/* Left Description */}
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wider uppercase">
                  <Bell className="w-3.5 h-3.5 animate-bounce" />
                  <span>Notificações Inteligentes</span>
                </div>

                <h3 className="text-3xl sm:text-4xl font-extrabold font-display uppercase tracking-tight text-white leading-tight">
                  ALERTAS E RELATÓRIOS NO <br />
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">WHATSAPP EM TEMPO REAL</span>
                </h3>

                <p className="text-[#94A3B8] text-sm leading-relaxed">
                  Acompanhe o desempenho da sua rede ou campanha diretamente no telemóvel. Receba atualizações instantâneas sobre entradas no ar, faturamento e manutenção.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-[#94A3B8]">
                  {[
                    'Aviso de início de veiculação',
                    'Alertas de status do ecrã',
                    'Resumos financeiros semanais',
                    'Aprovação rápida de vinhetas',
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={solutionInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                      className="flex items-center gap-2.5 bg-white/[0.03] border border-white/8 p-3 rounded-xl backdrop-blur-md hover:border-emerald-500/30 transition-colors"
                    >
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Right: WhatsApp Simulator Card */}
              <div className="lg:col-span-6 bg-[#050816]/80 border border-white/8 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between border-b border-white/8 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      NX
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Nexora Bot Angola</h4>
                      <p className="text-[11px] text-emerald-400 font-mono">● WhatsApp API Verificado</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#475569]">10:42 AM</span>
                </div>

                {/* Message Bubbles */}
                <div className="space-y-3 text-xs">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={solutionInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-3.5 text-[#CBD5E1] space-y-1"
                  >
                    <div className="flex justify-between items-center text-[11px] text-emerald-400 font-semibold">
                      <span>🚀 CAMPANHA ACTIVA</span>
                      <span>10:40 AM</span>
                    </div>
                    <p className="text-white font-bold">Anúncio "Colecção Verão 2026" no ar!</p>
                    <p className="text-[#64748B] text-[11px]">Exibição iniciada no Totem T32 em Luanda Sul.</p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={solutionInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.8 }}
                    className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3.5 text-[#CBD5E1] space-y-1"
                  >
                    <div className="flex justify-between items-center text-[11px] text-cyan-400 font-semibold">
                      <span>💰 RENDIMENTO GERADO</span>
                      <span>10:42 AM</span>
                    </div>
                    <p className="text-white font-bold">Novo crédito de parceiro computado.</p>
                    <p className="text-[#64748B] text-[11px]">O seu display gerou 45.000 Kz no ciclo recente.</p>
                  </motion.div>
                </div>
              </div>

            </div>
          </motion.div>

          {/* 3 Pillars Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                title: 'ACOMPANHAMENTO EM TEMPO REAL',
                desc: 'Consulte dados precisos de exibições, picos de audiência e disponibilidade geográfica dos displays em Angola.',
                color: 'cyan',
                gradient: 'from-[#22D3EE] to-[#2563EB]',
              },
              {
                icon: Zap,
                title: 'PUBLICAÇÃO INSTANTÂNEA',
                desc: 'Faça a gestão remota e veicule conteúdos HD em múltiplos ecrãs simultaneamente com apenas alguns cliques.',
                color: 'purple',
                gradient: 'from-[#7C3AED] to-[#D946EF]',
              },
              {
                icon: Wifi,
                title: 'ESTABILIDADE & CACHE OFFLINE',
                desc: 'O Nexora Player mantém a transmissão ininterrupta mesmo se houver perdas temporárias de sinal de internet.',
                color: 'blue',
                gradient: 'from-[#2563EB] to-[#22D3EE]',
              },
            ].map((pillar, i) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={solutionInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                  className="landing-glass-card rounded-2xl p-8 space-y-4 group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${pillar.gradient} p-[1px]`}>
                    <div className="w-full h-full rounded-xl bg-[#050816] flex items-center justify-center">
                      <Icon className="w-6 h-6 text-[#22D3EE]" />
                    </div>
                  </div>
                  <h4 className="text-base font-bold font-display uppercase text-white group-hover:text-[#22D3EE] transition-colors">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {pillar.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>

    </section>
  );
};
