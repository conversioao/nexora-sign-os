import { planRepository, IPlanRepository } from '../repositories/planRepository';
import { Plan, PlanFilters, PlanKPIs, PlanFeatures, PlanStatus } from '../types/saas';

export class PlanService {
  constructor(private readonly repo: IPlanRepository = planRepository) {}

  async getPlans(filters?: PlanFilters): Promise<Plan[]> {
    return this.repo.getAll(filters);
  }

  async getActivePlans(): Promise<Plan[]> {
    return this.repo.getActive();
  }

  async getPlanById(id: string): Promise<Plan | null> {
    return this.repo.getById(id);
  }

  async getPlanByCode(code: string): Promise<Plan | null> {
    return this.repo.getByCode(code);
  }

  async getPlanFeatures(id: string): Promise<PlanFeatures | null> {
    const plan = await this.getPlanById(id);
    return plan ? plan.features : null;
  }

  async getKPIs(): Promise<PlanKPIs> {
    return this.repo.getKPIs();
  }

  async createPlan(data: Partial<Plan>): Promise<Plan> {
    return this.repo.create(data);
  }

  async updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
    return this.repo.update(id, data);
  }

  async updatePlanStatus(id: string, status: PlanStatus): Promise<Plan> {
    return this.repo.updateStatus(id, status);
  }

  async deletePlan(id: string): Promise<{ success: boolean }> {
    return this.repo.delete(id);
  }
}

export const planService = new PlanService();
