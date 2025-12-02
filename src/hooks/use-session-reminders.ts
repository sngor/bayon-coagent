/**
 * React hook for managing open house session reminders
 * Validates Requirements: 9.2, 9.3
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { OpenHouseSession } from '@/lib/open-house/types';
import {
    createSessionStartReminder,
    shouldSendStartReminder,
    sendBrowserNotification,
    storeNotification,
    getStoredNotifications,
    OpenHouseNotification,
} from '@/lib/open-house/notifications';

interface UseSessionRemindersOptions {
    /**
     * How often to check for upcoming sessions (in milliseconds)
     * Default: 5 minutes
     */
    checkInterval?: number;

    /**
     * Whether to automatically request notification permission
     * Default: false
     */
    autoRequestPermission?: boolean;
}

interface UseSessionRemindersReturn {
    /**
     * Stored notifications
     */
    notifications: OpenHouseNotification[];

    /**
     * Whether notifications are enabled
     */
    notificationsEnabled: boolean;

    /**
     * Request notification permission
     */
    requestPermission: () => Promise<boolean>;

    /**
     * Clear all notifications
     */
    clearNotifications: () => void;

    /**
     * Manually check for upcoming sessions
     */
    checkUpcomingSessions: (sessions: OpenHouseSession[]) => void;
}

/**
 * Hook for managing session start reminders
 */
export function useSessionReminders(
    sessions: OpenHouseSession[],
    options: UseSessionRemindersOptions = {}
): UseSessionRemindersReturn {
    const {
        checkInterval = 5 * 60 * 1000, // 5 minutes
        autoRequestPermission = false,
    } = options;

    const [notifications, setNotifications] = useState<OpenHouseNotification[]>([]);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());

    // Check notification permission status
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setNotificationsEnabled(Notification.permission === 'granted');

            if (autoRequestPermission && Notification.permission === 'default') {
                requestPermission();
            }
        }
    }, [autoRequestPermission]);

    // Load stored notifications on mount
    useEffect(() => {
        const stored = getStoredNotifications();
        setNotifications(stored);
    }, []);

    /**
     * Request notification permission from user
     */
    const requestPermission = useCallback(async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            console.warn('Browser does not support notifications');
            return false;
        }

        if (Notification.permission === 'granted') {
            setNotificationsEnabled(true);
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            const granted = permission === 'granted';
            setNotificationsEnabled(granted);
            return granted;
        }

        return false;
    }, []);

    /**
     * Clear all notifications
     */
    const clearNotifications = useCallback(() => {
        setNotifications([]);
        if (typeof window !== 'undefined') {
            localStorage.removeItem('openhouse_notifications');
        }
    }, []);

    /**
     * Check sessions for upcoming reminders
     */
    const checkUpcomingSessions = useCallback((sessionsToCheck: OpenHouseSession[]) => {
        const now = new Date();

        sessionsToCheck.forEach((session) => {
            // Skip if we've already sent a reminder for this session
            if (sentReminders.has(session.sessionId)) {
                return;
            }

            // Check if session needs a reminder
            if (shouldSendStartReminder(session)) {
                const notification = createSessionStartReminder(session);

                // Store notification
                storeNotification(notification);
                setNotifications((prev) => [notification, ...prev]);

                // Send browser notification if enabled
                if (notificationsEnabled) {
                    sendBrowserNotification(notification);
                }

                // Mark as sent
                setSentReminders((prev) => new Set(prev).add(session.sessionId));
            }
        });
    }, [notificationsEnabled, sentReminders]);

    // Periodically check for upcoming sessions
    useEffect(() => {
        // Initial check
        checkUpcomingSessions(sessions);

        // Set up interval for periodic checks
        const interval = setInterval(() => {
            checkUpcomingSessions(sessions);
        }, checkInterval);

        return () => clearInterval(interval);
    }, [sessions, checkInterval, checkUpcomingSessions]);

    // Clean up sent reminders for sessions that have started or been cancelled
    useEffect(() => {
        const activeSessionIds = new Set(
            sessions
                .filter((s) => s.status === 'scheduled')
                .map((s) => s.sessionId)
        );

        setSentReminders((prev) => {
            const updated = new Set<string>();
            prev.forEach((id) => {
                if (activeSessionIds.has(id)) {
                    updated.add(id);
                }
            });
            return updated;
        });
    }, [sessions]);

    return {
        notifications,
        notificationsEnabled,
        requestPermission,
        clearNotifications,
        checkUpcomingSessions,
    };
}

/**
 * Hook for countdown timer to session start
 */
export function useSessionCountdown(scheduledStartTime: string) {
    const [timeRemaining, setTimeRemaining] = useState<string>('');
    const [isStartingSoon, setIsStartingSoon] = useState(false);

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date();
            const scheduledTime = new Date(scheduledStartTime);
            const diffMs = scheduledTime.getTime() - now.getTime();

            if (diffMs < 0) {
                setTimeRemaining('Started');
                setIsStartingSoon(false);
                return;
            }

            const diffMinutes = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMinutes / 60);
            const diffDays = Math.floor(diffHours / 24);

            // Check if starting within 1 hour
            setIsStartingSoon(diffMs <= 60 * 60 * 1000);

            if (diffDays > 0) {
                const remainingHours = diffHours % 24;
                setTimeRemaining(
                    `${diffDays}d ${remainingHours}h`
                );
            } else if (diffHours > 0) {
                const remainingMinutes = diffMinutes % 60;
                setTimeRemaining(
                    `${diffHours}h ${remainingMinutes}m`
                );
            } else if (diffMinutes > 0) {
                setTimeRemaining(`${diffMinutes}m`);
            } else {
                setTimeRemaining('Starting now');
            }
        };

        // Initial update
        updateCountdown();

        // Update every minute
        const interval = setInterval(updateCountdown, 60000);

        return () => clearInterval(interval);
    }, [scheduledStartTime]);

    return { timeRemaining, isStartingSoon };
}
