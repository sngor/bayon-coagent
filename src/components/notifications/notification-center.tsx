/**
 * NotificationCenter Component
 * 
 * Displays notifications in a dropdown/popover interface.
 * Shows unread count badge and provides actions for each notification.
 * Validates Requirements: 2.1, 2.2, 2.4, 2.5
 */

"use client";

import { useState } from "react";
import { Bell, Check, X, ExternalLink } from "lucide-react";
import { useNotifications } from "@/lib/notifications/hooks";
import { Notification, NotificationStatus, NotificationPriority } from "@/lib/notifications/types";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * NotificationCenter Props
 */
interface NotificationCenterProps {
    /**
     * User ID to fetch notifications for
     */
    userId: string;

    /**
     * Maximum number of notifications to display
     * @default 10
     */
    maxVisible?: number;

    /**
     * Whether to show only unread notifications
     * @default false
     */
    showUnreadOnly?: boolean;

    /**
     * Callback when a notification is clicked
     */
    onNotificationClick?: (notification: Notification) => void;

    /**
     * Custom className for the trigger button
     */
    className?: string;
}

/**
 * NotificationCenter
 * 
 * Main notification center component with bell icon and dropdown.
 * Displays notifications in chronological order with actions.
 * 
 * @example
 * ```tsx
 * <NotificationCenter
 *   userId="user-123"
 *   maxVisible={10}
 *   onNotificationClick={(notification) => {
 *     // Navigate to relevant content
 *     if (notification.actionUrl) {
 *       router.push(notification.actionUrl);
 *     }
 *   }}
 * />
 * ```
 */
export function NotificationCenter({
    userId,
    maxVisible = 10,
    showUnreadOnly = false,
    onNotificationClick,
    className,
}: NotificationCenterProps) {
    const [isOpen, setIsOpen] = useState(false);

    const {
        notifications,
        unreadCount,
        isLoading,
        error,
        isConnected,
        markAsRead,
        markAllAsRead,
        dismiss,
    } = useNotifications({
        userId,
        limit: maxVisible,
        unreadOnly: showUnreadOnly,
    });

    /**
     * Handles notification click
     */
    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already
        if (notification.status !== NotificationStatus.READ) {
            await markAsRead(notification.id);
        }

        // Call custom handler
        onNotificationClick?.(notification);

        // Navigate if action URL is provided
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    /**
     * Handles dismiss click
     */
    const handleDismiss = async (
        e: React.MouseEvent,
        notificationId: string
    ) => {
        e.stopPropagation();
        await dismiss(notificationId);
    };

    /**
     * Handles mark as read click
     */
    const handleMarkAsRead = async (
        e: React.MouseEvent,
        notificationId: string
    ) => {
        e.stopPropagation();
        await markAsRead(notificationId);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("relative", className)}
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                    {isConnected && (
                        <span className="absolute top-0 right-0 h-2 w-2 bg-green-500 rounded-full" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-96 p-0"
                align="end"
                sideOffset={8}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAllAsRead()}
                            className="text-xs"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {isLoading && notifications.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                            Loading notifications...
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-32 text-destructive">
                            Failed to load notifications
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <Bell className="h-8 w-8 mb-2 opacity-50" />
                            <p className="text-sm">No notifications</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onClick={() => handleNotificationClick(notification)}
                                    onMarkAsRead={(e) => handleMarkAsRead(e, notification.id)}
                                    onDismiss={(e) => handleDismiss(e, notification.id)}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <>
                        <Separator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full text-xs"
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to full notifications page if it exists
                                    // window.location.href = '/notifications';
                                }}
                            >
                                View all notifications
                            </Button>
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}

/**
 * NotificationItem Props
 */
interface NotificationItemProps {
    notification: Notification;
    onClick: () => void;
    onMarkAsRead: (e: React.MouseEvent) => void;
    onDismiss: (e: React.MouseEvent) => void;
}

/**
 * NotificationItem
 * 
 * Individual notification item with actions.
 * Validates Requirements: 2.1, 2.3, 2.5
 */
function NotificationItem({
    notification,
    onClick,
    onMarkAsRead,
    onDismiss,
}: NotificationItemProps) {
    const isUnread = notification.status !== NotificationStatus.READ;

    return (
        <div
            className={cn(
                "p-4 hover:bg-accent cursor-pointer transition-colors",
                isUnread && "bg-accent/50"
            )}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {/* Priority indicator */}
                <div className="flex-shrink-0 mt-1">
                    <div
                        className={cn(
                            "h-2 w-2 rounded-full",
                            notification.priority === NotificationPriority.CRITICAL &&
                            "bg-red-500",
                            notification.priority === NotificationPriority.HIGH &&
                            "bg-orange-500",
                            notification.priority === NotificationPriority.MEDIUM &&
                            "bg-yellow-500",
                            notification.priority === NotificationPriority.LOW &&
                            "bg-blue-500"
                        )}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h4
                            className={cn(
                                "text-sm font-medium line-clamp-1",
                                isUnread && "font-semibold"
                            )}
                        >
                            {notification.title}
                        </h4>
                        {isUnread && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {notification.content}
                    </p>

                    {notification.actionText && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                            <span>{notification.actionText}</span>
                            <ExternalLink className="h-3 w-3" />
                        </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.createdAt)}
                        </span>

                        <div className="flex items-center gap-1">
                            {isUnread && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2"
                                    onClick={onMarkAsRead}
                                    title="Mark as read"
                                >
                                    <Check className="h-3 w-3" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                onClick={onDismiss}
                                title="Dismiss"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Formats a timestamp into a human-readable relative time
 */
function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
        return "Just now";
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else if (diffHours < 24) {
        return `${diffHours}h ago`;
    } else if (diffDays < 7) {
        return `${diffDays}d ago`;
    } else {
        return date.toLocaleDateString();
    }
}
