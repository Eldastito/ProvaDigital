
import React from 'react';

interface BadgeProps {
  children?: React.ReactNode;
  color: 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'indigo';
}

export const Badge = ({ children, color }: BadgeProps) => {
  const colors = {
    green: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    red: 'bg-rose-100 text-rose-800 border-rose-200',
    yellow: 'bg-amber-100 text-amber-800 border-amber-200',
    blue: 'bg-sky-100 text-sky-800 border-sky-200',
    gray: 'bg-slate-100 text-slate-800 border-slate-200',
    indigo: 'bg-[#caf0f8] text-[#0077b6] border-[#00b4d8]', // Updated to brand colors
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>{children}</span>;
};
