/**
 * Animated Notification Component
 * Toast-style notifications with smooth animations
 */

'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { notificationSlide } from '@/lib/animations';

export interface Notification {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info';
    duration?: number;
}

export interface AnimatedNotificationProps extends Notification {
    onClose: (id: string) => void;
}

export const AnimatedNotification: React.FC<AnimatedNotificationProps> = ({
    id,
    title,
    description,
    variant = 'default',
    duration = 5000,
    onClose,
}) => {
    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const icons = {
        default: <Info className="w-5 h-5" />,
        success: <CheckCircle className="w-5 h-5" />,
        error: <AlertCircle className="w-5 h-5" />,
        warning: <AlertTriangle className="w-5 h-5" />,
        info: <Info className="w-5 h-5" />,
    };

    const variantClasses = {
        default: 'bg-card border-border',
        success: 'bg-success-light border-success',
        error: 'bg-error-light border-destructive',
        warning: 'bg-warning-light border-warning',
        info: 'bg-primary/10 border-primary',
    };

    const iconColors = {
        default: 'text-foreground',
        success: 'text-success',
        error: 'text-destructive',
        warning: 'text-warning',
        info: 'text-primary',
    };

    return (
        <motion.div
            layout
            variants={notificationSlide}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
                'flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-md',
                variantClasses[variant]
            )}
        >
            <div className={cn('flex-shrink-0 mt-0.5', iconColors[variant])}>
                {icons[variant]}
            </div>
            <div className="flex-1 space-y-1">
                <p className="font-semibold text-sm">{title}</p>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onClose(id)}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
                <X className="w-4 h-4" />
            </motion.button>
        </motion.div>
    );
};

// Notification container
export interface NotificationContainerProps {
    notifications: Notification[];
    onClose: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
    notifications,
    onClose,
    position = 'top-right',
}) => {
    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-center': 'top-4 left-1/2 -translate-x-1/2',
        'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    };

    return (
        <div className={cn('fixed z-50 flex flex-col gap-2', positionClasses[position])}>
            <AnimatePresence mode="popLayout">
                {notifications.map((notification) => (
                    <AnimatedNotification key={notification.id} {...notification} onClose={onClose} />
                ))}
            </AnimatePresence>
        </div>
    );
};

// Hook for managing notifications
export const useNotifications = () => {
    const [notifications, setNotifications] = React.useState<Notification[]>([]);

    const addNotification = React.useCallback(
        (notification: Omit<Notification, 'id'>) => {
            const id = Math.random().toString(36).substring(7);
            setNotifications((prev) => [...prev, { ...notification, id }]);
        },
        []
    );

    const removeNotification = React.useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAll = React.useCallback(() => {
        setNotifications([]);
    }, []);

    return {
        notifications,
        addNotification,
        removeNotification,
        clearAll,
    };
};
