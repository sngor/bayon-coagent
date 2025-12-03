'use client';

/**
 * Arrival Display Component
 * 
 * Displays property information and client notes when agent arrives at location
 * Requirement 9.4: Arrival information display
 */

import { useEffect, useState } from 'react';
import { MapPin, User, FileText, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { locationServices, type Appointment } from '@/lib/mobile/location-services';

interface ArrivalDisplayProps {
    appointment: Appointment;
    onCheckIn?: () => void;
    onDismiss?: () => void;
}

export function ArrivalDisplay({ appointment, onCheckIn, onDismiss }: ArrivalDisplayProps) {
    const [hasArrived, setHasArrived] = useState(false);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    useEffect(() => {
        // Setup arrival detection
        locationServices.setupArrivalDetection(
            appointment,
            () => {
                setHasArrived(true);
            },
            50 // 50 meters radius
        );

        // Check if already arrived
        const checkArrival = async () => {
            const arrived = await locationServices.detectArrival(appointment);
            setHasArrived(arrived);
        };

        checkArrival();
    }, [appointment]);

    const handleCheckIn = async () => {
        setIsCheckedIn(true);
        if (onCheckIn) {
            onCheckIn();
        }
    };

    if (!hasArrived) {
        return null;
    }

    return (
        <Card className="border-primary">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <div>
                            <CardTitle>You've Arrived!</CardTitle>
                            <CardDescription>{appointment.address}</CardDescription>
                        </div>
                    </div>
                    {isCheckedIn && (
                        <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Checked In
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Appointment Details */}
                <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Appointment Details</h4>
                    <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>
                                {appointment.startTime.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                                {' - '}
                                {appointment.endTime.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>
                        {appointment.clientName && (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{appointment.clientName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Property Information */}
                {appointment.propertyId && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Property Information</h4>
                            <div className="text-sm text-muted-foreground">
                                Property ID: {appointment.propertyId}
                            </div>
                        </div>
                    </>
                )}

                {/* Client Notes */}
                {appointment.notes && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <h4 className="font-semibold text-sm">Notes</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                    {!isCheckedIn && (
                        <Button onClick={handleCheckIn} className="flex-1">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Check In
                        </Button>
                    )}
                    {onDismiss && (
                        <Button variant="outline" onClick={onDismiss} className="flex-1">
                            Dismiss
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
