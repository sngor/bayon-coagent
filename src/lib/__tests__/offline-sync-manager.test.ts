/**
 * Tests for Offline Sync Manager
 * @jest-environment jsdom
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { OfflineSyncManager } from '../offline-sync-manager';

// Mock IndexedDB wrapper
jest.mock('@/lib/indexeddb-wrapper', () => ({
    syncQueueStore: {
        queueOperation: jest.fn<() => Promise<string>>().mockResolvedValue('test-id'),
        getPendingOperations: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        getFailedOperations: jest.fn<() => Promise<any[]>>().mockResolvedValue([]),
        getQueueStatus: jest.fn<() => Promise<{ pending: number; failed: number; completed: number }>>().mockResolvedValue({ pending: 0, failed: 0, completed: 0 }),
        updateOperationStatus: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
        get: jest.fn<() => Promise<any>>().mockResolvedValue(null),
        cleanupCompletedOperations: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    },
}));

// Mock other dependencies
jest.mock('@/lib/conflict-detection');
jest.mock('@/lib/conflict-storage');
jest.mock('@/lib/connectivity-monitor');
jest.mock('@/lib/background-sync-manager');

// Mock timers
jest.useFakeTimers();

describe('OfflineSyncManager', () => {
    let syncManager: OfflineSyncManager;

    beforeEach(() => {
        jest.clearAllMocks();
        // Mock navigator.onLine
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true,
        });
        syncManager = new OfflineSyncManager();
    });

    afterEach(() => {
        syncManager.destroy();
        jest.clearAllTimers();
    });

    describe('initialization', () => {
        it('should initialize with online status', () => {
            const status = syncManager.getConnectivityStatus();
            expect(status.isOnline).toBe(true);
            expect(status.lastOnlineAt).toBeGreaterThan(0);
        });
    });

    describe('queueOperation', () => {
        it('should queue an operation successfully', async () => {
            const operation = {
                type: 'content' as const,
                data: { title: 'Test' },
                timestamp: Date.now(),
            };

            const id = await syncManager.queueOperation(operation);
            expect(id).toBe('test-id');
        });
    });

    describe('connectivity monitoring', () => {
        it('should register connectivity callbacks', () => {
            const callback = jest.fn();
            const unsubscribe = syncManager.onConnectivityChange(callback);

            expect(typeof unsubscribe).toBe('function');
        });
    });

    describe('sync progress monitoring', () => {
        it('should register sync progress callbacks', () => {
            const callback = jest.fn();
            const unsubscribe = syncManager.onSyncProgress(callback);

            expect(typeof unsubscribe).toBe('function');
        });
    });

    describe('queue status', () => {
        it('should get queue status', async () => {
            const status = await syncManager.getQueueStatus();
            expect(status).toEqual({ pending: 0, failed: 0, completed: 0 });
        });
    });

    describe('retry logic', () => {
        it('should calculate retry delay with exponential backoff', () => {
            // Access private method for testing
            const calculateRetryDelay = (syncManager as any).calculateRetryDelay;

            const delay0 = calculateRetryDelay(0);
            const delay1 = calculateRetryDelay(1);
            const delay2 = calculateRetryDelay(2);

            expect(delay0).toBeGreaterThanOrEqual(500); // Minimum delay
            expect(delay1).toBeGreaterThan(delay0);
            expect(delay2).toBeGreaterThan(delay1);
        });

        it('should identify permanent failures', () => {
            // Access private method for testing
            const isPermanentFailure = (syncManager as any).isPermanentFailure;

            expect(isPermanentFailure({ status: 401 })).toBe(true);
            expect(isPermanentFailure({ status: 404 })).toBe(true);
            expect(isPermanentFailure({ message: 'unauthorized' })).toBe(true);
            expect(isPermanentFailure({ status: 500 })).toBe(false);
            expect(isPermanentFailure({ message: 'network error' })).toBe(false);
        });
    });
});