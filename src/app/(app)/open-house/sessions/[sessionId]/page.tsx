import { notFound } from 'next/navigation';
import { getOpenHouseSession, getSessionVisitors, getDashboardAnalytics } from '../../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Clock,
    Users,
    QrCode,
    Edit,
    Play,
    Square,
    UserPlus,
    Download,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { QRCodeDisplay } from '@/components/open-house/qr-code-display';
import { ActiveSessionMonitor } from '@/components/open-house/active-session-monitor';
import { CheckInTimeline } from '@/components/open-house/check-in-timeline';
import { PerformanceComparison } from '@/components/open-house/performance-comparison';
import { MilestoneNotifications } from '@/components/open-house/milestone-notifications';
import { ExportButtons } from '@/components/open-house/export-buttons';
import { ExportDialog } from '@/components/open-house/export-dialog';
import { SessionPhotoGallery } from '@/components/open-house/session-photo-gallery';

interface SessionDetailPageProps {
    params: Promise<{
        sessionId: string;
    }>;
}

export default async function SessionDetailPage({ params }: SessionDetailPageProps) {
    const { sessionId } = await params;
    const { session, error } = await getOpenHouseSession(sessionId);

    if (error || !session) {
        notFound();
    }

    // Get visitors for active sessions
    const { visitors = [] } = session.status === 'active'
        ? await getSessionVisitors(sessionId)
        : { visitors: [] };

    // Get analytics for performance comparison (only for active sessions)
    let performanceMetrics: any[] = [];
    if (session.status === 'active') {
        const result = await getDashboardAnalytics({});
        if (result.data) {
            const analytics = result.data;
            performanceMetrics = [
                {
                    label: 'Visitors',
                    current: session.visitorCount || 0,
                    average: analytics.averageVisitorsPerSession || 0,
                    format: 'number' as const,
                },
                {
                    label: 'High Interest Rate',
                    current: session.visitorCount > 0
                        ? ((session.interestLevelDistribution?.high || 0) / session.visitorCount) * 100
                        : 0,
                    average: analytics.averageInterestLevel || 0,
                    format: 'percentage' as const,
                },
            ];
        }
    }

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

    const calculateDuration = () => {
        if (!session.actualStartTime || !session.actualEndTime) {
            return null;
        }
        const start = new Date(session.actualStartTime);
        const end = new Date(session.actualEndTime);
        const durationMs = end.getTime() - start.getTime();
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-headline font-bold">
                            {session.propertyAddress}
                        </h1>
                        <Badge variant="outline" className={getStatusColor(session.status)}>
                            {session.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-6 text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(session.scheduledDate)}
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {formatTime(session.scheduledStartTime)}
                            {session.scheduledEndTime &&
                                ` - ${formatTime(session.scheduledEndTime)}`}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {session.status === 'scheduled' && (
                        <Button>
                            <Play className="h-4 w-4 mr-2" />
                            Start Session
                        </Button>
                    )}
                    {session.status === 'active' && (
                        <>
                            <Button asChild variant="outline">
                                <Link
                                    href={`/open-house/sessions/${session.sessionId}/check-in`}
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Check In Visitor
                                </Link>
                            </Button>
                            <Button variant="destructive">
                                <Square className="h-4 w-4 mr-2" />
                                End Session
                            </Button>
                        </>
                    )}
                    {session.status === 'completed' && (
                        <>
                            <ExportButtons
                                sessionId={session.sessionId}
                                visitorCount={session.visitorCount || 0}
                                variant="outline"
                            />
                            <ExportDialog
                                sessionId={session.sessionId}
                                visitorCount={session.visitorCount || 0}
                                trigger={
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Export Options
                                    </Button>
                                }
                            />
                        </>
                    )}
                    <Button variant="outline" size="icon">
                        <Edit className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Milestone Notifications for Active Sessions */}
            {session.status === 'active' && (
                <MilestoneNotifications
                    session={session}
                    visitors={visitors}
                />
            )}

            {/* Real-time Statistics for Active Sessions */}
            {session.status === 'active' ? (
                <>
                    <ActiveSessionMonitor session={session} />

                    {/* Performance Comparison */}
                    {performanceMetrics.length > 0 && (
                        <PerformanceComparison metrics={performanceMetrics} />
                    )}

                    {/* Check-in Timeline */}
                    <CheckInTimeline visitors={visitors} />
                </>
            ) : (
                /* Static Session Stats for Non-Active Sessions */
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Total Visitors</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <span className="text-3xl font-bold">
                                    {session.visitorCount || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>High Interest</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-green-500" />
                                <span className="text-3xl font-bold">
                                    {session.interestLevelDistribution?.high || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Medium Interest</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-yellow-500" />
                                <span className="text-3xl font-bold">
                                    {session.interestLevelDistribution?.medium || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardDescription>Low Interest</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="h-5 w-5 rounded-full bg-gray-500" />
                                <span className="text-3xl font-bold">
                                    {session.interestLevelDistribution?.low || 0}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Session Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Session Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Scheduled Start
                                    </p>
                                    <p className="text-sm">
                                        {formatTime(session.scheduledStartTime)}
                                    </p>
                                </div>
                                {session.scheduledEndTime && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Scheduled End
                                        </p>
                                        <p className="text-sm">
                                            {formatTime(session.scheduledEndTime)}
                                        </p>
                                    </div>
                                )}
                                {session.actualStartTime && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Actual Start
                                        </p>
                                        <p className="text-sm">
                                            {formatTime(session.actualStartTime)}
                                        </p>
                                    </div>
                                )}
                                {session.actualEndTime && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Actual End
                                        </p>
                                        <p className="text-sm">
                                            {formatTime(session.actualEndTime)}
                                        </p>
                                    </div>
                                )}
                                {calculateDuration() && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Duration
                                        </p>
                                        <p className="text-sm">{calculateDuration()}</p>
                                    </div>
                                )}
                            </div>
                            {session.notes && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        Notes
                                    </p>
                                    <p className="text-sm">{session.notes}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Visitors */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Visitors</CardTitle>
                                    <CardDescription>
                                        {session.visitorCount || 0} visitor
                                        {session.visitorCount !== 1 ? 's' : ''} checked in
                                    </CardDescription>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link
                                        href={`/open-house/sessions/${session.sessionId}/visitors`}
                                    >
                                        View All
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {session.visitorCount === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No visitors yet</p>
                                    {session.status === 'active' && (
                                        <Button asChild variant="link" className="mt-2">
                                            <Link
                                                href={`/open-house/sessions/${session.sessionId}/check-in`}
                                            >
                                                Check in your first visitor
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-sm text-muted-foreground">
                                        Visitor management coming soon
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Photos */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Photos</CardTitle>
                            <CardDescription>
                                Document the open house with photos
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SessionPhotoGallery
                                sessionId={session.sessionId}
                                photos={session.photos || []}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* QR Code */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <QrCode className="h-5 w-5" />
                                QR Code Check-in
                            </CardTitle>
                            <CardDescription>
                                Visitors can scan this code to check in
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <QRCodeDisplay
                                sessionId={session.sessionId}
                                qrCodeUrl={session.qrCodeUrl}
                                propertyAddress={session.propertyAddress}
                                scheduledDate={session.scheduledDate}
                                scheduledStartTime={session.scheduledStartTime}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
