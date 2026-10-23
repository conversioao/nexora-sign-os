import React, { useState, useEffect, useRef, useCallback } from "react";
import { PageHeader } from "../../../components/layout/PageHeader";
import { Card } from "../../../components/ui/Card";
import {
  Activity, PowerOff, ShieldAlert, Cpu, Zap,
  Play, Pause, SkipForward,
  Camera, CameraOff, Eye, Users, CheckCircle2,
  RefreshCw, Smartphone, Upload
} from "lucide-react";
import { useDevices } from "../hooks/useDevices";
import { Button } from "../../../components/ui/Button";

const MOCK_CONTENT = [
  { id: "1", type: "image", url: "https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=1920", duration: 5000, title: "Campanha Fotografia Pro" },
  { id: "2", type: "image", url: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1920", duration: 5000, title: "Institucional Nexora Business" },
  { id: "3", type: "image", url: "https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&q=80&w=1920", duration: 5000, title: "Promocao Especial Outono" }
];

interface ProofSnapshot {
  id: string;
  timestamp: string;
  adTitle: string;
  viewerCount: number;
  snapshotDataUrl: string;
  sent: boolean;
}

export const PlayerSimulatorPage: React.FC = () => {
  const { devices } = useDevices();
  const device = devices[0];
  const displayId = device?.id || "local-tvbox";

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([
    "[MockRealtimeGateway] Subscribed to device...",
    "[MockPlayerGateway] Player initialized.",
  ]);
  const [telemetry, setTelemetry] = useState({ cpu: 32, temp: 45, status: "ONLINE", connection: "STABLE" });
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const [showPip, setShowPip] = useState(true);
  const [isSendingSnapshot, setIsSendingSnapshot] = useState(false);
  const [detectedViewers, setDetectedViewers] = useState(0);
  const [totalAudienceCount, setTotalAudienceCount] = useState(0);
  const [proofs, setProofs] = useState<ProofSnapshot[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = useCallback((msg: string, type: "info" | "warn" | "cam" | "audit" = "info") => {
    const prefix = type === "cam" ? "[Webcam]" : type === "audit" ? "[Audit PoP]" : type === "warn" ? "[ALERTA]" : "[Player]";
    const entry = `[${new Date().toLocaleTimeString()}] ${prefix} ${msg}`;
    setLogs(prev => [entry, ...prev].slice(0, 12));
  }, []);

  const startWebcam = async () => {
    setWebcamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      setWebcamActive(true);
      setWebcamEnabled(true);
      addLog("Camera USB conectada via MediaCapture API.", "cam");
    } catch (err: any) {
      setWebcamActive(false);
      setWebcamEnabled(true);
      const msg = err?.name === "NotAllowedError" ? "Permissao negada. Autorize a camera no browser."
        : err?.name === "NotFoundError" ? "Nenhuma camera encontrada. Confirme que a webcam USB esta ligada a TV Box."
        : `Erro: ${err?.message}`;
      setWebcamError(msg);
      addLog(`ERRO camera: ${msg} Modo simulado ativo.`, "warn");
    }
  };

  const stopWebcam = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setWebcamActive(false);
    setWebcamEnabled(false);
    setDetectedViewers(0);
    addLog("Monitoramento por camera desativado.", "cam");
  };

  const captureSnapshot = useCallback(async (adTitle: string) => {
    if (!webcamEnabled) return;
    let snapshotDataUrl = "";
    if (webcamActive && videoRef.current && canvasRef.current) {
      const v = videoRef.current;
      const c = canvasRef.current;
      c.width = v.videoWidth || 320;
      c.height = v.videoHeight || 240;
      const ctx = c.getContext("2d");
      if (ctx) { ctx.drawImage(v, 0, 0, c.width, c.height); snapshotDataUrl = c.toDataURL("image/jpeg", 0.72); }
    }
    const viewers = webcamActive ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 4);
    setDetectedViewers(viewers);
    setTotalAudienceCount(prev => prev + viewers);
    const proof: ProofSnapshot = { id: `proof-${Date.now()}`, timestamp: new Date().toLocaleTimeString(), adTitle, viewerCount: viewers, snapshotDataUrl, sent: false };
    setProofs(prev => [proof, ...prev.slice(0, 9)]);
    addLog(`Snapshot capturado: "${adTitle}" | ${viewers} espectador(es).`, "audit");
    setIsSendingSnapshot(true);
    try {
      const response = await fetch("/api/audit/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayId, adTitle, snapshotBase64: snapshotDataUrl, viewerCount: viewers, timestamp: new Date().toISOString() }),
      });
      if (response.ok) {
        setProofs(prev => prev.map(p => p.id === proof.id ? { ...p, sent: true } : p));
        addLog(`Proof-of-Play enviado ao servidor (${viewers} espectadores).`, "audit");
      } else {
        addLog("Falha ao enviar snapshot para o servidor.", "warn");
      }
    } catch { addLog("Servidor indisponivel - snapshot guardado localmente.", "warn"); }
    finally { setIsSendingSnapshot(false); }
  }, [webcamEnabled, webcamActive, displayId, addLog]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % MOCK_CONTENT.length;
        addLog(`Reproduzindo: "${MOCK_CONTENT[next].title}"`);
        captureSnapshot(MOCK_CONTENT[next].title);
        return next;
      });
    }, MOCK_CONTENT[currentIndex].duration);
    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, captureSnapshot]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (telemetry.status === "ONLINE") {
        setTelemetry(prev => ({
          ...prev,
          cpu: Math.max(10, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
          temp: Math.max(35, Math.min(85, prev.temp + (Math.random() * 4 - 2))),
        }));
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [telemetry.status]);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  if (!device) return <div className="p-8 text-slate-400">Carregando dispositivos...</div>;
  const currentContent = MOCK_CONTENT[currentIndex];

  const handleSimulateError = () => { setTelemetry(p => ({ ...p, status: "ERROR", cpu: 99, temp: 85 })); setIsPlaying(false); addLog("ALERTA: Superaquecimento e falha de CPU simulada.", "warn"); };
  const handleSimulateOffline = () => { setTelemetry(p => ({ ...p, status: "OFFLINE", connection: "DISCONNECTED" })); setIsPlaying(false); addLog("Conexao perdida. Dispositivo offline.", "warn"); };
  const handleSimulateRecovery = () => { setTelemetry({ cpu: 45, temp: 50, status: "ONLINE", connection: "STABLE" }); setIsPlaying(true); addLog("Sistema recuperado e online."); };

  return (
    <div className="space-y-6">
      <canvas ref={canvasRef} className="hidden" />
      <PageHeader title="Player Simulator — Webcam Audit" description="Nexora Player na TV Box com monitoramento por Webcam USB e Auditoria de Anuncios (Proof-of-Play)." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 space-y-4">

          {/* Ecra TV */}
          <div className="bg-slate-900 border-[8px] border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative aspect-video flex items-center justify-center">
            {telemetry.status === "OFFLINE" ? (
              <div className="text-center text-slate-500">
                <PowerOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-display">Sem Sinal (Offline)</h2>
              </div>
            ) : telemetry.status === "ERROR" ? (
              <div className="text-center text-rose-500">
                <ShieldAlert className="w-16 h-16 mx-auto mb-4" />
                <h2 className="text-xl font-display">System Error / Overheating</h2>
              </div>
            ) : (
              <div className="w-full h-full relative">
                <img src={currentContent.url} alt={currentContent.title} className="w-full h-full object-cover transition-opacity duration-1000" />
                <div className="absolute top-4 left-4 bg-[#0F172A]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-cyan-500/30 flex items-center gap-2 shadow-lg">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-cyan-300 font-bold">NEXORA PLAYER · ONLINE</span>
                </div>
                <div className="absolute bottom-4 left-4 right-56 bg-black/60 backdrop-blur-md px-3 py-2 rounded-lg">
                  <p className="text-xs font-mono text-slate-300 truncate">?? {currentContent.title}</p>
                </div>
                {webcamEnabled && showPip && (
                  <div className="absolute bottom-4 right-4 w-52 rounded-xl overflow-hidden border-2 border-cyan-500/60 shadow-2xl bg-black/80">
                    <div className="absolute top-1 left-2 z-10 flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-cyan-300 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      WEBCAM · AUDIT
                    </div>
                    {webcamActive ? (
                      <video ref={videoRef} muted playsInline className="w-full aspect-video object-cover" style={{ transform: "scaleX(-1)" }} />
                    ) : (
                      <div className="w-full aspect-video flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-center p-3">
                        <Camera className="w-6 h-6 mb-1 text-cyan-500 animate-pulse" />
                        <span className="text-[10px]">Modo Simulado</span>
                      </div>
                    )}
                    <div className="absolute bottom-1.5 right-2 bg-black/80 text-emerald-400 text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Users className="w-3 h-3" /> {detectedViewers}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Controles */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setIsPlaying(p => !p)} disabled={telemetry.status !== "ONLINE"}>
                {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isPlaying ? "Pausar" : "Reproduzir"}
              </Button>
              <Button variant="secondary" onClick={() => { const next = (currentIndex + 1) % MOCK_CONTENT.length; setCurrentIndex(next); captureSnapshot(MOCK_CONTENT[next].title); }} disabled={!isPlaying}>
                <SkipForward className="w-4 h-4 mr-1" /> Proximo Anuncio
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {webcamEnabled && (
                <button onClick={() => setShowPip(p => !p)} className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700">
                  {showPip ? "Ocultar PiP" : "Mostrar PiP"}
                </button>
              )}
              <Button variant={webcamEnabled ? "primary" : "secondary"} onClick={() => webcamEnabled ? stopWebcam() : startWebcam()} className={webcamEnabled ? "bg-cyan-600 hover:bg-cyan-500" : ""}>
                {webcamEnabled ? <Camera className="w-4 h-4 mr-1" /> : <CameraOff className="w-4 h-4 mr-1" />}
                {webcamEnabled ? "Webcam Ativa" : "Ligar Webcam"}
              </Button>
              {webcamEnabled && (
                <Button variant="secondary" onClick={() => captureSnapshot(currentContent.title)} disabled={isSendingSnapshot}>
                  {isSendingSnapshot ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                  Capturar Agora
                </Button>
              )}
            </div>
          </div>

          {webcamError && (
            <div className="flex items-center justify-between gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs">
              <span>?? {webcamError}</span>
              <button onClick={startWebcam} className="shrink-0 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-amber-200 transition-colors">Tentar novamente</button>
            </div>
          )}

          {/* Galeria Proof-of-Play */}
          {proofs.length > 0 && (
            <Card className="p-4 bg-slate-900/70 border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-white">Comprovantes de Exibicao (Proof-of-Play)</h4>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-cyan-400">{proofs.length} captures</span>
                  <span className="text-emerald-400"><Users className="w-3 h-3 inline mr-1" />{totalAudienceCount} total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {proofs.map((proof) => (
                  <div key={proof.id} className="bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
                    <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                      {proof.snapshotDataUrl ? (
                        <img src={proof.snapshotDataUrl} alt="Snapshot auditoria" className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                      ) : (
                        <Camera className="w-5 h-5 text-slate-600" />
                      )}
                      <span className="absolute bottom-1 right-1.5 bg-black/80 text-[9px] px-1 rounded font-mono text-emerald-400">{proof.viewerCount} ??</span>
                      {proof.sent && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-500/50" title="Enviado ao servidor" />}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[10px] font-medium text-slate-300 truncate">{proof.adTitle}</p>
                      <p className="text-[9px] font-mono text-slate-600">{proof.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <Smartphone className="w-5 h-5 text-nexora-cyan" />
              <h3 className="text-lg font-display font-semibold text-white">Telemetria & Audiencia</h3>
            </div>
            <div className="mb-5 p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5"><Eye className="w-4 h-4" /> Webcam AI Audit</span>
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${webcamEnabled ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-slate-800 text-slate-500 border-slate-700"}`}>{webcamEnabled ? "ATIVO" : "DESLIGADO"}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Agora</span>
                  <span className="text-2xl font-bold text-cyan-300 font-mono">{detectedViewers}</span>
                  <span className="text-[9px] text-slate-500 block">espectadores</span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Total Sessao</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">{totalAudienceCount}</span>
                  <span className="text-[9px] text-slate-500 block">impressoes</span>
                </div>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm mb-5">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <dt className="text-slate-400 text-xs mb-1">Status</dt>
                <dd className={`font-medium ${telemetry.status === "ONLINE" ? "text-emerald-400" : "text-rose-400"}`}>{telemetry.status}</dd>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <dt className="text-slate-400 text-xs mb-1">Rede</dt>
                <dd className="font-medium text-blue-400">{telemetry.connection}</dd>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <dt className="text-slate-400 text-xs mb-1">CPU</dt>
                <dd className={`font-medium ${telemetry.cpu > 80 ? "text-rose-400" : "text-emerald-400"}`}>{telemetry.cpu.toFixed(1)}%</dd>
              </div>
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <dt className="text-slate-400 text-xs mb-1">Temperatura</dt>
                <dd className={`font-medium ${telemetry.temp > 75 ? "text-rose-400" : "text-amber-400"}`}>{telemetry.temp.toFixed(1)} °C</dd>
              </div>
            </dl>
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Simular Eventos</h4>
              <Button variant="secondary" className="w-full justify-start" onClick={handleSimulateError}><Cpu className="w-4 h-4 mr-2 text-rose-400" /> Erro / Superaquecimento</Button>
              <Button variant="secondary" className="w-full justify-start" onClick={handleSimulateOffline}><PowerOff className="w-4 h-4 mr-2 text-amber-400" /> Desconexao de Rede</Button>
              <Button variant="secondary" className="w-full justify-start" onClick={handleSimulateRecovery}><Zap className="w-4 h-4 mr-2 text-emerald-400" /> Recuperar / Sincronizar</Button>
            </div>
          </Card>

          <Card className="p-0 overflow-hidden border-slate-800">
            <div className="bg-slate-900 p-3 border-b border-slate-800 flex items-center gap-2">
              <Activity className="w-3 h-3 text-cyan-400" />
              <h3 className="text-xs font-mono font-semibold text-slate-400">Player & AI Audit Console</h3>
            </div>
            <div className="bg-[#080808] p-3 h-56 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-0.5">
              {logs.map((log, idx) => (
                <div key={idx} className={
                  log.includes("ALERTA") || log.includes("Falha") || log.includes("ERRO") ? "text-rose-400"
                  : log.includes("[Audit") || log.includes("[Webcam]") ? "text-cyan-400"
                  : log.includes("Mock") ? "text-slate-500"
                  : "text-emerald-400"
                }>{log}</div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
