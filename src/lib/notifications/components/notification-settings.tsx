/**
 * Notification Settings Component
 * 
 * Form component for managing user notification preferences.
 * Provides channel-specific controls (email, push, in-app) and frequency settings.
 * Validates Requirements: 3.1, 3.2
 */

"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Mail, Bell, Smartphone, Clock, Moon, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
    NotificationPreferences,
    NotificationType,
    EmailFrequency,
} from "../types";

/**
 * Props for NotificationSettings component
 */
export interface NotificationSettingsProps {
    /**
     * User ID to manage preferences for
     */
    userId: string;

    /**
     * Callback when preferences are updated
     */
    onUpdate?: (preferences: NotificationPreferences) => void;

    /**
     * Custom className
     */
    className?: string;
}

/**
 * Notification type labels for display
 */
const NOTIFICATION_TYPE_LABELS: Record<NotificationType, { label: string; description: string }> = {
    [NotificationType.SYSTEM]: {
        label: "System Notifications",
        description: "Important system updates and maintenance notices",
    },
    [NotificationType.ALERT]: {
        label: "Alerts",
        description: "Critical alerts requiring immediate attention",
    },
    [NotificationType.REMINDER]: {
        label: "Reminders",
        description: "Task reminders and scheduled notifications",
    },
    [NotificationType.ACHIEVEMENT]: {
        label: "Achievements",
        description: "Milestone celebrations and accomplishments",
    },
    [NotificationType.ANNOUNCEMENT]: {
        label: "Announcements",
        description: "Product updates and new feature announcements",
    },
    [NotificationType.TASK_COMPLETION]: {
        label: "Task Completions",
        description: "Notifications when tasks are completed",
    },
    [NotificationType.FEATURE_UPDATE]: {
        label: "Feature Updates",
        description: "Updates about new features and improvements",
    },
};

/**
 * Email frequency options
 */
const EMAIL_FREQUENCY_OPTIONS = [
    {
        value: EmailFrequency.IMMEDIATE,
        label: "Immediate",
        description: "Receive emails as notifications arrive",
    },
    {
        value: EmailFrequency.HOURLY,
        label: "Hourly Digest",
        description: "Receive a summary every hour",
    },
    {
        value: EmailFrequency.DAILY,
        label: "Daily Digest",
        description: "Receive a summary once per day",
    },
    {
        value: EmailFrequency.WEEKLY,
        label: "Weekly Digest",
        description: "Receive a summary once per week",
    },
];

/**
 * Timezone options
 */
const TIMEZONE_OPTIONS = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Phoenix", label: "Arizona Time (MST)" },
    { value: "America/Anchorage", label: "Alaska Time (AKST)" },
    { value: "Pacific/Honolulu", label: "Hawaii Time (HST)" },
];

/**
 * Default notification preferences
 */
const DEFAULT_PREFERENCES: NotificationPreferences = {
    userId: "",
    channels: {
        inApp: {
            enabled: true,
            types: Object.values(NotificationType),
        },
        email: {
            enabled: false,
            types: [
                NotificationType.SYSTEM,
                NotificationType.ALERT,
                NotificationType.REMINDER,
            ],
            frequency: EmailFrequency.DAILY,
            digestTime: "09:00",
            quietHours: {
                enabled: false,
                startTime: "22:00",
                endTime: "08:00",
                timezone: "America/New_York",
            },
        },
        push: {
            enabled: false,
            types: [
                NotificationType.ALERT,
                NotificationType.REMINDER,
            ],
        },
    },
    globalSettings: {
        doNotDisturb: false,
    },
    updatedAt: new Date().toISOString(),
};

/**
 * NotificationSettings
 * 
 * Main notification settings component with form controls for all preferences.
 * Validates Requirements: 3.1, 3.2
 */
export function NotificationSettings({
    userId,
    onUpdate,
    className,
}: NotificationSettingsProps) {
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        ...DEFAULT_PREFERENCES,
        userId,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    /**
     * Load user preferences on mount
     */
    useEffect(() => {
        loadPreferences();
    }, [userId]);

    /**
     * Fetches user preferences from the server
     */
    const loadPreferences = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/notifications/preferences?userId=${userId}`);

            if (!response.ok) {
                throw new Error("Failed to load preferences");
            }

            const data = await response.json();
            if (data.preferences) {
                setPreferences(data.preferences);
            }
        } catch (error) {
            console.error("[NotificationSettings] Load error:", error);
            toast({
                title: "Error",
                description: "Failed to load notification preferences",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Saves preferences to the server
     */
    const savePreferences = async () => {
        setIsSaving(true);
        try {
            const response = await fetch("/api/notifications/preferences", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    preferences: {
                        ...preferences,
                        updatedAt: new Date().toISOString(),
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save preferences");
            }

            const data = await response.json();
            if (data.preferences) {
                setPreferences(data.preferences);
                onUpdate?.(data.preferences);
            }

            toast({
                title: "Settings Saved",
                description: "Your notification preferences have been updated",
            });
        } catch (error) {
            console.error("[NotificationSettings] Save error:", error);
            toast({
                title: "Error",
                description: "Failed to save notification preferences",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Updates a specific preference field
     */
    const updatePreference = <K extends keyof NotificationPreferences>(
        key: K,
        value: NotificationPreferences[K]
    ) => {
        setPreferences((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    /**
     * Toggles a notification type for a channel
     */
    const toggleNotificationType = (
        channel: "inApp" | "email" | "push",
        type: NotificationType,
        enabled: boolean
    ) => {
        setPreferences((prev) => {
            const channelPrefs = prev.channels[channel];
            const types = enabled
                ? [...channelPrefs.types, type]
                : channelPrefs.types.filter((t) => t !== type);

            return {
                ...prev,
                channels: {
                    ...prev.channels,
                    [channel]: {
                        ...channelPrefs,
                        types,
                    },
                },
            };
        });
    };

    if (isLoading) {
        return (
            <Card className={className}>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading preferences...</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Global Settings */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        Global Settings
                    </CardTitle>
                    <CardDescription>
                        Settings that apply to all notification channels
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="doNotDisturb">Do Not Disturb</Label>
                            <p className="text-sm text-muted-foreground">
                                Pause all notifications temporarily
                            </p>
                        </div>
                        <Switch
                            id="doNotDisturb"
                            checked={preferences.globalSettings.doNotDisturb}
                            onCheckedChange={(checked) =>
                                updatePreference("globalSettings", {
                                    ...preferences.globalSettings,
                                    doNotDisturb: checked,
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        In-App Notifications
                    </CardTitle>
                    <CardDescription>
                        Notifications displayed within the application
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="inAppEnabled">Enable in-app notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Show notifications in the notification center
                            </p>
                        </div>
                        <Switch
                            id="inAppEnabled"
                            checked={preferences.channels.inApp.enabled}
                            onCheckedChange={(checked) =>
                                updatePreference("channels", {
                                    ...preferences.channels,
                                    inApp: {
                                        ...preferences.channels.inApp,
                                        enabled: checked,
                                    },
                                })
                            }
                        />
                    </div>

                    {preferences.channels.inApp.enabled && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <Label>Notification Types</Label>
                                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, info]) => (
                                    <div key={type} className="flex items-start space-x-3">
                                        <Checkbox
                                            id={`inApp-${type}`}
                                            checked={preferences.channels.inApp.types.includes(
                                                type as NotificationType
                                            )}
                                            onCheckedChange={(checked) =>
                                                toggleNotificationType(
                                                    "inApp",
                                                    type as NotificationType,
                                                    checked as boolean
                                                )
                                            }
                                        />
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor={`inApp-${type}`}
                                                className="font-medium cursor-pointer"
                                            >
                                                {info.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {info.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Email Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Mail className="h-5 w-5" />
                        Email Notifications
                    </CardTitle>
                    <CardDescription>
                        Receive notifications via email
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="emailEnabled">Enable email notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications in your inbox
                            </p>
                        </div>
                        <Switch
                            id="emailEnabled"
                            checked={preferences.channels.email.enabled}
                            onCheckedChange={(checked) =>
                                updatePreference("channels", {
                                    ...preferences.channels,
                                    email: {
                                        ...preferences.channels.email,
                                        enabled: checked,
                                    },
                                })
                            }
                        />
                    </div>

                    {preferences.channels.email.enabled && (
                        <>
                            <Separator />

                            {/* Email Address */}
                            <div className="space-y-2">
                                <Label htmlFor="emailAddress">Email Address (Optional)</Label>
                                <Input
                                    id="emailAddress"
                                    type="email"
                                    placeholder="your@email.com"
                                    value={preferences.channels.email.address || ""}
                                    onChange={(e) =>
                                        updatePreference("channels", {
                                            ...preferences.channels,
                                            email: {
                                                ...preferences.channels.email,
                                                address: e.target.value,
                                            },
                                        })
                                    }
                                />
                                <p className="text-sm text-muted-foreground">
                                    Leave blank to use your account email
                                </p>
                            </div>

                            {/* Notification Types */}
                            <div className="space-y-3">
                                <Label>Notification Types</Label>
                                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, info]) => (
                                    <div key={type} className="flex items-start space-x-3">
                                        <Checkbox
                                            id={`email-${type}`}
                                            checked={preferences.channels.email.types.includes(
                                                type as NotificationType
                                            )}
                                            onCheckedChange={(checked) =>
                                                toggleNotificationType(
                                                    "email",
                                                    type as NotificationType,
                                                    checked as boolean
                                                )
                                            }
                                        />
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor={`email-${type}`}
                                                className="font-medium cursor-pointer"
                                            >
                                                {info.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {info.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Email Frequency */}
                            <div className="space-y-3">
                                <Label>Email Frequency</Label>
                                {EMAIL_FREQUENCY_OPTIONS.map((option) => (
                                    <div key={option.value} className="flex items-start space-x-3">
                                        <input
                                            type="radio"
                                            id={`frequency-${option.value}`}
                                            name="emailFrequency"
                                            value={option.value}
                                            checked={preferences.channels.email.frequency === option.value}
                                            onChange={() =>
                                                updatePreference("channels", {
                                                    ...preferences.channels,
                                                    email: {
                                                        ...preferences.channels.email,
                                                        frequency: option.value,
                                                    },
                                                })
                                            }
                                            className="mt-1"
                                            aria-label={option.label}
                                        />
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor={`frequency-${option.value}`}
                                                className="font-medium cursor-pointer"
                                            >
                                                {option.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {option.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Digest Time */}
                            {(preferences.channels.email.frequency === EmailFrequency.DAILY ||
                                preferences.channels.email.frequency === EmailFrequency.WEEKLY) && (
                                    <>
                                        <Separator />
                                        <div className="space-y-2">
                                            <Label htmlFor="digestTime">Delivery Time</Label>
                                            <Input
                                                id="digestTime"
                                                type="time"
                                                value={preferences.channels.email.digestTime || "09:00"}
                                                onChange={(e) =>
                                                    updatePreference("channels", {
                                                        ...preferences.channels,
                                                        email: {
                                                            ...preferences.channels.email,
                                                            digestTime: e.target.value,
                                                        },
                                                    })
                                                }
                                            />
                                            <p className="text-sm text-muted-foreground">
                                                Time of day to receive digest emails
                                            </p>
                                        </div>
                                    </>
                                )}

                            {/* Quiet Hours */}
                            {preferences.channels.email.frequency === EmailFrequency.IMMEDIATE && (
                                <>
                                    <Separator />
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label htmlFor="quietHoursEnabled">Quiet Hours</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Don't send emails during specific hours
                                                </p>
                                            </div>
                                            <Switch
                                                id="quietHoursEnabled"
                                                checked={preferences.channels.email.quietHours?.enabled || false}
                                                onCheckedChange={(checked) =>
                                                    updatePreference("channels", {
                                                        ...preferences.channels,
                                                        email: {
                                                            ...preferences.channels.email,
                                                            quietHours: {
                                                                ...(preferences.channels.email.quietHours || {
                                                                    startTime: "22:00",
                                                                    endTime: "08:00",
                                                                    timezone: "America/New_York",
                                                                }),
                                                                enabled: checked,
                                                            },
                                                        },
                                                    })
                                                }
                                            />
                                        </div>

                                        {preferences.channels.email.quietHours?.enabled && (
                                            <div className="space-y-4 pl-4 border-l-2">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="quietHoursStart">Start Time</Label>
                                                        <Input
                                                            id="quietHoursStart"
                                                            type="time"
                                                            value={
                                                                preferences.channels.email.quietHours?.startTime ||
                                                                "22:00"
                                                            }
                                                            onChange={(e) =>
                                                                updatePreference("channels", {
                                                                    ...preferences.channels,
                                                                    email: {
                                                                        ...preferences.channels.email,
                                                                        quietHours: {
                                                                            ...preferences.channels.email.quietHours!,
                                                                            startTime: e.target.value,
                                                                        },
                                                                    },
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="quietHoursEnd">End Time</Label>
                                                        <Input
                                                            id="quietHoursEnd"
                                                            type="time"
                                                            value={
                                                                preferences.channels.email.quietHours?.endTime ||
                                                                "08:00"
                                                            }
                                                            onChange={(e) =>
                                                                updatePreference("channels", {
                                                                    ...preferences.channels,
                                                                    email: {
                                                                        ...preferences.channels.email,
                                                                        quietHours: {
                                                                            ...preferences.channels.email.quietHours!,
                                                                            endTime: e.target.value,
                                                                        },
                                                                    },
                                                                })
                                                            }
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="timezone">Timezone</Label>
                                                    <Select
                                                        value={
                                                            preferences.channels.email.quietHours?.timezone ||
                                                            "America/New_York"
                                                        }
                                                        onValueChange={(value) =>
                                                            updatePreference("channels", {
                                                                ...preferences.channels,
                                                                email: {
                                                                    ...preferences.channels.email,
                                                                    quietHours: {
                                                                        ...preferences.channels.email.quietHours!,
                                                                        timezone: value,
                                                                    },
                                                                },
                                                            })
                                                        }
                                                    >
                                                        <SelectTrigger id="timezone">
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
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Push Notifications */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
                        Push Notifications
                    </CardTitle>
                    <CardDescription>
                        Receive browser push notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="pushEnabled">Enable push notifications</Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications even when the app is closed
                            </p>
                        </div>
                        <Switch
                            id="pushEnabled"
                            checked={preferences.channels.push.enabled}
                            onCheckedChange={(checked) =>
                                updatePreference("channels", {
                                    ...preferences.channels,
                                    push: {
                                        ...preferences.channels.push,
                                        enabled: checked,
                                    },
                                })
                            }
                        />
                    </div>

                    {preferences.channels.push.enabled && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <Label>Notification Types</Label>
                                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, info]) => (
                                    <div key={type} className="flex items-start space-x-3">
                                        <Checkbox
                                            id={`push-${type}`}
                                            checked={preferences.channels.push.types.includes(
                                                type as NotificationType
                                            )}
                                            onCheckedChange={(checked) =>
                                                toggleNotificationType(
                                                    "push",
                                                    type as NotificationType,
                                                    checked as boolean
                                                )
                                            }
                                        />
                                        <div className="space-y-1">
                                            <Label
                                                htmlFor={`push-${type}`}
                                                className="font-medium cursor-pointer"
                                            >
                                                {info.label}
                                            </Label>
                                            <p className="text-sm text-muted-foreground">
                                                {info.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={savePreferences}
                    disabled={isSaving}
                    size="lg"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Preferences
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
