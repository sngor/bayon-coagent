'use server';

/**
 * Content Workflow Server Actions
 * 
 * Provides type-safe Server Actions for content scheduling, analytics, and template management.
 * Follows Next.js 15 App Router patterns with comprehensive error handling and Zod validation.
 * 
 * Requirements:
 * - 1.1: Provide scheduling option from Studio
 * - 1.3: Validate future publishing time
 * - 1.4: Save content with scheduling metadata
 * - 3.1: Analyze historical engagement metrics
 * - 4.1: Enable bulk scheduling actions
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/aws/auth/cognito-client';
import {
    schedulingService,
    bulkSchedule,
    type ScheduleContentParams,
    type GetCalendarContentParams,
    type UpdateScheduleParams,
    type GetOptimalTimesParams,
    type BulkScheduleParams,
    type BulkScheduleProgress
} from '@/services/scheduling-service';
import {
    analyticsService,
    type GetAnalyticsByTypeParams,
    type CreateABTestParams,
    type GetABTestResultsParams,
    type TrackROIEventParams,
    type GetROIAnalyticsParams,
    type ExportROIDataParams,
    type TimeRangePreset
} from '@/services/analytics-service';
import {
    ScheduledContent,
    PublishChannel,
    ScheduledContentStatus,
    ContentCategory,
    PublishChannelType,
    SchedulingPattern,
    SchedulingPatternType,
    CalendarContent,
    OptimalTime,
    BulkScheduleItem,
    ContentWorkflowResponse,
    TypeAnalytics,
    ABTest,
    ABTestResults,
    ROI,
    ROIAnalytics,
    EngagementMetrics,
    ROIEventType
} from '@/lib/content-workflow-types';

// ==================== Zod Schemas for Validation ====================

/**
 * Schema for publishing channel validation
 */
const publishChannelSchema = z.object({
    type: z.nativeEnum(PublishChannelType, {
        errorMap: () => ({ message: 'Invalid channel type. Must be facebook, instagram, linkedin, twitter, blog, or newsletter.' })
    }),
    accountId: z.string().min(1, 'Account ID is required'),
    accountName: z.string().min(1, 'Account name is required'),
    isActive: z.boolean().default(true),
    connectionStatus: z.enum(['connected', 'disconnected', 'error']).default('connected'),
    permissions: z.array(z.string()).optional()
});

/**
 * Schema for content metadata validation
 */
const contentMetadataSchema = z.object({
    originalPrompt: z.string().optional(),
    aiModel: z.string().optional(),
    generatedAt: z.date().optional(),
    tags: z.array(z.string()).optional()
}).optional();

/**
 * Schema for scheduling individual content
 */
const scheduleContentSchema = z.object({
    contentId: z.string().min(1, 'Content ID is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters').max(10000, 'Content must be less than 10,000 characters'),
    contentType: z.nativeEnum(ContentCategory, {
        errorMap: () => ({ message: 'Invalid content type' })
    }),
    publishTime: z.string().datetime('Invalid publish time format. Use ISO 8601 format.'),
    channels: z.array(publishChannelSchema).min(1, 'At least one channel is required').max(10, 'Maximum 10 channels allowed'),
    metadata: contentMetadataSchema
});

/**
 * Schema for bulk schedule item
 */
const bulkScheduleItemSchema = z.object({
    contentId: z.string().min(1, 'Content ID is required'),
    title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    content: z.string().min(10, 'Content must be at least 10 characters').max(10000, 'Content must be less than 10,000 characters'),
    contentType: z.nativeEnum(ContentCategory),
    priority: z.number().min(1).max(5).optional(),
    customTime: z.string().datetime().optional()
});

/**
 * Schema for scheduling pattern
 */
const schedulingPatternSchema = z.object({
    type: z.nativeEnum(SchedulingPatternType),
    interval: z.number().min(1).max(30).optional(),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    timeOfDay: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format').optional(),
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime().optional(),
    excludeWeekends: z.boolean().default(false),
    excludeHolidays: z.boolean().default(false),
    customDates: z.array(z.string().datetime()).optional()
});

/**
 * Schema for bulk scheduling
 */
const bulkScheduleSchema = z.object({
    items: z.array(bulkScheduleItemSchema).min(1, 'At least one item is required').max(100, 'Maximum 100 items allowed per bulk operation'),
    pattern: schedulingPatternSchema,
    channels: z.array(publishChannelSchema).min(1, 'At least one channel is required'),
    conflictResolution: z.enum(['skip', 'reschedule', 'override']).default('skip')
});

/**
 * Schema for updating scheduled content
 */
const updateScheduleSchema = z.object({
    scheduleId: z.string().min(1, 'Schedule ID is required'),
    newPublishTime: z.string().datetime().optional(),
    channels: z.array(publishChannelSchema).optional(),
    content: z.string().min(10).max(10000).optional(),
    title: z.string().min(1).max(200).optional()
});

/**
 * Schema for getting calendar content
 */
const getCalendarContentSchema = z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
    channels: z.array(z.nativeEnum(PublishChannelType)).optional(),
    contentTypes: z.array(z.nativeEnum(ContentCategory)).optional(),
    status: z.array(z.nativeEnum(ScheduledContentStatus)).optional()
});

/**
 * Schema for getting optimal times
 */
const getOptimalTimesSchema = z.object({
    channel: z.nativeEnum(PublishChannelType),
    contentType: z.nativeEnum(ContentCategory),
    timezone: z.string().optional()
});

// ==================== Analytics Zod Schemas ====================

/**
 * Schema for getting analytics by type
 */
const getAnalyticsSchema = z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
    contentTypes: z.array(z.nativeEnum(ContentCategory)).optional(),
    channels: z.array(z.nativeEnum(PublishChannelType)).optional(),
    groupBy: z.enum(['day', 'week', 'month']).default('day'),
    includeTopPerformers: z.boolean().default(true),
    limit: z.number().min(1).max(100).default(10),
    timeRangePreset: z.enum(['7d', '30d', '90d', 'custom']).optional()
});

/**
 * Schema for creating A/B tests
 */
const createABTestSchema = z.object({
    name: z.string().min(1, 'Test name is required').max(100, 'Test name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    contentType: z.nativeEnum(ContentCategory),
    variations: z.array(z.object({
        name: z.string().min(1, 'Variation name is required').max(50, 'Variation name must be less than 50 characters'),
        content: z.string().min(10, 'Variation content must be at least 10 characters').max(10000, 'Variation content must be less than 10,000 characters')
    })).min(2, 'At least 2 variations are required').max(3, 'Maximum 3 variations allowed'),
    targetMetric: z.enum(['views', 'likes', 'shares', 'comments', 'clicks', 'saves', 'engagementRate']),
    minimumSampleSize: z.number().min(10).max(10000).default(100),
    confidenceLevel: z.number().min(0.8).max(0.99).default(0.95)
});

/**
 * Schema for getting A/B test results
 */
const getABTestResultsSchema = z.object({
    testId: z.string().min(1, 'Test ID is required'),
    includeStatisticalAnalysis: z.boolean().default(true)
});

/**
 * Schema for tracking ROI events
 */
const trackROIEventSchema = z.object({
    contentId: z.string().min(1, 'Content ID is required'),
    contentType: z.nativeEnum(ContentCategory),
    eventType: z.nativeEnum(ROIEventType),
    value: z.number().min(0, 'Value must be non-negative'),
    currency: z.string().length(3, 'Currency must be 3-letter code').default('USD'),
    clientInfo: z.object({
        clientId: z.string().optional(),
        clientName: z.string().optional(),
        contactInfo: z.string().optional()
    }).optional(),
    attributionModel: z.enum(['first-touch', 'last-touch', 'linear', 'time-decay']).default('linear'),
    metadata: z.record(z.any()).optional()
});

/**
 * Schema for getting ROI analytics
 */
const getROIAnalyticsSchema = z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
    contentTypes: z.array(z.nativeEnum(ContentCategory)).optional(),
    channels: z.array(z.nativeEnum(PublishChannelType)).optional(),
    attributionModel: z.enum(['first-touch', 'last-touch', 'linear', 'time-decay']).default('linear'),
    includeConversionFunnel: z.boolean().default(false),
    groupBy: z.enum(['day', 'week', 'month']).default('day')
});

/**
 * Schema for exporting ROI data
 */
const exportROIDataSchema = z.object({
    startDate: z.string().datetime('Invalid start date format'),
    endDate: z.string().datetime('Invalid end date format'),
    format: z.enum(['csv', 'pdf', 'excel']),
    includeDetails: z.boolean().default(false),
    attributionModel: z.enum(['first-touch', 'last-touch', 'linear', 'time-decay']).default('linear')
});

// ==================== Server Actions ====================

/**
 * Standard action result type
 */
interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    errors?: Record<string, string[]>;
    message?: string;
}

/**
 * Schedule content for future publication
 * 
 * Validates future date, channel connections, and stores with metadata.
 * Implements comprehensive error handling and input validation.
 * 
 * Requirement 1.1: Provide scheduling option from Studio
 * Requirement 1.3: Validate future publishing time
 * Requirement 1.4: Save content with scheduling metadata
 */
export async function scheduleContentAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<ScheduledContent>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to schedule content.',
            };
        }

        // Parse and validate input
        const rawData = {
            contentId: formData.get('contentId'),
            title: formData.get('title'),
            content: formData.get('content'),
            contentType: formData.get('contentType'),
            publishTime: formData.get('publishTime'),
            channels: JSON.parse(formData.get('channels') as string || '[]'),
            metadata: formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined
        };

        const validatedFields = scheduleContentSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your input.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Convert string date to Date object and validate it's in the future
        const publishTime = new Date(data.publishTime as string);
        const now = new Date();

        if (publishTime <= now) {
            return {
                success: false,
                error: 'Publishing time must be in the future. Please select a later date and time.',
            };
        }

        // Prepare scheduling parameters
        const scheduleParams: ScheduleContentParams = {
            userId: user.id,
            contentId: data.contentId,
            title: data.title,
            content: data.content,
            contentType: data.contentType,
            publishTime,
            channels: data.channels,
            metadata: data.metadata
        };

        // Schedule the content
        const result = await schedulingService.scheduleContent(scheduleParams);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to schedule content. Please try again.',
            };
        }

        // Revalidate relevant pages
        revalidatePath('/library/calendar');
        revalidatePath('/studio');

        return {
            success: true,
            data: result.data!,
            message: `Content scheduled successfully for ${publishTime.toLocaleString()}`,
        };

    } catch (error) {
        console.error('Schedule content action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while scheduling content.',
        };
    }
}

/**
 * Bulk schedule multiple content items with pattern-based distribution
 * 
 * Supports daily, weekly, and custom patterns with intelligent conflict resolution.
 * Provides progress tracking and partial success handling.
 * 
 * Requirement 4.1: Enable bulk scheduling actions
 */
export async function bulkScheduleAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<{ scheduled: ScheduledContent[]; failed: any[]; progress: BulkScheduleProgress }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to schedule content.',
            };
        }

        // Parse and validate input
        const rawData = {
            items: JSON.parse(formData.get('items') as string || '[]'),
            pattern: JSON.parse(formData.get('pattern') as string || '{}'),
            channels: JSON.parse(formData.get('channels') as string || '[]'),
            conflictResolution: formData.get('conflictResolution') || 'skip'
        };

        const validatedFields = bulkScheduleSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your bulk scheduling configuration.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Convert string dates to Date objects
        const pattern: SchedulingPattern = {
            ...data.pattern,
            startDate: new Date(data.pattern.startDate as string),
            endDate: data.pattern.endDate ? new Date(data.pattern.endDate as string) : undefined,
            customDates: data.pattern.customDates?.map(date => new Date(date as string))
        };

        // Convert items with custom times
        const items: BulkScheduleItem[] = data.items.map(item => ({
            ...item,
            customTime: item.customTime ? new Date(item.customTime as string) : undefined
        }));

        // Validate pattern start date is in the future
        if (pattern.startDate <= new Date()) {
            return {
                success: false,
                error: 'Pattern start date must be in the future.',
            };
        }

        // Progress tracking
        let progress: BulkScheduleProgress = {
            total: items.length,
            completed: 0,
            failed: 0,
            errors: []
        };

        // Prepare bulk scheduling parameters
        const bulkParams: BulkScheduleParams = {
            userId: user.id,
            items,
            pattern,
            channels: data.channels,
            conflictResolution: data.conflictResolution as 'skip' | 'reschedule' | 'override',
            progressCallback: (newProgress) => {
                progress = newProgress;
            }
        };

        // Execute bulk scheduling
        const result = await bulkSchedule(bulkParams);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Bulk scheduling failed. Please try again.',
                data: {
                    scheduled: [],
                    failed: [],
                    progress
                }
            };
        }

        // Revalidate relevant pages
        revalidatePath('/library/calendar');
        revalidatePath('/studio');

        return {
            success: true,
            data: {
                scheduled: result.data!.scheduled,
                failed: result.data!.failed,
                progress
            },
            message: result.message || `Bulk scheduling completed. ${result.data!.scheduled.length} items scheduled successfully.`,
        };

    } catch (error) {
        console.error('Bulk schedule action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred during bulk scheduling.',
        };
    }
}

/**
 * Update scheduled content with conflict detection and resolution
 * 
 * Supports optimistic UI updates and comprehensive validation.
 * Handles drag-and-drop rescheduling and content modifications.
 * 
 * Requirement 2.4: Support drag-and-drop rescheduling
 */
export async function updateScheduleAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<ScheduledContent>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to update scheduled content.',
            };
        }

        // Parse and validate input
        const rawData = {
            scheduleId: formData.get('scheduleId'),
            newPublishTime: formData.get('newPublishTime'),
            channels: formData.get('channels') ? JSON.parse(formData.get('channels') as string) : undefined,
            content: formData.get('content'),
            title: formData.get('title')
        };

        const validatedFields = updateScheduleSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your input.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Prepare update parameters
        const updateParams: UpdateScheduleParams = {
            userId: user.id,
            scheduleId: data.scheduleId,
            newPublishTime: data.newPublishTime ? new Date(data.newPublishTime as string) : undefined,
            channels: data.channels,
            content: data.content || undefined,
            title: data.title || undefined
        };

        // Validate new publish time is in the future if provided
        if (updateParams.newPublishTime && updateParams.newPublishTime <= new Date()) {
            return {
                success: false,
                error: 'New publishing time must be in the future.',
            };
        }

        // Update the scheduled content
        const result = await schedulingService.updateSchedule(updateParams);

        if (!result.success) {
            // Handle conflict detection
            if (result.error?.includes('conflict')) {
                return {
                    success: false,
                    error: result.error,
                    data: result.data, // Contains conflict details and suggested times
                };
            }

            return {
                success: false,
                error: result.error || 'Failed to update scheduled content. Please try again.',
            };
        }

        // Revalidate relevant pages
        revalidatePath('/library/calendar');
        revalidatePath('/studio');

        return {
            success: true,
            data: result.data!,
            message: 'Scheduled content updated successfully.',
        };

    } catch (error) {
        console.error('Update schedule action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while updating scheduled content.',
        };
    }
}

/**
 * Cancel scheduled content with proper cleanup
 * 
 * Updates status and performs necessary cleanup operations.
 * Provides clear feedback on cancellation success.
 */
export async function cancelScheduleAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<void>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to cancel scheduled content.',
            };
        }

        // Get schedule ID
        const scheduleId = formData.get('scheduleId') as string;

        if (!scheduleId) {
            return {
                success: false,
                error: 'Schedule ID is required.',
            };
        }

        // Cancel the scheduled content
        const result = await schedulingService.cancelSchedule(user.id, scheduleId);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to cancel scheduled content. Please try again.',
            };
        }

        // Revalidate relevant pages
        revalidatePath('/library/calendar');
        revalidatePath('/studio');

        return {
            success: true,
            message: 'Scheduled content cancelled successfully.',
        };

    } catch (error) {
        console.error('Cancel schedule action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while cancelling scheduled content.',
        };
    }
}

/**
 * Get optimal posting times with caching and performance optimization
 * 
 * Analyzes historical engagement data to recommend best posting times.
 * Implements intelligent caching and fallback to industry best practices.
 * 
 * Requirement 3.1: Analyze historical engagement metrics
 */
export async function getOptimalTimesAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<OptimalTime[]>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to get optimal posting times.',
            };
        }

        // Parse and validate input
        const rawData = {
            channel: formData.get('channel'),
            contentType: formData.get('contentType'),
            timezone: formData.get('timezone')
        };

        const validatedFields = getOptimalTimesSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your input.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Prepare parameters
        const params: GetOptimalTimesParams = {
            userId: user.id,
            channel: data.channel,
            contentType: data.contentType,
            timezone: data.timezone
        };

        // Get optimal times
        const result = await schedulingService.getOptimalTimes(params);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to get optimal posting times. Please try again.',
            };
        }

        return {
            success: true,
            data: result.data!,
            message: result.message || 'Optimal posting times retrieved successfully.',
        };

    } catch (error) {
        console.error('Get optimal times action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while getting optimal posting times.',
        };
    }
}

/**
 * Get calendar content for date range display
 * 
 * Retrieves scheduled content organized by date with efficient filtering.
 * Supports multiple view modes and content type filtering.
 */
export async function getCalendarContentAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<CalendarContent[]>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to view calendar content.',
            };
        }

        // Parse and validate input
        const rawData = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            channels: formData.get('channels') ? JSON.parse(formData.get('channels') as string) : undefined,
            contentTypes: formData.get('contentTypes') ? JSON.parse(formData.get('contentTypes') as string) : undefined,
            status: formData.get('status') ? JSON.parse(formData.get('status') as string) : undefined
        };

        const validatedFields = getCalendarContentSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your date range and filters.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Prepare parameters
        const params: GetCalendarContentParams = {
            userId: user.id,
            startDate: new Date(data.startDate as string),
            endDate: new Date(data.endDate as string),
            channels: data.channels,
            contentTypes: data.contentTypes,
            status: data.status
        };

        // Validate date range
        if (params.endDate <= params.startDate) {
            return {
                success: false,
                error: 'End date must be after start date.',
            };
        }

        // Get calendar content
        const result = await schedulingService.getCalendarContent(params);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to get calendar content. Please try again.',
            };
        }

        return {
            success: true,
            data: result.data!,
            message: result.message || 'Calendar content retrieved successfully.',
        };

    } catch (error) {
        console.error('Get calendar content action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while getting calendar content.',
        };
    }
}

// ==================== Analytics Server Actions ====================

/**
 * Get analytics data with efficient data fetching and caching strategies
 * 
 * Provides comprehensive analytics with time range filtering, content type grouping,
 * and top performer identification. Implements intelligent caching for performance.
 * 
 * Requirement 5.2: Display engagement metrics grouped by content type
 * Requirement 5.4: Filter engagement data by time range
 * Requirement 5.5: Identify top-performing content types
 */
export async function getAnalyticsAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<TypeAnalytics[]>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to view analytics.',
            };
        }

        // Parse and validate input
        const rawData = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            contentTypes: formData.get('contentTypes') ? JSON.parse(formData.get('contentTypes') as string) : undefined,
            channels: formData.get('channels') ? JSON.parse(formData.get('channels') as string) : undefined,
            groupBy: formData.get('groupBy') || 'day',
            includeTopPerformers: formData.get('includeTopPerformers') === 'true',
            limit: formData.get('limit') ? parseInt(formData.get('limit') as string) : 10,
            timeRangePreset: formData.get('timeRangePreset')
        };

        const validatedFields = getAnalyticsSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your analytics parameters.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Convert string dates to Date objects
        const startDate = new Date(data.startDate as string);
        const endDate = new Date(data.endDate as string);

        // Validate date range
        if (endDate <= startDate) {
            return {
                success: false,
                error: 'End date must be after start date.',
            };
        }

        // Check for reasonable date range (max 2 years)
        const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
        if (endDate.getTime() - startDate.getTime() > maxRange) {
            return {
                success: false,
                error: 'Date range cannot exceed 2 years.',
            };
        }

        // Use time range preset if provided
        let analyticsResult;
        if (data.timeRangePreset && data.timeRangePreset !== 'custom') {
            analyticsResult = await analyticsService.getAnalyticsForTimeRange(
                user.id,
                data.timeRangePreset as TimeRangePreset
            );
        } else {
            // Prepare parameters for analytics service
            const params: GetAnalyticsByTypeParams = {
                userId: user.id,
                startDate,
                endDate,
                contentTypes: data.contentTypes,
                channels: data.channels,
                groupBy: data.groupBy as 'day' | 'week' | 'month',
                includeTopPerformers: data.includeTopPerformers,
                limit: data.limit
            };

            // Get analytics data
            analyticsResult = await analyticsService.getAnalyticsByType(params);
        }

        if (!analyticsResult.success) {
            return {
                success: false,
                error: analyticsResult.error || 'Failed to retrieve analytics data. Please try again.',
            };
        }

        return {
            success: true,
            data: analyticsResult.data!,
            message: analyticsResult.message || `Retrieved analytics for ${analyticsResult.data!.length} content types`,
        };

    } catch (error) {
        console.error('Get analytics action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while retrieving analytics.',
        };
    }
}

/**
 * Create A/B test with validation and conflict prevention
 * 
 * Enforces strict 3-variation limit, validates unique variation names,
 * and prevents conflicts with existing tests.
 * 
 * Requirement 6.1: Create A/B test variant
 * Requirement 6.2: Allow creation of up to three content variations
 */
export async function createABTestAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<ABTest>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to create A/B tests.',
            };
        }

        // Parse and validate input
        const rawData = {
            name: formData.get('name'),
            description: formData.get('description'),
            contentType: formData.get('contentType'),
            variations: JSON.parse(formData.get('variations') as string || '[]'),
            targetMetric: formData.get('targetMetric'),
            minimumSampleSize: formData.get('minimumSampleSize') ? parseInt(formData.get('minimumSampleSize') as string) : 100,
            confidenceLevel: formData.get('confidenceLevel') ? parseFloat(formData.get('confidenceLevel') as string) : 0.95
        };

        const validatedFields = createABTestSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your A/B test configuration.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Check for existing active tests with the same name
        const existingTestsResult = await analyticsService.getABTestResults({
            userId: user.id,
            testId: '', // Will be ignored in the service when checking for conflicts
        });

        // Additional validation for variation uniqueness
        const variationNames = data.variations.map(v => v.name.toLowerCase());
        const uniqueNames = new Set(variationNames);
        if (uniqueNames.size !== variationNames.length) {
            return {
                success: false,
                error: 'All variation names must be unique (case-insensitive).',
            };
        }

        // Prepare parameters for A/B test creation
        const params: CreateABTestParams = {
            userId: user.id,
            name: data.name,
            description: data.description,
            contentType: data.contentType,
            variations: data.variations,
            targetMetric: data.targetMetric as keyof EngagementMetrics,
            minimumSampleSize: data.minimumSampleSize,
            confidenceLevel: data.confidenceLevel
        };

        // Create the A/B test
        const result = await analyticsService.createABTest(params);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to create A/B test. Please try again.',
            };
        }

        // Revalidate relevant pages
        revalidatePath('/library/analytics');
        revalidatePath('/studio');

        return {
            success: true,
            data: result.data!,
            message: `A/B test "${data.name}" created successfully with ${data.variations.length} variations`,
        };

    } catch (error) {
        console.error('Create A/B test action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while creating the A/B test.',
        };
    }
}

/**
 * Get A/B test results with real-time statistical calculations
 * 
 * Performs statistical significance testing using Welch's t-test,
 * calculates confidence intervals, and provides winner recommendations.
 * 
 * Requirement 6.4: Display comparative performance metrics for all variations
 * Requirement 6.5: Recommend winning variation when statistically significant
 */
export async function getABTestResultsAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<ABTestResults>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to view A/B test results.',
            };
        }

        // Parse and validate input
        const rawData = {
            testId: formData.get('testId'),
            includeStatisticalAnalysis: formData.get('includeStatisticalAnalysis') !== 'false'
        };

        const validatedFields = getABTestResultsSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please provide a valid test ID.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Prepare parameters for getting A/B test results
        const params: GetABTestResultsParams = {
            userId: user.id,
            testId: data.testId,
            includeStatisticalAnalysis: data.includeStatisticalAnalysis
        };

        // Get A/B test results with statistical analysis
        const result = await analyticsService.getABTestResults(params);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to retrieve A/B test results. Please try again.',
            };
        }

        const results = result.data!;

        // Provide contextual message based on results
        let message = result.message || 'A/B test results retrieved successfully';
        if (results.statisticalSignificance && results.winner) {
            message = `Statistical analysis complete - Variation "${results.variations.find(v => v.variationId === results.winner)?.name}" is the winner!`;
        } else if (!results.statisticalSignificance) {
            const totalSamples = results.variations.reduce((sum, v) => sum + v.sampleSize, 0);
            message = `Analysis in progress - ${totalSamples} total samples collected. More data needed for statistical significance.`;
        }

        return {
            success: true,
            data: results,
            message,
        };

    } catch (error) {
        console.error('Get A/B test results action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while retrieving A/B test results.',
        };
    }
}

/**
 * Track ROI event with attribution modeling and validation
 * 
 * Records business outcomes with multi-touch attribution modeling,
 * validates event data, and builds conversion paths.
 * 
 * Requirement 7.1: Associate content with business outcomes
 * Requirement 7.2: Display revenue/lead generation attributed to content
 */
export async function trackROIEventAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<ROI>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to track ROI events.',
            };
        }

        // Parse and validate input
        const rawData = {
            contentId: formData.get('contentId'),
            contentType: formData.get('contentType'),
            eventType: formData.get('eventType'),
            value: formData.get('value') ? parseFloat(formData.get('value') as string) : 0,
            currency: formData.get('currency') || 'USD',
            clientInfo: formData.get('clientInfo') ? JSON.parse(formData.get('clientInfo') as string) : undefined,
            attributionModel: formData.get('attributionModel') || 'linear',
            metadata: formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : undefined
        };

        const validatedFields = trackROIEventSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your ROI event data.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Additional validation for high-value events
        if (data.value > 1000000) { // $1M threshold
            return {
                success: false,
                error: 'ROI event value exceeds maximum allowed amount. Please verify the value.',
            };
        }

        // Prepare parameters for ROI event tracking
        const params: TrackROIEventParams = {
            userId: user.id,
            contentId: data.contentId,
            contentType: data.contentType,
            eventType: data.eventType,
            value: data.value,
            currency: data.currency,
            clientInfo: data.clientInfo,
            attributionModel: data.attributionModel as 'first-touch' | 'last-touch' | 'linear' | 'time-decay',
            metadata: data.metadata
        };

        // Track the ROI event
        const result = await analyticsService.trackROIEvent(params);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to track ROI event. Please try again.',
            };
        }

        // Revalidate relevant pages
        revalidatePath('/library/analytics');
        revalidatePath('/dashboard');

        return {
            success: true,
            data: result.data!,
            message: result.message || `ROI event tracked: ${data.eventType} worth ${data.currency} ${data.value}`,
        };

    } catch (error) {
        console.error('Track ROI event action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while tracking the ROI event.',
        };
    }
}

/**
 * Get ROI analytics with advanced filtering and aggregation
 * 
 * Provides comprehensive ROI analysis with multiple attribution models,
 * conversion funnel analysis, and detailed performance breakdowns.
 * 
 * Requirement 7.2: Display revenue/lead generation attributed to content
 * Requirement 7.3: Include both direct and assisted conversions
 * Requirement 7.4: Show cost per lead and conversion rates
 */
export async function getROIAnalyticsAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<ROIAnalytics>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to view ROI analytics.',
            };
        }

        // Parse and validate input
        const rawData = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            contentTypes: formData.get('contentTypes') ? JSON.parse(formData.get('contentTypes') as string) : undefined,
            channels: formData.get('channels') ? JSON.parse(formData.get('channels') as string) : undefined,
            attributionModel: formData.get('attributionModel') || 'linear',
            includeConversionFunnel: formData.get('includeConversionFunnel') === 'true',
            groupBy: formData.get('groupBy') || 'day'
        };

        const validatedFields = getROIAnalyticsSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your ROI analytics parameters.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Convert string dates to Date objects
        const startDate = new Date(data.startDate as string);
        const endDate = new Date(data.endDate as string);

        // Validate date range
        if (endDate <= startDate) {
            return {
                success: false,
                error: 'End date must be after start date.',
            };
        }

        // Check for reasonable date range (max 2 years)
        const maxRange = 2 * 365 * 24 * 60 * 60 * 1000; // 2 years in milliseconds
        if (endDate.getTime() - startDate.getTime() > maxRange) {
            return {
                success: false,
                error: 'Date range cannot exceed 2 years.',
            };
        }

        // Prepare parameters for ROI analytics
        const params: GetROIAnalyticsParams = {
            userId: user.id,
            startDate,
            endDate,
            contentTypes: data.contentTypes,
            channels: data.channels,
            attributionModel: data.attributionModel as 'first-touch' | 'last-touch' | 'linear' | 'time-decay',
            includeConversionFunnel: data.includeConversionFunnel,
            groupBy: data.groupBy as 'day' | 'week' | 'month'
        };

        // Get ROI analytics
        const result = await analyticsService.getROIAnalytics(params);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to retrieve ROI analytics. Please try again.',
            };
        }

        const analytics = result.data!;

        // Generate contextual message
        const message = `ROI analytics retrieved: ${analytics.totalRevenue.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        })} revenue, ${analytics.totalLeads} leads, ${analytics.conversionRate.toFixed(1)}% conversion rate`;

        return {
            success: true,
            data: analytics,
            message,
        };

    } catch (error) {
        console.error('Get ROI analytics action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while retrieving ROI analytics.',
        };
    }
}

/**
 * Export ROI data with multiple format support (CSV, PDF, Excel)
 * 
 * Generates comprehensive ROI reports in various formats with detailed
 * attribution information and customizable date ranges.
 * 
 * Requirement 7.5: Generate exportable reports with detailed attribution
 */
export async function exportROIDataAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<string>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required. Please sign in to export ROI data.',
            };
        }

        // Parse and validate input
        const rawData = {
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            format: formData.get('format'),
            includeDetails: formData.get('includeDetails') === 'true',
            attributionModel: formData.get('attributionModel') || 'linear'
        };

        const validatedFields = exportROIDataSchema.safeParse(rawData);

        if (!validatedFields.success) {
            return {
                success: false,
                error: 'Validation failed. Please check your export parameters.',
                errors: validatedFields.error.flatten().fieldErrors,
            };
        }

        const data = validatedFields.data;

        // Convert string dates to Date objects
        const startDate = new Date(data.startDate as string);
        const endDate = new Date(data.endDate as string);

        // Validate date range
        if (endDate <= startDate) {
            return {
                success: false,
                error: 'End date must be after start date.',
            };
        }

        // Check for reasonable date range for exports (max 1 year)
        const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
        if (endDate.getTime() - startDate.getTime() > maxRange) {
            return {
                success: false,
                error: 'Export date range cannot exceed 1 year.',
            };
        }

        // Prepare parameters for ROI data export
        const params: ExportROIDataParams = {
            userId: user.id,
            startDate,
            endDate,
            format: data.format as 'csv' | 'pdf' | 'excel',
            includeDetails: data.includeDetails,
            attributionModel: data.attributionModel as 'first-touch' | 'last-touch' | 'linear' | 'time-decay'
        };

        // Export ROI data
        const result = await analyticsService.exportROIData(params);

        if (!result.success) {
            return {
                success: false,
                error: result.error || 'Failed to export ROI data. Please try again.',
            };
        }

        return {
            success: true,
            data: result.data!,
            message: result.message || `ROI data exported in ${data.format.toUpperCase()} format`,
        };

    } catch (error) {
        console.error('Export ROI data action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'An unexpected error occurred while exporting ROI data.',
        };
    }
}

// ==================== Utility Actions ====================

/**
 * Get user's connected channels for scheduling
 * 
 * Returns available publishing channels with connection status.
 * Used for channel selection in scheduling interfaces.
 */
export async function getConnectedChannelsAction(): Promise<ActionResult<PublishChannel[]>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required.',
            };
        }

        // Import OAuth connection manager
        const { getOAuthConnectionManager } = await import('@/integrations/oauth/connection-manager');
        const oauthManager = getOAuthConnectionManager();

        // Check all platform connections
        const platforms = ['facebook', 'instagram', 'linkedin'] as const;
        const channels: PublishChannel[] = [];

        for (const platform of platforms) {
            try {
                const connection = await oauthManager.getConnection(user.id, platform);

                if (connection) {
                    const isExpired = connection.expiresAt < Date.now();

                    channels.push({
                        type: platform as PublishChannelType,
                        accountId: connection.platformUserId,
                        accountName: connection.platformUsername || platform,
                        isActive: !isExpired,
                        lastUsed: connection.metadata?.lastUsed ? new Date(connection.metadata.lastUsed) : undefined,
                        connectionStatus: isExpired ? 'error' : 'connected',
                        permissions: connection.scope
                    });
                }
            } catch (error) {
                console.error(`Failed to check ${platform} connection:`, error);
                // Continue with other platforms
            }
        }

        // Always include blog and newsletter as available channels
        channels.push(
            {
                type: PublishChannelType.BLOG,
                accountId: 'blog',
                accountName: 'Blog',
                isActive: true,
                connectionStatus: 'connected'
            },
            {
                type: PublishChannelType.NEWSLETTER,
                accountId: 'newsletter',
                accountName: 'Newsletter',
                isActive: true,
                connectionStatus: 'connected'
            }
        );

        return {
            success: true,
            data: channels,
            message: `Found ${channels.length} available channels.`,
        };

    } catch (error) {
        console.error('Get connected channels action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get connected channels.',
        };
    }
}

/**
 * Validate scheduling conflicts for a specific time
 * 
 * Checks for potential conflicts before scheduling content.
 * Returns conflict details and suggested alternative times.
 */
export async function validateSchedulingTimeAction(
    prevState: any,
    formData: FormData
): Promise<ActionResult<{ hasConflicts: boolean; conflicts?: any[]; suggestedTimes?: Date[] }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                error: 'Authentication required.',
            };
        }

        // Get parameters
        const publishTime = formData.get('publishTime') as string;
        const excludeScheduleId = formData.get('excludeScheduleId') as string;

        if (!publishTime) {
            return {
                success: false,
                error: 'Publishing time is required.',
            };
        }

        const publishDate = new Date(publishTime as string);

        // Validate future date
        if (publishDate <= new Date()) {
            return {
                success: false,
                error: 'Publishing time must be in the future.',
            };
        }

        // Use private method from scheduling service to detect conflicts
        const schedulingServiceInstance = new (await import('@/services/scheduling-service')).SchedulingService();
        const conflicts = await (schedulingServiceInstance as any).detectConflicts(
            user.id,
            publishDate,
            excludeScheduleId
        );

        const hasConflicts = conflicts.length > 0;
        let suggestedTimes: Date[] = [];

        if (hasConflicts) {
            // Get suggested alternative times
            suggestedTimes = await (schedulingServiceInstance as any).suggestAlternativeTimes(
                user.id,
                publishDate,
                [] // Empty channels array for general suggestions
            );
        }

        return {
            success: true,
            data: {
                hasConflicts,
                conflicts: hasConflicts ? conflicts : undefined,
                suggestedTimes: hasConflicts ? suggestedTimes : undefined
            },
            message: hasConflicts
                ? `Scheduling conflict detected. ${suggestedTimes.length} alternative times suggested.`
                : 'No scheduling conflicts detected.',
        };

    } catch (error) {
        console.error('Validate scheduling time action failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to validate scheduling time.',
        };
    }
}

// ==================== Template Management Actions ====================

import {
    saveTemplate,
    getUserTemplates,
    updateTemplate,
    deleteTemplate,
    getTemplate,
    shareTemplate,
    getSharedTemplates,
    updateSharedTemplate,
    unshareTemplate,
    getTemplateAnalytics,
    getSeasonalTemplates,
    getSeasonalNotifications,
    getSeasonalTemplateAnalytics,
    applyTemplate
} from '@/services/template-service';
import {
    Template,
    TemplateConfiguration,
    TemplatePermissions
} from '@/lib/content-workflow-types';

/**
 * Schema for template configuration validation
 */
const templateConfigurationSchema = z.object({
    promptParameters: z.record(z.any()),
    contentStructure: z.object({
        sections: z.array(z.string()),
        format: z.string(),
        wordCount: z.number().optional(),
        includeImages: z.boolean().optional(),
        includeHashtags: z.boolean().optional()
    }),
    stylePreferences: z.object({
        tone: z.string(),
        length: z.string(),
        keywords: z.array(z.string()),
        targetAudience: z.string().optional(),
        callToAction: z.string().optional()
    }),
    brandingElements: z.object({
        includeLogo: z.boolean().optional(),
        includeContactInfo: z.boolean().optional(),
        includeDisclaimer: z.boolean().optional(),
        colorScheme: z.string().optional()
    }).optional(),
    schedulingDefaults: z.object({
        preferredChannels: z.array(z.nativeEnum(PublishChannelType)).optional(),
        optimalTimes: z.array(z.any()).optional()
    }).optional()
});

/**
 * Schema for saving template
 */
const saveTemplateSchema = z.object({
    name: z.string().min(1, 'Template name is required').max(100, 'Template name must be less than 100 characters'),
    description: z.string().max(500, 'Description must be less than 500 characters').optional(),
    contentType: z.nativeEnum(ContentCategory, {
        errorMap: () => ({ message: 'Invalid content type' })
    }),
    configuration: templateConfigurationSchema,
    isSeasonal: z.boolean().default(false),
    seasonalTags: z.array(z.string()).optional(),
    previewImage: z.string().optional()
});

/**
 * Save template action
 * Requirement 9.1: Save custom prompts and content templates
 */
export async function saveTemplateAction(
    name: string,
    description: string,
    contentType: ContentCategory,
    configuration: TemplateConfiguration,
    isSeasonal?: boolean,
    seasonalTags?: string[],
    previewImage?: string
): Promise<ContentWorkflowResponse<{ templateId: string }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        const validatedData = saveTemplateSchema.parse({
            name,
            description,
            contentType,
            configuration,
            isSeasonal,
            seasonalTags,
            previewImage
        });

        // Save template
        const result = await saveTemplate({
            userId: user.id,
            ...validatedData
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to save template',
                errors: [result.error || 'Unknown error']
            };
        }

        // Revalidate relevant paths
        revalidatePath('/library/templates');

        return {
            success: true,
            message: 'Template saved successfully',
            data: { templateId: result.templateId! }
        };

    } catch (error) {
        console.error('Save template action error:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: 'Validation failed',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            };
        }

        return {
            success: false,
            message: 'Failed to save template',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Get user templates action
 * Requirement 9.3: Display templates with preview information
 */
export async function getUserTemplatesAction(
    contentType?: ContentCategory,
    isSeasonal?: boolean,
    searchQuery?: string,
    sortBy?: 'name' | 'createdAt' | 'usageCount' | 'lastUsed',
    sortOrder?: 'asc' | 'desc'
): Promise<ContentWorkflowResponse<{ templates: Template[] }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Get templates
        const result = await getUserTemplates({
            userId: user.id,
            contentType,
            isSeasonal,
            searchQuery,
            sortBy,
            sortOrder
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to get templates',
                errors: [result.error || 'Unknown error']
            };
        }

        return {
            success: true,
            message: 'Templates retrieved successfully',
            data: { templates: result.templates || [] }
        };

    } catch (error) {
        console.error('Get user templates action error:', error);
        return {
            success: false,
            message: 'Failed to get templates',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Get template by ID action
 * Requirement 9.4: Pre-populate content creation interface with template configuration
 */
export async function getTemplateAction(
    templateId: string
): Promise<ContentWorkflowResponse<{ template: Template }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        if (!templateId) {
            return {
                success: false,
                message: 'Template ID is required',
                errors: ['Template ID is required']
            };
        }

        // Get template
        const result = await getTemplate({
            userId: user.id,
            templateId
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to get template',
                errors: [result.error || 'Unknown error']
            };
        }

        return {
            success: true,
            message: 'Template retrieved successfully',
            data: { template: result.template! }
        };

    } catch (error) {
        console.error('Get template action error:', error);
        return {
            success: false,
            message: 'Failed to get template',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Update template action
 * Requirement 9.5: Save changes without affecting previously created content
 */
export async function updateTemplateAction(
    templateId: string,
    updates: Partial<Pick<Template, 'name' | 'description' | 'configuration' | 'seasonalTags' | 'previewImage'>>
): Promise<ContentWorkflowResponse<{}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        if (!templateId) {
            return {
                success: false,
                message: 'Template ID is required',
                errors: ['Template ID is required']
            };
        }

        // Update template
        const result = await updateTemplate({
            userId: user.id,
            templateId,
            updates
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to update template',
                errors: [result.error || 'Unknown error']
            };
        }

        // Revalidate relevant paths
        revalidatePath('/library/templates');

        return {
            success: true,
            message: 'Template updated successfully',
            data: {}
        };

    } catch (error) {
        console.error('Update template action error:', error);
        return {
            success: false,
            message: 'Failed to update template',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Delete template action
 * Requirement 9.5: Save changes without affecting previously created content
 */
export async function deleteTemplateAction(
    templateId: string
): Promise<ContentWorkflowResponse<{}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        if (!templateId) {
            return {
                success: false,
                message: 'Template ID is required',
                errors: ['Template ID is required']
            };
        }

        // Delete template
        const result = await deleteTemplate({
            userId: user.id,
            templateId
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to delete template',
                errors: [result.error || 'Unknown error']
            };
        }

        // Revalidate relevant paths
        revalidatePath('/library/templates');

        return {
            success: true,
            message: 'Template deleted successfully',
            data: {}
        };

    } catch (error) {
        console.error('Delete template action error:', error);
        return {
            success: false,
            message: 'Failed to delete template',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Apply template action
 * Requirement 9.4: Pre-populate content creation interface with template configuration
 * 
 * Retrieves a template and applies user-specific customizations for content creation.
 * Tracks template usage for analytics and provides populated configuration.
 */
export async function applyTemplateAction(
    templateId: string
): Promise<ContentWorkflowResponse<{
    template: Template;
    populatedConfiguration: TemplateConfiguration;
}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        if (!templateId) {
            return {
                success: false,
                message: 'Template ID is required',
                errors: ['Template ID is required']
            };
        }

        // Get user profile for brand customizations
        // Note: In a real implementation, you would fetch the user's brand profile
        // For now, we'll use placeholder values that would come from the user's profile
        const userBrandInfo = {
            name: user.name || user.email?.split('@')[0] || 'Your Name',
            contactInfo: user.email || 'your.email@example.com',
            marketArea: 'Your Market Area', // This would come from user profile
            brokerageName: 'Your Brokerage', // This would come from user profile
            colors: {
                primary: '#3B82F6', // Default blue
                secondary: '#10B981' // Default green
            }
        };

        // Apply template with user customizations
        const result = await applyTemplate({
            userId: user.id,
            templateId,
            userBrandInfo
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to apply template',
                errors: [result.error || 'Unknown error']
            };
        }

        return {
            success: true,
            message: 'Template applied successfully',
            data: {
                template: result.template!,
                populatedConfiguration: result.populatedConfiguration!
            }
        };

    } catch (error) {
        console.error('Apply template action error:', error);
        return {
            success: false,
            message: 'Failed to apply template',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

// ==================== Template Sharing Actions ====================

/**
 * Schema for sharing template
 */
const shareTemplateSchema = z.object({
    templateId: z.string().min(1, 'Template ID is required'),
    brokerageId: z.string().min(1, 'Brokerage ID is required'),
    permissions: z.object({
        canView: z.array(z.string()),
        canEdit: z.array(z.string()),
        canShare: z.array(z.string()),
        canDelete: z.array(z.string())
    })
});

/**
 * Share template action
 * Requirement 10.1, 10.2: Enable template sharing within brokerage organization
 */
export async function shareTemplateAction(
    templateId: string,
    brokerageId: string,
    permissions: TemplatePermissions
): Promise<ContentWorkflowResponse<{}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        const validatedData = shareTemplateSchema.parse({
            templateId,
            brokerageId,
            permissions
        });

        // Share template
        const result = await shareTemplate({
            userId: user.id,
            templateId: validatedData.templateId,
            brokerageId: validatedData.brokerageId,
            permissions: validatedData.permissions
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to share template',
                errors: [result.error || 'Unknown error']
            };
        }

        // Revalidate relevant paths
        revalidatePath('/library/templates');

        return {
            success: true,
            message: 'Template shared successfully',
            data: {}
        };

    } catch (error) {
        console.error('Share template action error:', error);

        if (error instanceof z.ZodError) {
            return {
                success: false,
                message: 'Invalid input data',
                errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
            };
        }

        return {
            success: false,
            message: 'Failed to share template',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Get shared templates action
 * Requirement 10.2, 10.3: Access shared templates with proper permissions
 */
export async function getSharedTemplatesAction(
    brokerageId: string,
    contentType?: ContentCategory,
    searchQuery?: string
): Promise<ContentWorkflowResponse<{ templates: Template[] }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        if (!brokerageId) {
            return {
                success: false,
                message: 'Brokerage ID is required',
                errors: ['Brokerage ID is required']
            };
        }

        // Get shared templates
        const result = await getSharedTemplates({
            userId: user.id,
            brokerageId,
            contentType,
            searchQuery
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to get shared templates',
                errors: [result.error || 'Unknown error']
            };
        }

        return {
            success: true,
            message: 'Shared templates retrieved successfully',
            data: { templates: result.templates! }
        };

    } catch (error) {
        console.error('Get shared templates action error:', error);
        return {
            success: false,
            message: 'Failed to get shared templates',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Update shared template action (with copy-on-write)
 * Requirement 10.4: Create personal copy when user modifies shared template without edit permission
 */
export async function updateSharedTemplateAction(
    templateId: string,
    updates: Partial<Pick<Template, 'name' | 'description' | 'configuration' | 'seasonalTags' | 'previewImage'>>,
    brokerageId?: string
): Promise<ContentWorkflowResponse<{ templateId: string; isNewCopy: boolean }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        if (!templateId) {
            return {
                success: false,
                message: 'Template ID is required',
                errors: ['Template ID is required']
            };
        }

        // Update shared template (with copy-on-write logic)
        const result = await updateSharedTemplate({
            userId: user.id,
            templateId,
            updates,
            brokerageId
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to update template',
                errors: [result.error || 'Unknown error']
            };
        }

        // Revalidate relevant paths
        revalidatePath('/library/templates');

        return {
            success: true,
            message: result.isNewCopy ? 'Personal copy created successfully' : 'Template updated successfully',
            data: {
                templateId: result.templateId!,
                isNewCopy: result.isNewCopy || false
            }
        };

    } catch (error) {
        console.error('Update shared template action error:', error);
        return {
            success: false,
            message: 'Failed to update template',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Unshare template action
 * Requirement 10.5: Manage template sharing permissions
 */
export async function unshareTemplateAction(
    templateId: string,
    brokerageId: string
): Promise<ContentWorkflowResponse<{}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Validate input
        if (!templateId || !brokerageId) {
            return {
                success: false,
                message: 'Template ID and Brokerage ID are required',
                errors: ['Template ID and Brokerage ID are required']
            };
        }

        // Unshare template
        const result = await unshareTemplate({
            userId: user.id,
            templateId,
            brokerageId
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to unshare template',
                errors: [result.error || 'Unknown error']
            };
        }

        // Revalidate relevant paths
        revalidatePath('/library/templates');

        return {
            success: true,
            message: 'Template unshared successfully',
            data: {}
        };

    } catch (error) {
        console.error('Unshare template action error:', error);
        return {
            success: false,
            message: 'Failed to unshare template',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

/**
 * Get template analytics action
 * Requirement: Add template usage analytics and sharing metrics
 */
export async function getTemplateAnalyticsAction(
    templateId?: string,
    brokerageId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<ContentWorkflowResponse<{
    analytics: {
        totalUsage: number;
        uniqueUsers: number;
        sharingMetrics: {
            timesShared: number;
            activeShares: number;
            copyOnWriteEvents: number;
        };
        usageByContentType: Record<string, number>;
        usageOverTime: Array<{ date: string; count: number }>;
        topUsers: Array<{ userId: string; usageCount: number }>;
    };
}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return {
                success: false,
                message: 'Authentication required',
                errors: ['User not authenticated']
            };
        }

        // Get template analytics
        const result = await getTemplateAnalytics({
            userId: user.id,
            templateId,
            brokerageId,
            startDate,
            endDate
        });

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Failed to get template analytics',
                errors: [result.error || 'Unknown error']
            };
        }

        return {
            success: true,
            message: 'Template analytics retrieved successfully',
            data: { analytics: result.analytics! }
        };

    } catch (error) {
        console.error('Get template analytics action error:', error);
        return {
            success: false,
            message: 'Failed to get template analytics',
            errors: [error instanceof Error ? error.message : 'Unknown error']
        };
    }
}

// ==================== Helper Functions ====================

/**
 * Create a standardized response with timestamp
 */
function createResponse<T = any>(success: boolean, message: string, data?: T, errors?: string[]): ContentWorkflowResponse<T> {
    const response: any = {
        success,
        message,
        timestamp: new Date()
    };

    if (data !== undefined) {
        response.data = data;
    }

    if (errors !== undefined) {
        response.errors = errors;
    }

    return response;
}

// ==================== Seasonal Template Intelligence Actions ====================

/**
 * Get seasonal templates with intelligent recommendations
 * Requirements 11.1, 11.2: Display seasonal templates organized by time of year and recommend relevant templates
 */
export async function getSeasonalTemplatesAction(
    season?: string,
    month?: number,
    contentType?: ContentCategory,
    includeUpcoming?: boolean
): Promise<ContentWorkflowResponse<{
    templates: Template[];
    recommendations: {
        current: Template[];
        upcoming: Template[];
        trending: Template[];
    };
}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return createResponse(false, 'Authentication required', undefined, ['User not authenticated']);
        }

        // Get user's brand information for personalization
        const userBrandInfo = {
            name: (user as any).name || user.email,
            contactInfo: user.email,
            marketArea: (user as any).profile?.marketArea || 'your local market',
            brokerageName: (user as any).profile?.brokerageName
        };

        // Get seasonal templates
        const result = await getSeasonalTemplates({
            userId: user.id,
            season,
            month,
            contentType,
            includeUpcoming,
            userBrandInfo
        });

        if (!result.success) {
            return createResponse(false, result.error || 'Failed to get seasonal templates', undefined, [result.error || 'Unknown error']);
        }

        return createResponse(true, 'Seasonal templates retrieved successfully', {
            templates: result.templates || [],
            recommendations: result.recommendations || {
                current: [],
                upcoming: [],
                trending: []
            }
        });

    } catch (error) {
        console.error('Get seasonal templates action error:', error);
        return createResponse(false, 'Failed to get seasonal templates', undefined, [error instanceof Error ? error.message : 'Unknown error']);
    }
}

/**
 * Get proactive seasonal notifications for upcoming opportunities
 * Requirements 11.2, 11.4: Recommend relevant seasonal templates and notify users of updates
 */
export async function getSeasonalNotificationsAction(
    lookAheadDays?: number
): Promise<ContentWorkflowResponse<{
    notifications: Array<{
        type: 'seasonal_opportunity' | 'template_update' | 'market_trend';
        title: string;
        message: string;
        templates: Template[];
        priority: 'high' | 'medium' | 'low';
        actionUrl?: string;
        expiresAt: Date;
    }>;
}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return createResponse(false, 'Authentication required', undefined, ['User not authenticated']);
        }

        // Get seasonal notifications
        const result = await getSeasonalNotifications({
            userId: user.id,
            lookAheadDays
        });

        if (!result.success) {
            return createResponse(false, result.error || 'Failed to get seasonal notifications', undefined, [result.error || 'Unknown error']);
        }

        return createResponse(true, 'Seasonal notifications retrieved successfully', {
            notifications: result.notifications || []
        });

    } catch (error) {
        console.error('Get seasonal notifications action error:', error);
        return createResponse(false, 'Failed to get seasonal notifications', undefined, [error instanceof Error ? error.message : 'Unknown error']);
    }
}

/**
 * Get seasonal template performance analytics
 * Requirements: Add seasonal template analytics and performance tracking
 */
export async function getSeasonalTemplateAnalyticsAction(
    season?: string,
    year?: number,
    templateId?: string
): Promise<ContentWorkflowResponse<{
    analytics: {
        seasonalPerformance: Record<string, {
            totalUsage: number;
            avgEngagement: number;
            topTemplates: Array<{ templateId: string; name: string; usage: number; engagement: number }>;
            trendData: Array<{ month: number; usage: number; engagement: number }>;
        }>;
        yearOverYear?: {
            currentYear: number;
            previousYear: number;
            growthRate: number;
            seasonalComparison: Record<string, { current: number; previous: number; growth: number }>;
        };
        recommendations: Array<{
            type: 'underperforming' | 'trending' | 'opportunity';
            message: string;
            templates: string[];
            actionable: boolean;
        }>;
    };
}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return createResponse(false, 'Authentication required', undefined, ['User not authenticated']);
        }

        // Get seasonal template analytics
        const result = await getSeasonalTemplateAnalytics({
            userId: user.id,
            season,
            year,
            templateId
        });

        if (!result.success) {
            return createResponse(false, result.error || 'Failed to get seasonal template analytics', undefined, [result.error || 'Unknown error']);
        }

        return createResponse(true, 'Seasonal template analytics retrieved successfully', {
            analytics: result.analytics!
        });

    } catch (error) {
        console.error('Get seasonal template analytics action error:', error);
        return createResponse(false, 'Failed to get seasonal template analytics', undefined, [error instanceof Error ? error.message : 'Unknown error']);
    }
}

// ==================== Newsletter Template Actions ====================

/**
 * Newsletter section schema for validation
 */
const newsletterSectionSchema = z.object({
    id: z.string().min(1, 'Section ID is required'),
    type: z.enum(['header', 'content', 'image', 'cta', 'divider', 'footer'], {
        errorMap: () => ({ message: 'Invalid section type' })
    }),
    title: z.string().optional(),
    content: z.string().optional(),
    imageUrl: z.string().url().optional(),
    imageAlt: z.string().optional(),
    ctaText: z.string().optional(),
    ctaUrl: z.string().url().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    alignment: z.enum(['left', 'center', 'right']).optional(),
    padding: z.string().optional(),
    order: z.number().min(0, 'Order must be non-negative')
});

/**
 * Newsletter export schema for validation
 */
const newsletterExportSchema = z.object({
    templateId: z.string().min(1, 'Template ID is required'),
    subject: z.string().min(1, 'Subject is required').max(100, 'Subject must be less than 100 characters'),
    preheader: z.string().max(150, 'Preheader must be less than 150 characters').optional(),
    sections: z.array(newsletterSectionSchema).min(1, 'At least one section is required'),
    userBrandInfo: z.object({
        name: z.string().optional(),
        contactInfo: z.string().optional(),
        address: z.string().optional(),
        unsubscribeUrl: z.string().url().optional()
    }).optional()
});

/**
 * Create newsletter template action
 * Requirements 12.1, 12.2: Newsletter templates with responsive design and email best practices
 */
export async function createNewsletterTemplateAction(
    name: string,
    description: string,
    config: {
        subject: string;
        preheader?: string;
        sections: Array<{
            id: string;
            type: 'header' | 'content' | 'image' | 'cta' | 'divider' | 'footer';
            title?: string;
            content?: string;
            imageUrl?: string;
            imageAlt?: string;
            ctaText?: string;
            ctaUrl?: string;
            backgroundColor?: string;
            textColor?: string;
            alignment?: 'left' | 'center' | 'right';
            padding?: string;
            order: number;
        }>;
        layout: 'single-column' | 'two-column' | 'three-column';
        branding: {
            logo?: string;
            primaryColor: string;
            secondaryColor: string;
            fontFamily: 'Arial' | 'Helvetica' | 'Georgia' | 'Times' | 'Verdana';
        };
        footer: {
            includeUnsubscribe: boolean;
            includeAddress: boolean;
            includeDisclaimer: boolean;
            customText?: string;
        };
        espCompatibility: {
            outlook: boolean;
            gmail: boolean;
            appleMail: boolean;
            yahooMail: boolean;
            thunderbird: boolean;
        };
    }
): Promise<ContentWorkflowResponse<{ templateId: string; validationResults: any[] }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return createResponse(false, 'Authentication required', undefined, ['User not authenticated']);
        }

        // Validate input
        const validatedData = z.object({
            name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
            description: z.string().min(1, 'Description is required').max(500, 'Description must be less than 500 characters'),
            config: z.object({
                subject: z.string().min(1, 'Subject is required').max(100, 'Subject must be less than 100 characters'),
                preheader: z.string().max(150, 'Preheader must be less than 150 characters').optional(),
                sections: z.array(newsletterSectionSchema).min(1, 'At least one section is required'),
                layout: z.enum(['single-column', 'two-column', 'three-column']),
                branding: z.object({
                    logo: z.string().optional(),
                    primaryColor: z.string().min(1, 'Primary color is required'),
                    secondaryColor: z.string().min(1, 'Secondary color is required'),
                    fontFamily: z.enum(['Arial', 'Helvetica', 'Georgia', 'Times', 'Verdana'])
                }),
                footer: z.object({
                    includeUnsubscribe: z.boolean(),
                    includeAddress: z.boolean(),
                    includeDisclaimer: z.boolean(),
                    customText: z.string().optional()
                }),
                espCompatibility: z.object({
                    outlook: z.boolean(),
                    gmail: z.boolean(),
                    appleMail: z.boolean(),
                    yahooMail: z.boolean(),
                    thunderbird: z.boolean()
                })
            })
        }).parse({ name, description, config });

        // Import newsletter template service functions
        const { createNewsletterTemplate } = await import('@/services/template-service');

        // Create newsletter template
        const result = await createNewsletterTemplate({
            userId: user.userId,
            name: validatedData.name,
            description: validatedData.description,
            config: validatedData.config
        });

        if (!result.success) {
            return createResponse(false, result.error || 'Failed to create newsletter template', undefined, [result.error || 'Unknown error']);
        }

        // Revalidate relevant paths
        revalidatePath('/library/templates');
        revalidatePath('/studio');

        return createResponse(true, 'Newsletter template created successfully', {
            templateId: result.templateId!,
            validationResults: result.validationResults || []
        });

    } catch (error) {
        console.error('Create newsletter template action error:', error);

        if (error instanceof z.ZodError) {
            return createResponse(false, 'Validation failed', undefined, error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
        }

        return createResponse(false, 'Failed to create newsletter template', undefined, [error instanceof Error ? error.message : 'Unknown error']);
    }
}

/**
 * Export newsletter template action
 * Requirements 12.4, 12.5: Dual-format export (HTML + plain text) compatible with ESPs
 */
export async function exportNewsletterAction(
    templateId: string,
    content: {
        subject: string;
        preheader?: string;
        sections: Array<{
            id: string;
            type: 'header' | 'content' | 'image' | 'cta' | 'divider' | 'footer';
            title?: string;
            content?: string;
            imageUrl?: string;
            imageAlt?: string;
            ctaText?: string;
            ctaUrl?: string;
            backgroundColor?: string;
            textColor?: string;
            alignment?: 'left' | 'center' | 'right';
            padding?: string;
            order: number;
        }>;
    },
    userBrandInfo?: {
        name?: string;
        contactInfo?: string;
        address?: string;
        unsubscribeUrl?: string;
    }
): Promise<ContentWorkflowResponse<{
    html: string;
    plainText: string;
    subject: string;
    preheader?: string;
    metadata: {
        generatedAt: Date;
        templateId: string;
        userId: string;
        espCompatibility: string[];
        validationResults: any[];
    };
}>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return createResponse(false, 'Authentication required', undefined, ['User not authenticated']);
        }

        // Validate input
        const validatedData = newsletterExportSchema.parse({
            templateId,
            subject: content.subject,
            preheader: content.preheader,
            sections: content.sections,
            userBrandInfo
        });

        // Import newsletter template service functions
        const { exportNewsletterTemplate } = await import('@/services/template-service');

        // Export newsletter template
        const result = await exportNewsletterTemplate({
            userId: user.userId,
            templateId: validatedData.templateId,
            content: {
                subject: validatedData.subject,
                preheader: validatedData.preheader,
                sections: validatedData.sections
            },
            userBrandInfo: validatedData.userBrandInfo
        });

        if (!result.success || !result.export) {
            return createResponse(false, result.error || 'Failed to export newsletter template', undefined, [result.error || 'Unknown error']);
        }

        return createResponse(true, 'Newsletter exported successfully', result.export);

    } catch (error) {
        console.error('Export newsletter action error:', error);

        if (error instanceof z.ZodError) {
            return createResponse(false, 'Validation failed', undefined, error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
        }

        return createResponse(false, 'Failed to export newsletter template', undefined, [error instanceof Error ? error.message : 'Unknown error']);
    }
}

/**
 * Get newsletter templates action
 * Requirements 12.1: Newsletter-specific templates with responsive design
 */
export async function getNewsletterTemplatesAction(
    category?: 'market-update' | 'client-newsletter' | 'listing-showcase' | 'seasonal'
): Promise<ContentWorkflowResponse<{ templates: Template[] }>> {
    try {
        // Get current user
        const user = await getCurrentUser();
        if (!user) {
            return createResponse(false, 'Authentication required', undefined, ['User not authenticated']);
        }

        // Validate input
        const validatedCategory = category ? z.enum(['market-update', 'client-newsletter', 'listing-showcase', 'seasonal']).parse(category) : undefined;

        // Import newsletter template service functions
        const { getNewsletterTemplates } = await import('@/services/template-service');

        // Get newsletter templates
        const result = await getNewsletterTemplates({
            userId: user.userId,
            category: validatedCategory
        });

        if (!result.success) {
            return createResponse(false, result.error || 'Failed to get newsletter templates', undefined, [result.error || 'Unknown error']);
        }

        return createResponse(true, 'Newsletter templates retrieved successfully', {
            templates: result.templates || []
        });

    } catch (error) {
        console.error('Get newsletter templates action error:', error);

        if (error instanceof z.ZodError) {
            return createResponse(false, 'Validation failed', undefined, error.errors.map(e => `${e.path.join('.')}: ${e.message}`));
        }

        return createResponse(false, 'Failed to get newsletter templates', undefined, [error instanceof Error ? error.message : 'Unknown error']);
    }
}