import React, { useState } from 'react';
import { DisplayLocation } from '../../../types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { MapPin, Navigation, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';

interface DisplayMockMapProps {
  location: DisplayLocation;
  displayName: string;
  displayCode: string;
}

export const DisplayMockMap: React.FC<DisplayMockMapProps> = ({
  location,
  displayName,
  displayCode,
}) => {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const safeLocation = location || {
    municipality: 'Talatona',
    venueName: 'Loja Luanda',
    coordinates: { lat: -8.8383, lng: 13.2344 },
    province: 'Luanda',
    zone: 'Geral',
    address: 'Luanda Centro',
  };

  const coords = safeLocation.coordinates || { lat: -8.8383, lng: 13.2344 };
  const coordString = `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(coordString);
    setCopied(true);
    showToast({
      type: 'info',
      title: 'Coordenadas Copiadas',
      message: `GPS: ${coordString} copiado para a área de transferência.`,
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="overflow-hidden border-white/10">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4]">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <CardTitle>Geolocalização & Ponto Físico</CardTitle>
              <CardDescription>
                Luanda • {safeLocation.municipality} • {safeLocation.venueName}
              </CardDescription>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCoords}
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
          >
            {copied ? 'Copiado' : 'Copiar GPS'}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Mock Map Canvas Representation */}
        <div className="relative w-full h-52 rounded-xl bg-[#070B14] border border-white/10 overflow-hidden flex items-center justify-center p-4">
          {/* Subtle Grid Pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Map Vector Lines representing Luanda roads */}
          <svg className="absolute inset-0 w-full h-full opacity-25" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M-50,180 Q150,90 300,120 T650,40"
              fill="none"
              stroke="#06B6D4"
              strokeWidth="2"
              strokeDasharray="6,6"
            />
            <path
              d="M100,-20 Q180,120 280,240"
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
            />
            <path
              d="M320,-10 Q340,110 520,230"
              fill="none"
              stroke="#64748B"
              strokeWidth="1.5"
            />
          </svg>

          {/* Ocean/Coast subtle shape */}
          <div className="absolute top-0 right-0 w-48 h-full bg-[#0284C7]/5 border-l border-[#0284C7]/15 rounded-l-full pointer-events-none flex items-center justify-center">
            <span className="text-[10px] font-mono tracking-widest text-[#0284C7]/40 uppercase rotate-90">
              Oceano Atlântico / Baía de Luanda
            </span>
          </div>

          {/* Radar Radar Ripple Pulse */}
          <div className="absolute flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-[#06B6D4]/20 animate-ping" />
          </div>
          <div className="absolute flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-[#06B6D4]/40" />
          </div>

          {/* Center Pin Marker */}
          <div className="relative z-10 flex flex-col items-center group">
            <div className="flex items-center gap-1.5 bg-[#0F172A] border border-[#06B6D4] px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="font-mono text-xs font-bold text-white">{displayCode}</span>
            </div>
            <div className="w-0.5 h-3 bg-[#06B6D4]" />
            <div className="w-2 h-2 rounded-full bg-[#06B6D4]" />
          </div>

          {/* Map Overlay Badge */}
          <div className="absolute bottom-2 left-2 bg-[#0B1120]/90 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md text-[11px] text-[#94A3B8] font-mono flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-[#06B6D4]" />
            <span>GPS: {coordString}</span>
          </div>

          <div className="absolute top-2 right-2 bg-[#0B1120]/90 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-md text-[10px] text-[#38BDF8] font-semibold">
            Luanda Node Central
          </div>
        </div>

        {/* Location Details Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-[#0B1120] p-3 rounded-lg border border-white/5 space-y-1">
            <span className="text-[#94A3B8] font-medium block">Endereço Cadastrado:</span>
            <p className="text-white font-medium">
              {location.address || `${location.venueName}, ${location.municipality}, Província de Luanda`}
            </p>
          </div>

          <div className="bg-[#0B1120] p-3 rounded-lg border border-white/5 space-y-1">
            <span className="text-[#94A3B8] font-medium block">Zona de Exposição:</span>
            <p className="text-white font-medium">{location.zone}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
