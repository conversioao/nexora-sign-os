import React from 'react';

interface NexoraCreativeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const NexoraCreativeLogo: React.FC<NexoraCreativeLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const heights = { sm: 28, md: 36, lg: 48, xl: 60 };
  const h = heights[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none group ${className}`}>
      <img
        src="/assets/nexora_creative_logo.jpg"
        alt="NEXORA Creative AI"
        style={{ height: h, width: 'auto', maxWidth: '100%' }}
        className="object-contain rounded-lg transition-transform duration-200 group-hover:scale-105 drop-shadow-[0_0_12px_rgba(0,229,255,0.35)]"
      />
    </div>
  );
};
