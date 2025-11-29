/**
 * Notification Center Component
 * 
 * Displays notifications in a popover with list display, actions, and unread count badge.
 * Validates Requirements: 2.1, 2.2, 2.4, 2.5
 */

"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    Check,
    CheckCheck,
    X,
    ExternalLink,
    AlertCircle,
    Info,
    CheckCircle,
    AlertTriangle,
    Sparkles,
    Trophy,
    Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils/common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "../hooks/use-notifications";
import {
    Notification,
    NotificationType,
    NotificationStatus,
    NotificationPriority,
} from "../types";

/**
 * Props for NotificationCenter component
 */
export interface NotificationCenterProps {
    /**
     * User ID to fetch notifications for
     */
    userId: string;

    /**
     * Maximum number of notifications to display
     * @default 50
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
 * Main notification center component with popover display.
 * Shows unread count badge and provides actions for each notification.
 * 
 * Validates Requirements: 2.1, 2.2, 2.4, 2.5
 */
export function NotificationCenter({
    userId,
    maxVisible = 50,
    showUnreadOnly = false,
    onNotificationClick,
    className,
}: NotificationCenterProps) {
    const [open, setOpen] = React.useState(false);

    const {
        notifications,
        unreadCount,
        isLoading,
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
     * Validates Requirements: 2.3
     */
    const handleNotificationClick = async (notification: Notification) => {
        // Mark as read if not already read
        if (notification.status !== NotificationStatus.READ) {
            await markAsRead(notification.id);
        }

        // Call custom handler if provided
        if (onNotificationClick) {
            onNotificationClick(notification);
        }

        // Navigate to action URL if provided
        if (notification.actionUrl) {
            window.location.href = notification.actionUrl;
        }
    };

    /**
     * Handles mark all as read
     */
    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
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
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[400px] p-0"
                align="end"
                sideOffset={8}
            >
                <div className="flex flex-col h-full max-h-[600px]">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-semibold text-lg">Notifications</h3>
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleMarkAllAsRead}
                                className="text-xs"
                            >
                                <CheckCheck className="h-4 w-4 mr-1" />
                                Mark all read
                            </Button>
                        )}
                    </div>

                    {/* Notification List */}
                    <ScrollArea className="flex-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-center">
                                <Bell className="h-12 w-12 text-muted-foreground mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    No notifications yet
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                <AnimatePresence mode="popLayout">
                                    {notifications.map((notification) => (
                                        <NotificationItem
                                            key={notification.id}
                                            notification={notification}
                                            onClick={() => handleNotificationClick(notification)}
                                            onDismiss={() => dismiss(notification.id)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
    );
}

/**
 * Props for NotificationItem component
 */
interface NotificationItemProps {
    notification: Notification;
    onClick: () => void;
    onDismiss: () => void;
}

/**
 * NotificationItem
 * 
 * Individual notification item with actions (read, dismiss, navigate).
 * Validates Requirements: 2.3, 2.5
 */
function NotificationItem({
    notification,
    onClick,
    onDismiss,
}: NotificationItemProps) {
    const isUnread = notification.status !== NotificationStatus.READ;

    /**
     * Handles dismiss click
     * Validates Requirements: 2.5
     */
    const handleDismiss = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDismiss();
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.2 }}
            className={cn(
                "p-4 hover:bg-accent/50 cursor-pointer transition-colors relative",
                isUnread && "bg-accent/20"
            )}
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-0.5">
                    <NotificationIcon
                        type={notification.type}
                        priority={notification.priority}
                    />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                            "text-sm font-medium",
                            isUnread && "font-semibold"
                        )}>
                            {notification.title}
                        </p>
                        {isUnread && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.content}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-1">
                        <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.createdAt)}
                        </span>

                        <div className="flex items-center gap-1">
                            {notification.actionUrl && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onClick();
                                    }}
                                >
                                    {notification.actionText || "View"}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={handleDismiss}
                                aria-label="Dismiss notification"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * NotificationIcon
 * 
 * Returns the appropriate icon for a notification type
 */
function NotificationIcon({
    type,
    priority,
}: {
    type: NotificationType;
    priority: NotificationPriority;
}) {
    const iconClass = cn(
        "h-5 w-5",
        priority === NotificationPriority.CRITICAL && "text-destructive",
        priority === NotificationPriority.HIGH && "text-warning",
        priority === NotificationPriority.MEDIUM && "text-primary",
        priority === NotificationPriority.LOW && "text-muted-foreground"
    );

    switch (type) {
        case NotificationType.ALERT:
            return <AlertCircle className={iconClass} />;
        case NotificationType.SYSTEM:
            return <Info className={iconClass} />;
        case NotificationType.ACHIEVEMENT:
            return <Trophy className={iconClass} />;
        case NotificationType.ANNOUNCEMENT:
            return <Megaphone className={iconClass} />;
        case NotificationType.TASK_COMPLETION:
            return <CheckCircle className={iconClass} />;
        case NotificationType.FEATURE_UPDATE:
            return <Sparkles className={iconClass} />;
        case NotificationType.REMINDER:
            return <AlertTriangle className={iconClass} />;
        default:
            return <Bell className={iconClass} />;
    }
}

/**
 * Formats timestamp for display
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
