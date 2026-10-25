import React, { useState } from 'react';
import { X, Play, ArrowRight, Building2, Megaphone, Sparkles } from 'lucide-react';
import { useToast } from '../../../components/ui';

interface LandingModalsProps {
  activeModal: 'video' | 'partner' | 'advertiser' | 'product' | 'details' | null;
  selectedProduct?: string;
  onClose: () => void;
  onNavigateToSignUp: (role?: 'partner' | 'advertiser') => void;
}

export const LandingModals: React.FC<LandingModalsProps> = ({
  activeModal,
  selectedProduct,
  onClose,
  onNavigateToSignUp,
}) => {
  const { success } = useToast();
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerLocation, setPartnerLocation] = useState('Luanda');

  const [advName, setAdvName] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advCategory, setAdvCategory] = useState('Restauração & Moda');

  if (!activeModal) return null;

  const handlePartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    success('Solicitação Enviada!', 'Nossa equipa de expansão entrará em contacto via WhatsApp em breve.');
    onClose();
    onNavigateToSignUp('partner');
  };

  const handleAdvertiserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    success('Solicitação de Anúncio Recebida!', 'Um gestor de contas da Nexora entrará em contacto para simular o orçamento.');
    onClose();
    onNavigateToSignUp('advertiser');
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl bg-[#0A1020] border border-white/8 text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/40 focus:border-[#22D3EE]/50 text-xs transition-all";
  const inputClassesPurple = "w-full px-4 py-3 rounded-xl bg-[#0A1020] border border-white/8 text-white placeholder-[#475569] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/40 focus:border-[#7C3AED]/50 text-xs transition-all";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-lg"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0A1020] border border-white/10 p-6 sm:p-8 text-white shadow-[0_0_60px_rgba(34,211,238,0.12)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Top Gradient Accent */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#2563EB] via-[#22D3EE] to-[#7C3AED]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/5 border border-white/8 text-[#64748B] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. VIDEO PREVIEW MODAL */}
        {activeModal === 'video' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#2563EB]/15 border border-[#2563EB]/30 text-[#22D3EE]">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">NEXORA OS em Operação Real</h3>
                <p className="text-xs text-[#94A3B8]">Demonstração da tecnologia de exibição nos totens T32</p>
              </div>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-[#22D3EE]/20 shadow-2xl">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&controls=0&loop=1"
                title="Nexora Showcase Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
              <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#050816]/90 border border-[#22D3EE]/30 backdrop-blur-md text-xs flex items-center justify-between">
                <span className="font-bold text-[#22D3EE]">REDE MÍDIA INDOOR LUANDA</span>
                <span className="text-[10px] text-[#64748B]">Resolução 4K • 60 FPS</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToSignUp('partner');
                }}
                className="px-6 py-3 rounded-full text-xs font-bold text-[#050816] bg-gradient-to-r from-[#22D3EE] to-[#2563EB] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all cursor-pointer flex items-center gap-2"
              >
                <span>Quero Instalar no Meu Espaço</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* 2. PARTNER MODAL */}
        {activeModal === 'partner' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#22D3EE]/15 to-[#2563EB]/15 border border-[#22D3EE]/30 text-[#22D3EE]">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">Quero ser um Parceiro NEXORA</h3>
                <p className="text-xs text-[#94A3B8]">Cadastre seu estabelecimento comercial para receber um totem digital</p>
              </div>
            </div>

            <form onSubmit={handlePartnerSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Nome do Estabelecimento / Loja</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Restaurante Baía Grill, Shopping Fortaleza"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">WhatsApp de Contacto</label>
                  <input
                    type="tel"
                    required
                    placeholder="+244 923 000 000"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Município / Localização</label>
                  <select
                    value={partnerLocation}
                    onChange={(e) => setPartnerLocation(e.target.value)}
                    className={inputClasses}
                  >
                    <option value="Talatona">Talatona</option>
                    <option value="Luanda">Luanda Central</option>
                    <option value="Maianga">Maianga</option>
                    <option value="Viana">Viana</option>
                    <option value="Cazenga">Cazenga</option>
                    <option value="Belas">Belas / Kilamba</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#22D3EE]/5 border border-[#22D3EE]/15 text-[11px] text-[#94A3B8] space-y-1">
                <p className="font-semibold text-[#22D3EE]">✔ Instalação 100% Gerida pela Nexora</p>
                <p>Nossa equipa cuida do equipamento, conectividade e manutenção sem complicações.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#64748B] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full text-xs font-bold text-[#050816] bg-gradient-to-r from-[#22D3EE] to-[#2563EB] shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:scale-[1.02] transition-all cursor-pointer"
                >
                  Confirmar Cadastro
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 3. ADVERTISER MODAL */}
        {activeModal === 'advertiser' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#7C3AED]/15 to-[#D946EF]/15 border border-[#7C3AED]/30 text-[#C084FC]">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">Anunciar na Rede NEXORA</h3>
                <p className="text-xs text-[#94A3B8]">Veicule sua marca nos melhores pontos comerciais de Angola</p>
              </div>
            </div>

            <form onSubmit={handleAdvertiserSubmit} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Nome da Empresa / Marca</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Banco, Agência de Viagens, Marca de Bebidas"
                  value={advName}
                  onChange={(e) => setAdvName(e.target.value)}
                  className={inputClassesPurple}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">WhatsApp Comercial</label>
                  <input
                    type="tel"
                    required
                    placeholder="+244 923 000 000"
                    value={advPhone}
                    onChange={(e) => setAdvPhone(e.target.value)}
                    className={inputClassesPurple}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Segmento do Anúncio</label>
                  <select
                    value={advCategory}
                    onChange={(e) => setAdvCategory(e.target.value)}
                    className={inputClassesPurple}
                  >
                    <option value="Alimentação & Bebidas">Alimentação & Bebidas</option>
                    <option value="Moda & Varejo">Moda & Varejo</option>
                    <option value="Serviços Financeiros">Serviços Financeiros</option>
                    <option value="Tecnologia & Telecom">Tecnologia & Telecom</option>
                    <option value="Eventos & Shows">Eventos & Shows</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#64748B] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-7 py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#D946EF] shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] hover:scale-[1.02] transition-all cursor-pointer"
                >
                  Solicitar Proposta de Mídia
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. PRODUCT / DETAILS MODAL */}
        {(activeModal === 'product' || activeModal === 'details') && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#22D3EE]/10 border border-[#22D3EE]/30 text-[#22D3EE]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-white">{selectedProduct || 'Tecnologia Nexora'}</h3>
                <p className="text-xs text-[#94A3B8]">Infraestrutura de Mídia Digital Indoor em Angola</p>
              </div>
            </div>

            <p className="text-xs text-[#94A3B8] leading-relaxed">
              O ecossistema Nexora foi desenhado para maximizar o impacto visual das marcas nos pontos físicos e automatizar a veiculação de conteúdos com total transparência e relatórios de métricas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/6 space-y-1.5 hover:border-[#22D3EE]/20 transition-colors">
                <span className="text-xs font-bold text-[#22D3EE]">Hardware T32 32"</span>
                <p className="text-[10px] text-[#64748B]">Painel Full HD IPS de alta luminosidade comercial.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/6 space-y-1.5 hover:border-[#7C3AED]/20 transition-colors">
                <span className="text-xs font-bold text-[#C084FC]">IA Generativa</span>
                <p className="text-[10px] text-[#64748B]">Nexora Creative AI para vinhetas automatizadas.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToSignUp();
                }}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-[#050816] bg-gradient-to-r from-[#22D3EE] to-[#2563EB] hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] transition-all cursor-pointer"
              >
                Aceder Plataforma
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
