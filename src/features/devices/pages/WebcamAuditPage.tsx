import React, { useState, useEffect, useRef } from "react";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Card } from "../../../components/ui/Card";
import { Camera, Eye, Users, RefreshCw, CheckCircle2, Clock, Monitor } from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface AuditSnapshot {
  id: string;
  displayId: string;
  adTitle: string;
  snapshotBase64: string;
  viewerCount: number;
  timestamp: string;
  verified: boolean;
}

export const WebcamAuditPage: React.FC = () => {
  const [snapshots, setSnapshots] = useState<AuditSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalViewers, setTotalViewers] = useState(0);
  const [selectedSnap, setSelectedSnap] = useState<AuditSnapshot | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const loadSnapshots = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit/snapshots?limit=100");
      const data = await res.json();
      setSnapshots(data.snapshots || []);
      const total = (data.snapshots || []).reduce((acc: number, s: AuditSnapshot) => acc + (s.viewerCount || 0), 0);
      setTotalViewers(total);
    } catch {
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  // Poll every 15s for new snapshots
  useEffect(() => {
    loadSnapshots();
    const interval = setInterval(loadSnapshots, 15000);
    return () => clearInterval(interval);
  }, []);

  const displayGroups = snapshots.reduce<Record<string, AuditSnapshot[]>>((acc, snap) => {
    if (!acc[snap.displayId]) acc[snap.displayId] = [];
    acc[snap.displayId].push(snap);
    return acc;
  }, {});

  const uniqueDisplays = Object.keys(displayGroups).length;
  const verifiedCount = snapshots.filter(s => s.verified).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria de Anuncios — Webcam Monitor"
        description="Comprovantes de exibicao (Proof-of-Play) capturados pelas webcams USB nas TV Boxes em campo."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Camera className="w-4 h-4 text-cyan-400" /><span className="text-xs text-slate-400">Snapshots</span></div>
          <p className="text-2xl font-bold text-white font-mono">{loading ? "..." : snapshots.length}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Monitor className="w-4 h-4 text-purple-400" /><span className="text-xs text-slate-400">Displays Ativos</span></div>
          <p className="text-2xl font-bold text-white font-mono">{loading ? "..." : uniqueDisplays}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-emerald-400" /><span className="text-xs text-slate-400">Total Impressoes</span></div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{loading ? "..." : totalViewers}</p>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span className="text-xs text-slate-400">Verificados</span></div>
          <p className="text-2xl font-bold text-emerald-400 font-mono">{loading ? "..." : verifiedCount}</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Galeria de Comprovantes de Exibicao</h3>
        <Button variant="secondary" onClick={loadSnapshots} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-cyan-400" />
          <p>Carregando snapshots de auditoria...</p>
        </div>
      ) : snapshots.length === 0 ? (
        <Card className="p-12 text-center border-slate-800">
          <Camera className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Sem comprovantes ainda</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Ative a Webcam na pagina "Player Simulator" para que a TV Box comece a enviar snapshots de auditoria para este painel.
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(displayGroups).map(([dispId, snaps]: [string, AuditSnapshot[]]) => (
            <div key={dispId}>
              <div className="flex items-center gap-3 mb-4">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-semibold text-white">Display: <span className="font-mono text-cyan-400">{dispId}</span></h4>
                <span className="text-xs text-slate-500">{snaps.length} snapshots</span>
                <span className="text-xs text-emerald-400 ml-auto flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {snaps.reduce((a, s) => a + s.viewerCount, 0)} espectadores
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {snaps.map((snap) => (
                  <button
                    key={snap.id}
                    onClick={() => setSelectedSnap(snap)}
                    className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden hover:border-cyan-500/50 transition-colors group text-left"
                  >
                    <div className="aspect-video bg-slate-900 relative overflow-hidden">
                      {snap.snapshotBase64 ? (
                        <img src={snap.snapshotBase64} alt="Audit Snapshot" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" style={{ transform: "scaleX(-1)" }} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Camera className="w-6 h-6 text-slate-700" /></div>
                      )}
                      <div className="absolute bottom-1 right-1 bg-black/80 text-[9px] px-1.5 py-0.5 rounded font-mono text-emerald-400 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />{snap.viewerCount}
                      </div>
                      {snap.verified && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow shadow-emerald-500/50" />}
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-medium text-slate-300 truncate">{snap.adTitle}</p>
                      <p className="text-[9px] font-mono text-slate-600 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(snap.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedSnap && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedSnap(null)}
        >
          <div className="bg-slate-900 rounded-2xl border border-slate-700 max-w-2xl w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">{selectedSnap.adTitle}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">Display: {selectedSnap.displayId} · {new Date(selectedSnap.timestamp).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-emerald-400">
                <Users className="w-4 h-4" /> {selectedSnap.viewerCount} espectadores
              </div>
            </div>
            {selectedSnap.snapshotBase64 ? (
              <img src={selectedSnap.snapshotBase64} alt="Snapshot detalhado" className="w-full aspect-video object-cover" style={{ transform: "scaleX(-1)" }} />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-slate-950 text-slate-600"><Camera className="w-16 h-16" /></div>
            )}
            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Comprovante Verificado</div>
              <button onClick={() => setSelectedSnap(null)} className="text-xs text-slate-400 hover:text-white px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

