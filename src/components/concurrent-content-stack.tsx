'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Clock,
    AlertTriangle,
    Users,
    Zap,
    ArrowRight,
    Calendar,
    Move
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
    ScheduledContent,
    PublishChannelType,
    ScheduledContentStatus,
    ContentCategory
} from '@/lib/content-workflow-types';

// ==================== Content Item Component ====================

/**
 * Simplified content item for display in concurrent stacks
 */
function ContentItem({
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
    const CHANNEL_ICONS: Record<PublishChannelType, React.ReactNode> = {
        [PublishChannelType.FACEBOOK]: <div className="w-3 h-3 bg-blue-500 rounded-full" />,
        [PublishChannelType.INSTAGRAM]: <div className="w-3 h-3 bg-pink-500 rounded-full" />,
        [PublishChannelType.LINKEDIN]: <div className="w-3 h-3 bg-blue-600 rounded-full" />,
        [PublishChannelType.TWITTER]: <div className="w-3 h-3 bg-sky-500 rounded-full" />,
        [PublishChannelType.BLOG]: <div className="w-3 h-3 bg-green-500 rounded-full" />,
        [PublishChannelType.NEWSLETTER]: <div className="w-3 h-3 bg-purple-500 rounded-full" />
    };

    const STATUS_VARIANTS: Record<ScheduledContentStatus, string> = {
        [ScheduledContentStatus.SCHEDULED]: 'bg-blue-100 text-blue-800',
        [ScheduledContentStatus.PUBLISHING]: 'bg-yellow-100 text-yellow-800',
        [ScheduledContentStatus.PUBLISHED]: 'bg-green-100 text-green-800',
        [ScheduledContentStatus.FAILED]: 'bg-red-100 text-red-800',
        [ScheduledContentStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div
            className={cn(
                "group relative p-2 rounded-md border transition-shadow duration-150",
                "hover:shadow-md hover:border-primary/50 cursor-pointer bg-background",
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
                        <Badge
                            className={cn(
                                "text-xs px-1.5 py-0.5",
                                STATUS_VARIANTS[content.status]
                            )}
                        >
                            {content.status}
                        </Badge>
                    </div>
                    <h4 className={cn(
                        "font-medium truncate",
                        isCompact ? "text-xs" : "text-sm"
                    )}>
                        {content.title.trim() || 'Untitled Content'}
                    </h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                        {content.channels.map((channel, channelIndex) => (
                            <Badge
                                key={`${channel.type}-${channelIndex}-${content.id}`}
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
                        aria-label="Drag to reschedule"
                    >
                        <Move className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// ==================== Types ====================

interface ConcurrentContentGroup {
    timeSlot: string; // ISO string of the exact time
    publishTime: Date;
    items: ScheduledContent[];
    hasConflicts: boolean;
    priority: number; // Calculated priority for ordering
    suggestedResolutions?: ConflictResolution[];
}

interface ConflictResolution {
    type: 'reschedule' | 'stagger' | 'merge' | 'prioritize';
    description: string;
    suggestedTime?: Date;
    affectedItems: string[]; // Content IDs
    confidence: number; // 0-1
}

interface ConcurrentContentStackProps {
    content: ScheduledContent[];
    date: Date;
    isCompact?: boolean;
    maxVisibleItems?: number;
    onContentClick?: (contentId: string) => void;
    onContentAction?: (action: string, content: ScheduledContent) => void;
    onConflictResolve?: (resolution: ConflictResolution) => void;
    onTimeSlotExpand?: (timeSlot: string, expanded: boolean) => void;
    className?: string;
}

// ==================== Constants ====================

const CHANNEL_COLORS: Record<PublishChannelType, string> = {
    [PublishChannelType.FACEBOOK]: 'bg-blue-500/10 text-blue-700 border-blue-500/20',
    [PublishChannelType.INSTAGRAM]: 'bg-pink-500/10 text-pink-700 border-pink-500/20',
    [PublishChannelType.LINKEDIN]: 'bg-blue-600/10 text-blue-800 border-blue-600/20',
    [PublishChannelType.TWITTER]: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
    [PublishChannelType.BLOG]: 'bg-green-500/10 text-green-700 border-green-500/20',
    [PublishChannelType.NEWSLETTER]: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
};

const PRIORITY_WEIGHTS = {
    [ScheduledContentStatus.PUBLISHING]: 100,
    [ScheduledContentStatus.SCHEDULED]: 80,
    [ScheduledContentStatus.FAILED]: 60,
    [ScheduledContentStatus.CANCELLED]: 20,
    [ScheduledContentStatus.PUBLISHED]: 10,
};

const CONTENT_TYPE_WEIGHTS = {
    [ContentCategory.NEWSLETTER]: 90,
    [ContentCategory.BLOG_POST]: 80,
    [ContentCategory.MARKET_UPDATE]: 70,
    [ContentCategory.LISTING_DESCRIPTION]: 60,
    [ContentCategory.SOCIAL_MEDIA]: 50,
    [ContentCategory.NEIGHBORHOOD_GUIDE]: 40,
    [ContentCategory.VIDEO_SCRIPT]: 30,
    [ContentCategory.EMAIL_TEMPLATE]: 20,
};

// ==================== Utility Functions ====================

const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
};

const calculateItemPriority = (item: ScheduledContent): number => {
    const statusWeight = PRIORITY_WEIGHTS[item.status] || 50;
    const typeWeight = CONTENT_TYPE_WEIGHTS[item.contentType] || 50;
    const channelWeight = item.channels.length * 10; // More channels = higher priority
    const timeWeight = item.publishTime > new Date() ? 20 : 0; // Future content gets bonus

    return statusWeight + typeWeight + channelWeight + timeWeight;
};

const generateConflictResolutions = (group: ConcurrentContentGroup): ConflictResolution[] => {
    if (!group.hasConflicts) return [];

    const resolutions: ConflictResolution[] = [];
    const baseTime = group.publishTime;

    // Stagger suggestion - spread items across 15-minute intervals
    if (group.items.length <= 4) {
        resolutions.push({
            type: 'stagger',
            description: `Stagger posts every 15 minutes starting at ${formatTime(baseTime)}`,
            affectedItems: group.items.map(item => item.id),
            confidence: 0.85
        });
    }

    // Reschedule suggestion - move lower priority items to optimal times
    const sortedItems = [...group.items].sort((a, b) =>
        calculateItemPriority(b) - calculateItemPriority(a)
    );

    if (sortedItems.length > 1) {
        const lowPriorityItems = sortedItems.slice(1);
        resolutions.push({
            type: 'reschedule',
            description: `Keep highest priority post, reschedule ${lowPriorityItems.length} others`,
            affectedItems: lowPriorityItems.map(item => item.id),
            confidence: 0.75
        });
    }

    // Prioritize suggestion - cancel or delay lower priority items
    if (group.items.length > 3) {
        const lowPriorityItems = sortedItems.slice(2);
        resolutions.push({
            type: 'prioritize',
            description: `Focus on top 2 posts, delay ${lowPriorityItems.length} others`,
            affectedItems: lowPriorityItems.map(item => item.id),
            confidence: 0.65
        });
    }

    return resolutions.sort((a, b) => b.confidence - a.confidence);
};

// ==================== Components ====================

/**
 * Individual conflict resolution suggestion
 */
function ConflictResolutionSuggestion({
    resolution,
    onResolve
}: {
    resolution: ConflictResolution;
    onResolve: (resolution: ConflictResolution) => void;
}) {
    const getResolutionIcon = () => {
        switch (resolution.type) {
            case 'stagger': return <Clock className="h-3 w-3" />;
            case 'reschedule': return <Calendar className="h-3 w-3" />;
            case 'prioritize': return <Zap className="h-3 w-3" />;
            case 'merge': return <Users className="h-3 w-3" />;
            default: return <ArrowRight className="h-3 w-3" />;
        }
    };

    const getResolutionColor = () => {
        if (resolution.confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
        if (resolution.confidence >= 0.6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        return 'text-orange-600 bg-orange-50 border-orange-200';
    };

    return (
        <div className={cn(
            "flex items-center justify-between p-2 rounded-md border text-xs",
            getResolutionColor()
        )}>
            <div className="flex items-center gap-2 flex-1">
                {getResolutionIcon()}
                <span className="font-medium capitalize">{resolution.type}</span>
                <span className="text-muted-foreground">{resolution.description}</span>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    {Math.round(resolution.confidence * 100)}%
                </Badge>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => onResolve(resolution)}
                >
                    Apply
                </Button>
            </div>
        </div>
    );
}

/**
 * Time slot group with expandable content
 */
function TimeSlotGroup({
    group,
    isCompact,
    maxVisibleItems,
    onContentClick,
    onContentAction,
    onConflictResolve,
    onExpand
}: {
    group: ConcurrentContentGroup;
    isCompact?: boolean;
    maxVisibleItems?: number;
    onContentClick?: (contentId: string) => void;
    onContentAction?: (action: string, content: ScheduledContent) => void;
    onConflictResolve?: (resolution: ConflictResolution) => void;
    onExpand?: (timeSlot: string, expanded: boolean) => void;
}) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showResolutions, setShowResolutions] = useState(false);

    const visibleItems = maxVisibleItems || 3;
    const hasMoreItems = group.items.length > visibleItems;
    const displayItems = isExpanded ? group.items : group.items.slice(0, visibleItems);
    const hiddenCount = group.items.length - visibleItems;

    const handleExpand = useCallback((expanded: boolean) => {
        setIsExpanded(expanded);
        onExpand?.(group.timeSlot, expanded);
    }, [group.timeSlot, onExpand]);

    const handleResolutionToggle = useCallback(() => {
        setShowResolutions(!showResolutions);
    }, [showResolutions]);

    const handleResolutionApply = useCallback((resolution: ConflictResolution) => {
        onConflictResolve?.(resolution);
        setShowResolutions(false);
    }, [onConflictResolve]);

    return (
        <div className={cn(
            "space-y-2",
            group.hasConflicts && "border-l-2 border-warning/50 pl-2"
        )}>
            {/* Time slot header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                        {formatTime(group.publishTime)}
                    </span>
                    {group.hasConflicts && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertTriangle className="h-3 w-3 text-warning cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Multiple items scheduled for the same time</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {group.items.length}
                    </Badge>
                </div>

                <div className="flex items-center gap-1">
                    {group.hasConflicts && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-warning hover:text-warning"
                            onClick={handleResolutionToggle}
                        >
                            Resolve
                        </Button>
                    )}
                    {hasMoreItems && (
                        <Collapsible open={isExpanded} onOpenChange={handleExpand}>
                            <CollapsibleTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="h-3 w-3" />
                                    ) : (
                                        <ChevronDown className="h-3 w-3" />
                                    )}
                                </Button>
                            </CollapsibleTrigger>
                        </Collapsible>
                    )}
                </div>
            </div>

            {/* Content items */}
            <div className="space-y-1">
                {displayItems.map((item, index) => (
                    <div
                        key={`${item.id}-${index}-${group.timeSlot}`}
                        className={cn(
                            "transition-transform duration-150 relative",
                            index > 0 && group.hasConflicts && "ml-2 border-l border-muted pl-2"
                        )}
                        data-priority={group.items.length - index}
                    >
                        <ContentItem
                            content={item}
                            isCompact={isCompact}
                            onContentClick={onContentClick}
                            onContentAction={onContentAction}
                        />
                    </div>
                ))}

                {/* Collapsed items indicator */}
                {hasMoreItems && !isExpanded && (
                    <Collapsible open={isExpanded} onOpenChange={handleExpand}>
                        <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-center py-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                                <ChevronDown className="h-3 w-3 mr-1" />
                                +{hiddenCount} more item{hiddenCount !== 1 ? 's' : ''}
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-1">
                            {group.items.slice(visibleItems).map((item, index) => (
                                <div
                                    key={`${item.id}-${visibleItems + index}-${group.timeSlot}`}
                                    className={cn(
                                        "animate-in slide-in-from-top-2 duration-150 relative",
                                        group.hasConflicts && "ml-2 border-l border-muted pl-2"
                                    )}
                                    data-priority={group.items.length - (visibleItems + index)}
                                    data-animation-delay={index * 50}
                                >
                                    <ContentItem
                                        content={item}
                                        isCompact={isCompact}
                                        onContentClick={onContentClick}
                                        onContentAction={onContentAction}
                                    />
                                </div>
                            ))}
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>

            {/* Conflict resolution suggestions */}
            {showResolutions && group.hasConflicts && (
                <Card className="animate-in slide-in-from-top-2">
                    <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium">Conflict Resolution</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={handleResolutionToggle}
                            >
                                <ChevronUp className="h-3 w-3" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {group.suggestedResolutions?.map((resolution, index) => (
                                <ConflictResolutionSuggestion
                                    key={index}
                                    resolution={resolution}
                                    onResolve={handleResolutionApply}
                                />
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ==================== Main Component ====================

/**
 * Smart concurrent content stack with intelligent grouping and conflict resolution
 */
export function ConcurrentContentStack({
    content,
    date,
    isCompact = false,
    maxVisibleItems = 3,
    onContentClick,
    onContentAction,
    onConflictResolve,
    onTimeSlotExpand,
    className
}: ConcurrentContentStackProps) {
    // Group content by exact time slots
    const timeSlotGroups = useMemo(() => {
        const groups = new Map<string, ConcurrentContentGroup>();

        content.forEach(item => {
            // Skip items with invalid dates
            if (!item.publishTime || isNaN(item.publishTime.getTime())) {
                return;
            }

            const timeSlot = item.publishTime.toISOString();

            if (!groups.has(timeSlot)) {
                groups.set(timeSlot, {
                    timeSlot,
                    publishTime: item.publishTime,
                    items: [],
                    hasConflicts: false,
                    priority: 0,
                    suggestedResolutions: []
                });
            }

            groups.get(timeSlot)!.items.push(item);
        });

        // Process each group
        const processedGroups = Array.from(groups.values()).map(group => {
            // Sort items by priority within each group
            group.items.sort((a, b) => calculateItemPriority(b) - calculateItemPriority(a));

            // Determine if there are conflicts
            group.hasConflicts = group.items.length > 1;

            // Calculate group priority (highest item priority)
            group.priority = group.items.length > 0 ? calculateItemPriority(group.items[0]) : 0;

            // Generate conflict resolutions if needed
            if (group.hasConflicts) {
                group.suggestedResolutions = generateConflictResolutions(group);
            }

            return group;
        });

        // Sort groups by time
        return processedGroups.sort((a, b) => a.publishTime.getTime() - b.publishTime.getTime());
    }, [content]);

    const totalConflicts = timeSlotGroups.filter(group => group.hasConflicts).length;

    if (timeSlotGroups.length === 0) {
        return null;
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* Summary header for conflicts */}
            {totalConflicts > 0 && (
                <div className="flex items-center gap-2 p-2 bg-warning/5 border border-warning/20 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="text-sm text-warning font-medium">
                        {totalConflicts} time slot{totalConflicts !== 1 ? 's' : ''} with conflicts
                    </span>
                </div>
            )}

            {/* Time slot groups */}
            {timeSlotGroups.map(group => (
                <TimeSlotGroup
                    key={group.timeSlot}
                    group={group}
                    isCompact={isCompact}
                    maxVisibleItems={maxVisibleItems}
                    onContentClick={onContentClick}
                    onContentAction={onContentAction}
                    onConflictResolve={onConflictResolve}
                    onExpand={onTimeSlotExpand}
                />
            ))}
        </div>
    );
}

export default ConcurrentContentStack;