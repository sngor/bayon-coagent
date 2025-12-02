/**
 * Open House Notification System
 * 
 * Handles session start reminders and notifications
 * Validates Requirements: 9.2, 9.3
 */

import { OpenHouseSession } from './types';

/**
 * Notification types for open house events
 */
export enum NotificationType {
    SESSION_STARTING_SOON = 'session_starting_soon',
    SESSION_STARTED = 'session_started',
    SESSION_ENDED = 'session_ended',
    MILESTONE_REACHED = 'milestone_reached',
}

/**
 * Notification data structure
 */
export interface OpenHouseNotification {
    type: NotificationType;
    sessionId: string;
    title: string;
    message: string;
    timestamp: string;
    actionUrl?: string;
}

/**
 * Creates a session start reminder notification
 * Validates Requirements: 9.3
 */
export function createSessionStartReminder(
    session: OpenHouseSession
): OpenHouseNotification {
    const scheduledTime = new Date(session.scheduledStartTime);
    const now = new Date();
    const minutesUntilStart = Math.round(
        (scheduledTime.getTime() - now.getTime()) / 60000
    );

    return {
        type: NotificationType.SESSION_STARTING_SOON,
        sessionId: session.sessionId,
        title: 'Open House Starting Soon',
        message: `Your open house at ${session.propertyAddress} starts in ${minutesUntilStart} minutes.`,
        timestamp: now.toISOString(),
        actionUrl: `/open-house/sessions/${session.sessionId}`,
    };
}

/**
 * Creates a session started notification
 */
export function createSessionStartedNotification(
    session: OpenHouseSession
): OpenHouseNotification {
    return {
        type: NotificationType.SESSION_STARTED,
        sessionId: session.sessionId,
        title: 'Open House Started',
        message: `Your open house at ${session.propertyAddress} has started.`,
        timestamp: new Date().toISOString(),
        actionUrl: `/open-house/sessions/${session.sessionId}/check-in`,
    };
}

/**
 * Creates a session ended notification
 */
export function createSessionEndedNotification(
    session: OpenHouseSession,
    visitorCount: number
): OpenHouseNotification {
    return {
        type: NotificationType.SESSION_ENDED,
        sessionId: session.sessionId,
        title: 'Open House Ended',
        message: `Your open house at ${session.propertyAddress} has ended with ${visitorCount} visitor${visitorCount !== 1 ? 's' : ''}.`,
        timestamp: new Date().toISOString(),
        actionUrl: `/open-house/sessions/${session.sessionId}`,
    };
}

/**
 * Creates a milestone notification
 * Validates Requirements: 11.5
 */
export function createMilestoneNotification(
    session: OpenHouseSession,
    milestone: 'visitors_10' | 'visitors_25' | 'visitors_50' | 'hour_1' | 'hour_2'
): OpenHouseNotification {
    const milestoneMessages = {
        visitors_10: '10 visitors have checked in!',
        visitors_25: '25 visitors have checked in!',
        visitors_50: '50 visitors have checked in!',
        hour_1: 'Your open house has been running for 1 hour.',
        hour_2: 'Your open house has been running for 2 hours.',
    };

    return {
        type: NotificationType.MILESTONE_REACHED,
        sessionId: session.sessionId,
        title: 'Milestone Reached! 🎉',
        message: milestoneMessages[milestone],
        timestamp: new Date().toISOString(),
        actionUrl: `/open-house/sessions/${session.sessionId}`,
    };
}

/**
 * Checks if a session should trigger a start reminder
 * Returns true if session starts within the next hour
 */
export function shouldSendStartReminder(session: OpenHouseSession): boolean {
    const now = new Date();
    const scheduledTime = new Date(session.scheduledStartTime);
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const oneHour = 60 * 60 * 1000;

    // Session starts within the next hour and hasn't started yet
    return timeDiff > 0 && timeDiff <= oneHour && session.status === 'scheduled';
}

/**
 * Formats time until session starts
 */
export function formatTimeUntilStart(scheduledStartTime: string): string {
    const now = new Date();
    const scheduledTime = new Date(scheduledStartTime);
    const diffMs = scheduledTime.getTime() - now.getTime();

    if (diffMs < 0) {
        return 'Started';
    }

    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else {
        return 'Starting now';
    }
}

/**
 * Checks if a milestone should be triggered
 */
export function checkMilestone(
    visitorCount: number,
    durationMinutes: number,
    previousVisitorCount: number,
    previousDurationMinutes: number
): 'visitors_10' | 'visitors_25' | 'visitors_50' | 'hour_1' | 'hour_2' | null {
    // Check visitor milestones
    if (visitorCount >= 50 && previousVisitorCount < 50) {
        return 'visitors_50';
    }
    if (visitorCount >= 25 && previousVisitorCount < 25) {
        return 'visitors_25';
    }
    if (visitorCount >= 10 && previousVisitorCount < 10) {
        return 'visitors_10';
    }

    // Check duration milestones
    if (durationMinutes >= 120 && previousDurationMinutes < 120) {
        return 'hour_2';
    }
    if (durationMinutes >= 60 && previousDurationMinutes < 60) {
        return 'hour_1';
    }

    return null;
}

/**
 * Browser notification API wrapper
 * Sends browser push notification if permission granted
 */
export async function sendBrowserNotification(
    notification: OpenHouseNotification
): Promise<boolean> {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
        console.warn('Browser does not support notifications');
        return false;
    }

    // Check permission
    if (Notification.permission === 'granted') {
        try {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/icon-192x192.svg',
                badge: '/icon-192x192.svg',
                tag: notification.sessionId,
                requireInteraction: false,
            });

            // Handle notification click
            if (notification.actionUrl) {
                browserNotification.onclick = () => {
                    window.focus();
                    window.location.href = notification.actionUrl!;
                    browserNotification.close();
                };
            }

            return true;
        } catch (error) {
            console.error('Failed to send browser notification:', error);
            return false;
        }
    } else if (Notification.permission !== 'denied') {
        // Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            return sendBrowserNotification(notification);
        }
    }

    return false;
}

/**
 * Stores notification in local storage for display in UI
 */
export function storeNotification(notification: OpenHouseNotification): void {
    try {
        const stored = localStorage.getItem('openhouse_notifications');
        const notifications: OpenHouseNotification[] = stored ? JSON.parse(stored) : [];

        // Add new notification
        notifications.unshift(notification);

        // Keep only last 50 notifications
        const trimmed = notifications.slice(0, 50);

        localStorage.setItem('openhouse_notifications', JSON.stringify(trimmed));
    } catch (error) {
        console.error('Failed to store notification:', error);
    }
}

/**
 * Gets stored notifications from local storage
 */
export function getStoredNotifications(): OpenHouseNotification[] {
    try {
        const stored = localStorage.getItem('openhouse_notifications');
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to get stored notifications:', error);
        return [];
    }
}

/**
 * Clears all stored notifications
 */
export function clearStoredNotifications(): void {
    try {
        localStorage.removeItem('openhouse_notifications');
    } catch (error) {
        console.error('Failed to clear notifications:', error);
    }
}

/**
 * Marks a notification as read
 */
export function markNotificationAsRead(sessionId: string): void {
    try {
        const stored = localStorage.getItem('openhouse_notifications');
        if (!stored) return;

        const notifications: OpenHouseNotification[] = JSON.parse(stored);
        const updated = notifications.filter(n => n.sessionId !== sessionId);

        localStorage.setItem('openhouse_notifications', JSON.stringify(updated));
    } catch (error) {
        console.error('Failed to mark notification as read:', error);
    }
}
