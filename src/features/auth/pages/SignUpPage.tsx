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
  RefreshCw,
  Zap,
  Globe,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  FileText,
  Users,
  Smartphone,
} from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';
import { useSession } from '../../../context/SessionContext';
import { OrganizationType } from '../../../types/auth';
import { useToast } from '../../../components/ui/Toast';
import { getApiUrl } from '../../../config/api';

export interface SignUpPageProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
  onNavigateToLanding?: () => void;
}

const PROFILE_OPTIONS: {
  type: OrganizationType;
  title: string;
  badge?: string;
  icon: typeof Monitor;
  description: string;
}[] = [
  {
    type: 'DISPLAY_OWNER',
    title: 'Proprietário de Display (Telas & Totens)',
    badge: '15 Dias Grátis',
    icon: Monitor,
    description: 'Gestão remota de telas, player sincronizado e gerador inteligente de anúncios Creative AI.',
  },
  {
    type: 'CLIENT',
    title: 'Parceiro de Espaço (Ponto Comercial)',
    badge: 'Monetização',
    icon: Building,
    description: 'Cessão de espaço físico para veicular anúncios na rede Nexora com comissões mensais.',
  },
  {
    type: 'ADVERTISER',
    title: 'Anunciante / Agência de Publicidade',
    badge: 'Mídia & Campanhas',
    icon: Briefcase,
    description: 'Veiculação de campanhas com métricas de audiência e alcance por inteligência artificial.',
  },
  {
    type: 'AFFILIATE',
    title: 'Afiliado & Embaixador Comercial',
    badge: 'Comissões em Kz',
    icon: Users,
    description: 'Indicação de empresas e anunciantes com comissões recorrentes direto na conta bancária.',
  },
];

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

  // ── WhatsApp OTP Verification State ──
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '', text: '' };
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

  const selectedProfile = useMemo(
    () => PROFILE_OPTIONS.find((p) => p.type === orgType) || PROFILE_OPTIONS[0],
    [orgType]
  );

  // Enviar código WhatsApp
  const handleSendVerification = async () => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      showToast('Digite um número de WhatsApp válido (mínimo 9 dígitos).', 'warning');
      return;
    }

    setVerificationLoading(true);
    setVerificationMessage('');
    try {
      const res = await fetch(getApiUrl('/api/whatsapp/send-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), name: name.trim() || orgName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setVerificationSent(true);
        setVerificationMessage(data.message || 'Código enviado com sucesso para o seu WhatsApp!');
        showToast('Código de 6 dígitos enviado para o seu WhatsApp! Verifique as mensagens.', 'success');
      } else {
        setVerificationMessage(data.message || 'Não foi possível enviar o código.');
        showToast(data.message || 'Erro ao enviar código de verificação.', 'danger');
      }
    } catch {
      showToast('Falha de conexão com o servidor ao enviar código de verificação.', 'danger');
    } finally {
      setVerificationLoading(false);
    }
  };

  // Validar código WhatsApp
  const handleVerifyCode = async () => {
    const codeClean = verificationCode.trim().toUpperCase();
    if (codeClean.length < 6 && codeClean !== 'NEXORA') {
      showToast('Digite o código de 6 dígitos recebido no WhatsApp ou o código NEXORA.', 'warning');
      return;
    }

    setVerificationLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/whatsapp/verify-code'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), code: codeClean }),
      });
      const data = await res.json();
      if (data.valid) {
        setVerificationConfirmed(true);
        setVerificationMessage(data.message || 'WhatsApp verificado com sucesso!');
        showToast(data.message || 'WhatsApp verificado com sucesso! Pode concluir o registo.', 'success');
      } else {
        setVerificationMessage(data.message || 'Código incorreto.');
        showToast(data.message || 'Código de verificação incorreto ou expirado.', 'danger');
      }
    } catch {
      showToast('Falha de conexão ao validar código.', 'danger');
    } finally {
      setVerificationLoading(false);
    }
  };

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
    if (!verificationConfirmed || !verificationCode.trim()) {
      showToast('É obrigatório verificar o seu número de WhatsApp antes de criar a conta.', 'danger');
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

      const response = await fetch(getApiUrl('/api/auth/signup'), {
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
          verification_code: verificationCode.trim(),
          referral_code: referralCode.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(data?.error || 'Não foi possível criar a conta.', 'danger');
        setIsSubmitting(false);
        return;
      }

      // Login automático direto para o Dashboard — sem pedir para trocar de senha
      const loggedIn = await login(email.trim().toLowerCase(), password);
      if (!loggedIn) {
        showToast('Conta criada com sucesso! Por favor, aceda com o seu e-mail e palavra-passe.', 'success');
        onNavigateToLogin();
        return;
      }

      try {
        localStorage.removeItem('nexora_referral_code');
        localStorage.removeItem('nexora_referral_type');
      } catch {}

      showToast(`Conta ativada com sucesso! Bem-vindo(a) ao Nexora OS.`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast('Erro ao registar a organização.', err?.message || 'Falha de comunicação com o servidor.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050711] text-slate-100 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-[#00E5FF]/30 selection:text-[#00E5FF]">
      {/* ── Ambient Background Lighting ── */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#00E5FF]/15 via-[#2563EB]/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-10 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,#000_75%,transparent_100%)] pointer-events-none" />

      {/* ── Header ── */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 text-center space-y-3 px-2">
        <div className="flex justify-center mb-1">
          <div className="relative p-3 rounded-2xl bg-slate-900/80 border border-white/10 shadow-[0_0_35px_rgba(0,229,255,0.18)] backdrop-blur-xl group hover:border-[#00E5FF]/40 transition-all duration-300">
            <Logo variant="full" size="md" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/25 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Zap className="w-3 h-3 text-[#00E5FF]" /> Registo Rápido
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Globe className="w-3 h-3" /> Ativação Imediata
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            Criar Conta no Nexora OS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
            Preencha os dados abaixo e confirme o seu WhatsApp para ativar a sua conta empresarial.
          </p>
        </div>
      </div>

      {/* ── Form Container ── */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-2 sm:px-0">
        <div className="bg-[#0B101E]/90 backdrop-blur-2xl border border-white/[0.12] py-7 px-5 sm:px-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] rounded-3xl relative overflow-hidden">
          {/* Top Line Accent */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-400 via-[#00E5FF] to-purple-500" />

          <form className="space-y-5" onSubmit={handleSubmit}>
            {referralCode && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-xs text-emerald-300">
                    Código de indicação: <strong className="font-mono text-white">{referralCode}</strong>
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              </div>
            )}

            {/* 1. SELEÇÃO DE PERFIL EM BOX LIMPA E COMPACTA */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Tipo de Perfil / Conta *
              </label>

              <div className="relative">
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                  className="w-full bg-slate-900/90 border border-white/15 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl px-4 py-3 text-sm font-semibold text-white outline-none transition-all shadow-inner cursor-pointer"
                >
                  {PROFILE_OPTIONS.map((opt) => (
                    <option key={opt.type} value={opt.type} className="bg-slate-900 text-white py-1">
                      {opt.title} {opt.badge ? `(${opt.badge})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Box de detalhe do perfil selecionado */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 shrink-0 mt-0.5">
                  <selectedProfile.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{selectedProfile.title}</span>
                    {selectedProfile.badge && (
                      <span className="text-[10px] font-bold text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded-full border border-[#00E5FF]/20">
                        {selectedProfile.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {selectedProfile.description}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. DADOS CADASTRAIS (CAMPOS LIMPOS) */}
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Nome do Responsável */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome Completo *
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

                {/* Nome da Empresa */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome da Empresa / Fantasia *
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
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  E-mail Corporativo *
                </label>
                <div className="relative group/input">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ex: antonio@empresa.ao"
                    className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              {/* WHATSAPP COM VERIFICAÇÃO OTP INTEGRADA */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  WhatsApp com Indicativo *
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1 group/input">
                    <Smartphone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                    <input
                      type="tel"
                      required
                      disabled={verificationConfirmed}
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (verificationConfirmed) {
                          setVerificationConfirmed(false);
                          setVerificationSent(false);
                          setVerificationCode('');
                        }
                      }}
                      placeholder="ex: +244 923 000 000 ou 962624535"
                      className={`w-full bg-slate-900/80 border rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all shadow-inner ${
                        verificationConfirmed
                          ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200'
                          : 'border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20'
                      }`}
                    />
                  </div>

                  {!verificationConfirmed && (
                    <button
                      type="button"
                      disabled={verificationLoading || phone.trim().length < 9}
                      onClick={handleSendVerification}
                      className="px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 disabled:opacity-40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {verificationLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>{verificationSent ? 'Reenviar Código' : 'Enviar Código'}</span>
                    </button>
                  )}
                </div>

                {!verificationConfirmed && !verificationSent && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setVerificationSent(true)}
                      className="text-[11px] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
                    >
                      Já tem um código ou chave de teste admin?
                    </button>
                  </div>
                )}

                {/* Bloco de Digitar o Código OTP */}
                {verificationSent && !verificationConfirmed && (
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">Digite o código de 6 dígitos recebido no WhatsApp:</span>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={10}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.trim().toUpperCase().slice(0, 10))}
                        placeholder="Ex: 123456"
                        className="flex-1 bg-slate-950 border border-emerald-500/40 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 rounded-xl px-3.5 py-2 text-center text-sm text-white placeholder-slate-600 outline-none font-mono tracking-wider uppercase font-bold shadow-inner"
                      />
                      <button
                        type="button"
                        disabled={verificationLoading || (verificationCode.trim().length < 6 && verificationCode.trim().toUpperCase() !== 'NEXORA')}
                        onClick={handleVerifyCode}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                      >
                        {verificationLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>Validar</span>
                      </button>
                    </div>

                    {verificationMessage && (
                      <p className="text-[11px] text-emerald-400">{verificationMessage}</p>
                    )}
                  </div>
                )}

                {/* Badge de WhatsApp Confirmado */}
                {verificationConfirmed && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold">WhatsApp verificado com sucesso!</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVerificationConfirmed(false);
                        setVerificationSent(false);
                        setVerificationCode('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Trocar número
                    </button>
                  </div>
                )}
              </div>

              {/* Senha */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">
                    Palavra-passe (Senha de Acesso) *
                  </label>
                  {password && (
                    <span className={`text-[10px] font-bold ${passwordStrength.text}`}>
                      {passwordStrength.label}
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
                    placeholder="Mínimo 8 caracteres"
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

                {password && (
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          step <= passwordStrength.score ? passwordStrength.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* NIF Opcional */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1 flex items-center justify-between">
                  <span>NIF da Empresa</span>
                  <span className="text-[10px] text-slate-500">Opcional</span>
                </label>
                <input
                  type="text"
                  value={nif}
                  onChange={(e) => setNif(e.target.value)}
                  placeholder="ex: 5401234567"
                  className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none font-mono transition-all shadow-inner"
                />
              </div>
            </div>

            {/* Checkbox Termos */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-white/20 bg-slate-900 text-[#00E5FF] focus:ring-[#00E5FF] cursor-pointer accent-[#00E5FF]"
              />
              <label htmlFor="terms" className="text-[11px] text-slate-400 leading-relaxed cursor-pointer select-none">
                Concordo com os <span className="text-[#00E5FF] underline">Termos de Serviço</span> e a{' '}
                <span className="text-[#00E5FF] underline">Política de Privacidade</span> da plataforma Nexora OS.
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting || !verificationConfirmed}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 uppercase tracking-wide font-display ${
                  verificationConfirmed
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-[#00E5FF] hover:from-emerald-400 hover:to-[#00E5FF]/90 text-slate-950 shadow-[0_0_25px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>A registar e ativar conta...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{verificationConfirmed ? 'Criar Conta & Acessar Sistema' : 'Valide o WhatsApp para Ativar'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-white/[0.08] flex items-center justify-center gap-2">
            <span>Já possui uma conta ativa?</span>
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
            <div className="mt-2 text-center">
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
