import React, { useEffect, useState, useMemo } from 'react';
import { studioService } from '../../../services/studioService';
import { AIGenerationJob } from '../../../types/studio';
import { useSession } from '../../../context/SessionContext';
import { Modal } from '../../../components/ui/Modal';
import { useToast } from '../../../components/ui/Toast';
import {
  FolderHeart,
  Download,
  Search,
  Trash2,
  Eye,
  Coins,
  Film,
  Play,
  Sparkles,
} from 'lucide-react';

export function StudioLibraryPage({
  onBack,
  onNavigate = () => {},
}: {
  onBack: () => void;
  onNavigate?: (path: string) => void;
}) {
  const { currentOrganization } = useSession();
  const orgId = currentOrganization?.id || '';
  const { showToast } = useToast();

  const [jobs, setJobs] = useState<AIGenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'ALL' | 'IMAGE' | 'VIDEO' | 'STORYBOARD'>('ALL');
  const [search, setSearch] = useState('');

  // Preview & Delete Modals
  const [selectedPreviewJob, setSelectedPreviewJob] = useState<AIGenerationJob | null>(null);
  const [jobToDelete, setJobToDelete] = useState<AIGenerationJob | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadJobs = async () => {
    if (!orgId) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await studioService.getRecentJobs(orgId, 60);
      const filtered = data.filter(j => !j.organizationId || j.organizationId === orgId);
      setJobs(filtered);
    } catch {
      setJobs([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
  }, [orgId]);

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    setIsDeleting(true);
    try {
      await studioService.deleteJob(jobToDelete.id);
      setJobs((prev) => prev.filter((j) => j.id !== jobToDelete.id));
      showToast('Mídia Excluída', 'O criativo foi removido do seu acervo.', 'success');
      if (selectedPreviewJob?.id === jobToDelete.id) {
        setSelectedPreviewJob(null);
      }
      setJobToDelete(null);
    } catch {
      showToast('Erro', 'Falha ao excluir mídia.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (filterType !== 'ALL' && job.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return job.prompt?.toLowerCase().includes(q) || job.id.toLowerCase().includes(q);
      }
      return true;
    });
  }, [jobs, filterType, search]);

  return (
    <div className="w-full flex flex-col gap-5 animate-in fade-in duration-300">
      {/* Filter Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#10172A] p-3.5 rounded-2xl border border-white/[0.08]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['ALL', 'IMAGE', 'VIDEO', 'STORYBOARD'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === t
                  ? 'bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] text-slate-950 shadow-md font-bold'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              {t === 'ALL' ? 'Todos' : t === 'IMAGE' ? 'Imagens' : t === 'VIDEO' ? 'Vídeos' : 'Storyboards'}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por prompt..."
            className="w-full bg-[#090E1B] border border-white/10 focus:border-[#00E5FF] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
          />
        </div>
      </div>

      {/* Media Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-500 text-xs">
          Carregando acervo de criativos...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="p-16 text-center text-slate-500 text-xs rounded-2xl bg-[#10172A] border border-white/[0.06]">
          Nenhuma mídia encontrada com os filtros selecionados.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredJobs.map((job) => {
            const url = job.resultUrl || job.outputUrl;
            const isVid = job.type === 'VIDEO';
            const isStoryboard = job.type === 'STORYBOARD';

            return (
              <div
                key={job.id}
                className="group relative h-64 rounded-2xl overflow-hidden border border-white/[0.08] hover:border-[#00E5FF]/60 bg-[#10172A] shadow-lg flex flex-col justify-between transition-all"
              >
                <div
                  onClick={() => setSelectedPreviewJob(job)}
                  className="relative w-full h-full cursor-pointer overflow-hidden"
                >
                  {url ? (
                    /**
                     * ⛔ Um vídeo num `<img>` não tem miniatura: o browser não
                     * descodifica o .mp4 como imagem e o cartão aparecia partido
                     * (fundo vazio com o texto por cima). Com `<video>` o próprio
                     * ficheiro mostra o primeiro fotograma como miniatura.
                     */
                    isVid ? (
                      <>
                        <video
                          src={url}
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-lg">
                            <Play className="w-5 h-5 ml-0.5" />
                          </span>
                        </span>
                      </>
                    ) : (
                      <img
                        src={url}
                        alt={job.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">
                      Sem prévia
                    </div>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-mono font-bold border ${
                      isVid ? 'text-[#00E5FF] border-[#00E5FF]/30' : isStoryboard ? 'text-amber-400 border-amber-500/30' : 'text-white border-white/10'
                    }`}>
                      {isVid ? 'VÍDEO' : isStoryboard ? 'STORYBOARD' : 'IMAGEM'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-mono text-[#00E5FF] border border-white/10">
                      {job.parameters?.aspectRatio || '9:16'}
                    </span>
                  </div>

                  {/* Bottom Info Overlay — Sem prompt cru */}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="text-[11px] text-white font-medium truncate">
                      {isVid ? 'Spot de Vídeo' : isStoryboard ? 'Storyboard (5 Cenas)' : 'Anúncio Publicitário'}
                    </span>
                    <span className="text-[9px] text-[#00E5FF] font-mono font-semibold">
                      {job.parameters?.resolution || 'HD'}
                    </span>
                  </div>
                </div>

                {/* Quick Hover Actions Bar */}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (url) {
                        const link = document.createElement('a');
                        link.href = url;
                        link.target = '_blank';
                        // A extensão tem de corresponder ao ficheiro: um vídeo
                        // descarregado como .jpg não abre em lado nenhum.
                        link.download = `nexora-${job.id}.${isVid ? 'mp4' : 'jpg'}`;
                        link.click();
                      }
                    }}
                    className="w-7 h-7 rounded-lg bg-black/80 hover:bg-black text-white flex items-center justify-center transition-all cursor-pointer border border-white/15"
                    title="Baixar"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setJobToDelete(job);
                    }}
                    className="w-7 h-7 rounded-lg bg-black/80 hover:bg-red-950 text-slate-300 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer border border-white/15"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal — Limpa sem prompts */}
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
          description="Visualização em alta definição da peça publicitária sintetizada."
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
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#00C6FF] to-[#1677FF] text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg hover:brightness-110"
              >
                <Download className="w-3.5 h-3.5" />{' '}
                {selectedPreviewJob.type === 'VIDEO'
                  ? 'Baixar Vídeo (.mp4)'
                  : selectedPreviewJob.type === 'STORYBOARD'
                  ? 'Baixar Storyboard'
                  : 'Baixar Imagem'}
              </button>
            </div>
          }
        >
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center max-h-[500px] w-full bg-black/80 rounded-xl overflow-hidden border border-white/10 p-1">
              {selectedPreviewJob.type === 'VIDEO' ? (
                <video
                  src={selectedPreviewJob.outputUrl || selectedPreviewJob.resultUrl}
                  controls
                  autoPlay
                  loop
                  className="max-h-[480px] w-auto object-contain rounded-lg"
                />
              ) : (
                <img
                  src={selectedPreviewJob.resultUrl || selectedPreviewJob.outputUrl || ''}
                  alt="Preview"
                  className="max-h-[480px] w-auto object-contain rounded-lg"
                />
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span>Formato: <strong className="text-[#00E5FF]">{selectedPreviewJob.parameters?.aspectRatio || '9:16'}</strong></span>
              <span>•</span>
              <span>Resolução: <strong className="text-white">{selectedPreviewJob.parameters?.resolution || 'Full HD'}</strong></span>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {jobToDelete && (
        <Modal
          isOpen={!!jobToDelete}
          onClose={() => setJobToDelete(null)}
          title="Excluir Mídia"
          description="Tem certeza de que deseja excluir permanentemente este arquivo?"
          accent="rose"
          size="sm"
          footer={
            <>
              <button
                onClick={() => setJobToDelete(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-xs text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteJob}
                disabled={isDeleting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer"
              >
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </>
          }
        >
          <p className="text-xs text-slate-400">
            Esta ação não poderá ser desfeita. O criativo será removido do seu acervo.
          </p>
        </Modal>
      )}
    </div>
  );
}
