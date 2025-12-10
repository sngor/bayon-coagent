/**
 * Workflow Progress Tracker Component
 * 
 * Displays a visual step-by-step progress indicator for workflows.
 * Shows step numbers, titles, icons, and visual states (completed, current, upcoming, skipped).
 * Allows navigation to completed steps and skipping optional steps.
 * 
 * Requirements: 2.1, 8.3, 9.1, 9.2, 14.1, 14.5, 15.1, 15.2
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTablet } from '@/hooks/use-tablet';
import {
    Check,
    Circle,
    SkipForward,
    Clock,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowStepDefinition,
} from '@/types/workflows';
import {
    getCurrentStep,
    getStepIndex,
    calculateRemainingTime,
} from '@/lib/workflow-state-manager';
import { WorkflowHelpPanel } from './workflow-help-panel';

export interface WorkflowProgressTrackerProps {
    /** The workflow instance */
    instance: WorkflowInstance;
    /** The workflow preset definition */
    preset: WorkflowPreset;
    /** Current step ID */
    currentStepId: string;
    /** Callback when user navigates to a step */
    onNavigateToStep: (stepId: string) => void;
    /** Callback when user skips the current step */
    onSkipStep: () => void;
    /** Callback when user completes the current step */
    onCompleteStep: (data?: any) => void;
    /** Whether to display horizontally (for mobile) */
    horizontal?: boolean;
    /** Whether to show help text */
    showHelp?: boolean;
    /** Custom className */
    className?: string;
}

/**
 * Determine the visual state of a step
 */
type StepState = 'completed' | 'current' | 'upcoming' | 'skipped';

function getStepState(
    step: WorkflowStepDefinition,
    instance: WorkflowInstance
): StepState {
    if (instance.completedSteps.includes(step.id)) {
        return 'completed';
    }
    if (instance.skippedSteps.includes(step.id)) {
        return 'skipped';
    }
    if (step.id === instance.currentStepId) {
        return 'current';
    }
    return 'upcoming';
}

/**
 * Format minutes to human-readable time
 */
function formatTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Workflow Progress Tracker Component
 */
export function WorkflowProgressTracker({
    instance,
    preset,
    currentStepId,
    onNavigateToStep,
    onSkipStep,
    onCompleteStep,
    horizontal = false,
    showHelp = true,
    className,
}: WorkflowProgressTrackerProps) {
    // Responsive hooks
    const isMobile = useIsMobile();
    const { isTablet } = useTablet();

    // Force horizontal layout on mobile and tablet
    const effectiveHorizontal = isMobile || isTablet || horizontal;

    // Get current step
    const currentStep = useMemo(
        () => getCurrentStep(instance, preset),
        [instance, preset]
    );

    // Calculate remaining time
    const remainingTime = useMemo(
        () => calculateRemainingTime(instance, preset),
        [instance, preset]
    );

    // Check if current step can be skipped
    const canSkipCurrentStep = currentStep.isOptional;

    // Determine if a step is clickable
    const isStepClickable = (step: WorkflowStepDefinition): boolean => {
        const state = getStepState(step, instance);
        return state === 'completed' || state === 'skipped' || state === 'current';
    };

    // Handle step click
    const handleStepClick = (step: WorkflowStepDefinition) => {
        if (isStepClickable(step)) {
            onNavigateToStep(step.id);
        }
    };

    return (
        <div className={cn('workflow-progress-tracker', className)} role="region" aria-label="Workflow progress">
            {/* Header with remaining time */}
            <motion.div
                className={cn(
                    "mb-6 flex items-center justify-between",
                    isMobile && "flex-col items-start gap-2"
                )}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div>
                    <h3
                        className={cn(
                            "font-semibold",
                            isMobile ? "text-base" : "text-lg"
                        )}
                        id="workflow-title"
                    >
                        {preset.title}
                    </h3>
                    <motion.p
                        className="text-sm text-muted-foreground"
                        key={currentStepId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        aria-live="polite"
                        aria-atomic="true"
                    >
                        Step {getStepIndex(currentStepId, preset) + 1} of {preset.steps.length}
                    </motion.p>
                </div>
                {remainingTime > 0 && (
                    <motion.div
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        aria-live="polite"
                    >
                        <Clock className="h-4 w-4" aria-hidden="true" />
                        <motion.span
                            key={remainingTime}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            {formatTime(remainingTime)} remaining
                        </motion.span>
                    </motion.div>
                )}
            </motion.div>

            {/* Step indicator */}
            <nav
                className={cn(
                    'step-indicator',
                    effectiveHorizontal
                        ? 'flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin'
                        : 'flex flex-col gap-4'
                )}
                aria-label="Workflow steps"
                role="navigation"
            >
                {preset.steps.map((step, index) => {
                    const state = getStepState(step, instance);
                    const isClickable = isStepClickable(step);
                    const isCurrent = step.id === currentStepId;

                    return (
                        <React.Fragment key={step.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <StepItem
                                    step={step}
                                    state={state}
                                    index={index}
                                    isClickable={isClickable}
                                    isCurrent={isCurrent}
                                    horizontal={effectiveHorizontal}
                                    isMobile={isMobile}
                                    onClick={() => handleStepClick(step)}
                                />
                            </motion.div>

                            {/* Connector line (not for last step) */}
                            {index < preset.steps.length - 1 && (
                                <motion.div
                                    className={cn(
                                        'step-connector',
                                        horizontal
                                            ? 'h-0.5 w-8 flex-shrink-0'
                                            : 'ml-6 h-8 w-0.5',
                                        state === 'completed' || state === 'skipped'
                                            ? 'bg-primary'
                                            : 'bg-muted'
                                    )}
                                    initial={{ scaleY: horizontal ? 1 : 0, scaleX: horizontal ? 0 : 1 }}
                                    animate={{ scaleY: 1, scaleX: 1 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 + 0.15 }}
                                    style={{ transformOrigin: horizontal ? 'left' : 'top' }}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>

            {/* Current step help section */}
            {showHelp && (
                <motion.div
                    key={currentStepId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 space-y-4"
                >
                    {/* Workflow Help Panel */}
                    <WorkflowHelpPanel
                        step={currentStep}
                        defaultOpen={true}
                    />

                    {/* Skip button for optional steps */}
                    {canSkipCurrentStep && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onSkipStep}
                            className="w-full sm:w-auto"
                            aria-label={`Skip ${currentStep.title} (optional step)`}
                        >
                            <SkipForward className="h-4 w-4 mr-2" aria-hidden="true" />
                            Skip this step
                        </Button>
                    )}
                </motion.div>
            )}
        </div >
    );
}

/**
 * Individual step item component
 */
interface StepItemProps {
    step: WorkflowStepDefinition;
    state: StepState;
    index: number;
    isClickable: boolean;
    isCurrent: boolean;
    horizontal: boolean;
    isMobile?: boolean;
    onClick: () => void;
}

function StepItem({
    step,
    state,
    index,
    isClickable,
    isCurrent,
    horizontal,
    isMobile = false,
    onClick,
}: StepItemProps) {
    const stepNumber = index + 1;

    // Icon based on state
    const StepIcon = useMemo(() => {
        switch (state) {
            case 'completed':
                return Check;
            case 'skipped':
                return SkipForward;
            case 'current':
                return Circle;
            default:
                return Circle;
        }
    }, [state]);

    // Colors based on state
    const colors = useMemo(() => {
        switch (state) {
            case 'completed':
                return {
                    bg: 'bg-primary',
                    text: 'text-primary-foreground',
                    border: 'border-primary',
                };
            case 'skipped':
                return {
                    bg: 'bg-muted',
                    text: 'text-muted-foreground',
                    border: 'border-muted',
                };
            case 'current':
                return {
                    bg: 'bg-primary',
                    text: 'text-primary-foreground',
                    border: 'border-primary ring-2 ring-primary/20',
                };
            default:
                return {
                    bg: 'bg-muted',
                    text: 'text-muted-foreground',
                    border: 'border-muted',
                };
        }
    }, [state]);

    const content = (
        <motion.div
            whileHover={isClickable ? { scale: 1.02, x: horizontal ? 0 : 4 } : undefined}
            whileTap={isClickable ? { scale: 0.98 } : undefined}
            className={cn(
                'step-item flex items-center gap-3 rounded-lg border transition-all',
                horizontal ? (isMobile ? 'flex-shrink-0 w-40 p-2' : 'flex-shrink-0 w-48 p-3') : 'w-full p-3',
                isClickable && 'cursor-pointer hover:bg-accent',
                !isClickable && 'cursor-not-allowed opacity-60',
                isCurrent && 'bg-accent',
                colors.border
            )}
            onClick={isClickable ? onClick : undefined}
            role={isClickable ? "button" : undefined}
            tabIndex={isClickable ? 0 : -1}
            aria-label={`Step ${stepNumber}: ${step.title}${isCurrent ? ' (current)' : ''}${state === 'completed' ? ' (completed)' : ''}${state === 'skipped' ? ' (skipped)' : ''}${step.isOptional ? ' (optional)' : ''}`}
            aria-current={isCurrent ? "step" : undefined}
            aria-disabled={!isClickable}
            onKeyDown={isClickable ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            } : undefined}
        >
            {/* Step number/icon */}
            <motion.div
                className={cn(
                    'flex flex-shrink-0 items-center justify-center rounded-full border-2 transition-all',
                    isMobile ? 'h-8 w-8' : 'h-10 w-10',
                    colors.bg,
                    colors.text,
                    colors.border
                )}
                animate={isCurrent ? {
                    scale: [1, 1.1, 1],
                    transition: { duration: 2, repeat: Infinity }
                } : {}}
            >
                {state === 'completed' || state === 'skipped' ? (
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                        <StepIcon className={cn(isMobile ? "h-4 w-4" : "h-5 w-5")} />
                    </motion.div>
                ) : (
                    <span className={cn("font-semibold", isMobile ? "text-xs" : "text-sm")}>
                        {stepNumber}
                    </span>
                )}
            </motion.div>

            {/* Step info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4
                        className={cn(
                            'font-medium truncate',
                            isMobile ? 'text-xs' : 'text-sm',
                            isCurrent && 'text-primary'
                        )}
                    >
                        {step.title}
                    </h4>
                    {step.isOptional && !isMobile && (
                        <Badge variant="secondary" className="text-xs">
                            Optional
                        </Badge>
                    )}
                </div>
                {!horizontal && (
                    <p className="text-xs text-muted-foreground truncate">
                        {step.description}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                    <Clock className={cn(isMobile ? "h-2.5 w-2.5" : "h-3 w-3", "text-muted-foreground")} />
                    <span className={cn(isMobile ? "text-[10px]" : "text-xs", "text-muted-foreground")}>
                        {formatTime(step.estimatedMinutes)}
                    </span>
                </div>
            </div>
        </motion.div>
    );

    // Wrap in tooltip for horizontal view
    if (horizontal) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>{content}</TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                        <p className="font-medium">{step.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {step.description}
                        </p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return content;
}
