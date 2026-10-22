import { useState, useEffect } from 'react';
import { Device } from '../../../types/devices';
import { deviceService } from '../../../services/deviceService';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setIsLoading(true);
    try {
      const data = await deviceService.getDevices();
      setDevices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    devices,
    isLoading,
    refresh: loadDevices
  };
}

export function useDevice(id: string | null) {
  const [device, setDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!id) {
      setDevice(null);
      return;
    }
    loadDevice(id);
  }, [id]);

  const loadDevice = async (deviceId: string) => {
    setIsLoading(true);
    try {
      const data = await deviceService.getDeviceById(deviceId);
      setDevice(data || null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    device,
    isLoading,
    refresh: () => id && loadDevice(id)
  };
}
