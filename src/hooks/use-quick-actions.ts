/**
 * React Hook for Quick Actions
 * 
 * Provides easy access to quick actions functionality in React components
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    quickActionsRegistry,
    type QuickActionDefinition,
    type QuickActionUsage,
} from '@/lib/mobile/quick-actions-registry';
import {
    quickActionsExecutor,
    type ActionExecutionResult,
} from '@/lib/mobile/quick-actions-executor';

interface UseQuickActionsProps {
    userId?: string;
    maxActions?: number;
}

interface UseQuickActionsReturn {
    actions: QuickActionDefinition[];
    recentActions: QuickActionDefinition[];
    pinnedActions: QuickActionDefinition[];
    executeAction: (actionId: string, params?: Record<string, any>) => Promise<ActionExecutionResult>;
    togglePin: (actionId: string) => boolean;
    isPinned: (actionId: string) => boolean;
    canExecute: (actionId: string) => { canExecute: boolean; reason?: string };
    analytics: {
        totalActions: number;
        mostUsedAction: QuickActionUsage | null;
        recentActions: QuickActionUsage[];
    };
    refresh: () => void;
}

/**
 * Hook to access quick actions functionality
 * 
 * @example
 * ```tsx
 * const { actions, executeAction, togglePin } = useQuickActions({
 *   userId: user.id,
 *   maxActions: 8,
 * });
 * ```
 */
export function useQuickActions({
    userId,
    maxActions = 8,
}: UseQuickActionsProps = {}): UseQuickActionsReturn {
    const [actions, setActions] = useState<QuickActionDefinition[]>([]);
    const [recentActions, setRecentActions] = useState<QuickActionDefinition[]>([]);
    const [pinnedActions, setPinnedActions] = useState<QuickActionDefinition[]>([]);

    // Initialize registry
    useEffect(() => {
        if (userId) {
            quickActionsRegistry.initialize(userId);
        }
        loadActions();
    }, [userId, maxActions]);

    // Listen for config updates
    useEffect(() => {
        const handleConfigUpdated = () => {
            loadActions();
        };

        const handleUsage = () => {
            loadActions();
        };

        window.addEventListener('quick-actions:config-updated', handleConfigUpdated);
        window.addEventListener('quick-actions:usage', handleUsage);

        return () => {
            window.removeEventListener('quick-actions:config-updated', handleConfigUpdated);
            window.removeEventListener('quick-actions:usage', handleUsage);
        };
    }, [maxActions]);

    const loadActions = useCallback(() => {
        setActions(quickActionsRegistry.getPrioritizedActions(maxActions));
        setRecentActions(quickActionsRegistry.getRecentActions(5));
        setPinnedActions(quickActionsRegistry.getPinnedActions());
    }, [maxActions]);

    const executeAction = useCallback(
        async (actionId: string, params?: Record<string, any>) => {
            return quickActionsExecutor.executeAction(actionId, params);
        },
        []
    );

    const togglePin = useCallback((actionId: string) => {
        return quickActionsRegistry.togglePin(actionId);
    }, []);

    const isPinned = useCallback((actionId: string) => {
        return quickActionsRegistry.isPinned(actionId);
    }, []);

    const canExecute = useCallback((actionId: string) => {
        return quickActionsExecutor.canExecuteAction(actionId);
    }, []);

    const analytics = quickActionsRegistry.getUsageAnalytics();

    const refresh = useCallback(() => {
        loadActions();
    }, [loadActions]);

    return {
        actions,
        recentActions,
        pinnedActions,
        executeAction,
        togglePin,
        isPinned,
        canExecute,
        analytics,
        refresh,
    };
}
