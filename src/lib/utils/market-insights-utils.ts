/**
 * Market Insights Utilities
 * 
 * Helper functions for market insights display and formatting
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { MarketTrend, LifeEvent } from '@/lib/types/market-insights';

export function getTrendIcon(trend: MarketTrend['trend']) {
    switch (trend) {
        case 'up':
            return TrendingUp;
        case 'down':
            return TrendingDown;
        default:
            return TrendingUp;
    }
}

export function getTrendColor(trend: MarketTrend['trend']): string {
    switch (trend) {
        case 'up':
            return 'text-green-600';
        case 'down':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
}

export function getLifeEventIcon(type: LifeEvent['type']): string {
    const iconMap: Record<LifeEvent['type'], string> = {
        marriage: '💒',
        divorce: '💔',
        job_change: '💼',
        retirement: '🏖️',
        birth: '👶',
        death: '🕊️',
    };
    
    return iconMap[type] || '📅';
}

export function getLifeEventLabel(type: LifeEvent['type']): string {
    const labelMap: Record<LifeEvent['type'], string> = {
        marriage: 'Marriages',
        divorce: 'Divorces',
        job_change: 'Job Changes',
        retirement: 'Retirements',
        birth: 'Births',
        death: 'Deaths',
    };
    
    return labelMap[type] || 'Life Events';
}

export function getImpactColor(impact: LifeEvent['marketImpact']): string {
    const colorMap: Record<LifeEvent['marketImpact'], string> = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800',
    };
    
    return colorMap[impact];
}