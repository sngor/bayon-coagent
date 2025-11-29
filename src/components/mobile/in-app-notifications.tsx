'use client';

/**
 * In-App Notifications Component for Mobile Enhancements
 * 
 * This component displays notifications when the app is active, avoiding
 * duplicate push notifications and providing dismiss actions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Bell, TrendingUp, TrendingDown, Home, DollarSign, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationTapHandler } from '@/lib/notification-tap-handler';
import { createMarketAlertMonitor } from '@/lib/market-alert-monitor';
import { getMobileClasses } from '@/lib/mobile-optimization';
import { cn } from '@/lib/utils/common';

export interface InAppNotification {
    id: string;
    type: 'price-change' | 'new-listing' | 'trend-shift';
    title: string;
    message: string;
    location: string;
    timestamp: number;
    severity: 'low' | 'medium' | 'high';
    data?: Record<string, any>;
    read: boolean;
    dismissed: boolean;
}

interface InAppNotificationsProps {
    userId: string;
    maxVisible?: number;
    autoHideDelay?: number;
    className?: string;
}

export function InAppNotifications({
    userId,
    maxVisible = 3,
    autoHideDelay = 5000,
    className
}: InAppNotificationsProps) {
    const [notifications, setNotifications] = useState<InAppNotification[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    const { toast } = useToast();
    const { handleNotificationTap } = useNotificationTapHandler();
    const alertMonitor = createMarketAlertMonitor();

    useEffect(() => {
        loadNotifications();

        // Set up polling for new notifications
        const interval = setInterval(loadNotifications, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [userId]);

    useEffect(() => {
        // Show notifications if there are any unread ones
        const unreadNotifications = notifications.filter(n => !n.read && !n.dismissed);
        setIsVisible(unreadNotifications.length > 0);
    }, [notifications]);

    const loadNotifications = useCallback(async () => {
        try {
            setLoading(true);

            // Get recent alerts for the user
            const alerts = await alertMonitor.getUserAlerts(userId, 20);

            // Convert alerts to in-app notifications
            const inAppNotifications: InAppNotification[] = alerts.map(alert => ({
                id: alert.alertId || `alert_${alert.eventId}`,
                type: alert.type,
                title: getNotificationTitle(alert.type),
                message: alert.message,
                location: alert.location,
                timestamp: new Date(alert.createdAt).getTime(),
                severity: alert.severity || 'medium',
                data: alert.eventData,
                read: alert.read || false,
                dismissed: false, // This would be stored separately in a real implementation
            }));

            // Only show recent notifications (last 24 hours)
            const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
            const recentNotifications = inAppNotifications.filter(n => n.timestamp > twentyFourHoursAgo);

            setNotifications(recentNotifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, alertMonitor]);

    const getNotificationTitle = (type: string): string => {
        switch (type) {
            case 'price-change':
                return 'Price Alert';
            case 'new-listing':
                return 'New Listing';
            case 'trend-shift':
                return 'Market Trend';
            default:
                return 'Market Alert';
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'price-change':
                return <DollarSign className="w-4 h-4" />;
            case 'new-listing':
                return <Home className="w-4 h-4" />;
            case 'trend-shift':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    const getSeverityColor = (severity: string): string => {
        switch (severity) {
            case 'high':
                return 'border-red-200 bg-red-50';
            case 'medium':
                return 'border-orange-200 bg-orange-50';
            case 'low':
                return 'border-blue-200 bg-blue-50';
            default:
                return 'border-gray-200 bg-gray-50';
        }
    };

    const getSeverityBadgeColor = (severity: string): string => {
        switch (severity) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-orange-500';
            case 'low':
                return 'bg-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    const handleNotificationClick = async (notification: InAppNotification) => {
        try {
            // Mark as read
            await markAsRead(notification.id);

            // Handle navigation
            await handleNotificationTap({
                type: notification.type,
                location: notification.location,
                alertId: notification.id,
                timestamp: notification.timestamp,
                ...notification.data,
            });
        } catch (error) {
            console.error('Failed to handle notification click:', error);
            toast({
                title: 'Error',
                description: 'Failed to open notification details',
                variant: 'destructive',
            });
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            // Update local state
            setNotifications(prev =>
                prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );

            // TODO: Call server action to mark as read in database
            // This would be implemented when alert management actions are available
            console.log('Marking notification as read:', notificationId);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const dismissNotification = (notificationId: string) => {
        setNotifications(prev =>
            prev.map(n =>
                n.id === notificationId ? { ...n, dismissed: true } : n
            )
        );
    };

    const dismissAll = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, dismissed: true }))
        );
    };

    const formatTimestamp = (timestamp: number): string => {
        const now = Date.now();
        const diff = now - timestamp;

        if (diff < 60000) { // Less than 1 minute
            return 'Just now';
        } else if (diff < 3600000) { // Less than 1 hour
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) { // Less than 24 hours
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return new Date(timestamp).toLocaleDateString();
        }
    };

    // Filter notifications to show
    const visibleNotifications = notifications
        .filter(n => !n.dismissed)
        .slice(0, maxVisible);

    if (loading || !isVisible || visibleNotifications.length === 0) {
        return null;
    }

    return (
        <div className={cn(
            "fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full",
            "md:max-w-md lg:max-w-lg",
            className
        )}>
            {/* Header with dismiss all button */}
            {visibleNotifications.length > 1 && (
                <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                        {visibleNotifications.length} new alerts
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={dismissAll}
                        className="text-xs h-6 px-2"
                    >
                        Dismiss all
                    </Button>
                </div>
            )}

            {/* Notifications */}
            {visibleNotifications.map((notification, index) => (
                <Card
                    key={notification.id}
                    className={cn(
                        "cursor-pointer transition-all duration-300 hover:shadow-md",
                        getSeverityColor(notification.severity),
                        "animate-in slide-in-from-right-full",
                        getMobileClasses('button', 'p-0')
                    )}
                    style={{
                        animationDelay: `${index * 100}ms`,
                    }}
                    onClick={() => handleNotificationClick(notification)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn(
                                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                getSeverityBadgeColor(notification.severity),
                                "text-white"
                            )}>
                                {getNotificationIcon(notification.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-headline text-sm font-medium text-gray-900 truncate">
                                        {notification.title}
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 hover:bg-gray-200"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dismissNotification(notification.id);
                                        }}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>

                                <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                                    {notification.message}
                                </p>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimestamp(notification.timestamp)}
                                    </span>
                                    <span className="truncate ml-2">
                                        {notification.location}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                            <div className="absolute top-2 left-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                    </CardContent>
                </Card>
            ))}

            {/* Auto-hide timer for single notifications */}
            {visibleNotifications.length === 1 && autoHideDelay > 0 && (
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-500 rounded-full animate-pulse"
                        style={{
                            animation: `shrink ${autoHideDelay}ms linear forwards`,
                        }}
                    />
                </div>
            )}

            <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
}

/**
 * Hook for managing in-app notifications
 */
export function useInAppNotifications(userId: string) {
    const [unreadCount, setUnreadCount] = useState(0);
    const alertMonitor = createMarketAlertMonitor();

    const getUnreadCount = useCallback(async () => {
        try {
            const count = await alertMonitor.getUnreadAlertCount(userId);
            setUnreadCount(count);
            return count;
        } catch (error) {
            console.error('Failed to get unread count:', error);
            return 0;
        }
    }, [userId, alertMonitor]);

    useEffect(() => {
        getUnreadCount();

        // Poll for unread count updates
        const interval = setInterval(getUnreadCount, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [getUnreadCount]);

    const markAllAsRead = async () => {
        try {
            // TODO: Implement server action to mark all alerts as read
            console.log('Marking all notifications as read for user:', userId);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    return {
        unreadCount,
        getUnreadCount,
        markAllAsRead,
    };
}

/**
 * Notification badge component for showing unread count
 */
export function NotificationBadge({
    userId,
    className
}: {
    userId: string;
    className?: string;
}) {
    const { unreadCount } = useInAppNotifications(userId);

    if (unreadCount === 0) {
        return null;
    }

    return (
        <Badge
            variant="destructive"
            className={cn(
                "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs",
                className
            )}
        >
            {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
    );
}

export default InAppNotifications;