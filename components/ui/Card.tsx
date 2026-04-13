import React from 'react';

type CardVariant = 'default' | 'glass' | 'elevated' | 'outlined' | 'deep';

interface ForgeCardProps {
  variant?: CardVariant;
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  hover?: boolean;
}

interface ForgeCardHeaderProps {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

interface ForgeCardBodyProps {
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    bg-[var(--forge-bg-surface)]
    border border-[var(--forge-border-default)]
    shadow-[var(--forge-shadow-sm)]
  `,
  glass: `
    backdrop-blur-xl
    bg-[var(--forge-glass-bg)]
    border border-[var(--forge-glass-border)]
    shadow-[var(--forge-shadow-md)]
  `,
  elevated: `
    bg-[var(--forge-bg-surface)]
    border border-[var(--forge-border-subtle)]
    shadow-[var(--forge-shadow-lg)]
  `,
  outlined: `
    bg-transparent
    border-2 border-[var(--forge-border-default)]
  `,
  deep: `
    bg-[var(--forge-bg-deep)]
    border border-[var(--forge-border-default)]
    shadow-[var(--forge-shadow-lg)]
    text-[var(--forge-text-inverse)]
  `,
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const ForgeCard: React.FC<ForgeCardProps> = ({
  variant = 'default',
  children,
  className = '',
  padding = 'md',
  onClick,
  hover = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl overflow-hidden
        transition-all duration-300 ease-out
        ${variantStyles[variant]}
        ${paddingStyles[padding]}
        ${hover ? 'hover:shadow-[var(--forge-shadow-lg)] hover:-translate-y-0.5 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {children}
    </div>
  );
};

export const ForgeCardHeader: React.FC<ForgeCardHeaderProps> = ({
  children,
  className = '',
  icon,
  action,
}) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    <div className="flex items-center gap-3">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-[var(--forge-interactive-bg-active)] flex items-center justify-center text-[var(--forge-brand-primary)]">
          {icon}
        </div>
      )}
      <div>{children}</div>
    </div>
    {action && <div>{action}</div>}
  </div>
);

export const ForgeCardBody: React.FC<ForgeCardBodyProps> = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);
