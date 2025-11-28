/**
 * Integration Hooks Tests
 * 
 * Tests for notification integration hooks functionality.
 */

import {
    NotificationHookManager,
    HookConfig,
    HookEventType,
    HookEventData,
    getNotificationHookManager,
    resetNotificationHookManager,
    registerUserSignupHook,
    registerAITaskCompletionHook,
    registerMarketAlertHook,
    triggerUserSignupEvent,
    triggerAITaskCompletionEvent,
    triggerMarketAlertEvent,
} from "../integration-hooks";
import {
    NotificationType,
    NotificationPriority,
    NotificationChannel,
} from "../types";
import { NotificationService } from "../service";
import { NotificationStatus } from "../types";

// Mock notification service
class MockNotificationService {
    public createNotificationCalls: any[] = [];
    public sendNotificationCalls: string[] = [];
    public shouldFail: boolean = false;

    async createNotification(request: any): Promise<any> {
        this.createNotificationCalls.push(request);

        if (this.shouldFail) {
            throw new Error("Service error");
        }

        return {
            id: "test-notification-id",
            userId: request.userId,
            type: request.type,
            priority: request.priority,
            title: request.title,
            content: request.content,
            channels: request.channels,
            status: NotificationStatus.PENDING,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    async sendNotification(notificationId: string): Promise<any> {
        this.sendNotificationCalls.push(notificationId);

        return {
            success: true,
            channel: NotificationChannel.IN_APP,
            timestamp: new Date().toISOString(),
        };
    }

    reset(): void {
        this.createNotificationCalls = [];
        this.sendNotificationCalls = [];
        this.shouldFail = false;
    }
}

describe("NotificationHookManager", () => {
    let hookManager: NotificationHookManager;
    let mockNotificationService: MockNotificationService;

    beforeEach(() => {
        // Reset singleton
        resetNotificationHookManager();

        // Create mock notification service
        mockNotificationService = new MockNotificationService();
        hookManager = new NotificationHookManager(mockNotificationService as any);
    });

    describe("Hook Registration", () => {
        it("should register a valid hook", () => {
            const config: HookConfig = {
                id: "test-hook",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Welcome!",
                contentTemplate: "Welcome to the platform",
            };

            hookManager.registerHook(config);

            const registered = hookManager.getHook("test-hook");
            expect(registered).toEqual(config);
        });

        it("should throw error for invalid hook configuration", () => {
            const invalidConfig = {
                id: "",
                eventType: HookEventType.USER_SIGNUP,
            } as HookConfig;

            expect(() => hookManager.registerHook(invalidConfig)).toThrow();
        });

        it("should unregister a hook", () => {
            const config: HookConfig = {
                id: "test-hook",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Welcome!",
                contentTemplate: "Welcome to the platform",
            };

            hookManager.registerHook(config);
            hookManager.unregisterHook("test-hook");

            const registered = hookManager.getHook("test-hook");
            expect(registered).toBeUndefined();
        });

        it("should get all registered hooks", () => {
            const config1: HookConfig = {
                id: "hook-1",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Welcome!",
                contentTemplate: "Welcome",
            };

            const config2: HookConfig = {
                id: "hook-2",
                eventType: HookEventType.AI_TASK_COMPLETED,
                enabled: true,
                notificationType: NotificationType.TASK_COMPLETION,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Task Complete",
                contentTemplate: "Your task is done",
            };

            hookManager.registerHook(config1);
            hookManager.registerHook(config2);

            const allHooks = hookManager.getAllHooks();
            expect(allHooks).toHaveLength(2);
        });

        it("should get hooks for specific event type", () => {
            const config1: HookConfig = {
                id: "hook-1",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Welcome!",
                contentTemplate: "Welcome",
            };

            const config2: HookConfig = {
                id: "hook-2",
                eventType: HookEventType.AI_TASK_COMPLETED,
                enabled: true,
                notificationType: NotificationType.TASK_COMPLETION,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Task Complete",
                contentTemplate: "Your task is done",
            };

            hookManager.registerHook(config1);
            hookManager.registerHook(config2);

            const signupHooks = hookManager.getHooksForEvent(HookEventType.USER_SIGNUP);
            expect(signupHooks).toHaveLength(1);
            expect(signupHooks[0].id).toBe("hook-1");
        });

        it("should enable and disable hooks", () => {
            const config: HookConfig = {
                id: "test-hook",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Welcome!",
                contentTemplate: "Welcome",
            };

            hookManager.registerHook(config);
            hookManager.setHookEnabled("test-hook", false);

            const hooks = hookManager.getHooksForEvent(HookEventType.USER_SIGNUP);
            expect(hooks).toHaveLength(0); // Disabled hooks are filtered out
        });
    });

    describe("Hook Execution", () => {
        it("should trigger hooks for an event", async () => {
            const config: HookConfig = {
                id: "test-hook",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Welcome {{userName}}!",
                contentTemplate: "Welcome to the platform, {{userName}}",
            };

            hookManager.registerHook(config);

            const eventData: HookEventData = {
                eventType: HookEventType.USER_SIGNUP,
                userId: "test-user",
                data: { userName: "John Doe" },
            };

            const results = await hookManager.triggerEvent(eventData);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(true);
            expect(results[0].hookId).toBe("test-hook");
            expect(mockNotificationService.createNotificationCalls).toHaveLength(1);
            expect(mockNotificationService.createNotificationCalls[0].userId).toBe("test-user");
            expect(mockNotificationService.createNotificationCalls[0].title).toBe("Welcome John Doe!");
            expect(mockNotificationService.createNotificationCalls[0].content).toBe("Welcome to the platform, John Doe");
        });

        it("should render templates with event data", async () => {
            const config: HookConfig = {
                id: "test-hook",
                eventType: HookEventType.AI_TASK_COMPLETED,
                enabled: true,
                notificationType: NotificationType.TASK_COMPLETION,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "{{taskName}} completed",
                contentTemplate: "Your {{taskName}} has finished",
                actionUrlTemplate: "/results/{{taskId}}",
                actionText: "View Result",
            };

            hookManager.registerHook(config);

            const eventData: HookEventData = {
                eventType: HookEventType.AI_TASK_COMPLETED,
                userId: "test-user",
                data: { taskName: "Blog Post", taskId: "123" },
            };

            await hookManager.triggerEvent(eventData);

            expect(mockNotificationService.createNotificationCalls).toHaveLength(1);
            const call = mockNotificationService.createNotificationCalls[0];
            expect(call.title).toBe("Blog Post completed");
            expect(call.content).toBe("Your Blog Post has finished");
            expect(call.actionUrl).toBe("/results/123");
            expect(call.actionText).toBe("View Result");
        });

        it("should handle multiple hooks for same event", async () => {
            const config1: HookConfig = {
                id: "hook-1",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Welcome!",
                contentTemplate: "Welcome",
            };

            const config2: HookConfig = {
                id: "hook-2",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.EMAIL],
                titleTemplate: "Welcome Email",
                contentTemplate: "Welcome email content",
            };

            hookManager.registerHook(config1);
            hookManager.registerHook(config2);

            const eventData: HookEventData = {
                eventType: HookEventType.USER_SIGNUP,
                userId: "test-user",
                data: {},
            };

            const results = await hookManager.triggerEvent(eventData);

            expect(results).toHaveLength(2);
            expect(mockNotificationService.createNotificationCalls).toHaveLength(2);
        });

        it("should return empty array for events with no hooks", async () => {
            const eventData: HookEventData = {
                eventType: HookEventType.USER_SIGNUP,
                userId: "test-user",
                data: {},
            };

            const results = await hookManager.triggerEvent(eventData);

            expect(results).toHaveLength(0);
        });

        it("should handle hook execution errors gracefully", async () => {
            mockNotificationService.shouldFail = true;

            const config: HookConfig = {
                id: "test-hook",
                eventType: HookEventType.USER_SIGNUP,
                enabled: true,
                notificationType: NotificationType.SYSTEM,
                priority: NotificationPriority.MEDIUM,
                channels: [NotificationChannel.IN_APP],
                titleTemplate: "Welcome!",
                contentTemplate: "Welcome",
            };

            hookManager.registerHook(config);

            const eventData: HookEventData = {
                eventType: HookEventType.USER_SIGNUP,
                userId: "test-user",
                data: {},
            };

            const results = await hookManager.triggerEvent(eventData);

            expect(results).toHaveLength(1);
            expect(results[0].success).toBe(false);
            expect(results[0].error).toBe("Service error");
        });
    });

    describe("Singleton and Convenience Functions", () => {
        it("should return singleton instance", () => {
            const instance1 = getNotificationHookManager();
            const instance2 = getNotificationHookManager();

            expect(instance1).toBe(instance2);
        });

        it("should register user signup hook", () => {
            registerUserSignupHook("test-user");

            const manager = getNotificationHookManager();
            const hook = manager.getHook("user-signup-welcome");

            expect(hook).toBeDefined();
            expect(hook?.eventType).toBe(HookEventType.USER_SIGNUP);
        });

        it("should register AI task completion hook", () => {
            registerAITaskCompletionHook();

            const manager = getNotificationHookManager();
            const hook = manager.getHook("ai-task-completed");

            expect(hook).toBeDefined();
            expect(hook?.eventType).toBe(HookEventType.AI_TASK_COMPLETED);
        });

        it("should register market alert hook", () => {
            registerMarketAlertHook();

            const manager = getNotificationHookManager();
            const hook = manager.getHook("market-alert");

            expect(hook).toBeDefined();
            expect(hook?.eventType).toBe(HookEventType.MARKET_ALERT);
        });
    });
});
