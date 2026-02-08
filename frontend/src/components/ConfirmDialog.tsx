import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'info' | 'warning' | 'danger';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>;
      case 'warning':
        return <span className="material-symbols-outlined text-amber-500 text-[24px]">warning</span>;
      default:
        return <span className="material-symbols-outlined text-primary text-[24px]">info</span>;
    }
  };

  const footer = (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={isLoading}
        className="w-full sm:w-auto"
      >
        {cancelText}
      </Button>
      <Button
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onClick={onConfirm}
        isLoading={isLoading}
        className="w-full sm:w-auto"
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          {getIcon()}
          <span>{title}</span>
        </div>
      }
      footer={footer}
    >
      <div className="text-sm text-text-secondary leading-relaxed">
        {message}
      </div>
    </Modal>
  );
};
