import { Device, DeviceStatus, ConnectionStatus, DeviceCommandType, DeviceDiagnostic } from '../types/devices';
import { deviceRepository, deviceHealthRepository } from '../repositories/deviceRepository';
import { playerGateway } from '../gateways/playerGateway';

class DeviceService {
  async getDevices(): Promise<Device[]> {
    return deviceRepository.getDevices();
  }

  async getDeviceById(id: string): Promise<Device | undefined> {
    return deviceRepository.getDeviceById(id);
  }

  async getDevicesByOrganization(orgId: string): Promise<Device[]> {
    return deviceRepository.getDevicesByOrganization(orgId);
  }

  async sendCommand(deviceId: string, command: DeviceCommandType): Promise<boolean> {
    return playerGateway.sendCommand(deviceId, command);
  }

  async runDiagnostic(deviceId: string): Promise<DeviceDiagnostic> {
    const health = await deviceHealthRepository.getHealthByDeviceId(deviceId);
    const ts = new Date().toISOString();
    
    // Convert health to pass/fail/warning
    const toResult = (h?: string) => h === 'HEALTHY' ? 'PASS' : (h === 'WARNING' ? 'WARNING' : 'FAIL');

    return {
      deviceId,
      timestamp: ts,
      network: toResult(health?.networkHealth),
      storage: toResult(health?.storageHealth),
      memory: toResult(health?.memoryHealth),
      cpu: toResult(health?.cpuHealth),
      temperature: toResult(health?.temperatureHealth),
      player: toResult(health?.playerHealth),
      contentSync: 'PASS', // mock
      overallResult: toResult(health?.overallStatus),
    };
  }
}

export const deviceService = new DeviceService();

class HeartbeatService {
  private thresholdSeconds = 60; // configurable

  calculateDeviceHealth(lastHeartbeat?: string): { status: DeviceStatus, connection: ConnectionStatus, isOffline: boolean } {
    if (!lastHeartbeat) {
      return { status: 'UNREGISTERED', connection: 'UNKNOWN', isOffline: true };
    }

    const diff = (Date.now() - new Date(lastHeartbeat).getTime()) / 1000;
    
    if (diff <= this.thresholdSeconds) {
      return { status: 'ONLINE', connection: 'CONNECTED', isOffline: false };
    } else if (diff <= this.thresholdSeconds * 3) {
      return { status: 'WARNING', connection: 'UNSTABLE', isOffline: false };
    } else {
      return { status: 'OFFLINE', connection: 'DISCONNECTED', isOffline: true };
    }
  }

  getOfflineDuration(lastHeartbeat?: string): number {
    if (!lastHeartbeat) return 0;
    return (Date.now() - new Date(lastHeartbeat).getTime()) / 1000;
  }
}

export const heartbeatService = new HeartbeatService();

class PlayerConfigurationService {
  async getConfiguration(deviceId: string) {
    return playerGateway.requestConfiguration(deviceId);
  }
}

export const playerConfigurationService = new PlayerConfigurationService();
