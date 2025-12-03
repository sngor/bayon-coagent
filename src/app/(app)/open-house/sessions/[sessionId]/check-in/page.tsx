import { notFound } from 'next/navigation';
import { getOpenHouseSession } from '@/app/(app)/open-house/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { CheckInForm } from '@/components/open-house/check-in-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckInSource } from '@/lib/open-house/types';

interface CheckInPageProps {
    params: {
        sessionId: string;
    };
}

export default async function CheckInPage({ params }: CheckInPageProps) {
    const { session, error } = await getOpenHouseSession(params.sessionId);

    if (error || !session) {
        notFound();
    }

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'EEEE, MMMM d, yyyy');
        } catch {
            return dateString;
        }
    };

    const formatTime = (dateString: string) => {
        try {
            return format(new Date(dateString), 'h:mm a');
        } catch {
            return dateString;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'scheduled':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'completed':
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
            case 'cancelled':
                return 'bg-red-500/10 text-red-500 border-red-500/20';
            default:
                return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
        }
    };

    const isSessionActive = session.status === 'active';
    const isSessionEnded = session.status === 'completed' || session.status === 'cancelled';

    return (
        <div className="max-w-2xl mx-auto space-y-6 py-8">
            {/* Session Info Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle className="text-2xl mb-2">
                                {session.propertyAddress}
                            </CardTitle>
                            <CardDescription className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(session.scheduledDate)}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    {formatTime(session.scheduledStartTime)}
                                    {session.scheduledEndTime &&
                                        ` - ${formatTime(session.scheduledEndTime)}`}
                                </div>
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className={getStatusColor(session.status)}>
                            {session.status}
                        </Badge>
                    </div>
                </CardHeader>
            </Card>

            {/* Status Messages */}
            {isSessionEnded && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Session Ended</AlertTitle>
                    <AlertDescription>
                        This open house session has ended. Check-ins are no longer being
                        accepted. Thank you for your interest!
                    </AlertDescription>
                </Alert>
            )}

            {!isSessionActive && !isSessionEnded && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Session Not Started</AlertTitle>
                    <AlertDescription>
                        This open house session hasn't started yet. Please check back at the
                        scheduled time.
                    </AlertDescription>
                </Alert>
            )}

            {/* Check-in Form */}
            {isSessionActive && (
                <Card>
                    <CardHeader>
                        <CardTitle>Visitor Check-in</CardTitle>
                        <CardDescription>
                            Please provide your information to check in to this open house
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CheckInForm sessionId={session.sessionId} source={CheckInSource.MANUAL} />
                    </CardContent>
                </Card>
            )}

            {/* Current Stats (only show if active) */}
            {isSessionActive && (
                <Card>
                    <CardHeader>
                        <CardTitle>Current Attendance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Visitors</p>
                                <p className="text-2xl font-bold">{session.visitorCount || 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">High Interest</p>
                                <p className="text-2xl font-bold">
                                    {session.interestLevelDistribution?.high || 0}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
