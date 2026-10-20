import React, { useState, useMemo, useEffect } from 'react';
import {
  Building,
  Briefcase,
  Monitor,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Zap,
  Globe,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  FileText,
  Check,
  Users,
} from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';
import { useSession } from '../../../context/SessionContext';
import { OrganizationType } from '../../../types/auth';
import { useToast } from '../../../components/ui/Toast';

export interface SignUpPageProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
  onNavigateToLanding?: () => void;
}

/**
 * SignUpPage — Criação corporativa de conta de organização.
 * Suporta Cliente Proprietário de Display (15 dias grátis), Parceiro de Espaço, Anunciante e Afiliado & Embaixador.
 */
export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSuccess,
  onNavigateToLogin,
  onNavigateToLanding,
}) => {
  const { login } = useSession();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [orgName, setOrgName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('DISPLAY_OWNER');
  const [nif, setNif] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [referralCode, setReferralCode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const refUrl = urlParams.get('ref');
        if (refUrl) {
          localStorage.setItem('nexora_referral_code', refUrl.trim());
          return refUrl.trim();
        }
        return (localStorage.getItem('nexora_referral_code') || '').trim();
      }
    } catch {}
    return '';
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const t = (urlParams.get('type') || localStorage.getItem('nexora_referral_type') || '').toUpperCase();
        if (t === 'AFFILIATE') setOrgType('AFFILIATE');
        else if (t === 'CLIENT') setOrgType('CLIENT');
        else if (t === 'ADVERTISER') setOrgType('ADVERTISER');
        else if (t === 'DISPLAY_OWNER') setOrgType('DISPLAY_OWNER');
      }
    } catch {}
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score++;

    if (score <= 1) return { score: 1, label: 'Fraca', color: 'bg-rose-500', text: 'text-rose-400' };
    if (score === 2) return { score: 2, label: 'Razoável', color: 'bg-amber-500', text: 'text-amber-400' };
    if (score === 3) return { score: 3, label: 'Boa', color: 'bg-cyan-500', text: 'text-cyan-400' };
    return { score: 4, label: 'Forte & Segura', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !orgName.trim() || !password.trim() || !phone.trim()) {
      showToast('Por favor, preencha todos os campos obrigatórios.', 'danger');
      return;
    }
    if (password.trim().length < 8) {
      showToast('A palavra-passe deve ter pelo menos 8 caracteres.', 'danger');
      return;
    }
    if (!acceptTerms) {
      showToast('É necessário aceitar os termos de serviço para prosseguir.', 'warning');
      return;
    }

    setIsSubmitting(true);

    try {
      const role =
        orgType === 'AFFILIATE'
          ? 'AFFILIATE'
          : orgType === 'DISPLAY_OWNER'
          ? 'DISPLAY_OWNER'
          : orgType === 'CLIENT'
          ? 'CLIENT_OWNER'
          : orgType === 'ADVERTISER'
          ? 'ADVERTISER_OWNER'
          : 'NEXORA_ADMIN';

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: `org-${Date.now()}`,
          org_name: orgName.trim(),
          org_type: orgType,
          email: email.trim().toLowerCase(),
          full_name: name.trim(),
          password,
          phone: phone.trim(),
          nif: nif.trim(),
          role,
          referral_code: referralCode.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(data?.error || 'Não foi possível criar a conta.', 'danger');
        setIsSubmitting(false);
        return;
      }

      const loggedIn = await login(email.trim().toLowerCase(), password);
      if (!loggedIn) {
        showToast(
          'Conta criada com sucesso! Por favor, entre com o seu e-mail e palavra-passe.',
          'warning'
        );
        onNavigateToLogin();
        return;
      }

      try {
        localStorage.removeItem('nexora_referral_code');
        localStorage.removeItem('nexora_referral_type');
      } catch {}

      showToast(`Organização "${orgName.trim()}" cadastrada com sucesso!`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast('Erro ao registar a organização.', err?.message || 'Falha de comunicação com o servidor.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050711] text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-[#00E5FF]/30 selection:text-[#00E5FF]">
      {/* ── Ambient Background Lighting ── */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[750px] h-[450px] bg-gradient-to-b from-[#00E5FF]/18 via-[#2563EB]/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/12 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 -right-20 w-96 h-96 bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Background Decorative Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_75%,transparent_100%)] pointer-events-none" />

      {/* ── Header Brand ── */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 text-center space-y-3.5 px-4">
        <div className="flex justify-center mb-1">
          <div className="relative p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-[0_0_35px_rgba(0,229,255,0.18)] backdrop-blur-xl group hover:border-[#00E5FF]/40 transition-all duration-300">
            <Logo variant="full" size="lg" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/25 flex items-center gap-1.5 font-mono uppercase tracking-wider shadow-[0_0_12px_rgba(0,229,255,0.15)]">
            <Zap className="w-3 h-3 text-[#00E5FF]" /> Registo Corporativo
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Globe className="w-3 h-3" /> Angola & Global
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            Criar Conta de Organização
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1 leading-relaxed">
            Conecte as suas telas, monetize espaços ou lance campanhas na maior rede de mídia digital de Angola.
          </p>
        </div>
      </div>

      {/* ── Form Container ── */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 px-4">
        <div className="bg-[#0B101E]/85 backdrop-blur-2xl border border-white/[0.12] py-8 px-6 sm:px-10 shadow-[0_25px_70px_rgba(0,0,0,0.75)] rounded-3xl relative overflow-hidden">
          {/* Ambient Top Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-[#00E5FF] to-purple-500" />

          <form className="space-y-6" onSubmit={handleSubmit}>
            {referralCode && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3 animate-fade-in">
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <p className="text-xs text-emerald-300">
                    Você foi indicado pelo código de afiliado:{' '}
                    <span className="font-mono font-bold text-white">{referralCode}</span>
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Benefício Ativo
                </span>
              </div>
            )}

            {/* 1. Seleção de Perfil */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                  1. Selecione o Tipo de Perfil
                </label>
                <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3 text-cyan-400" /> Teste Grátis de 15 Dias
                </span>
              </div>

              <div className="space-y-2.5">
                {/* 1.1 Proprietário de Display */}
                <button
                  type="button"
                  onClick={() => setOrgType('DISPLAY_OWNER')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 relative overflow-hidden group ${
                    orgType === 'DISPLAY_OWNER'
                      ? 'bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/40 border-[#00E5FF] text-white shadow-[0_0_25px_rgba(0,229,255,0.25)] ring-1 ring-[#00E5FF]/40'
                      : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-900/80 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 mt-0.5 transition-colors ${
                      orgType === 'DISPLAY_OWNER'
                        ? 'bg-[#00E5FF]/20 border-[#00E5FF]/50 text-[#00E5FF]'
                        : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>Cliente Proprietário de Display (Telas & Totens)</span>
                        {orgType === 'DISPLAY_OWNER' && (
                          <Check className="w-4 h-4 text-[#00E5FF]" />
                        )}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono tracking-wider uppercase">
                          🎁 15 Dias Grátis
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono tracking-wider uppercase flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Creative AI
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug mt-1">
                      Comprei ou possuo telas e totens. Gestão remota de exibição, player sincronizado e acesso ilimitado ao gerador inteligente de anúncios <strong>Creative AI</strong>.
                    </p>
                  </div>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* 1.2 Parceiro de Espaço */}
                  <button
                    type="button"
                    onClick={() => setOrgType('CLIENT')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden group ${
                      orgType === 'CLIENT'
                        ? 'bg-blue-600/15 border-blue-400 text-white shadow-[0_0_20px_rgba(59,130,246,0.25)] ring-1 ring-blue-400/40'
                        : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-900/80 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl border shrink-0 mt-0.5 transition-colors ${
                        orgType === 'CLIENT'
                          ? 'bg-blue-500/20 border-blue-400/50 text-blue-400'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Parceiro de Espaço</span>
                        {orgType === 'CLIENT' && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                        Cedo espaço físico comercial para veicular anúncios e recebo comissões mensais.
                      </p>
                    </div>
                  </button>

                  {/* 1.3 Anunciante */}
                  <button
                    type="button"
                    onClick={() => setOrgType('ADVERTISER')}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative overflow-hidden group ${
                      orgType === 'ADVERTISER'
                        ? 'bg-pink-500/15 border-pink-400 text-white shadow-[0_0_20px_rgba(236,72,153,0.25)] ring-1 ring-pink-400/40'
                        : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-900/80 hover:border-white/20'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-xl border shrink-0 mt-0.5 transition-colors ${
                        orgType === 'ADVERTISER'
                          ? 'bg-pink-500/20 border-pink-400/50 text-pink-400'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Anunciante / Agência</span>
                        {orgType === 'ADVERTISER' && <Check className="w-3.5 h-3.5 text-pink-400" />}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-snug mt-0.5">
                        Desejo veicular campanhas publicitárias com métricas de audiência por IA.
                      </p>
                    </div>
                  </button>
                </div>

                {/* 1.4 Afiliado & Embaixador Comercial */}
                <button
                  type="button"
                  onClick={() => setOrgType('AFFILIATE')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 relative overflow-hidden group ${
                    orgType === 'AFFILIATE'
                      ? 'bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-emerald-950/40 border-emerald-400 text-white shadow-[0_0_25px_rgba(16,185,129,0.25)] ring-1 ring-emerald-400/40'
                      : 'bg-slate-900/50 border-white/10 text-slate-400 hover:bg-slate-900/80 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 mt-0.5 transition-colors ${
                      orgType === 'AFFILIATE'
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-400'
                        : 'bg-white/5 border-white/10 text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                        <span>Afiliado & Embaixador Comercial</span>
                        {orgType === 'AFFILIATE' && <Check className="w-4 h-4 text-emerald-400" />}
                      </p>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono tracking-wider uppercase">
                        💰 Comissões Recorrentes
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug mt-1">
                      Quero indicar estabelecimentos e anunciantes para a rede Nexora e receber comissões recorrentes em Kwanzas diretamente na minha conta bancária em cada pagamento.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Dados da Organização e Acesso */}
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono block mb-3">
                2. Informações da Conta & Acesso
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nome da Organização */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nome Fantasia / Empresa *
                  </label>
                  <div className="relative group/input">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="ex: Belas Retail"
                      className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Razão Social */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Razão Social Completa
                  </label>
                  <div className="relative group/input">
                    <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                    <input
                      type="text"
                      value={tradeName}
                      onChange={(e) => setTradeName(e.target.value)}
                      placeholder="ex: Belas Comércio & Serviços Lda."
                      className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Nome do Responsável */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Nome do Responsável *
                  </label>
                  <div className="relative group/input">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="ex: António Mateus"
                      className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* E-mail Corporativo */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    E-mail Corporativo *
                  </label>
                  <div className="relative group/input">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: antonio@belas.ao"
                      className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Telefone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp / Telefone *
                    </span>
                    <span className="text-[10px] text-emerald-400/80 font-mono">Direto</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ex: +244 923 000 000"
                    className="w-full bg-slate-900/80 border border-white/10 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono transition-all shadow-inner"
                  />
                </div>

                {/* NIF */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>NIF da Empresa</span>
                    <span className="text-[10px] text-slate-500 font-medium">Opcional</span>
                  </label>
                  <input
                    type="text"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="ex: 5401234567"
                    className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none font-mono transition-all shadow-inner"
                  />
                </div>

                {/* Senha com Força & Toggle */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Palavra-passe (Senha) *
                    </label>
                    {password && (
                      <span className={`text-[10px] font-bold ${passwordStrength.text}`}>
                        Força: {passwordStrength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative group/input">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 8 caracteres com letras e números"
                      className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-11 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            step <= passwordStrength.score
                              ? passwordStrength.color
                              : 'bg-white/10'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/20 bg-slate-900 text-[#00E5FF] focus:ring-[#00E5FF] focus:ring-offset-0 cursor-pointer accent-[#00E5FF]"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-400 leading-relaxed cursor-pointer select-none">
                Concordo com os <span className="text-[#00E5FF] underline">Termos de Serviço</span> e a{' '}
                <span className="text-[#00E5FF] underline">Política de Privacidade</span> da plataforma Nexora OS.
              </label>
            </div>

            {/* Instant Access Security Callout */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/[0.08] border border-emerald-500/25 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="text-[11px] text-slate-300 leading-relaxed">
                <strong>Ativação Imediata:</strong> Sua conta empresarial é provisionada instantaneamente com teste grátis de 15 dias e sincronização de telas pronta para uso.
              </p>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-[#00E5FF] hover:from-emerald-400 hover:to-[#00E5FF]/90 text-slate-950 text-xs sm:text-sm font-black transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 uppercase tracking-wide font-display"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>A registar organização...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir Registo Corporativo</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="mt-7 text-center text-xs text-slate-400 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2">
            <span>Já possui uma organização ativa?</span>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="text-[#00E5FF] font-bold hover:underline transition-colors cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Entrar no Sistema</span>
            </button>
          </div>

          {onNavigateToLanding && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={onNavigateToLanding}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1 group"
              >
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span>Voltar à página inicial</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
