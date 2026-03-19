import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const typeConfig = {
  success: {
    bg: 'bg-text-primary',
    icon: CheckCircle,
    iconColor: 'text-success',
  },
  error: {
    bg: 'bg-danger',
    icon: AlertCircle,
    iconColor: 'text-white',
  },
};

export default function Toast({
  message,
  type = 'success',
  visible,
}) {
  const config = typeConfig[type] || typeConfig.success;
  const Icon = config.icon;

  return (
    <div
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-[100]
        transition-all duration-300 ease-out
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3 pointer-events-none'}
      `}
    >
      <div
        className={`
          flex items-center gap-2.5 px-5 py-3 rounded-2xl
          shadow-xl shadow-black/15
          ${config.bg} text-white text-sm font-medium
          animate-fade-up
        `}
      >
        <Icon size={18} className={config.iconColor} />
        <span>{message}</span>
      </div>
    </div>
  );
}
