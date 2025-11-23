/**
 * Performance Optimizations Tests
 * 
 * Tests for performance optimization utilities and functions:
 * - Query optimization and caching
 * - Data aggregation for large datasets
 * - Virtual scrolling utilities
 * - Memory management
 * 
 * Task: 18.2 Performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { performance } from 'perf_hooks';
import {
    optimizedQuery,
    optimizedBatchWrite,
    aggregateAnalyticsData,
    debounce,
    throttle,
    LazyLoader,
    measurePerformance,
    performanceMonitor,
    getOptimalListStrategy,
    estimateRenderingPerformance,
    clearPerformanceCaches,
    getCacheStats,
    preloadData
} from '@/lib/performance-optimizations';

// Mock DynamoDB repository
jest.mock('@/aws/dynamodb/repository', () => ({
    getRepository: () => ({
        query: jest.fn(),
        create: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
    }),
}));

describe('Performance Optimizations', () => {
    beforeEach(() => {
        clearPerformanceCaches();
        jest.clearAllMocks();
    });

    describe('Query Optimization', () => {
        it('should cache query results for improved performance', async () => {
            const mockQuery = jest.fn().mockResolvedValue({
                items: [{ id: '1', data: 'test' }],
                lastEvaluatedKey: undefined
            });

            // Mock the repository
            const { getRepository } = await import('@/aws/dynamodb/repository');
            (getRepository as jest.Mock).mockReturnValue({
                query: mockQuery
            });

            // First query - should hit the database
            const result1 = await optimizedQuery('USER#123', 'CONTENT#', {}, { enableCaching: true });
            expect(mockQuery).toHaveBeenCalledTimes(1);
            expect(result1.fromCache).toBeUndefined();

            // Second identical query - should hit cache
            const result2 = await optimizedQuery('USER#123', 'CONTENT#', {}, { enableCaching: true });
            expect(mockQuery).toHaveBeenCalledTimes(1); // Still only called once
            expect(result2.fromCache).toBe(true);

            expect(result1.items).toEqual(result2.items);
        });

        it('should handle pagination efficiently', async () => {
            const mockQuery = jest.fn()
                .mockResolvedValueOnce({
                    items: Array.from({ length: 50 }, (_, i) => ({ id: i, data: `item-${i}` })),
                    lastEvaluatedKey: 'page2'
                })
                .mockResolvedValueOnce({
                    items: Array.from({ length: 30 }, (_, i) => ({ id: i + 50, data: `item-${i + 50}` })),
                    lastEvaluatedKey: undefined
                });

            const { getRepository } = await import('@/aws/dynamodb/repository');
            (getRepository as jest.Mock).mockReturnValue({
                query: mockQuery
            });

            const result = await optimizedQuery('USER#123', 'CONTENT#', {}, {
                enablePagination: true,
                pageSize: 50
            });

            expect(mockQuery).toHaveBeenCalledTimes(2);
            expect(result.items).toHaveLength(80);
        });

        it('should measure query performance', async () => {
            const mockQuery = jest.fn().mockImplementation(async () => {
                // Simulate query time
                await new Promise(resolve => setTimeout(resolve, 100));
                return {
                    items: [{ id: '1', data: 'test' }],
                    lastEvaluatedKey: undefined
                };
            });

            const { getRepository } = await import('@/aws/dynamodb/repository');
            (getRepository as jest.Mock).mockReturnValue({
                query: mockQuery
            });

            const startTime = performance.now();
            await optimizedQuery('USER#123', 'CONTENT#');
            const endTime = performance.now();

            expect(endTime - startTime).toBeGreaterThan(90); // Should take at least 90ms
        });
    });

    describe('Batch Operations', () => {
        it('should handle large batch writes efficiently', async () => {
            const mockCreate = jest.fn().mockResolvedValue(undefined);

            const { getRepository } = await import('@/aws/dynamodb/repository');
            (getRepository as jest.Mock).mockReturnValue({
                create: mockCreate
            });

            const items = Array.from({ length: 100 }, (_, i) => ({
                pk: `USER#123`,
                sk: `ITEM#${i}`,
                entityType: 'TestEntity' as any,
                data: { id: i, name: `Item ${i}` }
            }));

            const result = await optimizedBatchWrite(items, { batchSize: 25 });

            expect(result.success).toBe(true);
            expect(result.processedCount).toBe(100);
            expect(result.failedItems).toHaveLength(0);
            expect(mockCreate).toHaveBeenCalledTimes(100); // Each item creates one call
        });

        it('should handle batch failures with retry logic', async () => {
            let callCount = 0;
            const mockCreate = jest.fn().mockImplementation(async () => {
                callCount++;
                if (callCount <= 2) {
                    throw new Error('Temporary failure');
                }
                return undefined;
            });

            const { getRepository } = await import('@/aws/dynamodb/repository');
            (getRepository as jest.Mock).mockReturnValue({
                create: mockCreate
            });

            const items = [{
                pk: 'USER#123',
                sk: 'ITEM#1',
                entityType: 'TestEntity' as any,
                data: { id: 1, name: 'Item 1' }
            }];

            const result = await optimizedBatchWrite(items, { maxRetries: 3 });

            expect(result.success).toBe(true);
            expect(mockCreate).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });
    });

    describe('Data Aggregation', () => {
        it('should aggregate large datasets to target point count', () => {
            const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
                date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
                value: Math.random() * 100
            }));

            const aggregated = aggregateAnalyticsData(largeDataset, 100);

            expect(aggregated).toHaveLength(100);
            expect(aggregated[0]).toHaveProperty('date');
            expect(aggregated[0]).toHaveProperty('value');
        });

        it('should not aggregate datasets smaller than target', () => {
            const smallDataset = Array.from({ length: 50 }, (_, i) => ({
                date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
                value: Math.random() * 100
            }));

            const result = aggregateAnalyticsData(smallDataset, 100);

            expect(result).toHaveLength(50);
            expect(result).toEqual(smallDataset);
        });

        it('should preserve data structure during aggregation', () => {
            const dataset = Array.from({ length: 200 }, (_, i) => ({
                date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
                value: i * 2,
                category: 'test'
            }));

            const aggregated = aggregateAnalyticsData(dataset, 50);

            expect(aggregated[0]).toHaveProperty('date');
            expect(aggregated[0]).toHaveProperty('value');
            expect(aggregated[0]).toHaveProperty('category');
        });
    });

    describe('Function Optimization', () => {
        it('should debounce function calls', (done) => {
            let callCount = 0;
            const testFunction = () => {
                callCount++;
            };

            const debouncedFunction = debounce(testFunction, 100);

            // Call multiple times rapidly
            debouncedFunction();
            debouncedFunction();
            debouncedFunction();

            // Should not have been called yet
            expect(callCount).toBe(0);

            // Wait for debounce delay
            setTimeout(() => {
                expect(callCount).toBe(1); // Should only be called once
                done();
            }, 150);
        });

        it('should throttle function calls', (done) => {
            let callCount = 0;
            const testFunction = () => {
                callCount++;
            };

            const throttledFunction = throttle(testFunction, 100);

            // Call multiple times rapidly
            throttledFunction(); // Should execute immediately
            throttledFunction(); // Should be throttled
            throttledFunction(); // Should be throttled

            expect(callCount).toBe(1);

            // Wait for throttle period
            setTimeout(() => {
                throttledFunction(); // Should execute now
                expect(callCount).toBe(2);
                done();
            }, 150);
        });

        it('should measure function performance', async () => {
            const slowFunction = async (delay: number) => {
                await new Promise(resolve => setTimeout(resolve, delay));
                return 'result';
            };

            const measuredFunction = measurePerformance(slowFunction, 'testFunction');

            const result = await measuredFunction(50);

            expect(result).toBe('result');

            const metrics = performanceMonitor.getMetrics();
            expect(metrics).toHaveProperty('testFunction');
            expect(metrics.testFunction.count).toBe(1);
            expect(metrics.testFunction.avg).toBeGreaterThan(40);
        });
    });

    describe('Lazy Loading', () => {
        it('should load data incrementally', async () => {
            const mockLoader = jest.fn()
                .mockResolvedValueOnce([1, 2, 3, 4, 5])
                .mockResolvedValueOnce([6, 7, 8, 9, 10])
                .mockResolvedValueOnce([]);

            const lazyLoader = new LazyLoader(mockLoader, 5);

            // First load
            const batch1 = await lazyLoader.loadMore();
            expect(batch1).toEqual([1, 2, 3, 4, 5]);
            expect(lazyLoader.getLoadedCount()).toBe(5);

            // Second load
            const batch2 = await lazyLoader.loadMore();
            expect(batch2).toEqual([6, 7, 8, 9, 10]);
            expect(lazyLoader.getLoadedCount()).toBe(10);

            // All loaded items
            expect(lazyLoader.getLoadedItems()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });

        it('should handle loader errors gracefully', async () => {
            const mockLoader = jest.fn().mockRejectedValue(new Error('Load failed'));

            const lazyLoader = new LazyLoader(mockLoader, 5);

            const result = await lazyLoader.loadMore();

            expect(result).toEqual([]);
            expect(lazyLoader.getLoadedCount()).toBe(0);
        });
    });

    describe('List Optimization Strategy', () => {
        it('should recommend standard rendering for small lists', () => {
            const strategy = getOptimalListStrategy(50, 80, 600);

            expect(strategy.strategy).toBe('standard');
            expect(strategy.reason).toContain('Small list');
        });

        it('should recommend pagination for medium lists', () => {
            const strategy = getOptimalListStrategy(300, 80, 600);

            expect(strategy.strategy).toBe('pagination');
            expect(strategy.reason).toContain('Medium list');
            expect(strategy.config.pageSize).toBeGreaterThan(0);
        });

        it('should recommend virtual scrolling for large lists', () => {
            const strategy = getOptimalListStrategy(2000, 80, 600);

            expect(strategy.strategy).toBe('virtual-scroll');
            expect(strategy.reason).toContain('Large list');
            expect(strategy.config.itemHeight).toBe(80);
            expect(strategy.config.containerHeight).toBe(600);
        });

        it('should estimate performance correctly', () => {
            const virtualPerf = estimateRenderingPerformance(1000, 'virtual-scroll');
            const standardPerf = estimateRenderingPerformance(1000, 'standard');

            expect(virtualPerf.domNodes).toBeLessThan(standardPerf.domNodes);
            expect(virtualPerf.memoryUsage).toBe('Low');
            expect(virtualPerf.scrollPerformance).toBe('Excellent');

            expect(standardPerf.domNodes).toBe(1000);
            expect(standardPerf.memoryUsage).toBe('High');
            expect(standardPerf.scrollPerformance).toBe('Poor');
        });
    });

    describe('Performance Monitoring', () => {
        it('should track performance metrics', () => {
            performanceMonitor.recordQuery('testOperation', 100);
            performanceMonitor.recordQuery('testOperation', 150);
            performanceMonitor.recordQuery('testOperation', 200);

            const metrics = performanceMonitor.getMetrics();

            expect(metrics.testOperation.count).toBe(3);
            expect(metrics.testOperation.avg).toBe(150);
            expect(metrics.testOperation.min).toBe(100);
            expect(metrics.testOperation.max).toBe(200);
        });

        it('should calculate percentiles correctly', () => {
            // Record 100 measurements
            for (let i = 1; i <= 100; i++) {
                performanceMonitor.recordQuery('percentileTest', i);
            }

            const metrics = performanceMonitor.getMetrics();

            expect(metrics.percentileTest.count).toBe(100);
            expect(metrics.percentileTest.p95).toBe(95); // 95th percentile should be 95
        });

        it('should provide cache statistics', () => {
            const stats = getCacheStats();

            expect(stats).toHaveProperty('queryCache');
            expect(stats).toHaveProperty('performanceMetrics');
            expect(stats.queryCache).toHaveProperty('size');
        });
    });

    describe('Data Preloading', () => {
        it('should preload data concurrently', async () => {
            const loaders = [
                () => Promise.resolve('data1'),
                () => Promise.resolve('data2'),
                () => Promise.resolve('data3'),
            ];

            const startTime = performance.now();
            const results = await preloadData(loaders, 3);
            const endTime = performance.now();

            expect(results).toEqual(['data1', 'data2', 'data3']);
            expect(endTime - startTime).toBeLessThan(100); // Should be concurrent, not sequential
        });

        it('should handle preload failures gracefully', async () => {
            const loaders = [
                () => Promise.resolve('data1'),
                () => Promise.reject(new Error('Failed')),
                () => Promise.resolve('data3'),
            ];

            const results = await preloadData(loaders, 3);

            expect(results).toEqual(['data1', 'data3']); // Should skip failed loader
        });

        it('should respect concurrency limits', async () => {
            let concurrentCount = 0;
            let maxConcurrent = 0;

            const loaders = Array.from({ length: 10 }, () => async () => {
                concurrentCount++;
                maxConcurrent = Math.max(maxConcurrent, concurrentCount);
                await new Promise(resolve => setTimeout(resolve, 50));
                concurrentCount--;
                return 'data';
            });

            await preloadData(loaders, 3);

            expect(maxConcurrent).toBeLessThanOrEqual(3);
        });
    });

    describe('Performance Benchmarks', () => {
        it('should meet bulk operation performance targets', async () => {
            const TARGET_TIME_PER_ITEM = 10; // 10ms per item max
            const ITEM_COUNT = 100;

            const mockCreate = jest.fn().mockResolvedValue(undefined);
            const { getRepository } = await import('@/aws/dynamodb/repository');
            (getRepository as jest.Mock).mockReturnValue({
                create: mockCreate
            });

            const items = Array.from({ length: ITEM_COUNT }, (_, i) => ({
                pk: `USER#123`,
                sk: `ITEM#${i}`,
                entityType: 'TestEntity' as any,
                data: { id: i, name: `Item ${i}` }
            }));

            const startTime = performance.now();
            const result = await optimizedBatchWrite(items, { batchSize: 25 });
            const endTime = performance.now();

            const timePerItem = (endTime - startTime) / ITEM_COUNT;

            expect(result.success).toBe(true);
            expect(timePerItem).toBeLessThan(TARGET_TIME_PER_ITEM);

            console.log(`✅ Bulk write performance: ${(endTime - startTime).toFixed(2)}ms for ${ITEM_COUNT} items (${timePerItem.toFixed(2)}ms per item)`);
        });

        it('should meet data aggregation performance targets', () => {
            const TARGET_TIME = 100; // 100ms max for aggregation
            const DATA_SIZE = 10000;

            const largeDataset = Array.from({ length: DATA_SIZE }, (_, i) => ({
                date: `2024-01-${String(i % 30 + 1).padStart(2, '0')}`,
                value: Math.random() * 100
            }));

            const startTime = performance.now();
            const aggregated = aggregateAnalyticsData(largeDataset, 100);
            const endTime = performance.now();

            expect(aggregated).toHaveLength(100);
            expect(endTime - startTime).toBeLessThan(TARGET_TIME);

            console.log(`✅ Data aggregation performance: ${(endTime - startTime).toFixed(2)}ms for ${DATA_SIZE} points`);
        });

        it('should meet virtual scrolling calculation performance', () => {
            const TARGET_TIME = 50; // 50ms max for strategy calculation
            const LARGE_ITEM_COUNT = 50000;

            const startTime = performance.now();
            const strategy = getOptimalListStrategy(LARGE_ITEM_COUNT, 80, 600);
            const endTime = performance.now();

            expect(strategy.strategy).toBe('virtual-scroll');
            expect(endTime - startTime).toBeLessThan(TARGET_TIME);

            console.log(`✅ List strategy calculation: ${(endTime - startTime).toFixed(2)}ms for ${LARGE_ITEM_COUNT} items`);
        });
    });
});