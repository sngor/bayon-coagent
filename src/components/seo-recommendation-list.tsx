'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/common';
import type { SEORecommendation } from '@/lib/types/common';

interface SEORecommendationListProps {
    recommendations: SEORecommendation[];
    onApply?: (recommendation: SEORecommendation) => void;
    isApplying?: boolean;
    className?: string;
}

/**
 * SEORecommendationList Component
 * 
 * Displays recommendations grouped by priority with "Apply" buttons
 * for each recommendation.
 * 
 * Requirements: 5.3, 5.4
 */
export function SEORecommendationList({
    recommendations,
    onApply,
    isApplying = false,
    className = '',
}: SEORecommendationListProps) {
    const [expandedPriorities, setExpandedPriorities] = useState<Set<string>>(
        new Set(['high', 'medium', 'low'])
    );

    const togglePriority = (priority: string) => {
        const newExpanded = new Set(expandedPriorities);
        if (newExpanded.has(priority)) {
            newExpanded.delete(priority);
        } else {
            newExpanded.add(priority);
        }
        setExpandedPriorities(newExpanded);
    };

    // Group recommendations by priority
    const groupedRecommendations = {
        high: recommendations.filter(r => r.priority === 'high'),
        medium: recommendations.filter(r => r.priority === 'medium'),
        low: recommendations.filter(r => r.priority === 'low'),
    };

    const getPriorityIcon = (priority: SEORecommendation['priority']) => {
        switch (priority) {
            case 'high':
                return <AlertCircle className="h-5 w-5 text-red-600" />;
            case 'medium':
                return <Info className="h-5 w-5 text-yellow-600" />;
            case 'low':
                return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
        }
    };

    const getPriorityColor = (priority: SEORecommendation['priority']) => {
        switch (priority) {
            case 'high':
                return 'text-red-600';
            case 'medium':
                return 'text-yellow-600';
            case 'low':
                return 'text-blue-600';
        }
    };

    const getPriorityBadgeVariant = (priority: SEORecommendation['priority']): 'default' | 'secondary' | 'destructive' => {
        switch (priority) {
            case 'high':
                return 'destructive';
            case 'medium':
                return 'secondary';
            case 'low':
                return 'default';
        }
    };

    const getPriorityBorderColor = (priority: SEORecommendation['priority']) => {
        switch (priority) {
            case 'high':
                return 'border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-900';
            case 'medium':
                return 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-900';
            case 'low':
                return 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900';
        }
    };

    const renderPrioritySection = (
        priority: 'high' | 'medium' | 'low',
        title: string,
        recs: SEORecommendation[]
    ) => {
        if (recs.length === 0) return null;

        const isExpanded = expandedPriorities.has(priority);

        return (
            <div className="space-y-3">
                <button
                    onClick={() => togglePriority(priority)}
                    className="w-full flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {getPriorityIcon(priority)}
                        <span className={cn('font-medium', getPriorityColor(priority))}>
                            {title} ({recs.length})
                        </span>
                    </div>
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>

                {isExpanded && (
                    <div className="space-y-2 pl-4">
                        {recs.map((rec, index) => (
                            <div
                                key={`${priority}-${index}`}
                                className={cn(
                                    'p-4 rounded-lg border',
                                    getPriorityBorderColor(priority)
                                )}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-start gap-2">
                                                {getPriorityIcon(rec.priority)}
                                                <p className="text-sm flex-1">{rec.message}</p>
                                            </div>

                                            {rec.currentValue && rec.suggestedValue && (
                                                <div className="text-xs text-muted-foreground space-y-1 pl-7">
                                                    <div>
                                                        <span className="font-medium">Current:</span> {rec.currentValue}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Suggested:</span> {rec.suggestedValue}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Badge variant={getPriorityBadgeVariant(rec.priority)} className="text-xs shrink-0">
                                            {rec.category}
                                        </Badge>
                                    </div>

                                    {onApply && (
                                        <div className="flex justify-end pt-2 border-t">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onApply(rec)}
                                                disabled={isApplying}
                                            >
                                                {isApplying ? 'Applying...' : 'Apply'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (recommendations.length === 0) {
        return (
            <Card className={className}>
                <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-600" />
                        <p className="font-medium">No recommendations</p>
                        <p className="text-sm mt-1">Your content is well optimized!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>SEO Recommendations</CardTitle>
                <CardDescription>
                    {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''} to improve your content
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {renderPrioritySection('high', 'High Priority', groupedRecommendations.high)}
                {renderPrioritySection('medium', 'Medium Priority', groupedRecommendations.medium)}
                {renderPrioritySection('low', 'Low Priority', groupedRecommendations.low)}
            </CardContent>
        </Card>
    );
}
