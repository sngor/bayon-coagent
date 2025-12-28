'use client';

import React, { useMemo } from 'react';
import { 
    Home, 
    Calculator, 
    TrendingUp, 
    FileText, 
    Camera, 
    Users, 
    Calendar,
    Search,
    BarChart3,
    Brain,
    type LucideIcon 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Loading } from './loading';

// Real estate specific feature types aligned with hub architecture
type RealEstateFeatureType = 
    | 'dashboard'
    | 'assistant' 
    | 'brand'
    | 'studio'
    | 'research'
    | 'market'
    | 'tools'
    | 'library'
    | 'clients'
    | 'open-house'
    | 'learning'
    | 'default';

interface RealEstateLoadingProps {
    featureType: RealEstateFeatureType;
    stage?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showProgress?: boolean;
    progress?: number;
}

const REAL_ESTATE_ICONS: Record<RealEstateFeatureType, LucideIcon> = {
    dashboard: BarChart3,
    assistant: Brain,
    brand: TrendingUp,
    studio: Camera,
    research: Search,
    market: TrendingUp,
    tools: Calculator,
    library: FileText,
    clients: Users,
    'open-house': Home,
    learning: FileText,
    default: Home,
} as const;

const REAL_ESTATE_MESSAGES: Record<RealEstateFeatureType, string> = {
    dashboard: 'Loading your performance dashboard...',
    assistant: 'AI assistant is thinking...',
    brand: 'Building your brand strategy...',
    studio: 'Creating stunning content...',
    research: 'Gathering market intelligence...',
    market: 'Analyzing market trends...',
    tools: 'Calculating deal metrics...',
    library: 'Organizing your content library...',
    clients: 'Loading client information...',
    'open-house': 'Preparing open house materials...',
    learning: 'Loading learning modules...',
    default: 'Processing your request...',
} as const;

const STAGE_MESSAGES: Record<string, string> = {
    'analyzing': 'Analyzing market data...',
    'generating': 'Generating personalized content...',
    'processing': 'Processing your images...',
    'calculating': 'Running financial calculations...',
    'researching': 'Researching market trends...',
    'optimizing': 'Optimizing for your market...',
    'finalizing': 'Finalizing your results...',
} as const;

/**
 * Real Estate specific loading component aligned with hub architecture
 * Provides contextual loading states for different real estate workflows
 */
export function RealEstateLoading({
    featureType,
    stage,
    className,
    size = 'md',
    showProgress = false,
    progress = 0
}: RealEstateLoadingProps) {
    const IconComponent = REAL_ESTATE_ICONS[featureType];
    const baseMessage = REAL_ESTATE_MESSAGES[featureType];
    const stageMessage = stage ? STAGE_MESSAGES[stage] || stage : undefined;
    const displayMessage = stageMessage || baseMessage;

    const progressBar = useMemo(() => {
        if (!showProgress) return null;
        
        return (
            <div className="w-full bg-muted rounded-full h-2 mt-3">
                <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
            </div>
        );
    }, [showProgress, progress]);

    return (
        <div className={cn(
            "flex flex-col items-center gap-4 p-6 rounded-xl",
            "bg-gradient-to-br from-primary/5 via-transparent to-transparent",
            "border border-primary/20",
            className
        )}>
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-full animate-pulse" />
                <IconComponent 
                    className={cn(
                        'animate-spin relative z-10 text-primary',
                        size === 'sm' && 'h-6 w-6',
                        size === 'md' && 'h-8 w-8',
                        size === 'lg' && 'h-12 w-12'
                    )} 
                />
            </div>
            
            <div className="text-center space-y-1">
                <p className="font-medium text-sm">{displayMessage}</p>
                {stage && (
                    <p className="text-xs text-muted-foreground">
                        This may take a few moments...
                    </p>
                )}
            </div>
            
            {progressBar}
        </div>
    );
}

// Specialized loading components for common real estate workflows
export function ContentGenerationLoading({ progress }: { progress?: number }) {
    return (
        <RealEstateLoading 
            featureType="studio"
            stage="generating"
            showProgress={true}
            progress={progress}
        />
    );
}

export function MarketAnalysisLoading({ progress }: { progress?: number }) {
    return (
        <RealEstateLoading 
            featureType="market"
            stage="analyzing"
            showProgress={true}
            progress={progress}
        />
    );
}

export function DealCalculationLoading() {
    return (
        <RealEstateLoading 
            featureType="tools"
            stage="calculating"
        />
    );
}

export function AIAssistantLoading() {
    return (
        <RealEstateLoading 
            featureType="assistant"
            size="lg"
        />
    );
}