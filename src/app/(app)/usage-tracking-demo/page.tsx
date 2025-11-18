/**
 * Usage Tracking Demo Page
 * 
 * Demonstrates the usage tracking system and displays usage insights
 */

'use client';

import { useState } from 'react';
import { useTrackFeature, useFrequentFeatures, useRecentFeatures, useUsageInsights, useTrackFeatureManually } from '@/hooks/use-usage-tracking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    TrendingUp,
    Clock,
    BarChart3,
    Trash2,
    Download,
    Upload,
    Activity,
    Target,
    Award
} from 'lucide-react';
import { clearUsageData, exportUsageData, importUsageData } from '@/lib/usage-tracking';
import { toast } from '@/hooks/use-toast';

export default function UsageTrackingDemo() {
    // Track this page view
    useTrackFeature(
        'usage-tracking-demo',
        'Usage Tracking Demo',
        '/usage-tracking-demo',
        'Demo'
    );

    const { features: frequentFeatures, refresh: refreshFrequent } = useFrequentFeatures(10);
    const { features: recentFeatures, refresh: refreshRecent } = useRecentFeatures(10);
    const { insights, refresh: refreshInsights } = useUsageInsights();
    const trackManually = useTrackFeatureManually();

    const [importData, setImportData] = useState('');

    // Demo features to track
    const demoFeatures = [
        { id: 'dashboard', name: 'Dashboard', path: '/dashboard', category: 'Core' },
        { id: 'marketing-plan', name: 'Marketing Plan', path: '/marketing-plan', category: 'Marketing' },
        { id: 'brand-audit', name: 'Brand Audit', path: '/brand-audit', category: 'Analytics' },
        { id: 'content-engine', name: 'Content Engine', path: '/content-engine', category: 'Content' },
        { id: 'research-agent', name: 'Research Agent', path: '/research-agent', category: 'Research' },
    ];

    const handleTrackFeature = (feature: typeof demoFeatures[0]) => {
        trackManually(feature.id, feature.name, feature.path, feature.category);
        refreshFrequent();
        refreshRecent();
        refreshInsights();
        toast({
            title: 'Feature Tracked',
            description: `Tracked usage of ${feature.name}`,
        });
    };

    const handleClearData = () => {
        clearUsageData();
        refreshFrequent();
        refreshRecent();
        refreshInsights();
        toast({
            title: 'Data Cleared',
            description: 'All usage data has been cleared',
            variant: 'destructive',
        });
    };

    const handleExport = () => {
        const data = exportUsageData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'usage-data.json';
        a.click();
        URL.revokeObjectURL(url);
        toast({
            title: 'Data Exported',
            description: 'Usage data has been downloaded',
        });
    };

    const handleImport = () => {
        if (!importData) {
            toast({
                title: 'No Data',
                description: 'Please paste JSON data to import',
                variant: 'destructive',
            });
            return;
        }

        const success = importUsageData(importData);
        if (success) {
            refreshFrequent();
            refreshRecent();
            refreshInsights();
            setImportData('');
            toast({
                title: 'Data Imported',
                description: 'Usage data has been imported successfully',
            });
        } else {
            toast({
                title: 'Import Failed',
                description: 'Invalid JSON data',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Usage Tracking Demo</h1>
                <p className="text-muted-foreground mt-2">
                    Demonstrates the usage pattern tracking system that learns from user behavior
                </p>
            </div>

            {/* Usage Insights */}
            {insights && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{insights.totalFeatures}</div>
                            <p className="text-xs text-muted-foreground">Features used</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{insights.totalUsage}</div>
                            <p className="text-xs text-muted-foreground">Total interactions</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold truncate">
                                {insights.mostUsedFeature?.featureName || 'None'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {insights.mostUsedFeature?.count || 0} times
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Favorite Category</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold truncate">
                                {insights.favoriteCategory || 'None'}
                            </div>
                            <p className="text-xs text-muted-foreground">Most used category</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Frequently Used Features */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            <CardTitle>Frequently Used Features</CardTitle>
                        </div>
                        <CardDescription>
                            Features ranked by usage frequency and recency
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {frequentFeatures.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No frequent features yet. Track some features to see them here.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {frequentFeatures.map((feature, index) => (
                                    <div
                                        key={feature.featureId}
                                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{feature.featureName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {feature.category} • {feature.count} uses
                                            </div>
                                        </div>
                                        <Badge variant="secondary">
                                            {(feature.score * 100).toFixed(0)}%
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recently Used Features */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            <CardTitle>Recently Used Features</CardTitle>
                        </div>
                        <CardDescription>
                            Features used in the last 7 days
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentFeatures.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">
                                No recent features. Track some features to see them here.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {recentFeatures.map((feature) => (
                                    <div
                                        key={feature.featureId}
                                        className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                    >
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{feature.featureName}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {feature.category}
                                            </div>
                                        </div>
                                        <Badge variant="outline">{feature.count}</Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Demo Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Demo Controls</CardTitle>
                    <CardDescription>
                        Track demo features to see how the system learns your usage patterns
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {demoFeatures.map((feature) => (
                            <Button
                                key={feature.id}
                                variant="outline"
                                onClick={() => handleTrackFeature(feature)}
                                className="justify-start"
                            >
                                <Activity className="mr-2 h-4 w-4" />
                                Track {feature.name}
                            </Button>
                        ))}
                    </div>

                    <Separator />

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export Data
                        </Button>
                        <Button variant="destructive" onClick={handleClearData}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All Data
                        </Button>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Import Data</label>
                        <textarea
                            className="w-full min-h-[100px] p-2 rounded-md border bg-background text-sm font-mono"
                            placeholder="Paste JSON data here..."
                            value={importData}
                            onChange={(e) => setImportData(e.target.value)}
                        />
                        <Button onClick={handleImport}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import Data
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Implementation Notes */}
            <Card>
                <CardHeader>
                    <CardTitle>Implementation Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-semibold mb-2">How It Works</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Tracks feature usage in localStorage for persistence</li>
                            <li>Calculates usage scores based on frequency (60%) and recency (40%)</li>
                            <li>Surfaces frequently used features in navigation</li>
                            <li>Provides insights about usage patterns</li>
                            <li>Syncs across browser tabs using storage events</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Usage in Components</h4>
                        <pre className="p-3 rounded-md bg-muted overflow-x-auto">
                            {`// Track feature automatically on mount
useTrackFeature('feature-id', 'Feature Name', '/path', 'Category');

// Get frequent features
const { features } = useFrequentFeatures(5);

// Track manually
const track = useTrackFeatureManually();
track('id', 'name', '/path', 'category');`}
                        </pre>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Integration Points</h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Add <code className="text-xs bg-muted px-1 py-0.5 rounded">useTrackFeature</code> to page components</li>
                            <li>Display <code className="text-xs bg-muted px-1 py-0.5 rounded">FrequentFeatures</code> in sidebar</li>
                            <li>Use insights for personalized dashboard</li>
                            <li>Export data for AI-powered recommendations</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
