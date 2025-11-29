/**
 * Permission Manager Tests
 * 
 * Tests for push notification permission tracking, validation, and revocation.
 * Validates Requirements: 5.1, 5.5
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PermissionManager, PushSubscription } from '../permission-manager';
import { DynamoDBRepository } from '@/aws/dynamodb/repository';

// Mock DynamoDB repository
jest.mock('@/aws/dynamodb/repository');

describe('PermissionManager', () => {
    let permissionManager: PermissionManager;
    let mockRepository: any;

    const mockUserId = 'user-123';
    const mockDeviceId = 'device-456';
    const mockSubscription: PushSubscription = {
        endpoint: 'https://push.example.com/subscription/123',
        keys: {
            p256dh: 'mock-p256dh-key',
            auth: 'mock-auth-key',
        },
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Create mock repository with jest functions
        mockRepository = {
            put: jest.fn(),
            get: jest.fn(),
            query: jest.fn(),
            delete: jest.fn(),
            update: jest.fn(),
        };

        permissionManager = new PermissionManager();
        (permissionManager as any).repository = mockRepository;
    });

    describe('grantPermission', () => {
        it('should grant push notification permission successfully', async () => {
            mockRepository.put.mockResolvedValue(undefined);

            const result = await permissionManager.grantPermission(
                mockUserId,
                mockDeviceId,
                mockSubscription,
                { userAgent: 'Mozilla/5.0' }
            );

            expect(result.success).toBe(true);
            expect(result.message).toContain('granted successfully');
            expect(mockRepository.put).toHaveBeenCalledTimes(2); // Permission + history
        });

        it('should store permission with correct data structure', async () => {
            mockRepository.put.mockResolvedValue(undefined);

            await permissionManager.grantPermission(
                mockUserId,
                mockDeviceId,
                mockSubscription
            );

            const permissionCall = mockRepository.put.mock.calls[0][0];
            expect(permissionCall.PK).toBe(`USER#${mockUserId}`);
            expect(permissionCall.SK).toBe(`PUSH_PERMISSION#${mockDeviceId}`);
            expect(permissionCall.Data.granted).toBe(true);
            expect(permissionCall.Data.subscription).toEqual(mockSubscription);
        });

        it('should handle errors gracefully', async () => {
            mockRepository.put.mockRejectedValue(new Error('Database error'));

            const result = await permissionManager.grantPermission(
                mockUserId,
                mockDeviceId,
                mockSubscription
            );

            expect(result.success).toBe(false);
            expect(result.message).toContain('Failed');
        });
    });

    describe('revokePermission', () => {
        it('should revoke push notification permission successfully', async () => {
            const existingPermission = {
                userId: mockUserId,
                deviceId: mockDeviceId,
                granted: true,
                subscription: mockSubscription,
                updatedAt: new Date().toISOString(),
            };

            mockRepository.get.mockResolvedValue(existingPermission);
            mockRepository.put.mockResolvedValue(undefined);

            const result = await permissionManager.revokePermission(
                mockUserId,
                mockDeviceId,
                'User requested'
            );

            expect(result.success).toBe(true);
            expect(result.message).toContain('revoked successfully');
        });

        it('should update permission to revoked state', async () => {
            const existingPermission = {
                userId: mockUserId,
                deviceId: mockDeviceId,
                granted: true,
                subscription: mockSubscription,
                updatedAt: new Date().toISOString(),
            };

            mockRepository.get.mockResolvedValue(existingPermission);
            mockRepository.put.mockResolvedValue(undefined);

            await permissionManager.revokePermission(mockUserId, mockDeviceId);

            const permissionCall = mockRepository.put.mock.calls[0][0];
            expect(permissionCall.Data.granted).toBe(false);
            expect(permissionCall.Data.revokedAt).toBeDefined();
        });

        it('should return error if permission not found', async () => {
            mockRepository.get.mockResolvedValue(null);

            const result = await permissionManager.revokePermission(
                mockUserId,
                mockDeviceId
            );

            expect(result.success).toBe(false);
            expect(result.message).toContain('not found');
        });
    });

    describe('canSendPushNotification', () => {
        it('should return true when user has active permission', async () => {
            const activePermission = {
                userId: mockUserId,
                deviceId: mockDeviceId,
                granted: true,
                subscription: mockSubscription,
                updatedAt: new Date().toISOString(),
            };

            mockRepository.get.mockResolvedValue(activePermission);

            const canSend = await permissionManager.canSendPushNotification(
                mockUserId,
                mockDeviceId
            );

            expect(canSend).toBe(true);
        });

        it('should return false when permission is revoked', async () => {
            const revokedPermission = {
                userId: mockUserId,
                deviceId: mockDeviceId,
                granted: false,
                revokedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            mockRepository.get.mockResolvedValue(revokedPermission);

            const canSend = await permissionManager.canSendPushNotification(
                mockUserId,
                mockDeviceId
            );

            expect(canSend).toBe(false);
        });

        it('should return false when permission not found', async () => {
            mockRepository.get.mockResolvedValue(null);

            const canSend = await permissionManager.canSendPushNotification(
                mockUserId,
                mockDeviceId
            );

            expect(canSend).toBe(false);
        });

        it('should check any device when deviceId not provided', async () => {
            mockRepository.query.mockResolvedValue({
                items: [
                    {
                        userId: mockUserId,
                        deviceId: 'device-1',
                        granted: true,
                        subscription: mockSubscription,
                        updatedAt: new Date().toISOString(),
                    },
                ],
                lastEvaluatedKey: undefined,
            });

            const canSend = await permissionManager.canSendPushNotification(mockUserId);

            expect(canSend).toBe(true);
            expect(mockRepository.query).toHaveBeenCalled();
        });

        it('should fail closed on error (return false)', async () => {
            mockRepository.get.mockRejectedValue(new Error('Database error'));

            const canSend = await permissionManager.canSendPushNotification(
                mockUserId,
                mockDeviceId
            );

            expect(canSend).toBe(false);
        });
    });

    describe('updateSubscription', () => {
        it('should update push subscription successfully', async () => {
            const existingPermission = {
                userId: mockUserId,
                deviceId: mockDeviceId,
                granted: true,
                subscription: mockSubscription,
                updatedAt: new Date().toISOString(),
            };

            const newSubscription: PushSubscription = {
                endpoint: 'https://push.example.com/subscription/456',
                keys: {
                    p256dh: 'new-p256dh-key',
                    auth: 'new-auth-key',
                },
            };

            mockRepository.get.mockResolvedValue(existingPermission);
            mockRepository.put.mockResolvedValue(undefined);

            const result = await permissionManager.updateSubscription(
                mockUserId,
                mockDeviceId,
                newSubscription
            );

            expect(result.success).toBe(true);
            expect(result.message).toContain('updated successfully');
        });

        it('should return error if permission not found', async () => {
            mockRepository.get.mockResolvedValue(null);

            const result = await permissionManager.updateSubscription(
                mockUserId,
                mockDeviceId,
                mockSubscription
            );

            expect(result.success).toBe(false);
            expect(result.message).toContain('not found');
        });
    });

    describe('getUserPermissions', () => {
        it('should return all permissions for a user', async () => {
            const permissions = [
                {
                    userId: mockUserId,
                    deviceId: 'device-1',
                    granted: true,
                    subscription: mockSubscription,
                    updatedAt: new Date().toISOString(),
                },
                {
                    userId: mockUserId,
                    deviceId: 'device-2',
                    granted: false,
                    revokedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ];

            mockRepository.query.mockResolvedValue({
                items: permissions,
                lastEvaluatedKey: undefined,
            });

            const result = await permissionManager.getUserPermissions(mockUserId);

            expect(result).toHaveLength(2);
            expect(result[0].deviceId).toBe('device-1');
            expect(result[1].deviceId).toBe('device-2');
        });

        it('should return empty array on error', async () => {
            mockRepository.query.mockRejectedValue(new Error('Database error'));

            const result = await permissionManager.getUserPermissions(mockUserId);

            expect(result).toEqual([]);
        });
    });

    describe('getActiveSubscriptions', () => {
        it('should return only active subscriptions', async () => {
            const permissions = [
                {
                    userId: mockUserId,
                    deviceId: 'device-1',
                    granted: true,
                    subscription: mockSubscription,
                    updatedAt: new Date().toISOString(),
                },
                {
                    userId: mockUserId,
                    deviceId: 'device-2',
                    granted: false,
                    subscription: mockSubscription,
                    updatedAt: new Date().toISOString(),
                },
                {
                    userId: mockUserId,
                    deviceId: 'device-3',
                    granted: true,
                    subscription: mockSubscription,
                    updatedAt: new Date().toISOString(),
                },
            ];

            mockRepository.query.mockResolvedValue({
                items: permissions,
                lastEvaluatedKey: undefined,
            });

            const result = await permissionManager.getActiveSubscriptions(mockUserId);

            expect(result).toHaveLength(2);
            expect(result[0].deviceId).toBe('device-1');
            expect(result[1].deviceId).toBe('device-3');
        });
    });

    describe('revokeAllPermissions', () => {
        it('should revoke all active permissions', async () => {
            const permissions = [
                {
                    userId: mockUserId,
                    deviceId: 'device-1',
                    granted: true,
                    subscription: mockSubscription,
                    updatedAt: new Date().toISOString(),
                },
                {
                    userId: mockUserId,
                    deviceId: 'device-2',
                    granted: true,
                    subscription: mockSubscription,
                    updatedAt: new Date().toISOString(),
                },
            ];

            mockRepository.query.mockResolvedValue({
                items: permissions,
                lastEvaluatedKey: undefined,
            });
            mockRepository.get.mockImplementation((pk: string, sk: string) => {
                const deviceId = sk.split('#')[1];
                return Promise.resolve(
                    permissions.find(p => p.deviceId === deviceId) || null
                );
            });
            mockRepository.put.mockResolvedValue(undefined);

            const result = await permissionManager.revokeAllPermissions(
                mockUserId,
                'User requested'
            );

            expect(result.success).toBe(true);
            expect(result.revokedCount).toBe(2);
        });
    });

    describe('cleanupExpiredSubscriptions', () => {
        it('should revoke expired subscriptions', async () => {
            const now = Date.now();
            const permissions = [
                {
                    userId: mockUserId,
                    deviceId: 'device-1',
                    granted: true,
                    subscription: {
                        ...mockSubscription,
                        expirationTime: now - 1000, // Expired
                    },
                    updatedAt: new Date().toISOString(),
                },
                {
                    userId: mockUserId,
                    deviceId: 'device-2',
                    granted: true,
                    subscription: {
                        ...mockSubscription,
                        expirationTime: now + 10000, // Not expired
                    },
                    updatedAt: new Date().toISOString(),
                },
            ];

            mockRepository.query.mockResolvedValue({
                items: permissions,
                lastEvaluatedKey: undefined,
            });
            mockRepository.get.mockResolvedValue(permissions[0]);
            mockRepository.put.mockResolvedValue(undefined);

            const cleanedCount = await permissionManager.cleanupExpiredSubscriptions(
                mockUserId
            );

            expect(cleanedCount).toBe(1);
        });
    });

    describe('validateSubscription', () => {
        it('should validate correct subscription format', () => {
            const valid = permissionManager.validateSubscription(mockSubscription);
            expect(valid).toBe(true);
        });

        it('should reject subscription without endpoint', () => {
            const invalid = {
                keys: mockSubscription.keys,
            };
            const valid = permissionManager.validateSubscription(invalid);
            expect(valid).toBe(false);
        });

        it('should reject subscription without keys', () => {
            const invalid = {
                endpoint: mockSubscription.endpoint,
            } as any;
            const valid = permissionManager.validateSubscription(invalid);
            expect(valid).toBeFalsy(); // Returns undefined which is falsy
        });

        it('should reject subscription with invalid keys', () => {
            const invalid = {
                endpoint: mockSubscription.endpoint,
                keys: {
                    p256dh: 'valid-key',
                    // Missing auth key
                },
            };
            const valid = permissionManager.validateSubscription(invalid);
            expect(valid).toBe(false);
        });
    });

    describe('getPermissionHistory', () => {
        it('should return permission history', async () => {
            const history = [
                {
                    userId: mockUserId,
                    deviceId: mockDeviceId,
                    action: 'granted' as const,
                    timestamp: new Date().toISOString(),
                },
                {
                    userId: mockUserId,
                    deviceId: mockDeviceId,
                    action: 'revoked' as const,
                    timestamp: new Date().toISOString(),
                },
            ];

            mockRepository.query.mockResolvedValue({
                items: history,
                lastEvaluatedKey: undefined,
            });

            const result = await permissionManager.getPermissionHistory(mockUserId);

            expect(result).toHaveLength(2);
            expect(result[0].action).toBe('granted');
            expect(result[1].action).toBe('revoked');
        });

        it('should respect limit parameter', async () => {
            mockRepository.query.mockResolvedValue({
                items: [],
                lastEvaluatedKey: undefined,
            });

            await permissionManager.getPermissionHistory(mockUserId, 10);

            expect(mockRepository.query).toHaveBeenCalledWith(
                `USER#${mockUserId}`,
                'PERMISSION_HISTORY#',
                expect.objectContaining({ limit: 10 })
            );
        });
    });
});
