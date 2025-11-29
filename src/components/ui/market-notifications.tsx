/**
 * Market Notifications UI Components
 * 
 * Displays market notifications with AI insights and actions
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    BellOff,
    X,
    Check,
    CheckCheck,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Lightbulb,
    Target,
    Users,
    ExternalLink,
    Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    MarketNotification,
    NotificationCategory,
    NotificationPriority,
} from '@/lib/market-notifications';

/**
 * Props for NotificationBell component
 */
export interface NotificationBellProps {
    unreadCount: number;
    notifications: MarketNotification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDismiss: (id: string) => void;
    onOpenSettings?: () => void;
}

/**
 * Notification bell icon with badge
 */
export function NotificationBell({
    unreadCount,
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDismiss,
    onOpenSettings,
}: NotificationBellProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label={`Notifications (${unreadCount} unread)`}
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-headline font-semibold text-lg">Notifications</h3>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onMarkAllAsRead}
                                className="text-xs"
                            >
                                <CheckCheck className="h-4 w-4 mr-1" />
                                Mark all read
                            </Button>
                        )}
                        {onOpenSettings && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onOpenSettings}
                                className="h-8 w-8"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <BellOff className="h-12 w-12 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">
                                No notifications yet
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                We'll notify you about important market changes
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            <AnimatePresence>
                                {notifications.map((notification) => (
                                    <NotificationItem
                                        key={notification.id}
                                        notification={notification}
                                        onMarkAsRead={onMarkAsRead}
                                        onDismiss={onDismiss}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

/**
 * Props for NotificationItem component
 */
interface NotificationItemProps {
    notification: MarketNotification;
    onMarkAsRead: (id: string) => void;
    onDismiss: (id: string) => void;
}

/**
 * Individual notification item
 */
function NotificationItem({
    notification,
    onMarkAsRead,
    onDismiss,
}: NotificationItemProps) {
    const icon = getCategoryIcon(notification.category);
    const priorityColor = getPriorityColor(notification.priority);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cn(
                'p-4 hover:bg-accent/50 transition-colors relative',
                !notification.read && 'bg-primary/5'
            )}
        >
            {/* Priority indicator */}
            <div
                className={cn(
                    'absolute left-0 top-0 bottom-0 w-1',
                    priorityColor
                )}
            />

            <div className="flex gap-3 pl-2">
                {/* Icon */}
                <div
                    className={cn(
                        'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                        getCategoryBgColor(notification.category)
                    )}
                >
                    {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-headline font-semibold text-sm leading-tight">
                            {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                            {!notification.read && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => onMarkAsRead(notification.id)}
                                    title="Mark as read"
                                >
                                    <Check className="h-3 w-3" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => onDismiss(notification.id)}
                                title="Dismiss"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                    </p>

                    {/* AI Insight */}
                    {notification.aiInsight && (
                        <div className="bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg p-3 mb-2">
                            <div className="flex items-start gap-2">
                                <Lightbulb className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-foreground">
                                    {notification.aiInsight}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action button */}
                    {notification.actionable && notification.actionUrl && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            asChild
                        >
                            <a href={notification.actionUrl}>
                                {notification.actionLabel || 'Take Action'}
                                <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                        </Button>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                            {formatCategory(notification.category)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            {formatTimestamp(notification.createdAt)}
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/**
 * Gets icon for notification category
 */
function getCategoryIcon(category: NotificationCategory) {
    const iconClass = 'h-5 w-5';

    switch (category) {
        case 'market_trend':
            return <TrendingUp className={iconClass} />;
        case 'competitor_activity':
            return <Users className={iconClass} />;
        case 'opportunity':
            return <Target className={iconClass} />;
        case 'warning':
            return <AlertTriangle className={iconClass} />;
        case 'insight':
            return <Lightbulb className={iconClass} />;
        case 'recommendation':
            return <TrendingDown className={iconClass} />;
        default:
            return <Bell className={iconClass} />;
    }
}

/**
 * Gets background color for category icon
 */
function getCategoryBgColor(category: NotificationCategory): string {
    switch (category) {
        case 'market_trend':
            return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
        case 'competitor_activity':
            return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
        case 'opportunity':
            return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
        case 'warning':
            return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'insight':
            return 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400';
        case 'recommendation':
            return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
        default:
            return 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
    }
}

/**
 * Gets color for priority indicator
 */
function getPriorityColor(priority: NotificationPriority): string {
    switch (priority) {
        case 'critical':
            return 'bg-red-500';
        case 'high':
            return 'bg-orange-500';
        case 'medium':
            return 'bg-yellow-500';
        case 'low':
            return 'bg-blue-500';
        default:
            return 'bg-gray-500';
    }
}

/**
 * Formats category for display
 */
function formatCategory(category: NotificationCategory): string {
    return category
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Formats timestamp for display
 */
function formatTimestamp(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes}m ago`;
    } else if (hours < 24) {
        return `${hours}h ago`;
    } else if (days < 7) {
        return `${days}d ago`;
    } else {
        return new Date(timestamp).toLocaleDateString();
    }
}

/**
 * Props for NotificationList component
 */
export interface NotificationListProps {
    notifications: MarketNotification[];
    onMarkAsRead: (id: string) => void;
    onDismiss: (id: string) => void;
    className?: string;
}

/**
 * Full-page notification list
 */
export function NotificationList({
    notifications,
    onMarkAsRead,
    onDismiss,
    className,
}: NotificationListProps) {
    return (
        <div className={cn('space-y-2', className)}>
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <BellOff className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="font-headline text-lg font-semibold mb-2">No notifications</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        We'll notify you about important market changes, opportunities, and
                        insights relevant to your business.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    <AnimatePresence>
                        {notifications.map((notification) => (
                            <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="bg-card border rounded-lg"
                            >
                                <NotificationItem
                                    notification={notification}
                                    onMarkAsRead={onMarkAsRead}
                                    onDismiss={onDismiss}
                                />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
