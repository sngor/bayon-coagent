/**
 * Dependency Tracker - Manages task dependencies and execution order
 * 
 * This module tracks dependencies between tasks and ensures proper execution order.
 * It prevents tasks from executing before their dependencies are complete.
 * 
 * Requirements: 1.4
 */

/**
 * Task dependency information
 */
interface TaskDependency {
    taskId: string;
    dependencies: string[];
    completed: boolean;
    completedAt?: string;
}

/**
 * Dependency graph node
 */
interface DependencyNode {
    taskId: string;
    dependencies: string[];
    dependents: string[];
    completed: boolean;
}

/**
 * Dependency graph structure
 */
export interface DependencyGraph {
    nodes: Map<string, DependencyNode>;
    roots: string[]; // Tasks with no dependencies
    leaves: string[]; // Tasks with no dependents
}

/**
 * DependencyTracker - Manages task dependencies
 */
export class DependencyTracker {
    private tasks: Map<string, TaskDependency> = new Map();
    private dependents: Map<string, Set<string>> = new Map(); // taskId -> tasks that depend on it

    /**
     * Registers task dependencies
     * 
     * @param taskId - Task identifier
     * @param dependencies - Array of task IDs this task depends on
     */
    registerDependencies(taskId: string, dependencies: string[]): void {
        // Validate no circular dependencies
        if (this.wouldCreateCycle(taskId, dependencies)) {
            throw new Error(`Circular dependency detected for task ${taskId}`);
        }

        // Register the task
        this.tasks.set(taskId, {
            taskId,
            dependencies: [...dependencies],
            completed: false,
        });

        // Update dependents map
        dependencies.forEach(depId => {
            if (!this.dependents.has(depId)) {
                this.dependents.set(depId, new Set());
            }
            this.dependents.get(depId)!.add(taskId);
        });
    }

    /**
     * Checks if all dependencies are satisfied
     * 
     * @param taskId - Task identifier
     * @returns True if all dependencies are complete
     */
    areDependenciesSatisfied(taskId: string): boolean {
        const task = this.tasks.get(taskId);

        if (!task) {
            // Task not registered, assume no dependencies
            return true;
        }

        // Check if all dependencies are completed
        return task.dependencies.every(depId => {
            const depTask = this.tasks.get(depId);
            return depTask?.completed === true;
        });
    }

    /**
     * Marks a task as completed
     * 
     * @param taskId - Task identifier
     */
    markCompleted(taskId: string): void {
        const task = this.tasks.get(taskId);

        if (task) {
            task.completed = true;
            task.completedAt = new Date().toISOString();
        }
    }

    /**
     * Gets tasks ready for execution
     * 
     * @returns Array of task IDs that can be executed now
     */
    getReadyTasks(): string[] {
        const ready: string[] = [];

        this.tasks.forEach((task, taskId) => {
            if (!task.completed && this.areDependenciesSatisfied(taskId)) {
                ready.push(taskId);
            }
        });

        return ready;
    }

    /**
     * Builds dependency graph for visualization
     * 
     * @returns Dependency graph structure
     */
    buildDependencyGraph(): DependencyGraph {
        const nodes = new Map<string, DependencyNode>();
        const roots: string[] = [];
        const leaves: string[] = [];

        // Build nodes
        this.tasks.forEach((task, taskId) => {
            const dependents = Array.from(this.dependents.get(taskId) || []);

            nodes.set(taskId, {
                taskId,
                dependencies: [...task.dependencies],
                dependents,
                completed: task.completed,
            });

            // Identify roots (no dependencies)
            if (task.dependencies.length === 0) {
                roots.push(taskId);
            }

            // Identify leaves (no dependents)
            if (dependents.length === 0) {
                leaves.push(taskId);
            }
        });

        return { nodes, roots, leaves };
    }

    /**
     * Gets all dependencies for a task (including transitive)
     * 
     * @param taskId - Task identifier
     * @returns Array of all dependency task IDs
     */
    getAllDependencies(taskId: string): string[] {
        const visited = new Set<string>();
        const result: string[] = [];

        const traverse = (id: string) => {
            if (visited.has(id)) {
                return;
            }
            visited.add(id);

            const task = this.tasks.get(id);
            if (task) {
                task.dependencies.forEach(depId => {
                    result.push(depId);
                    traverse(depId);
                });
            }
        };

        traverse(taskId);
        return result;
    }

    /**
     * Gets all dependents for a task (including transitive)
     * 
     * @param taskId - Task identifier
     * @returns Array of all dependent task IDs
     */
    getAllDependents(taskId: string): string[] {
        const visited = new Set<string>();
        const result: string[] = [];

        const traverse = (id: string) => {
            if (visited.has(id)) {
                return;
            }
            visited.add(id);

            const deps = this.dependents.get(id);
            if (deps) {
                deps.forEach(depId => {
                    result.push(depId);
                    traverse(depId);
                });
            }
        };

        traverse(taskId);
        return result;
    }

    /**
     * Checks if adding dependencies would create a cycle
     */
    private wouldCreateCycle(taskId: string, newDependencies: string[]): boolean {
        // Check if any of the new dependencies already depend on this task
        return newDependencies.some(depId => {
            const allDeps = this.getAllDependents(depId);
            return allDeps.includes(taskId);
        });
    }

    /**
     * Gets task status
     * 
     * @param taskId - Task identifier
     * @returns Task dependency information
     */
    getTaskStatus(taskId: string): TaskDependency | null {
        return this.tasks.get(taskId) || null;
    }

    /**
     * Removes a task from tracking
     * 
     * @param taskId - Task identifier
     */
    removeTask(taskId: string): void {
        const task = this.tasks.get(taskId);

        if (task) {
            // Remove from dependents map
            task.dependencies.forEach(depId => {
                const deps = this.dependents.get(depId);
                if (deps) {
                    deps.delete(taskId);
                    if (deps.size === 0) {
                        this.dependents.delete(depId);
                    }
                }
            });

            // Remove the task
            this.tasks.delete(taskId);
        }
    }

    /**
     * Clears all tracked tasks
     */
    clear(): void {
        this.tasks.clear();
        this.dependents.clear();
    }

    /**
     * Gets statistics about tracked tasks
     */
    getStats(): {
        totalTasks: number;
        completedTasks: number;
        readyTasks: number;
        blockedTasks: number;
    } {
        let completedTasks = 0;
        let blockedTasks = 0;

        this.tasks.forEach(task => {
            if (task.completed) {
                completedTasks++;
            } else if (!this.areDependenciesSatisfied(task.taskId)) {
                blockedTasks++;
            }
        });

        const readyTasks = this.getReadyTasks().length;

        return {
            totalTasks: this.tasks.size,
            completedTasks,
            readyTasks,
            blockedTasks,
        };
    }

    /**
     * Validates the dependency graph for issues
     * 
     * @returns Array of validation errors
     */
    validate(): string[] {
        const errors: string[] = [];

        // Check for orphaned dependencies
        this.tasks.forEach((task, taskId) => {
            task.dependencies.forEach(depId => {
                if (!this.tasks.has(depId)) {
                    errors.push(`Task ${taskId} depends on non-existent task ${depId}`);
                }
            });
        });

        // Check for cycles (shouldn't happen if registerDependencies works correctly)
        this.tasks.forEach((task, taskId) => {
            const allDeps = this.getAllDependencies(taskId);
            if (allDeps.includes(taskId)) {
                errors.push(`Circular dependency detected involving task ${taskId}`);
            }
        });

        return errors;
    }
}

/**
 * Singleton instance
 */
let dependencyTrackerInstance: DependencyTracker | null = null;

/**
 * Get the singleton DependencyTracker instance
 */
export function getDependencyTracker(): DependencyTracker {
    if (!dependencyTrackerInstance) {
        dependencyTrackerInstance = new DependencyTracker();
    }
    return dependencyTrackerInstance;
}

/**
 * Reset the DependencyTracker singleton (useful for testing)
 */
export function resetDependencyTracker(): void {
    dependencyTrackerInstance = null;
}
