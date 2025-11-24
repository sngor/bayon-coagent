/**
 * AWS Bedrock Module
 * 
 * Exports the Bedrock client, enhanced multi-agent architecture, and related utilities for AI operations
 */

// Core Bedrock Client
export {
  BedrockClient,
  BedrockError,
  BedrockParseError,
  getBedrockClient,
  resetBedrockClient,
  type InvokeOptions,
  type InvokeStreamOptions,
  type RetryConfig,
  type ImageContent,
} from './client';

// Flow Base and Utilities
export {
  defineFlow,
  definePrompt,
  MODEL_CONFIGS,
  BEDROCK_MODELS,
  formatPromptValue,
  invokeStream,
  mergeFlowOptions,
  type AIFlow,
  type FlowOptions,
  type FlowExecutionOptions,
} from './flow-base';

// Enhanced Multi-Agent Architecture
export {
  getAgentCore,
  resetAgentCore,
  AgentCore,
  type AgentStrand,
  type AgentCapabilities,
  type AgentStrandState,
  type AgentMemory,
  type AgentMetrics,
  type AllocationStrategy,
} from './agent-core';

export {
  DataAnalystStrand,
  ContentGeneratorStrand,
  MarketForecasterStrand,
  createStrandInstance,
} from './agent-strands';

export {
  getEnhancedWorkflowOrchestrator,
  resetEnhancedWorkflowOrchestrator,
  EnhancedWorkflowOrchestrator,
  type EnhancedWorkflowResult,
} from './enhanced-orchestrator';

// Enhanced Integration Layer
export {
  Research,
  Content,
  Market,
  FlowManager,
  type EnhancedFlowOptions,
} from './enhanced-integration';

// Enhanced Flows
export {
  executeEnhancedResearchAgent,
  runEnhancedResearch,
  type EnhancedResearchAgentInput,
  type EnhancedResearchAgentOutput,
} from './flows/enhanced-research-agent';

// Legacy Orchestration (for backward compatibility)
export {
  getWorkflowOrchestrator,
  resetWorkflowOrchestrator,
  WorkflowOrchestrator,
  type WorkflowExecutionResult,
} from './orchestrator';

// Worker Protocol
export {
  createWorkerTask,
  createSuccessResult,
  createErrorResult,
  validateWorkerTask,
  validateWorkerResult,
  isSuccessResult,
  isErrorResult,
  type WorkerTask,
  type WorkerResult,
  type WorkerAgentType,
  type WorkerError,
  type TaskStatus,
} from './worker-protocol';

// Enhanced Schemas
export type {
  EnhancedAgentProfile,
  EnhancedContext,
  EnhancedDataAnalystInput,
  EnhancedDataAnalystOutput,
  EnhancedContentGeneratorInput,
  EnhancedContentGeneratorOutput,
  EnhancedMarketForecasterInput,
  EnhancedMarketForecasterOutput,
  WorkflowCoordination,
  EnhancedWorkflowResult as EnhancedWorkflowResultSchema,
} from '@/ai/schemas/enhanced-workflow-schemas';

// Existing Services and Utilities
export {
  ExecutionLogger,
  createExecutionLogger,
  extractTokenUsage,
  categorizeFlow,
  FlowExecutionLogSchema,
  type FlowExecutionLog,
  type TokenUsage,
  type ExecutionError,
  type ExecutionMetadata,
} from './execution-logger';

export {
  CitationService,
  getCitationService,
  resetCitationService,
  type Citation,
  type CitationSourceType,
  type CitationResult,
  type ValidationOptions,
} from './citation-service';

export {
  CitationRepository,
  getCitationRepository,
  resetCitationRepository,
  type CitationRecord,
  type CitationQueryOptions,
} from './citation-repository';

export {
  ResponseEnhancementService,
  DEFAULT_ENHANCEMENT_CONFIG,
  type ResponseEnhancementConfig,
  type EnhancementResult,
  type ExtractedFact,
  type PredictionStatement,
} from './response-enhancement';

export {
  ParallelSearchAgent,
  createParallelSearchAgent,
  ParallelSearchError,
  type PlatformAPIConfig,
} from './parallel-search-agent';

export {
  VisionAgent,
  getVisionAgent,
  resetVisionAgent,
} from './vision-agent';

export {
  EfficiencyOptimizer,
  DEFAULT_OPTIMIZATION_CONFIG,
  type OptimizationConfig,
  type OptimizationResult,
} from './efficiency-optimizer';
