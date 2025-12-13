'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, MapPin, Users, Calendar, BarChart3, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Import our improvements
import { ErrorBoundary, AIErrorBoundary } from '@/components/error-boundary';
import { AILoadingState, useAIOperation } from '@/components/ai-loading-state';
import { performanceMonitor, withPerformanceTracking } from '@/lib/performance';
import { cache, cacheKeys, withCache } from '@/lib/cache';
import { analytics, trackAIGeneration, useAnalytics } from '@/lib/analytics';

// Mock life event prediction function (replace with actual implementation)
const enhancedLifeEventPrediction = withPerformanceTracking(
    'life-event-prediction',
    withCache(
        (location: string, demographics: string, timeframe: string) =>
            cacheKeys.marketAnalysis(location + demographics + timeframe, 'life-events'),
        { ttl: 1000 * 60 * 60 * 2 } // 2 hours cache
    )(async (formData: { location: string; demographics: string; timeframe: string; eventType: string }) => {
        const { location, demographics, timeframe, eventType } = formData;

        // Track prediction start
        trackAIGeneration.started('life-event-prediction', location.length + demographics.length);

        const startTime = Date.now();
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock prediction results
            const predictions = {
                totalHouseholds: Math.floor(Math.random() * 10000) + 5000,
                likelyToMove: Math.floor(Math.random() * 500) + 100,
                confidence: Math.floor(Math.random() * 30) + 70,
                topReasons: [
                    'Growing family (35%)',
                    'Job relocation (28%)',
                    'Downsizing (22%)',
                    'Investment opportunity (15%)'
                ],
                demographics: {
                    ageGroups: {
                        '25-35': 35,
                        '36-45': 28,
                        '46-55': 22,
                        '56+': 15
                    },
                    incomeRanges: {
                        '$50k-$75k': 25,
                        '$75k-$100k': 30,
                        '$100k-$150k': 28,
                        '$150k+': 17
                    }
                },
                timeline: {
                    'Next 3 months': 15,
                    '3-6 months': 25,
                    '6-12 months': 35,
                    '12+ months': 25
                }
            };

            const duration = Date.now() - startTime;
            trackAIGeneration.completed('life-event-prediction', duration, true, JSON.stringify(predictions).length);

            return { success: true, data: predictions };
        } catch (error) {
            const duration = Date.now() - startTime;
            trackAIGeneration.failed('life-event-prediction', error instanceof Error ? error.message : 'Unknown error', duration);
            throw error;
        }
    })
);

export default function EnhancedMarketTrendsPage() {
    const { trackEvent } = useAnalytics();

    // Form state
    const [location, setLocation] = useState('');
    const [demographics, setDemographics] = useState('');
    const [timeframe, setTimeframe] = useState('6-months');
    const [eventType, setEventType] = useState('all');

    // Results state
    const [predictions, setPredictions] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // AI operation state
    const predictionOperation = useAIOperation();

    // Track page view
    useEffect(() => {
        trackEvent('page_view', { page: 'market_trends' });
    }, [trackEvent]);

    // Handle prediction analysis
    const handleAnalysis = async () => {
        if (!location.trim() || !demographics) return;

        setIsAnalyzing(true);
        predictionOperation.startOperation();

        try {
            // Simulate analysis stages
            setTimeout(() => predictionOperation.updateStage('analyzing', 25), 500);
            setTimeout(() => predictionOperation.updateStage('generating', 60), 1000);
            setTimeout(() => predictionOperation.updateStage('finalizing', 90), 1500);

            const result = await enhancedLifeEventPrediction({
                location,
                demographics,
                timeframe,
                eventType
            });

            if (result.success) {
                setPredictions(result.data);
                predictionOperation.completeOperation();

                toast({
                    title: '✨ Analysis Complete!',
                    description: `Found ${result.data.likelyToMove} potential leads in ${location}`,
                    duration: 4000,
                });

                trackEvent('life_event_prediction_completed', {
                    location,
                    demographics,
                    timeframe,
                    eventType,
                    leadsFound: result.data.likelyToMove
                });
            }
        } catch (error) {
            predictionOperation.failOperation(error instanceof Error ? error.message : 'Analysis failed');
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: 'Could not complete life event prediction.',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <ErrorBoundary>
            <div className="space-y-8">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold">Enhanced Market Trends</h1>
                            <p className="text-muted-foreground">
                                AI-powered life event predictions with performance tracking
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
                                    {cache.getStats().size}
                                </div>
                                <div className="text-sm text-muted-foreground">Cached Analyses</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {Math.round(performanceMonitor.getAverageTime('life-event-prediction') / 1000)}s
                                </div>
                                <div className="text-sm text-muted-foreground">Avg Analysis Time</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-600">
                                    {Math.round(performanceMonitor.getSuccessRate('life-event-prediction'))}%
                                </div>
                                <div className="text-sm text-muted-foreground">Success Rate</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Analysis Form and Results */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Life Event Predictor
                            </CardTitle>
                            <CardDescription>
                                Identify potential clients through demographic analysis
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AIErrorBoundary>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="location">Target Location</Label>
                                        <Input
                                            id="location"
                                            placeholder="e.g., Seattle, WA or 98101"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="demographics">Target Demographics</Label>
                                        <Select value={demographics} onValueChange={setDemographics}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select demographics" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="young-professionals">Young Professionals (25-35)</SelectItem>
                                                <SelectItem value="growing-families">Growing Families (30-45)</SelectItem>
                                                <SelectItem value="empty-nesters">Empty Nesters (50-65)</SelectItem>
                                                <SelectItem value="retirees">Retirees (65+)</SelectItem>
                                                <SelectItem value="first-time-buyers">First-Time Buyers</SelectItem>
                                                <SelectItem value="luxury-buyers">Luxury Buyers</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="timeframe">Analysis Timeframe</Label>
                                        <Select value={timeframe} onValueChange={setTimeframe}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="3-months">Next 3 Months</SelectItem>
                                                <SelectItem value="6-months">Next 6 Months</SelectItem>
                                                <SelectItem value="12-months">Next 12 Months</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="eventType">Life Event Type</Label>
                                        <Select value={eventType} onValueChange={setEventType}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Events</SelectItem>
                                                <SelectItem value="job-change">Job Changes</SelectItem>
                                                <SelectItem value="family-growth">Family Growth</SelectItem>
                                                <SelectItem value="retirement">Retirement</SelectItem>
                                                <SelectItem value="investment">Investment</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        onClick={handleAnalysis}
                                        disabled={!location.trim() || !demographics || isAnalyzing}
                                        className="w-full"
                                        variant="ai"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <TrendingUp className="mr-2 h-4 w-4 animate-spin" />
                                                Analyzing...
                                            </>
                                        ) : (
                                            <>
                                                <TrendingUp className="mr-2 h-4 w-4" />
                                                Analyze Market
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </AIErrorBoundary>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Prediction Results
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isAnalyzing ? (
                                <AILoadingState
                                    operation="market-analysis"
                                    stage={predictionOperation.stage}
                                    progress={predictionOperation.progress}
                                />
                            ) : predictions ? (
                                <div className="space-y-6">
                                    {/* Key Metrics */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {predictions.totalHouseholds.toLocaleString()}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Households</div>
                                        </div>
                                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                            <div className="text-2xl font-bold text-green-600">
                                                {predictions.likelyToMove}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Likely to Move</div>
                                        </div>
                                        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {predictions.confidence}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Confidence</div>
                                        </div>
                                        <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {Math.round((predictions.likelyToMove / predictions.totalHouseholds) * 100)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Move Rate</div>
                                        </div>
                                    </div>

                                    {/* Top Reasons */}
                                    <div>
                                        <h3 className="font-semibold mb-3">Top Reasons for Moving</h3>
                                        <div className="space-y-2">
                                            {predictions.topReasons.map((reason: string, index: number) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                                    <span className="text-sm">{reason}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Demographics Breakdown */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="font-semibold mb-3">Age Groups</h3>
                                            <div className="space-y-2">
                                                {Object.entries(predictions.demographics.ageGroups).map(([age, percentage]) => (
                                                    <div key={age} className="flex items-center justify-between">
                                                        <span className="text-sm">{age}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-20 h-2 bg-gray-200 rounded-full">
                                                                <div
                                                                    className="h-2 bg-blue-500 rounded-full"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-semibold mb-3">Timeline</h3>
                                            <div className="space-y-2">
                                                {Object.entries(predictions.timeline).map(([period, percentage]) => (
                                                    <div key={period} className="flex items-center justify-between">
                                                        <span className="text-sm">{period}</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-20 h-2 bg-gray-200 rounded-full">
                                                                <div
                                                                    className="h-2 bg-green-500 rounded-full"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-sm text-muted-foreground">{percentage}%</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-4 border-t">
                                        <Button
                                            onClick={() => {
                                                const reportText = `Market Analysis for ${location}\n\nTotal Households: ${predictions.totalHouseholds.toLocaleString()}\nLikely to Move: ${predictions.likelyToMove}\nConfidence: ${predictions.confidence}%\n\nTop Reasons:\n${predictions.topReasons.join('\n')}`;
                                                navigator.clipboard.writeText(reportText);
                                                toast({ title: 'Report copied to clipboard!' });
                                            }}
                                            variant="outline"
                                        >
                                            Copy Report
                                        </Button>
                                        <Button>
                                            Save Analysis
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-12">
                                    <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                    <p>Your market analysis will appear here</p>
                                    <p className="text-sm mt-2">
                                        Enter location and demographics above to start analysis
                                    </p>
                                </div>
                            )}

                            {predictionOperation.error && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800">{predictionOperation.error}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tips Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Market Analysis Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-medium mb-2">🎯 Target Specific Areas</h4>
                                <p className="text-muted-foreground">
                                    Use ZIP codes or neighborhoods for more accurate predictions
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">⚡ Cached Results</h4>
                                <p className="text-muted-foreground">
                                    Similar analyses are cached for 2 hours for instant results
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">📊 Track Performance</h4>
                                <p className="text-muted-foreground">
                                    Monitor analysis times and success rates in real-time
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">💡 Act on Insights</h4>
                                <p className="text-muted-foreground">
                                    Use predictions to focus your marketing and prospecting efforts
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ErrorBoundary>
    );
}