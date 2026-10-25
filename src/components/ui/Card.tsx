import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'blue' | 'cyan' | 'purple' | 'none';
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  glow = 'none',
  className = '',
  ...props
}) => {
  const glowClasses = {
    none: '',
    blue: 'border-[#1677FF]/40 shadow-[0_0_25px_rgba(22,119,255,0.15)]',
    cyan: 'border-[#00E5FF]/40 shadow-[0_0_25px_rgba(0,229,255,0.15)]',
    purple: 'border-[#6D3DF5]/40 shadow-[0_0_25px_rgba(109,61,245,0.15)]',
  };

  return (
    <div
      className={`nexora-card rounded-2xl transition-all duration-300 ${
        hoverEffect ? 'hover:border-cyan-500/30 hover:shadow-[0_10px_35px_rgba(0,0,0,0.6)] hover:-translate-y-0.5' : ''
      } ${glowClasses[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-6 pb-4 border-b border-white/[0.06] flex flex-col gap-1 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3 className={`font-display font-bold text-base text-white tracking-tight ${className}`} {...props}>
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`text-xs text-[#94A3B8] leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-6 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
};

