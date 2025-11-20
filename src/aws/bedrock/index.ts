/**
 * AWS Bedrock Module
 * 
 * Exports the Bedrock client and related utilities for AI operations
 */

export {
  BedrockClient,
  BedrockError,
  BedrockParseError,
  getBedrockClient,
  resetBedrockClient,
  type InvokeOptions,
  type InvokeStreamOptions,
  type RetryConfig,
} from './client';

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

export type { ImageContent } from './client';
