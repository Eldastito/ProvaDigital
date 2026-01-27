/**
 * Metrics Card Component
 * 
 * Card reutilizável para exibir métricas.
 * Sprint 0 - Parte 2
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricsCardProps {
    title: string;
    value: number | string;
    icon: LucideIcon;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'violet' | 'amber';
    subtitle?: string;
    loading?: boolean;
    onClick?: () => void;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue',
    subtitle,
    loading = false,
    onClick
}) => {
    // Cores por tipo
    const colorClasses = {
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-600',
            border: 'border-blue-200',
            hover: 'hover:bg-blue-100'
        },
        green: {
            bg: 'bg-green-50',
            text: 'text-green-600',
            border: 'border-green-200',
            hover: 'hover:bg-green-100'
        },
        red: {
            bg: 'bg-red-50',
            text: 'text-red-600',
            border: 'border-red-200',
            hover: 'hover:bg-red-100'
        },
        yellow: {
            bg: 'bg-yellow-50',
            text: 'text-yellow-600',
            border: 'border-yellow-200',
            hover: 'hover:bg-yellow-100'
        },
        violet: {
            bg: 'bg-violet-50',
            text: 'text-violet-600',
            border: 'border-violet-200',
            hover: 'hover:bg-violet-100'
        },
        amber: {
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            border: 'border-amber-200',
            hover: 'hover:bg-amber-100'
        }
    };

    const classes = colorClasses[color];

    // Ícone de tendência
    const getTrendIcon = () => {
        if (!trend) return null;

        if (trend === 'up') {
            return <TrendingUp size={14} className="text-green-600" />;
        } else if (trend === 'down') {
            return <TrendingDown size={14} className="text-red-600" />;
        } else {
            return <Minus size={14} className="text-slate-400" />;
        }
    };

    // Cor do texto de tendência
    const getTrendColor = () => {
        if (trend === 'up') return 'text-green-600';
        if (trend === 'down') return 'text-red-600';
        return 'text-slate-400';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="animate-pulse">
                    <div className="flex items-center justify-between mb-4">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
                    </div>
                    <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`bg-white rounded-xl p-6 border ${classes.border} shadow-sm transition-all ${onClick ? `cursor-pointer ${classes.hover} active:scale-[0.98]` : ''
                }`}
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-slate-400">{subtitle}</p>
                    )}
                </div>
                <div className={`${classes.bg} p-3 rounded-xl`}>
                    <Icon size={24} className={classes.text} />
                </div>
            </div>

            {/* Valor */}
            <div className="mb-2">
                <p className={`text-3xl font-bold ${classes.text}`}>
                    {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
                </p>
            </div>

            {/* Tendência */}
            {trend && trendValue !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
                    {getTrendIcon()}
                    <span>
                        {trendValue > 0 ? '+' : ''}{trendValue}%
                    </span>
                    <span className="text-slate-400 text-xs ml-1">vs. anterior</span>
                </div>
            )}
        </div>
    );
};

export default MetricsCard;
