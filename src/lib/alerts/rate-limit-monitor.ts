/**
 * Rate Limit Monitoring and Alerting
 * 
 * Monitors rate limit usage and alerts administrators when thresholds are exceeded
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { RateLimiter, RateLimitResult } from './rate-limiter';

export interface RateLimitMetrics {
    userId?: string;
    scope: 'user' | 'system';
    window: 'minute' | 'hour' | 'day';
    timestamp: string;
    currentCount: number;
    limit: number;
    utilizationPercent: number;
    blocked: boolean;
}

export interface RateLimitAlert {
    id: string;
    type: 'threshold_exceeded' | 'user_blocked' | 'system_overload';
    severity: 'warning' | 'critical';
    message: string;
    metrics: RateLimitMetrics;
    timestamp: string;
}

export interface MonitoringConfig {
    // Threshold percentages for warnings
    warningThreshold: number; // e.g., 80 = warn at 80% of limit
    criticalThreshold: number; // e.g., 95 = critical at 95% of limit
    // Alert cooldown (prevent alert spam)
    alertCooldownMinutes: number;
}

/**
 * Rate Limit Monitor class
 * Tracks rate limit usage and generates alerts
 */
export class RateLimitMonitor {
    private repository: DynamoDBRepository;
    private rateLimiter: RateLimiter;
    private config: MonitoringConfig;

    constructor(rateLimiter: RateLimiter, config?: Partial<MonitoringConfig>) {
        this.repository = new DynamoDBRepository();
        this.rateLimiter = rateLimiter;
        this.config = {
            warningThreshold: config?.warningThreshold ?? 80,
            criticalThreshold: config?.criticalThreshold ?? 95,
            alertCooldownMinutes: config?.alertCooldownMinutes ?? 15,
        };
    }

    /**
     * Records rate limit metrics
     */
    async recordMetrics(
        userId: string | undefined,
        scope: 'user' | 'system',
        window: 'minute' | 'hour' | 'day',
        result: RateLimitResult
    ): Promise<void> {
        const metrics: RateLimitMetrics = {
            userId,
            scope,
            window,
            timestamp: new Date().toISOString(),
            currentCount: result.currentCount,
            limit: result.limit,
            utilizationPercent: (result.currentCount / result.limit) * 100,
            blocked: !result.allowed,
        };

        // Store metrics
        await this.storeMetrics(metrics);

        // Check if we should alert
        await this.checkAndAlert(metrics);
    }

    /**
     * Gets rate limit metrics for a time period
     */
    async getMetrics(
        userId: string | undefined,
        scope: 'user' | 'system',
        startTime: string,
        endTime: string
    ): Promise<RateLimitMetrics[]> {
        const pk = scope === 'user' && userId ? `USER#${userId}` : 'SYSTEM';
        const skPrefix = 'RATE_LIMIT_METRICS#';

        try {
            const result = await this.repository.query<RateLimitMetrics>(pk, skPrefix, {
                filterExpression: '#timestamp BETWEEN :start AND :end',
                expressionAttributeNames: {
                    '#timestamp': 'Data.timestamp',
                },
                expressionAttributeValues: {
                    ':start': startTime,
                    ':end': endTime,
                },
                scanIndexForward: false,
                limit: 1000,
            });

            return result.items;
        } catch (error) {
            console.error('Failed to get rate limit metrics:', error);
            return [];
        }
    }

    /**
     * Gets recent alerts
     */
    async getRecentAlerts(limit: number = 50): Promise<RateLimitAlert[]> {
        try {
            const result = await this.repository.query<RateLimitAlert>('SYSTEM', 'RATE_LIMIT_ALERT#', {
                scanIndexForward: false,
                limit,
            });

            return result.items;
        } catch (error) {
            console.error('Failed to get rate limit alerts:', error);
            return [];
        }
    }

    /**
     * Gets aggregated statistics
     */
    async getAggregatedStats(
        userId: string | undefined,
        scope: 'user' | 'system',
        window: 'minute' | 'hour' | 'day',
        hours: number = 24
    ): Promise<{
        avgUtilization: number;
        maxUtilization: number;
        blockedCount: number;
        totalRequests: number;
    }> {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

        const metrics = await this.getMetrics(
            userId,
            scope,
            startTime.toISOString(),
            endTime.toISOString()
        );

        if (metrics.length === 0) {
            return {
                avgUtilization: 0,
                maxUtilization: 0,
                blockedCount: 0,
                totalRequests: 0,
            };
        }

        const totalUtilization = metrics.reduce((sum, m) => sum + m.utilizationPercent, 0);
        const maxUtilization = Math.max(...metrics.map(m => m.utilizationPercent));
        const blockedCount = metrics.filter(m => m.blocked).length;
        const totalRequests = metrics.reduce((sum, m) => sum + m.currentCount, 0);

        return {
            avgUtilization: totalUtilization / metrics.length,
            maxUtilization,
            blockedCount,
            totalRequests,
        };
    }

    // ==================== Private Methods ====================

    /**
     * Stores rate limit metrics
     */
    private async storeMetrics(metrics: RateLimitMetrics): Promise<void> {
        const pk = metrics.scope === 'user' && metrics.userId ? `USER#${metrics.userId}` : 'SYSTEM';
        const sk = `RATE_LIMIT_METRICS#${metrics.timestamp}#${metrics.window}`;

        try {
            await this.repository.put({
                PK: pk,
                SK: sk,
                EntityType: 'RateLimitMetrics',
                Data: metrics,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
                // Set TTL for 7 days
                TTL: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
            });
        } catch (error) {
            console.error('Failed to store rate limit metrics:', error);
        }
    }

    /**
     * Checks metrics and generates alerts if needed
     */
    private async checkAndAlert(metrics: RateLimitMetrics): Promise<void> {
        // Check if blocked
        if (metrics.blocked) {
            await this.createAlert({
                type: metrics.scope === 'system' ? 'system_overload' : 'user_blocked',
                severity: 'critical',
                message: `${metrics.scope === 'system' ? 'System' : 'User'} rate limit exceeded for ${metrics.window} window`,
                metrics,
            });
            return;
        }

        // Check utilization thresholds
        if (metrics.utilizationPercent >= this.config.criticalThreshold) {
            await this.createAlert({
                type: 'threshold_exceeded',
                severity: 'critical',
                message: `Rate limit utilization at ${metrics.utilizationPercent.toFixed(1)}% (critical threshold: ${this.config.criticalThreshold}%)`,
                metrics,
            });
        } else if (metrics.utilizationPercent >= this.config.warningThreshold) {
            await this.createAlert({
                type: 'threshold_exceeded',
                severity: 'warning',
                message: `Rate limit utilization at ${metrics.utilizationPercent.toFixed(1)}% (warning threshold: ${this.config.warningThreshold}%)`,
                metrics,
            });
        }
    }

    /**
     * Creates an alert
     */
    private async createAlert(
        alertData: Omit<RateLimitAlert, 'id' | 'timestamp'>
    ): Promise<void> {
        // Check cooldown to prevent alert spam
        const shouldAlert = await this.checkAlertCooldown(alertData.type, alertData.metrics);
        if (!shouldAlert) {
            return;
        }

        const alert: RateLimitAlert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            ...alertData,
        };

        try {
            // Store alert
            await this.repository.put({
                PK: 'SYSTEM',
                SK: `RATE_LIMIT_ALERT#${alert.timestamp}#${alert.id}`,
                EntityType: 'RateLimitAlert',
                Data: alert,
                CreatedAt: Date.now(),
                UpdatedAt: Date.now(),
                // Set TTL for 30 days
                TTL: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
            });

            // Log to console for immediate visibility
            console.warn(`[Rate Limit Alert] ${alert.severity.toUpperCase()}: ${alert.message}`, {
                type: alert.type,
                metrics: alert.metrics,
            });

            // In production, you would also:
            // - Send to CloudWatch Logs
            // - Trigger SNS notification
            // - Send to monitoring dashboard
        } catch (error) {
            console.error('Failed to create rate limit alert:', error);
        }
    }

    /**
     * Checks if we should create an alert based on cooldown
     */
    private async checkAlertCooldown(
        type: RateLimitAlert['type'],
        metrics: RateLimitMetrics
    ): Promise<boolean> {
        const cooldownMs = this.config.alertCooldownMinutes * 60 * 1000;
        const cutoffTime = new Date(Date.now() - cooldownMs).toISOString();

        try {
            // Check for recent similar alerts
            const recentAlerts = await this.repository.query<RateLimitAlert>('SYSTEM', 'RATE_LIMIT_ALERT#', {
                filterExpression: '#type = :type AND #timestamp > :cutoff',
                expressionAttributeNames: {
                    '#type': 'Data.type',
                    '#timestamp': 'Data.timestamp',
                },
                expressionAttributeValues: {
                    ':type': type,
                    ':cutoff': cutoffTime,
                },
                scanIndexForward: false,
                limit: 1,
            });

            // If we found a recent similar alert, don't create a new one
            return recentAlerts.items.length === 0;
        } catch (error) {
            // On error, allow the alert
            return true;
        }
    }
}

// Export factory function
export const createRateLimitMonitor = (
    rateLimiter: RateLimiter,
    config?: Partial<MonitoringConfig>
) => {
    return new RateLimitMonitor(rateLimiter, config);
};
