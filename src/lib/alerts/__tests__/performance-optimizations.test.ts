/**
 * Tests for alert performance optimizations
 */

import { alertCache } from '../cache';
import { queryOptimizer, resultMerger, performanceMonitor } from '../query-optimization';
import { createPaginationManager, paginationUtils } from '../pagination';
import type { Alert, AlertFilters, AlertQueryOptions } from '../types';

describe('Alert Performance Optimizations', () => {
    beforeEach(() => {
        alertCache.clear();
        performanceMonitor.reset();
    });

    describe('AlertCache', () => {
        it('should cache and retrieve alerts', () => {
            const userId = 'test-user';
            const mockResponse = {
                alerts: [],
                totalCount: 0,
                unreadCount: 0,
                hasMore: false,
            };

            // Cache should be empty initially
            expect(alertCache.get(userId)).toBeNull();

            // Set cache
            alertCache.set(userId, mockResponse);

            // Should retrieve from cache
            expect(alertCache.get(userId)).toEqual(mockResponse);
        });

        it('should handle cache expiration', async () => {
            const userId = 'test-user';
            const mockResponse = {
                alerts: [],
                totalCount: 0,
                unreadCount: 0,
                hasMore: false,
            };

            // Set cache with very short TTL
            alertCache.set(userId, mockResponse, {}, {}, 1); // 1ms TTL

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 10));

            // Should return null after expiration
            expect(alertCache.get(userId)).toBeNull();
        });

        it('should invalidate user cache', () => {
            const userId = 'test-user';
            const mockResponse = {
                alerts: [],
                totalCount: 0,
                unreadCount: 0,
                hasMore: false,
            };

            alertCache.set(userId, mockResponse);
            expect(alertCache.get(userId)).toEqual(mockResponse);

            alertCache.invalidateUser(userId);
            expect(alertCache.get(userId)).toBeNull();
        });

        it('should cache unread count', () => {
            const userId = 'test-user';
            const count = 5;

            expect(alertCache.getUnreadCount(userId)).toBeNull();

            alertCache.setUnreadCount(userId, count);
            expect(alertCache.getUnreadCount(userId)).toBe(count);
        });
    });

    describe('QueryOptimizer', () => {
        it('should optimize single type queries', () => {
            const userId = 'test-user';
            const filters: AlertFilters = {
                types: ['life-event-lead'],
            };

            const optimized = queryOptimizer.optimizeQuery(userId, filters);

            expect(optimized.strategy).toBe('gsi1_type');
            expect(optimized.queries).toHaveLength(1);
            expect(optimized.queries[0].indexName).toBe('GSI1');
        });

        it('should optimize multiple type queries with parallel strategy', () => {
            const userId = 'test-user';
            const filters: AlertFilters = {
                types: ['life-event-lead', 'competitor-new-listing'],
            };

            const optimized = queryOptimizer.optimizeQuery(userId, filters);

            expect(optimized.strategy).toBe('parallel_queries');
            expect(optimized.queries).toHaveLength(2);
        });

        it('should fall back to main table for complex queries', () => {
            const userId = 'test-user';
            const filters: AlertFilters = {
                searchQuery: 'test search',
                status: ['unread'],
                priority: ['high'],
            };

            const optimized = queryOptimizer.optimizeQuery(userId, filters);

            expect(optimized.strategy).toBe('main_table');
            expect(optimized.queries).toHaveLength(1);
        });

        it('should estimate query performance', () => {
            const filters: AlertFilters = {
                types: ['life-event-lead'],
            };

            const performance = queryOptimizer.estimateQueryPerformance(filters, {});

            expect(performance.selectivity).toBeLessThan(1);
            expect(performance.indexUtilization).toBeGreaterThan(0);
            expect(performance.recommendedStrategy).toBe('gsi1_type');
        });
    });

    describe('ResultMerger', () => {
        it('should merge and sort results', () => {
            const results = [
                [
                    { id: '1', createdAt: '2023-01-01T00:00:00Z' } as Alert,
                    { id: '2', createdAt: '2023-01-02T00:00:00Z' } as Alert,
                ],
                [
                    { id: '3', createdAt: '2023-01-03T00:00:00Z' } as Alert,
                ],
            ];

            const merged = resultMerger.mergeAndSort(results, 'desc');

            expect(merged).toHaveLength(3);
            expect(merged[0].id).toBe('3'); // Most recent first
            expect(merged[1].id).toBe('2');
            expect(merged[2].id).toBe('1');
        });

        it('should deduplicate results', () => {
            const results = [
                { id: '1', createdAt: '2023-01-01T00:00:00Z' } as Alert,
                { id: '2', createdAt: '2023-01-02T00:00:00Z' } as Alert,
                { id: '1', createdAt: '2023-01-01T00:00:00Z' } as Alert, // Duplicate
            ];

            const deduplicated = resultMerger.deduplicate(results);

            expect(deduplicated).toHaveLength(2);
            expect(deduplicated.map(r => r.id)).toEqual(['1', '2']);
        });
    });

    describe('PerformanceMonitor', () => {
        it('should record query metrics', () => {
            performanceMonitor.recordQuery('gsi1_type', 50, true);
            performanceMonitor.recordQuery('gsi1_type', 75, true);
            performanceMonitor.recordQuery('main_table', 150, false);

            const metrics = performanceMonitor.getMetrics();

            expect(metrics.gsi1_type).toBeDefined();
            expect(metrics.gsi1_type.count).toBe(2);
            expect(metrics.gsi1_type.avgLatency).toBe(62.5);
            expect(metrics.gsi1_type.errorRate).toBe(0);

            expect(metrics.main_table).toBeDefined();
            expect(metrics.main_table.count).toBe(1);
            expect(metrics.main_table.errorRate).toBe(1);
        });

        it('should reset metrics', () => {
            performanceMonitor.recordQuery('test', 100);
            expect(Object.keys(performanceMonitor.getMetrics())).toHaveLength(1);

            performanceMonitor.reset();
            expect(Object.keys(performanceMonitor.getMetrics())).toHaveLength(0);
        });
    });

    describe('PaginationManager', () => {
        it('should manage pagination state', () => {
            const manager = createPaginationManager({ pageSize: 10 });

            const state = manager.getPaginationState(1);

            expect(state.currentPage).toBe(1);
            expect(state.pageSize).toBe(10);
            expect(state.hasPreviousPage).toBe(false);
        });

        it('should cache page data', () => {
            const manager = createPaginationManager();
            const alerts: Alert[] = [
                { id: '1', createdAt: '2023-01-01T00:00:00Z' } as Alert,
            ];

            expect(manager.getPageData(1)).toBeNull();

            manager.setPageData(1, alerts, undefined, 1);
            expect(manager.getPageData(1)).toEqual(alerts);
        });

        it('should calculate preload pages', () => {
            const manager = createPaginationManager({ preloadPages: 2 });
            manager.setPageData(1, [], undefined, 100); // Set total count

            const preloadPages = manager.getPreloadPages(3);

            // Should include pages that aren't already cached
            expect(preloadPages).toContain(2); // Previous pages
            expect(preloadPages).toContain(4); // Next pages
            expect(preloadPages).toContain(5);
        });
    });

    describe('PaginationUtils', () => {
        it('should calculate offset pagination', () => {
            const { offset, limit } = paginationUtils.getOffsetPagination(3, 20);

            expect(offset).toBe(40); // (3-1) * 20
            expect(limit).toBe(20);
        });

        it('should calculate total pages', () => {
            expect(paginationUtils.getTotalPages(100, 20)).toBe(5);
            expect(paginationUtils.getTotalPages(101, 20)).toBe(6);
            expect(paginationUtils.getTotalPages(0, 20)).toBe(0);
        });

        it('should generate page numbers', () => {
            const pageNumbers = paginationUtils.getPageNumbers(5, 10, 5);

            expect(pageNumbers).toHaveLength(5);
            expect(pageNumbers).toContain(5); // Current page
            expect(pageNumbers[0]).toBeGreaterThanOrEqual(1);
            expect(pageNumbers[pageNumbers.length - 1]).toBeLessThanOrEqual(10);
        });

        it('should debounce pagination requests', async () => {
            let callCount = 0;
            const mockFn = async () => {
                callCount++;
                return 'result';
            };

            const debouncedFn = paginationUtils.debouncePagination(mockFn, 10);

            // Make multiple rapid calls
            debouncedFn();
            debouncedFn();
            const finalPromise = debouncedFn();

            // Wait for debounce and execution
            const result = await finalPromise;

            // Should only call the function once due to debouncing
            expect(callCount).toBe(1);
            expect(result).toBe('result');
        }, 5000);
    });
});