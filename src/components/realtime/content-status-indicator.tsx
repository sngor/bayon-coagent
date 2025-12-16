'use client';

/**
 * Content Status Indicator Component
 * Shows real-time status updates for content generation
 * Integrates with the Studio hub for content creation feedback
 */

import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useContentUpdates } from '@/contexts/realtime-context';
import { ContentStatus } from '@/types/realtime';
import { cn } from '@/lib/utils';

interface ContentStatusIndicatorProps {
    contentId: string;
    className?: string;
    showProgress?: boolean;
    showStage?: boolean;
}

const statusConfig = {
    draft: {
        icon: Clock,
        label: 'Draft',
        color: 'bg-gray-500',
        variant: 'secondary' as const
    },
    generating: {
        icon: Loader2,
        label: 'Generating',
        color: 'bg-blue-500',
        variant: 'default' as const,
        animate: true
    },
    reviewing: {
        icon: Clock,
        label: 'Reviewing',
        color: 'bg-yellow-500',
        variant: 'default' as const
    },
    published: {
        icon: CheckCircle,
        label: 'Published',
        color: 'bg-green-500',
        variant: 'default' as const
    },
    failed: {
        icon: XCircle,
        label: 'Failed',
        color: 'bg-red-500',
        variant: 'destructive' as const
    }
};

export function ContentStatusIndicator({
    contentId,
    className,
    showProgress = true,
    showStage = true
}: ContentStatusIndicatorProps) {
    const { subscribeToContent, getContentStatus } = useContentUpdates();
    const [status, setStatus] = useState<ContentStatus | null>(null);
    const [progress, setProgress] = useState(0);
    const [stage, setStage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Get initial status
        const initialStatus = getContentStatus(contentId);
        if (initialStatus) {
            setStatus(initialStatus.status);
            setProgress(initialStatus.progress || 0);
            setStage(initialStatus.stage || null);
            setError(initialStatus.error || null);
        }

        // Subscribe to updates
        const unsubscribe = subscribeToContent(contentId, (updatedStatus) => {
            if (updatedStatus) {
                setStatus(updatedStatus.status);
                setProgress(updatedStatus.progress || 0);
                setStage(updatedStatus.stage || null);
                setError(updatedStatus.error || null);
            }
        });

        return unsubscribe;
    }, [contentId, subscribeToContent, getContentStatus]);

    if (!status) {
        return null;
    }

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <div className={cn('space-y-2', className)}>
            <div className="flex items-center gap-2">
                <Badge variant={config.variant} className="flex items-center gap-1">
                    <Icon
                        className={cn(
                            'h-3 w-3',
                            config.animate && 'animate-spin'
                        )}
                    />
                    {config.label}
                </Badge>

                {showStage && stage && (
                    <span className="text-sm text-muted-foreground">
                        {stage}
                    </span>
                )}
            </div>

            {showProgress && status === 'generating' && (
                <div className="space-y-1">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{progress}% complete</span>
                        {stage && <span>{stage}</span>}
                    </div>
                </div>
            )}

            {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                    {error}
                </div>
            )}
        </div>
    );
}

// Usage example for Studio hub
export function StudioContentStatus({ contentId }: { contentId: string }) {
    return (
        <ContentStatusIndicator
            contentId={contentId}
            showProgress={true}
            showStage={true}
            className="w-full"
        />
    );
}