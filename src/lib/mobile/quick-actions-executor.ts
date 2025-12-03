/**
 * Quick Actions Executor
 * 
 * Executes quick actions by integrating with:
 * - Navigation (client-side routing)
 * - Server actions (form submissions, data mutations)
 * - Offline queue (when disconnected)
 * 
 * Requirements: 2.2
 */

import { quickActionsRegistry, type QuickActionDefinition } from './quick-actions-registry';
import { offlineQueue } from './offline-queue';

export interface ActionExecutionResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}

export interface ActionExecutionContext {
    isOnline: boolean;
    userId?: string;
    currentRoute?: string;
}

export class QuickActionsExecutor {
    private static instance: QuickActionsExecutor;
    private context: ActionExecutionContext = {
        isOnline: true,
    };

    private constructor() {
        if (typeof window !== 'undefined') {
            this.initialize();
        }
    }

    static getInstance(): QuickActionsExecutor {
        if (!QuickActionsExecutor.instance) {
            QuickActionsExecutor.instance = new QuickActionsExecutor();
        }
        return QuickActionsExecutor.instance;
    }

    /**
     * Initialize executor
     */
    private initialize(): void {
        // Monitor online/offline status
        this.context.isOnline = navigator.onLine;

        window.addEventListener('online', () => {
            this.context.isOnline = true;
        });

        window.addEventListener('offline', () => {
            this.context.isOnline = false;
        });
    }

    /**
     * Set execution context
     */
    setContext(context: Partial<ActionExecutionContext>): void {
        this.context = { ...this.context, ...context };
    }

    /**
     * Execute a quick action
     * Requirement 2.2: Launch corresponding workflow with mobile-optimized UI
     */
    async executeAction(
        actionId: string,
        params?: Record<string, any>
    ): Promise<ActionExecutionResult> {
        const registry = quickActionsRegistry;
        const allActions = registry.getAllActions();
        const action = allActions.find(a => a.id === actionId);

        if (!action) {
            return {
                success: false,
                error: `Action not found: ${actionId}`,
            };
        }

        // Track usage
        registry.trackActionUsage(actionId);

        // Check if action requires online connection
        if (action.requiresOnline && !this.context.isOnline) {
            // Queue for later execution
            await this.queueAction(action, params);
            return {
                success: true,
                message: 'Action queued for when you\'re back online',
            };
        }

        // Execute based on action type
        if (action.route) {
            return this.executeNavigationAction(action, params);
        } else if (action.action) {
            return this.executeServerAction(action, params);
        } else {
            return {
                success: false,
                error: 'Action has no route or server action defined',
            };
        }
    }

    /**
     * Execute navigation action (client-side routing)
     */
    private executeNavigationAction(
        action: QuickActionDefinition,
        params?: Record<string, any>
    ): ActionExecutionResult {
        try {
            let route = action.route!;

            // Append query parameters if provided
            if (params && Object.keys(params).length > 0) {
                const queryString = new URLSearchParams(params).toString();
                route = `${route}?${queryString}`;
            }

            // Dispatch navigation event (will be handled by router)
            this.dispatchNavigationEvent(route);

            return {
                success: true,
                message: `Navigating to ${action.label}`,
                data: { route },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Navigation failed',
            };
        }
    }

    /**
     * Execute server action
     */
    private async executeServerAction(
        action: QuickActionDefinition,
        params?: Record<string, any>
    ): Promise<ActionExecutionResult> {
        try {
            // Dispatch server action event (will be handled by action handler)
            const result = await this.dispatchServerActionEvent(action.action!, params);

            return {
                success: true,
                message: `${action.label} completed`,
                data: result,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Server action failed',
            };
        }
    }

    /**
     * Queue action for offline execution
     */
    private async queueAction(
        action: QuickActionDefinition,
        params?: Record<string, any>
    ): Promise<void> {
        await offlineQueue.addOperation(
            'quick-action',
            action.id,
            {
                action,
                params,
                timestamp: Date.now(),
            }
        );
    }

    /**
     * Execute multiple actions in sequence
     */
    async executeActions(
        actionIds: string[],
        params?: Record<string, any>
    ): Promise<ActionExecutionResult[]> {
        const results: ActionExecutionResult[] = [];

        for (const actionId of actionIds) {
            const result = await this.executeAction(actionId, params);
            results.push(result);

            // Stop on first failure
            if (!result.success) {
                break;
            }

            // Small delay between actions
            await this.delay(100);
        }

        return results;
    }

    /**
     * Check if action can be executed
     */
    canExecuteAction(actionId: string): {
        canExecute: boolean;
        reason?: string;
    } {
        const registry = quickActionsRegistry;
        const allActions = registry.getAllActions();
        const action = allActions.find(a => a.id === actionId);

        if (!action) {
            return {
                canExecute: false,
                reason: 'Action not found',
            };
        }

        if (action.requiresOnline && !this.context.isOnline) {
            return {
                canExecute: false,
                reason: 'This action requires an internet connection',
            };
        }

        return {
            canExecute: true,
        };
    }

    /**
     * Get action execution history
     */
    getExecutionHistory(): Array<{
        actionId: string;
        timestamp: number;
        success: boolean;
    }> {
        // This would be implemented with actual storage
        // For now, return empty array
        return [];
    }

    // ============================================================================
    // Event Dispatchers
    // ============================================================================

    private dispatchNavigationEvent(route: string): void {
        if (typeof window === 'undefined') return;

        window.dispatchEvent(
            new CustomEvent('quick-actions:navigate', {
                detail: { route },
            })
        );
    }

    private async dispatchServerActionEvent(
        actionName: string,
        params?: Record<string, any>
    ): Promise<any> {
        if (typeof window === 'undefined') {
            throw new Error('Server actions can only be executed in browser');
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Server action timeout'));
            }, 30000); // 30 second timeout

            const handler = (e: Event) => {
                const customEvent = e as CustomEvent;
                if (customEvent.detail.actionName === actionName) {
                    clearTimeout(timeout);
                    window.removeEventListener('quick-actions:server-action-complete', handler);

                    if (customEvent.detail.success) {
                        resolve(customEvent.detail.data);
                    } else {
                        reject(new Error(customEvent.detail.error || 'Server action failed'));
                    }
                }
            };

            window.addEventListener('quick-actions:server-action-complete', handler);

            // Dispatch the server action event
            window.dispatchEvent(
                new CustomEvent('quick-actions:server-action', {
                    detail: { actionName, params },
                })
            );
        });
    }

    // ============================================================================
    // Utilities
    // ============================================================================

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const quickActionsExecutor = QuickActionsExecutor.getInstance();
