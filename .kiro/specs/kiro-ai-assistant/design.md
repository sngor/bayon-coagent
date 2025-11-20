# Design Document

## Overview

The Kiro AI Assistant is a sophisticated, multi-layered AI system designed to provide real estate agents with accurate, personalized, and trustworthy assistance. The system implements a foundational AI layer with safety guardrails, a personalization layer using agent profiles, an orchestration layer for complex multi-step workflows, a parallel search validation layer, a vision analysis layer for property images, and efficiency optimizations throughout.

The architecture leverages AWS Bedrock with Claude 3.5 Sonnet for AI capabilities, DynamoDB for data persistence, and integrates with external AI platforms (ChatGPT, Gemini, Claude) for cross-validation. The system is built on Next.js 15 with TypeScript and follows a server-first architecture using Server Actions.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (Next.js)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat UI      │  │ Vision UI    │  │ Profile UI   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│              Server Actions Layer (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Chat Actions │  │ Vision       │  │ Profile      │      │
│  │              │  │ Actions      │  │ Actions      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Orchestration Layer                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Workflow Orchestrator                      │   │
│  │  - Request Analysis & Decomposition                  │   │
│  │  - Worker Agent Assignment                           │   │
│  │  - Result Synthesis                                  │   │
│  └────┬─────────────────────────────────────────────┬───┘   │
│       │                                             │       │
│       ▼                                             ▼       │
│  ┌─────────────────┐                      ┌──────────────┐ │
│  │ Worker Agents   │                      │ Parallel     │ │
│  │ - Data Analyst  │                      │ Search Agent │ │
│  │ - Content Gen   │                      │              │ │
│  │ - Market        │                      └──────────────┘ │
│  │   Forecaster    │                                       │
│  └─────────────────┘                                       │
└─────────┼──────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Foundation Layer                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Bedrock Client (Claude 3.5)             │   │
│  │  - Prompt Execution                                  │   │
│  │  - Schema Validation (Zod)                           │   │
│  │  - Streaming Support                                 │   │
│  │  - Retry Logic                                       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Guardrails & Safety Layer               │   │
│  │  - Scope Validation (Real Estate Domain)            │   │
│  │  - PII Detection & Blocking                          │   │
│  │  - Ethical Constraint Enforcement                    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Citation & Factual Grounding               │   │
│  │  - Source Tracking                                   │   │
│  │  - URL Validation                                    │   │
│  │  - Citation Formatting                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────┼──────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data & Storage Layer                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ DynamoDB     │  │ External APIs│  │ CloudWatch   │      │
│  │ - Agent      │  │ - ChatGPT    │  │ Logging      │      │
│  │   Profiles   │  │ - Gemini     │  │              │      │
│  │ - Citations  │  │ - Claude     │  │              │      │
│  │ - Logs       │  │ - Tavily     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request** → Client UI captures user input
2. **Server Action** → Validates and routes request
3. **Guardrails Check** → Validates scope, PII, ethics
4. **Profile Loading** → Retrieves Agent Profile Context
5. **Orchestration** → Decomposes complex requests into sub-tasks
6. **Worker Execution** → Specialized agents execute sub-tasks
7. **Parallel Search** (if needed) → Cross-validates across platforms
8. **Citation Enrichment** → Adds sources and validates URLs
9. **Response Synthesis** → Combines results with personalization
10. **Efficiency Optimization** → Formats for conciseness
11. **Response Delivery** → Returns to client with citations

## Components and Interfaces

### 1. Guardrails & Safety Module

**Location**: `src/aws/bedrock/guardrails.ts`

**Purpose**: Enforces safety constraints and validates all requests before AI processing.

**Interface**:

```typescript
export interface GuardrailsConfig {
  allowedDomains: string[];
  blockedTopics: string[];
  piiDetectionEnabled: boolean;
  maxPromptLength: number;
}

export interface GuardrailsResult {
  allowed: boolean;
  reason?: string;
  sanitizedPrompt?: string;
  detectedPII?: string[];
}

export class GuardrailsService {
  validateRequest(prompt: string, config: GuardrailsConfig): GuardrailsResult;
  detectPII(text: string): string[];
  sanitizePrompt(prompt: string): string;
  isRealEstateDomain(prompt: string): boolean;
}
```

**Key Functions**:

- `validateRequest()`: Checks if request is within real estate domain
- `detectPII()`: Scans for PII patterns (SSN, credit cards, etc.)
- `sanitizePrompt()`: Removes or masks detected PII
- `isRealEstateDomain()`: Uses keyword matching and classification

### 2. Agent Profile Service

**Location**: `src/aws/dynamodb/agent-profile-repository.ts`

**Purpose**: Manages agent profile storage and retrieval for personalization.

**Data Model**:

```typescript
export interface AgentProfile {
  userId: string;
  agentName: string;
  primaryMarket: string;
  specialization:
    | "luxury"
    | "first-time-buyers"
    | "investment"
    | "commercial"
    | "general";
  preferredTone:
    | "warm-consultative"
    | "direct-data-driven"
    | "professional"
    | "casual";
  corePrinciple: string;
  createdAt: string;
  updatedAt: string;
}
```

**DynamoDB Keys**:

- PK: `USER#{userId}`
- SK: `PROFILE#AGENT`
- EntityType: `AgentProfile`

**Interface**:

```typescript
export class AgentProfileRepository {
  async createProfile(
    userId: string,
    profile: Omit<AgentProfile, "userId" | "createdAt" | "updatedAt">
  ): Promise<AgentProfile>;
  async getProfile(userId: string): Promise<AgentProfile | null>;
  async updateProfile(
    userId: string,
    updates: Partial<AgentProfile>
  ): Promise<void>;
  async deleteProfile(userId: string): Promise<void>;
}
```

### 3. Workflow Orchestrator

**Location**: `src/aws/bedrock/orchestrator.ts`

**Purpose**: Decomposes complex requests and coordinates worker agents.

**Interface**:

```typescript
export interface WorkflowTask {
  id: string;
  type: "data-analysis" | "content-generation" | "market-forecast" | "search";
  description: string;
  dependencies: string[];
  workerAgent: string;
  input: Record<string, any>;
}

export interface WorkflowResult {
  taskId: string;
  output: any;
  status: "success" | "error";
  error?: string;
}

export class WorkflowOrchestrator {
  async decomposeRequest(
    prompt: string,
    agentProfile: AgentProfile
  ): Promise<WorkflowTask[]>;
  async executeWorkflow(tasks: WorkflowTask[]): Promise<WorkflowResult[]>;
  async synthesizeResults(
    results: WorkflowResult[],
    agentProfile: AgentProfile
  ): Promise<string>;
}
```

**Decomposition Strategy**:

1. Analyze prompt using Claude to identify sub-tasks
2. Classify each sub-task by type (data, content, forecast, search)
3. Determine dependencies between tasks
4. Create execution plan (sequential or parallel)
5. Assign to appropriate worker agents

### 4. Worker Agents

**Location**: `src/aws/bedrock/workers/`

Each worker agent is a specialized Bedrock flow optimized for specific tasks.

**Data Analyst Agent** (`data-analyst-worker.ts`):

```typescript
export interface DataAnalystInput {
  query: string;
  dataSource: "mls" | "market-report" | "tavily";
  filters?: Record<string, any>;
}

export interface DataAnalystOutput {
  data: any[];
  summary: string;
  sources: string[];
}

export const dataAnalystFlow = definePrompt<
  DataAnalystInput,
  DataAnalystOutput
>({
  name: "data-analyst-worker",
  inputSchema: DataAnalystInputSchema,
  outputSchema: DataAnalystOutputSchema,
  systemPrompt: "You are a real estate data analyst...",
  prompt: "Analyze the following data request: {{{query}}}...",
  options: MODEL_CONFIGS.ANALYTICAL,
});
```

**Content Generator Agent** (`content-generator-worker.ts`):

```typescript
export interface ContentGeneratorInput {
  contentType: "email" | "listing" | "summary";
  context: Record<string, any>;
  agentProfile: AgentProfile;
}

export interface ContentGeneratorOutput {
  content: string;
  tone: string;
  wordCount: number;
}

export const contentGeneratorFlow = definePrompt<
  ContentGeneratorInput,
  ContentGeneratorOutput
>({
  name: "content-generator-worker",
  inputSchema: ContentGeneratorInputSchema,
  outputSchema: ContentGeneratorOutputSchema,
  systemPrompt: "You are a real estate content writer...",
  prompt: "Generate {{{contentType}}} content...",
  options: MODEL_CONFIGS.CREATIVE,
});
```

**Market Forecaster Agent** (`market-forecaster-worker.ts`):

```typescript
export interface MarketForecasterInput {
  historicalData: any[];
  timeframe: "30-day" | "90-day" | "1-year";
  market: string;
}

export interface MarketForecasterOutput {
  forecast: {
    trend: "up" | "down" | "stable";
    confidence: number;
    priceRange: { low: number; high: number };
  };
  factors: string[];
  disclaimer: string;
}

export const marketForecasterFlow = definePrompt<
  MarketForecasterInput,
  MarketForecasterOutput
>({
  name: "market-forecaster-worker",
  inputSchema: MarketForecasterInputSchema,
  outputSchema: MarketForecasterOutputSchema,
  systemPrompt: "You are a real estate market analyst...",
  prompt: "Forecast market trends for {{{market}}}...",
  options: MODEL_CONFIGS.ANALYTICAL,
});
```

### 5. Parallel Search Agent

**Location**: `src/aws/bedrock/parallel-search.ts`

**Purpose**: Executes queries across multiple AI platforms for cross-validation.

**Interface**:

```typescript
export interface ParallelSearchInput {
  query: string;
  platforms: ("chatgpt" | "gemini" | "claude")[];
  agentProfile?: AgentProfile;
}

export interface PlatformResult {
  platform: string;
  response: string;
  sources: string[];
  agentMentioned: boolean;
  agentRanking?: number;
}

export interface ParallelSearchOutput {
  results: PlatformResult[];
  consensus: string[];
  discrepancies: string[];
  summary: string;
}

export class ParallelSearchAgent {
  async search(input: ParallelSearchInput): Promise<ParallelSearchOutput>;
  private async searchChatGPT(query: string): Promise<PlatformResult>;
  private async searchGemini(query: string): Promise<PlatformResult>;
  private async searchClaude(query: string): Promise<PlatformResult>;
  private analyzeConsensus(results: PlatformResult[]): {
    consensus: string[];
    discrepancies: string[];
  };
}
```

**Implementation Notes**:

- Uses external API clients for each platform
- Executes searches in parallel using `Promise.all()`
- Analyzes results to find common themes and differences
- Checks for agent name/firm mentions in search results

### 6. Vision Agent

**Location**: `src/aws/bedrock/vision-agent.ts`

**Purpose**: Analyzes property images/video for real-time recommendations.

**Interface**:

```typescript
export interface VisionAnalysisInput {
  imageData: string; // Base64 encoded
  imageFormat: "jpeg" | "png" | "webp";
  question: string;
  agentProfile: AgentProfile;
}

export interface VisionAnalysisOutput {
  visualElements: {
    materials: string[];
    colors: string[];
    lighting: "natural" | "artificial" | "mixed";
    size: "small" | "medium" | "large";
    layout: string;
  };
  recommendations: {
    action: string;
    rationale: string;
    estimatedCost: "low" | "medium" | "high";
    priority: "high" | "medium" | "low";
  }[];
  marketAlignment: string;
}

export const visionAnalysisFlow = definePrompt<
  VisionAnalysisInput,
  VisionAnalysisOutput
>({
  name: "vision-analysis",
  inputSchema: VisionAnalysisInputSchema,
  outputSchema: VisionAnalysisOutputSchema,
  systemPrompt:
    "You are a real estate property consultant with expertise in visual analysis...",
  prompt: "Analyze this property image and answer: {{{question}}}...",
  options: MODEL_CONFIGS.ANALYTICAL,
});
```

**Note**: Uses Claude's vision capabilities through Bedrock's multimodal API.

### 7. Citation Service

**Location**: `src/aws/bedrock/citation-service.ts`

**Purpose**: Tracks sources, validates URLs, and formats citations.

**Interface**:

```typescript
export interface Citation {
  id: string;
  url: string;
  title: string;
  sourceType: "mls" | "market-report" | "data-api" | "web";
  accessedAt: string;
  validated: boolean;
}

export interface CitationResult {
  text: string;
  citations: Citation[];
}

export class CitationService {
  async addCitation(
    text: string,
    source: Omit<Citation, "id" | "accessedAt" | "validated">
  ): Promise<Citation>;
  async validateURL(url: string): Promise<boolean>;
  async formatCitations(text: string, citations: Citation[]): Promise<string>;
  async extractCitations(text: string): Promise<Citation[]>;
}
```

**Citation Format**:

```
[Fact statement] ([Source Type]: [Title](URL))
```

Example:

```
The median home price in Austin increased by 8.2% year-over-year (Market Report: Austin Q4 2024 Housing Report)(https://example.com/report)
```

### 8. Response Efficiency Optimizer

**Location**: `src/aws/bedrock/efficiency-optimizer.ts`

**Purpose**: Formats responses for maximum readability and conciseness.

**Interface**:

```typescript
export interface OptimizationConfig {
  maxLength?: number;
  useBulletPoints: boolean;
  useTables: boolean;
  removeGreetings: boolean;
  removeFiller: boolean;
}

export class EfficiencyOptimizer {
  optimize(text: string, config: OptimizationConfig): string;
  private removeFiller(text: string): string;
  private formatAsBullets(text: string): string;
  private formatAsTable(data: any[]): string;
  private truncate(text: string, maxLength: number): string;
}
```

## Data Models

### Agent Profile (DynamoDB)

```typescript
{
  PK: "USER#user123",
  SK: "PROFILE#AGENT",
  EntityType: "AgentProfile",
  Data: {
    userId: "user123",
    agentName: "Jane Smith",
    primaryMarket: "Austin, TX",
    specialization: "luxury",
    preferredTone: "warm-consultative",
    corePrinciple: "Maximize client ROI with data-first strategies"
  },
  CreatedAt: 1700000000000,
  UpdatedAt: 1700000000000
}
```

### Citation Record (DynamoDB)

```typescript
{
  PK: "USER#user123",
  SK: "CITATION#cite123",
  EntityType: "Citation",
  Data: {
    citationId: "cite123",
    url: "https://example.com/report",
    title: "Austin Q4 2024 Housing Report",
    sourceType: "market-report",
    accessedAt: "2024-11-18T10:00:00Z",
    validated: true,
    usedInConversation: "conv123"
  },
  CreatedAt: 1700000000000,
  UpdatedAt: 1700000000000
}
```

### Conversation Log (DynamoDB)

```typescript
{
  PK: "USER#user123",
  SK: "CONVERSATION#conv123",
  EntityType: "Conversation",
  Data: {
    conversationId: "conv123",
    messages: [
      {
        role: "user",
        content: "What's the market trend in Austin?",
        timestamp: "2024-11-18T10:00:00Z"
      },
      {
        role: "assistant",
        content: "Based on recent data...",
        timestamp: "2024-11-18T10:00:05Z",
        citations: ["cite123"],
        workflowTasks: ["task1", "task2"]
      }
    ],
    agentProfileSnapshot: { /* profile at time of conversation */ }
  },
  CreatedAt: 1700000000000,
  UpdatedAt: 1700000000000
}
```

### Workflow Execution Log (DynamoDB)

```typescript
{
  PK: "USER#user123",
  SK: "WORKFLOW#wf123",
  EntityType: "WorkflowExecution",
  Data: {
    workflowId: "wf123",
    conversationId: "conv123",
    tasks: [
      {
        taskId: "task1",
        type: "data-analysis",
        workerAgent: "data-analyst-worker",
        status: "completed",
        executionTime: 1200,
        input: { /* task input */ },
        output: { /* task output */ }
      }
    ],
    totalExecutionTime: 3500,
    status: "completed"
  },
  CreatedAt: 1700000000000,
  UpdatedAt: 1700000000000
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Out-of-domain query rejection

_For any_ query that is not related to real estate topics, the system should decline the request and provide a redirect to a relevant real estate topic.
**Validates: Requirements 1.1**

### Property 2: Financial guarantee and legal advice rejection

_For any_ query requesting financial guarantees or legal advice, the system should decline to provide guarantees and suggest consulting appropriate professionals.
**Validates: Requirements 1.2**

### Property 3: PII non-collection

_For any_ generated response, the system should not request or store personally identifiable information.
**Validates: Requirements 1.3**

### Property 4: Unethical query rejection

_For any_ query involving unethical or illegal activities, the system should decline the request without providing guidance.
**Validates: Requirements 1.4**

### Property 5: Qualifying language in predictions

_For any_ response discussing market predictions or investment returns, the system should include qualifying language such as "aim for" or "historical trends suggest".
**Validates: Requirements 1.5**

### Property 6: Factual grounding

_For any_ factual statement about market data, property features, or legal regulations, the system should ground the statement in provided information or external search results.
**Validates: Requirements 2.1**

### Property 7: Citation presence

_For any_ factual statement in a response, the system should include a hyperlink to the source or citation.
**Validates: Requirements 2.2**

### Property 8: Unsourced fact disclaimer

_For any_ fact or data point that cannot be sourced, the system should explicitly state that the information is an unverified projection or general industry consensus.
**Validates: Requirements 2.3, 2.5**

### Property 9: Multiple fact citation

_For any_ response containing multiple distinct factual claims, the system should provide a citation for each claim.
**Validates: Requirements 2.4**

### Property 10: Agent profile incorporation

_For any_ client-facing response, the system should incorporate elements from the Agent Profile Context including agent name, primary market, specialization, and preferred tone.
**Validates: Requirements 3.1**

### Property 11: Primary market prioritization

_For any_ property suggestion query, the system should filter results to prioritize properties in the primary market specified in the Agent Profile Context.
**Validates: Requirements 3.2**

### Property 12: Listing personalization

_For any_ listing description generation, the system should reflect the agent's specialization and core principle from the Agent Profile Context.
**Validates: Requirements 3.3**

### Property 13: Tone matching

_For any_ market summary generation, the system should use the preferred tone specified in the Agent Profile Context.
**Validates: Requirements 3.4**

### Property 14: Profile update application

_For any_ Agent Profile Context update, subsequent responses should reflect the new preferences.
**Validates: Requirements 3.5**

### Property 15: Task decomposition bounds

_For any_ complex request, the Workflow Orchestrator should decompose it into between 2 and 4 distinct sub-tasks.
**Validates: Requirements 4.1**

### Property 16: Appropriate agent assignment

_For any_ decomposed sub-task, the Workflow Orchestrator should assign it to a valid Worker Agent type appropriate for the task.
**Validates: Requirements 4.2**

### Property 17: Result synthesis completeness

_For any_ completed workflow, the Workflow Orchestrator should synthesize all sub-task results into a single cohesive response.
**Validates: Requirements 4.3**

### Property 18: Synthesis safety preservation

_For any_ synthesized response, the system should maintain adherence to all safety guardrails and citation requirements.
**Validates: Requirements 4.4**

### Property 19: Graceful worker failure handling

_For any_ Worker Agent failure, the Workflow Orchestrator should handle the error gracefully and inform the user of the limitation.
**Validates: Requirements 4.5**

### Property 20: Parallel platform querying

_For any_ high-stakes data-intensive query, the Parallel Search Agent should execute queries across ChatGPT, Gemini, and Claude platforms simultaneously.
**Validates: Requirements 5.1**

### Property 21: Consensus identification

_For any_ set of results from multiple platforms, the Parallel Search Agent should identify consensus points across the platforms.
**Validates: Requirements 5.2**

### Property 22: Discrepancy highlighting

_For any_ set of results from multiple platforms with conflicting information, the Parallel Search Agent should highlight significant discrepancies.
**Validates: Requirements 5.3**

### Property 23: Source attribution in parallel search

_For any_ completed parallel search, the system should include a visible summary indicating which platforms were queried.
**Validates: Requirements 5.4**

### Property 24: Agent visibility reporting

_For any_ parallel search, the system should report whether the agent's name or firm appeared in top search results on any platform.
**Validates: Requirements 5.5**

### Property 25: Visual element identification

_For any_ property image analysis, the Vision Agent should identify key visual elements such as materials, colors, lighting, size, and layout.
**Validates: Requirements 6.1, 6.2**

### Property 26: Actionable recommendation generation

_For any_ completed visual analysis, the Vision Agent should provide concise, actionable, and cost-effective recommendations.
**Validates: Requirements 6.3**

### Property 27: Market-grounded recommendations

_For any_ Vision Agent recommendation, the advice should reference current market trends from the Agent Profile Context.
**Validates: Requirements 6.4**

### Property 28: Filler-free responses

_For any_ generated response, the system should exclude conversational greetings and unnecessary filler words.
**Validates: Requirements 7.1**

### Property 29: Structured formatting

_For any_ response presenting structured information, the system should use bullet points or tables to maximize readability.
**Validates: Requirements 7.2**

### Property 30: Answer prioritization

_For any_ response, the system should present the final answer before detailed intermediate reasoning.
**Validates: Requirements 7.4**

### Property 31: Profile creation completeness

_For any_ Agent Profile Context creation, the system should store all required fields: agent name, primary market, specialization, preferred tone, and core principle.
**Validates: Requirements 8.1**

### Property 32: Profile update round-trip

_For any_ Agent Profile Context update, the system should persist the changes and return them accurately on subsequent retrieval.
**Validates: Requirements 8.2, 8.3**

### Property 33: Profile validation

_For any_ Agent Profile Context storage attempt, the system should validate that all required fields are present before persisting.
**Validates: Requirements 8.4**

### Property 34: Task structure completeness

_For any_ sub-task assignment, the Workflow Orchestrator should provide a structured task description with all necessary context fields.
**Validates: Requirements 9.1**

### Property 35: Worker response structure

_For any_ completed sub-task, the Worker Agent should return a structured response with results and status fields.
**Validates: Requirements 9.2**

### Property 36: Error response structure

_For any_ Worker Agent error, the Worker Agent should return a structured error response with error type and message fields.
**Validates: Requirements 9.3**

### Property 37: Response validation before synthesis

_For any_ Worker Agent response, the Workflow Orchestrator should validate the response structure before attempting synthesis.
**Validates: Requirements 9.4**

### Property 38: Citation hyperlink formatting

_For any_ citation, the system should format it as a hyperlink with descriptive text.
**Validates: Requirements 10.1**

### Property 39: URL validation

_For any_ citation URL, the system should validate that the URL is accessible before including it in the response.
**Validates: Requirements 10.2**

### Property 40: Unvalidated URL notation

_For any_ citation URL that cannot be validated, the system should include a note that accessibility could not be verified.
**Validates: Requirements 10.3**

### Property 41: Citation labeling

_For any_ response with multiple citations, the system should number or label citations for easy reference.
**Validates: Requirements 10.4**

### Property 42: Source type inclusion

_For any_ citation, the system should include the source type (e.g., MLS listing, market report, data API).
**Validates: Requirements 10.5**

## Error Handling

### Guardrails Violations

**Scenario**: User submits out-of-domain query

- **Detection**: Guardrails service classifies query as non-real-estate
- **Response**: Polite decline with redirect suggestion
- **Logging**: Log violation type and query (sanitized) to CloudWatch
- **User Message**: "I can only assist with real estate-related questions. Would you like help with [suggested real estate topic]?"

**Scenario**: User requests financial guarantees

- **Detection**: Pattern matching for guarantee language
- **Response**: Decline with professional referral
- **Logging**: Log request type to CloudWatch
- **User Message**: "I cannot provide financial guarantees. For investment advice, please consult a licensed financial advisor. I can help you understand historical market trends instead."

**Scenario**: PII detected in user input

- **Detection**: PII detection patterns (SSN, credit card, etc.)
- **Response**: Sanitize input, warn user
- **Logging**: Log PII type detected (not the actual PII)
- **User Message**: "I've detected sensitive personal information in your message. For your security, I've removed it. Please avoid sharing personal details."

### AI Service Errors

**Scenario**: Bedrock API throttling

- **Detection**: ThrottlingException from AWS SDK
- **Response**: Exponential backoff retry (up to 3 attempts)
- **Fallback**: If retries exhausted, return cached response or error message
- **Logging**: Log throttling event with retry count
- **User Message**: "The AI service is experiencing high demand. Please try again in a moment."

**Scenario**: Bedrock timeout

- **Detection**: TimeoutError from AWS SDK
- **Response**: Retry with increased timeout
- **Fallback**: Return partial results if available
- **Logging**: Log timeout with request details
- **User Message**: "The request is taking longer than expected. Here's what I have so far..."

**Scenario**: Schema validation failure

- **Detection**: Zod validation error on AI response
- **Response**: Log raw response, attempt to extract usable data
- **Fallback**: Return generic error or retry with modified prompt
- **Logging**: Log validation errors and raw response
- **User Message**: "I encountered an issue processing the response. Let me try a different approach."

### Workflow Orchestration Errors

**Scenario**: Worker agent failure

- **Detection**: Worker returns error status
- **Response**: Continue with remaining workers, synthesize partial results
- **Fallback**: Inform user of limitation
- **Logging**: Log worker failure with task details
- **User Message**: "I couldn't complete the [task type] analysis, but here's what I found from other sources..."

**Scenario**: All workers fail

- **Detection**: No successful worker results
- **Response**: Return error with explanation
- **Fallback**: Suggest simplified query
- **Logging**: Log complete workflow failure
- **User Message**: "I'm having trouble processing this complex request. Could you try breaking it into smaller questions?"

**Scenario**: Synthesis failure

- **Detection**: Exception during result synthesis
- **Response**: Return individual worker results without synthesis
- **Fallback**: Present results as separate sections
- **Logging**: Log synthesis error
- **User Message**: "Here are the individual analysis results: [list results]"

### Data Access Errors

**Scenario**: DynamoDB unavailable

- **Detection**: ServiceUnavailableException
- **Response**: Retry with exponential backoff
- **Fallback**: Use default agent profile or cached data
- **Logging**: Log DynamoDB error
- **User Message**: "Using default settings for this response. Your profile will be applied once the service is available."

**Scenario**: Agent profile not found

- **Detection**: Null return from profile query
- **Response**: Use system defaults
- **Fallback**: Prompt user to create profile
- **Logging**: Log missing profile access
- **User Message**: "I notice you haven't set up your agent profile yet. Would you like to do that now for personalized responses?"

**Scenario**: Citation URL validation failure

- **Detection**: HTTP error or timeout on URL check
- **Response**: Include citation with validation note
- **Fallback**: Mark as unvalidated
- **Logging**: Log validation failure
- **Citation Format**: "[Source] (URL - accessibility not verified)"

### External API Errors

**Scenario**: Parallel search platform unavailable

- **Detection**: API error from ChatGPT/Gemini/Claude
- **Response**: Continue with available platforms
- **Fallback**: Note which platforms were unavailable
- **Logging**: Log platform failure
- **User Message**: "Cross-validated with [available platforms]. [Unavailable platform] was temporarily unavailable."

**Scenario**: All parallel search platforms fail

- **Detection**: All platform APIs return errors
- **Response**: Fall back to single Bedrock query
- **Fallback**: Skip cross-validation
- **Logging**: Log complete parallel search failure
- **User Message**: "Unable to cross-validate across platforms. Here's the analysis from our primary AI system."

## Testing Strategy

### Unit Testing

**Framework**: Jest with TypeScript

**Coverage Areas**:

1. **Guardrails Service**

   - Domain classification accuracy
   - PII detection patterns
   - Sanitization logic
   - Edge cases (mixed content, ambiguous queries)

2. **Agent Profile Repository**

   - CRUD operations
   - Validation logic
   - DynamoDB key generation
   - Error handling

3. **Citation Service**

   - URL validation logic
   - Citation formatting
   - Source type classification
   - Multiple citation handling

4. **Efficiency Optimizer**

   - Filler word removal
   - Bullet point formatting
   - Table generation
   - Length truncation

5. **Worker Agents**
   - Input validation
   - Output schema compliance
   - Error handling
   - Prompt template rendering

**Example Unit Test**:

```typescript
describe("GuardrailsService", () => {
  it("should reject non-real-estate queries", () => {
    const service = new GuardrailsService();
    const result = service.validateRequest(
      "What is the weather today?",
      config
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("real estate");
  });

  it("should detect SSN patterns", () => {
    const service = new GuardrailsService();
    const pii = service.detectPII("My SSN is 123-45-6789");
    expect(pii).toContain("SSN");
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Each property test should run a minimum of 100 iterations to ensure comprehensive coverage across the input space.

**Test Tagging**: Each property-based test must include a comment with the format:

```typescript
// Feature: kiro-ai-assistant, Property {number}: {property_text}
```

**Coverage Areas**:

1. **Guardrails Properties** (Properties 1-5)

   - Generate random queries (real estate and non-real estate)
   - Generate queries with PII patterns
   - Generate prediction/forecast queries
   - Verify appropriate handling for each category

2. **Citation Properties** (Properties 6-9, 38-42)

   - Generate responses with varying numbers of facts
   - Generate responses with valid/invalid URLs
   - Verify citation presence and formatting
   - Verify source attribution

3. **Personalization Properties** (Properties 10-14, 31-33)

   - Generate random agent profiles
   - Generate various content types
   - Verify profile elements appear in responses
   - Verify profile updates are applied

4. **Orchestration Properties** (Properties 15-19, 34-37)

   - Generate complex queries of varying complexity
   - Simulate worker successes and failures
   - Verify task decomposition bounds
   - Verify synthesis completeness

5. **Parallel Search Properties** (Properties 20-24)

   - Generate high-stakes queries
   - Simulate platform responses with consensus/discrepancies
   - Verify parallel execution
   - Verify visibility reporting

6. **Vision Properties** (Properties 25-27)

   - Generate random property images
   - Generate various question types
   - Verify visual element extraction
   - Verify recommendation generation

7. **Efficiency Properties** (Properties 28-30)
   - Generate responses with filler words
   - Generate structured data
   - Verify filler removal
   - Verify formatting application

**Example Property Test**:

```typescript
import fc from "fast-check";

// Feature: kiro-ai-assistant, Property 1: Out-of-domain query rejection
describe("Property 1: Out-of-domain query rejection", () => {
  it("should reject all non-real-estate queries", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant("What is the weather?"),
          fc.constant("How do I cook pasta?"),
          fc.constant("Tell me about quantum physics"),
          fc.constant("What is 2+2?")
        ),
        (query) => {
          const service = new GuardrailsService();
          const result = service.validateRequest(query, config);
          expect(result.allowed).toBe(false);
          expect(result.reason).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: kiro-ai-assistant, Property 7: Citation presence
describe("Property 7: Citation presence", () => {
  it("should include citations for all factual statements", () => {
    fc.assert(
      fc.property(
        fc.record({
          fact: fc.string({ minLength: 10 }),
          source: fc.webUrl(),
        }),
        async ({ fact, source }) => {
          const response = await generateResponseWithFact(fact, source);
          expect(response).toContain(source);
          expect(response).toMatch(/\[.*\]\(.*\)/); // Markdown link format
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: kiro-ai-assistant, Property 15: Task decomposition bounds
describe("Property 15: Task decomposition bounds", () => {
  it("should decompose complex requests into 2-4 sub-tasks", () => {
    fc.assert(
      fc.property(
        fc.record({
          query: fc.string({ minLength: 50 }),
          complexity: fc.integer({ min: 2, max: 5 }),
        }),
        async ({ query, complexity }) => {
          const orchestrator = new WorkflowOrchestrator();
          const tasks = await orchestrator.decomposeRequest(query, mockProfile);
          expect(tasks.length).toBeGreaterThanOrEqual(2);
          expect(tasks.length).toBeLessThanOrEqual(4);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: kiro-ai-assistant, Property 32: Profile update round-trip
describe("Property 32: Profile update round-trip", () => {
  it("should persist and retrieve profile updates accurately", () => {
    fc.assert(
      fc.property(
        fc.record({
          agentName: fc.string({ minLength: 1 }),
          primaryMarket: fc.string({ minLength: 1 }),
          specialization: fc.constantFrom(
            "luxury",
            "first-time-buyers",
            "investment"
          ),
          preferredTone: fc.constantFrom(
            "warm-consultative",
            "direct-data-driven"
          ),
          corePrinciple: fc.string({ minLength: 10 }),
        }),
        async (profile) => {
          const repo = new AgentProfileRepository();
          await repo.createProfile("test-user", profile);
          const updates = { agentName: "Updated Name" };
          await repo.updateProfile("test-user", updates);
          const retrieved = await repo.getProfile("test-user");
          expect(retrieved?.agentName).toBe("Updated Name");
          expect(retrieved?.primaryMarket).toBe(profile.primaryMarket);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Scope**: End-to-end flows through the system

**Test Scenarios**:

1. Complete conversation flow with guardrails, personalization, and citations
2. Complex workflow with multiple worker agents
3. Parallel search with cross-validation
4. Vision analysis with recommendations
5. Profile creation and update flow
6. Error recovery scenarios

**Example Integration Test**:

```typescript
describe("Complete Conversation Flow", () => {
  it("should handle a real estate query with all features", async () => {
    // Setup
    const userId = "test-user";
    const profile = await createTestProfile(userId);

    // Execute
    const query = "What are the market trends in Austin for luxury homes?";
    const response = await handleChatQuery(userId, query);

    // Verify guardrails
    expect(response.guardrailsPassed).toBe(true);

    // Verify personalization
    expect(response.content).toContain(profile.primaryMarket);
    expect(response.content).toContain(profile.specialization);

    // Verify citations
    expect(response.citations.length).toBeGreaterThan(0);
    response.citations.forEach((citation) => {
      expect(citation.url).toMatch(/^https?:\/\//);
      expect(citation.sourceType).toBeDefined();
    });

    // Verify efficiency
    expect(response.content).not.toContain("Hello");
    expect(response.content).not.toContain("I hope this helps");
  });
});
```

### Performance Testing

**Metrics**:

- Agent profile retrieval: < 500ms (p95)
- Simple query response: < 3s (p95)
- Complex workflow: < 10s (p95)
- Parallel search: < 15s (p95)
- Vision analysis: < 5s (p95)

**Load Testing**:

- Concurrent users: 100
- Requests per second: 50
- Test duration: 10 minutes

**Tools**: Artillery or k6 for load testing

## Deployment Considerations

### Environment Variables

```bash
# AWS Configuration
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
DYNAMODB_TABLE_NAME=bayon-coagent-prod

# External API Keys
CHATGPT_API_KEY=sk-...
GEMINI_API_KEY=...
CLAUDE_API_KEY=...
TAVILY_API_KEY=...

# Feature Flags
ENABLE_PARALLEL_SEARCH=true
ENABLE_VISION_ANALYSIS=true
ENABLE_GUARDRAILS=true

# Performance Tuning
MAX_WORKFLOW_TASKS=4
PARALLEL_SEARCH_TIMEOUT_MS=15000
CITATION_VALIDATION_TIMEOUT_MS=5000
```

### Infrastructure Requirements

**AWS Services**:

- Bedrock: Claude 3.5 Sonnet access
- DynamoDB: Provisioned capacity or on-demand
- CloudWatch: Logs and metrics
- Lambda (optional): For async processing

**Scaling Considerations**:

- DynamoDB: Auto-scaling for read/write capacity
- Bedrock: Request throttling and retry logic
- External APIs: Rate limiting and circuit breakers

### Monitoring

**CloudWatch Metrics**:

- `GuardrailsViolations`: Count of blocked requests by type
- `WorkflowExecutionTime`: Duration of workflow orchestration
- `WorkerAgentFailures`: Count of worker failures by type
- `ParallelSearchLatency`: Time to complete parallel searches
- `CitationValidationFailures`: Count of failed URL validations
- `ProfileRetrievalLatency`: Time to fetch agent profiles

**CloudWatch Alarms**:

- High guardrails violation rate (> 10% of requests)
- High worker failure rate (> 5% of tasks)
- Slow profile retrieval (p95 > 1s)
- Bedrock throttling (> 10 throttles/minute)

**Logging**:

- All guardrails violations (sanitized)
- Workflow execution traces
- Worker agent errors
- External API failures
- Citation validation failures

### Security

**Data Protection**:

- PII detection and sanitization in all inputs
- Encrypted storage for agent profiles (DynamoDB encryption at rest)
- Secure transmission (HTTPS/TLS)
- No logging of sensitive data

**Access Control**:

- User-scoped data access (profiles, conversations)
- IAM roles for AWS service access
- API key rotation for external services

**Compliance**:

- GDPR: User data deletion on request
- CCPA: Data access and portability
- SOC 2: Audit logging and access controls

## Future Enhancements

1. **Multi-turn Conversation Memory**: Maintain context across multiple exchanges
2. **Voice Interface**: Speech-to-text and text-to-speech for hands-free operation
3. **Advanced Vision**: 3D property tours and floor plan analysis
4. **Predictive Analytics**: ML models for market forecasting
5. **Collaborative Features**: Multi-agent collaboration and team workspaces
6. **Custom Worker Agents**: User-defined specialized agents
7. **Real-time Data Feeds**: Live MLS and market data integration
8. **Mobile Optimization**: Native mobile app with offline capabilities
