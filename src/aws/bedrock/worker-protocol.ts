/**
 * Standardized Worker Communication Protocol
 * 
 * This module defines the interfaces and types for communication between
 * the Workflow Orchestrator and Worker Agents.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { z } from 'zod';

/**
 * Worker agent types
 */
export type WorkerAgentType =
  | 'data-analyst'
  | 'content-generator'
  | 'market-forecaster'
  | 'search'
  | 'knowledge-retriever'
  | 'image-analyzer';

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

/**
 * Error types for structured error responses
 */
export type WorkerErrorType =
  | 'VALIDATION_ERROR'
  | 'API_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RESOURCE_NOT_FOUND'
  | 'INTERNAL_ERROR';

/**
 * WorkerTask interface - structured task description with all necessary context
 * Requirement 9.1: Workflow Orchestrator SHALL provide structured task description
 */
export interface WorkerTask {
  /** Unique task identifier */
  id: string;

  /** Type of worker agent to handle this task */
  type: WorkerAgentType;

  /** Human-readable task description */
  description: string;

  /** Task dependencies (IDs of tasks that must complete first) */
  dependencies: string[];

  /** Input data for the worker agent */
  input: Record<string, any>;

  /** Optional context for personalization */
  context?: {
    userId?: string;
    agentProfile?: any;
    conversationId?: string;
  };

  /** Task creation timestamp */
  createdAt: string;

  /** Current task status */
  status: TaskStatus;
}

/**
 * WorkerResult interface - structured response with results and status
 * Requirement 9.2: Worker Agent SHALL return structured response with results and status
 */
export interface WorkerResult {
  /** Task ID this result corresponds to */
  taskId: string;

  /** Worker agent type that produced this result */
  workerType: WorkerAgentType;

  /** Result status */
  status: 'success' | 'error';

  /** Output data from the worker agent */
  output?: Record<string, any>;

  /** Error information if status is 'error' */
  error?: WorkerError;

  /** Execution metadata */
  metadata: {
    /** Execution time in milliseconds */
    executionTime: number;

    /** Timestamp when execution started */
    startedAt: string;

    /** Timestamp when execution completed */
    completedAt: string;

    /** Model used (if applicable) */
    modelId?: string;

    /** Token usage (if applicable) */
    tokensUsed?: number;
  };

  /** Citations or sources used in generating the result */
  citations?: Array<{
    url: string;
    title: string;
    sourceType: string;
  }>;
}

/**
 * WorkerError interface - structured error response
 * Requirement 9.3: Worker Agent SHALL return structured error response with error type and message
 */
export interface WorkerError {
  /** Error type for categorization */
  type: WorkerErrorType;

  /** Human-readable error message */
  message: string;

  /** Error code for programmatic handling */
  code?: string;

  /** Additional error details */
  details?: Record<string, any>;

  /** Stack trace (only in development) */
  stack?: string;

  /** Timestamp when error occurred */
  timestamp: string;
}

/**
 * Zod schemas for validation
 */

export const WorkerTaskSchema = z.object({
  id: z.string(),
  type: z.enum(['data-analyst', 'content-generator', 'market-forecaster', 'search', 'knowledge-retriever']),
  description: z.string(),
  dependencies: z.array(z.string()),
  input: z.record(z.any()),
  context: z.object({
    userId: z.string().optional(),
    agentProfile: z.any().optional(),
    conversationId: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']),
});

export const WorkerErrorSchema = z.object({
  type: z.enum([
    'VALIDATION_ERROR',
    'API_ERROR',
    'TIMEOUT_ERROR',
    'RESOURCE_NOT_FOUND',
    'INTERNAL_ERROR',
  ]),
  message: z.string(),
  code: z.string().optional(),
  details: z.record(z.any()).optional(),
  stack: z.string().optional(),
  timestamp: z.string(),
});

export const WorkerResultSchema = z.object({
  taskId: z.string(),
  workerType: z.enum(['data-analyst', 'content-generator', 'market-forecaster', 'search', 'knowledge-retriever']),
  status: z.enum(['success', 'error']),
  output: z.record(z.any()).optional(),
  error: WorkerErrorSchema.optional(),
  metadata: z.object({
    executionTime: z.number(),
    startedAt: z.string(),
    completedAt: z.string(),
    modelId: z.string().optional(),
    tokensUsed: z.number().optional(),
  }),
  citations: z.array(z.object({
    url: z.string(),
    title: z.string(),
    sourceType: z.string(),
  })).optional(),
});

/**
 * Helper function to create a WorkerTask
 */
export function createWorkerTask(
  type: WorkerAgentType,
  description: string,
  input: Record<string, any>,
  options?: {
    dependencies?: string[];
    context?: WorkerTask['context'];
  }
): WorkerTask {
  return {
    id: generateTaskId(),
    type,
    description,
    dependencies: options?.dependencies || [],
    input,
    context: options?.context,
    createdAt: new Date().toISOString(),
    status: 'pending',
  };
}

/**
 * Helper function to create a successful WorkerResult
 */
export function createSuccessResult(
  taskId: string,
  workerType: WorkerAgentType,
  output: Record<string, any>,
  metadata: {
    executionTime: number;
    startedAt: string;
    modelId?: string;
    tokensUsed?: number;
  },
  citations?: WorkerResult['citations']
): WorkerResult {
  return {
    taskId,
    workerType,
    status: 'success',
    output,
    metadata: {
      ...metadata,
      completedAt: new Date().toISOString(),
    },
    citations,
  };
}

/**
 * Helper function to create an error WorkerResult
 */
export function createErrorResult(
  taskId: string,
  workerType: WorkerAgentType,
  error: Omit<WorkerError, 'timestamp'>,
  metadata: {
    executionTime: number;
    startedAt: string;
  }
): WorkerResult {
  return {
    taskId,
    workerType,
    status: 'error',
    error: {
      ...error,
      timestamp: new Date().toISOString(),
    },
    metadata: {
      ...metadata,
      completedAt: new Date().toISOString(),
    },
  };
}

/**
 * Helper function to validate WorkerTask structure
 * Requirement 9.4: Workflow Orchestrator SHALL validate response structure before synthesis
 */
export function validateWorkerTask(task: unknown): WorkerTask {
  return WorkerTaskSchema.parse(task);
}

/**
 * Helper function to validate WorkerResult structure
 * Requirement 9.4: Workflow Orchestrator SHALL validate response structure before synthesis
 */
export function validateWorkerResult(result: unknown): WorkerResult {
  return WorkerResultSchema.parse(result);
}

/**
 * Generates a unique task ID
 */
function generateTaskId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Type guard to check if a result is successful
 */
export function isSuccessResult(result: WorkerResult): result is WorkerResult & { output: Record<string, any> } {
  return result.status === 'success' && result.output !== undefined;
}

/**
 * Type guard to check if a result is an error
 */
export function isErrorResult(result: WorkerResult): result is WorkerResult & { error: WorkerError } {
  return result.status === 'error' && result.error !== undefined;
}
