import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  KeyRound,
  User,
  Mail,
  Lock,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  Command,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface CreateAdminQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateAdminQuickModal: React.FC<CreateAdminQuickModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'NEXORA_ADMIN' | 'NEXORA_OPERATOR'>('NEXORA_ADMIN');
  const [adminKey, setAdminKey] = useState(() => {
    try {
      return sessionStorage.getItem('nexora_admin_key') || '';
    } catch {
      return '';
    }
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdAdmin, setCreatedAdmin] = useState<{
    email: string;
    fullName: string;
    role: string;
    password?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Gerador de senha forte
  const generateStrongPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    let res = '';
    for (let i = 0; i < 14; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCreatedAdmin(null);
      if (!password) {
        generateStrongPassword();
      }
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 8) {
      setError('A senha deve conter no mínimo 8 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/create-quick-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(adminKey ? { 'x-nexora-admin-key': adminKey } : {}),
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          role,
          adminKey: adminKey.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar administrador do sistema.');
      }

      // Guardar a chave no sessionStorage se for válida
      if (adminKey) {
        try {
          sessionStorage.setItem('nexora_admin_key', adminKey.trim());
        } catch {}
      }

      setCreatedAdmin({
        email: email.trim(),
        fullName: fullName.trim(),
        role,
        password,
      });

      showToast(`Administrador "${fullName}" criado com sucesso!`, 'success');
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao criar administrador.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdAdmin) return;
    const text = `CREDENCIAIS DE ADMINISTRADOR NEXORA OS\nNome: ${createdAdmin.fullName}\nEmail: ${createdAdmin.email}\nSenha: ${createdAdmin.password}\nCargo: ${createdAdmin.role === 'NEXORA_ADMIN' ? 'Administrador Global (Super Admin)' : 'Operador de Rede'}\nURL: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Credenciais copiadas para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0B0F19] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.3)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Criar Administrador do Sistema
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 font-mono text-[10px] text-cyan-300">
                  Ctrl + Shift + A
                </span>
                Atalho Global Ativo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium animate-shake">
              {error}
            </div>
          )}

          {createdAdmin ? (
            /* Tela de Sucesso com Credenciais */
            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                <div className="font-bold flex items-center gap-2 text-sm text-emerald-400">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Conta de Administrador Criada com Sucesso!
                </div>
                <p className="text-slate-300 text-[11px]">
                  Guarde estas credenciais de forma segura. O administrador já pode iniciar sessão imediatamente.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Nome:</span>
                  <span className="text-white font-bold">{createdAdmin.fullName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Email:</span>
                  <span className="text-cyan-400 font-bold">{createdAdmin.email}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Senha:</span>
                  <span className="text-amber-300 font-bold tracking-wider">{createdAdmin.password}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Nível:</span>
                  <span className="text-purple-300 font-bold">{createdAdmin.role}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleCopyCredentials}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" /> Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1.5" /> Copiar Dados de Acesso
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreatedAdmin(null);
                    setFullName('');
                    setEmail('');
                    generateStrongPassword();
                  }}
                  className="text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Criar Outro
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            /* Formulário de Criação */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nome Completo do Administrador <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Carlos Mateus"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email de Acesso (Login) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@nexora.ao"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Senha Provisória / Acesso <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateStrongPassword}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Gerar Senha Forte
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full pl-9 pr-10 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Cargo / Nível */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nível de Privilégios
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('NEXORA_ADMIN')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'NEXORA_ADMIN'
                        ? 'border-cyan-500 bg-cyan-500/10 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-cyan-400">NEXORA_ADMIN</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Acesso total e irrestrito</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('NEXORA_OPERATOR')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'NEXORA_OPERATOR'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-purple-400">NEXORA_OPERATOR</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Operações e displays</div>
                  </button>
                </div>
              </div>

              {/* Chave de Administração (Opcional se já autenticado) */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Chave Mestra de Administração <span className="text-[10px] text-slate-500">(NEXORA_ADMIN_KEY)</span>
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Chave de segurança do servidor"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  disabled={loading}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs shadow-lg shadow-cyan-500/20"
                >
                  {loading ? 'Criando Administrador...' : 'Criar Administrador'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
