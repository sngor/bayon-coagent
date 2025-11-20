import { z } from 'zod';

/**
 * Bayon AI Assistant Schemas
 * 
 * Comprehensive Zod schemas for all data models used in the Bayon AI Assistant system.
 * These schemas provide runtime validation and type safety for:
 * - Agent profiles
 * - Citations
 * - Workflow orchestration
 * - Worker agents
 * - Parallel search
 * - Vision analysis
 * - Guardrails
 */

// ============================================================================
// Agent Profile Schemas
// ============================================================================

/**
 * Agent specialization types
 */
export const AgentSpecializationSchema = z.enum([
  'luxury',
  'first-time-buyers',
  'investment',
  'commercial',
  'general'
]);

/**
 * Agent preferred tone types
 */
export const AgentToneSchema = z.enum([
  'warm-consultative',
  'direct-data-driven',
  'professional',
  'casual'
]);

/**
 * Agent Profile Schema
 * Stores personalization information for the Bayon AI Assistant
 */
export const AgentProfileSchema = z.object({
  userId: z.string().describe('Unique user identifier'),
  agentName: z.string().min(1).max(100).describe('Agent\'s full name'),
  primaryMarket: z.string().min(1).max(200).describe('Primary market location (e.g., "Austin, TX")'),
  specialization: AgentSpecializationSchema.describe('Agent\'s area of specialization'),
  preferredTone: AgentToneSchema.describe('Preferred communication tone'),
  corePrinciple: z.string().min(10).max(500).describe('Agent\'s core business principle or value proposition'),
  createdAt: z.string().datetime().describe('ISO 8601 timestamp of creation'),
  updatedAt: z.string().datetime().describe('ISO 8601 timestamp of last update')
});

/**
 * Input schema for creating a new agent profile
 */
export const CreateAgentProfileInputSchema = AgentProfileSchema.omit({
  userId: true,
  createdAt: true,
  updatedAt: true
});

/**
 * Input schema for updating an existing agent profile
 */
export const UpdateAgentProfileInputSchema = CreateAgentProfileInputSchema.partial();

// ============================================================================
// Citation Schemas
// ============================================================================

/**
 * Citation source types
 */
export const CitationSourceTypeSchema = z.enum([
  'mls',
  'market-report',
  'data-api',
  'web'
]);

/**
 * Citation Schema
 * Represents a source reference for factual information
 */
export const CitationSchema = z.object({
  id: z.string().describe('Unique citation identifier'),
  url: z.string().url().describe('URL to the source'),
  title: z.string().describe('Descriptive title of the source'),
  sourceType: CitationSourceTypeSchema.describe('Type of source'),
  accessedAt: z.string().datetime().describe('ISO 8601 timestamp when source was accessed'),
  validated: z.boolean().describe('Whether the URL was successfully validated'),
  validationNote: z.string().optional().describe('Note if URL could not be validated')
});

/**
 * Input schema for creating a citation
 */
export const CreateCitationInputSchema = CitationSchema.omit({
  id: true,
  accessedAt: true,
  validated: true,
  validationNote: true
});

/**
 * Citation result with formatted text
 */
export const CitationResultSchema = z.object({
  text: z.string().describe('Text with embedded citations'),
  citations: z.array(CitationSchema).describe('Array of citation objects')
});

// ============================================================================
// Workflow Orchestration Schemas
// ============================================================================

/**
 * Workflow task types
 */
export const WorkflowTaskTypeSchema = z.enum([
  'data-analysis',
  'content-generation',
  'market-forecast',
  'search'
]);

/**
 * Workflow task status
 */
export const WorkflowTaskStatusSchema = z.enum([
  'pending',
  'in-progress',
  'completed',
  'failed'
]);

/**
 * Workflow Task Schema
 * Represents a sub-task in a decomposed workflow
 */
export const WorkflowTaskSchema = z.object({
  id: z.string().describe('Unique task identifier'),
  type: WorkflowTaskTypeSchema.describe('Type of task'),
  description: z.string().describe('Human-readable task description'),
  dependencies: z.array(z.string()).describe('Array of task IDs that must complete before this task'),
  workerAgent: z.string().describe('Name of the worker agent assigned to this task'),
  input: z.record(z.any()).describe('Input data for the task'),
  status: WorkflowTaskStatusSchema.default('pending').describe('Current status of the task')
});

/**
 * Workflow Result Schema
 * Represents the result of a completed workflow task
 */
export const WorkflowResultSchema = z.object({
  taskId: z.string().describe('ID of the completed task'),
  output: z.any().describe('Output data from the task'),
  status: z.enum(['success', 'error']).describe('Result status'),
  error: z.string().optional().describe('Error message if status is error'),
  executionTime: z.number().optional().describe('Execution time in milliseconds')
});

/**
 * Workflow Execution Log Schema
 * Stores complete workflow execution history
 */
export const WorkflowExecutionSchema = z.object({
  workflowId: z.string().describe('Unique workflow identifier'),
  conversationId: z.string().describe('Associated conversation ID'),
  userId: z.string().describe('User who initiated the workflow'),
  tasks: z.array(WorkflowTaskSchema).describe('Array of tasks in the workflow'),
  results: z.array(WorkflowResultSchema).describe('Array of task results'),
  totalExecutionTime: z.number().describe('Total execution time in milliseconds'),
  status: z.enum(['pending', 'in-progress', 'completed', 'failed']).describe('Overall workflow status'),
  createdAt: z.string().datetime().describe('ISO 8601 timestamp of creation'),
  completedAt: z.string().datetime().optional().describe('ISO 8601 timestamp of completion')
});

// ============================================================================
// Worker Agent Communication Protocol Schemas
// ============================================================================

/**
 * Worker Task Input Schema
 * Standardized input format for worker agents
 */
export const WorkerTaskInputSchema = z.object({
  taskId: z.string().describe('Unique task identifier'),
  taskType: WorkflowTaskTypeSchema.describe('Type of task'),
  context: z.record(z.any()).describe('Task context and parameters'),
  agentProfile: AgentProfileSchema.optional().describe('Agent profile for personalization')
});

/**
 * Worker Task Output Schema
 * Standardized output format for worker agents
 */
export const WorkerTaskOutputSchema = z.object({
  taskId: z.string().describe('Task identifier'),
  status: z.enum(['success', 'error']).describe('Task completion status'),
  result: z.any().optional().describe('Task result data'),
  error: z.object({
    type: z.string().describe('Error type'),
    message: z.string().describe('Error message'),
    details: z.any().optional().describe('Additional error details')
  }).optional().describe('Error information if status is error'),
  metadata: z.object({
    executionTime: z.number().describe('Execution time in milliseconds'),
    tokensUsed: z.number().optional().describe('AI tokens consumed'),
    citations: z.array(CitationSchema).optional().describe('Citations generated during task')
  }).optional().describe('Task execution metadata')
});

// ============================================================================
// Data Analyst Worker Schemas
// ============================================================================

export const DataAnalystInputSchema = z.object({
  query: z.string().describe('Data analysis query'),
  dataSource: z.enum(['mls', 'market-report', 'tavily']).describe('Data source to query'),
  filters: z.record(z.any()).optional().describe('Optional filters for the query'),
  agentProfile: AgentProfileSchema.optional().describe('Agent profile for context')
});

export const DataAnalystOutputSchema = z.object({
  data: z.array(z.any()).describe('Retrieved data'),
  summary: z.string().describe('Summary of findings'),
  sources: z.array(z.string()).describe('Data source URLs'),
  insights: z.array(z.string()).optional().describe('Key insights from the data')
});

// ============================================================================
// Content Generator Worker Schemas
// ============================================================================

export const ContentGeneratorInputSchema = z.object({
  contentType: z.enum(['email', 'listing', 'summary', 'social-post']).describe('Type of content to generate'),
  context: z.record(z.any()).describe('Context for content generation'),
  agentProfile: AgentProfileSchema.describe('Agent profile for personalization')
});

export const ContentGeneratorOutputSchema = z.object({
  content: z.string().describe('Generated content'),
  tone: z.string().describe('Tone used in the content'),
  wordCount: z.number().describe('Word count of generated content'),
  citations: z.array(CitationSchema).optional().describe('Citations used in content')
});

// ============================================================================
// Market Forecaster Worker Schemas
// ============================================================================

export const MarketForecasterInputSchema = z.object({
  historicalData: z.array(z.any()).describe('Historical market data'),
  timeframe: z.enum(['30-day', '90-day', '1-year']).describe('Forecast timeframe'),
  market: z.string().describe('Market location'),
  agentProfile: AgentProfileSchema.optional().describe('Agent profile for context')
});

export const MarketForecasterOutputSchema = z.object({
  forecast: z.object({
    trend: z.enum(['up', 'down', 'stable']).describe('Predicted market trend'),
    confidence: z.number().min(0).max(1).describe('Confidence level (0-1)'),
    priceRange: z.object({
      low: z.number().describe('Lower bound of price range'),
      high: z.number().describe('Upper bound of price range')
    }).describe('Predicted price range')
  }).describe('Market forecast'),
  factors: z.array(z.string()).describe('Key factors influencing the forecast'),
  disclaimer: z.string().describe('Qualifying language for the prediction'),
  citations: z.array(CitationSchema).describe('Data sources used for forecast')
});

// ============================================================================
// Parallel Search Schemas
// ============================================================================

export const ParallelSearchPlatformSchema = z.enum(['chatgpt', 'gemini', 'claude']);

export const ParallelSearchInputSchema = z.object({
  query: z.string().describe('Search query'),
  platforms: z.array(ParallelSearchPlatformSchema).describe('Platforms to search'),
  agentProfile: AgentProfileSchema.optional().describe('Agent profile for visibility checking')
});

export const PlatformResultSchema = z.object({
  platform: ParallelSearchPlatformSchema.describe('Platform name'),
  response: z.string().describe('Platform response'),
  sources: z.array(z.string()).describe('Source URLs from the platform'),
  agentMentioned: z.boolean().describe('Whether agent name/firm was mentioned'),
  agentRanking: z.number().optional().describe('Ranking position if agent was mentioned'),
  error: z.string().optional().describe('Error message if platform query failed')
});

export const ParallelSearchOutputSchema = z.object({
  results: z.array(PlatformResultSchema).describe('Results from each platform'),
  consensus: z.array(z.string()).describe('Points of agreement across platforms'),
  discrepancies: z.array(z.string()).describe('Points of disagreement across platforms'),
  summary: z.string().describe('Overall summary of findings'),
  agentVisibility: z.object({
    mentioned: z.boolean().describe('Whether agent was mentioned on any platform'),
    platforms: z.array(ParallelSearchPlatformSchema).describe('Platforms where agent was mentioned'),
    bestRanking: z.number().optional().describe('Best ranking position across platforms')
  }).describe('Agent visibility report')
});

// ============================================================================
// Vision Analysis Schemas
// ============================================================================

export const VisionAnalysisInputSchema = z.object({
  imageData: z.string().describe('Base64 encoded image data'),
  imageFormat: z.enum(['jpeg', 'png', 'webp']).describe('Image format'),
  question: z.string().describe('Question about the image'),
  agentProfile: AgentProfileSchema.describe('Agent profile for market context')
});

export const VisionAnalysisOutputSchema = z.object({
  visualElements: z.object({
    materials: z.array(z.string()).describe('Identified materials'),
    colors: z.array(z.string()).describe('Dominant colors'),
    lighting: z.enum(['natural', 'artificial', 'mixed']).describe('Lighting type'),
    size: z.enum(['small', 'medium', 'large']).describe('Perceived size'),
    layout: z.string().describe('Layout description')
  }).describe('Identified visual elements'),
  recommendations: z.array(z.object({
    action: z.string().describe('Recommended action'),
    rationale: z.string().describe('Reason for recommendation'),
    estimatedCost: z.enum(['low', 'medium', 'high']).describe('Estimated cost category'),
    priority: z.enum(['high', 'medium', 'low']).describe('Priority level')
  })).describe('Actionable recommendations'),
  marketAlignment: z.string().describe('How recommendations align with market trends')
});

// ============================================================================
// Guardrails Schemas
// ============================================================================

export const GuardrailsConfigSchema = z.object({
  allowedDomains: z.array(z.string()).describe('Allowed topic domains'),
  blockedTopics: z.array(z.string()).describe('Blocked topics'),
  piiDetectionEnabled: z.boolean().describe('Whether PII detection is enabled'),
  maxPromptLength: z.number().describe('Maximum prompt length in characters')
});

export const GuardrailsResultSchema = z.object({
  allowed: z.boolean().describe('Whether the request is allowed'),
  reason: z.string().optional().describe('Reason for blocking if not allowed'),
  sanitizedPrompt: z.string().optional().describe('Sanitized version of the prompt'),
  detectedPII: z.array(z.string()).optional().describe('Types of PII detected'),
  violationType: z.enum([
    'out-of-domain',
    'financial-guarantee',
    'legal-advice',
    'pii-detected',
    'unethical-request',
    'none'
  ]).optional().describe('Type of guardrail violation')
});

// ============================================================================
// Conversation Schemas
// ============================================================================

export const ConversationMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']).describe('Message role'),
  content: z.string().describe('Message content'),
  timestamp: z.string().datetime().describe('ISO 8601 timestamp'),
  citations: z.array(z.string()).optional().describe('Citation IDs referenced in this message'),
  workflowTasks: z.array(z.string()).optional().describe('Workflow task IDs associated with this message')
});

export const ConversationSchema = z.object({
  conversationId: z.string().describe('Unique conversation identifier'),
  userId: z.string().describe('User ID'),
  messages: z.array(ConversationMessageSchema).describe('Conversation messages'),
  agentProfileSnapshot: AgentProfileSchema.optional().describe('Agent profile at time of conversation'),
  createdAt: z.string().datetime().describe('ISO 8601 timestamp of creation'),
  updatedAt: z.string().datetime().describe('ISO 8601 timestamp of last update')
});

// ============================================================================
// Response Enhancement Schemas
// ============================================================================

export const ResponseEnhancementConfigSchema = z.object({
  addQualifyingLanguage: z.boolean().describe('Add qualifying language to predictions'),
  enforceFactualGrounding: z.boolean().describe('Enforce factual grounding'),
  requireCitations: z.boolean().describe('Require citations for facts'),
  removeFiller: z.boolean().describe('Remove filler words'),
  useStructuredFormatting: z.boolean().describe('Use bullet points and tables')
});

export const EnhancedResponseSchema = z.object({
  originalResponse: z.string().describe('Original AI response'),
  enhancedResponse: z.string().describe('Enhanced response with improvements'),
  modifications: z.array(z.object({
    type: z.enum([
      'qualifying-language-added',
      'citation-added',
      'filler-removed',
      'formatting-improved',
      'disclaimer-added'
    ]).describe('Type of modification'),
    location: z.string().describe('Where in the text the modification was made'),
    details: z.string().describe('Details about the modification')
  })).describe('List of modifications made'),
  citations: z.array(CitationSchema).describe('Citations added to the response')
});

// ============================================================================
// Type Exports
// ============================================================================

export type AgentProfile = z.infer<typeof AgentProfileSchema>;
export type CreateAgentProfileInput = z.infer<typeof CreateAgentProfileInputSchema>;
export type UpdateAgentProfileInput = z.infer<typeof UpdateAgentProfileInputSchema>;
export type AgentSpecialization = z.infer<typeof AgentSpecializationSchema>;
export type AgentTone = z.infer<typeof AgentToneSchema>;

export type Citation = z.infer<typeof CitationSchema>;
export type CreateCitationInput = z.infer<typeof CreateCitationInputSchema>;
export type CitationResult = z.infer<typeof CitationResultSchema>;
export type CitationSourceType = z.infer<typeof CitationSourceTypeSchema>;

export type WorkflowTask = z.infer<typeof WorkflowTaskSchema>;
export type WorkflowResult = z.infer<typeof WorkflowResultSchema>;
export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
export type WorkflowTaskType = z.infer<typeof WorkflowTaskTypeSchema>;
export type WorkflowTaskStatus = z.infer<typeof WorkflowTaskStatusSchema>;

export type WorkerTaskInput = z.infer<typeof WorkerTaskInputSchema>;
export type WorkerTaskOutput = z.infer<typeof WorkerTaskOutputSchema>;

export type DataAnalystInput = z.infer<typeof DataAnalystInputSchema>;
export type DataAnalystOutput = z.infer<typeof DataAnalystOutputSchema>;

export type ContentGeneratorInput = z.infer<typeof ContentGeneratorInputSchema>;
export type ContentGeneratorOutput = z.infer<typeof ContentGeneratorOutputSchema>;

export type MarketForecasterInput = z.infer<typeof MarketForecasterInputSchema>;
export type MarketForecasterOutput = z.infer<typeof MarketForecasterOutputSchema>;

export type ParallelSearchInput = z.infer<typeof ParallelSearchInputSchema>;
export type ParallelSearchOutput = z.infer<typeof ParallelSearchOutputSchema>;
export type PlatformResult = z.infer<typeof PlatformResultSchema>;
export type ParallelSearchPlatform = z.infer<typeof ParallelSearchPlatformSchema>;

export type VisionAnalysisInput = z.infer<typeof VisionAnalysisInputSchema>;
export type VisionAnalysisOutput = z.infer<typeof VisionAnalysisOutputSchema>;

export type GuardrailsConfig = z.infer<typeof GuardrailsConfigSchema>;
export type GuardrailsResult = z.infer<typeof GuardrailsResultSchema>;

export type Conversation = z.infer<typeof ConversationSchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export type ResponseEnhancementConfig = z.infer<typeof ResponseEnhancementConfigSchema>;
export type EnhancedResponse = z.infer<typeof EnhancedResponseSchema>;
