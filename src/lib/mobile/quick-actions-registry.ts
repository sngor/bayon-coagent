/**
 * Quick Actions Registry
 * 
 * Manages configurable quick actions for mobile agents:
 * - Action registry with customizable shortcuts
 * - Recent actions tracking with localStorage
 * - Usage analytics for action prioritization
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import { LucideIcon } from 'lucide-react';

export interface QuickActionDefinition {
    id: string;
    label: string;
    description: string;
    icon: string; // Icon name from lucide-react
    route?: string; // Navigation route
    action?: string; // Server action name
    category: 'capture' | 'content' | 'market' | 'client' | 'tools';
    requiresOnline?: boolean;
    badge?: number;
}

export interface QuickActionUsage {
    actionId: string;
    lastUsed: number;
    usageCount: number;
}

export interface QuickActionConfig {
    userId: string;
    pinnedActions: string[]; // Action IDs
    recentActions: QuickActionUsage[];
    customActions: QuickActionDefinition[];
}

const STORAGE_KEY_PREFIX = 'quick_actions_';
const MAX_RECENT_ACTIONS = 10;

// Default quick actions available to all users
export const DEFAULT_QUICK_ACTIONS: QuickActionDefinition[] = [
    {
        id: 'quick-capture',
        label: 'Quick Capture',
        description: 'Capture property details with camera or voice',
        icon: 'Camera',
        route: '/mobile/capture',
        category: 'capture',
        requiresOnline: false,
    },
    {
        id: 'create-content',
        label: 'Create Content',
        description: 'Generate marketing content',
        icon: 'PenTool',
        route: '/studio/write',
        category: 'content',
        requiresOnline: true,
    },
    {
        id: 'voice-note',
        label: 'Voice Note',
        description: 'Record a quick voice note',
        icon: 'Mic',
        route: '/mobile/voice-note',
        category: 'capture',
        requiresOnline: false,
    },
    {
        id: 'quick-share',
        label: 'Quick Share',
        description: 'Share property via QR or SMS',
        icon: 'Share2',
        route: '/mobile/share',
        category: 'client',
        requiresOnline: true,
    },
    {
        id: 'market-data',
        label: 'Market Data',
        description: 'Check market insights',
        icon: 'TrendingUp',
        route: '/market/insights',
        category: 'market',
        requiresOnline: true,
    },
    {
        id: 'calculator',
        label: 'Calculator',
        description: 'Mortgage calculator',
        icon: 'Calculator',
        route: '/tools/calculator',
        category: 'tools',
        requiresOnline: false,
    },
    {
        id: 'view-calendar',
        label: 'Calendar',
        description: 'View your schedule',
        icon: 'Calendar',
        route: '/dashboard?tab=schedule',
        category: 'client',
        requiresOnline: true,
    },
    {
        id: 'property-search',
        label: 'Property Search',
        description: 'Search MLS listings',
        icon: 'Search',
        route: '/market/search',
        category: 'market',
        requiresOnline: true,
    },
    {
        id: 'client-list',
        label: 'Clients',
        description: 'View client list',
        icon: 'Users',
        route: '/clients',
        category: 'client',
        requiresOnline: true,
    },
    {
        id: 'library',
        label: 'Library',
        description: 'Access saved content',
        icon: 'FolderOpen',
        route: '/library/content',
        category: 'content',
        requiresOnline: true,
    },
];

export class QuickActionsRegistry {
    private static instance: QuickActionsRegistry;
    private config: QuickActionConfig | null = null;
    private userId: string | null = null;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.initialize();
        }
    }

    static getInstance(): QuickActionsRegistry {
        if (!QuickActionsRegistry.instance) {
            QuickActionsRegistry.instance = new QuickActionsRegistry();
        }
        return QuickActionsRegistry.instance;
    }

    /**
     * Initialize registry for a user
     */
    initialize(userId?: string): void {
        if (userId) {
            this.userId = userId;
            this.loadConfig();
        }
    }

    /**
     * Get all available actions
     */
    getAllActions(): QuickActionDefinition[] {
        if (!this.config) {
            return DEFAULT_QUICK_ACTIONS;
        }

        return [...DEFAULT_QUICK_ACTIONS, ...this.config.customActions];
    }

    /**
     * Get pinned actions
     */
    getPinnedActions(): QuickActionDefinition[] {
        if (!this.config) {
            // Return default pinned actions
            return DEFAULT_QUICK_ACTIONS.slice(0, 6);
        }

        const allActions = this.getAllActions();
        return this.config.pinnedActions
            .map(id => allActions.find(a => a.id === id))
            .filter((a): a is QuickActionDefinition => a !== undefined);
    }

    /**
     * Get recent actions sorted by usage
     * Requirement 2.3: Remember recently used actions and prioritize them
     */
    getRecentActions(limit: number = 5): QuickActionDefinition[] {
        if (!this.config || this.config.recentActions.length === 0) {
            return [];
        }

        const allActions = this.getAllActions();

        // Sort by usage count (descending) and last used (descending)
        const sortedRecent = [...this.config.recentActions].sort((a, b) => {
            // Primary sort: usage count
            if (b.usageCount !== a.usageCount) {
                return b.usageCount - a.usageCount;
            }
            // Secondary sort: last used
            return b.lastUsed - a.lastUsed;
        });

        return sortedRecent
            .slice(0, limit)
            .map(usage => allActions.find(a => a.id === usage.actionId))
            .filter((a): a is QuickActionDefinition => a !== undefined);
    }

    /**
     * Get prioritized actions (combines pinned and recent)
     * Requirement 2.3: Prioritize frequently used actions
     */
    getPrioritizedActions(limit: number = 8): QuickActionDefinition[] {
        const pinned = this.getPinnedActions();
        const recent = this.getRecentActions();

        // Combine pinned and recent, removing duplicates
        const seen = new Set<string>();
        const prioritized: QuickActionDefinition[] = [];

        // Add pinned first
        for (const action of pinned) {
            if (!seen.has(action.id)) {
                prioritized.push(action);
                seen.add(action.id);
            }
        }

        // Add recent if not already included
        for (const action of recent) {
            if (!seen.has(action.id) && prioritized.length < limit) {
                prioritized.push(action);
                seen.add(action.id);
            }
        }

        // Fill remaining slots with default actions
        if (prioritized.length < limit) {
            for (const action of DEFAULT_QUICK_ACTIONS) {
                if (!seen.has(action.id) && prioritized.length < limit) {
                    prioritized.push(action);
                    seen.add(action.id);
                }
            }
        }

        return prioritized.slice(0, limit);
    }

    /**
     * Get actions by category
     */
    getActionsByCategory(category: QuickActionDefinition['category']): QuickActionDefinition[] {
        return this.getAllActions().filter(a => a.category === category);
    }

    /**
     * Track action usage
     * Requirement 2.2: Track action execution
     */
    trackActionUsage(actionId: string): void {
        if (!this.config) {
            this.config = this.createDefaultConfig();
        }

        const existingIndex = this.config.recentActions.findIndex(
            a => a.actionId === actionId
        );

        if (existingIndex >= 0) {
            // Update existing usage
            this.config.recentActions[existingIndex].usageCount++;
            this.config.recentActions[existingIndex].lastUsed = Date.now();
        } else {
            // Add new usage
            this.config.recentActions.push({
                actionId,
                lastUsed: Date.now(),
                usageCount: 1,
            });
        }

        // Keep only the most recent actions
        if (this.config.recentActions.length > MAX_RECENT_ACTIONS) {
            // Sort by last used and keep top N
            this.config.recentActions.sort((a, b) => b.lastUsed - a.lastUsed);
            this.config.recentActions = this.config.recentActions.slice(0, MAX_RECENT_ACTIONS);
        }

        this.saveConfig();
        this.dispatchUsageEvent(actionId);
    }

    /**
     * Pin an action
     */
    pinAction(actionId: string): void {
        if (!this.config) {
            this.config = this.createDefaultConfig();
        }

        if (!this.config.pinnedActions.includes(actionId)) {
            this.config.pinnedActions.push(actionId);
            this.saveConfig();
            this.dispatchConfigUpdated();
        }
    }

    /**
     * Unpin an action
     */
    unpinAction(actionId: string): void {
        if (!this.config) {
            return;
        }

        this.config.pinnedActions = this.config.pinnedActions.filter(
            id => id !== actionId
        );
        this.saveConfig();
        this.dispatchConfigUpdated();
    }

    /**
     * Toggle pin status
     */
    togglePin(actionId: string): boolean {
        if (!this.config) {
            this.config = this.createDefaultConfig();
        }

        const isPinned = this.config.pinnedActions.includes(actionId);

        if (isPinned) {
            this.unpinAction(actionId);
        } else {
            this.pinAction(actionId);
        }

        return !isPinned;
    }

    /**
     * Check if action is pinned
     */
    isPinned(actionId: string): boolean {
        return this.config?.pinnedActions.includes(actionId) ?? false;
    }

    /**
     * Add custom action
     */
    addCustomAction(action: QuickActionDefinition): void {
        if (!this.config) {
            this.config = this.createDefaultConfig();
        }

        // Check if action already exists
        const exists = this.config.customActions.some(a => a.id === action.id);
        if (!exists) {
            this.config.customActions.push(action);
            this.saveConfig();
            this.dispatchConfigUpdated();
        }
    }

    /**
     * Remove custom action
     */
    removeCustomAction(actionId: string): void {
        if (!this.config) {
            return;
        }

        this.config.customActions = this.config.customActions.filter(
            a => a.id !== actionId
        );

        // Also remove from pinned if present
        this.config.pinnedActions = this.config.pinnedActions.filter(
            id => id !== actionId
        );

        this.saveConfig();
        this.dispatchConfigUpdated();
    }

    /**
     * Get usage analytics
     */
    getUsageAnalytics(): {
        totalActions: number;
        mostUsedAction: QuickActionUsage | null;
        recentActions: QuickActionUsage[];
    } {
        if (!this.config || this.config.recentActions.length === 0) {
            return {
                totalActions: 0,
                mostUsedAction: null,
                recentActions: [],
            };
        }

        const totalActions = this.config.recentActions.reduce(
            (sum, a) => sum + a.usageCount,
            0
        );

        const mostUsedAction = [...this.config.recentActions].sort(
            (a, b) => b.usageCount - a.usageCount
        )[0];

        return {
            totalActions,
            mostUsedAction,
            recentActions: [...this.config.recentActions],
        };
    }

    /**
     * Reset usage analytics
     */
    resetAnalytics(): void {
        if (!this.config) {
            return;
        }

        this.config.recentActions = [];
        this.saveConfig();
        this.dispatchConfigUpdated();
    }

    // ============================================================================
    // Storage Management
    // ============================================================================

    private getStorageKey(): string {
        return `${STORAGE_KEY_PREFIX}${this.userId || 'default'}`;
    }

    private loadConfig(): void {
        try {
            const stored = localStorage.getItem(this.getStorageKey());
            if (stored) {
                this.config = JSON.parse(stored);
            } else {
                this.config = this.createDefaultConfig();
            }
        } catch (error) {
            console.error('Failed to load quick actions config:', error);
            this.config = this.createDefaultConfig();
        }
    }

    private saveConfig(): void {
        if (!this.config) {
            return;
        }

        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(this.config));
        } catch (error) {
            console.error('Failed to save quick actions config:', error);
        }
    }

    private createDefaultConfig(): QuickActionConfig {
        return {
            userId: this.userId || 'default',
            pinnedActions: DEFAULT_QUICK_ACTIONS.slice(0, 6).map(a => a.id),
            recentActions: [],
            customActions: [],
        };
    }

    // ============================================================================
    // Event Dispatchers
    // ============================================================================

    private dispatchUsageEvent(actionId: string): void {
        if (typeof window === 'undefined') return;

        window.dispatchEvent(
            new CustomEvent('quick-actions:usage', {
                detail: { actionId, timestamp: Date.now() },
            })
        );
    }

    private dispatchConfigUpdated(): void {
        if (typeof window === 'undefined') return;

        window.dispatchEvent(
            new CustomEvent('quick-actions:config-updated', {
                detail: { config: this.config },
            })
        );
    }
}

// Export singleton instance
export const quickActionsRegistry = QuickActionsRegistry.getInstance();
