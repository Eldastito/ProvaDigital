import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circle' | 'card' | 'avatar';
  width?: string;
  height?: string;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  lines = 1,
}) => {
  const baseClass = `
    animate-pulse rounded-xl
    bg-[var(--forge-border-default)]
  `.replace(/\s+/g, ' ').trim();

  if (variant === 'circle') {
    return (
      <div
        className={`${baseClass} rounded-full ${className}`}
        style={{ width: width || '40px', height: height || '40px' }}
      />
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className={`${baseClass} rounded-full`} style={{ width: '40px', height: '40px' }} />
        <div className="flex-1 space-y-2">
          <div className={baseClass} style={{ width: '60%', height: '12px' }} />
          <div className={baseClass} style={{ width: '40%', height: '10px' }} />
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`rounded-xl border border-[var(--forge-border-default)] p-6 space-y-4 ${className}`}>
        <div className={baseClass} style={{ width: '40%', height: '16px' }} />
        <div className="space-y-2">
          <div className={baseClass} style={{ width: '100%', height: '12px' }} />
          <div className={baseClass} style={{ width: '80%', height: '12px' }} />
          <div className={baseClass} style={{ width: '60%', height: '12px' }} />
        </div>
        <div className="flex gap-2 pt-2">
          <div className={`${baseClass} rounded-lg`} style={{ width: '80px', height: '32px' }} />
          <div className={`${baseClass} rounded-lg`} style={{ width: '80px', height: '32px' }} />
        </div>
      </div>
    );
  }

  // text variant
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={baseClass}
          style={{
            width: width || (i === lines - 1 ? '60%' : '100%'),
            height: height || '12px',
          }}
        />
      ))}
    </div>
  );
};
