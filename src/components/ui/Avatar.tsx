import React from 'react';
import { ComponentSize } from '../../types/theme';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: ComponentSize | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  status,
  className = '',
}) => {
  const getInitials = (n?: string) => {
    if (!n) return '?';
    return n
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const sizeStyles: Record<string, { box: string; text: string; statusBox: string }> = {
    sm: { box: 'w-7 h-7', text: 'text-[10px]', statusBox: 'w-2 h-2 bottom-0 right-0' },
    md: { box: 'w-9 h-9', text: 'text-xs', statusBox: 'w-2.5 h-2.5 bottom-0 right-0' },
    lg: { box: 'w-11 h-11', text: 'text-sm', statusBox: 'w-3 h-3 bottom-0 right-0' },
    xl: { box: 'w-14 h-14', text: 'text-base', statusBox: 'w-3.5 h-3.5 bottom-0 right-0' },
  };

  const statusColors = {
    online: 'bg-[#10B981]',
    offline: 'bg-[#64748B]',
    busy: 'bg-[#EF4444]',
    away: 'bg-[#F59E0B]',
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <div className={`relative inline-block select-none ${className}`}>
      <div
        className={`flex items-center justify-center rounded-full font-semibold font-display overflow-hidden border border-white/10 bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-[#F8FAFC] ${currentSize.box} ${currentSize.text}`}
      >
        {src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute rounded-full border-2 border-[#0B1120] ${currentSize.statusBox} ${statusColors[status]}`}
        />
      )}
    </div>
  );
};
