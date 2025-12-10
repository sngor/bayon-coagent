'use client';

/**
 * Enhanced Agents Test Component
 * 
 * A simple test component to verify enhanced agent functionality.
 * Use this to test the implementation before full deployment.
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    Bot,
    TestTube,
    CheckCircle2,
    XCircle,
    Loader2,
    Sparkles,
    MessageSquare,
    Lightbulb,
    Zap
} from 'lucide-react';
import { useEnhancedAgents } from '@/hooks/use-enhanced-agents';
import {
    chatWithHubAgentAction,
    getProactiveSuggestionsAction,
    initProactiveMonitoringAction,
    getCrossHubInsightsAction
} from '@/app/enhanced-agent-actions';
import { HubAgentRegistry } from '@/aws/bedrock/hub-agents/hub-agent-registry';

/**
 * Test result interface
 */
interface TestResult {
    name: string;
    status: 'pending' | 'success' | 'error';
    message: string;
    duration?: number;
}

/**
 * Enhanced Agents Test Component
 */
export function EnhancedAgentsTest() {
    const { isProactiveMonitoringEnabled, initializeProactiveMonitoring } = useEnhancedAgents();
    const [selectedHub, setSelectedHub] = useState<string>('studio');
    const [testMessage, setTestMessage] = useState<string>('Hello! Can you help me create content?');
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [isRunningTests, setIsRunningTests] = useState(false);
    const [chatResponse, setChatResponse] = useState<string>('');

    /**
     * Available hubs for testing
     */
    const hubs = [
        { value: 'studio', label: 'Studio (Maya - Creative Specialist)' },
        { value: 'brand', label: 'Brand (Alex - Brand Strategist)' },
        { value: 'market', label: 'Market (Marcus - Market Intelligence)' },
        { value: 'tools', label: 'Tools (David - Financial Expert)' },
        { value: 'library', label: 'Library (Emma - Content Curator)' },
        { value: 'assistant', label: 'Assistant (Riley - General Assistant)' }
    ];

    /**
     * Add test result
     */
    const addTestResult = (result: TestResult) => {
        setTestResults(prev => [...prev, result]);
    };

    /**
     * Update test result
     */
    const updateTestResult = (name: string, updates: Partial<TestResult>) => {
        setTestResults(prev =>
            prev.map(result =>
                result.name === name ? { ...result, ...updates } : result
            )
        );
    };

    /**
     * Test hub agent registry
     */
    const testHubAgentRegistry = async () => {
        const startTime = Date.now();
        addTestResult({
            name: 'Hub Agent Registry',
            status: 'pending',
            message: 'Testing agent registry...'
        });

        try {
            const allAgents = HubAgentRegistry.getAllAgents();
            const studioAgent = HubAgentRegistry.getAgentByHub('studio');
            const recommendedAgent = HubAgentRegistry.getRecommendedAgent(
                'generate-content',
                'studio',
                ['copywriting']
            );

            if (allAgents.size >= 7 && studioAgent && recommendedAgent) {
                updateTestResult('Hub Agent Registry', {
                    status: 'success',
                    message: `✅ Found ${allAgents.size} agents, registry working correctly`,
                    duration: Date.now() - startTime
                });
            } else {
                updateTestResult('Hub Agent Registry', {
                    status: 'error',
                    message: `❌ Registry incomplete: ${allAgents.size} agents found`
                });
            }
        } catch (error) {
            updateTestResult('Hub Agent Registry', {
                status: 'error',
                message: `❌ Registry error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    };

    /**
     * Test hub agent chat
     */
    const testHubAgentChat = async () => {
        const startTime = Date.now();
        addTestResult({
            name: 'Hub Agent Chat',
            status: 'pending',
            message: 'Testing agent chat...'
        });

        try {
            const response = await chatWithHubAgentAction({
                hubContext: selectedHub,
                message: testMessage,
                taskType: 'general-query'
            });

            if (response.success && response.data) {
                setChatResponse(response.data.response);
                updateTestResult('Hub Agent Chat', {
                    status: 'success',
                    message: `✅ Agent responded successfully (${response.data.agentUsed})`,
                    duration: Date.now() - startTime
                });
            } else {
                updateTestResult('Hub Agent Chat', {
                    status: 'error',
                    message: `❌ Chat failed: ${response.error || 'Unknown error'}`
                });
            }
        } catch (error) {
            updateTestResult('Hub Agent Chat', {
                status: 'error',
                message: `❌ Chat error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    };

    /**
     * Test proactive monitoring
     */
    const testProactiveMonitoring = async () => {
        const startTime = Date.now();
        addTestResult({
            name: 'Proactive Monitoring',
            status: 'pending',
            message: 'Testing proactive monitoring...'
        });

        try {
            if (!isProactiveMonitoringEnabled) {
                const success = await initializeProactiveMonitoring();
                if (!success) {
                    updateTestResult('Proactive Monitoring', {
                        status: 'error',
                        message: '❌ Failed to initialize proactive monitoring'
                    });
                    return;
                }
            }

            const suggestions = await getProactiveSuggestionsAction({ limit: 5 });

            if (suggestions.success) {
                updateTestResult('Proactive Monitoring', {
                    status: 'success',
                    message: `✅ Monitoring active, ${suggestions.data?.length || 0} suggestions found`,
                    duration: Date.now() - startTime
                });
            } else {
                updateTestResult('Proactive Monitoring', {
                    status: 'error',
                    message: `❌ Suggestions failed: ${suggestions.error || 'Unknown error'}`
                });
            }
        } catch (error) {
            updateTestResult('Proactive Monitoring', {
                status: 'error',
                message: `❌ Monitoring error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    };

    /**
     * Test cross-hub insights
     */
    const testCrossHubInsights = async () => {
        const startTime = Date.now();
        addTestResult({
            name: 'Cross-Hub Insights',
            status: 'pending',
            message: 'Testing cross-hub insights...'
        });

        try {
            const insights = await getCrossHubInsightsAction({
                targetHub: selectedHub,
                limit: 3
            });

            if (insights.success) {
                updateTestResult('Cross-Hub Insights', {
                    status: 'success',
                    message: `✅ Insights working, ${insights.data?.length || 0} insights found`,
                    duration: Date.now() - startTime
                });
            } else {
                updateTestResult('Cross-Hub Insights', {
                    status: 'error',
                    message: `❌ Insights failed: ${insights.error || 'Unknown error'}`
                });
            }
        } catch (error) {
            updateTestResult('Cross-Hub Insights', {
                status: 'error',
                message: `❌ Insights error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    };

    /**
     * Run all tests
     */
    const runAllTests = async () => {
        setIsRunningTests(true);
        setTestResults([]);
        setChatResponse('');

        await testHubAgentRegistry();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testHubAgentChat();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testProactiveMonitoring();
        await new Promise(resolve => setTimeout(resolve, 500));

        await testCrossHubInsights();

        setIsRunningTests(false);
    };

    /**
     * Clear results
     */
    const clearResults = () => {
        setTestResults([]);
        setChatResponse('');
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TestTube className="w-5 h-5" />
                        Enhanced AI Agents Test Suite
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Test the enhanced AI agent functionality to verify everything is working correctly.
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Test Configuration */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Test Hub</label>
                            <Select value={selectedHub} onValueChange={setSelectedHub}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {hubs.map(hub => (
                                        <SelectItem key={hub.value} value={hub.value}>
                                            {hub.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-2 block">Test Message</label>
                            <Textarea
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                placeholder="Enter a test message for the agent..."
                                className="min-h-[40px]"
                            />
                        </div>
                    </div>

                    {/* Test Actions */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={runAllTests}
                            disabled={isRunningTests}
                            className="flex items-center gap-2"
                        >
                            {isRunningTests ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Zap className="w-4 h-4" />
                            )}
                            Run All Tests
                        </Button>

                        <Button
                            variant="outline"
                            onClick={testHubAgentRegistry}
                            disabled={isRunningTests}
                        >
                            <Bot className="w-4 h-4 mr-2" />
                            Test Registry
                        </Button>

                        <Button
                            variant="outline"
                            onClick={testHubAgentChat}
                            disabled={isRunningTests}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Test Chat
                        </Button>

                        <Button
                            variant="outline"
                            onClick={testProactiveMonitoring}
                            disabled={isRunningTests}
                        >
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Test Monitoring
                        </Button>

                        <Button
                            variant="outline"
                            onClick={testCrossHubInsights}
                            disabled={isRunningTests}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Test Insights
                        </Button>

                        <Button
                            variant="ghost"
                            onClick={clearResults}
                            disabled={isRunningTests}
                        >
                            Clear Results
                        </Button>
                    </div>

                    {/* Test Results */}
                    {testResults.length > 0 && (
                        <div className="space-y-4">
                            <Separator />
                            <h3 className="font-semibold">Test Results</h3>

                            <div className="space-y-3">
                                {testResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className={cn(
                                            "flex items-start gap-3 p-3 rounded-lg border",
                                            result.status === 'success' && "bg-green-50 border-green-200",
                                            result.status === 'error' && "bg-red-50 border-red-200",
                                            result.status === 'pending' && "bg-blue-50 border-blue-200"
                                        )}
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            {result.status === 'success' && (
                                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                            )}
                                            {result.status === 'error' && (
                                                <XCircle className="w-4 h-4 text-red-600" />
                                            )}
                                            {result.status === 'pending' && (
                                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-sm">{result.name}</h4>
                                                {result.duration && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {result.duration}ms
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {result.message}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Chat Response */}
                    {chatResponse && (
                        <div className="space-y-2">
                            <Separator />
                            <h3 className="font-semibold">Agent Response</h3>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{chatResponse}</p>
                            </div>
                        </div>
                    )}

                    {/* Status Summary */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Badge variant={isProactiveMonitoringEnabled ? "default" : "secondary"}>
                                Proactive Monitoring: {isProactiveMonitoringEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                            {testResults.length > 0 && (
                                <>
                                    {testResults.filter(r => r.status === 'success').length} passed, {' '}
                                    {testResults.filter(r => r.status === 'error').length} failed, {' '}
                                    {testResults.filter(r => r.status === 'pending').length} pending
                                </>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}