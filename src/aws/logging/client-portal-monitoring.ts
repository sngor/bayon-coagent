/**
 * Client Portal Monitoring and Logging
 * 
 * Provides comprehensive monitoring, logging, and alerting for the client portal feature.
 * 
 * Features:
 * - Structured logging for all dashboard operations
 * - CloudWatch metrics for key operations
 * - Alarm configurations for error rates and performance
 * - Analytics event tracking
 */

import { createLogger, LogContext } from './logger';
import { AlarmConfig } from './alerts';
import { getConfig } from '../config';

// ==================== Logger ====================

/**
 * Create a dedicated logger for client portal operations
 */
export const clientPortalLogger = createLogger({ service: 'client-portal' });

/**
 * Log dashboard view event
 */
export function logDashboardView(
    dashboardId: string,
    token: string,
    context?: LogContext
): void {
    clientPortalLogger.info('Dashboard viewed', {
        ...context,
        operation: 'dashboard_view',
        dashboardId,
        token: token.substring(0, 8) + '...', // Log partial token for security
    });
}

/**
 * Log link validation attempt
 */
export function logLinkValidation(
    token: string,
    success: boolean,
    reason?: string,
    context?: LogContext
): void {
    const level = success ? 'info' : 'warn';
    const message = success ? 'Link validation successful' : 'Link validation failed';

    clientPortalLogger[level](message, {
        ...context,
        operation: 'link_validation',
        token: token.substring(0, 8) + '...',
        success,
        reason,
    });
}

/**
 * Log property search
 */
export function logPropertySearch(
    dashboardId: string,
    criteria: Record<string, any>,
    resultCount: number,
    duration: number,
    context?: LogContext
): void {
    clientPortalLogger.info('Property search executed', {
        ...context,
        operation: 'property_search',
        dashboardId,
        criteria,
        resultCount,
        duration,
    });
}

/**
 * Log valuation request
 */
export function logValuationRequest(
    dashboardId: string,
    propertyAddress: string,
    success: boolean,
    duration: number,
    context?: LogContext
): void {
    clientPortalLogger.info('Valuation requested', {
        ...context,
        operation: 'valuation_request',
        dashboardId,
        propertyAddress,
        success,
        duration,
    });
}

/**
 * Log document download
 */
export function logDocumentDownload(
    dashboardId: string,
    documentId: string,
    fileName: string,
    context?: LogContext
): void {
    clientPortalLogger.info('Document downloaded', {
        ...context,
        operation: 'document_download',
        dashboardId,
        documentId,
        fileName,
    });
}

/**
 * Log contact request
 */
export function logContactRequest(
    dashboardId: string,
    agentId: string,
    requestType: string,
    context?: LogContext
): void {
    clientPortalLogger.info('Contact request submitted', {
        ...context,
        operation: 'contact_request',
        dashboardId,
        agentId,
        requestType,
    });
}

/**
 * Log dashboard creation
 */
export function logDashboardCreation(
    dashboardId: string,
    agentId: string,
    context?: LogContext
): void {
    clientPortalLogger.info('Dashboard created', {
        ...context,
        operation: 'dashboard_creation',
        dashboardId,
        agentId,
    });
}

/**
 * Log link generation
 */
export function logLinkGeneration(
    dashboardId: string,
    agentId: string,
    expiresAt: number,
    context?: LogContext
): void {
    clientPortalLogger.info('Secured link generated', {
        ...context,
        operation: 'link_generation',
        dashboardId,
        agentId,
        expiresAt,
    });
}

/**
 * Log CMA report creation
 */
export function logCMAReportCreation(
    dashboardId: string,
    agentId: string,
    context?: LogContext
): void {
    clientPortalLogger.info('CMA report created', {
        ...context,
        operation: 'cma_creation',
        dashboardId,
        agentId,
    });
}

/**
 * Log error with context
 */
export function logError(
    operation: string,
    error: Error,
    context?: LogContext
): void {
    clientPortalLogger.error(`Error in ${operation}`, error, {
        ...context,
        operation,
    });
}

// ==================== CloudWatch Metrics ====================

/**
 * CloudWatch metrics client for client portal
 */
class ClientPortalMetrics {
    private namespace = 'BayonCoAgent/ClientPortal';
    private enabled: boolean;

    constructor() {
        const config = getConfig();
        this.enabled = config.environment !== 'local';
    }

    /**
     * Put a metric to CloudWatch
     */
    private async putMetric(
        metricName: string,
        value: number,
        unit: string = 'Count',
        dimensions?: Record<string, string>
    ): Promise<void> {
        if (!this.enabled) {
            return;
        }

        try {
            // In production, this would use AWS SDK CloudWatch client
            // For now, we'll log structured metrics that can be parsed by CloudWatch
            console.log(JSON.stringify({
                namespace: this.namespace,
                metricName,
                value,
                unit,
                dimensions,
                timestamp: new Date().toISOString(),
            }));
        } catch (error) {
            clientPortalLogger.error('Failed to put metric', error as Error, {
                metricName,
                value,
            });
        }
    }

    /**
     * Track dashboard view
     */
    async trackDashboardView(dashboardId: string): Promise<void> {
        await this.putMetric('DashboardViews', 1, 'Count', { dashboardId });
    }

    /**
     * Track link validation
     */
    async trackLinkValidation(success: boolean): Promise<void> {
        await this.putMetric('LinkValidations', 1, 'Count', {
            status: success ? 'success' : 'failure',
        });
    }

    /**
     * Track property search
     */
    async trackPropertySearch(dashboardId: string, resultCount: number): Promise<void> {
        await this.putMetric('PropertySearches', 1, 'Count', { dashboardId });
        await this.putMetric('PropertySearchResults', resultCount, 'Count', { dashboardId });
    }

    /**
     * Track valuation request
     */
    async trackValuationRequest(dashboardId: string, success: boolean): Promise<void> {
        await this.putMetric('ValuationRequests', 1, 'Count', {
            dashboardId,
            status: success ? 'success' : 'failure',
        });
    }

    /**
     * Track document download
     */
    async trackDocumentDownload(dashboardId: string): Promise<void> {
        await this.putMetric('DocumentDownloads', 1, 'Count', { dashboardId });
    }

    /**
     * Track contact request
     */
    async trackContactRequest(dashboardId: string, requestType: string): Promise<void> {
        await this.putMetric('ContactRequests', 1, 'Count', {
            dashboardId,
            requestType,
        });
    }

    /**
     * Track operation duration
     */
    async trackOperationDuration(
        operation: string,
        duration: number
    ): Promise<void> {
        await this.putMetric(`${operation}Duration`, duration, 'Milliseconds');
    }

    /**
     * Track error
     */
    async trackError(operation: string): Promise<void> {
        await this.putMetric('Errors', 1, 'Count', { operation });
    }
}

// Export singleton instance
export const clientPortalMetrics = new ClientPortalMetrics();

// ==================== CloudWatch Alarms ====================

/**
 * High error rate alarm for client portal
 */
export const clientPortalHighErrorRateAlarm: AlarmConfig = {
    name: 'BayonCoAgent-ClientPortal-HighErrorRate',
    description: 'Alert when client portal error rate exceeds 5% over 5 minutes',
    namespace: 'BayonCoAgent/ClientPortal',
    metricName: 'ErrorRate',
    statistic: 'Average',
    period: 300, // 5 minutes
    evaluationPeriods: 1,
    threshold: 5, // 5%
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'notBreaching',
};

/**
 * Slow response time alarm for client portal
 */
export const clientPortalSlowResponseAlarm: AlarmConfig = {
    name: 'BayonCoAgent-ClientPortal-SlowResponse',
    description: 'Alert when client portal response time exceeds 5 seconds',
    namespace: 'BayonCoAgent/ClientPortal',
    metricName: 'ResponseTime',
    statistic: 'Average',
    period: 300,
    evaluationPeriods: 2,
    threshold: 5000, // 5 seconds in milliseconds
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'notBreaching',
};

/**
 * Link validation failure alarm
 */
export const clientPortalLinkValidationFailureAlarm: AlarmConfig = {
    name: 'BayonCoAgent-ClientPortal-LinkValidationFailures',
    description: 'Alert when link validation failure rate is high',
    namespace: 'BayonCoAgent/ClientPortal',
    metricName: 'LinkValidationFailureRate',
    statistic: 'Average',
    period: 300,
    evaluationPeriods: 1,
    threshold: 20, // 20% failure rate
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'notBreaching',
};

/**
 * Unusual access pattern alarm
 */
export const clientPortalUnusualAccessAlarm: AlarmConfig = {
    name: 'BayonCoAgent-ClientPortal-UnusualAccess',
    description: 'Alert when dashboard views spike unusually (potential scraping)',
    namespace: 'BayonCoAgent/ClientPortal',
    metricName: 'DashboardViews',
    statistic: 'Sum',
    period: 300,
    evaluationPeriods: 1,
    threshold: 1000, // 1000 views in 5 minutes
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'notBreaching',
};

/**
 * Property search failure alarm
 */
export const clientPortalPropertySearchFailureAlarm: AlarmConfig = {
    name: 'BayonCoAgent-ClientPortal-PropertySearchFailures',
    description: 'Alert when property search failures exceed threshold',
    namespace: 'BayonCoAgent/ClientPortal',
    metricName: 'PropertySearchFailures',
    statistic: 'Sum',
    period: 300,
    evaluationPeriods: 1,
    threshold: 10,
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'notBreaching',
};

/**
 * Valuation request failure alarm
 */
export const clientPortalValuationFailureAlarm: AlarmConfig = {
    name: 'BayonCoAgent-ClientPortal-ValuationFailures',
    description: 'Alert when valuation request failures exceed threshold',
    namespace: 'BayonCoAgent/ClientPortal',
    metricName: 'ValuationFailures',
    statistic: 'Sum',
    period: 300,
    evaluationPeriods: 1,
    threshold: 5,
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'notBreaching',
};

/**
 * Document download failure alarm
 */
export const clientPortalDocumentDownloadFailureAlarm: AlarmConfig = {
    name: 'BayonCoAgent-ClientPortal-DocumentDownloadFailures',
    description: 'Alert when document download failures exceed threshold',
    namespace: 'BayonCoAgent/ClientPortal',
    metricName: 'DocumentDownloadFailures',
    statistic: 'Sum',
    period: 300,
    evaluationPeriods: 1,
    threshold: 10,
    comparisonOperator: 'GreaterThanThreshold',
    treatMissingData: 'notBreaching',
};

/**
 * Export all client portal alarms
 */
export const clientPortalAlarms = {
    highErrorRate: clientPortalHighErrorRateAlarm,
    slowResponse: clientPortalSlowResponseAlarm,
    linkValidationFailure: clientPortalLinkValidationFailureAlarm,
    unusualAccess: clientPortalUnusualAccessAlarm,
    propertySearchFailure: clientPortalPropertySearchFailureAlarm,
    valuationFailure: clientPortalValuationFailureAlarm,
    documentDownloadFailure: clientPortalDocumentDownloadFailureAlarm,
};

// ==================== Helper Functions ====================

/**
 * Wrap an async operation with logging and metrics
 */
export async function monitorOperation<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
): Promise<T> {
    const startTime = Date.now();

    try {
        clientPortalLogger.debug(`Starting ${operation}`, context);
        const result = await fn();
        const duration = Date.now() - startTime;

        clientPortalLogger.debug(`Completed ${operation}`, {
            ...context,
            duration,
        });

        await clientPortalMetrics.trackOperationDuration(operation, duration);

        return result;
    } catch (error) {
        const duration = Date.now() - startTime;

        clientPortalLogger.error(`Failed ${operation}`, error as Error, {
            ...context,
            duration,
        });

        await clientPortalMetrics.trackError(operation);

        throw error;
    }
}

/**
 * Calculate error rate for a given time period
 */
export function calculateErrorRate(
    totalRequests: number,
    errorCount: number
): number {
    if (totalRequests === 0) return 0;
    return (errorCount / totalRequests) * 100;
}

/**
 * Check if response time is within acceptable threshold
 */
export function isResponseTimeAcceptable(duration: number): boolean {
    return duration < 5000; // 5 seconds
}
