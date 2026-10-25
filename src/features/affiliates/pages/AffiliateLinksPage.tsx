import React, { useState, useEffect } from 'react';
import {
  Link2,
  Copy,
  Check,
  Share2,
  QrCode,
  Building2,
  Briefcase,
  Monitor,
  Sparkles,
  ExternalLink,
  ChevronLeft,
} from 'lucide-react';
import { affiliateRepository } from '../../../repositories/affiliateRepository';
import { Affiliate } from '../../../types/affiliate';
import { getAffiliateBaseUrl } from '../../../utils/affiliateUrl';

interface AffiliateLinksPageProps {
  onBack?: () => void;
}

export const AffiliateLinksPage: React.FC<AffiliateLinksPageProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<Affiliate | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    affiliateRepository.getMe().then(setProfile);
  }, []);

  const referralCode = profile?.referralCode || '';
  const baseUrl = getAffiliateBaseUrl();

  const links = [
    {
      title: 'Link Geral de Cadastro & Landing Page',
      subtitle: 'Direciona para a página inicial com o seu código de indicação vinculado',
      url: referralCode ? `${baseUrl}/?ref=${referralCode}` : baseUrl,
      type: 'ALL',
      icon: Sparkles,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Link para Estabelecimentos & Parceiros',
      subtitle: 'Focado em restaurantes, shoppings, clínicas e pontos comerciais que querem telas digitais',
      url: referralCode ? `${baseUrl}/?ref=${referralCode}&type=client` : `${baseUrl}/?type=client`,
      type: 'CLIENT',
      icon: Building2,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Link para Anunciantes & Agências',
      subtitle: 'Focado em marcas e agências que desejam anunciar na rede de telas Nexora',
      url: referralCode ? `${baseUrl}/?ref=${referralCode}&type=advertiser` : `${baseUrl}/?type=advertiser`,
      type: 'ADVERTISER',
      icon: Briefcase,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
    },
    {
      title: 'Link para Donos de Displays & Totens',
      subtitle: 'Para proprietários e investidores que desejam conectar seus próprios totens à rede',
      url: referralCode ? `${baseUrl}/?ref=${referralCode}&type=display_owner` : `${baseUrl}/?type=display_owner`,
      type: 'DISPLAY_OWNER',
      icon: Monitor,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  const handleCopy = (url: string, index: number) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const handleWhatsApp = (url: string, title: string) => {
    const text = encodeURIComponent(
      `Olá! Tenho uma recomendação especial para você na Nexora Mídia Digital Indoor. Cadastre-se com benefícios pelo link: ${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
              <Link2 className="w-6 h-6 text-emerald-400" />
              Links & Ferramentas de Divulgação
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Compartilhe seus links exclusivos para associar automaticamente novos clientes e anunciantes à sua carteira de comissão recorrente.
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Links Segmentados */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {links.map((item, idx) => {
          const Icon = item.icon;
          const isCopied = copiedIndex === idx;

          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#090E1A] border border-white/[0.06] flex flex-col justify-between hover:border-white/15 transition-all group"
            >
              <div>
                <div className="flex items-center gap-3 mb-2.5">
                  <div className={`w-9 h-9 rounded-xl ${item.bgColor} ${item.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <p className="text-[11px] text-slate-400 leading-tight">{item.subtitle}</p>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-xl bg-[#070B14] border border-white/[0.06] font-mono text-xs text-slate-300 break-all select-all">
                  {item.url}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
                <button
                  onClick={() => handleCopy(item.url, idx)}
                  className="flex-1 flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                  {isCopied ? 'Link Copiado!' : 'Copiar Link'}
                </button>

                <button
                  onClick={() => handleWhatsApp(item.url, item.title)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  WhatsApp
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QR Code & Materiais */}
      <div className="rounded-2xl bg-[#090E1A] border border-white/[0.06] p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="md:col-span-2 space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            Divulgação Presencial e em Visitas
          </div>
          <h3 className="text-lg font-bold text-white">QR Code para Visitas Comerciais</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Apresente o QR Code na tela do seu celular para donos de restaurantes, lojistas ou anunciantes. Ao apontar a câmera do telemóvel, eles abrem a tela de cadastro já com o seu código de afiliado preenchido automaticamente.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="p-3 bg-white rounded-xl shadow-lg shadow-black/50">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
                `${baseUrl}/?ref=${referralCode}`
              )}`}
              alt="QR Code de Afiliado"
              className="w-28 h-28"
            />
          </div>
          <p className="text-[11px] font-mono text-emerald-400 mt-2 font-bold">{referralCode}</p>
        </div>
      </div>
    </div>
  );
};
