'use client';

/**
 * Strands Research Form Component
 * 
 * Integrates with the Research Hub → Research Agent section
 * Follows the established component patterns and design system
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Zap, Brain } from 'lucide-react';
import { useStrandsResearch } from '@/hooks/use-strands-research';
import { cn } from '@/lib/utils';

interface StrandsResearchFormProps {
    onResult?: (result: { reportId?: string; report?: string; citations?: string[] }) => void;
    className?: string;
}

export function StrandsResearchForm({ onResult, className }: StrandsResearchFormProps) {
    const [topic, setTopic] = useState('');
    const [searchDepth, setSearchDepth] = useState<'basic' | 'advanced'>('advanced');
    const [includeMarketAnalysis, setIncludeMarketAnalysis] = useState(true);
    const [saveToLibrary, setSaveToLibrary] = useState(true);

    const {
        isLoading,
        isHealthy,
        error,
        executeResearch,
        checkHealth,
        clearError
    } = useStrandsResearch();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!topic.trim()) return;

        const result = await executeResearch({
            topic: topic.trim(),
            searchDepth,
            includeMarketAnalysis,
            saveToLibrary,
        });

        if (result && onResult) {
            onResult(result);
        }
    };

    const handleHealthCheck = async () => {
        await checkHealth();
    };

    return (
        <Card className={cn("w-full", className)}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-primary" />
                        <CardTitle>Strands Research Agent</CardTitle>
                        {isHealthy !== null && (
                            <Badge variant={isHealthy ? "default" : "destructive"}>
                                {isHealthy ? "Online" : "Offline"}
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleHealthCheck}
                        disabled={isLoading}
                    >
                        <Zap className="h-4 w-4 mr-1" />
                        Check Status
                    </Button>
                </div>
                <CardDescription>
                    Get comprehensive research and insights on any market topic using AI-powered analysis
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Research Topic */}
                    <div className="space-y-2">
                        <Label htmlFor="topic">Research Topic</Label>
                        <Textarea
                            id="topic"
                            placeholder="e.g., Austin Texas real estate market trends for 2025, first-time homebuyer programs in California, commercial real estate investment opportunities..."
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="min-h-[100px] resize-none"
                            maxLength={500}
                        />
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Be specific for better results</span>
                            <span>{topic.length}/500</span>
                        </div>
                    </div>

                    {/* Research Options */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search Depth */}
                        <div className="space-y-3">
                            <Label>Search Depth</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={searchDepth === 'basic' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSearchDepth('basic')}
                                    className="flex-1"
                                >
                                    Basic
                                </Button>
                                <Button
                                    type="button"
                                    variant={searchDepth === 'advanced' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSearchDepth('advanced')}
                                    className="flex-1"
                                >
                                    Advanced
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {searchDepth === 'basic'
                                    ? 'Faster results with essential information'
                                    : 'Comprehensive analysis with detailed insights'
                                }
                            </p>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            <Label>Options</Label>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="market-analysis" className="text-sm font-normal">
                                        Include Market Analysis
                                    </Label>
                                    <Switch
                                        id="market-analysis"
                                        checked={includeMarketAnalysis}
                                        onCheckedChange={setIncludeMarketAnalysis}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="save-library" className="text-sm font-normal">
                                        Save to Library
                                    </Label>
                                    <Switch
                                        id="save-library"
                                        checked={saveToLibrary}
                                        onCheckedChange={setSaveToLibrary}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive">{error}</p>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={clearError}
                                className="mt-2 h-auto p-0 text-destructive hover:text-destructive"
                            >
                                Dismiss
                            </Button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        disabled={!topic.trim() || isLoading}
                        className="w-full"
                        size="lg"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Researching...
                            </>
                        ) : (
                            <>
                                <Search className="h-4 w-4 mr-2" />
                                Start Research
                            </>
                        )}
                    </Button>
                </form>

                {/* Research Tips */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="text-sm font-medium mb-2">💡 Research Tips</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Be specific about location and property type</li>
                        <li>• Include timeframes for trend analysis</li>
                        <li>• Ask about specific metrics or data points</li>
                        <li>• Combine multiple topics for comprehensive insights</li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    );
}