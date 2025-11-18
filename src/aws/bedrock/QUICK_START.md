# AWS Bedrock Client - Quick Start Guide

## Prerequisites

1. AWS account with Bedrock access
2. AWS credentials configured (access key or IAM role)
3. Bedrock model access enabled (Claude 3.5 Sonnet)

## Environment Setup

Add these variables to your `.env.local` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Bedrock Configuration
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1
```

## Basic Usage

### 1. Simple AI Call

```typescript
import { getBedrockClient } from "@/aws/bedrock";
import { z } from "zod";

// Define your output schema
const OutputSchema = z.object({
  result: z.string(),
});

// Get the client
const client = getBedrockClient();

// Make a call
const response = await client.invoke("Your prompt here", OutputSchema);

console.log(response.result);
```

### 2. Streaming Response

```typescript
import { getBedrockClient } from "@/aws/bedrock";

const client = getBedrockClient();

for await (const chunk of client.invokeStream("Your prompt here")) {
  process.stdout.write(chunk);
}
```

### 3. With System Prompt

```typescript
import { getBedrockClient } from "@/aws/bedrock";
import { z } from "zod";

const client = getBedrockClient();

const OutputSchema = z.object({
  answer: z.string(),
});

const response = await client.invokeWithPrompts(
  "You are a helpful assistant", // System prompt
  "What is 2+2?", // User prompt
  OutputSchema
);
```

## Common Patterns

### Pattern 1: AI Flow Function

```typescript
import { getBedrockClient } from "@/aws/bedrock";
import { InputSchema, OutputSchema } from "./schemas";

export async function myAIFlow(input: Input): Promise<Output> {
  const client = getBedrockClient();

  const prompt = `
    You are an expert in [domain].
    
    Task: ${input.task}
    Context: ${input.context}
    
    Provide your response in JSON format.
  `;

  return await client.invoke(prompt, OutputSchema, {
    temperature: 0.7,
    maxTokens: 2048,
  });
}
```

### Pattern 2: Error Handling

```typescript
import {
  getBedrockClient,
  BedrockError,
  BedrockParseError,
} from "@/aws/bedrock";

try {
  const result = await client.invoke(prompt, schema);
  return result;
} catch (error) {
  if (error instanceof BedrockParseError) {
    console.error("Invalid response format:", error.response);
    throw new Error("AI returned invalid format");
  }

  if (error instanceof BedrockError) {
    console.error("Bedrock API error:", error.message);
    throw new Error("AI service unavailable");
  }

  throw error;
}
```

### Pattern 3: Streaming to Client

```typescript
import { getBedrockClient } from "@/aws/bedrock";

export async function* streamResponse(prompt: string) {
  const client = getBedrockClient();

  for await (const chunk of client.invokeStream(prompt)) {
    yield chunk;
  }
}

// In your API route:
export async function POST(req: Request) {
  const { prompt } = await req.json();

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamResponse(prompt)) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream);
}
```

## Configuration Options

### Temperature

Controls randomness (0.0 = deterministic, 1.0 = creative)

```typescript
await client.invoke(prompt, schema, {
  temperature: 0.7, // Default: 0.7
});
```

### Max Tokens

Maximum length of response

```typescript
await client.invoke(prompt, schema, {
  maxTokens: 4096, // Default: 4096
});
```

### Top P

Nucleus sampling parameter

```typescript
await client.invoke(prompt, schema, {
  topP: 0.9, // Default: 1.0
});
```

### Retry Configuration

Customize retry behavior

```typescript
await client.invoke(prompt, schema, {
  retryConfig: {
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  },
});
```

## Troubleshooting

### Error: "Empty response from Bedrock"

- Check AWS credentials are valid
- Verify Bedrock access is enabled in your AWS account
- Check model ID is correct

### Error: "Response does not match expected schema"

- Review your Zod schema definition
- Check the prompt asks for JSON output
- Inspect `error.response` to see what was returned

### Error: "ThrottlingException"

- The client will automatically retry
- Consider reducing request frequency
- Check your Bedrock quota limits

### Error: "AccessDeniedException"

- Verify IAM permissions for Bedrock
- Check model access is enabled in Bedrock console
- Ensure credentials have `bedrock:InvokeModel` permission

## Testing

### Unit Tests

```typescript
import { getBedrockClient } from "@/aws/bedrock";

// Mock the client for testing
jest.mock("@/aws/bedrock", () => ({
  getBedrockClient: jest.fn(() => ({
    invoke: jest.fn().mockResolvedValue({ result: "mocked" }),
  })),
}));
```

### Integration Tests

```typescript
// Use real client with test credentials
process.env.AWS_ACCESS_KEY_ID = "test-key";
process.env.AWS_SECRET_ACCESS_KEY = "test-secret";

const client = getBedrockClient();
const result = await client.invoke(prompt, schema);
```

## Best Practices

1. **Reuse the client**: Use `getBedrockClient()` singleton
2. **Define schemas**: Always use Zod schemas for type safety
3. **Handle errors**: Catch and handle `BedrockError` and `BedrockParseError`
4. **Set timeouts**: Use appropriate `maxTokens` to control costs
5. **Use streaming**: For long responses, use `invokeStream()`
6. **Cache responses**: Consider caching identical prompts
7. **Monitor costs**: Track token usage in production

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Check [example.ts](./example.ts) for more usage examples
- Review [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for architecture details

## Support

For issues or questions:

1. Check the error message and troubleshooting section
2. Review AWS Bedrock documentation
3. Check CloudWatch logs for detailed error information
4. Verify IAM permissions and model access
