'use client';

import { OpenHouseSession } from '@/lib/open-house/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    MoreVertical,
    Trash2,
    Eye,
    QrCode,
    Play,
    XCircle,
    Timer,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { deleteOpenHouseSession, cancelOpenHouseSession, startSessionEarly } from '@/app/(app)/open-house/actions';
import { useToast } from '@/hooks/use-toast';
import { useSessionCountdown } from '@/hooks/use-session-reminders';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SessionCardProps {
    session: OpenHouseSession;
}

export function SessionCard({ session }: SessionCardProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showStartEarlyDialog, setShowStartEarlyDialog] = useState(false);

    // Countdown timer for scheduled sessions
    const { timeRemaining, isStartingSoon } = useSessionCountdown(session.scheduledStartTime);

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

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            const result = await deleteOpenHouseSession(session.sessionId);
            if (result.success) {
                toast({
                    title: 'Session deleted',
                    description: 'The open house session has been deleted successfully.',
                });
                router.refresh();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to delete session',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleCancel = async () => {
        setIsCancelling(true);
        try {
            const result = await cancelOpenHouseSession(session.sessionId);
            if (result.success) {
                toast({
                    title: 'Session cancelled',
                    description: 'The open house session has been cancelled. All data has been preserved.',
                });
                router.refresh();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to cancel session',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsCancelling(false);
            setShowCancelDialog(false);
        }
    };

    const handleStartEarly = async () => {
        setIsStarting(true);
        try {
            const result = await startSessionEarly(session.sessionId);
            if (result.success) {
                toast({
                    title: 'Session started',
                    description: 'The open house session has been started early.',
                });
                router.push(`/open-house/sessions/${session.sessionId}/check-in`);
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to start session',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'An unexpected error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsStarting(false);
            setShowStartEarlyDialog(false);
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM d, yyyy');
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

    return (
        <>
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <CardTitle className="text-lg">
                                    {session.propertyAddress}
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className={getStatusColor(session.status)}
                                >
                                    {session.status}
                                </Badge>
                            </div>
                            <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(session.scheduledDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTime(session.scheduledStartTime)}
                                    {session.scheduledEndTime &&
                                        ` - ${formatTime(session.scheduledEndTime)}`}
                                </span>
                                {session.status === 'scheduled' && (
                                    <Badge
                                        variant="outline"
                                        className={
                                            isStartingSoon
                                                ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                                : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                        }
                                    >
                                        <Timer className="h-3 w-3 mr-1" />
                                        {timeRemaining}
                                    </Badge>
                                )}
                            </CardDescription>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.push(
                                            `/open-house/sessions/${session.sessionId}`
                                        )
                                    }
                                >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        router.push(
                                            `/open-house/sessions/${session.sessionId}/check-in`
                                        )
                                    }
                                >
                                    <QrCode className="h-4 w-4 mr-2" />
                                    QR Code
                                </DropdownMenuItem>
                                {session.status === 'scheduled' && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setShowStartEarlyDialog(true)}
                                        >
                                            <Play className="h-4 w-4 mr-2" />
                                            Start Early
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() => setShowCancelDialog(true)}
                                            className="text-orange-600 focus:text-orange-600"
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Cancel Session
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    disabled={session.status === 'active'}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    {session.visitorCount || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Visitors</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-green-500" />
                            <div>
                                <p className="text-sm font-medium">
                                    {session.interestLevelDistribution?.high || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">High Interest</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-yellow-500" />
                            <div>
                                <p className="text-sm font-medium">
                                    {session.interestLevelDistribution?.medium || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Medium Interest
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-gray-500" />
                            <div>
                                <p className="text-sm font-medium">
                                    {session.interestLevelDistribution?.low || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">Low Interest</p>
                            </div>
                        </div>
                    </div>
                    {session.notes && (
                        <p className="mt-4 text-sm text-muted-foreground">{session.notes}</p>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this open house session? This
                            action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Session</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel this open house session? The session
                            will be marked as cancelled, but all data will be preserved for
                            historical tracking.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>
                            Keep Session
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="bg-orange-600 text-white hover:bg-orange-700"
                        >
                            {isCancelling ? 'Cancelling...' : 'Cancel Session'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showStartEarlyDialog} onOpenChange={setShowStartEarlyDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start Session Early</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will start the open house session before the scheduled time. The
                            actual start time will be recorded. Are you ready to begin?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isStarting}>Not Yet</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStartEarly}
                            disabled={isStarting}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            {isStarting ? 'Starting...' : 'Start Now'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
