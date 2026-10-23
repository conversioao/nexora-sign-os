import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Monitor,
  Maximize2,
  Film,
  Video,
  Image as ImageIcon,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { Playlist, PlaylistItem } from '../../../types/domain';
import { formatDurationClock, TRANSITION_LABELS } from '../utils/playlistUtils';

interface PlaylistPreviewModalProps {
  isOpen: boolean;
  playlist: Playlist | null;
  onClose: () => void;
}

export const PlaylistPreviewModal: React.FC<PlaylistPreviewModalProps> = ({
  isOpen,
  playlist,
  onClose,
}) => {
  // All hooks must be declared before any early returns (React rules of hooks)
  const enabledItems = useMemo(() => {
    return (playlist?.items || []).filter((item) => item.enabled);
  }, [playlist]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [itemTimeElapsed, setItemTimeElapsed] = useState<number>(0);
  const [isLooping, setIsLooping] = useState<boolean>(true);
  const [viewOrientation, setViewOrientation] = useState<'LANDSCAPE' | 'PORTRAIT'>(
    playlist?.metadata?.orientation === 'PORTRAIT' ? 'PORTRAIT' : 'LANDSCAPE'
  );

  const currentItem: PlaylistItem | undefined = enabledItems[currentIndex];
  const itemDuration = currentItem?.duration || 10;

  const totalPlaylistDuration = useMemo(() => {
    return enabledItems.reduce((acc, it) => acc + (it.duration || 10) * (it.repeatCount || 1), 0);
  }, [enabledItems]);

  const cumulativeElapsed = useMemo(() => {
    let sum = 0;
    for (let i = 0; i < currentIndex; i++) {
      const it = enabledItems[i];
      if (it) sum += (it.duration || 10) * (it.repeatCount || 1);
    }
    return sum + itemTimeElapsed;
  }, [enabledItems, currentIndex, itemTimeElapsed]);

  // Playback timer effect (updates every 100ms for smooth progress) — runs unconditionally
  useEffect(() => {
    if (!isOpen || !playlist || !isPlaying || enabledItems.length === 0 || !currentItem) return;

    const interval = setInterval(() => {
      setItemTimeElapsed((prev) => {
        const next = prev + 0.1;
        if (next >= itemDuration) {
          if (currentIndex < enabledItems.length - 1) {
            setCurrentIndex((idx) => idx + 1);
            return 0;
          } else if (isLooping) {
            setCurrentIndex(0);
            return 0;
          } else {
            setIsPlaying(false);
            return itemDuration;
          }
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, playlist, isPlaying, currentIndex, enabledItems, currentItem, itemDuration, isLooping]);

  // Early return AFTER all hooks are declared
  if (!isOpen || !playlist) return null;

  // Jump to specific index
  const handleJumpToIndex = (idx: number) => {
    setCurrentIndex(idx);
    setItemTimeElapsed(0);
  };

  const handleNext = () => {
    if (currentIndex < enabledItems.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setItemTimeElapsed(0);
    } else if (isLooping) {
      setCurrentIndex(0);
      setItemTimeElapsed(0);
    }
  };

  const handlePrevious = () => {
    if (itemTimeElapsed > 2) {
      setItemTimeElapsed(0);
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setItemTimeElapsed(0);
    } else if (isLooping) {
      setCurrentIndex(enabledItems.length - 1);
      setItemTimeElapsed(0);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setItemTimeElapsed(0);
    setIsPlaying(true);
  };

  const currentContent = currentItem?.content;
  const mediaUrl = currentContent?.fileUrl || (currentContent as any)?.url || (currentItem as any)?.mediaUrl || '';
  const mediaType = (currentContent?.type || (currentItem as any)?.type || '').toUpperCase();
  const isVideo = mediaType === 'VIDEO' || mediaUrl.toLowerCase().includes('.mp4') || mediaUrl.toLowerCase().includes('.webm') || mediaUrl.toLowerCase().includes('.mov') || mediaUrl.toLowerCase().includes('video');
  const isDoc = mediaType === 'PDF';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B1120] border border-white/10 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#070B14]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4]">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#F8FAFC] font-display">
                  {playlist.name}
                </h3>
                <span className="text-[10px] font-mono text-[#64748B] bg-white/5 px-2 py-0.5 rounded">
                  Simulação de Player
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                Visualização fiel da ordem de execução, transições e tempos de permanência.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orientation Switcher */}
            <button
              type="button"
              onClick={() =>
                setViewOrientation((prev) => (prev === 'LANDSCAPE' ? 'PORTRAIT' : 'LANDSCAPE'))
              }
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] border border-white/10 transition-colors"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>{viewOrientation === 'LANDSCAPE' ? '16:9 Horizontal' : '9:16 Vertical (Totem)'}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Screen Canvas */}
        <div className="flex-1 p-4 bg-[#050811] flex items-center justify-center overflow-hidden min-h-[340px]">
          {enabledItems.length === 0 ? (
            <div className="text-center text-[#64748B] py-12">
              <Film className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum conteúdo ativo na playlist para reprodução.</p>
            </div>
          ) : (
            <div
              className={`relative bg-black rounded-xl border border-white/20 shadow-2xl overflow-hidden flex flex-col justify-between transition-all duration-500 ${
                viewOrientation === 'LANDSCAPE'
                  ? 'w-full max-w-2xl aspect-video'
                  : 'w-[280px] h-[450px] aspect-[9/16]'
              }`}
            >
              {/* REAL MEDIA PLAYER — video or image */}
              {isVideo && mediaUrl ? (
                <video
                  key={currentContent?.id || currentIndex}
                  src={mediaUrl}
                  autoPlay
                  muted
                  playsInline
                  loop={false}
                  onEnded={handleNext}
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />
              ) : (currentContent?.thumbnailUrl || mediaUrl) ? (
                <img
                  key={currentContent?.id || currentIndex}
                  src={currentContent?.thumbnailUrl || mediaUrl}
                  alt={currentContent?.name || 'Mídia'}
                  className="absolute inset-0 w-full h-full object-contain bg-black"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${currentContent?.thumbnailGradient || 'from-blue-900 via-indigo-950 to-slate-900'}`} />
              )}

              {/* Overlay gradient at bottom for HUD readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

              {/* Screen HUD Overlay - Top */}
              <div className="relative z-10 flex items-center justify-between text-xs text-white/90 p-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 font-mono text-[10px]">
                    SLOT #{currentIndex + 1} de {enabledItems.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#2563EB]/80 backdrop-blur-md text-[10px] font-bold">
                    {isVideo ? 'VÍDEO' : isDoc ? 'DOCUMENTO' : 'IMAGEM'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md font-mono text-[10px]">
                  <Sparkles className="w-3 h-3 text-[#C084FC]" />
                  <span>{TRANSITION_LABELS[currentItem?.transition || 'FADE']}</span>
                </div>
              </div>

              {/* Screen HUD Overlay - Center (only if no media URL) */}
              {!(currentContent?.thumbnailUrl || currentContent?.fileUrl || (currentContent as any)?.url) && (
                <div className="relative z-10 text-center my-auto px-4">
                  <div className="inline-flex p-3 rounded-2xl bg-black/50 backdrop-blur-md border border-white/15 mb-2">
                    {isVideo ? (
                      <Video className="w-8 h-8 text-[#38BDF8]" />
                    ) : isDoc ? (
                      <FileText className="w-8 h-8 text-[#EC4899]" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#10B981]" />
                    )}
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white font-display drop-shadow-md">
                    {currentContent?.name || 'Mídia em Exibição'}
                  </h2>
                </div>
              )}

              {/* Screen HUD Overlay - Bottom Item Progress */}
              <div className="relative z-10 space-y-1.5 p-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-white/80">
                  <span className="text-white font-semibold truncate max-w-[60%]">{currentContent?.name || `Item ${currentIndex + 1}`}</span>
                  <span className="text-white/60">{Math.floor(itemTimeElapsed)}s / {itemDuration}s</span>
                </div>
                {/* Micro Item Progress Bar */}
                <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/10">
                  <div
                    style={{ width: `${(itemTimeElapsed / itemDuration) * 100}%` }}
                    className="h-full bg-[#06B6D4] transition-all duration-100 ease-linear shadow-lg"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls & Overall Timeline Bar */}
        <div className="p-4 border-t border-white/10 bg-[#0B1120] space-y-3">
          {/* Overall Timeline Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-[#94A3B8]">
              <span className="text-[#38BDF8] font-bold">
                {formatDurationClock(Math.floor(cumulativeElapsed))}
              </span>
              <span>Tempo Total do Loop: {formatDurationClock(totalPlaylistDuration)}</span>
            </div>
            <div className="w-full h-2 bg-[#070B14] rounded-full overflow-hidden border border-white/10">
              <div
                style={{
                  width: `${(cumulativeElapsed / Math.max(totalPlaylistDuration, 1)) * 100}%`,
                }}
                className="h-full bg-gradient-to-r from-[#2563EB] to-[#06B6D4] transition-all duration-100"
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between gap-4">
            {/* Left: Previous, Play/Pause, Next, Reset */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevious}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                title="Mídia Anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/25 transition-transform active:scale-95 cursor-pointer"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                title="Próxima Mídia"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#94A3B8] hover:text-white transition-colors cursor-pointer ml-1"
                title="Reiniciar Loop"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Loop toggle */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLooping(!isLooping)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                  isLooping
                    ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                    : 'bg-white/5 text-[#64748B] border-white/10 hover:text-white'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>Loop Contínuo: {isLooping ? 'Ativo' : 'Desativado'}</span>
              </button>
            </div>
          </div>

          {/* Bottom Thumbnails Sequence Reel */}
          <div className="pt-2 border-t border-white/5 overflow-x-auto nexora-scrollbar">
            <div className="flex items-center gap-2 min-w-max pb-1">
              {enabledItems.map((item, idx) => {
                const isActive = idx === currentIndex;
                const c = item.content;
                return (
                  <button
                    key={item.id || idx}
                    type="button"
                    onClick={() => handleJumpToIndex(idx)}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2563EB]/25 border-[#38BDF8] ring-1 ring-[#38BDF8]'
                        : 'bg-[#070B14] border-white/10 hover:border-white/20 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-[#64748B] pl-1">
                      #{idx + 1}
                    </span>
                    <div
                      className={`w-8 h-6 rounded bg-gradient-to-br ${
                        c?.thumbnailGradient || 'from-slate-800 to-slate-900'
                      } flex items-center justify-center text-[10px] text-white overflow-hidden`}
                    >
                      {c?.thumbnailUrl ? (
                        <img src={c.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Film className="w-3 h-3" />
                      )}
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="text-[11px] font-medium text-[#F8FAFC] truncate max-w-[100px]">
                        {c?.name || `Item ${idx + 1}`}
                      </p>
                      <span className="text-[9px] font-mono text-[#06B6D4]">
                        {item.duration}s
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
