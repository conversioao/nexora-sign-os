import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'iconOnly' | 'horizontal';
  showSubtitle?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'compact',
  showSubtitle = false,
  className = '',
}) => {
  const heights: Record<string, number> = { sm: 34, md: 42, lg: 54, xl: 70 };
  const iconHeights: Record<string, number> = { sm: 32, md: 38, lg: 48, xl: 62 };
  const h = heights[size];
  const ih = iconHeights[size];

  if (variant === 'iconOnly') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {/* Icon-only: crop just the left icon portion of the full logo */}
        <div
          style={{
            width: ih,
            height: ih,
            overflow: 'hidden',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <img
            src="/assets/nexora_web_logo.png"
            alt="Nexora"
            style={{
              height: ih,
              width: 'auto',
              objectFit: 'cover',
              objectPosition: 'left center',
              maxWidth: 'none',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center group ${className}`}>
      <img
        src="/assets/nexora_web_logo.png"
        alt="Nexora — Digital Signage"
        style={{ height: h, width: 'auto', maxWidth: '100%', flexShrink: 0 }}
        className="object-contain transition-opacity duration-200 group-hover:opacity-90 drop-shadow-[0_2px_12px_rgba(34,211,238,0.25)]"
      />
    </div>
  );
};
