export type DeviceType = 
  | 'ANDROID_TV'
  | 'TV_BOX'
  | 'ANDROID_STICK'
  | 'ANDROID_TOTEM'
  | 'DEDICATED_PLAYER'
  | 'OTHER';

export type DeviceStatus = 
  | 'ONLINE'
  | 'OFFLINE'
  | 'WARNING'
  | 'ERROR'
  | 'MAINTENANCE'
  | 'UNREGISTERED'
  | 'PROVISIONING'
  | 'DECOMMISSIONED';

export type ConnectionStatus = 
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'UNSTABLE'
  | 'UNKNOWN';

export interface Device {
  id: string;
  organizationId: string;
  displayId?: string; // Optional if not yet assigned to a display
  deviceCode: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
  deviceType: DeviceType;
  androidVersion: string;
  playerVersion: string;
  firmwareVersion: string;
  macAddress: string;
  ipAddress: string;
  storageTotal: number; // in bytes or GB
  storageUsed: number;
  memoryTotal: number;
  memoryUsed: number;
  cpuUsage: number; // percentage
  temperature: number; // Celsius
  lastHeartbeatAt?: string;
  lastSyncAt?: string;
  status: DeviceStatus;
  connectionStatus: ConnectionStatus;
  createdAt: string;
  updatedAt: string;
}

export type PlayerOrientation = 'LANDSCAPE' | 'PORTRAIT' | 'AUTO';

export interface PlayerInstallation {
  id: string;
  deviceId: string;
  displayId?: string;
  organizationId: string;
  playerVersion: string;
  installedAt: string;
  lastStartedAt?: string;
  lastStoppedAt?: string;
  autoStartEnabled: boolean;
  kioskModeEnabled: boolean;
  orientation: PlayerOrientation;
  language: string;
  timezone: string;
  status: string; // STARTING, RUNNING, PAUSED, etc.
}

export type PlayerSessionStatus = 'ACTIVE' | 'ENDED' | 'ABNORMAL';

export interface PlayerSession {
  id: string;
  deviceId: string;
  startedAt: string;
  endedAt?: string;
  lastActivityAt: string;
  ipAddress: string;
  playerVersion: string;
  status: PlayerSessionStatus;
}

export interface Heartbeat {
  id: string;
  deviceId: string;
  timestamp: string;
  status: DeviceStatus;
  uptimeSeconds: number;
  networkLatencyMs: number;
  playerStatus: string;
  currentContentId?: string;
  currentPlaylistId?: string;
}

export type HealthState = 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';

export interface DeviceHealth {
  deviceId: string;
  overallStatus: HealthState;
  networkHealth: HealthState;
  storageHealth: HealthState;
  memoryHealth: HealthState;
  cpuHealth: HealthState;
  temperatureHealth: HealthState;
  playerHealth: HealthState;
  lastCheckedAt: string;
}

export type NetworkType = 'WIFI' | 'ETHERNET' | 'MOBILE' | 'UNKNOWN';

export interface DeviceTelemetry {
  id: string;
  deviceId: string;
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  storageUsed: number;
  storageTotal: number;
  temperature: number;
  networkLatency: number;
  networkType: NetworkType;
  signalStrength: number; // e.g. dBm or percentage
  uptime: number; // in seconds
  appMemory: number;
  playerProcessStatus: string;
}

export type DeviceCommandType = 
  | 'RESTART_PLAYER'
  | 'REBOOT_DEVICE'
  | 'SYNC_CONTENT'
  | 'SYNC_PLAYLIST'
  | 'REFRESH_SCHEDULE'
  | 'CLEAR_CACHE'
  | 'CAPTURE_SCREENSHOT'
  | 'RUN_DIAGNOSTIC'
  | 'UPDATE_PLAYER';

export type DeviceCommandStatus = 
  | 'PENDING'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'TIMEOUT';

export interface DeviceCommand {
  id: string;
  deviceId: string;
  commandType: DeviceCommandType;
  status: DeviceCommandStatus;
  createdAt: string;
  executedAt?: string;
  requestedBy: string; // userId
  result?: string;
}

export interface DeviceCommandEvent {
  timestamp: string;
  device: string; // device id or name
  user: string; // user id or name
  command: DeviceCommandType;
  result: string;
}

export type PairingCodeStatus = 'PENDING' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface PairingCode {
  code: string;
  deviceId?: string;
  createdAt: string;
  expiresAt: string;
  status: PairingCodeStatus;
}

export interface DeviceScreenshot {
  id: string;
  deviceId: string;
  imageUrl: string;
  capturedAt: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export type DiagnosticResult = 'PASS' | 'WARNING' | 'FAIL';

export interface DeviceDiagnostic {
  deviceId: string;
  timestamp: string;
  network: DiagnosticResult;
  storage: DiagnosticResult;
  memory: DiagnosticResult;
  cpu: DiagnosticResult;
  temperature: DiagnosticResult;
  player: DiagnosticResult;
  contentSync: DiagnosticResult;
  overallResult: DiagnosticResult;
}

export type PlayerReleaseStatus = 'DRAFT' | 'AVAILABLE' | 'MANDATORY' | 'DEPRECATED';

export interface PlayerRelease {
  id: string;
  version: string;
  releaseNotes: string;
  minimumAndroidVersion: string;
  fileSize: number; // in bytes
  releaseDate: string;
  status: PlayerReleaseStatus;
}

export interface DeviceGroup {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  deviceIds: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface PlayerConfiguration {
  deviceId: string;
  displayId?: string;
  organizationId: string;
  orientation: PlayerOrientation;
  timezone: string;
  autoStart: boolean;
  kioskMode: boolean;
  defaultVolume: number;
  allowRemoteControl: boolean;
  heartbeatInterval: number; // in seconds
  contentSyncInterval: number; // in seconds
  scheduleSyncInterval: number; // in seconds
  playerUpdateChannel: 'STABLE' | 'BETA';
}
