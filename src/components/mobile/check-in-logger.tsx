'use client';

/**
 * Check-In Logger Component
 * 
 * Allows agents to log check-ins at locations with timestamp and coordinates
 * Requirement 9.5: Check-in logging
 */

import { useState } from 'react';
import { MapPin, Clock, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { locationServices, type CheckIn } from '@/lib/mobile/location-services';

interface CheckInLoggerProps {
    userId: string;
    appointmentId?: string;
    propertyId?: string;
    onCheckInComplete?: (checkIn: CheckIn) => void;
}

export function CheckInLogger({
    userId,
    appointmentId,
    propertyId,
    onCheckInComplete,
}: CheckInLoggerProps) {
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [lastCheckIn, setLastCheckIn] = useState<CheckIn | null>(null);
    const { toast } = useToast();

    const handleCheckIn = async () => {
        setIsLoading(true);

        try {
            const checkIn = await locationServices.checkIn(
                userId,
                appointmentId,
                propertyId,
                notes || undefined
            );

            setLastCheckIn(checkIn);
            setNotes('');

            toast({
                title: 'Check-in successful',
                description: `Logged at ${checkIn.timestamp.toLocaleTimeString()}`,
            });

            if (onCheckInComplete) {
                onCheckInComplete(checkIn);
            }
        } catch (error) {
            console.error('Check-in failed:', error);
            toast({
                title: 'Check-in failed',
                description: error instanceof Error ? error.message : 'Failed to log check-in',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Check In
                </CardTitle>
                <CardDescription>
                    Log your arrival at this location with optional notes
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Notes Input */}
                <div className="space-y-2">
                    <Label htmlFor="check-in-notes">
                        <FileText className="h-4 w-4 inline mr-2" />
                        Notes (Optional)
                    </Label>
                    <Textarea
                        id="check-in-notes"
                        placeholder="Add any observations or notes about this visit..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        disabled={isLoading}
                    />
                </div>

                {/* Check-In Button */}
                <Button
                    onClick={handleCheckIn}
                    disabled={isLoading}
                    className="w-full"
                    size="lg"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Checking In...
                        </>
                    ) : (
                        <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Check In Now
                        </>
                    )}
                </Button>

                {/* Last Check-In Info */}
                {lastCheckIn && (
                    <div className="mt-4 p-3 bg-muted rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            Last Check-In
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {lastCheckIn.timestamp.toLocaleString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3" />
                                {lastCheckIn.location.latitude.toFixed(6)},{' '}
                                {lastCheckIn.location.longitude.toFixed(6)}
                            </div>
                            {lastCheckIn.address && (
                                <div className="text-xs">{lastCheckIn.address}</div>
                            )}
                            {lastCheckIn.notes && (
                                <div className="mt-2 text-xs italic">
                                    "{lastCheckIn.notes}"
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
