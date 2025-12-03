/**
 * AWS SDK Connection Pooling Configuration
 * 
 * Optimizes AWS SDK client connections for better performance and resource utilization.
 * Implements connection pooling, keep-alive, and request optimization.
 */

import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

/**
 * Connection pool configuration options
 */
export interface ConnectionPoolConfig {
    /**
     * Maximum number of sockets to allow per host
     * Default: 50
     */
    maxSockets?: number;

    /**
     * Maximum number of free sockets to keep open per host
     * Default: 10
     */
    maxFreeSockets?: number;

    /**
     * Socket timeout in milliseconds
     * Default: 30000 (30 seconds)
     */
    timeout?: number;

    /**
     * Keep-alive timeout in milliseconds
     * Default: 60000 (60 seconds)
     */
    keepAliveTimeout?: number;

    /**
     * Enable keep-alive
     * Default: true
     */
    keepAlive?: boolean;
}

const DEFAULT_POOL_CONFIG: Required<ConnectionPoolConfig> = {
    maxSockets: 50,
    maxFreeSockets: 10,
    timeout: 30000,
    keepAliveTimeout: 60000,
    keepAlive: true,
};

/**
 * Creates an optimized HTTP agent for AWS SDK clients
 */
export function createHttpAgent(config: ConnectionPoolConfig = {}): HttpAgent {
    const poolConfig = { ...DEFAULT_POOL_CONFIG, ...config };

    return new HttpAgent({
        keepAlive: poolConfig.keepAlive,
        keepAliveMsecs: poolConfig.keepAliveTimeout,
        maxSockets: poolConfig.maxSockets,
        maxFreeSockets: poolConfig.maxFreeSockets,
        timeout: poolConfig.timeout,
    });
}

/**
 * Creates an optimized HTTPS agent for AWS SDK clients
 */
export function createHttpsAgent(config: ConnectionPoolConfig = {}): HttpsAgent {
    const poolConfig = { ...DEFAULT_POOL_CONFIG, ...config };

    return new HttpsAgent({
        keepAlive: poolConfig.keepAlive,
        keepAliveMsecs: poolConfig.keepAliveTimeout,
        maxSockets: poolConfig.maxSockets,
        maxFreeSockets: poolConfig.maxFreeSockets,
        timeout: poolConfig.timeout,
    });
}

/**
 * Creates an optimized request handler for AWS SDK v3 clients
 */
export function createOptimizedRequestHandler(config: ConnectionPoolConfig = {}): NodeHttpHandler {
    const httpAgent = createHttpAgent(config);
    const httpsAgent = createHttpsAgent(config);

    return new NodeHttpHandler({
        httpAgent,
        httpsAgent,
        requestTimeout: config.timeout || DEFAULT_POOL_CONFIG.timeout,
        connectionTimeout: 5000, // 5 seconds for connection establishment
    });
}

/**
 * Connection pool statistics
 */
export interface ConnectionPoolStats {
    httpSockets: number;
    httpFreeSockets: number;
    httpRequests: number;
    httpsSockets: number;
    httpsFreeSockets: number;
    httpsRequests: number;
}

/**
 * Gets connection pool statistics from agents
 */
export function getConnectionPoolStats(
    httpAgent: HttpAgent,
    httpsAgent: HttpsAgent
): ConnectionPoolStats {
    return {
        httpSockets: Object.keys(httpAgent.sockets).reduce(
            (sum, key) => sum + httpAgent.sockets[key].length,
            0
        ),
        httpFreeSockets: Object.keys(httpAgent.freeSockets).reduce(
            (sum, key) => sum + httpAgent.freeSockets[key].length,
            0
        ),
        httpRequests: Object.keys(httpAgent.requests).reduce(
            (sum, key) => sum + httpAgent.requests[key].length,
            0
        ),
        httpsSockets: Object.keys(httpsAgent.sockets).reduce(
            (sum, key) => sum + httpsAgent.sockets[key].length,
            0
        ),
        httpsFreeSockets: Object.keys(httpsAgent.freeSockets).reduce(
            (sum, key) => sum + httpsAgent.freeSockets[key].length,
            0
        ),
        httpsRequests: Object.keys(httpsAgent.requests).reduce(
            (sum, key) => sum + httpsAgent.requests[key].length,
            0
        ),
    };
}

/**
 * Singleton connection pool manager
 */
class ConnectionPoolManager {
    private static instance: ConnectionPoolManager;
    private httpAgent: HttpAgent;
    private httpsAgent: HttpsAgent;
    private requestHandler: NodeHttpHandler;

    private constructor(config: ConnectionPoolConfig = {}) {
        this.httpAgent = createHttpAgent(config);
        this.httpsAgent = createHttpsAgent(config);
        this.requestHandler = createOptimizedRequestHandler(config);
    }

    public static getInstance(config?: ConnectionPoolConfig): ConnectionPoolManager {
        if (!ConnectionPoolManager.instance) {
            ConnectionPoolManager.instance = new ConnectionPoolManager(config);
        }
        return ConnectionPoolManager.instance;
    }

    public getHttpAgent(): HttpAgent {
        return this.httpAgent;
    }

    public getHttpsAgent(): HttpsAgent {
        return this.httpsAgent;
    }

    public getRequestHandler(): NodeHttpHandler {
        return this.requestHandler;
    }

    public getStats(): ConnectionPoolStats {
        return getConnectionPoolStats(this.httpAgent, this.httpsAgent);
    }

    /**
     * Destroys all connections and resets the pool
     */
    public destroy(): void {
        this.httpAgent.destroy();
        this.httpsAgent.destroy();
        this.requestHandler.destroy();
    }
}

/**
 * Gets the global connection pool manager instance
 */
export function getConnectionPoolManager(config?: ConnectionPoolConfig): ConnectionPoolManager {
    return ConnectionPoolManager.getInstance(config);
}
