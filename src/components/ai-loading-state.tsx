'use client';

import React from 'react';
import { Loader2, Sparkles, Brain, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AILoadingStateProps {
    operation: 'blog-post' | 'social-media' | 'listing-description' | 'research' | 'market-analysis';
    stage?: 'analyzing' | 'generating' | 'optimizing' | 'finalizing';
    progress?: number;
    className?: string;
}

const operationConfig = {
    'blog-post': {
        icon: Sparkles,
        title: 'Creating Blog Post',
        stages: {
            analyzing: 'Analyzing your topic and audience...',
            generating: 'Writing engaging content...',
            optimizing: 'Optimizing for SEO...',
            finalizing: 'Adding final touches...'
        }
    },
    'social-media': {
        icon: Zap,
        title: 'Crafting Social Content',
        stages: {
            analyzing: 'Understanding your message...',
            generating: 'Creating engaging posts...',
            optimizing: 'Optimizing for platform...',
            finalizing: 'Adding hashtags and CTAs...'
        }
    },
    'listing-description': {
        icon: Brain,
        title: 'Writing Listing Description',
        stages: {
            analyzing: 'Analyzing property features...',
            generating: 'Crafting compelling description...',
            optimizing: 'Tailoring to buyer persona...',
            finalizing: 'Polishing the final copy...'
        }
    },
    'research': {
        icon: Brain,
        title: 'Conducting Research',
        stages: {
            analyzing: 'Processing your query...',
            generating: 'Gathering information...',
            optimizing: 'Analyzing data sources...',
            finalizing: 'Compiling final report...'
        }
    },
    'market-analysis': {
        icon: Brain,
        title: 'Analyzing Market Data',
        stages: {
            analyzing: 'Collecting market data...',
            generating: 'Running analysis...',
            optimizing: 'Identifying trends...',
            finalizing: 'Generating insights...'
        }
    }
};

export function AILoadingState({
    operation,
    stage = 'analyzing',
    progress,
    className
}: AILoadingStateProps) {
    const config = operationConfig[operation];
    const Icon = config.icon;
    const [dots, setDots] = React.useState('');

    // Animated dots effect
    React.useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 500);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={cn(
            "flex flex-col items-center justify-center p-8 space-y-4",
            "bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20",
            "rounded-lg border border-blue-200 dark:border-blue-800",
            className
        )}>
            {/* Animated Icon */}
            <div className="relative">
                <div className="absolute inset-0 animate-ping">
                    <Icon className="h-8 w-8 text-blue-400 opacity-75" />
                </div>
                <Icon className="relative h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {config.title}
            </h3>

            {/* Stage Description */}
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-xs">
                {config.stages[stage]}{dots}
            </p>

            {/* Progress Bar */}
            {progress !== undefined && (
                <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Spinner */}
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        </div>
    );
}

// Streaming text component for real-time AI output
interface StreamingTextProps {
    text: string;
    isComplete: boolean;
    className?: string;
}

export function StreamingText({ text, isComplete, className }: StreamingTextProps) {
    const [displayText, setDisplayText] = React.useState('');
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (currentIndex < text.length) {
            const timer = setTimeout(() => {
                setDisplayText(text.slice(0, currentIndex + 1));
                setCurrentIndex(currentIndex + 1);
            }, 20); // Adjust speed as needed

            return () => clearTimeout(timer);
        }
    }, [text, currentIndex]);

    React.useEffect(() => {
        setCurrentIndex(0);
        setDisplayText('');
    }, [text]);

    return (
        <div className={cn("relative", className)}>
            <div className="whitespace-pre-wrap">
                {displayText}
                {!isComplete && currentIndex === text.length && (
                    <span className="animate-pulse">|</span>
                )}
            </div>
        </div>
    );
}

// Hook for managing AI operation states
export function useAIOperation() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [stage, setStage] = React.useState<AILoadingStateProps['stage']>('analyzing');
    const [progress, setProgress] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);

    const startOperation = () => {
        setIsLoading(true);
        setStage('analyzing');
        setProgress(0);
        setError(null);
    };

    const updateStage = (newStage: AILoadingStateProps['stage'], newProgress?: number) => {
        setStage(newStage);
        if (newProgress !== undefined) {
            setProgress(newProgress);
        }
    };

    const completeOperation = () => {
        setIsLoading(false);
        setProgress(100);
    };

    const failOperation = (errorMessage: string) => {
        setIsLoading(false);
        setError(errorMessage);
    };

    return {
        isLoading,
        stage,
        progress,
        error,
        startOperation,
        updateStage,
        completeOperation,
        failOperation
    };
}