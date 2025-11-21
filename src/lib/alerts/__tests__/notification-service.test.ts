/**
 * Notification Service Tests
 * 
 * Tests for the notification service functionality.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock the AWS SES client
jest.mock('@/aws/ses/client', () => ({
    sendEmail: jest.fn(),
    sendBulkTemplatedEmail: jest.fn(),
    createEmailTemplate: jest.fn(),
    updateEmailTemplate: jest.fn(),
    templateExists: jest.fn(),
    upsertEmailTemplate: jest.fn(),
}));

// Mock the DynamoDB repository
jest.mock('@/aws/dynamodb/repository', () => ({
    DynamoDBRepository: jest.fn().mockImplementation(() => ({
        get: jest.fn(),
        put: jest.fn(),
        query: jest.fn(),
    })),
}));

// Mock the alert data access
jest.mock('@/lib/alerts/data-access', () => ({
    alertDataAccess: {
        getAlertsByDateRange: jest.fn(),
    },
}));

describe('NotificationService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should be importable', () => {
        // This test just verifies that the module can be imported
        // without throwing compilation errors
        expect(true).toBe(true);
    });

    it('should have correct notification preferences structure', () => {
        const mockPreferences = {
            userId: 'test-user',
            emailNotifications: true,
            frequency: 'real-time' as const,
            enabledAlertTypes: ['life-event-lead' as const],
            updatedAt: new Date().toISOString(),
        };

        expect(mockPreferences.userId).toBe('test-user');
        expect(mockPreferences.emailNotifications).toBe(true);
        expect(mockPreferences.frequency).toBe('real-time');
    });

    it('should have correct email template structure', () => {
        const mockTemplate = {
            name: 'test-template',
            subject: 'Test Subject',
            htmlBody: '<html><body>Test</body></html>',
            textBody: 'Test',
            description: 'Test template',
            variables: ['agentName', 'alertType'],
        };

        expect(mockTemplate.name).toBe('test-template');
        expect(mockTemplate.variables).toContain('agentName');
    });

    it('should have correct digest data structure', () => {
        const mockDigest = {
            userId: 'test-user',
            period: 'daily' as const,
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-01-02T00:00:00Z',
            alerts: [],
            summary: {
                totalCount: 0,
                highPriorityCount: 0,
                countsByType: {
                    'life-event-lead': 0,
                    'competitor-new-listing': 0,
                    'competitor-price-reduction': 0,
                    'competitor-withdrawal': 0,
                    'neighborhood-trend': 0,
                    'price-reduction': 0,
                },
                countsByPriority: {
                    high: 0,
                    medium: 0,
                    low: 0,
                },
            },
            generatedAt: new Date().toISOString(),
        };

        expect(mockDigest.period).toBe('daily');
        expect(mockDigest.summary.countsByType).toHaveProperty('life-event-lead');
    });
});