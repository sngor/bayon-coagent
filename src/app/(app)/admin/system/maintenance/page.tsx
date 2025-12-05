'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CardGradientMesh } from '@/components/ui/gradient-mesh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Plus,
    Power,
    PowerOff,
    Settings,
    XCircle,
    Eye,
} from 'lucide-react';
import {
    scheduleMaintenanceWindowAction,
    getMaintenanceWindowsAction,
    getUpcomingMaintenanceWindowsAction,
    getPastMaintenanceWindowsAction,
    enableMaintenanceModeAction,
    disableMaintenanceModeAction,
    completeMaintenanceWindowAction,
    cancelMaintenanceWindowAction,
    isMaintenanceModeActiveAction,
} from '@/features/admin/actions/admin-actions';
import { useToast } from '@/hooks/use-toast';
import { MaintenanceWindow } from '@/services/admin/maintenance-mode-service';
import { format } from 'date-fns';

// Status badge mapping
const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
        scheduled: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
        active: { variant: 'destructive', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
        completed: { variant: 'default', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
        cancelled: { variant: 'outline' },
    };

    const config = variants[status] || { variant: 'default' };

    return (
        <Badge variant={config.variant} className={config.className}>
            {status}
        </Badge>
    );
};

export default function MaintenanceManagementPage() {
    const [upcomingWindows, setUpcomingWindows] = useState<MaintenanceWindow[]>([]);
    const [pastWindows, setPastWindows] = useState<MaintenanceWindow[]>([]);
    const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [showImmediateDialog, setShowImmediateDialog] = useState(false);
    const [showBannerPreview, setShowBannerPreview] = useState(false);
    const [selectedWindow, setSelectedWindow] = useState<MaintenanceWindow | null>(null);
    const { toast } = useToast();

    // Form state for scheduling
    const [scheduleForm, setScheduleForm] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
    });

    // Form state for immediate maintenance
    const [immediateForm, setImmediateForm] = useState({
        title: '',
        description: '',
        durationMinutes: 60,
    });

    useEffect(() => {
        loadMaintenanceData();
    }, []);

    async function loadMaintenanceData() {
        setIsLoading(true);
        try {
            const [upcomingResult, pastResult, activeResult] = await Promise.all([
                getUpcomingMaintenanceWindowsAction(),
                getPastMaintenanceWindowsAction(20),
                isMaintenanceModeActiveAction(),
            ]);

            if (upcomingResult.success && upcomingResult.data) {
                setUpcomingWindows(upcomingResult.data);
            }

            if (pastResult.success && pastResult.data) {
                setPastWindows(pastResult.data);
            }

            if (activeResult.success) {
                setIsMaintenanceActive(activeResult.active);
            }
        } catch (error) {
            console.error('Failed to load maintenance data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load maintenance data',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleScheduleMaintenance() {
        if (!scheduleForm.title || !scheduleForm.description || !scheduleForm.startTime || !scheduleForm.endTime) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        try {
            const result = await scheduleMaintenanceWindowAction(
                scheduleForm.title,
                scheduleForm.description,
                scheduleForm.startTime,
                scheduleForm.endTime
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Maintenance window scheduled successfully',
                });
                setShowScheduleDialog(false);
                setScheduleForm({ title: '', description: '', startTime: '', endTime: '' });
                loadMaintenanceData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to schedule maintenance window',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to schedule maintenance:', error);
            toast({
                title: 'Error',
                description: 'Failed to schedule maintenance window',
                variant: 'destructive',
            });
        }
    }

    async function handleEnableMaintenanceMode() {
        if (!immediateForm.title || !immediateForm.description) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all fields',
                variant: 'destructive',
            });
            return;
        }

        try {
            const result = await enableMaintenanceModeAction(
                immediateForm.title,
                immediateForm.description,
                immediateForm.durationMinutes
            );

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Maintenance mode enabled',
                });
                setShowImmediateDialog(false);
                setImmediateForm({ title: '', description: '', durationMinutes: 60 });
                loadMaintenanceData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to enable maintenance mode',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to enable maintenance mode:', error);
            toast({
                title: 'Error',
                description: 'Failed to enable maintenance mode',
                variant: 'destructive',
            });
        }
    }

    async function handleDisableMaintenanceMode() {
        try {
            const result = await disableMaintenanceModeAction();

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Maintenance mode disabled',
                });
                loadMaintenanceData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to disable maintenance mode',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to disable maintenance mode:', error);
            toast({
                title: 'Error',
                description: 'Failed to disable maintenance mode',
                variant: 'destructive',
            });
        }
    }

    async function handleCompleteWindow(windowId: string) {
        try {
            const result = await completeMaintenanceWindowAction(windowId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Maintenance window completed',
                });
                loadMaintenanceData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to complete maintenance window',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to complete maintenance window:', error);
            toast({
                title: 'Error',
                description: 'Failed to complete maintenance window',
                variant: 'destructive',
            });
        }
    }

    async function handleCancelWindow(windowId: string) {
        try {
            const result = await cancelMaintenanceWindowAction(windowId);

            if (result.success) {
                toast({
                    title: 'Success',
                    description: 'Maintenance window cancelled',
                });
                loadMaintenanceData();
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to cancel maintenance window',
                    variant: 'destructive',
                });
            }
        } catch (error) {
            console.error('Failed to cancel maintenance window:', error);
            toast({
                title: 'Error',
                description: 'Failed to cancel maintenance window',
                variant: 'destructive',
            });
        }
    }

    function formatDateTime(timestamp: number): string {
        return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
    }

    function formatDuration(startTime: number, endTime: number): string {
        const durationMs = endTime - startTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading maintenance data...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Maintenance Management</h1>
                    <p className="text-muted-foreground mt-1">
                        Schedule and manage system maintenance windows
                    </p>
                </div>
                <div className="flex gap-2">
                    {isMaintenanceActive ? (
                        <Button
                            onClick={handleDisableMaintenanceMode}
                            variant="destructive"
                            className="gap-2"
                        >
                            <PowerOff className="h-4 w-4" />
                            Disable Maintenance Mode
                        </Button>
                    ) : (
                        <>
                            <Button
                                onClick={() => setShowImmediateDialog(true)}
                                variant="destructive"
                                className="gap-2"
                            >
                                <Power className="h-4 w-4" />
                                Enable Now
                            </Button>
                            <Button
                                onClick={() => setShowScheduleDialog(true)}
                                className="gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Schedule Maintenance
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Current Status */}
            <Card>
                <CardGradientMesh />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Current Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        {isMaintenanceActive ? (
                            <>
                                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                <div>
                                    <p className="font-semibold text-lg">Maintenance Mode Active</p>
                                    <p className="text-sm text-muted-foreground">
                                        Users are currently seeing the maintenance page
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                                <div>
                                    <p className="font-semibold text-lg">System Operational</p>
                                    <p className="text-sm text-muted-foreground">
                                        No maintenance windows are currently active
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Upcoming Maintenance Windows */}
            <Card>
                <CardGradientMesh />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Upcoming Maintenance Windows
                    </CardTitle>
                    <CardDescription>
                        Scheduled maintenance windows for the next 7 days
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {upcomingWindows.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No upcoming maintenance windows scheduled</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {upcomingWindows.map((window) => (
                                    <TableRow key={window.windowId}>
                                        <TableCell className="font-medium">
                                            {window.title}
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(window.startTime)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDuration(window.startTime, window.endTime)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={window.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedWindow(window);
                                                        setShowBannerPreview(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {window.status === 'scheduled' && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => handleCancelWindow(window.windowId)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                                {window.status === 'active' && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => handleCompleteWindow(window.windowId)}
                                                    >
                                                        Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Past Maintenance Windows */}
            <Card>
                <CardGradientMesh />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Maintenance History
                    </CardTitle>
                    <CardDescription>
                        Past maintenance windows (completed and cancelled)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pastWindows.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No past maintenance windows</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Start Time</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pastWindows.map((window) => (
                                    <TableRow key={window.windowId}>
                                        <TableCell className="font-medium">
                                            {window.title}
                                        </TableCell>
                                        <TableCell>
                                            {formatDateTime(window.startTime)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDuration(window.startTime, window.endTime)}
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={window.status} />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedWindow(window);
                                                    setShowBannerPreview(true);
                                                }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Schedule Maintenance Dialog */}
            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Schedule Maintenance Window</DialogTitle>
                        <DialogDescription>
                            Schedule a future maintenance window. Users will see a banner before it starts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Database Upgrade"
                                value={scheduleForm.title}
                                onChange={(e) =>
                                    setScheduleForm({ ...scheduleForm, title: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe what will happen during maintenance..."
                                value={scheduleForm.description}
                                onChange={(e) =>
                                    setScheduleForm({ ...scheduleForm, description: e.target.value })
                                }
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    type="datetime-local"
                                    value={scheduleForm.startTime}
                                    onChange={(e) =>
                                        setScheduleForm({ ...scheduleForm, startTime: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    type="datetime-local"
                                    value={scheduleForm.endTime}
                                    onChange={(e) =>
                                        setScheduleForm({ ...scheduleForm, endTime: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleScheduleMaintenance}>
                            Schedule Maintenance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Enable Immediate Maintenance Dialog */}
            <Dialog open={showImmediateDialog} onOpenChange={setShowImmediateDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Enable Maintenance Mode Now</DialogTitle>
                        <DialogDescription>
                            Enable maintenance mode immediately. Users will see the maintenance page right away.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="immediate-title">Title</Label>
                            <Input
                                id="immediate-title"
                                placeholder="e.g., Emergency Maintenance"
                                value={immediateForm.title}
                                onChange={(e) =>
                                    setImmediateForm({ ...immediateForm, title: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="immediate-description">Description</Label>
                            <Textarea
                                id="immediate-description"
                                placeholder="Describe what's happening..."
                                value={immediateForm.description}
                                onChange={(e) =>
                                    setImmediateForm({ ...immediateForm, description: e.target.value })
                                }
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="1"
                                value={immediateForm.durationMinutes}
                                onChange={(e) =>
                                    setImmediateForm({
                                        ...immediateForm,
                                        durationMinutes: parseInt(e.target.value) || 60,
                                    })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowImmediateDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleEnableMaintenanceMode}>
                            Enable Maintenance Mode
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Banner Preview Dialog */}
            <Dialog open={showBannerPreview} onOpenChange={setShowBannerPreview}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Maintenance Banner Preview</DialogTitle>
                        <DialogDescription>
                            This is how the maintenance banner will appear to users
                        </DialogDescription>
                    </DialogHeader>
                    {selectedWindow && (
                        <div className="py-4">
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                                            {selectedWindow.title}
                                        </h3>
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                                            {selectedWindow.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-3 text-xs text-yellow-700 dark:text-yellow-300">
                                            <span>
                                                <strong>Start:</strong> {formatDateTime(selectedWindow.startTime)}
                                            </span>
                                            <span>
                                                <strong>End:</strong> {formatDateTime(selectedWindow.endTime)}
                                            </span>
                                            <span>
                                                <strong>Duration:</strong>{' '}
                                                {formatDuration(selectedWindow.startTime, selectedWindow.endTime)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowBannerPreview(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
