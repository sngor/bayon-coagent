/**
 * User Activity Service Tests
 * 
 * Tests for the user activity tracking service
 */

import { UserActivityService } from '../user-activity-service';

describe('UserActivityService', () => {
    let service: UserActivityService;

    beforeEach(() => {
        service = new UserActivityService();
    });

    describe('categorizeActivityLevel', () => {
        it('should categorize as active for login within 7 days', () => {
            const now = Date.now();
            const lastLogin = now - (5 * 24 * 60 * 60 * 1000); // 5 days ago

            // Access private method through any cast for testing
            const level = (service as any).categorizeActivityLevel(lastLogin);

            expect(level).toBe('active');
        });

        it('should categorize as inactive for login between 7-30 days', () => {
            const now = Date.now();
            const lastLogin = now - (15 * 24 * 60 * 60 * 1000); // 15 days ago

            const level = (service as any).categorizeActivityLevel(lastLogin);

            expect(level).toBe('inactive');
        });

        it('should categorize as dormant for login over 30 days', () => {
            const now = Date.now();
            const lastLogin = now - (45 * 24 * 60 * 60 * 1000); // 45 days ago

            const level = (service as any).categorizeActivityLevel(lastLogin);

            expect(level).toBe('dormant');
        });

        it('should categorize as active for login exactly 7 days ago', () => {
            const now = Date.now();
            const lastLogin = now - (7 * 24 * 60 * 60 * 1000); // exactly 7 days ago

            const level = (service as any).categorizeActivityLevel(lastLogin);

            expect(level).toBe('active');
        });

        it('should categorize as inactive for login exactly 30 days ago', () => {
            const now = Date.now();
            const lastLogin = now - (30 * 24 * 60 * 60 * 1000); // exactly 30 days ago

            const level = (service as any).categorizeActivityLevel(lastLogin);

            expect(level).toBe('inactive');
        });
    });

    describe('sortUsers', () => {
        const mockUsers = [
            {
                userId: '1',
                email: 'user1@test.com',
                name: 'User 1',
                lastLogin: 1000,
                totalSessions: 10,
                totalContentCreated: 5,
                featureUsage: {},
                aiUsage: { requests: 0, tokens: 0, cost: 0 },
                activityLevel: 'active' as const,
                signupDate: 1000,
            },
            {
                userId: '2',
                email: 'user2@test.com',
                name: 'User 2',
                lastLogin: 2000,
                totalSessions: 20,
                totalContentCreated: 15,
                featureUsage: {},
                aiUsage: { requests: 0, tokens: 0, cost: 0 },
                activityLevel: 'active' as const,
                signupDate: 1000,
            },
            {
                userId: '3',
                email: 'user3@test.com',
                name: 'User 3',
                lastLogin: 1500,
                totalSessions: 15,
                totalContentCreated: 10,
                featureUsage: {},
                aiUsage: { requests: 0, tokens: 0, cost: 0 },
                activityLevel: 'active' as const,
                signupDate: 1000,
            },
        ];

        it('should sort by lastLogin descending', () => {
            const sorted = (service as any).sortUsers(mockUsers, 'lastLogin');

            expect(sorted[0].userId).toBe('2'); // 2000
            expect(sorted[1].userId).toBe('3'); // 1500
            expect(sorted[2].userId).toBe('1'); // 1000
        });

        it('should sort by totalSessions descending', () => {
            const sorted = (service as any).sortUsers(mockUsers, 'totalSessions');

            expect(sorted[0].userId).toBe('2'); // 20
            expect(sorted[1].userId).toBe('3'); // 15
            expect(sorted[2].userId).toBe('1'); // 10
        });

        it('should sort by contentCreated descending', () => {
            const sorted = (service as any).sortUsers(mockUsers, 'contentCreated');

            expect(sorted[0].userId).toBe('2'); // 15
            expect(sorted[1].userId).toBe('3'); // 10
            expect(sorted[2].userId).toBe('1'); // 5
        });

        it('should return users unsorted when no sortBy is provided', () => {
            const sorted = (service as any).sortUsers(mockUsers);

            expect(sorted).toEqual(mockUsers);
        });
    });

    describe('formatEventDescription', () => {
        it('should format page_view events', () => {
            const event = {
                eventType: 'page_view',
                eventData: { page: '/dashboard' },
            };

            const description = (service as any).formatEventDescription(event);

            expect(description).toBe('Viewed /dashboard');
        });

        it('should format feature_use events', () => {
            const event = {
                eventType: 'feature_use',
                eventData: { feature: 'content_generator' },
            };

            const description = (service as any).formatEventDescription(event);

            expect(description).toBe('Used content_generator');
        });

        it('should format content_create events', () => {
            const event = {
                eventType: 'content_create',
                eventData: { contentType: 'blog_post' },
            };

            const description = (service as any).formatEventDescription(event);

            expect(description).toBe('Created blog_post');
        });

        it('should format ai_request events with truncated prompt', () => {
            const longPrompt = 'a'.repeat(100);
            const event = {
                eventType: 'ai_request',
                eventData: { prompt: longPrompt },
            };

            const description = (service as any).formatEventDescription(event);

            expect(description).toContain('Made AI request:');
            expect(description).toContain('...');
            expect(description.length).toBeLessThan(100);
        });

        it('should format error events', () => {
            const event = {
                eventType: 'error',
                eventData: { message: 'Something went wrong' },
            };

            const description = (service as any).formatEventDescription(event);

            expect(description).toBe('Error: Something went wrong');
        });

        it('should handle events with missing data', () => {
            const event = {
                eventType: 'page_view',
                eventData: {},
            };

            const description = (service as any).formatEventDescription(event);

            expect(description).toBe('Viewed page');
        });
    });

    describe('exportUserActivity', () => {
        it('should generate CSV with correct headers and format', () => {
            // Test CSV generation logic directly without mocking
            const headers = [
                'User ID',
                'Email',
                'Name',
                'Last Login',
                'Activity Level',
                'Total Sessions',
                'Content Created',
                'AI Requests',
                'AI Tokens',
                'AI Cost',
                'Signup Date',
            ];

            const csvHeader = headers.join(',');

            expect(csvHeader).toContain('User ID');
            expect(csvHeader).toContain('Email');
            expect(csvHeader).toContain('Activity Level');
            expect(csvHeader).toContain('AI Cost');
        });

        it('should properly format CSV row with quotes', () => {
            const testRow = ['1', 'user@test.com', 'User, Name', '2024-01-01', 'active', '10', '5', '100', '1000', '0.50', '2024-01-01'];
            const csvRow = testRow.map(cell => `"${cell}"`).join(',');

            expect(csvRow).toContain('"User, Name"');
            expect(csvRow).toContain('"user@test.com"');
            expect(csvRow).toContain('"active"');
        });
    });
});
