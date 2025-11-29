/**
 * Notification Preferences Component
 * 
 * Allows users to configure their notification settings
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, Smartphone, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils/common';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    NotificationPreferences,
    NotificationPriority,
} from '@/lib/market-notifications';

/**
 * Props for NotificationPreferencesForm component
 */
export interface NotificationPreferencesFormProps {
    preferences: NotificationPreferences;
    onUpdate: (updates: Partial<NotificationPreferences>) => Promise<void>;
    loading?: boolean;
}

/**
 * Notification preferences form
 */
export function NotificationPreferencesForm({
    preferences,
    onUpdate,
    loading = false,
}: NotificationPreferencesFormProps) {
    const [localPreferences, setLocalPreferences] = React.useState(preferences);
    const [saving, setSaving] = React.useState(false);

    // Update local state when preferences prop changes
    React.useEffect(() => {
        setLocalPreferences(preferences);
    }, [preferences]);

    /**
     * Handles preference updates
     */
    const handleUpdate = async (updates: Partial<NotificationPreferences>) => {
        setLocalPreferences((prev) => ({ ...prev, ...updates }));
        setSaving(true);
        try {
            await onUpdate(updates);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Master toggle */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </CardTitle>
                    <CardDescription>
                        Manage how you receive market updates and insights
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="enabled" className="text-base">
                                Enable Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications about market changes and opportunities
                            </p>
                        </div>
                        <Switch
                            id="enabled"
                            checked={localPreferences.enabled}
                            onCheckedChange={(enabled) => handleUpdate({ enabled })}
                            disabled={loading || saving}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Delivery channels */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Delivery Channels
                    </CardTitle>
                    <CardDescription>
                        Choose how you want to receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="in-app" className="text-base">
                                In-App Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Show notifications in the application
                            </p>
                        </div>
                        <Switch
                            id="in-app"
                            checked={localPreferences.channels.in_app}
                            onCheckedChange={(in_app) =>
                                handleUpdate({
                                    channels: { ...localPreferences.channels, in_app },
                                })
                            }
                            disabled={!localPreferences.enabled || loading || saving}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="email" className="text-base flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications via email
                            </p>
                        </div>
                        <Switch
                            id="email"
                            checked={localPreferences.channels.email}
                            onCheckedChange={(email) =>
                                handleUpdate({
                                    channels: { ...localPreferences.channels, email },
                                })
                            }
                            disabled={!localPreferences.enabled || loading || saving}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="push" className="text-base">
                                Push Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive push notifications on your device
                            </p>
                        </div>
                        <Switch
                            id="push"
                            checked={localPreferences.channels.push}
                            onCheckedChange={(push) =>
                                handleUpdate({
                                    channels: { ...localPreferences.channels, push },
                                })
                            }
                            disabled={!localPreferences.enabled || loading || saving}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notification categories */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Notification Types
                    </CardTitle>
                    <CardDescription>
                        Choose which types of notifications you want to receive
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(localPreferences.categories).map(([key, value], index) => (
                        <React.Fragment key={key}>
                            {index > 0 && <Separator />}
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label htmlFor={key} className="text-base">
                                        {formatCategoryName(key)}
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {getCategoryDescription(key)}
                                    </p>
                                </div>
                                <Switch
                                    id={key}
                                    checked={value}
                                    onCheckedChange={(checked) =>
                                        handleUpdate({
                                            categories: {
                                                ...localPreferences.categories,
                                                [key]: checked,
                                            },
                                        })
                                    }
                                    disabled={!localPreferences.enabled || loading || saving}
                                />
                            </div>
                        </React.Fragment>
                    ))}
                </CardContent>
            </Card>

            {/* Priority threshold */}
            <Card>
                <CardHeader>
                    <CardTitle>Priority Threshold</CardTitle>
                    <CardDescription>
                        Only receive notifications at or above this priority level
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Select
                        value={localPreferences.priorityThreshold}
                        onValueChange={(value) =>
                            handleUpdate({ priorityThreshold: value as NotificationPriority })
                        }
                        disabled={!localPreferences.enabled || loading || saving}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low - All notifications</SelectItem>
                            <SelectItem value="medium">Medium - Important updates</SelectItem>
                            <SelectItem value="high">High - Urgent matters only</SelectItem>
                            <SelectItem value="critical">Critical - Emergencies only</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Quiet hours */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Quiet Hours
                    </CardTitle>
                    <CardDescription>
                        Pause non-critical notifications during specific hours
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="quiet-hours" className="text-base">
                                Enable Quiet Hours
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Critical notifications will still come through
                            </p>
                        </div>
                        <Switch
                            id="quiet-hours"
                            checked={localPreferences.quietHours.enabled}
                            onCheckedChange={(enabled) =>
                                handleUpdate({
                                    quietHours: { ...localPreferences.quietHours, enabled },
                                })
                            }
                            disabled={!localPreferences.enabled || loading || saving}
                        />
                    </div>

                    {localPreferences.quietHours.enabled && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="grid grid-cols-2 gap-4 pt-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="quiet-start">Start Time</Label>
                                <Input
                                    id="quiet-start"
                                    type="time"
                                    value={localPreferences.quietHours.start}
                                    onChange={(e) =>
                                        handleUpdate({
                                            quietHours: {
                                                ...localPreferences.quietHours,
                                                start: e.target.value,
                                            },
                                        })
                                    }
                                    disabled={loading || saving}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quiet-end">End Time</Label>
                                <Input
                                    id="quiet-end"
                                    type="time"
                                    value={localPreferences.quietHours.end}
                                    onChange={(e) =>
                                        handleUpdate({
                                            quietHours: {
                                                ...localPreferences.quietHours,
                                                end: e.target.value,
                                            },
                                        })
                                    }
                                    disabled={loading || saving}
                                />
                            </div>
                        </motion.div>
                    )}
                </CardContent>
            </Card>

            {/* Frequency limits */}
            <Card>
                <CardHeader>
                    <CardTitle>Frequency Limits</CardTitle>
                    <CardDescription>
                        Control how many notifications you receive
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="max-per-hour">Maximum per Hour</Label>
                        <Input
                            id="max-per-hour"
                            type="number"
                            min="1"
                            max="20"
                            value={localPreferences.frequency.maxPerHour}
                            onChange={(e) =>
                                handleUpdate({
                                    frequency: {
                                        ...localPreferences.frequency,
                                        maxPerHour: parseInt(e.target.value) || 3,
                                    },
                                })
                            }
                            disabled={!localPreferences.enabled || loading || saving}
                        />
                        <p className="text-xs text-muted-foreground">
                            Limit notifications to prevent overwhelming you
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="max-per-day">Maximum per Day</Label>
                        <Input
                            id="max-per-day"
                            type="number"
                            min="1"
                            max="50"
                            value={localPreferences.frequency.maxPerDay}
                            onChange={(e) =>
                                handleUpdate({
                                    frequency: {
                                        ...localPreferences.frequency,
                                        maxPerDay: parseInt(e.target.value) || 10,
                                    },
                                })
                            }
                            disabled={!localPreferences.enabled || loading || saving}
                        />
                        <p className="text-xs text-muted-foreground">
                            Daily limit for all notifications
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Save indicator */}
            {saving && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-muted-foreground text-center"
                >
                    Saving preferences...
                </motion.div>
            )}
        </div>
    );
}

/**
 * Formats category name for display
 */
function formatCategoryName(key: string): string {
    return key
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Gets description for category
 */
function getCategoryDescription(key: string): string {
    const descriptions: Record<string, string> = {
        market_trend: 'Updates about market trends and changes',
        competitor_activity: 'Alerts about competitor actions',
        opportunity: 'New opportunities in your market',
        warning: 'Important warnings and alerts',
        insight: 'AI-powered insights and tips',
        recommendation: 'Personalized recommendations',
    };

    return descriptions[key] || 'Notification category';
}
