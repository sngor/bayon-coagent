'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Clock,
    Zap,
    TrendingUp,
} from 'lucide-react';
import { updateRecommendationStatus } from '@/app/aeo-actions';
import { useToast } from '@/hooks/use-toast';
import type { AEORecommendation } from '@/lib/types/aeo-types';

interface AEORecommendationsListProps {
    recommendations: AEORecommendation[];
    userId: string;
}

export function AEORecommendationsList({ recommendations, userId }: AEORecommendationsListProps) {
    const { toast } = useToast();
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
    const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

    const toggleExpanded = (id: string) => {
        const newExpanded = new Set(expandedIds);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedIds(newExpanded);
    };

    const handleStatusUpdate = async (
        recommendationId: string,
        newStatus: 'pending' | 'in_progress' | 'completed' | 'dismissed'
    ) => {
        setUpdatingIds((prev) => new Set(prev).add(recommendationId));

        const result = await updateRecommendationStatus(userId, recommendationId, newStatus);

        setUpdatingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(recommendationId);
            return newSet;
        });

        if (result.success) {
            toast({
                title: 'Status updated',
                description: result.message,
            });
        } else {
            toast({
                title: 'Update failed',
                description: result.error,
                variant: 'destructive',
            });
        }
    };

    const getPriorityBadge = (priority: string) => {
        if (priority === 'high') {
            return <Badge variant="destructive">High Priority</Badge>;
        }
        if (priority === 'medium') {
            return <Badge variant="default">Medium Priority</Badge>;
        }
        return <Badge variant="secondary">Low Priority</Badge>;
    };

    const getEffortBadge = (effort: string) => {
        if (effort === 'easy') {
            return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Easy</Badge>;
        }
        if (effort === 'moderate') {
            return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Moderate</Badge>;
        }
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Difficult</Badge>;
    };

    const getStatusIcon = (status: string) => {
        if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-green-600" />;
        if (status === 'in_progress') return <Clock className="h-4 w-4 text-blue-600" />;
        if (status === 'dismissed') return <AlertCircle className="h-4 w-4 text-gray-400" />;
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    };

    // Sort recommendations by priority and status
    const sortedRecommendations = [...recommendations].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const statusOrder = { pending: 0, in_progress: 1, completed: 2, dismissed: 3 };

        if (a.priority !== b.priority) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return statusOrder[a.status] - statusOrder[b.status];
    });

    if (recommendations.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Optimization Recommendations</CardTitle>
                    <CardDescription>
                        Run an analysis to get personalized recommendations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        No recommendations yet. Run your first AEO analysis to get started.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Optimization Recommendations</CardTitle>
                <CardDescription>
                    {recommendations.filter((r) => r.status === 'pending').length} pending •{' '}
                    {recommendations.filter((r) => r.status === 'completed').length} completed
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {sortedRecommendations.map((rec) => (
                    <Collapsible
                        key={rec.id}
                        open={expandedIds.has(rec.id)}
                        onOpenChange={() => toggleExpanded(rec.id)}
                    >
                        <Card className={rec.status === 'completed' ? 'opacity-60' : ''}>
                            <CollapsibleTrigger asChild>
                                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1">
                                            {getStatusIcon(rec.status)}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <CardTitle className="text-base">{rec.title}</CardTitle>
                                                    {getPriorityBadge(rec.priority)}
                                                    {getEffortBadge(rec.effort)}
                                                </div>
                                                <CardDescription className="line-clamp-2">
                                                    {rec.description}
                                                </CardDescription>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        <span>+{rec.impact} points</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Zap className="h-3 w-3" />
                                                        <span>{rec.effort} effort</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {expandedIds.has(rec.id) ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </CardHeader>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <CardContent className="pt-0 space-y-4">
                                    {/* Action Items */}
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2">Action Steps:</h4>
                                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                                            {rec.actionItems.map((item, index) => (
                                                <li key={index}>{item}</li>
                                            ))}
                                        </ol>
                                    </div>

                                    {/* Status Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t">
                                        {rec.status === 'pending' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleStatusUpdate(rec.id, 'in_progress')}
                                                    disabled={updatingIds.has(rec.id)}
                                                >
                                                    Start Working
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusUpdate(rec.id, 'dismissed')}
                                                    disabled={updatingIds.has(rec.id)}
                                                >
                                                    Dismiss
                                                </Button>
                                            </>
                                        )}
                                        {rec.status === 'in_progress' && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    onClick={() => handleStatusUpdate(rec.id, 'completed')}
                                                    disabled={updatingIds.has(rec.id)}
                                                >
                                                    Mark Complete
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleStatusUpdate(rec.id, 'pending')}
                                                    disabled={updatingIds.has(rec.id)}
                                                >
                                                    Back to Pending
                                                </Button>
                                            </>
                                        )}
                                        {rec.status === 'completed' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStatusUpdate(rec.id, 'pending')}
                                                disabled={updatingIds.has(rec.id)}
                                            >
                                                Reopen
                                            </Button>
                                        )}
                                        {rec.status === 'dismissed' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleStatusUpdate(rec.id, 'pending')}
                                                disabled={updatingIds.has(rec.id)}
                                            >
                                                Restore
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </CollapsibleContent>
                        </Card>
                    </Collapsible>
                ))}
            </CardContent>
        </Card>
    );
}
