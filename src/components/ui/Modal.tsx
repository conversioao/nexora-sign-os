import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '../../lib/scrollLock';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Accent color for the top border glow */
  accent?: 'cyan' | 'purple' | 'emerald' | 'rose' | 'amber';
  /** Icon to display next to the title */
  icon?: React.ReactNode;
}

const ACCENT_STYLES = {
  cyan:    { border: 'border-[#00E5FF]/30', glow: 'shadow-[0_0_50px_rgba(0,229,255,0.12)]', bar: 'from-[#00E5FF] to-blue-500', icon: 'bg-[#00E5FF]/15 border-[#00E5FF]/30 text-[#00E5FF]' },
  purple:  { border: 'border-purple-500/30', glow: 'shadow-[0_0_50px_rgba(168,85,247,0.12)]', bar: 'from-purple-500 to-blue-600', icon: 'bg-purple-500/15 border-purple-500/30 text-purple-300' },
  emerald: { border: 'border-emerald-500/30', glow: 'shadow-[0_0_50px_rgba(16,185,129,0.12)]', bar: 'from-emerald-500 to-teal-500', icon: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' },
  rose:    { border: 'border-rose-500/30', glow: 'shadow-[0_0_50px_rgba(244,63,94,0.12)]', bar: 'from-rose-500 to-pink-600', icon: 'bg-rose-500/15 border-rose-500/30 text-rose-300' },
  amber:   { border: 'border-amber-500/30', glow: 'shadow-[0_0_50px_rgba(245,158,11,0.12)]', bar: 'from-amber-500 to-orange-500', icon: 'bg-amber-500/15 border-amber-500/30 text-amber-300' },
};

const SIZE_CLASSES = {
  sm:  'max-w-md',
  md:  'max-w-lg',
  lg:  'max-w-2xl',
  xl:  'max-w-4xl',
  '2xl': 'max-w-6xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  accent = 'cyan',
  icon,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const ac = ACCENT_STYLES[accent];

  // Mantém o onClose atual numa ref: assim o efeito abaixo NÃO volta a correr a
  // cada render (antes dependia de `onClose`, que é recriado a cada tecla
  // digitada — o que fazia o modal roubar o foco do input a cada carácter).
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    // Trava do scroll com contagem de referências (ver src/lib/scrollLock.ts):
    // com dois modais sobrepostos, o primeiro a fechar já não liberta a página
    // enquanto o outro continua aberto.
    lockBodyScroll();
    window.addEventListener('keydown', handleKeyDown);

    // Trava o foco dentro do diálogo — mas só se o foco ainda estiver fora dele.
    // Assim não rouba o foco de inputs com autoFocus nem a cada re-render.
    const focusTimer = setTimeout(() => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (document.activeElement && dialog.contains(document.activeElement)) return;

      const firstField = dialog.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
      );
      (firstField || dialog).focus();
    }, 50);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#020509]/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Frame */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`
          relative w-full ${SIZE_CLASSES[size]}
          bg-[#07101F]/95 backdrop-blur-2xl
          border ${ac.border}
          rounded-2xl overflow-hidden z-10 my-auto
          ${ac.glow}
          animate-in fade-in zoom-in-95 duration-250
          outline-none
        `}
      >
        {/* Top accent bar */}
        <div className={`h-[2px] w-full bg-gradient-to-r ${ac.bar} opacity-80`} />

        {/* Subtle inner grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b08_1px,transparent_1px),linear-gradient(to_bottom,#1e293b08_1px,transparent_1px)] bg-[size:2rem_2rem] pointer-events-none" />

        {/* Ambient glow blob */}
        <div className={`absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-b ${ac.bar} opacity-[0.06] blur-3xl pointer-events-none`} />

        {/* Header */}
        <div className="relative flex items-start justify-between px-4 sm:px-6 py-3.5 sm:py-5 border-b border-white/[0.07] gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 ${ac.icon}`}>
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm sm:text-base font-bold text-white leading-tight tracking-tight truncate sm:whitespace-normal">{title}</h2>
              {description && (
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-relaxed line-clamp-2">{description}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-white/20 flex items-center justify-center text-slate-400 hover:text-white transition-all duration-150 cursor-pointer shrink-0 touch-manipulation"
            aria-label="Fechar modal"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 max-h-[75vh] sm:max-h-[72vh] overflow-y-auto nexora-scrollbar touch-scroll">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="relative flex flex-wrap items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-white/[0.07] bg-white/[0.02]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
