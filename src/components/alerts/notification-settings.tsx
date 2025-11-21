'use client';

/**
 * Notification Settings Component
 * 
 * Provides UI for managing email notification preferences for Market Intelligence Alerts.
 * Includes settings for frequency, quiet hours, and alert type preferences.
 */

import { useState, useEffect } from 'react';
import { useFormState } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Clock, Bell, BellOff, Send } from 'lucide-react';
import {
    getNotificationPreferencesAction,
    updateNotificationPreferencesAction,
    sendTestNotificationAction,
} from '@/app/actions';
import { NotificationPreferences } from '@/lib/alerts/notification-types';
import { AlertType } from '@/lib/alerts/types';

interface NotificationSettingsProps {
    className?: string;
}

const ALERT_TYPE_LABELS: Record<AlertType, string> = {
    'life-event-lead': 'High-Intent Leads',
    'competitor-new-listing': 'Competitor New Listings',
    'competitor-price-reduction': 'Competitor Price Reductions',
    'competitor-withdrawal': 'Competitor Withdrawals',
    'neighborhood-trend': 'Neighborhood Trends',
    'price-reduction': 'Price Reductions',
};

const FREQUENCY_OPTIONS = [
    { value: 'real-time', label: 'Real-time (immediate)', description: 'Get notified as soon as alerts are created' },
    { value: 'daily', label: 'Daily digest', description: 'Receive a summary once per day' },
    { value: 'weekly', label: 'Weekly digest', description: 'Receive a summary once per week' },
];

const TIMEZONE_OPTIONS = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
];

export function NotificationSettings({ className }: NotificationSettingsProps) {
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [testLoading, setTestLoading] = useState(false);
    const { toast } = useToast();

    const [updateState, updateAction] = useFormState(updateNotificationPreferencesAction, {
        message: '',
        data: null,
        errors: [],
    });

    // Load preferences on mount
    useEffect(() => {
        loadPreferences();
    }, []);

    // Handle update response
    useEffect(() => {
        if (updateState.message && updateState.message !== '') {
            if (updateState.data) {
                setPreferences(updateState.data);
                toast({
                    title: 'Settings Updated',
                    description: updateState.message,
                });
            } else if (updateState.errors?.length) {
                toast({
                    title: 'Update Failed',
                    description: updateState.errors[0],
                    variant: 'destructive',
                });
            }
        }
    }, [updateState, toast]);

    const loadPreferences = async () => {
        try {
            setLoading(true);
            const result = await getNotificationPreferencesAction();
            if (result.data) {
                setPreferences(result.data);
            } else {
                toast({
                    title: 'Error',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load notification preferences',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendTest = async () => {
        try {
            setTestLoading(true);
            const result = await sendTestNotificationAction();

            if (result.data?.success) {
                toast({
                    title: 'Test Sent',
                    description: 'Check your email for the test notification',
                });
            } else {
                toast({
                    title: 'Test Failed',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to send test notification',
                variant: 'destructive',
            });
        } finally {
            setTestLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading notification settings...</span>
                </CardContent>
            </Card>
        );
    }

    if (!preferences) {
        return (
            <Card className={className}>
                <CardContent className="py-8">
                    <p className="text-center text-muted-foreground">
                        Failed to load notification preferences
                    </p>
                    <Button onClick={loadPreferences} className="mt-4 mx-auto block">
                        Retry
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={className}>
            <form action={updateAction} className="space-y-6">
                {/* Email Notifications Toggle */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="h-5 w-5" />
                            Email Notifications
                        </CardTitle>
                        <CardDescription>
                            Control whether you receive email notifications for market intelligence alerts
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="emailNotifications">Enable email notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive alerts via email when new market opportunities are detected
                                </p>
                            </div>
                            <Switch
                                id="emailNotifications"
                                name="emailNotifications"
                                defaultChecked={preferences.emailNotifications}
                            />
                        </div>

                        {preferences.emailNotifications && (
                            <>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="emailAddress">Email Address</Label>
                                    <Input
                                        id="emailAddress"
                                        name="emailAddress"
                                        type="email"
                                        placeholder="your@email.com"
                                        defaultValue={preferences.emailAddress || ''}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Leave blank to use your account email address
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSendTest}
                                        disabled={testLoading}
                                    >
                                        {testLoading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Send className="h-4 w-4 mr-2" />
                                        )}
                                        Send Test Email
                                    </Button>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Notification Frequency */}
                {preferences.emailNotifications && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Notification Frequency
                            </CardTitle>
                            <CardDescription>
                                Choose how often you want to receive notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {FREQUENCY_OPTIONS.map((option) => (
                                    <div key={option.value} className="flex items-center space-x-2">
                                        <input
                                            type="radio"
                                            id={`frequency-${option.value}`}
                                            name="frequency"
                                            value={option.value}
                                            defaultChecked={preferences.frequency === option.value}
                                            className="h-4 w-4"
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor={`frequency-${option.value}`} className="font-medium">
                                                {option.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {(preferences.frequency === 'daily' || preferences.frequency === 'weekly') && (
                                <>
                                    <Separator />
                                    <div className="space-y-2">
                                        <Label htmlFor="digestTime">Delivery Time</Label>
                                        <Input
                                            id="digestTime"
                                            name="digestTime"
                                            type="time"
                                            defaultValue={preferences.digestTime || '09:00'}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Time of day to receive digest emails
                                        </p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Alert Types */}
                {preferences.emailNotifications && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Alert Types
                            </CardTitle>
                            <CardDescription>
                                Choose which types of alerts you want to receive
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(ALERT_TYPE_LABELS).map(([type, label]) => (
                                    <div key={type} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`alertType-${type}`}
                                            name="enabledAlertTypes"
                                            value={type}
                                            defaultChecked={preferences.enabledAlertTypes.includes(type as AlertType)}
                                        />
                                        <Label htmlFor={`alertType-${type}`} className="font-medium">
                                            {label}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Quiet Hours */}
                {preferences.emailNotifications && preferences.frequency === 'real-time' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BellOff className="h-5 w-5" />
                                Quiet Hours
                            </CardTitle>
                            <CardDescription>
                                Set times when you don't want to receive real-time notifications
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor="quietHoursEnabled">Enable quiet hours</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Notifications during quiet hours will be queued for later delivery
                                    </p>
                                </div>
                                <Switch
                                    id="quietHoursEnabled"
                                    name="quietHoursEnabled"
                                    defaultChecked={preferences.quietHours?.enabled || false}
                                />
                            </div>

                            {preferences.quietHours?.enabled && (
                                <>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="quietHoursStart">Start Time</Label>
                                            <Input
                                                id="quietHoursStart"
                                                name="quietHoursStart"
                                                type="time"
                                                defaultValue={preferences.quietHours?.startTime || '22:00'}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="quietHoursEnd">End Time</Label>
                                            <Input
                                                id="quietHoursEnd"
                                                name="quietHoursEnd"
                                                type="time"
                                                defaultValue={preferences.quietHours?.endTime || '08:00'}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="timezone">Timezone</Label>
                                        <Select name="timezone" defaultValue={preferences.quietHours?.timezone || 'America/New_York'}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TIMEZONE_OPTIONS.map((tz) => (
                                                    <SelectItem key={tz.value} value={tz.value}>
                                                        {tz.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Save Notification Settings
                    </Button>
                </div>
            </form>
        </div>
    );
}