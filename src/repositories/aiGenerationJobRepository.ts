import { AIGenerationJob, AIJobStatus } from '../types/studio';

class AIGenerationJobRepository {
  private jobs: AIGenerationJob[] = [];
  private readonly storageKey = 'nexora_ai_generation_jobs';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(this.storageKey);
        if (saved) {
          this.jobs = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to load jobs from localStorage:', e);
      }
    }
  }

  private saveToStorage() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(this.storageKey, JSON.stringify(this.jobs));
      } catch (e) {
        console.warn('Failed to save jobs to localStorage:', e);
      }
    }
  }

  async create(job: Partial<AIGenerationJob> & { organizationId: string; userId: string; type: any; prompt: string; model: string; parameters: any; costInCredits: number; }): Promise<AIGenerationJob> {
    const newJob: AIGenerationJob = {
      ...job,
      id: job.id || `job-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
      status: job.status || 'QUEUED',
      createdAt: job.createdAt || new Date().toISOString(),
    };
    const existingIdx = this.jobs.findIndex(j => j.id === newJob.id);
    if (existingIdx >= 0) {
      this.jobs[existingIdx] = { ...this.jobs[existingIdx], ...newJob };
    } else {
      this.jobs.unshift(newJob);
    }
    this.saveToStorage();
    return newJob;
  }

  async updateStatus(id: string, status: AIJobStatus, outputUrl?: string, error?: string): Promise<AIGenerationJob> {
    const jobIndex = this.jobs.findIndex(j => j.id === id);
    if (jobIndex === -1) throw new Error('Job not found');

    const job = this.jobs[jobIndex];
    job.status = status;
    
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      job.completedAt = new Date().toISOString();
    }
    
    if (outputUrl) {
      job.outputUrl = outputUrl;
      job.resultUrl = outputUrl;
    }
    if (error) job.error = error;

    this.saveToStorage();
    return job;
  }

  async getById(id: string): Promise<AIGenerationJob | null> {
    return this.jobs.find(j => j.id === id) || null;
  }

  async getByOrganization(orgId: string): Promise<AIGenerationJob[]> {
    if (!orgId) return [];
    this.loadFromStorage();
    return this.jobs.filter(j => j.organizationId && j.organizationId === orgId).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async getRecentJobs(orgId: string, limit: number = 5): Promise<AIGenerationJob[]> {
    if (!orgId) return [];
    return (await this.getByOrganization(orgId)).slice(0, limit);
  }

  async delete(id: string): Promise<boolean> {
    this.loadFromStorage();
    const initialLen = this.jobs.length;
    this.jobs = this.jobs.filter(j => j.id !== id);
    if (this.jobs.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }
}

export const aiGenerationJobRepository = new AIGenerationJobRepository();
