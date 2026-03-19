import React from 'react';

export default function Card({
  children,
  onClick,
  className = '',
  active = false,
  padding = 'p-4',
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-surface-elevated border border-border rounded-2xl
        transition-all duration-200 ease-out
        ${padding}
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30 active:scale-[0.98]' : ''}
        ${active ? 'border-primary shadow-md shadow-primary/15' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
