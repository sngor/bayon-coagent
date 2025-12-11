/**
 * Custom hook for managing integrations state and operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Integration, IntegrationStats } from '@/types/integrations';

// Mock data - replace with actual API calls
const MOCK_INTEGRATIONS: Integration[] = [
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

export function useIntegrations() {
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
    const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
    const [isConfiguring, setIsConfiguring] = useState(false);
    const { toast } = useToast();

    // Memoize expensive computations
    const integrationsByCategory = useMemo(() => {
        return integrations.reduce((acc, integration) => {
            if (!acc[integration.category]) {
                acc[integration.category] = [];
            }
            acc[integration.category].push(integration);
            return acc;
        }, {} as Record<string, Integration[]>);
    }, [integrations]);

    const stats: IntegrationStats = useMemo(() => ({
        total: integrations.length,
        active: integrations.filter(i => i.status === 'active').length,
        totalRequests: integrations.reduce((acc, i) => acc + (i.usage?.requests || 0), 0),
        totalCost: integrations.reduce((acc, i) => acc + (i.usage?.cost || 0), 0)
    }), [integrations]);

    const loadIntegrations = useCallback(async () => {
        try {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            setIntegrations(MOCK_INTEGRATIONS);
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
    }, [toast]);

    const toggleIntegration = useCallback(async (integrationId: string, enabled: boolean) => {
        try {
            setIntegrations(prev => prev.map(integration =>
                integration.id === integrationId
                    ? { ...integration, status: enabled ? 'active' : 'inactive' }
                    : integration
            ));

            const integration = integrations.find(i => i.id === integrationId);
            toast({
                title: enabled ? "Integration Enabled" : "Integration Disabled",
                description: `${integration?.name} has been ${enabled ? 'enabled' : 'disabled'}`,
            });
        } catch (error) {
            console.error('Failed to toggle integration:', error);
            toast({
                title: "Error",
                description: "Failed to update integration status",
                variant: "destructive"
            });
        }
    }, [integrations, toast]);

    const testConnection = useCallback(async (integrationId: string) => {
        try {
            // Simulate connection test
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
    }, [toast]);

    const saveConfiguration = useCallback(async (integrationId: string, config: Record<string, any>) => {
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
    }, [toast]);

    const toggleApiKeyVisibility = useCallback((integrationId: string) => {
        setShowApiKey(prev => ({
            ...prev,
            [integrationId]: !prev[integrationId]
        }));
    }, []);

    const copyToClipboard = useCallback(async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: "Copied to clipboard" });
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            toast({
                title: "Error",
                description: "Failed to copy to clipboard",
                variant: "destructive"
            });
        }
    }, [toast]);

    // Remove duplicate computed values (now handled above with useMemo)

    useEffect(() => {
        loadIntegrations();
    }, [loadIntegrations]);

    return {
        // State
        integrations,
        loading,
        selectedIntegration,
        showApiKey,
        isConfiguring,
        integrationsByCategory,
        stats,

        // Actions
        loadIntegrations,
        toggleIntegration,
        testConnection,
        saveConfiguration,
        setSelectedIntegration,
        toggleApiKeyVisibility,
        copyToClipboard
    };
}