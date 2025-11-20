/**
 * Worker Agents Index
 * 
 * Exports all worker agents and the standardized communication protocol.
 * Worker agents are specialized AI components that handle specific sub-tasks
 * within the workflow orchestration system.
 */

// Worker Protocol
export {
  type WorkerTask,
  type WorkerResult,
  type WorkerError,
  type WorkerAgentType,
  type TaskStatus,
  type WorkerErrorType,
  WorkerTaskSchema,
  WorkerResultSchema,
  WorkerErrorSchema,
  createWorkerTask,
  createSuccessResult,
  createErrorResult,
  validateWorkerTask,
  validateWorkerResult,
  isSuccessResult,
  isErrorResult,
} from '../worker-protocol';

// Data Analyst Worker
export {
  executeDataAnalystWorker,
  analyzeData,
  type DataAnalystInput,
  type DataAnalystOutput,
} from '../flows/data-analyst-worker';

// Content Generator Worker
export {
  executeContentGeneratorWorker,
  generateContent,
  type ContentGeneratorInput,
  type ContentGeneratorOutput,
} from '../flows/content-generator-worker';

// Market Forecaster Worker
export {
  executeMarketForecasterWorker,
  forecastMarket,
  type MarketForecasterInput,
  type MarketForecasterOutput,
} from '../flows/market-forecaster-worker';

/**
 * Worker agent executor map
 * Maps worker agent types to their execution functions
 */
export const WORKER_EXECUTORS = {
  'data-analyst': executeDataAnalystWorker,
  'content-generator': executeContentGeneratorWorker,
  'market-forecaster': executeMarketForecasterWorker,
} as const;

/**
 * Executes a worker task based on its type
 * 
 * @param task - Worker task to execute
 * @returns Worker result
 */
export async function executeWorkerTask(task: WorkerTask): Promise<WorkerResult> {
  const executor = WORKER_EXECUTORS[task.type];
  
  if (!executor) {
    throw new Error(`Unknown worker type: ${task.type}`);
  }
  
  return executor(task);
}
