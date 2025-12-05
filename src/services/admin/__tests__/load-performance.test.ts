/**
 * Load Testing and Performance Validation
 * 
 * These tests verify the admin platform can handle production-scale data
 * and concurrent operations while meeting performance targets.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { AnalyticsService } from '../analytics-service';
import { UserActivityService } from '../user-activity-service';
import { ContentModerationService } from '../content-moderation-service';
import { SupportTicketService } from '../support-ticket-service';
import { PlatformConfigService } from '../platform-config-service';
import { BulkOperationsService } from '../bulk-operations-service';
import { CacheService } from '../cache-service';
import { getRepository } from '@/aws/dynamodb/repository';

describe('Load Testing and Performance Validation', () => {
    let analyticsService: AnalyticsService;
    let userActivityService: UserActivityService;
    let contentModerationService: ContentModerationService;
    let supportTicketService: SupportTicketService;
    let platformConfigService: PlatformConfigService;
    let bulkOperationsService: BulkOperationsService;
    let cacheService: CacheService;

    const PERFORMANCE_TARGETS = {
        analyticsDashboard: 2000, // 2 seconds
        userActivityPage: 1000, // 1 second
        supportTicketList: 1000, // 1 second
        systemHealthDashboard: 500, // 500ms
        featureFlagUpdate: 500, // 500ms
    };

    beforeAll(async () => {
        analyticsService = new AnalyticsService();
        userActivityService = new UserActivityService();
        contentModerationService = new ContentModerationService();
        supportTicketService = new SupportTicketService();
        platformConfigService = new PlatformConfigService();
        bulkOperationsService = new BulkOperationsService();
        cacheService = new CacheService();

        // Seed large dataset for testing
        await seedLargeDataset();
    });

    afterAll(async () => {
        // Clean up test data
        await cleanupLargeDataset();
    });

    async function seedLargeDataset() {
        console.log('Seeding large dataset for load testing...');
        const repository = getRepository();
        const batchSize = 25; // DynamoDB batch write limit

        // Create 1000 test users
        const userBatches = [];
        for (let i = 0; i < 1000; i++) {
            userBatches.push({
                PK: `USER#load-test-user-${i}`,
                SK: 'PROFILE',
                EntityType: 'UserProfile',
                Data: {
                    userId: `load-test-user-${i}`,
                    email: `user${i}@loadtest.com`,
                    name: `Load Test User ${i}`,
                    role: 'user',
                    createdAt: Date.now() - Math.random() * 86400000 * 90, // Random date within 90 days
                    lastLogin: Date.now() - Math.random() * 86400000 * 30, // Random date within 30 days
                },
            });
        }

        // Write users in batches
        for (let i = 0; i < userBatches.length; i += batchSize) {
            const batch = userBatches.slice(i, i + batchSize);
            await Promise.all(batch.map(user => repository.put(user)));
        }

        // Create 10,000 analytics events
        const today = new Date();
        const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        const eventBatches = [];
        for (let i = 0; i < 10000; i++) {
            const userId = `load-test-user-${Math.floor(Math.random() * 1000)}`;
            eventBatches.push({
                PK: `ANALYTICS#${dateKey}`,
                SK: `EVENT#${Date.now() - Math.random() * 86400000}#event-${i}`,
                EntityType: 'AnalyticsEvent',
                Data: {
                    eventId: `event-${i}`,
                    userId,
                    eventType: ['page_view', 'feature_use', 'content_create', 'ai_request'][Math.floor(Math.random() * 4)],
                    eventData: { test: true },
                    sessionId: `session-${Math.floor(Math.random() * 100)}`,
                    metadata: {
                        userAgent: 'Mozilla/5.0',
                        ipAddress: '127.0.0.1',
                        platform: 'web',
                    },
                },
                GSI1PK: `USER#${userId}`,
                GSI1SK: `EVENT#${Date.now() - Math.random() * 86400000}`,
                TTL: Math.floor(Date.now() / 1000) + 86400 * 90, // 90 days
            });
        }

        // Write events in batches
        for (let i = 0; i < eventBatches.length; i += batchSize) {
            const batch = eventBatches.slice(i, i + batchSize);
            await Promise.all(batch.map(event => repository.put(event)));
        }

        // Create 500 support tickets
        const ticketBatches = [];
        for (let i = 0; i < 500; i++) {
            const userId = `load-test-user-${Math.floor(Math.random() * 1000)}`;
            const ticketId = `load-test-ticket-${i}`;
            const status = ['open', 'in_progress', 'waiting_user', 'resolved', 'closed'][Math.floor(Math.random() * 5)];
            const priority = ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)];

            ticketBatches.push({
                PK: `TICKET#${ticketId}`,
                SK: 'METADATA',
                EntityType: 'SupportTicket',
                Data: {
                    ticketId,
                    userId,
                    userName: `Load Test User ${userId.split('-').pop()}`,
                    userEmail: `user${userId.split('-').pop()}@loadtest.com`,
                    subject: `Load Test Ticket ${i}`,
                    description: 'This is a load test ticket',
                    category: 'help',
                    priority,
                    status,
                    createdAt: Date.now() - Math.random() * 86400000 * 30,
                    updatedAt: Date.now() - Math.random() * 86400000 * 7,
                },
                GSI1PK: `TICKETS#${status}`,
                GSI1SK: `${priority}#${Date.now() - Math.random() * 86400000 * 30}`,
            });
        }

        // Write tickets in batches
        for (let i = 0; i < ticketBatches.length; i += batchSize) {
            const batch = ticketBatches.slice(i, i + batchSize);
            await Promise.all(batch.map(ticket => repository.put(ticket)));
        }

        console.log('Large dataset seeded successfully');
    }

    async function cleanupLargeDataset() {
        console.log('Cleaning up large dataset...');
        const repository = getRepository();

        // Delete test users
        for (let i = 0; i < 1000; i++) {
            await repository.delete(`USER#load-test-user-${i}`, 'PROFILE');
        }

        // Delete test tickets
        for (let i = 0; i < 500; i++) {
            await repository.delete(`TICKET#load-test-ticket-${i}`, 'METADATA');
        }

        // Note: Analytics events will be cleaned up by TTL
        console.log('Large dataset cleaned up');
    }

    describe('Analytics Query Performance', () => {
        it('should query analytics with 10,000+ events within performance target', async () => {
            const startTime = Date.now();

            const startDate = new Date(Date.now() - 86400000); // 24 hours ago
            const endDate = new Date();

            const metrics = await analyticsService.getPlatformMetrics(startDate, endDate);

            const duration = Date.now() - startTime;

            expect(metrics).toBeDefined();
            expect(duration).toBeLessThan(PERFORMANCE_TARGETS.analyticsDashboard);

            console.log(`Analytics query completed in ${duration}ms (target: ${PERFORMANCE_TARGETS.analyticsDashboard}ms)`);
        });

        it('should handle concurrent analytics queries efficiently', async () => {
            const startTime = Date.now();

            const queries = Array(10).fill(null).map(() =>
                analyticsService.getPlatformMetrics(
                    new Date(Date.now() - 86400000),
                    new Date()
                )
            );

            const results = await Promise.all(queries);

            const duration = Date.now() - startTime;
            const avgDuration = duration / 10;

            expect(results).toHaveLength(10);
            results.forEach(result => expect(result).toBeDefined());
            expect(avgDuration).toBeLessThan(PERFORMANCE_TARGETS.analyticsDashboard);

            console.log(`10 concurrent analytics queries completed in ${duration}ms (avg: ${avgDuration}ms per query)`);
        });

        it('should use caching to improve repeated query performance', async () => {
            const startDate = new Date(Date.now() - 86400000);
            const endDate = new Date();

            // First query (cache miss)
            const firstQueryStart = Date.now();
            await analyticsService.getPlatformMetrics(startDate, endDate);
            const firstQueryDuration = Date.now() - firstQueryStart;

            // Second query (cache hit)
            const secondQueryStart = Date.now();
            await analyticsService.getPlatformMetrics(startDate, endDate);
            const secondQueryDuration = Date.now() - secondQueryStart;

            // Cached query should be significantly faster
            expect(secondQueryDuration).toBeLessThan(firstQueryDuration);
            expect(secondQueryDuration).toBeLessThan(100); // Should be very fast from cache

            console.log(`First query: ${firstQueryDuration}ms, Cached query: ${secondQueryDuration}ms`);
        });
    });

    describe('User Activity Performance', () => {
        it('should load 1000+ users within performance target', async () => {
            const startTime = Date.now();

            const activity = await userActivityService.getAllUserActivity({
                limit: 100,
            });

            const duration = Date.now() - startTime;

            expect(activity.users).toBeDefined();
            expect(activity.users.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(PERFORMANCE_TARGETS.userActivityPage);

            console.log(`User activity query completed in ${duration}ms (target: ${PERFORMANCE_TARGETS.userActivityPage}ms)`);
        });

        it('should handle pagination efficiently for large user lists', async () => {
            const startTime = Date.now();

            let allUsers = [];
            let lastKey: string | undefined;
            let pageCount = 0;

            // Fetch first 5 pages
            while (pageCount < 5) {
                const result = await userActivityService.getAllUserActivity({
                    limit: 50,
                    lastKey,
                });

                allUsers = allUsers.concat(result.users);
                lastKey = result.lastKey;
                pageCount++;

                if (!lastKey) break;
            }

            const duration = Date.now() - startTime;
            const avgPageDuration = duration / pageCount;

            expect(allUsers.length).toBeGreaterThan(0);
            expect(avgPageDuration).toBeLessThan(PERFORMANCE_TARGETS.userActivityPage);

            console.log(`Paginated ${pageCount} pages (${allUsers.length} users) in ${duration}ms (avg: ${avgPageDuration}ms per page)`);
        });

        it('should filter users by activity level efficiently', async () => {
            const startTime = Date.now();

            const [active, inactive, dormant] = await Promise.all([
                userActivityService.getAllUserActivity({ activityLevel: 'active', limit: 100 }),
                userActivityService.getAllUserActivity({ activityLevel: 'inactive', limit: 100 }),
                userActivityService.getAllUserActivity({ activityLevel: 'dormant', limit: 100 }),
            ]);

            const duration = Date.now() - startTime;

            expect(active.users).toBeDefined();
            expect(inactive.users).toBeDefined();
            expect(dormant.users).toBeDefined();
            expect(duration).toBeLessThan(PERFORMANCE_TARGETS.userActivityPage * 3);

            console.log(`Activity level filtering completed in ${duration}ms`);
        });
    });

    describe('Support Ticket Performance', () => {
        it('should load 500+ tickets within performance target', async () => {
            const startTime = Date.now();

            const tickets = await supportTicketService.getTickets({
                limit: 50,
            });

            const duration = Date.now() - startTime;

            expect(tickets.tickets).toBeDefined();
            expect(tickets.tickets.length).toBeGreaterThan(0);
            expect(duration).toBeLessThan(PERFORMANCE_TARGETS.supportTicketList);

            console.log(`Support ticket query completed in ${duration}ms (target: ${PERFORMANCE_TARGETS.supportTicketList}ms)`);
        });

        it('should filter tickets by status and priority efficiently', async () => {
            const startTime = Date.now();

            const [openTickets, highPriority] = await Promise.all([
                supportTicketService.getTickets({ status: 'open', limit: 50 }),
                supportTicketService.getTickets({ priority: 'high', limit: 50 }),
            ]);

            const duration = Date.now() - startTime;

            expect(openTickets.tickets).toBeDefined();
            expect(highPriority.tickets).toBeDefined();
            expect(duration).toBeLessThan(PERFORMANCE_TARGETS.supportTicketList * 2);

            console.log(`Ticket filtering completed in ${duration}ms`);
        });
    });

    describe('Bulk Operations Performance', () => {
        it('should handle bulk operations on 100+ users efficiently', async () => {
            const userIds = Array(100).fill(null).map((_, i) => `load-test-user-${i}`);

            const startTime = Date.now();

            // Simulate bulk export
            const result = await bulkOperationsService.exportBulkUserData(
                userIds,
                ['email', 'name', 'lastLogin', 'totalSessions']
            );

            const duration = Date.now() - startTime;

            expect(result).toBeDefined();
            expect(duration).toBeLessThan(5000); // 5 seconds for 100 users

            console.log(`Bulk export of 100 users completed in ${duration}ms`);
        });

        it('should process bulk operations in batches', async () => {
            const userIds = Array(250).fill(null).map((_, i) => `load-test-user-${i}`);

            const startTime = Date.now();

            // Bulk operations should process in batches
            const result = await bulkOperationsService.exportBulkUserData(
                userIds,
                ['email', 'name']
            );

            const duration = Date.now() - startTime;

            expect(result).toBeDefined();
            expect(duration).toBeLessThan(10000); // 10 seconds for 250 users

            console.log(`Bulk export of 250 users completed in ${duration}ms`);
        });
    });

    describe('Feature Flag Performance', () => {
        it('should update feature flags within performance target', async () => {
            const flagId = 'perf-test-flag';

            const startTime = Date.now();

            await platformConfigService.setFeatureFlag(
                flagId,
                {
                    name: 'Performance Test Flag',
                    description: 'Testing feature flag performance',
                    enabled: true,
                    rolloutPercentage: 50,
                },
                'test-admin'
            );

            const duration = Date.now() - startTime;

            expect(duration).toBeLessThan(PERFORMANCE_TARGETS.featureFlagUpdate);

            console.log(`Feature flag update completed in ${duration}ms (target: ${PERFORMANCE_TARGETS.featureFlagUpdate}ms)`);

            // Clean up
            const repository = getRepository();
            await repository.delete('CONFIG#FEATURE_FLAGS', `FLAG#${flagId}`);
        });

        it('should check feature flags for many users efficiently', async () => {
            const flagId = 'perf-test-flag-2';

            await platformConfigService.setFeatureFlag(
                flagId,
                {
                    name: 'Performance Test Flag 2',
                    description: 'Testing feature flag checks',
                    enabled: true,
                    rolloutPercentage: 50,
                },
                'test-admin'
            );

            const startTime = Date.now();

            // Check feature flag for 100 users
            const checks = Array(100).fill(null).map((_, i) =>
                platformConfigService.isFeatureEnabled(flagId, `load-test-user-${i}`)
            );

            const results = await Promise.all(checks);

            const duration = Date.now() - startTime;
            const avgDuration = duration / 100;

            expect(results).toHaveLength(100);
            expect(avgDuration).toBeLessThan(10); // Less than 10ms per check

            console.log(`100 feature flag checks completed in ${duration}ms (avg: ${avgDuration}ms per check)`);

            // Clean up
            const repository = getRepository();
            await repository.delete('CONFIG#FEATURE_FLAGS', `FLAG#${flagId}`);
        });
    });

    describe('Concurrent Operations Performance', () => {
        it('should handle multiple concurrent admin operations', async () => {
            const startTime = Date.now();

            // Simulate multiple admins performing different operations simultaneously
            const operations = [
                analyticsService.getPlatformMetrics(new Date(Date.now() - 86400000), new Date()),
                userActivityService.getAllUserActivity({ limit: 50 }),
                supportTicketService.getTickets({ limit: 50 }),
                contentModerationService.getContentForModeration({ limit: 50 }),
                platformConfigService.getFeatureFlags(),
            ];

            const results = await Promise.all(operations);

            const duration = Date.now() - startTime;

            expect(results).toHaveLength(5);
            results.forEach(result => expect(result).toBeDefined());
            expect(duration).toBeLessThan(3000); // All operations should complete within 3 seconds

            console.log(`5 concurrent operations completed in ${duration}ms`);
        });

        it('should handle high-frequency concurrent queries', async () => {
            const startTime = Date.now();

            // Simulate 50 concurrent queries
            const queries = Array(50).fill(null).map(() =>
                userActivityService.getAllUserActivity({ limit: 10 })
            );

            const results = await Promise.all(queries);

            const duration = Date.now() - startTime;
            const avgDuration = duration / 50;

            expect(results).toHaveLength(50);
            results.forEach(result => expect(result).toBeDefined());
            expect(avgDuration).toBeLessThan(200); // Average less than 200ms per query

            console.log(`50 concurrent queries completed in ${duration}ms (avg: ${avgDuration}ms per query)`);
        });
    });

    describe('Database Query Performance', () => {
        it('should use GSI for efficient filtering', async () => {
            // Query using GSI should be fast
            const startTime = Date.now();

            const tickets = await supportTicketService.getTickets({
                status: 'open',
                limit: 50,
            });

            const duration = Date.now() - startTime;

            expect(tickets.tickets).toBeDefined();
            expect(duration).toBeLessThan(500); // GSI queries should be very fast

            console.log(`GSI query completed in ${duration}ms`);
        });

        it('should handle pagination efficiently with large result sets', async () => {
            const startTime = Date.now();

            let pageCount = 0;
            let lastKey: string | undefined;

            // Fetch 10 pages
            while (pageCount < 10) {
                const result = await userActivityService.getAllUserActivity({
                    limit: 20,
                    lastKey,
                });

                lastKey = result.lastKey;
                pageCount++;

                if (!lastKey) break;
            }

            const duration = Date.now() - startTime;
            const avgPageDuration = duration / pageCount;

            expect(avgPageDuration).toBeLessThan(200); // Each page should load quickly

            console.log(`${pageCount} pages loaded in ${duration}ms (avg: ${avgPageDuration}ms per page)`);
        });
    });

    describe('Cache Effectiveness', () => {
        it('should demonstrate cache hit rate improvement', async () => {
            const cacheKey = 'test-metrics';

            // Clear cache
            await cacheService.invalidate(cacheKey);

            // First query (cache miss)
            const missStart = Date.now();
            await cacheService.get(cacheKey, async () => {
                return analyticsService.getPlatformMetrics(
                    new Date(Date.now() - 86400000),
                    new Date()
                );
            }, 300); // 5 minute TTL
            const missDuration = Date.now() - missStart;

            // Second query (cache hit)
            const hitStart = Date.now();
            await cacheService.get(cacheKey, async () => {
                return analyticsService.getPlatformMetrics(
                    new Date(Date.now() - 86400000),
                    new Date()
                );
            }, 300);
            const hitDuration = Date.now() - hitStart;

            // Cache hit should be at least 10x faster
            expect(hitDuration).toBeLessThan(missDuration / 10);

            console.log(`Cache miss: ${missDuration}ms, Cache hit: ${hitDuration}ms (${Math.round(missDuration / hitDuration)}x faster)`);
        });

        it('should handle cache invalidation correctly', async () => {
            const cacheKey = 'test-invalidation';

            // Set cache
            await cacheService.set(cacheKey, { test: 'data' }, 300);

            // Verify cache exists
            const cached = await cacheService.get(cacheKey, async () => ({ test: 'new' }), 300);
            expect(cached).toEqual({ test: 'data' });

            // Invalidate cache
            await cacheService.invalidate(cacheKey);

            // Verify cache is cleared
            const afterInvalidation = await cacheService.get(cacheKey, async () => ({ test: 'new' }), 300);
            expect(afterInvalidation).toEqual({ test: 'new' });
        });
    });

    describe('Performance Summary', () => {
        it('should generate performance report', async () => {
            const report = {
                analyticsDashboard: {
                    target: PERFORMANCE_TARGETS.analyticsDashboard,
                    actual: 0,
                    status: 'PASS',
                },
                userActivityPage: {
                    target: PERFORMANCE_TARGETS.userActivityPage,
                    actual: 0,
                    status: 'PASS',
                },
                supportTicketList: {
                    target: PERFORMANCE_TARGETS.supportTicketList,
                    actual: 0,
                    status: 'PASS',
                },
                systemHealthDashboard: {
                    target: PERFORMANCE_TARGETS.systemHealthDashboard,
                    actual: 0,
                    status: 'PASS',
                },
                featureFlagUpdate: {
                    target: PERFORMANCE_TARGETS.featureFlagUpdate,
                    actual: 0,
                    status: 'PASS',
                },
            };

            // Test each endpoint
            let start = Date.now();
            await analyticsService.getPlatformMetrics(new Date(Date.now() - 86400000), new Date());
            report.analyticsDashboard.actual = Date.now() - start;
            report.analyticsDashboard.status = report.analyticsDashboard.actual < report.analyticsDashboard.target ? 'PASS' : 'FAIL';

            start = Date.now();
            await userActivityService.getAllUserActivity({ limit: 50 });
            report.userActivityPage.actual = Date.now() - start;
            report.userActivityPage.status = report.userActivityPage.actual < report.userActivityPage.target ? 'PASS' : 'FAIL';

            start = Date.now();
            await supportTicketService.getTickets({ limit: 50 });
            report.supportTicketList.actual = Date.now() - start;
            report.supportTicketList.status = report.supportTicketList.actual < report.supportTicketList.target ? 'PASS' : 'FAIL';

            console.log('\n=== Performance Test Report ===');
            console.log('Analytics Dashboard:', `${report.analyticsDashboard.actual}ms / ${report.analyticsDashboard.target}ms`, report.analyticsDashboard.status);
            console.log('User Activity Page:', `${report.userActivityPage.actual}ms / ${report.userActivityPage.target}ms`, report.userActivityPage.status);
            console.log('Support Ticket List:', `${report.supportTicketList.actual}ms / ${report.supportTicketList.target}ms`, report.supportTicketList.status);
            console.log('==============================\n');

            // All tests should pass
            expect(report.analyticsDashboard.status).toBe('PASS');
            expect(report.userActivityPage.status).toBe('PASS');
            expect(report.supportTicketList.status).toBe('PASS');
        });
    });
});
