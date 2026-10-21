import { DeviceCommandType } from '../types/devices';

export interface IPlayerGateway {
  registerDevice(deviceCode: string): Promise<boolean>;
  pairDevice(pairingCode: string): Promise<boolean>;
  sendCommand(deviceId: string, command: DeviceCommandType): Promise<boolean>;
  requestConfiguration(deviceId: string): Promise<any>;
  sendHeartbeat(deviceId: string, payload: any): Promise<boolean>;
  sendTelemetry(deviceId: string, payload: any): Promise<boolean>;
  reportPlayback(deviceId: string, contentId: string): Promise<void>;
  reportError(deviceId: string, error: any): Promise<void>;
  acknowledgeCommand(deviceId: string, commandId: string): Promise<void>;
}

export class MockPlayerGateway implements IPlayerGateway {
  async registerDevice(deviceCode: string): Promise<boolean> {
    console.log(`[MockPlayerGateway] Registering device: ${deviceCode}`);
    return true;
  }

  async pairDevice(pairingCode: string): Promise<boolean> {
    console.log(`[MockPlayerGateway] Pairing with code: ${pairingCode}`);
    return true;
  }

  async sendCommand(deviceId: string, command: DeviceCommandType): Promise<boolean> {
    console.log(`[MockPlayerGateway] Sending command ${command} to device ${deviceId}`);
    return true;
  }

  async requestConfiguration(deviceId: string): Promise<any> {
    return {
      heartbeatInterval: 30,
      autoStart: true
    };
  }

  async sendHeartbeat(deviceId: string, payload: any): Promise<boolean> {
    return true;
  }

  async sendTelemetry(deviceId: string, payload: any): Promise<boolean> {
    return true;
  }

  async reportPlayback(deviceId: string, contentId: string): Promise<void> {}

  async reportError(deviceId: string, error: any): Promise<void> {}

  async acknowledgeCommand(deviceId: string, commandId: string): Promise<void> {}
}

export const playerGateway = new MockPlayerGateway();

export interface IRealtimeGateway {
  subscribeToDevice(deviceId: string, callback: (event: any) => void): void;
  unsubscribeFromDevice(deviceId: string): void;
  subscribeToAlerts(orgId: string, callback: (alert: any) => void): void;
  subscribeToTelemetry(deviceId: string, callback: (telemetry: any) => void): void;
}

export class MockRealtimeGateway implements IRealtimeGateway {
  subscribeToDevice(deviceId: string, callback: (event: any) => void): void {
    console.log(`[MockRealtimeGateway] Subscribed to device ${deviceId}`);
  }
  unsubscribeFromDevice(deviceId: string): void {}
  subscribeToAlerts(orgId: string, callback: (alert: any) => void): void {}
  subscribeToTelemetry(deviceId: string, callback: (telemetry: any) => void): void {}
}

export const realtimeGateway = new MockRealtimeGateway();
