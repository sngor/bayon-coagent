'use client';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import { useToast } from '@/hooks/use-toast';
import {
    Key,
    Globe,
    Database,
    Mail,
    MessageSquare,
    BarChart3,
    Shield,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Settings,
    RefreshCw,
    Eye,
    EyeOff,
    Copy,
    ExternalLink,
    Zap,
    Cloud,
    Server
} from 'lucide-react';

interface Integration {
    id: string;
    name: string;
    description: string;
    category: 'ai' | 'analytics' | 'communication' | 'storage' | 'payment' | 'search';
    status: 'active' | 'inactive' | 'error' | 'pending';
    apiKey?: string;
    endpoint?: string;
    lastSync?: string;
    usage?: {
        requests: number;
        limit: number;
        cost: number;
    };
    config?: Record<string, any>;
}

export default function SuperAdminIntegrationsPage() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
    const [isConfiguring, setIsConfiguring] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadIntegrations();
    }, []);

    async function loadIntegrations() {
        try {
            setLoading(true);
            // Mock data - replace with actual API call
            const mockIntegrations: Integration[] = [
                {
                    id: 'aws-bedrock',
                    name: 'AWS Bedrock',
                    description: 'AI model access for content generation',
                    category: 'ai',
                    status: 'active',
                    endpoint: 'https://bedrock-runtime.us-east-1.amazonaws.com',
                    lastSync: new Date(Date.now() - 300000).toISOString(),
                    usage: {
                        requests: 15420,
                        limit: 100000,
                        cost: 234.56
                    },
                    config: {
                        model: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
                        region: 'us-east-1',
                        maxTokens: 4096
                    }
                },
                {
                    id: 'tavily-search',
                    name: 'Tavily Search API',
                    description: 'AI-powered web search for research',
                    category: 'search',
                    status: 'active',
                    apiKey: 'tvly-••••••••••••••••••••••••••••••••',
                    endpoint: 'https://api.tavily.com/search',
                    lastSync: new Date(Date.now() - 600000).toISOString(),
                    usage: {
                        requests: 2340,
                        limit: 10000,
                        cost: 23.40
                    }
                },
                {
                    id: 'stripe',
                    name: 'Stripe',
                    description: 'Payment processing and billing',
                    category: 'payment',
                    status: 'active',
                    apiKey: 'sk_live_••••••••••••••••••••••••••••••••',
                    endpoint: 'https://api.stripe.com/v1',
                    lastSync: new Date(Date.now() - 900000).toISOString(),
                    usage: {
                        requests: 890,
                        limit: 50000,
                        cost: 0
                    }
                },
                {
                    id: 'newsapi',
                    name: 'NewsAPI',
                    description: 'Real estate news and market updates',
                    category: 'analytics',
                    status: 'active',
                    apiKey: '••••••••••••••••••••••••••••••••',
                    endpoint: 'https://newsapi.org/v2',
                    lastSync: new Date(Date.now() - 1800000).toISOString(),
                    usage: {
                        requests: 456,
                        limit: 1000,
                        cost: 0
                    }
                },
                {
                    id: 'google-oauth',
                    name: 'Google OAuth',
                    description: 'Google Business Profile integration',
                    category: 'communication',
                    status: 'inactive',
                    config: {
                        clientId: 'your-client-id.googleusercontent.com',
                        scopes: ['profile', 'email', 'business.manage']
                    }
                },
                {
                    id: 'bridge-api',
                    name: 'Bridge API',
                    description: 'Zillow review integration',
                    category: 'analytics',
                    status: 'pending',
                    endpoint: 'https://api.bridge.com/v1'
                }
            ];

            setIntegrations(mockIntegrations);
        } catch (error) {
            console.error('Failed to load integrations:', error);
            toast({
                title: "Error",
                description: "Failed to load integrations",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleIntegration(integrationId: string, enabled: boolean) {
        try {
            setIntegrations(prev => prev.map(integration =>
                integration.id === integrationId
                    ? { ...integration, status: enabled ? 'active' : 'inactive' }
                    : integration
            ));

            toast({
                title: enabled ? "Integration Enabled" : "Integration Disabled",
                description: `${integrations.find(i => i.id === integrationId)?.name} has been ${enabled ? 'enabled' : 'disabled'}`,
            });
        } catch (error) {
            console.error('Failed to toggle integration:', error);
            toast({
                title: "Error",
                description: "Failed to update integration status",
                variant: "destructive"
            });
        }
    }

    async function handleTestConnection(integrationId: string) {
        try {
            // Mock test - replace with actual API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            toast({
                title: "Connection Test Successful",
                description: "Integration is working correctly",
            });
        } catch (error) {
            console.error('Connection test failed:', error);
            toast({
                title: "Connection Test Failed",
                description: "Please check your configuration",
                variant: "destructive"
            });
        }
    }

    async function handleSaveConfiguration(integrationId: string, config: Record<string, any>) {
        try {
            setIsConfiguring(true);

            setIntegrations(prev => prev.map(integration =>
                integration.id === integrationId
                    ? { ...integration, config, status: 'active' }
                    : integration
            ));

            toast({
                title: "Configuration Saved",
                description: "Integration configuration has been updated",
            });
        } catch (error) {
            console.error('Failed to save configuration:', error);
            toast({
                title: "Error",
                description: "Failed to save configuration",
                variant: "destructive"
            });
        } finally {
            setIsConfiguring(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            case 'error':
                return <Badge variant="destructive">Error</Badge>;
            case 'pending':
                return <Badge variant="outline">Pending Setup</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'inactive':
                return <XCircle className="h-4 w-4 text-gray-600" />;
            case 'error':
                return <AlertTriangle className="h-4 w-4 text-red-600" />;
            case 'pending':
                return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'ai':
                return <Zap className="h-5 w-5 text-purple-600" />;
            case 'analytics':
                return <BarChart3 className="h-5 w-5 text-blue-600" />;
            case 'communication':
                return <MessageSquare className="h-5 w-5 text-green-600" />;
            case 'storage':
                return <Database className="h-5 w-5 text-orange-600" />;
            case 'payment':
                return <Shield className="h-5 w-5 text-indigo-600" />;
            case 'search':
                return <Globe className="h-5 w-5 text-teal-600" />;
            default:
                return <Server className="h-5 w-5 text-gray-600" />;
        }
    };

    const integrationsByCategory = integrations.reduce((acc, integration) => {
        if (!acc[integration.category]) {
            acc[integration.category] = [];
        }
        acc[integration.category].push(integration);
        return acc;
    }, {} as Record<string, Integration[]>);

    const totalUsage = integrations.reduce((acc, integration) => {
        if (integration.usage) {
            acc.requests += integration.usage.requests;
            acc.cost += integration.usage.cost;
        }
        return acc;
    }, { requests: 0, cost: 0 });

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">API & Integrations</h2>
                    <p className="text-muted-foreground">Manage external services and API connections</p>
                </div>
                <Button variant="outline" onClick={loadIntegrations}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Status
                </Button>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
                        <Globe className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{integrations.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {integrations.filter(i => i.status === 'active').length} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsage.requests.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalUsage.cost.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Health Status</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">Healthy</div>
                        <p className="text-xs text-muted-foreground">All systems operational</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="configuration">Configuration</TabsTrigger>
                    <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Integrations by Category */}
                    {Object.entries(integrationsByCategory).map(([category, categoryIntegrations]) => (
                        <Card key={category}>
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    {getCategoryIcon(category)}
                                    <div>
                                        <CardTitle className="capitalize">{category} Services</CardTitle>
                                        <CardDescription>
                                            {categoryIntegrations.length} integration{categoryIntegrations.length !== 1 ? 's' : ''}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {categoryIntegrations.map((integration) => (
                                        <Card key={integration.id} className="border-2 hover:border-primary/50 transition-colors">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusIcon(integration.status)}
                                                        <div>
                                                            <CardTitle className="text-base">{integration.name}</CardTitle>
                                                            <CardDescription className="text-sm">
                                                                {integration.description}
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                    {getStatusBadge(integration.status)}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {integration.usage && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span>Usage</span>
                                                            <span>{integration.usage.requests.toLocaleString()} / {integration.usage.limit.toLocaleString()}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full"
                                                                style={{ width: `${Math.min((integration.usage.requests / integration.usage.limit) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Cost: ${integration.usage.cost.toFixed(2)}
                                                        </div>
                                                    </div>
                                                )}

                                                {integration.lastSync && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Last sync: {new Date(integration.lastSync).toLocaleString()}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Switch
                                                        checked={integration.status === 'active'}
                                                        onCheckedChange={(checked) => handleToggleIntegration(integration.id, checked)}
                                                        disabled={integration.status === 'pending'}
                                                    />
                                                    <Label className="text-sm">
                                                        {integration.status === 'active' ? 'Enabled' : 'Disabled'}
                                                    </Label>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleTestConnection(integration.id)}
                                                        disabled={integration.status !== 'active'}
                                                    >
                                                        Test Connection
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSelectedIntegration(integration)}
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="configuration" className="space-y-6">
                    {selectedIntegration ? (
                        <Card>
                            <CardHeader>
                                <CardTitle>Configure {selectedIntegration.name}</CardTitle>
                                <CardDescription>
                                    Update API keys, endpoints, and other configuration settings
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* API Key */}
                                {selectedIntegration.apiKey && (
                                    <div className="space-y-2">
                                        <Label>API Key</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                type={showApiKey[selectedIntegration.id] ? 'text' : 'password'}
                                                value={selectedIntegration.apiKey}
                                                readOnly
                                                className="font-mono"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowApiKey(prev => ({
                                                    ...prev,
                                                    [selectedIntegration.id]: !prev[selectedIntegration.id]
                                                }))}
                                            >
                                                {showApiKey[selectedIntegration.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedIntegration.apiKey || '');
                                                    toast({ title: "Copied to clipboard" });
                                                }}
                                            >
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Endpoint */}
                                {selectedIntegration.endpoint && (
                                    <div className="space-y-2">
                                        <Label>Endpoint URL</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={selectedIntegration.endpoint}
                                                readOnly
                                                className="font-mono"
                                            />
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(selectedIntegration.endpoint, '_blank')}
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Configuration */}
                                {selectedIntegration.config && (
                                    <div className="space-y-4">
                                        <Label>Configuration</Label>
                                        <div className="space-y-3">
                                            {Object.entries(selectedIntegration.config).map(([key, value]) => (
                                                <div key={key} className="grid grid-cols-3 gap-4 items-center">
                                                    <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Label>
                                                    <Input
                                                        value={String(value)}
                                                        className="col-span-2"
                                                        onChange={(e) => {
                                                            const newConfig = {
                                                                ...selectedIntegration.config,
                                                                [key]: e.target.value
                                                            };
                                                            setSelectedIntegration({
                                                                ...selectedIntegration,
                                                                config: newConfig
                                                            });
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleSaveConfiguration(selectedIntegration.id, selectedIntegration.config || {})}
                                        disabled={isConfiguring}
                                    >
                                        {isConfiguring ? 'Saving...' : 'Save Configuration'}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSelectedIntegration(null)}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Select an Integration</h3>
                                <p className="text-muted-foreground text-center">
                                    Choose an integration from the overview tab to configure its settings
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>API Usage Trends</CardTitle>
                                <CardDescription>Request volume over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8 text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Usage analytics coming soon</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Error Rates</CardTitle>
                                <CardDescription>API error rates by service</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {integrations.filter(i => i.status === 'active').map((integration) => (
                                        <div key={integration.id} className="flex justify-between items-center">
                                            <span className="text-sm">{integration.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-green-600">0.1%</span>
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Response Times</CardTitle>
                                <CardDescription>Average API response times</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {integrations.filter(i => i.status === 'active').map((integration) => (
                                        <div key={integration.id} className="flex justify-between items-center">
                                            <span className="text-sm">{integration.name}</span>
                                            <span className="text-sm font-medium">
                                                {Math.floor(Math.random() * 500 + 100)}ms
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cost Breakdown</CardTitle>
                                <CardDescription>Monthly costs by service</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {integrations.filter(i => i.usage?.cost).map((integration) => (
                                        <div key={integration.id} className="flex justify-between items-center">
                                            <span className="text-sm">{integration.name}</span>
                                            <span className="text-sm font-medium">
                                                ${integration.usage?.cost.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}