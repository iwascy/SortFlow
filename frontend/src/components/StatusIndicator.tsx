import React from 'react';
import type { PreviewStatus } from '../types';

interface StatusIndicatorProps {
  status: PreviewStatus;
  className?: string;
  showLabel?: boolean;
}

const STATUS_CONFIG = {
  ready: { color: 'text-emerald-600', icon: 'check_circle', label: 'OK' },
  auto_renamed: { color: 'text-amber-600', icon: 'warning', label: 'Renamed' },
  error: { color: 'text-red-600', icon: 'error', label: 'Error' }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '', showLabel = false }) => {
  const config = STATUS_CONFIG[status];

  return (
    <div className={`flex items-center gap-1 ${config.color} ${className}`} title={config.label}>
      <span className="material-symbols-outlined text-[20px] leading-none">
        {config.icon}
      </span>
      {showLabel && (
          <span className="text-sm font-medium">{config.label}</span>
      )}
    </div>
  );
};
