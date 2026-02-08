import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  width?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className,
  width = 'max-w-md',
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/40 backdrop-blur-sm p-4 sm:p-6 md:p-20 animate-in fade-in duration-200">
      <div
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className={cn(
        "relative w-full transform rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 border border-gray-100 animate-in zoom-in-95 duration-200",
        width,
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-text-primary">
            {title}
          </h3>
          <button
            type="button"
            className="p-1 rounded-lg bg-transparent text-text-tertiary hover:bg-gray-100 hover:text-text-primary focus:outline-none transition-colors"
            onClick={onClose}
          >
            <span className="sr-only">Close</span>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="bg-gray-50/50 px-6 py-4 sm:flex sm:flex-row-reverse rounded-b-2xl border-t border-gray-100 gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
