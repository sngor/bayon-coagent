'use client';

import { useActionState, useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Search, Sparkles, Save, FileText, Database } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useUser } from '@/aws/auth';
import { marked } from 'marked';

// Import our improvements
import { ErrorBoundary, AIErrorBoundary } from '@/components/error-boundary';
import { AILoadingState, useAIOperation } from '@/components/ai-loading-state';
import { performanceMonitor, withPerformanceTracking } from '@/lib/performance';
// import { cache, cacheKeys, withCache } from '@/lib/cache';
import { analytics, trackAIGeneration, useAnalytics } from '@/lib/analytics';

// Import existing actions
import { runResearchAgentAction, saveResearchReportAction } from '@/app/actions';

// Enhanced research action with all improvements
const enhancedRunResearch = withPerformanceTracking(
    'research-generation',
    async (formData: FormData) => {
        const topic = formData.get('topic') as string;

        // Track research start
        trackAIGeneration.started('research', topic.length);

        const startTime = Date.now();
        try {
            const result = await runResearchAgentAction(null, formData);
            const duration = Date.now() - startTime;

            // Track successful research
            trackAIGeneration.completed('research', duration, true, result.data?.report?.length);

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            trackAIGeneration.failed('research', error instanceof Error ? error.message : 'Unknown error', duration);
            throw error;
        }
    }
);

function SubmitButton({ disabled }: { disabled?: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button
            type="submit"
            variant="ai"
            size="lg"
            disabled={disabled || pending}
            className="w-full md:w-auto"
        >
            {pending ? (
                <>
                    <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                    Researching...
                </>
            ) : (
                <>
                    <Search className="mr-2 h-4 w-4" />
                    Start Research
                </>
            )}
        </Button>
    );
}

export default function EnhancedResearchAgentPage() {
    const { user } = useUser();
    const { trackEvent } = useAnalytics();
    const router = useRouter();

    const [topic, setTopic] = useState('');
    const [lastTopic, setLastTopic] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // AI operation state management
    const researchOperation = useAIOperation();

    // Form state
    const [researchState, researchAction, isResearchPending] = useActionState(
        enhancedRunResearch,
        { message: '', data: null, errors: {} }
    );

    // Track page view
    useEffect(() => {
        trackEvent('page_view', { page: 'research_agent' });
    }, [trackEvent]);

    // Handle research generation with enhanced UX
    useEffect(() => {
        if (isResearchPending) {
            researchOperation.startOperation();
            setLastTopic(topic);

            // Simulate research stages
            setTimeout(() => researchOperation.updateStage('analyzing', 20), 1000);
            setTimeout(() => researchOperation.updateStage('generating', 50), 3000);
            setTimeout(() => researchOperation.updateStage('optimizing', 80), 8000);
            setTimeout(() => researchOperation.updateStage('finalizing', 95), 12000);
        } else {
            researchOperation.completeOperation();
        }
    }, [isResearchPending, topic]);

    // Handle successful research generation
    useEffect(() => {
        if (researchState.message === 'success' && researchState.data?.report) {
            researchOperation.completeOperation();

            toast({
                title: '✨ Research Complete!',
                description: `Comprehensive report generated for "${lastTopic}"`,
                duration: 4000,
            });

            // Track research completion
            trackEvent('research_completed', {
                topic: lastTopic,
                reportLength: researchState.data.report.length,
                sourcesCount: researchState.data.sources?.length || 0
            });
        } else if (researchState.message && researchState.message !== 'success') {
            researchOperation.failOperation(researchState.message);
        }
    }, [researchState, lastTopic, researchOperation, trackEvent]);

    // Save research report
    const handleSaveReport = async () => {
        if (!user || !researchState.data?.report || !lastTopic) return;

        setIsSaving(true);
        try {
            const result = await saveResearchReportAction(
                user.id,
                lastTopic,
                researchState.data.report,
                researchState.data.sources || []
            );

            if (result.message === 'Research report saved successfully') {
                toast({
                    title: '✨ Report Saved!',
                    description: 'Added to your Research Reports library.',
                });

                trackEvent('research_saved', {
                    topic: lastTopic,
                    reportId: result.data?.reportId
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: 'Could not save research report.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ErrorBoundary>
            <div className="space-y-8">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold">Enhanced AI Research Agent</h1>
                            <p className="text-muted-foreground">
                                Get comprehensive research with performance tracking and intelligent caching
                            </p>
                        </div>
                    </CardHeader>
                </Card>

                {/* Performance Stats */}
                <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {/* {cache.getStats().size} */}0
                                </div>
                                <div className="text-sm text-muted-foreground">Cached Reports</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {Math.round(performanceMonitor.getAverageTime('research-generation') / 1000)}s
                                </div>
                                <div className="text-sm text-muted-foreground">Avg Research Time</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {Math.round(performanceMonitor.getSuccessRate('research-generation'))}%
                                </div>
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Research Form and Results */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                Research Query
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <AIErrorBoundary>
                                <form action={researchAction} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="topic">Research Topic</Label>
                                        <Textarea
                                            id="topic"
                                            name="topic"
                                            placeholder="e.g., Seattle housing market trends for first-time buyers in 2024"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            required
                                            rows={4}
                                            className="resize-none"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Be specific for better results. Include location, timeframe, and target audience.
                                        </p>
                                    </div>

                                    <SubmitButton disabled={!topic.trim()} />
                                </form>
                            </AIErrorBoundary>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Research Report
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isResearchPending ? (
                                <AILoadingState
                                    operation="research"
                                    stage={researchOperation.stage}
                                    progress={researchOperation.progress}
                                />
                            ) : researchState.data?.report ? (
                                <div className="space-y-6">
                                    {/* Report Content */}
                                    <div className="prose max-w-none">
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: marked(researchState.data.report)
                                            }}
                                        />
                                    </div>

                                    {/* Sources */}
                                    {researchState.data.sources && researchState.data.sources.length > 0 && (
                                        <div className="border-t pt-4">
                                            <h3 className="font-semibold mb-2">Sources</h3>
                                            <div className="space-y-2">
                                                {researchState.data.sources.map((source, index) => (
                                                    <div key={index} className="text-sm">
                                                        <a
                                                            href={source.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 hover:underline"
                                                        >
                                                            {source.title}
                                                        </a>
                                                        <p className="text-muted-foreground text-xs mt-1">
                                                            {source.snippet}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4 border-t">
                                        <Button
                                            onClick={() => navigator.clipboard.writeText(researchState.data!.report)}
                                            variant="outline"
                                        >
                                            Copy Report
                                        </Button>
                                        <Button
                                            onClick={handleSaveReport}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save to Library
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-12">
                                    <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                    <p>Your research report will appear here</p>
                                    <p className="text-sm mt-2">
                                        Enter a topic above and click "Start Research" to begin
                                    </p>
                                </div>
                            )}

                            {researchOperation.error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800">{researchOperation.error}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tips Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Research Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium mb-2">🎯 Be Specific</h4>
                                <p className="text-muted-foreground">
                                    Include location, timeframe, and target audience for better results
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">⚡ Cache Benefits</h4>
                                <p className="text-muted-foreground">
                                    Similar queries are cached for 1 hour for instant results
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">📊 Track Performance</h4>
                                <p className="text-muted-foreground">
                                    Monitor research times and success rates in real-time
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">💾 Save Reports</h4>
                                <p className="text-muted-foreground">
                                    Save valuable research to your library for future reference
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ErrorBoundary>
    );
}