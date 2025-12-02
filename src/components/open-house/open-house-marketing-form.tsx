'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Clock, Loader2 } from 'lucide-react';
import { getOpenHouseSessions } from '@/app/(app)/open-house/actions';
import type { OpenHouseSession } from '@/lib/open-house/types';
import { format } from 'date-fns';

interface OpenHouseMarketingFormProps {
    selectedSessionId: string | null;
    onSessionSelect: (sessionId: string | null) => void;
}

/**
 * Form component for selecting an open house session for marketing material generation
 * Validates Requirements: 16.1
 */
export function OpenHouseMarketingForm({
    selectedSessionId,
    onSessionSelect,
}: OpenHouseMarketingFormProps) {
    const [sessions, setSessions] = useState<OpenHouseSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch all sessions (scheduled, active, and completed)
            const result = await getOpenHouseSessions('all');
            if (result.error) {
                setError(result.error);
            } else {
                // Filter to only show scheduled and completed sessions (not cancelled)
                const validSessions = result.sessions.filter(
                    (s) => s.status !== 'cancelled'
                );
                setSessions(validSessions);
            }
        } catch (err) {
            setError('Failed to load sessions');
            console.error('Error loading sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    const selectedSession = sessions.find((s) => s.sessionId === selectedSessionId);

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
            scheduled: 'default',
            active: 'secondary',
            completed: 'outline',
        };
        return (
            <Badge variant={variants[status] || 'default'} className="capitalize">
                {status}
            </Badge>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading sessions...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-destructive text-sm">{error}</p>
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-8">
                <p className="text-muted-foreground">
                    No open house sessions found. Create a session first to generate marketing materials.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="session-select">Open House Session</Label>
                <Select value={selectedSessionId || ''} onValueChange={onSessionSelect}>
                    <SelectTrigger id="session-select">
                        <SelectValue placeholder="Select a session..." />
                    </SelectTrigger>
                    <SelectContent>
                        {sessions.map((session) => (
                            <SelectItem key={session.sessionId} value={session.sessionId}>
                                <div className="flex items-center gap-2">
                                    <span className="font-medium">{session.propertyAddress}</span>
                                    <span className="text-muted-foreground text-sm">
                                        {format(new Date(session.scheduledDate), 'MMM d, yyyy')}
                                    </span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Selected Session Details */}
            {selectedSession && (
                <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h4 className="font-semibold">{selectedSession.propertyAddress}</h4>
                            {getStatusBadge(selectedSession.status)}
                        </div>
                    </div>

                    <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {format(new Date(selectedSession.scheduledDate), 'EEEE, MMMM d, yyyy')}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                                {format(new Date(selectedSession.scheduledStartTime), 'h:mm a')}
                                {selectedSession.scheduledEndTime &&
                                    ` - ${format(new Date(selectedSession.scheduledEndTime), 'h:mm a')}`}
                            </span>
                        </div>

                        {selectedSession.propertyId && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span>Property ID: {selectedSession.propertyId}</span>
                            </div>
                        )}
                    </div>

                    {selectedSession.notes && (
                        <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">{selectedSession.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
