import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Wand2,
  Zap,
} from 'lucide-react';
import { Logo } from '../../../components/ui/Logo';
import { useToast } from '../../../components/ui/Toast';
import { generateStrongPassword } from '../../root-access/services/adminUserService';

/**
 * Ecrã de alteração OBRIGATÓRIA da palavra-passe (primeiro início de sessão).
 *
 * PORQUE existe: a conta foi criada por um administrador, que conhece a
 * palavra-passe inicial. Enquanto essa palavra-passe continuar válida, o
 * administrador (ou qualquer pessoa a quem ele a tenha dito) pode entrar na
 * conta. Este ecrã é, por isso, um bloqueio — é uma página inteira e não um
 * modal, para não poder ser fechado sem concluir a troca.
 */

const MIN_PASSWORD_LENGTH = 8;

export interface ChangePasswordPageProps {
  /** E-mail da conta autenticada — identifica a conta que está a ser alterada. */
  email: string;
  /**
   * Palavra-passe actual, conhecida do login que acabou de acontecer.
   * Vem vazia quando essa credencial já não está em memória (por exemplo,
   * depois de recarregar a página): nesse caso o ecrã volta a pedi-la.
   */
  currentPassword: string;
  /** Chamado depois de o servidor confirmar a troca. */
  onSuccess: () => void;
  /** Termina a sessão (saída discreta, caso o utilizador não seja quem devia). */
  onLogout: () => void;
}

interface FieldErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export const ChangePasswordPage: React.FC<ChangePasswordPageProps> = ({
  email,
  currentPassword,
  onSuccess,
  onLogout,
}) => {
  const { showToast } = useToast();

  /**
   * Só pedimos a palavra-passe actual quando ela não veio no `props`.
   * No caminho normal (login → troca imediata) ela já é conhecida e não se
   * volta a perguntar; depois de um recarregamento, é a única forma de provar
   * a identidade à API, porque nunca guardamos a palavra-passe no browser.
   */
  const requiresCurrentPassword = !currentPassword;

  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // Os campos nascem tapados; o botão de gerar revela-os para que o utilizador
  // consiga LER e guardar a palavra-passe gerada antes de a submeter.
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Palavra-passe actual efectiva: a do login, ou a que for escrita aqui. */
  const effectiveCurrentPassword = currentPassword || currentPasswordInput;

  /**
   * Validação local. Devolve `false` quando existe algum erro — nesse caso o
   * pedido à API NÃO é feito (evita gastar um round-trip e mostrar o mesmo erro
   * vindo do servidor).
   */
  const validate = (): boolean => {
    const nextErrors: FieldErrors = {};

    if (requiresCurrentPassword && !currentPasswordInput) {
      nextErrors.currentPassword = 'Indique a palavra-passe actual da conta.';
    }

    if (!newPassword) {
      nextErrors.newPassword = 'Indique a nova palavra-passe.';
    } else if (newPassword.length < MIN_PASSWORD_LENGTH) {
      nextErrors.newPassword = `A nova palavra-passe deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
    } else if (effectiveCurrentPassword && newPassword === effectiveCurrentPassword) {
      nextErrors.newPassword = 'A nova palavra-passe tem de ser diferente da actual.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirme a nova palavra-passe.';
    } else if (newPassword && confirmPassword !== newPassword) {
      nextErrors.confirmPassword = 'As duas palavras-passe não coincidem.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleGenerate = () => {
    const generated = generateStrongPassword();
    setNewPassword(generated);
    setConfirmPassword(generated);
    // Erros de validação deixam de fazer sentido com valores novos; a mensagem
    // do servidor também é limpa para não induzir em erro.
    setErrors({});
    setServerError(null);
    setShowPasswords(true);
    showToast(
      'Palavra-passe forte gerada.',
      'Guarde-a num gestor de palavras-passe antes de continuar — não voltará a ser mostrada.',
      'info'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Sem validação válida não há pedido: o servidor só veria dados que já
    // sabemos estarem errados.
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          currentPassword: effectiveCurrentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        showToast(
          (data && data.message) || 'Palavra-passe alterada com sucesso.',
          'A palavra-passe inicial deixou de ser válida.',
          'success'
        );
        // Nota: não repomos `isSubmitting` no caminho de sucesso — este ecrã é
        // desmontado por `onSuccess()`, e alterar estado de um componente já
        // desmontado geraria um aviso do React.
        onSuccess();
        return;
      }

      setServerError(
        (data && data.error) ||
          `Não foi possível alterar a palavra-passe (erro HTTP ${response.status}).`
      );
      setIsSubmitting(false);
    } catch {
      setServerError(
        'Não foi possível contactar o servidor. Verifique a ligação e tente novamente.'
      );
      setIsSubmitting(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full bg-slate-900/60 border ${
      hasError ? 'border-rose-500/60 focus:border-rose-500' : 'border-white/10 focus:border-[#00E5FF]'
    } focus:ring-2 focus:ring-[#00E5FF]/20 rounded-xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 outline-none transition-all duration-200`;

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-[#00E5FF]/30 selection:text-[#00E5FF]">
      {/* Fundo: mesma linguagem visual do LoginPage */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,229,255,0.18),rgba(15,23,42,0))] pointer-events-none" />
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 -left-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Cabeçalho de marca */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center space-y-3">
        <div className="flex justify-center mb-2">
          <div className="relative p-3 rounded-2xl bg-white/[0.03] border border-white/10 shadow-[0_0_30px_rgba(0,229,255,0.15)] backdrop-blur-xl">
            <Logo variant="full" size="lg" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1 font-mono uppercase tracking-wider">
            <ShieldAlert className="w-3 h-3" /> Primeiro acesso
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 flex items-center gap-1 font-mono uppercase tracking-wider">
            <Zap className="w-3 h-3" /> Nexora OS 2.0
          </span>
        </div>

        <h2 className="text-2xl font-extrabold text-white font-display tracking-tight">
          Altere a sua palavra-passe
        </h2>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Esta conta ainda usa a palavra-passe inicial definida pelo administrador. Por segurança,
          defina uma palavra-passe só sua antes de continuar.
        </p>
      </div>

      {/* Cartão do formulário */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-[#0A0E1A]/80 backdrop-blur-2xl border border-white/[0.12] py-8 px-6 shadow-[0_20px_60px_rgba(0,0,0,0.7)] rounded-3xl sm:px-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-[#00E5FF] to-purple-500" />

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 shadow-lg">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{serverError}</span>
              </div>
            )}

            {/* Conta em causa: ajuda a perceber que conta está a ser alterada. */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Conta
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="w-full bg-slate-900/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-400 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/*
              Só aparece quando a palavra-passe do login já não está em memória
              (página recarregada). A API exige a palavra-passe actual como prova
              de identidade, por isso é obrigatório voltar a escrevê-la.
            */}
            {requiresCurrentPassword && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Palavra-passe actual</span>
                  <span className="text-[10px] text-amber-300/80">Obrigatória</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPasswordInput}
                    autoComplete="current-password"
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className={inputClass(Boolean(errors.currentPassword))}
                  />
                </div>
                {errors.currentPassword ? (
                  <p className="mt-1.5 text-[11px] text-rose-300 font-medium">
                    {errors.currentPassword}
                  </p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Por segurança, a palavra-passe não fica guardada no browser após recarregar a
                    página.
                  </p>
                )}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Nova palavra-passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasswords((v) => !v)}
                  className="text-[11px] text-[#00E5FF] hover:text-[#00E5FF]/80 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  {showPasswords ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPasswords ? 'Ocultar' : 'Mostrar'}</span>
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  autoComplete="new-password"
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={`Mínimo ${MIN_PASSWORD_LENGTH} caracteres`}
                  className={inputClass(Boolean(errors.newPassword))}
                />
              </div>
              {errors.newPassword ? (
                <p className="mt-1.5 text-[11px] text-rose-300 font-medium">{errors.newPassword}</p>
              ) : (
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Pelo menos {MIN_PASSWORD_LENGTH} caracteres, diferente da palavra-passe inicial.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirmar nova palavra-passe
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  autoComplete="new-password"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={inputClass(Boolean(errors.confirmPassword))}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-[11px] text-rose-300 font-medium">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Sugestão de palavra-passe: preenche os dois campos de uma vez. */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-[#00E5FF]/30 text-[#00E5FF] text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="w-4 h-4" />
              <span>Gerar palavra-passe forte</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#0066FF] hover:from-[#00E5FF]/90 hover:to-[#0066FF]/90 text-slate-950 text-xs font-bold transition-all duration-200 shadow-[0_0_25px_rgba(0,229,255,0.35)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A guardar...</span>
                </>
              ) : (
                <>
                  <span>Guardar e continuar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs text-slate-400 pt-5 border-t border-white/10">
            <button
              type="button"
              onClick={onLogout}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Terminar sessão</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>A palavra-passe inicial deixa de ser válida após esta alteração</span>
        </div>
      </div>
    </div>
  );
};
