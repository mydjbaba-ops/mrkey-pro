import React from 'react';

export default function StatBox({
  value,
  label,
  color = 'text-primary',
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        bg-surface-elevated border border-border rounded-2xl
        px-4 py-3 min-w-0 flex-1
        transition-all duration-200 ease-out
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary/30 active:scale-[0.97]' : ''}
      `}
    >
      <span className={`text-2xl font-bold ${color} leading-tight`}>
        {value}
      </span>
      <span className="text-[11px] font-medium text-text-muted mt-1 truncate w-full text-center">
        {label}
      </span>
    </div>
  );
}
