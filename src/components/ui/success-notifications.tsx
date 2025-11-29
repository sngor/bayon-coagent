'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    CheckCircle2,
    X,
    Undo2,
    Calendar,
    Share2,
    FileText,
    Users,
    BarChart3,
    Clock,
    Sparkles,
    Target,
    TrendingUp,
    Zap,
    Copy,
    Download,
    Send,
    Save,
    Trash2,
    Edit,
    Settings,
    ExternalLink,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Success notification components with undo capabilities
 * Following Material Design principles for notifications
 */

interface SuccessNotificationProps {
    isVisible: boolean;
    onClose: () => void;
    onUndo?: () => void;
    undoTimeoutMs?: number;
    className?: string;
}

interface NotificationAction {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'outline' | 'secondary';
}

export function ContentScheduledNotification({
    isVisible,
    onClose,
    onUndo,
    undoTimeoutMs = 10000,
    scheduledTime,
    channelCount = 1,
    contentTitle,
    actions = []
}: SuccessNotificationProps & {
    scheduledTime?: Date;
    channelCount?: number;
    contentTitle?: string;
    actions?: NotificationAction[];
}) {
    const [timeLeft, setTimeLeft] = useState(undoTimeoutMs / 1000);

    useEffect(() => {
        if (!isVisible || !onUndo) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const timeout = setTimeout(() => {
            onClose();
        }, undoTimeoutMs);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isVisible, onUndo, undoTimeoutMs, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={cn(
                        "fixed bottom-4 right-4 z-50 max-w-md",
                        "sm:bottom-6 sm:right-6",
                        className
                    )}
                    role="alert"
                    aria-live="polite"
                >
                    <Card className="border-green-200 bg-green-50 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-green-900">Content Scheduled!</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClose}
                                            className="h-6 w-6 p-0 text-green-700 hover:text-green-900"
                                            aria-label="Close notification"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {contentTitle && (
                                            <p className="text-sm text-green-800 font-medium truncate">
                                                "{contentTitle}"
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2 text-sm text-green-700">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                {scheduledTime
                                                    ? scheduledTime.toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: 'numeric',
                                                        minute: '2-digit'
                                                    })
                                                    : 'Scheduled for publishing'
                                                }
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                                <Share2 className="h-3 w-3 mr-1" />
                                                {channelCount} {channelCount === 1 ? 'channel' : 'channels'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                                        <div className="flex gap-2">
                                            {onUndo && timeLeft > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={onUndo}
                                                    className="h-7 text-xs border-green-300 text-green-700 hover:bg-green-100"
                                                >
                                                    <Undo2 className="h-3 w-3 mr-1" />
                                                    Undo ({timeLeft}s)
                                                </Button>
                                            )}

                                            {actions.map((action, index) => (
                                                <Button
                                                    key={index}
                                                    variant={action.variant || "outline"}
                                                    size="sm"
                                                    onClick={action.onClick}
                                                    className="h-7 text-xs"
                                                >
                                                    {action.icon}
                                                    {action.label}
                                                </Button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open('/library/calendar', '_blank')}
                                            className="h-7 text-xs text-green-700 hover:text-green-900"
                                        >
                                            View Calendar
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function TemplateCreatedNotification({
    isVisible,
    onClose,
    onUndo,
    undoTimeoutMs = 8000,
    templateName,
    isShared = false,
    actions = []
}: SuccessNotificationProps & {
    templateName?: string;
    isShared?: boolean;
    actions?: NotificationAction[];
}) {
    const [timeLeft, setTimeLeft] = useState(undoTimeoutMs / 1000);

    useEffect(() => {
        if (!isVisible || !onUndo) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const timeout = setTimeout(() => {
            onClose();
        }, undoTimeoutMs);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isVisible, onUndo, undoTimeoutMs, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, x: 300 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 300 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn("fixed bottom-4 right-4 z-50 max-w-md")}
                    role="alert"
                    aria-live="polite"
                >
                    <Card className="border-blue-200 bg-blue-50 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-blue-900">Template Created!</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClose}
                                            className="h-6 w-6 p-0 text-blue-700 hover:text-blue-900"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {templateName && (
                                            <p className="text-sm text-blue-800 font-medium truncate">
                                                "{templateName}"
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                Ready to use
                                            </Badge>
                                            {isShared && (
                                                <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    Shared with team
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-blue-200">
                                        <div className="flex gap-2">
                                            {onUndo && timeLeft > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={onUndo}
                                                    className="h-7 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                                                >
                                                    <Undo2 className="h-3 w-3 mr-1" />
                                                    Undo ({timeLeft}s)
                                                </Button>
                                            )}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open('/library/templates', '_blank')}
                                            className="h-7 text-xs text-blue-700 hover:text-blue-900"
                                        >
                                            View Templates
                                            <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function ContentPublishedNotification({
    isVisible,
    onClose,
    contentTitle,
    channelCount = 1,
    engagementPreview,
    actions = []
}: Omit<SuccessNotificationProps, 'onUndo'> & {
    contentTitle?: string;
    channelCount?: number;
    engagementPreview?: { views?: number; likes?: number; shares?: number };
    actions?: NotificationAction[];
}) {
    useEffect(() => {
        if (!isVisible) return;

        const timeout = setTimeout(() => {
            onClose();
        }, 8000);

        return () => clearTimeout(timeout);
    }, [isVisible, onClose]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={cn("fixed top-4 right-4 z-50 max-w-md")}
                    role="alert"
                    aria-live="polite"
                >
                    <Card className="border-green-200 bg-green-50 shadow-lg">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                    <Send className="h-5 w-5 text-green-600" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className="font-semibold text-green-900">Content Published!</h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClose}
                                            className="h-6 w-6 p-0 text-green-700 hover:text-green-900"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {contentTitle && (
                                            <p className="text-sm text-green-800 font-medium truncate">
                                                "{contentTitle}"
                                            </p>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                                                <Share2 className="h-3 w-3 mr-1" />
                                                {channelCount} {channelCount === 1 ? 'platform' : 'platforms'}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                                <Clock className="h-3 w-3 mr-1" />
                                                Just now
                                            </Badge>
                                        </div>

                                        {engagementPreview && (
                                            <div className="flex items-center gap-4 text-xs text-green-700 mt-2">
                                                {engagementPreview.views && (
                                                    <span className="flex items-center gap-1">
                                                        <BarChart3 className="h-3 w-3" />
                                                        {engagementPreview.views} views
                                                    </span>
                                                )}
                                                {engagementPreview.likes && (
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="h-3 w-3" />
                                                        {engagementPreview.likes} likes
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                                        <div className="flex gap-2">
                                            {actions.map((action, index) => (
                                                <Button
                                                    key={index}
                                                    variant={action.variant || "outline"}
                                                    size="sm"
                                                    onClick={action.onClick}
                                                    className="h-7 text-xs"
                                                >
                                                    {action.icon}
                                                    {action.label}
                                                </Button>
                                            ))}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => window.open('/library/analytics', '_blank')}
                                            className="h-7 text-xs text-green-700 hover:text-green-900"
                                        >
                                            View Analytics
                                            <ExternalLink className="h-3 w-3 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export function BulkActionNotification({
    isVisible,
    onClose,
    onUndo,
    undoTimeoutMs = 12000,
    actionType,
    itemCount,
    successCount,
    failureCount = 0,
    actions = []
}: SuccessNotificationProps & {
    actionType: 'scheduled' | 'deleted' | 'updated' | 'exported';
    itemCount: number;
    successCount: number;
    failureCount?: number;
    actions?: NotificationAction[];
}) {
    const [timeLeft, setTimeLeft] = useState(undoTimeoutMs / 1000);

    useEffect(() => {
        if (!isVisible || !onUndo) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        const timeout = setTimeout(() => {
            onClose();
        }, undoTimeoutMs);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isVisible, onUndo, undoTimeoutMs, onClose]);

    const getActionIcon = () => {
        switch (actionType) {
            case 'scheduled': return <Calendar className="h-5 w-5 text-blue-600" />;
            case 'deleted': return <Trash2 className="h-5 w-5 text-red-600" />;
            case 'updated': return <Edit className="h-5 w-5 text-green-600" />;
            case 'exported': return <Download className="h-5 w-5 text-purple-600" />;
            default: return <CheckCircle2 className="h-5 w-5 text-green-600" />;
        }
    };

    const getActionColor = () => {
        switch (actionType) {
            case 'scheduled': return 'blue';
            case 'deleted': return 'red';
            case 'updated': return 'green';
            case 'exported': return 'purple';
            default: return 'green';
        }
    };

    const color = getActionColor();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={cn("fixed bottom-4 left-4 z-50 max-w-md")}
                    role="alert"
                    aria-live="polite"
                >
                    <Card className={cn(`border-${color}-200 bg-${color}-50 shadow-lg`)}>
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <div className={cn(`w-8 h-8 rounded-full bg-${color}-100 flex items-center justify-center flex-shrink-0`)}>
                                    {getActionIcon()}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h4 className={cn(`font-semibold text-${color}-900`)}>
                                            Bulk Action Complete
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onClose}
                                            className={cn(`h-6 w-6 p-0 text-${color}-700 hover:text-${color}-900`)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        <p className={cn(`text-sm text-${color}-800`)}>
                                            {successCount} of {itemCount} items {actionType} successfully
                                            {failureCount > 0 && ` (${failureCount} failed)`}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className={cn(`text-xs bg-${color}-100 text-${color}-800`)}>
                                                <Zap className="h-3 w-3 mr-1" />
                                                Bulk operation
                                            </Badge>
                                            {failureCount > 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    {failureCount} errors
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex gap-2">
                                            {onUndo && timeLeft > 0 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={onUndo}
                                                    className={cn(`h-7 text-xs border-${color}-300 text-${color}-700 hover:bg-${color}-100`)}
                                                >
                                                    <Undo2 className="h-3 w-3 mr-1" />
                                                    Undo ({timeLeft}s)
                                                </Button>
                                            )}
                                        </div>

                                        {actions.map((action, index) => (
                                            <Button
                                                key={index}
                                                variant={action.variant || "ghost"}
                                                size="sm"
                                                onClick={action.onClick}
                                                className="h-7 text-xs"
                                            >
                                                {action.icon}
                                                {action.label}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}