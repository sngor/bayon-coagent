'use client';

/**
 * Sharing Notifications Component
 * 
 * Handles sharing notifications and approval workflows for sensitive templates.
 * Provides real-time updates on sharing status and pending approvals.
 * 
 * Requirements:
 * - 10.2: Sharing notifications and approval workflows
 * - 10.5: Manage template sharing permissions
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import {
    Bell,
    Check,
    X,
    Clock,
    AlertCircle,
    CheckCircle,
    XCircle,
    Share2,
    Eye,
    MoreHorizontal,
    User,
    Calendar,
    MessageSquare,
    Shield,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { Template } from '@/lib/content-workflow-types';

// ==================== Types ====================

export interface SharingNotification {
    id: string;
    type: 'shared' | 'approval_request' | 'approval_granted' | 'approval_denied' | 'access_granted' | 'template_updated';
    templateId: string;
    templateName: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    message?: string;
    status: 'pending' | 'read' | 'approved' | 'denied' | 'expired';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    createdAt: Date;
    expiresAt?: Date;
    actionRequired: boolean;
    metadata?: {
        permissions?: string[];
        brokerageId?: string;
        approvalReason?: string;
        denyReason?: string;
    };
}

export interface SharingNotificationsProps {
    userId: string;
    brokerageId: string;
    onNotificationAction?: (notificationId: string, action: 'approve' | 'deny' | 'dismiss') => void;
    className?: string;
}

// ==================== Mock Data ====================

const MOCK_NOTIFICATIONS: SharingNotification[] = [
    {
        id: 'notif_1',
        type: 'approval_request',
        templateId: 'template_123',
        templateName: 'Luxury Listing Description Template',
        fromUserId: 'user_1',
        fromUserName: 'Sarah Johnson',
        toUserId: 'broker_1',
        message: 'Requesting approval to share this high-value template with the commercial team.',
        status: 'pending',
        priority: 'high',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // 22 hours from now
        actionRequired: true,
        metadata: {
            permissions: ['view', 'edit'],
            brokerageId: 'brokerage_1',
            approvalReason: 'Template contains sensitive pricing strategies'
        }
    },
    {
        id: 'notif_2',
        type: 'shared',
        templateId: 'template_456',
        templateName: 'Market Update Newsletter Template',
        fromUserId: 'user_2',
        fromUserName: 'Michael Chen',
        toUserId: 'user_3',
        message: 'This template has been shared with you for the upcoming market report.',
        status: 'read',
        priority: 'medium',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        actionRequired: false,
        metadata: {
            permissions: ['view', 'edit'],
            brokerageId: 'brokerage_1'
        }
    },
    {
        id: 'notif_3',
        type: 'approval_granted',
        templateId: 'template_789',
        templateName: 'Client Onboarding Checklist',
        fromUserId: 'broker_1',
        fromUserName: 'Emily Rodriguez',
        toUserId: 'user_1',
        message: 'Your request to share the client onboarding template has been approved.',
        status: 'read',
        priority: 'medium',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        actionRequired: false,
        metadata: {
            permissions: ['view', 'share'],
            brokerageId: 'brokerage_1'
        }
    },
    {
        id: 'notif_4',
        type: 'template_updated',
        templateId: 'template_456',
        templateName: 'Market Update Newsletter Template',
        fromUserId: 'user_2',
        fromUserName: 'Michael Chen',
        toUserId: 'user_3',
        message: 'The shared template has been updated with new market data.',
        status: 'pending',
        priority: 'low',
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        actionRequired: false,
        metadata: {
            brokerageId: 'brokerage_1'
        }
    }
];

// ==================== Component ====================

export function SharingNotifications({
    userId,
    brokerageId,
    onNotificationAction,
    className
}: SharingNotificationsProps) {
    // ==================== State ====================

    const [notifications, setNotifications] = useState<SharingNotification[]>(MOCK_NOTIFICATIONS);
    const [isLoading, setIsLoading] = useState(false);

    // ==================== Effects ====================

    useEffect(() => {
        loadNotifications();
    }, [userId, brokerageId]);

    // ==================== Data Loading ====================

    const loadNotifications = async () => {
        try {
            setIsLoading(true);

            // In a real implementation, this would fetch from an API
            // For now, we'll use the mock data filtered by user
            const userNotifications = MOCK_NOTIFICATIONS.filter(
                notif => notif.toUserId === userId || notif.fromUserId === userId
            );

            setNotifications(userNotifications);
        } catch (error) {
            console.error('Failed to load notifications:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to Load Notifications',
                description: 'Could not load sharing notifications. Please try again.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // ==================== Event Handlers ====================

    const handleNotificationAction = async (notificationId: string, action: 'approve' | 'deny' | 'dismiss') => {
        try {
            // Update notification status locally
            setNotifications(prev => prev.map(notif =>
                notif.id === notificationId
                    ? {
                        ...notif,
                        status: action === 'approve' ? 'approved' : action === 'deny' ? 'denied' : 'read',
                        actionRequired: false
                    }
                    : notif
            ));

            // Call parent handler
            onNotificationAction?.(notificationId, action);

            // Show success message
            const actionMessages = {
                approve: 'Template sharing request approved',
                deny: 'Template sharing request denied',
                dismiss: 'Notification dismissed'
            };

            toast({
                title: 'Action Completed',
                description: actionMessages[action]
            });

        } catch (error) {
            console.error('Failed to handle notification action:', error);
            toast({
                variant: 'destructive',
                title: 'Action Failed',
                description: 'Could not complete the action. Please try again.'
            });
        }
    };

    const markAsRead = (notificationId: string) => {
        setNotifications(prev => prev.map(notif =>
            notif.id === notificationId && notif.status === 'pending'
                ? { ...notif, status: 'read' }
                : notif
        ));
    };

    // ==================== Helper Functions ====================

    const getNotificationIcon = (type: SharingNotification['type']) => {
        switch (type) {
            case 'shared': return <Share2 className="w-4 h-4 text-blue-500" />;
            case 'approval_request': return <Shield className="w-4 h-4 text-orange-500" />;
            case 'approval_granted': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'approval_denied': return <XCircle className="w-4 h-4 text-red-500" />;
            case 'access_granted': return <Eye className="w-4 h-4 text-purple-500" />;
            case 'template_updated': return <Zap className="w-4 h-4 text-yellow-500" />;
            default: return <Bell className="w-4 h-4 text-gray-500" />;
        }
    };

    const getPriorityColor = (priority: SharingNotification['priority']) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status: SharingNotification['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'read': return 'bg-gray-100 text-gray-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'denied': return 'bg-red-100 text-red-800';
            case 'expired': return 'bg-gray-100 text-gray-600';
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const formatExpiresIn = (date: Date) => {
        const now = new Date();
        const diffMs = date.getTime() - now.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMs <= 0) return 'Expired';
        if (diffHours < 24) return `${diffHours}h remaining`;
        return `${diffDays}d remaining`;
    };

    const getNotificationTitle = (notification: SharingNotification) => {
        switch (notification.type) {
            case 'shared':
                return `Template shared by ${notification.fromUserName}`;
            case 'approval_request':
                return `Approval requested by ${notification.fromUserName}`;
            case 'approval_granted':
                return `Sharing request approved`;
            case 'approval_denied':
                return `Sharing request denied`;
            case 'access_granted':
                return `Access granted to template`;
            case 'template_updated':
                return `Template updated by ${notification.fromUserName}`;
            default:
                return 'Notification';
        }
    };

    // ==================== Computed Values ====================

    const pendingNotifications = notifications.filter(n => n.status === 'pending');
    const actionRequiredNotifications = notifications.filter(n => n.actionRequired);
    const sortedNotifications = [...notifications].sort((a, b) => {
        // Sort by action required first, then by priority, then by date
        if (a.actionRequired !== b.actionRequired) {
            return a.actionRequired ? -1 : 1;
        }

        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        if (a.priority !== b.priority) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }

        return b.createdAt.getTime() - a.createdAt.getTime();
    });

    // ==================== Render ====================

    if (isLoading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Loading notifications...
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Sharing Notifications
                        {pendingNotifications.length > 0 && (
                            <Badge variant="destructive" className="ml-2">
                                {pendingNotifications.length}
                            </Badge>
                        )}
                    </CardTitle>

                    {actionRequiredNotifications.length > 0 && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {actionRequiredNotifications.length} action{actionRequiredNotifications.length !== 1 ? 's' : ''} required
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {notifications.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No notifications</p>
                        <p className="text-sm">Sharing notifications will appear here</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] -mx-6 px-6">
                        <div className="space-y-4">
                            {sortedNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "border rounded-lg p-4 space-y-3 transition-colors",
                                        notification.status === 'pending' ? "bg-blue-50/50 border-blue-200" : "",
                                        notification.actionRequired ? "ring-2 ring-orange-200" : ""
                                    )}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-medium text-sm">
                                                        {getNotificationTitle(notification)}
                                                    </h4>
                                                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(notification.priority))}>
                                                        {notification.priority}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm font-medium text-blue-600">
                                                    {notification.templateName}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={cn("text-xs", getStatusColor(notification.status))}>
                                                {notification.status}
                                            </Badge>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                        <MoreHorizontal className="w-3 h-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Mark as Read
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleNotificationAction(notification.id, 'dismiss')}
                                                        className="text-red-600"
                                                    >
                                                        <X className="w-4 h-4 mr-2" />
                                                        Dismiss
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* Message */}
                                    {notification.message && (
                                        <p className="text-sm text-muted-foreground pl-7">
                                            {notification.message}
                                        </p>
                                    )}

                                    {/* Metadata */}
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground pl-7">
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            {notification.fromUserName}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTimeAgo(notification.createdAt)}
                                        </div>
                                        {notification.expiresAt && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatExpiresIn(notification.expiresAt)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    {notification.actionRequired && notification.type === 'approval_request' && (
                                        <>
                                            <Separator />
                                            <div className="flex items-center justify-between pl-7">
                                                <div className="text-xs text-muted-foreground">
                                                    {notification.metadata?.approvalReason && (
                                                        <span>Reason: {notification.metadata.approvalReason}</span>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNotificationAction(notification.id, 'deny');
                                                        }}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="w-3 h-3 mr-1" />
                                                        Deny
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNotificationAction(notification.id, 'approve');
                                                        }}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <Check className="w-3 h-3 mr-1" />
                                                        Approve
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* Expiration Warning */}
                                    {notification.expiresAt && notification.actionRequired && (
                                        <Alert className="ml-7 mr-0">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription className="text-xs">
                                                This request will expire in {formatExpiresIn(notification.expiresAt)}.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}