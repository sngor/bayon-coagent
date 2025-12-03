/**
 * Website Recommendations List Component
 * 
 * Displays prioritized list of recommendations from website analysis including:
 * - Priority badges (high/medium/low)
 * - Code snippets with syntax highlighting
 * - Estimated impact and effort
 * - Action items as checklist
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/common';
import {
    AlertCircle,
    CheckCircle2,
    Code,
    Copy,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    TrendingUp,
    Zap
} from 'lucide-react';
import type { Recommendation } from '@/ai/schemas/website-analysis-schemas';
import { toast } from '@/hooks/use-toast';

interface RecommendationsListProps {
    recommendations: Recommendation[];
}

/**
 * Get priority badge styling
 */
function getPriorityBadge(priority: 'high' | 'medium' | 'low') {
    switch (priority) {
        case 'high':
            return {
                className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200',
                icon: <AlertCircle className="h-3 w-3 mr-1" />,
                label: 'High Priority'
            };
        case 'medium':
            return {
                className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200',
                icon: <TrendingUp className="h-3 w-3 mr-1" />,
                label: 'Medium Priority'
            };
        case 'low':
            return {
                className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
                icon: <Lightbulb className="h-3 w-3 mr-1" />,
                label: 'Low Priority'
            };
    }
}

/**
 * Get effort badge styling
 */
function getEffortBadge(effort: 'easy' | 'moderate' | 'difficult') {
    switch (effort) {
        case 'easy':
            return {
                className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
                label: 'Easy'
            };
        case 'moderate':
            return {
                className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
                label: 'Moderate'
            };
        case 'difficult':
            return {
                className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                label: 'Difficult'
            };
    }
}

/**
 * Get category icon
 */
function getCategoryIcon(category: string) {
    switch (category) {
        case 'schema_markup':
            return <Code className="h-4 w-4" />;
        case 'meta_tags':
            return <Code className="h-4 w-4" />;
        case 'structured_data':
            return <Code className="h-4 w-4" />;
        case 'nap_consistency':
            return <CheckCircle2 className="h-4 w-4" />;
        case 'technical_seo':
            return <Zap className="h-4 w-4" />;
        default:
            return <Lightbulb className="h-4 w-4" />;
    }
}

/**
 * Individual Recommendation Card
 */
function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [completedItems, setCompletedItems] = useState<Set<number>>(new Set());

    const priorityBadge = getPriorityBadge(recommendation.priority);
    const effortBadge = getEffortBadge(recommendation.effort);

    const handleCopyCode = async () => {
        if (recommendation.codeSnippet) {
            try {
                await navigator.clipboard.writeText(recommendation.codeSnippet);
                toast({
                    title: 'Code Copied',
                    description: 'Code snippet copied to clipboard',
                });
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Copy Failed',
                    description: 'Failed to copy code to clipboard',
                });
            }
        }
    };

    const toggleActionItem = (index: number) => {
        const newCompleted = new Set(completedItems);
        if (newCompleted.has(index)) {
            newCompleted.delete(index);
        } else {
            newCompleted.add(index);
        }
        setCompletedItems(newCompleted);
    };

    const completionPercentage = (completedItems.size / recommendation.actionItems.length) * 100;

    return (
        <Card className="border-l-4 border-l-primary">
            <CardHeader>
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={priorityBadge.className}>
                                {priorityBadge.icon}
                                {priorityBadge.label}
                            </Badge>
                            <Badge variant="outline" className={effortBadge.className}>
                                {effortBadge.label}
                            </Badge>
                            <Badge variant="secondary" className="font-mono text-xs">
                                {getCategoryIcon(recommendation.category)}
                                <span className="ml-1">{recommendation.category.replace(/_/g, ' ')}</span>
                            </Badge>
                        </div>
                        <CardTitle className="font-headline text-xl">
                            {recommendation.title}
                        </CardTitle>
                        <CardDescription>
                            {recommendation.description}
                        </CardDescription>
                    </div>

                    {/* Impact Score */}
                    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider">Impact</div>
                        <div className="text-2xl font-bold text-primary">+{recommendation.estimatedImpact}</div>
                        <div className="text-xs text-muted-foreground">points</div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Action Items Checklist */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                            Action Items
                        </h4>
                        {completedItems.size > 0 && (
                            <span className="text-xs text-muted-foreground">
                                {completedItems.size} of {recommendation.actionItems.length} completed
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    {completedItems.size > 0 && (
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    )}

                    {/* Action Items List */}
                    <div className="space-y-2">
                        {recommendation.actionItems.map((item, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                    completedItems.has(index)
                                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                        : "bg-muted/50 hover:bg-muted"
                                )}
                            >
                                <Checkbox
                                    id={`${recommendation.id}-item-${index}`}
                                    checked={completedItems.has(index)}
                                    onCheckedChange={() => toggleActionItem(index)}
                                    className="mt-0.5"
                                />
                                <label
                                    htmlFor={`${recommendation.id}-item-${index}`}
                                    className={cn(
                                        "text-sm flex-1 cursor-pointer",
                                        completedItems.has(index) && "line-through text-muted-foreground"
                                    )}
                                >
                                    {item}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Code Snippet (if available) */}
                {recommendation.codeSnippet && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                Code Example
                            </h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyCode}
                                className="h-8"
                            >
                                <Copy className="h-3 w-3 mr-2" />
                                Copy
                            </Button>
                        </div>

                        {/* Expandable Code Block */}
                        <div className="relative">
                            <div
                                className={cn(
                                    "relative rounded-lg bg-slate-950 dark:bg-slate-900 p-4 overflow-hidden transition-all",
                                    !isExpanded && "max-h-[200px]"
                                )}
                            >
                                <pre className="text-sm text-slate-50 overflow-x-auto">
                                    <code className="font-mono">
                                        {recommendation.codeSnippet}
                                    </code>
                                </pre>

                                {/* Gradient overlay when collapsed */}
                                {!isExpanded && recommendation.codeSnippet.split('\n').length > 8 && (
                                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-950 dark:from-slate-900 to-transparent" />
                                )}
                            </div>

                            {/* Expand/Collapse Button */}
                            {recommendation.codeSnippet.split('\n').length > 8 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="w-full mt-2"
                                >
                                    {isExpanded ? (
                                        <>
                                            <ChevronUp className="h-4 w-4 mr-2" />
                                            Show Less
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-2" />
                                            Show More
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Implementation Tips */}
                {recommendation.priority === 'high' && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                            <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm">
                                    Why This Matters
                                </h4>
                                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                                    This high-priority recommendation can significantly improve how AI search engines
                                    understand and recommend your website. Implementing this could boost your score by
                                    up to {recommendation.estimatedImpact} points.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * Main Recommendations List Component
 */
export function RecommendationsList({ recommendations }: RecommendationsListProps) {
    // Sort recommendations by priority (high -> medium -> low)
    const sortedRecommendations = [...recommendations].sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Calculate total potential impact
    const totalImpact = recommendations.reduce((sum, rec) => sum + rec.estimatedImpact, 0);

    // Count by priority
    const priorityCounts = {
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length,
    };

    if (recommendations.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 px-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Excellent Work!</h3>
                    <p className="text-muted-foreground max-w-md">
                        Your website is well-optimized for AI search engines. No critical recommendations at this time.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-purple-600/5 border-2 border-primary/30">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-primary" />
                        Optimization Recommendations
                    </CardTitle>
                    <CardDescription>
                        Prioritized action items to improve your AI optimization score
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Total Recommendations */}
                        <div className="p-4 rounded-lg bg-background/50 border">
                            <div className="text-sm text-muted-foreground mb-1">Total Items</div>
                            <div className="text-3xl font-bold text-primary">{recommendations.length}</div>
                        </div>

                        {/* High Priority */}
                        <div className="p-4 rounded-lg bg-background/50 border">
                            <div className="text-sm text-muted-foreground mb-1">High Priority</div>
                            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                {priorityCounts.high}
                            </div>
                        </div>

                        {/* Medium Priority */}
                        <div className="p-4 rounded-lg bg-background/50 border">
                            <div className="text-sm text-muted-foreground mb-1">Medium Priority</div>
                            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                                {priorityCounts.medium}
                            </div>
                        </div>

                        {/* Potential Impact */}
                        <div className="p-4 rounded-lg bg-background/50 border">
                            <div className="text-sm text-muted-foreground mb-1">Potential Gain</div>
                            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                +{totalImpact}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-4">
                {sortedRecommendations.map((recommendation) => (
                    <RecommendationCard
                        key={recommendation.id}
                        recommendation={recommendation}
                    />
                ))}
            </div>

            {/* Help Section */}
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/40">
                            <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-headline font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                Implementation Tips
                            </h4>
                            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                    <span>Start with high-priority items for the biggest impact on your score</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                    <span>Use the code snippets as templates - customize them for your specific needs</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                    <span>Check off action items as you complete them to track your progress</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                                    <span>Re-run the analysis after making changes to see your improved score</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
