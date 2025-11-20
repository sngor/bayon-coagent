# Worker Agents

Worker agents are specialized AI components that handle specific sub-tasks within the Kiro AI Assistant's workflow orchestration system. Each worker agent is optimized for a particular type of task and follows a standardized communication protocol.

## Overview

The worker agent system consists of:

1. **Standardized Communication Protocol** - Defines how tasks are assigned and results are returned
2. **Data Analyst Worker** - Handles data analysis and web search tasks
3. **Content Generator Worker** - Creates personalized content with agent profile integration
4. **Market Forecaster Worker** - Generates market predictions with qualifying language

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Workflow Orchestrator                         │
│  - Decomposes complex requests                          │
│  - Assigns tasks to workers                             │
│  - Synthesizes results                                  │
└────────────┬────────────────────────────────────────────┘
             │
             │ WorkerTask
             ▼
┌─────────────────────────────────────────────────────────┐
│                  Worker Agents                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Data Analyst │  │   Content    │  │   Market     │  │
│  │              │  │  Generator   │  │ Forecaster   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────┬────────────────────────────────────────────┘
             │
             │ WorkerResult
             ▼
┌─────────────────────────────────────────────────────────┐
│              Result Synthesis                           │
└─────────────────────────────────────────────────────────┘
```

## Worker Communication Protocol

### WorkerTask

A structured task description with all necessary context:

```typescript
interface WorkerTask {
  id: string;
  type: "data-analyst" | "content-generator" | "market-forecaster" | "search";
  description: string;
  dependencies: string[];
  input: Record<string, any>;
  context?: {
    userId?: string;
    agentProfile?: any;
    conversationId?: string;
  };
  createdAt: string;
  status: "pending" | "in-progress" | "completed" | "failed";
}
```

### WorkerResult

A structured response with results and status:

```typescript
interface WorkerResult {
  taskId: string;
  workerType: WorkerAgentType;
  status: "success" | "error";
  output?: Record<string, any>;
  error?: WorkerError;
  metadata: {
    executionTime: number;
    startedAt: string;
    completedAt: string;
    modelId?: string;
    tokensUsed?: number;
  };
  citations?: Array<{
    url: string;
    title: string;
    sourceType: string;
  }>;
}
```

### WorkerError

A structured error response:

```typescript
interface WorkerError {
  type:
    | "VALIDATION_ERROR"
    | "API_ERROR"
    | "TIMEOUT_ERROR"
    | "RESOURCE_NOT_FOUND"
    | "INTERNAL_ERROR";
  message: string;
  code?: string;
  details?: Record<string, any>;
  stack?: string;
  timestamp: string;
}
```

## Worker Agents

### 1. Data Analyst Worker

**Purpose**: Handles data analysis tasks with Tavily search integration.

**Capabilities**:

- Market data analysis
- Property data analysis
- Web search for data gathering
- Statistical analysis
- Source citation

**Input**:

```typescript
{
  query: string;
  dataSource: 'mls' | 'market-report' | 'tavily' | 'web' | 'internal';
  filters?: Record<string, any>;
  context?: {
    market?: string;
    timeframe?: string;
    propertyType?: string;
  };
}
```

**Output**:

```typescript
{
  data: Array<{ label: string; value: string | number; unit?: string; source?: string }>;
  summary: string;
  sources: Array<{ url: string; title: string; sourceType: string }>;
  insights?: string[];
  confidence?: number;
}
```

**Usage**:

```typescript
import { analyzeData } from "@/aws/bedrock/workers";

const result = await analyzeData({
  query: "What are the average home prices in Austin?",
  dataSource: "tavily",
  context: {
    market: "Austin, TX",
    timeframe: "2024",
  },
});
```

### 2. Content Generator Worker

**Purpose**: Creates personalized content with agent profile integration.

**Capabilities**:

- Email generation
- Listing descriptions
- Social media posts
- Marketing content
- Tone matching
- Brand personalization

**Input**:

```typescript
{
  contentType: 'email' | 'listing' | 'social-post' | 'summary' | 'blog-excerpt' | 'marketing-copy';
  context: Record<string, any>;
  agentProfile: {
    agentName: string;
    primaryMarket: string;
    specialization: 'luxury' | 'first-time-buyers' | 'investment' | 'commercial' | 'general';
    preferredTone: 'warm-consultative' | 'direct-data-driven' | 'professional' | 'casual';
    corePrinciple: string;
  };
  instructions?: string;
  targetLength?: number;
}
```

**Output**:

```typescript
{
  content: string;
  tone: string;
  wordCount: number;
  themes?: string[];
  personalization: {
    agentNameUsed: boolean;
    marketMentioned: boolean;
    specializationReflected: boolean;
    corePrincipleIncluded: boolean;
  };
}
```

**Usage**:

```typescript
import { generateContent } from "@/aws/bedrock/workers";

const result = await generateContent({
  contentType: "email",
  context: {
    recipient: "potential buyer",
    subject: "New listing in your area",
  },
  agentProfile: {
    agentName: "Jane Smith",
    primaryMarket: "Austin, TX",
    specialization: "luxury",
    preferredTone: "warm-consultative",
    corePrinciple: "Maximize client ROI with data-first strategies",
  },
});
```

### 3. Market Forecaster Worker

**Purpose**: Generates market predictions with qualifying language.

**Capabilities**:

- Price trend predictions
- Market condition forecasts
- Investment timing analysis
- Automatic qualifying language injection
- Confidence level assessment

**Input**:

```typescript
{
  historicalData: Array<{ date: string; value: number; metric: string }>;
  timeframe: '30-day' | '90-day' | '6-month' | '1-year' | '2-year';
  market: string;
  propertyType?: string;
  context?: Record<string, any>;
}
```

**Output**:

```typescript
{
  forecast: {
    trend: 'up' | 'down' | 'stable';
    confidence: number;
    priceRange: { low: number; high: number; median?: number };
    percentageChange?: { low: number; high: number; expected: number };
  };
  factors: string[];
  disclaimer: string;
  analysis: string;
  recommendations?: string[];
  sources?: Array<{ type: string; description: string }>;
}
```

**Usage**:

```typescript
import { forecastMarket } from "@/aws/bedrock/workers";

const result = await forecastMarket({
  historicalData: [
    { date: "2024-01", value: 450000, metric: "median_price" },
    { date: "2024-02", value: 455000, metric: "median_price" },
    // ... more data
  ],
  timeframe: "90-day",
  market: "Austin, TX",
  propertyType: "single-family",
});
```

## Helper Functions

### Creating Tasks

```typescript
import { createWorkerTask } from "@/aws/bedrock/workers";

const task = createWorkerTask(
  "data-analyst",
  "Analyze market trends",
  {
    query: "What are the trends?",
    dataSource: "tavily",
  },
  {
    dependencies: [],
    context: { userId: "user123" },
  }
);
```

### Creating Results

```typescript
import { createSuccessResult, createErrorResult } from "@/aws/bedrock/workers";

// Success result
const successResult = createSuccessResult(
  "task123",
  "data-analyst",
  { data: [], summary: "Analysis complete" },
  { executionTime: 1500, startedAt: new Date().toISOString() }
);

// Error result
const errorResult = createErrorResult(
  "task123",
  "data-analyst",
  { type: "API_ERROR", message: "Search API failed" },
  { executionTime: 500, startedAt: new Date().toISOString() }
);
```

### Validating Structures

```typescript
import {
  validateWorkerTask,
  validateWorkerResult,
} from "@/aws/bedrock/workers";

// Validate task structure
const validTask = validateWorkerTask(unknownTask);

// Validate result structure
const validResult = validateWorkerResult(unknownResult);
```

### Type Guards

```typescript
import { isSuccessResult, isErrorResult } from "@/aws/bedrock/workers";

if (isSuccessResult(result)) {
  console.log("Output:", result.output);
} else if (isErrorResult(result)) {
  console.error("Error:", result.error.message);
}
```

## Executing Workers

### Direct Execution

```typescript
import { executeWorkerTask } from "@/aws/bedrock/workers";

const task = createWorkerTask("data-analyst", "Analyze data", input);
const result = await executeWorkerTask(task);
```

### Convenience Functions

Each worker provides a convenience function for direct execution without the protocol:

```typescript
import {
  analyzeData,
  generateContent,
  forecastMarket,
} from "@/aws/bedrock/workers";

// Direct execution
const analysis = await analyzeData(input);
const content = await generateContent(input);
const forecast = await forecastMarket(input);
```

## Error Handling

All workers follow consistent error handling:

1. **Validation Errors**: Input validation failures
2. **API Errors**: External API or Bedrock failures
3. **Timeout Errors**: Operation timeouts
4. **Resource Not Found**: Missing required resources
5. **Internal Errors**: Unexpected errors

Example:

```typescript
const result = await executeWorkerTask(task);

if (result.status === "error") {
  switch (result.error?.type) {
    case "VALIDATION_ERROR":
      console.error("Invalid input:", result.error.message);
      break;
    case "API_ERROR":
      console.error("API failed:", result.error.message);
      break;
    default:
      console.error("Unexpected error:", result.error?.message);
  }
}
```

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 4.2**: Worker agents handle specific sub-tasks
- **Requirement 9.1**: Structured task descriptions with all necessary context
- **Requirement 9.2**: Structured responses with results and status
- **Requirement 9.3**: Structured error responses with error type and message
- **Requirement 9.4**: Response structure validation before synthesis
- **Requirement 1.5**: Qualifying language for market predictions

## Testing

See the test files for each worker:

- `src/aws/bedrock/flows/__tests__/data-analyst-worker.test.ts`
- `src/aws/bedrock/flows/__tests__/content-generator-worker.test.ts`
- `src/aws/bedrock/flows/__tests__/market-forecaster-worker.test.ts`

## Future Enhancements

1. **Additional Workers**: Vision agent, parallel search agent
2. **Streaming Support**: Real-time result streaming
3. **Caching**: Result caching for repeated queries
4. **Rate Limiting**: Per-worker rate limiting
5. **Metrics**: Detailed performance metrics per worker
6. **Retry Logic**: Automatic retry with exponential backoff
