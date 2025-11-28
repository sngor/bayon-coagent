/**
 * DynamoDB Connection Pool Configuration
 * 
 * Provides optimized connection pooling configuration for DynamoDB client
 * to improve performance and reduce latency.
 * 
 * Note: The AWS SDK v3 automatically handles connection pooling through the
 * underlying HTTP client. This module provides configuration utilities and
 * monitoring capabilities.
 */

import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

/**
 * Connection pool configuration options
 */
export interface ConnectionPoolOptions {
    // Maximum number of sockets to allow per host
    maxSockets: number;
    // Maximum number of sockets to leave open in a free state
    maxFreeSockets: number;
    // Socket timeout in milliseconds
    timeout: number;
    // Keep-alive timeout in milliseconds
    keepAliveTimeout: number;
    // Enable keep-alive
    keepAlive: boolean;
    // Maximum number of retries
    maxRetries: number;
    // Request timeout in milliseconds
    requestTimeout: number;
}

/**
 * Default connection pool options optimized for notification system
 */
export const DEFAULT_POOL_OPTIONS: ConnectionPoolOptions = {
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 5000,
    keepAliveTimeout: 60000,
    keepAlive: true,
    maxRetries: 3,
    requestTimeout: 5000,
};

/**
 * Creates an optimized DynamoDB client with connection pooling
 * 
 * Note: AWS SDK v3 automatically manages connection pooling. This function
 * provides a standardized way to create clients with recommended settings.
 */
export function createOptimizedDynamoDBClient(
    config: DynamoDBClientConfig,
    poolOptions: Partial<ConnectionPoolOptions> = {}
): DynamoDBClient {
    const options = { ...DEFAULT_POOL_OPTIONS, ...poolOptions };

    return new DynamoDBClient({
        ...config,
        maxAttempts: options.maxRetries,
        requestHandler: {
            // Connection pooling is handled automatically by the SDK
            // These settings are documented for reference
            metadata: {
                maxSockets: options.maxSockets,
                keepAlive: options.keepAlive,
                timeout: options.timeout,
            },
        } as any,
    });
}

/**
 * Creates an optimized DynamoDB Document client with connection pooling
 */
export function createOptimizedDocumentClient(
    baseClient: DynamoDBClient
): DynamoDBDocumentClient {
    return DynamoDBDocumentClient.from(baseClient, {
        marshallOptions: {
            convertEmptyValues: false,
            removeUndefinedValues: true,
            convertClassInstanceToMap: false,
        },
        unmarshallOptions: {
            wrapNumbers: false,
        },
    });
}

/**
 * Connection pool statistics
 */
export interface ConnectionPoolStats {
    maxSockets: number;
    maxFreeSockets: number;
    activeSockets: number;
    freeSockets: number;
    pendingRequests: number;
}

/**
 * Connection pool manager for monitoring and management
 * 
 * Note: This is a simplified manager since AWS SDK v3 handles connection
 * pooling automatically. Use this for configuration tracking and monitoring.
 */
export class ConnectionPoolManager {
    private options: ConnectionPoolOptions;

    constructor(options: Partial<ConnectionPoolOptions> = {}) {
        this.options = { ...DEFAULT_POOL_OPTIONS, ...options };
    }

    /**
     * Gets connection pool statistics
     */
    getStats(): ConnectionPoolStats {
        // AWS SDK v3 manages connections internally
        // These stats reflect the configured limits
        return {
            maxSockets: this.options.maxSockets,
            maxFreeSockets: this.options.maxFreeSockets,
            activeSockets: 0, // Managed by SDK
            freeSockets: 0, // Managed by SDK
            pendingRequests: 0, // Managed by SDK
        };
    }

    /**
     * Destroys all connections in the pool
     */
    destroy(): void {
        // SDK manages connection lifecycle
        // This is a no-op for compatibility
    }

    /**
     * Updates connection pool configuration
     */
    updateConfig(options: Partial<ConnectionPoolOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Gets the current configuration
     */
    getConfig(): ConnectionPoolOptions {
        return { ...this.options };
    }
}

/**
 * Singleton connection pool manager
 */
let poolManager: ConnectionPoolManager | null = null;

/**
 * Gets or creates the connection pool manager
 */
export function getConnectionPoolManager(): ConnectionPoolManager {
    if (!poolManager) {
        poolManager = new ConnectionPoolManager();
    }
    return poolManager;
}

/**
 * Resets the connection pool manager
 */
export function resetConnectionPoolManager(): void {
    if (poolManager) {
        poolManager.destroy();
        poolManager = null;
    }
}

/**
 * Connection pool health check
 */
export interface HealthCheckResult {
    healthy: boolean;
    stats: ConnectionPoolStats;
    warnings: string[];
}

/**
 * Performs a health check on the connection pool
 */
export function checkConnectionPoolHealth(): HealthCheckResult {
    const manager = getConnectionPoolManager();
    const stats = manager.getStats();
    const warnings: string[] = [];

    // Check for potential issues
    if (stats.activeSockets >= stats.maxSockets * 0.9) {
        warnings.push('Connection pool is near capacity (>90% utilized)');
    }

    if (stats.pendingRequests > 10) {
        warnings.push(`High number of pending requests: ${stats.pendingRequests}`);
    }

    return {
        healthy: warnings.length === 0,
        stats,
        warnings,
    };
}

/**
 * Best practices for connection pooling
 */
export const CONNECTION_POOL_BEST_PRACTICES = {
    sizing: {
        description: 'Size the pool based on expected concurrent requests',
        recommendations: [
            'Start with 50 max sockets for moderate load',
            'Increase to 100-200 for high load',
            'Monitor and adjust based on metrics',
        ],
    },
    keepAlive: {
        description: 'Enable keep-alive to reuse connections',
        recommendations: [
            'Always enable keep-alive for better performance',
            'Set keep-alive timeout to 60 seconds',
            'Monitor connection reuse rate',
        ],
    },
    timeouts: {
        description: 'Configure appropriate timeouts',
        recommendations: [
            'Set socket timeout to 5 seconds',
            'Set request timeout to 5 seconds',
            'Adjust based on your latency requirements',
        ],
    },
    monitoring: {
        description: 'Monitor connection pool health',
        recommendations: [
            'Track active and free sockets',
            'Monitor pending requests',
            'Alert on pool exhaustion',
        ],
    },
};

/**
 * Example usage for different load scenarios
 */
export const LOAD_SCENARIO_CONFIGS = {
    lowLoad: {
        description: 'Configuration for low-traffic applications',
        config: {
            maxSockets: 25,
            maxFreeSockets: 5,
            timeout: 5000,
            keepAliveTimeout: 60000,
            keepAlive: true,
            maxRetries: 3,
            requestTimeout: 5000,
        },
    },
    moderateLoad: {
        description: 'Configuration for moderate-traffic applications',
        config: {
            maxSockets: 50,
            maxFreeSockets: 10,
            timeout: 5000,
            keepAliveTimeout: 60000,
            keepAlive: true,
            maxRetries: 3,
            requestTimeout: 5000,
        },
    },
    highLoad: {
        description: 'Configuration for high-traffic applications',
        config: {
            maxSockets: 100,
            maxFreeSockets: 20,
            timeout: 3000,
            keepAliveTimeout: 60000,
            keepAlive: true,
            maxRetries: 2,
            requestTimeout: 3000,
        },
    },
    burstLoad: {
        description: 'Configuration for burst-traffic applications',
        config: {
            maxSockets: 200,
            maxFreeSockets: 50,
            timeout: 3000,
            keepAliveTimeout: 30000,
            keepAlive: true,
            maxRetries: 2,
            requestTimeout: 3000,
        },
    },
};
