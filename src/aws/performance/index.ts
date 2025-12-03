/**
 * AWS Performance Optimization Module
 * 
 * Exports all performance optimization utilities:
 * - Connection pooling for AWS SDK clients
 * - Query optimization for DynamoDB
 * - Enhanced caching strategies
 * - Performance monitoring and profiling
 */

// Connection pooling
export {
    createHttpAgent,
    createHttpsAgent,
    createOptimizedRequestHandler,
    getConnectionPoolManager,
    type ConnectionPoolConfig,
    type ConnectionPoolStats,
} from './connection-pool';

// Query optimization
export {
    QueryOptimizer,
    QueryBuilder,
    BatchOptimizer,
} from './query-optimizer';

// Cache management
export {
    CacheManager,
    MultiLevelCache,
    getCache,
    destroyCache,
    destroyAllCaches,
    type CacheConfig,
    type CacheStats,
} from './cache-manager';

// Performance monitoring
export {
    PerformanceMonitor,
    RequestProfiler,
    MemoryMonitor,
    getPerformanceMonitor,
    resetPerformanceMonitor,
    measurePerformance,
    type PerformanceMetric,
    type PerformanceProfile,
} from './monitoring';
