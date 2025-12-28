'use client';

/**
 * Location Services Demo Page
 * 
 * Demonstrates all location-based features:
 * - Location-based reminders (Req 9.1)
 * - Proximity notifications (Req 9.2)
 * - One-tap navigation (Req 9.3)
 * - Arrival detection (Req 9.4)
 * - Check-in logging (Req 9.5)
 */

import { PageHeader } from '@/components/ui';
import { useState } from 'react';
import { MapPin, Navigation, Bell, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LocationReminderComponent } from '@/components/mobile/location-reminder';
import { ArrivalDisplay } from '@/components/mobile/arrival-display';
import { CheckInLogger } from '@/components/mobile/check-in-logger';
import { NavigationButton } from '@/components/mobile/navigation-button';
import { ProximityNotificationSetup } from '@/components/mobile/proximity-notification-setup';
import type { Appointment } from '@/lib/mobile/location-services';

// Sample appointments for demo
const sampleAppointments: Appointment[] = [
    {
        id: 'apt-1',
        title: 'Property Showing - 123 Main St',
        propertyId: 'prop-123',
        clientName: 'John Smith',
        location: {
            latitude: 37.7749,
            longitude: -122.4194,
        },
        address: '123 Main St, San Francisco, CA 94102',
        startTime: new Date(Date.now() + 3600000), // 1 hour from now
        endTime: new Date(Date.now() + 5400000), // 1.5 hours from now
        notes: 'Client is interested in the backyard and kitchen renovations',
    },
    {
        id: 'apt-2',
        title: 'Open House - 456 Oak Ave',
        propertyId: 'prop-456',
        location: {
            latitude: 37.7849,
            longitude: -122.4094,
        },
        address: '456 Oak Ave, San Francisco, CA 94103',
        startTime: new Date(Date.now() + 7200000), // 2 hours from now
        endTime: new Date(Date.now() + 14400000), // 4 hours from now
        notes: 'Prepare marketing materials and sign-in sheet',
    },
];

export default function LocationServicesPage() {
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const userId = 'demo-user'; // In production, get from auth context

    return (
        <div className="space-y-6">
            {/* Header */}
            <PageHeader
                title="Location Services"
                description="Location-based features to enhance your mobile workflow"
                icon={MapPin}
            />

            {/* Tabs */}
            <Tabs defaultValue="reminders" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="reminders">
                        <Bell className="h-4 w-4 mr-2" />
                        Reminders
                    </TabsTrigger>
                    <TabsTrigger value="navigation">
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                    </TabsTrigger>
                    <TabsTrigger value="arrival">
                        <MapPin className="h-4 w-4 mr-2" />
                        Arrival
                    </TabsTrigger>
                    <TabsTrigger value="checkin">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Check-In
                    </TabsTrigger>
                </TabsList>

                {/* Location Reminders Tab */}
                <TabsContent value="reminders" className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Location-Based Reminders</h2>
                            <p className="text-sm text-muted-foreground">
                                Get notified when you're near an appointment location
                            </p>
                        </div>

                        <ProximityNotificationSetup appointments={sampleAppointments} />

                        <LocationReminderComponent
                            appointments={sampleAppointments}
                            onNavigate={(appointment) => setSelectedAppointment(appointment)}
                        />
                    </div>
                </TabsContent>

                {/* Navigation Tab */}
                <TabsContent value="navigation" className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">One-Tap Navigation</h2>
                            <p className="text-sm text-muted-foreground">
                                Open your device's navigation app with a single tap
                            </p>
                        </div>

                        <div className="space-y-4">
                            {sampleAppointments.map((appointment) => (
                                <div
                                    key={appointment.id}
                                    className="p-4 border rounded-lg space-y-3"
                                >
                                    <div>
                                        <h3 className="font-semibold">{appointment.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {appointment.address}
                                        </p>
                                    </div>
                                    <NavigationButton
                                        destination={appointment.location}
                                        address={appointment.address}
                                        label="Get Directions"
                                        className="w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

                {/* Arrival Detection Tab */}
                <TabsContent value="arrival" className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Arrival Detection</h2>
                            <p className="text-sm text-muted-foreground">
                                Automatically display property information when you arrive
                            </p>
                        </div>

                        {sampleAppointments.map((appointment) => (
                            <ArrivalDisplay
                                key={appointment.id}
                                appointment={appointment}
                                onCheckIn={() => {
                                    console.log('Checked in to:', appointment.title);
                                }}
                            />
                        ))}

                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                            <p>
                                Arrival detection uses your device's location to automatically show
                                property details and client notes when you arrive at an appointment.
                                The detection radius is 50 meters.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* Check-In Tab */}
                <TabsContent value="checkin" className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Check-In Logging</h2>
                            <p className="text-sm text-muted-foreground">
                                Log your visits with location, timestamp, and notes
                            </p>
                        </div>

                        <CheckInLogger
                            userId={userId}
                            appointmentId={sampleAppointments[0].id}
                            propertyId={sampleAppointments[0].propertyId}
                            onCheckInComplete={(checkIn) => {
                                console.log('Check-in completed:', checkIn);
                            }}
                        />

                        <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                            <p>
                                Check-ins are logged with your current GPS coordinates, timestamp,
                                and optional notes. This helps track your visits and provides a
                                record of your field activities.
                            </p>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
