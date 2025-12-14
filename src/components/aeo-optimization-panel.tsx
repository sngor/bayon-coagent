'use client';

/**
 * AEO (Answer Engine Optimization) Panel
 * 
 * Optimizes content for AI search engines and web bots:
 * - ChatGPT, Claude, Perplexity
 * - Google AI Overviews
 * - Bing Copilot
 */

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Bot,
    Loader2,
    Sparkles,
    Check,
    X,
    TrendingUp,
    MessageSquare,
    Brain,
    Zap,
} from 'lucide-react';
import {
    analyzeContentAEO,
    optimizeContentAEO,
} from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';
import type { AEOAnalysis, AEOOptimizationResult } from '@/aws/bedrock/aeo-optimizer';
import { optimizeForAEOAction } from '@/app/aeo-actions';

interface AEOOptimizationPanelProps {
    content: string;
    contentType?: 'blog' | 'article' | 'faq' | 'guide';
    targetKeywords?: string[];
    onOptimized?: (optimizedContent: string) => void;
}

export function AEOOptimizationPanel({
    content,
    contentType = 'blog',
    targetKeywords,
    onOptimized,
}: AEOOptimizationPanelProps) {
    const [isPending, startTransition] = useTransition();
    const [analysis, setAnalysis] = useState<AEOAnalysis | null>(null);
    const [optimization, setOptimization] = useState<AEOOptimizationResult | null>(null);
    const [activeTab, setActiveTab] = useState<'analyze' | 'optimize'>('analyze');

    const handleAnalyze = () => {
        startTransition(async () => {
            try {
                const result = await analyzeContentAEO({
                    content,
                    contentType
                });

                if (result.success && result.data) {
                    setAnalysis(result.data);
                    toast({
                        title: 'AEO Analysis Complete',
                        description: `Your content scored ${result.data.score}/100 for AI optimization`,
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Analysis Failed',
                        description: result.error?.message || 'Analysis failed',
                    });
                }
            } catch (error) {
                console.error('Analysis error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Analysis Failed',
                    description: 'An error occurred during analysis.',
                });
            }
        });
    };

    const handleOptimize = () => {
        startTransition(async () => {
            try {
                const result = await optimizeForAEOAction(content, contentType, targetKeywords);

                if (result.message === 'success' && result.data) {
                    setOptimization(result.data);
                    toast({
                        title: 'Content Optimized for AI',
                        description: `AEO score improved to ${result.data.score}/100`,
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Optimization Failed',
                        description: result.message,
                    });
                }
            } catch (error) {
                console.error('Optimization error:', error);
                toast({
                    variant: 'destructive',
                    title: 'Optimization Failed',
                    description: 'An error occurred during optimization.',
                });
            }
        });
    };

    const handleAcceptOptimization = () => {
        if (optimization?.optimizedContent && onOptimized) {
            onOptimized(optimization.optimizedContent);
            toast({
                title: 'AEO Optimization Applied',
                description: 'Your content is now optimized for AI search engines.',
            });
            setOptimization(null);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return <Badge className="bg-green-600">Excellent</Badge>;
        if (score >= 60) return <Badge className="bg-yellow-600">Good</Badge>;
        return <Badge variant="destructive">Needs Work</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-primary" />
                            AEO - AI Search Optimization
                        </CardTitle>
                        <CardDescription>
                            Optimize for ChatGPT, Claude, Perplexity, Google AI, and Bing Copilot
                        </CardDescription>
                    </div>
                    {analysis && getScoreBadge(analysis.score)}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {!analysis && !optimization && (
                    <div className="space-y-4">
                        <Alert>
                            <Brain className="h-4 w-4" />
                            <AlertDescription>
                                AEO (Answer Engine Optimization) ensures AI search engines can easily extract and present your content.
                                This is crucial for appearing in ChatGPT responses, Google AI Overviews, and other AI-powered search results.
                            </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                onClick={handleAnalyze}
                                disabled={isPending}
                                variant="outline"
                                className="h-auto flex-col items-start p-4"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Zap className="h-4 w-4" />
                                    <span className="font-semibold">Analyze AEO</span>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    Check how AI-friendly your content is
                                </span>
                            </Button>

                            <Button
                                onClick={handleOptimize}
                                disabled={isPending}
                                className="h-auto flex-col items-start p-4"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Sparkles className="h-4 w-4" />
                                    <span className="font-semibold">Optimize for AI</span>
                                </div>
                                <span className="text-xs text-muted-foreground text-left">
                                    Auto-optimize for AI search engines
                                </span>
                            </Button>
                        </div>

                        {isPending && (
                            <Alert>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <AlertDescription>
                                    Analyzing content for AI optimization...
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Analysis Results */}
                {analysis && !optimization && (
                    <div className="space-y-4">
                        {/* Overall Score */}
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">AEO Score</span>
                                <span className={`text-2xl font-bold ${getScoreColor(analysis.score)}`}>
                                    {analysis.score}/100
                                </span>
                            </div>
                            <Progress value={analysis.score} className="h-2" />
                        </div>

                        {/* AI Engine Compatibility */}
                        <div>
                            <h4 className="font-semibold mb-3">AI Engine Compatibility</h4>
                            <div className="space-y-2">
                                {Object.entries(analysis.aiEngineCompatibility).map(([engine, score]) => (
                                    <div key={engine} className="flex items-center gap-2">
                                        <Bot className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm capitalize flex-1">
                                            {engine === 'chatgpt' ? 'ChatGPT' :
                                                engine === 'googleAI' ? 'Google AI' :
                                                    engine === 'bingCopilot' ? 'Bing Copilot' :
                                                        engine.charAt(0).toUpperCase() + engine.slice(1)}
                                        </span>
                                        <span className="text-sm font-medium">{score}</span>
                                        <Progress value={score} className="h-1.5 w-24" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Extractability */}
                        <div>
                            <h4 className="font-semibold mb-3">AI Extractability</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(analysis.extractability).map(([metric, score]) => (
                                    <div key={metric} className="p-3 bg-muted rounded-lg">
                                        <div className="text-xs text-muted-foreground capitalize mb-1">
                                            {metric.replace(/([A-Z])/g, ' $1').trim()}
                                        </div>
                                        <div className={`text-lg font-bold ${getScoreColor(score)}`}>
                                            {score}/100
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Strengths */}
                        {analysis.strengths.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 text-green-700">Strengths</h4>
                                <ul className="space-y-1">
                                    {analysis.strengths.map((strength, idx) => (
                                        <li key={idx} className="text-sm flex items-start gap-2">
                                            <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span>{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Weaknesses */}
                        {analysis.weaknesses.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2 text-orange-700">Areas for Improvement</h4>
                                <ul className="space-y-1">
                                    {analysis.weaknesses.map((weakness, idx) => (
                                        <li key={idx} className="text-sm flex items-start gap-2">
                                            <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                            <span>{weakness}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Recommendations */}
                        {analysis.recommendations.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">Recommendations</h4>
                                <ul className="space-y-1">
                                    {analysis.recommendations.map((rec, idx) => (
                                        <li key={idx} className="text-sm flex items-start gap-2">
                                            <span className="text-primary font-semibold">{idx + 1}.</span>
                                            <span>{rec}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button onClick={handleOptimize} disabled={isPending} className="flex-1">
                                <Sparkles className="mr-2 h-4 w-4" />
                                Optimize for AI
                            </Button>
                            <Button onClick={() => setAnalysis(null)} variant="outline">
                                Close
                            </Button>
                        </div>
                    </div>
                )}

                {/* Optimization Results */}
                {optimization && (
                    <div className="space-y-4">
                        {/* Score Improvement */}
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="text-center">
                                <div className="text-sm text-muted-foreground mb-2">AEO Score Improved</div>
                                <div className="flex items-center justify-center gap-4">
                                    <span className="text-2xl font-bold text-muted-foreground">
                                        {analysis?.score || 0}
                                    </span>
                                    <TrendingUp className="h-6 w-6 text-primary" />
                                    <span className="text-3xl font-bold text-primary">
                                        {optimization.score}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* AI Readability Metrics */}
                        <div>
                            <h4 className="font-semibold mb-3">AI Readability</h4>
                            <div className="space-y-2">
                                {Object.entries(optimization.aiReadability).filter(([key]) => key !== 'score').map(([metric, score]) => (
                                    <div key={metric} className="flex items-center gap-2">
                                        <span className="text-sm capitalize flex-1">
                                            {metric.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        <span className="text-sm font-medium">{score}</span>
                                        <Progress value={score} className="h-1.5 w-24" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Improvements Made */}
                        {optimization.improvements.length > 0 && (
                            <div>
                                <h4 className="font-semibold mb-2">Improvements Made</h4>
                                <div className="space-y-3">
                                    {optimization.improvements.map((improvement, idx) => (
                                        <div key={idx} className="p-3 bg-muted rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant={
                                                    improvement.impact === 'high' ? 'default' :
                                                        improvement.impact === 'medium' ? 'secondary' : 'outline'
                                                }>
                                                    {improvement.impact} impact
                                                </Badge>
                                                <span className="text-sm font-medium">{improvement.category}</span>
                                            </div>
                                            <div className="text-xs space-y-1">
                                                <div className="text-muted-foreground">
                                                    <span className="font-medium">Before:</span> {improvement.before}
                                                </div>
                                                <div className="text-foreground">
                                                    <span className="font-medium">After:</span> {improvement.after}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button onClick={handleAcceptOptimization} className="flex-1">
                                <Check className="mr-2 h-4 w-4" />
                                Apply AEO Optimization
                            </Button>
                            <Button onClick={() => setOptimization(null)} variant="outline">
                                <X className="mr-2 h-4 w-4" />
                                Discard
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
