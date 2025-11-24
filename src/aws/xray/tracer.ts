/**
 * AWS X-Ray Tracer Implementation
 * 
 * Provides a centralized interface for X-Ray tracing across all services.
 * Handles trace creation, span management, and correlation across service boundaries.
 */

import { getXRayConfig, SERVICE_NAMES, OPERATION_NAMES, ANNOTATION_KEYS, METADATA_KEYS } from './config';
import { generateCorrelationId } from '@/aws/logging/logger';

// Dynamically import X-Ray SDK to handle environments where it's not available
let AWSXRay: any = null;
let Segment: any = null;
let Subsegment: any = null;

// Initialize X-Ray with configuration
const xrayConfig = getXRayConfig();

export interface TraceContext {
    traceId: string;
    segmentId: string;
    parentId?: string;
    correlationId: string;
    serviceName: string;
    operationName: string;
    userId?: string;
    requestId?: string;
}

export interface SpanOptions {
    serviceName?: string;
    operationName?: string;
    userId?: string;
    requestId?: string;
    metadata?: Record<string, any>;
    annotations?: Record<string, string | number | boolean>;
}

/**
 * Distributed Tracer class for managing X-Ray traces
 */
export class DistributedTracer {
    private static instance: DistributedTracer;
    private enabled: boolean;
    private initialized: boolean = false;

    private constructor() {
        this.enabled = xrayConfig.enabled && typeof window === 'undefined'; // Only enable in server environment
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): DistributedTracer {
        if (!DistributedTracer.instance) {
            DistributedTracer.instance = new DistributedTracer();
        }
        return DistributedTracer.instance;
    }

    /**
     * Initialize X-Ray SDK lazily
     */
    private async initializeXRay() {
        if (this.initialized || !this.enabled) return;

        try {
            const xrayModule = await import('aws-xray-sdk-core');
            AWSXRay = xrayModule.default;
            Segment = xrayModule.Segment;
            Subsegment = xrayModule.Subsegment;

            // Configure X-Ray
            AWSXRay.config([
                AWSXRay.plugins.EC2Plugin,
                AWSXRay.plugins.ECSPlugin,
                AWSXRay.plugins.ElasticBeanstalkPlugin,
            ]);

            // Set context missing strategy
            AWSXRay.setContextMissingStrategy(xrayConfig.contextMissingStrategy);

            // Set daemon address for local development
            if (xrayConfig.daemonAddress) {
                AWSXRay.setDaemonAddress(xrayConfig.daemonAddress);
            }

            // Capture AWS SDK calls
            if (xrayConfig.captureAWS) {
                try {
                    const AWS = require('aws-sdk');
                    AWSXRay.captureAWS(AWS);
                } catch (error) {
                    // AWS SDK v2 not available, skip capturing
                    console.warn('AWS SDK v2 not available for X-Ray capture, using SDK v3');
                }
            }

            // Capture HTTP calls
            if (xrayConfig.captureHTTP) {
                AWSXRay.captureHTTPs(require('https'));
                AWSXRay.captureHTTPs(require('http'));
            }

            // Capture promises
            if (xrayConfig.capturePromises) {
                AWSXRay.capturePromise();
            }

            this.initialized = true;
        } catch (error) {
            console.warn('Failed to initialize X-Ray SDK:', error);
            this.enabled = false;
        }
    }

    /**
     * Check if tracing is enabled
     */
    public isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Create a new trace segment
     */
    public async createSegment(
        name: string,
        traceId?: string,
        parentId?: string
    ): Promise<any | null> {
        if (!this.enabled) return null;

        await this.initializeXRay();
        if (!AWSXRay) return null;

        try {
            const segment = new AWSXRay.Segment(name, traceId, parentId);

            // Add default annotations
            segment.addAnnotation(ANNOTATION_KEYS.SERVICE_NAME, xrayConfig.serviceName);
            segment.addAnnotation(ANNOTATION_KEYS.AWS_REGION, process.env.AWS_REGION || 'us-east-1');

            return segment;
        } catch (error) {
            console.warn('Failed to create X-Ray segment:', error);
            return null;
        }
    }

    /**
     * Create a subsegment for a specific operation
     */
    public async createSubsegment(
        name: string,
        parent?: any
    ): Promise<any | null> {
        if (!this.enabled) return null;

        await this.initializeXRay();
        if (!AWSXRay) return null;

        try {
            const parentSegment = parent || AWSXRay.getSegment();
            if (!parentSegment) {
                console.warn('No parent segment available for subsegment:', name);
                return null;
            }

            const subsegment = parentSegment.addNewSubsegment(name);
            return subsegment;
        } catch (error) {
            console.warn('Failed to create X-Ray subsegment:', error);
            return null;
        }
    }

    /**
     * Start a new trace with context
     */
    public async startTrace(
        operationName: string,
        options: SpanOptions = {}
    ): Promise<TraceContext | null> {
        if (!this.enabled) return null;

        await this.initializeXRay();
        if (!AWSXRay) return null;

        try {
            const serviceName = options.serviceName || xrayConfig.serviceName;
            const correlationId = generateCorrelationId();

            const segment = await this.createSegment(`${serviceName}-${operationName}`);
            if (!segment) return null;

            // Add annotations
            segment.addAnnotation(ANNOTATION_KEYS.OPERATION_NAME, operationName);
            segment.addAnnotation(ANNOTATION_KEYS.SERVICE_NAME, serviceName);

            if (options.userId) {
                segment.addAnnotation(ANNOTATION_KEYS.USER_ID, options.userId);
            }

            if (options.requestId) {
                segment.addAnnotation(ANNOTATION_KEYS.REQUEST_ID, options.requestId);
            }

            // Add metadata
            segment.addMetadata(METADATA_KEYS.CORRELATION_ID, correlationId);

            if (options.metadata) {
                Object.entries(options.metadata).forEach(([key, value]) => {
                    segment.addMetadata(key, value);
                });
            }

            // Add custom annotations
            if (options.annotations) {
                Object.entries(options.annotations).forEach(([key, value]) => {
                    segment.addAnnotation(key, value);
                });
            }

            // Set segment as current
            AWSXRay.setSegment(segment);

            return {
                traceId: segment.trace_id,
                segmentId: segment.id,
                correlationId,
                serviceName,
                operationName,
                userId: options.userId,
                requestId: options.requestId,
            };
        } catch (error) {
            console.warn('Failed to start X-Ray trace:', error);
            return null;
        }
    }

    /**
     * Add annotation to current segment
     */
    public async addAnnotation(key: string, value: string | number | boolean): Promise<void> {
        if (!this.enabled) return;

        await this.initializeXRay();
        if (!AWSXRay) return;

        try {
            const segment = AWSXRay.getSegment();
            if (segment) {
                segment.addAnnotation(key, value);
            }
        } catch (error) {
            console.warn('Failed to add X-Ray annotation:', error);
        }
    }

    /**
     * Add metadata to current segment
     */
    public async addMetadata(key: string, value: any, namespace?: string): Promise<void> {
        if (!this.enabled) return;

        await this.initializeXRay();
        if (!AWSXRay) return;

        try {
            const segment = AWSXRay.getSegment();
            if (segment) {
                segment.addMetadata(key, value, namespace);
            }
        } catch (error) {
            console.warn('Failed to add X-Ray metadata:', error);
        }
    }

    /**
     * Add error information to current segment
     */
    public async addError(error: Error | string, remote: boolean = false): Promise<void> {
        if (!this.enabled) return;

        await this.initializeXRay();
        if (!AWSXRay) return;

        try {
            const segment = AWSXRay.getSegment();
            if (segment) {
                if (typeof error === 'string') {
                    segment.addError(new Error(error), remote);
                } else {
                    segment.addError(error, remote);
                }

                // Add error annotations
                segment.addAnnotation(ANNOTATION_KEYS.ERROR, true);
                segment.addAnnotation(
                    ANNOTATION_KEYS.ERROR_MESSAGE,
                    typeof error === 'string' ? error : error.message
                );
            }
        } catch (err) {
            console.warn('Failed to add X-Ray error:', err);
        }
    }

    /**
     * Close current segment
     */
    public async closeSegment(error?: Error): Promise<void> {
        if (!this.enabled) return;

        await this.initializeXRay();
        if (!AWSXRay) return;

        try {
            const segment = AWSXRay.getSegment();
            if (segment) {
                if (error) {
                    await this.addError(error);
                }
                segment.close();
            }
        } catch (err) {
            console.warn('Failed to close X-Ray segment:', err);
        }
    }

    /**
     * Parse trace header from incoming request
     */
    public parseTraceHeader(traceHeader: string): { traceId?: string; parentId?: string } | null {
        if (!traceHeader) return null;

        try {
            // X-Ray trace header format: Root=1-5f8a1234-abcd1234efgh5678ijkl9012;Parent=53995c3f42cd8ad8;Sampled=1
            const parts = traceHeader.split(';');
            const result: { traceId?: string; parentId?: string } = {};

            for (const part of parts) {
                const [key, value] = part.split('=');
                if (key === 'Root') {
                    result.traceId = value;
                } else if (key === 'Parent') {
                    result.parentId = value;
                }
            }

            return result;
        } catch (error) {
            console.warn('Failed to parse trace header:', error);
            return null;
        }
    }

    /**
     * Get trace header for outgoing requests
     */
    public getTraceHeader(): string | null {
        if (!this.enabled) return null;

        try {
            if (!AWSXRay) return null;

            const segment = AWSXRay.getSegment();
            if (!segment) return null;

            // Format: Root=1-5f8a1234-abcd1234efgh5678ijkl9012;Parent=53995c3f42cd8ad8;Sampled=1
            return `Root=${segment.trace_id};Parent=${segment.id};Sampled=1`;
        } catch (error) {
            console.warn('Failed to get trace header:', error);
            return null;
        }
    }

    /**
     * Get current trace context
     */
    public getCurrentTraceContext(): TraceContext | null {
        if (!this.enabled) return null;

        try {
            if (!AWSXRay) return null;

            const segment = AWSXRay.getSegment();
            if (!segment) return null;

            return {
                traceId: segment.trace_id,
                segmentId: segment.id,
                parentId: segment.parent_id,
                correlationId: segment.metadata?.default?.['correlation.id'] || '',
                serviceName: segment.name,
                operationName: segment.annotations?.['operation.name'] || '',
                userId: segment.annotations?.['user.id'],
                requestId: segment.annotations?.['request.id'],
            };
        } catch (error) {
            console.warn('Failed to get current trace context:', error);
            return null;
        }
    }

    /**
     * Start a subsegment
     */
    public async startSubsegment(
        name: string,
        options: SpanOptions = {}
    ): Promise<any | null> {
        return this.createSubsegment(name);
    }

    /**
     * Wrap an async function with tracing
     */
    public async traceAsync<T>(
        operationName: string,
        fn: () => Promise<T>,
        options: SpanOptions = {}
    ): Promise<T> {
        if (!this.enabled) {
            return fn();
        }

        const subsegment = await this.createSubsegment(operationName);

        try {
            const result = await fn();
            if (subsegment) subsegment.close();
            return result;
        } catch (error) {
            if (subsegment) {
                subsegment.addError(error as Error);
                subsegment.close();
            }
            throw error;
        }
    }
}

// Export singleton instance
export const tracer = DistributedTracer.getInstance();

// Export common operation names and service names
export { SERVICE_NAMES, OPERATION_NAMES, ANNOTATION_KEYS, METADATA_KEYS };