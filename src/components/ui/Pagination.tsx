import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './IconButton';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between gap-4 text-xs text-[#94A3B8] ${className}`}>
      {totalItems !== undefined && (
        <div>
          Mostrando{' '}
          <span className="font-semibold text-white">
            {pageSize ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : 1}
          </span>{' '}
          a{' '}
          <span className="font-semibold text-white">
            {pageSize ? Math.min(currentPage * pageSize, totalItems) : totalItems}
          </span>{' '}
          de <span className="font-semibold text-white">{totalItems}</span> registros
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        <IconButton
          icon={<ChevronLeft className="w-4 h-4" />}
          label="Página anterior"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        />

        <div className="px-3 py-1 bg-[#0B1120] border border-white/10 rounded-lg text-xs font-semibold text-white">
          {currentPage} / {Math.max(totalPages, 1)}
        </div>

        <IconButton
          icon={<ChevronRight className="w-4 h-4" />}
          label="Próxima página"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </div>
    </div>
  );
};
