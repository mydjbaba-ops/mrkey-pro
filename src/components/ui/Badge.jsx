import React from 'react';

const variantClasses = {
  success: 'bg-success-dark/15 text-success-dark',
  danger: 'bg-danger/15 text-danger',
  warning: 'bg-warning/15 text-warning',
  info: 'bg-accent/15 text-accent',
  neutral: 'bg-text-muted/15 text-text-secondary',
  primary: 'bg-primary/15 text-primary',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  variant = 'neutral',
  size = 'md',
  children,
  className = '',
}) {
  return (
    <span
      className={`
        inline-flex items-center font-semibold rounded-lg select-none whitespace-nowrap
        ${variantClasses[variant] || variantClasses.neutral}
        ${sizeClasses[size] || sizeClasses.md}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
