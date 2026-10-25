import { aiCreditRepository } from '../repositories/aiCreditRepository';
import { aiGenerationJobRepository } from '../repositories/aiGenerationJobRepository';
import { mockAIProvider, AI_MODELS } from '../gateways/ai/MockAIProvider';
import { AIGenerationType, AIGenerationJob, AICreditTransaction, AICreditPackage, IAIProvider, CreditPurchaseRequest } from '../types/studio';

class StudioService {
  async getBalance(orgId: string): Promise<number> {
    return aiCreditRepository.getBalance(orgId);
  }

  async getTransactions(orgId: string): Promise<AICreditTransaction[]> {
    return aiCreditRepository.getTransactions(orgId);
  }

  async getPackages(): Promise<AICreditPackage[]> {
    return aiCreditRepository.getPackages();
  }

  async requestCreditPurchase(params: {
    organizationId: string;
    organizationName?: string;
    userId: string;
    userName?: string;
    packageId: string;
    paymentMethod: string;
    receiptUrl?: string;
    receiptFileName?: string;
  }): Promise<CreditPurchaseRequest> {
    const packages = await this.getPackages();
    const pkg = packages.find(p => p.id === params.packageId);
    if (!pkg) throw new Error('Pacote selecionado não encontrado.');

    return aiCreditRepository.createPurchaseRequest({
      organizationId: params.organizationId,
      organizationName: params.organizationName || 'Organização',
      userId: params.userId,
      userName: params.userName || 'Utilizador',
      packageId: pkg.id,
      packageName: pkg.name,
      credits: pkg.credits,
      priceKz: pkg.priceKz,
      paymentMethod: params.paymentMethod,
      receiptUrl: params.receiptUrl,
      receiptFileName: params.receiptFileName,
    });
  }

  async getCreditPurchaseRequests(orgId?: string): Promise<CreditPurchaseRequest[]> {
    return aiCreditRepository.getPurchaseRequests(orgId);
  }

  async approveCreditPurchase(requestId: string, reviewerName: string = 'Administrador'): Promise<CreditPurchaseRequest> {
    return aiCreditRepository.approvePurchaseRequest(requestId, reviewerName);
  }

  async rejectCreditPurchase(requestId: string, reason?: string, reviewerName: string = 'Administrador'): Promise<CreditPurchaseRequest> {
    return aiCreditRepository.rejectPurchaseRequest(requestId, reason, reviewerName);
  }

  async deleteJob(jobId: string): Promise<boolean> {
    try {
      fetch(`/api/creative-ai/jobs/${jobId}`, { method: 'DELETE' }).catch(() => {});
    } catch {}
    return aiGenerationJobRepository.delete(jobId);
  }

  /**
   * @deprecated Não creditava nada de forma legítima: saltava a aprovação e as
   * verificações do servidor, que agora recusam `PURCHASE` vindo do cliente.
   *
   * O caminho correcto para creditar uma conta é:
   *   1. o utilizador submete um pedido com comprovativo →
   *      `requestCreditPurchase(...)`;
   *   2. o admin aprova no painel do Creative AI →
   *      `POST /api/ai-credits/admin/requests/:id/approve`.
   *
   * Mantido apenas para falhar de forma explícita e instrutiva em vez de
   * devolver um 403 opaco a quem o chamar.
   */
  async purchaseCredits(_orgId: string, _userId: string, _packageId: string): Promise<boolean> {
    throw new Error(
      'Creditar créditos directamente está desactivado: as recargas passam pelo pedido com comprovativo ' +
        'e pela aprovação do administrador no painel do Creative AI.'
    );
  }

  async getModels(): Promise<IAIProvider[]> {
    return AI_MODELS;
  }

  estimateCost(type: AIGenerationType, parameters: Record<string, any>): number {
    if (type === 'IMAGE') return 8; // base image
    if (type === 'VIDEO') {
      const duration = parseInt(parameters.duration || '5', 10);
      if (duration <= 5) return 20;
      if (duration <= 10) return 40;
      if (duration <= 15) return 60;
      return 100; // 30s
    }
    if (type === 'COPY') return 2;
    if (type === 'ADAPTATION') return 5;
    return 10;
  }

  async startCreativeAIGeneration(params: {
    organizationId: string;
    userId: string;
    styleId: string;
    aspectRatio: string;
    resolution?: string;
    objective?: string;
    additionalInstructions?: string;
    originalImageBase64Url?: string;
    /**
     * Modelo de imagem: 'gpt-image-2' (GPT Image 2) ou 'nano-banana-2-1'
     * (Nano Banana 2.1). O custo em créditos é decidido pelo SERVIDOR na grelha
     * modelo × estilo definida no painel de administração.
     */
    imageModel?: string;
  }): Promise<AIGenerationJob> {
    const modelo = params.imageModel || 'gpt-image-2';
    const cost = this.estimateCost('IMAGE', {
      aspectRatio: params.aspectRatio,
      style: params.styleId,
      resolution: params.resolution,
    });

    // ── Passo 1: o SERVIDOR verifica o saldo, debita e regista o job ─────────
    // Uma só operação atómica. Antes o débito era feito aqui no browser e o job
    // no servidor, pelo que uma falha a meio deixava créditos gastos sem job
    // (ou jobs sem créditos). `cost` é apenas uma estimativa local: se divergir
    // do custo real do servidor, é o valor devolvido que conta.
    const started = await aiCreditRepository.startGeneration({
      organizationId: params.organizationId,
      userId: params.userId,
      type: 'IMAGE',
      styleId: params.styleId,
      model: modelo,
      prompt: params.additionalInstructions || `Estilo ${params.styleId}`,
      aspectRatio: params.aspectRatio,
      resolution: params.resolution,
      cost,
    });

    const jobId = started.jobId;

    // ── Passo 2: arranca o motor de geração com O MESMO id ───────────────────
    try {
      const response = await fetch('/api/creative-ai/image/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          imageModel: modelo,
          // Custo real debitado: o motor regista-o no job (informativo).
          creditCost: started.costInCredits,
          jobId,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Erro ao iniciar geração no Creative AI Server');
      }

      return {
        id: jobId,
        organizationId: params.organizationId,
        userId: params.userId,
        type: 'IMAGE',
        prompt: params.additionalInstructions || `Estilo ${params.styleId}`,
        model: modelo,
        parameters: { ...params, resolution: params.resolution, imageModel: modelo },
        status: 'QUEUED',
        costInCredits: started.costInCredits,
        createdAt: new Date().toISOString(),
      };
    } catch (err: any) {
      // ── Passo 3: o motor falhou → fecha o job e DEVOLVE os créditos ────────
      // Já não há geração de substituição (mock) com imagens de stock: isso
      // mostrava um criativo falso e cobrava créditos por ele.
      console.error('❌ [studioService] Motor Creative AI indisponível:', err.message);
      await aiCreditRepository
        .completeGeneration(jobId, 'FAILED', undefined, err.message)
        .catch((refundErr) => {
          console.error('❌ [studioService] Falha ao estornar créditos:', refundErr);
        });

      throw new Error(
        `Não foi possível iniciar a geração: ${err.message}. Os créditos foram devolvidos.`
      );
    }
  }

  async startGeneration(
    orgId: string, 
    userId: string, 
    type: AIGenerationType, 
    prompt: string, 
    modelId: string, 
    parameters: Record<string, any>,
    campaignId?: string
  ): Promise<AIGenerationJob> {
    const cost = this.estimateCost(type, parameters);
    const balance = await this.getBalance(orgId);

    if (balance < cost) {
      throw new Error('Créditos insuficientes. Por favor, recarregue sua conta.');
    }

    // 1. Reserve credits
    await aiCreditRepository.addTransaction({
      organizationId: orgId,
      userId,
      type: 'USAGE',
      amount: cost,
      reason: `Reserva para geração de ${type}`,
      campaignId,
    });

    // 2. Create Job
    const job = await aiGenerationJobRepository.create({
      organizationId: orgId,
      userId,
      type,
      prompt,
      model: modelId,
      parameters,
      costInCredits: cost,
      campaignId,
    });

    // 3. Process Async
    this.processJob(job).catch(console.error);

    return job;
  }

  private async processJob(job: AIGenerationJob) {
    try {
      await aiGenerationJobRepository.updateStatus(job.id, 'PROCESSING');
      
      let outputUrl: string | undefined;
      
      if (job.type === 'IMAGE') {
        outputUrl = await mockAIProvider.generateImage(job.prompt, job.parameters);
      } else if (job.type === 'VIDEO') {
        outputUrl = await mockAIProvider.generateVideo(job.prompt, job.parameters);
      } else if (job.type === 'COPY') {
        const copyResults = await mockAIProvider.generateCopy(job.prompt, job.parameters);
        outputUrl = JSON.stringify(copyResults); // In real app, maybe structured
      }

      await aiGenerationJobRepository.updateStatus(job.id, 'COMPLETED', outputUrl);
    } catch (error: any) {
      // Refund on fail
      await aiCreditRepository.addTransaction({
        organizationId: job.organizationId,
        userId: job.userId,
        type: 'REFUND',
        amount: job.costInCredits,
        reason: `Reembolso por falha na geração ${job.id}`,
        generationId: job.id
      });
      await aiGenerationJobRepository.updateStatus(job.id, 'FAILED', undefined, error.message || 'Unknown error');
    }
  }

  /**
   * Estado de um job.
   *
   * Consulta SEMPRE o motor Creative AI primeiro e só depois o repositório
   * local. Antes a decisão era feita por `jobId.startsWith('job-creative')`, o
   * que era frágil: bastava o id deixar de ter esse prefixo (foi o que
   * aconteceu quando o livro-razão passou a emitir os ids) para o polling cair
   * no repositório local, nunca encontrar o job e a imagem nunca voltar ao chat
   * nem à galeria. Um 404 do motor cai naturalmente no repositório local, pelo
   * que ids de jobs locais continuam a funcionar.
   */
  async getJobStatus(jobId: string): Promise<AIGenerationJob | null> {
    try {
      const res = await fetch(`/api/creative-ai/jobs/${jobId}`);
      if (res.ok) {
        const creativeJob = await res.json();

        let mappedStatus: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'PROCESSING';
        if (creativeJob.status === 'queued') mappedStatus = 'QUEUED';
        else if (creativeJob.status === 'completed') mappedStatus = 'COMPLETED';
        else if (creativeJob.status === 'failed') mappedStatus = 'FAILED';

        return {
          id: creativeJob.jobId,
          organizationId: creativeJob.organizationId,
          userId: creativeJob.userId,
          type: 'IMAGE',
          prompt: creativeJob.generatedPrompt || creativeJob.additionalInstructions || '',
          model: 'gpt-image-2',
          parameters: {
            styleId: creativeJob.styleId,
            aspectRatio: creativeJob.aspectRatio,
            currentStepMessage: creativeJob.currentStepMessage,
            productAnalysis: creativeJob.productAnalysis,
            visualQuality: creativeJob.visualQuality,
            // Direcção criativa do agente: combinação anti-repetição, legenda e hashtags
            creativeCombination: creativeJob.creativeCombination,
            generatedTitle: creativeJob.generatedTitle,
            generatedSubtitle: creativeJob.generatedSubtitle,
            generatedCopy: creativeJob.generatedCopy,
            generatedHashtags: creativeJob.generatedHashtags,
          },
          status: mappedStatus,
          outputUrl: creativeJob.generatedImageUrl,
          resultUrl: creativeJob.generatedImageUrl,
          costInCredits: creativeJob.creditCost || 8,
          createdAt: creativeJob.createdAt,
          completedAt: creativeJob.completedAt,
          error: creativeJob.error
        };
      }
    } catch (e) {
      console.error('Error fetching creative ai job status:', e);
    }

    // Não encontrado no motor (job local, ou engine indisponível) → repositório local
    return aiGenerationJobRepository.getById(jobId);
  }

  async getRecentJobs(orgId: string, limit: number = 50): Promise<AIGenerationJob[]> {
    if (!orgId) return [];
    try {
      const res = await fetch(`/api/creative-ai/jobs?orgId=${encodeURIComponent(orgId)}&limit=${limit}`);
      if (res.ok) {
        const creativeJobs: any[] = await res.json();
        const mappedCreativeJobs: AIGenerationJob[] = (Array.isArray(creativeJobs) ? creativeJobs : [])
          .filter(cj => !cj.organizationId || cj.organizationId === orgId)
          .map(cj => {
            let mappedStatus: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' = 'PROCESSING';
            if (cj.status === 'queued') mappedStatus = 'QUEUED';
            else if (cj.status === 'completed') mappedStatus = 'COMPLETED';
            else if (cj.status === 'failed') mappedStatus = 'FAILED';

            const rawType = String(cj.type || '').toUpperCase();
            const ehVideo = rawType === 'VIDEO';
            const ehStoryboard = rawType === 'STORYBOARD';

            return {
              id: cj.jobId || cj.id,
              organizationId: cj.organizationId || orgId,
              userId: cj.userId,
              type: ehStoryboard ? 'STORYBOARD' : ehVideo ? 'VIDEO' : 'IMAGE',
              prompt: cj.generatedPrompt || cj.prompt || cj.additionalInstructions || `Estilo ${cj.styleId}`,
              model: ehStoryboard ? 'Kie.ai Storyboard (GPT Image)' : ehVideo ? 'google/gemini-omni-flash-1-1' : 'gpt-image-2',
              parameters: {
                styleId: cj.styleId,
                aspectRatio: cj.aspectRatio,
                resolution: cj.resolution,
                durationSeconds: cj.durationSeconds,
                currentStepMessage: cj.currentStepMessage,
                storyboardData: cj.storyboardData,
              },
              status: mappedStatus,
              outputUrl: cj.videoUrl || cj.outputUrl || cj.generatedImageUrl,
              resultUrl: cj.videoUrl || cj.outputUrl || cj.generatedImageUrl,
              costInCredits: cj.creditCost || 8,
              createdAt: cj.createdAt,
              completedAt: cj.completedAt,
              error: cj.error
            };
          });

        const localJobs = await aiGenerationJobRepository.getRecentJobs(orgId, limit);
        const map = new Map<string, AIGenerationJob>();
        for (const j of localJobs) {
          if (!j.organizationId || j.organizationId === orgId) map.set(j.id, j);
        }
        for (const j of mappedCreativeJobs) {
          if (!j.organizationId || j.organizationId === orgId) map.set(j.id, j);
        }

        return Array.from(map.values())
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }
    } catch (e) {
      console.warn('⚠️ [studioService] Erro ao carregar jobs do backend, usando repositório local:', e);
    }
    return aiGenerationJobRepository.getRecentJobs(orgId, limit);
  }
}

export const studioService = new StudioService();
