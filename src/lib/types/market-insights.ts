/**
 * Market Insights Types
 * 
 * Type definitions for market trends and life event predictions
 */

export interface MarketTrend {
    id: string;
    title: string;
    description: string;
    trend: 'up' | 'down' | 'stable';
    percentage: number;
    timeframe: string;
    category: 'pricing' | 'inventory' | 'demand' | 'demographics';
    location: string;
    confidence: number;
}

export interface LifeEvent {
    id: string;
    type: 'marriage' | 'divorce' | 'job_change' | 'retirement' | 'birth' | 'death';
    location: string;
    predictedCount: number;
    timeframe: string;
    confidence: number;
    marketImpact: 'high' | 'medium' | 'low';
    description: string;
}

export interface MarketInsightsFilters {
    location: string;
    timeframe: string;
}

export type MarketInsightsTab = 'trends' | 'life-events';