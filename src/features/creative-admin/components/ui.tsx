/**
 * Peças de interface partilhadas pelo painel de admin do Creative AI.
 *
 * Mantidas mínimas de propósito: o painel é sobretudo dados, pelo que o valor
 * está na consistência (mesmos cartões, mesmos estados vazios, mesmos
 * formatadores) e não em componentes elaborados.
 */
import React from 'react';
import { Loader2, AlertCircle, Inbox, TrendingUp, TrendingDown } from 'lucide-react';

// ─── Formatadores ────────────────────────────────────────────────────────────
// Todo o painel formata números, kwanzas e datas por aqui, para que dois ecrãs
// nunca mostrem o mesmo valor de formas diferentes.

export const fmtNum = (n: number | null | undefined): string =>
  (Number(n) || 0).toLocaleString('pt-AO');

export const fmtKz = (n: number | null | undefined): string =>
  `${(Number(n) || 0).toLocaleString('pt-AO')} Kz`;

export const fmtDate = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const fmtDay = (iso?: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' });
};

/** "há 3 dias", "nunca" — mais legível que uma data em colunas de atividade. */
export const fmtRelative = (iso?: string | null): string => {
  if (!iso) return 'nunca';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'nunca';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days} d`;
  const months = Math.floor(days / 30);
  return `há ${months} mes${months > 1 ? 'es' : ''}`;
};

// ─── Cartão de KPI ───────────────────────────────────────────────────────────

export interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  trend?: number | null;
  tone?: 'violet' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate';
}

const TONES: Record<string, string> = {
  violet: 'text-[#C084FC] bg-[#7C3AED]/12 border-[#7C3AED]/30',
  cyan: 'text-[#22D3EE] bg-[#06B6D4]/12 border-[#06B6D4]/30',
  emerald: 'text-emerald-300 bg-emerald-500/12 border-emerald-500/30',
  amber: 'text-amber-300 bg-amber-500/12 border-amber-500/30',
  rose: 'text-rose-300 bg-rose-500/12 border-rose-500/30',
  slate: 'text-slate-300 bg-white/[0.05] border-white/10',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  hint,
  icon,
  trend,
  tone = 'violet',
}) => (
  <div className="rounded-2xl bg-[#0C0A18] border border-white/[0.07] p-4 flex flex-col gap-2 hover:border-white/[0.14] transition-colors">
    <div className="flex items-start justify-between gap-2">
      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">{label}</span>
      {icon && (
        <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${TONES[tone]}`}>
          {icon}
        </div>
      )}
    </div>
    <span className="text-xl sm:text-2xl font-extrabold text-white font-mono tracking-tight">{value}</span>
    <div className="flex items-center gap-1.5">
      {typeof trend === 'number' && (
        <span
          className={`flex items-center gap-0.5 text-[10px] font-bold font-mono ${
            trend >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend >= 0 ? '+' : ''}
          {trend}%
        </span>
      )}
      {hint && <span className="text-[10px] text-slate-500 truncate">{hint}</span>}
    </div>
  </div>
);

// ─── Painel / secção ─────────────────────────────────────────────────────────

export interface PanelProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  padded?: boolean;
}

export const Panel: React.FC<PanelProps> = ({ title, subtitle, actions, children, padded = true }) => (
  <section className="rounded-2xl bg-[#0C0A18] border border-white/[0.07] overflow-hidden">
    {(title || actions) && (
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.06]">
        <div className="min-w-0">
          {title && <h2 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h2>}
          {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>
    )}
    <div className={padded ? 'p-4' : ''}>{children}</div>
  </section>
);

// ─── Estados ─────────────────────────────────────────────────────────────────

export const Loading: React.FC<{ label?: string }> = ({ label = 'A carregar…' }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-slate-500 text-xs">
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>{label}</span>
  </div>
);

export const ErrorState: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-300">
      <AlertCircle className="w-5 h-5" />
    </div>
    <p className="text-xs text-rose-300 max-w-md leading-relaxed">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-[11px] font-semibold text-slate-200 cursor-pointer"
      >
        Tentar novamente
      </button>
    )}
  </div>
);

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
    <Inbox className="w-6 h-6 text-slate-600" />
    <p className="text-xs text-slate-500 max-w-sm leading-relaxed">{message}</p>
  </div>
);

// ─── Barra de proporção ──────────────────────────────────────────────────────
// Usada nas tabelas de ranking (top geradores, estilos mais usados). Evita
// trazer uma biblioteca de gráficos só para mostrar proporções.

export const RatioBar: React.FC<{ value: number; max: number; tone?: string }> = ({
  value,
  max,
  tone = 'bg-[#7C3AED]',
}) => {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

// ─── Badge de estado ─────────────────────────────────────────────────────────

const STATUS_TONES: Record<string, string> = {
  COMPLETED: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  APPROVED: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  ACTIVE: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/30',
  PROCESSING: 'bg-[#06B6D4]/12 text-[#22D3EE] border-[#06B6D4]/30',
  QUEUED: 'bg-[#06B6D4]/12 text-[#22D3EE] border-[#06B6D4]/30',
  PENDING: 'bg-amber-500/12 text-amber-300 border-amber-500/30',
  FAILED: 'bg-rose-500/12 text-rose-300 border-rose-500/30',
  REJECTED: 'bg-rose-500/12 text-rose-300 border-rose-500/30',
  CANCELLED: 'bg-white/[0.05] text-slate-400 border-white/10',
  ARCHIVED: 'bg-white/[0.05] text-slate-400 border-white/10',
  INACTIVE: 'bg-white/[0.05] text-slate-400 border-white/10',
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${
      STATUS_TONES[status] || 'bg-white/[0.05] text-slate-300 border-white/10'
    }`}
  >
    {status}
  </span>
);

/** Cabeçalho de tabela consistente. */
export const Th: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' | 'center' }> = ({
  children,
  align = 'left',
}) => (
  <th
    className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-white/[0.06] whitespace-nowrap text-${align}`}
  >
    {children}
  </th>
);

export const Td: React.FC<{ children: React.ReactNode; align?: 'left' | 'right' | 'center'; className?: string }> = ({
  children,
  align = 'left',
  className = '',
}) => (
  <td className={`px-3 py-2.5 text-xs text-slate-300 border-b border-white/[0.04] text-${align} ${className}`}>
    {children}
  </td>
);
