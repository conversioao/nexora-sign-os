import { ContractEvent, ContractEventType } from '../types/contracts';
import { mockContractEvents } from '../data/mockContractData';

export interface IContractEventRepository {
  getByContractId(contractId: string): Promise<ContractEvent[]>;
  logEvent(
    contractId: string,
    eventType: ContractEventType,
    description: string,
    actorName: string,
    actorId?: string,
    metadata?: Record<string, any>
  ): Promise<ContractEvent>;
}

export class MockContractEventRepository implements IContractEventRepository {
  private events: ContractEvent[] = [...mockContractEvents];

  async getByContractId(contractId: string): Promise<ContractEvent[]> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    return this.events
      .filter((e) => e.contractId === contractId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async logEvent(
    contractId: string,
    eventType: ContractEventType,
    description: string,
    actorName: string,
    actorId?: string,
    metadata?: Record<string, any>
  ): Promise<ContractEvent> {
    await new Promise((resolve) => setTimeout(resolve, 20));
    const newEvent: ContractEvent = {
      id: `evt-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`,
      contractId,
      eventType,
      actorId,
      actorName: actorName || 'Sistema',
      timestamp: new Date().toISOString(),
      description,
      metadata,
    };

    this.events.unshift(newEvent);
    return { ...newEvent };
  }
}

export const contractEventRepository = new MockContractEventRepository();
