'use client';

/**
 * Validation Score Display Component
 * 
 * Shows detailed validation scores for AI-generated content including:
 * - Overall score with visual indicator
 * - Goal alignment score
 * - Social media optimization score with platform breakdown
 * - SEO optimization score with detailed metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Target,
    Share2,
    Search,
    TrendingUp,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Lightbulb,
} from 'lucide-react';
import type { ValidationResult } from '@/aws/bedrock/validation-agent-enhanced';

interface ValidationScoreDisplayProps {
    validation: ValidationResult;
    showDetails?: boolean;
}

export function ValidationScoreDisplay({ validation, showDetails = true }: ValidationScoreDisplayProps) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 80) return 'bg-green-50 border-green-200';
        if (score >= 60) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    const getStatusIcon = () => {
        if (validation.passed && validation.score >= 80) {
            return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        }
        if (validation.passed) {
            return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
        }
        return <XCircle className="h-5 w-5 text-red-600" />;
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform) {
            case 'facebook': return <Facebook className="h-4 w-4" />;
            case 'instagram': return <Instagram className="h-4 w-4" />;
            case 'linkedin': return <Linkedin className="h-4 w-4" />;
            case 'twitter': return <Twitter className="h-4 w-4" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-4">
            {/* Overall Status */}
            <Alert className={getScoreBgColor(validation.score)}>
                <div className="flex items-start gap-3">
                    {getStatusIcon()}
                    <div className="flex-1">
                        <div className="font-semibold mb-1">
                            {validation.passed ? 'Validation Passed' : 'Validation Failed'}
                        </div>
                        <AlertDescription>{validation.summary}</AlertDescription>
                    </div>
                    <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(validation.score)}`}>
                            {validation.score}
                        </div>
                        <div className="text-sm text-muted-foreground">Overall</div>
                    </div>
                </div>
            </Alert>

            {/* Score Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Goal Alignment */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Goal Alignment
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(validation.scoreBreakdown.goalAlignment)}`}>
                                {validation.scoreBreakdown.goalAlignment}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={validation.scoreBreakdown.goalAlignment} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            How well content meets user's stated goal
                        </p>
                    </CardContent>
                </Card>

                {/* Social Media Score */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Share2 className="h-4 w-4" />
                                Social Media
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(validation.scoreBreakdown.socialMedia)}`}>
                                {validation.scoreBreakdown.socialMedia}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={validation.scoreBreakdown.socialMedia} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            Engagement and shareability potential
                        </p>
                    </CardContent>
                </Card>

                {/* SEO Score */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                SEO
                            </CardTitle>
                            <span className={`text-2xl font-bold ${getScoreColor(validation.scoreBreakdown.seo)}`}>
                                {validation.scoreBreakdown.seo}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={validation.scoreBreakdown.seo} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                            Search engine optimization effectiveness
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Detailed Scores */}
            {showDetails && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Social Media Details */}
                    {validation.socialMediaScore && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Share2 className="h-5 w-5" />
                                    Social Media Optimization
                                </CardTitle>
                                <CardDescription>Platform fit and engagement potential</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Engagement & Shareability */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Engagement</span>
                                            <span className="text-sm font-semibold">{validation.socialMediaScore.engagement}</span>
                                        </div>
                                        <Progress value={validation.socialMediaScore.engagement} className="h-1.5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Shareability</span>
                                            <span className="text-sm font-semibold">{validation.socialMediaScore.shareability}</span>
                                        </div>
                                        <Progress value={validation.socialMediaScore.shareability} className="h-1.5" />
                                    </div>
                                </div>

                                {/* Platform Fit */}
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Platform Fit</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(validation.socialMediaScore.platformFit).map(([platform, score]) => (
                                            <div key={platform} className="flex items-center gap-2">
                                                {getPlatformIcon(platform)}
                                                <span className="text-xs capitalize flex-1">{platform}</span>
                                                <Badge variant={score >= 70 ? 'default' : 'secondary'} className="text-xs">
                                                    {score}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Strengths */}
                                {validation.socialMediaScore.strengths.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2 text-green-700">Strengths</h4>
                                        <ul className="space-y-1">
                                            {validation.socialMediaScore.strengths.map((strength, idx) => (
                                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Improvements */}
                                {validation.socialMediaScore.improvements.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2 text-orange-700">Improvements</h4>
                                        <ul className="space-y-1">
                                            {validation.socialMediaScore.improvements.map((improvement, idx) => (
                                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                                    <TrendingUp className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                                    <span>{improvement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* SEO Details */}
                    {validation.seoScore && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Search className="h-5 w-5" />
                                    SEO Optimization
                                </CardTitle>
                                <CardDescription>Search engine visibility and ranking potential</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* SEO Metrics */}
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Keywords</span>
                                            <span className="text-sm font-semibold">{validation.seoScore.keywordOptimization}</span>
                                        </div>
                                        <Progress value={validation.seoScore.keywordOptimization} className="h-1.5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Readability</span>
                                            <span className="text-sm font-semibold">{validation.seoScore.readability}</span>
                                        </div>
                                        <Progress value={validation.seoScore.readability} className="h-1.5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Structure</span>
                                            <span className="text-sm font-semibold">{validation.seoScore.structure}</span>
                                        </div>
                                        <Progress value={validation.seoScore.structure} className="h-1.5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-sm text-muted-foreground">Meta Tags</span>
                                            <span className="text-sm font-semibold">{validation.seoScore.metaOptimization}</span>
                                        </div>
                                        <Progress value={validation.seoScore.metaOptimization} className="h-1.5" />
                                    </div>
                                </div>

                                {/* Suggested Keywords */}
                                {validation.seoScore.suggestedKeywords && validation.seoScore.suggestedKeywords.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2">Suggested Keywords</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {validation.seoScore.suggestedKeywords.map((keyword, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs">
                                                    {keyword}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Strengths */}
                                {validation.seoScore.strengths.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2 text-green-700">Strengths</h4>
                                        <ul className="space-y-1">
                                            {validation.seoScore.strengths.map((strength, idx) => (
                                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                                    <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                                                    <span>{strength}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Improvements */}
                                {validation.seoScore.improvements.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-2 text-orange-700">Improvements</h4>
                                        <ul className="space-y-1">
                                            {validation.seoScore.improvements.map((improvement, idx) => (
                                                <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                                    <TrendingUp className="h-3 w-3 text-orange-600 mt-0.5 flex-shrink-0" />
                                                    <span>{improvement}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Issues */}
            {validation.issues.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Issues Found</CardTitle>
                        <CardDescription>{validation.issues.length} issue(s) detected</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {validation.issues.map((issue, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-lg border ${issue.severity === 'critical'
                                            ? 'bg-red-50 border-red-200'
                                            : issue.severity === 'warning'
                                                ? 'bg-yellow-50 border-yellow-200'
                                                : 'bg-blue-50 border-blue-200'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        {issue.severity === 'critical' && <XCircle className="h-4 w-4 text-red-600 mt-0.5" />}
                                        {issue.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                                        {issue.severity === 'info' && <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-xs">
                                                    {issue.category}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        issue.severity === 'critical'
                                                            ? 'destructive'
                                                            : issue.severity === 'warning'
                                                                ? 'default'
                                                                : 'secondary'
                                                    }
                                                    className="text-xs"
                                                >
                                                    {issue.severity}
                                                </Badge>
                                            </div>
                                            <p className="text-sm">{issue.message}</p>
                                            {issue.suggestion && (
                                                <p className="text-xs text-muted-foreground mt-1">💡 {issue.suggestion}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Recommendations */}
            {validation.recommendations && validation.recommendations.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Recommendations
                        </CardTitle>
                        <CardDescription>Actionable suggestions to improve content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {validation.recommendations.map((rec, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                    <span className="text-primary font-semibold">{idx + 1}.</span>
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
