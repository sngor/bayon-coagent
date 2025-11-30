'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils/common';
import { useIsMobile } from '@/hooks/use-mobile';
import { useUser } from '@/aws/auth';
import { SchedulingModalSkeleton } from '@/components/ui/skeleton-loading';
import { NoConnectionsState } from '@/components/ui/empty-states';
import { NetworkErrorState, ValidationErrorState } from '@/components/ui/error-states';
import { ContentScheduledNotification } from '@/components/ui/success-notifications';
import { FocusTrap, VisuallyHidden, useAnnouncer } from '@/components/ui/accessibility-helpers';
import { ResponsiveModal, TouchOptimizedButton, touchSpacing } from '@/components/ui/responsive-helpers';
import {
    Clock,
    Calendar as CalendarIcon,
    Sparkles,
    Zap,
    Target,
    CheckCircle,
    AlertCircle,
    Loader2,
    Globe,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Mail,
    Eye,
    TrendingUp,
    Users,
    Activity,
    ArrowRight,
    ArrowLeft,
    Info,
    Wifi,
    WifiOff,
    RefreshCw,
    Settings,
    Plus,
    X
} from 'lucide-react';
import {
    PublishChannel,
    PublishChannelType,
    ContentCategory,
    OptimalTime,
} from '@/lib/content-workflow-types';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { scheduleContentAction, getOptimalTimesAction } from '@/features/content-engine/actions/content-workflow-actions';
import { toast } from '@/hooks/use-toast';

// ==================== Types ====================

export interface SchedulingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScheduled?: (scheduledContent: any) => void;
    contentData: {
        contentId: string;
        title: string;
        content: string;
        contentType: ContentCategory;
    };
    className?: string;
}

interface SchedulingStep {
    id: 'channels' | 'timing' | 'preview';
    title: string;
    description: string;
    isComplete: boolean;
    isActive: boolean;
}

interface ConnectedChannel {
    type: PublishChannelType;
    accountId: string;
    accountName: string;
    isActive: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    permissions?: string[];
    isSelected: boolean;
    lastUsed?: Date;
    engagementRate?: number;
    followerCount?: number;
}

// ==================== Constants ====================

const CHANNEL_ICONS: Record<PublishChannelType, React.ReactNode> = {
    [PublishChannelType.FACEBOOK]: <Facebook className="h-4 w-4" />,
    [PublishChannelType.INSTAGRAM]: <Instagram className="h-4 w-4" />,
    [PublishChannelType.LINKEDIN]: <Linkedin className="h-4 w-4" />,
    [PublishChannelType.TWITTER]: <Twitter className="h-4 w-4" />,
    [PublishChannelType.BLOG]: <Globe className="h-4 w-4" />,
    [PublishChannelType.NEWSLETTER]: <Mail className="h-4 w-4" />
};

const CHANNEL_COLORS: Record<PublishChannelType, string> = {
    [PublishChannelType.FACEBOOK]: 'border-blue-500 bg-blue-50 text-blue-700',
    [PublishChannelType.INSTAGRAM]: 'border-pink-500 bg-pink-50 text-pink-700',
    [PublishChannelType.LINKEDIN]: 'border-blue-600 bg-blue-50 text-blue-800',
    [PublishChannelType.TWITTER]: 'border-sky-500 bg-sky-50 text-sky-700',
    [PublishChannelType.BLOG]: 'border-green-500 bg-green-50 text-green-700',
    [PublishChannelType.NEWSLETTER]: 'border-purple-500 bg-purple-50 text-purple-700'
};

const CHANNEL_NAMES: Record<PublishChannelType, string> = {
    [PublishChannelType.FACEBOOK]: 'Facebook',
    [PublishChannelType.INSTAGRAM]: 'Instagram',
    [PublishChannelType.LINKEDIN]: 'LinkedIn',
    [PublishChannelType.TWITTER]: 'X (Twitter)',
    [PublishChannelType.BLOG]: 'Blog',
    [PublishChannelType.NEWSLETTER]: 'Newsletter'
};

// Mock connected channels - in real implementation, this would come from OAuth connections
const MOCK_CONNECTED_CHANNELS: ConnectedChannel[] = [
    {
        type: PublishChannelType.FACEBOOK,
        accountId: 'fb_123',
        accountName: 'Your Real Estate Page',
        isActive: true,
        connectionStatus: 'connected',
        isSelected: false,
        engagementRate: 4.2,
        followerCount: 1250,
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
        type: PublishChannelType.INSTAGRAM,
        accountId: 'ig_456',
        accountName: '@yourrealestateagent',
        isActive: true,
        connectionStatus: 'connected',
        isSelected: false,
        engagementRate: 6.8,
        followerCount: 890,
        lastUsed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    },
    {
        type: PublishChannelType.LINKEDIN,
        accountId: 'li_789',
        accountName: 'John Smith - Real Estate Professional',
        isActive: true,
        connectionStatus: 'connected',
        isSelected: false,
        engagementRate: 3.1,
        followerCount: 2100,
        lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
        type: PublishChannelType.BLOG,
        accountId: 'blog_001',
        accountName: 'Your Real Estate Blog',
        isActive: true,
        connectionStatus: 'connected',
        isSelected: false,
        engagementRate: 2.5,
        followerCount: 450
    }
];

// Mock optimal times - in real implementation, this would come from analytics
const MOCK_OPTIMAL_TIMES: OptimalTime[] = [
    {
        time: '09:00',
        dayOfWeek: 2, // Tuesday
        expectedEngagement: 5.2,
        confidence: 0.85,
        historicalData: {
            sampleSize: 45,
            avgEngagement: 5.2,
            lastCalculated: new Date()
        }
    },
    {
        time: '13:00',
        dayOfWeek: 3, // Wednesday
        expectedEngagement: 4.8,
        confidence: 0.82,
        historicalData: {
            sampleSize: 38,
            avgEngagement: 4.8,
            lastCalculated: new Date()
        }
    },
    {
        time: '17:00',
        dayOfWeek: 4, // Thursday
        expectedEngagement: 4.5,
        confidence: 0.79,
        historicalData: {
            sampleSize: 32,
            avgEngagement: 4.5,
            lastCalculated: new Date()
        }
    }
];

// ==================== Utility Functions ====================

const formatDateTime = (date: Date): string => {
    return format(date, 'PPP p');
};

const getTimezoneOffset = (): string => {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const validatePublishTime = (publishTime: Date): string | undefined => {
    if (isBefore(publishTime, new Date())) {
        return 'Publishing time must be in the future';
    }
    return undefined;
};

// ==================== Sub Components ====================

function SchedulingStepIndicator({ steps, currentStep }: { steps: SchedulingStep[]; currentStep: string }) {
    return (
        <div className="flex items-center justify-center space-x-4 mb-6">
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <div className="flex items-center space-x-2">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                            step.isComplete
                                ? "bg-green-500 text-white"
                                : step.isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-muted-foreground"
                        )}>
                            {step.isComplete ? (
                                <CheckCircle className="h-4 w-4" />
                            ) : (
                                index + 1
                            )}
                        </div>
                        <div className="hidden sm:block">
                            <p className={cn(
                                "text-sm font-medium",
                                step.isActive ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {step.title}
                            </p>
                        </div>
                    </div>
                    {index < steps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

function ChannelSelectionStep({
    channels,
    onChannelToggle,
    onNext
}: {
    channels: ConnectedChannel[];
    onChannelToggle: (channelId: string) => void;
    onNext: () => void;
}) {
    const selectedChannels = channels.filter(c => c.isSelected);

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Select Publishing Channels</h3>
                <p className="text-sm text-muted-foreground">
                    Choose where you want to publish your content
                </p>
            </div>

            <div className="grid gap-4">
                {channels.map((channel) => (
                    <Card
                        key={channel.accountId}
                        className={cn(
                            "cursor-pointer transition-all duration-200 hover:shadow-md",
                            channel.isSelected && "ring-2 ring-primary"
                        )}
                        onClick={() => onChannelToggle(channel.accountId)}
                    >
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center",
                                        CHANNEL_COLORS[channel.type]
                                    )}>
                                        {CHANNEL_ICONS[channel.type]}
                                    </div>
                                    <div>
                                        <p className="font-medium">{channel.accountName}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {CHANNEL_NAMES[channel.type]}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    {channel.connectionStatus === 'connected' ? (
                                        <div className="flex items-center space-x-2 text-green-600">
                                            <Wifi className="h-4 w-4" />
                                            <span className="text-xs">Connected</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2 text-red-600">
                                            <WifiOff className="h-4 w-4" />
                                            <span className="text-xs">Disconnected</span>
                                        </div>
                                    )}
                                    <div className="text-right">
                                        {channel.engagementRate && (
                                            <p className="text-sm font-medium">
                                                {channel.engagementRate}% engagement
                                            </p>
                                        )}
                                        {channel.followerCount && (
                                            <p className="text-xs text-muted-foreground">
                                                {channel.followerCount.toLocaleString()} followers
                                            </p>
                                        )}
                                    </div>
                                    <Checkbox
                                        checked={!!channel.isSelected}
                                        onCheckedChange={() => onChannelToggle(channel.accountId)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {channels.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <div className="space-y-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                                <Settings className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div>
                                <h3 className="font-medium">No Connected Channels</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Connect your social media accounts to start scheduling content
                                </p>
                            </div>
                            <Button variant="outline" size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                Connect Accounts
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-end">
                <Button
                    onClick={onNext}
                    disabled={selectedChannels.length === 0}
                    className="min-w-[120px]"
                >
                    Next: Choose Time
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}

function TimingSelectionStep({
    selectedDate,
    onDateChange,
    selectedTime,
    onTimeChange,
    optimalTimes,
    onNext,
    onBack,
    contentType
}: {
    selectedDate: Date | undefined;
    onDateChange: (date: Date | undefined) => void;
    selectedTime: string;
    onTimeChange: (time: string) => void;
    optimalTimes: OptimalTime[];
    onNext: () => void;
    onBack: () => void;
    contentType: ContentCategory;
}) {
    const [showCalendar, setShowCalendar] = useState(false);
    const [useOptimalTime, setUseOptimalTime] = useState(false);

    const publishDateTime = useMemo(() => {
        if (!selectedDate || !selectedTime) return null;
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const dateTime = new Date(selectedDate);
        dateTime.setHours(hours, minutes, 0, 0);
        return dateTime;
    }, [selectedDate, selectedTime]);

    const validationError = publishDateTime ? validatePublishTime(publishDateTime) : 'Please select date and time';

    const handleOptimalTimeSelect = (optimalTime: OptimalTime) => {
        if (!selectedDate) return;

        const newDate = new Date(selectedDate);
        // Set to the optimal day of week if different
        const currentDay = newDate.getDay();
        const dayDiff = optimalTime.dayOfWeek - currentDay;
        if (dayDiff !== 0) {
            newDate.setDate(newDate.getDate() + dayDiff);
        }

        onDateChange(newDate);
        onTimeChange(optimalTime.time);
        setUseOptimalTime(true);
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Choose Publishing Time</h3>
                <p className="text-sm text-muted-foreground">
                    Select when you want your content to be published
                </p>
            </div>

            {/* AI-Powered Optimal Times */}
            {optimalTimes.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            AI-Recommended Times
                            <Badge variant="secondary" className="text-xs">
                                Based on your analytics
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {optimalTimes.slice(0, 3).map((time, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors",
                                    "hover:bg-accent",
                                    useOptimalTime && selectedTime === time.time && "bg-primary/10 border-primary"
                                )}
                                onClick={() => handleOptimalTimeSelect(time)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                                        <Target className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{time.time}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][time.dayOfWeek]}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-3 w-3 text-green-600" />
                                        <span className="text-sm font-medium text-green-600">
                                            {time.expectedEngagement.toFixed(1)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {Math.round(time.confidence * 100)}% confidence
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div className="pt-2 border-t">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Info className="h-3 w-3" />
                                Based on {optimalTimes[0]?.historicalData?.sampleSize || 0} previous posts
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Manual Date/Time Selection */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !selectedDate && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={(date) => {
                                    onDateChange(date);
                                    setShowCalendar(false);
                                    setUseOptimalTime(false);
                                }}
                                disabled={(date) => isBefore(date, startOfDay(new Date()))}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => {
                            onTimeChange(e.target.value);
                            setUseOptimalTime(false);
                        }}
                        className="w-full"
                    />
                </div>
            </div>

            {/* Selected Time Preview */}
            {publishDateTime && (
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-primary" />
                                <div>
                                    <p className="font-medium">
                                        {formatDateTime(publishDateTime)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {getTimezoneOffset()} • {format(publishDateTime, 'EEEE')}
                                    </p>
                                </div>
                            </div>
                            {useOptimalTime && (
                                <Badge variant="secondary" className="text-xs">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Optimal Time
                                </Badge>
                            )}
                        </div>
                        {validationError && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                {validationError}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={onNext}
                    disabled={!publishDateTime || !!validationError}
                    className="min-w-[120px]"
                >
                    Next: Preview
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}

function PreviewStep({
    contentData,
    selectedChannels,
    publishDateTime,
    onSchedule,
    onBack,
    isScheduling
}: {
    contentData: SchedulingModalProps['contentData'];
    selectedChannels: ConnectedChannel[];
    publishDateTime: Date;
    onSchedule: () => void;
    onBack: () => void;
    isScheduling: boolean;
}) {
    const formatContentForChannel = (content: string, channelType: PublishChannelType): string => {
        // Simple content formatting based on channel
        switch (channelType) {
            case PublishChannelType.TWITTER:
                return content.length > 280 ? content.substring(0, 277) + '...' : content;
            case PublishChannelType.LINKEDIN:
                return content + '\n\n#RealEstate #PropertyExpert';
            case PublishChannelType.FACEBOOK:
                return content + '\n\nWhat do you think? Let me know in the comments!';
            case PublishChannelType.INSTAGRAM:
                return content + '\n\n#RealEstate #PropertyTips #YourLocalAgent';
            default:
                return content;
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Review & Schedule</h3>
                <p className="text-sm text-muted-foreground">
                    Review your content and confirm scheduling
                </p>
            </div>

            {/* Publishing Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Publishing Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Publish Time:</span>
                        <span className="font-medium">{formatDateTime(publishDateTime)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Channels:</span>
                        <div className="flex gap-1">
                            {selectedChannels.map((channel) => (
                                <Badge key={channel.accountId} variant="outline" className="text-xs">
                                    {CHANNEL_ICONS[channel.type]}
                                    <span className="ml-1">{CHANNEL_NAMES[channel.type]}</span>
                                </Badge>
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Content Type:</span>
                        <Badge variant="secondary" className="text-xs">
                            {contentData.contentType.replace('_', ' ')}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Content Preview for Each Channel */}
            <div className="space-y-4">
                <h4 className="font-medium">Content Preview</h4>
                {selectedChannels.map((channel) => (
                    <Card key={channel.accountId}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <div className={cn(
                                    "w-6 h-6 rounded flex items-center justify-center",
                                    CHANNEL_COLORS[channel.type]
                                )}>
                                    {CHANNEL_ICONS[channel.type]}
                                </div>
                                {channel.accountName}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="font-medium text-sm">{contentData.title}</p>
                                <div className="p-3 bg-muted/30 rounded-md">
                                    <p className="text-sm whitespace-pre-wrap">
                                        {formatContentForChannel(contentData.content, channel.type)}
                                    </p>
                                </div>
                                {channel.engagementRate && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Activity className="h-3 w-3" />
                                        Expected {channel.engagementRate}% engagement rate
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack} disabled={isScheduling}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={onSchedule}
                    disabled={isScheduling}
                    className="min-w-[140px]"
                >
                    {isScheduling ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Scheduling...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Schedule Content
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

// ==================== Main Component ====================

export function SchedulingModal({
    isOpen,
    onClose,
    onScheduled,
    contentData,
    className
}: SchedulingModalProps) {
    const { user } = useUser();
    const isMobile = useIsMobile();
    const { announce, AnnouncerComponent } = useAnnouncer();

    // ==================== State ====================
    const [currentStep, setCurrentStep] = useState<'channels' | 'timing' | 'preview'>('channels');
    const [connectedChannels, setConnectedChannels] = useState<ConnectedChannel[]>(MOCK_CONNECTED_CHANNELS);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
    const [selectedTime, setSelectedTime] = useState<string>('09:00');
    const [optimalTimes, setOptimalTimes] = useState<OptimalTime[]>(MOCK_OPTIMAL_TIMES);
    const [isScheduling, setIsScheduling] = useState(false);
    const [isLoadingOptimalTimes, setIsLoadingOptimalTimes] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [showSuccessNotification, setShowSuccessNotification] = useState(false);
    const [scheduledContentResult, setScheduledContentResult] = useState<any>(null);

    // ==================== Computed Values ====================
    const steps: SchedulingStep[] = [
        {
            id: 'channels',
            title: 'Channels',
            description: 'Select publishing channels',
            isComplete: currentStep !== 'channels' && connectedChannels.some(c => c.isSelected),
            isActive: currentStep === 'channels'
        },
        {
            id: 'timing',
            title: 'Timing',
            description: 'Choose publish time',
            isComplete: currentStep === 'preview' && !!selectedDate && !!selectedTime,
            isActive: currentStep === 'timing'
        },
        {
            id: 'preview',
            title: 'Preview',
            description: 'Review and schedule',
            isComplete: false,
            isActive: currentStep === 'preview'
        }
    ];

    const selectedChannels = connectedChannels.filter(c => c.isSelected);

    const publishDateTime = useMemo(() => {
        if (!selectedDate || !selectedTime) return undefined;
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const dateTime = new Date(selectedDate);
        dateTime.setHours(hours, minutes, 0, 0);
        return dateTime;
    }, [selectedDate, selectedTime]);

    // ==================== Effects ====================
    useEffect(() => {
        if (isOpen) {
            // Reset state when modal opens
            setCurrentStep('channels');
            setConnectedChannels(prev => prev.map(c => ({ ...c, isSelected: false })));
            setSelectedDate(addDays(new Date(), 1));
            setSelectedTime('09:00');
            setIsScheduling(false);
        }
    }, [isOpen]);

    // Load optimal times when user and content type are available
    useEffect(() => {
        if (user && contentData.contentType && selectedChannels.length > 0) {
            loadOptimalTimes();
        }
    }, [user, contentData.contentType, selectedChannels]);

    // ==================== Event Handlers ====================
    const loadOptimalTimes = async () => {
        if (!user || selectedChannels.length === 0) return;

        setIsLoadingOptimalTimes(true);
        try {
            // In real implementation, this would call the actual API
            // For now, we'll use mock data
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
            setOptimalTimes(MOCK_OPTIMAL_TIMES);
        } catch (error) {
            console.error('Failed to load optimal times:', error);
            toast({
                variant: 'destructive',
                title: 'Failed to load optimal times',
                description: 'Using default recommendations instead.'
            });
        } finally {
            setIsLoadingOptimalTimes(false);
        }
    };

    const handleChannelToggle = useCallback((channelId: string) => {
        setConnectedChannels(prev =>
            prev.map(channel =>
                channel.accountId === channelId
                    ? { ...channel, isSelected: !channel.isSelected }
                    : channel
            )
        );
    }, []);

    const handleSchedule = async () => {
        if (!user || !publishDateTime || selectedChannels.length === 0) {
            const errors = [];
            if (!publishDateTime) errors.push('Please select a date and time');
            if (selectedChannels.length === 0) errors.push('Please select at least one channel');
            setValidationErrors(errors);
            return;
        }

        setIsScheduling(true);
        setError(null);
        setValidationErrors([]);

        try {
            const formData = new FormData();
            formData.append('contentId', contentData.contentId);
            formData.append('title', contentData.title);
            formData.append('content', contentData.content);
            formData.append('contentType', contentData.contentType);
            formData.append('publishTime', publishDateTime.toISOString());
            formData.append('channels', JSON.stringify(selectedChannels.map(c => ({
                type: c.type,
                accountId: c.accountId,
                accountName: c.accountName,
                isActive: c.isActive,
                connectionStatus: c.connectionStatus
            }))));

            const result = await scheduleContentAction(null, formData);

            if (result.success) {
                announce(`Content scheduled successfully for ${formatDateTime(publishDateTime)}`, 'polite');

                setScheduledContentResult(result.data);
                setShowSuccessNotification(true);

                // Close modal after showing success
                setTimeout(() => {
                    onScheduled?.(result.data);
                    onClose();
                }, 2000);
            } else {
                throw new Error(result.error || 'Failed to schedule content');
            }
        } catch (error) {
            console.error('Failed to schedule content:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to schedule content. Please try again.';
            setError(errorMessage);
            announce(`Error: ${errorMessage}`, 'assertive');
        } finally {
            setIsScheduling(false);
        }
    };

    // ==================== Render ====================
    if (validationErrors.length > 0) {
        return (
            <ResponsiveModal isOpen={isOpen} onClose={onClose} className={className}>
                <ValidationErrorState
                    errors={validationErrors}
                    onGoBack={() => setValidationErrors([])}
                    errorCode="SCHED_VAL_001"
                />
            </ResponsiveModal>
        );
    }

    if (error) {
        return (
            <ResponsiveModal isOpen={isOpen} onClose={onClose} className={className}>
                <NetworkErrorState
                    onRetry={() => {
                        setError(null);
                        handleSchedule();
                    }}
                    onGoBack={() => setError(null)}
                    errorCode="SCHED_NET_001"
                />
            </ResponsiveModal>
        );
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className={cn(
                    "max-w-4xl max-h-[90vh] overflow-y-auto",
                    isMobile && "max-w-[95vw] h-[95vh]",
                    className
                )}>
                    <FocusTrap isActive={isOpen}>
                        <DialogHeader className="space-y-3">
                            <DialogTitle className="text-xl font-semibold">
                                Schedule Content
                            </DialogTitle>
                            <DialogDescription>
                                Schedule your content to be published across your social media channels at the optimal time.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            {isLoadingOptimalTimes ? (
                                <SchedulingModalSkeleton />
                            ) : (
                                <>
                                    <SchedulingStepIndicator steps={steps} currentStep={currentStep} />

                                    {currentStep === 'channels' && (
                                        <>
                                            {connectedChannels.length === 0 ? (
                                                <NoConnectionsState
                                                    onAction={() => window.open('/settings/connections', '_blank')}
                                                />
                                            ) : (
                                                <ChannelSelectionStep
                                                    channels={connectedChannels}
                                                    onChannelToggle={handleChannelToggle}
                                                    onNext={() => {
                                                        setCurrentStep('timing');
                                                        announce('Moved to timing selection step', 'polite');
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}

                                    {currentStep === 'timing' && (
                                        <TimingSelectionStep
                                            selectedDate={selectedDate}
                                            onDateChange={setSelectedDate}
                                            selectedTime={selectedTime}
                                            onTimeChange={setSelectedTime}
                                            optimalTimes={optimalTimes}
                                            onNext={() => {
                                                setCurrentStep('preview');
                                                announce('Moved to preview step', 'polite');
                                            }}
                                            onBack={() => {
                                                setCurrentStep('channels');
                                                announce('Moved back to channel selection', 'polite');
                                            }}
                                            contentType={contentData.contentType}
                                        />
                                    )}

                                    {currentStep === 'preview' && publishDateTime && (
                                        <PreviewStep
                                            contentData={contentData}
                                            selectedChannels={selectedChannels}
                                            publishDateTime={publishDateTime}
                                            onSchedule={handleSchedule}
                                            onBack={() => {
                                                setCurrentStep('timing');
                                                announce('Moved back to timing selection', 'polite');
                                            }}
                                            isScheduling={isScheduling}
                                        />
                                    )}
                                </>
                            )}
                        </div>

                        <VisuallyHidden>
                            <div aria-live="polite" aria-atomic="true">
                                {isScheduling && "Scheduling content, please wait..."}
                            </div>
                        </VisuallyHidden>
                    </FocusTrap>
                </DialogContent>
            </Dialog>

            {/* Success Notification */}
            <ContentScheduledNotification
                isVisible={showSuccessNotification}
                onClose={() => setShowSuccessNotification(false)}
                scheduledTime={publishDateTime}
                channelCount={selectedChannels.length}
                contentTitle={contentData.title}
            />

            {/* Accessibility Components */}
            <AnnouncerComponent />
        </>
    );
}