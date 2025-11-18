/**
 * React hook for market notifications
 * 
 * Provides access to market notifications and preferences
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMarketNotificationsService,
  MarketNotification,
  NotificationPreferences,
  NotificationCategory,
} from '@/lib/market-notifications';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast';

export interface UseMarketNotificationsReturn {
  notifications: MarketNotification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  loading: boolean;
  error: Error | null;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  updatePreferences: (updates: Partial<NotificationPreferences>) => Promise<void>;
}

/**
 * Hook for managing market notifications
 */
export function useMarketNotifications(
  userId: string | undefined,
  options: {
    unreadOnly?: boolean;
    category?: NotificationCategory;
    autoRefresh?: boolean;
    refreshInterval?: number;
  } = {}
): UseMarketNotificationsReturn {
  const [notifications, setNotifications] = useState<MarketNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const service = getMarketNotificationsService();

  /**
   * Fetches notifications from the service
   */
  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const [notifs, count, prefs] = await Promise.all([
        service.getNotifications(userId, {
          unreadOnly: options.unreadOnly,
          category: options.category,
          limit: 50,
        }),
        service.getUnreadCount(userId),
        service.getPreferences(userId),
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
      setPreferences(prefs);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, options.unreadOnly, options.category, service]);

  /**
   * Refreshes notifications
   */
  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    await fetchNotifications();
  }, [fetchNotifications]);

  /**
   * Marks a notification as read
   */
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        await service.markAsRead(userId, notificationId);
        
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        showErrorToast('Failed to update notification');
      }
    },
    [userId, service]
  );

  /**
   * Marks all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    try {
      await service.markAllAsRead(userId);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
      
      showSuccessToast('All notifications marked as read');
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      showErrorToast('Failed to update notifications');
    }
  }, [userId, service]);

  /**
   * Dismisses a notification
   */
  const dismissNotification = useCallback(
    async (notificationId: string) => {
      if (!userId) return;

      try {
        await service.dismissNotification(userId, notificationId);
        
        // Remove from local state
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
        
        // Update unread count if it was unread
        const notification = notifications.find((n) => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch (err) {
        console.error('Failed to dismiss notification:', err);
        showErrorToast('Failed to dismiss notification');
      }
    },
    [userId, service, notifications]
  );

  /**
   * Updates notification preferences
   */
  const updatePreferences = useCallback(
    async (updates: Partial<NotificationPreferences>) => {
      if (!userId) return;

      try {
        await service.updatePreferences(userId, updates);
        
        // Update local state
        setPreferences((prev) =>
          prev ? { ...prev, ...updates } : null
        );
        
        showSuccessToast('Notification preferences updated');
      } catch (err) {
        console.error('Failed to update preferences:', err);
        showErrorToast('Failed to update preferences');
      }
    },
    [userId, service]
  );

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh
  useEffect(() => {
    if (!options.autoRefresh || !userId) return;

    const interval = setInterval(
      fetchNotifications,
      options.refreshInterval || 60000 // Default: 1 minute
    );

    return () => clearInterval(interval);
  }, [options.autoRefresh, options.refreshInterval, userId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    updatePreferences,
  };
}
