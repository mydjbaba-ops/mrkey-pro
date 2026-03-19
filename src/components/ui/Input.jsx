import React from 'react';
import { Search, X } from 'lucide-react';

export default function Input({
  label,
  error,
  search = false,
  clearable = false,
  onClear,
  className = '',
  ...rest
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-text-secondary pl-1">
          {label}
        </label>
      )}
      <div className="relative">
        {search && (
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        )}
        <input
          className={`
            w-full bg-surface-elevated border border-border rounded-xl
            py-2.5 text-sm text-text-primary font-sans
            placeholder:text-text-muted
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15
            transition-all duration-200
            ${search ? 'pl-10' : 'px-4'}
            ${clearable && rest.value ? 'pr-10' : 'pr-4'}
            ${error ? 'border-danger focus:border-danger focus:ring-danger/15' : ''}
          `}
          {...rest}
        />
        {clearable && rest.value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-danger pl-1">{error}</p>
      )}
    </div>
  );
}
