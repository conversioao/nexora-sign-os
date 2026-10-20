/**
 * BackgroundJobsPanel
 * 
 * A floating panel that shows active & recently completed background
 * AI generation jobs. Appears bottom-left of the screen.
 * On completion it fires a toast notification with the result image.
 */
import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Clock,
} from 'lucide-react';
import { useBgGeneration, BgJob } from '../../context/BackgroundGenerationContext';
import { useToast } from '../ui/Toast';

/** Format elapsed time */
function elapsed(startedAt: number): string {
  const sec = Math.floor((Date.now() - startedAt) / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export const BackgroundJobsPanel: React.FC = () => {
  const { jobs, dismissJob, clearDone } = useBgGeneration();
  const { showToast } = useToast();
  const [collapsed, setCollapsed] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  // Refresh elapsed timer every second for active jobs
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === 'QUEUED' || j.status === 'PROCESSING');
    if (!hasActive) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [jobs]);

  // Track already-notified completions to avoid duplicate toasts
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    jobs.forEach((job) => {
      if (notifiedRef.current.has(job.id)) return;

      if (job.status === 'COMPLETED') {
        notifiedRef.current.add(job.id);
        const imageUrl = job.resultJob?.resultUrl || job.resultJob?.outputUrl;
        showToast({
          type: 'ai',
          title: '✨ Imagem gerada com sucesso!',
          message: `${job.label} está pronta na sua biblioteca.`,
          imageUrl,
          duration: 10000,
        });
      } else if (job.status === 'FAILED') {
        notifiedRef.current.add(job.id);
        showToast({
          type: 'error',
          title: 'Geração falhou',
          message: job.error || 'Ocorreu um erro durante a geração.',
          duration: 8000,
        });
      }
    });
  }, [jobs, showToast]);

  if (jobs.length === 0) return null;

  const activeCount  = jobs.filter((j) => j.status === 'QUEUED' || j.status === 'PROCESSING').length;
  const doneCount    = jobs.filter((j) => j.status === 'COMPLETED' || j.status === 'FAILED').length;

  return (
    <div className="fixed bottom-5 left-5 z-[150] w-[340px] pointer-events-auto">
      {/* Panel */}
      <div className="rounded-2xl border border-purple-500/30 bg-[#0a0d1a]/95 backdrop-blur-2xl shadow-[0_0_40px_rgba(168,85,247,0.15)] overflow-hidden">
        {/* Top accent bar */}
        <div className="h-[2px] w-full bg-gradient-to-r from-purple-500 via-[#00E5FF] to-blue-500" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Nexora Creative AI</p>
              <p className="text-[10px] text-slate-500 font-mono">
                {activeCount > 0 ? `${activeCount} a gerar...` : `${doneCount} concluída(s)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {doneCount > 0 && (
              <button
                onClick={clearDone}
                className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-400 hover:text-white transition-all cursor-pointer font-mono"
              >
                Limpar
              </button>
            )}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Jobs list */}
        {!collapsed && (
          <div className="max-h-[360px] overflow-y-auto divide-y divide-white/[0.04]">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} onDismiss={dismissJob} tick={tick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

function JobRow({ job, onDismiss, tick }: { job: BgJob; onDismiss: (id: string) => void; tick: number; key?: React.Key }) {
  const isActive   = job.status === 'QUEUED' || job.status === 'PROCESSING';
  const isDone     = job.status === 'COMPLETED';
  const isFailed   = job.status === 'FAILED';
  const imageUrl   = job.resultJob?.resultUrl || job.resultJob?.outputUrl;

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
      {/* Status icon / thumbnail */}
      {isDone && imageUrl ? (
        <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/15 shrink-0">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${
          isActive  ? 'bg-purple-500/15 border-purple-500/30' :
          isDone    ? 'bg-emerald-500/15 border-emerald-500/30' :
                      'bg-rose-500/15 border-rose-500/30'
        }`}>
          {isActive  && <Loader2 className="w-4 h-4 text-purple-300 animate-spin" />}
          {isDone    && <CheckCircle2 className="w-4 h-4 text-emerald-300" />}
          {isFailed  && <XCircle className="w-4 h-4 text-rose-300" />}
        </div>
      )}

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-white leading-snug truncate">{job.label}</p>
        <p className={`text-[10px] mt-0.5 leading-relaxed truncate ${
          isActive ? 'text-purple-300 animate-pulse' :
          isDone   ? 'text-emerald-400' :
                     'text-rose-400'
        }`}>
          {isActive ? job.progressMessage : isDone ? 'Concluída com sucesso' : (job.error || 'Falhou')}
        </p>

        {/* Progress bar for active */}
        {isActive && (
          <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 via-[#00E5FF] to-blue-500 rounded-full animate-pulse" style={{ width: '75%' }} />
          </div>
        )}

        {/* Elapsed time */}
        <div className="flex items-center gap-1 mt-1">
          <Clock className="w-2.5 h-2.5 text-slate-600" />
          <span className="text-[9px] text-slate-600 font-mono">{elapsed(job.startedAt)}</span>
        </div>
      </div>

      {/* Dismiss button (only for done/failed) */}
      {!isActive && (
        <button
          onClick={() => onDismiss(job.id)}
          className="w-5 h-5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all cursor-pointer shrink-0"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </div>
  );
}
