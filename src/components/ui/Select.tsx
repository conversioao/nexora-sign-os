import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  options,
  helperText,
  error,
  className = '',
  id,
  disabled,
  ...props
}) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="flex flex-col gap-1.5 w-full text-left">
      {label && (
        <label htmlFor={selectId} className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          {label}
        </label>
      )}
      <div className="relative w-full">
        <select
          id={selectId}
          disabled={disabled}
          className={`w-full appearance-none bg-[#0B1120] text-[#F8FAFC] text-sm rounded-lg pl-3.5 pr-10 py-2.5 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            error ? 'border-[#EF4444] focus:ring-[#EF4444]/30 focus:border-[#EF4444]' : 'border-white/10 hover:border-white/20'
          } ${className}`}
          {...props}
        >
          { (options || []).map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-[#0F172A] text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
      </div>
      {error && <p className="text-xs font-medium text-[#EF4444]">{error}</p>}
      {!error && helperText && <p className="text-xs text-[#64748B]">{helperText}</p>}
    </div>
  );
};
