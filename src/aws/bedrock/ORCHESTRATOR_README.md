# Workflow Orchestrator

The Workflow Orchestrator is a sophisticated system that decomposes complex user requests into specialized sub-tasks, coordinates multiple AI worker agents, and synthesizes their results into cohesive, personalized responses.

## Overview

The orchestrator implements a multi-agent workflow system that:

1. **Decomposes** complex requests into 2-4 specialized sub-tasks
2. **Assigns** tasks to appropriate worker agents (data analyst, content generator, market forecaster)
3. **Executes** tasks in parallel or sequentially based on dependencies
4. **Handles** worker failures gracefully with partial result synthesis
5. **Synthesizes** results into a single cohesive response with personalization
6. **Preserves** safety guardrails and citations throughout the process

## Architecture

```
User Request
     ↓
┌────────────────────────────────────┐
│   Workflow Orchestrator            │
│                                    │
│  1. Request Decomposition          │
│     ↓                              │
│  2. Task Assignment                │
│     ↓                              │
│  3. Parallel/Sequential Execution  │
│     ↓                              │
│  4. Result Synthesis               │
└────────────────────────────────────┘
     ↓
Synthesized Response
```

## Key Components

### WorkflowOrchestrator Class

Main orchestration class with the following methods:

#### `decomposeRequest(prompt, agentProfile?)`

Analyzes a complex user request and breaks it down into 2-4 specialized sub-tasks.

**Requirements:** 4.1 - Must create between 2 and 4 tasks

**Parameters:**

- `prompt` (string): The user's complex request
- `agentProfile` (AgentProfile, optional): Agent profile for context

**Returns:** `Promise<WorkerTask[]>` - Array of 2-4 worker tasks

**Example:**

```typescript
const orchestrator = getWorkflowOrchestrator();
const tasks = await orchestrator.decomposeRequest(
  "Analyze Seattle market trends and create a client email",
  agentProfile
);
// Returns 2-4 tasks assigned to appropriate workers
```

#### `executeWorkflow(tasks)`

Executes an array of worker tasks, respecting dependencies and handling failures.

**Requirements:** 4.5 - Handle worker failures gracefully

**Parameters:**

- `tasks` (WorkerTask[]): Array of tasks to execute

**Returns:** `Promise<WorkerResult[]>` - Results from all tasks

**Features:**

- Parallel execution of independent tasks
- Sequential execution of dependent tasks
- Graceful handling of worker failures
- Validation of worker results (Requirement 9.4)

**Example:**

```typescript
const results = await orchestrator.executeWorkflow(tasks);
// Executes tasks in optimal order, handles failures
```

#### `synthesizeResults(results, agentProfile?, originalPrompt?)`

Combines results from multiple workers into a single cohesive response.

**Requirements:**

- 4.3 - Synthesize into single cohesive response
- 4.4 - Maintain safety guardrails and citations

**Parameters:**

- `results` (WorkerResult[]): Array of worker results
- `agentProfile` (AgentProfile, optional): For personalization
- `originalPrompt` (string, optional): Original user request for context

**Returns:** `Promise<Synthesis>` - Synthesized response with citations

**Features:**

- Combines successful results into cohesive narrative
- Preserves ALL citations from workers
- Applies agent personalization (name, market, tone)
- Maintains safety guardrails (qualifying language, domain constraints)
- Handles partial results when some workers fail

**Example:**

```typescript
const synthesis = await orchestrator.synthesizeResults(
  results,
  agentProfile,
  "Analyze market trends"
);
// Returns synthesized response with citations and key points
```

#### `executeCompleteWorkflow(prompt, agentProfile?)`

Main entry point that executes the complete workflow from request to response.

**Parameters:**

- `prompt` (string): User's complex request
- `agentProfile` (AgentProfile, optional): For personalization

**Returns:** `Promise<WorkflowExecutionResult>` - Complete workflow result

**Example:**

```typescript
const result = await orchestrator.executeCompleteWorkflow(
  "What are Seattle market trends and create a summary email?",
  agentProfile
);

console.log(result.synthesizedResponse);
console.log(result.keyPoints);
console.log(result.citations);
console.log(result.executionTime);
```

## Worker Agents

The orchestrator coordinates the following worker agents:

### 1. Data Analyst Worker

- **Type:** `data-analyst`
- **Purpose:** Market data analysis, property data, statistical analysis
- **Use Cases:** Market trends, property comparisons, data gathering
- **Integration:** Tavily search API for web data

### 2. Content Generator Worker

- **Type:** `content-generator`
- **Purpose:** Personalized content creation
- **Use Cases:** Emails, listings, summaries, marketing copy
- **Features:** Agent profile personalization, tone matching

### 3. Market Forecaster Worker

- **Type:** `market-forecaster`
- **Purpose:** Market forecasting with qualifying language
- **Use Cases:** Market predictions, trend forecasting, investment projections
- **Features:** Automatic qualifying language injection, disclaimers

### 4. Search Worker (Placeholder)

- **Type:** `search`
- **Purpose:** General web search
- **Status:** Not yet implemented

## Task Decomposition

The orchestrator uses Claude to intelligently decompose requests:

### Decomposition Rules

1. Must create between 2 and 4 sub-tasks (Requirement 4.1)
2. Each task assigned to most appropriate worker
3. Tasks can have dependencies (sequential) or run in parallel
4. Clear, specific descriptions for each task
5. All necessary input data included

### Execution Strategies

- **Sequential:** Tasks run in order (each depends on previous)
- **Parallel:** All tasks run simultaneously
- **Mixed:** Some parallel, some sequential (using dependencies)

### Example Decomposition

**Input:** "Analyze Seattle luxury market and create a client email"

**Output:**

```typescript
[
  {
    type: "data-analyst",
    description: "Analyze Seattle luxury home market trends",
    dependencies: [],
    input: {
      query: "Seattle luxury homes market trends",
      dataSource: "tavily",
    },
  },
  {
    type: "content-generator",
    description: "Create client email summarizing market trends",
    dependencies: ["task_0"], // Depends on data analysis
    input: { contentType: "email", context: { marketData: "..." } },
  },
];
```

## Error Handling

The orchestrator implements comprehensive error handling:

### Worker Failures

- **Detection:** Monitors worker result status
- **Response:** Continues with successful workers
- **Synthesis:** Creates response from partial results
- **User Notification:** Acknowledges limitations in response

### Complete Workflow Failure

- **Detection:** All workers fail
- **Response:** Throws error with details
- **Fallback:** Suggests simplified query

### Synthesis Failure

- **Detection:** Exception during synthesis
- **Response:** Returns individual worker results
- **Fallback:** Presents results as separate sections

## Safety Guardrails

The orchestrator maintains safety throughout the workflow:

### In Synthesis

1. **Domain Constraints:** Ensures response stays in real estate domain
2. **Qualifying Language:** Adds "may", "could", "historical trends suggest" for predictions
3. **No Guarantees:** Avoids financial guarantees or legal advice
4. **PII Protection:** No collection of personally identifiable information

### Citation Preservation

- ALL citations from workers are preserved
- Citations formatted as markdown links
- Source types maintained (MLS, market report, data API, web)
- Duplicate citations removed

## Personalization

When an agent profile is provided, the orchestrator:

1. **Incorporates Agent Name:** Naturally in the response
2. **Applies Market Context:** Focuses on agent's primary market
3. **Matches Tone:** Uses preferred tone (warm-consultative, direct-data-driven, professional, casual)
4. **Reflects Specialization:** Aligns with agent's focus (luxury, first-time-buyers, investment, commercial, general)
5. **Includes Core Principle:** Weaves in agent's core principle

## Performance

### Metrics

- **Simple Query:** < 3s (p95)
- **Complex Workflow:** < 10s (p95)
- **Task Decomposition:** < 2s
- **Result Synthesis:** < 2s

### Optimization

- Parallel execution of independent tasks
- Efficient worker routing
- Result caching (future enhancement)

## Usage Examples

See `orchestrator-example.ts` for comprehensive examples:

1. **Simple Workflow:** Basic usage with agent profile
2. **Manual Control:** Step-by-step workflow execution
3. **Failure Handling:** Graceful degradation demo
4. **Real Profile:** Using database-stored profiles
5. **No Profile:** Default system behavior
6. **Complex Workflow:** Multi-step sequential and parallel tasks

## Testing

### Unit Tests

- Task decomposition bounds (2-4 tasks)
- Worker assignment logic
- Dependency resolution
- Error handling

### Property-Based Tests

- Property 15: Task decomposition bounds
- Property 16: Appropriate agent assignment
- Property 17: Result synthesis completeness
- Property 18: Synthesis safety preservation
- Property 19: Graceful worker failure handling
- Property 37: Response validation before synthesis

## Integration

### Server Actions

```typescript
// In your server action
import { getWorkflowOrchestrator } from "@/aws/bedrock/orchestrator";
import { getAgentProfileRepository } from "@/aws/dynamodb/agent-profile-repository";

export async function handleComplexQuery(userId: string, prompt: string) {
  const orchestrator = getWorkflowOrchestrator();
  const profileRepo = getAgentProfileRepository();

  const agentProfile = await profileRepo.getProfile(userId);

  const result = await orchestrator.executeCompleteWorkflow(
    prompt,
    agentProfile || undefined
  );

  return {
    response: result.synthesizedResponse,
    keyPoints: result.keyPoints,
    citations: result.citations,
  };
}
```

### UI Components

```typescript
// In your React component
const handleSubmit = async (prompt: string) => {
  const result = await handleComplexQuery(userId, prompt);

  setResponse(result.response);
  setKeyPoints(result.keyPoints);
  setCitations(result.citations);
};
```

## Future Enhancements

1. **Streaming Support:** Real-time progress updates
2. **Result Caching:** Cache common workflows
3. **Custom Workers:** User-defined specialized agents
4. **Workflow Templates:** Pre-defined workflow patterns
5. **Advanced Dependencies:** Complex dependency graphs
6. **Retry Logic:** Automatic retry for failed workers
7. **Performance Monitoring:** Detailed execution metrics

## Related Documentation

- [Worker Protocol](./worker-protocol.ts) - Standardized communication protocol
- [Data Analyst Worker](./flows/data-analyst-worker.ts) - Data analysis worker
- [Content Generator Worker](./flows/content-generator-worker.ts) - Content creation worker
- [Market Forecaster Worker](./flows/market-forecaster-worker.ts) - Market forecasting worker
- [Agent Profile Repository](../dynamodb/agent-profile-repository.ts) - Profile management

## Requirements Mapping

- **Requirement 4.1:** Task decomposition (2-4 tasks) ✓
- **Requirement 4.2:** Worker agent assignment ✓
- **Requirement 4.3:** Result synthesis ✓
- **Requirement 4.4:** Safety guardrails preservation ✓
- **Requirement 4.5:** Graceful error handling ✓
- **Requirement 9.4:** Response validation ✓
