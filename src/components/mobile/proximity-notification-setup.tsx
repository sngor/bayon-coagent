'use client';

/**
 * Proximity Notification Setup Component
 * 
 * Configure proximity notifications for appointments
 * Requirement 9.2: Proximity notifications using geofencing
 */

import { useEffect, useState } from 'react';
import { Bell, MapPin, Radius } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    locationServices,
    type Appointment,
    type ProximityNotification,
} from '@/lib/mobile/location-services';

interface ProximityNotificationSetupProps {
    appointments: Appointment[];
}

export function ProximityNotificationSetup({ appointments }: ProximityNotificationSetupProps) {
    const [enabled, setEnabled] = useState(true);
    const [radius, setRadius] = useState(200); // meters
    const [notifications, setNotifications] = useState<Map<string, ProximityNotification>>(
        new Map()
    );
    const { toast } = useToast();

    useEffect(() => {
        if (!enabled) {
            return;
        }

        // Request notification permission
        const requestPermission = async () => {
            if ('Notification' in window && Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission !== 'granted') {
                    toast({
                        title: 'Notifications disabled',
                        description: 'Please enable notifications to receive proximity alerts',
                        variant: 'destructive',
                    });
                    setEnabled(false);
                }
            }
        };

        requestPermission();
    }, [enabled, toast]);

    useEffect(() => {
        if (!enabled) {
            // Clear all geofences
            locationServices.clearGeofences();
            return;
        }

        // Setup proximity notifications for all appointments
        const setupNotifications = async () => {
            const newNotifications = new Map<string, ProximityNotification>();

            for (const appointment of appointments) {
                // Only setup for upcoming appointments
                if (appointment.startTime > new Date()) {
                    const notification = await locationServices.setupProximityNotification(
                        appointment,
                        radius
                    );
                    newNotifications.set(appointment.id, notification);
                }
            }

            setNotifications(newNotifications);
        };

        setupNotifications();

        // Start location tracking
        locationServices.startLocationTracking();

        return () => {
            locationServices.stopLocationTracking();
        };
    }, [enabled, radius, appointments]);

    const handleToggle = (checked: boolean) => {
        setEnabled(checked);
        if (checked) {
            toast({
                title: 'Proximity notifications enabled',
                description: `You'll be notified when within ${radius}m of appointments`,
            });
        } else {
            toast({
                title: 'Proximity notifications disabled',
                description: 'You will not receive location-based alerts',
            });
        }
    };

    const handleRadiusChange = (value: number[]) => {
        setRadius(value[0]);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        <div>
                            <CardTitle>Proximity Notifications</CardTitle>
                            <CardDescription>
                                Get notified when you're near an appointment
                            </CardDescription>
                        </div>
                    </div>
                    <Switch checked={enabled} onCheckedChange={handleToggle} />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Radius Slider */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                            <Radius className="h-4 w-4" />
                            Notification Radius
                        </Label>
                        <Badge variant="secondary">{radius}m</Badge>
                    </div>
                    <Slider
                        value={[radius]}
                        onValueChange={handleRadiusChange}
                        min={50}
                        max={500}
                        step={50}
                        disabled={!enabled}
                        className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                        You'll be notified when within {radius} meters of an appointment location
                    </p>
                </div>

                {/* Active Notifications */}
                {enabled && notifications.size > 0 && (
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Active Notifications
                        </Label>
                        <div className="space-y-2">
                            {Array.from(notifications.values()).map((notification) => {
                                const appointment = appointments.find(
                                    (a) => a.id === notification.appointmentId
                                );
                                if (!appointment) return null;

                                return (
                                    <div
                                        key={notification.id}
                                        className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                                    >
                                        <div className="flex-1">
                                            <div className="font-medium">{appointment.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {appointment.address}
                                            </div>
                                        </div>
                                        {notification.sent && (
                                            <Badge variant="outline" className="text-xs">
                                                Sent
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                    <p>
                        Proximity notifications use your device's location to alert you when you're
                        near an appointment. Location tracking runs in the background when enabled.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
