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
        return <span className="material-symbols-outlined text-red-600">warning</span>;
      case 'warning':
        return <span className="material-symbols-outlined text-amber-500">warning</span>;
      default:
        return <span className="material-symbols-outlined text-blue-500">info</span>;
    }
  };

  const footer = (
    <>
      <Button
        variant={variant === 'danger' ? 'danger' : 'primary'}
        onClick={onConfirm}
        isLoading={isLoading}
        className="w-full sm:ml-3 sm:w-auto"
      >
        {confirmText}
      </Button>
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={isLoading}
        className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
      >
        {cancelText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          {getIcon()}
          <span>{title}</span>
        </div>
      }
      footer={footer}
    >
      <div className="text-sm text-gray-500">
        {message}
      </div>
    </Modal>
  );
};
