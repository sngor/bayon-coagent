"use client";

/**
 * Feedback Cue System
 * 
 * Provides comprehensive inline guidance, contextual tooltips, progress indicators,
 * success/error feedback, and loading states with estimated time remaining.
 * Stores seen state in user preferences to avoid repetition.
 * 
 * Requirements: 3.4, 8.1, 8.2, 19.2, 19.5
 */

import * as React from "react";
import {
    HelpCircle,
    CheckCircle,
    AlertCircle,
    Info,
    Loader2,
    X,
    ArrowRight,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Progress } from "./progress";
import { useTooltipContext } from "@/contexts/tooltip-context";

// ============================================================================
// Types and Interfaces
// ============================================================================

export type FeedbackType = "info" | "success" | "warning" | "error" | "help";

export interface FeedbackCueProps {
    /** Unique identifier for this feedback cue */
    id: string;
    /** Type of feedback */
    type: FeedbackType;
    /** Title of the feedback message */
    title: string;
    /** Description or additional details */
    description?: string;
    /** Next steps or actions to take */
    nextSteps?: string[];
    /** Action button configuration */
    action?: {
        label: string;
        onClick: () => void;
    };
    /** Whether this cue can be dismissed */
    dismissible?: boolean;
    /** Callback when dismissed */
    onDismiss?: () => void;
    /** Whether to show only on first interaction */
    showOnce?: boolean;
    /** Additional CSS classes */
    className?: string;
}

export interface ProgressIndicatorProps {
    /** Current step (0-indexed) */
    currentStep: number;
    /** Total number of steps */
    totalSteps: number;
    /** Labels for each step */
    stepLabels?: string[];
    /** Whether to show step numbers */
    showNumbers?: boolean;
    /** Additional CSS classes */
    className?: string;
}

export interface LoadingFeedbackProps {
    /** Loading message */
    message: string;
    /** Estimated time remaining in seconds */
    estimatedTime?: number;
    /** Whether to show a progress bar */
    showProgress?: boolean;
    /** Progress percentage (0-100) */
    progress?: number;
    /** Additional CSS classes */
    className?: string;
}

export interface SuccessErrorFeedbackProps {
    /** Type of feedback */
    type: "success" | "error";
    /** Title of the message */
    title: string;
    /** Description */
    description?: string;
    /** Next steps to take */
    nextSteps?: string[];
    /** Primary action */
    primaryAction?: {
        label: string;
        onClick: () => void;
    };
    /** Secondary action */
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    /** Whether this can be dismissed */
    dismissible?: boolean;
    /** Callback when dismissed */
    onDismiss?: () => void;
    /** Additional CSS classes */
    className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getIconForType(type: FeedbackType) {
    switch (type) {
        case "success":
            return CheckCircle;
        case "error":
            return AlertCircle;
        case "warning":
            return AlertCircle;
        case "info":
            return Info;
        case "help":
            return HelpCircle;
        default:
            return Info;
    }
}

function getColorClassesForType(type: FeedbackType) {
    switch (type) {
        case "success":
            return {
                bg: "bg-success/10 dark:bg-success/20",
                border: "border-success/30",
                icon: "text-success",
                text: "text-success-foreground",
            };
        case "error":
            return {
                bg: "bg-destructive/10 dark:bg-destructive/20",
                border: "border-destructive/30",
                icon: "text-destructive",
                text: "text-destructive-foreground",
            };
        case "warning":
            return {
                bg: "bg-warning/10 dark:bg-warning/20",
                border: "border-warning/30",
                icon: "text-warning",
                text: "text-warning-foreground",
            };
        case "info":
            return {
                bg: "bg-primary/10 dark:bg-primary/20",
                border: "border-primary/30",
                icon: "text-primary",
                text: "text-foreground",
            };
        case "help":
            return {
                bg: "bg-gradient-to-br from-primary/10 to-purple-600/10",
                border: "border-primary/20",
                icon: "text-primary",
                text: "text-foreground",
            };
        default:
            return {
                bg: "bg-muted",
                border: "border-border",
                icon: "text-muted-foreground",
                text: "text-foreground",
            };
    }
}

function formatTime(seconds: number): string {
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0
        ? `${minutes}m ${remainingSeconds}s`
        : `${minutes}m`;
}

// ============================================================================
// Main Feedback Cue Component
// ============================================================================

/**
 * Comprehensive feedback cue component for inline guidance
 */
export function FeedbackCue({
    id,
    type,
    title,
    description,
    nextSteps,
    action,
    dismissible = true,
    onDismiss,
    showOnce = false,
    className,
}: FeedbackCueProps) {
    const [isVisible, setIsVisible] = React.useState(true);
    const { hasSeenTooltip, markTooltipAsSeen } = useTooltipContext();

    // Check if this cue should be shown
    React.useEffect(() => {
        if (showOnce && hasSeenTooltip(id)) {
            setIsVisible(false);
        }
    }, [id, showOnce, hasSeenTooltip]);

    const handleDismiss = async () => {
        setIsVisible(false);
        if (showOnce) {
            await markTooltipAsSeen(id);
        }
        onDismiss?.();
    };

    if (!isVisible) {
        return null;
    }

    const Icon = getIconForType(type);
    const colors = getColorClassesForType(type);

    return (
        <div
            className={cn(
                "relative rounded-lg border p-4 transition-all duration-300",
                colors.bg,
                colors.border,
                className
            )}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", colors.icon)} />
                <div className="flex-1 space-y-2">
                    <div className="space-y-1">
                        <h4 className={cn("font-semibold text-sm", colors.text)}>
                            {title}
                        </h4>
                        {description && (
                            <p className="text-sm text-muted-foreground">{description}</p>
                        )}
                    </div>

                    {nextSteps && nextSteps.length > 0 && (
                        <div className="space-y-1.5 mt-3">
                            <p className="text-xs font-medium text-muted-foreground">
                                Next steps:
                            </p>
                            <ul className="space-y-1">
                                {nextSteps.map((step, index) => (
                                    <li
                                        key={index}
                                        className="flex items-start gap-2 text-sm"
                                    >
                                        <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                        <span>{step}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {action && (
                        <Button
                            onClick={action.onClick}
                            size="sm"
                            variant={type === "error" ? "destructive" : "default"}
                            className="mt-3"
                        >
                            {action.label}
                        </Button>
                    )}
                </div>

                {dismissible && (
                    <button
                        onClick={handleDismiss}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Progress Indicator Component
// ============================================================================

/**
 * Multi-step progress indicator
 */
export function ProgressIndicator({
    currentStep,
    totalSteps,
    stepLabels,
    showNumbers = true,
    className,
}: ProgressIndicatorProps) {
    const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className={cn("space-y-4", className)}>
            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                        Step {currentStep + 1} of {totalSteps}
                    </span>
                    <span className="text-muted-foreground">
                        {Math.round(progressPercentage)}%
                    </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Step labels */}
            {stepLabels && stepLabels.length > 0 && (
                <div className="space-y-2">
                    {stepLabels.map((label, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex items-center gap-3 transition-all duration-300",
                                index === currentStep && "scale-105"
                            )}
                        >
                            {showNumbers && (
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                                        index < currentStep &&
                                        "bg-success text-success-foreground",
                                        index === currentStep &&
                                        "bg-primary text-primary-foreground ring-2 ring-primary/20",
                                        index > currentStep &&
                                        "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {index < currentStep ? (
                                        <CheckCircle className="h-3.5 w-3.5" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                            )}
                            <span
                                className={cn(
                                    "text-sm transition-all duration-300",
                                    index <= currentStep
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground"
                                )}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Loading Feedback Component
// ============================================================================

/**
 * Loading feedback with estimated time remaining
 */
export function LoadingFeedback({
    message,
    estimatedTime,
    showProgress = false,
    progress = 0,
    className,
}: LoadingFeedbackProps) {
    const [elapsedTime, setElapsedTime] = React.useState(0);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const remainingTime = estimatedTime ? Math.max(0, estimatedTime - elapsedTime) : null;

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center p-6 space-y-4",
                className
            )}
        >
            <div className="relative">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>

            <div className="text-center space-y-2">
                <p className="text-sm font-medium">{message}</p>

                {remainingTime !== null && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                            {remainingTime > 0
                                ? `About ${formatTime(remainingTime)} remaining`
                                : "Almost done..."}
                        </span>
                    </div>
                )}
            </div>

            {showProgress && (
                <div className="w-full max-w-xs">
                    <Progress value={progress} className="h-1.5" />
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Success/Error Feedback Component
// ============================================================================

/**
 * Success or error feedback with clear next steps
 */
export function SuccessErrorFeedback({
    type,
    title,
    description,
    nextSteps,
    primaryAction,
    secondaryAction,
    dismissible = true,
    onDismiss,
    className,
}: SuccessErrorFeedbackProps) {
    const [isVisible, setIsVisible] = React.useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
        onDismiss?.();
    };

    if (!isVisible) {
        return null;
    }

    const Icon = type === "success" ? CheckCircle : AlertCircle;
    const colors =
        type === "success"
            ? {
                bg: "bg-success/10 dark:bg-success/20",
                border: "border-success/30",
                icon: "text-success",
            }
            : {
                bg: "bg-destructive/10 dark:bg-destructive/20",
                border: "border-destructive/30",
                icon: "text-destructive",
            };

    return (
        <div
            className={cn(
                "relative rounded-lg border p-6 transition-all duration-300",
                colors.bg,
                colors.border,
                className
            )}
            role="alert"
            aria-live="polite"
        >
            <div className="flex flex-col items-center text-center space-y-4">
                <div
                    className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        type === "success" ? "bg-success/20" : "bg-destructive/20"
                    )}
                >
                    <Icon className={cn("h-6 w-6", colors.icon)} />
                </div>

                <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>

                {nextSteps && nextSteps.length > 0 && (
                    <div className="w-full space-y-2 text-left">
                        <p className="text-xs font-medium text-muted-foreground">
                            Next steps:
                        </p>
                        <ul className="space-y-1.5">
                            {nextSteps.map((step, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm">
                                    <ArrowRight className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-muted-foreground" />
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {(primaryAction || secondaryAction) && (
                    <div className="flex items-center gap-3 w-full">
                        {primaryAction && (
                            <Button
                                onClick={primaryAction.onClick}
                                variant={type === "error" ? "destructive" : "default"}
                                className="flex-1"
                            >
                                {primaryAction.label}
                            </Button>
                        )}
                        {secondaryAction && (
                            <Button
                                onClick={secondaryAction.onClick}
                                variant="outline"
                                className="flex-1"
                            >
                                {secondaryAction.label}
                            </Button>
                        )}
                    </div>
                )}

                {dismissible && (
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Dismiss"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// Contextual Inline Tooltip
// ============================================================================

export interface InlineTooltipProps {
    /** Unique identifier */
    id: string;
    /** Tooltip content */
    content: string;
    /** Whether to show only once */
    showOnce?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * Inline tooltip that appears on first interaction
 */
export function InlineTooltip({
    id,
    content,
    showOnce = true,
    className,
}: InlineTooltipProps) {
    const [isVisible, setIsVisible] = React.useState(true);
    const { hasSeenTooltip, markTooltipAsSeen } = useTooltipContext();

    React.useEffect(() => {
        if (showOnce && hasSeenTooltip(id)) {
            setIsVisible(false);
        }
    }, [id, showOnce, hasSeenTooltip]);

    const handleDismiss = async () => {
        setIsVisible(false);
        if (showOnce) {
            await markTooltipAsSeen(id);
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div
            className={cn(
                "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20 text-xs",
                className
            )}
        >
            <HelpCircle className="h-3.5 w-3.5 text-primary" />
            <span>{content}</span>
            <button
                onClick={handleDismiss}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Dismiss"
                type="button"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );
}
