import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-xs text-[#64748B] ${className}`}>
      <div className="flex items-center gap-1.5 hover:text-[#94A3B8] transition-colors">
        <Home className="w-3.5 h-3.5" />
      </div>
      { (items || []).map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0" />
            {isLast || item.active ? (
              <span className="font-semibold text-[#F8FAFC] tracking-tight">{item.label}</span>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="hover:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
