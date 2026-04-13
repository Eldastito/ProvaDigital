import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ForgeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const ForgeInput: React.FC<ForgeInputProps> = ({
  label,
  helperText,
  error,
  icon,
  iconRight,
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `forge-input-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-1.5`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[var(--forge-text-secondary)] uppercase tracking-wider ml-1"
        >
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--forge-text-muted)] group-focus-within:text-[var(--forge-brand-primary)] transition-colors">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`
            w-full
            bg-[var(--forge-bg-muted)]
            border ${error ? 'border-[var(--forge-color-danger)]' : 'border-[var(--forge-border-default)]'}
            text-[var(--forge-text-primary)]
            rounded-xl py-3 ${icon ? 'pl-12' : 'pl-4'} ${iconRight ? 'pr-12' : 'pr-4'}
            outline-none
            focus:border-[var(--forge-brand-primary)] focus:ring-2 focus:ring-[var(--forge-brand-primary)]/20
            transition-all duration-200
            placeholder:text-[var(--forge-text-muted)]
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `.replace(/\s+/g, ' ').trim()}
          {...props}
        />
        {iconRight && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--forge-text-muted)]">
            {iconRight}
          </div>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--forge-color-danger)] ml-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[var(--forge-text-muted)] ml-1">{helperText}</p>
      )}
    </div>
  );
};

interface ForgeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const ForgeTextarea: React.FC<ForgeTextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `forge-textarea-${label?.toLowerCase().replace(/\s+/g, '-') || 'field'}`;

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[var(--forge-text-secondary)] uppercase tracking-wider ml-1"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full
          bg-[var(--forge-bg-muted)]
          border ${error ? 'border-[var(--forge-color-danger)]' : 'border-[var(--forge-border-default)]'}
          text-[var(--forge-text-primary)]
          rounded-xl py-3 px-4
          outline-none
          focus:border-[var(--forge-brand-primary)] focus:ring-2 focus:ring-[var(--forge-brand-primary)]/20
          transition-all duration-200
          placeholder:text-[var(--forge-text-muted)]
          resize-y min-h-[100px]
          ${className}
        `.replace(/\s+/g, ' ').trim()}
        {...props}
      />
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-[var(--forge-color-danger)] ml-1">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="text-xs text-[var(--forge-text-muted)] ml-1">{helperText}</p>
      )}
    </div>
  );
};
