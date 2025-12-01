'use client';

/**
 * Content Improvement Panel
 * 
 * Allows users to auto-improve content based on validation scores.
 * Shows before/after comparison and improvement details.
 */

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Sparkles,
    Loader2,
    TrendingUp,
    Zap,
    Target,
    Share2,
    Search,
    Check,
    X,
    ArrowRight,
} from 'lucide-react';
import {
    autoImproveContentAction,
    quickImproveContentAction,
    aggressiveImproveContentAction,
    focusedImproveContentAction
} from '@/app/content-improvement-actions';
import type { ValidationResult, ValidationConfig } from '@/aws/bedrock/validation-agent-enhanced';
import { toast } from '@/hooks/use-toast';

interface ContentImprovementPanelProps {
    content: string;
    validation: ValidationResult;
    validationConfig: ValidationConfig;
    onImproved: (improvedContent: string, newValidation: ValidationResult) => void;
}

export function ContentImprovementPanel({
    content,
    validation,
    validationConfig,
    onImproved,
}: ContentImprovementPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [improvementResult, setImprovementResult] = useState<any>(null);
    const [selectedStrategy, setSelectedStrategy] = useState<'auto' | 'quick' | 'aggressive' | 'focused'>('auto');
    const [focusArea, setFocusArea] = useState<'social' | 'seo' | 'goal'>('social');

    const handleImprove = (strategy: 'auto' | 'quick' | 'aggressive' | 'focused') => {
        startTransition(async () => {
            try {
                let result;

                if (strategy === 'auto') {
                    result = await autoImproveContentAction(content, validationConfig);
                } else if (strategy === 'quick') {
                    result = await quickImproveContentAction(content, validationConfig);
                } else if (strategy === 'aggressive') {
                    result = await aggressiveImproveContentAction(content, validationConfig);
                } else {
                    result = await focusedImproveContentAction(content, focusArea, validationConfig);
                }

                if (result.message === 'success' && result.data) {
                    setImprovementResult(result.data);

                    toast({
                        title: '✨ Content Improved!',
                        description: `Score increased from ${result.data.originalScore} to ${result.data.finalScore} (+${result.data.finalScore - result.data.originalScore})`,
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Improvement Failed',
                        description: result.message,
                    });
                }
            } catch (error) {
                console.error('Improvement error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Improvement Failed',
                    description: 'An error occurred while improving content.',
                });
            }
        });
    };

    const handleAccept = () => {
        if (improvementResult?.improvedContent && improvementResult?.validation) {
            onImproved(improvementResult.improvedContent, improvementResult.validation);
            setImprovementResult(null);
            toast({
                title: 'Improvements Applied',
                description: 'Your content has been updated with the improvements.',
            });
        }
    };

    const handleReject = () => {
        setImprovementResult(null);
        toast({
            title: 'Improvements Discarded',
            description: 'Keeping original content.',
        });
    };

    // Don't show if score is already excellent
    if (validation.score >= 95) {
        return (
            <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                    Your content is already excellent! No improvements needed.
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            AI Content Improvement
                        </CardTitle>
                        <CardDescription>
                            Automatically improve your content to achieve higher quality scores
                        </CardDescription>
                    </div>
                    {validation.score < 70 && (
                        <Badge variant="destructive">Needs Improvement</Badge>
                    )}
                    {validation.score >= 70 && validation.score < 85 && (
                        <Badge variant="default">Can Be Better</Badge>
                    )}
                    {validation.score >= 85 && validation.score < 95 && (
                        <Badge variant="secondary">Almost Perfect</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!improvementResult ? (
                    <>
                        {/* Improvement Strategies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Auto Improve */}
                            <Button
                                variant={selectedStrategy === 'auto' ? 'default' : 'outline'}
                                className="h-auto flex-col items-start p-4"
                                onClick={() => {
                                    setSelectedStrategy('auto');
                                    handleImprove('auto');
                                }}
                                disabled={isPending}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="h-4 w-4" />
                                    <span className="font-semibold">Auto Improve</span>
                                    <Badge variant="secondary" className="ml-auto">Recommended</Badge>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    Smart improvement based on current score. Best balance of speed and quality.
                                </span>
                            </Button>

                            {/* Quick Improve */}
                            <Button
                                variant={selectedStrategy === 'quick' ? 'default' : 'outline'}
                                className="h-auto flex-col items-start p-4"
                                onClick={() => {
                                    setSelectedStrategy('quick');
                                    handleImprove('quick');
                                }}
                                disabled={isPending}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap className="h-4 w-4" />
                                    <span className="font-semibold">Quick Polish</span>
                                    <Badge variant="outline" className="ml-auto">Fast</Badge>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    Single iteration for fast results. Aims for +15 points improvement.
                                </span>
                            </Button>

                            {/* Aggressive Improve */}
                            <Button
                                variant={selectedStrategy === 'aggressive' ? 'default' : 'outline'}
                                className="h-auto flex-col items-start p-4"
                                onClick={() => {
                                    setSelectedStrategy('aggressive');
                                    handleImprove('aggressive');
                                }}
                                disabled={isPending}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="font-semibold">Maximum Quality</span>
                                    <Badge variant="outline" className="ml-auto">Thorough</Badge>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    Multiple iterations to reach 90+ score. May change style and length.
                                </span>
                            </Button>

                            {/* Focused Improve */}
                            <div className="space-y-2">
                                <Button
                                    variant={selectedStrategy === 'focused' ? 'default' : 'outline'}
                                    className="h-auto flex-col items-start p-4 w-full"
                                    onClick={() => {
                                        setSelectedStrategy('focused');
                                        handleImprove('focused');
                                    }}
                                    disabled={isPending}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <Target className="h-4 w-4" />
                                        <span className="font-semibold">Focused Improvement</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground text-left">
                                        Target specific area: {focusArea === 'social' ? 'Social Media' : focusArea === 'seo' ? 'SEO' : 'Goal Alignment'}
                                    </span>
                                </Button>
                                {selectedStrategy === 'focused' && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant={focusArea === 'social' ? 'default' : 'outline'}
                                            onClick={() => setFocusArea('social')}
                                            className="flex-1"
                                        >
                                            <Share2 className="h-3 w-3 mr-1" />
                                            Social
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={focusArea === 'seo' ? 'default' : 'outline'}
                                            onClick={() => setFocusArea('seo')}
                                            className="flex-1"
                                        >
                                            <Search className="h-3 w-3 mr-1" />
                                            SEO
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={focusArea === 'goal' ? 'default' : 'outline'}
                                            onClick={() => setFocusArea('goal')}
                                            className="flex-1"
                                        >
                                            <Target className="h-3 w-3 mr-1" />
                                            Goal
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isPending && (
                            <Alert>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <AlertDescription>
                                    Improving your content... This may take 10-30 seconds.
                                </AlertDescription>
                            </Alert>
                        )}
                    </>
                ) : (
                    <>
                        {/* Improvement Results */}
                        <div className="space-y-4">
                            {/* Score Comparison */}
                            <div className="flex items-center justify-center gap-4 p-4 bg-muted rounded-lg">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-muted-foreground">
                                        {improvementResult.originalScore}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Original</div>
                                </div>
                                <ArrowRight className="h-6 w-6 text-primary" />
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-primary">
                                        {improvementResult.finalScore}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Improved</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        +{improvementResult.finalScore - improvementResult.originalScore}
                                    </div>
                                    <div className="text-xs text-muted-foreground">Gain</div>
                                </div>
                            </div>

                            {/* Changes Made */}
                            {improvementResult.changes && improvementResult.changes.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2">Changes Made:</h4>
                                    <ul className="space-y-1">
                                        {improvementResult.changes.map((change: string, idx: number) => (
                                            <li key={idx} className="text-sm flex items-start gap-2">
                                                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <span>{change}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Iterations (for aggressive mode) */}
                            {improvementResult.iterations && improvementResult.iterations.length > 1 && (
                                <div>
                                    <h4 className="font-semibold mb-2">Improvement Progress:</h4>
                                    <div className="space-y-2">
                                        {improvementResult.iterations.map((iter: any) => (
                                            <div key={iter.iteration} className="flex items-center gap-2 text-sm">
                                                <Badge variant="outline">Iteration {iter.iteration}</Badge>
                                                <span className="text-muted-foreground">Score: {iter.score}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({iter.changes.length} changes)
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <Button onClick={handleAccept} className="flex-1">
                                    <Check className="mr-2 h-4 w-4" />
                                    Accept Improvements
                                </Button>
                                <Button onClick={handleReject} variant="outline" className="flex-1">
                                    <X className="mr-2 h-4 w-4" />
                                    Keep Original
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
