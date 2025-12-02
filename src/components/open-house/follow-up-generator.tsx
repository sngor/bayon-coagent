'use client';

/**
 * FollowUpGenerator Component
 * 
 * Provides interface for generating AI-powered follow-up content for visitors.
 * Supports both single visitor and bulk generation.
 * 
 * Validates Requirements: 3.1, 3.7
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Mail, MessageSquare, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateFollowUpContent, generateBulkFollowUps } from '@/app/(app)/open-house/actions';
import { Visitor, FollowUpContent } from '@/lib/open-house/types';
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/use-toast';

interface FollowUpGeneratorProps {
    sessionId: string;
    visitors: Visitor[];
    onContentGenerated?: (visitorId: string, content: FollowUpContent) => void;
}

export function FollowUpGenerator({
    sessionId,
    visitors,
    onContentGenerated,
}: FollowUpGeneratorProps) {
    const router = useRouter();
    const [generatingVisitorId, setGeneratingVisitorId] = useState<string | null>(null);
    const [generatingBulk, setGeneratingBulk] = useState(false);
    const [bulkResults, setBulkResults] = useState<Map<string, { success: boolean; error?: string }>>(new Map());

    const visitorsWithoutFollowUp = visitors.filter(v => !v.followUpGenerated);
    const visitorsWithFollowUp = visitors.filter(v => v.followUpGenerated);

    const handleGenerateSingle = async (visitorId: string) => {
        setGeneratingVisitorId(visitorId);

        try {
            const result = await generateFollowUpContent(sessionId, visitorId);

            if (result.success && result.content) {
                toast({
                    title: 'Follow-up Generated',
                    description: 'AI-powered follow-up content has been created successfully.',
                });

                if (onContentGenerated) {
                    onContentGenerated(visitorId, result.content);
                }

                router.refresh();
            } else {
                toast({
                    title: 'Generation Failed',
                    description: result.error || 'Failed to generate follow-up content.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setGeneratingVisitorId(null);
        }
    };

    const handleGenerateBulk = async () => {
        setGeneratingBulk(true);
        setBulkResults(new Map());

        try {
            const result = await generateBulkFollowUps(sessionId);

            if (result.success && result.results) {
                const resultsMap = new Map(
                    result.results.map(r => [r.visitorId, { success: r.success, error: r.error }])
                );
                setBulkResults(resultsMap);

                const successCount = result.results.filter(r => r.success).length;
                const failureCount = result.results.filter(r => !r.success).length;

                toast({
                    title: 'Bulk Generation Complete',
                    description: `Generated ${successCount} follow-ups${failureCount > 0 ? `, ${failureCount} failed` : ''}.`,
                });

                router.refresh();
            } else {
                toast({
                    title: 'Bulk Generation Failed',
                    description: result.error || 'Failed to generate bulk follow-ups.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred during bulk generation.',
                variant: 'destructive',
            });
        } finally {
            setGeneratingBulk(false);
        }
    };

    const getInterestLevelColor = (level: string) => {
        switch (level) {
            case 'high':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'medium':
                return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'low':
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    if (visitors.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        AI Follow-up Generator
                    </CardTitle>
                    <CardDescription>
                        Generate personalized follow-up content for your visitors
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No visitors to generate follow-ups for</p>
                        <p className="text-sm mt-1">Check in visitors to start generating follow-ups</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            AI Follow-up Generator
                        </CardTitle>
                        <CardDescription>
                            Generate personalized follow-up content for your visitors
                        </CardDescription>
                    </div>
                    {visitorsWithoutFollowUp.length > 0 && (
                        <Button
                            onClick={handleGenerateBulk}
                            disabled={generatingBulk || generatingVisitorId !== null}
                        >
                            {generatingBulk ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    Generate All ({visitorsWithoutFollowUp.length})
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Visitors without follow-ups */}
                {visitorsWithoutFollowUp.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            Pending Generation ({visitorsWithoutFollowUp.length})
                        </h4>
                        {visitorsWithoutFollowUp.map((visitor) => {
                            const bulkResult = bulkResults.get(visitor.visitorId);
                            const isGenerating = generatingVisitorId === visitor.visitorId;

                            return (
                                <div
                                    key={visitor.visitorId}
                                    className="flex items-center justify-between p-4 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-medium">{visitor.name}</p>
                                            <Badge
                                                variant="outline"
                                                className={getInterestLevelColor(visitor.interestLevel)}
                                            >
                                                {visitor.interestLevel}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{visitor.email}</p>
                                        {bulkResult && !bulkResult.success && (
                                            <p className="text-sm text-destructive mt-1">
                                                {bulkResult.error || 'Generation failed'}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => handleGenerateSingle(visitor.visitorId)}
                                        disabled={isGenerating || generatingBulk}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4 mr-2" />
                                                Generate
                                            </>
                                        )}
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Visitors with follow-ups */}
                {visitorsWithFollowUp.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">
                            Generated ({visitorsWithFollowUp.length})
                        </h4>
                        {visitorsWithFollowUp.map((visitor) => (
                            <div
                                key={visitor.visitorId}
                                className="flex items-center justify-between p-4 border rounded-lg bg-muted/30"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium">{visitor.name}</p>
                                        <Badge
                                            variant="outline"
                                            className={getInterestLevelColor(visitor.interestLevel)}
                                        >
                                            {visitor.interestLevel}
                                        </Badge>
                                        {visitor.followUpSent && (
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                                                <Mail className="h-3 w-3 mr-1" />
                                                Sent
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{visitor.email}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="text-sm text-muted-foreground">Ready</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Info message */}
                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1 text-sm">
                        <p className="font-medium text-blue-500 mb-1">AI-Powered Personalization</p>
                        <p className="text-muted-foreground">
                            Follow-ups are automatically tailored to each visitor's interest level:
                            <span className="font-medium text-green-500"> High</span> = urgent,
                            <span className="font-medium text-yellow-500"> Medium</span> = balanced,
                            <span className="font-medium text-gray-500"> Low</span> = educational
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
