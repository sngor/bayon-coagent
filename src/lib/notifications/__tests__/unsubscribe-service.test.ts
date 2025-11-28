/**
 * Unsubscribe Service Tests
 * 
 * Tests for email unsubscribe functionality and compliance.
 * Validates Requirements: 4.5
 */

import { UnsubscribeService } from '../unsubscribe-service';
import { NotificationType } from '../types';

// Mock DynamoDB repository
class MockDynamoDBRepository {
    private data: Map<string, any> = new Map();

    async get(pk: string, sk: string): Promise<any> {
        const key = `${pk}#${sk}`;
        const item = this.data.get(key);
        // Return the Data field if it exists, otherwise return null
        return item ? item.Data : null;
    }

    async put(item: any): Promise<void> {
        const key = `${item.PK}#${item.SK}`;
        this.data.set(key, item);
    }

    async query(options: any): Promise<any> {
        const results: any[] = [];
        const pkValue = options.ExpressionAttributeValues?.[':pk'] || '';
        const skPrefix = options.ExpressionAttributeValues?.[':sk'] || '';

        for (const [key, value] of this.data.entries()) {
            const [pk, sk] = key.split('#');
            const fullPk = `${pk}#${sk.split('#')[0]}`;

            if (fullPk === pkValue || key.startsWith(pkValue)) {
                if (!skPrefix || key.includes(skPrefix)) {
                    results.push(value);
                }
            }
        }
        return {
            items: results,
            count: results.length,
        };
    }

    clear() {
        this.data.clear();
    }
}

describe('UnsubscribeService', () => {
    let service: UnsubscribeService;
    let mockRepository: MockDynamoDBRepository;

    beforeEach(() => {
        // Create mock repository
        mockRepository = new MockDynamoDBRepository();

        // Create service instance
        service = new UnsubscribeService();
        (service as any).repository = mockRepository;
    });

    describe('Token Generation and Validation', () => {
        test('should generate a valid unsubscribe token', () => {
            const userId = 'user123';
            const email = 'test@example.com';

            const token = service.generateUnsubscribeToken(userId, email);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.length).toBeGreaterThan(0);
        });

        test('should validate a valid token', () => {
            const userId = 'user123';
            const email = 'test@example.com';

            const token = service.generateUnsubscribeToken(userId, email);
            const result = service.validateUnsubscribeToken(token);

            expect(result).not.toBeNull();
            expect(result?.userId).toBe(userId);
            expect(result?.email).toBe(email);
            expect(result?.timestamp).toBeDefined();
        });

        test('should reject an invalid token', () => {
            const invalidToken = 'invalid-token';

            const result = service.validateUnsubscribeToken(invalidToken);

            expect(result).toBeNull();
        });

        test('should reject a tampered token', () => {
            const userId = 'user123';
            const email = 'test@example.com';

            const token = service.generateUnsubscribeToken(userId, email);
            // Tamper with the token
            const tamperedToken = token.slice(0, -5) + 'xxxxx';

            const result = service.validateUnsubscribeToken(tamperedToken);

            expect(result).toBeNull();
        });

        test('should reject an expired token', async () => {
            // Create a token with a very old timestamp
            const userId = 'user123';
            const email = 'test@example.com';
            const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000); // 31 days ago

            // Manually create an old token using Node's crypto module
            const crypto = await import('crypto');
            const data = `${userId}:${email}:${oldTimestamp}`;
            const hmac = crypto.createHmac('sha256', process.env.UNSUBSCRIBE_TOKEN_SECRET || 'default-secret-change-in-production');
            hmac.update(data);
            const signature = hmac.digest('hex');
            const oldToken = Buffer.from(`${data}:${signature}`).toString('base64url');

            const result = service.validateUnsubscribeToken(oldToken);

            expect(result).toBeNull();
        });

        test('should generate a valid unsubscribe URL', () => {
            const userId = 'user123';
            const email = 'test@example.com';

            const url = service.generateUnsubscribeUrl(userId, email);

            expect(url).toBeDefined();
            expect(url).toContain('/unsubscribe?token=');
            expect(url).toMatch(/^https?:\/\//);
        });
    });

    describe('Unsubscribe Processing', () => {
        test('should process global unsubscribe successfully', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            const result = await service.processUnsubscribe(token, {
                reason: 'Too many emails',
            });

            expect(result.success).toBe(true);
            expect(result.message).toContain('unsubscribed from all');
        });

        test('should process type-specific unsubscribe successfully', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);
            const alertTypes = [NotificationType.ALERT, NotificationType.ANNOUNCEMENT];

            const result = await service.processUnsubscribe(token, {
                alertTypes,
            });

            expect(result.success).toBe(true);
            expect(result.message).toContain('2 notification type(s)');
        });

        test('should reject invalid token during unsubscribe', async () => {
            const invalidToken = 'invalid-token';

            const result = await service.processUnsubscribe(invalidToken);

            expect(result.success).toBe(false);
            expect(result.message).toContain('Invalid or expired');
        });

        test('should create audit record with metadata', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            const result = await service.processUnsubscribe(token, {
                reason: 'Test reason',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0',
            });

            expect(result.success).toBe(true);

            // Verify audit record was created by checking history
            const history = await service.getUnsubscribeHistory(userId);
            expect(history.length).toBeGreaterThan(0);
            expect(history[0].reason).toBe('Test reason');
            expect(history[0].ipAddress).toBe('192.168.1.1');
            expect(history[0].userAgent).toBe('Mozilla/5.0');
        });
    });

    describe('Preference Management', () => {
        test('should get default preferences for new user', async () => {
            const userId = 'user123';

            const preferences = await service.getUnsubscribePreferences(userId);

            expect(preferences).toBeDefined();
            expect(preferences.userId).toBe(userId);
            expect(preferences.globalUnsubscribe).toBe(false);
            expect(preferences.typeUnsubscribes).toEqual([]);
        });

        test('should get existing preferences', async () => {
            const userId = 'user123';
            const existingPreferences = {
                userId,
                email: 'test@example.com',
                globalUnsubscribe: true,
                typeUnsubscribes: [],
                updatedAt: new Date().toISOString(),
            };

            // Store preferences in mock repository
            await mockRepository.put({
                PK: `USER#${userId}`,
                SK: 'UNSUBSCRIBE_PREFERENCES',
                Data: existingPreferences,
            });

            const preferences = await service.getUnsubscribePreferences(userId);

            expect(preferences.userId).toBe(userId);
            expect(preferences.globalUnsubscribe).toBe(true);
        });
    });

    describe('Email Permission Validation', () => {
        test('should allow email for subscribed user', async () => {
            const userId = 'user123';

            const canSend = await service.canSendEmail(userId);

            expect(canSend).toBe(true);
        });

        test('should block email for globally unsubscribed user', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            // Unsubscribe the user
            await service.processUnsubscribe(token);

            const canSend = await service.canSendEmail(userId);

            expect(canSend).toBe(false);
        });

        test('should block email for type-specific unsubscribe', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            // Unsubscribe from specific type
            await service.processUnsubscribe(token, {
                alertTypes: [NotificationType.ALERT],
            });

            const canSend = await service.canSendEmail(userId, NotificationType.ALERT);

            expect(canSend).toBe(false);
        });

        test('should allow email for non-unsubscribed type', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            // Unsubscribe from ALERT only
            await service.processUnsubscribe(token, {
                alertTypes: [NotificationType.ALERT],
            });

            const canSend = await service.canSendEmail(userId, NotificationType.ANNOUNCEMENT);

            expect(canSend).toBe(true);
        });
    });

    describe('Re-subscribe Functionality', () => {
        test('should re-subscribe to all notifications', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            // First unsubscribe
            await service.processUnsubscribe(token);

            // Then re-subscribe
            const result = await service.resubscribe(userId, []);

            expect(result.success).toBe(true);
            expect(result.message).toContain('re-subscribed to all');

            // Verify can send email again
            const canSend = await service.canSendEmail(userId);
            expect(canSend).toBe(true);
        });

        test('should re-subscribe to specific types', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            // Unsubscribe from multiple types
            await service.processUnsubscribe(token, {
                alertTypes: [NotificationType.ALERT, NotificationType.ANNOUNCEMENT],
            });

            // Re-subscribe to one type
            const result = await service.resubscribe(userId, [NotificationType.ALERT]);

            expect(result.success).toBe(true);
            expect(result.message).toContain('1 notification type(s)');

            // Verify ALERT is allowed but ANNOUNCEMENT is still blocked
            const canSendAlert = await service.canSendEmail(userId, NotificationType.ALERT);
            const canSendAnnouncement = await service.canSendEmail(userId, NotificationType.ANNOUNCEMENT);

            expect(canSendAlert).toBe(true);
            expect(canSendAnnouncement).toBe(false);
        });
    });

    describe('Unsubscribe History', () => {
        test('should get unsubscribe history', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            // Create unsubscribe record
            await service.processUnsubscribe(token, {
                reason: 'Too many emails',
            });

            const history = await service.getUnsubscribeHistory(userId, 10);

            expect(history.length).toBeGreaterThan(0);
            expect(history[0].userId).toBe(userId);
            expect(history[0].reason).toBe('Too many emails');
        });

        test('should return empty array for user with no history', async () => {
            const userId = 'user-with-no-history';

            const history = await service.getUnsubscribeHistory(userId);

            expect(history).toEqual([]);
        });
    });

    describe('Integration with Notification Preferences', () => {
        test('should not fail if notification preferences do not exist', async () => {
            const userId = 'user123';
            const email = 'test@example.com';
            const token = service.generateUnsubscribeToken(userId, email);

            const result = await service.processUnsubscribe(token);

            // Should still succeed even if notification preferences don't exist
            expect(result.success).toBe(true);
        });

        test('should handle complete unsubscribe and resubscribe flow', async () => {
            const userId = 'user123';
            const email = 'test@example.com';

            // Initial state - can send emails
            let canSend = await service.canSendEmail(userId);
            expect(canSend).toBe(true);

            // Unsubscribe
            const token = service.generateUnsubscribeToken(userId, email);
            const unsubResult = await service.processUnsubscribe(token);
            expect(unsubResult.success).toBe(true);

            // Cannot send emails after unsubscribe
            canSend = await service.canSendEmail(userId);
            expect(canSend).toBe(false);

            // Re-subscribe
            const resubResult = await service.resubscribe(userId, []);
            expect(resubResult.success).toBe(true);

            // Can send emails again after re-subscribe
            canSend = await service.canSendEmail(userId);
            expect(canSend).toBe(true);
        });
    });
});
