'use client';

import { Loading, Skeleton } from './loading';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
    className?: string;
    lines?: number;
    showHeader?: boolean;
}

export function SkeletonCard({
    className,
    lines = 3,
    showHeader = true
}: SkeletonCardProps) {
    return (
        <div className={cn("p-4 border rounded-lg space-y-3", className)}>
            {showHeader && <Skeleton className="h-4 w-3/4" />}
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-1/2" : "w-full")} />
            ))}
        </div>
    );
}

interface AILoaderProps {
    message?: string;
    stage?: string;
    className?: string;
}

export function AILoader({
    message = "Processing...",
    stage = "Analyzing",
    className
}: AILoaderProps) {
    return (
        <Loading
            variant="ai"
            size="md"
            message={`${stage}: ${message}`}
            showSubtext={true}
            featureType="content"
            className={className}
        />
    );
}

interface StepLoaderProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function StepLoader({
    steps,
    currentStep,
    className
}: StepLoaderProps) {
    return (
        <div className={cn("space-y-4", className)}>
            <Loading 
                variant="ai" 
                size="md" 
                message={steps[currentStep]} 
                showSubtext={true}
                featureType="content"
            />
            <div className="flex gap-2">
                {steps.map((_, index) => (
                    <div
                        key={index}
                        className={cn(
                            "h-2 rounded-full flex-1 transition-colors",
                            index <= currentStep ? "bg-primary" : "bg-muted"
                        )}
                    />
                ))}
            </div>
            <div className="text-center text-sm text-muted-foreground">
                Step {currentStep + 1} of {steps.length}
            </div>
        </div>
    );
}