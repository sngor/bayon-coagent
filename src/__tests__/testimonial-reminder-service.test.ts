/**
 * Testimonial Reminder Service Tests
 * 
 * Tests the automated reminder email system for testimonial requests
 * Validates Requirements: 2.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TestimonialRequest } from '@/lib/types';

// Mock all dependencies before importing the service
jest.mock('@/aws/dynamodb', () => ({
    queryPendingRequestsOlderThan: jest.fn(),
    updateTestimonialRequestStatus: jest.fn(),
    queryTestimonialRequests: jest.fn(),
    getRepository: jest.fn(),
    getUserProfileKeys: jest.fn(),
}));

jest.mock('@/aws/ses/client', () => ({
    sendEmail: jest.fn(),
}));

jest.mock('@/lib/notifications/service', () => ({
    getNotificationService: jest.fn(),
}));

// Import after mocking
import {
    sendTestimonialReminders,
    expireOldTestimonialRequests,
} from '@/services/testimonial-reminder-service';
import * as dynamodb from '@/aws/dynamodb';
import * as ses from '@/aws/ses/client';
import * as notificationService from '@/lib/notifications/service';

describe('Testimonial Reminder Service', () => {
    const mockUserId = 'test-user-123';
    const mockProfile = {
        name: 'John Smith',
        agencyName: 'Smith Realty',
        email: 'john@example.com',
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock profile retrieval
        const mockRepository = {
            get: jest.fn<any>().mockResolvedValue(mockProfile),
        };
        (dynamodb.getRepository as jest.Mock).mockReturnValue(mockRepository);
        (dynamodb.getUserProfileKeys as jest.Mock).mockReturnValue({
            PK: `USER#${mockUserId}`,
            SK: 'PROFILE',
        });

        // Mock notification service
        const mockNotificationServiceInstance = {
            createNotification: jest.fn<any>().mockResolvedValue({ id: 'notif-1' }),
        };
        (notificationService.getNotificationService as jest.Mock).mockReturnValue(mockNotificationServiceInstance);
    });

    describe('sendTestimonialReminders', () => {
        it('should send reminder emails for pending requests older than 14 days', async () => {
            // Create a request that's 15 days old
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            const mockRequest: TestimonialRequest = {
                id: 'request-1',
                userId: mockUserId,
                clientName: 'Jane Doe',
                clientEmail: 'jane@example.com',
                status: 'pending',
                submissionLink: '/testimonial/submit/abc123',
                sentAt: fifteenDaysAgo.toISOString(),
                expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
            };

            // Mock query to return the old request
            (dynamodb.queryPendingRequestsOlderThan as jest.Mock).mockResolvedValue({
                items: [mockRequest],
                count: 1,
            });

            // Mock email sending
            (ses.sendEmail as jest.Mock).mockResolvedValue('message-id-123');

            // Mock status update
            (dynamodb.updateTestimonialRequestStatus as jest.Mock).mockResolvedValue(undefined);

            // Execute
            const result = await sendTestimonialReminders(mockUserId);

            // Verify
            expect(result.success).toBe(true);
            expect(result.remindersSent).toBe(1);
            expect(result.errors).toHaveLength(0);

            // Verify email was sent
            expect(ses.sendEmail).toHaveBeenCalledWith(
                'jane@example.com',
                expect.stringContaining('Reminder'),
                expect.stringContaining('Jane Doe'),
                expect.any(String),
                true
            );

            // Verify status was updated
            expect(dynamodb.updateTestimonialRequestStatus).toHaveBeenCalledWith(
                mockUserId,
                'request-1',
                'pending',
                expect.objectContaining({
                    reminderSentAt: expect.any(String),
                })
            );
        });

        it('should not send reminders for requests with existing reminderSentAt', async () => {
            // Mock query - should filter out requests with reminderSentAt
            (dynamodb.queryPendingRequestsOlderThan as jest.Mock).mockResolvedValue({
                items: [], // Filtered out by the query function
                count: 0,
            });

            // Execute
            const result = await sendTestimonialReminders(mockUserId);

            // Verify
            expect(result.success).toBe(true);
            expect(result.remindersSent).toBe(0);
            expect(ses.sendEmail).not.toHaveBeenCalled();
        });

        it('should return error when userId is not provided', async () => {
            const result = await sendTestimonialReminders();

            expect(result.success).toBe(false);
            expect(result.remindersSent).toBe(0);
            expect(result.errors).toContain('User ID is required for reminder processing');
        });

        it('should handle email sending failures gracefully', async () => {
            const fifteenDaysAgo = new Date();
            fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

            const mockRequest: TestimonialRequest = {
                id: 'request-1',
                userId: mockUserId,
                clientName: 'Jane Doe',
                clientEmail: 'jane@example.com',
                status: 'pending',
                submissionLink: '/testimonial/submit/abc123',
                sentAt: fifteenDaysAgo.toISOString(),
                expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
            };

            (dynamodb.queryPendingRequestsOlderThan as jest.Mock).mockResolvedValue({
                items: [mockRequest],
                count: 1,
            });

            // Mock email sending to fail
            (ses.sendEmail as jest.Mock).mockRejectedValue(new Error('SES error'));

            // Execute
            const result = await sendTestimonialReminders(mockUserId);

            // Verify - should still succeed but with errors
            expect(result.success).toBe(true);
            expect(result.remindersSent).toBe(0);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('SES error');
        });
    });

    describe('expireOldTestimonialRequests', () => {
        it('should expire requests past their expiration date', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const mockRequest: TestimonialRequest = {
                id: 'request-1',
                userId: mockUserId,
                clientName: 'Jane Doe',
                clientEmail: 'jane@example.com',
                status: 'pending',
                submissionLink: '/testimonial/submit/abc123',
                sentAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
                expiresAt: yesterday.toISOString(), // Expired yesterday
                createdAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
            };

            (dynamodb.queryTestimonialRequests as jest.Mock).mockResolvedValue({
                items: [mockRequest],
                count: 1,
            });

            (dynamodb.updateTestimonialRequestStatus as jest.Mock).mockResolvedValue(undefined);

            // Execute
            const result = await expireOldTestimonialRequests(mockUserId);

            // Verify
            expect(result.success).toBe(true);
            expect(result.requestsExpired).toBe(1);
            expect(result.errors).toHaveLength(0);

            // Verify status was updated to expired
            expect(dynamodb.updateTestimonialRequestStatus).toHaveBeenCalledWith(
                mockUserId,
                'request-1',
                'expired'
            );
        });

        it('should not expire requests that are still valid', async () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);

            const mockRequest: TestimonialRequest = {
                id: 'request-1',
                userId: mockUserId,
                clientName: 'Jane Doe',
                clientEmail: 'jane@example.com',
                status: 'pending',
                submissionLink: '/testimonial/submit/abc123',
                sentAt: new Date().toISOString(),
                expiresAt: tomorrow.toISOString(), // Expires tomorrow
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };

            (dynamodb.queryTestimonialRequests as jest.Mock).mockResolvedValue({
                items: [mockRequest],
                count: 1,
            });

            (dynamodb.updateTestimonialRequestStatus as jest.Mock).mockResolvedValue(undefined);

            // Execute
            const result = await expireOldTestimonialRequests(mockUserId);

            // Verify
            expect(result.success).toBe(true);
            expect(result.requestsExpired).toBe(0);
            expect(dynamodb.updateTestimonialRequestStatus).not.toHaveBeenCalled();
        });

        it('should not expire already submitted requests', async () => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);

            const mockRequest: TestimonialRequest = {
                id: 'request-1',
                userId: mockUserId,
                clientName: 'Jane Doe',
                clientEmail: 'jane@example.com',
                status: 'submitted', // Already submitted
                submissionLink: '/testimonial/submit/abc123',
                sentAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString(),
                submittedAt: new Date().toISOString(),
                expiresAt: yesterday.toISOString(),
                createdAt: Date.now() - 31 * 24 * 60 * 60 * 1000,
                updatedAt: Date.now(),
            };

            (dynamodb.queryTestimonialRequests as jest.Mock).mockResolvedValue({
                items: [mockRequest],
                count: 1,
            });

            (dynamodb.updateTestimonialRequestStatus as jest.Mock).mockResolvedValue(undefined);

            // Execute
            const result = await expireOldTestimonialRequests(mockUserId);

            // Verify
            expect(result.success).toBe(true);
            expect(result.requestsExpired).toBe(0);
            expect(dynamodb.updateTestimonialRequestStatus).not.toHaveBeenCalled();
        });
    });
});
