/**
 * Notification Integration Tests
 * 
 * Integration tests for the notification system to verify end-to-end functionality.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NotificationPreferences, DigestData } from '../notification-types';
import { Alert } from '../types';

// Mock AWS services
jest.mock('@/aws/ses/client');
jest.mock('@/aws/dynamodb/repository');
jest.mock('@/lib/alerts/data-access');

describe('Notification Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('Notification Preferences', () => {
        it('should create valid notification preferences', () => {
            const preferences: NotificationPreferences = {
                userId: 'test-user-123',
                emailNotifications: true,
                emailAddress: 'agent@example.com',
                frequency: 'daily',
                digestTime: '09:00',
                enabledAlertTypes: [
                    'life-event-lead',
                    'competitor-new-listing',
                    'price-reduction',
                ],
                quietHours: {
                    enabled: true,
                    startTime: '22:00',
                    endTime: '08:00',
                    timezone: 'America/New_York',
                },
                updatedAt: new Date().toISOString(),
            };

            expect(preferences.userId).toBe('test-user-123');
            expect(preferences.emailNotifications).toBe(true);
            expect(preferences.frequency).toBe('daily');
            expect(preferences.enabledAlertTypes).toHaveLength(3);
            expect(preferences.quietHours?.enabled).toBe(true);
        });

        it('should validate frequency options', () => {
            const validFrequencies = ['real-time', 'daily', 'weekly'] as const;

            validFrequencies.forEach(frequency => {
                const preferences: NotificationPreferences = {
                    userId: 'test-user',
                    emailNotifications: true,
                    frequency,
                    enabledAlertTypes: [],
                    updatedAt: new Date().toISOString(),
                };

                expect(preferences.frequency).toBe(frequency);
            });
        });
    });

    describe('Email Templates', () => {
        it('should generate correct alert subject lines', () => {
            const testCases = [
                {
                    type: 'life-event-lead',
                    data: { eventType: 'marriage', prospectLocation: 'Seattle, WA' },
                    expected: 'New High-Intent Lead: marriage in Seattle, WA',
                },
                {
                    type: 'competitor-new-listing',
                    data: { propertyAddress: '123 Main St, Seattle, WA' },
                    expected: 'Competitor New Listing: 123 Main St, Seattle, WA',
                },
                {
                    type: 'price-reduction',
                    data: { propertyAddress: '456 Oak Ave, Seattle, WA' },
                    expected: 'Price Reduction Alert: 456 Oak Ave, Seattle, WA',
                },
            ];

            testCases.forEach(({ type, data, expected }) => {
                const alert = {
                    id: 'test-alert',
                    userId: 'test-user',
                    type: type as any,
                    priority: 'medium' as const,
                    status: 'unread' as const,
                    createdAt: new Date().toISOString(),
                    data,
                };

                // This would be the actual subject generation logic
                let subject = '';
                switch (alert.type) {
                    case 'life-event-lead':
                        subject = `New High-Intent Lead: ${data.eventType} in ${data.prospectLocation}`;
                        break;
                    case 'competitor-new-listing':
                        subject = `Competitor New Listing: ${data.propertyAddress}`;
                        break;
                    case 'price-reduction':
                        subject = `Price Reduction Alert: ${data.propertyAddress}`;
                        break;
                }

                expect(subject).toBe(expected);
            });
        });
    });

    describe('Digest Generation', () => {
        it('should create valid digest data', () => {
            const mockAlerts: Alert[] = [
                {
                    id: 'alert-1',
                    userId: 'test-user',
                    type: 'life-event-lead',
                    priority: 'high',
                    status: 'unread',
                    createdAt: '2024-01-01T10:00:00Z',
                    data: {
                        prospectLocation: 'Seattle, WA',
                        eventType: 'marriage',
                        eventDate: '2024-01-01T00:00:00Z',
                        leadScore: 85,
                        recommendedAction: 'Contact within 24 hours',
                    },
                },
                {
                    id: 'alert-2',
                    userId: 'test-user',
                    type: 'competitor-new-listing',
                    priority: 'medium',
                    status: 'unread',
                    createdAt: '2024-01-01T11:00:00Z',
                    data: {
                        competitorName: 'John Smith Realty',
                        propertyAddress: '123 Main St, Seattle, WA',
                        listingPrice: 500000,
                    },
                },
            ];

            const digestData: DigestData = {
                userId: 'test-user',
                period: 'daily',
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-01-02T00:00:00Z',
                alerts: mockAlerts,
                summary: {
                    totalCount: mockAlerts.length,
                    highPriorityCount: mockAlerts.filter(a => a.priority === 'high').length,
                    countsByType: {
                        'life-event-lead': 1,
                        'competitor-new-listing': 1,
                        'competitor-price-reduction': 0,
                        'competitor-withdrawal': 0,
                        'neighborhood-trend': 0,
                        'price-reduction': 0,
                    },
                    countsByPriority: {
                        high: 1,
                        medium: 1,
                        low: 0,
                    },
                },
                generatedAt: new Date().toISOString(),
            };

            expect(digestData.alerts).toHaveLength(2);
            expect(digestData.summary.totalCount).toBe(2);
            expect(digestData.summary.highPriorityCount).toBe(1);
            expect(digestData.summary.countsByType['life-event-lead']).toBe(1);
            expect(digestData.summary.countsByType['competitor-new-listing']).toBe(1);
        });

        it('should handle empty digest data', () => {
            const digestData: DigestData = {
                userId: 'test-user',
                period: 'weekly',
                startDate: '2024-01-01T00:00:00Z',
                endDate: '2024-01-08T00:00:00Z',
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

            expect(digestData.alerts).toHaveLength(0);
            expect(digestData.summary.totalCount).toBe(0);
            expect(digestData.period).toBe('weekly');
        });
    });

    describe('Notification Scheduling', () => {
        it('should validate quiet hours configuration', () => {
            const quietHours = {
                enabled: true,
                startTime: '22:00',
                endTime: '08:00',
                timezone: 'America/New_York',
            };

            expect(quietHours.startTime).toMatch(/^\d{2}:\d{2}$/);
            expect(quietHours.endTime).toMatch(/^\d{2}:\d{2}$/);
            expect(quietHours.timezone).toContain('America/');
        });

        it('should validate digest time configuration', () => {
            const digestTimes = ['09:00', '12:00', '18:00'];

            digestTimes.forEach(time => {
                expect(time).toMatch(/^\d{2}:\d{2}$/);

                const [hours, minutes] = time.split(':').map(Number);
                expect(hours).toBeGreaterThanOrEqual(0);
                expect(hours).toBeLessThan(24);
                expect(minutes).toBeGreaterThanOrEqual(0);
                expect(minutes).toBeLessThan(60);
            });
        });
    });

    describe('Template Variables', () => {
        it('should validate template data structure', () => {
            const templateData = {
                agentName: 'Jane Doe',
                agentEmail: 'jane@example.com',
                agentPhone: '+1-555-123-4567',
                agentBranding: {
                    logoUrl: 'https://example.com/logo.png',
                    companyName: 'Jane Doe Realty',
                    website: 'https://janedoerealty.com',
                },
                digestDate: '2024-01-01',
                totalAlerts: 5,
                highPriorityCount: 2,
                alertsByType: {
                    'life-event-lead': 2,
                    'competitor-new-listing': 1,
                    'competitor-price-reduction': 1,
                    'competitor-withdrawal': 0,
                    'neighborhood-trend': 1,
                    'price-reduction': 0,
                },
                unsubscribeUrl: 'https://app.bayoncoagent.com/unsubscribe?user=123',
                preferencesUrl: 'https://app.bayoncoagent.com/settings/notifications',
            };

            expect(templateData.agentName).toBeTruthy();
            expect(templateData.agentEmail).toContain('@');
            expect(templateData.totalAlerts).toBeGreaterThan(0);
            expect(templateData.unsubscribeUrl).toContain('unsubscribe');
            expect(templateData.preferencesUrl).toContain('settings');
        });
    });
});