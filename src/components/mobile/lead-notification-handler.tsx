'use client';

/**
 * Lead Notification Handler Component
 * 
 * Manages push notifications for new leads and handles notification interactions.
 * Automatically requests permission and sends notifications for incoming leads.
 * 
 * Requirements: 10.1, 10.2, 10.5
 */

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, X } from 'lucide-react';
import { Lead, leadResponseService } from '@/lib/mobile/lead-response';
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast';

interface LeadNotificationHandlerProps {
    /** Callback when a notification is tapped */
    onNotificationTap?: (leadId: string) => void;
    /** Callback when new leads arrive */
    onNewLeads?: (leads: Lead[]) => void;
    /** Whether to show permission prompt UI */
    showPermissionPrompt?: boolean;
}

export function LeadNotificationHandler({
    onNotificationTap,
    onNewLeads,
    showPermissionPrompt = true,
}: LeadNotificationHandlerProps) {
    const [hasPermission, setHasPermission] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    // Check notification support and permission on mount
    useEffect(() => {
        const supported = leadResponseService.hasNotificationSupport();
        setIsSupported('Notification' in window);
        setHasPermission(supported);

        // Show prompt if notifications are supported but not granted
        if ('Notification' in window && Notification.permission === 'default' && showPermissionPrompt) {
            setShowPrompt(true);
        }
    }, [showPermissionPrompt]);

    // Request notification permission
    const requestPermission = useCallback(async () => {
        try {
            const granted = await leadResponseService.requestNotificationPermission();
            setHasPermission(granted);
            setShowPrompt(false);

            if (granted) {
                showSuccessToast('Notifications enabled', 'You\'ll receive alerts for new leads');
            } else {
                showErrorToast('Notifications blocked', 'Please enable notifications in your browser settings');
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            showErrorToast('Error', 'Failed to request notification permission');
        }
    }, []);

    // Handle incoming lead (would be called from WebSocket or polling)
    const handleNewLead = useCallback(async (lead: Lead) => {
        // Send notification if permission granted
        if (hasPermission) {
            try {
                await leadResponseService.sendLeadNotification(lead);
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        }

        // Call callback
        onNewLeads?.([lead]);
    }, [hasPermission, onNewLeads]);

    // Listen for notification clicks (from service worker)
    useEffect(() => {
        const handleNotificationClick = (event: MessageEvent) => {
            if (event.data?.type === 'NOTIFICATION_CLICK' && event.data?.leadId) {
                onNotificationTap?.(event.data.leadId);
            }
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', handleNotificationClick);
            return () => {
                navigator.serviceWorker.removeEventListener('message', handleNotificationClick);
            };
        }
    }, [onNotificationTap]);

    // Don't render anything if notifications aren't supported
    if (!isSupported) {
        return null;
    }

    // Permission prompt UI
    if (showPrompt && !hasPermission) {
        return (
            <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle className="text-base">Enable Lead Notifications</CardTitle>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setShowPrompt(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Get instant alerts when new leads arrive so you can respond quickly and never miss an opportunity.
                    </p>
                    <div className="flex gap-2">
                        <Button onClick={requestPermission} className="flex-1">
                            <Bell className="h-4 w-4 mr-2" />
                            Enable Notifications
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setShowPrompt(false)}
                            className="flex-1"
                        >
                            Maybe Later
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Status indicator (optional, can be hidden)
    return (
        <div className="fixed top-4 right-4 z-40">
            <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={requestPermission}
            >
                {hasPermission ? (
                    <Bell className="h-4 w-4 text-green-600" />
                ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
            </Button>
        </div>
    );
}

/**
 * Hook for managing lead notifications
 */
export function useLeadNotifications() {
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        setHasPermission(leadResponseService.hasNotificationSupport());
    }, []);

    const requestPermission = useCallback(async () => {
        const granted = await leadResponseService.requestNotificationPermission();
        setHasPermission(granted);
        return granted;
    }, []);

    const sendNotification = useCallback(async (lead: Lead) => {
        if (!hasPermission) {
            console.warn('Notification permission not granted');
            return false;
        }

        try {
            await leadResponseService.sendLeadNotification(lead);
            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
            return false;
        }
    }, [hasPermission]);

    const prioritizeLeads = useCallback((leads: Lead[]) => {
        return leadResponseService.prioritizeLeads(leads);
    }, []);

    return {
        hasPermission,
        requestPermission,
        sendNotification,
        prioritizeLeads,
    };
}
