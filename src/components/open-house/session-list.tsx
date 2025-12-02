'use client';

import { OpenHouseSession } from '@/lib/open-house/types';
import { SessionCard } from './session-card';
import { useSessionReminders } from '@/hooks/use-session-reminders';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SessionListProps {
    sessions: OpenHouseSession[];
}

export function SessionList({ sessions }: SessionListProps) {
    const { toast } = useToast();
    const {
        notificationsEnabled,
        requestPermission,
        checkUpcomingSessions,
    } = useSessionReminders(sessions, {
        checkInterval: 5 * 60 * 1000, // Check every 5 minutes
        autoRequestPermission: false,
    });

    // Check for upcoming sessions on mount and when sessions change
    useEffect(() => {
        checkUpcomingSessions(sessions);
    }, [sessions, checkUpcomingSessions]);

    const handleEnableNotifications = async () => {
        const granted = await requestPermission();
        if (granted) {
            toast({
                title: 'Notifications enabled',
                description: "You'll receive reminders when your open house sessions are about to start.",
            });
        } else {
            toast({
                title: 'Notifications blocked',
                description: 'Please enable notifications in your browser settings to receive reminders.',
                variant: 'destructive',
            });
        }
    };

    // Filter scheduled sessions for notification prompt
    const scheduledSessions = sessions.filter((s) => s.status === 'scheduled');
    const showNotificationPrompt = scheduledSessions.length > 0 && !notificationsEnabled;

    return (
        <div className="space-y-4">
            {showNotificationPrompt && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Bell className="h-5 w-5 text-blue-500" />
                        <div>
                            <p className="text-sm font-medium">Enable Session Reminders</p>
                            <p className="text-xs text-muted-foreground">
                                Get notified when your open house sessions are about to start
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handleEnableNotifications}
                        className="border-blue-500/20 hover:bg-blue-500/10"
                    >
                        <Bell className="h-4 w-4 mr-2" />
                        Enable
                    </Button>
                </div>
            )}

            {notificationsEnabled && scheduledSessions.length > 0 && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-green-500" />
                    <p className="text-xs text-muted-foreground">
                        Session reminders are enabled. You'll be notified 1 hour before your sessions start.
                    </p>
                </div>
            )}

            {sessions.map((session) => (
                <SessionCard key={session.sessionId} session={session} />
            ))}
        </div>
    );
}
