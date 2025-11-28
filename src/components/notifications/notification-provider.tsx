/**
 * NotificationProvider Component
 * 
 * React context provider for global notification state.
 * Provides notifications, preferences, and actions to all child components.
 * Validates Requirements: 2.1, 3.1
 */

"use client";

import { createContext, useContext, ReactNode } from "react";
import { useNotifications } from "@/lib/notifications/hooks";
import {
    Notification,
    NotificationPreferences,
    NotificationStatus,
    NotificationType,
} from "@/lib/notifications/types";

/**
 * Notification Context Value
 */
interface NotificationContextValue {
    /**
     * Array of notifications
     */
    notifications: Notification[];

    /**
     * Number of unread notifications
     */
    unreadCount: number;

    /**
     * Whether notifications are loading
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
     * Filter notifications
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
 * Notification Context
 */
const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * NotificationProvider Props
 */
interface NotificationProviderProps {
    /**
     * User ID to fetch notifications for
     */
    userId: string;

    /**
     * Child components
     */
    children: ReactNode;

    /**
     * Whether to enable real-time updates
     * @default true
     */
    enableRealtime?: boolean;

    /**
     * Maximum number of notifications to keep in memory
     * @default 50
     */
    maxNotifications?: number;
}

/**
 * NotificationProvider
 * 
 * Provides notification state and actions to all child components.
 * Wraps the application or specific sections that need notification access.
 * 
 * @example
 * ```tsx
 * // In your app layout or root component
 * <NotificationProvider userId={user.id}>
 *   <YourApp />
 * </NotificationProvider>
 * 
 * // In any child component
 * const { notifications, unreadCount, markAsRead } = useNotificationContext();
 * ```
 */
export function NotificationProvider({
    userId,
    children,
    enableRealtime = true,
    maxNotifications = 50,
}: NotificationProviderProps) {
    const notificationState = useNotifications({
        userId,
        enableRealtime,
        limit: maxNotifications,
    });

    return (
        <NotificationContext.Provider value={notificationState}>
            {children}
        </NotificationContext.Provider>
    );
}

/**
 * useNotificationContext
 * 
 * Hook to access notification context.
 * Must be used within a NotificationProvider.
 * 
 * @returns Notification context value
 * @throws Error if used outside NotificationProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { notifications, unreadCount, markAsRead } = useNotificationContext();
 *   
 *   return (
 *     <div>
 *       <Badge>{unreadCount}</Badge>
 *       {notifications.map(notification => (
 *         <div key={notification.id} onClick={() => markAsRead(notification.id)}>
 *           {notification.title}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useNotificationContext(): NotificationContextValue {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error(
            "useNotificationContext must be used within a NotificationProvider"
        );
    }

    return context;
}
