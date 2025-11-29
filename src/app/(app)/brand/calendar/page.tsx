'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@/aws/auth';
import { ContentCalendar } from '@/components/content-calendar';
import { BulkSchedulingModal } from '@/components/bulk-scheduling-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { IntelligentEmptyState } from '@/components/ui/intelligent-empty-state';
import { StandardSkeleton } from '@/components/standard/skeleton';
import { SearchInput } from '@/components/ui/search-input';
import { toast } from '@/hooks/use-toast';
import {
    Calendar as CalendarIcon,
    Filter,
    Download,
    Plus,
    RefreshCw,
    Settings,
    Search,
    SortAsc,
    SortDesc,
    Grid3X3,
    List,
    Eye,
    MoreHorizontal,
    CheckSquare,
    Square,
    Zap,
    Users,
    Clock
} from 'lucide-react';
import {
    ScheduledContent,
    PublishChannelType,
    ContentCategory,
    ScheduledContentStatus,
    CalendarContent,
    OptimalTime,
    EngagementMetrics,
    ROIAnalytics,
    BulkScheduleItem,
    PublishChannel
} from '@/lib/content-workflow-types';
import {
    getCalendarContentAction,
    updateScheduleAction,
    cancelScheduleAction,
    getOptimalTimesAction,
    getConnectedChannelsAction
} from '@/app/content-workflow-actions';
import { FavoritesButton } from '@/components/favorites-button';
import { getPageConfig } from '@/components/dashboard-quick-actions';
import { PostCard } from './post-card';
interface CalendarFilters {
    channels: PublishChannelType[];
    contentTypes: ContentCategory[];
    status: ScheduledContentStatus[];
    searchQuery: string;
    dateRange: {
        start: Date;
        end: Date;
    };
}

interface CalendarSorting {
    field: 'publishTime' | 'title' | 'contentType' | 'status';
    order: 'asc' | 'desc';
}

export default function LibraryCalendarPage() {
    const { user, isUserLoading } = useUser();

    // State management
    const [scheduledContent, setScheduledContent] = useState<ScheduledContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Calendar state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Multi-select state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [showBulkSchedulingModal, setShowBulkSchedulingModal] = useState(false);

    // Available channels for bulk scheduling
    const [availableChannels, setAvailableChannels] = useState<PublishChannel[]>([]);

    // Filtering and search state
    const [filters, setFilters] = useState<CalendarFilters>({
        channels: [],
        contentTypes: [],
        status: [],
        searchQuery: '',
        dateRange: {
            start: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
            end: new Date(new Date().getFullYear(), new Date().getMonth() + 2, 0) // End of next month
        }
    });

    // Sorting state
    const [sorting, setSorting] = useState<CalendarSorting>({
        field: 'publishTime',
        order: 'asc'
    });

    // View state
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [showFilters, setShowFilters] = useState(false);

    // Fetch calendar content
    const fetchCalendarContent = useCallback(async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const formData = new FormData();
            formData.append('userId', user.id); // Add userId for auth
            formData.append('startDate', filters.dateRange.start.toISOString());
            formData.append('endDate', filters.dateRange.end.toISOString());

            if (filters.channels.length > 0) {
                formData.append('channels', JSON.stringify(filters.channels));
            }
            if (filters.contentTypes.length > 0) {
                formData.append('contentTypes', JSON.stringify(filters.contentTypes));
            }
            if (filters.status.length > 0) {
                formData.append('status', JSON.stringify(filters.status));
            }

            const result = await getCalendarContentAction(null, formData);

            if (result.success && result.data) {
                // Flatten the calendar content structure to ScheduledContent array
                const flattenedContent: ScheduledContent[] = result.data.flatMap(day => day.items);
                setScheduledContent(flattenedContent);
            } else {
                throw new Error(result.error || 'Failed to fetch calendar content');
            }

        } catch (err) {
            console.error('Failed to fetch calendar content:', err);
            setError('Failed to load calendar content. Please try again.');
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to load calendar content. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    }, [user, filters.dateRange, filters.channels, filters.contentTypes, filters.status]);

    // Refresh calendar content
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchCalendarContent();
        setRefreshing(false);
        toast({
            title: 'Calendar Refreshed',
            description: 'Calendar content has been updated.'
        });
    }, [fetchCalendarContent]);

    // Handle schedule updates (drag and drop)
    const handleScheduleUpdate = useCallback(async (scheduleId: string, newDate: Date) => {
        if (!user) return;

        try {
            // Optimistic update
            setScheduledContent(prev =>
                prev.map(item =>
                    item.id === scheduleId
                        ? { ...item, publishTime: newDate, updatedAt: new Date() }
                        : item
                )
            );

            const formData = new FormData();
            formData.append('userId', user.id); // Add userId for auth
            formData.append('scheduleId', scheduleId);
            formData.append('newPublishTime', newDate.toISOString());

            const result = await updateScheduleAction(null, formData);

            if (!result.success) {
                throw new Error(result.error || 'Failed to update schedule');
            }

            toast({
                title: 'Schedule Updated',
                description: `Content rescheduled to ${newDate.toLocaleDateString()}`
            });

        } catch (error) {
            console.error('Failed to update schedule:', error);
            // Revert optimistic update
            await fetchCalendarContent();
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to update schedule. Please try again.'
            });
        }
    }, [fetchCalendarContent]);

    // Handle content actions
    const handleContentClick = useCallback((contentId: string) => {
        // Open content detail modal or navigate to content
        console.log('Content clicked:', contentId);
    }, []);

    const handleContentEdit = useCallback((contentId: string) => {
        // Navigate to Studio to edit content
        window.location.href = `/studio/write?contentId=${contentId}`;
    }, []);

    const handleContentDelete = useCallback(async (scheduleId: string) => {
        if (!user) return;

        try {
            // Optimistic update
            setScheduledContent(prev => prev.filter(item => item.id !== scheduleId));

            const formData = new FormData();
            formData.append('userId', user.id); // Add userId for auth
            formData.append('scheduleId', scheduleId);

            const result = await cancelScheduleAction(null, formData);

            if (!result.success) {
                throw new Error(result.error || 'Failed to cancel schedule');
            }

            toast({
                title: 'Content Removed',
                description: 'Scheduled content has been cancelled.'
            });

        } catch (error) {
            console.error('Failed to delete scheduled content:', error);
            // Revert optimistic update
            await fetchCalendarContent();
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to cancel scheduled content. Please try again.'
            });
        }
    }, [fetchCalendarContent]);

    const handleContentDuplicate = useCallback((contentId: string) => {
        // Navigate to Studio with content pre-filled
        window.location.href = `/studio/write?duplicate=${contentId}`;
    }, []);

    // Filter and sort content
    const filteredAndSortedContent = useMemo(() => {
        let filtered = scheduledContent;

        // Apply filters (client-side filtering for search and additional filters not handled by API)
        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.content.toLowerCase().includes(query) ||
                item.contentType.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            let aValue: any = a[sorting.field];
            let bValue: any = b[sorting.field];

            if (sorting.field === 'publishTime') {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            } else if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            if (sorting.order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });

        return filtered;
    }, [scheduledContent, filters.searchQuery, sorting]);

    // Export calendar functionality
    const handleExportCalendar = useCallback(async (format: 'ical' | 'google') => {
        try {
            // TODO: Implement actual export functionality
            toast({
                title: 'Export Started',
                description: `Exporting calendar to ${format.toUpperCase()} format...`
            });
        } catch (error) {
            console.error('Failed to export calendar:', error);
            toast({
                variant: 'destructive',
                title: 'Export Failed',
                description: 'Failed to export calendar. Please try again.'
            });
        }
    }, []);

    // Load data on mount and user change
    useEffect(() => {
        if (user) {
            fetchCalendarContent();

            // Load available channels
            const fetchChannels = async () => {
                try {
                    const result = await getConnectedChannelsAction(user.id); // Pass userId
                    if (result.success && result.data) {
                        setAvailableChannels(result.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch connected channels:', error);
                }
            };

            fetchChannels();
        }
    }, [user, fetchCalendarContent]);

    // Multi-select handlers
    const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (selected) {
                newSet.add(itemId);
            } else {
                newSet.delete(itemId);
            }
            return newSet;
        });
    }, []);

    const handleSelectAll = useCallback(() => {
        const allItemIds = filteredAndSortedContent.map(item => item.id);
        setSelectedItems(new Set(allItemIds));
    }, [filteredAndSortedContent]);

    const handleDeselectAll = useCallback(() => {
        setSelectedItems(new Set());
    }, []);

    const toggleMultiSelectMode = useCallback(() => {
        setIsMultiSelectMode(prev => !prev);
        if (isMultiSelectMode) {
            setSelectedItems(new Set());
        }
    }, [isMultiSelectMode]);

    // Bulk scheduling handlers
    const handleBulkSchedule = useCallback(() => {
        if (selectedItems.size === 0) {
            toast({
                variant: 'destructive',
                title: 'No Items Selected',
                description: 'Please select at least one item to schedule.'
            });
            return;
        }

        // Convert selected scheduled content to bulk schedule items
        const bulkItems: BulkScheduleItem[] = filteredAndSortedContent
            .filter(item => selectedItems.has(item.id))
            .map(item => ({
                contentId: item.contentId,
                title: item.title,
                content: item.content,
                contentType: item.contentType,
                priority: 3 // Default priority
            }));

        setShowBulkSchedulingModal(true);
    }, [selectedItems, filteredAndSortedContent]);

    const handleBulkSchedulingComplete = useCallback((scheduled: ScheduledContent[], failed: any[]) => {
        // Refresh calendar content
        fetchCalendarContent();

        // Clear selection and exit multi-select mode
        setSelectedItems(new Set());
        setIsMultiSelectMode(false);
        setShowBulkSchedulingModal(false);

        toast({
            title: 'Bulk Scheduling Complete',
            description: `Successfully scheduled ${scheduled.length} items. ${failed.length} items failed.`
        });
    }, [fetchCalendarContent]);

    // Keyboard shortcuts for multi-select
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Ctrl/Cmd + A to select all
            if ((event.ctrlKey || event.metaKey) && event.key === 'a' && isMultiSelectMode) {
                event.preventDefault();
                handleSelectAll();
            }

            // Escape to exit multi-select mode
            if (event.key === 'Escape' && isMultiSelectMode) {
                setIsMultiSelectMode(false);
                setSelectedItems(new Set());
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isMultiSelectMode, handleSelectAll]);

    // Convert selected items to bulk schedule items
    const selectedBulkItems = useMemo(() => {
        return filteredAndSortedContent
            .filter(item => selectedItems.has(item.id))
            .map(item => ({
                contentId: item.contentId,
                title: item.title,
                content: item.content,
                contentType: item.contentType,
                priority: 3
            }));
    }, [filteredAndSortedContent, selectedItems]);

    // Loading state
    if (isUserLoading || loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="flex gap-2">
                        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-10 w-24 bg-muted animate-pulse rounded" />
                    </div>
                </div>
                <StandardSkeleton variant="list" count={5} />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Content Calendar</h1>
                        <p className="text-muted-foreground">
                            Schedule and manage your content across all channels
                        </p>
                    </div>
                    <Button onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Retry
                    </Button>
                </div>
                <Card>
                    <CardContent className="flex items-center justify-center py-12">
                        <div className="text-center space-y-4">
                            <div className="text-destructive">
                                <CalendarIcon className="h-12 w-12 mx-auto mb-4" />
                            </div>
                            <h3 className="text-lg font-semibold">Failed to Load Calendar</h3>
                            <p className="text-muted-foreground max-w-md">
                                {error}
                            </p>
                            <Button onClick={handleRefresh} disabled={refreshing}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                Try Again
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Empty state
    if (!loading && filteredAndSortedContent.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Content Calendar</h1>
                        <p className="text-muted-foreground">
                            Schedule and manage your content across all channels
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <Button onClick={() => window.location.href = '/studio/write'}>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Content
                        </Button>
                    </div>
                </div>

                <IntelligentEmptyState
                    icon={CalendarIcon}
                    title="No Scheduled Content"
                    description="You haven't scheduled any content yet. Start creating and scheduling content to see it appear in your calendar."
                    actions={[
                        {
                            label: "Create Content",
                            onClick: () => window.location.href = '/studio/write',
                            icon: Plus,
                        },
                        {
                            label: "Learn About Scheduling",
                            onClick: () => console.log('Open help'),
                            variant: "outline"
                        }
                    ]}
                    variant="card"
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-headline text-2xl">Content Calendar</CardTitle>
                            <CardDescription>
                                Schedule and manage your content across all channels
                                {isMultiSelectMode && selectedItems.size > 0 && (
                                    <span className="ml-2">
                                        • {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                        {(() => {
                            const pageConfig = getPageConfig('/brand/calendar');
                            return pageConfig ? <FavoritesButton item={pageConfig} /> : null;
                        })()}
                    </div>
                </CardHeader>
            </Card>
            <div className="flex items-center justify-between">
                <div /> {/* Spacer to push actions to the right */}
                <div className="flex gap-2">
                    {/* Multi-select controls */}
                    {isMultiSelectMode && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                disabled={selectedItems.size === filteredAndSortedContent.length}
                            >
                                <CheckSquare className="h-4 w-4 mr-2" />
                                Select All
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDeselectAll}
                                disabled={selectedItems.size === 0}
                            >
                                <Square className="h-4 w-4 mr-2" />
                                Deselect All
                            </Button>
                            <Button
                                onClick={handleBulkSchedule}
                                disabled={selectedItems.size === 0}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            >
                                <Zap className="h-4 w-4 mr-2" />
                                Bulk Schedule ({selectedItems.size})
                            </Button>
                        </>
                    )}

                    {/* Regular controls */}
                    <Button
                        variant={isMultiSelectMode ? "default" : "outline"}
                        onClick={toggleMultiSelectMode}
                        className={isMultiSelectMode ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        <Users className="h-4 w-4 mr-2" />
                        {isMultiSelectMode ? 'Exit Multi-Select' : 'Multi-Select'}
                    </Button>

                    <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="h-4 w-4 mr-2" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Export Calendar</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleExportCalendar('ical')}>
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                iCal Format
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExportCalendar('google')}>
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Google Calendar
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button onClick={() => window.location.href = '/studio/write'}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Content
                    </Button>
                </div>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Filters & Search</CardTitle>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                                {filteredAndSortedContent.length} items
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                {showFilters ? 'Hide' : 'Show'} Filters
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <SearchInput
                                value={filters.searchQuery}
                                onChange={(value) => setFilters(prev => ({ ...prev, searchQuery: value }))}
                                placeholder="Search by title, content, or type..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Label htmlFor="sort-field" className="text-sm font-medium">
                                Sort by:
                            </Label>
                            <Select
                                value={sorting.field}
                                onValueChange={(value) => setSorting(prev => ({ ...prev, field: value as any }))}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="publishTime">Date</SelectItem>
                                    <SelectItem value="title">Title</SelectItem>
                                    <SelectItem value="contentType">Type</SelectItem>
                                    <SelectItem value="status">Status</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSorting(prev => ({
                                    ...prev,
                                    order: prev.order === 'asc' ? 'desc' : 'asc'
                                }))}
                            >
                                {sorting.order === 'asc' ? (
                                    <SortAsc className="h-4 w-4" />
                                ) : (
                                    <SortDesc className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                            <div>
                                <Label className="text-sm font-medium mb-2 block">Channels</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            {filters.channels.length > 0
                                                ? `${filters.channels.length} selected`
                                                : 'All channels'
                                            }
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
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
                                                {channel.charAt(0).toUpperCase() + channel.slice(1)}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Content Types</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            {filters.contentTypes.length > 0
                                                ? `${filters.contentTypes.length} selected`
                                                : 'All types'
                                            }
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                        {Object.values(ContentCategory).map(type => (
                                            <DropdownMenuCheckboxItem
                                                key={type}
                                                checked={filters.contentTypes.includes(type)}
                                                onCheckedChange={(checked) => {
                                                    setFilters(prev => ({
                                                        ...prev,
                                                        contentTypes: checked
                                                            ? [...prev.contentTypes, type]
                                                            : prev.contentTypes.filter(t => t !== type)
                                                    }));
                                                }}
                                            >
                                                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            <div>
                                <Label className="text-sm font-medium mb-2 block">Status</Label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="w-full justify-between">
                                            {filters.status.length > 0
                                                ? `${filters.status.length} selected`
                                                : 'All statuses'
                                            }
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
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
                    )}
                </CardContent>
            </Card>

            {/* View Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Button
                        variant={viewMode === 'calendar' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('calendar')}
                    >
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Calendar
                    </Button>
                    <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewMode('list')}
                    >
                        <List className="h-4 w-4 mr-2" />
                        List
                    </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                    Showing {filteredAndSortedContent.length} of {scheduledContent.length} items
                </div>
            </div>

            {/* Calendar View */}
            {viewMode === 'calendar' && (
                <ContentCalendar
                    userId={user?.id || ''}
                    scheduledContent={filteredAndSortedContent}
                    loading={loading}
                    onScheduleUpdate={handleScheduleUpdate}
                    onContentClick={handleContentClick}
                    onContentEdit={handleContentEdit}
                    onContentDelete={handleContentDelete}
                    onContentDuplicate={handleContentDuplicate}
                    className="min-h-[600px]"
                />
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="space-y-4">
                    {filteredAndSortedContent.map((item) => (
                        <PostCard
                            key={item.id}
                            item={item}
                            isMultiSelectMode={isMultiSelectMode}
                            isSelected={selectedItems.has(item.id)}
                            onSelect={handleItemSelect}
                            onClick={handleContentClick}
                            onEdit={handleContentEdit}
                            onDuplicate={handleContentDuplicate}
                            onDelete={handleContentDelete}
                        />
                    ))}
                </div>
            )}

            {/* Bulk Scheduling Modal */}
            <BulkSchedulingModal
                isOpen={showBulkSchedulingModal}
                onClose={() => setShowBulkSchedulingModal(false)}
                selectedItems={selectedBulkItems}
                availableChannels={availableChannels}
                onSchedulingComplete={handleBulkSchedulingComplete}
            />
        </div>
    );
}