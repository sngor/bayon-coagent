/**
 * Prerequisite Check Component
 * 
 * Displays prerequisite requirements and their status
 * Requirement 20.3: Add prerequisite checks before allowing actions
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Circle, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils/common';
import type { Prerequisite } from '@/lib/user-flow';

interface PrerequisiteCheckProps {
    actionTitle: string;
    prerequisites: Prerequisite[];
    canProceed: boolean;
    onProceed?: () => void;
    proceedLabel?: string;
    className?: string;
}

export function PrerequisiteCheck({
    actionTitle,
    prerequisites,
    canProceed,
    onProceed,
    proceedLabel = 'Continue',
    className,
}: PrerequisiteCheckProps) {
    const unmetPrerequisites = prerequisites.filter((p) => !p.met);

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg">Prerequisites for {actionTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!canProceed && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Please complete the following requirements before proceeding:
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    {prerequisites.map((prerequisite) => (
                        <div
                            key={prerequisite.id}
                            className={cn(
                                'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                                prerequisite.met
                                    ? 'bg-success/5 border-success/20'
                                    : 'bg-muted/50 border-muted'
                            )}
                        >
                            <div className="flex-shrink-0 mt-0.5">
                                {prerequisite.met ? (
                                    <CheckCircle2 className="h-5 w-5 text-success" />
                                ) : (
                                    <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                                <p
                                    className={cn(
                                        'text-sm font-medium',
                                        prerequisite.met && 'text-success'
                                    )}
                                >
                                    {prerequisite.description}
                                </p>
                                {!prerequisite.met && prerequisite.actionHref && (
                                    <Button
                                        asChild
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs"
                                    >
                                        <Link href={prerequisite.actionHref}>
                                            {prerequisite.actionLabel || 'Complete this step'}
                                            <ArrowRight className="ml-1 h-3 w-3" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {canProceed && onProceed && (
                    <Button onClick={onProceed} className="w-full" size="lg">
                        {proceedLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                )}

                {!canProceed && unmetPrerequisites.length > 0 && (
                    <div className="rounded-lg bg-muted/50 p-3 border">
                        <p className="text-xs text-muted-foreground">
                            <strong className="text-foreground">
                                {unmetPrerequisites.length} requirement
                                {unmetPrerequisites.length !== 1 ? 's' : ''} remaining
                            </strong>
                            {' '}
                            Complete the items above to unlock this feature.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Inline prerequisite indicator for buttons
 */
interface PrerequisiteButtonProps {
    canProceed: boolean;
    prerequisiteCount: number;
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export function PrerequisiteButton({
    canProceed,
    prerequisiteCount,
    children,
    onClick,
    className,
}: PrerequisiteButtonProps) {
    if (canProceed) {
        return (
            <Button onClick={onClick} className={className}>
                {children}
            </Button>
        );
    }

    return (
        <div className={cn('relative', className)}>
            <Button disabled className="w-full">
                {children}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
                {prerequisiteCount} requirement{prerequisiteCount !== 1 ? 's' : ''} must be
                completed first
            </p>
        </div>
    );
}
