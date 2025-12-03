/**
 * Shared Context Pool - Manages shared context for collaborative tasks
 * 
 * This module provides a centralized pool for strands to share context during
 * collaborative task execution. It supports real-time updates and subscriptions.
 * 
 * Requirements: 1.2
 */

import { EventEmitter } from 'events';

/**
 * Shared context data structure
 */
interface SharedContext {
    contextId: string;
    data: any;
    participants: Set<string>; // Strand IDs
    createdAt: string;
    updatedAt: string;
    metadata: Record<string, any>;
}

/**
 * Context update event
 */
interface ContextUpdate {
    contextId: string;
    updates: any;
    updatedBy: string;
    timestamp: string;
}

/**
 * SharedContextPool - Manages shared context for collaborative tasks
 */
export class SharedContextPool extends EventEmitter {
    private contexts: Map<string, SharedContext> = new Map();
    private subscriptions: Map<string, Map<string, (update: any) => void>> = new Map();

    /**
     * Creates a shared context for collaborative tasks
     * 
     * @param contextId - Unique identifier for the context
     * @param initialData - Initial context data
     */
    async createContext(contextId: string, initialData: any): Promise<void> {
        if (this.contexts.has(contextId)) {
            throw new Error(`Context ${contextId} already exists`);
        }

        const context: SharedContext = {
            contextId,
            data: initialData,
            participants: new Set(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {},
        };

        this.contexts.set(contextId, context);
        this.subscriptions.set(contextId, new Map());

        this.emit('context-created', contextId);
    }

    /**
     * Retrieves shared context for a strand
     * 
     * @param contextId - Context identifier
     * @param strandId - Strand requesting the context
     * @returns The context data
     */
    async getContext(contextId: string, strandId: string): Promise<any> {
        const context = this.contexts.get(contextId);

        if (!context) {
            throw new Error(`Context ${contextId} not found`);
        }

        // Add strand as participant if not already
        if (!context.participants.has(strandId)) {
            context.participants.add(strandId);
            this.emit('participant-joined', contextId, strandId);
        }

        return context.data;
    }

    /**
     * Updates shared context with new information
     * 
     * @param contextId - Context identifier
     * @param updates - Updates to apply
     * @param strandId - Strand making the update
     */
    async updateContext(
        contextId: string,
        updates: any,
        strandId: string
    ): Promise<void> {
        const context = this.contexts.get(contextId);

        if (!context) {
            throw new Error(`Context ${contextId} not found`);
        }

        // Verify strand is a participant
        if (!context.participants.has(strandId)) {
            throw new Error(`Strand ${strandId} is not a participant in context ${contextId}`);
        }

        // Apply updates (deep merge)
        context.data = this.deepMerge(context.data, updates);
        context.updatedAt = new Date().toISOString();

        // Create update event
        const updateEvent: ContextUpdate = {
            contextId,
            updates,
            updatedBy: strandId,
            timestamp: context.updatedAt,
        };

        // Notify all subscribers except the updater
        this.notifySubscribers(contextId, updateEvent, strandId);

        this.emit('context-updated', contextId, strandId);
    }

    /**
     * Subscribes a strand to context changes
     * 
     * @param contextId - Context identifier
     * @param strandId - Strand subscribing
     * @param callback - Callback for updates
     */
    subscribe(
        contextId: string,
        strandId: string,
        callback: (update: any) => void
    ): void {
        const contextSubs = this.subscriptions.get(contextId);

        if (!contextSubs) {
            throw new Error(`Context ${contextId} not found`);
        }

        contextSubs.set(strandId, callback);
        this.emit('subscription-added', contextId, strandId);
    }

    /**
     * Unsubscribes a strand from context changes
     * 
     * @param contextId - Context identifier
     * @param strandId - Strand unsubscribing
     */
    unsubscribe(contextId: string, strandId: string): void {
        const contextSubs = this.subscriptions.get(contextId);

        if (contextSubs) {
            contextSubs.delete(strandId);
            this.emit('subscription-removed', contextId, strandId);
        }
    }

    /**
     * Cleans up context after task completion
     * 
     * @param contextId - Context identifier
     */
    async cleanupContext(contextId: string): Promise<void> {
        const context = this.contexts.get(contextId);

        if (!context) {
            return; // Already cleaned up
        }

        // Remove all subscriptions
        this.subscriptions.delete(contextId);

        // Remove context
        this.contexts.delete(contextId);

        this.emit('context-cleaned', contextId);
    }

    /**
     * Gets all participants in a context
     * 
     * @param contextId - Context identifier
     * @returns Array of strand IDs
     */
    getParticipants(contextId: string): string[] {
        const context = this.contexts.get(contextId);
        return context ? Array.from(context.participants) : [];
    }

    /**
     * Checks if a context exists
     * 
     * @param contextId - Context identifier
     * @returns True if context exists
     */
    hasContext(contextId: string): boolean {
        return this.contexts.has(contextId);
    }

    /**
     * Gets context metadata
     * 
     * @param contextId - Context identifier
     * @returns Context metadata
     */
    getMetadata(contextId: string): Record<string, any> | null {
        const context = this.contexts.get(contextId);
        return context ? context.metadata : null;
    }

    /**
     * Updates context metadata
     * 
     * @param contextId - Context identifier
     * @param metadata - Metadata updates
     */
    updateMetadata(contextId: string, metadata: Record<string, any>): void {
        const context = this.contexts.get(contextId);

        if (context) {
            context.metadata = { ...context.metadata, ...metadata };
        }
    }

    /**
     * Notifies subscribers of context updates
     */
    private notifySubscribers(
        contextId: string,
        update: ContextUpdate,
        excludeStrandId: string
    ): void {
        const contextSubs = this.subscriptions.get(contextId);

        if (!contextSubs) {
            return;
        }

        contextSubs.forEach((callback, strandId) => {
            // Don't notify the strand that made the update
            if (strandId !== excludeStrandId) {
                try {
                    callback(update);
                } catch (error) {
                    console.error(`Error notifying strand ${strandId}:`, error);
                }
            }
        });
    }

    /**
     * Deep merges two objects
     */
    private deepMerge(target: any, source: any): any {
        if (typeof target !== 'object' || target === null) {
            return source;
        }

        if (typeof source !== 'object' || source === null) {
            return source;
        }

        const result = Array.isArray(target) ? [...target] : { ...target };

        Object.keys(source).forEach(key => {
            if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(result[key], source[key]);
            } else {
                result[key] = source[key];
            }
        });

        return result;
    }

    /**
     * Gets statistics about the context pool
     */
    getStats(): {
        totalContexts: number;
        totalParticipants: number;
        totalSubscriptions: number;
    } {
        let totalParticipants = 0;
        let totalSubscriptions = 0;

        this.contexts.forEach(context => {
            totalParticipants += context.participants.size;
        });

        this.subscriptions.forEach(subs => {
            totalSubscriptions += subs.size;
        });

        return {
            totalContexts: this.contexts.size,
            totalParticipants,
            totalSubscriptions,
        };
    }
}

/**
 * Singleton instance
 */
let sharedContextPoolInstance: SharedContextPool | null = null;

/**
 * Get the singleton SharedContextPool instance
 */
export function getSharedContextPool(): SharedContextPool {
    if (!sharedContextPoolInstance) {
        sharedContextPoolInstance = new SharedContextPool();
    }
    return sharedContextPoolInstance;
}

/**
 * Reset the SharedContextPool singleton (useful for testing)
 */
export function resetSharedContextPool(): void {
    if (sharedContextPoolInstance) {
        sharedContextPoolInstance.removeAllListeners();
    }
    sharedContextPoolInstance = null;
}
