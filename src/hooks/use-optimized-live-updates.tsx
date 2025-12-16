'use client';

/**
 * Optimized Live Updates Hook
 * Performance-focused version with better memory management and batching
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useWebSocket } from './use-websocket';
import {
    LiveUpdateData,
    ContentStatus,
    LiveUpdateHandler,
    TypedWebSocketMessage
} from '@/types/realtime';

// Batch update configuration
const BATCH_UPDATE_DELAY = 100; // ms
const MAX_RECENT_UPDATES = 50;
const CONTENT_STATUS_CACHE_SIZE = 1000;

export interface OptimizedUseLiveUpdatesReturn {
    // Connection status
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;

    // Content status tracking with LRU cache
    getContentStatus: (contentId: string) => ContentStatus | null;

    // Batched update methods
    updateContentStatus: (contentId: string, status: string, progress?: number, metadata?: any) => void;
    updateProjectStatus: (projectId: string, status: string, metadata?: any) => void;
    updateUserStatus: (status: string, metadata?: any) => void;

    // Event handlers with cleanup
    onLiveUpdate: (callback: LiveUpdateHandler) => () => void;

    // Recent updates with pagination
    recentUpdates: LiveUpdateData[];
    hasMoreUpdates: boolean;
    loadMoreUpdates: () => void;
    clearRecentUpdates: () => void;

    // Performance metrics
    metrics: {
        totalUpdates: number;
        updatesPerSecond: number;
        averageProcessingTime: number;
    };
}

// LRU Cache implementation for content statuses
class LRUCache<K, V> {
    private cache = new Map<K, V>();
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // Move to end (most recently used)
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            // Remove least recently used (first item)
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }

    clear(): void {
        this.cache.clear();
    }
}

export function useOptimizedLiveUpdates(): OptimizedUseLiveUpdatesReturn {
    // Use LRU cache for content statuses
    const contentStatusCache = useRef(new LRUCache<string, ContentStatus>(CONTENT_STATUS_CACHE_SIZE));
    const [recentUpdates, setRecentUpdates] = useState<LiveUpdateData[]>([]);
    const [hasMoreUpdates, setHasMoreUpdates] = useState(false);

    // Performance tracking
    const [metrics, setMetrics] = useState({
        totalUpdates: 0,
        updatesPerSecond: 0,
        averageProcessingTime: 0
    });

    // Refs for batching and performance
    const updateCallbacksRef = useRef<Set<LiveUpdateHandler>>(new Set());
    const batchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pendingUpdatesRef = useRef<LiveUpdateData[]>([]);
    const performanceRef = useRef({
        updateTimes: [] as number[],
        lastSecondUpdates: 0,
        lastSecondTimestamp: Date.now()
    });

    // Batched update processing
    const processBatchedUpdates = useCallback(() => {
        if (pendingUpdatesRef.current.length === 0) return;

        const startTime = performance.now();
        const updates = [...pendingUpdatesRef.current];
        pendingUpdatesRef.current = [];

        // Process all pending updates
        updates.forEach(update => {
            // Update content status cache if it's a content update
            if (update.resourceType === 'content') {
                const existing = contentStatusCache.current.get(update.resourceId);

                contentStatusCache.current.set(update.resourceId, {
                    contentId: update.resourceId,
                    status: update.status as ContentStatus,
                    progress: update.progress || 0,
                    stage: update.metadata?.stage,
                    error: update.metadata?.error,
                    lastUpdated: update.timestamp,
                    ...existing // Preserve any existing data
                });
            }

            // Notify callbacks
            updateCallbacksRef.current.forEach(callback => {
                try {
                    callback(update);
                } catch (error) {
                    console.error('Error in live update callback:', error);
                }
            });
        });

        // Update recent updates (keep only latest)
        setRecentUpdates(prev => {
            const combined = [...updates, ...prev];
            return combined.slice(0, MAX_RECENT_UPDATES);
        });

        // Update performance metrics
        const processingTime = performance.now() - startTime;
        performanceRef.current.updateTimes.push(processingTime);

        // Keep only last 100 measurements for average
        if (performanceRef.current.updateTimes.length > 100) {
            performanceRef.current.updateTimes = performanceRef.current.updateTimes.slice(-100);
        }

        const now = Date.now();
        if (now - performanceRef.current.lastSecondTimestamp >= 1000) {
            setMetrics(prev => ({
                totalUpdates: prev.totalUpdates + updates.length,
                updatesPerSecond: performanceRef.current.lastSecondUpdates,
                averageProcessingTime: performanceRef.current.updateTimes.reduce((a, b) => a + b, 0) / performanceRef.current.updateTimes.length
            }));

            performanceRef.current.lastSecondUpdates = 0;
            performanceRef.current.lastSecondTimestamp = now;
        } else {
            performanceRef.current.lastSecondUpdates += updates.length;
        }

        batchTimeoutRef.current = null;
    }, []);

    // Optimized message handler with batching
    const handleWebSocketMessage = useCallback((wsMessage: TypedWebSocketMessage) => {
        switch (wsMessage.type) {
            case 'liveUpdate':
                const update: LiveUpdateData = {
                    resourceType: wsMessage.data.resourceType,
                    resourceId: wsMessage.data.resourceId,
                    status: wsMessage.data.status,
                    progress: wsMessage.data.progress,
                    metadata: wsMessage.data.metadata || {},
                    updatedBy: wsMessage.data.updatedBy,
                    timestamp: wsMessage.data.timestamp
                };

                // Add to pending updates for batching
                pendingUpdatesRef.current.push(update);

                // Schedule batch processing if not already scheduled
                if (!batchTimeoutRef.current) {
                    batchTimeoutRef.current = setTimeout(processBatchedUpdates, BATCH_UPDATE_DELAY);
                }
                break;

            case 'updateConfirmation':
                console.log('Update confirmed:', wsMessage.data);
                break;

            case 'error':
                console.error('Live update error:', wsMessage.message || 'Unknown error');
                break;
        }
    }, [processBatchedUpdates]);

    const {
        isConnected,
        isConnecting,
        connectionError,
        updateStatus
    } = useWebSocket(handleWebSocketMessage);

    // Memoized content status getter
    const getContentStatus = useCallback((contentId: string): ContentStatus | null => {
        return contentStatusCache.current.get(contentId) || null;
    }, []);

    // Optimistic update methods with debouncing
    const updateContentStatus = useCallback((
        contentId: string,
        status: string,
        progress: number = 0,
        metadata: any = {}
    ) => {
        // Update cache optimistically
        const existing = contentStatusCache.current.get(contentId);
        contentStatusCache.current.set(contentId, {
            contentId,
            status: status as ContentStatus,
            progress,
            stage: metadata.stage,
            error: metadata.error,
            lastUpdated: Date.now(),
            ...existing
        });

        // Send update via WebSocket
        updateStatus('content', contentId, status, {
            progress,
            ...metadata
        });
    }, [updateStatus]);

    const updateProjectStatus = useCallback((
        projectId: string,
        status: string,
        metadata: any = {}
    ) => {
        updateStatus('project', projectId, status, metadata);
    }, [updateStatus]);

    const updateUserStatus = useCallback((
        status: string,
        metadata: any = {}
    ) => {
        updateStatus('user', 'current', status, metadata);
    }, [updateStatus]);

    // Event handler management with automatic cleanup
    const onLiveUpdate = useCallback((callback: LiveUpdateHandler) => {
        updateCallbacksRef.current.add(callback);

        return () => {
            updateCallbacksRef.current.delete(callback);
        };
    }, []);

    // Pagination for recent updates
    const loadMoreUpdates = useCallback(() => {
        // TODO: Implement loading more updates from server
        setHasMoreUpdates(false);
    }, []);

    const clearRecentUpdates = useCallback(() => {
        setRecentUpdates([]);
        setHasMoreUpdates(false);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            updateCallbacksRef.current.clear();
            contentStatusCache.current.clear();
            if (batchTimeoutRef.current) {
                clearTimeout(batchTimeoutRef.current);
            }
        };
    }, []);

    return {
        isConnected,
        isConnecting,
        connectionError,
        getContentStatus,
        updateContentStatus,
        updateProjectStatus,
        updateUserStatus,
        onLiveUpdate,
        recentUpdates,
        hasMoreUpdates,
        loadMoreUpdates,
        clearRecentUpdates,
        metrics
    };
}