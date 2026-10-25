import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Film,
  Image as ImageIcon,
} from 'lucide-react';
import { ContentItem } from '../../../types/domain';
import { formatDuration } from '../utils/contentFormatters';
import { getApiUrl } from '../../../config/api';

interface ContentPreviewViewerProps {
  content: ContentItem;
  className?: string;
}

export const ContentPreviewViewer: React.FC<ContentPreviewViewerProps> = ({
  content,
  className = '',
}) => {
  const isVideo = content.type === 'VIDEO';
  const isPdf = content.type === 'PDF';
  const isImage = content.type === 'IMAGE';

  const rawMediaUrl = content.fileUrl || (content as any).url || content.thumbnailUrl || '';
  const mediaUrl = rawMediaUrl ? getApiUrl(rawMediaUrl) : '';
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Video playback states
  const [totalDuration, setTotalDuration] = useState<number>(content.duration || 30);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // PDF navigation states
  const totalPages = content.metadata.pageCount || 4;
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Image zoom state
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Sync totalDuration when content changes
  useEffect(() => {
    if (content.duration) {
      setTotalDuration(content.duration);
    }
  }, [content.duration]);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setTotalDuration(Math.round(videoRef.current.duration));
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch((err) => {
        console.warn('Playback error / Autoplay prevented:', err);
      });
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * totalDuration;
    setCurrentTime(target);
    if (videoRef.current) {
      videoRef.current.currentTime = target;
    }
  };

  const handleRestart = () => {
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const getAspectClass = () => {
    switch (content.orientation) {
      case 'PORTRAIT':
        return 'aspect-[9/16] max-h-[560px]';
      case 'SQUARE':
        return 'aspect-square max-h-[500px]';
      case 'LANDSCAPE':
      default:
        return 'aspect-[16/9] max-h-[460px]';
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden bg-gradient-to-br ${
        content.thumbnailGradient || 'from-slate-900 via-zinc-950 to-black'
      } border border-white/10 shadow-2xl flex flex-col justify-between select-none ${className}`}
    >
      {/* Background Decorative Tech Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0d_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Top Overlay Controls / Format Badges */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold uppercase bg-black/60 backdrop-blur-md text-white border border-white/15 font-mono">
            {isVideo && <Film className="w-3.5 h-3.5 text-[#38BDF8]" />}
            {isImage && <ImageIcon className="w-3.5 h-3.5 text-[#60A5FA]" />}
            {isPdf && <FileText className="w-3.5 h-3.5 text-[#C084FC]" />}
            <span>{content.aspectRatio || (content.orientation === 'PORTRAIT' ? '9:16' : '16:9')}</span>
          </span>

          <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-black/50 backdrop-blur-md text-slate-300 border border-white/10">
            {content.resolution}
          </span>
        </div>

        {/* Status / Zoom Controls */}
        <div className="flex items-center gap-2">
          {isVideo && isPlaying && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Reproduzindo
            </span>
          )}

          {isImage && (
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Reduzir Zoom"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono px-1 text-slate-300">{zoomLevel}%</span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
                title="Aumentar Zoom"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isVideo && mediaUrl && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-slate-300 hover:text-white transition-colors"
              title="Tela Cheia"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Middle Stage: Media Rendering Area */}
      <div
        className={`relative z-10 w-full flex items-center justify-center mx-auto my-auto overflow-hidden ${getAspectClass()}`}
      >
        {isVideo ? (
          mediaUrl ? (
            <div className="relative w-full h-full flex items-center justify-center bg-black/50">
              <video
                ref={videoRef}
                src={mediaUrl}
                playsInline
                autoPlay
                preload="auto"
                crossOrigin="anonymous"
                loop={isLooping}
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />
              {/* Overlay Play Button if Paused */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer backdrop-blur-[2px] transition-all"
                >
                  <div className="w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-2xl transition-all transform hover:scale-110">
                    <Play className="w-8 h-8 fill-white translate-x-0.5 text-white" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center space-y-4 p-6">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white">
                <Play className="w-8 h-8 fill-white translate-x-0.5 text-white" />
              </div>
              <div className="max-w-md">
                <h3 className="text-base font-semibold text-white drop-shadow-md">
                  {content.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 drop-shadow-sm font-mono">
                  {content.metadata?.codec || 'H.264 / AVC'}
                </p>
              </div>
            </div>
          )
        ) : isPdf ? (
          <div className="w-full max-w-sm h-full bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6 flex flex-col justify-between shadow-2xl text-slate-200 m-6">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider text-[#C084FC] font-bold flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                Página {currentPage} de {totalPages}
              </span>
              <span className="text-[10px] font-mono text-slate-400">PDF Document</span>
            </div>

            <div className="my-auto space-y-3 py-4">
              <div className="h-4 bg-white/20 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-white/15 rounded w-full" />
              <div className="h-3 bg-white/15 rounded w-5/6" />
              <div className="h-3 bg-white/15 rounded w-4/6" />
              <div className="h-20 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center justify-center text-xs text-purple-300 font-medium">
                Visualização do Encarte / Catálogo — Folha {currentPage}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          mediaUrl && (mediaUrl.startsWith('http') || mediaUrl.startsWith('data:') || mediaUrl.startsWith('/')) ? (
            <div className="w-full h-full flex items-center justify-center overflow-hidden p-2">
              <img
                src={mediaUrl}
                alt={content.name}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
                style={{ transform: `scale(${zoomLevel / 100})` }}
              />
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center text-center space-y-3 transition-transform duration-200 p-6"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-xl">
                <ImageIcon className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-white drop-shadow-md">{content.name}</h3>
              <span className="text-xs font-mono text-slate-300 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                {content.resolution} • {content.mimeType}
              </span>
            </div>
          )
        )}
      </div>

      {/* Bottom Bar: Player Scrubber and Controls for Video */}
      {isVideo && (
        <div className="relative z-20 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent space-y-2">
          {/* Scrubber timeline */}
          <div
            onClick={handleSeek}
            className="group/scrub relative w-full h-2 bg-white/20 hover:h-3 rounded-full cursor-pointer transition-all overflow-hidden"
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-[#38BDF8] rounded-full relative"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white"
                title={isPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-slate-300 hover:text-white"
                title="Reiniciar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/15 transition-colors text-slate-300 hover:text-white"
                title={isMuted ? 'Ativar Som' : 'Silenciar'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="font-mono text-xs text-slate-300">
                {formatDuration(currentTime)} / {formatDuration(totalDuration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLooping(!isLooping)}
                className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                  isLooping
                    ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                    : 'bg-white/5 border-white/10 text-slate-400'
                }`}
              >
                LOOP
              </button>

              <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
                {content.metadata?.frameRate ? `${content.metadata.frameRate} fps` : '60 fps'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
