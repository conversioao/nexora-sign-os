import React from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}) => {
  const switchId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {(label || description) && (
        <label htmlFor={switchId} className="flex flex-col cursor-pointer select-none">
          {label && <span className="text-sm font-medium text-[#F8FAFC]">{label}</span>}
          {description && <span className="text-xs text-[#64748B]">{description}</span>}
        </label>
      )}
      <button
        type="button"
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/50 disabled:opacity-50 disabled:cursor-not-allowed ${
          checked ? 'bg-[#2563EB]' : 'bg-[#1E293B]'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
};
