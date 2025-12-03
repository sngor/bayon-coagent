/**
 * Performance Optimization Examples
 * 
 * Demonstrates how to use the performance optimization utilities
 * in real-world scenarios.
 */

import { DynamoDBRepository } from '../dynamodb/repository';
import {
    QueryOptimizer,
    QueryBuilder,
    BatchOptimizer,
    CacheManager,
    getCache,
    getPerformanceMonitor,
    RequestProfiler,
    MemoryMonitor,
    getConnectionPoolManager,
} from './index';

/**
 * Example 1: Optimized User Data Fetching
 * 
 * Demonstrates parallel queries, caching, and performance monitoring
 */
export async function fetchUserDataOptimized(userId: string) {
    const monitor = getPerformanceMonitor();
    const repository = new DynamoDBRepository();
    const optimizer = new QueryOptimizer(repository, 300000); // 5 min cache

    return monitor.measure('fetchUserDataOptimized', async () => {
        // Fetch multiple data types in parallel
        const [profile, content, reports] = await optimizer.parallelQuery([
            { pk: `USER#${userId}`, skPrefix: 'PROFILE' },
            { pk: `USER#${userId}`, skPrefix: 'CONTENT#' },
            { pk: `USER#${userId}`, skPrefix: 'REPORT#' },
        ]);

        return {
            profile: profile.items[0],
            content: content.items,
            reports: reports.items,
        };
    });
}

/**
 * Example 2: Cached Content Listing
 * 
 * Demonstrates query caching with projection optimization
 */
export async function listUserContentCached(userId: string) {
    const repository = new DynamoDBRepository();
    const optimizer = new QueryOptimizer(repository, 60000); // 1 min cache

    // Build optimized query with projection
    const options = new QueryBuilder()
        .limit(50)
        .scanForward(false) // Most recent first
        .select(['title', 'createdAt', 'status', 'type'])
        .filter('status = :status', { ':status': 'published' })
        .build();

    // Use cached query
    return optimizer.cachedQuery(
        `USER#${userId}`,
        'CONTENT#',
        options
    );
}

/**
 * Example 3: Batch Operations with Optimization
 * 
 * Demonstrates optimized batch writes and deduplication
 */
export async function saveBulkContent(userId: string, items: any[]) {
    const monitor = getPerformanceMonitor();
    const repository = new DynamoDBRepository();

    return monitor.measure('saveBulkContent', async () => {
        await BatchOptimizer.optimizedBatchWrite(
            repository,
            items,
            (item) => ({
                PK: `USER#${userId}`,
                SK: `CONTENT#${item.id}`,
            }),
            25 // Batch size
        );
    });
}

/**
 * Example 4: Request Profiling
 * 
 * Demonstrates request lifecycle profiling
 */
export async function handleUserRequest(requestId: string, userId: string) {
    const profiler = new RequestProfiler(requestId);

    // Phase 1: Authentication
    profiler.startPhase('authentication');
    // ... auth logic ...
    profiler.endPhase('authentication');

    // Phase 2: Data fetching
    profiler.startPhase('dataFetch');
    const userData = await fetchUserDataOptimized(userId);
    profiler.endPhase('dataFetch', { itemsRetrieved: 3 });

    // Phase 3: Processing
    profiler.startPhase('processing');
    const processed = processUserData(userData);
    profiler.endPhase('processing');

    // Phase 4: Response preparation
    profiler.startPhase('response');
    const response = prepareResponse(processed);
    profiler.endPhase('response');

    // Get profile summary
    const profile = profiler.getProfile();
    console.log('Request profile:', profile);

    return response;
}

/**
 * Example 5: Multi-Level Caching
 * 
 * Demonstrates L1/L2 cache strategy
 */
export class UserDataService {
    private l1Cache: CacheManager; // Fast, small cache
    private l2Cache: CacheManager; // Larger, persistent cache

    constructor() {
        this.l1Cache = new CacheManager({
            maxEntries: 100,
            ttl: 60000, // 1 minute
            enableLRU: true,
        });

        this.l2Cache = new CacheManager({
            maxEntries: 1000,
            ttl: 300000, // 5 minutes
            enableLRU: true,
        });
    }

    async getUserProfile(userId: string) {
        const cacheKey = `profile:${userId}`;

        // Check L1 cache
        let profile = this.l1Cache.get(cacheKey);
        if (profile) {
            return profile;
        }

        // Check L2 cache
        profile = this.l2Cache.get(cacheKey);
        if (profile) {
            // Promote to L1
            this.l1Cache.set(cacheKey, profile);
            return profile;
        }

        // Fetch from database
        const repository = new DynamoDBRepository();
        profile = await repository.get(`USER#${userId}`, 'PROFILE');

        if (profile) {
            // Store in both caches
            this.l1Cache.set(cacheKey, profile);
            this.l2Cache.set(cacheKey, profile);
        }

        return profile;
    }

    getCacheStats() {
        return {
            l1: this.l1Cache.getStats(),
            l2: this.l2Cache.getStats(),
        };
    }
}

/**
 * Example 6: Performance Monitoring Dashboard
 * 
 * Demonstrates comprehensive performance monitoring
 */
export class PerformanceDashboard {
    private monitor = getPerformanceMonitor();
    private memoryMonitor = new MemoryMonitor();
    private poolManager = getConnectionPoolManager();

    constructor() {
        // Take memory snapshots every 10 seconds
        setInterval(() => {
            this.memoryMonitor.snapshot();
        }, 10000);
    }

    getMetrics() {
        return {
            // Performance profiles
            hotPaths: this.monitor.getHotPaths(10),
            slowOperations: this.monitor.getSlowOperations(10),
            bottlenecks: this.monitor.getBottlenecks(10),

            // Memory usage
            memory: this.memoryMonitor.getStats(),

            // Connection pool
            connections: this.poolManager.getStats(),

            // Cache statistics
            caches: {
                users: getCache('users').getStats(),
                content: getCache('content').getStats(),
            },
        };
    }

    exportMetrics() {
        return this.monitor.export();
    }

    reset() {
        this.monitor.clear();
        this.memoryMonitor.clear();
    }
}

/**
 * Example 7: Efficient Pagination
 * 
 * Demonstrates efficient pagination through large datasets
 */
export async function* paginateUserContent(userId: string) {
    const repository = new DynamoDBRepository();
    const optimizer = new QueryOptimizer(repository);

    // Use async generator for memory-efficient pagination
    for await (const batch of optimizer.paginateQuery(
        `USER#${userId}`,
        'CONTENT#',
        { limit: 100 }
    )) {
        yield batch;
    }
}

/**
 * Example 8: Cache Warming
 * 
 * Demonstrates cache warming for critical data
 */
export async function warmCriticalCaches() {
    const monitor = getPerformanceMonitor();
    const repository = new DynamoDBRepository();

    return monitor.measure('warmCriticalCaches', async () => {
        const userCache = getCache('users');
        const contentCache = getCache('content');

        // Warm user cache with active users
        const activeUsers = await repository.query('ACTIVE', 'USER#', {
            limit: 100,
        });

        const userEntries = activeUsers.items.map((user: any) => ({
            key: `user:${user.id}`,
            value: user,
        }));

        await userCache.warm(userEntries);

        // Warm content cache with popular content
        const popularContent = await repository.query('POPULAR', 'CONTENT#', {
            limit: 50,
        });

        const contentEntries = popularContent.items.map((content: any) => ({
            key: `content:${content.id}`,
            value: content,
        }));

        await contentCache.warm(contentEntries);

        console.log('Cache warming complete');
        console.log('User cache:', userCache.getStats());
        console.log('Content cache:', contentCache.getStats());
    });
}

/**
 * Example 9: Query Optimization with Projection
 * 
 * Demonstrates reducing data transfer with projections
 */
export async function getContentSummaries(userId: string) {
    const repository = new DynamoDBRepository();
    const optimizer = new QueryOptimizer(repository);

    // Only fetch required fields
    const baseOptions = new QueryBuilder()
        .limit(100)
        .scanForward(false)
        .build();

    const optimizedOptions = optimizer.optimizeProjection(baseOptions, [
        'id',
        'title',
        'createdAt',
        'status',
        'type',
    ]);

    return repository.query(`USER#${userId}`, 'CONTENT#', optimizedOptions);
}

/**
 * Example 10: Monitoring Decorator
 * 
 * Demonstrates automatic performance monitoring with decorators
 */
export class ContentService {
    private repository = new DynamoDBRepository();

    async createContent(userId: string, data: any) {
        const monitor = getPerformanceMonitor();
        return monitor.measure('ContentService.createContent', async () => {
            return this.repository.create(
                `USER#${userId}`,
                `CONTENT#${data.id}`,
                'Content',
                data
            );
        });
    }

    async updateContent(userId: string, contentId: string, updates: any) {
        const monitor = getPerformanceMonitor();
        return monitor.measure('ContentService.updateContent', async () => {
            return this.repository.update(
                `USER#${userId}`,
                `CONTENT#${contentId}`,
                updates
            );
        });
    }

    async deleteContent(userId: string, contentId: string) {
        const monitor = getPerformanceMonitor();
        return monitor.measure('ContentService.deleteContent', async () => {
            return this.repository.delete(`USER#${userId}`, `CONTENT#${contentId}`);
        });
    }

    getPerformanceStats() {
        const monitor = getPerformanceMonitor();
        return {
            create: monitor.getProfile('ContentService.createContent'),
            update: monitor.getProfile('ContentService.updateContent'),
            delete: monitor.getProfile('ContentService.deleteContent'),
        };
    }
}

// Helper functions for examples
function processUserData(data: any) {
    return data;
}

function prepareResponse(data: any) {
    return data;
}
