/**
 * Core data structures and types for Guided Workflows feature
 * 
 * This file defines the TypeScript interfaces, enums, and Zod schemas
 * for workflow presets, instances, and state management.
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

/**
 * Workflow categories for organizing workflow presets
 */
export enum WorkflowCategory {
    BRAND_BUILDING = 'brand-building',
    CONTENT_CREATION = 'content-creation',
    MARKET_ANALYSIS = 'market-analysis',
    CLIENT_ACQUISITION = 'client-acquisition',
}

/**
 * Workflow instance status
 */
export enum WorkflowStatus {
    ACTIVE = 'active',
    COMPLETED = 'completed',
    STALE = 'stale',
    ARCHIVED = 'archived',
}

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Definition of a single step within a workflow preset
 */
export interface WorkflowStepDefinition {
    /** Unique identifier for the step */
    id: string;
    /** Display title of the step */
    title: string;
    /** Description of what the step accomplishes */
    description: string;
    /** Next.js route path for the hub page */
    hubRoute: string;
    /** Estimated time to complete in minutes */
    estimatedMinutes: number;
    /** Whether this step can be skipped */
    isOptional: boolean;
    /** Help text explaining the step's purpose */
    helpText: string;
    /** Tips for completing the step effectively */
    tips: string[];
    /** Criteria that defines step completion */
    completionCriteria: string;
    /** Context data keys this step expects as input */
    contextInputs?: string[];
    /** Context data keys this step produces as output */
    contextOutputs?: string[];
}

/**
 * Workflow preset (template) definition
 */
export interface WorkflowPreset {
    /** Unique identifier for the preset */
    id: string;
    /** Display title of the workflow */
    title: string;
    /** Description of what the workflow accomplishes */
    description: string;
    /** Category for organization and filtering */
    category: WorkflowCategory;
    /** Tags for search and discovery */
    tags: string[];
    /** Estimated total time in minutes */
    estimatedMinutes: number;
    /** Whether this workflow is recommended for new users */
    isRecommended: boolean;
    /** Icon name (Lucide icon) */
    icon: string;
    /** Ordered list of steps in the workflow */
    steps: WorkflowStepDefinition[];
    /** Expected outcomes/deliverables */
    outcomes: string[];
    /** Prerequisites or required information */
    prerequisites?: string[];
    /** Required integrations (e.g., 'google-business-profile') */
    requiredIntegrations?: string[];
}

/**
 * Current state of a workflow instance
 */
export interface WorkflowState {
    /** ID of the current step */
    currentStepId: string;
    /** IDs of completed steps */
    completedSteps: string[];
    /** IDs of skipped steps */
    skippedSteps: string[];
    /** Context data passed between steps */
    contextData: Record<string, any>;
    /** Timestamp of last activity */
    lastActiveAt: string;
}

/**
 * Active or completed workflow instance
 */
export interface WorkflowInstance {
    /** Unique identifier for the instance */
    id: string;
    /** User ID who owns this instance */
    userId: string;
    /** ID of the workflow preset being executed */
    presetId: string;
    /** Current status of the workflow */
    status: WorkflowStatus;
    /** ID of the current step */
    currentStepId: string;
    /** IDs of completed steps */
    completedSteps: string[];
    /** IDs of skipped steps */
    skippedSteps: string[];
    /** Context data passed between steps */
    contextData: Record<string, any>;
    /** Timestamp when workflow was started */
    startedAt: string;
    /** Timestamp of last activity */
    lastActiveAt: string;
    /** Timestamp when workflow was completed (if completed) */
    completedAt?: string;
    /** Actual time taken to complete in minutes (if completed) */
    actualMinutes?: number;
}

/**
 * Filter options for querying workflow instances
 */
export interface InstanceFilter {
    /** Filter by status */
    status?: WorkflowStatus;
    /** Filter by preset ID */
    presetId?: string;
    /** Limit number of results */
    limit?: number;
}

/**
 * User profile information for workflow recommendations
 */
export interface UserProfile {
    /** User ID */
    userId: string;
    /** Whether user is new (for recommended workflows) */
    isNewUser?: boolean;
    /** User's interests or focus areas */
    interests?: string[];
    /** Completed workflow preset IDs */
    completedWorkflows?: string[];
}

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Schema for WorkflowCategory enum
 */
export const WorkflowCategorySchema = z.nativeEnum(WorkflowCategory);

/**
 * Schema for WorkflowStatus enum
 */
export const WorkflowStatusSchema = z.nativeEnum(WorkflowStatus);

/**
 * Schema for WorkflowStepDefinition
 */
export const WorkflowStepDefinitionSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    hubRoute: z.string().min(1),
    estimatedMinutes: z.number().int().positive(),
    isOptional: z.boolean(),
    helpText: z.string().min(1),
    tips: z.array(z.string()),
    completionCriteria: z.string().min(1),
    contextInputs: z.array(z.string()).optional(),
    contextOutputs: z.array(z.string()).optional(),
});

/**
 * Schema for WorkflowPreset
 */
export const WorkflowPresetSchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    category: WorkflowCategorySchema,
    tags: z.array(z.string()),
    estimatedMinutes: z.number().int().positive(),
    isRecommended: z.boolean(),
    icon: z.string().min(1),
    steps: z.array(WorkflowStepDefinitionSchema).min(1),
    outcomes: z.array(z.string()).min(1),
    prerequisites: z.array(z.string()).optional(),
    requiredIntegrations: z.array(z.string()).optional(),
});

/**
 * Schema for WorkflowState
 */
export const WorkflowStateSchema = z.object({
    currentStepId: z.string().min(1),
    completedSteps: z.array(z.string()),
    skippedSteps: z.array(z.string()),
    contextData: z.record(z.any()),
    lastActiveAt: z.string().datetime(),
});

/**
 * Schema for WorkflowInstance
 */
export const WorkflowInstanceSchema = z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
    presetId: z.string().min(1),
    status: WorkflowStatusSchema,
    currentStepId: z.string().min(1),
    completedSteps: z.array(z.string()),
    skippedSteps: z.array(z.string()),
    contextData: z.record(z.any()),
    startedAt: z.string().datetime(),
    lastActiveAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    actualMinutes: z.number().int().positive().optional(),
});

/**
 * Schema for InstanceFilter
 */
export const InstanceFilterSchema = z.object({
    status: WorkflowStatusSchema.optional(),
    presetId: z.string().optional(),
    limit: z.number().int().positive().optional(),
});

/**
 * Schema for UserProfile
 */
export const UserProfileSchema = z.object({
    userId: z.string().min(1),
    isNewUser: z.boolean().optional(),
    interests: z.array(z.string()).optional(),
    completedWorkflows: z.array(z.string()).optional(),
});

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid WorkflowCategory
 */
export function isWorkflowCategory(value: unknown): value is WorkflowCategory {
    return Object.values(WorkflowCategory).includes(value as WorkflowCategory);
}

/**
 * Type guard to check if a value is a valid WorkflowStatus
 */
export function isWorkflowStatus(value: unknown): value is WorkflowStatus {
    return Object.values(WorkflowStatus).includes(value as WorkflowStatus);
}

/**
 * Type guard to check if a workflow instance is active
 */
export function isActiveWorkflow(instance: WorkflowInstance): boolean {
    return instance.status === WorkflowStatus.ACTIVE;
}

/**
 * Type guard to check if a workflow instance is completed
 */
export function isCompletedWorkflow(instance: WorkflowInstance): boolean {
    return instance.status === WorkflowStatus.COMPLETED;
}

/**
 * Type guard to check if a workflow instance is stale
 */
export function isStaleWorkflow(instance: WorkflowInstance): boolean {
    return instance.status === WorkflowStatus.STALE;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * Type for creating a new workflow instance (omits generated fields)
 */
export type CreateWorkflowInstanceInput = Omit<
    WorkflowInstance,
    'id' | 'startedAt' | 'lastActiveAt' | 'completedAt' | 'actualMinutes'
>;

/**
 * Type for updating workflow instance state
 */
export type UpdateWorkflowStateInput = Partial<
    Pick<
        WorkflowInstance,
        'currentStepId' | 'completedSteps' | 'skippedSteps' | 'contextData' | 'status'
    >
>;

/**
 * Type for workflow step completion data
 */
export type StepCompletionData = {
    stepId: string;
    contextData?: Record<string, any>;
    timestamp: string;
};
