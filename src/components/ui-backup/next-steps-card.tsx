/**
 * Next Steps Card Component
 * 
 * Displays suggested next steps with prerequisites and time estimates
 * Requirement 20.1: Guide users to the next logical step
 * Requirement 20.2: Suggest related actions after completing tasks
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowRight,
    Sparkles,
    CheckCircle2,
    FileText,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/common';
import { useState } from 'react';
import type { NextStep } from '@/lib/user-flow';

interface NextStepsCardProps {
    steps: NextStep[];
    className?: string;
    maxVisible?: number;
    showPrerequisites?: boolean;
}

const priorityConfig = {
    high: {
        badge: 'Recommended',
        badgeVariant: 'default' as const,
        icon: Sparkles,
        iconColor: 'text-primary',
        bgColor: 'bg-primary/5',
        borderColor: 'border-primary/20',
        hoverBg: 'hover:bg-primary/10',
    },
    medium: {
        badge: 'Suggested',
        badgeVariant: 'secondary' as const,
        icon: CheckCircle2,
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/20',
        hoverBg: 'hover:bg-blue-500/10',
    },
    low: {
        badge: 'Optional',
        badgeVariant: 'outline' as const,
        icon: FileText,
        iconColor: 'text-muted-foreground',
        bgColor: 'bg-muted/30',
        borderColor: 'border-muted',
        hoverBg: 'hover:bg-muted/50',
    },
};

export function NextStepsCard({
    steps,
    className,
    maxVisible = 5,
    showPrerequisites = true,
}: NextStepsCardProps) {
    const [showAll, setShowAll] = useState(false);
    const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

    if (steps.length === 0) {
        return null;
    }

    const visibleSteps = showAll ? steps : steps.slice(0, maxVisible);
    const hasMore = steps.length > maxVisible;

    const toggleStepExpanded = (stepId: string) => {
        setExpandedSteps((prev) => {
            const next = new Set(prev);
            if (next.has(stepId)) {
                next.delete(stepId);
            } else {
                next.add(stepId);
            }
            return next;
        });
    };

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    What's Next
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {visibleSteps.map((step, index) => {
                    const config = priorityConfig[step.priority];
                    const Icon = config.icon;
                    const isExpanded = expandedSteps.has(step.id);
                    const hasPrerequisites =
                        step.prerequisites && step.prerequisites.length > 0;
                    const showPrereqDetails =
                        showPrerequisites && hasPrerequisites && !step.prerequisitesMet;

                    return (
                        <div
                            key={step.id}
                            className={cn(
                                'group relative rounded-lg border transition-all duration-300',
                                config.bgColor,
                                config.borderColor,
                                step.prerequisitesMet && config.hoverBg,
                                !step.prerequisitesMet && 'opacity-75'
                            )}
                        >
                            <div className="p-4">
                                <div className="flex items-start gap-3">
                                    <div
                                        className={cn(
                                            'flex-shrink-0 rounded-full p-2',
                                            step.priority === 'high' && 'bg-primary/10',
                                            step.priority === 'medium' && 'bg-blue-500/10',
                                            step.priority === 'low' && 'bg-muted'
                                        )}
                                    >
                                        <Icon className={cn('h-4 w-4', config.iconColor)} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <h4
                                                className={cn(
                                                    'font-semibold text-sm',
                                                    step.prerequisitesMet &&
                                                    'group-hover:text-primary transition-colors'
                                                )}
                                            >
                                                {step.title}
                                            </h4>
                                            <Badge variant={config.badgeVariant} className="text-xs">
                                                {config.badge}
                                            </Badge>
                                            {step.estimatedTime && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {step.estimatedTime}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {step.description}
                                        </p>

                                        {!step.prerequisitesMet && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <AlertCircle className="h-3.5 w-3.5 text-orange-500 flex-shrink-0" />
                                                <p className="text-xs text-orange-600 dark:text-orange-400">
                                                    Prerequisites required
                                                </p>
                                                {showPrereqDetails && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs"
                                                        onClick={() => toggleStepExpanded(step.id)}
                                                    >
                                                        {isExpanded ? (
                                                            <>
                                                                Hide <ChevronUp className="ml-1 h-3 w-3" />
                                                            </>
                                                        ) : (
                                                            <>
                                                                Show <ChevronDown className="ml-1 h-3 w-3" />
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {step.prerequisitesMet ? (
                                        <Button
                                            asChild
                                            variant="ghost"
                                            size="sm"
                                            className="flex-shrink-0"
                                        >
                                            <Link href={step.href}>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <div className="flex-shrink-0 w-9" />
                                    )}
                                </div>

                                {/* Prerequisites Details */}
                                {isExpanded && showPrereqDetails && step.prerequisites && (
                                    <div className="mt-3 pt-3 border-t space-y-2">
                                        <p className="text-xs font-medium">Required:</p>
                                        {step.prerequisites.map((prereq) => (
                                            <div
                                                key={prereq.id}
                                                className="flex items-start gap-2 text-xs"
                                            >
                                                <CheckCircle2
                                                    className={cn(
                                                        'h-3.5 w-3.5 flex-shrink-0 mt-0.5',
                                                        prereq.met
                                                            ? 'text-success'
                                                            : 'text-muted-foreground opacity-50'
                                                    )}
                                                />
                                                <span
                                                    className={cn(
                                                        prereq.met
                                                            ? 'text-success'
                                                            : 'text-muted-foreground'
                                                    )}
                                                >
                                                    {prereq.description}
                                                </span>
                                                {!prereq.met && prereq.actionHref && (
                                                    <Button
                                                        asChild
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs ml-auto"
                                                    >
                                                        <Link href={prereq.actionHref}>
                                                            {prereq.actionLabel}
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {hasMore && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAll(!showAll)}
                        className="w-full"
                    >
                        {showAll ? (
                            <>
                                Show Less <ChevronUp className="ml-2 h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Show {steps.length - maxVisible} More{' '}
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Compact next step banner for page headers
 */
interface NextStepBannerProps {
    step: NextStep;
    className?: string;
}

export function NextStepBanner({ step, className }: NextStepBannerProps) {
    if (!step.prerequisitesMet) return null;

    const config = priorityConfig[step.priority];
    const Icon = config.icon;

    return (
        <div
            className={cn(
                'rounded-lg border p-4 transition-all duration-300',
                config.bgColor,
                config.borderColor,
                config.hoverBg,
                className
            )}
        >
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        'flex-shrink-0 rounded-full p-2',
                        step.priority === 'high' && 'bg-primary/10',
                        step.priority === 'medium' && 'bg-blue-500/10',
                        step.priority === 'low' && 'bg-muted'
                    )}
                >
                    <Icon className={cn('h-5 w-5', config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold">{step.title}</p>
                        {step.estimatedTime && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {step.estimatedTime}
                            </div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <Button asChild size="sm">
                    <Link href={step.href}>
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </div>
        </div>
    );
}
