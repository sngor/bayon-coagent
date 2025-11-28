/**
 * useNotifications Hook
 * 
 * React hook for managing notification state and interactions.
 * Provides real-time updates, read/dismiss actions, and filtering.
 * Validates Requirements: 2.1, 2.3, 2.5
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Notification, NotificationStatus, NotificationType } from "../types";
import { useNotificationStream } from "./use-notification-stream";

/**
 * Hook Options
 */
interface UseNotificationsOptions {
    /**
     * User ID to fetch notifications for
     */
    userId: string;

    /**
     * Whether to automatically fetch notifications on mount
     * @default true
     */
    autoFetch?: boolean;

    /**
     * Whether to connect to real-time stream
     * @default true
     */
    enableRealtime?: boolean;

    /**
     * Filter by notification types
     */
    types?: NotificationType[];

    /**
     * Filter by notification status
     */
    status?: NotificationStatus[];

    /**
     * Maximum number of notifications to display
     */
    limit?: number;

    /**
     * Whether to show only unread notifications
     * @default false
     */
    unreadOnly?: boolean;
}

/**
 * Hook Return Value
 */
interface UseNotificationsReturn {
    /**
     * Array of notifications
     */
    notifications: Notification[];

    /**
     * Number of unread notifications
     */
    unreadCount: number;

    /**
     * Whether notifications are currently loading
     */
    isLoading: boolean;

    /**
     * Error if any occurred
     */
    error: Error | null;

    /**
     * Whether real-time stream is connected
     */
    isConnected: boolean;

    /**
     * Mark a notification as read
     */
    markAsRead: (notificationId: string) => Promise<void>;

    /**
     * Mark all notifications as read
     */
    markAllAsRead: () => Promise<void>;

    /**
     * Dismiss a notification
     */
    dismiss: (notificationId: string) => Promise<void>;

    /**
     * Refresh notifications from server
     */
    refresh: () => Promise<void>;

    /**
     * Filter notifications by criteria
     */
    filter: (criteria: {
        types?: NotificationType[];
        status?: NotificationStatus[];
        unreadOnly?: boolean;
    }) => void;

    /**
     * Clear all filters
     */
    clearFilters: () => void;
}

/**
 * useNotifications
 * 
 * Main hook for managing notifications in React components.
 * Handles fetching, real-time updates, and user interactions.
 * 
 * @param options Hook options
 * @returns Notification state and actions
 * 
 * @example
 * ```tsx
 * const {
 *   notifications,
 *   unreadCount,
 *   markAsRead,
 *   dismiss,
 * } = useNotifications({ userId: 'user-123' });
 * 
 * return (
 *   <div>
 *     <Badge>{unreadCount}</Badge>
 *     {notifications.map(notification => (
 *       <NotificationItem
 *         key={notification.id}
 *         notification={notification}
 *         onRead={() => markAsRead(notification.id)}
 *         onDismiss={() => dismiss(notification.id)}
 *       />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function useNotifications(
    options: UseNotificationsOptions
): UseNotificationsReturn {
    const {
        userId,
        autoFetch = true,
        enableRealtime = true,
        types: initialTypes,
        status: initialStatus,
        limit,
        unreadOnly: initialUnreadOnly = false,
    } = options;

    // State
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    // Filter state
    const [filterTypes, setFilterTypes] = useState<NotificationType[] | undefined>(
        initialTypes
    );
    const [filterStatus, setFilterStatus] = useState<NotificationStatus[] | undefined>(
        initialStatus
    );
    const [filterUnreadOnly, setFilterUnreadOnly] = useState(initialUnreadOnly);

    /**
     * Fetches notifications from the server
     */
    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (filterTypes) {
                params.append("types", filterTypes.join(","));
            }
            if (filterStatus) {
                params.append("status", filterStatus.join(","));
            }
            if (limit) {
                params.append("limit", limit.toString());
            }
            if (filterUnreadOnly) {
                params.append("unreadOnly", "true");
            }

            const response = await fetch(
                `/api/notifications?userId=${userId}&${params.toString()}`
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch notifications: ${response.statusText}`);
            }

            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (err) {
            const fetchError =
                err instanceof Error ? err : new Error("Failed to fetch notifications");
            setError(fetchError);
            console.error("[useNotifications] Fetch error:", fetchError);
        } finally {
            setIsLoading(false);
        }
    }, [userId, filterTypes, filterStatus, limit, filterUnreadOnly]);

    /**
     * Handles incoming real-time notifications
     */
    const handleNewNotification = useCallback(
        (notification: Notification) => {
            // Only add if it matches current filters
            if (filterTypes && !filterTypes.includes(notification.type)) {
                return;
            }
            if (filterStatus && !filterStatus.includes(notification.status)) {
                return;
            }
            if (filterUnreadOnly && notification.status === NotificationStatus.READ) {
                return;
            }

            setNotifications((prev) => {
                // Check if notification already exists
                const exists = prev.some((n) => n.id === notification.id);
                if (exists) {
                    // Update existing notification
                    return prev.map((n) =>
                        n.id === notification.id ? notification : n
                    );
                } else {
                    // Add new notification at the beginning
                    const updated = [notification, ...prev];
                    // Apply limit if specified
                    return limit ? updated.slice(0, limit) : updated;
                }
            });
        },
        [filterTypes, filterStatus, filterUnreadOnly, limit]
    );

    /**
     * Connect to real-time stream
     */
    const { isConnected } = useNotificationStream(
        enableRealtime
            ? {
                onNotification: handleNewNotification,
                onError: (err) => {
                    console.error("[useNotifications] Stream error:", err);
                },
            }
            : {}
    );

    /**
     * Mark a notification as read
     * Validates Requirements: 2.3
     */
    const markAsRead = useCallback(
        async (notificationId: string) => {
            try {
                const response = await fetch(`/api/notifications/${notificationId}/read`, {
                    method: "POST",
                });

                if (!response.ok) {
                    throw new Error(`Failed to mark as read: ${response.statusText}`);
                }

                // Optimistically update local state
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === notificationId
                            ? {
                                ...n,
                                status: NotificationStatus.READ,
                                readAt: new Date().toISOString(),
                            }
                            : n
                    )
                );
            } catch (err) {
                const readError =
                    err instanceof Error ? err : new Error("Failed to mark as read");
                setError(readError);
                console.error("[useNotifications] Mark as read error:", readError);
                throw readError;
            }
        },
        []
    );

    /**
     * Mark all notifications as read
     * Validates Requirements: 2.3
     */
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch(`/api/notifications/read-all`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to mark all as read: ${response.statusText}`);
            }

            // Optimistically update local state
            setNotifications((prev) =>
                prev.map((n) => ({
                    ...n,
                    status: NotificationStatus.READ,
                    readAt: n.readAt || new Date().toISOString(),
                }))
            );
        } catch (err) {
            const readAllError =
                err instanceof Error ? err : new Error("Failed to mark all as read");
            setError(readAllError);
            console.error("[useNotifications] Mark all as read error:", readAllError);
            throw readAllError;
        }
    }, [userId]);

    /**
     * Dismiss a notification
     * Validates Requirements: 2.5
     */
    const dismiss = useCallback(async (notificationId: string) => {
        try {
            const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error(`Failed to dismiss: ${response.statusText}`);
            }

            // Remove from local state
            setNotifications((prev) =>
                prev.filter((n) => n.id !== notificationId)
            );
        } catch (err) {
            const dismissError =
                err instanceof Error ? err : new Error("Failed to dismiss notification");
            setError(dismissError);
            console.error("[useNotifications] Dismiss error:", dismissError);
            throw dismissError;
        }
    }, []);

    /**
     * Refresh notifications from server
     */
    const refresh = useCallback(async () => {
        await fetchNotifications();
    }, [fetchNotifications]);

    /**
     * Filter notifications by criteria
     */
    const filter = useCallback(
        (criteria: {
            types?: NotificationType[];
            status?: NotificationStatus[];
            unreadOnly?: boolean;
        }) => {
            if (criteria.types !== undefined) {
                setFilterTypes(criteria.types);
            }
            if (criteria.status !== undefined) {
                setFilterStatus(criteria.status);
            }
            if (criteria.unreadOnly !== undefined) {
                setFilterUnreadOnly(criteria.unreadOnly);
            }
        },
        []
    );

    /**
     * Clear all filters
     */
    const clearFilters = useCallback(() => {
        setFilterTypes(undefined);
        setFilterStatus(undefined);
        setFilterUnreadOnly(false);
    }, []);

    /**
     * Calculate unread count
     * Validates Requirements: 2.2
     */
    const unreadCount = useMemo(() => {
        return notifications.filter(
            (n) =>
                n.status !== NotificationStatus.READ &&
                n.status !== NotificationStatus.DISMISSED
        ).length;
    }, [notifications]);

    /**
     * Sort notifications by creation time (most recent first)
     * Validates Requirements: 2.4
     */
    const sortedNotifications = useMemo(() => {
        return [...notifications].sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [notifications]);

    // Fetch notifications on mount or when filters change
    useEffect(() => {
        if (autoFetch) {
            fetchNotifications();
        }
    }, [autoFetch, fetchNotifications]);

    return {
        notifications: sortedNotifications,
        unreadCount,
        isLoading,
        error,
        isConnected: enableRealtime ? isConnected : false,
        markAsRead,
        markAllAsRead,
        dismiss,
        refresh,
        filter,
        clearFilters,
    };
}
