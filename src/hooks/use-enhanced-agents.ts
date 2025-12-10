'use client';

/**
 * Enhanced Agents Hook
 * 
 * React hook for managing enhanced AI agent features including
 * proactive monitoring initialization and agent interactions.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/aws/auth';
import {
    initProactiveMonitoringAction,
    getProactiveSuggestionsAction,
    chatWithHubAgentAction,
    getCrossHubInsightsAction
} from '@/app/enhanced-agent-actions';
import { toast } from '@/hooks/use-toast';

/**
 * Enhanced agents configuration
 */
interface EnhancedAgentsConfig {
    proactiveMonitoring: {
        enabled: boolean;
        initialized: boolean;
        preferences: {
            notificationFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
            priorityThreshold: 'low' | 'medium' | 'high';
            hubPreferences: Record<string, boolean>;
        };
    };
}

/**
 * Hook return type
 */
interface UseEnhancedAgentsReturn {
    // Configuration
    config: EnhancedAgentsConfig | null;
    isLoading: boolean;
    error: string | null;

    // Proactive monitoring
    initializeProactiveMonitoring: (preferences?: any) => Promise<boolean>;
    isProactiveMonitoringEnabled: boolean;

    // Hub agent chat
    chatWithHubAgent: (hubContext: string, message: string, taskType?: string) => Promise<any>;

    // Cross-hub insights
    getCrossHubInsights: (targetHub: string, options?: any) => Promise<any>;

    // Utilities
    refreshConfig: () => Promise<void>;
}

/**
 * Enhanced Agents Hook
 */
export function useEnhancedAgents(): UseEnhancedAgentsReturn {
    const { user } = useUser();
    const [config, setConfig] = useState<EnhancedAgentsConfig | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Load enhanced agents configuration
     */
    const loadConfig = useCallback(async () => {
        if (!user) {
            setConfig(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Check if proactive monitoring is already initialized
            // This would typically come from your user preferences or database
            const savedConfig = localStorage.getItem(`enhanced-agents-config-${user.id}`);

            if (savedConfig) {
                const parsedConfig = JSON.parse(savedConfig);
                setConfig(parsedConfig);
            } else {
                // Default configuration for new users
                const defaultConfig: EnhancedAgentsConfig = {
                    proactiveMonitoring: {
                        enabled: false,
                        initialized: false,
                        preferences: {
                            notificationFrequency: 'daily',
                            priorityThreshold: 'medium',
                            hubPreferences: {
                                studio: true,
                                brand: true,
                                research: true,
                                market: true,
                                tools: true,
                                library: true
                            }
                        }
                    }
                };
                setConfig(defaultConfig);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load configuration');
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    /**
     * Save configuration to localStorage
     */
    const saveConfig = useCallback((newConfig: EnhancedAgentsConfig) => {
        if (!user) return;

        localStorage.setItem(`enhanced-agents-config-${user.id}`, JSON.stringify(newConfig));
        setConfig(newConfig);
    }, [user]);

    /**
     * Initialize proactive monitoring
     */
    const initializeProactiveMonitoring = useCallback(async (preferences?: any): Promise<boolean> => {
        if (!user || !config) return false;

        try {
            const response = await initProactiveMonitoringAction({
                preferences: preferences || config.proactiveMonitoring.preferences
            });

            if (response.success) {
                const updatedConfig = {
                    ...config,
                    proactiveMonitoring: {
                        ...config.proactiveMonitoring,
                        enabled: true,
                        initialized: true,
                        preferences: preferences || config.proactiveMonitoring.preferences
                    }
                };

                saveConfig(updatedConfig);

                toast({
                    title: '🤖 AI Agents Activated!',
                    description: 'Your AI agents are now monitoring for opportunities and insights.'
                });

                return true;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to initialize AI agents',
                    description: response.error || 'Unknown error occurred'
                });
                return false;
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error initializing AI agents',
                description: error instanceof Error ? error.message : 'Unknown error'
            });
            return false;
        }
    }, [user, config, saveConfig]);

    /**
     * Chat with hub-specific agent
     */
    const chatWithHubAgent = useCallback(async (
        hubContext: string,
        message: string,
        taskType?: string
    ) => {
        try {
            const response = await chatWithHubAgentAction({
                hubContext,
                message,
                taskType
            });

            if (response.success) {
                return response.data;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Chat failed',
                    description: response.error || 'Failed to get response from AI agent'
                });
                return null;
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Chat error',
                description: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
        }
    }, []);

    /**
     * Get cross-hub insights
     */
    const getCrossHubInsights = useCallback(async (targetHub: string, options?: any) => {
        try {
            const response = await getCrossHubInsightsAction({
                targetHub,
                ...options
            });

            if (response.success) {
                return response.data;
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Failed to get insights',
                    description: response.error || 'Unknown error occurred'
                });
                return null;
            }
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Insights error',
                description: error instanceof Error ? error.message : 'Unknown error'
            });
            return null;
        }
    }, []);

    /**
     * Refresh configuration
     */
    const refreshConfig = useCallback(async () => {
        await loadConfig();
    }, [loadConfig]);

    // Load configuration on mount and user change
    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    // Auto-initialize proactive monitoring for users with complete profiles
    useEffect(() => {
        if (!user || !config || config.proactiveMonitoring.initialized) return;

        // Check if user has a complete profile (you might want to adjust this logic)
        const checkProfileAndInitialize = async () => {
            try {
                // Get user's profile completion status
                // This is a simplified check - you might want to integrate with your profile completion logic
                const profileComplete = localStorage.getItem(`profile-completed-${user.id}`) === 'true';

                if (profileComplete && !config.proactiveMonitoring.initialized) {
                    // Auto-initialize with default preferences
                    await initializeProactiveMonitoring();
                }
            } catch (error) {
                console.error('Auto-initialization failed:', error);
            }
        };

        // Delay auto-initialization to avoid overwhelming new users
        const timer = setTimeout(checkProfileAndInitialize, 2000);
        return () => clearTimeout(timer);
    }, [user, config, initializeProactiveMonitoring]);

    return {
        config,
        isLoading,
        error,
        initializeProactiveMonitoring,
        isProactiveMonitoringEnabled: config?.proactiveMonitoring.enabled || false,
        chatWithHubAgent,
        getCrossHubInsights,
        refreshConfig
    };
}