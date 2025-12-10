/**
 * Proactive Agent Manager
 * 
 * Manages proactive behaviors for AI agents including notifications,
 * suggestions, monitoring, and automated insights.
 */

import { z } from 'zod';
import { EventEmitter } from 'events';
import { getRepository } from '@/aws/dynamodb/repository';
import { getBedrockClient } from '../client';
import { HubAgentRegistry, type HubAgentType } from '../hub-agents/hub-agent-registry';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Proactive suggestion types
 */
export type ProactiveSuggestionType =
    | 'content-opportunity'
    | 'market-alert'
    | 'competitor-update'
    | 'seo-optimization'
    | 'client-follow-up'
    | 'seasonal-content'
    | 'performance-insight'
    | 'workflow-optimization';

/**
 * Proactive suggestion interface
 */
export interface ProactiveSuggestion {
    id: string;
    userId: string;
    agentId: string;
    type: ProactiveSuggestionType;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    title: string;
    description: string;
    actionable: boolean;
    actions?: Array<{
        label: string;
        type: 'navigate' | 'create' | 'update' | 'external';
        target: string;
        data?: Record<string, any>;
    }>;
    metadata: Record<string, any>;
    createdAt: string;
    expiresAt?: string;
    dismissed?: boolean;
    actedUpon?: boolean;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
    userId: string;
    agentProfile: AgentProfile;
    enabledFeatures: string[];
    checkInterval: number; // minutes
    lastCheck: string;
    preferences: {
        notificationFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
        priorityThreshold: 'low' | 'medium' | 'high';
        hubPreferences: Record<string, boolean>;
    };
}

/**
 * Proactive Agent Manager
 */
export class ProactiveAgentManager extends EventEmitter {
    private monitoringConfigs: Map<string, MonitoringConfig> = new Map();
    private activeMonitors: Map<string, NodeJS.Timeout> = new Map();
    private repository = getRepository();

    constructor() {
        super();
        this.startGlobalMonitoring();
    }

    /**
     * Initialize proactive monitoring for a user
     */
    async initializeUserMonitoring(
        userId: string,
        agentProfile: AgentProfile,
        preferences?: Partial<MonitoringConfig['preferences']>
    ): Promise<void> {
        const config: MonitoringConfig = {
            userId,
            agentProfile,
            enabledFeatures: [
                'content-calendar-suggestions',
                'market-trend-alerts',
                'competitor-monitoring',
                'seo-opportunity-detection',
                'seasonal-content-reminders'
            ],
            checkInterval: 60, // 1 hour
            lastCheck: new Date().toISOString(),
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
                },
                ...preferences
            }
        };

        this.monitoringConfigs.set(userId, config);
        this.startUserMonitoring(userId);

        // Save to database
        await this.repository.putItem({
            PK: `USER#${userId}`,
            SK: 'PROACTIVE_CONFIG',
            ...config,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Start monitoring for a specific user
     */
    private startUserMonitoring(userId: string): void {
        const config = this.monitoringConfigs.get(userId);
        if (!config) return;

        // Clear existing monitor
        const existingMonitor = this.activeMonitors.get(userId);
        if (existingMonitor) {
            clearInterval(existingMonitor);
        }

        // Start new monitor
        const monitor = setInterval(async () => {
            await this.runProactiveChecks(userId);
        }, config.checkInterval * 60 * 1000);

        this.activeMonitors.set(userId, monitor);
    }

    /**
     * Run proactive checks for a user
     */
    private async runProactiveChecks(userId: string): Promise<void> {
        const config = this.monitoringConfigs.get(userId);
        if (!config) return;

        try {
            const suggestions: ProactiveSuggestion[] = [];

            // Run checks for each enabled feature
            for (const feature of config.enabledFeatures) {
                const featureSuggestions = await this.runFeatureCheck(userId, feature, config);
                suggestions.push(...featureSuggestions);
            }

            // Filter by priority threshold
            const filteredSuggestions = suggestions.filter(s =>
                this.isPriorityAboveThreshold(s.priority, config.preferences.priorityThreshold)
            );

            // Save suggestions to database
            for (const suggestion of filteredSuggestions) {
                await this.saveSuggestion(suggestion);
            }

            // Emit notifications based on frequency preference
            if (filteredSuggestions.length > 0) {
                this.emit('suggestions-generated', {
                    userId,
                    suggestions: filteredSuggestions,
                    config
                });
            }

            // Update last check time
            config.lastCheck = new Date().toISOString();
            this.monitoringConfigs.set(userId, config);

        } catch (error) {
            console.error(`Proactive check failed for user ${userId}:`, error);
            this.emit('check-error', { userId, error });
        }
    }

    /**
     * Run a specific feature check
     */
    private async runFeatureCheck(
        userId: string,
        feature: string,
        config: MonitoringConfig
    ): Promise<ProactiveSuggestion[]> {
        switch (feature) {
            case 'content-calendar-suggestions':
                return this.checkContentCalendarOpportunities(userId, config);

            case 'market-trend-alerts':
                return this.checkMarketTrends(userId, config);

            case 'competitor-monitoring':
                return this.checkCompetitorUpdates(userId, config);

            case 'seo-opportunity-detection':
                return this.checkSEOOpportunities(userId, config);

            case 'seasonal-content-reminders':
                return this.checkSeasonalContent(userId, config);

            default:
                return [];
        }
    }

    /**
     * Check for content calendar opportunities
     */
    private async checkContentCalendarOpportunities(
        userId: string,
        config: MonitoringConfig
    ): Promise<ProactiveSuggestion[]> {
        const suggestions: ProactiveSuggestion[] = [];
        const client = getBedrockClient();

        try {
            // Get recent content creation patterns
            const recentContent = await this.repository.queryItems({
                PK: `USER#${userId}`,
                SK: { beginsWith: 'CONTENT#' }
            });

            // Analyze content gaps using AI
            const prompt = `Analyze the following content creation pattern for a real estate agent and suggest 3 specific content opportunities for the next week:

Agent Profile:
- Name: ${config.agentProfile.agentName}
- Market: ${config.agentProfile.primaryMarket}
- Specialization: ${config.agentProfile.specialization}

Recent Content: ${JSON.stringify(recentContent.slice(0, 10), null, 2)}

Current Date: ${new Date().toLocaleDateString()}

Provide suggestions in this format:
{
  "suggestions": [
    {
      "title": "Content opportunity title",
      "description": "Detailed description of why this content would be valuable",
      "contentType": "blog-post|social-media|video-script|market-update",
      "urgency": "low|medium|high",
      "estimatedImpact": "Description of expected impact"
    }
  ]
}`;

            const response = await client.invoke(prompt, z.object({
                suggestions: z.array(z.object({
                    title: z.string(),
                    description: z.string(),
                    contentType: z.string(),
                    urgency: z.enum(['low', 'medium', 'high']),
                    estimatedImpact: z.string()
                }))
            }));

            // Convert AI suggestions to proactive suggestions
            response.suggestions.forEach((aiSuggestion, index) => {
                suggestions.push({
                    id: `content-${userId}-${Date.now()}-${index}`,
                    userId,
                    agentId: 'studio-creative-agent',
                    type: 'content-opportunity',
                    priority: aiSuggestion.urgency,
                    title: aiSuggestion.title,
                    description: aiSuggestion.description,
                    actionable: true,
                    actions: [{
                        label: 'Create Content',
                        type: 'navigate',
                        target: '/studio/write',
                        data: {
                            contentType: aiSuggestion.contentType,
                            suggestion: aiSuggestion.description
                        }
                    }],
                    metadata: {
                        contentType: aiSuggestion.contentType,
                        estimatedImpact: aiSuggestion.estimatedImpact,
                        source: 'content-calendar-analysis'
                    },
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                });
            });

        } catch (error) {
            console.error('Content calendar check failed:', error);
        }

        return suggestions;
    }

    /**
     * Check for market trends
     */
    private async checkMarketTrends(
        userId: string,
        config: MonitoringConfig
    ): Promise<ProactiveSuggestion[]> {
        const suggestions: ProactiveSuggestion[] = [];

        // This would integrate with your market data sources
        // For now, we'll create a placeholder that could be enhanced

        const marketData = {
            priceChanges: Math.random() > 0.7, // 30% chance of significant price changes
            inventoryChanges: Math.random() > 0.6, // 40% chance of inventory changes
            interestRateChanges: Math.random() > 0.8 // 20% chance of rate changes
        };

        if (marketData.priceChanges) {
            suggestions.push({
                id: `market-${userId}-${Date.now()}-price`,
                userId,
                agentId: 'market-intelligence-agent',
                type: 'market-alert',
                priority: 'high',
                title: 'Significant Price Movement Detected',
                description: `Market analysis shows notable price changes in ${config.agentProfile.primaryMarket}. This could impact your listings and buyer strategies.`,
                actionable: true,
                actions: [{
                    label: 'View Market Analysis',
                    type: 'navigate',
                    target: '/market/insights',
                    data: { focus: 'price-trends' }
                }],
                metadata: {
                    marketArea: config.agentProfile.primaryMarket,
                    changeType: 'price-movement',
                    source: 'market-monitoring'
                },
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
            });
        }

        return suggestions;
    }

    /**
     * Check for competitor updates
     */
    private async checkCompetitorUpdates(
        userId: string,
        config: MonitoringConfig
    ): Promise<ProactiveSuggestion[]> {
        const suggestions: ProactiveSuggestion[] = [];

        // Get competitor data from database
        const competitors = await this.repository.queryItems({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'COMPETITOR#' }
        });

        if (competitors.length > 0) {
            // Simulate competitor activity detection
            const hasNewActivity = Math.random() > 0.5;

            if (hasNewActivity) {
                suggestions.push({
                    id: `competitor-${userId}-${Date.now()}`,
                    userId,
                    agentId: 'brand-strategist-agent',
                    type: 'competitor-update',
                    priority: 'medium',
                    title: 'Competitor Activity Detected',
                    description: 'One or more of your tracked competitors has updated their online presence. Review their changes to identify opportunities.',
                    actionable: true,
                    actions: [{
                        label: 'Review Competitors',
                        type: 'navigate',
                        target: '/brand/competitors',
                        data: { highlight: 'recent-changes' }
                    }],
                    metadata: {
                        competitorCount: competitors.length,
                        source: 'competitor-monitoring'
                    },
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days
                });
            }
        }

        return suggestions;
    }

    /**
     * Check for SEO opportunities
     */
    private async checkSEOOpportunities(
        userId: string,
        config: MonitoringConfig
    ): Promise<ProactiveSuggestion[]> {
        const suggestions: ProactiveSuggestion[] = [];

        // Get recent keyword rankings
        const rankings = await this.repository.queryItems({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'KEYWORD_RANKING#' }
        });

        if (rankings.length > 0) {
            // Simulate SEO opportunity detection
            const hasOpportunity = Math.random() > 0.6;

            if (hasOpportunity) {
                suggestions.push({
                    id: `seo-${userId}-${Date.now()}`,
                    userId,
                    agentId: 'brand-strategist-agent',
                    type: 'seo-optimization',
                    priority: 'medium',
                    title: 'SEO Improvement Opportunity',
                    description: 'Analysis shows potential to improve your search rankings with targeted content optimization.',
                    actionable: true,
                    actions: [{
                        label: 'View SEO Insights',
                        type: 'navigate',
                        target: '/brand/audit',
                        data: { tab: 'seo-analysis' }
                    }],
                    metadata: {
                        keywordCount: rankings.length,
                        source: 'seo-monitoring'
                    },
                    createdAt: new Date().toISOString(),
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
                });
            }
        }

        return suggestions;
    }

    /**
     * Check for seasonal content opportunities
     */
    private async checkSeasonalContent(
        userId: string,
        config: MonitoringConfig
    ): Promise<ProactiveSuggestion[]> {
        const suggestions: ProactiveSuggestion[] = [];
        const now = new Date();
        const month = now.getMonth();
        const day = now.getDate();

        // Define seasonal content opportunities
        const seasonalOpportunities = [
            { months: [0, 1], title: 'New Year Market Predictions', description: 'Create content about market forecasts for the new year' },
            { months: [2, 3], title: 'Spring Market Preparation', description: 'Help clients prepare for the busy spring selling season' },
            { months: [4, 5], title: 'Summer Moving Tips', description: 'Create guides for summer relocations and family moves' },
            { months: [8, 9], title: 'Back-to-School Market', description: 'Target families looking to move before school starts' },
            { months: [10, 11], title: 'Holiday Market Insights', description: 'Discuss how holidays affect real estate activity' }
        ];

        const currentOpportunity = seasonalOpportunities.find(opp =>
            opp.months.includes(month)
        );

        if (currentOpportunity) {
            suggestions.push({
                id: `seasonal-${userId}-${Date.now()}`,
                userId,
                agentId: 'studio-creative-agent',
                type: 'seasonal-content',
                priority: 'low',
                title: currentOpportunity.title,
                description: currentOpportunity.description,
                actionable: true,
                actions: [{
                    label: 'Create Seasonal Content',
                    type: 'navigate',
                    target: '/studio/write',
                    data: {
                        contentType: 'blog-post',
                        seasonalTopic: currentOpportunity.title
                    }
                }],
                metadata: {
                    season: this.getCurrentSeason(month),
                    month: month,
                    source: 'seasonal-calendar'
                },
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days
            });
        }

        return suggestions;
    }

    /**
     * Save suggestion to database
     */
    private async saveSuggestion(suggestion: ProactiveSuggestion): Promise<void> {
        await this.repository.putItem({
            PK: `USER#${suggestion.userId}`,
            SK: `SUGGESTION#${suggestion.id}`,
            ...suggestion
        });
    }

    /**
     * Get suggestions for a user
     */
    async getUserSuggestions(
        userId: string,
        options?: {
            limit?: number;
            type?: ProactiveSuggestionType;
            priority?: string;
            includeDismissed?: boolean;
        }
    ): Promise<ProactiveSuggestion[]> {
        const items = await this.repository.queryItems({
            PK: `USER#${userId}`,
            SK: { beginsWith: 'SUGGESTION#' }
        });

        let suggestions = items as ProactiveSuggestion[];

        // Apply filters
        if (options?.type) {
            suggestions = suggestions.filter(s => s.type === options.type);
        }

        if (options?.priority) {
            suggestions = suggestions.filter(s => s.priority === options.priority);
        }

        if (!options?.includeDismissed) {
            suggestions = suggestions.filter(s => !s.dismissed);
        }

        // Remove expired suggestions
        const now = new Date().toISOString();
        suggestions = suggestions.filter(s => !s.expiresAt || s.expiresAt > now);

        // Sort by priority and creation date
        suggestions.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.priority];
            const bPriority = priorityOrder[b.priority];

            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }

            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

        return suggestions.slice(0, options?.limit || 50);
    }

    /**
     * Dismiss a suggestion
     */
    async dismissSuggestion(userId: string, suggestionId: string): Promise<void> {
        await this.repository.updateItem(
            { PK: `USER#${userId}`, SK: `SUGGESTION#${suggestionId}` },
            {
                dismissed: true,
                dismissedAt: new Date().toISOString()
            }
        );
    }

    /**
     * Mark suggestion as acted upon
     */
    async markSuggestionActedUpon(userId: string, suggestionId: string): Promise<void> {
        await this.repository.updateItem(
            { PK: `USER#${userId}`, SK: `SUGGESTION#${suggestionId}` },
            {
                actedUpon: true,
                actedUponAt: new Date().toISOString()
            }
        );
    }

    /**
     * Helper methods
     */
    private isPriorityAboveThreshold(priority: string, threshold: string): boolean {
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
        const thresholdOrder = { low: 1, medium: 2, high: 3 };

        return priorityOrder[priority as keyof typeof priorityOrder] >=
            thresholdOrder[threshold as keyof typeof thresholdOrder];
    }

    private getCurrentSeason(month: number): string {
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    private startGlobalMonitoring(): void {
        // Global monitoring for system-wide events
        setInterval(async () => {
            // Check for system-wide opportunities or alerts
            this.emit('global-check-completed', { timestamp: new Date().toISOString() });
        }, 30 * 60 * 1000); // Every 30 minutes
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        // Clear all active monitors
        for (const monitor of this.activeMonitors.values()) {
            clearInterval(monitor);
        }
        this.activeMonitors.clear();
        this.removeAllListeners();
    }
}

/**
 * Singleton instance
 */
let proactiveAgentManagerInstance: ProactiveAgentManager | null = null;

/**
 * Get the singleton ProactiveAgentManager instance
 */
export function getProactiveAgentManager(): ProactiveAgentManager {
    if (!proactiveAgentManagerInstance) {
        proactiveAgentManagerInstance = new ProactiveAgentManager();
    }
    return proactiveAgentManagerInstance;
}

/**
 * Reset the ProactiveAgentManager singleton (useful for testing)
 */
export function resetProactiveAgentManager(): void {
    if (proactiveAgentManagerInstance) {
        proactiveAgentManagerInstance.destroy();
        proactiveAgentManagerInstance = null;
    }
}