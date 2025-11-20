'use client';

import { useEffect, useState } from 'react';
import { Monitor, Smartphone, Clock, MapPin, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginSession } from '@/lib/login-session-types';
import { getLoginHistory, signOutAllDevices } from '@/app/login-session-actions';
import { toast } from '@/hooks/use-toast';

interface LoginHistoryProps {
    userId: string;
}

export function LoginHistory({ userId }: LoginHistoryProps) {
    const [sessions, setSessions] = useState<LoginSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSigningOut, setIsSigningOut] = useState(false);

    useEffect(() => {
        async function loadSessions() {
            try {
                const history = await getLoginHistory(userId, 10);
                setSessions(history);
            } catch (error) {
                console.error('Failed to load login history:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Failed to load login history',
                });
            } finally {
                setIsLoading(false);
            }
        }

        loadSessions();
    }, [userId]);

    const handleSignOutAll = async () => {
        try {
            setIsSigningOut(true);
            const currentSession = sessions.find(s => s.isActive);
            await signOutAllDevices(userId, currentSession?.sessionId);

            // Reload sessions
            const history = await getLoginHistory(userId, 10);
            setSessions(history);

            toast({
                title: 'Success',
                description: 'All other devices have been signed out',
            });
        } catch (error) {
            console.error('Failed to sign out all devices:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to sign out all devices',
            });
        } finally {
            setIsSigningOut(false);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays === 1) {
            return 'Yesterday at ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } else if (diffDays < 7) {
            return `${diffDays} days ago`;
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    const getDeviceIcon = (deviceType: string) => {
        return deviceType === 'mobile' || deviceType === 'tablet' ? Smartphone : Monitor;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No login history available</p>
            </div>
        );
    }

    const currentSession = sessions.find(s => s.isActive);

    return (
        <>
            <div className="space-y-3">
                {sessions.map((session, index) => {
                    const DeviceIcon = getDeviceIcon(session.deviceType);
                    const isCurrentSession = session.sessionId === currentSession?.sessionId && index === 0;

                    return (
                        <div
                            key={session.sessionId}
                            className={`flex items-start gap-3 rounded-lg border p-4 ${isCurrentSession
                                    ? 'border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20'
                                    : ''
                                }`}
                        >
                            <div
                                className={`rounded-md p-2 ${isCurrentSession
                                        ? 'bg-green-100 dark:bg-green-900/50'
                                        : 'bg-muted'
                                    }`}
                            >
                                <DeviceIcon
                                    className={`h-4 w-4 ${isCurrentSession
                                            ? 'text-green-600 dark:text-green-400'
                                            : 'text-muted-foreground'
                                        }`}
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="text-sm font-semibold">
                                        {isCurrentSession ? 'Current Session' : session.deviceType === 'mobile' ? 'Mobile Device' : session.deviceType === 'tablet' ? 'Tablet' : 'Desktop'}
                                    </p>
                                    {isCurrentSession && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Active
                                        </span>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <DeviceIcon className="h-3 w-3" />
                                        <span>
                                            {session.os || 'Unknown OS'} • {session.browser || 'Unknown Browser'}
                                        </span>
                                    </div>
                                    {session.location && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span>
                                                {session.location.city && session.location.region
                                                    ? `${session.location.city}, ${session.location.region}`
                                                    : 'Location unavailable'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatTimestamp(session.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                    See an unfamiliar device?{' '}
                    <Button
                        variant="link"
                        className="h-auto p-0 text-xs text-destructive"
                        onClick={handleSignOutAll}
                        disabled={isSigningOut}
                    >
                        {isSigningOut ? 'Signing out...' : 'Sign out all devices'}
                    </Button>
                </p>
            </div>
        </>
    );
}
