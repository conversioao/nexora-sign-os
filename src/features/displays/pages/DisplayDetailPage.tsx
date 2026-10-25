import React, { useState, useEffect } from 'react';
import { NexoraService } from '../../../services';
import { Display, ContentItem, Playlist } from '../../../types/domain';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Skeleton } from '../../../components/ui/Skeleton';
import { ErrorState } from '../../../components/ui/States';
import { useToast } from '../../../components/ui/Toast';
import { DisplayMockMap } from '../components/DisplayMockMap';
import { DisplayCommercialActionModal, CommercialActionType } from '../components/DisplayCommercialActionModal';
import {
  formatHeartbeatTime,
  formatDeviceTypeLabel,
  formatOrientationLabel,
  formatCurrencyKz,
  formatCommercialModel,
  formatCommercialStatus,
  formatOwnershipType,
  mapDisplayStatusToVariant,
} from '../utils/displayFormatters';
import {
  ArrowLeft,
  RefreshCw,
  Edit3,
  Power,
  Tv,
  Film,
  Wifi,
  HardDrive,
  Thermometer,
  Activity,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Play,
  Cpu,
  ShoppingBag,
  DollarSign,
  Sparkles,
  UserCheck,
  RotateCcw,
  Megaphone,
  Briefcase,
  ShieldCheck,
  Clock,
  Building2,
  FileText,
  Send,
  Home,
  Moon,
  Trash2,
  Unlink,
  Lock,
  PowerOff,
} from 'lucide-react';

import { useSession } from '../../../context/SessionContext';

interface DisplayDetailPageProps {
  displayId: string;
  onBackToList: () => void;
}

export const DisplayDetailPage: React.FC<DisplayDetailPageProps> = ({
  displayId,
  onBackToList,
}) => {
  const { currentUser, currentOrganization, currentMembership, currentRole } = useSession();
  const isNexoraAdmin = currentRole === 'NEXORA_ADMIN' || currentMembership?.role === 'NEXORA_ADMIN' || currentOrganization?.type === 'NEXORA';
  const { showToast } = useToast();
  const [display, setDisplay] = useState<Display | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isRestarting, setIsRestarting] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [isPushingMedia, setIsPushingMedia] = useState<boolean>(false);
  const [isTogglingPower, setIsTogglingPower] = useState<boolean>(false);

  // Tab State: 'OPERATIONAL' | 'COMMERCIAL'
  const [activeTab, setActiveTab] = useState<'OPERATIONAL' | 'COMMERCIAL'>('OPERATIONAL');

  // Commercial Action Modal
  const [modalAction, setModalAction] = useState<CommercialActionType | null>(null);

  // Real Content & Playlist list from DB
  const [availableContent, setAvailableContent] = useState<any[]>([]);
  const [availablePlaylists, setAvailablePlaylists] = useState<any[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<'CONTENT' | 'PLAYLIST'>('CONTENT');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4');
  const [selectedMediaTitle, setSelectedMediaTitle] = useState<string>('Spot Principal Nexora');

  const [loopStats, setLoopStats] = useState<{ totalLoopsToday: number; uniqueMediaToday: number; recentLoops: any[] } | null>(null);

  const fetchDisplay = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await NexoraService.displays.getById(displayId);
      if (!data) {
        setError(`O display com identificador "${displayId}" não foi encontrado no inventário.`);
      } else {
        setDisplay(data);
        await fetchMediaOptions(data);
        fetch(`/api/displays/${displayId}/playback-stats`)
          .then(r => r.json())
          .then(data => setLoopStats(data))
          .catch(() => {});
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar detalhes do display.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMediaOptions = async (currentDisp?: Display | null) => {
    try {
      const [contentRes, playlistRes] = await Promise.all([
        fetch('/api/content'),
        fetch('/api/playlists'),
      ]);
      let cData: any[] = [];
      let pData: any[] = [];
      if (contentRes.ok) {
        cData = await contentRes.json();
        setAvailableContent(cData);
      }
      if (playlistRes.ok) {
        pData = await playlistRes.json();
        setAvailablePlaylists(pData);
      }

      const activeDisp = currentDisp || display;
      if (activeDisp) {
        // If display has a current playlist associated
        if (activeDisp.currentPlaylistId || (activeDisp.currentPlaylist && activeDisp.currentPlaylist.startsWith('Playlist:'))) {
          const matchingPl = pData.find(
            (p) => p.id === activeDisp.currentPlaylistId || `Playlist: ${p.name}` === activeDisp.currentPlaylist
          );
          if (matchingPl) {
            setSelectedContentType('PLAYLIST');
            setSelectedPlaylistId(matchingPl.id);
            setSelectedMediaTitle(`Playlist: ${matchingPl.name}`);
            const rawItems = typeof matchingPl.items === 'string' ? JSON.parse(matchingPl.items) : (matchingPl.items || []);
            if (rawItems.length > 0) {
              setSelectedMediaUrl(rawItems[0].mediaUrl || rawItems[0].url || rawItems[0].fileUrl);
            }
            return;
          }
        }

        // If display has a current content title or URL
        if (activeDisp.currentContent) {
          const matchingContent = cData.find(
            (c) => c.name === activeDisp.currentContent || c.url === activeDisp.currentContent || c.id === activeDisp.currentContent
          );
          if (matchingContent) {
            setSelectedContentType('CONTENT');
            setSelectedMediaUrl(matchingContent.url);
            setSelectedMediaTitle(matchingContent.name);
            return;
          }
        }
      }

      // Default to first real content item in database
      if (cData.length > 0) {
        setSelectedContentType('CONTENT');
        setSelectedMediaUrl(cData[0].url);
        setSelectedMediaTitle(cData[0].name);
      }
    } catch (e) {
      console.warn('Failed to load media options', e);
    }
  };

  useEffect(() => {
    fetchDisplay();
  }, [displayId]);

  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await fetchDisplay();
      showToast({
        type: 'success',
        title: 'Dados Atualizados',
        message: 'Estado do display e conteúdos sincronizados com sucesso.',
      });
    } finally {
      setIsManualRefreshing(false);
    }
  };

  const handleSync = async () => {
    if (!display) return;
    setIsSyncing(true);
    try {
      const res = await NexoraService.displays.sync(display.id);
      showToast({
        type: 'success',
        title: 'Sincronização Despachada',
        message: res.message,
      });
      await fetchDisplay();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Falha na Sincronização', message: err?.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePushMedia = async (url?: string, title?: string) => {
    if (!display) return;
    setIsPushingMedia(true);
    let mediaToPush = url || selectedMediaUrl;
    let titleToPush = title || selectedMediaTitle || 'Mídia Atualizada';
    let playlistItems: any[] = [];

    if (selectedContentType === 'PLAYLIST' && selectedPlaylistId) {
      try {
        const plDetail = await NexoraService.playlists.getById(selectedPlaylistId);
        if (plDetail) {
          titleToPush = `Playlist: ${plDetail.name}`;
          if (plDetail.items && plDetail.items.length > 0) {
            playlistItems = plDetail.items.map((it) => ({
              id: it.id,
              mediaUrl: it.content?.fileUrl || (it.content as any)?.url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80',
              duration: it.duration || 10,
              name: it.content?.name || 'Mídia da Playlist',
              type: it.content?.type || 'IMAGE',
            }));
            mediaToPush = playlistItems[0]?.mediaUrl || mediaToPush;
          }
        }
      } catch (e) {
        console.warn('Failed to load playlist items for push', e);
      }
    }

    try {
      const res = await fetch(`/api/displays/${display.id}/push_media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaUrl: mediaToPush,
          title: titleToPush,
          playlistId: selectedContentType === 'PLAYLIST' ? selectedPlaylistId : undefined,
          items: playlistItems,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setDisplay((prev) =>
          prev
            ? {
                ...prev,
                currentContent: titleToPush,
                currentPlaylist: selectedContentType === 'PLAYLIST' ? titleToPush : prev.currentPlaylist,
              }
            : prev
        );
        showToast({
          type: 'success',
          title: 'Transmissão Despachada com Sucesso!',
          message: selectedContentType === 'PLAYLIST' ? `Playlist com ${playlistItems.length} itens enviada para o dispositivo!` : 'Mídia enviada e em reprodução na TV Box.',
        });
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erro ao enviar mídia', message: e?.message });
    } finally {
      setIsPushingMedia(false);
    }
  };

  const handleRestart = async () => {
    if (!display) return;
    setIsRestarting(true);
    try {
      const res = await NexoraService.displays.restartPlayer(display.id);
      showToast({
        type: 'info',
        title: 'Reinicialização Despachada',
        message: res.message,
      });
      await fetchDisplay();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Falha no Reboot', message: err?.message });
    } finally {
      setIsRestarting(false);
    }
  };

  const handleSetOrientation = async (newOrientation: string) => {
    if (!display) return;
    setIsRotating(true);
    try {
      const res = await fetch(`/api/displays/${display.id}/orientation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orientation: newOrientation }),
      });
      if (res.ok) {
        setDisplay((prev) => (prev ? { ...prev, orientation: newOrientation as any } : prev));
        const labels: Record<string, string> = {
          LANDSCAPE: 'Horizontal (16:9)',
          PORTRAIT: 'Vertical Horário (9:16 ↻)',
          LANDSCAPE_REVERSED: 'Horizontal Invertido (16:9 ↺)',
          PORTRAIT_REVERSED: 'Vertical Anti-Horário (9:16 ↺)',
        };
        showToast({
          type: 'success',
          title: 'Orientação Alterada Remotamente',
          message: `Ecrã definido para ${labels[newOrientation] || newOrientation}.`,
        });
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erro ao girar tela', message: e?.message });
    } finally {
      setIsRotating(false);
    }
  };

  const handleHomeScreen = async () => {
    if (!display) return;
    try {
      await fetch(`/api/displays/${display.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'HOME_SCREEN' }),
      });
      showToast({
        type: 'info',
        title: 'Ecrã Inicial Nexora Ativado',
        message: 'A TV Box está agora a exibir o ecrã inicial com relógio digital.',
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erro ao enviar comando', message: e?.message });
    }
  };

  const handleStandby = async () => {
    if (!display) return;
    try {
      await fetch(`/api/displays/${display.id}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'STANDBY' }),
      });
      showToast({
        type: 'warning',
        title: 'Modo Standby / Suspensão Ativado',
        message: 'Ecrã da TV Box colocado em modo de baixo consumo.',
      });
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erro ao desligar', message: e?.message });
    }
  };

  const isPowered = display?.isPoweredOn ?? display?.is_powered_on ?? true;

  const handleTogglePower = async () => {
    if (!display) return;
    const nextState = !isPowered;
    setIsTogglingPower(true);
    try {
      const res = await fetch(`/api/displays/${display.id}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_powered_on: nextState }),
      });
      const data = await res.json();
      if (res.ok) {
        setDisplay((prev) =>
          prev ? { ...prev, isPoweredOn: nextState, is_powered_on: nextState } : null
        );
        showToast({
          type: nextState ? 'success' : 'warning',
          title: nextState ? 'Display Ligado' : 'Display Desligado',
          message: nextState
            ? 'O display está ligado. O agente de monitorização reportará via WhatsApp se houver perda de conexão.'
            : 'O display está desligado. O agente WhatsApp foi silenciado e NÃO enviará alertas quando o terminal estiver sem sinal.',
        });
      } else {
        throw new Error(data.error || 'Falha ao alterar estado de energia.');
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erro de energia', message: e?.message });
    } finally {
      setIsTogglingPower(false);
    }
  };

  const handleResetDevice = async () => {
    if (!display) return;
    if (
      !window.confirm(
        'Tem certeza que deseja resetar a conexão deste dispositivo? A TV Box voltará à tela inicial para gerar um novo código PIN e solicitar nova vinculação.'
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/displays/${display.id}/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        showToast({
          type: 'info',
          title: 'Dispositivo Resetado com Sucesso',
          message: 'O comando de reset foi enviado. A TV Box está a solicitar um novo código PIN.',
        });
        await fetchDisplay();
      } else {
        throw new Error('Falha na resposta do servidor.');
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erro ao resetar dispositivo', message: e?.message });
    }
  };

  const handleDeleteDisplay = async () => {
    if (!display) return;
    if (
      !window.confirm(
        `Tem certeza que deseja excluir permanentemente o display "${display.name}" (${display.code})? Esta ação não pode ser desfeita e desconectará o hardware.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/displays/${display.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast({
          type: 'success',
          title: 'Display Excluído',
          message: `O display ${display.name} foi removido com sucesso.`,
        });
        onBackToList();
      } else {
        throw new Error('Falha ao excluir o display.');
      }
    } catch (e: any) {
      showToast({ type: 'error', title: 'Erro na exclusão', message: e?.message });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-4">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <Skeleton variant="text" className="w-48 h-8" />
          <div className="flex gap-2">
            <Skeleton variant="button" className="w-24 h-9" />
            <Skeleton variant="button" className="w-24 h-9" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton variant="card" className="h-96 lg:col-span-8" />
          <Skeleton variant="card" className="h-96 lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (error || !display) {
    return (
      <ErrorState
        title="Display Não Encontrado"
        message={error || 'Não foi possível carregar as informações deste dispositivo.'}
        onRetry={onBackToList}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header do Painel */}
      <div className="flex flex-col gap-4 pb-4 border-b border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToList}
              className="p-2 rounded-lg bg-[#0B1120] border border-white/10 text-[#94A3B8] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-display text-white">{display.name}</h1>
                <Badge variant={mapDisplayStatusToVariant(display.status)} size="sm">
                  {display.status}
                </Badge>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center gap-1 border transition-colors ${
                    isPowered
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  }`}
                  title={
                    isPowered
                      ? 'Display LIGADO: Monitorização telemétrica e alertas WhatsApp ATIVOS.'
                      : 'Display DESLIGADO: Alertas WhatsApp SILENCIADOS quando o terminal não emitir sinal.'
                  }
                >
                  <Power className={`w-3 h-3 ${isPowered ? 'text-emerald-400' : 'text-amber-400'}`} />
                  {isPowered ? 'Ligado' : 'Desligado (WhatsApp Silenciado)'}
                </span>
                <span className="text-xs font-mono text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded border border-[#06B6D4]/20">
                  {display.code}
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {display.location.venueName} • {display.location.municipality}, {display.location.province} • Visto por último: {formatHeartbeatTime(display.lastHeartbeatAt).label}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botão Principal de Ligar / Desligar */}
            <Button
              variant={isPowered ? 'default' : 'outline'}
              size="sm"
              onClick={handleTogglePower}
              loading={isTogglingPower}
              className={
                isPowered
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/20 font-semibold'
                  : 'bg-slate-900 border-amber-500/60 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400 font-semibold'
              }
              leftIcon={<Power className={`w-3.5 h-3.5 ${isPowered ? 'text-white' : 'text-amber-400'}`} />}
              title={
                isPowered
                  ? 'O terminal está LIGADO. Clique para DESLIGAR (silenciará alertas de perda de conexão no WhatsApp).'
                  : 'O terminal está DESLIGADO. Clique para LIGAR (ativará monitorização e alertas WhatsApp).'
              }
            >
              {isPowered ? 'Desligar Terminal' : 'Ligar Terminal'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              loading={isManualRefreshing}
              className="border-slate-600 text-slate-300 hover:text-white hover:border-slate-500"
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-cyan-400" />}
            >
              Atualizar Dados
            </Button>

            <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHomeScreen}
                  className="border-slate-600 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40"
                  leftIcon={<Home className="w-3.5 h-3.5 text-cyan-400" />}
                >
                  Ecrã Inicial (Home)
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStandby}
                  className="border-slate-600 text-slate-300 hover:text-amber-300 hover:border-amber-500/40"
                  leftIcon={<Moon className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Desligar / Standby
                </Button>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide px-1">Orientação do Ecrã</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { value: 'LANDSCAPE', label: 'Horizontal', shortLabel: '▭ 16:9' },
                      { value: 'PORTRAIT', label: 'Vertical ↻', shortLabel: '▯ 9:16 ↻' },
                      { value: 'LANDSCAPE_REVERSED', label: 'Horizontal Invertido', shortLabel: '▭ 16:9 ↺' },
                      { value: 'PORTRAIT_REVERSED', label: 'Vertical Invertido', shortLabel: '▯ 9:16 ↺' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isRotating}
                        onClick={() => handleSetOrientation(opt.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          display.orientation === opt.value
                            ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                            : 'bg-slate-900/60 border-slate-700 text-slate-400 hover:text-white hover:border-slate-500'
                        }`}
                        title={opt.label}
                      >
                        {opt.shortLabel}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSync}
                  loading={isSyncing}
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                >
                  Sincronizar Grade
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRestart}
                  loading={isRestarting}
                  leftIcon={<Power className="w-3.5 h-3.5" />}
                >
                  Reiniciar Player
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDevice}
                  className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:border-amber-400"
                  leftIcon={<Unlink className="w-3.5 h-3.5 text-amber-400" />}
                >
                  Resetar Conexão
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteDisplay}
                  className="border-rose-500/40 text-rose-300 hover:bg-rose-500/10 hover:border-rose-400"
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                >
                  Excluir Terminal
                </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
          <button
            onClick={() => setActiveTab('OPERATIONAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'OPERATIONAL'
                ? 'bg-[#0284C7] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Dimensão Operacional & Hardware
          </button>

          <button
            onClick={() => setActiveTab('COMMERCIAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'COMMERCIAL'
                ? 'bg-[#0284C7] text-white shadow-sm'
                : 'text-[#94A3B8] hover:text-white hover:bg-white/5'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Dimensão Comercial & Negócio
          </button>
        </div>
      </div>

      {/* Tab 1: Dimensão Operacional */}
      {activeTab === 'OPERATIONAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (8 cols): Specs, Media & Telemetry */}
          <div className="lg:col-span-8 space-y-6">
            {/* Card: Especificações de Hardware & Display */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#0284C7]/15 text-[#38BDF8]">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Identificação Técnica & Hardware</CardTitle>
                    <CardDescription>Parâmetros físicos e arquitetura do player Android</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Tipo de Dispositivo</span>
                    <span className="font-semibold text-white block">
                      {formatDeviceTypeLabel(display.deviceType)}
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Orientação</span>
                    <span className="font-semibold text-cyan-400 block">
                      {formatOrientationLabel(display.orientation)}
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Resolução Nativa</span>
                    <span className="font-semibold text-[#06B6D4] font-mono block">
                      {display.resolution || '1920x1080'}
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Tamanho da Tela</span>
                    <span className="font-semibold text-white block">
                      {display.screenSizeInches} Polegadas
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Versão Nexora Player</span>
                    <span className="font-semibold text-[#C084FC] font-mono block">
                      {display.playerVersion || 'v2.4.0'}
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Sistema Operacional</span>
                    <span className="font-semibold text-white block">
                      {display.androidVersion || 'Android 11 AOSP'}
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Data de Instalação</span>
                    <span className="font-semibold text-white block">
                      {display.installedAt || '15/01/2025'}
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[#94A3B8] block text-[11px]">Tarifa Diária Base</span>
                    <span className="font-semibold text-[#10B981] font-mono block">
                      {formatCurrencyKz(display.dailyRateKz)}
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-cyan-500/20 space-y-1">
                    <span className="text-cyan-400 block text-[11px] font-bold">Capacidade de Anúncios</span>
                    <span className="font-semibold text-white font-mono block">
                      {display.maxAdSlots || (display as any).max_ad_slots || 8} Slots Definidos
                    </span>
                  </div>

                  <div className="bg-[#0B1120] p-3 rounded-xl border border-emerald-500/20 space-y-1">
                    <span className="text-emerald-400 block text-[11px] font-bold">Vagas / Slots Restantes</span>
                    <span className="font-semibold text-emerald-300 font-mono block">
                      {Math.max(0, (display.maxAdSlots || (display as any).max_ad_slots || 8) - (display.activeCampaignCount || 0))} Vagas Livres
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Telemetria de Loops em Tempo Real */}
            {loopStats && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#10B981]/15 text-emerald-400">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Execução de Loops & Impressões em Tempo Real</CardTitle>
                      <CardDescription>Contagem real de exibições concluídas nesta TV Box</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#0B1120] p-4 rounded-xl border border-emerald-500/30">
                      <span className="text-[#94A3B8] text-xs block font-medium">Loops Executados Hoje</span>
                      <p className="text-3xl font-black text-white mt-1">{loopStats.totalLoopsToday.toLocaleString('pt-AO')}</p>
                      <span className="text-[11px] text-emerald-400 font-medium">Registrado diretamente via WebSocket</span>
                    </div>
                    <div className="bg-[#0B1120] p-4 rounded-xl border border-white/5">
                      <span className="text-[#94A3B8] text-xs block font-medium">Mídias Distintas Exibidas</span>
                      <p className="text-3xl font-black text-[#38BDF8] mt-1">{loopStats.uniqueMediaToday}</p>
                      <span className="text-[11px] text-slate-400">Itens ativos na playlist hoje</span>
                    </div>
                  </div>

                  {loopStats.recentLoops.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-slate-300">Histórico Recente de Veiculação (7 dias)</h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {loopStats.recentLoops.map((loop: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                            <span className="text-slate-200 font-medium truncate max-w-[240px]">{loop.content_title || loop.media_url}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 text-[10px]">Último: {new Date(loop.last_played).toLocaleTimeString('pt-AO', { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">{loop.play_count}x</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Card: Conteúdo & Transmissão Remota */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#A855F7]/15 text-[#C084FC]">
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Conteúdo & Programação em Exibição</CardTitle>
                    <CardDescription>Campanha publicitária ativa e envio de mídias para a TV Box</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-[#0B1120] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                      <span className="text-xs font-semibold text-[#38BDF8] uppercase tracking-wider">
                        Spot Atual em Reprodução
                      </span>
                    </div>
                    <span className="text-xs text-[#94A3B8] font-mono">
                      Última sincronização: {display.lastSyncAt || 'Hoje às 11:30'}
                    </span>
                  </div>

                  <h3 className="font-display font-semibold text-base text-white">
                    {display.currentContent || selectedMediaTitle || 'Spot Nexora em Reprodução'}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px]">Playlist Associada:</span>
                      <p className="text-white font-medium">{display.currentPlaylist || 'Playlist Padrão'}</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px]">Campanhas na Grade:</span>
                      <p className="text-white font-medium">{display.activeCampaignCount} anunciantes ativos</p>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-[#64748B] text-[11px]">Cliente Titular:</span>
                      <p className="text-white font-medium">{display.clientName || 'Nexora Rede'}</p>
                    </div>
                  </div>
                </div>

                {/* Transmissor de Mídias e Playlists Reais do Banco de Dados */}
                <div className="p-4 rounded-xl bg-slate-900/60 border border-cyan-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-cyan-400" /> Selecionar e Transmitir para esta TV Box
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedContentType('CONTENT')}
                        className={`text-xs px-2.5 py-1 rounded cursor-pointer ${
                          selectedContentType === 'CONTENT' ? 'bg-cyan-600 text-white font-bold' : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        Mídias ({availableContent.length})
                      </button>
                      <button
                        onClick={() => setSelectedContentType('PLAYLIST')}
                        className={`text-xs px-2.5 py-1 rounded cursor-pointer ${
                          selectedContentType === 'PLAYLIST' ? 'bg-cyan-600 text-white font-bold' : 'bg-white/5 text-slate-400'
                        }`}
                      >
                        Playlists ({availablePlaylists.length})
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {selectedContentType === 'CONTENT' ? (
                      <select
                        value={selectedMediaUrl}
                        onChange={(e) => {
                          const item = availableContent.find((c) => c.url === e.target.value || c.id === e.target.value);
                          if (item) {
                            setSelectedMediaUrl(item.url);
                            setSelectedMediaTitle(item.name);
                          } else {
                            setSelectedMediaUrl(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {availableContent.length === 0 && (
                          <option value="">Nenhuma mídia cadastrada na biblioteca</option>
                        )}
                        {availableContent.map((c) => (
                          <option key={c.id} value={c.url}>
                            {c.type === 'video' ? '🎬' : '🖼️'} {c.name} ({c.type})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedPlaylistId}
                        onChange={(e) => {
                          const pl = availablePlaylists.find((p) => p.id === e.target.value);
                          setSelectedPlaylistId(e.target.value);
                          if (pl) {
                            setSelectedMediaTitle(`Playlist: ${pl.name}`);
                            const rawItems = typeof pl.items === 'string' ? JSON.parse(pl.items) : (pl.items || []);
                            if (rawItems.length > 0) {
                              setSelectedMediaUrl(rawItems[0].mediaUrl || rawItems[0].url || rawItems[0].fileUrl);
                            }
                          }
                        }}
                        className="w-full bg-slate-950 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="">Selecione uma playlist cadastrada...</option>
                        {availablePlaylists.map((p) => (
                          <option key={p.id} value={p.id}>
                            📑 {p.name} ({p.items_count || 1} itens)
                          </option>
                        ))}
                      </select>
                    )}

                    <Button
                      size="sm"
                      variant="primary"
                      loading={isPushingMedia}
                      onClick={() => handlePushMedia()}
                      className="w-full sm:w-auto shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white text-xs px-4"
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Transmitir Agora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card: Telemetria & Conectividade */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-[#10B981]/15 text-[#10B981]">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle>Telemetria em Tempo Real & Rede</CardTitle>
                    <CardDescription>Métricas operacionais de saúde do hardware</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* IP Address & Network */}
                  <div className="bg-[#0B1120] p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8] flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-[#38BDF8]" /> IP Local do Dispositivo
                      </span>
                    </div>
                    <span className="font-mono text-base font-bold text-white block">
                      {(display as any).ipAddress || '192.168.100.162'}
                    </span>
                    <span className="text-[10px] text-[#10B981] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Conexão Direta Ativa
                    </span>
                  </div>

                  {/* Temperature */}
                  <div className="bg-[#0B1120] p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8] flex items-center gap-1.5">
                        <Thermometer className="w-3.5 h-3.5 text-[#F59E0B]" /> Temperatura
                      </span>
                      <span className="font-mono font-bold text-[#10B981]">
                        {display.temperatureCelsius || 38}°C
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#10B981]" style={{ width: '45%' }} />
                    </div>
                    <span className="text-[10px] text-[#64748B] block">Dentro da faixa operacional ideal</span>
                  </div>

                  {/* Storage */}
                  <div className="bg-[#0B1120] p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#94A3B8] flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-[#38BDF8]" /> Armazenamento
                      </span>
                      <span className="font-mono font-bold text-white">12 GB / 32 GB</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-[#0284C7]" style={{ width: '38%' }} />
                    </div>
                    <span className="text-[10px] text-[#64748B] block">Cache local de spots: 1.2 GB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (4 cols): Live TV Screen Preview */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="border-cyan-500/20 shadow-xl bg-slate-950/60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-500/15 text-cyan-400">
                      <Tv className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle>Ecrã da TV Box ao Vivo</CardTitle>
                      <CardDescription>Visualização em tempo real do display</CardDescription>
                    </div>
                  </div>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AO VIVO
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex flex-col items-center">
                {/* TV Screen Mock Frame */}
                <div
                  className={`relative bg-black rounded-xl overflow-hidden border-4 border-slate-700 shadow-2xl flex items-center justify-center transition-all ${
                    display.orientation === 'PORTRAIT' ? 'w-52 h-80' : 'w-full h-48'
                  }`}
                >
                  {selectedMediaUrl && (selectedMediaUrl.toLowerCase().includes('.mp4') || selectedMediaUrl.toLowerCase().includes('.webm')) ? (
                    <video
                      key={selectedMediaUrl}
                      src={selectedMediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <img
                      key={selectedMediaUrl}
                      src={selectedMediaUrl || (availableContent[0]?.url) || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80'}
                      alt="Display Live Content"
                      className="w-full h-full object-contain bg-black"
                    />
                  )}

                  {/* Watermark badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/70 backdrop-blur-md rounded text-[10px] text-cyan-300 font-mono">
                    {display.code || 'NEXORA'} • {display.orientation || 'LANDSCAPE'}
                  </div>
                </div>

                <div className="w-full bg-[#0B1120] p-3 rounded-xl border border-white/5 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Conteúdo Atual:</span>
                    <span className="text-white font-medium truncate max-w-[170px]">{display.currentContent || selectedMediaTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Orientação:</span>
                    <span className="text-cyan-400 font-medium">{display.orientation === 'PORTRAIT' ? 'Vertical (9:16)' : 'Horizontal (16:9)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">IP da TV Box:</span>
                    <span className="text-white font-mono">{(display as any).ipAddress || '192.168.100.162'}</span>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  loading={isPushingMedia}
                  onClick={() => handlePushMedia()}
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-2 font-semibold"
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Transmitir para a TV Box
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 2: Dimensão Comercial */}
      {activeTab === 'COMMERCIAL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Perfil Comercial & Modelo de Negócio</CardTitle>
                <CardDescription>Monetização e regras de rentabilidade</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5">
                    <span className="text-[#64748B] block">Modelo Comercial</span>
                    <span className="font-semibold text-white text-sm">
                      {formatCommercialModel(display.commercialModel)}
                    </span>
                  </div>
                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5">
                    <span className="text-[#64748B] block">Status Comercial</span>
                    <span className="font-semibold text-[#10B981] text-sm">
                      {formatCommercialStatus(display.commercialStatus)}
                    </span>
                  </div>
                  <div className="bg-[#0B1120] p-3 rounded-xl border border-white/5">
                    <span className="text-[#64748B] block">Tarifa Diária</span>
                    <span className="font-semibold text-[#06B6D4] text-sm font-mono">
                      {formatCurrencyKz(display.dailyRateKz)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
