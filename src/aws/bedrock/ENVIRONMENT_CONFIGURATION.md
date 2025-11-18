# Bedrock Environment Configuration Guide

This guide explains how to configure AWS Bedrock models through environment variables and how the model selection system works.

## Environment Variables

### Required Variables

#### `BEDROCK_MODEL_ID`

The default model ID used when a flow doesn't specify a model configuration.

**Recommended Value**: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

**Valid Options**:

- `anthropic.claude-3-haiku-20240307-v1:0` - Fast, cost-effective for simple tasks
- `anthropic.claude-3-sonnet-20240229-v1:0` - Previous generation Sonnet
- `anthropic.claude-3-5-sonnet-20240620-v1:0` - Sonnet 3.5 v1
- `us.anthropic.claude-3-5-sonnet-20241022-v2:0` - Sonnet 3.5 v2 (recommended)
- `anthropic.claude-3-5-sonnet-20241022-v2:0` - Sonnet 3.5 v2 (region-specific)
- `anthropic.claude-3-opus-20240229-v1:0` - Most capable, highest cost

**Note**: The `us.` prefix indicates a cross-region inference profile, which provides better availability and automatic failover.

#### `BEDROCK_REGION`

The AWS region where Bedrock is available.

**Recommended Value**: `us-east-1`

**Valid Options**: Any AWS region that supports Bedrock (us-east-1, us-west-2, etc.)

### Example Configuration

**.env.local** (Development):

```bash
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1
```

**.env.production** (Production):

```bash
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
BEDROCK_REGION=us-east-1
```

## Model Configuration Presets

Individual AI flows use predefined configuration presets from `flow-base.ts`. These presets automatically select the optimal model, temperature, and token limits for each use case.

### Available Presets

#### `MODEL_CONFIGS.SIMPLE`

- **Model**: Claude 3 Haiku
- **Temperature**: 0.3 (low randomness)
- **Max Tokens**: 2048
- **Use Cases**: Agent bio, single review sentiment analysis
- **Cost**: Lowest
- **Speed**: Fastest

#### `MODEL_CONFIGS.BALANCED`

- **Model**: Claude 3.5 Sonnet v2
- **Temperature**: 0.5 (moderate randomness)
- **Max Tokens**: 4096
- **Use Cases**: Listing FAQs, market updates, marketing plans
- **Cost**: Medium
- **Speed**: Fast

#### `MODEL_CONFIGS.CREATIVE`

- **Model**: Claude 3.5 Sonnet v2
- **Temperature**: 0.7 (high randomness)
- **Max Tokens**: 4096
- **Use Cases**: Social media posts, video scripts, listing descriptions
- **Cost**: Medium
- **Speed**: Fast

#### `MODEL_CONFIGS.LONG_FORM`

- **Model**: Claude 3.5 Sonnet v2
- **Temperature**: 0.6 (moderate-high randomness)
- **Max Tokens**: 8192
- **Use Cases**: Blog posts, neighborhood guides, research reports
- **Cost**: Medium-High (more tokens)
- **Speed**: Moderate

#### `MODEL_CONFIGS.ANALYTICAL`

- **Model**: Claude 3.5 Sonnet v2
- **Temperature**: 0.2 (very low randomness)
- **Max Tokens**: 4096
- **Use Cases**: NAP audit, competitor analysis, keyword rankings, review analysis
- **Cost**: Medium
- **Speed**: Fast

#### `MODEL_CONFIGS.CRITICAL`

- **Model**: Claude 3 Opus
- **Temperature**: 0.1 (minimal randomness)
- **Max Tokens**: 4096
- **Use Cases**: High-accuracy tasks requiring best reasoning
- **Cost**: Highest
- **Speed**: Slower

## How Model Selection Works

### 1. Flow-Level Configuration

Each AI flow specifies its optimal configuration:

```typescript
const prompt = definePrompt({
  name: "generateAgentBio",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  prompt: `...`,
  options: MODEL_CONFIGS.SIMPLE, // Uses Haiku
});
```

### 2. Runtime Override

You can override the model at runtime for testing or experimentation:

```typescript
const result = await generateAgentBio(input, {
  modelId: BEDROCK_MODELS.OPUS, // Override to use Opus
  temperature: 0.5,
  maxTokens: 2048,
});
```

### 3. Default Fallback

If no model is specified, the system uses `BEDROCK_MODEL_ID` from environment variables:

```typescript
const prompt = definePrompt({
  name: "customFlow",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  prompt: `...`,
  // No options specified - uses BEDROCK_MODEL_ID
});
```

## Validation

The system validates model IDs at startup to catch configuration errors early.

### Valid Model IDs

The following model IDs are validated:

- `anthropic.claude-3-haiku-20240307-v1:0`
- `anthropic.claude-3-sonnet-20240229-v1:0`
- `anthropic.claude-3-5-sonnet-20240620-v1:0`
- `anthropic.claude-3-5-sonnet-20241022-v2:0`
- `us.anthropic.claude-3-5-sonnet-20241022-v2:0`
- `anthropic.claude-3-opus-20240229-v1:0`

### Validation Function

```typescript
import { validateConfig, isValidBedrockModel } from "@/aws/config";

// Validate all configuration
const { valid, errors } = validateConfig();
if (!valid) {
  console.error("Configuration errors:", errors);
}

// Validate a specific model ID
if (!isValidBedrockModel("anthropic.claude-3-haiku-20240307-v1:0")) {
  console.error("Invalid model ID");
}
```

## Cost Optimization

### Model Pricing (per 1M tokens)

| Model      | Input  | Output | Use Case           |
| ---------- | ------ | ------ | ------------------ |
| Haiku      | $0.25  | $1.25  | Simple, fast tasks |
| Sonnet 3   | $3.00  | $15.00 | Legacy support     |
| Sonnet 3.5 | $3.00  | $15.00 | Most tasks         |
| Opus       | $15.00 | $75.00 | Critical accuracy  |

### Cost Optimization Strategy

1. **Use Haiku for simple tasks**: Bio generation, sentiment analysis
2. **Use Sonnet 3.5 for most tasks**: Content generation, analysis
3. **Reserve Opus for critical tasks**: High-stakes accuracy requirements
4. **Set appropriate token limits**: Don't request more tokens than needed

### Example Cost Calculation

**Agent Bio Generation** (SIMPLE preset):

- Model: Haiku
- Input: ~500 tokens
- Output: ~200 tokens
- Cost: ($0.25 × 0.0005) + ($1.25 × 0.0002) = $0.00038 per generation

**Blog Post Generation** (LONG_FORM preset):

- Model: Sonnet 3.5
- Input: ~1000 tokens
- Output: ~4000 tokens
- Cost: ($3.00 × 0.001) + ($15.00 × 0.004) = $0.063 per generation

## Troubleshooting

### Error: "BEDROCK_MODEL_ID is not a valid model"

**Cause**: The model ID in your environment variables is not recognized.

**Solution**: Check that your `BEDROCK_MODEL_ID` matches one of the valid model IDs listed above. Common mistakes:

- Missing version suffix (e.g., `:0`)
- Incorrect date format
- Typos in model name

### Error: "Model not found" or "Access denied"

**Cause**: The model is not available in your AWS region or you don't have access.

**Solution**:

1. Verify the model is available in your `BEDROCK_REGION`
2. Check AWS Bedrock console for model access
3. Request model access if needed (some models require approval)

### Error: "Token limit exceeded"

**Cause**: Your input or output exceeds the model's token limit.

**Solution**:

1. Reduce input size
2. Use a model with higher token limits (e.g., LONG_FORM preset)
3. Implement input truncation

## Best Practices

1. **Use the recommended default**: `us.anthropic.claude-3-5-sonnet-20241022-v2:0` provides the best balance of performance, cost, and availability.

2. **Don't override presets without reason**: The presets are optimized for each use case. Only override for testing or specific requirements.

3. **Monitor costs**: Track token usage and costs per feature to identify optimization opportunities.

4. **Test with different models**: Use runtime overrides to experiment with different models for your use case.

5. **Validate configuration on startup**: Call `validateConfig()` during application initialization to catch configuration errors early.

6. **Document custom configurations**: If you create custom flows with specific model requirements, document why that model was chosen.

## Related Documentation

- [Model Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md) - Detailed guide on model selection
- [Model Override Guide](./MODEL_OVERRIDE_GUIDE.md) - How to override models for testing
- [Benchmarking Guide](./BENCHMARKING_GUIDE.md) - Performance and cost benchmarking
- [Quick Start](./QUICK_START.md) - Getting started with Bedrock flows
