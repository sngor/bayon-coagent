import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { CheckInForm } from '@/components/open-house/check-in-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckInSource } from '@/lib/open-house/types';
import { getPublicOpenHouseSession } from '../../../actions';

interface QRCheckInPageProps {
    params: {
        sessionId: string;
    };
}

/**
 * Public QR Code Check-in Page
 * 
 * This page is accessible without authentication for visitors scanning QR codes.
 * It validates the session status and displays appropriate messages.
 * 
 * Requirements: 4.2, 4.3, 4.5
 */
export default async function QRCheckInPage({ params }: QRCheckInPageProps) {
    const { session, error } = await getPublicOpenHouseSession(params.sessionId);

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
    const isSessionScheduled = session.status === 'scheduled';

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {/* Welcome Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Welcome to Our Open House
                    </h1>
                    <p className="text-muted-foreground">
                        Please check in to let us know you're here
                    </p>
                </div>

                {/* Session Info Card */}
                <Card className="border-2">
                    <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-3">
                                <CardTitle className="text-2xl">
                                    {session.propertyAddress}
                                </CardTitle>
                                <CardDescription className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        <span>{formatDate(session.scheduledDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        <span>
                                            {formatTime(session.scheduledStartTime)}
                                            {session.scheduledEndTime &&
                                                ` - ${formatTime(session.scheduledEndTime)}`}
                                        </span>
                                    </div>
                                </CardDescription>
                            </div>
                            <Badge
                                variant="outline"
                                className={`${getStatusColor(session.status)} shrink-0`}
                            >
                                {session.status}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Status Messages */}
                {isSessionEnded && (
                    <Alert variant="destructive" className="border-2">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle className="text-lg font-semibold">
                            Session Ended
                        </AlertTitle>
                        <AlertDescription className="text-base">
                            This open house session has concluded. Check-ins are no longer being
                            accepted. Thank you for your interest in this property!
                        </AlertDescription>
                    </Alert>
                )}

                {isSessionScheduled && (
                    <Alert className="border-2 border-blue-500/20 bg-blue-500/5">
                        <AlertCircle className="h-5 w-5 text-blue-500" />
                        <AlertTitle className="text-lg font-semibold text-blue-500">
                            Session Not Started Yet
                        </AlertTitle>
                        <AlertDescription className="text-base">
                            This open house session hasn't started yet. Please check back at the
                            scheduled time: {formatTime(session.scheduledStartTime)}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Check-in Form - Only show if session is active */}
                {isSessionActive && (
                    <>
                        <Alert className="border-2 border-green-500/20 bg-green-500/5">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <AlertTitle className="text-lg font-semibold text-green-500">
                                Session Active
                            </AlertTitle>
                            <AlertDescription className="text-base">
                                Great! This open house is currently active. Please fill out the
                                form below to check in.
                            </AlertDescription>
                        </Alert>

                        <Card className="border-2">
                            <CardHeader>
                                <CardTitle>Visitor Check-in</CardTitle>
                                <CardDescription>
                                    Please provide your information so we can follow up with you
                                    about this property
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CheckInForm
                                    sessionId={session.sessionId}
                                    source={CheckInSource.QR}
                                />
                            </CardContent>
                        </Card>
                    </>
                )}

                {/* Current Stats - Only show if active */}
                {isSessionActive && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Current Attendance</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm text-muted-foreground mb-1">
                                        Total Visitors
                                    </p>
                                    <p className="text-3xl font-bold">
                                        {session.visitorCount || 0}
                                    </p>
                                </div>
                                <div className="text-center p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm text-muted-foreground mb-1">
                                        High Interest
                                    </p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {session.interestLevelDistribution?.high || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer */}
                <div className="text-center text-sm text-muted-foreground pt-4">
                    <p>
                        Your information will be kept confidential and used only to follow up
                        about this property.
                    </p>
                </div>
            </div>
        </div>
    );
}
