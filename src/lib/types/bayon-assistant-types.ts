/**
 * Bayon AI Assistant Type Definitions
 * 
 * Comprehensive TypeScript interfaces for all system components.
 * These types provide compile-time type safety and IDE support.
 */

import type {
  AgentProfile,
  Citation,
  WorkflowTask,
  WorkflowResult,
  WorkflowExecution,
  WorkerTaskInput,
  WorkerTaskOutput,
  ParallelSearchInput,
  ParallelSearchOutput,
  VisionAnalysisInput,
  VisionAnalysisOutput,
  GuardrailsConfig,
  GuardrailsResult,
  Conversation,
  ConversationMessage,
  DataAnalystInput,
  DataAnalystOutput,
  ContentGeneratorInput,
  ContentGeneratorOutput,
  MarketForecasterInput,
  MarketForecasterOutput
} from '@/ai/schemas/bayon-assistant-schemas';

// Re-export schema types for convenience
export type {
  AgentProfile,
  Citation,
  WorkflowTask,
  WorkflowResult,
  WorkflowExecution,
  WorkerTaskInput,
  WorkerTaskOutput,
  ParallelSearchInput,
  ParallelSearchOutput,
  VisionAnalysisInput,
  VisionAnalysisOutput,
  GuardrailsConfig,
  GuardrailsResult,
  Conversation,
  ConversationMessage,
  DataAnalystInput,
  DataAnalystOutput,
  ContentGeneratorInput,
  ContentGeneratorOutput,
  MarketForecasterInput,
  MarketForecasterOutput
};

// ============================================================================
// Repository Interfaces
// ============================================================================

/**
 * Agent Profile Repository Interface
 */
export interface IAgentProfileRepository {
  createProfile(userId: string, profile: Omit<AgentProfile, 'userId' | 'createdAt' | 'updatedAt'>): Promise<AgentProfile>;
  getProfile(userId: string): Promise<AgentProfile | null>;
  updateProfile(userId: string, updates: Partial<Omit<AgentProfile, 'userId' | 'createdAt' | 'updatedAt'>>): Promise<void>;
  deleteProfile(userId: string): Promise<void>;
}

/**
 * Citation Repository Interface
 */
export interface ICitationRepository {
  createCitation(userId: string, citation: Omit<Citation, 'id' | 'accessedAt' | 'validated'>): Promise<Citation>;
  getCitation(userId: string, citationId: string): Promise<Citation | null>;
  getCitationsByConversation(userId: string, conversationId: string): Promise<Citation[]>;
  deleteCitation(userId: string, citationId: string): Promise<void>;
}

/**
 * Conversation Repository Interface
 */
export interface IConversationRepository {
  createConversation(userId: string, conversation: Omit<Conversation, 'conversationId' | 'createdAt' | 'updatedAt'>): Promise<Conversation>;
  getConversation(userId: string, conversationId: string): Promise<Conversation | null>;
  updateConversation(userId: string, conversationId: string, updates: Partial<Conversation>): Promise<void>;
  addMessage(userId: string, conversationId: string, message: ConversationMessage): Promise<void>;
  listConversations(userId: string, limit?: number): Promise<Conversation[]>;
  deleteConversation(userId: string, conversationId: string): Promise<void>;
}

/**
 * Workflow Execution Repository Interface
 */
export interface IWorkflowExecutionRepository {
  createWorkflowExecution(userId: string, execution: Omit<WorkflowExecution, 'createdAt'>): Promise<WorkflowExecution>;
  getWorkflowExecution(userId: string, workflowId: string): Promise<WorkflowExecution | null>;
  updateWorkflowExecution(userId: string, workflowId: string, updates: Partial<WorkflowExecution>): Promise<void>;
  listWorkflowExecutions(userId: string, conversationId?: string, limit?: number): Promise<WorkflowExecution[]>;
}

// ============================================================================
// Service Interfaces
// ============================================================================

/**
 * Guardrails Service Interface
 */
export interface IGuardrailsService {
  validateRequest(prompt: string, config: GuardrailsConfig): Promise<GuardrailsResult>;
  detectPII(text: string): string[];
  sanitizePrompt(prompt: string): string;
  isRealEstateDomain(prompt: string): boolean;
  detectFinancialGuarantees(prompt: string): boolean;
  detectLegalAdvice(prompt: string): boolean;
  detectUnethicalRequest(prompt: string): boolean;
}

/**
 * Citation Service Interface
 */
export interface ICitationService {
  addCitation(text: string, source: Omit<Citation, 'id' | 'accessedAt' | 'validated'>): Promise<Citation>;
  validateURL(url: string): Promise<boolean>;
  formatCitations(text: string, citations: Citation[]): Promise<string>;
  extractCitations(text: string): Promise<Citation[]>;
  enrichResponseWithCitations(response: string, sources: string[]): Promise<{ text: string; citations: Citation[] }>;
}

/**
 * Response Enhancement Service Interface
 */
export interface IResponseEnhancementService {
  addQualifyingLanguage(text: string): string;
  verifyFactualGrounding(text: string, sources: Citation[]): { grounded: boolean; unsourcedFacts: string[] };
  enforceMultipleFactCitation(text: string, citations: Citation[]): string;
  removeFiller(text: string): string;
  formatAsStructured(text: string): string;
  prioritizeAnswer(text: string): string;
}

/**
 * Efficiency Optimizer Interface
 */
export interface IEfficiencyOptimizer {
  optimize(text: string, config: OptimizationConfig): string;
  removeFiller(text: string): string;
  formatAsBullets(text: string): string;
  formatAsTable(data: any[]): string;
  truncate(text: string, maxLength: number): string;
}

/**
 * Optimization Configuration
 */
export interface OptimizationConfig {
  maxLength?: number;
  useBulletPoints: boolean;
  useTables: boolean;
  removeGreetings: boolean;
  removeFiller: boolean;
}

// ============================================================================
// Worker Agent Interfaces
// ============================================================================

/**
 * Base Worker Agent Interface
 */
export interface IWorkerAgent<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
  getName(): string;
  getType(): string;
}

/**
 * Data Analyst Worker Agent Interface
 */
export interface IDataAnalystWorker extends IWorkerAgent<DataAnalystInput, DataAnalystOutput> {
  searchTavily(query: string): Promise<any[]>;
  queryMLS(filters: Record<string, any>): Promise<any[]>;
  analyzeMarketReport(reportUrl: string): Promise<any>;
}

/**
 * Content Generator Worker Agent Interface
 */
export interface IContentGeneratorWorker extends IWorkerAgent<ContentGeneratorInput, ContentGeneratorOutput> {
  generateEmail(context: Record<string, any>, profile: AgentProfile): Promise<string>;
  generateListing(context: Record<string, any>, profile: AgentProfile): Promise<string>;
  generateSummary(context: Record<string, any>, profile: AgentProfile): Promise<string>;
}

/**
 * Market Forecaster Worker Agent Interface
 */
export interface IMarketForecasterWorker extends IWorkerAgent<MarketForecasterInput, MarketForecasterOutput> {
  analyzeHistoricalData(data: any[]): Promise<any>;
  generateForecast(analysis: any, timeframe: string): Promise<MarketForecasterOutput>;
}

// ============================================================================
// Orchestrator Interfaces
// ============================================================================

/**
 * Workflow Orchestrator Interface
 */
export interface IWorkflowOrchestrator {
  decomposeRequest(prompt: string, agentProfile: AgentProfile): Promise<WorkflowTask[]>;
  executeWorkflow(tasks: WorkflowTask[]): Promise<WorkflowResult[]>;
  synthesizeResults(results: WorkflowResult[], agentProfile: AgentProfile): Promise<string>;
  handleWorkerFailure(taskId: string, error: Error): Promise<void>;
}

/**
 * Workflow Decomposition Result
 */
export interface WorkflowDecomposition {
  tasks: WorkflowTask[];
  executionPlan: 'sequential' | 'parallel' | 'mixed';
  estimatedDuration: number;
}

/**
 * Workflow Synthesis Context
 */
export interface WorkflowSynthesisContext {
  results: WorkflowResult[];
  agentProfile: AgentProfile;
  originalPrompt: string;
  citations: Citation[];
}

// ============================================================================
// Parallel Search Interfaces
// ============================================================================

/**
 * Parallel Search Agent Interface
 */
export interface IParallelSearchAgent {
  search(input: ParallelSearchInput): Promise<ParallelSearchOutput>;
  searchChatGPT(query: string): Promise<any>;
  searchGemini(query: string): Promise<any>;
  searchClaude(query: string): Promise<any>;
  analyzeConsensus(results: any[]): { consensus: string[]; discrepancies: string[] };
  checkAgentVisibility(results: any[], agentProfile: AgentProfile): any;
}

/**
 * Platform Search Result
 */
export interface PlatformSearchResult {
  platform: string;
  response: string;
  sources: string[];
  agentMentioned: boolean;
  agentRanking?: number;
  error?: string;
  executionTime: number;
}

// ============================================================================
// Vision Agent Interfaces
// ============================================================================

/**
 * Vision Agent Interface
 */
export interface IVisionAgent {
  analyze(input: VisionAnalysisInput): Promise<VisionAnalysisOutput>;
  extractVisualElements(imageData: string): Promise<any>;
  generateRecommendations(elements: any, marketContext: AgentProfile): Promise<any[]>;
  alignWithMarketTrends(recommendations: any[], profile: AgentProfile): Promise<string>;
}

/**
 * Visual Element
 */
export interface VisualElement {
  type: 'material' | 'color' | 'lighting' | 'size' | 'layout' | 'feature';
  value: string;
  confidence: number;
  location?: { x: number; y: number; width: number; height: number };
}

/**
 * Property Recommendation
 */
export interface PropertyRecommendation {
  action: string;
  rationale: string;
  estimatedCost: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
  marketAlignment: string;
  expectedROI?: string;
}

// ============================================================================
// Personalization Interfaces
// ============================================================================

/**
 * Personalization Service Interface
 */
export interface IPersonalizationService {
  injectProfile(prompt: string, profile: AgentProfile): string;
  filterByMarket(results: any[], primaryMarket: string): any[];
  applyTone(text: string, tone: string): string;
  incorporateSpecialization(text: string, specialization: string): string;
  addCorePrinciple(text: string, principle: string): string;
}

/**
 * Personalization Context
 */
export interface PersonalizationContext {
  agentProfile: AgentProfile;
  contentType: 'chat' | 'listing' | 'email' | 'summary';
  targetAudience?: 'client' | 'internal' | 'public';
}

// ============================================================================
// Error Handling Interfaces
// ============================================================================

/**
 * Bayon Assistant Error
 */
export interface BayonAssistantError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  userId?: string;
  conversationId?: string;
  workflowId?: string;
}

/**
 * Error Handler Interface
 */
export interface IErrorHandler {
  handleGuardrailViolation(violation: GuardrailsResult): BayonAssistantError;
  handleWorkerFailure(taskId: string, error: Error): BayonAssistantError;
  handleBedrockError(error: Error): BayonAssistantError;
  handleDynamoDBError(error: Error): BayonAssistantError;
  handleExternalAPIError(service: string, error: Error): BayonAssistantError;
}

/**
 * Retry Configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// ============================================================================
// Logging and Monitoring Interfaces
// ============================================================================

/**
 * Performance Metrics
 */
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  userId?: string;
  success: boolean;
  metadata?: Record<string, any>;
}

/**
 * Logger Interface
 */
export interface ILogger {
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
  metric(metric: PerformanceMetrics): void;
}

/**
 * Monitoring Service Interface
 */
export interface IMonitoringService {
  recordMetric(name: string, value: number, unit: string, metadata?: Record<string, any>): void;
  recordGuardrailViolation(violation: GuardrailsResult): void;
  recordWorkflowExecution(execution: WorkflowExecution): void;
  recordCitationValidation(citation: Citation, valid: boolean): void;
  recordProfileRetrieval(userId: string, duration: number): void;
}

// ============================================================================
// Server Action Interfaces
// ============================================================================

/**
 * Chat Query Input
 */
export interface ChatQueryInput {
  userId: string;
  message: string;
  conversationId?: string;
  useParallelSearch?: boolean;
}

/**
 * Chat Query Result
 */
export interface ChatQueryResult {
  response: string;
  conversationId: string;
  citations: Citation[];
  workflowId?: string;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    workflowTasks?: number;
  };
}

/**
 * Vision Query Input
 */
export interface VisionQueryInput {
  userId: string;
  imageData: string;
  imageFormat: 'jpeg' | 'png' | 'webp';
  question: string;
}

/**
 * Vision Query Result
 */
export interface VisionQueryResult {
  analysis: VisionAnalysisOutput;
  conversationId?: string;
  metadata?: {
    executionTime: number;
    imageSize: number;
  };
}

/**
 * Profile Management Input
 */
export interface ProfileManagementInput {
  userId: string;
  action: 'create' | 'update' | 'get' | 'delete';
  profileData?: Partial<AgentProfile>;
}

/**
 * Profile Management Result
 */
export interface ProfileManagementResult {
  success: boolean;
  profile?: AgentProfile;
  error?: string;
}

// ============================================================================
// Streaming Interfaces
// ============================================================================

/**
 * Stream Chunk
 */
export interface StreamChunk {
  type: 'text' | 'citation' | 'metadata' | 'error' | 'complete';
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Streaming Handler Interface
 */
export interface IStreamingHandler {
  onChunk(chunk: StreamChunk): void;
  onComplete(): void;
  onError(error: Error): void;
}

// ============================================================================
// Cache Interfaces
// ============================================================================

/**
 * Cache Entry
 */
export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * Cache Interface
 */
export interface ICache<T> {
  get(key: string): T | null;
  set(key: string, value: T, ttl?: number): void;
  delete(key: string): void;
  clear(): void;
  has(key: string): boolean;
}

// ============================================================================
// External API Interfaces
// ============================================================================

/**
 * Tavily Search Client Interface
 */
export interface ITavilySearchClient {
  search(query: string, options?: TavilySearchOptions): Promise<TavilySearchResult>;
}

/**
 * Tavily Search Options
 */
export interface TavilySearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeImages?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
}

/**
 * Tavily Search Result
 */
export interface TavilySearchResult {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
  query: string;
  responseTime: number;
}

/**
 * External AI Platform Client Interface
 */
export interface IExternalAIPlatformClient {
  query(prompt: string, options?: any): Promise<string>;
  getPlatformName(): string;
}

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Bayon Assistant Configuration
 */
export interface BayonAssistantConfig {
  guardrails: GuardrailsConfig;
  optimization: OptimizationConfig;
  retry: RetryConfig;
  cache: {
    enabled: boolean;
    ttl: number;
  };
  monitoring: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  features: {
    parallelSearch: boolean;
    visionAnalysis: boolean;
    workflowOrchestration: boolean;
  };
}

/**
 * Model Configuration
 */
export interface ModelConfig {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  stopSequences?: string[];
}
