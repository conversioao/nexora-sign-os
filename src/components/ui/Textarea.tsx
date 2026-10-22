import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className = '', id, disabled, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full text-left">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          disabled={disabled}
          className={`w-full bg-[#0B1120] text-[#F8FAFC] placeholder-[#64748B] text-sm rounded-lg px-3.5 py-2.5 border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/40 focus:border-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed resize-y min-h-[90px] ${
            error ? 'border-[#EF4444] focus:ring-[#EF4444]/30 focus:border-[#EF4444]' : 'border-white/10 hover:border-white/20'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs font-medium text-[#EF4444]">{error}</p>}
        {!error && helperText && <p className="text-xs text-[#64748B]">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
