import * as React from "react";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "./card";

/**
 * Skeleton Loader Component
 * Displays a pulsing skeleton that matches the shape of card content
 */
export function SkeletonCard() {
    return (
        <Card className="animate-pulse">
            <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted rounded mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-4 bg-muted rounded w-5/6" />
                    <div className="h-4 bg-muted rounded w-4/6" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * AI Processing Loader Component
 * Displays an animated loader with sparkles for AI operations
 */
interface AILoaderProps {
    message?: string;
    className?: string;
}

export function AILoader({ message, className }: AILoaderProps) {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-8 space-y-4",
                className
            )}
        >
            <div className="relative">
                {/* Outer ring */}
                <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
                {/* Spinning ring */}
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                {/* Sparkles icon in center */}
                <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-sm text-muted-foreground animate-pulse">
                {message || "AI is working its magic..."}
            </p>
        </div>
    );
}

/**
 * Step Loader Component
 * Displays a multi-step progress indicator with completion states
 */
interface StepLoaderProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function StepLoader({
    steps,
    currentStep,
    className,
}: StepLoaderProps) {
    return (
        <div className={cn("space-y-4 p-6", className)}>
            {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3">
                    <div
                        className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 flex-shrink-0",
                            index < currentStep && "bg-success text-success-foreground",
                            index === currentStep &&
                            "bg-primary text-primary-foreground animate-pulse",
                            index > currentStep && "bg-muted text-muted-foreground"
                        )}
                    >
                        {index < currentStep ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                        )}
                    </div>
                    <span
                        className={cn(
                            "text-sm transition-colors duration-300",
                            index <= currentStep
                                ? "text-foreground font-medium"
                                : "text-muted-foreground"
                        )}
                    >
                        {step}
                    </span>
                </div>
            ))}
        </div>
    );
}

/**
 * Generic Skeleton Component
 * A flexible skeleton loader for various content types
 */
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-muted", className)}
            {...props}
        />
    );
}
