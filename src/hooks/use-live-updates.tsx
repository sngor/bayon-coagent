'use client';

/**
 * Live Updates Hook
 * Provides real-time status updates for content, projects, and system events
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket, WebSocketMessage } from './use-websocket';

export interface LiveUpdate {
    resourceType: 'content' | 'project' | 'user' | 'system';
    resourceId: string;
    status: string;
    progress?: number;
    metadata?: {
        stage?: string;
        error?: string;
        completedSteps?: string[];
        totalSteps?: number;
        estimatedCompletion?: number;
    };
    updatedBy: string;
    timestamp: number;
}

export interface ContentStatus {
    contentId: string;
    status: 'draft' | 'generating' | 'reviewing' | 'published' | 'failed';
    progress: number;
    stage?: string;
    error?: string;
    lastUpdated: number;
}

export interface UseLiveUpdatesReturn {
    // Connection status
    isConnected: boolean;
    isConnecting: boolean;
    connectionError: string | null;

    // Content status tracking
    contentStatuses: Map<string, ContentStatus>;
    getContentStatus: (contentId: string) => ContentStatus | null;

    // Update methods
    updateContentStatus: (contentId: string, status: string, progress?: number, metadata?: any) => void;
    updateProjectStatus: (projectId: string, status: string, metadata?: any) => void;
    updateUserStatus: (status: string, metadata?: any) => void;

    // Event handlers
    onLiveUpdate: (callback: (update: LiveUpdate) => void) => () => void;

    // Recent updates
    recentUpdates: LiveUpdate[];
    clearRecentUpdates: () => void;
}

export function useLiveUpdates(): UseLiveUpdatesReturn {
    const [contentStatuses, setContentStatuses] = useState<Map<string, ContentStatus>>(new Map());
    const [recentUpdates, setRecentUpdates] = useState<LiveUpdate[]>([]);

    const updateCallbacksRef = useRef<Set<(update: LiveUpdate) => void>>(new Set());

    const handleWebSocketMessage = useCallback((wsMessage: WebSocketMessage) => {
        switch (wsMessage.type) {
            case 'liveUpdate':
                const update: LiveUpdate = {
                    resourceType: wsMessage.data.resourceType,
                    resourceId: wsMessage.data.resourceId,
                    status: wsMessage.data.status,
                    progress: wsMessage.data.progress,
                    metadata: wsMessage.data.metadata || {},
                    updatedBy: wsMessage.data.updatedBy,
                    timestamp: wsMessage.data.timestamp
                };

                // Update content status if it's a content update
                if (update.resourceType === 'content') {
                    setContentStatuses(prev => {
                        const newMap = new Map(prev);
                        const existing = newMap.get(update.resourceId);

                        newMap.set(update.resourceId, {
                            contentId: update.resourceId,
                            status: update.status as any,
                            progress: update.progress || 0,
                            stage: update.metadata?.stage,
                            error: update.metadata?.error,
                            lastUpdated: update.timestamp,
                            ...existing // Preserve any existing data
                        });

                        return newMap;
                    });
                }

                // Add to recent updates
                setRecentUpdates(prev => {
                    const newUpdates = [update, ...prev.slice(0, 49)]; // Keep last 50 updates
                    return newUpdates;
                });

                // Notify callbacks
                updateCallbacksRef.current.forEach(callback => {
                    try {
                        callback(update);
                    } catch (error) {
                        console.error('Error in live update callback:', error);
                    }
                });
                break;

            case 'updateConfirmation':
                console.log('Update confirmed:', wsMessage.data);
                break;

            case 'error':
                console.error('Live update error:', wsMessage.message);
                break;
        }
    }, []);

    const {
        isConnected,
        isConnecting,
        connectionError,
        updateStatus
    } = useWebSocket(handleWebSocketMessage);

    const getContentStatus = useCallback((contentId: string): ContentStatus | null => {
        return contentStatuses.get(contentId) || null;
    }, [contentStatuses]);

    const updateContentStatus = useCallback((
        contentId: string,
        status: string,
        progress: number = 0,
        metadata: any = {}
    ) => {
        // Update local state optimistically
        setContentStatuses(prev => {
            const newMap = new Map(prev);
            const existing = newMap.get(contentId);

            newMap.set(contentId, {
                contentId,
                status: status as any,
                progress,
                stage: metadata.stage,
                error: metadata.error,
                lastUpdated: Date.now(),
                ...existing
            });

            return newMap;
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

    const onLiveUpdate = useCallback((callback: (update: LiveUpdate) => void) => {
        updateCallbacksRef.current.add(callback);

        // Return cleanup function
        return () => {
            updateCallbacksRef.current.delete(callback);
        };
    }, []);

    const clearRecentUpdates = useCallback(() => {
        setRecentUpdates([]);
    }, []);

    // Cleanup callbacks on unmount
    useEffect(() => {
        return () => {
            updateCallbacksRef.current.clear();
        };
    }, []);

    return {
        isConnected,
        isConnecting,
        connectionError,
        contentStatuses,
        getContentStatus,
        updateContentStatus,
        updateProjectStatus,
        updateUserStatus,
        onLiveUpdate,
        recentUpdates,
        clearRecentUpdates
    };
}