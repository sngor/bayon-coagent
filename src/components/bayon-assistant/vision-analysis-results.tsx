'use client';

/**
 * Vision Analysis Results Component
 * 
 * Displays the results of a vision analysis including:
 * - Visual elements card
 * - Recommendations list with priorities
 * - Market alignment section
 * - Overall assessment
 * 
 * Requirements: 6.2, 6.3, 6.4
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils/common';
import {
    Eye,
    Lightbulb,
    TrendingUp,
    CheckCircle2,
    DollarSign,
    AlertTriangle,
    Sparkles,
} from 'lucide-react';

/**
 * Vision analysis result type
 */
export interface VisionAnalysisResult {
    analysisId: string;
    visualElements: {
        materials: string[];
        colors: string[];
        lighting: 'natural' | 'artificial' | 'mixed';
        size: 'small' | 'medium' | 'large';
        layout: string;
        notableFeatures?: string[];
    };
    recommendations: Array<{
        action: string;
        rationale: string;
        estimatedCost: 'low' | 'medium' | 'high';
        priority: 'high' | 'medium' | 'low';
        expectedImpact?: string;
    }>;
    marketAlignment: string;
    overallAssessment: string;
    answer: string;
}

/**
 * Vision Analysis Results Props
 */
export interface VisionAnalysisResultsProps {
    result: VisionAnalysisResult;
    className?: string;
}

/**
 * Vision Analysis Results Component
 * 
 * Requirements:
 * - 6.2: Visual elements card
 * - 6.3: Recommendations list with priorities
 * - 6.4: Market alignment section
 */
export function VisionAnalysisResults({
    result,
    className,
}: VisionAnalysisResultsProps) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Answer Section */}
            {result.answer && (
                <Card className="border-primary/50 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Answer
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                            {result.answer}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Visual Elements Card - Requirement 6.2 */}
            {result.visualElements && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Eye className="w-5 h-5" />
                            Visual Elements
                        </CardTitle>
                        <CardDescription>
                            Key visual characteristics identified in the property
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Materials */}
                        {result.visualElements.materials.length > 0 && (
                            <div>
                                <h4 className="font-headline text-sm font-semibold mb-2">Materials</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.visualElements.materials.map((material, idx) => (
                                        <Badge key={idx} variant="secondary">
                                            {material}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Colors */}
                        {result.visualElements.colors.length > 0 && (
                            <div>
                                <h4 className="font-headline text-sm font-semibold mb-2">Colors</h4>
                                <div className="flex flex-wrap gap-2">
                                    {result.visualElements.colors.map((color, idx) => (
                                        <Badge key={idx} variant="outline">
                                            {color}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Separator />

                        {/* Lighting, Size, Layout */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <h4 className="font-headline text-sm font-semibold mb-1">Lighting</h4>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {result.visualElements.lighting}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-headline text-sm font-semibold mb-1">Size</h4>
                                <p className="text-sm text-muted-foreground capitalize">
                                    {result.visualElements.size}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-headline text-sm font-semibold mb-1">Layout</h4>
                                <p className="text-sm text-muted-foreground">
                                    {result.visualElements.layout}
                                </p>
                            </div>
                        </div>

                        {/* Notable Features */}
                        {result.visualElements.notableFeatures &&
                            result.visualElements.notableFeatures.length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <h4 className="font-headline text-sm font-semibold mb-2">Notable Features</h4>
                                        <ul className="space-y-1">
                                            {result.visualElements.notableFeatures.map((feature, idx) => (
                                                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                    </CardContent>
                </Card>
            )}

            {/* Recommendations List - Requirement 6.3 */}
            {result.recommendations && result.recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5" />
                            Recommendations
                        </CardTitle>
                        <CardDescription>
                            Actionable improvements to enhance property value
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {result.recommendations.map((recommendation, idx) => (
                                <RecommendationCard
                                    key={idx}
                                    recommendation={recommendation}
                                    index={idx}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Market Alignment Section - Requirement 6.4 */}
            {result.marketAlignment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Market Alignment
                        </CardTitle>
                        <CardDescription>
                            How this property aligns with current market trends
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {result.marketAlignment}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Overall Assessment */}
            {result.overallAssessment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Overall Assessment
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {result.overallAssessment}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

/**
 * Recommendation Card Component
 * Displays individual recommendation with priority and cost indicators
 */
function RecommendationCard({
    recommendation,
    index,
}: {
    recommendation: {
        action: string;
        rationale: string;
        estimatedCost: 'low' | 'medium' | 'high';
        priority: 'high' | 'medium' | 'low';
        expectedImpact?: string;
    };
    index: number;
}) {
    const priorityConfig = {
        high: {
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-red-100 dark:bg-red-950',
            icon: AlertTriangle,
            label: 'High Priority',
        },
        medium: {
            color: 'text-amber-600 dark:text-amber-400',
            bgColor: 'bg-amber-100 dark:bg-amber-950',
            icon: AlertTriangle,
            label: 'Medium Priority',
        },
        low: {
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-100 dark:bg-blue-950',
            icon: CheckCircle2,
            label: 'Low Priority',
        },
    };

    const costConfig = {
        low: {
            label: 'Low Cost',
            variant: 'default' as const,
        },
        medium: {
            label: 'Medium Cost',
            variant: 'secondary' as const,
        },
        high: {
            label: 'High Cost',
            variant: 'destructive' as const,
        },
    };

    const priority = priorityConfig[recommendation.priority];
    const cost = costConfig[recommendation.estimatedCost];
    const PriorityIcon = priority.icon;

    return (
        <div className={cn('p-4 rounded-lg border', priority.bgColor)}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-2 flex-1">
                    <div className={cn('p-1.5 rounded-full', priority.bgColor)}>
                        <PriorityIcon className={cn('w-4 h-4', priority.color)} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-headline font-semibold text-sm mb-1">
                            {index + 1}. {recommendation.action}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="text-xs">
                                {priority.label}
                            </Badge>
                            <Badge variant={cost.variant} className="text-xs">
                                <DollarSign className="w-3 h-3 mr-1" />
                                {cost.label}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rationale */}
            <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                {recommendation.rationale}
            </p>

            {/* Expected Impact */}
            {recommendation.expectedImpact && (
                <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Expected Impact
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {recommendation.expectedImpact}
                    </p>
                </div>
            )}
        </div>
    );
}
