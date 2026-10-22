import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Sparkles, Image, Video } from 'lucide-react';
import { ToastType } from '../../types/theme';

export type ExtendedToastType = ToastType | 'danger' | 'ai';

export interface ToastItem {
  id: string;
  type: ToastType | 'ai';
  title: string;
  message?: string;
  duration?: number;
  /** Optional action button */
  action?: { label: string; onClick: () => void };
  /** Show image thumbnail */
  imageUrl?: string;
}

export interface ToastInput {
  type?: ExtendedToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
  imageUrl?: string;
}

type ShowToastFn = {
  (input: ToastInput): void;
  (title: string, message?: string, type?: ExtendedToastType): void;
};

interface ToastContextValue {
  showToast: ShowToastFn;
  addToast: (toast: ToastInput) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const _addToast = useCallback(
    ({ type = 'info', title, message, duration = 5000, action, imageUrl }: ToastInput) => {
      const normalizedType: ToastType | 'ai' =
        type === 'danger' ? 'error' : (type as ToastType | 'ai');
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { id, type: normalizedType, title, message, duration, action, imageUrl };
      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  // Overloaded showToast: accepts (ToastInput) or (title, message?, type?)
  const showToast = useCallback(
    (titleOrInput: string | ToastInput, message?: string, type?: ExtendedToastType) => {
      if (typeof titleOrInput === 'object') {
        _addToast(titleOrInput);
      } else {
        _addToast({ title: titleOrInput, message, type: type || 'info' });
      }
    },
    [_addToast]
  ) as ShowToastFn;

  const addToast = _addToast;
  const success = useCallback((title: string, message?: string) => _addToast({ type: 'success', title, message }), [_addToast]);
  const error   = useCallback((title: string, message?: string) => _addToast({ type: 'error', title, message }), [_addToast]);
  const warning = useCallback((title: string, message?: string) => _addToast({ type: 'warning', title, message }), [_addToast]);
  const info    = useCallback((title: string, message?: string) => _addToast({ type: 'info', title, message }), [_addToast]);

  return (
    <ToastContext.Provider value={{ showToast, addToast, success, error, warning, info }}>
      {children}

      {/* Toast Container — bottom-right */}
      <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-3 max-w-[360px] w-full pointer-events-none">
        {(toasts || []).map((toast) => {
          const isAI = toast.type === 'ai';

          const icons: Record<string, React.ReactNode> = {
            success: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0" />,
            error:   <AlertCircle  className="w-4.5 h-4.5 text-rose-400 flex-shrink-0" />,
            warning: <AlertTriangle className="w-4.5 h-4.5 text-amber-400 flex-shrink-0" />,
            info:    <Info          className="w-4.5 h-4.5 text-[#00E5FF] flex-shrink-0" />,
            ai:      <Sparkles      className="w-4.5 h-4.5 text-purple-300 flex-shrink-0" />,
          };

          const containerStyles: Record<string, string> = {
            success: 'bg-[#071a11]/95 border-emerald-500/30 shadow-emerald-950/40',
            error:   'bg-[#1a0709]/95 border-rose-500/30 shadow-rose-950/40',
            warning: 'bg-[#1a1207]/95 border-amber-500/30 shadow-amber-950/40',
            info:    'bg-[#07101F]/95 border-[#00E5FF]/25 shadow-cyan-950/40',
            ai:      'bg-[#0d0a1a]/95 border-purple-500/30 shadow-purple-950/40',
          };

          const barStyles: Record<string, string> = {
            success: 'from-emerald-500 to-teal-500',
            error:   'from-rose-500 to-pink-600',
            warning: 'from-amber-500 to-orange-400',
            info:    'from-[#00E5FF] to-blue-500',
            ai:      'from-purple-500 to-indigo-500',
          };

          const t = toast.type as string;
          return (
            <div
              key={toast.id}
              className={`
                pointer-events-auto rounded-2xl border backdrop-blur-2xl shadow-2xl overflow-hidden
                animate-in slide-in-from-bottom-4 fade-in duration-300
                ${containerStyles[t] || containerStyles.info}
              `}
            >
              {/* Top color bar */}
              <div className={`h-[2px] w-full bg-gradient-to-r ${barStyles[t] || barStyles.info}`} />

              <div className="flex items-start gap-3 p-4">
                {/* Icon or image thumb */}
                {toast.imageUrl ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/15 shrink-0">
                    <img src={toast.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="mt-0.5 shrink-0">{icons[t] || icons.info}</div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white leading-snug">{toast.title}</p>
                  {toast.message && (
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.message}</p>
                  )}
                  {toast.action && (
                    <button
                      onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
                      className="mt-2 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-[10px] font-bold text-white transition-all cursor-pointer"
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
