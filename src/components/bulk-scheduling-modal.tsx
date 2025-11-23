'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/aws/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import {
    Calendar,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Play,
    Pause,
    RotateCcw,
    Settings,
    Eye,
    Zap,
    TrendingUp,
    Users,
    Target,
    Calendar as CalendarIcon,
    ChevronRight,
    Info
} from 'lucide-react';
import {
    BulkScheduleItem,
    SchedulingPattern,
    SchedulingPatternType,
    PublishChannel,
    PublishChannelType,
    ScheduledContent,
    SchedulingConflict,
    OptimalTime
} from '@/lib/content-workflow-types';
import { bulkScheduleAction, getOptimalTimesAction } from '@/app/content-workflow-actions';

interface BulkSchedulingModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItems: BulkScheduleItem[];
    availableChannels: PublishChannel[];
    onSchedulingComplete: (scheduled: ScheduledContent[], failed: any[]) => void;
}

interface BulkScheduleProgress {
    total: number;
    completed: number;
    failed: number;
    currentItem?: string;
    errors: Array<{
        itemId: string;
        title: string;
        error: string;
        suggestedAction?: string;
    }>;
}

interface PatternPreview {
    dates: Date[];
    conflicts: number;
    totalItems: number;
    estimatedDuration: string;
}

export function BulkSchedulingModal({
    isOpen,
    onClose,
    selectedItems,
    availableChannels,
    onSchedulingComplete
}: BulkSchedulingModalProps) {
    const { user } = useUser();

    // State management
    const [currentStep, setCurrentStep] = useState<'configure' | 'preview' | 'execute'>('configure');
    const [isScheduling, setIsScheduling] = useState(false);
    const [canCancel, setCanCancel] = useState(true);

    // Pattern configuration
    const [pattern, setPattern] = useState<SchedulingPattern>({
        type: SchedulingPatternType.DAILY,
        interval: 1,
        daysOfWeek: [1, 2, 3, 4, 5], // Weekdays
        timeOfDay: '09:00',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        excludeWeekends: true,
        excludeHolidays: true
    });

    // Channel selection
    const [selectedChannels, setSelectedChannels] = useState<PublishChannel[]>([]);

    // Conflict resolution
    const [conflictResolution, setConflictResolution] = useState<'skip' | 'reschedule' | 'override'>('reschedule');

    // Progress tracking
    const [progress, setProgress] = useState<BulkScheduleProgress>({
        total: 0,
        completed: 0,
        failed: 0,
        errors: []
    });

    // Preview data
    const [patternPreview, setPatternPreview] = useState<PatternPreview | null>(null);
    const [conflicts, setConflicts] = useState<SchedulingConflict[]>([]);
    const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>([]);

    // Initialize with first available channel
    useEffect(() => {
        if (availableChannels.length > 0 && selectedChannels.length === 0) {
            setSelectedChannels([availableChannels[0]]);
        }
    }, [availableChannels, selectedChannels.length]);

    // Generate pattern preview when configuration changes
    useEffect(() => {
        if (selectedItems.length > 0) {
            generatePatternPreview();
        }
    }, [pattern, selectedItems.length]);

    // Load optimal times for selected channels
    useEffect(() => {
        if (selectedChannels.length > 0 && selectedItems.length > 0) {
            loadOptimalTimes();
        }
    }, [selectedChannels, selectedItems]);

    const generatePatternPreview = async () => {
        try {
            const dates = generateScheduleDates(pattern, selectedItems.length);

            const preview: PatternPreview = {
                dates: dates.slice(0, 10), // Show first 10 dates
                conflicts: 0, // TODO: Implement conflict detection
                totalItems: selectedItems.length,
                estimatedDuration: calculateEstimatedDuration(dates)
            };

            setPatternPreview(preview);
        } catch (error) {
            console.error('Failed to generate pattern preview:', error);
        }
    };

    const loadOptimalTimes = async () => {
        if (!user || selectedChannels.length === 0) return;

        try {
            // Get optimal times for the first selected channel and most common content type
            const channel = selectedChannels[0];
            const contentType = selectedItems[0]?.contentType;

            if (!contentType) return;

            const formData = new FormData();
            formData.append('channel', channel.type);
            formData.append('contentType', contentType);

            const result = await getOptimalTimesAction(null, formData);

            if (result.success && result.data) {
                setOptimalTimes(result.data);
            }
        } catch (error) {
            console.error('Failed to load optimal times:', error);
        }
    };

    const generateScheduleDates = (pattern: SchedulingPattern, itemCount: number): Date[] => {
        const dates: Date[] = [];
        let currentDate = new Date(pattern.startDate);

        switch (pattern.type) {
            case SchedulingPatternType.DAILY:
                for (let i = 0; i < itemCount; i++) {
                    const date = new Date(currentDate);

                    // Apply time of day
                    if (pattern.timeOfDay) {
                        const [hours, minutes] = pattern.timeOfDay.split(':').map(Number);
                        date.setHours(hours, minutes, 0, 0);
                    }

                    // Skip weekends if excluded
                    if (pattern.excludeWeekends && (date.getDay() === 0 || date.getDay() === 6)) {
                        // Move to next weekday
                        while (date.getDay() === 0 || date.getDay() === 6) {
                            date.setDate(date.getDate() + 1);
                        }
                    }

                    dates.push(new Date(date));
                    currentDate.setDate(currentDate.getDate() + (pattern.interval || 1));
                }
                break;

            case SchedulingPatternType.WEEKLY:
                const daysOfWeek = pattern.daysOfWeek || [1, 3, 5];
                let weekStart = new Date(currentDate);
                let itemsScheduled = 0;

                while (itemsScheduled < itemCount) {
                    for (const dayOfWeek of daysOfWeek) {
                        if (itemsScheduled >= itemCount) break;

                        const date = new Date(weekStart);
                        const currentDayOfWeek = date.getDay();
                        const daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
                        date.setDate(date.getDate() + daysToAdd);

                        // Apply time of day
                        if (pattern.timeOfDay) {
                            const [hours, minutes] = pattern.timeOfDay.split(':').map(Number);
                            date.setHours(hours, minutes, 0, 0);
                        }

                        if (date >= pattern.startDate) {
                            dates.push(new Date(date));
                            itemsScheduled++;
                        }
                    }

                    weekStart.setDate(weekStart.getDate() + 7 * (pattern.interval || 1));
                }
                break;

            case SchedulingPatternType.CUSTOM:
                if (pattern.customDates) {
                    dates.push(...pattern.customDates.slice(0, itemCount));
                }
                break;
        }

        return dates;
    };

    const calculateEstimatedDuration = (dates: Date[]): string => {
        if (dates.length < 2) return 'Immediate';

        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        const durationMs = lastDate.getTime() - firstDate.getTime();
        const days = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

        if (days === 1) return '1 day';
        if (days < 7) return `${days} days`;
        if (days < 30) return `${Math.ceil(days / 7)} weeks`;
        return `${Math.ceil(days / 30)} months`;
    };

    const handleChannelToggle = (channel: PublishChannel, checked: boolean) => {
        if (checked) {
            setSelectedChannels(prev => [...prev, channel]);
        } else {
            setSelectedChannels(prev => prev.filter(c => c.accountId !== channel.accountId));
        }
    };

    const handlePatternChange = (field: keyof SchedulingPattern, value: any) => {
        setPattern(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleOptimalTimeSelect = (optimalTime: OptimalTime) => {
        setPattern(prev => ({
            ...prev,
            timeOfDay: optimalTime.time,
            daysOfWeek: [optimalTime.dayOfWeek]
        }));
    };

    const handleStartScheduling = async () => {
        if (!user || selectedChannels.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Configuration Error',
                description: 'Please select at least one channel before scheduling.'
            });
            return;
        }

        setCurrentStep('execute');
        setIsScheduling(true);
        setCanCancel(true);

        // Initialize progress
        setProgress({
            total: selectedItems.length,
            completed: 0,
            failed: 0,
            errors: []
        });

        try {
            // Prepare form data for bulk scheduling
            const formData = new FormData();
            formData.append('items', JSON.stringify(selectedItems));
            formData.append('pattern', JSON.stringify({
                ...pattern,
                startDate: pattern.startDate.toISOString(),
                endDate: pattern.endDate?.toISOString(),
                customDates: pattern.customDates?.map(d => d.toISOString())
            }));
            formData.append('channels', JSON.stringify(selectedChannels));
            formData.append('conflictResolution', conflictResolution);

            const result = await bulkScheduleAction(null, formData);

            if (result.success && result.data) {
                setProgress({
                    total: selectedItems.length,
                    completed: result.data.scheduled.length,
                    failed: result.data.failed.length,
                    errors: result.data.failed
                });

                toast({
                    title: 'Bulk Scheduling Complete',
                    description: `Successfully scheduled ${result.data.scheduled.length} of ${selectedItems.length} items.`
                });

                onSchedulingComplete(result.data.scheduled, result.data.failed);
            } else {
                throw new Error(result.error || 'Bulk scheduling failed');
            }

        } catch (error) {
            console.error('Bulk scheduling failed:', error);
            toast({
                variant: 'destructive',
                title: 'Scheduling Failed',
                description: error instanceof Error ? error.message : 'An unexpected error occurred.'
            });

            setProgress(prev => ({
                ...prev,
                failed: selectedItems.length,
                errors: [{
                    itemId: 'bulk',
                    title: 'Bulk Operation',
                    error: error instanceof Error ? error.message : 'Unknown error'
                }]
            }));
        } finally {
            setIsScheduling(false);
            setCanCancel(false);
        }
    };

    const handleCancel = () => {
        if (isScheduling && canCancel) {
            // TODO: Implement cancellation logic
            setIsScheduling(false);
            setCanCancel(false);
        }
        onClose();
    };

    const handleReset = () => {
        setCurrentStep('configure');
        setProgress({
            total: 0,
            completed: 0,
            failed: 0,
            errors: []
        });
        setPatternPreview(null);
        setConflicts([]);
    };

    const progressPercentage = progress.total > 0 ? (progress.completed + progress.failed) / progress.total * 100 : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Bulk Schedule Content
                        <Badge variant="secondary">{selectedItems.length} items</Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Schedule multiple content items using intelligent patterns and conflict resolution.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs value={currentStep} className="h-full flex flex-col">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="configure" disabled={isScheduling}>
                                <Settings className="h-4 w-4 mr-2" />
                                Configure
                            </TabsTrigger>
                            <TabsTrigger value="preview" disabled={isScheduling || !patternPreview}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                            </TabsTrigger>
                            <TabsTrigger value="execute" disabled={!isScheduling && currentStep !== 'execute'}>
                                <Play className="h-4 w-4 mr-2" />
                                Execute
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 overflow-hidden mt-4">
                            <TabsContent value="configure" className="h-full overflow-auto space-y-6">
                                {/* Pattern Configuration */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4" />
                                            Scheduling Pattern
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="pattern-type">Pattern Type</Label>
                                                <Select
                                                    value={pattern.type}
                                                    onValueChange={(value) => handlePatternChange('type', value as SchedulingPatternType)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value={SchedulingPatternType.DAILY}>Daily</SelectItem>
                                                        <SelectItem value={SchedulingPatternType.WEEKLY}>Weekly</SelectItem>
                                                        <SelectItem value={SchedulingPatternType.CUSTOM}>Custom</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label htmlFor="interval">Interval</Label>
                                                <Input
                                                    id="interval"
                                                    type="number"
                                                    min="1"
                                                    max="30"
                                                    value={pattern.interval || 1}
                                                    onChange={(e) => handlePatternChange('interval', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="start-date">Start Date</Label>
                                                <Input
                                                    id="start-date"
                                                    type="datetime-local"
                                                    value={pattern.startDate.toISOString().slice(0, 16)}
                                                    onChange={(e) => handlePatternChange('startDate', new Date(e.target.value))}
                                                />
                                            </div>

                                            <div>
                                                <Label htmlFor="time-of-day">Time of Day</Label>
                                                <Input
                                                    id="time-of-day"
                                                    type="time"
                                                    value={pattern.timeOfDay || '09:00'}
                                                    onChange={(e) => handlePatternChange('timeOfDay', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {pattern.type === SchedulingPatternType.WEEKLY && (
                                            <div>
                                                <Label>Days of Week</Label>
                                                <div className="flex gap-2 mt-2">
                                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                                                        <div key={day} className="flex items-center space-x-2">
                                                            <Checkbox
                                                                id={`day-${index}`}
                                                                checked={pattern.daysOfWeek?.includes(index) || false}
                                                                onCheckedChange={(checked) => {
                                                                    const currentDays = pattern.daysOfWeek || [];
                                                                    if (checked) {
                                                                        handlePatternChange('daysOfWeek', [...currentDays, index]);
                                                                    } else {
                                                                        handlePatternChange('daysOfWeek', currentDays.filter(d => d !== index));
                                                                    }
                                                                }}
                                                            />
                                                            <Label htmlFor={`day-${index}`} className="text-sm">
                                                                {day}
                                                            </Label>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="exclude-weekends"
                                                    checked={pattern.excludeWeekends || false}
                                                    onCheckedChange={(checked) => handlePatternChange('excludeWeekends', checked)}
                                                />
                                                <Label htmlFor="exclude-weekends">Exclude Weekends</Label>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id="exclude-holidays"
                                                    checked={pattern.excludeHolidays || false}
                                                    onCheckedChange={(checked) => handlePatternChange('excludeHolidays', checked)}
                                                />
                                                <Label htmlFor="exclude-holidays">Exclude Holidays</Label>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Optimal Times Suggestions */}
                                {optimalTimes.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4" />
                                                AI-Powered Optimal Times
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                {optimalTimes.map((time, index) => (
                                                    <Card
                                                        key={index}
                                                        className="cursor-pointer hover:bg-accent transition-colors"
                                                        onClick={() => handleOptimalTimeSelect(time)}
                                                    >
                                                        <CardContent className="p-4">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <Zap className="h-4 w-4 text-yellow-500" />
                                                                    <span className="font-medium">{time.time}</span>
                                                                </div>
                                                                <Badge variant="outline">
                                                                    {Math.round(time.confidence * 100)}%
                                                                </Badge>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground">
                                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][time.dayOfWeek]}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Expected engagement: {(time.expectedEngagement * 100).toFixed(1)}%
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Channel Selection */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            Publishing Channels
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {availableChannels.map((channel) => (
                                                <div key={channel.accountId} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <Checkbox
                                                            id={channel.accountId}
                                                            checked={selectedChannels.some(c => c.accountId === channel.accountId)}
                                                            onCheckedChange={(checked) => handleChannelToggle(channel, checked as boolean)}
                                                        />
                                                        <div>
                                                            <Label htmlFor={channel.accountId} className="font-medium">
                                                                {channel.accountName}
                                                            </Label>
                                                            <p className="text-sm text-muted-foreground">
                                                                {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge
                                                        variant={channel.connectionStatus === 'connected' ? 'default' : 'destructive'}
                                                    >
                                                        {channel.connectionStatus}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Conflict Resolution */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Conflict Resolution
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <Select
                                            value={conflictResolution}
                                            onValueChange={(value) => setConflictResolution(value as 'skip' | 'reschedule' | 'override')}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="skip">Skip conflicting items</SelectItem>
                                                <SelectItem value="reschedule">Reschedule to alternative times</SelectItem>
                                                <SelectItem value="override">Override existing schedules</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            How to handle scheduling conflicts with existing content.
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="preview" className="h-full overflow-auto space-y-6">
                                {patternPreview && (
                                    <>
                                        {/* Preview Summary */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Scheduling Preview</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {patternPreview.totalItems}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Total Items</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-green-600">
                                                            {selectedChannels.length}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Channels</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-orange-600">
                                                            {patternPreview.conflicts}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Conflicts</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-purple-600">
                                                            {patternPreview.estimatedDuration}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">Duration</div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Timeline Visualization */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Timeline Preview</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ScrollArea className="h-64">
                                                    <div className="space-y-2">
                                                        {patternPreview.dates.map((date, index) => (
                                                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                                <div className="flex items-center gap-3">
                                                                    <Badge variant="outline">#{index + 1}</Badge>
                                                                    <div>
                                                                        <div className="font-medium">
                                                                            {date.toLocaleDateString()}
                                                                        </div>
                                                                        <div className="text-sm text-muted-foreground">
                                                                            {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    {selectedChannels.map((channel, channelIndex) => (
                                                                        <Badge key={channelIndex} variant="secondary" className="text-xs">
                                                                            {channel.type}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {patternPreview.dates.length < patternPreview.totalItems && (
                                                            <div className="text-center text-muted-foreground py-2">
                                                                ... and {patternPreview.totalItems - patternPreview.dates.length} more items
                                                            </div>
                                                        )}
                                                    </div>
                                                </ScrollArea>
                                            </CardContent>
                                        </Card>

                                        {/* Content Items */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Content Items</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <ScrollArea className="h-48">
                                                    <div className="space-y-2">
                                                        {selectedItems.map((item, index) => (
                                                            <div key={item.contentId} className="flex items-start gap-3 p-2 border rounded">
                                                                <Badge variant="outline">#{index + 1}</Badge>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium truncate">{item.title}</div>
                                                                    <div className="text-sm text-muted-foreground truncate">
                                                                        {item.content}
                                                                    </div>
                                                                    <Badge variant="secondary" className="text-xs mt-1">
                                                                        {item.contentType.replace('_', ' ')}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </CardContent>
                                        </Card>
                                    </>
                                )}
                            </TabsContent>

                            <TabsContent value="execute" className="h-full overflow-auto space-y-6">
                                {/* Progress Overview */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            {isScheduling ? (
                                                <Play className="h-4 w-4 animate-pulse" />
                                            ) : (
                                                <CheckCircle className="h-4 w-4" />
                                            )}
                                            Bulk Scheduling Progress
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Progress</span>
                                                <span>{Math.round(progressPercentage)}%</span>
                                            </div>
                                            <Progress value={progressPercentage} className="h-2" />
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <div className="text-2xl font-bold text-green-600">
                                                    {progress.completed}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Completed</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-red-600">
                                                    {progress.failed}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Failed</div>
                                            </div>
                                            <div>
                                                <div className="text-2xl font-bold text-blue-600">
                                                    {progress.total - progress.completed - progress.failed}
                                                </div>
                                                <div className="text-sm text-muted-foreground">Remaining</div>
                                            </div>
                                        </div>

                                        {progress.currentItem && (
                                            <div className="text-sm text-muted-foreground">
                                                Currently processing: <span className="font-medium">{progress.currentItem}</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Errors */}
                                {progress.errors.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-red-600">
                                                <XCircle className="h-4 w-4" />
                                                Errors ({progress.errors.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ScrollArea className="h-32">
                                                <div className="space-y-2">
                                                    {progress.errors.map((error, index) => (
                                                        <div key={index} className="p-2 border border-red-200 rounded bg-red-50">
                                                            <div className="font-medium text-red-800">{error.title}</div>
                                                            <div className="text-sm text-red-600">{error.error}</div>
                                                            {error.suggestedAction && (
                                                                <div className="text-xs text-red-500 mt-1">
                                                                    Suggestion: {error.suggestedAction}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                )}
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                <DialogFooter className="flex justify-between">
                    <div className="flex gap-2">
                        {currentStep === 'execute' && !isScheduling && (
                            <Button variant="outline" onClick={handleReset}>
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Reset
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel} disabled={isScheduling && !canCancel}>
                            {isScheduling ? 'Cancel' : 'Close'}
                        </Button>

                        {currentStep === 'configure' && (
                            <Button
                                onClick={() => setCurrentStep('preview')}
                                disabled={selectedChannels.length === 0}
                            >
                                Preview
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}

                        {currentStep === 'preview' && (
                            <Button onClick={handleStartScheduling} disabled={isScheduling}>
                                {isScheduling ? (
                                    <>
                                        <Play className="h-4 w-4 mr-2 animate-pulse" />
                                        Scheduling...
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Start Scheduling
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}