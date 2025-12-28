/**
 * Task Guidance Component
 * 
 * Provides step-by-step guidance for complex tasks
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    CheckCircle,
    Circle,
    Clock,
    ChevronRight,
    ChevronDown,
    Lightbulb,
    ExternalLink,
    AlertCircle,
} from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { Badge } from './badge';
import { Separator } from './separator';
import { cn } from '@/lib/utils/common';
import type { ComplexTaskGuidance, GuidanceStep } from '@/lib/workflow-optimization';

interface TaskGuidanceProps {
    guidance: ComplexTaskGuidance;
    onStepComplete: (stepId: string) => void;
    onClose?: () => void;
}

export function TaskGuidance({ guidance, onStepComplete, onClose }: TaskGuidanceProps) {
    const [expandedStep, setExpandedStep] = useState<string | null>(
        guidance.steps[guidance.currentStep]?.id || null
    );

    const completedSteps = guidance.steps.filter((s) => s.completed).length;
    const totalSteps = guidance.steps.length;
    const progress = (completedSteps / totalSteps) * 100;

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="text-xl">{guidance.taskName}</CardTitle>
                        <CardDescription className="mt-1">
                            {completedSteps} of {totalSteps} steps completed
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {guidance.estimatedTotalTime}
                        </Badge>
                        {onClose && (
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                Close
                            </Button>
                        )}
                    </div>
                </div>
                <Progress value={progress} className="mt-4" />
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Prerequisites */}
                {guidance.prerequisites.length > 0 && (
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                    Prerequisites
                                </p>
                                <ul className="text-xs text-amber-700 dark:text-amber-300 mt-1 space-y-1">
                                    {guidance.prerequisites.map((prereq, index) => (
                                        <li key={index}>• {prereq}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Steps */}
                <div className="space-y-3">
                    {guidance.steps.map((step, index) => {
                        const isExpanded = expandedStep === step.id;
                        const isCurrent = index === guidance.currentStep;
                        const isCompleted = step.completed;

                        return (
                            <motion.div
                                key={step.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <div
                                    className={cn(
                                        'rounded-lg border transition-all',
                                        isCurrent && !isCompleted && 'border-primary bg-primary/5',
                                        isCompleted && 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20',
                                        !isCurrent && !isCompleted && 'border-border'
                                    )}
                                >
                                    {/* Step Header */}
                                    <button
                                        className="w-full p-4 flex items-start gap-3 text-left"
                                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            {isCompleted ? (
                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                            ) : (
                                                <Circle
                                                    className={cn(
                                                        'w-5 h-5',
                                                        isCurrent ? 'text-primary' : 'text-muted-foreground'
                                                    )}
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3
                                                    className={cn(
                                                        'font-medium',
                                                        isCompleted && 'line-through text-muted-foreground'
                                                    )}
                                                >
                                                    {step.title}
                                                </h3>
                                                <Badge variant="outline" className="text-xs">
                                                    {step.estimatedTime}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {step.description}
                                            </p>
                                        </div>
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                        )}
                                    </button>

                                    {/* Step Details */}
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="px-4 pb-4"
                                        >
                                            <Separator className="mb-4" />

                                            {/* Instructions */}
                                            <div className="space-y-3">
                                                <div>
                                                    <h4 className="font-headline text-sm font-medium mb-2">Instructions</h4>
                                                    <ol className="space-y-2">
                                                        {step.instructions.map((instruction, i) => (
                                                            <li key={i} className="text-sm text-muted-foreground flex gap-2">
                                                                <span className="font-medium">{i + 1}.</span>
                                                                <span>{instruction}</span>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                </div>

                                                {/* Tips */}
                                                {step.tips && step.tips.length > 0 && (
                                                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                                                        <div className="flex items-start gap-2">
                                                            <Lightbulb className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                                                    Tips
                                                                </p>
                                                                <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                                                                    {step.tips.map((tip, i) => (
                                                                        <li key={i}>• {tip}</li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Help Link */}
                                                {step.helpLink && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs"
                                                        onClick={() => window.open(step.helpLink, '_blank')}
                                                    >
                                                        Learn more
                                                        <ExternalLink className="w-3 h-3 ml-1" />
                                                    </Button>
                                                )}

                                                {/* Complete Button */}
                                                {!isCompleted && (
                                                    <Button
                                                        className="w-full mt-4"
                                                        onClick={() => onStepComplete(step.id)}
                                                    >
                                                        <CheckCircle className="w-4 h-4 mr-2" />
                                                        Mark as Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Completion Message */}
                {completedSteps === totalSteps && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-center"
                    >
                        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                        <p className="font-medium text-green-900 dark:text-green-100">
                            Task Complete!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                            Great job completing all steps. You're ready to move forward!
                        </p>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
