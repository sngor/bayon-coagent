'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    AIOperationProgress,
    AIOperationProgressCompact,
    useAIOperation,
} from '@/components/ui/ai-operation-progress';

export default function AIOperationProgressDemo() {
    const [activeDemo, setActiveDemo] = React.useState<string | null>(null);

    // Demo 1: Marketing Plan Generation
    const marketingPlan = useAIOperation('generate-marketing-plan');

    // Demo 2: NAP Audit
    const napAudit = useAIOperation('run-nap-audit');

    // Demo 3: Research Agent
    const researchAgent = useAIOperation('run-research-agent');

    const simulateOperation = (
        operation: ReturnType<typeof useAIOperation>,
        demoName: string,
        duration: number = 10000
    ) => {
        setActiveDemo(demoName);
        const tracker = operation.start();

        // Simulate progress updates
        const steps = 4;
        const stepDuration = duration / steps;

        for (let i = 0; i < steps; i++) {
            setTimeout(() => {
                const progress = ((i + 1) / steps) * 100;
                tracker.updateProgress(progress, '');

                if (i === steps - 1) {
                    setTimeout(() => {
                        operation.complete();
                        setActiveDemo(null);
                    }, 500);
                }
            }, stepDuration * (i + 1));
        }
    };

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-4xl font-bold mb-2">AI Operation Progress Demo</h1>
                <p className="text-muted-foreground">
                    Smart progress indicators with estimated completion times and cancellation support
                </p>
            </div>

            {/* Full Progress Component */}
            <Card>
                <CardHeader>
                    <CardTitle>Full Progress Indicator</CardTitle>
                    <CardDescription>
                        Complete progress display with estimates, contextual messages, and cancel button
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Button
                            onClick={() => simulateOperation(marketingPlan, 'marketing-plan', 15000)}
                            disabled={activeDemo === 'marketing-plan'}
                        >
                            Generate Marketing Plan
                        </Button>
                        <Button
                            onClick={() => simulateOperation(napAudit, 'nap-audit', 20000)}
                            disabled={activeDemo === 'nap-audit'}
                        >
                            Run NAP Audit
                        </Button>
                        <Button
                            onClick={() => simulateOperation(researchAgent, 'research-agent', 45000)}
                            disabled={activeDemo === 'research-agent'}
                        >
                            Run Research Agent
                        </Button>
                    </div>

                    {marketingPlan.isRunning && marketingPlan.tracker && (
                        <AIOperationProgress
                            operationName="generate-marketing-plan"
                            tracker={marketingPlan.tracker}
                            onCancel={marketingPlan.cancel}
                        />
                    )}

                    {napAudit.isRunning && napAudit.tracker && (
                        <AIOperationProgress
                            operationName="run-nap-audit"
                            tracker={napAudit.tracker}
                            onCancel={napAudit.cancel}
                        />
                    )}

                    {researchAgent.isRunning && researchAgent.tracker && (
                        <AIOperationProgress
                            operationName="run-research-agent"
                            tracker={researchAgent.tracker}
                            onCancel={researchAgent.cancel}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Compact Progress Component */}
            <Card>
                <CardHeader>
                    <CardTitle>Compact Progress Indicator</CardTitle>
                    <CardDescription>
                        Smaller inline version for space-constrained layouts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={() => {
                            const tracker = marketingPlan.start();
                            setTimeout(() => {
                                tracker.updateProgress(50, 'Halfway there...');
                            }, 2000);
                            setTimeout(() => {
                                marketingPlan.complete();
                            }, 4000);
                        }}
                        disabled={marketingPlan.isRunning}
                    >
                        Start Compact Demo
                    </Button>

                    {marketingPlan.isRunning && marketingPlan.tracker && (
                        <AIOperationProgressCompact
                            operationName="generate-marketing-plan"
                            tracker={marketingPlan.tracker}
                            onCancel={marketingPlan.cancel}
                        />
                    )}
                </CardContent>
            </Card>

            {/* Features List */}
            <Card>
                <CardHeader>
                    <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Historical Data Tracking:</strong> Stores operation execution times
                                in localStorage to provide accurate estimates
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Smart Estimates:</strong> Calculates estimated completion time based
                                on previous runs with confidence levels
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Contextual Messages:</strong> Shows operation-specific status messages
                                that update based on progress
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Cancellation Support:</strong> Allows users to cancel long-running
                                operations with AbortController
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Auto Progress:</strong> Automatically updates progress bar based on
                                elapsed time if manual updates aren't provided
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary">✓</span>
                            <span>
                                <strong>Confidence Indicators:</strong> Shows confidence level (low/medium/high)
                                based on number of historical samples
                            </span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
