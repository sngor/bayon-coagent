'use client';

/**
 * Notification Preferences Component for Mobile Enhancements
 * 
 * This component provides a UI for users to configure their push notification
 * preferences including alert types and quiet hours.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, Clock, Smartphone, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    NotificationPreferences,
    PushNotificationManager,
    createPushNotificationManager,
    isPushNotificationSupported,
    getNotificationPermissionStatus,
    generateDeviceId
} from '@/lib/push-notification-manager';
import { getMobileClasses } from '@/lib/mobile-optimization';

interface NotificationPreferencesProps {
    userId: string;
    onPreferencesChange?: (preferences: NotificationPreferences) => void;
}

export function NotificationPreferencesComponent({
    userId,
    onPreferencesChange
}: NotificationPreferencesProps) {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        enabled: true,
        priceChanges: true,
        newListings: true,
        trendShifts: true,
        quietHours: null,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
    const [quietStart, setQuietStart] = useState('22:00');
    const [quietEnd, setQuietEnd] = useState('08:00');

    const { toast } = useToast();
    const pushManager = createPushNotificationManager(userId);

    useEffect(() => {
        loadPreferences();
        checkPermissionStatus();
        checkSubscriptionStatus();
    }, [userId]);

    useEffect(() => {
        if (preferences.quietHours) {
            setQuietHoursEnabled(true);
            setQuietStart(preferences.quietHours.start);
            setQuietEnd(preferences.quietHours.end);
        } else {
            setQuietHoursEnabled(false);
        }
    }, [preferences.quietHours]);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const prefs = await pushManager.getPreferences();
            setPreferences(prefs);
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
            toast({
                title: 'Error',
                description: 'Failed to load notification preferences',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const checkPermissionStatus = () => {
        const status = getNotificationPermissionStatus();
        setPermissionStatus(status);
    };

    const checkSubscriptionStatus = async () => {
        try {
            const hasSubscriptions = await pushManager.hasActiveSubscriptions();
            setIsSubscribed(hasSubscriptions);
        } catch (error) {
            console.error('Failed to check subscription status:', error);
        }
    };

    const requestPermission = async () => {
        try {
            const granted = await pushManager.requestPermission();
            if (granted) {
                setPermissionStatus('granted');
                toast({
                    title: 'Permission Granted',
                    description: 'You can now receive push notifications',
                });
            } else {
                toast({
                    title: 'Permission Denied',
                    description: 'Push notifications are disabled. You can enable them in your browser settings.',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to request permission:', error);
            toast({
                title: 'Error',
                description: 'Failed to request notification permission',
                variant: 'destructive',
            });
        }
    };

    const subscribeToNotifications = async () => {
        try {
            setSaving(true);

            // For web push, we would typically register a service worker and get a push subscription
            // For now, we'll simulate with a device token
            const deviceId = generateDeviceId();
            const mockToken = `web_token_${deviceId}_${Date.now()}`;

            await pushManager.subscribe(mockToken, deviceId, 'web');
            setIsSubscribed(true);

            toast({
                title: 'Subscribed',
                description: 'You will now receive push notifications',
            });
        } catch (error) {
            console.error('Failed to subscribe to notifications:', error);
            toast({
                title: 'Error',
                description: 'Failed to subscribe to push notifications',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const unsubscribeFromNotifications = async () => {
        try {
            setSaving(true);

            const deviceId = generateDeviceId();
            await pushManager.unsubscribe(deviceId);
            setIsSubscribed(false);

            toast({
                title: 'Unsubscribed',
                description: 'You will no longer receive push notifications',
            });
        } catch (error) {
            console.error('Failed to unsubscribe from notifications:', error);
            toast({
                title: 'Error',
                description: 'Failed to unsubscribe from push notifications',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const savePreferences = async (newPreferences: NotificationPreferences) => {
        try {
            setSaving(true);
            await pushManager.updatePreferences(newPreferences);
            setPreferences(newPreferences);
            onPreferencesChange?.(newPreferences);

            toast({
                title: 'Preferences Saved',
                description: 'Your notification preferences have been updated',
            });
        } catch (error) {
            console.error('Failed to save preferences:', error);
            toast({
                title: 'Error',
                description: 'Failed to save notification preferences',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
        const newPreferences = { ...preferences, [key]: value };
        savePreferences(newPreferences);
    };

    const handleQuietHoursToggle = (enabled: boolean) => {
        setQuietHoursEnabled(enabled);
        const newPreferences = {
            ...preferences,
            quietHours: enabled ? { start: quietStart, end: quietEnd } : null,
        };
        savePreferences(newPreferences);
    };

    const handleQuietHoursChange = () => {
        if (quietHoursEnabled) {
            const newPreferences = {
                ...preferences,
                quietHours: { start: quietStart, end: quietEnd },
            };
            savePreferences(newPreferences);
        }
    };

    const getPermissionStatusBadge = () => {
        switch (permissionStatus) {
            case 'granted':
                return <Badge variant="default" className="bg-green-500"><Bell className="w-3 h-3 mr-1" />Enabled</Badge>;
            case 'denied':
                return <Badge variant="destructive"><BellOff className="w-3 h-3 mr-1" />Denied</Badge>;
            case 'unsupported':
                return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Unsupported</Badge>;
            default:
                return <Badge variant="outline"><Bell className="w-3 h-3 mr-1" />Not Set</Badge>;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="w-5 h-5" />
                        Push Notifications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!isPushNotificationSupported()) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Push Notifications Not Supported
                    </CardTitle>
                    <CardDescription>
                        Your browser or device doesn't support push notifications.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Permission Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Notification Status
                    </CardTitle>
                    <CardDescription>
                        Manage your push notification permissions and subscription
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className="text-sm font-medium">Permission Status</Label>
                            <p className="text-sm text-muted-foreground">
                                Browser permission for notifications
                            </p>
                        </div>
                        {getPermissionStatusBadge()}
                    </div>

                    {permissionStatus === 'default' && (
                        <Button
                            onClick={requestPermission}
                            className={getMobileClasses('button')}
                            disabled={saving}
                        >
                            <Bell className="w-4 h-4 mr-2" />
                            Enable Notifications
                        </Button>
                    )}

                    {permissionStatus === 'granted' && (
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium">Subscription Status</Label>
                                <p className="text-sm text-muted-foreground">
                                    {isSubscribed ? 'Subscribed to push notifications' : 'Not subscribed'}
                                </p>
                            </div>
                            <Button
                                onClick={isSubscribed ? unsubscribeFromNotifications : subscribeToNotifications}
                                variant={isSubscribed ? 'outline' : 'default'}
                                className={getMobileClasses('button')}
                                disabled={saving}
                            >
                                {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                            </Button>
                        </div>
                    )}

                    {permissionStatus === 'denied' && (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <p className="text-sm text-orange-800">
                                Notifications are blocked. To enable them, click the notification icon in your browser's address bar or check your browser settings.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            {(permissionStatus === 'granted' && isSubscribed) && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Notification Preferences
                        </CardTitle>
                        <CardDescription>
                            Choose which types of alerts you want to receive
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Master Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Label className="text-sm font-medium">Enable Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Master switch for all push notifications
                                </p>
                            </div>
                            <Switch
                                checked={preferences.enabled}
                                onCheckedChange={(checked) => handlePreferenceChange('enabled', checked)}
                                disabled={saving}
                            />
                        </div>

                        <Separator />

                        {/* Alert Types */}
                        <div className="space-y-4">
                            <Label className="text-sm font-medium">Alert Types</Label>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm">Price Changes</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Get notified when property prices change in your target areas
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.priceChanges}
                                        onCheckedChange={(checked) => handlePreferenceChange('priceChanges', checked)}
                                        disabled={saving || !preferences.enabled}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm">New Listings</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Get notified when new properties are listed in your areas
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.newListings}
                                        onCheckedChange={(checked) => handlePreferenceChange('newListings', checked)}
                                        disabled={saving || !preferences.enabled}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-sm">Market Trends</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Get notified about significant market trend shifts
                                        </p>
                                    </div>
                                    <Switch
                                        checked={preferences.trendShifts}
                                        onCheckedChange={(checked) => handlePreferenceChange('trendShifts', checked)}
                                        disabled={saving || !preferences.enabled}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Quiet Hours */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        Quiet Hours
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Don't send notifications during these hours
                                    </p>
                                </div>
                                <Switch
                                    checked={quietHoursEnabled}
                                    onCheckedChange={handleQuietHoursToggle}
                                    disabled={saving || !preferences.enabled}
                                />
                            </div>

                            {quietHoursEnabled && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Start Time</Label>
                                        <Input
                                            type="time"
                                            value={quietStart}
                                            onChange={(e) => setQuietStart(e.target.value)}
                                            onBlur={handleQuietHoursChange}
                                            className={getMobileClasses('input')}
                                            disabled={saving}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">End Time</Label>
                                        <Input
                                            type="time"
                                            value={quietEnd}
                                            onChange={(e) => setQuietEnd(e.target.value)}
                                            onBlur={handleQuietHoursChange}
                                            className={getMobileClasses('input')}
                                            disabled={saving}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default NotificationPreferencesComponent;