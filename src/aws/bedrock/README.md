# AWS Bedrock Client

This module provides a client for interacting with AWS Bedrock foundation models, specifically optimized for Claude models.

## Features

- **Synchronous AI calls** with `invoke()` method
- **Streaming responses** with `invokeStream()` method
- **Zod schema validation** for type-safe responses
- **Automatic retry logic** with exponential backoff for throttling errors
- **Error handling** with custom error types
- **Prompt construction utilities** for Claude models
- **Multi-model support** with optimized configurations for different use cases
- **Runtime model overrides** for testing and experimentation
- **Performance monitoring** and execution logging

## Documentation

📚 **[Complete Documentation Index](./DOCUMENTATION_INDEX.md)** - Start here for all documentation

### Quick Links

- **[Model Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md)** - Comprehensive guide to model selection and configuration
- **[Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md)** - Quick decision tree and cheat sheet
- **[Model Override Guide](./MODEL_OVERRIDE_GUIDE.md)** - Runtime configuration overrides
- **[Benchmarking Guide](./BENCHMARKING_GUIDE.md)** - Testing and benchmarking models
- **[Flow Examples](./flows/)** - Individual AI flow implementations

## Model Selection

The platform uses multiple Claude models optimized for different use cases:

- **Claude 3 Haiku**: Fast, cost-effective for simple tasks (bios, sentiment analysis)
- **Claude 3.5 Sonnet v2**: Balanced performance for most features (blog posts, analysis)
- **Claude 3 Opus**: Highest quality for critical accuracy requirements

See the [Model Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md) for detailed selection criteria.

### Configuration Presets

```typescript
import { MODEL_CONFIGS } from "@/aws/bedrock/flow-base";

// Fast & cheap for simple tasks
MODEL_CONFIGS.SIMPLE;

// Balanced general purpose
MODEL_CONFIGS.BALANCED;

// Creative content generation
MODEL_CONFIGS.CREATIVE;

// Long-form content (8K tokens)
MODEL_CONFIGS.LONG_FORM;

// Analytical/data extraction
MODEL_CONFIGS.ANALYTICAL;

// Critical accuracy
MODEL_CONFIGS.CRITICAL;
```

## Usage

### Basic Invocation

```typescript
import { getBedrockClient } from "@/aws/bedrock";
import { z } from "zod";

const client = getBedrockClient();

// Define output schema
const outputSchema = z.object({
  bio: z.string(),
});

// Invoke the model
const result = await client.invoke(
  "Write a professional bio for a real estate agent named John Doe",
  outputSchema
);

console.log(result.bio);
```

### Streaming Responses

```typescript
import { getBedrockClient } from "@/aws/bedrock";

const client = getBedrockClient();

// Stream response chunks
for await (const chunk of client.invokeStream("Tell me a story")) {
  process.stdout.write(chunk);
}
```

### Using System and User Prompts

```typescript
import { getBedrockClient } from "@/aws/bedrock";
import { z } from "zod";

const client = getBedrockClient();

const outputSchema = z.object({
  answer: z.string(),
});

const result = await client.invokeWithPrompts(
  "You are a helpful math tutor",
  "What is 2 + 2?",
  outputSchema
);

console.log(result.answer);
```

### Custom Options

```typescript
const result = await client.invoke(prompt, schema, {
  temperature: 0.5,
  maxTokens: 2048,
  topP: 0.9,
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  },
});
```

## Configuration

The client uses the AWS configuration from `src/aws/config.ts`. Set the following environment variables:

```bash
# Required
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1

# Optional (for local development)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

## Error Handling

The client provides two custom error types:

### BedrockError

Thrown when API calls fail:

```typescript
try {
  await client.invoke(prompt, schema);
} catch (error) {
  if (error instanceof BedrockError) {
    console.error("API Error:", error.message);
    console.error("Code:", error.code);
    console.error("Status:", error.statusCode);
  }
}
```

### BedrockParseError

Thrown when response parsing or schema validation fails:

```typescript
try {
  await client.invoke(prompt, schema);
} catch (error) {
  if (error instanceof BedrockParseError) {
    console.error("Parse Error:", error.message);
    console.error("Response:", error.response);
    console.error("Validation Errors:", error.validationErrors);
  }
}
```

## Retry Logic

The client automatically retries on:

- Throttling exceptions (`ThrottlingException`)
- Service unavailable errors (503, 429 status codes)
- Timeout errors

Non-retryable errors (validation, authentication, etc.) fail immediately.

## Supported Models

The client is optimized for Claude models:

- `anthropic.claude-3-5-sonnet-20241022-v2:0` (default)
- `anthropic.claude-3-sonnet-20240229-v1:0`
- Other Claude variants

## Testing

Run tests with:

```bash
npm test src/aws/bedrock/client.test.ts
```

## Migration from Genkit

When migrating from Genkit flows:

1. Replace `ai.defineFlow()` with direct client calls
2. Keep existing Zod schemas
3. Use `invoke()` for synchronous calls
4. Use `invokeStream()` for streaming responses
5. Handle errors with try-catch blocks

Example migration:

**Before (Genkit):**

```typescript
const flow = ai.defineFlow(
  {
    name: "generateBio",
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output;
  }
);
```

**After (Bedrock):**

```typescript
export async function generateBio(input: Input): Promise<Output> {
  const client = getBedrockClient();
  const prompt = constructPrompt(input);
  return await client.invoke(prompt, OutputSchema);
}
```
