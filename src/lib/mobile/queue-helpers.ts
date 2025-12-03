/**
 * Queue Helper Functions
 * 
 * Utility functions for working with the offline queue.
 * 
 * Requirements: 2.4, 6.2
 */

import { offlineQueue, type OperationType } from './offline-queue';
import { connectivityMonitor } from './connectivity-monitor';

/**
 * Execute operation with automatic offline queuing
 * 
 * If online, executes immediately. If offline, queues for later sync.
 */
export async function executeOrQueue<T>(
    type: OperationType,
    payload: any,
    onlineExecutor: () => Promise<T>
): Promise<T | string> {
    const isOnline = connectivityMonitor.isOnline();

    if (isOnline) {
        try {
            return await onlineExecutor();
        } catch (error) {
            // If execution fails due to network, queue it
            if (isNetworkError(error)) {
                console.log('[QueueHelper] Network error, queuing operation');
                return await offlineQueue.enqueue(type, payload);
            }
            throw error;
        }
    } else {
        // Queue for later sync
        console.log('[QueueHelper] Offline, queuing operation');
        return await offlineQueue.enqueue(type, payload);
    }
}

/**
 * Check if error is a network error
 */
function isNetworkError(error: any): boolean {
    if (!error) return false;

    // Check for common network error indicators
    const message = error.message?.toLowerCase() || '';
    return (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        error.name === 'NetworkError' ||
        error.name === 'TypeError'
    );
}

/**
 * Wrap a server action with offline queue support
 */
export function withOfflineQueue<T extends any[], R>(
    type: OperationType,
    action: (...args: T) => Promise<R>
) {
    return async (...args: T): Promise<R | string> => {
        return executeOrQueue(
            type,
            { args },
            () => action(...args)
        );
    };
}

/**
 * Create a queued operation payload
 */
export function createQueuePayload(data: any): any {
    return {
        ...data,
        queuedAt: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
}

/**
 * Check if result is a queue ID (operation was queued)
 */
export function isQueuedResult(result: any): result is string {
    return typeof result === 'string' && result.length === 36; // UUID length
}

/**
 * Get user-friendly message for queued operation
 */
export function getQueuedMessage(type: OperationType): string {
    const messages: Record<OperationType, string> = {
        'capture-photo': 'Photo capture saved. Will sync when online.',
        'capture-voice': 'Voice recording saved. Will sync when online.',
        'capture-text': 'Text saved. Will sync when online.',
        'quick-action': 'Action saved. Will execute when online.',
        'voice-note': 'Voice note saved. Will sync when online.',
        'property-share': 'Share saved. Will send when online.',
        'check-in': 'Check-in saved. Will sync when online.',
        'content-create': 'Content saved. Will create when online.',
        'content-update': 'Changes saved. Will update when online.',
        'content-delete': 'Deletion saved. Will delete when online.',
    };

    return messages[type] || 'Operation saved. Will sync when online.';
}
