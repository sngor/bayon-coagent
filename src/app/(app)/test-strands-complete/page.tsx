'use client';

/**
 * Complete Strands Integration Test Page
 * 
 * Comprehensive testing interface for all Strands-inspired AI services
 * Demonstrates the full capabilities of the enhanced agent system
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Zap, Brain, Target, BarChart3, Settings } from 'lucide-react';
import { useActionState } from 'react';

// Import all the enhanced actions
import { executeCompleteIntegrationTestAction, executeServicePerformanceTestAction, executeServiceValidationTestAction, generateTestDataAction } from '@/app/strands-testing-actions';
import { executeContentCampaignAction, executeListingOptimizationAction, executeBrandBuildingAction, executeInvestmentAnalysisAction } from '@/app/strands-orchestration-actions';
import { generateEnhancedMarketUpdateAction, generateEnhancedTrendAnalysisAction, generateEnhancedOpportunityAnalysisAction } from '@/app/strands-market-actions';
import { generateEnhancedListingDescriptionAction, generateSimpleListingDescriptionAction } from '@/app/strands-listing-actions';
import { generateEnhancedBlogPostAction, generateEnhancedSocialMediaAction, generateEnhancedMarketUpdateAction as generateContentMarketUpdateAction } from '@/app/strands-content-actions';
import { runResearchAgentAction } from '@/app/actions';

interface TestResult {
    success: boolean;
    testId?: string;
    testName?: string;
    status?: string;
    executionTime?: number;
    qualityScore?: number;
    validationResults?: Array<{ check: string; passed: boolean; message?: string }>;
    performanceMetrics?: any;
    error?: string;
    data?: any;
}

export default function CompleteStrandsTestPage() {
    const [activeTab, setActiveTab] = useState('overview');
    const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
    const [isRunning, setIsRunning] = useState<Record<string, boolean>>({});

    // Action states for different test types
    const [integrationTestState, integrationTestAction] = useActionState(executeCompleteIntegrationTestAction, { message: '', data: null, errors: {} });
    const [performanceTestState, performanceTestAction] = useActionState(executeServicePerformanceTestAction, { message: '', data: null, errors: {} });
    const [validationTestState, validationTestAction] = useActionState(executeServiceValidationTestAction, { message: '', data: null, errors: {} });
    const [testDataState, testDataAction] = useActionState(generateTestDataAction, { message: '', data: null, errors: {} });

    // Workflow orchestration states
    const [contentCampaignState, contentCampaignAction] = useActionState(executeContentCampaignAction, { message: '', data: null, errors: {} });
    const [listingOptimizationState, listingOptimizationAction] = useActionState(executeListingOptimizationAction, { message: '', data: null, errors: {} });
    const [brandBuildingState, brandBuildingAction] = useActionState(executeBrandBuildingAction, { message: '', data: null, errors: {} });
    const [investmentAnalysisState, investmentAnalysisAction] = useActionState(executeInvestmentAnalysisAction, { message: '', data: null, errors: {} });

    // Individual service states
    const [researchState, researchAction] = useActionState(runResearchAgentAction, { message: '', data: null, errors: {} });
    const [blogPostState, blogPostAction] = useActionState(generateEnhancedBlogPostAction, { message: '', data: null, errors: {} });
    const [socialMediaState, socialMediaAction] = useActionState(generateEnhancedSocialMediaAction, { message: '', data: null, errors: {} });
    const [listingDescState, listingDescAction] = useActionState(generateEnhancedListingDescriptionAction, { message: '', data: null, errors: {} });
    const [marketUpdateState, marketUpdateAction] = useActionState(generateEnhancedMarketUpdateAction, { message: '', data: null, errors: {} });

    const handleTestExecution = async (testName: string, action: () => Promise<void>) => {
        setIsRunning(prev => ({ ...prev, [testName]: true }));
        const startTime = Date.now();

        try {
            await action();
            const executionTime = Date.now() - startTime;

            setTestResults(prev => ({
                ...prev,
                [testName]: {
                    success: true,
                    testName,
                    executionTime,
                    status: 'completed'
                }
            }));
        } catch (error) {
            setTestResults(prev => ({
                ...prev,
                [testName]: {
                    success: false,
                    testName,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: 'failed'
                }
            }));
        } finally {
            setIsRunning(prev => ({ ...prev, [testName]: false }));
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'completed':
            case 'passed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
            case 'error':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'running':
                return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
            default:
                return <Clock className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusBadge = (status?: string) => {
        const variant = status === 'completed' || status === 'passed' ? 'default' :
            status === 'failed' || status === 'error' ? 'destructive' :
                status === 'running' ? 'secondary' : 'outline';

        return <Badge variant={variant}>{status || 'pending'}</Badge>;
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Strands AI Integration Testing</h1>
                    <p className="text-muted-foreground">
                        Comprehensive testing suite for all enhanced AI services and workflows
                    </p>
                </div>
                <Badge variant="outline" className="text-sm">
                    Phase 5: Complete Integration
                </Badge>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="integration">Integration Tests</TabsTrigger>
                    <TabsTrigger value="workflows">Workflow Tests</TabsTrigger>
                    <TabsTrigger value="services">Service Tests</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="results">Results</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Enhanced Research</CardTitle>
                                <Brain className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Phase 1</div>
                                <p className="text-xs text-muted-foreground">
                                    Multi-step research with web search integration
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Content Studio</CardTitle>
                                <Zap className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Phase 2</div>
                                <p className="text-xs text-muted-foreground">
                                    Unified content generation with SEO optimization
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Market Intelligence</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Phase 3</div>
                                <p className="text-xs text-muted-foreground">
                                    Advanced market analysis and trend forecasting
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Agent Orchestration</CardTitle>
                                <Settings className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Phase 4</div>
                                <p className="text-xs text-muted-foreground">
                                    Multi-agent workflows and process automation
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Implementation Summary</CardTitle>
                            <CardDescription>
                                Strands-inspired AI agent system with enhanced capabilities
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Enhanced Services</h4>
                                    <ul className="space-y-1 text-sm">
                                        <li>• Research Agent with web search integration</li>
                                        <li>• Content Studio with multi-platform generation</li>
                                        <li>• Listing Description with persona targeting</li>
                                        <li>• Market Intelligence with trend analysis</li>
                                        <li>• Agent Orchestration with workflow management</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Key Features</h4>
                                    <ul className="space-y-1 text-sm">
                                        <li>• Multi-step agent workflows</li>
                                        <li>• Intelligent tool orchestration</li>
                                        <li>• Performance monitoring & validation</li>
                                        <li>• Comprehensive testing framework</li>
                                        <li>• Fallback to original Bedrock flows</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Integration Tests Tab */}
                <TabsContent value="integration" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Complete Integration Test</CardTitle>
                            <CardDescription>
                                Tests all enhanced services for functionality and integration
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form action={integrationTestAction}>
                                <Button
                                    type="submit"
                                    disabled={isRunning.integration}
                                    className="w-full"
                                >
                                    {isRunning.integration ? 'Running Integration Test...' : 'Run Complete Integration Test'}
                                </Button>
                            </form>

                            {integrationTestState.message === 'success' && integrationTestState.data && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Test Status:</span>
                                        {getStatusBadge(integrationTestState.data.status)}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Execution Time:</span>
                                        <span>{integrationTestState.data.executionTime}ms</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium">Quality Score:</span>
                                        <span>{integrationTestState.data.qualityScore}%</span>
                                    </div>
                                    {integrationTestState.data.qualityScore && (
                                        <Progress value={integrationTestState.data.qualityScore} className="w-full" />
                                    )}
                                </div>
                            )}

                            {integrationTestState.message && integrationTestState.message !== 'success' && (
                                <div className="text-red-600 text-sm">
                                    {integrationTestState.message}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Test Data</CardTitle>
                            <CardDescription>
                                Generate realistic test data for different services
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <form action={testDataAction} className="space-y-4">
                                <div>
                                    <Label htmlFor="serviceType">Service Type</Label>
                                    <Select name="serviceType" defaultValue="all-services">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select service type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all-services">All Services</SelectItem>
                                            <SelectItem value="research-agent">Research Agent</SelectItem>
                                            <SelectItem value="content-studio">Content Studio</SelectItem>
                                            <SelectItem value="listing-description">Listing Description</SelectItem>
                                            <SelectItem value="market-intelligence">Market Intelligence</SelectItem>
                                            <SelectItem value="agent-orchestration">Agent Orchestration</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button type="submit" disabled={isRunning.testData}>
                                    {isRunning.testData ? 'Generating...' : 'Generate Test Data'}
                                </Button>
                            </form>

                            {testDataState.message === 'success' && testDataState.data && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium mb-2">Generated Test Data:</h4>
                                    <pre className="text-xs overflow-auto max-h-40">
                                        {JSON.stringify(testDataState.data.testData, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Workflow Tests Tab */}
                <TabsContent value="workflows" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Content Campaign Workflow</CardTitle>
                                <CardDescription>
                                    Research → Blog Content → Social Media → Market Update
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form action={contentCampaignAction} className="space-y-4">
                                    <div>
                                        <Label htmlFor="topic">Topic</Label>
                                        <Input
                                            name="topic"
                                            placeholder="Austin real estate market trends 2024"
                                            defaultValue="Austin real estate market trends 2024"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="targetAudience">Target Audience</Label>
                                        <Select name="targetAudience" defaultValue="agents">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="agents">Agents</SelectItem>
                                                <SelectItem value="buyers">Buyers</SelectItem>
                                                <SelectItem value="sellers">Sellers</SelectItem>
                                                <SelectItem value="investors">Investors</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <input
                                        type="hidden"
                                        name="platforms"
                                        value={JSON.stringify(['linkedin', 'facebook'])}
                                    />
                                    <input
                                        type="hidden"
                                        name="location"
                                        value="Austin, TX"
                                    />
                                    <Button type="submit" disabled={isRunning.contentCampaign} className="w-full">
                                        {isRunning.contentCampaign ? 'Running Workflow...' : 'Execute Content Campaign'}
                                    </Button>
                                </form>

                                {contentCampaignState.message === 'success' && (
                                    <div className="text-green-600 text-sm">
                                        ✅ Content campaign workflow completed successfully
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Listing Optimization Workflow</CardTitle>
                                <CardDescription>
                                    Market Analysis → Competitive Analysis → Description Generation
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form action={listingOptimizationAction} className="space-y-4">
                                    <div>
                                        <Label htmlFor="propertyType">Property Type</Label>
                                        <Select name="propertyType" defaultValue="single-family">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="single-family">Single Family</SelectItem>
                                                <SelectItem value="condo">Condo</SelectItem>
                                                <SelectItem value="townhouse">Townhouse</SelectItem>
                                                <SelectItem value="luxury-estate">Luxury Estate</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            name="location"
                                            placeholder="Austin, TX"
                                            defaultValue="Austin, TX"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="keyFeatures">Key Features</Label>
                                        <Input
                                            name="keyFeatures"
                                            placeholder="updated kitchen, hardwood floors, large backyard"
                                            defaultValue="updated kitchen, hardwood floors, large backyard, garage"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="buyerPersona">Buyer Persona</Label>
                                        <Select name="buyerPersona" defaultValue="growing-family">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first-time-buyer">First-Time Buyer</SelectItem>
                                                <SelectItem value="growing-family">Growing Family</SelectItem>
                                                <SelectItem value="luxury-buyer">Luxury Buyer</SelectItem>
                                                <SelectItem value="investor">Investor</SelectItem>
                                                <SelectItem value="empty-nester">Empty Nester</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" disabled={isRunning.listingOptimization} className="w-full">
                                        {isRunning.listingOptimization ? 'Running Workflow...' : 'Execute Listing Optimization'}
                                    </Button>
                                </form>

                                {listingOptimizationState.message === 'success' && (
                                    <div className="text-green-600 text-sm">
                                        ✅ Listing optimization workflow completed successfully
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Service Tests Tab */}
                <TabsContent value="services" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Brain className="h-4 w-4" />
                                    Research Agent
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form action={researchAction} className="space-y-4">
                                    <div>
                                        <Label htmlFor="topic">Research Topic</Label>
                                        <Input
                                            name="topic"
                                            placeholder="Austin real estate investment opportunities"
                                            defaultValue="Austin real estate investment opportunities"
                                        />
                                    </div>
                                    <Button type="submit" disabled={isRunning.research} className="w-full">
                                        {isRunning.research ? 'Researching...' : 'Run Research'}
                                    </Button>
                                </form>

                                {researchState.message === 'success' && (
                                    <div className="text-green-600 text-sm">
                                        ✅ Research completed successfully
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-4 w-4" />
                                    Content Studio
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form action={blogPostAction} className="space-y-4">
                                    <div>
                                        <Label htmlFor="topic">Blog Topic</Label>
                                        <Input
                                            name="topic"
                                            placeholder="First-time home buyer guide"
                                            defaultValue="First-time home buyer guide for Austin market"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="tone">Tone</Label>
                                        <Select name="tone" defaultValue="professional">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="professional">Professional</SelectItem>
                                                <SelectItem value="conversational">Conversational</SelectItem>
                                                <SelectItem value="authoritative">Authoritative</SelectItem>
                                                <SelectItem value="friendly">Friendly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" disabled={isRunning.blogPost} className="w-full">
                                        {isRunning.blogPost ? 'Generating...' : 'Generate Blog Post'}
                                    </Button>
                                </form>

                                {blogPostState.message === 'success' && (
                                    <div className="text-green-600 text-sm">
                                        ✅ Blog post generated successfully
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Listing Description
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <form action={listingDescAction} className="space-y-4">
                                    <div>
                                        <Label htmlFor="propertyType">Property Type</Label>
                                        <Select name="propertyType" defaultValue="single-family">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="single-family">Single Family</SelectItem>
                                                <SelectItem value="condo">Condo</SelectItem>
                                                <SelectItem value="townhouse">Townhouse</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="location">Location</Label>
                                        <Input
                                            name="location"
                                            defaultValue="Austin, TX"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="keyFeatures">Key Features</Label>
                                        <Input
                                            name="keyFeatures"
                                            defaultValue="updated kitchen, hardwood floors"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="buyerPersona">Buyer Persona</Label>
                                        <Select name="buyerPersona" defaultValue="first-time-buyer">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="first-time-buyer">First-Time Buyer</SelectItem>
                                                <SelectItem value="growing-family">Growing Family</SelectItem>
                                                <SelectItem value="luxury-buyer">Luxury Buyer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button type="submit" disabled={isRunning.listingDesc} className="w-full">
                                        {isRunning.listingDesc ? 'Generating...' : 'Generate Description'}
                                    </Button>
                                </form>

                                {listingDescState.message === 'success' && (
                                    <div className="text-green-600 text-sm">
                                        ✅ Listing description generated successfully
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Metrics</CardTitle>
                            <CardDescription>
                                Monitor execution times and quality scores across all services
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(testResults).map(([testName, result]) => (
                                    <div key={testName} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {getStatusIcon(result.status)}
                                            <div>
                                                <div className="font-medium">{result.testName || testName}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {result.executionTime ? `${result.executionTime}ms` : 'No timing data'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {result.qualityScore && (
                                                <Badge variant="outline">{result.qualityScore}%</Badge>
                                            )}
                                            {getStatusBadge(result.status)}
                                        </div>
                                    </div>
                                ))}

                                {Object.keys(testResults).length === 0 && (
                                    <div className="text-center text-muted-foreground py-8">
                                        No performance data available. Run some tests to see metrics.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Results Tab */}
                <TabsContent value="results" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Test Results Summary</CardTitle>
                            <CardDescription>
                                Detailed results from all executed tests
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                {/* Integration Test Results */}
                                {integrationTestState.data && (
                                    <div className="border rounded-lg p-4">
                                        <h4 className="font-semibold mb-3">Integration Test Results</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <div className="text-muted-foreground">Status</div>
                                                <div className="font-medium">{integrationTestState.data.status}</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Execution Time</div>
                                                <div className="font-medium">{integrationTestState.data.executionTime}ms</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Quality Score</div>
                                                <div className="font-medium">{integrationTestState.data.qualityScore}%</div>
                                            </div>
                                            <div>
                                                <div className="text-muted-foreground">Test ID</div>
                                                <div className="font-medium text-xs">{integrationTestState.data.testId}</div>
                                            </div>
                                        </div>

                                        {integrationTestState.data.validationResults && (
                                            <div className="mt-4">
                                                <h5 className="font-medium mb-2">Validation Results</h5>
                                                <div className="space-y-1">
                                                    {integrationTestState.data.validationResults.map((validation: any, index: number) => (
                                                        <div key={index} className="flex items-center gap-2 text-sm">
                                                            {validation.passed ?
                                                                <CheckCircle className="h-3 w-3 text-green-500" /> :
                                                                <AlertCircle className="h-3 w-3 text-red-500" />
                                                            }
                                                            <span>{validation.check}</span>
                                                            {validation.message && (
                                                                <span className="text-muted-foreground">- {validation.message}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Individual Service Results */}
                                {[
                                    { name: 'Research Agent', state: researchState },
                                    { name: 'Blog Post Generation', state: blogPostState },
                                    { name: 'Social Media Generation', state: socialMediaState },
                                    { name: 'Listing Description', state: listingDescState },
                                    { name: 'Market Update', state: marketUpdateState },
                                ].map(({ name, state }) => (
                                    state.message === 'success' && state.data && (
                                        <div key={name} className="border rounded-lg p-4">
                                            <h4 className="font-semibold mb-3">{name} Results</h4>
                                            <div className="text-sm">
                                                <div className="text-muted-foreground mb-1">Status: Success ✅</div>
                                                {state.data.source && (
                                                    <div className="text-muted-foreground">Source: {state.data.source}</div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                ))}

                                {/* Workflow Results */}
                                {[
                                    { name: 'Content Campaign Workflow', state: contentCampaignState },
                                    { name: 'Listing Optimization Workflow', state: listingOptimizationState },
                                    { name: 'Brand Building Workflow', state: brandBuildingState },
                                    { name: 'Investment Analysis Workflow', state: investmentAnalysisState },
                                ].map(({ name, state }) => (
                                    state.message === 'success' && state.data && (
                                        <div key={name} className="border rounded-lg p-4">
                                            <h4 className="font-semibold mb-3">{name} Results</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <div className="text-muted-foreground">Workflow ID</div>
                                                    <div className="font-medium text-xs">{state.data.workflowId}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Status</div>
                                                    <div className="font-medium">{state.data.status}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Steps Completed</div>
                                                    <div className="font-medium">{state.data.completedSteps}/{state.data.totalSteps}</div>
                                                </div>
                                                <div>
                                                    <div className="text-muted-foreground">Duration</div>
                                                    <div className="font-medium">{state.data.totalDuration}s</div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}

                                {/* No Results Message */}
                                {!integrationTestState.data &&
                                    !researchState.data &&
                                    !blogPostState.data &&
                                    !contentCampaignState.data && (
                                        <div className="text-center text-muted-foreground py-8">
                                            No test results available. Execute some tests to see detailed results.
                                        </div>
                                    )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}