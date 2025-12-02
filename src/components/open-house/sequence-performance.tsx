'use client';

/**
 * Sequence Performance Component
 * 
 * Displays performance metrics and analytics for a follow-up sequence.
 * Shows enrollment stats, completion rates, and touchpoint effectiveness.
 * 
 * Validates Requirements: 15.6
 */

import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    FollowUpSequence,
    SequenceEnrollment,
    InterestLevel,
    FollowUpType,
} from '@/lib/open-house/types';
import {
    Users,
    CheckCircle2,
    Clock,
    Pause,
    Mail,
    MessageSquare,
    TrendingUp,
    Target,
    X,
} from 'lucide-react';
import { cn } from '@/lib/utils/common';

interface SequencePerformanceProps {
    sequence: FollowUpSequence;
    enrollments?: SequenceEnrollment[];
    onClose: () => void;
}

export function SequencePerformance({
    sequence,
    enrollments = [],
    onClose,
}: SequencePerformanceProps) {
    const [metrics, setMetrics] = useState({
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        pausedEnrollments: 0,
        completionRate: 0,
        averageCompletionTime: 0,
        touchpointMetrics: [] as Array<{
            touchpointId: string;
            order: number;
            type: FollowUpType;
            delayMinutes: number;
            reached: number;
            reachedRate: number;
        }>,
    });

    useEffect(() => {
        calculateMetrics();
    }, [enrollments]);

    const calculateMetrics = () => {
        const total = enrollments.length;
        const active = enrollments.filter(e => !e.completedAt && !e.paused).length;
        const completed = enrollments.filter(e => e.completedAt).length;
        const paused = enrollments.filter(e => e.paused && !e.completedAt).length;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        // Calculate average completion time for completed enrollments
        const completedWithTime = enrollments.filter(e => e.completedAt);
        const avgCompletionTime = completedWithTime.length > 0
            ? completedWithTime.reduce((sum, e) => {
                const start = new Date(e.createdAt).getTime();
                const end = new Date(e.completedAt!).getTime();
                return sum + (end - start);
            }, 0) / completedWithTime.length
            : 0;

        // Calculate touchpoint metrics
        const touchpointMetrics = sequence.touchpoints.map((tp, index) => {
            // Count how many enrollments reached this touchpoint
            const reached = enrollments.filter(e => e.currentTouchpointIndex > index || e.completedAt).length;
            const reachedRate = total > 0 ? (reached / total) * 100 : 0;

            return {
                touchpointId: tp.touchpointId,
                order: tp.order,
                type: tp.type,
                delayMinutes: tp.delayMinutes,
                reached,
                reachedRate,
            };
        });

        setMetrics({
            totalEnrollments: total,
            activeEnrollments: active,
            completedEnrollments: completed,
            pausedEnrollments: paused,
            completionRate,
            averageCompletionTime: avgCompletionTime,
            touchpointMetrics,
        });
    };

    const formatDuration = (ms: number): string => {
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) {
            return `${days}d ${hours}h`;
        }
        return `${hours}h`;
    };

    const formatDelay = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
        const hours = Math.floor(minutes / 60);
        if (hours < 24) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        const days = Math.floor(hours / 24);
        return `${days} day${days !== 1 ? 's' : ''}`;
    };

    const getInterestLevelLabel = (level: InterestLevel | 'all'): string => {
        const labels: Record<string, string> = {
            all: 'All Levels',
            [InterestLevel.HIGH]: 'High Interest',
            [InterestLevel.MEDIUM]: 'Medium Interest',
            [InterestLevel.LOW]: 'Low Interest',
        };
        return labels[level];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold">{sequence.name}</h2>
                    {sequence.description && (
                        <p className="text-muted-foreground">{sequence.description}</p>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                        <Badge variant="outline">
                            <Target className="h-3 w-3 mr-1" />
                            {getInterestLevelLabel(sequence.interestLevel)}
                        </Badge>
                        <Badge variant={sequence.active ? 'default' : 'secondary'}>
                            {sequence.active ? 'Active' : 'Inactive'}
                        </Badge>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Overview Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Enrollments"
                    value={metrics.totalEnrollments}
                    icon={Users}
                    iconColor="text-blue-600"
                />
                <MetricCard
                    title="Active"
                    value={metrics.activeEnrollments}
                    icon={Clock}
                    iconColor="text-yellow-600"
                />
                <MetricCard
                    title="Completed"
                    value={metrics.completedEnrollments}
                    icon={CheckCircle2}
                    iconColor="text-green-600"
                />
                <MetricCard
                    title="Paused"
                    value={metrics.pausedEnrollments}
                    icon={Pause}
                    iconColor="text-gray-600"
                />
            </div>

            {/* Completion Rate */}
            <Card>
                <CardHeader>
                    <CardTitle>Completion Rate</CardTitle>
                    <CardDescription>
                        Percentage of visitors who completed the entire sequence
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold">
                            {metrics.completionRate.toFixed(1)}%
                        </span>
                        <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <Progress value={metrics.completionRate} className="h-2" />
                    {metrics.averageCompletionTime > 0 && (
                        <p className="text-sm text-muted-foreground">
                            Average completion time: {formatDuration(metrics.averageCompletionTime)}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Touchpoint Performance */}
            <Card>
                <CardHeader>
                    <CardTitle>Touchpoint Performance</CardTitle>
                    <CardDescription>
                        How many visitors reached each touchpoint in the sequence
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {metrics.touchpointMetrics.map((metric, index) => (
                        <div key={metric.touchpointId} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {metric.type === FollowUpType.EMAIL ? (
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span className="font-medium">Touchpoint {metric.order}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {index === 0 ? 'After check-in' : 'After previous'}:{' '}
                                        {formatDelay(metric.delayMinutes)}
                                    </Badge>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium">{metric.reached}</span>
                                    <span className="text-muted-foreground">
                                        {' '}/ {metrics.totalEnrollments}
                                    </span>
                                    <span className="text-muted-foreground ml-2">
                                        ({metric.reachedRate.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                            <Progress value={metric.reachedRate} className="h-1.5" />
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Sequence Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>Sequence Configuration</CardTitle>
                    <CardDescription>
                        Current touchpoint setup and timing
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {sequence.touchpoints.map((tp, index) => (
                            <div
                                key={tp.touchpointId}
                                className="flex items-start gap-3 p-3 rounded-lg border"
                            >
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary font-medium text-sm">
                                    {tp.order}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        {tp.type === FollowUpType.EMAIL ? (
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                        ) : (
                                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                        )}
                                        <span className="font-medium capitalize">{tp.type}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {index === 0 ? 'After check-in' : 'After previous'}:{' '}
                                            {formatDelay(tp.delayMinutes)}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {tp.templatePrompt}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface MetricCardProps {
    title: string;
    value: number;
    icon: React.ElementType;
    iconColor: string;
}

function MetricCard({ title, value, icon: Icon, iconColor }: MetricCardProps) {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                    </div>
                    <Icon className={cn('h-8 w-8', iconColor)} />
                </div>
            </CardContent>
        </Card>
    );
}
