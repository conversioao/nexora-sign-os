import React, { useState, useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowRight, Building2, Megaphone, Check, Sparkles } from 'lucide-react';

interface AudienceSectionProps {
  onOpenPartnerModal: () => void;
  onOpenAdvertiserModal: () => void;
}

export const AudienceSection: React.FC<AudienceSectionProps> = ({
  onOpenPartnerModal,
  onOpenAdvertiserModal,
}) => {
  const [activeAudience, setActiveAudience] = useState<'all' | 'partner' | 'advertiser'>('all');
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  const showPartner = activeAudience === 'all' || activeAudience === 'partner';
  const showAdvertiser = activeAudience === 'all' || activeAudience === 'advertiser';

  return (
    <section id="audience" className="relative py-24 lg:py-32 bg-[#050816] text-white overflow-hidden">
      {/* Section divider */}
      <div className="landing-section-divider absolute top-0 inset-x-0" />

      {/* Background orbs */}
      <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-[#22D3EE]/5 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-40 w-[500px] h-[500px] bg-[#7C3AED]/5 rounded-full blur-[180px] pointer-events-none" />

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header & Filter Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6"
        >
          <div className="space-y-4 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#22D3EE]/10 border border-[#22D3EE]/25 text-[#22D3EE] text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modelos de Adesão</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-display tracking-tight text-white uppercase leading-[1.08]">
              SOLUÇÕES PARA PARCEIROS <br />
              <span className="bg-gradient-to-r from-[#22D3EE] via-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
                & ANUNCIANTES
              </span>
            </h2>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Monetize o seu espaço comercial ou alcance milhares de consumidores diários em locais estratégicos de Angola.
            </p>
          </div>

          {/* Toggle Buttons */}
          <div className="inline-flex bg-[#0A1020] border border-white/8 rounded-xl p-1 text-xs uppercase self-start md:self-auto">
            {[
              { key: 'all' as const, label: 'Ver Todos' },
              { key: 'partner' as const, label: 'Parceiros' },
              { key: 'advertiser' as const, label: 'Anunciantes' },
            ].map((toggle) => (
              <button
                key={toggle.key}
                onClick={() => setActiveAudience(toggle.key)}
                className={`px-4 py-2.5 rounded-lg font-bold cursor-pointer transition-all ${
                  activeAudience === toggle.key
                    ? 'bg-[#22D3EE] text-[#050816] shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'text-[#64748B] hover:text-white'
                }`}
              >
                {toggle.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* 2 Main High-Contrast Cards */}
        <div className={`grid grid-cols-1 ${showPartner && showAdvertiser ? 'lg:grid-cols-2' : ''} gap-8`}>

          {/* CARD 01: PARCEIROS COMERCIAIS */}
          {showPartner && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="landing-glass-card rounded-3xl p-6 sm:p-10 flex flex-col justify-between group hover:!border-[#22D3EE]/30"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#22D3EE] to-[#2563EB] p-[1px]">
                      <div className="w-full h-full rounded-xl bg-[#050816] flex items-center justify-center text-[#22D3EE]">
                        <Building2 className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-white uppercase">
                        Estabelecimentos & Espaços
                      </h3>
                      <p className="text-[11px] text-[#22D3EE] font-semibold tracking-wider uppercase">REDE DE PARCEIROS DOOH</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#475569] uppercase hidden sm:block">01 / PARCEIROS</span>
                </div>

                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Possui um restaurante, boutique, supermercado ou clínica com elevado tráfego de pessoas? Transforme o seu espaço num ponto de mídia remunerado.
                </p>

                {/* Benefits checklist */}
                <div className="space-y-2.5 text-xs text-[#94A3B8] pt-1">
                  {[
                    'Receita passiva mensal sobre os anúncios veiculados',
                    'Instalação e manutenção 100% suportada pela Nexora',
                    'Notificação instantânea de faturamento via WhatsApp',
                    'Exibição de conteúdos promocionais do próprio espaço',
                  ].map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
                      className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-3.5 rounded-xl hover:border-[#22D3EE]/20 transition-colors"
                    >
                      <Check className="w-4 h-4 text-[#22D3EE] shrink-0" />
                      <span>{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={onOpenPartnerModal}
                  className="w-full py-4 rounded-xl text-sm font-bold text-[#050816] bg-gradient-to-r from-[#22D3EE] to-[#2563EB] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <span>Cadastrar o Meu Espaço Comercial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* CARD 02: ANUNCIANTES & MARCAS */}
          {showAdvertiser && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="landing-glass-card rounded-3xl p-6 sm:p-10 flex flex-col justify-between group hover:!border-[#7C3AED]/30"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/6">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#D946EF] p-[1px]">
                      <div className="w-full h-full rounded-xl bg-[#050816] flex items-center justify-center text-[#C084FC]">
                        <Megaphone className="w-5 h-5" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold font-display text-white uppercase">
                        Empresas & Marcas
                      </h3>
                      <p className="text-[11px] text-[#C084FC] font-semibold tracking-wider uppercase">ANUNCIANTES DOOH</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#475569] uppercase hidden sm:block">02 / ANUNCIANTES</span>
                </div>

                <p className="text-sm text-[#94A3B8] leading-relaxed">
                  Promova os seus produtos diretamente ao seu público-alvo no momento da compra. Impacte milhares de clientes em Luanda e províncias com vinhetas HD.
                </p>

                {/* Benefits checklist */}
                <div className="space-y-2.5 text-xs text-[#94A3B8] pt-1">
                  {[
                    'Segmentação geográfica por estabelecimentos de alto padrão',
                    'Dashboard com relatórios de exibições e auditabilidade',
                    'Alertas em tempo real via WhatsApp do progresso da campanha',
                    'Criação de anúncios assistida por Inteligência Artificial',
                  ].map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                      className="flex items-center gap-3 bg-white/[0.03] border border-white/5 p-3.5 rounded-xl hover:border-[#7C3AED]/20 transition-colors"
                    >
                      <Check className="w-4 h-4 text-[#C084FC] shrink-0" />
                      <span>{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <button
                  onClick={onOpenAdvertiserModal}
                  className="w-full py-4 rounded-xl text-sm font-bold text-white bg-[#0A1020] border border-[#7C3AED]/40 hover:bg-[#7C3AED]/15 hover:border-[#7C3AED] hover:shadow-[0_0_25px_rgba(124,58,237,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <span>Criar Campanha na Rede</span>
                  <ArrowRight className="w-4 h-4 text-[#C084FC]" />
                </button>
              </div>
            </motion.div>
          )}

        </div>

      </div>
    </section>
  );
};
