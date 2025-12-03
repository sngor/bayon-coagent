'use client';

/**
 * Location Reminder Component
 * 
 * Displays location-based reminders for appointments
 * Requirement 9.1: Location-based reminders
 */

import { useEffect, useState } from 'react';
import { Bell, MapPin, Navigation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { locationServices, type Appointment, type LocationReminder } from '@/lib/mobile/location-services';

interface LocationReminderProps {
    appointments: Appointment[];
    onNavigate?: (appointment: Appointment) => void;
}

export function LocationReminderComponent({ appointments, onNavigate }: LocationReminderProps) {
    const [reminders, setReminders] = useState<Map<string, LocationReminder>>(new Map());
    const [nearbyAppointments, setNearbyAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        // Create reminders for all appointments
        const setupReminders = async () => {
            const newReminders = new Map<string, LocationReminder>();

            for (const appointment of appointments) {
                // Only create reminders for upcoming appointments
                if (appointment.startTime > new Date()) {
                    const reminder = await locationServices.createLocationReminder(
                        appointment,
                        500 // 500 meters radius
                    );
                    newReminders.set(appointment.id, reminder);
                }
            }

            setReminders(newReminders);
        };

        setupReminders();

        // Start location tracking
        locationServices.startLocationTracking();

        return () => {
            locationServices.stopLocationTracking();
        };
    }, [appointments]);

    useEffect(() => {
        // Check for nearby appointments
        const checkNearby = async () => {
            try {
                const currentLocation = await locationServices.getCurrentLocation();
                const nearby = appointments.filter((appointment) => {
                    const distance = locationServices.calculateDistance(
                        currentLocation,
                        appointment.location
                    );
                    return distance <= 1000; // Within 1km
                });
                setNearbyAppointments(nearby);
            } catch (error) {
                console.error('Failed to check nearby appointments:', error);
            }
        };

        checkNearby();
        const interval = setInterval(checkNearby, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [appointments]);

    if (nearbyAppointments.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Nearby Appointments</h3>
            </div>

            {nearbyAppointments.map((appointment) => {
                const reminder = reminders.get(appointment.id);
                return (
                    <Card key={appointment.id}>
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <CardTitle className="text-base">{appointment.title}</CardTitle>
                                    <CardDescription className="mt-1">
                                        {appointment.address}
                                    </CardDescription>
                                </div>
                                {reminder?.triggered && (
                                    <Badge variant="secondary" className="ml-2">
                                        <Bell className="h-3 w-3 mr-1" />
                                        Notified
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    {appointment.startTime.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        if (onNavigate) {
                                            onNavigate(appointment);
                                        } else {
                                            locationServices.openNavigation(
                                                appointment.location,
                                                appointment.address
                                            );
                                        }
                                    }}
                                >
                                    <Navigation className="h-4 w-4 mr-2" />
                                    Navigate
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
