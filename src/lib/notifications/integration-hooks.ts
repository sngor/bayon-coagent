/**
 * Notification Integration Hooks
 * 
 * Provides hooks for common application events to trigger notifications.
 * Validates Requirements: 7.4
 */

import {
    Notification,
    NotificationType,
    NotificationPriority,
    CreateNotificationRequest,
    NotificationChannel,
} from "./types";
import { getNotificationService, NotificationService } from "./service";
import {
    NotificationError,
    createNotificationError,
    ErrorCodes,
} from "./errors";

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Hook event types for common application events
 */
export enum HookEventType {
    // User actions
    USER_SIGNUP = "user_signup",
    USER_LOGIN = "user_login",
    USER_PROFILE_UPDATED = "user_profile_updated",
    USER_SUBSCRIPTION_CHANGED = "user_subscription_changed",

    // Content events
    CONTENT_CREATED = "content_created",
    CONTENT_PUBLISHED = "content_published",
    CONTENT_SHARED = "content_shared",

    // System events
    SYSTEM_MAINTENANCE = "system_maintenance",
    SYSTEM_UPDATE = "system_update",
    SYSTEM_ERROR = "system_error",

    // AI events
    AI_TASK_COMPLETED = "ai_task_completed",
    AI_TASK_FAILED = "ai_task_failed",

    // Market events
    MARKET_ALERT = "market_alert",
    PRICE_CHANGE = "price_change",
    NEW_LISTING = "new_listing",

    // Collaboration events
    COMMENT_ADDED = "comment_added",
    MENTION_RECEIVED = "mention_received",
    SHARE_RECEIVED = "share_received",
}

/**
 * Hook configuration
 */
export interface HookConfig {
    id: string;
    eventType: HookEventType;
    enabled: boolean;
    notificationType: NotificationType;
    priority: NotificationPriority;
    channels: NotificationChannel[];
    titleTemplate: string;
    contentTemplate: string;
    actionUrlTemplate?: string;
    actionText?: string;
    metadata?: Record<string, any>;
}

/**
 * Hook event data
 */
export interface HookEventData {
    eventType: HookEventType;
    userId: string;
    data: Record<string, any>;
    timestamp?: string;
}

/**
 * Hook execution result
 */
export interface HookExecutionResult {
    success: boolean;
    hookId: string;
    notificationId?: string;
    error?: string;
    timestamp: string;
}

/**
 * Hook validation result
 */
export interface HookValidationResult {
    valid: boolean;
    errors: string[];
}

// ============================================================================
// Hook Manager
// ============================================================================

/**
 * NotificationHookManager
 * 
 * Manages registration and execution of notification hooks
 */
export class NotificationHookManager {
    private hooks: Map<string, HookConfig> = new Map();
    private eventHooks: Map<HookEventType, Set<string>> = new Map();
    private notificationService: NotificationService;

    constructor(notificationService?: NotificationService) {
        this.notificationService = notificationService || getNotificationService();
    }

    // ============================================================================
    // Hook Registration
    // ============================================================================

    /**
     * Registers a notification hook
     * 
     * @param config Hook configuration
     * @throws NotificationError if validation fails
     */
    registerHook(config: HookConfig): void {
        // Validate hook configuration
        const validation = this.validateHookConfig(config);
        if (!validation.valid) {
            throw createNotificationError(
                ErrorCodes.INVALID_REQUEST,
                `Invalid hook configuration: ${validation.errors.join(", ")}`,
                { config, errors: validation.errors }
            );
        }

        // Store hook
        this.hooks.set(config.id, config);

        // Index by event type
        if (!this.eventHooks.has(config.eventType)) {
            this.eventHooks.set(config.eventType, new Set());
        }
        this.eventHooks.get(config.eventType)!.add(config.id);

        console.log(`[Hook Manager] Registered hook: ${config.id} for event: ${config.eventType}`);
    }

    /**
     * Unregisters a notification hook
     * 
     * @param hookId Hook ID
     */
    unregisterHook(hookId: string): void {
        const hook = this.hooks.get(hookId);
        if (hook) {
            // Remove from event index
            const eventHooks = this.eventHooks.get(hook.eventType);
            if (eventHooks) {
                eventHooks.delete(hookId);
                if (eventHooks.size === 0) {
                    this.eventHooks.delete(hook.eventType);
                }
            }

            // Remove hook
            this.hooks.delete(hookId);

            console.log(`[Hook Manager] Unregistered hook: ${hookId}`);
        }
    }

    /**
     * Gets a registered hook
     * 
     * @param hookId Hook ID
     * @returns Hook configuration or undefined
     */
    getHook(hookId: string): HookConfig | undefined {
        return this.hooks.get(hookId);
    }

    /**
     * Gets all registered hooks
     * 
     * @returns Array of hook configurations
     */
    getAllHooks(): HookConfig[] {
        return Array.from(this.hooks.values());
    }

    /**
     * Gets hooks for a specific event type
     * 
     * @param eventType Event type
     * @returns Array of hook configurations
     */
    getHooksForEvent(eventType: HookEventType): HookConfig[] {
        const hookIds = this.eventHooks.get(eventType);
        if (!hookIds) {
            return [];
        }

        return Array.from(hookIds)
            .map(id => this.hooks.get(id))
            .filter((hook): hook is HookConfig => hook !== undefined && hook.enabled);
    }

    /**
     * Enables or disables a hook
     * 
     * @param hookId Hook ID
     * @param enabled Whether to enable or disable
     */
    setHookEnabled(hookId: string, enabled: boolean): void {
        const hook = this.hooks.get(hookId);
        if (hook) {
            hook.enabled = enabled;
            console.log(`[Hook Manager] Hook ${hookId} ${enabled ? "enabled" : "disabled"}`);
        }
    }

    // ============================================================================
    // Hook Execution
    // ============================================================================

    /**
     * Triggers hooks for an event
     * 
     * @param eventData Event data
     * @returns Array of execution results
     */
    async triggerEvent(eventData: HookEventData): Promise<HookExecutionResult[]> {
        const hooks = this.getHooksForEvent(eventData.eventType);

        if (hooks.length === 0) {
            console.log(`[Hook Manager] No hooks registered for event: ${eventData.eventType}`);
            return [];
        }

        console.log(
            `[Hook Manager] Triggering ${hooks.length} hooks for event: ${eventData.eventType}`,
            { userId: eventData.userId }
        );

        const results: HookExecutionResult[] = [];

        // Execute each hook
        for (const hook of hooks) {
            try {
                const result = await this.executeHook(hook, eventData);
                results.push(result);
            } catch (error) {
                results.push({
                    success: false,
                    hookId: hook.id,
                    error: error instanceof Error ? error.message : "Unknown error",
                    timestamp: new Date().toISOString(),
                });
            }
        }

        return results;
    }

    /**
     * Executes a single hook
     * 
     * @param hook Hook configuration
     * @param eventData Event data
     * @returns Execution result
     */
    private async executeHook(
        hook: HookConfig,
        eventData: HookEventData
    ): Promise<HookExecutionResult> {
        try {
            // Render templates with event data
            const title = this.renderTemplate(hook.titleTemplate, eventData.data);
            const content = this.renderTemplate(hook.contentTemplate, eventData.data);
            const actionUrl = hook.actionUrlTemplate
                ? this.renderTemplate(hook.actionUrlTemplate, eventData.data)
                : undefined;

            // Create notification request
            const request: CreateNotificationRequest = {
                userId: eventData.userId,
                type: hook.notificationType,
                priority: hook.priority,
                title,
                content,
                channels: hook.channels,
                actionUrl,
                actionText: hook.actionText,
                metadata: {
                    ...hook.metadata,
                    hookId: hook.id,
                    eventType: eventData.eventType,
                    eventData: eventData.data,
                },
            };

            // Create and send notification
            const notification = await this.notificationService.createNotification(request);
            await this.notificationService.sendNotification(notification.id);

            return {
                success: true,
                hookId: hook.id,
                notificationId: notification.id,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            console.error(`[Hook Manager] Failed to execute hook ${hook.id}:`, error);
            throw error;
        }
    }

    // ============================================================================
    // Template Rendering
    // ============================================================================

    /**
     * Renders a template string with data
     * 
     * @param template Template string with {{variable}} placeholders
     * @param data Data object
     * @returns Rendered string
     */
    private renderTemplate(template: string, data: Record<string, any>): string {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key]?.toString() || match;
        });
    }

    // ============================================================================
    // Validation
    // ============================================================================

    /**
     * Validates hook configuration
     * 
     * @param config Hook configuration
     * @returns Validation result
     */
    private validateHookConfig(config: HookConfig): HookValidationResult {
        const errors: string[] = [];

        if (!config.id) {
            errors.push("Hook ID is required");
        }

        if (!config.eventType) {
            errors.push("Event type is required");
        }

        if (!config.notificationType) {
            errors.push("Notification type is required");
        }

        if (!config.priority) {
            errors.push("Priority is required");
        }

        if (!config.channels || config.channels.length === 0) {
            errors.push("At least one channel is required");
        }

        if (!config.titleTemplate) {
            errors.push("Title template is required");
        }

        if (!config.contentTemplate) {
            errors.push("Content template is required");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let hookManagerInstance: NotificationHookManager | null = null;

/**
 * Gets the singleton hook manager instance
 */
export function getNotificationHookManager(): NotificationHookManager {
    if (!hookManagerInstance) {
        hookManagerInstance = new NotificationHookManager();
    }
    return hookManagerInstance;
}

/**
 * Resets the singleton instance (for testing)
 */
export function resetNotificationHookManager(): void {
    hookManagerInstance = null;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Registers a hook for user signup events
 */
export function registerUserSignupHook(userId: string): void {
    const manager = getNotificationHookManager();
    manager.registerHook({
        id: "user-signup-welcome",
        eventType: HookEventType.USER_SIGNUP,
        enabled: true,
        notificationType: NotificationType.SYSTEM,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        titleTemplate: "Welcome to Bayon Coagent!",
        contentTemplate: "Thank you for signing up. Let's get started building your real estate success.",
        actionUrlTemplate: "/dashboard",
        actionText: "Get Started",
    });
}

/**
 * Registers a hook for AI task completion events
 */
export function registerAITaskCompletionHook(): void {
    const manager = getNotificationHookManager();
    manager.registerHook({
        id: "ai-task-completed",
        eventType: HookEventType.AI_TASK_COMPLETED,
        enabled: true,
        notificationType: NotificationType.TASK_COMPLETION,
        priority: NotificationPriority.MEDIUM,
        channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
        titleTemplate: "{{taskName}} completed",
        contentTemplate: "Your {{taskName}} has finished processing and is ready to view.",
        actionUrlTemplate: "{{resultUrl}}",
        actionText: "View Result",
    });
}

/**
 * Registers a hook for market alert events
 */
export function registerMarketAlertHook(): void {
    const manager = getNotificationHookManager();
    manager.registerHook({
        id: "market-alert",
        eventType: HookEventType.MARKET_ALERT,
        enabled: true,
        notificationType: NotificationType.ALERT,
        priority: NotificationPriority.HIGH,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL, NotificationChannel.PUSH],
        titleTemplate: "Market Alert: {{alertType}}",
        contentTemplate: "{{alertMessage}}",
        actionUrlTemplate: "{{alertUrl}}",
        actionText: "View Details",
    });
}

/**
 * Triggers a user signup event
 */
export async function triggerUserSignupEvent(userId: string, userData: Record<string, any>): Promise<HookExecutionResult[]> {
    const manager = getNotificationHookManager();
    return manager.triggerEvent({
        eventType: HookEventType.USER_SIGNUP,
        userId,
        data: userData,
    });
}

/**
 * Triggers an AI task completion event
 */
export async function triggerAITaskCompletionEvent(
    userId: string,
    taskName: string,
    resultUrl: string
): Promise<HookExecutionResult[]> {
    const manager = getNotificationHookManager();
    return manager.triggerEvent({
        eventType: HookEventType.AI_TASK_COMPLETED,
        userId,
        data: { taskName, resultUrl },
    });
}

/**
 * Triggers a market alert event
 */
export async function triggerMarketAlertEvent(
    userId: string,
    alertType: string,
    alertMessage: string,
    alertUrl: string
): Promise<HookExecutionResult[]> {
    const manager = getNotificationHookManager();
    return manager.triggerEvent({
        eventType: HookEventType.MARKET_ALERT,
        userId,
        data: { alertType, alertMessage, alertUrl },
    });
}
