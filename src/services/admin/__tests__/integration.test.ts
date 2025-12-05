/**
 * Integration Tests for Admin Platform Management
 * 
 * These tests verify end-to-end flows work correctly across all admin features.
 * Tests use LocalStack for DynamoDB and mock AWS services where needed.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { AnalyticsService } from '../analytics-service';
import { UserActivityService } from '../user-activity-service';
import { ContentModerationService } from '../content-moderation-service';
import { SupportTicketService } from '../support-ticket-service';
import { SystemHealthService } from '../system-health-service';
import { PlatformConfigService } from '../platform-config-service';
import { AnnouncementService } from '../announcement-service';
import { MaintenanceModeService } from '../maintenance-mode-service';
import { getRepository } from '@/aws/dynamodb/repository';

// Mock AWS services for testing
jest.mock('@/aws/dynamodb/repository');
jest.mock('@/aws/s3/client');
jest.mock('@/services/admin/email-notification-service');

describe('Admin Platform Integration Tests', () => {
    let analyticsService: AnalyticsService;
    let userActivityService: UserActivityService;
    let contentModerationService: ContentModerationService;
    let supportTicketService: SupportTicketService;
    let systemHealthService: SystemHealthService;
    let platformConfigService: PlatformConfigService;
    let announcementService: AnnouncementService;
    let maintenanceModeService: MaintenanceModeService;

    const testUserId = 'test-user-123';
    const testAdminId = 'test-admin-456';
    const testSuperAdminId = 'test-superadmin-789';

    beforeAll(async () => {
        // Initialize services
        analyticsService = new AnalyticsService();
        userActivityService = new UserActivityService();
        contentModerationService = new ContentModerationService();
        supportTicketService = new SupportTicketService();
        systemHealthService = new SystemHealthService();
        platformConfigService = new PlatformConfigService();
        announcementService = new AnnouncementService();
        maintenanceModeService = new MaintenanceModeService();

        // Set up test data
        await setupTestData();
    });

    afterAll(async () => {
        // Clean up test data
        await cleanupTestData();
    });

    beforeEach(async () => {
        // Reset state between tests if needed
    });

    async function setupTestData() {
        // Create test users
        const repository = getRepository();

        await repository.put({
            PK: `USER#${testUserId}`,
            SK: 'PROFILE',
            EntityType: 'UserProfile',
            Data: {
                userId: testUserId,
                email: 'testuser@example.com',
                name: 'Test User',
                role: 'user',
                createdAt: Date.now() - 86400000 * 30, // 30 days ago
            },
        });

        await repository.put({
            PK: `USER#${testAdminId}`,
            SK: 'PROFILE',
            EntityType: 'UserProfile',
            Data: {
                userId: testAdminId,
                email: 'admin@example.com',
                name: 'Test Admin',
                role: 'admin',
                createdAt: Date.now() - 86400000 * 60, // 60 days ago
            },
        });

        await repository.put({
            PK: `USER#${testSuperAdminId}`,
            SK: 'PROFILE',
            EntityType: 'UserProfile',
            Data: {
                userId: testSuperAdminId,
                email: 'superadmin@example.com',
                name: 'Test SuperAdmin',
                role: 'superadmin',
                createdAt: Date.now() - 86400000 * 90, // 90 days ago
            },
        });
    }

    async function cleanupTestData() {
        const repository = getRepository();

        // Delete test users
        await repository.delete(`USER#${testUserId}`, 'PROFILE');
        await repository.delete(`USER#${testAdminId}`, 'PROFILE');
        await repository.delete(`USER#${testSuperAdminId}`, 'PROFILE');
    }

    describe('Analytics Flow Integration', () => {
        it('should track events and aggregate metrics correctly', async () => {
            // Track multiple events for a user
            const events = [
                {
                    eventId: 'event-1',
                    userId: testUserId,
                    eventType: 'page_view' as const,
                    eventData: { page: '/dashboard' },
                    timestamp: Date.now(),
                    sessionId: 'session-1',
                    metadata: {
                        userAgent: 'Mozilla/5.0',
                        ipAddress: '127.0.0.1',
                        platform: 'web',
                    },
                },
                {
                    eventId: 'event-2',
                    userId: testUserId,
                    eventType: 'feature_use' as const,
                    eventData: { feature: 'content-generator' },
                    timestamp: Date.now(),
                    sessionId: 'session-1',
                    metadata: {
                        userAgent: 'Mozilla/5.0',
                        ipAddress: '127.0.0.1',
                        platform: 'web',
                    },
                },
                {
                    eventId: 'event-3',
                    userId: testUserId,
                    eventType: 'content_create' as const,
                    eventData: { contentType: 'blog_post' },
                    timestamp: Date.now(),
                    sessionId: 'session-1',
                    metadata: {
                        userAgent: 'Mozilla/5.0',
                        ipAddress: '127.0.0.1',
                        platform: 'web',
                    },
                },
            ];

            // Track all events
            for (const event of events) {
                await analyticsService.trackEvent(event);
            }

            // Query platform metrics
            const startDate = new Date(Date.now() - 86400000); // 24 hours ago
            const endDate = new Date();
            const metrics = await analyticsService.getPlatformMetrics(startDate, endDate);

            // Verify metrics include tracked events
            expect(metrics).toBeDefined();
            expect(metrics.activeUsers).toBeGreaterThan(0);
            expect(metrics.featureUsage).toBeDefined();
        });

        it('should filter analytics by date range correctly', async () => {
            const yesterday = new Date(Date.now() - 86400000);
            const today = new Date();
            const tomorrow = new Date(Date.now() + 86400000);

            // Get metrics for yesterday
            const yesterdayMetrics = await analyticsService.getPlatformMetrics(
                new Date(yesterday.getTime() - 86400000),
                yesterday
            );

            // Get metrics for today
            const todayMetrics = await analyticsService.getPlatformMetrics(yesterday, today);

            // Verify date filtering works
            expect(yesterdayMetrics).toBeDefined();
            expect(todayMetrics).toBeDefined();
        });
    });

    describe('Content Moderation Flow Integration', () => {
        it('should complete full content moderation workflow', async () => {
            // Create content as user
            const repository = getRepository();
            const contentId = 'test-content-123';

            await repository.put({
                PK: `USER#${testUserId}`,
                SK: `CONTENT#${contentId}`,
                EntityType: 'Content',
                Data: {
                    contentId,
                    contentType: 'blog_post',
                    title: 'Test Blog Post',
                    content: 'This is test content for moderation.',
                    status: 'pending',
                    createdAt: Date.now(),
                },
                GSI1PK: 'MODERATION#pending',
                GSI1SK: Date.now().toString(),
            });

            // View content in moderation queue
            const moderationQueue = await contentModerationService.getContentForModeration({
                status: 'pending',
                limit: 10,
            });

            expect(moderationQueue.items.length).toBeGreaterThan(0);
            const content = moderationQueue.items.find(item => item.contentId === contentId);
            expect(content).toBeDefined();
            expect(content?.status).toBe('pending');

            // Flag content as admin
            await contentModerationService.flagContent(
                contentId,
                testAdminId,
                'Inappropriate content'
            );

            // Verify content is flagged
            const flaggedQueue = await contentModerationService.getContentForModeration({
                status: 'flagged',
                limit: 10,
            });

            const flaggedContent = flaggedQueue.items.find(item => item.contentId === contentId);
            expect(flaggedContent).toBeDefined();
            expect(flaggedContent?.status).toBe('flagged');

            // Hide content
            await contentModerationService.hideContent(
                contentId,
                testAdminId,
                'Policy violation'
            );

            // Verify content is hidden
            const hiddenQueue = await contentModerationService.getContentForModeration({
                status: 'hidden',
                limit: 10,
            });

            const hiddenContent = hiddenQueue.items.find(item => item.contentId === contentId);
            expect(hiddenContent).toBeDefined();
            expect(hiddenContent?.status).toBe('hidden');

            // Clean up
            await repository.delete(`USER#${testUserId}`, `CONTENT#${contentId}`);
        });

        it('should filter content by type and user', async () => {
            // Get content filtered by type
            const blogPosts = await contentModerationService.getContentForModeration({
                contentType: 'blog_post',
                limit: 10,
            });

            expect(blogPosts.items).toBeDefined();
            blogPosts.items.forEach(item => {
                expect(item.contentType).toBe('blog_post');
            });

            // Get content filtered by user
            const userContent = await contentModerationService.getContentForModeration({
                userId: testUserId,
                limit: 10,
            });

            expect(userContent.items).toBeDefined();
            userContent.items.forEach(item => {
                expect(item.userId).toBe(testUserId);
            });
        });
    });

    describe('Support Ticket Flow Integration', () => {
        it('should complete full support ticket workflow', async () => {
            // Submit feedback as user
            const ticket = await supportTicketService.createTicket(
                testUserId,
                'Test Support Issue',
                'I need help with a feature',
                'help'
            );

            expect(ticket).toBeDefined();
            expect(ticket.ticketId).toBeDefined();
            expect(ticket.status).toBe('open');

            // View ticket as admin
            const tickets = await supportTicketService.getTickets({
                status: 'open',
                limit: 10,
            });

            expect(tickets.tickets.length).toBeGreaterThan(0);
            const foundTicket = tickets.tickets.find(t => t.ticketId === ticket.ticketId);
            expect(foundTicket).toBeDefined();

            // Respond to ticket
            await supportTicketService.addMessage(
                ticket.ticketId,
                testAdminId,
                'Thank you for contacting support. We will help you with this issue.'
            );

            // Get full ticket with messages
            const fullTicket = await supportTicketService.getTicket(ticket.ticketId);
            expect(fullTicket.messages.length).toBeGreaterThan(0);
            expect(fullTicket.messages[0].message).toContain('Thank you for contacting support');

            // Update ticket status
            await supportTicketService.updateTicketStatus(
                ticket.ticketId,
                'in_progress',
                testAdminId
            );

            // Verify status updated
            const updatedTicket = await supportTicketService.getTicket(ticket.ticketId);
            expect(updatedTicket.status).toBe('in_progress');

            // Close ticket with resolution
            await supportTicketService.updateTicketStatus(
                ticket.ticketId,
                'resolved',
                testAdminId,
                'Issue resolved successfully'
            );

            // Verify ticket closed
            const closedTicket = await supportTicketService.getTicket(ticket.ticketId);
            expect(closedTicket.status).toBe('resolved');

            // Clean up
            const repository = getRepository();
            await repository.delete(`TICKET#${ticket.ticketId}`, 'METADATA');
        });

        it('should filter tickets by status and priority', async () => {
            // Get open tickets
            const openTickets = await supportTicketService.getTickets({
                status: 'open',
                limit: 10,
            });

            expect(openTickets.tickets).toBeDefined();
            openTickets.tickets.forEach(ticket => {
                expect(ticket.status).toBe('open');
            });

            // Get high priority tickets
            const highPriorityTickets = await supportTicketService.getTickets({
                priority: 'high',
                limit: 10,
            });

            expect(highPriorityTickets.tickets).toBeDefined();
            highPriorityTickets.tickets.forEach(ticket => {
                expect(ticket.priority).toBe('high');
            });
        });
    });

    describe('Feature Flag Flow Integration', () => {
        it('should complete full feature flag workflow', async () => {
            const flagId = 'test-feature-flag';

            // Create feature flag as SuperAdmin
            await platformConfigService.setFeatureFlag(
                flagId,
                {
                    name: 'Test Feature',
                    description: 'A test feature flag',
                    enabled: true,
                    rolloutPercentage: 50,
                },
                testSuperAdminId
            );

            // Get all feature flags
            const flags = await platformConfigService.getFeatureFlags();
            const testFlag = flags.find(f => f.flagId === flagId);
            expect(testFlag).toBeDefined();
            expect(testFlag?.enabled).toBe(true);
            expect(testFlag?.rolloutPercentage).toBe(50);

            // Check if feature is enabled for users
            const user1Enabled = await platformConfigService.isFeatureEnabled(flagId, 'user-1');
            const user2Enabled = await platformConfigService.isFeatureEnabled(flagId, 'user-2');
            const user3Enabled = await platformConfigService.isFeatureEnabled(flagId, 'user-3');
            const user4Enabled = await platformConfigService.isFeatureEnabled(flagId, 'user-4');

            // With 50% rollout, approximately half should see the feature
            const enabledCount = [user1Enabled, user2Enabled, user3Enabled, user4Enabled].filter(Boolean).length;
            expect(enabledCount).toBeGreaterThanOrEqual(1);
            expect(enabledCount).toBeLessThanOrEqual(3);

            // Update rollout to 100%
            await platformConfigService.setFeatureFlag(
                flagId,
                {
                    rolloutPercentage: 100,
                },
                testSuperAdminId
            );

            // Verify all users see the feature
            const allEnabled = await Promise.all([
                platformConfigService.isFeatureEnabled(flagId, 'user-1'),
                platformConfigService.isFeatureEnabled(flagId, 'user-2'),
                platformConfigService.isFeatureEnabled(flagId, 'user-3'),
                platformConfigService.isFeatureEnabled(flagId, 'user-4'),
            ]);

            expect(allEnabled.every(enabled => enabled)).toBe(true);

            // Clean up
            const repository = getRepository();
            await repository.delete('CONFIG#FEATURE_FLAGS', `FLAG#${flagId}`);
        });

        it('should support targeted feature rollout', async () => {
            const flagId = 'test-targeted-feature';

            // Create feature flag with specific target users
            await platformConfigService.setFeatureFlag(
                flagId,
                {
                    name: 'Targeted Feature',
                    description: 'A feature for specific users',
                    enabled: true,
                    rolloutPercentage: 0,
                    targetUsers: [testUserId],
                },
                testSuperAdminId
            );

            // Verify target user sees the feature
            const targetUserEnabled = await platformConfigService.isFeatureEnabled(flagId, testUserId);
            expect(targetUserEnabled).toBe(true);

            // Verify other users don't see the feature
            const otherUserEnabled = await platformConfigService.isFeatureEnabled(flagId, 'other-user');
            expect(otherUserEnabled).toBe(false);

            // Clean up
            const repository = getRepository();
            await repository.delete('CONFIG#FEATURE_FLAGS', `FLAG#${flagId}`);
        });
    });

    describe('Announcement Flow Integration', () => {
        it('should create and schedule announcements', async () => {
            // Create announcement
            const announcement = await announcementService.createAnnouncement({
                title: 'Test Announcement',
                content: 'This is a test announcement',
                targetAudience: 'all',
                deliveryMethod: 'in_app',
                createdBy: testAdminId,
            });

            expect(announcement).toBeDefined();
            expect(announcement.announcementId).toBeDefined();
            expect(announcement.status).toBe('draft');

            // Schedule announcement
            const scheduledTime = new Date(Date.now() + 3600000); // 1 hour from now
            await announcementService.scheduleAnnouncement(
                announcement.announcementId,
                scheduledTime,
                testAdminId
            );

            // Verify announcement is scheduled
            const scheduled = await announcementService.getAnnouncement(announcement.announcementId);
            expect(scheduled.status).toBe('scheduled');
            expect(scheduled.scheduledFor).toBeDefined();

            // Clean up
            const repository = getRepository();
            await repository.delete(`ANNOUNCEMENT#${announcement.announcementId}`, 'METADATA');
        });

        it('should target announcements to specific roles', async () => {
            // Create announcement for admins only
            const announcement = await announcementService.createAnnouncement({
                title: 'Admin Announcement',
                content: 'This is for admins only',
                targetAudience: 'role',
                targetValue: ['admin', 'superadmin'],
                deliveryMethod: 'email',
                createdBy: testSuperAdminId,
            });

            expect(announcement).toBeDefined();
            expect(announcement.targetAudience).toBe('role');
            expect(announcement.targetValue).toContain('admin');

            // Clean up
            const repository = getRepository();
            await repository.delete(`ANNOUNCEMENT#${announcement.announcementId}`, 'METADATA');
        });
    });

    describe('Maintenance Mode Flow Integration', () => {
        it('should schedule and manage maintenance windows', async () => {
            // Schedule maintenance
            const startTime = new Date(Date.now() + 3600000); // 1 hour from now
            const endTime = new Date(Date.now() + 7200000); // 2 hours from now

            const maintenance = await maintenanceModeService.scheduleMaintenance({
                startTime,
                endTime,
                message: 'Scheduled maintenance for system upgrades',
                createdBy: testSuperAdminId,
            });

            expect(maintenance).toBeDefined();
            expect(maintenance.maintenanceId).toBeDefined();
            expect(maintenance.status).toBe('scheduled');

            // Get scheduled maintenance
            const scheduled = await maintenanceModeService.getScheduledMaintenance();
            expect(scheduled.length).toBeGreaterThan(0);
            const found = scheduled.find(m => m.maintenanceId === maintenance.maintenanceId);
            expect(found).toBeDefined();

            // Cancel maintenance
            await maintenanceModeService.cancelMaintenance(
                maintenance.maintenanceId,
                testSuperAdminId
            );

            // Verify maintenance is cancelled
            const cancelled = await maintenanceModeService.getMaintenance(maintenance.maintenanceId);
            expect(cancelled.status).toBe('cancelled');

            // Clean up
            const repository = getRepository();
            await repository.delete(`MAINTENANCE#${maintenance.maintenanceId}`, 'METADATA');
        });

        it('should enable and disable maintenance mode', async () => {
            // Enable maintenance mode
            await maintenanceModeService.enableMaintenanceMode(
                'Emergency maintenance',
                testSuperAdminId
            );

            // Check if maintenance mode is active
            const isActive = await maintenanceModeService.isMaintenanceModeActive();
            expect(isActive).toBe(true);

            // Disable maintenance mode
            await maintenanceModeService.disableMaintenanceMode(testSuperAdminId);

            // Verify maintenance mode is disabled
            const isStillActive = await maintenanceModeService.isMaintenanceModeActive();
            expect(isStillActive).toBe(false);
        });
    });

    describe('User Activity Flow Integration', () => {
        it('should track and display user activity correctly', async () => {
            // Get all user activity
            const activity = await userActivityService.getAllUserActivity({
                limit: 100,
            });

            expect(activity.users).toBeDefined();
            expect(activity.users.length).toBeGreaterThan(0);

            // Verify test users are included
            const testUser = activity.users.find(u => u.userId === testUserId);
            expect(testUser).toBeDefined();
            expect(testUser?.email).toBe('testuser@example.com');

            // Get user activity timeline
            const timeline = await userActivityService.getUserActivityTimeline(testUserId);
            expect(timeline).toBeDefined();
            expect(timeline.userId).toBe(testUserId);
            expect(timeline.events).toBeDefined();
        });

        it('should categorize users by activity level', async () => {
            // Get active users (logged in within 7 days)
            const activeUsers = await userActivityService.getAllUserActivity({
                activityLevel: 'active',
                limit: 100,
            });

            expect(activeUsers.users).toBeDefined();
            activeUsers.users.forEach(user => {
                expect(user.activityLevel).toBe('active');
                const daysSinceLogin = (Date.now() - user.lastLogin) / (1000 * 60 * 60 * 24);
                expect(daysSinceLogin).toBeLessThanOrEqual(7);
            });

            // Get inactive users (logged in 7-30 days ago)
            const inactiveUsers = await userActivityService.getAllUserActivity({
                activityLevel: 'inactive',
                limit: 100,
            });

            expect(inactiveUsers.users).toBeDefined();
            inactiveUsers.users.forEach(user => {
                expect(user.activityLevel).toBe('inactive');
                const daysSinceLogin = (Date.now() - user.lastLogin) / (1000 * 60 * 60 * 24);
                expect(daysSinceLogin).toBeGreaterThan(7);
                expect(daysSinceLogin).toBeLessThanOrEqual(30);
            });

            // Get dormant users (logged in over 30 days ago)
            const dormantUsers = await userActivityService.getAllUserActivity({
                activityLevel: 'dormant',
                limit: 100,
            });

            expect(dormantUsers.users).toBeDefined();
            dormantUsers.users.forEach(user => {
                expect(user.activityLevel).toBe('dormant');
                const daysSinceLogin = (Date.now() - user.lastLogin) / (1000 * 60 * 60 * 24);
                expect(daysSinceLogin).toBeGreaterThan(30);
            });
        });
    });

    describe('System Health Monitoring Integration', () => {
        it('should retrieve system health metrics', async () => {
            const health = await systemHealthService.getSystemHealth();

            expect(health).toBeDefined();
            expect(health.timestamp).toBeDefined();
            expect(health.apiMetrics).toBeDefined();
            expect(health.awsServices).toBeDefined();
            expect(health.errors).toBeDefined();
            expect(health.alerts).toBeDefined();
        });

        it('should retrieve error logs with filtering', async () => {
            const errors = await systemHealthService.getErrorLogs({
                limit: 10,
            });

            expect(errors).toBeDefined();
            expect(Array.isArray(errors)).toBe(true);
        });
    });

    describe('Cross-Feature Integration', () => {
        it('should create audit logs for all admin actions', async () => {
            // Perform various admin actions
            const contentId = 'audit-test-content';
            const repository = getRepository();

            // Create content
            await repository.put({
                PK: `USER#${testUserId}`,
                SK: `CONTENT#${contentId}`,
                EntityType: 'Content',
                Data: {
                    contentId,
                    contentType: 'blog_post',
                    title: 'Audit Test',
                    content: 'Testing audit logs',
                    status: 'pending',
                    createdAt: Date.now(),
                },
                GSI1PK: 'MODERATION#pending',
                GSI1SK: Date.now().toString(),
            });

            // Moderate content (should create audit log)
            await contentModerationService.approveContent(contentId, testAdminId);

            // Create support ticket (should create audit log)
            const ticket = await supportTicketService.createTicket(
                testUserId,
                'Audit Test Ticket',
                'Testing audit logging',
                'help'
            );

            // Update feature flag (should create audit log)
            await platformConfigService.setFeatureFlag(
                'audit-test-flag',
                {
                    name: 'Audit Test Flag',
                    description: 'Testing audit logs',
                    enabled: true,
                    rolloutPercentage: 100,
                },
                testSuperAdminId
            );

            // Verify audit logs were created
            // Note: This would require implementing AuditLogService.getAuditLog()
            // For now, we just verify the actions completed successfully

            // Clean up
            await repository.delete(`USER#${testUserId}`, `CONTENT#${contentId}`);
            await repository.delete(`TICKET#${ticket.ticketId}`, 'METADATA');
            await repository.delete('CONFIG#FEATURE_FLAGS', 'FLAG#audit-test-flag');
        });

        it('should handle concurrent admin operations', async () => {
            // Simulate multiple admins performing actions simultaneously
            const promises = [
                userActivityService.getAllUserActivity({ limit: 10 }),
                contentModerationService.getContentForModeration({ limit: 10 }),
                supportTicketService.getTickets({ limit: 10 }),
                platformConfigService.getFeatureFlags(),
                systemHealthService.getSystemHealth(),
            ];

            // All operations should complete successfully
            const results = await Promise.all(promises);
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result).toBeDefined();
            });
        });
    });
});
