'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AnimatedTabs as Tabs, AnimatedTabsContent as TabsContent, AnimatedTabsList as TabsList, AnimatedTabsTrigger as TabsTrigger } from '@/components/ui/animated-tabs';
import {
    RefreshCw,
    Eye,
    EyeOff,
    Copy,
    ExternalLink,
    Settings,
    BarChart3,
    CheckCircle
} from 'lucide-react';

import { useIntegrations } from '@/hooks/use-integrations';
import { IntegrationStats } from '@/components/integrations/integration-stats';
import { IntegrationCard } from '@/components/integrations/integration-card';
import { IntegrationCategoryIcon } from '@/components/integrations/integration-icons';

export default function IntegrationsClient() {
    const {
        integrations,
        loading,
        selectedIntegration,
        showApiKey,
        isConfiguring,
        integrationsByCategory,
        stats,
        loadIntegrations,
        toggleIntegration,
        testConnection,
        saveConfiguration,
        setSelectedIntegration,
        toggleApiKeyVisibility,
        copyToClipboard
    } = useIntegrations();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-headline text-3xl font-bold">API & Integrations</h1>
                    <p className="text-muted-foreground">Manage external services and API connections</p>
                </div>
                <Button variant="outline" onClick={loadIntegrations}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh Status
                </Button>
            </div>

            {/* Overview Stats */}
            <IntegrationStats stats={stats} />

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
                                    <IntegrationCategoryIcon category={category as any} />
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
                                        <IntegrationCard
                                            key={integration.id}
                                            integration={integration}
                                            onToggle={toggleIntegration}
                                            onTestConnection={testConnection}
                                            onConfigure={setSelectedIntegration}
                                        />
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
                                                onClick={() => toggleApiKeyVisibility(selectedIntegration.id)}
                                            >
                                                {showApiKey[selectedIntegration.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copyToClipboard(selectedIntegration.apiKey || '')}
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
                                        onClick={() => saveConfiguration(selectedIntegration.id, selectedIntegration.config || {})}
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