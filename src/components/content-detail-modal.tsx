'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { StatusBadge } from '@/components/shared/status-badge';
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
import { cn } from '@/lib/utils/common';
import { useIsMobile } from '@/hooks/use-mobile';
import {
    Clock,
    Calendar as CalendarIcon,
    Edit,
    Save,
    X,
    Copy,
    Trash2,
    BarChart3,
    TrendingUp,
    Eye,
    Heart,
    Share,
    MessageCircle,
    MousePointer,
    Globe,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Mail,
    AlertCircle,
    CheckCircle,
    Loader2,
    MapPin,
    User,
    Tag,
    Hash,
    ExternalLink,
    RefreshCw,
    Zap,
    Target,
    DollarSign,
    Users,
    Activity,
    Info
} from 'lucide-react';
import {
    ScheduledContent,
    PublishChannel,
    PublishChannelType,
    ScheduledContentStatus,
    ContentCategory,
    EngagementMetrics,
    OptimalTime,
    ROIAnalytics
} from '@/lib/content-workflow-types';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';

// ==================== Types ====================

export interface ContentDetailModalProps {
    content: ScheduledContent | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: (updatedContent: Partial<ScheduledContent>) => Promise<void>;
    onDelete?: (contentId: string) => Promise<void>;
    onDuplicate?: (contentId: string) => Promise<void>;
    onReschedule?: (contentId: string, newDate: Date) => Promise<void>;
    analytics?: EngagementMetrics;
    optimalTimes?: OptimalTime[];
    roiData?: ROIAnalytics;
    loading?: boolean;
    className?: string;
}

interface EditableField {
    field: keyof ScheduledContent;
    value: any;
    isEditing: boolean;
    hasChanges: boolean;
    error?: string;
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
    [PublishChannelType.FACEBOOK]: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    [PublishChannelType.INSTAGRAM]: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
    [PublishChannelType.LINKEDIN]: 'bg-blue-600/10 text-blue-800 border-blue-600/20',
    [PublishChannelType.TWITTER]: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
    [PublishChannelType.BLOG]: 'bg-green-500/10 text-green-700 border-green-500/20',
    [PublishChannelType.NEWSLETTER]: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
};

const STATUS_VARIANTS: Record<ScheduledContentStatus, 'success' | 'error' | 'warning' | 'info' | 'pending'> = {
    [ScheduledContentStatus.SCHEDULED]: 'pending',
    [ScheduledContentStatus.PUBLISHING]: 'info',
    [ScheduledContentStatus.PUBLISHED]: 'success',
    [ScheduledContentStatus.FAILED]: 'error',
    [ScheduledContentStatus.CANCELLED]: 'warning'
};

const CONTENT_TYPE_LABELS: Record<ContentCategory, string> = {
    [ContentCategory.BLOG_POST]: 'Blog Post',
    [ContentCategory.SOCIAL_MEDIA]: 'Social Media',
    [ContentCategory.LISTING_DESCRIPTION]: 'Listing Description',
    [ContentCategory.MARKET_UPDATE]: 'Market Update',
    [ContentCategory.NEIGHBORHOOD_GUIDE]: 'Neighborhood Guide',
    [ContentCategory.VIDEO_SCRIPT]: 'Video Script',
    [ContentCategory.NEWSLETTER]: 'Newsletter',
    [ContentCategory.EMAIL_TEMPLATE]: 'Email Template'
};

// ==================== Utility Functions ====================

const formatDateTime = (date: Date): string => {
    return format(date, 'PPP p');
};

const formatTimeOnly = (date: Date): string => {
    return format(date, 'p');
};

const getTimezoneOffset = (): string => {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.floor(Math.abs(offset) / 60);
    const minutes = Math.abs(offset) % 60;
    const sign = offset <= 0 ? '+' : '-';
    return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const validateTitle = (title: string): string | undefined => {
    if (!title.trim()) return 'Title is required';
    if (title.length > 200) return 'Title must be less than 200 characters';
    return undefined;
};

const validateContent = (content: string): string | undefined => {
    if (!content.trim()) return 'Content is required';
    if (content.length < 10) return 'Content must be at least 10 characters';
    if (content.length > 10000) return 'Content must be less than 10,000 characters';
    return undefined;
};

const validatePublishTime = (publishTime: Date): string | undefined => {
    if (isBefore(publishTime, new Date())) {
        return 'Publishing time must be in the future';
    }
    return undefined;
};

// ==================== Main Component ====================

export function ContentDetailModal({
    content,
    isOpen,
    onClose,
    onUpdate,
    onDelete,
    onDuplicate,
    onReschedule,
    analytics,
    optimalTimes,
    roiData,
    loading = false,
    className
}: ContentDetailModalProps) {
    const isMobile = useIsMobile();

    // ==================== State ====================
    const [editableFields, setEditableFields] = useState<Record<string, EditableField>>({});
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [showCalendar, setShowCalendar] = useState(false);
    const [showOptimalTimes, setShowOptimalTimes] = useState(false);

    // ==================== Effects ====================
    useEffect(() => {
        if (content && isOpen) {
            // Initialize editable fields
            setEditableFields({
                title: {
                    field: 'title',
                    value: content.title,
                    isEditing: false,
                    hasChanges: false
                },
                content: {
                    field: 'content',
                    value: content.content,
                    isEditing: false,
                    hasChanges: false
                },
                publishTime: {
                    field: 'publishTime',
                    value: content.publishTime,
                    isEditing: false,
                    hasChanges: false
                }
            });
            setSelectedDate(content.publishTime);
        }
    }, [content, isOpen]);

    // ==================== Event Handlers ====================
    const handleFieldEdit = useCallback((fieldName: string) => {
        setEditableFields(prev => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                isEditing: true
            }
        }));
    }, []);

    const handleFieldCancel = useCallback((fieldName: string) => {
        if (!content) return;

        setEditableFields(prev => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                isEditing: false,
                hasChanges: false,
                value: content[fieldName as keyof ScheduledContent],
                error: undefined
            }
        }));
    }, [content]);

    const handleFieldChange = useCallback((fieldName: string, value: any) => {
        if (!content) return;

        let error: string | undefined;

        // Validate based on field type
        switch (fieldName) {
            case 'title':
                error = validateTitle(value);
                break;
            case 'content':
                error = validateContent(value);
                break;
            case 'publishTime':
                error = validatePublishTime(value);
                break;
        }

        setEditableFields(prev => ({
            ...prev,
            [fieldName]: {
                ...prev[fieldName],
                value,
                hasChanges: value !== content[fieldName as keyof ScheduledContent],
                error
            }
        }));
    }, [content]);

    const handleFieldSave = useCallback(async (fieldName: string) => {
        const field = editableFields[fieldName];
        if (!field || !field.hasChanges || field.error || !onUpdate) return;

        try {
            setIsUpdating(true);

            const updates: Partial<ScheduledContent> = {
                [fieldName]: field.value,
                updatedAt: new Date()
            };

            await onUpdate(updates);

            setEditableFields(prev => ({
                ...prev,
                [fieldName]: {
                    ...prev[fieldName],
                    isEditing: false,
                    hasChanges: false,
                    error: undefined
                }
            }));

        } catch (error) {
            console.error(`Failed to update ${fieldName}:`, error);
            setEditableFields(prev => ({
                ...prev,
                [fieldName]: {
                    ...prev[fieldName],
                    error: error instanceof Error ? error.message : 'Failed to save changes'
                }
            }));
        } finally {
            setIsUpdating(false);
        }
    }, [editableFields, onUpdate]);

    const handleReschedule = useCallback(async (newDate: Date) => {
        if (!content || !onReschedule) return;

        const error = validatePublishTime(newDate);
        if (error) {
            setEditableFields(prev => ({
                ...prev,
                publishTime: {
                    ...prev.publishTime,
                    error
                }
            }));
            return;
        }

        try {
            setIsUpdating(true);
            await onReschedule(content.id, newDate);
            setShowCalendar(false);
            setSelectedDate(newDate);
        } catch (error) {
            console.error('Failed to reschedule:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [content, onReschedule]);

    const handleDelete = useCallback(async () => {
        if (!content || !onDelete) return;

        try {
            setIsUpdating(true);
            await onDelete(content.id);
            setShowDeleteConfirm(false);
            onClose();
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [content, onDelete, onClose]);

    const handleDuplicate = useCallback(async () => {
        if (!content || !onDuplicate) return;

        try {
            setIsUpdating(true);
            await onDuplicate(content.contentId);
            setShowDuplicateConfirm(false);
            onClose();
        } catch (error) {
            console.error('Failed to duplicate:', error);
        } finally {
            setIsUpdating(false);
        }
    }, [content, onDuplicate, onClose]);

    // ==================== Render Functions ====================
    const renderEditableField = (
        fieldName: string,
        label: string,
        component: 'input' | 'textarea' | 'datetime',
        icon?: React.ReactNode
    ) => {
        const field = editableFields[fieldName];
        if (!field) return null;

        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                        {icon}
                        {label}
                    </Label>
                    {!field.isEditing ? (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFieldEdit(fieldName)}
                            className="h-6 px-2 text-xs"
                        >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                    ) : (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFieldSave(fieldName)}
                                disabled={!field.hasChanges || !!field.error || isUpdating}
                                className="h-6 px-2 text-xs"
                            >
                                {isUpdating ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Save className="h-3 w-3 mr-1" />
                                )}
                                Save
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleFieldCancel(fieldName)}
                                disabled={isUpdating}
                                className="h-6 px-2 text-xs"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    )}
                </div>

                {field.isEditing ? (
                    <div className="space-y-1">
                        {component === 'input' && (
                            <Input
                                value={field.value}
                                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                className={cn(field.error && 'border-destructive')}
                                placeholder={`Enter ${label.toLowerCase()}`}
                            />
                        )}
                        {component === 'textarea' && (
                            <Textarea
                                value={field.value}
                                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                                className={cn('min-h-[100px]', field.error && 'border-destructive')}
                                placeholder={`Enter ${label.toLowerCase()}`}
                            />
                        )}
                        {component === 'datetime' && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="datetime-local"
                                    value={format(field.value, "yyyy-MM-dd'T'HH:mm")}
                                    onChange={(e) => handleFieldChange(fieldName, new Date(e.target.value))}
                                    className={cn(field.error && 'border-destructive')}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowOptimalTimes(!showOptimalTimes)}
                                    className="whitespace-nowrap"
                                >
                                    <Zap className="h-3 w-3 mr-1" />
                                    Optimal
                                </Button>
                            </div>
                        )}
                        {field.error && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {field.error}
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="p-3 bg-muted/30 rounded-md">
                        {component === 'datetime' ? (
                            <div className="space-y-1">
                                <p className="font-medium">{formatDateTime(field.value)}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(field.value, { addSuffix: true })} • {getTimezoneOffset()}
                                </p>
                            </div>
                        ) : (
                            <p className={cn(
                                component === 'textarea' ? 'whitespace-pre-wrap' : 'truncate',
                                'text-sm'
                            )}>
                                {field.value}
                            </p>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!content) return null;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className={cn(
                    "max-w-4xl max-h-[90vh] overflow-y-auto",
                    isMobile && "max-w-[95vw] h-[95vh]",
                    className
                )}>
                    <DialogHeader className="space-y-3">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <DialogTitle className="text-xl font-semibold">
                                    Content Details
                                </DialogTitle>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="text-xs">
                                        {CONTENT_TYPE_LABELS[content.contentType]}
                                    </Badge>
                                    <StatusBadge
                                        status={STATUS_VARIANTS[content.status]}
                                        label={content.status}
                                        className="text-xs"
                                    />
                                    <Badge variant="secondary" className="text-xs">
                                        ID: {content.id.slice(-8)}
                                    </Badge>
                                </div>
                            </div>
                            {loading && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading...
                                </div>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Content Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Content Information</h3>

                            {renderEditableField('title', 'Title', 'input', <Tag className="h-4 w-4" />)}
                            {renderEditableField('content', 'Content', 'textarea', <Edit className="h-4 w-4" />)}
                        </div>

                        <Separator />

                        {/* Scheduling Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Scheduling Information</h3>

                            {renderEditableField('publishTime', 'Publish Time', 'datetime', <Clock className="h-4 w-4" />)}

                            {/* Optimal Times Suggestions */}
                            {showOptimalTimes && optimalTimes && optimalTimes.length > 0 && (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Target className="h-4 w-4" />
                                            Optimal Posting Times
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {optimalTimes.slice(0, 3).map((time, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-2 rounded-md border cursor-pointer hover:bg-accent"
                                                onClick={() => {
                                                    const newDate = new Date(selectedDate || content.publishTime);
                                                    const [hours, minutes] = time.time.split(':').map(Number);
                                                    newDate.setHours(hours, minutes, 0, 0);
                                                    handleFieldChange('publishTime', newDate);
                                                }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    <span className="text-sm font-medium">{time.time}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][time.dayOfWeek]}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="text-xs text-muted-foreground">
                                                        {Math.round(time.expectedEngagement)}% engagement
                                                    </div>
                                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Publishing Channels */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Publishing Channels</Label>
                                <div className="flex flex-wrap gap-2">
                                    {content.channels.map((channel, index) => (
                                        <Badge
                                            key={index}
                                            variant="outline"
                                            className={cn("text-xs px-2 py-1", CHANNEL_COLORS[channel.type])}
                                        >
                                            {CHANNEL_ICONS[channel.type]}
                                            <span className="ml-1">{channel.accountName}</span>
                                            {channel.connectionStatus === 'connected' ? (
                                                <CheckCircle className="h-3 w-3 ml-1 text-green-600" />
                                            ) : (
                                                <AlertCircle className="h-3 w-3 ml-1 text-red-600" />
                                            )}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Performance Metrics */}
                        {analytics && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Performance Metrics
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-4 w-4 text-blue-600" />
                                                <div>
                                                    <p className="text-2xl font-bold">{analytics.views.toLocaleString()}</p>
                                                    <p className="text-xs text-muted-foreground">Views</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Heart className="h-4 w-4 text-red-600" />
                                                <div>
                                                    <p className="text-2xl font-bold">{analytics.likes.toLocaleString()}</p>
                                                    <p className="text-xs text-muted-foreground">Likes</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Share className="h-4 w-4 text-green-600" />
                                                <div>
                                                    <p className="text-2xl font-bold">{analytics.shares.toLocaleString()}</p>
                                                    <p className="text-xs text-muted-foreground">Shares</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Activity className="h-4 w-4 text-purple-600" />
                                                <div>
                                                    <p className="text-2xl font-bold">{analytics.engagementRate.toFixed(1)}%</p>
                                                    <p className="text-xs text-muted-foreground">Engagement</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* ROI Data */}
                        {roiData && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    ROI Performance
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-green-600" />
                                                <div>
                                                    <p className="text-xl font-bold">
                                                        ${roiData.totalRevenue.toLocaleString()}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Revenue</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-blue-600" />
                                                <div>
                                                    <p className="text-xl font-bold">{roiData.totalLeads}</p>
                                                    <p className="text-xs text-muted-foreground">Leads</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4 text-purple-600" />
                                                <div>
                                                    <p className="text-xl font-bold">{roiData.conversionRate.toFixed(1)}%</p>
                                                    <p className="text-xs text-muted-foreground">Conversion</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {/* Metadata */}
                        {content.metadata && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    Metadata
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {content.metadata.originalPrompt && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Original Prompt</Label>
                                            <div className="p-3 bg-muted/30 rounded-md">
                                                <p className="text-sm whitespace-pre-wrap">
                                                    {content.metadata.originalPrompt}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {content.metadata.aiModel && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">AI Model</Label>
                                            <Badge variant="outline">{content.metadata.aiModel}</Badge>
                                        </div>
                                    )}

                                    {content.metadata.tags && content.metadata.tags.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Tags</Label>
                                            <div className="flex flex-wrap gap-1">
                                                {content.metadata.tags.map((tag, index) => (
                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                        <Hash className="h-3 w-3 mr-1" />
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Created</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDateTime(content.createdAt)}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Last Updated</Label>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDateTime(content.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <div className="flex gap-2 flex-1">
                            {/* Quick Actions */}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCalendar(true)}
                                disabled={isUpdating}
                                className="flex-1 sm:flex-none"
                            >
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Reschedule
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDuplicateConfirm(true)}
                                disabled={isUpdating}
                                className="flex-1 sm:flex-none"
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={isUpdating}
                                className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </div>

                        <Button onClick={onClose} disabled={isUpdating}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Calendar Reschedule Dialog */}
            <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reschedule Content</DialogTitle>
                        <DialogDescription>
                            Select a new date and time for publishing this content.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => isBefore(date, new Date())}
                            className="rounded-md border"
                        />

                        {selectedDate && (
                            <div className="space-y-2">
                                <Label>Time</Label>
                                <Input
                                    type="time"
                                    value={format(selectedDate, 'HH:mm')}
                                    onChange={(e) => {
                                        const [hours, minutes] = e.target.value.split(':').map(Number);
                                        const newDate = new Date(selectedDate);
                                        newDate.setHours(hours, minutes, 0, 0);
                                        setSelectedDate(newDate);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCalendar(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => selectedDate && handleReschedule(selectedDate)}
                            disabled={!selectedDate || isUpdating}
                        >
                            {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <CalendarIcon className="h-4 w-4 mr-2" />
                            )}
                            Reschedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Scheduled Content</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this scheduled content? This action cannot be undone.
                            The content "{content.title}" will be permanently removed from your schedule.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isUpdating}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Trash2 className="h-4 w-4 mr-2" />
                            )}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Duplicate Confirmation Dialog */}
            <AlertDialog open={showDuplicateConfirm} onOpenChange={setShowDuplicateConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Duplicate Content</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will create a copy of "{content.title}" that you can schedule for a different time.
                            The duplicate will be created as a draft and you can edit it before scheduling.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDuplicate}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <Copy className="h-4 w-4 mr-2" />
                            )}
                            Duplicate
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}