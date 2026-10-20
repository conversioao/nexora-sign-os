import { Device, DeviceStatus, ConnectionStatus, DeviceCommand, DeviceTelemetry, DeviceHealth, PlayerConfiguration, PlayerRelease, DeviceGroup } from '../types/devices';
import { mockDevices, mockDeviceHealthData, mockPlayerReleases } from '../data/mockDeviceData';

export interface IDeviceRepository {
  getDevices(): Promise<Device[]>;
  getDeviceById(id: string): Promise<Device | undefined>;
  getDevicesByOrganization(orgId: string): Promise<Device[]>;
  updateDeviceStatus(id: string, status: DeviceStatus, connectionStatus: ConnectionStatus): Promise<void>;
  updateDeviceTelemetry(id: string, telemetry: Partial<Device>): Promise<void>;
}

class MockDeviceRepository implements IDeviceRepository {
  async getDevices(): Promise<Device[]> {
    try {
      const res = await fetch('/api/displays');
      if (res.ok) {
        const displays = await res.json();
        return displays.map((d: any) => {
          let specs: any = {};
          try { specs = typeof d.specs === 'string' ? JSON.parse(d.specs) : (d.specs || {}); } catch {}
          return {
            id: d.id,
            deviceCode: d.device_code || d.code || d.name || `NX-${d.id.substring(0, 5).toUpperCase()}`,
            displayId: d.id,
            manufacturer: specs.platform || 'Android TV Box',
            model: d.name || 'Nexora TV Player',
            serialNumber: specs.deviceId || `SN-${d.id.substring(0, 8).toUpperCase()}`,
            deviceType: (d.type || 'ANDROID_TV') as any,
            status: (d.status === 'ONLINE' ? 'ACTIVE' : d.status === 'MAINTENANCE' ? 'MAINTENANCE' : 'INACTIVE') as DeviceStatus,
            connectionStatus: (d.status === 'ONLINE' ? 'CONNECTED' : 'DISCONNECTED') as ConnectionStatus,
            playerVersion: specs.appVersion || '2.4.0',
            ipAddress: d.ip_address || specs.ip || '192.168.100.162',
            macAddress: specs.macAddress || 'B8:27:EB:14:8F:22',
            organizationId: d.organization_id || 'org-nexora',
            lastHeartbeatAt: d.last_heartbeat_at || new Date().toISOString(),
            registeredAt: d.created_at || new Date().toISOString(),
            updatedAt: d.last_heartbeat_at || new Date().toISOString(),
            assignedLocation: d.location || 'Luanda Centro',
            cpuUsage: Math.floor(15 + Math.random() * 25),
            memoryUsed: specs.memory?.used ? parseFloat(specs.memory.used) : 1.2,
            memoryTotal: specs.memory?.total ? parseFloat(specs.memory.total) : 2.0,
            storageUsed: specs.storage?.used ? parseFloat(specs.storage.used) : 14.2,
            storageTotal: specs.storage?.total ? parseFloat(specs.storage.total) : 32.0,
            temperature: specs.temperature ? parseFloat(specs.temperature) : 38.5,
          };
        });
      }
    } catch (e) {
      console.warn('Failed to fetch real devices from API, falling back', e);
    }
    return [];
  }

  async getDeviceById(id: string): Promise<Device | undefined> {
    const devices = await this.getDevices();
    return devices.find(d => d.id === id || d.deviceCode === id || d.displayId === id);
  }

  async getDevicesByOrganization(orgId: string): Promise<Device[]> {
    const devices = await this.getDevices();
    return devices.filter(d => d.organizationId === orgId);
  }

  async updateDeviceStatus(id: string, status: DeviceStatus, connectionStatus: ConnectionStatus): Promise<void> {
    // No-op or API call
  }

  async updateDeviceTelemetry(id: string, data: Partial<Device>): Promise<void> {
    // No-op or API call
  }
}

export const deviceRepository = new MockDeviceRepository();

export interface IDeviceHealthRepository {
  getHealthByDeviceId(deviceId: string): Promise<DeviceHealth | undefined>;
}

class MockDeviceHealthRepository implements IDeviceHealthRepository {
  async getHealthByDeviceId(deviceId: string): Promise<DeviceHealth | undefined> {
    return mockDeviceHealthData[deviceId];
  }
}

export const deviceHealthRepository = new MockDeviceHealthRepository();

export interface IPlayerReleaseRepository {
  getReleases(): Promise<PlayerRelease[]>;
}

class MockPlayerReleaseRepository implements IPlayerReleaseRepository {
  async getReleases(): Promise<PlayerRelease[]> {
    return mockPlayerReleases;
  }
}

export const playerReleaseRepository = new MockPlayerReleaseRepository();
