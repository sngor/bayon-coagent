/**
 * Workflow Completion Summary Component
 * 
 * Displays a completion summary when a workflow is finished.
 * Shows completion message with celebration animation, workflow title,
 * completion time, completed/skipped steps, next recommended actions,
 * and options to restart or view content in Library.
 * 
 * Requirements: 2.5, 9.5, 10.5
 */

'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle2,
    Clock,
    SkipForward,
    RotateCcw,
    Library,
    Sparkles,
    ArrowRight,
    TrendingUp,
    Target,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    WorkflowInstance,
    WorkflowPreset,
    WorkflowCategory,
} from '@/types/workflows';

export interface WorkflowCompletionSummaryProps {
    /** The completed workflow instance */
    instance: WorkflowInstance;
    /** The workflow preset definition */
    preset: WorkflowPreset;
    /** Callback when user clicks restart workflow */
    onRestartWorkflow: () => void;
    /** Callback when user clicks view in library (for content workflows) */
    onViewInLibrary?: () => void;
    /** Custom className */
    className?: string;
}

/**
 * Format minutes to human-readable time
 */
function formatTime(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
}

/**
 * Format date to human-readable string
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

/**
 * Get recommended next actions based on workflow category
 */
function getRecommendedActions(category: WorkflowCategory): string[] {
    switch (category) {
        case WorkflowCategory.BRAND_BUILDING:
            return [
                'Share your brand strategy with your team',
                'Start creating content based on your strategy',
                'Set up tracking for your competitors',
                'Schedule regular brand audits',
            ];
        case WorkflowCategory.CONTENT_CREATION:
            return [
                'Review and edit your generated content',
                'Schedule posts across your social channels',
                'Track engagement and performance',
                'Create similar content for other topics',
            ];
        case WorkflowCategory.MARKET_ANALYSIS:
            return [
                'Share insights with your clients',
                'Create content based on market trends',
                'Set up alerts for market changes',
                'Schedule regular market reviews',
            ];
        case WorkflowCategory.CLIENT_ACQUISITION:
            return [
                'Follow up with potential leads',
                'Implement your acquisition strategy',
                'Track conversion metrics',
                'Refine your approach based on results',
            ];
        default:
            return [
                'Review your completed work',
                'Share results with your team',
                'Apply what you learned',
                'Try another workflow',
            ];
    }
}

/**
 * Check if workflow is content-related (should show Library button)
 */
function isContentWorkflow(category: WorkflowCategory): boolean {
    return category === WorkflowCategory.CONTENT_CREATION;
}

/**
 * Workflow Completion Summary Component
 */
export function WorkflowCompletionSummary({
    instance,
    preset,
    onRestartWorkflow,
    onViewInLibrary,
    className,
}: WorkflowCompletionSummaryProps) {
    // Get completed and skipped steps
    const completedSteps = useMemo(() => {
        return preset.steps.filter((step) =>
            instance.completedSteps.includes(step.id)
        );
    }, [preset.steps, instance.completedSteps]);

    const skippedSteps = useMemo(() => {
        return preset.steps.filter((step) =>
            instance.skippedSteps.includes(step.id)
        );
    }, [preset.steps, instance.skippedSteps]);

    // Get recommended actions
    const recommendedActions = useMemo(
        () => getRecommendedActions(preset.category),
        [preset.category]
    );

    // Check if should show library button
    const showLibraryButton = isContentWorkflow(preset.category) && onViewInLibrary;

    return (
        <div className={cn('workflow-completion-summary', className)} role="region" aria-label="Workflow completion summary">
            {/* Celebration animation */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 20,
                    delay: 0.1,
                }}
                className="flex justify-center mb-6"
                aria-hidden="true"
            >
                <div className="relative">
                    <motion.div
                        animate={{
                            rotate: [0, 10, -10, 10, 0],
                            scale: [1, 1.1, 1, 1.1, 1],
                        }}
                        transition={{
                            duration: 0.6,
                            delay: 0.3,
                            repeat: 2,
                        }}
                    >
                        <CheckCircle2 className="h-20 w-20 text-green-500" />
                    </motion.div>
                    {/* Sparkles animation */}
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: [0, 1.2, 0],
                                opacity: [0, 1, 0],
                                x: [0, Math.cos((i * Math.PI) / 4) * 50],
                                y: [0, Math.sin((i * Math.PI) / 4) * 50],
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 1.2,
                                delay: 0.5 + i * 0.08,
                                ease: "easeOut",
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        >
                            <Sparkles className="h-5 w-5 text-yellow-500" />
                        </motion.div>
                    ))}
                    {/* Additional confetti particles */}
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={`confetti-${i}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                                scale: [0, 1, 0.8, 0],
                                opacity: [0, 1, 0.8, 0],
                                x: [0, (Math.random() - 0.5) * 100],
                                y: [0, -Math.random() * 80 - 20],
                                rotate: [0, Math.random() * 360],
                            }}
                            transition={{
                                duration: 1.5,
                                delay: 0.6 + i * 0.05,
                                ease: "easeOut",
                            }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                        >
                            <div
                                className={cn(
                                    "w-2 h-2 rounded-full",
                                    i % 4 === 0 && "bg-green-500",
                                    i % 4 === 1 && "bg-blue-500",
                                    i % 4 === 2 && "bg-orange-500",
                                    i % 4 === 3 && "bg-pink-500"
                                )}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Completion message */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center mb-8"
                role="status"
                aria-live="polite"
            >
                <motion.h2
                    className="text-3xl font-bold mb-2"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{
                        delay: 0.4,
                        type: "spring",
                        stiffness: 200,
                        damping: 10
                    }}
                    id="completion-heading"
                >
                    Workflow Complete! 🎉
                </motion.h2>
                <motion.p
                    className="text-lg text-muted-foreground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                >
                    You've successfully completed <strong>{preset.title}</strong>
                </motion.p>
            </motion.div>

            {/* Workflow details card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2" id="completion-details-heading">
                            <Clock className="h-5 w-5" aria-hidden="true" />
                            Completion Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Completion time */}
                        {instance.completedAt && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Completed on
                                </span>
                                <span className="text-sm font-medium">
                                    {formatDate(instance.completedAt)}
                                </span>
                            </div>
                        )}

                        {/* Actual time taken */}
                        {instance.actualMinutes && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Time taken
                                </span>
                                <span className="text-sm font-medium">
                                    {formatTime(instance.actualMinutes)}
                                </span>
                            </div>
                        )}

                        {/* Estimated vs actual */}
                        {instance.actualMinutes && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Estimated time
                                </span>
                                <span className="text-sm font-medium">
                                    {formatTime(preset.estimatedMinutes)}
                                </span>
                            </div>
                        )}

                        <Separator />

                        {/* Steps completed */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                                Steps completed
                            </span>
                            <Badge variant="secondary">
                                {completedSteps.length} of {preset.steps.length}
                            </Badge>
                        </div>

                        {/* Steps skipped */}
                        {skippedSteps.length > 0 && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">
                                    Steps skipped
                                </span>
                                <Badge variant="outline">
                                    {skippedSteps.length}
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Completed steps list */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2" id="completed-steps-heading">
                            <CheckCircle2 className="h-5 w-5 text-green-500" aria-hidden="true" />
                            Completed Steps
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {completedSteps.map((step, index) => (
                                <li key={step.id}>
                                    <motion.div
                                        className="flex items-start gap-3 text-sm"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                    >
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{
                                                delay: index * 0.05 + 0.1,
                                                type: "spring",
                                                stiffness: 200
                                            }}
                                        >
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                        </motion.div>
                                        <div className="flex-1">
                                            <p className="font-medium">{step.title}</p>
                                            <p className="text-muted-foreground">
                                                {step.description}
                                            </p>
                                        </div>
                                    </motion.div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Skipped steps list (if any) */}
            {skippedSteps.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2" id="skipped-steps-heading">
                                <SkipForward className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                                Skipped Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {skippedSteps.map((step) => (
                                    <li
                                        key={step.id}
                                        className="flex items-start gap-3 text-sm"
                                    >
                                        <SkipForward className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="font-medium text-muted-foreground">
                                                {step.title}
                                            </p>
                                            <p className="text-muted-foreground text-xs">
                                                {step.description}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            Optional
                                        </Badge>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Next recommended actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
            >
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2" id="next-actions-heading">
                            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                            What's Next?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {recommendedActions.map((action, index) => (
                                <li
                                    key={index}
                                    className="flex items-start gap-3 text-sm"
                                >
                                    <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                                    <span>{action}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Action buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex flex-col sm:flex-row gap-3"
            >
                {/* View in Library button (for content workflows) */}
                {showLibraryButton && (
                    <motion.div
                        className="flex-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Button
                            onClick={onViewInLibrary}
                            size="lg"
                            className="w-full"
                            aria-label="View completed content in library"
                        >
                            <Library className="h-4 w-4" aria-hidden="true" />
                            View in Library
                        </Button>
                    </motion.div>
                )}

                {/* Restart workflow button */}
                <motion.div
                    className="flex-1"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <Button
                        onClick={onRestartWorkflow}
                        variant={showLibraryButton ? 'outline' : 'default'}
                        size="lg"
                        className="w-full"
                        aria-label={`Restart ${preset.title} workflow`}
                    >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Restart Workflow
                    </Button>
                </motion.div>
            </motion.div>

            {/* Suggestion to restart */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-6 text-center"
            >
                <p className="text-sm text-muted-foreground">
                    Want to repeat this process for a different project?{' '}
                    <button
                        type="button"
                        onClick={onRestartWorkflow}
                        className="text-primary hover:underline font-medium"
                        aria-label={`Restart ${preset.title} workflow for a new project`}
                    >
                        Restart this workflow
                    </button>
                </p>
            </motion.div>
        </div>
    );
}
