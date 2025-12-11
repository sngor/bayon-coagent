/**
 * Maintenance Mode Service
 * 
 * Handles maintenance window scheduling and maintenance mode management.
 * Validates Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { DynamoDBRepository } from '@/aws/dynamodb/repository';
import { getMaintenanceWindowKeys } from '@/aws/dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { getCacheService, CacheKeys, CacheTTL } from './cache-service';
import { z } from 'zod';

/**
 * Input validation schemas
 */
export const CreateMaintenanceWindowSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
    startTime: z.number().int().positive('Start time must be positive'),
    endTime: z.number().int().positive('End time must be positive'),
    adminId: z.string().min(1, 'Admin ID is required'),
});

export const EnableMaintenanceModeSchema = z.object({
    title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
    description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
    durationMinutes: z.number().int().min(1, 'Duration must be at least 1 minute').max(1440, 'Duration cannot exceed 24 hours'),
    adminId: z.string().min(1, 'Admin ID is required'),
});

export type CreateMaintenanceWindowInput = z.infer<typeof CreateMaintenanceWindowSchema>;
export type EnableMaintenanceModeInput = z.infer<typeof EnableMaintenanceModeSchema>;

/**
 * Custom error types for better error handling
 */
export class MaintenanceWindowError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'MaintenanceWindowError';
    }
}

export class MaintenanceWindowNotFoundError extends MaintenanceWindowError {
    constructor(windowId: string) {
        super(`Maintenance window not found: ${windowId}`, 'WINDOW_NOT_FOUND');
    }
}

export class InvalidMaintenanceWindowStatusError extends MaintenanceWindowError {
    constructor(currentStatus: string, allowedStatuses: string[]) {
        super(
            `Invalid window status: ${currentStatus}. Expected: ${allowedStatuses.join(', ')}`,
            'INVALID_STATUS'
        );
    }
}

export class InvalidTimeRangeError extends MaintenanceWindowError {
    constructor(message: string) {
        super(message, 'INVALID_TIME_RANGE');
    }
}

/**
 * Validation utilities for maintenance windows
 */
class MaintenanceWindowValidator {
    static validateScheduleTime(startTime: number, endTime: number): void {
        const now = Date.now();

        if (startTime <= now) {
            throw new InvalidTimeRangeError('Start time must be in the future');
        }

        if (endTime <= startTime) {
            throw new InvalidTimeRangeError('End time must be after start time');
        }

        // Add reasonable limits
        const maxDuration = 24 * 60 * 60 * 1000; // 24 hours
        if (endTime - startTime > maxDuration) {
            throw new InvalidTimeRangeError('Maintenance window cannot exceed 24 hours');
        }
    }

    static validateWindowExists(window: MaintenanceWindow | null, windowId: string): asserts window is MaintenanceWindow {
        if (!window) {
            throw new MaintenanceWindowNotFoundError(windowId);
        }
    }

    static validateWindowStatus(
        window: MaintenanceWindow,
        allowedStatuses: MaintenanceWindow['status'][]
    ): void {
        if (!allowedStatuses.includes(window.status)) {
            throw new InvalidMaintenanceWindowStatusError(window.status, allowedStatuses);
        }
    }
}

export interface MaintenanceWindow {
    windowId: string;
    title: string;
    description: string;
    startTime: number;
    endTime: number;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    createdBy: string;
    createdAt: number;
    updatedAt: number;
    notificationsSent: boolean;
    completionNotificationSent: boolean;
}

export interface MaintenanceBanner {
    show: boolean;
    title: string;
    message: string;
    startTime: number;
    endTime: number;
}

/**
 * Repository layer for maintenance window data operations
 */
class MaintenanceWindowRepository {
    private repository: DynamoDBRepository;

    constructor() {
        this.repository = new DynamoDBRepository();
    }

    async create(window: MaintenanceWindow): Promise<void> {
        const keys = getMaintenanceWindowKeys(window.windowId, window.status, window.startTime);
        await this.repository.create(
            keys.PK,
            keys.SK,
            'MaintenanceWindow',
            window
        );
    }

    async get(windowId: string): Promise<MaintenanceWindow | null> {
        const keys = getMaintenanceWindowKeys(windowId);
        return await this.repository.get<MaintenanceWindow>(keys.PK, keys.SK);
    }

    async update(windowId: string, updates: Partial<MaintenanceWindow>): Promise<void> {
        const keys = getMaintenanceWindowKeys(windowId);
        await this.repository.update(keys.PK, keys.SK, {
            ...updates,
            updatedAt: Date.now(),
        });
    }

    async queryByStatus(
        status: MaintenanceWindow['status'],
        limit: number = 50,
        lastKey?: string
    ): Promise<{ windows: MaintenanceWindow[]; lastKey?: string }> {
        const result = await this.repository.query<MaintenanceWindow>(
            `MAINTENANCE#${status}`,
            '',
            limit,
            lastKey,
            'GSI1'
        );

        return {
            windows: result.items,
            lastKey: result.lastKey,
        };
    }

    async queryAll(
        limit: number = 50,
        lastKey?: string
    ): Promise<{ windows: MaintenanceWindow[]; lastKey?: string }> {
        const result = await this.repository.query<MaintenanceWindow>(
            'CONFIG#MAINTENANCE',
            'WINDOW#',
            limit,
            lastKey
        );

        return {
            windows: result.items,
            lastKey: result.lastKey,
        };
    }
}

export class MaintenanceModeService {
    private windowRepository: MaintenanceWindowRepository;
    private repository: DynamoDBRepository;
    private cache = getCacheService();

    constructor() {
        this.windowRepository = new MaintenanceWindowRepository();
        this.repository = new DynamoDBRepository();
    }

    /**
     * Gets current maintenance status with caching
     * Cache for 30 seconds to reduce database load
     */
    async isMaintenanceModeActive(): Promise<boolean> {
        const cacheKey = 'maintenance:active';

        const cached = this.cache.get<boolean>(cacheKey);
        if (cached !== undefined) {
            return cached;
        }

        const currentWindow = await this.getCurrentMaintenanceWindow();
        const isActive = currentWindow !== null;

        // Cache for 30 seconds
        this.cache.set(cacheKey, isActive, 30);
        return isActive;
    }

    /**
     * Invalidates maintenance cache when status changes
     */
    private invalidateMaintenanceCache(): void {
        this.cache.delete('maintenance:active');
        this.cache.delete('maintenance:banner');
    }

    /**
     * Schedules a new maintenance window
     * Validates: Requirements 15.1
     */
    async scheduleMaintenanceWindow(input: CreateMaintenanceWindowInput): Promise<MaintenanceWindow> {
        // Validate input with Zod schema
        const validatedInput = CreateMaintenanceWindowSchema.parse(input);

        // Additional business logic validation
        MaintenanceWindowValidator.validateScheduleTime(validatedInput.startTime, validatedInput.endTime);

        const windowId = uuidv4();
        const now = Date.now();

        const window: MaintenanceWindow = {
            windowId,
            title: validatedInput.title.trim(),
            description: validatedInput.description.trim(),
            startTime: validatedInput.startTime,
            endTime: validatedInput.endTime,
            status: 'scheduled',
            createdBy: validatedInput.adminId,
            createdAt: now,
            updatedAt: now,
            notificationsSent: false,
            completionNotificationSent: false,
        };

        await this.windowRepository.create(window);
        this.invalidateMaintenanceCache();

        return window;
    }

    /**
     * Gets all maintenance windows
     * Validates: Requirements 15.3
     */
    async getMaintenanceWindows(options?: {
        status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
        limit?: number;
        lastKey?: string;
    }): Promise<{
        windows: MaintenanceWindow[];
        lastKey?: string;
    }> {
        const limit = options?.limit || 50;

        if (options?.status) {
            // Query by status using GSI
            const result = await this.repository.query<MaintenanceWindow>(
                `MAINTENANCE#${options.status}`,
                '',
                limit,
                options?.lastKey,
                'GSI1'
            );

            return {
                windows: result.items,
                lastKey: result.lastKey,
            };
        } else {
            // Query all windows
            const result = await this.repository.query<MaintenanceWindow>(
                'CONFIG#MAINTENANCE',
                'WINDOW#',
                limit,
                options?.lastKey
            );

            return {
                windows: result.items,
                lastKey: result.lastKey,
            };
        }
    }

    /**
     * Gets a specific maintenance window
     */
    async getMaintenanceWindow(windowId: string): Promise<MaintenanceWindow | null> {
        const keys = getMaintenanceWindowKeys(windowId);
        return await this.repository.get<MaintenanceWindow>(keys.PK, keys.SK);
    }

    /**
     * Gets the current active maintenance window
     * Validates: Requirements 15.1, 15.2
     */
    async getCurrentMaintenanceWindow(): Promise<MaintenanceWindow | null> {
        const now = Date.now();

        // Get all scheduled and active windows
        const scheduled = await this.getMaintenanceWindows({ status: 'scheduled' });
        const active = await this.getMaintenanceWindows({ status: 'active' });

        const allWindows = [...scheduled.windows, ...active.windows];

        // Find window that is currently active or should be active
        for (const window of allWindows) {
            if (window.startTime <= now && window.endTime > now) {
                // Update status to active if it's scheduled
                if (window.status === 'scheduled') {
                    await this.updateWindowStatus(window.windowId, 'active');
                    window.status = 'active';
                }
                return window;
            }
        }

        return null;
    }

    /**
     * Checks if maintenance mode is currently active
     * Validates: Requirements 15.2
     */
    async isMaintenanceModeActive(): Promise<boolean> {
        const currentWindow = await this.getCurrentMaintenanceWindow();
        return currentWindow !== null;
    }

    /**
     * Gets maintenance banner information for display
     * Validates: Requirements 15.1
     */
    async getMaintenanceBanner(): Promise<MaintenanceBanner | null> {
        const currentWindow = await this.getCurrentMaintenanceWindow();

        if (!currentWindow) {
            return null;
        }

        return {
            show: true,
            title: currentWindow.title,
            message: currentWindow.description,
            startTime: currentWindow.startTime,
            endTime: currentWindow.endTime,
        };
    }

    /**
     * Enables maintenance mode immediately
     * Validates: Requirements 15.2
     */
    async enableMaintenanceMode(
        title: string,
        description: string,
        durationMinutes: number,
        adminId: string
    ): Promise<MaintenanceWindow> {
        const now = Date.now();
        const endTime = now + (durationMinutes * 60 * 1000);

        const windowId = uuidv4();

        const window: MaintenanceWindow = {
            windowId,
            title,
            description,
            startTime: now,
            endTime,
            status: 'active',
            createdBy: adminId,
            createdAt: now,
            updatedAt: now,
            notificationsSent: true, // Immediate mode, no pre-notification
            completionNotificationSent: false,
        };

        const keys = getMaintenanceWindowKeys(windowId, 'active', now);

        await this.repository.create(
            keys.PK,
            keys.SK,
            'MaintenanceWindow',
            window,
            keys.GSI1PK,
            keys.GSI1SK
        );

        return window;
    }

    /**
     * Disables maintenance mode immediately
     * Validates: Requirements 15.4
     */
    async disableMaintenanceMode(adminId: string): Promise<void> {
        const currentWindow = await this.getCurrentMaintenanceWindow();

        if (!currentWindow) {
            throw new Error('No active maintenance window found');
        }

        await this.completeMaintenanceWindow(currentWindow.windowId, adminId);
    }

    /**
     * Completes a maintenance window
     * Validates: Requirements 15.4
     */
    async completeMaintenanceWindow(
        windowId: string,
        adminId: string
    ): Promise<void> {
        const window = await this.getMaintenanceWindow(windowId);

        if (!window) {
            throw new Error('Maintenance window not found');
        }

        if (window.status === 'completed' || window.status === 'cancelled') {
            throw new Error('Maintenance window is already completed or cancelled');
        }

        await this.updateWindowStatus(windowId, 'completed');
    }

    /**
     * Cancels a scheduled maintenance window
     * Validates: Requirements 15.5
     */
    async cancelMaintenanceWindow(
        windowId: string,
        adminId: string
    ): Promise<void> {
        const window = await this.getMaintenanceWindow(windowId);

        if (!window) {
            throw new Error('Maintenance window not found');
        }

        if (window.status === 'completed') {
            throw new Error('Cannot cancel a completed maintenance window');
        }

        if (window.status === 'cancelled') {
            throw new Error('Maintenance window is already cancelled');
        }

        await this.updateWindowStatus(windowId, 'cancelled');
    }

    /**
     * Updates the status of a maintenance window
     */
    private async updateWindowStatus(
        windowId: string,
        status: 'scheduled' | 'active' | 'completed' | 'cancelled'
    ): Promise<void> {
        const keys = getMaintenanceWindowKeys(windowId);
        const now = Date.now();

        await this.repository.update(keys.PK, keys.SK, {
            status,
            updatedAt: now,
        });
    }

    /**
     * Marks notifications as sent for a maintenance window
     */
    async markNotificationsSent(windowId: string): Promise<void> {
        const keys = getMaintenanceWindowKeys(windowId);

        await this.repository.update(keys.PK, keys.SK, {
            notificationsSent: true,
            updatedAt: Date.now(),
        });
    }

    /**
     * Marks completion notification as sent for a maintenance window
     */
    async markCompletionNotificationSent(windowId: string): Promise<void> {
        const keys = getMaintenanceWindowKeys(windowId);

        await this.repository.update(keys.PK, keys.SK, {
            completionNotificationSent: true,
            updatedAt: Date.now(),
        });
    }

    /**
     * Gets upcoming maintenance windows (scheduled for the next 7 days)
     */
    async getUpcomingMaintenanceWindows(): Promise<MaintenanceWindow[]> {
        const now = Date.now();
        const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);

        const result = await this.getMaintenanceWindows({ status: 'scheduled' });

        return result.windows.filter(
            window => window.startTime >= now && window.startTime <= sevenDaysFromNow
        );
    }

    /**
     * Gets past maintenance windows (completed or cancelled)
     */
    async getPastMaintenanceWindows(limit: number = 20): Promise<MaintenanceWindow[]> {
        const completed = await this.getMaintenanceWindows({
            status: 'completed',
            limit: Math.ceil(limit / 2)
        });
        const cancelled = await this.getMaintenanceWindows({
            status: 'cancelled',
            limit: Math.ceil(limit / 2)
        });

        const allPast = [...completed.windows, ...cancelled.windows];

        // Sort by start time descending (most recent first)
        allPast.sort((a, b) => b.startTime - a.startTime);

        return allPast.slice(0, limit);
    }

    /**
     * Checks if a user should bypass maintenance mode
     * Validates: Requirements 15.2
     */
    shouldBypassMaintenanceMode(userRole?: string): boolean {
        return userRole === 'superadmin';
    }
}

// Export singleton instance
export const maintenanceModeService = new MaintenanceModeService();
