import React, { useEffect, useState } from 'react';
import { studioService } from '../../../services/studioService';
import { AIGenerationJob } from '../../../types/studio';
import { useSession } from '../../../context/SessionContext';
import { useBgGeneration } from '../../../context/BackgroundGenerationContext';
import { Modal } from '../../../components/ui/Modal';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  ArrowRight,
  FolderHeart,
  Download,
  Eye,
  Zap,
  Film,
  Share2,
  Loader2,
} from 'lucide-react';

export function StudioDashboardPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { currentOrganization } = useSession();
  const orgId = currentOrganization?.id || '';
  const { jobs: bgJobs } = useBgGeneration();

  const [balance, setBalance] = useState(0);
  const [recentJobs, setRecentJobs] = useState<AIGenerationJob[]>([]);
  const [selectedPreviewJob, setSelectedPreviewJob] = useState<AIGenerationJob | null>(null);

  useEffect(() => {
    if (!orgId) {
      setBalance(0);
      setRecentJobs([]);
      return;
    }

    const load = async () => {
      try {
        const bal = await studioService.getBalance(orgId);
        const serverJobs = await studioService.getRecentJobs(orgId, 6);
        setBalance(bal);

        // Merge active background jobs at the top - APENAS da organização do usuário
        const activeBg = bgJobs
          .filter(j => (j.status === 'QUEUED' || j.status === 'PROCESSING') && (!j.request?.orgId || j.request.orgId === orgId))
          .map(j => ({
            id: j.id,
            organizationId: orgId,
            userId: 'usr-1',
            type: 'IMAGE' as const,
            prompt: j.label,
            model: 'gpt-image-2',
            parameters: { currentStepMessage: j.progressMessage },
            status: j.status,
            costInCredits: 10,
            createdAt: new Date(j.startedAt).toISOString(),
          }));

        const existingIds = new Set(activeBg.map(j => j.id));
        const filteredServerJobs = serverJobs.filter(j => (!j.organizationId || j.organizationId === orgId));
        const combined = [...activeBg, ...filteredServerJobs.filter(j => !existingIds.has(j.id))];
        // APENAS AS ÚLTIMAS 6 GERAÇÕES DA CONTA CRIADA
        setRecentJobs(combined.slice(0, 6));
      } catch {}
    };

    load();

    const hasActiveBgJobs = bgJobs.some(
      (j) => j.status === 'QUEUED' || j.status === 'PROCESSING'
    );

    // Se houver jobs em processamento, pesquisa a cada 3.5 segundos.
    // Se o motor estiver livre (sem tarefas), NÃO sobrecarrega o servidor com polling desnecessário.
    if (!hasActiveBgJobs) return;

    const interval = setInterval(load, 3500);
    return () => clearInterval(interval);
  }, [orgId, bgJobs]);

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* ─── BANNER HORIZONTAL COM BORDAS TRANSPARENTES E EFEITO HOVER ─── */}
      <div
        onClick={() => onNavigate('/studio/image')}
        className="relative w-full overflow-hidden cursor-pointer group rounded-2xl transition-all duration-500 hover:shadow-[0_0_40px_rgba(0,229,255,0.15)] border border-white/[0.08]"
      >
        <img
          src="/assets/nexora_creative_banner.png"
          alt="Nexora Creative AI - Crie anúncios incríveis"
          className="w-full h-auto max-h-[340px] sm:max-h-[380px] md:max-h-[420px] object-cover object-left-top transition-all duration-700 ease-out group-hover:scale-[1.012] group-hover:brightness-105"
        />

        {/* Efeito de iluminação e reflexo sutil */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#00E5FF]/0 via-transparent to-[#1677FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050914] via-transparent to-transparent opacity-40 pointer-events-none" />
      </div>

      {/* ─── ATALHOS DE CRIAÇÃO: GERAR IMAGEM, GERAR VÍDEO, GALERIA ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Gerar Imagem */}
        <div
          onClick={() => onNavigate('/studio/image')}
          className="group relative rounded-2xl border border-white/[0.08] hover:border-[#00E5FF]/50 bg-gradient-to-b from-[#10172A]/80 to-[#0A0E1A]/90 backdrop-blur-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between h-52 shadow-lg hover:shadow-[0_0_30px_rgba(0,229,255,0.15)] hover:-translate-y-0.5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] group-hover:scale-110 group-hover:bg-[#00E5FF] group-hover:text-slate-950 transition-all duration-300 shadow-[0_0_15px_rgba(0,229,255,0.2)]">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20 text-[10px] font-mono font-bold">
                IA Generator
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-[#00E5FF] transition-colors font-display">
                Gerar Imagem com IA
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans line-clamp-2">
                Anúncios publicitários com modelos exclusivos Nexora. Foco absoluto no produto real nos formatos Vertical (9:16) e Horizontal (16:9).
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-3 border-t border-white/[0.06]">
            <span className="font-mono text-[#00E5FF] font-bold">10 créditos / imagem</span>
            <span className="text-white font-semibold flex items-center gap-1 group-hover:translate-x-1.5 transition-transform text-xs">
              Gerar Imagem <ArrowRight className="w-3.5 h-3.5 text-[#00E5FF]" />
            </span>
          </div>
        </div>

        {/* Card 2: Gerar Vídeo */}
        <div
          onClick={() => onNavigate('/studio/video')}
          className="group relative rounded-2xl border border-white/[0.08] hover:border-[#1677FF]/50 bg-gradient-to-b from-[#10172A]/80 to-[#0A0E1A]/90 backdrop-blur-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between h-52 shadow-lg hover:shadow-[0_0_30px_rgba(22,119,255,0.15)] hover:-translate-y-0.5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#1677FF]/15 border border-[#1677FF]/30 flex items-center justify-center text-[#1677FF] group-hover:scale-110 group-hover:bg-[#1677FF] group-hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(22,119,255,0.2)]">
                <Film className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#1677FF]/10 text-cyan-300 border border-[#1677FF]/20 text-[10px] font-mono font-bold">
                Omni Flash (10s)
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-[#1677FF] transition-colors font-display">
                Gerar Vídeo & Motion
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans line-clamp-2">
                Storyboard inteligente em 3 atos e animação cinematográfica em 60 FPS calibrada pelo Google Omni Flash.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-3 border-t border-white/[0.06]">
            <span className="font-mono text-cyan-300 font-bold">30 créditos / spot</span>
            <span className="text-white font-semibold flex items-center gap-1 group-hover:translate-x-1.5 transition-transform text-xs">
              Gerar Vídeo <ArrowRight className="w-3.5 h-3.5 text-[#1677FF]" />
            </span>
          </div>
        </div>

        {/* Card 3: Galeria */}
        <div
          onClick={() => onNavigate('/studio/library')}
          className="group relative rounded-2xl border border-white/[0.08] hover:border-[#6D3DF5]/50 bg-gradient-to-b from-[#10172A]/80 to-[#0A0E1A]/90 backdrop-blur-xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between h-52 shadow-lg hover:shadow-[0_0_30px_rgba(109,61,245,0.15)] hover:-translate-y-0.5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-xl bg-[#6D3DF5]/15 border border-[#6D3DF5]/30 flex items-center justify-center text-[#6D3DF5] group-hover:scale-110 group-hover:bg-[#6D3DF5] group-hover:text-white transition-all duration-300 shadow-[0_0_15px_rgba(109,61,245,0.2)]">
                <FolderHeart className="w-5 h-5" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#6D3DF5]/10 text-purple-300 border border-[#6D3DF5]/20 text-[10px] font-mono font-bold">
                Cloud Acervo
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight group-hover:text-[#6D3DF5] transition-colors font-display">
                Galeria de Mídias
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-sans line-clamp-2">
                Gerencie todos os anúncios criados, faça downloads em alta qualidade e programe veiculações automáticas no Nexora Sign.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-3 border-t border-white/[0.06]">
            <span className="font-mono text-purple-300 font-bold">Armazenamento Ilimitado</span>
            <span className="text-white font-semibold flex items-center gap-1 group-hover:translate-x-1.5 transition-transform text-xs">
              Ver Galeria <ArrowRight className="w-3.5 h-3.5 text-[#6D3DF5]" />
            </span>
          </div>
        </div>
      </div>

      {/* ─── GALERIA DE CRIAÇÕES RECENTES (APENAS ÚLTIMAS 6 GERAÇÕES) ──────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00E5FF]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-display">
              Últimas 6 Criações
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/studio/library')}
            className="text-xs text-[#00E5FF] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            Ver Todas as Mídias <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentJobs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs rounded-2xl bg-[#10172A]/60 border border-white/[0.06] backdrop-blur-md">
            Nenhum anúncio gerado ainda. Clique em "Gerar Imagem" para iniciar sua primeira criação com IA!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
            {recentJobs.map((job) => {
              const url = job.resultUrl || job.outputUrl;
              const isVid = job.type === 'VIDEO';
              const isStoryboard = job.type === 'STORYBOARD';
              const isGenerating = job.status === 'QUEUED' || job.status === 'PROCESSING';

              return (
                <div
                  key={job.id}
                  onClick={() => !isGenerating && setSelectedPreviewJob(job)}
                  className={`h-48 rounded-2xl overflow-hidden border relative group transition-all bg-[#0F1626]/80 backdrop-blur-md shadow-md flex flex-col justify-between ${
                    isGenerating
                      ? 'border-[#00E5FF]/40 cursor-default'
                      : 'border-white/[0.08] hover:border-[#00E5FF]/60 cursor-pointer hover:scale-[1.02]'
                  }`}
                >
                  {url && !isGenerating ? (
                    // ⛔ Um vídeo num `<img>` aparece em branco: os vídeos gerados
                    // passaram a existir neste painel, por isso têm de ser
                    // mostrados num elemento de vídeo (silencioso, sem controles,
                    // só como pré-visualização).
                    isVid ? (
                      <video
                        src={url}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <img
                        src={url}
                        alt="Criativo"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )
                  ) : isGenerating ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#0A1120]">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-[#00E5FF] animate-spin" />
                        </div>
                        <span className="absolute inset-0 rounded-full border border-[#00E5FF]/20 animate-ping" />
                      </div>
                      <span className="text-[10px] text-[#00E5FF] font-bold font-mono animate-pulse">A Gerar...</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                      Sem prévia
                    </div>
                  )}

                  {!isGenerating && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />}

                  {/* Top Badge */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between">
                    <span className={`px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[8px] font-mono font-bold ${
                      isVid ? 'text-[#00E5FF]' : isStoryboard ? 'text-amber-400' : 'text-white'
                    }`}>
                      {isVid ? 'VÍDEO' : isStoryboard ? 'STORYBOARD' : 'IMAGEM'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg backdrop-blur-md text-[8px] font-mono font-bold ${
                      isGenerating ? 'bg-[#00E5FF]/20 text-[#00E5FF]' : 'bg-black/70 text-[#00E5FF]'
                    }`}>
                      {isGenerating ? 'GERANDO' : (job.parameters?.aspectRatio || '9:16')}
                    </span>
                  </div>

                  {/* Hover Overlay Icon */}
                  {!isGenerating && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-lg">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {/* Bottom Text */}
                  {!isGenerating && (
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                      <span className="text-[10px] text-slate-200 font-medium truncate">
                        {isVid ? 'Spot de Vídeo' : isStoryboard ? 'Storyboard (5 Cenas)' : 'Criativo IA'}
                      </span>
                      <span className="text-[8px] text-[#00E5FF] font-mono">
                        {job.parameters?.resolution || '2K'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL DE VISUALIZAÇÃO LIMPA ────────────────────────────────────── */}
      {selectedPreviewJob && (
        <Modal
          isOpen={!!selectedPreviewJob}
          onClose={() => setSelectedPreviewJob(null)}
          title={
            selectedPreviewJob.type === 'VIDEO'
              ? 'Visualização do Spot de Vídeo'
              : selectedPreviewJob.type === 'STORYBOARD'
              ? 'Visualização do Storyboard (5 Cenas)'
              : 'Visualização da Peça Publicitária'
          }
          description="Visualização em alta definição da peça publicitária criada."
          size="lg"
          accent="cyan"
          footer={
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setSelectedPreviewJob(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors cursor-pointer"
              >
                Fechar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const url = selectedPreviewJob.resultUrl || selectedPreviewJob.outputUrl;
                    if (url) {
                      navigator.clipboard.writeText(url);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" /> Copiar Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const url = selectedPreviewJob.resultUrl || selectedPreviewJob.outputUrl;
                    if (url) {
                      const link = document.createElement('a');
                      link.href = url;
                      link.target = '_blank';
                      link.download = `nexora-${selectedPreviewJob.id}.${selectedPreviewJob.type === 'VIDEO' ? 'mp4' : 'jpg'}`;
                      link.click();
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] hover:brightness-110 text-slate-950 text-xs font-extrabold flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  <Download className="w-3.5 h-3.5" />{' '}
                  {selectedPreviewJob.type === 'VIDEO' ? 'Baixar Vídeo (.mp4)' : 'Baixar em Alta Resolução'}
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Visual Display Container */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/90 flex items-center justify-center min-h-[320px] max-h-[500px]">
              {selectedPreviewJob.type === 'VIDEO' ? (
                <video
                  src={selectedPreviewJob.outputUrl || selectedPreviewJob.resultUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-[480px] w-auto object-contain rounded-xl"
                />
              ) : (
                <img
                  src={selectedPreviewJob.resultUrl || selectedPreviewJob.outputUrl || ''}
                  alt="Resultado"
                  className="max-h-[480px] w-auto object-contain rounded-xl"
                />
              )}
            </div>

            {/* Metadata Chips Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-white/[0.08] bg-[#10172A] p-2.5 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-mono">Tipo</span>
                <p className="text-xs font-bold text-white mt-0.5">{selectedPreviewJob.type === 'VIDEO' ? 'Vídeo Spot' : 'Imagem Estática'}</p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#10172A] p-2.5 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-mono">Formato</span>
                <p className="text-xs font-bold text-[#00E5FF] mt-0.5">{selectedPreviewJob.parameters?.aspectRatio || '9:16 Vertical'}</p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#10172A] p-2.5 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-mono">Resolução</span>
                <p className="text-xs font-bold text-white mt-0.5">{selectedPreviewJob.parameters?.resolution || '2K Ultra HD'}</p>
              </div>

              <div className="rounded-xl border border-white/[0.08] bg-[#10172A] p-2.5 text-center">
                <span className="text-[9px] text-slate-400 uppercase font-mono">Custo</span>
                <p className="text-xs font-bold text-emerald-400 mt-0.5">{selectedPreviewJob.costInCredits || 10} Créditos</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
