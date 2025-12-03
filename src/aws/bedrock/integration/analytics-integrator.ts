/**
 * Analytics Integrator
 * 
 * Integrates with analytics platforms to track content performance,
 * generate strategy insights, and synchronize data.
 * 
 * Requirements: 12.4
 */

import { getRepository } from '@/aws/dynamodb/repository';
import type { AnalyticsData } from './types';

/**
 * Analytics Integrator Configuration
 */
export interface AnalyticsIntegratorConfig {
    /**
     * Default analytics provider to use
     */
    defaultProvider?: AnalyticsProvider;

    /**
     * Whether to automatically sync data
     */
    autoSync?: boolean;

    /**
     * Sync interval in seconds
     */
    syncInterval?: number;

    /**
     * Maximum number of retries for failed operations
     */
    maxRetries?: number;

    /**
     * Whether to generate insights automatically
     */
    autoGenerateInsights?: boolean;
}

/**
 * Supported analytics providers
 */
export type AnalyticsProvider =
    | 'google-analytics'
    | 'facebook-insights'
    | 'instagram-insights'
    | 'linkedin-analytics'
    | 'custom';

/**
 * Analytics credentials stored in DynamoDB
 */
interface AnalyticsCredentials {
    provider: AnalyticsProvider;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: string;
    metadata?: Record<string, any>;
}

/**
 * Performance metrics for content
 */
export interface PerformanceMetrics {
    contentId: string;
    platform: string;
    timeframe: string;
    metrics: {
        views: number;
        clicks: number;
        shares: number;
        likes: number;
        comments: number;
        conversions: number;
        engagementRate: number;
        reachRate: number;
        clickThroughRate: number;
    };
    demographics?: {
        ageGroups: Record<string, number>;
        locations: Record<string, number>;
        devices: Record<string, number>;
    };
    timestamp: string;
}

/**
 * Strategy insight generated from analytics
 */
export interface StrategyInsight {
    id: string;
    type: 'trend' | 'opportunity' | 'warning' | 'recommendation';
    title: string;
    description: string;
    confidence: number;
    impact: 'high' | 'medium' | 'low';
    actionable: boolean;
    recommendations: string[];
    supportingData: any[];
    generatedAt: string;
}

/**
 * Analytics sync result
 */
export interface SyncResult {
    success: boolean;
    contentsSynced: number;
    insightsGenerated: number;
    errors: string[];
    syncedAt: string;
}

/**
 * Analytics connection status
 */
export interface ConnectionStatus {
    provider: AnalyticsProvider;
    connected: boolean;
    lastSync?: string;
    error?: string;
}

/**
 * Analytics Integrator Class
 * 
 * Provides integration with analytics platforms for performance tracking,
 * strategy insight generation, and data synchronization.
 */
export class AnalyticsIntegrator {
    private config: Required<AnalyticsIntegratorConfig>;
    private repository = getRepository();
    private syncTimers: Map<string, NodeJS.Timeout> = new Map();

    constructor(config: AnalyticsIntegratorConfig = {}) {
        this.config = {
            defaultProvider: config.defaultProvider || 'google-analytics',
            autoSync: config.autoSync ?? true,
            syncInterval: config.syncInterval || 3600, // 1 hour
            maxRetries: config.maxRetries || 3,
            autoGenerateInsights: config.autoGenerateInsights ?? true,
        };
    }

    /**
     * Connect to analytics platform
     * 
     * Establishes connection to an analytics platform and stores credentials.
     * 
     * @param userId - User ID
     * @param provider - Analytics provider
     * @param credentials - Provider credentials
     * @returns Connection status
     */
    async connect(
        userId: string,
        provider: AnalyticsProvider,
        credentials: Omit<AnalyticsCredentials, 'provider'>
    ): Promise<ConnectionStatus> {
        try {
            // Store credentials
            await this.repository.putItem({
                PK: `USER#${userId}`,
                SK: `ANALYTICS_CREDENTIALS#${provider}`,
                EntityType: 'AnalyticsCredentials',
                provider,
                ...credentials,
                connectedAt: new Date().toISOString(),
            });

            // Test connection
            const testResult = await this.testConnection(userId, provider);

            if (testResult.connected && this.config.autoSync) {
                // Start automatic sync
                this.startAutoSync(userId, provider);
            }

            return testResult;
        } catch (error) {
            console.error('Failed to connect to analytics platform:', error);
            return {
                provider,
                connected: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Track content performance
     * 
     * Retrieves performance metrics for specific content from the
     * connected analytics platform.
     * 
     * @param userId - User ID
     * @param contentId - Content ID to track
     * @param platform - Platform where content was published
     * @param timeframe - Time period for metrics (e.g., '7d', '30d')
     * @returns Performance metrics
     */
    async trackPerformance(
        userId: string,
        contentId: string,
        platform: string,
        timeframe: string = '7d'
    ): Promise<PerformanceMetrics> {
        // Get analytics credentials
        const credentials = await this.getCredentials(userId);
        if (!credentials) {
            throw new Error('No analytics credentials found for user');
        }

        // Fetch metrics from provider
        const metrics = await this.fetchMetricsFromProvider(
            contentId,
            platform,
            timeframe,
            credentials
        );

        // Store metrics in DynamoDB
        await this.storeMetrics(userId, metrics);

        return metrics;
    }

    /**
     * Generate strategy insights
     * 
     * Analyzes performance data to generate actionable insights
     * and recommendations for content strategy.
     * 
     * @param userId - User ID
     * @param timeframe - Time period to analyze
     * @returns Array of strategy insights
     */
    async generateInsights(
        userId: string,
        timeframe: string = '30d'
    ): Promise<StrategyInsight[]> {
        // Get all performance data for timeframe
        const performanceData = await this.getPerformanceData(userId, timeframe);

        if (performanceData.length === 0) {
            return [];
        }

        const insights: StrategyInsight[] = [];

        // Analyze trends
        const trendInsights = this.analyzeTrends(performanceData);
        insights.push(...trendInsights);

        // Identify opportunities
        const opportunityInsights = this.identifyOpportunities(performanceData);
        insights.push(...opportunityInsights);

        // Detect warnings
        const warningInsights = this.detectWarnings(performanceData);
        insights.push(...warningInsights);

        // Generate recommendations
        const recommendations = this.generateRecommendations(performanceData);
        insights.push(...recommendations);

        // Store insights
        for (const insight of insights) {
            await this.storeInsight(userId, insight);
        }

        return insights;
    }

    /**
     * Synchronize data
     * 
     * Syncs all content performance data from analytics platforms
     * and generates insights.
     * 
     * @param userId - User ID
     * @returns Sync result with statistics
     */
    async syncData(userId: string): Promise<SyncResult> {
        const result: SyncResult = {
            success: true,
            contentsSynced: 0,
            insightsGenerated: 0,
            errors: [],
            syncedAt: new Date().toISOString(),
        };

        try {
            // Get all published content
            const contents = await this.getPublishedContent(userId);

            // Track performance for each content
            for (const content of contents) {
                try {
                    await this.trackPerformance(
                        userId,
                        content.id,
                        content.platform,
                        '7d'
                    );
                    result.contentsSynced++;
                } catch (error) {
                    console.error(`Failed to sync content ${content.id}:`, error);
                    result.errors.push(`Content ${content.id}: ${(error as Error).message}`);
                }
            }

            // Generate insights if enabled
            if (this.config.autoGenerateInsights) {
                const insights = await this.generateInsights(userId);
                result.insightsGenerated = insights.length;
            }

            // Update last sync time
            await this.updateLastSync(userId);

            result.success = result.errors.length === 0;
        } catch (error) {
            console.error('Data sync failed:', error);
            result.success = false;
            result.errors.push((error as Error).message);
        }

        return result;
    }

    /**
     * Get insights for user
     * 
     * @param userId - User ID
     * @param filters - Optional filters for insights
     * @returns Array of insights
     */
    async getInsights(
        userId: string,
        filters?: {
            type?: StrategyInsight['type'];
            impact?: StrategyInsight['impact'];
            minConfidence?: number;
        }
    ): Promise<StrategyInsight[]> {
        const items = await this.repository.query(
            `USER#${userId}`,
            'INSIGHT#'
        );

        let insights = items.map(item => ({
            id: item.id as string,
            type: item.type as StrategyInsight['type'],
            title: item.title as string,
            description: item.description as string,
            confidence: item.confidence as number,
            impact: item.impact as StrategyInsight['impact'],
            actionable: item.actionable as boolean,
            recommendations: item.recommendations as string[],
            supportingData: item.supportingData as any[],
            generatedAt: item.generatedAt as string,
        }));

        // Apply filters
        if (filters) {
            if (filters.type) {
                insights = insights.filter(i => i.type === filters.type);
            }
            if (filters.impact) {
                insights = insights.filter(i => i.impact === filters.impact);
            }
            if (filters.minConfidence !== undefined) {
                insights = insights.filter(i => i.confidence >= filters.minConfidence!);
            }
        }

        return insights;
    }

    /**
     * Get connection status
     * 
     * @param userId - User ID
     * @param provider - Optional specific provider
     * @returns Connection status
     */
    async getConnectionStatus(
        userId: string,
        provider?: AnalyticsProvider
    ): Promise<ConnectionStatus[]> {
        const targetProvider = provider || this.config.defaultProvider;

        const credentials = await this.getCredentials(userId, targetProvider);
        if (!credentials) {
            return [{
                provider: targetProvider,
                connected: false,
                error: 'No credentials found',
            }];
        }

        return [await this.testConnection(userId, targetProvider)];
    }

    /**
     * Disconnect from analytics platform
     * 
     * @param userId - User ID
     * @param provider - Analytics provider
     */
    async disconnect(userId: string, provider: AnalyticsProvider): Promise<void> {
        // Stop auto sync
        this.stopAutoSync(userId, provider);

        // Remove credentials
        await this.repository.deleteItem(
            `USER#${userId}`,
            `ANALYTICS_CREDENTIALS#${provider}`
        );
    }

    /**
     * Start automatic data synchronization
     */
    private startAutoSync(userId: string, provider: AnalyticsProvider): void {
        const key = `${userId}:${provider}`;

        // Clear existing timer if any
        if (this.syncTimers.has(key)) {
            clearInterval(this.syncTimers.get(key)!);
        }

        // Set up new timer
        const timer = setInterval(
            async () => {
                try {
                    await this.syncData(userId);
                } catch (error) {
                    console.error('Auto sync failed:', error);
                }
            },
            this.config.syncInterval * 1000
        );

        this.syncTimers.set(key, timer);
    }

    /**
     * Stop automatic data synchronization
     */
    private stopAutoSync(userId: string, provider: AnalyticsProvider): void {
        const key = `${userId}:${provider}`;
        const timer = this.syncTimers.get(key);

        if (timer) {
            clearInterval(timer);
            this.syncTimers.delete(key);
        }
    }

    /**
     * Test connection to analytics platform
     */
    private async testConnection(
        userId: string,
        provider: AnalyticsProvider
    ): Promise<ConnectionStatus> {
        try {
            const credentials = await this.getCredentials(userId, provider);
            if (!credentials) {
                return {
                    provider,
                    connected: false,
                    error: 'No credentials found',
                };
            }

            // Test API call
            await this.testProviderConnection(credentials);

            // Get last sync time
            const lastSync = await this.getLastSync(userId, provider);

            return {
                provider,
                connected: true,
                lastSync,
            };
        } catch (error) {
            return {
                provider,
                connected: false,
                error: (error as Error).message,
            };
        }
    }

    /**
     * Get analytics credentials
     */
    private async getCredentials(
        userId: string,
        provider?: AnalyticsProvider
    ): Promise<AnalyticsCredentials | null> {
        const targetProvider = provider || this.config.defaultProvider;

        try {
            const item = await this.repository.getItem(
                `USER#${userId}`,
                `ANALYTICS_CREDENTIALS#${targetProvider}`
            );

            if (!item) {
                return null;
            }

            return {
                provider: item.provider as AnalyticsProvider,
                accessToken: item.accessToken as string,
                refreshToken: item.refreshToken as string | undefined,
                expiresAt: item.expiresAt as string | undefined,
                metadata: item.metadata as Record<string, any> | undefined,
            };
        } catch (error) {
            console.error('Failed to get analytics credentials:', error);
            return null;
        }
    }

    /**
     * Test provider connection
     */
    private async testProviderConnection(
        credentials: AnalyticsCredentials
    ): Promise<void> {
        switch (credentials.provider) {
            case 'google-analytics':
                await this.testGoogleAnalytics(credentials);
                break;
            case 'facebook-insights':
                await this.testFacebookInsights(credentials);
                break;
            case 'instagram-insights':
                await this.testInstagramInsights(credentials);
                break;
            case 'linkedin-analytics':
                await this.testLinkedInAnalytics(credentials);
                break;
            default:
                throw new Error(`Unsupported provider: ${credentials.provider}`);
        }
    }

    /**
     * Fetch metrics from analytics provider
     */
    private async fetchMetricsFromProvider(
        contentId: string,
        platform: string,
        timeframe: string,
        credentials: AnalyticsCredentials
    ): Promise<PerformanceMetrics> {
        switch (credentials.provider) {
            case 'google-analytics':
                return await this.fetchFromGoogleAnalytics(
                    contentId,
                    platform,
                    timeframe,
                    credentials
                );
            case 'facebook-insights':
                return await this.fetchFromFacebookInsights(
                    contentId,
                    platform,
                    timeframe,
                    credentials
                );
            case 'instagram-insights':
                return await this.fetchFromInstagramInsights(
                    contentId,
                    platform,
                    timeframe,
                    credentials
                );
            case 'linkedin-analytics':
                return await this.fetchFromLinkedInAnalytics(
                    contentId,
                    platform,
                    timeframe,
                    credentials
                );
            default:
                throw new Error(`Unsupported provider: ${credentials.provider}`);
        }
    }

    /**
     * Provider-specific implementations
     */

    private async testGoogleAnalytics(credentials: AnalyticsCredentials): Promise<void> {
        // Placeholder - would implement actual Google Analytics API call
        console.log('Testing Google Analytics connection');
    }

    private async testFacebookInsights(credentials: AnalyticsCredentials): Promise<void> {
        // Placeholder - would implement actual Facebook Insights API call
        console.log('Testing Facebook Insights connection');
    }

    private async testInstagramInsights(credentials: AnalyticsCredentials): Promise<void> {
        // Placeholder - would implement actual Instagram Insights API call
        console.log('Testing Instagram Insights connection');
    }

    private async testLinkedInAnalytics(credentials: AnalyticsCredentials): Promise<void> {
        // Placeholder - would implement actual LinkedIn Analytics API call
        console.log('Testing LinkedIn Analytics connection');
    }

    private async fetchFromGoogleAnalytics(
        contentId: string,
        platform: string,
        timeframe: string,
        credentials: AnalyticsCredentials
    ): Promise<PerformanceMetrics> {
        // Placeholder - would implement actual Google Analytics data fetch
        return this.createMockMetrics(contentId, platform, timeframe);
    }

    private async fetchFromFacebookInsights(
        contentId: string,
        platform: string,
        timeframe: string,
        credentials: AnalyticsCredentials
    ): Promise<PerformanceMetrics> {
        // Placeholder - would implement actual Facebook Insights data fetch
        return this.createMockMetrics(contentId, platform, timeframe);
    }

    private async fetchFromInstagramInsights(
        contentId: string,
        platform: string,
        timeframe: string,
        credentials: AnalyticsCredentials
    ): Promise<PerformanceMetrics> {
        // Placeholder - would implement actual Instagram Insights data fetch
        return this.createMockMetrics(contentId, platform, timeframe);
    }

    private async fetchFromLinkedInAnalytics(
        contentId: string,
        platform: string,
        timeframe: string,
        credentials: AnalyticsCredentials
    ): Promise<PerformanceMetrics> {
        // Placeholder - would implement actual LinkedIn Analytics data fetch
        return this.createMockMetrics(contentId, platform, timeframe);
    }

    /**
     * Create mock metrics for testing
     */
    private createMockMetrics(
        contentId: string,
        platform: string,
        timeframe: string
    ): PerformanceMetrics {
        return {
            contentId,
            platform,
            timeframe,
            metrics: {
                views: Math.floor(Math.random() * 10000),
                clicks: Math.floor(Math.random() * 1000),
                shares: Math.floor(Math.random() * 100),
                likes: Math.floor(Math.random() * 500),
                comments: Math.floor(Math.random() * 50),
                conversions: Math.floor(Math.random() * 20),
                engagementRate: Math.random() * 10,
                reachRate: Math.random() * 50,
                clickThroughRate: Math.random() * 5,
            },
            demographics: {
                ageGroups: {
                    '18-24': 15,
                    '25-34': 35,
                    '35-44': 25,
                    '45-54': 15,
                    '55+': 10,
                },
                locations: {
                    'United States': 60,
                    'Canada': 20,
                    'United Kingdom': 10,
                    'Other': 10,
                },
                devices: {
                    'Mobile': 65,
                    'Desktop': 30,
                    'Tablet': 5,
                },
            },
            timestamp: new Date().toISOString(),
        };
    }

    /**
     * Insight generation methods
     */

    private analyzeTrends(data: PerformanceMetrics[]): StrategyInsight[] {
        const insights: StrategyInsight[] = [];

        // Calculate average engagement rate
        const avgEngagement = data.reduce((sum, d) => sum + d.metrics.engagementRate, 0) / data.length;

        // Find trending content
        const highPerformers = data.filter(d => d.metrics.engagementRate > avgEngagement * 1.5);

        if (highPerformers.length > 0) {
            insights.push({
                id: `trend-${Date.now()}`,
                type: 'trend',
                title: 'High-Performing Content Identified',
                description: `${highPerformers.length} pieces of content are performing 50% above average engagement.`,
                confidence: 0.85,
                impact: 'high',
                actionable: true,
                recommendations: [
                    'Analyze common themes in high-performing content',
                    'Create similar content to capitalize on success',
                    'Increase posting frequency for this content type',
                ],
                supportingData: highPerformers.map(d => ({
                    contentId: d.contentId,
                    engagementRate: d.metrics.engagementRate,
                })),
                generatedAt: new Date().toISOString(),
            });
        }

        return insights;
    }

    private identifyOpportunities(data: PerformanceMetrics[]): StrategyInsight[] {
        const insights: StrategyInsight[] = [];

        // Find underutilized platforms
        const platformCounts = data.reduce((acc, d) => {
            acc[d.platform] = (acc[d.platform] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const allPlatforms = ['facebook', 'instagram', 'linkedin', 'twitter'];
        const unusedPlatforms = allPlatforms.filter(p => !platformCounts[p]);

        if (unusedPlatforms.length > 0) {
            insights.push({
                id: `opportunity-${Date.now()}`,
                type: 'opportunity',
                title: 'Untapped Platform Opportunities',
                description: `You're not posting to ${unusedPlatforms.join(', ')}. These platforms could expand your reach.`,
                confidence: 0.7,
                impact: 'medium',
                actionable: true,
                recommendations: [
                    `Start posting to ${unusedPlatforms[0]} to test audience response`,
                    'Repurpose existing high-performing content for new platforms',
                    'Research platform-specific best practices',
                ],
                supportingData: [{ unusedPlatforms }],
                generatedAt: new Date().toISOString(),
            });
        }

        return insights;
    }

    private detectWarnings(data: PerformanceMetrics[]): StrategyInsight[] {
        const insights: StrategyInsight[] = [];

        // Detect declining engagement
        if (data.length >= 5) {
            const recent = data.slice(-3);
            const older = data.slice(0, 3);

            const recentAvg = recent.reduce((sum, d) => sum + d.metrics.engagementRate, 0) / recent.length;
            const olderAvg = older.reduce((sum, d) => sum + d.metrics.engagementRate, 0) / older.length;

            if (recentAvg < olderAvg * 0.7) {
                insights.push({
                    id: `warning-${Date.now()}`,
                    type: 'warning',
                    title: 'Declining Engagement Detected',
                    description: 'Recent content engagement is 30% lower than previous period.',
                    confidence: 0.8,
                    impact: 'high',
                    actionable: true,
                    recommendations: [
                        'Review recent content for quality issues',
                        'Test different content formats',
                        'Analyze audience feedback and comments',
                        'Consider adjusting posting schedule',
                    ],
                    supportingData: [
                        { period: 'recent', avgEngagement: recentAvg },
                        { period: 'older', avgEngagement: olderAvg },
                    ],
                    generatedAt: new Date().toISOString(),
                });
            }
        }

        return insights;
    }

    private generateRecommendations(data: PerformanceMetrics[]): StrategyInsight[] {
        const insights: StrategyInsight[] = [];

        // Analyze best performing times
        const platformPerformance = data.reduce((acc, d) => {
            if (!acc[d.platform]) {
                acc[d.platform] = { total: 0, count: 0 };
            }
            acc[d.platform].total += d.metrics.engagementRate;
            acc[d.platform].count += 1;
            return acc;
        }, {} as Record<string, { total: number; count: number }>);

        const bestPlatform = Object.entries(platformPerformance)
            .map(([platform, stats]) => ({
                platform,
                avgEngagement: stats.total / stats.count,
            }))
            .sort((a, b) => b.avgEngagement - a.avgEngagement)[0];

        if (bestPlatform) {
            insights.push({
                id: `recommendation-${Date.now()}`,
                type: 'recommendation',
                title: `Focus on ${bestPlatform.platform}`,
                description: `${bestPlatform.platform} shows the highest average engagement rate.`,
                confidence: 0.75,
                impact: 'medium',
                actionable: true,
                recommendations: [
                    `Increase posting frequency on ${bestPlatform.platform}`,
                    'Allocate more resources to content creation for this platform',
                    'Study what makes content successful on this platform',
                ],
                supportingData: [bestPlatform],
                generatedAt: new Date().toISOString(),
            });
        }

        return insights;
    }

    /**
     * Data storage methods
     */

    private async storeMetrics(
        userId: string,
        metrics: PerformanceMetrics
    ): Promise<void> {
        const metricsId = `${metrics.contentId}-${metrics.platform}-${Date.now()}`;

        await this.repository.putItem({
            PK: `USER#${userId}`,
            SK: `ANALYTICS#${metricsId}`,
            EntityType: 'AnalyticsMetrics',
            ...metrics,
        });
    }

    private async storeInsight(
        userId: string,
        insight: StrategyInsight
    ): Promise<void> {
        await this.repository.putItem({
            PK: `USER#${userId}`,
            SK: `INSIGHT#${insight.id}`,
            EntityType: 'StrategyInsight',
            ...insight,
        });
    }

    private async getPerformanceData(
        userId: string,
        timeframe: string
    ): Promise<PerformanceMetrics[]> {
        const items = await this.repository.query(
            `USER#${userId}`,
            'ANALYTICS#'
        );

        // Filter by timeframe
        const cutoffDate = this.calculateCutoffDate(timeframe);
        const filtered = items.filter(item => {
            const timestamp = new Date(item.timestamp as string);
            return timestamp >= cutoffDate;
        });

        return filtered.map(item => ({
            contentId: item.contentId as string,
            platform: item.platform as string,
            timeframe: item.timeframe as string,
            metrics: item.metrics as PerformanceMetrics['metrics'],
            demographics: item.demographics as PerformanceMetrics['demographics'],
            timestamp: item.timestamp as string,
        }));
    }

    private async getPublishedContent(userId: string): Promise<Array<{ id: string; platform: string }>> {
        // Get published content from repository
        const items = await this.repository.query(
            `USER#${userId}`,
            'CONTENT#'
        );

        return items
            .filter(item => item.status === 'published')
            .map(item => ({
                id: item.id as string,
                platform: item.platform as string || 'website',
            }));
    }

    private async updateLastSync(userId: string): Promise<void> {
        await this.repository.putItem({
            PK: `USER#${userId}`,
            SK: 'ANALYTICS_SYNC_STATUS',
            EntityType: 'SyncStatus',
            lastSync: new Date().toISOString(),
        });
    }

    private async getLastSync(userId: string, provider: AnalyticsProvider): Promise<string | undefined> {
        try {
            const item = await this.repository.getItem(
                `USER#${userId}`,
                'ANALYTICS_SYNC_STATUS'
            );
            return item?.lastSync as string | undefined;
        } catch {
            return undefined;
        }
    }

    /**
     * Utility methods
     */

    private calculateCutoffDate(timeframe: string): Date {
        const now = new Date();
        const match = timeframe.match(/^(\d+)([dhm])$/);

        if (!match) {
            // Default to 7 days
            now.setDate(now.getDate() - 7);
            return now;
        }

        const [, amount, unit] = match;
        const value = parseInt(amount, 10);

        switch (unit) {
            case 'd':
                now.setDate(now.getDate() - value);
                break;
            case 'h':
                now.setHours(now.getHours() - value);
                break;
            case 'm':
                now.setMonth(now.getMonth() - value);
                break;
        }

        return now;
    }

    /**
     * Cleanup method
     */
    destroy(): void {
        // Clear all sync timers
        for (const timer of this.syncTimers.values()) {
            clearInterval(timer);
        }
        this.syncTimers.clear();
    }
}
