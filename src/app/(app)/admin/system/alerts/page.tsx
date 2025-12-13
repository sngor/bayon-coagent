'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getAlertPreferences, updateAlertPreferences } from '@/features/admin/actions/admin-actions';
import { AlertPreferences } from '@/services/admin/alert-preferences-service';
import { Bell, Clock, Shield, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function AlertPreferencesPage() {
    const [preferences, setPreferences] = useState<AlertPreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const result = await getAlertPreferences();
            if (result.success && result.data) {
                setPreferences(result.data);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to load alert preferences',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!preferences) return;

        setSaving(true);
        try {
            const result = await updateAlertPreferences(preferences);
            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Alert preferences updated successfully',
                });
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to update preferences',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Error saving preferences:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading alert preferences...</p>
                </div>
            </div>
        );
    }

    if (!preferences) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Failed to load alert preferences</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="font-headline text-3xl font-bold">Alert Preferences</h1>
                <p className="text-muted-foreground mt-2">
                    Configure how and when you receive system alerts
                </p>
            </div>

            {/* Alert Types */}
            <Card>
                <CardHeader>
                    <CardTitle>Alert Types</CardTitle>
                    <CardDescription>
                        Choose which types of alerts you want to receive
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Activity className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="systemHealth">System Health</Label>
                                <p className="text-sm text-muted-foreground">
                                    Alerts about system performance and availability
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="systemHealth"
                            checked={preferences.alertTypes.systemHealth}
                            onCheckedChange={(checked) =>
                                setPreferences({
                                    ...preferences,
                                    alertTypes: { ...preferences.alertTypes, systemHealth: checked },
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <TrendingUp className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="errorRates">Error Rates</Label>
                                <p className="text-sm text-muted-foreground">
                                    Alerts when error rates exceed thresholds
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="errorRates"
                            checked={preferences.alertTypes.errorRates}
                            onCheckedChange={(checked) =>
                                setPreferences({
                                    ...preferences,
                                    alertTypes: { ...preferences.alertTypes, errorRates: checked },
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="performanceIssues">Performance Issues</Label>
                                <p className="text-sm text-muted-foreground">
                                    Alerts about latency and performance degradation
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="performanceIssues"
                            checked={preferences.alertTypes.performanceIssues}
                            onCheckedChange={(checked) =>
                                setPreferences({
                                    ...preferences,
                                    alertTypes: { ...preferences.alertTypes, performanceIssues: checked },
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Shield className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="securityAlerts">Security Alerts</Label>
                                <p className="text-sm text-muted-foreground">
                                    Alerts about security incidents and threats
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="securityAlerts"
                            checked={preferences.alertTypes.securityAlerts}
                            onCheckedChange={(checked) =>
                                setPreferences({
                                    ...preferences,
                                    alertTypes: { ...preferences.alertTypes, securityAlerts: checked },
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="billingAlerts">Billing Alerts</Label>
                                <p className="text-sm text-muted-foreground">
                                    Alerts about billing and cost anomalies
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="billingAlerts"
                            checked={preferences.alertTypes.billingAlerts}
                            onCheckedChange={(checked) =>
                                setPreferences({
                                    ...preferences,
                                    alertTypes: { ...preferences.alertTypes, billingAlerts: checked },
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notification Frequency */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification Frequency</CardTitle>
                    <CardDescription>
                        Choose how often you want to receive alerts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="frequency">Frequency</Label>
                        <Select
                            value={preferences.frequency}
                            onValueChange={(value: 'immediate' | 'hourly' | 'daily') =>
                                setPreferences({ ...preferences, frequency: value })
                            }
                        >
                            <SelectTrigger id="frequency">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="immediate">Immediate</SelectItem>
                                <SelectItem value="hourly">Hourly Batch</SelectItem>
                                <SelectItem value="daily">Daily Digest</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                            {preferences.frequency === 'immediate' && 'Receive alerts as they occur'}
                            {preferences.frequency === 'hourly' && 'Receive a summary every hour'}
                            {preferences.frequency === 'daily' && 'Receive a daily digest at 9 AM'}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Severity Threshold */}
            <Card>
                <CardHeader>
                    <CardTitle>Severity Threshold</CardTitle>
                    <CardDescription>
                        Only receive alerts above this severity level
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="severity">Minimum Severity</Label>
                        <Select
                            value={preferences.severityThreshold}
                            onValueChange={(value: 'info' | 'warning' | 'critical') =>
                                setPreferences({ ...preferences, severityThreshold: value })
                            }
                        >
                            <SelectTrigger id="severity">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="info">Info and above</SelectItem>
                                <SelectItem value="warning">Warning and above</SelectItem>
                                <SelectItem value="critical">Critical only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
                <CardHeader>
                    <CardTitle>Quiet Hours</CardTitle>
                    <CardDescription>
                        Pause non-critical alerts during specific hours
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="quietHours">Enable Quiet Hours</Label>
                        <Switch
                            id="quietHours"
                            checked={preferences.quietHours?.enabled || false}
                            onCheckedChange={(checked) =>
                                setPreferences({
                                    ...preferences,
                                    quietHours: {
                                        ...preferences.quietHours!,
                                        enabled: checked,
                                    },
                                })
                            }
                        />
                    </div>

                    {preferences.quietHours?.enabled && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startHour">Start Hour</Label>
                                <Select
                                    value={preferences.quietHours.startHour.toString()}
                                    onValueChange={(value) =>
                                        setPreferences({
                                            ...preferences,
                                            quietHours: {
                                                ...preferences.quietHours!,
                                                startHour: parseInt(value),
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger id="startHour">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                                {i.toString().padStart(2, '0')}:00
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endHour">End Hour</Label>
                                <Select
                                    value={preferences.quietHours.endHour.toString()}
                                    onValueChange={(value) =>
                                        setPreferences({
                                            ...preferences,
                                            quietHours: {
                                                ...preferences.quietHours!,
                                                endHour: parseInt(value),
                                            },
                                        })
                                    }
                                >
                                    <SelectTrigger id="endHour">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 24 }, (_, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                                {i.toString().padStart(2, '0')}:00
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Preferences'}
                </Button>
            </div>
        </div>
    );
}
