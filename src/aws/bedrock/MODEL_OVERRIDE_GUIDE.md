# Model Configuration Override Guide

This guide explains how to override model configurations at runtime for testing, experimentation, and optimization.

## Overview

The Bedrock flow system supports runtime model configuration overrides, allowing you to:

- Test flows with different models without changing code
- Experiment with temperature and token settings
- A/B test model performance
- Override configurations for specific use cases

## Basic Usage

### Defining a Flow with Default Configuration

```typescript
import { definePrompt, MODEL_CONFIGS } from "@/aws/bedrock/flow-base";
import { z } from "zod";

const generateText = definePrompt({
  name: "generateText",
  inputSchema: z.object({ topic: z.string() }),
  outputSchema: z.object({ text: z.string() }),
  prompt: "Write about: {{{topic}}}",
  options: MODEL_CONFIGS.CREATIVE, // Default configuration
});
```

### Calling with Default Configuration

```typescript
// Uses the default CREATIVE config (Sonnet 3.5, temp 0.7, 4096 tokens)
const result = await generateText({ topic: "real estate marketing" });
```

### Overriding Model at Runtime

```typescript
import { BEDROCK_MODELS } from "@/aws/bedrock/flow-base";

// Override to use Haiku for faster, cheaper generation
const result = await generateText(
  { topic: "real estate marketing" },
  { modelId: BEDROCK_MODELS.HAIKU }
);
```

### Overriding Multiple Parameters

```typescript
// Override model, temperature, and token limit
const result = await generateText(
  { topic: "real estate marketing" },
  {
    modelId: BEDROCK_MODELS.OPUS,
    temperature: 0.9,
    maxTokens: 8192,
  }
);
```

### Partial Overrides

```typescript
// Override only temperature, keep other config values
const result = await generateText(
  { topic: "real estate marketing" },
  { temperature: 0.3 } // More deterministic output
);
```

## Available Models

```typescript
import { BEDROCK_MODELS } from "@/aws/bedrock/flow-base";

// Available models:
BEDROCK_MODELS.HAIKU; // Fast, cost-effective
BEDROCK_MODELS.SONNET_3; // Previous generation
BEDROCK_MODELS.SONNET_3_5_V1; // Sonnet 3.5 v1
BEDROCK_MODELS.SONNET_3_5_V2; // Latest Sonnet (recommended)
BEDROCK_MODELS.OPUS; // Most capable
```

## Configuration Presets

```typescript
import { MODEL_CONFIGS } from "@/aws/bedrock/flow-base";

// Available presets:
MODEL_CONFIGS.SIMPLE; // Haiku, temp 0.3, 2048 tokens
MODEL_CONFIGS.BALANCED; // Sonnet 3.5, temp 0.5, 4096 tokens
MODEL_CONFIGS.CREATIVE; // Sonnet 3.5, temp 0.7, 4096 tokens
MODEL_CONFIGS.LONG_FORM; // Sonnet 3.5, temp 0.6, 8192 tokens
MODEL_CONFIGS.ANALYTICAL; // Sonnet 3.5, temp 0.2, 4096 tokens
MODEL_CONFIGS.CRITICAL; // Opus, temp 0.1, 4096 tokens
```

## Common Use Cases

### Testing with Different Models

```typescript
// Test the same prompt with different models
const models = [
  BEDROCK_MODELS.HAIKU,
  BEDROCK_MODELS.SONNET_3_5_V2,
  BEDROCK_MODELS.OPUS,
];

for (const modelId of models) {
  const result = await generateText(
    { topic: "real estate marketing" },
    { modelId }
  );
  console.log(`${modelId}: ${result.text.length} chars`);
}
```

### A/B Testing Temperature

```typescript
// Compare creative vs deterministic outputs
const creative = await generateText(
  { topic: "real estate marketing" },
  { temperature: 0.9 }
);

const deterministic = await generateText(
  { topic: "real estate marketing" },
  { temperature: 0.1 }
);
```

### Cost Optimization

```typescript
// Use Haiku for simple tasks to reduce costs
const quickSummary = await generateText(
  { topic: "brief market update" },
  {
    modelId: BEDROCK_MODELS.HAIKU,
    maxTokens: 1024,
  }
);
```

### Quality Optimization

```typescript
// Use Opus for critical content
const importantContent = await generateText(
  { topic: "legal disclaimer" },
  {
    modelId: BEDROCK_MODELS.OPUS,
    temperature: 0.1, // Very deterministic
  }
);
```

## Configuration Precedence

The system follows this precedence order (highest to lowest):

1. **Runtime Override**: Parameters passed to the flow function
2. **Flow Configuration**: Options defined in `definePrompt`
3. **System Defaults**: Fallback values from config

### Example

```typescript
// Flow defined with config
const flow = definePrompt({
  name: "test",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  prompt: "{{{text}}}",
  options: {
    modelId: BEDROCK_MODELS.HAIKU, // Config: Haiku
    temperature: 0.5, // Config: 0.5
    maxTokens: 2048, // Config: 2048
  },
});

// Call with partial override
const result = await flow(
  { text: "test" },
  {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2, // Override: Sonnet
    temperature: 0.8, // Override: 0.8
    // maxTokens not specified                // Uses config: 2048
  }
);

// Effective configuration:
// - modelId: SONNET_3_5_V2 (from runtime)
// - temperature: 0.8 (from runtime)
// - maxTokens: 2048 (from config)
// - topP: 1 (from system default)
```

## Helper Function

Use `mergeFlowOptions` to preview the effective configuration:

```typescript
import {
  mergeFlowOptions,
  MODEL_CONFIGS,
  BEDROCK_MODELS,
} from "@/aws/bedrock/flow-base";

const effective = mergeFlowOptions(MODEL_CONFIGS.CREATIVE, {
  modelId: BEDROCK_MODELS.HAIKU,
});

console.log(effective);
// {
//   modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
//   temperature: 0.7,
//   maxTokens: 4096,
//   topP: 1
// }
```

## Testing Recommendations

### Unit Tests

```typescript
import { mergeFlowOptions } from "@/aws/bedrock/flow-base";

it("should override model configuration", () => {
  const merged = mergeFlowOptions(
    { modelId: BEDROCK_MODELS.HAIKU },
    { modelId: BEDROCK_MODELS.OPUS }
  );

  expect(merged.modelId).toBe(BEDROCK_MODELS.OPUS);
});
```

### Integration Tests

```typescript
// Test with real API calls using different models
it("should work with Haiku", async () => {
  const result = await generateText(
    { topic: "test" },
    { modelId: BEDROCK_MODELS.HAIKU }
  );

  expect(result.text).toBeDefined();
});
```

## Performance Considerations

### Model Selection Impact

- **Haiku**: ~0.5-1s response time, lowest cost
- **Sonnet 3.5**: ~1-2s response time, medium cost
- **Opus**: ~3-5s response time, highest cost

### Token Limit Impact

- Larger token limits increase latency and cost
- Use the minimum tokens needed for your use case
- Long-form content (8192 tokens) takes longer to generate

### Temperature Impact

- Lower temperature (0.1-0.3): More deterministic, faster
- Higher temperature (0.7-0.9): More creative, may be slower

## Best Practices

1. **Use Presets**: Start with `MODEL_CONFIGS` presets for consistency
2. **Override Sparingly**: Only override when necessary for specific use cases
3. **Test Thoroughly**: Test overrides in staging before production
4. **Monitor Costs**: Track token usage when experimenting with models
5. **Document Overrides**: Comment why you're overriding default configs
6. **Measure Performance**: Compare latency and quality across models

## Troubleshooting

### Override Not Working

```typescript
// ❌ Wrong: Passing options as first parameter
const result = await flow({ modelId: BEDROCK_MODELS.HAIKU });

// ✅ Correct: Input first, options second
const result = await flow({ topic: "test" }, { modelId: BEDROCK_MODELS.HAIKU });
```

### Model Not Available

```typescript
// Some models require specific regions or permissions
// Check AWS Bedrock console for model availability

// Use inference profile ARN for cross-region support
const result = await flow(
  { topic: "test" },
  { modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0" }
);
```

### Unexpected Defaults

```typescript
// Use mergeFlowOptions to debug effective configuration
import { mergeFlowOptions } from "@/aws/bedrock/flow-base";

const effective = mergeFlowOptions(configOptions, runtimeOptions);
console.log("Effective config:", effective);
```

## Examples

See `src/aws/bedrock/__tests__/model-override.test.ts` for comprehensive examples of:

- Runtime model overrides
- Temperature and token limit overrides
- Partial overrides
- Default fallback behavior
- Configuration precedence

## Related Documentation

- [Bedrock Client Documentation](./client.ts)
- [Flow Base Documentation](./flow-base.ts)
- [Model Configuration Tests](../__tests__/model-override.test.ts)
- [AWS Bedrock Models](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html)
