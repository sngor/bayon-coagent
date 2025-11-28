/**
 * NotificationSettings Component
 * 
 * Form component for managing user notification preferences.
 * Allows users to configure channels, types, frequency, and quiet hours.
 * Validates Requirements: 3.1, 3.2
 */

"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Smartphone, Clock, Moon } from "lucide-react";
import {
    NotificationPreferences,
    NotificationType,
    EmailFrequency,
} from "@/lib/notifications/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * NotificationSettings Props
 */
interface NotificationSettingsProps {
    /**
     * User ID to manage preferences for
     */
    userId: string;

    /**
     * Callback when preferences are saved
     */
    onSave?: (preferences: NotificationPreferences) => void;

    /**
     * Custom className
     */
    className?: string;
}

/**
 * Notification type labels
 */
const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
    [NotificationType.SYSTEM]: "System notifications",
    [NotificationType.ALERT]: "Alerts and warnings",
    [NotificationType.REMINDER]: "Reminders",
    [NotificationType.ACHIEVEMENT]: "Achievements",
    [NotificationType.ANNOUNCEMENT]: "Announcements",
    [NotificationType.TASK_COMPLETION]: "Task completions",
    [NotificationType.FEATURE_UPDATE]: "Feature updates",
};

/**
 * Email frequency labels
 */
const EMAIL_FREQUENCY_LABELS: Record<EmailFrequency, string> = {
    [EmailFrequency.IMMEDIATE]: "Immediately",
    [EmailFrequency.HOURLY]: "Hourly digest",
    [EmailFrequency.DAILY]: "Daily digest",
    [EmailFrequency.WEEKLY]: "Weekly digest",
};

/**
 * NotificationSettings
 * 
 * Comprehensive settings form for notification preferences.
 * Organized by channel with type-specific controls.
 * 
 * @example
 * ```tsx
 * <NotificationSettings
 *   userId="user-123"
 *   onSave={(preferences) => {
 *     console.log('Preferences saved:', preferences);
 *   }}
 * />
 * ```
 */
export function NotificationSettings({
    userId,
    onSave,
    className,
}: NotificationSettingsProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

    /**
     * Fetches current preferences
     */
    useEffect(() => {
        const fetchPreferences = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/notifications/preferences?userId=${userId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch preferences");
                }
                const data = await response.json();
                setPreferences(data.preferences);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load notification preferences",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchPreferences();
    }, [userId, toast]);

    /**
     * Saves preferences
     */
    const handleSave = async () => {
        if (!preferences) return;

        setIsSaving(true);
        try {
            const response = await fetch(`/api/notifications/preferences`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    preferences,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save preferences");
            }

            toast({
                title: "Success",
                description: "Notification preferences saved",
            });

            onSave?.(preferences);
        } catch (error) {
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
     * Updates a preference value
     */
    const updatePreference = (path: string[], value: any) => {
        if (!preferences) return;

        setPreferences((prev) => {
            if (!prev) return prev;

            const updated = { ...prev };
            let current: any = updated;

            // Navigate to the parent of the target property
            for (let i = 0; i < path.length - 1; i++) {
                current[path[i]] = { ...current[path[i]] };
                current = current[path[i]];
            }

            // Set the value
            current[path[path.length - 1]] = value;

            return updated;
        });
    };

    if (isLoading) {
        return (
            <div className={cn("flex items-center justify-center p-8", className)}>
                <p className="text-muted-foreground">Loading preferences...</p>
            </div>
        );
    }

    if (!preferences) {
        return (
            <div className={cn("flex items-center justify-center p-8", className)}>
                <p className="text-destructive">Failed to load preferences</p>
            </div>
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
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Do Not Disturb</Label>
                            <p className="text-sm text-muted-foreground">
                                Pause all notifications except critical alerts
                            </p>
                        </div>
                        <Switch
                            checked={preferences.globalSettings.doNotDisturb}
                            onCheckedChange={(checked) =>
                                updatePreference(["globalSettings", "doNotDisturb"], checked)
                            }
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Maximum Daily Notifications</Label>
                        <Input
                            type="number"
                            min="0"
                            max="100"
                            value={preferences.globalSettings.maxDailyNotifications || ""}
                            onChange={(e) =>
                                updatePreference(
                                    ["globalSettings", "maxDailyNotifications"],
                                    e.target.value ? parseInt(e.target.value) : undefined
                                )
                            }
                            placeholder="No limit"
                        />
                        <p className="text-sm text-muted-foreground">
                            Leave empty for no limit
                        </p>
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
                        Notifications shown within the application
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Enable in-app notifications</Label>
                        <Switch
                            checked={preferences.channels.inApp.enabled}
                            onCheckedChange={(checked) =>
                                updatePreference(["channels", "inApp", "enabled"], checked)
                            }
                        />
                    </div>

                    {preferences.channels.inApp.enabled && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <Label>Notification Types</Label>
                                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, label]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm">{label}</span>
                                        <Switch
                                            checked={preferences.channels.inApp.types.includes(
                                                type as NotificationType
                                            )}
                                            onCheckedChange={(checked) => {
                                                const types = checked
                                                    ? [...preferences.channels.inApp.types, type as NotificationType]
                                                    : preferences.channels.inApp.types.filter(
                                                        (t) => t !== type
                                                    );
                                                updatePreference(["channels", "inApp", "types"], types);
                                            }}
                                        />
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
                        Notifications sent to your email address
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Enable email notifications</Label>
                        <Switch
                            checked={preferences.channels.email.enabled}
                            onCheckedChange={(checked) =>
                                updatePreference(["channels", "email", "enabled"], checked)
                            }
                        />
                    </div>

                    {preferences.channels.email.enabled && (
                        <>
                            <Separator />

                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input
                                    type="email"
                                    value={preferences.channels.email.address || ""}
                                    onChange={(e) =>
                                        updatePreference(
                                            ["channels", "email", "address"],
                                            e.target.value
                                        )
                                    }
                                    placeholder="your@email.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select
                                    value={preferences.channels.email.frequency}
                                    onValueChange={(value) =>
                                        updatePreference(
                                            ["channels", "email", "frequency"],
                                            value as EmailFrequency
                                        )
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(EMAIL_FREQUENCY_LABELS).map(([value, label]) => (
                                            <SelectItem key={value} value={value}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {preferences.channels.email.frequency !== EmailFrequency.IMMEDIATE && (
                                <div className="space-y-2">
                                    <Label>Digest Time</Label>
                                    <Input
                                        type="time"
                                        value={preferences.channels.email.digestTime || "09:00"}
                                        onChange={(e) =>
                                            updatePreference(
                                                ["channels", "email", "digestTime"],
                                                e.target.value
                                            )
                                        }
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Time to send digest emails
                                    </p>
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Quiet Hours</Label>
                                    <Switch
                                        checked={preferences.channels.email.quietHours?.enabled || false}
                                        onCheckedChange={(checked) =>
                                            updatePreference(
                                                ["channels", "email", "quietHours", "enabled"],
                                                checked
                                            )
                                        }
                                    />
                                </div>

                                {preferences.channels.email.quietHours?.enabled && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Start Time</Label>
                                            <Input
                                                type="time"
                                                value={
                                                    preferences.channels.email.quietHours?.startTime ||
                                                    "22:00"
                                                }
                                                onChange={(e) =>
                                                    updatePreference(
                                                        ["channels", "email", "quietHours", "startTime"],
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>End Time</Label>
                                            <Input
                                                type="time"
                                                value={
                                                    preferences.channels.email.quietHours?.endTime ||
                                                    "08:00"
                                                }
                                                onChange={(e) =>
                                                    updatePreference(
                                                        ["channels", "email", "quietHours", "endTime"],
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <Label>Notification Types</Label>
                                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, label]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm">{label}</span>
                                        <Switch
                                            checked={preferences.channels.email.types.includes(
                                                type as NotificationType
                                            )}
                                            onCheckedChange={(checked) => {
                                                const types = checked
                                                    ? [...preferences.channels.email.types, type as NotificationType]
                                                    : preferences.channels.email.types.filter(
                                                        (t) => t !== type
                                                    );
                                                updatePreference(["channels", "email", "types"], types);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
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
                        Browser push notifications for urgent alerts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Enable push notifications</Label>
                        <Switch
                            checked={preferences.channels.push.enabled}
                            onCheckedChange={(checked) =>
                                updatePreference(["channels", "push", "enabled"], checked)
                            }
                        />
                    </div>

                    {preferences.channels.push.enabled && (
                        <>
                            <Separator />
                            <div className="space-y-3">
                                <Label>Notification Types</Label>
                                {Object.entries(NOTIFICATION_TYPE_LABELS).map(([type, label]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm">{label}</span>
                                        <Switch
                                            checked={preferences.channels.push.types.includes(
                                                type as NotificationType
                                            )}
                                            onCheckedChange={(checked) => {
                                                const types = checked
                                                    ? [...preferences.channels.push.types, type as NotificationType]
                                                    : preferences.channels.push.types.filter(
                                                        (t) => t !== type
                                                    );
                                                updatePreference(["channels", "push", "types"], types);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save Preferences"}
                </Button>
            </div>
        </div>
    );
}
