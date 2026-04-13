import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ForgeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-[var(--forge-brand-primary)] to-[var(--forge-brand-secondary)]
    text-white font-bold
    shadow-md hover:shadow-lg hover:shadow-[var(--forge-brand-primary)]/25
    hover:scale-[1.02] active:scale-[0.98]
  `,
  secondary: `
    bg-[var(--forge-bg-muted)] text-[var(--forge-text-primary)]
    border border-[var(--forge-border-default)]
    hover:bg-[var(--forge-interactive-bg-hover)] hover:border-[var(--forge-border-strong)]
  `,
  ghost: `
    bg-transparent text-[var(--forge-text-secondary)]
    hover:bg-[var(--forge-interactive-bg-hover)] hover:text-[var(--forge-text-primary)]
  `,
  danger: `
    bg-[var(--forge-color-danger)] text-white font-bold
    shadow-md hover:shadow-lg hover:shadow-red-500/25
    hover:brightness-110 active:scale-[0.98]
  `,
  success: `
    bg-gradient-to-r from-[var(--forge-brand-teal)] to-[var(--forge-brand-mint)]
    text-white font-bold
    shadow-md hover:shadow-lg hover:shadow-emerald-500/25
    hover:scale-[1.02] active:scale-[0.98]
  `,
  outline: `
    bg-transparent text-[var(--forge-brand-primary)]
    border-2 border-[var(--forge-brand-primary)]
    hover:bg-[var(--forge-brand-primary)] hover:text-white
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-xs gap-1.5 rounded-lg',
  md: 'px-5 py-3 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-4 text-base gap-2.5 rounded-xl',
};

export const ForgeButton: React.FC<ForgeButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center
        transition-all duration-300 ease-out
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--forge-brand-primary)]
        disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} className="animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {iconRight && !loading && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
};
