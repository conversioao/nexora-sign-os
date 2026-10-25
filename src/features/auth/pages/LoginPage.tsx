import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Sparkles,
  Zap,
  Globe,
  Eye,
  EyeOff,
  CheckCircle2,
  Tv,
  Cpu,
} from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';
import { useSession } from '../../../context/SessionContext';
import { useToast } from '../../../components/ui/Toast';

export interface LoginPageProps {
  onSuccess: () => void;
  onNavigateToSignUp: () => void;
  onNavigateToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onNavigateToLanding,
}) => {
  const { login, isLoading } = useSession();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMsg('Por favor, informe o seu e-mail corporativo.');
      return;
    }
    if (!password) {
      setErrorMsg('Por favor, insira a sua palavra-passe.');
      return;
    }

    const success = await login(cleanEmail, password, rememberMe);
    if (success) {
      showToast('Sessão iniciada com sucesso na plataforma Nexora.', 'success');
      onSuccess();
    } else {
      setErrorMsg('Credenciais incorretas ou utilizador não cadastrado.');
      showToast('E-mail ou senha incorretos.', 'danger');
    }
  };

  return (
    <div className="min-h-screen bg-[#050711] text-slate-100 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-[#00E5FF]/30 selection:text-[#00E5FF]">
      {/* ── Ambient Background Lighting & Effects ── */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-b from-[#00E5FF]/20 via-[#2563EB]/10 to-transparent blur-[140px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-[-5%] w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Cybernetic Grid Mesh Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_45%,#000_75%,transparent_100%)] pointer-events-none" />

      {/* ── Header Branding ── */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3.5 px-4">
        <div className="flex justify-center mb-1">
          <div className="relative p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 shadow-[0_0_35px_rgba(0,229,255,0.18)] backdrop-blur-xl group hover:border-[#00E5FF]/40 transition-all duration-300">
            <Logo variant="full" size="lg" />
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/25 flex items-center gap-1.5 font-mono uppercase tracking-wider shadow-[0_0_12px_rgba(0,229,255,0.15)]">
            <Zap className="w-3 h-3 text-[#00E5FF]" /> Nexora OS 2.0
          </span>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 font-mono uppercase tracking-wider">
            <Globe className="w-3 h-3" /> Angola & Global
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
            Acesso à Plataforma
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
            Gestão inteligente de painéis DOOH, Inteligência Artificial criativa e monetização em tempo real.
          </p>
        </div>
      </div>

      {/* ── Login Card Form ── */}
      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-[#0B101E]/85 backdrop-blur-2xl border border-white/[0.12] py-8 px-6 sm:px-10 shadow-[0_25px_70px_rgba(0,0,0,0.75)] rounded-3xl relative overflow-hidden">
          {/* Top Rainbow Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00E5FF] via-purple-500 to-emerald-400" />

          {/* Form */}
          <form className="space-y-4 sm:space-y-5" onSubmit={handleStandardLogin}>
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 shadow-lg animate-in fade-in duration-200">
                <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 animate-ping" />
                <span className="font-medium leading-relaxed">{errorMsg}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  E-mail Corporativo
                </label>
                <span className="text-[10px] text-slate-500 font-medium">Conta de Acesso</span>
              </div>
              <div className="relative group/input">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ex: contato@suaempresa.ao"
                  autoComplete="email"
                  className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Palavra-passe
                </label>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Recuperação de acesso enviada via suporte oficial Nexora.', 'info');
                  }}
                  className="text-[11px] text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors font-medium hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="relative group/input">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within/input:text-[#00E5FF] transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full bg-slate-900/80 border border-white/10 focus:border-[#00E5FF] focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-11 py-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition-all duration-200 shadow-inner"
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
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-slate-300 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-slate-900 text-[#00E5FF] focus:ring-[#00E5FF] focus:ring-offset-0 cursor-pointer accent-[#00E5FF]"
                />
                <span className="font-medium">Permanecer conectado</span>
              </label>

              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Criptografado
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#00B4D8] to-[#0077B6] hover:from-[#00E5FF]/90 hover:to-[#0077B6]/90 text-slate-950 text-xs sm:text-sm font-black transition-all duration-200 shadow-[0_0_25px_rgba(0,229,255,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0 tracking-wide uppercase font-display"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A autenticar...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Nexora OS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Platform Pillars */}
          <div className="mt-6 pt-5 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <Tv className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
              <span className="truncate">Players & Totens</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.02] border border-white/5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="truncate">Creative AI Studio</span>
            </div>
          </div>

          {/* Footer Register Callout */}
          <div className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-white/[0.08] space-y-3">
            <div>
              Ainda não tem organização registrada?{' '}
              <button
                type="button"
                onClick={onNavigateToSignUp}
                className="text-[#00E5FF] font-bold hover:underline transition-all cursor-pointer block sm:inline mt-1 sm:mt-0"
              >
                Criar Conta Empresarial
              </button>
            </div>

            {onNavigateToLanding && (
              <div>
                <button
                  type="button"
                  onClick={onNavigateToLanding}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1.5 group pt-1"
                >
                  <span className="group-hover:-translate-x-1 transition-transform">←</span>
                  <span>Voltar à página inicial</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Ambiente corporativo protegido com SHA-256 e TLS 1.3</span>
        </div>
      </div>
    </div>
  );
};
