import React from 'react';

type BadgeVariant = 'solid' | 'outline' | 'subtle';
type BadgeColor = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'indigo' | 'brand' | 'teal';
type BadgeSize = 'sm' | 'md';

interface ForgeBadgeProps {
  children?: React.ReactNode;
  color?: BadgeColor;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const colorMap: Record<BadgeColor, Record<BadgeVariant, string>> = {
  green: {
    solid: 'bg-emerald-500 text-white',
    outline: 'border-emerald-300 text-emerald-600 bg-transparent',
    subtle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  red: {
    solid: 'bg-rose-500 text-white',
    outline: 'border-rose-300 text-rose-600 bg-transparent',
    subtle: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  yellow: {
    solid: 'bg-amber-500 text-white',
    outline: 'border-amber-300 text-amber-600 bg-transparent',
    subtle: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  blue: {
    solid: 'bg-sky-500 text-white',
    outline: 'border-sky-300 text-sky-600 bg-transparent',
    subtle: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  gray: {
    solid: 'bg-slate-500 text-white',
    outline: 'border-slate-300 text-slate-600 bg-transparent',
    subtle: 'bg-slate-100 text-slate-700 border-slate-200',
  },
  indigo: {
    solid: 'bg-indigo-500 text-white',
    outline: 'border-indigo-300 text-indigo-600 bg-transparent',
    subtle: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  brand: {
    solid: 'bg-[var(--forge-brand-primary)] text-white',
    outline: 'border-[var(--forge-brand-primary)] text-[var(--forge-brand-primary)] bg-transparent',
    subtle: 'bg-[var(--forge-brand-primary)]/10 text-[var(--forge-brand-primary)] border-[var(--forge-brand-primary)]/20',
  },
  teal: {
    solid: 'bg-[var(--forge-brand-teal)] text-white',
    outline: 'border-[var(--forge-brand-teal)] text-[var(--forge-brand-teal)] bg-transparent',
    subtle: 'bg-[var(--forge-brand-teal)]/10 text-[var(--forge-brand-teal)] border-[var(--forge-brand-teal)]/20',
  },
};

const sizeMap: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
};

export const ForgeBadge: React.FC<ForgeBadgeProps> = ({
  children,
  color = 'gray',
  variant = 'subtle',
  size = 'md',
  dot = false,
  icon,
  className = '',
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full font-semibold border
        transition-colors duration-200
        ${colorMap[color][variant]}
        ${sizeMap[size]}
        ${className}
      `.replace(/\s+/g, ' ').trim()}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${variant === 'solid' ? 'bg-white' : `bg-current`}`} />
      )}
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

/* Backward compatible export */
export const Badge = ForgeBadge;
