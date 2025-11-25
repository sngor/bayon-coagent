# Parallel Search Agent

The Parallel Search Agent executes queries across multiple AI platforms (ChatGPT, Gemini, Claude) simultaneously for cross-validation, consensus building, and agent visibility detection.

## Features

- **Multi-Platform Querying**: Execute searches across ChatGPT, Gemini, and Claude in parallel
- **Consensus Analysis**: Identify common themes and facts across platforms
- **Discrepancy Detection**: Highlight significant differences between platform responses
- **Agent Visibility**: Track mentions and rankings of agents/firms in search results
- **Graceful Degradation**: Continue with available platforms if some fail
- **Timeout Protection**: 15-second timeout per platform to prevent hanging
- **Source Attribution**: Extract and track source URLs from responses

## Requirements Validation

This implementation validates the following requirements:

- **Requirement 5.1**: Parallel execution across ChatGPT, Gemini, and Claude
- **Requirement 5.2**: Consensus point identification
- **Requirement 5.3**: Discrepancy highlighting
- **Requirement 5.4**: Source attribution and platform availability reporting
- **Requirement 5.5**: Agent visibility reporting

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              ParallelSearchAgent                        │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │         search(input)                           │   │
│  │  - Coordinates parallel execution               │   │
│  │  - Aggregates results                           │   │
│  │  - Generates summary                            │   │
│  └────────────┬────────────────────────────────────┘   │
│               │                                         │
│               ▼                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │    searchPlatform() - Parallel Execution         │  │
│  │                                                  │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │ ChatGPT  │  │  Gemini  │  │  Claude  │      │  │
│  │  │  Search  │  │  Search  │  │  Search  │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘      │  │
│  │       │              │              │           │  │
│  │       └──────────────┴──────────────┘           │  │
│  │                     │                           │  │
│  │                     ▼                           │  │
│  │         Timeout & Error Handling                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │    analyzeConsensus()                            │  │
│  │  - Uses Bedrock to identify consensus           │  │
│  │  - Highlights discrepancies                     │  │
│  │  - Fallback to simple analysis                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │    detectAgentVisibility()                       │  │
│  │  - Checks for agent/firm mentions               │  │
│  │  - Detects ranking positions                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Usage

### Basic Setup

```typescript
import {
  ParallelSearchAgent,
  PlatformAPIConfig,
} from "@/aws/bedrock/parallel-search-agent";
import { ParallelSearchInput } from "@/ai/schemas/parallel-search-schemas";

// Configure API keys
const config: PlatformAPIConfig = {
  chatgpt: {
    apiKey: process.env.CHATGPT_API_KEY || "",
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
  },
  claude: {
    apiKey: process.env.CLAUDE_API_KEY || "",
  },
};

// Create agent
const agent = new ParallelSearchAgent(config);
```

### Example 1: Basic Parallel Search

```typescript
const input: ParallelSearchInput = {
  query:
    "What are the current real estate market trends in Seattle, Washington?",
  platforms: ["chatgpt", "gemini", "claude"],
};

const result = await agent.search(input);

console.log("Summary:", result.summary);
console.log("Consensus:", result.consensus);
console.log("Discrepancies:", result.discrepancies);
```

### Example 2: Agent Visibility Detection

```typescript
const input: ParallelSearchInput = {
  query: "Who are the top luxury real estate agents in Seattle?",
  platforms: ["chatgpt", "gemini", "claude"],
  agentName: "Jane Smith",
  firmName: "Smith Luxury Realty",
};

const result = await agent.search(input);

console.log("Agent Mentioned:", result.agentVisibility.mentioned);
console.log("Platforms:", result.agentVisibility.platforms);
console.log("Rankings:", result.agentVisibility.rankings);
```

### Example 3: High-Stakes Validation

```typescript
const input: ParallelSearchInput = {
  query:
    "What are the legal requirements for real estate disclosures in Washington?",
  platforms: ["chatgpt", "gemini", "claude"],
};

const result = await agent.search(input);

// Check for consensus
if (result.consensus.length > 0) {
  console.log("Cross-validated facts:", result.consensus);
}

// Alert on discrepancies
if (result.discrepancies.length > 0) {
  console.warn("⚠️  Discrepancies found - manual review recommended");
  console.log(result.discrepancies);
}
```

## Configuration

### Environment Variables

```bash
# Required for each platform you want to use
CHATGPT_API_KEY=sk-...
GEMINI_API_KEY=...
CLAUDE_API_KEY=...
```

### Platform Configuration

```typescript
interface PlatformAPIConfig {
  chatgpt?: {
    apiKey: string;
    endpoint?: string; // Default: https://api.openai.com/v1/chat/completions
    model?: string; // Default: gpt-4-turbo-preview
  };
  gemini?: {
    apiKey: string;
    endpoint?: string; // Default: Google's Gemini API
    model?: string; // Default: gemini-pro
  };
  claude?: {
    apiKey: string;
    endpoint?: string; // Default: https://api.anthropic.com/v1/messages
    model?: string; // Default: claude-3-5-sonnet-20241022
  };
}
```

## Output Schema

```typescript
interface ParallelSearchOutput {
  results: PlatformResult[]; // Individual platform results
  consensus: string[]; // Consensus points across platforms
  discrepancies: string[]; // Significant differences
  summary: string; // Human-readable summary
  agentVisibility: {
    mentioned: boolean; // Whether agent/firm was mentioned
    platforms: Platform[]; // Platforms where mentioned
    rankings: Record<string, number>; // Ranking positions by platform
  };
}

interface PlatformResult {
  platform: "chatgpt" | "gemini" | "claude";
  response: string; // Full response text
  sources: string[]; // Extracted URLs
  agentMentioned: boolean; // Whether agent/firm mentioned
  agentRanking?: number; // Ranking position if mentioned
  error?: string; // Error message if failed
}
```

## Error Handling

The Parallel Search Agent implements robust error handling:

### Platform Failures

```typescript
// If one platform fails, others continue
const result = await agent.search(input);

// Check which platforms succeeded
result.results.forEach((r) => {
  if (r.error) {
    console.log(`${r.platform} failed: ${r.error}`);
  } else {
    console.log(`${r.platform} succeeded`);
  }
});
```

### Timeout Protection

Each platform search has a 15-second timeout:

```typescript
// Automatically handled - no configuration needed
// Timed-out platforms will have an error in their result
```

### Graceful Degradation

```typescript
// Even if all platforms fail, you get a structured response
const result = await agent.search(input);

if (result.results.every((r) => r.error)) {
  console.log("All platforms failed - falling back to single Bedrock query");
  // Implement fallback logic
}
```

## Performance Considerations

### Parallel Execution

All platform searches execute in parallel using `Promise.all()`:

```typescript
// Searches run simultaneously, not sequentially
// Total time ≈ slowest platform time (max 15s)
```

### Caching

Consider implementing caching for repeated queries:

```typescript
// Example caching wrapper
const cache = new Map<string, ParallelSearchOutput>();

async function cachedSearch(input: ParallelSearchInput) {
  const cacheKey = JSON.stringify(input);

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  const result = await agent.search(input);
  cache.set(cacheKey, result);

  return result;
}
```

## Best Practices

### 1. Use for High-Stakes Queries

Reserve parallel search for important queries where accuracy is critical:

```typescript
// Good use cases:
// - Legal/regulatory questions
// - Market data validation
// - Agent visibility tracking
// - Competitive analysis

// Not recommended for:
// - Simple factual queries
// - Creative content generation
// - Casual conversations
```

### 2. Handle Discrepancies

Always review discrepancies for high-stakes information:

```typescript
if (result.discrepancies.length > 0) {
  // Log for manual review
  await logDiscrepanciesForReview(result);

  // Notify user
  console.warn("Cross-platform discrepancies detected");
}
```

### 3. Monitor Platform Availability

Track which platforms are consistently failing:

```typescript
const failureRates = new Map<Platform, number>();

result.results.forEach((r) => {
  if (r.error) {
    failureRates.set(r.platform, (failureRates.get(r.platform) || 0) + 1);
  }
});
```

### 4. Selective Platform Usage

Only query platforms you have configured:

```typescript
// Don't request platforms without API keys
const availablePlatforms = [];
if (config.chatgpt?.apiKey) availablePlatforms.push("chatgpt");
if (config.gemini?.apiKey) availablePlatforms.push("gemini");
if (config.claude?.apiKey) availablePlatforms.push("claude");

const input: ParallelSearchInput = {
  query: "Your query here",
  platforms: availablePlatforms,
};
```

## Testing

See `parallel-search-example.ts` for comprehensive examples:

```bash
# Run examples
npx tsx src/aws/bedrock/parallel-search-example.ts
```

## Integration with Kiro AI Assistant

The Parallel Search Agent integrates with the broader Kiro AI Assistant system:

```typescript
// In workflow orchestrator
import { ParallelSearchAgent } from "@/aws/bedrock/parallel-search-agent";

async function handleHighStakesQuery(
  query: string,
  agentProfile: AgentProfile
) {
  // Use parallel search for validation
  const parallelSearch = new ParallelSearchAgent(platformConfig);

  const searchResult = await parallelSearch.search({
    query,
    platforms: ["chatgpt", "gemini", "claude"],
    agentName: agentProfile.agentName,
    firmName: agentProfile.firmName,
  });

  // Synthesize with main response
  return {
    mainResponse: await generateMainResponse(query, agentProfile),
    validation: searchResult,
  };
}
```

## Troubleshooting

### API Key Issues

```typescript
// Verify API keys are set
if (!config.chatgpt?.apiKey) {
  console.warn("ChatGPT API key not configured");
}
```

### Timeout Issues

```typescript
// If timeouts are frequent, check network connectivity
// Default timeout is 15 seconds per platform
```

### Consensus Analysis Failures

```typescript
// If Bedrock consensus analysis fails, falls back to simple analysis
// Check Bedrock client configuration if this happens frequently
```

## Related Documentation

- [Workflow Orchestrator](./ORCHESTRATOR_README.md)
- [Worker Agents](./workers/README.md)
- [Citation Service](./CITATION_SERVICE_README.md)
- [Response Enhancement](./RESPONSE_ENHANCEMENT_README.md)

## Support

For issues or questions:

1. Check the examples in `parallel-search-example.ts`
2. Review error messages in platform results
3. Verify API keys and network connectivity
4. Check CloudWatch logs for detailed error information
