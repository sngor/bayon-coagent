/**
 * Website Analysis Results Display Component
 * 
 * Displays comprehensive website analysis results including:
 * - Overall score with visual indicator
 * - Score breakdown by category
 * - Schema markup findings
 * - Meta tag analysis
 * - NAP consistency results
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/common';
import { CheckCircle2, AlertCircle, XCircle, Code, FileText, MapPin, Phone, User, Globe } from 'lucide-react';
import type { WebsiteAnalysisResult } from '@/ai/schemas/website-analysis-schemas';
import { Separator } from '@/components/ui/separator';
import { RecommendationsList } from '@/components/website-recommendations-list';

interface AnalysisResultsDisplayProps {
    analysis: WebsiteAnalysisResult;
}

/**
 * Get color class based on score
 */
function getScoreColor(score: number): string {
    if (score >= 71) return 'text-green-600 dark:text-green-400';
    if (score >= 41) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
}

/**
 * Get background color class based on score
 */
function getScoreBgColor(score: number): string {
    if (score >= 71) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 41) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
}

/**
 * Get border color class based on score
 */
function getScoreBorderColor(score: number): string {
    if (score >= 71) return 'border-green-200 dark:border-green-800';
    if (score >= 41) return 'border-yellow-200 dark:border-yellow-800';
    return 'border-red-200 dark:border-red-800';
}

/**
 * Get score label based on score
 */
function getScoreLabel(score: number): string {
    if (score >= 71) return 'Excellent';
    if (score >= 41) return 'Good';
    return 'Needs Improvement';
}

export function AnalysisResultsDisplay({ analysis }: AnalysisResultsDisplayProps) {
    const scoreColor = getScoreColor(analysis.overallScore);
    const scoreBgColor = getScoreBgColor(analysis.overallScore);
    const scoreBorderColor = getScoreBorderColor(analysis.overallScore);
    const scoreLabel = getScoreLabel(analysis.overallScore);

    return (
        <div className="space-y-6">
            {/* Overall Score Display */}
            <Card className={cn('border-2', scoreBorderColor)}>
                <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        {/* Circular Score Indicator */}
                        <div className="flex-shrink-0">
                            <div className="relative">
                                {/* Glow effect */}
                                <div className={cn('absolute inset-0 rounded-full blur-2xl opacity-30', scoreBgColor)} />

                                {/* Score circle */}
                                <div className={cn(
                                    'relative rounded-full p-8 border-4 shadow-xl',
                                    scoreBgColor,
                                    scoreBorderColor
                                )}>
                                    <div className="flex flex-col items-center">
                                        <div className={cn('text-6xl font-bold', scoreColor)}>
                                            {analysis.overallScore}
                                        </div>
                                        <div className="text-sm font-medium text-muted-foreground mt-1">
                                            out of 100
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Score Badge */}
                            <div className="flex justify-center mt-4">
                                <Badge className={cn('text-sm px-4 py-1', scoreBgColor, scoreColor)}>
                                    {scoreLabel}
                                </Badge>
                            </div>
                        </div>

                        {/* Score Explanation */}
                        <div className="flex-1 space-y-4">
                            <div>
                                <h3 className="text-2xl font-bold font-headline mb-2">
                                    AI Optimization Score
                                </h3>
                                <p className="text-muted-foreground">
                                    Your website scored <span className={cn('font-bold', scoreColor)}>{analysis.overallScore}/100</span> for AI Engine Optimization.
                                    This measures how well AI search engines like ChatGPT, Perplexity, and Claude can discover and understand your website.
                                </p>
                            </div>

                            {/* Analyzed Date */}
                            <div className="text-sm text-muted-foreground">
                                Analyzed on {new Date(analysis.analyzedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Score Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Score Breakdown</CardTitle>
                    <CardDescription>
                        How your website performs across key optimization categories
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Schema Markup */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Code className="h-4 w-4 text-primary" />
                                <span className="font-semibold">Schema Markup</span>
                            </div>
                            <span className="text-lg font-bold text-primary">
                                {analysis.scoreBreakdown.schemaMarkup}/30
                            </span>
                        </div>
                        <Progress
                            value={(analysis.scoreBreakdown.schemaMarkup / 30) * 100}
                            className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Structured data that helps AI understand your content
                        </p>
                    </div>

                    <Separator />

                    {/* Meta Tags */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                <span className="font-semibold">Meta Tags</span>
                            </div>
                            <span className="text-lg font-bold text-primary">
                                {analysis.scoreBreakdown.metaTags}/25
                            </span>
                        </div>
                        <Progress
                            value={(analysis.scoreBreakdown.metaTags / 25) * 100}
                            className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Title, description, and social media tags
                        </p>
                    </div>

                    <Separator />

                    {/* Structured Data */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-primary" />
                                <span className="font-semibold">Structured Data Quality</span>
                            </div>
                            <span className="text-lg font-bold text-primary">
                                {analysis.scoreBreakdown.structuredData}/25
                            </span>
                        </div>
                        <Progress
                            value={(analysis.scoreBreakdown.structuredData / 25) * 100}
                            className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Overall quality and completeness of structured data
                        </p>
                    </div>

                    <Separator />

                    {/* NAP Consistency */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" />
                                <span className="font-semibold">NAP Consistency</span>
                            </div>
                            <span className="text-lg font-bold text-primary">
                                {analysis.scoreBreakdown.napConsistency}/20
                            </span>
                        </div>
                        <Progress
                            value={(analysis.scoreBreakdown.napConsistency / 20) * 100}
                            className="h-2"
                        />
                        <p className="text-xs text-muted-foreground">
                            Consistency of business name, address, and phone
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Schema Markup Findings */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <Code className="h-5 w-5 text-primary" />
                        Schema Markup Analysis
                    </CardTitle>
                    <CardDescription>
                        Structured data found on your website
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Schema Found Status */}
                    <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
                        {analysis.schemaMarkup.found ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">Schema Markup Detected</p>
                                    <p className="text-sm text-muted-foreground">
                                        Found {analysis.schemaMarkup.types.length} schema type(s)
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">No Schema Markup Found</p>
                                    <p className="text-sm text-muted-foreground">
                                        Adding schema markup will significantly improve AI discoverability
                                    </p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Schema Types */}
                    {analysis.schemaMarkup.types.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Schema Types Found</h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.schemaMarkup.types.map((type) => (
                                    <Badge key={type} variant="secondary" className="font-mono">
                                        {type}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Schema Properties */}
                    {Object.keys(analysis.schemaMarkup.properties).length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2">Key Properties</h4>
                            <div className="space-y-2">
                                {Object.entries(analysis.schemaMarkup.properties).slice(0, 5).map(([key, value]) => (
                                    <div key={key} className="flex items-start gap-2 text-sm">
                                        <span className="font-mono text-muted-foreground min-w-[120px]">{key}:</span>
                                        <span className="text-foreground break-all">
                                            {typeof value === 'string' ? value : JSON.stringify(value)}
                                        </span>
                                    </div>
                                ))}
                                {Object.keys(analysis.schemaMarkup.properties).length > 5 && (
                                    <p className="text-xs text-muted-foreground">
                                        +{Object.keys(analysis.schemaMarkup.properties).length - 5} more properties
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Schema Issues */}
                    {analysis.schemaMarkup.issues.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                Issues Found
                            </h4>
                            <ul className="space-y-2">
                                {analysis.schemaMarkup.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">•</span>
                                        <span>{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Schema Recommendations */}
                    {analysis.schemaMarkup.recommendations.length > 0 && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                                Recommendations
                            </h4>
                            <ul className="space-y-2">
                                {analysis.schemaMarkup.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
                                        <span className="text-blue-600 dark:text-blue-400 mt-0.5">→</span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Meta Tags Analysis */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Meta Tags Analysis
                    </CardTitle>
                    <CardDescription>
                        Title, description, and social media tags
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Title Tag */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Title Tag</h4>
                            {analysis.metaTags.title.isOptimal ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Optimal
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Needs Improvement
                                </Badge>
                            )}
                        </div>

                        {analysis.metaTags.title.content && (
                            <div className="p-3 rounded-md bg-muted/50 border">
                                <p className="text-sm">{analysis.metaTags.title.content}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Length: {analysis.metaTags.title.length} characters</span>
                            <span className="text-xs">(Optimal: 30-60)</span>
                        </div>

                        {analysis.metaTags.title.issues.length > 0 && (
                            <ul className="space-y-1">
                                {analysis.metaTags.title.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <Separator />

                    {/* Meta Description */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Meta Description</h4>
                            {analysis.metaTags.description.isOptimal ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Optimal
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Needs Improvement
                                </Badge>
                            )}
                        </div>

                        {analysis.metaTags.description.content && (
                            <div className="p-3 rounded-md bg-muted/50 border">
                                <p className="text-sm">{analysis.metaTags.description.content}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Length: {analysis.metaTags.description.length} characters</span>
                            <span className="text-xs">(Optimal: 120-160)</span>
                        </div>

                        {analysis.metaTags.description.issues.length > 0 && (
                            <ul className="space-y-1">
                                {analysis.metaTags.description.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <Separator />

                    {/* Open Graph Tags */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Open Graph Tags</h4>
                            {analysis.metaTags.openGraph.found ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Found
                                </Badge>
                            ) : (
                                <Badge variant="secondary">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Not Found
                                </Badge>
                            )}
                        </div>

                        {analysis.metaTags.openGraph.found && Object.keys(analysis.metaTags.openGraph.properties).length > 0 && (
                            <div className="space-y-2">
                                {Object.entries(analysis.metaTags.openGraph.properties).map(([key, value]) => (
                                    <div key={key} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30">
                                        <span className="font-mono text-muted-foreground min-w-[100px]">{key}:</span>
                                        <span className="text-foreground break-all">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {analysis.metaTags.openGraph.issues.length > 0 && (
                            <ul className="space-y-1">
                                {analysis.metaTags.openGraph.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <Separator />

                    {/* Twitter Card Tags */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Twitter Card Tags</h4>
                            {analysis.metaTags.twitterCard.found ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Found
                                </Badge>
                            ) : (
                                <Badge variant="secondary">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Not Found
                                </Badge>
                            )}
                        </div>

                        {analysis.metaTags.twitterCard.found && Object.keys(analysis.metaTags.twitterCard.properties).length > 0 && (
                            <div className="space-y-2">
                                {Object.entries(analysis.metaTags.twitterCard.properties).map(([key, value]) => (
                                    <div key={key} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30">
                                        <span className="font-mono text-muted-foreground min-w-[100px]">{key}:</span>
                                        <span className="text-foreground break-all">{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {analysis.metaTags.twitterCard.issues.length > 0 && (
                            <ul className="space-y-1">
                                {analysis.metaTags.twitterCard.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                        <span>{issue}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* NAP Consistency Results */}
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        NAP Consistency Check
                    </CardTitle>
                    <CardDescription>
                        Business name, address, and phone number consistency
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Overall Consistency Score */}
                    <div className="p-4 rounded-lg border bg-gradient-to-br from-primary/5 to-purple-600/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Overall Consistency</span>
                            <span className="text-2xl font-bold text-primary">
                                {analysis.napConsistency.overallConsistency}%
                            </span>
                        </div>
                        <Progress
                            value={analysis.napConsistency.overallConsistency}
                            className="h-2"
                        />
                    </div>

                    {/* Name Consistency */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-semibold">Business Name</h4>
                            </div>
                            {analysis.napConsistency.name.matches ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Matches
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Mismatch
                                </Badge>
                            )}
                        </div>

                        {analysis.napConsistency.name.found && (
                            <div className="p-3 rounded-md bg-muted/50 border">
                                <p className="text-sm">{analysis.napConsistency.name.found}</p>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                            Confidence: {Math.round(analysis.napConsistency.name.confidence * 100)}%
                        </div>
                    </div>

                    <Separator />

                    {/* Address Consistency */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-semibold">Address</h4>
                            </div>
                            {analysis.napConsistency.address.matches ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Matches
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Mismatch
                                </Badge>
                            )}
                        </div>

                        {analysis.napConsistency.address.found && (
                            <div className="p-3 rounded-md bg-muted/50 border">
                                <p className="text-sm">{analysis.napConsistency.address.found}</p>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                            Confidence: {Math.round(analysis.napConsistency.address.confidence * 100)}%
                        </div>
                    </div>

                    <Separator />

                    {/* Phone Consistency */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-semibold">Phone Number</h4>
                            </div>
                            {analysis.napConsistency.phone.matches ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Matches
                                </Badge>
                            ) : (
                                <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Mismatch
                                </Badge>
                            )}
                        </div>

                        {analysis.napConsistency.phone.found && (
                            <div className="p-3 rounded-md bg-muted/50 border">
                                <p className="text-sm">{analysis.napConsistency.phone.found}</p>
                            </div>
                        )}

                        <div className="text-sm text-muted-foreground">
                            Confidence: {Math.round(analysis.napConsistency.phone.confidence * 100)}%
                        </div>
                    </div>

                    {/* NAP Consistency Help */}
                    {analysis.napConsistency.overallConsistency < 100 && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                        NAP Inconsistency Detected
                                    </h4>
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                                        Your website's business information doesn't match your profile.
                                        Update your website to match your profile exactly for better local SEO and AI discoverability.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recommendations Section */}
            {analysis.recommendations && analysis.recommendations.length > 0 && (
                <RecommendationsList recommendations={analysis.recommendations} />
            )}
        </div>
    );
}
