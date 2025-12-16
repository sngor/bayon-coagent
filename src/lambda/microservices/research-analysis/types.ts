/**
 * Shared types for Research and Analysis Microservices
 */

export interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata?: {
        processingTime: number;
        timestamp: string;
        version: string;
    };
}

export interface BaseServiceRequest {
    requestId?: string;
    userId?: string;
    timestamp?: string;
}

export interface ServiceHealthCheck {
    service: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    version: string;
    uptime: number;
    dependencies: Array<{
        name: string;
        status: 'healthy' | 'unhealthy';
        responseTime?: number;
    }>;
    metrics: {
        requestCount: number;
        errorRate: number;
        averageResponseTime: number;
    };
}

export interface DataSource {
    id: string;
    name: string;
    type: string;
    enabled: boolean;
    priority: number;
    reliability: number;
    lastUpdated: string;
}

export interface ProcessingMetadata {
    startTime: number;
    endTime: number;
    processingTime: number;
    dataSourcesUsed: string[];
    recordsProcessed: number;
    errors: string[];
}

// Common error types
export class ServiceError extends Error {
    constructor(
        public code: string,
        message: string,
        public statusCode: number = 500,
        public details?: any
    ) {
        super(message);
        this.name = 'ServiceError';
    }
}

export class ValidationError extends ServiceError {
    constructor(message: string, details?: any) {
        super('VALIDATION_ERROR', message, 400, details);
        this.name = 'ValidationError';
    }
}

export class DataSourceError extends ServiceError {
    constructor(message: string, sourceId: string, details?: any) {
        super('DATA_SOURCE_ERROR', message, 502, { sourceId, ...details });
        this.name = 'DataSourceError';
    }
}

export class ProcessingError extends ServiceError {
    constructor(message: string, details?: any) {
        super('PROCESSING_ERROR', message, 500, details);
        this.name = 'ProcessingError';
    }
}