import React from 'react';
import { Inbox } from 'lucide-react';
import { ForgeButton } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-[var(--forge-bg-muted)] flex items-center justify-center text-[var(--forge-text-muted)] mb-4">
        {icon || <Inbox size={28} />}
      </div>
      <h3 className="text-lg font-bold text-[var(--forge-text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--forge-text-secondary)] max-w-md mb-6">{description}</p>
      )}
      {action && (
        <ForgeButton variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </ForgeButton>
      )}
    </div>
  );
};
