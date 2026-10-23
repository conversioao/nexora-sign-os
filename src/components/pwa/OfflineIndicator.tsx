import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-[999] bg-emerald-500/90 text-slate-950 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
        <Wifi className="w-3.5 h-3.5" />
        <span>Conexão restabelecida</span>
      </div>
    );
  }

  return (
    <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-[999] bg-amber-500/90 text-slate-950 px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Modo Offline — A carregar dados do cache</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="ml-1 p-0.5 rounded hover:bg-black/10 transition-colors cursor-pointer"
        title="Recarregar"
      >
        <RefreshCw className="w-3 h-3" />
      </button>
    </div>
  );
};
