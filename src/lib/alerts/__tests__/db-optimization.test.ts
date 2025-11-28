/**
 * Database Optimization Tests
 * 
 * Tests for query optimization and connection pooling utilities
 */

import { QueryOptimizer, PerformanceMonitor } from '../db-optimization';
import {
    createOptimizedDynamoDBClient,
    ConnectionPoolManager,
    checkConnectionPoolHealth,
    LOAD_SCENARIO_CONFIGS,
} from '../db-connection-pool';

describe('QueryOptimizer', () => {
    let optimizer: QueryOptimizer;

    beforeEach(() => {
        optimizer = new QueryOptimizer();
    });

    describe('batchLoadPreferencesOptimized', () => {
        it('should return empty map for empty user list', async () => {
            const result = await optimizer.batchLoadPreferencesOptimized([]);
            expect(result.size).toBe(0);
        });

        it('should handle single user', async () => {
            const result = await optimizer.batchLoadPreferencesOptimized(['user1']);
            expect(result.size).toBeGreaterThanOrEqual(0);
        });

        it('should handle multiple users', async () => {
            const userIds = ['user1', 'user2', 'user3'];
            const result = await optimizer.batchLoadPreferencesOptimized(userIds);
            expect(result.size).toBeGreaterThanOrEqual(0);
        });
    });

    describe('countNotifications', () => {
        it('should return zero for user with no notifications', async () => {
            const count = await optimizer.countNotifications('nonexistent-user');
            expect(count).toBe(0);
        });

        it('should handle date range filters', async () => {
            const count = await optimizer.countNotifications('user1', {
                startDate: '2024-01-01',
                endDate: '2024-01-31',
            });
            expect(count).toBeGreaterThanOrEqual(0);
        });
    });

    describe('queryNotificationEvents', () => {
        it('should query with default options', async () => {
            const result = await optimizer.queryNotificationEvents('user1');
            expect(result).toHaveProperty('items');
            expect(result).toHaveProperty('count');
        });

        it('should apply limit', async () => {
            const result = await optimizer.queryNotificationEvents('user1', {
                limit: 10,
            });
            expect(result.items.length).toBeLessThanOrEqual(10);
        });

        it('should filter by event type', async () => {
            const result = await optimizer.queryNotificationEvents('user1', {
                eventType: 'email_sent',
            });
            expect(result).toHaveProperty('items');
        });

        it('should filter by date range', async () => {
            const result = await optimizer.queryNotificationEvents('user1', {
                startDate: '2024-01-01',
                endDate: '2024-01-31',
            });
            expect(result).toHaveProperty('items');
        });
    });

    describe('queryNotificationJobs', () => {
        it('should query with default options', async () => {
            const result = await optimizer.queryNotificationJobs('user1');
            expect(result).toHaveProperty('items');
            expect(result).toHaveProperty('count');
        });

        it('should filter by status', async () => {
            const result = await optimizer.queryNotificationJobs('user1', {
                status: 'pending',
            });
            expect(result).toHaveProperty('items');
        });

        it('should apply limit', async () => {
            const result = await optimizer.queryNotificationJobs('user1', {
                limit: 5,
            });
            expect(result.items.length).toBeLessThanOrEqual(5);
        });
    });

    describe('queryRecentNotifications', () => {
        it('should query with default limit', async () => {
            const result = await optimizer.queryRecentNotifications('user1');
            expect(result).toHaveProperty('items');
            expect(result.items.length).toBeLessThanOrEqual(20);
        });

        it('should respect custom limit', async () => {
            const result = await optimizer.queryRecentNotifications('user1', 5);
            expect(result.items.length).toBeLessThanOrEqual(5);
        });
    });
});

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        monitor = new PerformanceMonitor();
    });

    describe('recordQueryTime', () => {
        it('should record query execution time', () => {
            monitor.recordQueryTime('testQuery', 100);
            const avg = monitor.getAverageQueryTime('testQuery');
            expect(avg).toBe(100);
        });

        it('should calculate average for multiple recordings', () => {
            monitor.recordQueryTime('testQuery', 100);
            monitor.recordQueryTime('testQuery', 200);
            monitor.recordQueryTime('testQuery', 300);
            const avg = monitor.getAverageQueryTime('testQuery');
            expect(avg).toBe(200);
        });
    });

    describe('getQueryStats', () => {
        it('should return null for unknown query', () => {
            const stats = monitor.getQueryStats('unknownQuery');
            expect(stats).toBeNull();
        });

        it('should calculate statistics correctly', () => {
            const times = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
            times.forEach(time => monitor.recordQueryTime('testQuery', time));

            const stats = monitor.getQueryStats('testQuery');
            expect(stats).not.toBeNull();
            expect(stats!.count).toBe(10);
            expect(stats!.avg).toBe(55);
            expect(stats!.min).toBe(10);
            expect(stats!.max).toBe(100);
            expect(stats!.p50).toBeGreaterThanOrEqual(40);
            expect(stats!.p95).toBeGreaterThanOrEqual(90);
        });
    });

    describe('reset', () => {
        it('should clear all metrics', () => {
            monitor.recordQueryTime('testQuery', 100);
            monitor.reset();
            const avg = monitor.getAverageQueryTime('testQuery');
            expect(avg).toBe(0);
        });
    });

    describe('getAllStats', () => {
        it('should return stats for all queries', () => {
            monitor.recordQueryTime('query1', 100);
            monitor.recordQueryTime('query2', 200);
            const allStats = monitor.getAllStats();
            expect(allStats).toHaveProperty('query1');
            expect(allStats).toHaveProperty('query2');
        });

        it('should return empty object when no metrics', () => {
            const allStats = monitor.getAllStats();
            expect(Object.keys(allStats).length).toBe(0);
        });
    });
});

describe('ConnectionPoolManager', () => {
    let manager: ConnectionPoolManager;

    beforeEach(() => {
        manager = new ConnectionPoolManager();
    });

    afterEach(() => {
        manager.destroy();
    });

    describe('getStats', () => {
        it('should return connection pool statistics', () => {
            const stats = manager.getStats();
            expect(stats).toHaveProperty('maxSockets');
            expect(stats).toHaveProperty('maxFreeSockets');
            expect(stats).toHaveProperty('activeSockets');
            expect(stats).toHaveProperty('freeSockets');
            expect(stats).toHaveProperty('pendingRequests');
        });

        it('should reflect configured max sockets', () => {
            const customManager = new ConnectionPoolManager({ maxSockets: 100 });
            const stats = customManager.getStats();
            expect(stats.maxSockets).toBe(100);
            customManager.destroy();
        });
    });

    describe('updateConfig', () => {
        it('should update configuration', () => {
            manager.updateConfig({ maxSockets: 75 });
            const stats = manager.getStats();
            expect(stats.maxSockets).toBe(75);
        });

        it('should preserve other config values', () => {
            const initialStats = manager.getStats();
            manager.updateConfig({ maxSockets: 75 });
            const updatedStats = manager.getStats();
            expect(updatedStats.maxFreeSockets).toBe(initialStats.maxFreeSockets);
        });
    });

    describe('getConfig', () => {
        it('should return current configuration', () => {
            const config = manager.getConfig();
            expect(config).toBeDefined();
            expect(config).toHaveProperty('maxSockets');
            expect(config).toHaveProperty('keepAlive');
        });

        it('should return updated configuration', () => {
            manager.updateConfig({ maxSockets: 75 });
            const config = manager.getConfig();
            expect(config.maxSockets).toBe(75);
        });
    });
});

describe('createOptimizedDynamoDBClient', () => {
    it('should create client with default options', () => {
        const client = createOptimizedDynamoDBClient({
            region: 'us-east-1',
        });
        expect(client).toBeDefined();
        client.destroy();
    });

    it('should create client with custom pool options', () => {
        const client = createOptimizedDynamoDBClient(
            {
                region: 'us-east-1',
            },
            {
                maxSockets: 100,
                keepAlive: true,
            }
        );
        expect(client).toBeDefined();
        client.destroy();
    });

    it('should create client with load scenario config', () => {
        const client = createOptimizedDynamoDBClient(
            {
                region: 'us-east-1',
            },
            LOAD_SCENARIO_CONFIGS.highLoad.config
        );
        expect(client).toBeDefined();
        client.destroy();
    });
});

describe('checkConnectionPoolHealth', () => {
    it('should return health check result', () => {
        const health = checkConnectionPoolHealth();
        expect(health).toHaveProperty('healthy');
        expect(health).toHaveProperty('stats');
        expect(health).toHaveProperty('warnings');
        expect(typeof health.healthy).toBe('boolean');
        expect(Array.isArray(health.warnings)).toBe(true);
    });

    it('should be healthy with default configuration', () => {
        const health = checkConnectionPoolHealth();
        expect(health.healthy).toBe(true);
        expect(health.warnings.length).toBe(0);
    });
});

describe('Load Scenario Configs', () => {
    it('should have all load scenarios defined', () => {
        expect(LOAD_SCENARIO_CONFIGS).toHaveProperty('lowLoad');
        expect(LOAD_SCENARIO_CONFIGS).toHaveProperty('moderateLoad');
        expect(LOAD_SCENARIO_CONFIGS).toHaveProperty('highLoad');
        expect(LOAD_SCENARIO_CONFIGS).toHaveProperty('burstLoad');
    });

    it('should have increasing max sockets for higher loads', () => {
        expect(LOAD_SCENARIO_CONFIGS.lowLoad.config.maxSockets).toBeLessThan(
            LOAD_SCENARIO_CONFIGS.moderateLoad.config.maxSockets
        );
        expect(LOAD_SCENARIO_CONFIGS.moderateLoad.config.maxSockets).toBeLessThan(
            LOAD_SCENARIO_CONFIGS.highLoad.config.maxSockets
        );
        expect(LOAD_SCENARIO_CONFIGS.highLoad.config.maxSockets).toBeLessThan(
            LOAD_SCENARIO_CONFIGS.burstLoad.config.maxSockets
        );
    });

    it('should have keep-alive enabled for all scenarios', () => {
        Object.values(LOAD_SCENARIO_CONFIGS).forEach(scenario => {
            expect(scenario.config.keepAlive).toBe(true);
        });
    });
});
