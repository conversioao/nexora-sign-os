import React, { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, CheckCircle2, Utensils, ShoppingBag, Store, Calendar } from 'lucide-react';

interface ContentShowcaseSectionProps {
  onOpenContentExamplesModal: () => void;
}

export const ContentShowcaseSection: React.FC<ContentShowcaseSectionProps> = ({ onOpenContentExamplesModal }) => {
  const [activeTab, setActiveTab] = useState<'restaurant' | 'fashion' | 'supermarket' | 'event'>('restaurant');
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const contentSamples = {
    restaurant: {
      title: 'SABORES QUE FICAM NA MEMÓRIA',
      subtitle: 'Menu Especial & Promoções Gourmet',
      category: 'Restauração & Lazer',
      image: '/assets/content_burger_display.png',
    },
    fashion: {
      title: 'NOVA COLECÇÃO VERÃO 2026',
      subtitle: 'Tendências Globais & Marcas Locais',
      category: 'Moda & Varejo',
      image: '/assets/hero_totem_boutique.png',
    },
    supermarket: {
      title: 'OFERTAS IMPERDÍVEIS DA SEMANA',
      subtitle: 'Produtos Frescos & Descontos Diretos',
      category: 'Supermercados & Distribuição',
      image: '/assets/nexora_t32_totem.png',
    },
    event: {
      title: 'FÓRUM DE TECNOLOGIA LUANDA',
      subtitle: 'Inovação, IA e Oportunidades em Angola',
      category: 'Eventos & Corporativo',
      image: '/assets/nexora_creative_ai.png',
    },
  };

  const currentSample = contentSamples[activeTab];

  const tabs = [
    { key: 'restaurant' as const, label: 'Restauração', icon: Utensils },
    { key: 'fashion' as const, label: 'Moda', icon: ShoppingBag },
    { key: 'supermarket' as const, label: 'Supermercado', icon: Store },
    { key: 'event' as const, label: 'Eventos', icon: Calendar },
  ];

  return (
    <section id="content-showcase" className="relative py-24 lg:py-32 bg-[#050816] text-white overflow-hidden">
      {/* Section divider */}
      <div className="landing-section-divider absolute top-0 inset-x-0" />

      {/* Ambient orbs */}
      <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-[#7C3AED]/6 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 -left-40 w-[400px] h-[400px] bg-[#22D3EE]/5 rounded-full blur-[160px] pointer-events-none" />

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Interactive Screen Showcase */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="lg:col-span-6 relative"
          >
            <div className="relative rounded-3xl landing-glass-card p-4 sm:p-6 overflow-hidden !shadow-[0_0_60px_rgba(34,211,238,0.1)]">

              {/* Scene Backdrop with tab-driven content */}
              <div className="relative h-[420px] sm:h-[480px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#0A1020] to-[#050816]">

                {/* Background image */}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={activeTab}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 0.45, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.5 }}
                    src={currentSample.image}
                    alt={currentSample.category}
                    className="w-full h-full object-cover absolute inset-0"
                  />
                </AnimatePresence>

                <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/40 to-transparent" />

                {/* Totem Display Frame */}
                <div className="absolute top-6 left-6 sm:left-8 w-56 sm:w-64 h-[350px] sm:h-[400px] z-10 rounded-2xl bg-[#0A1020] p-2 border border-[#22D3EE]/30 shadow-[0_0_40px_rgba(34,211,238,0.2)] transition-all">
                  <div className="h-full rounded-xl overflow-hidden relative flex flex-col justify-between p-4 bg-[#050816]">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={`totem-${activeTab}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.8 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        src={currentSample.image}
                        alt={currentSample.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </AnimatePresence>

                    <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-[#050816]/60" />

                    {/* Top Branding Pill */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#22D3EE] text-[#050816] text-[9px] font-extrabold tracking-wider">
                        NEXORA DISPLAY
                      </span>
                      <span className="text-[9px] text-white/80 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        AO VIVO
                      </span>
                    </div>

                    {/* Content Headline Overlay */}
                    <div className="relative z-10 space-y-1">
                      <span className="text-[10px] text-[#22D3EE] font-semibold uppercase tracking-widest">
                        {currentSample.category}
                      </span>
                      <h4 className="text-sm font-extrabold text-white leading-tight font-display uppercase">
                        {currentSample.title}
                      </h4>
                      <p className="text-[10px] text-gray-300">{currentSample.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Ambient figure */}
                <div className="absolute bottom-0 right-2 w-40 sm:w-48 z-20 pointer-events-none">
                  <img
                    src="/assets/content_burger_display.png"
                    alt="Pessoa observando mídia Nexora"
                    className="w-full h-auto rounded-t-xl object-cover object-top filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)]"
                    style={{ height: '300px' }}
                  />
                </div>
              </div>

              {/* Category Quick Select Tabs */}
              <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-white/6 overflow-x-auto">
                {tabs.map((tab) => {
                  const TabIcon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === tab.key
                          ? 'bg-[#22D3EE] text-[#050816] shadow-[0_0_20px_rgba(34,211,238,0.35)]'
                          : 'bg-white/[0.04] text-[#94A3B8] hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      <TabIcon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Right Column: Descriptions & Details */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 space-y-8"
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#7C3AED]/15 border border-[#7C3AED]/30 text-xs font-semibold text-[#C084FC] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Impacto Visual em Tempo Real</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display leading-tight uppercase">
                CONTEÚDOS QUE DÃO VIDA <br />
                <span className="bg-gradient-to-r from-[#2563EB] via-[#22D3EE] to-[#7C3AED] bg-clip-text text-transparent">
                  AO SEU ESPAÇO.
                </span>
              </h2>

              <p className="text-base text-[#94A3B8] leading-relaxed">
                Publicidade, promoções, novidades, informação institucional e muito mais. A sua marca no momento certo, no lugar certo.
              </p>
            </div>

            {/* Checklist of features */}
            <div className="space-y-3 pt-2">
              {[
                { title: 'Vinhetas HD Dinâmicas:', desc: 'Vídeos de alta definição otimizados para rápida percepção no ponto de venda.' },
                { title: 'Programação Contextual:', desc: 'Conteúdos que se adaptam ao horário de pico do estabelecimento.' },
                { title: 'Criatividade com IA:', desc: 'Gerador automático de anúncios com o Nexora Creative AI.' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1 }}
                  className="flex items-start gap-3 group"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#22D3EE] shrink-0 mt-0.5" />
                  <p className="text-sm text-white">
                    <strong className="text-[#22D3EE] group-hover:text-[#67E8F9] transition-colors">{item.title}</strong> {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.7 }}
              onClick={onOpenContentExamplesModal}
              className="px-7 py-4 rounded-full text-sm font-bold text-white bg-[#0A1020] border border-[#22D3EE]/30 hover:border-[#22D3EE] hover:bg-[#22D3EE]/10 transition-all cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.15)] flex items-center gap-3 transform hover:-translate-y-0.5"
            >
              <span>Ver exemplos de conteúdos</span>
              <ArrowRight className="w-4 h-4 text-[#22D3EE]" />
            </motion.button>
          </motion.div>

        </div>

      </div>
    </section>
  );
};
