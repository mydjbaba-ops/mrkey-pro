import React from 'react';

const variantClasses = {
  primary: 'gradient-primary text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 active:scale-[0.97]',
  secondary: 'bg-transparent border-2 border-primary text-primary hover:bg-primary/10 active:scale-[0.97]',
  danger: 'bg-danger text-white shadow-md shadow-danger/25 hover:shadow-lg hover:shadow-danger/35 active:scale-[0.97]',
  success: 'bg-success-dark text-white shadow-md shadow-success-dark/25 hover:shadow-lg hover:shadow-success-dark/35 active:scale-[0.97]',
  ghost: 'bg-transparent text-primary hover:bg-primary/8 active:scale-[0.97]',
};

const sizeClasses = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  children,
  className = '',
  ...rest
}) {
  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center font-semibold font-sans
        transition-all duration-200 ease-out cursor-pointer select-none
        ${variantClasses[variant] || variantClasses.primary}
        ${sizeClasses[size] || sizeClasses.md}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed saturate-50 !shadow-none !scale-100' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}
