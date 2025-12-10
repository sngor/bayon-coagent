'use client';

/**
 * Test page for Strands integration
 * This page allows you to test the enhanced research capabilities
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, CheckCircle, AlertCircle } from 'lucide-react';
import { runResearchAgentAction } from '@/app/actions';
import { useActionState } from 'react';

type ResearchState = {
    message: string;
    data: any;
    errors: any;
};

const initialState: ResearchState = {
    message: '',
    data: null,
    errors: {},
};

export default function TestStrandsPage() {
    const [state, formAction, isPending] = useActionState(runResearchAgentAction, initialState);
    const [topic, setTopic] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        const formData = new FormData();
        formData.append('topic', topic);
        formAction(formData);
    };

    const testTopics = [
        'Austin Texas real estate market trends 2025',
        'First-time homebuyer opportunities in Dallas',
        'Investment property analysis for Houston suburbs',
        'Luxury real estate market conditions nationwide',
        'Commercial real estate trends in Texas',
    ];

    return (
        <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">🧪 Strands Integration Test</h1>
                <p className="text-muted-foreground">
                    Test the enhanced research capabilities powered by Strands-inspired architecture
                </p>
            </div>

            {/* Test Form */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="h-5 w-5" />
                        Research Agent Test
                    </CardTitle>
                    <CardDescription>
                        Enter a real estate research topic to test the enhanced capabilities
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Textarea
                                placeholder="Enter your research topic (e.g., Austin Texas real estate market trends 2025)"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                rows={3}
                                className="w-full"
                            />
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="text-sm text-muted-foreground">Quick test topics:</span>
                            {testTopics.map((testTopic, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    size="sm"
                                    type="button"
                                    onClick={() => setTopic(testTopic)}
                                    className="text-xs"
                                >
                                    {testTopic}
                                </Button>
                            ))}
                        </div>

                        <Button
                            type="submit"
                            disabled={isPending || !topic.trim()}
                            className="w-full"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Researching...
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2 h-4 w-4" />
                                    Start Research
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Results */}
            {state.message && (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {state.message === 'success' ? (
                                <>
                                    <CheckCircle className="h-5 w-5 text-green-500" />
                                    Research Results
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="h-5 w-5 text-red-500" />
                                    Research Failed
                                </>
                            )}
                        </CardTitle>
                        {state.data?.source && (
                            <div className="flex gap-2">
                                <Badge variant="secondary">
                                    Source: {state.data.source}
                                </Badge>
                                {state.data.citations && (
                                    <Badge variant="outline">
                                        {state.data.citations.length} Citations
                                    </Badge>
                                )}
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        {state.message === 'success' && state.data ? (
                            <div className="space-y-4">
                                {/* Research Report */}
                                <div>
                                    <h3 className="font-semibold mb-2">Research Report:</h3>
                                    <div className="bg-muted p-4 rounded-lg">
                                        <pre className="whitespace-pre-wrap text-sm">
                                            {state.data.report}
                                        </pre>
                                    </div>
                                </div>

                                {/* Citations */}
                                {state.data.citations && state.data.citations.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Sources:</h3>
                                        <ul className="space-y-1">
                                            {state.data.citations.map((citation: string, index: number) => (
                                                <li key={index} className="text-sm">
                                                    <a
                                                        href={citation}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        [{index + 1}] {citation}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Metadata */}
                                <div className="text-xs text-muted-foreground border-t pt-2">
                                    <p>Research completed using: {state.data.source}</p>
                                    {state.data.reportId && <p>Report ID: {state.data.reportId}</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="text-red-600">
                                <p className="font-semibold">Error:</p>
                                <p>{state.message}</p>
                                {state.errors && Object.keys(state.errors).length > 0 && (
                                    <pre className="mt-2 text-xs bg-red-50 p-2 rounded">
                                        {JSON.stringify(state.errors, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Integration Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Integration Status</CardTitle>
                    <CardDescription>
                        Current status of Strands integration components
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span>Enhanced Research Service</span>
                            <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Web Search Integration</span>
                            <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Market Analysis Tools</span>
                            <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Recommendation Engine</span>
                            <Badge variant="default">Active</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Bedrock Fallback</span>
                            <Badge variant="secondary">Standby</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}