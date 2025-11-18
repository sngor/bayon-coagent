# Design Document

## Overview

This design optimizes AI model selection across all Co-agent Marketer features by matching each feature's requirements to the most appropriate AWS Bedrock model. The design considers factors including reasoning capability, speed, cost, output length, creativity requirements, and accuracy needs.

### Available Bedrock Models

**Claude 3 Haiku** (`anthropic.claude-3-haiku-20240307-v1:0`)

- **Speed**: Fastest (~0.5-1s response time)
- **Cost**: Lowest ($0.25/1M input tokens, $1.25/1M output tokens)
- **Capability**: Good for simple tasks, short responses
- **Max Tokens**: 4096 output
- **Best For**: Simple classification, short text generation, fast responses

**Claude 3.5 Sonnet** (`anthropic.claude-3-5-sonnet-20241022-v2:0`)

- **Speed**: Fast (~1-2s response time)
- **Cost**: Medium ($3/1M input tokens, $15/1M output tokens)
- **Capability**: Excellent balance of speed and intelligence
- **Max Tokens**: 8192 output
- **Best For**: Most general-purpose tasks, balanced performance

**Claude 3.5 Sonnet v1** (`anthropic.claude-3-5-sonnet-20240620-v1:0`)

- **Speed**: Fast (~1-2s response time)
- **Cost**: Medium ($3/1M input tokens, $15/1M output tokens)
- **Capability**: Previous generation, still very capable
- **Max Tokens**: 8192 output
- **Best For**: Fallback option, similar to v2

**Claude 3 Opus** (`anthropic.claude-3-opus-20240229-v1:0`)

- **Speed**: Slower (~3-5s response time)
- **Cost**: Highest ($15/1M input tokens, $75/1M output tokens)
- **Capability**: Most capable, best reasoning
- **Max Tokens**: 4096 output
- **Best For**: Complex reasoning, critical accuracy, difficult tasks

**Claude 3 Sonnet** (`anthropic.claude-3-sonnet-20240229-v1:0`)

- **Speed**: Medium (~1.5-2.5s response time)
- **Cost**: Medium ($3/1M input tokens, $15/1M output tokens)
- **Capability**: Previous generation Sonnet
- **Max Tokens**: 4096 output
- **Best For**: Legacy support

### Model Selection Strategy

1. **Simple, Fast Tasks** → Claude 3 Haiku (cost-effective, fast)
2. **General Purpose** → Claude 3.5 Sonnet v2 (best balance)
3. **Long-Form Content** → Claude 3.5 Sonnet v2 (8K tokens, creative)
4. **Critical Accuracy** → Claude 3 Opus (best reasoning)
5. **Complex Multi-Step** → Multi-agent with appropriate models

## Architecture

### Current Architecture

```
User Request → Server Action → Single Flow → Single Model → Response
```

### Optimized Architecture

```
User Request → Server Action → Flow (with model config) → Appropriate Model → Response
                                    ↓
                            (Complex tasks)
                                    ↓
                        Multi-Agent Orchestration → Multiple Models → Synthesized Response
```

### Model Configuration System

Each flow will specify its optimal model through the `definePrompt` options:

```typescript
const prompt = definePrompt({
  name: "flowName",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  prompt: `...`,
  options: {
    modelId: "anthropic.claude-3-haiku-20240307-v1:0", // Specific model
    temperature: 0.3, // Lower for accuracy
    maxTokens: 2048, // Appropriate limit
  },
});
```

## Components and Interfaces

### 1. Enhanced Flow Configuration

**File**: `src/aws/bedrock/flow-base.ts`

Add model configuration constants:

```typescript
export const BEDROCK_MODELS = {
  HAIKU: "anthropic.claude-3-haiku-20240307-v1:0",
  SONNET_3: "anthropic.claude-3-sonnet-20240229-v1:0",
  SONNET_3_5_V1: "anthropic.claude-3-5-sonnet-20240620-v1:0",
  SONNET_3_5_V2: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  OPUS: "anthropic.claude-3-opus-20240229-v1:0",
} as const;

export const MODEL_CONFIGS = {
  // Fast, simple tasks
  SIMPLE: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.3,
    maxTokens: 2048,
  },
  // Balanced general purpose
  BALANCED: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.5,
    maxTokens: 4096,
  },
  // Creative content
  CREATIVE: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.7,
    maxTokens: 4096,
  },
  // Long-form content
  LONG_FORM: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.6,
    maxTokens: 8192,
  },
  // Analytical tasks
  ANALYTICAL: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.2,
    maxTokens: 4096,
  },
  // Critical accuracy
  CRITICAL: {
    modelId: BEDROCK_MODELS.OPUS,
    temperature: 0.1,
    maxTokens: 4096,
  },
} as const;
```

### 2. Flow-Specific Model Assignments

Each AI flow will be updated with its optimal model configuration:

#### Content Generation Flows

**Blog Posts** (`generate-blog-post.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: LONG_FORM
- Rationale: Needs 8K tokens for comprehensive posts, creative writing

**Neighborhood Guides** (`generate-neighborhood-guides.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: LONG_FORM
- Rationale: Comprehensive content, multiple sections, creative

**Social Media Posts** (`generate-social-media-post.ts`)

- Model: Claude 3 Haiku
- Config: CREATIVE (but with Haiku)
- Rationale: Short output, fast generation, cost-effective

**Listing Descriptions** (`listing-description-generator.ts`)

- Model: Claude 3 Haiku
- Config: CREATIVE (but with Haiku)
- Rationale: Short persuasive text, fast, cost-effective

**Agent Bio** (`generate-agent-bio.ts`)

- Model: Claude 3 Haiku
- Config: SIMPLE
- Rationale: Very short output (3-4 sentences), simple task

**Video Scripts** (`generate-video-script.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: CREATIVE
- Rationale: Structured but creative, conversational tone

**Listing FAQs** (`generate-listing-faqs.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: BALANCED
- Rationale: Structured Q&A format, comprehensive coverage

**Market Updates** (`generate-market-update.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: BALANCED
- Rationale: Professional tone, data synthesis

#### Analysis Flows

**Review Sentiment** (`analyze-review-sentiment.ts`)

- Model: Claude 3 Haiku
- Config: SIMPLE
- Rationale: Simple classification task, fast, cost-effective

**Multiple Reviews** (`analyze-multiple-reviews.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: ANALYTICAL
- Rationale: Pattern recognition across multiple inputs

**NAP Audit** (`run-nap-audit.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: ANALYTICAL
- Rationale: Accurate data extraction, comparison logic
- Future: Multi-agent with search + extraction + validation agents

**Find Competitors** (`find-competitors.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: ANALYTICAL
- Rationale: Data extraction from search results, accuracy critical
- Future: Multi-agent with search + extraction + analysis agents

**Enrich Competitor Data** (`find-competitors.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: ANALYTICAL
- Rationale: Metric extraction, accuracy important

**Keyword Rankings** (`get-keyword-rankings.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: ANALYTICAL
- Rationale: Accurate ranking extraction from search results

#### Strategic Flows

**Marketing Plan** (`generate-marketing-plan.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: BALANCED
- Rationale: Strategic analysis, actionable recommendations

**Research Agent** (`run-research-agent.ts`)

- Model: Claude 3.5 Sonnet v2
- Config: LONG_FORM
- Rationale: Comprehensive research, 8K tokens for detailed reports
- Future: Multi-agent with search + analysis + synthesis agents

### 3. Multi-Agent Orchestration (Future Enhancement)

For complex tasks like brand audit, competitive analysis, and research, implement multi-agent workflows using AWS Bedrock Agents:

**NAP Audit Multi-Agent Flow**:

1. **Search Agent** (Haiku): Performs web searches for each platform
2. **Extraction Agent** (Sonnet): Extracts NAP data from search results
3. **Validation Agent** (Sonnet): Compares and validates consistency
4. **Synthesis Agent** (Haiku): Formats final report

**Competitor Analysis Multi-Agent Flow**:

1. **Discovery Agent** (Sonnet): Finds competitors in market
2. **Enrichment Agent** (Sonnet): Gathers metrics for each competitor
3. **Analysis Agent** (Sonnet): Compares and ranks competitors
4. **Synthesis Agent** (Haiku): Creates comparison report

**Research Agent Multi-Agent Flow**:

1. **Planning Agent** (Sonnet): Creates research outline
2. **Search Agent** (Haiku): Performs targeted web searches
3. **Analysis Agent** (Sonnet): Analyzes and synthesizes information
4. **Writing Agent** (Sonnet): Produces final report with citations

## Data Models

### Model Configuration Type

```typescript
export interface ModelConfig {
  modelId: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
}

export interface FlowMetrics {
  flowName: string;
  modelId: string;
  executionTimeMs: number;
  tokenUsage: {
    input: number;
    output: number;
  };
  success: boolean;
  error?: string;
}
```

### Flow Configuration Schema

```typescript
interface FlowConfiguration {
  name: string;
  modelConfig: ModelConfig;
  retryConfig?: RetryConfig;
  fallbackModel?: string;
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:

- Model selection properties (1.1, 2.1, 7.2, 8.3, etc.) can be combined into a single comprehensive property
- Temperature configuration properties (1.3, 1.4, 13.3, 14.4) can be combined
- Output validation properties (4.1, 4.5, 12.4, 12.5) are redundant - schema validation covers all
- Token limit properties (2.5, 10.3) can be combined
- Logging properties (15.1, 15.2, 15.3) can be combined

### Correctness Properties

Property 1: Model selection matches feature complexity
_For any_ AI feature invocation, the model ID used should match the feature's complexity category: Haiku for simple tasks (bio, single review sentiment), Sonnet 3.5 for complex tasks (blog posts, competitor analysis, NAP audit), and appropriate models for all other features
**Validates: Requirements 1.1, 1.2, 2.1, 2.2, 7.2, 8.3, 9.3, 10.1, 10.2, 11.1, 11.2, 11.3, 12.1, 12.2, 12.3, 13.1, 13.2, 14.1**

Property 2: Temperature configuration matches feature type
_For any_ AI feature invocation, the temperature setting should match the feature type: low (≤0.3) for analytical features (sentiment, NAP audit, competitors), moderate (0.4-0.6) for balanced features (marketing plans), and higher (≥0.6) for creative features (social media, blog posts)
**Validates: Requirements 1.3, 1.4, 10.4, 11.4, 13.3, 14.4**

Property 3: Token limits match content length requirements
_For any_ AI feature invocation, the maxTokens setting should be appropriate for the expected output length: at least 8192 for long-form content (blog posts, research, neighborhood guides), 4096 for medium content, and 2048 for short content
**Validates: Requirements 2.5, 10.3**

Property 4: Schema validation ensures output completeness
_For any_ AI feature invocation that completes successfully, the output should pass schema validation ensuring all required fields are present and correctly typed
**Validates: Requirements 4.1, 4.5, 7.5, 8.5, 9.5, 10.5, 12.4, 12.5, 13.5, 14.5**

Property 5: Model configuration is overridable
_For any_ AI flow, passing a modelId in the options should override the default model configuration
**Validates: Requirements 3.1, 3.5**

Property 6: Default model fallback works
_For any_ AI flow without explicit model configuration, the system should use the default model from config
**Validates: Requirements 3.2**

Property 7: Input validation precedes model invocation
_For any_ AI feature invocation with invalid input, the system should reject the input and throw a validation error before invoking the AI model
**Validates: Requirements 4.4**

Property 8: Retryable errors trigger retry logic
_For any_ AI model invocation that fails with a retryable error (throttling, timeout, 503), the system should retry with exponential backoff up to the configured maximum retries
**Validates: Requirements 4.2, 5.2**

Property 9: Search failures don't crash flows
_For any_ AI feature that uses web search (NAP audit, competitors, keyword rankings), if the search fails, the flow should fall back gracefully rather than crashing
**Validates: Requirements 5.1**

Property 10: Missing data returns zeros not hallucinations
_For any_ competitor enrichment or keyword ranking request, if specific metrics cannot be found in search results, the system should return 0 for those metrics rather than inventing data
**Validates: Requirements 8.4**

Property 11: NAP comparison ignores formatting differences
_For any_ NAP audit comparison, minor formatting differences (e.g., "St." vs "Street", "(123) 456-7890" vs "123-456-7890") should be considered consistent
**Validates: Requirements 7.3**

Property 12: Missing profiles return "Not Found"
_For any_ NAP audit platform check, if no profile is found in search results, the status should be "Not Found" rather than "Inconsistent" or hallucinated data
**Validates: Requirements 7.4**

Property 13: Competitor discovery returns 3-5 results
_For any_ competitor discovery request, the system should return between 3 and 5 competitors (or fewer if insufficient data exists)
**Validates: Requirements 8.1**

Property 14: Keyword rankings return up to 5 results
_For any_ keyword ranking request, the system should return up to 5 ranked agents with positions 1-5
**Validates: Requirements 9.2, 9.4**

Property 15: Twitter posts respect character limits
_For any_ social media post generation, the Twitter post should be 280 characters or fewer
**Validates: Requirements 11.5**

Property 16: Marketing plans have exactly 3 tasks
_For any_ marketing plan generation, the output should contain exactly 3 tasks, each with task, rationale, tool, and toolLink fields
**Validates: Requirements 14.2, 14.3**

Property 17: Review analysis extracts keywords and themes
_For any_ multiple review analysis, the output should include both keywords (5-7 items) and commonThemes (3-4 items) arrays
**Validates: Requirements 13.4**

Property 18: Execution metrics are logged
_For any_ AI flow execution (success or failure), the system should log model ID, execution time, and outcome
**Validates: Requirements 15.1, 15.2, 15.3**

Property 19: Long inputs are truncated appropriately
_For any_ AI feature invocation with input exceeding token limits, the system should truncate the input while preserving essential context
**Validates: Requirements 5.4**

Property 20: Error logs contain debugging information
_For any_ AI flow error, the error log should include model ID, flow name, error message, and input characteristics
**Validates: Requirements 5.5**

Property 21: Performance meets expectations
_For any_ AI feature invocation, the execution time should be within expected bounds: <2s for Haiku features, <3s for Sonnet features
**Validates: Requirements 1.5**

## Error Handling

### Error Categories

1. **Validation Errors**: Input/output schema validation failures

   - Action: Reject immediately, don't invoke model
   - User Message: Clear description of validation issue

2. **Retryable Errors**: Throttling, timeouts, 503 errors

   - Action: Exponential backoff retry (3 attempts)
   - User Message: "Processing... please wait"

3. **Parse Errors**: Malformed AI responses

   - Action: Attempt recovery, fallback to error response
   - User Message: "AI response was unclear, please try again"

4. **Search Errors**: Web search API failures

   - Action: Fall back to AI knowledge
   - User Message: Continue normally (transparent fallback)

5. **Critical Errors**: Unexpected failures
   - Action: Log detailed error, return user-friendly message
   - User Message: "An error occurred, please try again"

### Error Recovery Strategies

```typescript
try {
  // Validate input
  const validatedInput = inputSchema.parse(input);

  // Invoke model with retry
  const output = await withRetry(() => client.invoke(...));

  // Validate output
  const validatedOutput = outputSchema.parse(output);

  return validatedOutput;
} catch (error) {
  if (error instanceof z.ZodError) {
    // Validation error - don't retry
    throw new ValidationError(error);
  }

  if (isRetryableError(error)) {
    // Already retried, now fail
    throw new RetryExhaustedError(error);
  }

  if (error instanceof BedrockParseError) {
    // Try to recover useful data
    const recovered = attemptRecovery(error.response);
    if (recovered) return recovered;
  }

  // Log and rethrow
  logError(error, { flowName, modelId, input });
  throw new FlowExecutionError(error);
}
```

## Testing Strategy

### Unit Testing

**Model Configuration Tests**:

- Test that each flow has appropriate model configuration
- Test that model constants are correctly defined
- Test that temperature and token limits are in valid ranges

**Flow Execution Tests**:

- Test each flow with valid input produces valid output
- Test input validation rejects invalid inputs
- Test output validation catches malformed responses

**Error Handling Tests**:

- Test retry logic with simulated throttling errors
- Test fallback behavior with simulated search failures
- Test error logging captures required information

### Property-Based Testing

Use `fast-check` library for property-based testing in TypeScript.

**Property Test 1: Model Selection Consistency**

```typescript
// Feature: ai-model-optimization, Property 1: Model selection matches feature complexity
fc.assert(
  fc.property(
    fc.constantFrom(
      "generateAgentBio",
      "analyzeReviewSentiment",
      "generateSocialMediaPost"
    ),
    async (flowName) => {
      const flow = getFlow(flowName);
      const modelId = flow.getModelId();
      expect(modelId).toBe(BEDROCK_MODELS.HAIKU);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 2: Temperature Ranges**

```typescript
// Feature: ai-model-optimization, Property 2: Temperature configuration matches feature type
fc.assert(
  fc.property(
    fc.record({
      flowName: fc.constantFrom(
        "runNapAudit",
        "findCompetitors",
        "analyzeReviewSentiment"
      ),
      input: fc.object(),
    }),
    async ({ flowName, input }) => {
      const flow = getFlow(flowName);
      const temperature = flow.getTemperature();
      expect(temperature).toBeLessThanOrEqual(0.3);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 3: Schema Validation**

```typescript
// Feature: ai-model-optimization, Property 4: Schema validation ensures output completeness
fc.assert(
  fc.property(
    fc.constantFrom(...allFlowNames),
    fc.object(),
    async (flowName, input) => {
      const flow = getFlow(flowName);
      try {
        const output = await flow.execute(input);
        // If execution succeeds, output must be valid
        expect(() => flow.outputSchema.parse(output)).not.toThrow();
      } catch (error) {
        // Execution can fail, but if it succeeds, output must be valid
        if (!(error instanceof ValidationError)) {
          throw error;
        }
      }
    }
  ),
  { numRuns: 50 }
);
```

**Property Test 4: Twitter Character Limit**

```typescript
// Feature: ai-model-optimization, Property 15: Twitter posts respect character limits
fc.assert(
  fc.property(
    fc.record({
      topic: fc.string({ minLength: 10, maxLength: 200 }),
      tone: fc.constantFrom("professional", "casual", "enthusiastic"),
    }),
    async (input) => {
      const output = await generateSocialMediaPost(input);
      expect(output.twitter.length).toBeLessThanOrEqual(280);
    }
  ),
  { numRuns: 100 }
);
```

**Property Test 5: Marketing Plan Structure**

```typescript
// Feature: ai-model-optimization, Property 16: Marketing plans have exactly 3 tasks
fc.assert(
  fc.property(
    fc.record({
      brandAudit: fc.object(),
      competitors: fc.array(fc.object(), { minLength: 3, maxLength: 5 }),
    }),
    async (input) => {
      const output = await generateMarketingPlan(input);
      expect(output.plan).toHaveLength(3);
      output.plan.forEach((task) => {
        expect(task).toHaveProperty("task");
        expect(task).toHaveProperty("rationale");
        expect(task).toHaveProperty("tool");
        expect(task).toHaveProperty("toolLink");
      });
    }
  ),
  { numRuns: 50 }
);
```

### Integration Testing

**End-to-End Flow Tests**:

- Test complete user journeys through each feature
- Test with real Bedrock API calls (in staging environment)
- Measure actual performance and token usage

**Search Integration Tests**:

- Test NAP audit with real web search
- Test competitor discovery with real search results
- Test keyword rankings with real search data

**Multi-Agent Tests** (Future):

- Test agent orchestration workflows
- Test context passing between agents
- Test synthesis of multi-agent outputs

### Performance Testing

**Latency Benchmarks**:

- Haiku features: < 2 seconds
- Sonnet features: < 3 seconds
- Long-form features: < 5 seconds

**Cost Tracking**:

- Monitor token usage per feature
- Calculate cost per feature invocation
- Identify optimization opportunities

**Load Testing**:

- Test concurrent feature invocations
- Test rate limit handling
- Test retry behavior under load

## Deployment Strategy

### Phase 1: Model Configuration (Week 1)

1. Add model constants and configuration presets to `flow-base.ts`
2. Update all flows with optimal model configurations
3. Add unit tests for model configuration
4. Deploy to staging environment

### Phase 2: Testing & Validation (Week 2)

1. Run property-based tests on all flows
2. Perform integration testing with real API calls
3. Measure performance and cost improvements
4. Fix any issues discovered

### Phase 3: Production Deployment (Week 3)

1. Deploy to production with feature flag
2. Monitor performance metrics and error rates
3. Gradually roll out to all users
4. Document cost savings and performance improvements

### Phase 4: Multi-Agent Enhancement (Future)

1. Implement Bedrock Agents integration
2. Create multi-agent workflows for complex features
3. Test and validate multi-agent performance
4. Deploy multi-agent features incrementally

## Monitoring & Observability

### Metrics to Track

**Performance Metrics**:

- Execution time by feature and model
- Token usage by feature and model
- Success rate by feature and model
- Error rate by error type

**Cost Metrics**:

- Total token usage per day/week/month
- Cost per feature invocation
- Cost savings vs. single-model approach

**Quality Metrics**:

- Schema validation failure rate
- Retry rate by error type
- Search fallback rate
- User satisfaction (if available)

### Logging Strategy

```typescript
interface FlowExecutionLog {
  timestamp: string;
  flowName: string;
  modelId: string;
  executionTimeMs: number;
  tokenUsage: {
    input: number;
    output: number;
  };
  success: boolean;
  error?: {
    type: string;
    message: string;
    retryCount: number;
  };
  metadata: {
    userId?: string;
    featureCategory: string;
    temperature: number;
    maxTokens: number;
  };
}
```

### Alerting Rules

- Alert if error rate > 5% for any feature
- Alert if average latency > 2x expected for any feature
- Alert if token usage spikes > 50% above baseline
- Alert if retry rate > 20% for any feature

## Migration Path

### Backward Compatibility

All existing flows will continue to work without changes. The optimization is additive:

1. Flows without explicit model config use default (Sonnet 3.5 v2)
2. Flows with explicit model config use specified model
3. No breaking changes to flow interfaces
4. Gradual migration of flows to optimal models

### Rollback Plan

If issues arise:

1. Remove model configuration from problematic flows
2. Flows revert to default model (current behavior)
3. No data loss or service disruption
4. Can roll back individual flows independently

## Future Enhancements

### Multi-Agent Orchestration

Implement AWS Bedrock Agents for complex workflows:

1. **NAP Audit Agent**: Specialized agents for search, extraction, validation
2. **Competitor Analysis Agent**: Agents for discovery, enrichment, analysis
3. **Research Agent**: Agents for planning, search, analysis, writing

### Model Fine-Tuning

Consider fine-tuning models for specific tasks:

1. Fine-tune for real estate domain knowledge
2. Fine-tune for consistent output formatting
3. Fine-tune for brand voice and tone

### Adaptive Model Selection

Implement dynamic model selection based on:

1. Input complexity analysis
2. User tier/subscription level
3. Time-of-day cost optimization
4. Historical performance data

### Streaming Responses

Add streaming support for long-form content:

1. Stream blog posts as they're generated
2. Stream research reports section by section
3. Improve perceived performance for users
