/**
 * BackgroundGenerationContext
 *
 * Manages AI image generation jobs that run in the background.
 * Jobs persist across navigation so the user can freely browse
 * while the generation runs on kie.ai.
 */
import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { studioService } from '../services/studioService';
import { aiGenerationJobRepository } from '../repositories/aiGenerationJobRepository';
import { AIGenerationJob } from '../types/studio';

export type BgJobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/** Parâmetros originais de um pedido — guardados para permitir nova tentativa. */
export interface BgJobRequest {
  label: string;
  orgId: string;
  userId: string;
  styleId: string;
  aspectRatio: string;
  resolution: string;
  objective?: string;
  additionalInstructions?: string;
  originalImageBase64Url?: string;
  imageModel?: string;
}

export interface BgJob {
  id: string;           // internal tracking id (same as AIGenerationJob.id)
  label: string;        // human-readable label
  status: BgJobStatus;
  progressMessage: string;
  resultJob?: AIGenerationJob;
  error?: string;
  startedAt: number;
  /**
   * Pedido que originou o job. Sem isto, uma falha não podia ser repetida com os
   * mesmos dados (estilo, formato, imagem, modelo) — o utilizador tinha de
   * reconstruir tudo à mão.
   */
  request?: BgJobRequest;
}

interface BgGenContextValue {
  jobs: BgJob[];
  /** Start a generation job in the background. Returns the tracking id. */
  startJob: (params: BgJobRequest) => Promise<string>;
  /** Repete um job que falhou, com exactamente os mesmos parâmetros. */
  retryJob: (trackingId: string) => Promise<string | null>;
  /** Remove a completed/failed job from the list */
  dismissJob: (trackingId: string) => void;
  /** Clear all completed/failed jobs */
  clearDone: () => void;
}

const BgGenContext = createContext<BgGenContextValue | null>(null);

const FRONTEND_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const STORAGE_KEY = 'nexora_bg_active_jobs';

export const BackgroundGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [jobs, setJobs] = useState<BgJob[]>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Keep a ref to avoid stale closures in polling loops
  const jobsRef = useRef<BgJob[]>([]);
  jobsRef.current = jobs;

  // Track published jobs to prevent duplicate entries in Media Library
  const publishedJobsRef = useRef<Set<string>>(new Set());

  // Persist jobs to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
      } catch {}
    }
  }, [jobs]);

  const updateJob = useCallback((id: string, patch: Partial<BgJob>) => {
    setJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...patch } : j))
    );
  }, []);

  // Poll a single job until completed or failed
  const pollJob = useCallback(async (trackingId: string, orgId?: string, userId?: string) => {
    const pollStart = Date.now();
    let isFinished = false;

    while (!isFinished && Date.now() - pollStart < FRONTEND_TIMEOUT_MS) {
      await new Promise<void>((r) => setTimeout(r, 1800));

      try {
        const updated = await studioService.getJobStatus(trackingId);
        if (updated) {
          const msg = updated.parameters?.currentStepMessage;
          updateJob(trackingId, {
            status: updated.status as BgJobStatus,
            progressMessage: msg || 'Processando...',
          });

          if (updated.status === 'COMPLETED') {
            isFinished = true;
            updateJob(trackingId, {
              status: 'COMPLETED',
              progressMessage: 'Concluído!',
              resultJob: updated,
            });
            if (updated.outputUrl) {
              aiGenerationJobRepository.updateStatus(trackingId, 'COMPLETED', updated.outputUrl).catch(() => {});

              // Fechar o job no livro-razão do servidor. Sem isto, o painel de
              // admin continuaria a ver a geração como "em curso" para sempre.
              import('../repositories/aiCreditRepository')
                .then(({ aiCreditRepository: creditRepo }) =>
                  creditRepo.completeGeneration(trackingId, 'COMPLETED', updated.outputUrl)
                )
                .catch((ledgerErr) => {
                  console.warn('⚠️ [BackgroundGeneration] Falha ao fechar o job no servidor:', ledgerErr);
                });

              // Sincronizar automaticamente com a Biblioteca de Mídias do Nexora Sign (com deduplicação estrita)
              if (!publishedJobsRef.current.has(trackingId)) {
                publishedJobsRef.current.add(trackingId);
                (async () => {
                  try {
                    const { contentRepository } = await import('../repositories/contentRepository');
                    const promptName = updated.prompt
                      ? (updated.prompt.length > 50 ? updated.prompt.substring(0, 48) + '...' : updated.prompt)
                      : 'Anúncio Criativo IA';
                    const ratio = updated.parameters?.aspectRatio || '9:16';
                    const isLandscape = ratio === '16:9' || ratio === '4:3';
                    
                    await contentRepository.create({
                      id: `cnt-ai-${trackingId}`,
                      organizationId: orgId || updated.organizationId || 'org-talatona',
                      name: `[Creative AI] ${promptName}`,
                      type: 'IMAGE',
                      status: 'READY',
                      fileUrl: updated.outputUrl,
                      thumbnailUrl: updated.outputUrl,
                      aspectRatio: ratio,
                      orientation: isLandscape ? 'LANDSCAPE' : 'PORTRAIT',
                      resolution: updated.parameters?.resolution === '4K' ? '3840x2160 (4K)' : '1080x1920 (Full HD)',
                      tags: ['Creative AI', 'IA Gerativa', updated.parameters?.styleId || 'Studio', 'DOOH'],
                      folderId: 'fld-creative-ai',
                      folderName: 'Creative AI Studio',
                      metadata: {
                        source: 'creative-ai',
                        agentId: updated.parameters?.styleId,
                        jobId: trackingId,
                        prompt: updated.prompt,
                      } as any,
                    });
                    console.log(`🚀 [BackgroundGeneration] Mídia enviada para a Biblioteca Nexora Sign: cnt-ai-${trackingId}`);
                  } catch (libErr) {
                    console.warn('⚠️ [BackgroundGeneration] Falha ao sincronizar com Biblioteca de Mídias:', libErr);
                  }
                })();
              }
            }
          } else if (updated.status === 'FAILED') {
            isFinished = true;
            updateJob(trackingId, {
              status: 'FAILED',
              progressMessage: 'Falhou',
              error: updated.error || 'Erro desconhecido',
            });
            aiGenerationJobRepository.updateStatus(trackingId, 'FAILED', undefined, updated.error).catch(() => {});

            // O estorno é feito pelo SERVIDOR ao fechar o job como FAILED, e
            // devolve exactamente o que foi cobrado. Antes o cliente devolvia
            // 10 créditos fixos mesmo quando o custo real era 8 — e, agora que
            // o débito é do servidor, um estorno local seria crédito inventado.
            import('../repositories/aiCreditRepository')
              .then(({ aiCreditRepository: creditRepo }) =>
                creditRepo.completeGeneration(trackingId, 'FAILED', undefined, updated.error)
              )
              .catch((ledgerErr) => {
                console.warn('⚠️ [BackgroundGeneration] Falha ao estornar créditos:', ledgerErr);
              });
          }
        }
      } catch {
        // Network blip — retry
      }
    }
  }, [updateJob]);

  // On mount, resume polling for any unfinished jobs
  useEffect(() => {
    const pendingJobs = jobs.filter((j) => j.status === 'QUEUED' || j.status === 'PROCESSING');
    pendingJobs.forEach((j) => {
      pollJob(j.id);
    });
  }, []);

  const startJob = useCallback(
    async (params: BgJobRequest): Promise<string> => {
      const modelo = params.imageModel || 'gpt-image-2';

      // Kick off the backend call — this deducts credits and enqueues the job on kie.ai
      const initialJob = await studioService.startCreativeAIGeneration({
        organizationId: params.orgId,
        userId: params.userId,
        styleId: params.styleId,
        aspectRatio: params.aspectRatio,
        objective: params.objective || '',
        additionalInstructions: params.additionalInstructions || '',
        originalImageBase64Url: params.originalImageBase64Url,
        imageModel: modelo,
      });

      const trackingId = initialJob.id;

      // Sync with client-side repository
      const existing = await aiGenerationJobRepository.getById(trackingId);
      if (!existing) {
        await aiGenerationJobRepository.create({
          id: trackingId,
          organizationId: params.orgId,
          userId: params.userId,
          type: 'IMAGE',
          prompt: params.additionalInstructions || `Estilo ${params.styleId}`,
          model: modelo,
          parameters: {
            styleId: params.styleId,
            aspectRatio: params.aspectRatio,
            resolution: params.resolution,
            imageModel: modelo,
          },
          costInCredits: initialJob.costInCredits || 8,
        }).catch(() => {});
      }

      const bgJob: BgJob = {
        id: trackingId,
        label: params.label,
        status: 'QUEUED',
        progressMessage: 'Iniciando agente Nexora Creative...',
        startedAt: Date.now(),
        // Guarda o pedido inteiro: é o que permite repetir a geração com os
        // mesmos dados depois de uma falha.
        request: { ...params, imageModel: modelo },
      };

      setJobs((prev) => [...prev, bgJob]);

      // Kick off background polling
      pollJob(trackingId, params.orgId, params.userId);

      return trackingId;
    },
    [pollJob]
  );

  /** Repete um job falhado com exactamente os mesmos parâmetros. */
  const retryJob = useCallback(
    async (trackingId: string): Promise<string | null> => {
      const anterior = jobsRef.current.find((j) => j.id === trackingId);
      if (!anterior?.request) {
        console.warn('⚠️ [BackgroundGeneration] Job sem parâmetros guardados — não é possível repetir.');
        return null;
      }

      setJobs((prev) => prev.filter((j) => j.id !== trackingId));
      return startJob({ ...anterior.request, label: `${anterior.request.label} (nova tentativa)` });
    },
    [startJob]
  );

  const dismissJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setJobs((prev) => prev.filter((j) => j.status === 'QUEUED' || j.status === 'PROCESSING'));
  }, []);

  return (
    <BgGenContext.Provider value={{ jobs, startJob, retryJob, dismissJob, clearDone }}>
      {children}
    </BgGenContext.Provider>
  );
};

export function useBgGeneration() {
  const ctx = useContext(BgGenContext);
  if (!ctx) throw new Error('useBgGeneration must be used within BackgroundGenerationProvider');
  return ctx;
}
