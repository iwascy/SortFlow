import React from 'react';

type PreviewStatus = 'ready' | 'auto_renamed' | 'error' | 'pending' | 'success';

interface StatusIndicatorProps {
  status: PreviewStatus | string;
  className?: string;
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<PreviewStatus | string, { color: string, icon: string, label: string }> = {
  ready: { color: 'text-primary', icon: 'check_circle', label: 'OK' },
  auto_renamed: { color: 'text-amber-500', icon: 'warning', label: 'Renamed' },
  error: { color: 'text-red-500', icon: 'error', label: 'Error' },
  pending: { color: 'text-text-tertiary', icon: 'pending', label: 'Pending' },
  success: { color: 'text-emerald-500', icon: 'check_circle', label: 'Success' },
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, className = '', showLabel = false }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.ready;

  return (
    <div className={`flex items-center gap-1.5 ${config.color} ${className}`} title={config.label}>
      <span className="material-symbols-outlined text-[18px] leading-none filled">
        {config.icon}
      </span>
      {showLabel && (
          <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
      )}
    </div>
  );
};
