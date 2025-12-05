'use client';

/**
 * Lighthouse Scores Component
 * 
 * Displays recent Lighthouse audit scores and trends.
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gauge, Accessibility, CheckCircle, Search } from 'lucide-react';

interface LighthouseScore {
    timestamp: string;
    url: string;
    environment: string;
    device: 'desktop' | 'mobile';
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
}

function ScoreCircle({ score, label }: { score: number; label: string }) {
    const percentage = Math.round(score);
    const color = percentage >= 90 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
    const bgColor = percentage >= 90 ? 'bg-green-100' : percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100';

    return (
        <div className="flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full ${bgColor} flex items-center justify-center mb-2`}>
                <span className={`text-2xl font-bold ${color}`}>{percentage}</span>
            </div>
            <span className="text-sm font-medium">{label}</span>
        </div>
    );
}

export function LighthouseScores() {
    const [scores, setScores] = useState<LighthouseScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadScores() {
            try {
                const response = await fetch('/api/analytics/lighthouse');
                if (response.ok) {
                    const data = await response.json();
                    setScores(data);
                }
            } catch (error) {
                console.error('Failed to load Lighthouse scores:', error);
            } finally {
                setLoading(false);
            }
        }

        loadScores();
    }, []);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Lighthouse Scores
                    </CardTitle>
                    <CardDescription>Loading Lighthouse audit data...</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (scores.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gauge className="h-5 w-5" />
                        Lighthouse Scores
                    </CardTitle>
                    <CardDescription>No Lighthouse audit data available yet</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Run <code className="bg-muted px-1 py-0.5 rounded">npm run lighthouse</code> to generate Lighthouse reports.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const latestDesktop = scores.find((s) => s.device === 'desktop');
    const latestMobile = scores.find((s) => s.device === 'mobile');

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gauge className="h-5 w-5" />
                    Lighthouse Scores
                </CardTitle>
                <CardDescription>
                    Latest Lighthouse audit results
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Desktop Scores */}
                    {latestDesktop && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Desktop</h3>
                                <Badge variant="outline">{latestDesktop.environment}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <ScoreCircle score={latestDesktop.performance} label="Performance" />
                                <ScoreCircle score={latestDesktop.accessibility} label="Accessibility" />
                                <ScoreCircle score={latestDesktop.bestPractices} label="Best Practices" />
                                <ScoreCircle score={latestDesktop.seo} label="SEO" />
                            </div>
                            <div className="mt-4 text-sm text-muted-foreground">
                                Last updated: {new Date(latestDesktop.timestamp).toLocaleString()}
                            </div>
                        </div>
                    )}

                    {/* Mobile Scores */}
                    {latestMobile && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Mobile</h3>
                                <Badge variant="outline">{latestMobile.environment}</Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <ScoreCircle score={latestMobile.performance} label="Performance" />
                                <ScoreCircle score={latestMobile.accessibility} label="Accessibility" />
                                <ScoreCircle score={latestMobile.bestPractices} label="Best Practices" />
                                <ScoreCircle score={latestMobile.seo} label="SEO" />
                            </div>
                            <div className="mt-4 text-sm text-muted-foreground">
                                Last updated: {new Date(latestMobile.timestamp).toLocaleString()}
                            </div>
                        </div>
                    )}

                    {/* Thresholds */}
                    <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Score Thresholds</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                                <span>Good: ≥ 90</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                                <span>Needs Improvement: 50-89</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span>Poor: &lt; 50</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
