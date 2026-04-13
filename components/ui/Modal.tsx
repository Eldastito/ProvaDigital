import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';

interface ForgeModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: ModalSize;
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  fullscreen: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] w-full h-full',
};

export const ForgeModal: React.FC<ForgeModalProps> = ({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
  closeOnEscape = true,
  showCloseButton = true,
}) => {
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closeOnEscape) onClose();
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, handleEscape]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 'var(--forge-z-modal, 2000)' }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[var(--forge-bg-overlay)] backdrop-blur-sm animate-in fade-in duration-200"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={`
          relative w-full ${sizeStyles[size]}
          bg-[var(--forge-bg-surface)]
          border border-[var(--forge-border-default)]
          rounded-2xl
          shadow-[var(--forge-shadow-xl)]
          animate-in zoom-in-95 fade-in duration-300
          flex flex-col
          ${size === 'fullscreen' ? '' : 'max-h-[85vh]'}
        `.replace(/\s+/g, ' ').trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--forge-border-default)] shrink-0">
            <div>
              {title && (
                <h2 className="text-lg font-bold text-[var(--forge-text-primary)]">{title}</h2>
              )}
              {subtitle && (
                <p className="text-sm text-[var(--forge-text-secondary)] mt-0.5">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-[var(--forge-text-muted)] hover:text-[var(--forge-text-primary)] hover:bg-[var(--forge-interactive-bg-hover)] transition-all"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--forge-border-default)] shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
