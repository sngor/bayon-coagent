/**
 * Workflow Orchestrator
 * 
 * Decomposes complex requests into sub-tasks, coordinates worker agents,
 * and synthesizes results into cohesive responses.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from './flow-base';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';
import {
  type WorkerTask,
  type WorkerResult,
  type WorkerAgentType,
  createWorkerTask,
  validateWorkerResult,
  isSuccessResult,
  isErrorResult,
} from './worker-protocol';
import { executeDataAnalystWorker } from './flows/data-analyst-worker';
import { executeContentGeneratorWorker } from './flows/content-generator-worker';
import { executeMarketForecasterWorker } from './flows/market-forecaster-worker';

/**
 * Task decomposition output schema
 */
const TaskDecompositionSchema = z.object({
  tasks: z.array(z.object({
    type: z.enum(['data-analyst', 'content-generator', 'market-forecaster', 'search']),
    description: z.string(),
    dependencies: z.array(z.string()).default([]),
    input: z.record(z.any()),
    reasoning: z.string().optional(),
  })).min(2).max(4),
  executionStrategy: z.enum(['sequential', 'parallel', 'mixed']),
  reasoning: z.string(),
});

type TaskDecomposition = z.infer<typeof TaskDecompositionSchema>;

/**
 * Result synthesis output schema
 */
const SynthesisSchema = z.object({
  synthesizedResponse: z.string(),
  keyPoints: z.array(z.string()),
  citations: z.array(z.object({
    url: z.string(),
    title: z.string(),
    sourceType: z.string(),
  })).optional(),
  personalizationApplied: z.object({
    agentNameUsed: z.boolean(),
    marketMentioned: z.boolean(),
    toneMatched: z.boolean(),
  }).optional(),
});

type Synthesis = z.infer<typeof SynthesisSchema>;

/**
 * Workflow execution result
 */
export interface WorkflowExecutionResult {
  synthesizedResponse: string;
  keyPoints: string[];
  citations: Array<{
    url: string;
    title: string;
    sourceType: string;
  }>;
  tasks: WorkerTask[];
  results: WorkerResult[];
  executionTime: number;
  failedTasks: string[];
}

/**
 * Workflow Orchestrator class
 * Manages complex multi-agent workflows
 */
export class WorkflowOrchestrator {
  /**
   * Decomposes a complex request into sub-tasks
   * Requirement 4.1: Decompose request into 2-4 distinct sub-tasks
   * 
   * @param prompt User's complex request
   * @param agentProfile Agent profile for context
   * @returns Array of worker tasks
   */
  async decomposeRequest(
    prompt: string,
    agentProfile?: AgentProfile
  ): Promise<WorkerTask[]> {
    // Create decomposition prompt
    const decompositionPrompt = definePrompt({
      name: 'workflowDecomposition',
      inputSchema: z.object({
        prompt: z.string(),
        agentProfile: z.any().optional(),
      }),
      outputSchema: TaskDecompositionSchema,
      options: MODEL_CONFIGS.ANALYTICAL,
      systemPrompt: `You are a workflow orchestration expert for a real estate AI assistant. Your role is to analyze complex user requests and break them down into 2-4 specialized sub-tasks.

**Available Worker Agents:**
1. **data-analyst**: Handles data analysis, market research, property data, statistical analysis
   - Use for: market trends, property comparisons, data gathering, statistical insights
   
2. **content-generator**: Creates personalized content with agent branding
   - Use for: emails, listings, summaries, marketing copy, social posts
   
3. **market-forecaster**: Generates market forecasts with qualifying language
   - Use for: market predictions, trend forecasting, investment projections
   
4. **search**: Performs web searches (currently placeholder)
   - Use for: general information gathering

**Decomposition Rules:**
- MUST create between 2 and 4 sub-tasks (no more, no less)
- Each task must be assigned to the most appropriate worker agent
- Tasks can have dependencies (sequential) or run in parallel
- Provide clear, specific descriptions for each task
- Include all necessary input data for each worker
- Consider the agent's profile for personalization tasks

**Execution Strategies:**
- **sequential**: Tasks must run in order (each depends on previous)
- **parallel**: All tasks can run simultaneously
- **mixed**: Some tasks parallel, some sequential (use dependencies)

**Guidelines:**
- Break down complex requests into logical components
- Avoid creating redundant or overlapping tasks
- Ensure each task has a clear, single purpose
- Consider data flow between tasks
- Prioritize efficiency while maintaining quality`,
      prompt: `Analyze this user request and decompose it into 2-4 specialized sub-tasks:

**User Request:**
{{{prompt}}}

**Agent Profile Context:**
{{{json agentProfile}}}

Provide:
1. An array of 2-4 tasks, each with:
   - type: The worker agent type
   - description: Clear task description
   - dependencies: Array of task indices that must complete first (empty for parallel)
   - input: All necessary input data for the worker
   - reasoning: Why this task is needed (optional)

2. executionStrategy: 'sequential', 'parallel', or 'mixed'

3. reasoning: Explanation of your decomposition approach

Remember: You MUST create between 2 and 4 tasks. No more, no less.`,
    });

    // Execute decomposition
    const decomposition = await decompositionPrompt({
      prompt,
      agentProfile: agentProfile || null,
    });

    // Validate task count (requirement 4.1)
    if (decomposition.tasks.length < 2 || decomposition.tasks.length > 4) {
      throw new Error(
        `Task decomposition must produce 2-4 tasks, got ${decomposition.tasks.length}`
      );
    }

    // Convert to WorkerTask objects
    const workerTasks: WorkerTask[] = decomposition.tasks.map((task, index) => {
      // Convert numeric dependencies to task IDs (will be set after creation)
      const taskId = `task_${Date.now()}_${index}`;
      
      return createWorkerTask(
        task.type,
        task.description,
        task.input,
        {
          dependencies: (task.dependencies || []).map(depIndex => `task_${Date.now()}_${depIndex}`),
          context: {
            userId: agentProfile?.userId,
            agentProfile,
          },
        }
      );
    });

    return workerTasks;
  }

  /**
   * Executes a workflow of tasks
   * Handles both sequential and parallel execution based on dependencies
   * Requirement 4.5: Handle worker failures gracefully
   * 
   * @param tasks Array of worker tasks to execute
   * @returns Array of worker results
   */
  async executeWorkflow(tasks: WorkerTask[]): Promise<WorkerResult[]> {
    const results: WorkerResult[] = [];
    const taskMap = new Map<string, WorkerTask>(tasks.map(t => [t.id, t]));
    const resultMap = new Map<string, WorkerResult>();
    const executedTasks = new Set<string>();

    // Helper to check if all dependencies are completed
    const areDependenciesMet = (task: WorkerTask): boolean => {
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }
      return task.dependencies.every(depId => executedTasks.has(depId));
    };

    // Helper to execute a single task
    const executeTask = async (task: WorkerTask): Promise<WorkerResult> => {
      try {
        // Update task status
        task.status = 'in-progress';

        // Route to appropriate worker agent
        let result: WorkerResult;
        
        switch (task.type) {
          case 'data-analyst':
            result = await executeDataAnalystWorker(task);
            break;
            
          case 'content-generator':
            result = await executeContentGeneratorWorker(task);
            break;
            
          case 'market-forecaster':
            result = await executeMarketForecasterWorker(task);
            break;
            
          case 'search':
            // Placeholder for search worker
            result = {
              taskId: task.id,
              workerType: 'search',
              status: 'error',
              error: {
                type: 'INTERNAL_ERROR',
                message: 'Search worker not yet implemented',
                timestamp: new Date().toISOString(),
              },
              metadata: {
                executionTime: 0,
                startedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
              },
            };
            break;
            
          default:
            throw new Error(`Unknown worker type: ${task.type}`);
        }

        // Validate result structure (requirement 9.4)
        validateWorkerResult(result);

        // Update task status
        task.status = result.status === 'success' ? 'completed' : 'failed';

        return result;
      } catch (error) {
        // Handle unexpected errors
        task.status = 'failed';
        
        return {
          taskId: task.id,
          workerType: task.type,
          status: 'error',
          error: {
            type: 'INTERNAL_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
          },
          metadata: {
            executionTime: 0,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        };
      }
    };

    // Execute tasks respecting dependencies
    while (executedTasks.size < tasks.length) {
      // Find tasks ready to execute (dependencies met, not yet executed)
      const readyTasks = tasks.filter(
        task => !executedTasks.has(task.id) && areDependenciesMet(task)
      );

      if (readyTasks.length === 0) {
        // No tasks ready - check for circular dependencies or all failed
        const remainingTasks = tasks.filter(task => !executedTasks.has(task.id));
        if (remainingTasks.length > 0) {
          console.error('Circular dependency or all dependencies failed:', remainingTasks);
          
          // Mark remaining tasks as failed
          for (const task of remainingTasks) {
            const failedResult: WorkerResult = {
              taskId: task.id,
              workerType: task.type,
              status: 'error',
              error: {
                type: 'INTERNAL_ERROR',
                message: 'Task dependencies could not be satisfied',
                timestamp: new Date().toISOString(),
              },
              metadata: {
                executionTime: 0,
                startedAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
              },
            };
            results.push(failedResult);
            resultMap.set(task.id, failedResult);
            executedTasks.add(task.id);
          }
        }
        break;
      }

      // Execute ready tasks in parallel
      const taskResults = await Promise.all(
        readyTasks.map(task => executeTask(task))
      );

      // Store results
      for (let i = 0; i < readyTasks.length; i++) {
        const task = readyTasks[i];
        const result = taskResults[i];
        
        results.push(result);
        resultMap.set(task.id, result);
        executedTasks.add(task.id);
      }
    }

    return results;
  }

  /**
   * Synthesizes results from multiple workers into a cohesive response
   * Requirement 4.3: Synthesize results into single cohesive response
   * Requirement 4.4: Ensure synthesis maintains safety guardrails and citations
   * 
   * @param results Array of worker results
   * @param agentProfile Agent profile for personalization
   * @param originalPrompt Original user prompt for context
   * @returns Synthesized response
   */
  async synthesizeResults(
    results: WorkerResult[],
    agentProfile?: AgentProfile,
    originalPrompt?: string
  ): Promise<Synthesis> {
    // Separate successful and failed results
    const successfulResults = results.filter(isSuccessResult);
    const failedResults = results.filter(isErrorResult);

    // If all workers failed, throw error
    if (successfulResults.length === 0) {
      throw new Error(
        'All worker agents failed. Cannot synthesize results.'
      );
    }

    // Collect all citations from successful results
    const allCitations = successfulResults
      .flatMap(result => result.citations || [])
      .filter((citation, index, self) => 
        // Remove duplicates based on URL
        index === self.findIndex(c => c.url === citation.url)
      );

    // Format results for synthesis
    const resultsText = successfulResults.map((result, index) => {
      const output = result.output || {};
      return `
**Result ${index + 1} (${result.workerType}):**
${JSON.stringify(output, null, 2)}

**Citations:**
${(result.citations || []).map(c => `- ${c.title} (${c.url})`).join('\n')}
`;
    }).join('\n---\n');

    // Format failed tasks for context
    const failedTasksText = failedResults.length > 0
      ? `\n**Failed Tasks:**\n${failedResults.map(r => 
          `- ${r.workerType}: ${r.error?.message}`
        ).join('\n')}`
      : '';

    // Create synthesis prompt
    const synthesisPrompt = definePrompt({
      name: 'resultSynthesis',
      inputSchema: z.object({
        originalPrompt: z.string().optional(),
        results: z.string(),
        failedTasks: z.string().optional(),
        agentProfile: z.any().optional(),
        citations: z.array(z.object({
          url: z.string(),
          title: z.string(),
          sourceType: z.string(),
        })),
      }),
      outputSchema: SynthesisSchema,
      options: MODEL_CONFIGS.BALANCED,
      systemPrompt: `You are a synthesis expert for a real estate AI assistant. Your role is to combine results from multiple specialized worker agents into a single, cohesive, personalized response.

**Critical Requirements:**
1. **Maintain Safety Guardrails**: Ensure the synthesized response adheres to all safety constraints
   - Stay within real estate domain
   - Use qualifying language for predictions ("may", "could", "historical trends suggest")
   - No financial guarantees or legal advice
   - No PII collection

2. **Preserve Citations**: Include ALL citations from worker results
   - Format as markdown links: [Source Title](URL)
   - Attribute facts to their sources
   - Maintain source type information

3. **Apply Personalization**: If agent profile provided, incorporate:
   - Agent name naturally in the response
   - Primary market context
   - Preferred tone (warm-consultative, direct-data-driven, professional, casual)
   - Specialization focus

4. **Handle Partial Results**: If some workers failed:
   - Synthesize available results
   - Acknowledge limitations
   - Provide value with partial information

5. **Maintain Quality**:
   - Create a cohesive narrative, not just concatenated results
   - Remove redundancy
   - Prioritize key insights
   - Use clear, professional language

**Tone Guidelines:**
- warm-consultative: Friendly, empathetic, relationship-focused
- direct-data-driven: Factual, analytical, numbers-focused
- professional: Polished, formal, expertise-focused
- casual: Approachable, conversational, relatable`,
      prompt: `Synthesize the following worker results into a cohesive response:

**Original User Request:**
{{{originalPrompt}}}

**Agent Profile:**
{{{json agentProfile}}}

**Worker Results:**
{{{results}}}

{{{failedTasks}}}

**Available Citations:**
{{{json citations}}}

Create a synthesized response that:
1. Combines all successful results into a cohesive narrative
2. Includes ALL citations as markdown links
3. Applies agent personalization (name, market, tone)
4. Uses qualifying language for any predictions
5. Acknowledges any failed tasks if present
6. Provides key takeaways

Provide:
- synthesizedResponse: The complete synthesized response with citations
- keyPoints: Array of 3-5 key takeaways
- citations: Array of all citations used (preserve from input)
- personalizationApplied: Which personalization elements were used`,
    });

    // Execute synthesis
    const synthesis = await synthesisPrompt({
      originalPrompt: originalPrompt || 'User request',
      results: resultsText,
      failedTasks: failedTasksText,
      agentProfile: agentProfile || null,
      citations: allCitations,
    });

    // Ensure citations are preserved
    if (!synthesis.citations || synthesis.citations.length === 0) {
      synthesis.citations = allCitations;
    }

    return synthesis;
  }

  /**
   * Executes a complete workflow from request to synthesized response
   * Main entry point for workflow orchestration
   * 
   * @param prompt User's complex request
   * @param agentProfile Agent profile for personalization
   * @returns Complete workflow execution result
   */
  async executeCompleteWorkflow(
    prompt: string,
    agentProfile?: AgentProfile
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Decompose request into tasks
      const tasks = await this.decomposeRequest(prompt, agentProfile);

      // Step 2: Execute workflow
      const results = await this.executeWorkflow(tasks);

      // Step 3: Synthesize results
      const synthesis = await this.synthesizeResults(
        results,
        agentProfile,
        prompt
      );

      // Collect failed task IDs
      const failedTasks = results
        .filter(isErrorResult)
        .map(r => r.taskId);

      const executionTime = Date.now() - startTime;

      return {
        synthesizedResponse: synthesis.synthesizedResponse,
        keyPoints: synthesis.keyPoints,
        citations: synthesis.citations || [],
        tasks,
        results,
        executionTime,
        failedTasks,
      };
    } catch (error) {
      // If synthesis fails, try to return partial results
      console.error('Workflow execution error:', error);
      throw error;
    }
  }
}

/**
 * Singleton instance
 */
let orchestratorInstance: WorkflowOrchestrator | null = null;

/**
 * Gets the singleton orchestrator instance
 */
export function getWorkflowOrchestrator(): WorkflowOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new WorkflowOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * Resets the orchestrator singleton (useful for testing)
 */
export function resetWorkflowOrchestrator(): void {
  orchestratorInstance = null;
}
