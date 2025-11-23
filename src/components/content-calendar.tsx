'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Facebook,
    Instagram,
    Linkedin,
    Twitter,
    Globe,
    Mail,
    MoreHorizontal,
    Filter,
    Grid3X3,
    List,
    Eye,
    Edit,
    Trash2,
    Copy,
    Play,
    Pause,
    CheckCircle,
    AlertCircle,
    XCircle,
    Move,
    Calendar
} from 'lucide-react';
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    KeyboardSensor,
    TouchSensor,
    closestCenter,
    DragOverEvent,
    UniqueIdentifier
} from '@dnd-kit/core';
import {
    sortableKeyboardCoordinates,
    arrayMove
} from '@dnd-kit/sortable';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { StatusBadge } from '@/components/shared/status-badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ContentDetailModal } from '@/components/content-detail-modal';
import {
    ScheduledContent,
    PublishChannelType,
    ContentCategory,
    ScheduledContentStatus,
    CalendarContent,
    CalendarViewConfig,
    EngagementMetrics,
    OptimalTime,
    ROIAnalytics
} from '@/lib/content-workflow-types';

// ==================== Types ====================

export interface ContentCalendarProps {
    userId: string;
    initialDate?: Date;
    scheduledContent?: ScheduledContent[];
    loading?: boolean;
    onScheduleUpdate?: (scheduleId: string, newDate: Date) => Promise<void>;
    onContentClick?: (contentId: string) => void;
    onContentEdit?: (contentId: string) => void;
    onContentDelete?: (contentId: string) => void;
    onContentDuplicate?: (contentId: string) => void;
    onContentUpdate?: (contentId: string, updates: Partial<ScheduledContent>) => Promise<void>;
    onContentReschedule?: (contentId: string, newDate: Date) => Promise<void>;
    getAnalytics?: (contentId: string) => Promise<EngagementMetrics | undefined>;
    getOptimalTimes?: (contentType: ContentCategory, channel: PublishChannelType) => Promise<OptimalTime[]>;
    getROIData?: (contentId: string) => Promise<ROIAnalytics | undefined>;
    className?: string;
}

// Drag and drop types
interface DragData {
    type: 'content';
    content: ScheduledContent;
}

interface DropData {
    type: 'calendar-day';
    date: Date;
}

type ViewMode = 'month' | 'week' | 'day';

interface CalendarDay {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    content: ScheduledContent[];
    hasConflicts: boolean;
}

// ==================== Constants ====================

const CHANNEL_ICONS: Record<PublishChannelType, React.ReactNode> = {
    [PublishChannelType.FACEBOOK]: <Facebook className="h-3 w-3" />,
    [PublishChannelType.INSTAGRAM]: <Instagram className="h-3 w-3" />,
    [PublishChannelType.LINKEDIN]: <Linkedin className="h-3 w-3" />,
    [PublishChannelType.TWITTER]: <Twitter className="h-3 w-3" />,
    [PublishChannelType.BLOG]: <Globe className="h-3 w-3" />,
    [PublishChannelType.NEWSLETTER]: <Mail className="h-3 w-3" />
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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// ==================== Drag and Drop Components ====================

/**
 * Draggable content item component
 */
function DraggableContentItem({
    content,
    isCompact = false,
    onContentClick,
    onContentAction
}: {
    content: ScheduledContent;
    isCompact?: boolean;
    onContentClick?: (contentId: string) => void;
    onContentAction?: (action: string, content: ScheduledContent) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        isDragging,
    } = useDraggable({
        id: content.id,
        data: {
            type: 'content',
            content,
        } as DragData,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative p-2 rounded-md border transition-all duration-200",
                "hover:shadow-md hover:border-primary/50 cursor-pointer",
                isDragging && "opacity-50 shadow-lg z-50",
                isCompact ? "text-xs" : "text-sm"
            )}
            onClick={() => onContentClick?.(content.contentId)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                            {formatTime(content.publishTime)}
                        </span>
                        <StatusBadge
                            status={STATUS_VARIANTS[content.status]}
                            label={content.status}
                            showIcon={false}
                            className="text-xs px-1.5 py-0.5"
                        />
                    </div>
                    <h4 className={cn(
                        "font-medium truncate",
                        isCompact ? "text-xs" : "text-sm"
                    )}>
                        {content.title}
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {content.channels.map(channel => (
                            <Badge
                                key={channel.type}
                                variant="outline"
                                className={cn("text-xs px-1.5 py-0.5", CHANNEL_COLORS[channel.type])}
                            >
                                {CHANNEL_ICONS[channel.type]}
                                <span className="ml-1 hidden sm:inline">
                                    {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)}
                                </span>
                            </Badge>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {/* Drag handle */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 cursor-grab active:cursor-grabbing"
                        {...attributes}
                        {...listeners}
                        aria-label="Drag to reschedule"
                    >
                        <Move className="h-3 w-3" />
                    </Button>

                    {/* Actions menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                            >
                                <MoreHorizontal className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onContentAction?.('view', content)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onContentAction?.('edit', content)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onContentAction?.('duplicate', content)}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => onContentAction?.('delete', content)}
                                className="text-destructive"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}

/**
 * Droppable calendar day component
 */
function DroppableCalendarDay({
    day,
    onDateClick,
    onContentClick,
    onContentAction,
    isOver
}: {
    day: CalendarDay;
    onDateClick: (date: Date) => void;
    onContentClick?: (contentId: string) => void;
    onContentAction?: (action: string, content: ScheduledContent) => void;
    isOver?: boolean;
}) {
    const { setNodeRef } = useDroppable({
        id: `calendar-day-${day.date.toISOString()}`,
        data: {
            type: 'calendar-day',
            date: day.date,
        } as DropData,
    });

    const hasContent = day.content.length > 0;
    const isSelected = false; // Will be set by parent component

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "min-h-[120px] p-2 border border-border/50 transition-all duration-200",
                "hover:bg-accent/50 cursor-pointer",
                !day.isCurrentMonth && "bg-muted/30 text-muted-foreground",
                day.isToday && "bg-primary/5 border-primary/30",
                isSelected && "bg-primary/10 border-primary",
                day.hasConflicts && "border-warning/50 bg-warning/5",
                isOver && "bg-primary/20 border-primary border-2 border-dashed"
            )}
            onClick={() => onDateClick(day.date)}
            role="button"
            tabIndex={0}
            aria-label={`${day.date.toDateString()}, ${day.content.length} scheduled items`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onDateClick(day.date);
                }
            }}
        >
            <div className="flex items-center justify-between mb-2">
                <span className={cn(
                    "text-sm font-medium",
                    day.isToday && "text-primary font-semibold"
                )}>
                    {day.date.getDate()}
                </span>
                {hasContent && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {day.content.length}
                    </Badge>
                )}
            </div>

            <div className="space-y-1">
                {day.content.slice(0, 3).map(content => (
                    <DraggableContentItem
                        key={content.id}
                        content={content}
                        isCompact={true}
                        onContentClick={onContentClick}
                        onContentAction={onContentAction}
                    />
                ))}
                {day.content.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                        +{day.content.length - 3} more
                    </div>
                )}
            </div>

            {day.hasConflicts && (
                <div className="absolute top-1 right-1">
                    <AlertCircle className="h-3 w-3 text-warning" />
                </div>
            )}

            {isOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-md">
                    <div className="flex items-center gap-2 text-primary font-medium">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Drop to reschedule</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==================== Utility Functions ====================

const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate();
};

const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const getCalendarDays = (currentDate: Date): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the first Sunday of the calendar view
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End at the last Saturday of the calendar view
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: CalendarDay[] = [];
    const currentDateIter = new Date(startDate);

    while (currentDateIter <= endDate) {
        days.push({
            date: new Date(currentDateIter),
            isCurrentMonth: currentDateIter.getMonth() === month,
            isToday: isSameDay(currentDateIter, today),
            isSelected: false,
            content: [],
            hasConflicts: false
        });
        currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    return days;
};

// ==================== Main Component ====================

export function ContentCalendar({
    userId,
    initialDate = new Date(),
    scheduledContent = [],
    loading = false,
    onScheduleUpdate,
    onContentClick,
    onContentEdit,
    onContentDelete,
    onContentDuplicate,
    onContentUpdate,
    onContentReschedule,
    getAnalytics,
    getOptimalTimes,
    getROIData,
    className
}: ContentCalendarProps) {
    const isMobile = useIsMobile();

    // ==================== State ====================
    const [currentDate, setCurrentDate] = useState(initialDate);
    const [viewMode, setViewMode] = useState<ViewMode>('month');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [filters, setFilters] = useState<{
        channels: PublishChannelType[];
        contentTypes: ContentCategory[];
        status: ScheduledContentStatus[];
    }>({
        channels: [],
        contentTypes: [],
        status: []
    });

    // Drag and drop state
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
    const [draggedContent, setDraggedContent] = useState<ScheduledContent | null>(null);
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [dragOverDate, setDragOverDate] = useState<Date | null>(null);

    // Content detail modal state
    const [selectedContent, setSelectedContent] = useState<ScheduledContent | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [modalAnalytics, setModalAnalytics] = useState<EngagementMetrics | undefined>(undefined);
    const [modalOptimalTimes, setModalOptimalTimes] = useState<OptimalTime[]>([]);
    const [modalROIData, setModalROIData] = useState<ROIAnalytics | undefined>(undefined);
    const [modalLoading, setModalLoading] = useState(false);

    // Configure sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250, // 250ms delay for touch
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // ==================== Computed Values ====================
    const calendarDays = useMemo(() => {
        const days = getCalendarDays(currentDate);

        // Add content to each day
        return days.map(day => {
            const dayContent = scheduledContent.filter(content =>
                isSameDay(content.publishTime, day.date)
            );

            // Apply filters
            const filteredContent = dayContent.filter(content => {
                if (filters.channels.length > 0 && !content.channels.some(ch => filters.channels.includes(ch.type))) {
                    return false;
                }
                if (filters.contentTypes.length > 0 && !filters.contentTypes.includes(content.contentType)) {
                    return false;
                }
                if (filters.status.length > 0 && !filters.status.includes(content.status)) {
                    return false;
                }
                return true;
            });

            // Check for conflicts (multiple items at same time)
            const timeGroups = filteredContent.reduce((acc, content) => {
                const timeKey = content.publishTime.toISOString();
                acc[timeKey] = (acc[timeKey] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const hasConflicts = Object.values(timeGroups).some(count => count > 1);

            return {
                ...day,
                content: filteredContent,
                hasConflicts
            };
        });
    }, [currentDate, scheduledContent, filters]);

    const selectedDayContent = useMemo(() => {
        if (!selectedDate) return [];
        return scheduledContent.filter(content =>
            isSameDay(content.publishTime, selectedDate)
        );
    }, [selectedDate, scheduledContent]);

    // ==================== Event Handlers ====================
    const handlePreviousMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const handleToday = useCallback(() => {
        setCurrentDate(new Date());
    }, []);

    const handleDateClick = useCallback((date: Date) => {
        setSelectedDate(date);
    }, []);

    const handleContentAction = useCallback(async (action: string, content: ScheduledContent) => {
        switch (action) {
            case 'view':
                await handleContentView(content);
                break;
            case 'edit':
                onContentEdit?.(content.contentId);
                break;
            case 'delete':
                onContentDelete?.(content.id);
                break;
            case 'duplicate':
                onContentDuplicate?.(content.contentId);
                break;
        }
    }, [onContentEdit, onContentDelete, onContentDuplicate]);

    const handleContentView = useCallback(async (content: ScheduledContent) => {
        setSelectedContent(content);
        setShowDetailModal(true);
        setModalLoading(true);

        try {
            // Load analytics data if available
            if (getAnalytics) {
                const analytics = await getAnalytics(content.contentId);
                setModalAnalytics(analytics);
            }

            // Load optimal times if available
            if (getOptimalTimes && content.channels.length > 0) {
                const optimalTimes = await getOptimalTimes(content.contentType, content.channels[0].type);
                setModalOptimalTimes(optimalTimes);
            }

            // Load ROI data if available
            if (getROIData) {
                const roiData = await getROIData(content.contentId);
                setModalROIData(roiData);
            }
        } catch (error) {
            console.error('Failed to load content details:', error);
        } finally {
            setModalLoading(false);
        }
    }, [getAnalytics, getOptimalTimes, getROIData]);

    const handleContentClick = useCallback(async (contentId: string) => {
        const content = scheduledContent.find(c => c.contentId === contentId);
        if (content) {
            await handleContentView(content);
        } else {
            onContentClick?.(contentId);
        }
    }, [scheduledContent, handleContentView, onContentClick]);

    const handleModalClose = useCallback(() => {
        setShowDetailModal(false);
        setSelectedContent(null);
        setModalAnalytics(undefined);
        setModalOptimalTimes([]);
        setModalROIData(undefined);
        setModalLoading(false);
    }, []);

    const handleModalUpdate = useCallback(async (updates: Partial<ScheduledContent>) => {
        if (!selectedContent || !onContentUpdate) return;
        await onContentUpdate(selectedContent.id, updates);
    }, [selectedContent, onContentUpdate]);

    const handleModalDelete = useCallback(async (contentId: string) => {
        if (!onContentDelete) return;
        await onContentDelete(contentId);
        handleModalClose();
    }, [onContentDelete, handleModalClose]);

    const handleModalDuplicate = useCallback(async (contentId: string) => {
        if (!onContentDuplicate) return;
        await onContentDuplicate(contentId);
        handleModalClose();
    }, [onContentDuplicate, handleModalClose]);

    const handleModalReschedule = useCallback(async (contentId: string, newDate: Date) => {
        if (!onContentReschedule) return;
        await onContentReschedule(contentId, newDate);
        // Update the selected content with new date
        if (selectedContent) {
            setSelectedContent({ ...selectedContent, publishTime: newDate });
        }
    }, [onContentReschedule, selectedContent]);

    // ==================== Drag and Drop Handlers ====================
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const { active } = event;
        const dragData = active.data.current as DragData;

        if (dragData?.type === 'content') {
            setActiveId(active.id);
            setDraggedContent(dragData.content);
        }
    }, []);

    const handleDragOver = useCallback((event: DragOverEvent) => {
        const { over } = event;

        if (over) {
            const dropData = over.data.current as DropData;
            if (dropData?.type === 'calendar-day') {
                setDragOverDate(dropData.date);
            }
        } else {
            setDragOverDate(null);
        }
    }, []);

    const handleDragEnd = useCallback(async (event: DragEndEvent) => {
        const { active, over } = event;

        setActiveId(null);
        setDraggedContent(null);
        setDragOverDate(null);

        if (!over || !draggedContent) return;

        const dropData = over.data.current as DropData;

        if (dropData?.type === 'calendar-day') {
            const newDate = dropData.date;
            const originalDate = draggedContent.publishTime;

            // Don't update if dropped on the same date
            if (isSameDay(newDate, originalDate)) {
                return;
            }

            // Validate that the new date is in the future
            if (newDate <= new Date()) {
                // Show error toast or notification
                console.error('Cannot reschedule to past date');
                return;
            }

            try {
                setIsRescheduling(true);

                // Create new publish time maintaining the original time
                const newPublishTime = new Date(newDate);
                newPublishTime.setHours(
                    originalDate.getHours(),
                    originalDate.getMinutes(),
                    originalDate.getSeconds(),
                    originalDate.getMilliseconds()
                );

                // Call the update handler with optimistic UI
                await onScheduleUpdate?.(draggedContent.id, newPublishTime);

                // Success feedback could be added here
                console.log(`Content rescheduled from ${originalDate.toDateString()} to ${newDate.toDateString()}`);

            } catch (error) {
                console.error('Failed to reschedule content:', error);
                // Error handling - could show toast notification
                // The UI will automatically revert due to optimistic updates
            } finally {
                setIsRescheduling(false);
            }
        }
    }, [draggedContent, onScheduleUpdate]);

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        setDraggedContent(null);
        setDragOverDate(null);
    }, []);

    // ==================== Keyboard Navigation ====================
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return; // Don't interfere with form inputs
            }

            switch (e.key) {
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePreviousMonth();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleNextMonth();
                    break;
                case 'Home':
                    e.preventDefault();
                    handleToday();
                    break;
                case 'Escape':
                    e.preventDefault();
                    setSelectedDate(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePreviousMonth, handleNextMonth, handleToday]);

    // ==================== Render Functions ====================
    const renderChannelBadge = (channel: PublishChannelType) => (
        <Badge
            key={channel}
            variant="outline"
            className={cn("text-xs px-1.5 py-0.5", CHANNEL_COLORS[channel])}
        >
            {CHANNEL_ICONS[channel]}
            <span className="ml-1 hidden sm:inline">
                {channel.charAt(0).toUpperCase() + channel.slice(1)}
            </span>
        </Badge>
    );

    // ==================== Mobile View ====================
    if (isMobile) {
        return (
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={handleDragCancel}
            >
                <div className={cn("space-y-4", className)}>
                    {/* Mobile Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <h2 className="text-lg font-semibold">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <Button variant="outline" size="sm" onClick={handleNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleToday}>
                            Today
                        </Button>
                    </div>

                    {/* Rescheduling indicator */}
                    {isRescheduling && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                            Rescheduling...
                        </div>
                    )}

                    {/* Mobile Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
                                {day}
                            </div>
                        ))}
                        {calendarDays.map(day => {
                            const MobileDroppableDay = () => {
                                const { setNodeRef } = useDroppable({
                                    id: `mobile-calendar-day-${day.date.toISOString()}`,
                                    data: {
                                        type: 'calendar-day',
                                        date: day.date,
                                    } as DropData,
                                });

                                const isOver = dragOverDate ? isSameDay(dragOverDate, day.date) : false;

                                return (
                                    <div
                                        ref={setNodeRef}
                                        className={cn(
                                            "aspect-square p-1 text-center text-sm border border-border/50",
                                            "flex flex-col items-center justify-center cursor-pointer transition-all relative",
                                            !day.isCurrentMonth && "text-muted-foreground bg-muted/30",
                                            day.isToday && "bg-primary text-primary-foreground font-semibold",
                                            day.content.length > 0 && "bg-accent",
                                            isOver && "bg-primary/20 border-primary border-2 border-dashed"
                                        )}
                                        onClick={() => handleDateClick(day.date)}
                                    >
                                        <span>{day.date.getDate()}</span>
                                        {day.content.length > 0 && (
                                            <div className="w-1 h-1 bg-primary rounded-full mt-1" />
                                        )}
                                        {isOver && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Calendar className="h-3 w-3 text-primary" />
                                            </div>
                                        )}
                                    </div>
                                );
                            };

                            return <MobileDroppableDay key={day.date.toISOString()} />;
                        })}
                    </div>

                    {/* Selected Day Content */}
                    {selectedDate && selectedDayContent.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">
                                    {selectedDate.toDateString()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {selectedDayContent.map(content => (
                                    <DraggableContentItem
                                        key={content.id}
                                        content={content}
                                        onContentClick={handleContentClick}
                                        onContentAction={handleContentAction}
                                    />
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Drag Overlay for Mobile */}
                <DragOverlay>
                    {draggedContent ? (
                        <div className="bg-background border border-primary shadow-lg rounded-md p-2 opacity-90 max-w-[200px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                    {formatTime(draggedContent.publishTime)}
                                </span>
                            </div>
                            <h4 className="font-medium text-sm truncate">
                                {draggedContent.title}
                            </h4>
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Content Detail Modal */}
                <ContentDetailModal
                    content={selectedContent}
                    isOpen={showDetailModal}
                    onClose={handleModalClose}
                    onUpdate={handleModalUpdate}
                    onDelete={handleModalDelete}
                    onDuplicate={handleModalDuplicate}
                    onReschedule={handleModalReschedule}
                    analytics={modalAnalytics}
                    optimalTimes={modalOptimalTimes}
                    roiData={modalROIData}
                    loading={modalLoading}
                />
            </DndContext>
        );
    }

    // ==================== Desktop View ====================
    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className={cn("space-y-6", className)}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <h2 className="text-2xl font-semibold min-w-[200px] text-center">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <Button variant="outline" size="sm" onClick={handleNextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button variant="outline" onClick={handleToday}>
                            Today
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Rescheduling indicator */}
                        {isRescheduling && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                                Rescheduling...
                            </div>
                        )}

                        {/* View Mode Toggle */}
                        <div className="flex items-center border rounded-md">
                            <Button
                                variant={viewMode === 'month' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('month')}
                                className="rounded-r-none"
                            >
                                <Grid3X3 className="h-4 w-4" />
                                Month
                            </Button>
                            <Button
                                variant={viewMode === 'week' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('week')}
                                className="rounded-none border-x"
                            >
                                <List className="h-4 w-4" />
                                Week
                            </Button>
                            <Button
                                variant={viewMode === 'day' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('day')}
                                className="rounded-l-none"
                            >
                                <CalendarIcon className="h-4 w-4" />
                                Day
                            </Button>
                        </div>

                        {/* Filters */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filters
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Channels</DropdownMenuLabel>
                                {Object.values(PublishChannelType).map(channel => (
                                    <DropdownMenuCheckboxItem
                                        key={channel}
                                        checked={filters.channels.includes(channel)}
                                        onCheckedChange={(checked) => {
                                            setFilters(prev => ({
                                                ...prev,
                                                channels: checked
                                                    ? [...prev.channels, channel]
                                                    : prev.channels.filter(c => c !== channel)
                                            }));
                                        }}
                                    >
                                        <div className="flex items-center gap-2">
                                            {CHANNEL_ICONS[channel]}
                                            {channel.charAt(0).toUpperCase() + channel.slice(1)}
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel>Status</DropdownMenuLabel>
                                {Object.values(ScheduledContentStatus).map(status => (
                                    <DropdownMenuCheckboxItem
                                        key={status}
                                        checked={filters.status.includes(status)}
                                        onCheckedChange={(checked) => {
                                            setFilters(prev => ({
                                                ...prev,
                                                status: checked
                                                    ? [...prev.status, status]
                                                    : prev.status.filter(s => s !== status)
                                            }));
                                        }}
                                    >
                                        {status.charAt(0).toUpperCase() + status.slice(1)}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="border rounded-lg overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b bg-muted/30">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="p-4 text-center font-medium text-sm">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7">
                        {calendarDays.map(day => (
                            <DroppableCalendarDay
                                key={day.date.toISOString()}
                                day={day}
                                onDateClick={handleDateClick}
                                onContentClick={handleContentClick}
                                onContentAction={handleContentAction}
                                isOver={dragOverDate ? isSameDay(dragOverDate, day.date) : false}
                            />
                        ))}
                    </div>
                </div>

                {/* Selected Day Detail */}
                {selectedDate && selectedDayContent.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{selectedDate.toDateString()}</span>
                                <Badge variant="secondary">
                                    {selectedDayContent.length} scheduled
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {selectedDayContent.map(content => (
                                    <DraggableContentItem
                                        key={content.id}
                                        content={content}
                                        onContentClick={handleContentClick}
                                        onContentAction={handleContentAction}
                                    />
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                )}
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {draggedContent ? (
                    <div className="bg-background border border-primary shadow-lg rounded-md p-2 opacity-90">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                {formatTime(draggedContent.publishTime)}
                            </span>
                        </div>
                        <h4 className="font-medium text-sm truncate">
                            {draggedContent.title}
                        </h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {draggedContent.channels.map(channel => renderChannelBadge(channel.type))}
                        </div>
                    </div>
                ) : null}
            </DragOverlay>

            {/* Content Detail Modal */}
            <ContentDetailModal
                content={selectedContent}
                isOpen={showDetailModal}
                onClose={handleModalClose}
                onUpdate={handleModalUpdate}
                onDelete={handleModalDelete}
                onDuplicate={handleModalDuplicate}
                onReschedule={handleModalReschedule}
                analytics={modalAnalytics}
                optimalTimes={modalOptimalTimes}
                roiData={modalROIData}
                loading={modalLoading}
            />
        </DndContext>
    );
}