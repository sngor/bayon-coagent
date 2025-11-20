# Bayon AI Assistant Infrastructure Documentation

## Overview

This document describes the core infrastructure and schemas for the Bayon AI Assistant system. The infrastructure includes Zod schemas for validation, DynamoDB key patterns for data storage, and TypeScript interfaces for type safety.

## Architecture Components

### 1. Schemas (`src/ai/schemas/bayon-assistant-schemas.ts`)

Comprehensive Zod schemas provide runtime validation and type inference for all data models:

#### Agent Profile Schemas

- `AgentProfileSchema`: Complete agent profile with personalization data
- `CreateAgentProfileInputSchema`: Input for creating new profiles
- `UpdateAgentProfileInputSchema`: Input for updating existing profiles
- Specialization types: luxury, first-time-buyers, investment, commercial, general
- Tone types: warm-consultative, direct-data-driven, professional, casual

#### Citation Schemas

- `CitationSchema`: Source references with URL validation
- `CreateCitationInputSchema`: Input for creating citations
- `CitationResultSchema`: Citations with formatted text
- Source types: mls, market-report, data-api, web

#### Workflow Orchestration Schemas

- `WorkflowTaskSchema`: Individual sub-tasks in a workflow
- `WorkflowResultSchema`: Results from completed tasks
- `WorkflowExecutionSchema`: Complete workflow execution history
- Task types: data-analysis, content-generation, market-forecast, search
- Task statuses: pending, in-progress, completed, failed

#### Worker Agent Communication Schemas

- `WorkerTaskInputSchema`: Standardized input format for workers
- `WorkerTaskOutputSchema`: Standardized output format with error handling
- Includes metadata for execution time, tokens used, and citations

#### Specialized Worker Schemas

- **Data Analyst**: Query data sources (MLS, market reports, Tavily)
- **Content Generator**: Generate emails, listings, summaries, social posts
- **Market Forecaster**: Predict market trends with confidence levels

#### Parallel Search Schemas

- `ParallelSearchInputSchema`: Multi-platform search configuration
- `ParallelSearchOutputSchema`: Consensus, discrepancies, and visibility
- `PlatformResultSchema`: Individual platform results
- Platforms: ChatGPT, Gemini, Claude

#### Vision Analysis Schemas

- `VisionAnalysisInputSchema`: Image data with questions
- `VisionAnalysisOutputSchema`: Visual elements and recommendations
- Identifies materials, colors, lighting, size, layout
- Provides actionable recommendations with cost estimates

#### Guardrails Schemas

- `GuardrailsConfigSchema`: Safety configuration
- `GuardrailsResultSchema`: Validation results with violation types
- Violation types: out-of-domain, financial-guarantee, legal-advice, pii-detected, unethical-request

#### Conversation Schemas

- `ConversationSchema`: Complete conversation history
- `ConversationMessageSchema`: Individual messages with citations
- Includes agent profile snapshot at time of conversation

#### Response Enhancement Schemas

- `ResponseEnhancementConfigSchema`: Enhancement settings
- `EnhancedResponseSchema`: Original and enhanced responses with modifications

### 2. DynamoDB Key Patterns (`src/aws/dynamodb/keys.ts`)

All entities follow a single-table design pattern with composite keys:

#### Agent Profile

```typescript
PK: USER#<userId>
SK: PROFILE#AGENT
EntityType: AgentProfile
```

**Function**: `getAgentProfileKeysV2(userId)`

#### Citation

```typescript
PK: USER#<userId>
SK: CITATION#<citationId>
EntityType: Citation
```

**Function**: `getCitationKeys(userId, citationId)`

#### Conversation

```typescript
PK: USER#<userId>
SK: CONVERSATION#<conversationId>
EntityType: Conversation
```

**Function**: `getConversationKeys(userId, conversationId)`

#### Workflow Execution

```typescript
PK: USER#<userId>
SK: WORKFLOW#<workflowId>
EntityType: WorkflowExecution
```

**Function**: `getWorkflowExecutionKeys(userId, workflowId)`

### 3. TypeScript Interfaces (`src/lib/bayon-assistant-types.ts`)

Comprehensive type definitions for all system components:

#### Repository Interfaces

- `IAgentProfileRepository`: CRUD operations for agent profiles
- `ICitationRepository`: Citation management
- `IConversationRepository`: Conversation history management
- `IWorkflowExecutionRepository`: Workflow execution tracking

#### Service Interfaces

- `IGuardrailsService`: Safety validation and PII detection
- `ICitationService`: Citation creation, validation, and formatting
- `IResponseEnhancementService`: Response improvement and optimization
- `IEfficiencyOptimizer`: Text optimization and formatting

#### Worker Agent Interfaces

- `IWorkerAgent<TInput, TOutput>`: Base worker interface
- `IDataAnalystWorker`: Data analysis and search
- `IContentGeneratorWorker`: Content creation
- `IMarketForecasterWorker`: Market predictions

#### Orchestrator Interfaces

- `IWorkflowOrchestrator`: Request decomposition and synthesis
- `WorkflowDecomposition`: Execution plan details
- `WorkflowSynthesisContext`: Context for result synthesis

#### Parallel Search Interfaces

- `IParallelSearchAgent`: Multi-platform search coordination
- `PlatformSearchResult`: Individual platform results

#### Vision Agent Interfaces

- `IVisionAgent`: Image analysis and recommendations
- `VisualElement`: Identified visual components
- `PropertyRecommendation`: Actionable recommendations

#### Personalization Interfaces

- `IPersonalizationService`: Profile injection and tone matching
- `PersonalizationContext`: Context for personalization

#### Error Handling Interfaces

- `BayonAssistantError`: Structured error information
- `IErrorHandler`: Error handling for all components
- `RetryConfig`: Retry configuration for resilience

#### Logging and Monitoring Interfaces

- `PerformanceMetrics`: Operation performance tracking
- `ILogger`: Structured logging
- `IMonitoringService`: CloudWatch metrics

#### Server Action Interfaces

- `ChatQueryInput/Result`: Chat interface I/O
- `VisionQueryInput/Result`: Vision interface I/O
- `ProfileManagementInput/Result`: Profile management I/O

#### Streaming Interfaces

- `StreamChunk`: Real-time response chunks
- `IStreamingHandler`: Stream event handling

#### Cache Interfaces

- `CacheEntry<T>`: Cached data with TTL
- `ICache<T>`: Generic cache interface

#### External API Interfaces

- `ITavilySearchClient`: Tavily search integration
- `IExternalAIPlatformClient`: External AI platform integration

#### Configuration Interfaces

- `BayonAssistantConfig`: System-wide configuration
- `ModelConfig`: AI model configuration

## Data Flow

### 1. Chat Query Flow

```
User Input
  ↓
Guardrails Validation (IGuardrailsService)
  ↓
Profile Loading (IAgentProfileRepository)
  ↓
Request Decomposition (IWorkflowOrchestrator)
  ↓
Worker Execution (IWorkerAgent)
  ↓
Citation Enrichment (ICitationService)
  ↓
Response Enhancement (IResponseEnhancementService)
  ↓
Efficiency Optimization (IEfficiencyOptimizer)
  ↓
Response Delivery
```

### 2. Vision Analysis Flow

```
Image Upload
  ↓
Guardrails Validation
  ↓
Profile Loading
  ↓
Vision Analysis (IVisionAgent)
  ↓
Recommendation Generation
  ↓
Market Alignment
  ↓
Response Delivery
```

### 3. Parallel Search Flow

```
Search Query
  ↓
Profile Loading
  ↓
Multi-Platform Execution (IParallelSearchAgent)
  ↓
Consensus Analysis
  ↓
Discrepancy Detection
  ↓
Agent Visibility Check
  ↓
Summary Generation
```

## DynamoDB Access Patterns

### Query Patterns

1. **Get Agent Profile**

   - PK = `USER#<userId>`, SK = `PROFILE#AGENT`
   - Use: Load personalization data

2. **Get User Citations**

   - PK = `USER#<userId>`, SK begins_with `CITATION#`
   - Use: List all citations for a user

3. **Get User Conversations**

   - PK = `USER#<userId>`, SK begins_with `CONVERSATION#`
   - Use: List conversation history

4. **Get Workflow Executions**

   - PK = `USER#<userId>`, SK begins_with `WORKFLOW#`
   - Use: List workflow execution history

5. **Get Conversation Citations**
   - Query citations, filter by conversationId in Data
   - Use: Get all citations used in a conversation

## Performance Considerations

### Caching Strategy

- Agent profiles cached for 5 minutes (requirement 8.5: <500ms retrieval)
- Cache invalidation on profile updates
- Performance metrics tracked for all operations

### Retry Logic

- Exponential backoff for Bedrock API calls
- Retry for DynamoDB throttling
- Retry for external API failures
- Configurable retry attempts and delays

### Monitoring

- CloudWatch metrics for all operations
- Performance tracking for profile retrieval
- Guardrail violation logging
- Workflow execution metrics
- Citation validation metrics

## Validation Rules

### Agent Profile Validation

- Agent name: 1-100 characters, required
- Primary market: 1-200 characters, required
- Specialization: Must be one of enum values, required
- Preferred tone: Must be one of enum values, required
- Core principle: 10-500 characters, required

### Citation Validation

- URL: Must be valid URL format
- Title: Required
- Source type: Must be one of enum values
- URL validation: HTTP HEAD request with timeout
- Unvalidated URLs: Include note in citation

### Workflow Validation

- Task count: 2-4 tasks per workflow (requirement 4.1)
- Task dependencies: Must reference valid task IDs
- Worker agent: Must be valid worker type
- Input schema: Validated against worker-specific schema

### Guardrails Validation

- Domain check: Real estate topics only
- PII detection: SSN, credit cards, phone numbers, addresses
- Financial guarantees: Pattern matching for guarantee language
- Legal advice: Pattern matching for legal requests
- Unethical requests: Pattern matching for unethical content

## Error Handling

### Error Types

1. **GuardrailViolation**: Request blocked by safety rules
2. **WorkerFailure**: Worker agent execution failed
3. **BedrockError**: AWS Bedrock API error
4. **DynamoDBError**: Database operation error
5. **ExternalAPIError**: External service error
6. **ValidationError**: Schema validation failed

### Error Recovery

- Graceful degradation for worker failures
- Partial result synthesis when possible
- User notification of limitations
- Retry with exponential backoff
- Fallback to cached data when available

## Testing Strategy

### Unit Tests

- Schema validation tests
- Key pattern generation tests
- Repository CRUD operation tests
- Service method tests

### Property-Based Tests

- Profile creation completeness (Property 31)
- Profile update round-trip (Property 32)
- Profile validation (Property 33)
- Task structure completeness (Property 34)
- Worker response structure (Property 35)
- Error response structure (Property 36)

### Integration Tests

- End-to-end chat flow
- End-to-end vision flow
- End-to-end parallel search flow
- Multi-worker orchestration
- Error handling scenarios

## Security Considerations

### PII Protection

- PII detection in all user inputs
- Automatic sanitization of detected PII
- No PII stored in database
- PII types logged (not actual values)

### Access Control

- User ID required for all operations
- Profile access restricted to owner
- Conversation access restricted to owner
- Citation access restricted to owner

### Data Validation

- All inputs validated with Zod schemas
- SQL injection prevention (NoSQL)
- XSS prevention in responses
- URL validation before citation inclusion

## Usage Examples

### Creating an Agent Profile

```typescript
import { getAgentProfileRepository } from "@/aws/dynamodb/agent-profile-repository";

const repo = getAgentProfileRepository();
const profile = await repo.createProfile("user123", {
  agentName: "Jane Smith",
  primaryMarket: "Austin, TX",
  specialization: "luxury",
  preferredTone: "warm-consultative",
  corePrinciple: "Maximize client ROI with data-first strategies",
});
```

### Validating with Schemas

```typescript
import { AgentProfileSchema } from "@/ai/schemas/bayon-assistant-schemas";

const result = AgentProfileSchema.safeParse(data);
if (result.success) {
  const profile = result.data;
  // Use validated profile
} else {
  console.error(result.error);
}
```

### Using Type Interfaces

```typescript
import type {
  IGuardrailsService,
  GuardrailsResult,
} from "@/lib/bayon-assistant-types";

class GuardrailsService implements IGuardrailsService {
  async validateRequest(
    prompt: string,
    config: GuardrailsConfig
  ): Promise<GuardrailsResult> {
    // Implementation
  }
  // ... other methods
}
```

## Next Steps

After setting up the core infrastructure:

1. Implement Guardrails Service (Task 2)
2. Implement Citation Service (Task 4)
3. Implement Response Enhancement Layer (Task 5)
4. Implement Worker Agents (Task 6)
5. Implement Workflow Orchestrator (Task 7)
6. Implement Parallel Search Agent (Task 8)
7. Implement Vision Agent (Task 9)
8. Implement Personalization Layer (Task 10)
9. Implement Efficiency Optimizer (Task 11)

## References

- Design Document: `.kiro/specs/kiro-ai-assistant/design.md`
- Requirements Document: `.kiro/specs/kiro-ai-assistant/requirements.md`
- Tasks Document: `.kiro/specs/kiro-ai-assistant/tasks.md`
- DynamoDB Repository: `src/aws/dynamodb/repository.ts`
- Bedrock Client: `src/aws/bedrock/client.ts`
