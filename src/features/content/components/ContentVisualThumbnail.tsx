import React, { useState } from 'react';
import { Film, Image as ImageIcon, FileText, Play, AlertCircle, RefreshCw } from 'lucide-react';
import { ContentItem } from '../../../types/domain';
import { formatDuration } from '../utils/contentFormatters';
import { getApiUrl } from '../../../config/api';

interface ContentVisualThumbnailProps {
  content: ContentItem;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showOverlayIcons?: boolean;
}

const isVideoUrl = (url?: string): boolean => {
  if (!url) return false;
  return /\.(mp4|webm|mov|m4v|mkv|avi)(\?.*)?$/i.test(url) || url.startsWith('data:video/');
};

export const ContentVisualThumbnail: React.FC<ContentVisualThumbnailProps> = ({
  content,
  className = '',
  size = 'md',
  showOverlayIcons = true,
}) => {
  const isVideo = content.type === 'VIDEO';
  const isImage = content.type === 'IMAGE';
  const isPdf = content.type === 'PDF';
  const isProcessing = content.status === 'PROCESSING';
  const isError = content.status === 'ERROR';

  const [videoError, setVideoError] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Determine aspect ratio class
  const getAspectRatioClass = () => {
    switch (content.orientation) {
      case 'PORTRAIT':
        return 'aspect-[9/16]';
      case 'SQUARE':
        return 'aspect-square';
      case 'LANDSCAPE':
      default:
        return 'aspect-[16/9]';
    }
  };

  // Gradient selection
  const gradient =
    content.thumbnailGradient ||
    (isVideo
      ? 'from-blue-900 via-indigo-950 to-slate-900'
      : isPdf
      ? 'from-purple-900 via-slate-900 to-indigo-950'
      : 'from-amber-900 via-slate-900 to-stone-950');

  const rawMediaUrl = content.fileUrl || (content as any).url || content.thumbnailUrl || '';
  const mediaUrl = rawMediaUrl ? getApiUrl(rawMediaUrl) : '';
  const rawStaticThumb = content.thumbnailUrl || '';
  const staticThumb = rawStaticThumb ? getApiUrl(rawStaticThumb) : '';

  // A static thumbnail is valid only if it is NOT a video file itself
  const staticThumbIsVideo = isVideoUrl(staticThumb);
  const hasStaticImage =
    !imageError &&
    !staticThumbIsVideo &&
    (isImage || (!!staticThumb && !isVideoUrl(staticThumb))) &&
    ((staticThumb && (staticThumb.startsWith('http') || staticThumb.startsWith('data:'))) ||
      (isImage && mediaUrl && (mediaUrl.startsWith('http') || mediaUrl.startsWith('data:'))));

  const hasVideoMedia =
    !videoError &&
    isVideo &&
    mediaUrl &&
    (mediaUrl.startsWith('http') || mediaUrl.startsWith('data:') || mediaUrl.startsWith('/'));

  return (
    <div
      className={`relative w-full overflow-hidden rounded-lg bg-gradient-to-br ${gradient} border border-white/10 flex flex-col justify-between p-3 select-none group/thumb ${getAspectRatioClass()} ${className}`}
    >
      {/* 1. Static Image or Custom Thumbnail */}
      {hasStaticImage ? (
        <img
          src={staticThumb || mediaUrl}
          alt={content.name}
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : hasVideoMedia ? (
        /* 2. Real Video Frame as Thumbnail */
        <video
          src={`${mediaUrl}#t=0.5`}
          preload="metadata"
          muted
          playsInline
          crossOrigin="anonymous"
          onError={() => setVideoError(true)}
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        />
      ) : null}

      {/* Dark overlay for contrast */}
      <div className={`absolute inset-0 z-0 pointer-events-none ${hasStaticImage || hasVideoMedia ? 'bg-black/35' : 'bg-black/40'}`} />

      {/* Top Bar inside Thumbnail */}
      <div className="relative z-10 flex items-center justify-between gap-1">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-white/90 border border-white/10 font-mono">
          {isVideo && <Film className="w-3 h-3 text-[#38BDF8]" />}
          {isImage && <ImageIcon className="w-3 h-3 text-[#60A5FA]" />}
          {isPdf && <FileText className="w-3 h-3 text-[#C084FC]" />}
          {content.aspectRatio || (content.orientation === 'PORTRAIT' ? '9:16' : '16:9')}
        </span>

        {content.resolution && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-slate-300 border border-white/10 truncate max-w-[100px]">
            {content.resolution.split(' ')[0]}
          </span>
        )}
      </div>

      {/* Center Visual Representation */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center my-auto px-2 pointer-events-none">
        {isProcessing ? (
          <div className="flex flex-col items-center gap-1.5 text-[#38BDF8]">
            <RefreshCw className="w-6 h-6 animate-spin text-[#38BDF8]" />
            <span className="text-[11px] font-medium text-slate-200">Processando Mídia...</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-1 text-[#EF4444]">
            <AlertCircle className="w-6 h-6 text-[#EF4444]" />
            <span className="text-[10px] font-medium">Codec Incompatível</span>
          </div>
        ) : isVideo ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg text-white group-hover/thumb:scale-110 group-hover/thumb:bg-blue-600/80 transition-all">
              <Play className="w-5 h-5 fill-white translate-x-0.5 text-white" />
            </div>
            {!hasVideoMedia && !hasStaticImage && (
              <p className="text-[11px] font-medium text-white/90 line-clamp-1 max-w-[90%] drop-shadow-sm mt-1">
                {content.name}
              </p>
            )}
          </div>
        ) : isPdf ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-11 rounded bg-white/15 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-lg text-[#C084FC] group-hover/thumb:scale-105 transition-all">
              <FileText className="w-5 h-5 text-[#C084FC]" />
              <span className="text-[8px] font-mono text-white/80 font-bold uppercase mt-0.5">PDF</span>
            </div>
            <p className="text-[11px] font-medium text-white/90 line-clamp-1 max-w-[90%] drop-shadow-sm">
              {content.name}
            </p>
          </div>
        ) : !hasStaticImage ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-[#60A5FA] group-hover/thumb:scale-105 transition-all">
              <ImageIcon className="w-5 h-5 text-[#60A5FA]" />
            </div>
            <p className="text-[11px] font-medium text-white/90 line-clamp-1 max-w-[90%] drop-shadow-sm">
              {content.name}
            </p>
          </div>
        ) : null}
      </div>

      {/* Bottom Bar inside Thumbnail */}
      <div className="relative z-10 flex items-center justify-between text-[11px]">
        {/* Duration for video or Page Count for PDF */}
        {isVideo && content.duration ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[#38BDF8] border border-[#38BDF8]/20">
            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
            {formatDuration(content.duration)}
          </span>
        ) : isPdf && content.metadata.pageCount ? (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-[#C084FC] border border-[#C084FC]/20">
            {content.metadata.pageCount} {content.metadata.pageCount === 1 ? 'pág' : 'páginas'}
          </span>
        ) : (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-slate-300 border border-white/10">
            {content.mimeType.split('/')[1]?.toUpperCase() || 'MÍDIA'}
          </span>
        )}

        {/* Code indicator */}
        <span className="text-[10px] font-mono text-slate-300/80 bg-black/40 px-1.5 py-0.5 rounded">
          {content.code}
        </span>
      </div>

      {/* Subtle Hover Glow */}
      <div className="absolute inset-0 bg-blue-500/0 group-hover/thumb:bg-blue-500/5 transition-colors pointer-events-none" />
    </div>
  );
};
