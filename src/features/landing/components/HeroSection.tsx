import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface HeroSectionProps {
  onOpenPartnerModal: () => void;
  onOpenAdvertiserModal: () => void;
  onOpenVideoModal: () => void;
}

const VIDEO_DURATION = 8; // 8 seconds video

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenPartnerModal,
  onOpenAdvertiserModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [progress, setProgress] = useState(0); // 0 -> 1
  const [isMobile, setIsMobile] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Sync scroll position to video currentTime smoothly
  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { top, height } = container.getBoundingClientRect();
    const viewportH = window.innerHeight;
    const scrollable = height - viewportH;
    if (scrollable <= 0) return;

    const scrolled = -top;
    const currentProgress = Math.min(1, Math.max(0, scrolled / scrollable));

    setProgress(currentProgress);

    // Scrub video
    if (videoRef.current && isVideoLoaded) {
      const targetTime = currentProgress * VIDEO_DURATION;
      if (Math.abs(videoRef.current.currentTime - targetTime) > 0.02) {
        videoRef.current.currentTime = targetTime;
      }
    }
  }, [isVideoLoaded]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleLoadedMetadata = () => {
    setIsVideoLoaded(true);
    if (videoRef.current) {
      videoRef.current.currentTime = progress * VIDEO_DURATION;
    }
  };

  // Text overlays fade out as user scrolls so the video experience is 100% clean
  const headerOpacity = Math.max(0, 1 - progress * 2.5);

  return (
    <div
      ref={containerRef}
      className="relative bg-black"
      style={{ height: isMobile ? '300vh' : '450vh' }}
    >
      {/* ── Sticky Fullscreen Viewport ── */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between bg-black">

        {/* 100% Fullscreen Video Background */}
        <div className="absolute inset-0 z-0 bg-black">
          <video
            ref={videoRef}
            src="/video-hero.mp4"
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
            onLoadedMetadata={handleLoadedMetadata}
          />
          {/* Subtle gradient overlay for text readability at top and bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80 pointer-events-none" />
        </div>

        {/* Top Minimal Brand Subtitle */}
        <div 
          className="relative z-10 pt-28 px-6 sm:px-12 max-w-7xl mx-auto w-full transition-opacity duration-300"
          style={{ opacity: headerOpacity }}
        >
          <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-cyan-400 font-semibold">
            NEXORA OS — DIGITAL OUT-OF-HOME
          </span>
        </div>

        {/* Center Main Headline — Elegant & Clean */}
        <div 
          className="relative z-10 px-6 sm:px-12 max-w-7xl mx-auto w-full my-auto transition-opacity duration-300"
          style={{ opacity: headerOpacity }}
        >
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl sm:text-7xl font-extrabold text-white tracking-tight leading-[1.05] font-display">
              O Seu Espaço.<br />
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                A Sua Rede.
              </span>
            </h1>

            <p className="text-base sm:text-xl text-slate-300 font-light max-w-xl leading-relaxed">
              Transforme telas e ambientes em veículos de mídia de alto impacto. Monetização e gestão em tempo real.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onOpenPartnerModal}
                className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm tracking-wide transition-all shadow-[0_0_25px_rgba(0,217,255,0.4)] flex items-center gap-2 cursor-pointer"
              >
                <span>Monetizar Espaço</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenAdvertiserModal}
                className="px-8 py-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-bold text-sm tracking-wide backdrop-blur-lg transition-all cursor-pointer"
              >
                <span>Anunciar na Rede</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Scroll Indicator */}
        <div className="relative z-10 pb-8 px-6 sm:px-12 max-w-7xl mx-auto w-full flex justify-between items-end text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="tracking-wider text-slate-300 uppercase">ROLE PARA REPRODUZIR O VÍDEO</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">{Math.round(progress * 100)}%</span>
            <ChevronDown className="w-4 h-4 animate-bounce text-cyan-400" />
          </div>
        </div>

      </div>
    </div>
  );
};
