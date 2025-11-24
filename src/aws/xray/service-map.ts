/**
 * X-Ray Service Map Visualization Utilities
 * 
 * Provides utilities for creating and visualizing service maps from X-Ray traces.
 */

import { tracer, ANNOTATION_KEYS } from './tracer';

export interface ServiceNode {
    name: string;
    type: 'service' | 'external' | 'database' | 'queue';
    requestCount: number;
    errorCount: number;
    averageLatency: number;
    throughput: number;
    errorRate: number;
    instances?: string[];
}

export interface ServiceEdge {
    source: string;
    target: string;
    requestCount: number;
    errorCount: number;
    averageLatency: number;
    errorRate: number;
    operations: string[];
}

export interface ServiceMap {
    nodes: ServiceNode[];
    edges: ServiceEdge[];
    timeRange: {
        start: Date;
        end: Date;
    };
    metadata: {
        totalRequests: number;
        totalErrors: number;
        averageLatency: number;
        services: number;
    };
}

/**
 * Create service map annotations for X-Ray visualization
 */
export function createServiceMapAnnotations(
    serviceName: string,
    targetService?: string,
    operation?: string,
    metadata?: Record<string, any>
): void {
    // Add service annotations
    tracer.addAnnotation('service.name', serviceName);
    tracer.addAnnotation('service.type', getServiceType(serviceName));

    if (targetService) {
        tracer.addAnnotation('target.service', targetService);
        tracer.addAnnotation('target.type', getServiceType(targetService));
    }

    if (operation) {
        tracer.addAnnotation('operation.name', operation);
    }

    // Add service map metadata
    const serviceMapData = {
        source: serviceName,
        target: targetService,
        operation,
        timestamp: new Date().toISOString(),
        ...metadata,
    };

    tracer.addMetadata('service_map', serviceMapData);
}

/**
 * Add service dependency information to trace
 */
export function addServiceDependency(
    fromService: string,
    toService: string,
    dependencyType: 'sync' | 'async' | 'database' | 'cache' | 'external',
    operation: string,
    success: boolean = true,
    latency?: number
): void {
    const dependency = {
        from: fromService,
        to: toService,
        type: dependencyType,
        operation,
        success,
        latency,
        timestamp: new Date().toISOString(),
    };

    tracer.addAnnotation('dependency.from', fromService);
    tracer.addAnnotation('dependency.to', toService);
    tracer.addAnnotation('dependency.type', dependencyType);
    tracer.addAnnotation('dependency.success', success);

    if (latency !== undefined) {
        tracer.addAnnotation('dependency.latency', latency);
    }

    tracer.addMetadata('dependency', dependency);
}

/**
 * Create business transaction annotations
 */
export function createBusinessTransaction(
    transactionName: string,
    transactionId: string,
    userId?: string,
    metadata?: Record<string, any>
): void {
    tracer.addAnnotation('transaction.name', transactionName);
    tracer.addAnnotation('transaction.id', transactionId);

    if (userId) {
        tracer.addAnnotation('transaction.user_id', userId);
    }

    const transactionData = {
        name: transactionName,
        id: transactionId,
        userId,
        startTime: new Date().toISOString(),
        ...metadata,
    };

    tracer.addMetadata('business_transaction', transactionData);
}

/**
 * Add performance SLA annotations
 */
export function addPerformanceSLA(
    operationName: string,
    targetLatency: number,
    actualLatency: number,
    slaViolation: boolean = false
): void {
    tracer.addAnnotation('sla.operation', operationName);
    tracer.addAnnotation('sla.target_latency', targetLatency);
    tracer.addAnnotation('sla.actual_latency', actualLatency);
    tracer.addAnnotation('sla.violation', slaViolation);

    const slaData = {
        operation: operationName,
        targetLatency,
        actualLatency,
        violation: slaViolation,
        violationPercentage: ((actualLatency - targetLatency) / targetLatency) * 100,
        timestamp: new Date().toISOString(),
    };

    tracer.addMetadata('sla', slaData);
}

/**
 * Create custom business metrics
 */
export function addBusinessMetrics(metrics: {
    contentGenerated?: number;
    usersActive?: number;
    revenueGenerated?: number;
    conversions?: number;
    apiCallsRemaining?: number;
    storageUsed?: number;
    [key: string]: any;
}): void {
    Object.entries(metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
            tracer.addAnnotation(`business.${key}`, value);
        }
        tracer.addMetadata(`business_metrics.${key}`, value);
    });

    tracer.addMetadata('business_metrics', {
        ...metrics,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Add error classification for better service map insights
 */
export function addErrorClassification(
    errorType: 'client' | 'server' | 'network' | 'timeout' | 'auth' | 'validation' | 'business',
    errorCode?: string,
    errorMessage?: string,
    retryable: boolean = false
): void {
    tracer.addAnnotation('error.type', errorType);
    tracer.addAnnotation('error.retryable', retryable);

    if (errorCode) {
        tracer.addAnnotation('error.code', errorCode);
    }

    const errorData = {
        type: errorType,
        code: errorCode,
        message: errorMessage,
        retryable,
        timestamp: new Date().toISOString(),
    };

    tracer.addMetadata('error_classification', errorData);
}

/**
 * Create deployment and version annotations
 */
export function addDeploymentInfo(
    version: string,
    environment: string,
    deploymentId?: string,
    gitCommit?: string
): void {
    tracer.addAnnotation('deployment.version', version);
    tracer.addAnnotation('deployment.environment', environment);

    if (deploymentId) {
        tracer.addAnnotation('deployment.id', deploymentId);
    }

    if (gitCommit) {
        tracer.addAnnotation('deployment.git_commit', gitCommit);
    }

    const deploymentData = {
        version,
        environment,
        deploymentId,
        gitCommit,
        timestamp: new Date().toISOString(),
    };

    tracer.addMetadata('deployment', deploymentData);
}

/**
 * Add feature flag information
 */
export function addFeatureFlags(flags: Record<string, boolean | string | number>): void {
    Object.entries(flags).forEach(([flag, value]) => {
        tracer.addAnnotation(`feature.${flag}`, value);
    });

    tracer.addMetadata('feature_flags', {
        ...flags,
        timestamp: new Date().toISOString(),
    });
}

/**
 * Create canary deployment annotations
 */
export function addCanaryInfo(
    canaryVersion: string,
    trafficPercentage: number,
    isCanaryRequest: boolean
): void {
    tracer.addAnnotation('canary.version', canaryVersion);
    tracer.addAnnotation('canary.traffic_percentage', trafficPercentage);
    tracer.addAnnotation('canary.is_canary_request', isCanaryRequest);

    const canaryData = {
        version: canaryVersion,
        trafficPercentage,
        isCanaryRequest,
        timestamp: new Date().toISOString(),
    };

    tracer.addMetadata('canary', canaryData);
}

// Helper functions

function getServiceType(serviceName: string): string {
    if (serviceName.includes('database') || serviceName.includes('dynamodb') || serviceName.includes('rds')) {
        return 'database';
    }

    if (serviceName.includes('queue') || serviceName.includes('sqs') || serviceName.includes('sns')) {
        return 'queue';
    }

    if (serviceName.includes('external') || serviceName.includes('api')) {
        return 'external';
    }

    return 'service';
}

/**
 * Generate service map URL for AWS X-Ray console
 */
export function getServiceMapURL(
    region: string = 'us-east-1',
    timeRange: { start: Date; end: Date } = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
        end: new Date(),
    }
): string {
    const startTime = Math.floor(timeRange.start.getTime() / 1000);
    const endTime = Math.floor(timeRange.end.getTime() / 1000);

    return `https://${region}.console.aws.amazon.com/xray/home?region=${region}#/service-map?timeRange=${startTime},${endTime}`;
}

/**
 * Create trace analytics URL
 */
export function getTraceAnalyticsURL(
    region: string = 'us-east-1',
    serviceName?: string,
    timeRange: { start: Date; end: Date } = {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: new Date(),
    }
): string {
    const startTime = Math.floor(timeRange.start.getTime() / 1000);
    const endTime = Math.floor(timeRange.end.getTime() / 1000);

    let url = `https://${region}.console.aws.amazon.com/xray/home?region=${region}#/analytics?timeRange=${startTime},${endTime}`;

    if (serviceName) {
        url += `&filter=service("${serviceName}")`;
    }

    return url;
}