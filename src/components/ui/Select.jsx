import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-text-secondary pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={`
            w-full appearance-none bg-surface-elevated border border-border rounded-xl
            py-2.5 pl-4 pr-10 text-sm font-sans
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15
            transition-all duration-200 cursor-pointer
            ${value ? 'text-text-primary' : 'text-text-muted'}
          `}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        />
      </div>
    </div>
  );
}
