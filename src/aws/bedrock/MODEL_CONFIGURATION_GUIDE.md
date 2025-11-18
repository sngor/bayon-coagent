# Model Configuration Guide

This comprehensive guide documents the model selection strategy, configuration rationale, and best practices for all AI flows in the Co-agent Marketer platform.

## Table of Contents

1. [Overview](#overview)
2. [Available Models](#available-models)
3. [Configuration Presets](#configuration-presets)
4. [Model Selection by Feature](#model-selection-by-feature)
5. [Adding New Flows](#adding-new-flows)
6. [Testing and Benchmarking](#testing-and-benchmarking)
7. [Runtime Overrides](#runtime-overrides)
8. [Performance Considerations](#performance-considerations)
9. [Cost Optimization](#cost-optimization)
10. [Troubleshooting](#troubleshooting)

## Overview

The Co-agent Marketer platform uses AWS Bedrock with multiple Claude models to optimize for:

- **Performance**: Faster response times for simple tasks
- **Cost**: Lower costs for high-volume features
- **Quality**: Better outputs for complex reasoning tasks
- **Scalability**: Appropriate resource allocation per feature

### Design Principles

1. **Match Complexity**: Use simpler models for simple tasks
2. **Optimize Cost**: Use Haiku for high-volume, simple operations
3. **Prioritize Quality**: Use Sonnet/Opus for critical content
4. **Configure Appropriately**: Set temperature and tokens based on use case
5. **Enable Flexibility**: Support runtime overrides for testing

## Available Models

### Claude 3 Haiku

**Model ID**: `anthropic.claude-3-haiku-20240307-v1:0`

- **Speed**: Fastest (~0.5-1s response time)
- **Cost**: Lowest ($0.25/1M input, $1.25/1M output tokens)
- **Capability**: Good for simple tasks, short responses
- **Max Output Tokens**: 4096
- **Best For**:
  - Simple classification (sentiment analysis)
  - Short text generation (bios, summaries)
  - High-volume operations
  - Fast user-facing features

**When to Use**:

- Output < 500 words
- Simple, well-defined task
- Speed is critical
- High request volume

### Claude 3.5 Sonnet v2

**Model ID**: `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

- **Speed**: Fast (~1-2s response time)
- **Cost**: Medium ($3/1M input, $15/1M output tokens)
- **Capability**: Excellent balance of speed and intelligence
- **Max Output Tokens**: 8192
- **Best For**:
  - Long-form content (blog posts, guides)
  - Complex analysis (competitor research)
  - Structured content (video scripts, FAQs)
  - Data extraction (NAP audit, rankings)

**When to Use**:

- Output 500-3000 words
- Requires reasoning or analysis
- Structured output with multiple sections
- Balance of speed and quality needed

### Claude 3 Opus

**Model ID**: `anthropic.claude-3-opus-20240229-v1:0`

- **Speed**: Slower (~3-5s response time)
- **Cost**: Highest ($15/1M input, $75/1M output tokens)
- **Capability**: Most capable, best reasoning
- **Max Output Tokens**: 4096
- **Best For**:
  - Critical accuracy requirements
  - Complex multi-step reasoning
  - High-stakes content
  - Difficult edge cases

**When to Use**:

- Accuracy is paramount
- Complex reasoning required
- Legal or compliance content
- User explicitly requests highest quality

### Legacy Models

**Claude 3.5 Sonnet v1**: `anthropic.claude-3-5-sonnet-20240620-v1:0`

- Previous generation, similar to v2
- Use v2 for new implementations

**Claude 3 Sonnet**: `anthropic.claude-3-sonnet-20240229-v1:0`

- Older generation
- Use 3.5 Sonnet v2 instead

## Configuration Presets

Pre-configured settings for common use cases:

### SIMPLE

```typescript
MODEL_CONFIGS.SIMPLE = {
  modelId: BEDROCK_MODELS.HAIKU,
  temperature: 0.3,
  maxTokens: 2048,
};
```

**Use For**: Agent bios, sentiment analysis, simple classification

### BALANCED

```typescript
MODEL_CONFIGS.BALANCED = {
  modelId: BEDROCK_MODELS.SONNET_3_5_V2,
  temperature: 0.5,
  maxTokens: 4096,
};
```

**Use For**: FAQs, market updates, marketing plans

### CREATIVE

```typescript
MODEL_CONFIGS.CREATIVE = {
  modelId: BEDROCK_MODELS.SONNET_3_5_V2,
  temperature: 0.7,
  maxTokens: 4096,
};
```

**Use For**: Social media posts, video scripts, engaging content

### LONG_FORM

```typescript
MODEL_CONFIGS.LONG_FORM = {
  modelId: BEDROCK_MODELS.SONNET_3_5_V2,
  temperature: 0.6,
  maxTokens: 8192,
};
```

**Use For**: Blog posts, neighborhood guides, research reports

### ANALYTICAL

```typescript
MODEL_CONFIGS.ANALYTICAL = {
  modelId: BEDROCK_MODELS.SONNET_3_5_V2,
  temperature: 0.2,
  maxTokens: 4096,
};
```

**Use For**: NAP audit, competitor analysis, data extraction

### CRITICAL

```typescript
MODEL_CONFIGS.CRITICAL = {
  modelId: BEDROCK_MODELS.OPUS,
  temperature: 0.1,
  maxTokens: 4096,
};
```

**Use For**: Legal content, compliance, high-stakes decisions

## Model Selection by Feature

### Content Generation

#### Blog Posts

**Flow**: `generate-blog-post.ts`
**Config**: `LONG_FORM`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Needs 8K tokens for comprehensive posts
- Requires creative writing ability
- Must maintain coherent structure across sections
- SEO optimization requires reasoning

#### Neighborhood Guides

**Flow**: `generate-neighborhood-guides.ts`
**Config**: `LONG_FORM`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Comprehensive content with multiple sections
- Requires local knowledge synthesis
- Professional tone with engaging writing

#### Social Media Posts

**Flow**: `generate-social-media-post.ts`
**Config**: `CREATIVE` (with Haiku override)
**Model**: Claude 3 Haiku
**Rationale**:

- Short output (< 280 chars for Twitter)
- High volume feature
- Speed matters for user experience
- Simple creative task

#### Listing Descriptions

**Flow**: `listing-description-generator.ts`
**Config**: `CREATIVE` (with Haiku override)
**Model**: Claude 3 Haiku
**Rationale**:

- Short persuasive text
- High volume feature
- Fast generation needed
- Cost-effective for frequent use

#### Agent Bio

**Flow**: `generate-agent-bio.ts`
**Config**: `SIMPLE`
**Model**: Claude 3 Haiku
**Rationale**:

- Very short output (3-4 sentences)
- Simple task with clear structure
- Fastest model sufficient
- Cost-effective

#### Video Scripts

**Flow**: `generate-video-script.ts`
**Config**: `CREATIVE`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Structured but creative content
- Conversational tone required
- Multiple sections with flow
- Moderate complexity

#### Listing FAQs

**Flow**: `generate-listing-faqs.ts`
**Config**: `BALANCED`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Structured Q&A format
- Comprehensive coverage needed
- Professional accuracy

#### Market Updates

**Flow**: `generate-market-update.ts`
**Config**: `BALANCED`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Professional tone required
- Data synthesis capability
- Clear communication

### Analysis Features

#### Review Sentiment (Single)

**Flow**: `analyze-review-sentiment.ts`
**Config**: `SIMPLE`
**Model**: Claude 3 Haiku
**Rationale**:

- Simple classification task
- High volume operation
- Fast response needed
- Cost-effective

#### Review Analysis (Multiple)

**Flow**: `analyze-multiple-reviews.ts`
**Config**: `ANALYTICAL`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Pattern recognition across reviews
- Theme extraction requires reasoning
- Keyword identification
- Moderate complexity

#### NAP Audit

**Flow**: `run-nap-audit.ts`
**Config**: `ANALYTICAL`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Accurate data extraction critical
- Comparison logic required
- Low temperature for consistency
- Web search integration

#### Find Competitors

**Flow**: `find-competitors.ts`
**Config**: `ANALYTICAL`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Data extraction from search results
- Accuracy critical (no hallucinations)
- Structured output required
- Web search integration

#### Enrich Competitor Data

**Flow**: `find-competitors.ts` (enrichCompetitorData)
**Config**: `ANALYTICAL`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Metric extraction accuracy
- Must return zeros for missing data
- No hallucinations allowed

#### Keyword Rankings

**Flow**: `get-keyword-rankings.ts`
**Config**: `ANALYTICAL`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Accurate ranking extraction
- Position assignment logic
- Search result parsing

### Strategic Features

#### Marketing Plan

**Flow**: `generate-marketing-plan.ts`
**Config**: `BALANCED`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Strategic analysis required
- Actionable recommendations
- Moderate creativity
- Structured output

#### Research Agent

**Flow**: `run-research-agent.ts`
**Config**: `LONG_FORM`
**Model**: Claude 3.5 Sonnet v2
**Rationale**:

- Comprehensive research reports
- 8K tokens for detailed output
- Information synthesis
- Citation management

## Adding New Flows

### Step-by-Step Guide

#### 1. Analyze Requirements

Ask these questions:

**Output Length**:

- Short (< 500 words)? → Consider Haiku
- Medium (500-1500 words)? → Sonnet 3.5
- Long (> 1500 words)? → Sonnet 3.5 with LONG_FORM

**Task Complexity**:

- Simple classification? → Haiku with SIMPLE
- Data extraction? → Sonnet 3.5 with ANALYTICAL
- Creative writing? → Sonnet 3.5 with CREATIVE
- Complex reasoning? → Sonnet 3.5 or Opus

**Accuracy Requirements**:

- High volume, good enough? → Haiku
- Professional quality? → Sonnet 3.5
- Critical accuracy? → Opus with CRITICAL

**Speed Requirements**:

- User-facing, must be fast? → Haiku
- Background processing? → Sonnet 3.5 or Opus
- Batch operation? → Optimize for cost

**Volume**:

- High volume (> 1000/day)? → Prefer Haiku
- Medium volume? → Sonnet 3.5
- Low volume? → Can use Opus if needed

#### 2. Select Configuration Preset

Based on your analysis, choose a preset:

```typescript
import { definePrompt, MODEL_CONFIGS } from "../flow-base";

const myPrompt = definePrompt({
  name: "myNewFlow",
  inputSchema: MyInputSchema,
  outputSchema: MyOutputSchema,
  options: MODEL_CONFIGS.BALANCED, // Choose appropriate preset
  prompt: `...`,
});
```

#### 3. Customize if Needed

Override specific parameters if the preset doesn't fit:

```typescript
options: {
  ...MODEL_CONFIGS.CREATIVE,
  maxTokens: 6144, // Custom token limit
}
```

Or create a custom configuration:

```typescript
options: {
  modelId: BEDROCK_MODELS.SONNET_3_5_V2,
  temperature: 0.4, // Custom temperature
  maxTokens: 3072,
}
```

#### 4. Document Your Choice

Add a comment explaining the rationale:

```typescript
const myPrompt = definePrompt({
  name: "myNewFlow",
  inputSchema: MyInputSchema,
  outputSchema: MyOutputSchema,
  // Using ANALYTICAL config for accurate data extraction from search results
  // Low temperature (0.2) prevents hallucinations
  // Sonnet 3.5 provides good balance of speed and accuracy
  options: MODEL_CONFIGS.ANALYTICAL,
  prompt: `...`,
});
```

#### 5. Add to Documentation

Update this guide with your new flow in the appropriate category.

### Example: Adding a Property Description Generator

```typescript
// File: src/aws/bedrock/flows/generate-property-description.ts
"use server";

import {
  defineFlow,
  definePrompt,
  MODEL_CONFIGS,
  BEDROCK_MODELS,
} from "../flow-base";
import {
  PropertyDescriptionInputSchema,
  PropertyDescriptionOutputSchema,
} from "@/ai/schemas/property-description-schemas";

/**
 * Generates property descriptions for real estate listings
 *
 * Model Selection Rationale:
 * - Uses Haiku for cost-effectiveness (high-volume feature)
 * - Short output (200-300 words) fits Haiku's capabilities
 * - Creative temperature (0.7) for engaging descriptions
 * - Fast generation improves user experience
 * - Custom token limit (1024) sufficient for property descriptions
 */
const propertyDescriptionPrompt = definePrompt({
  name: "generatePropertyDescription",
  inputSchema: PropertyDescriptionInputSchema,
  outputSchema: PropertyDescriptionOutputSchema,
  options: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.7, // Creative but not too random
    maxTokens: 1024, // Sufficient for 200-300 words
  },
  prompt: `Generate a compelling property description...`,
});

export async function generatePropertyDescription(
  input: PropertyDescriptionInput
) {
  return propertyDescriptionPrompt(input);
}
```

## Testing and Benchmarking

### Unit Testing

Test that your flow uses the correct configuration:

```typescript
// File: src/aws/bedrock/flows/__tests__/my-flow.test.ts
import { describe, it, expect } from "@jest/globals";
import { BEDROCK_MODELS, MODEL_CONFIGS } from "../flow-base";

describe("My Flow Configuration", () => {
  it("should use the correct model", () => {
    // Test implementation
    expect(myFlow.options.modelId).toBe(BEDROCK_MODELS.HAIKU);
  });

  it("should use appropriate temperature", () => {
    expect(myFlow.options.temperature).toBeLessThanOrEqual(0.3);
  });
});
```

### Property-Based Testing

Test that configuration matches requirements:

```typescript
import fc from "fast-check";

describe("Model Configuration Properties", () => {
  it("analytical flows should use low temperature", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("runNapAudit", "findCompetitors", "getKeywordRankings"),
        (flowName) => {
          const flow = getFlow(flowName);
          expect(flow.temperature).toBeLessThanOrEqual(0.3);
        }
      )
    );
  });
});
```

### Performance Benchmarking

Measure actual performance:

```typescript
// File: scripts/benchmark-models.ts
import { generateBlogPost } from "@/aws/bedrock/flows/generate-blog-post";
import { BEDROCK_MODELS } from "@/aws/bedrock/flow-base";

async function benchmarkModel(modelId: string) {
  const start = Date.now();

  await generateBlogPost(
    { topic: "Real Estate Market Trends" },
    { modelId } // Runtime override
  );

  const duration = Date.now() - start;
  console.log(`${modelId}: ${duration}ms`);
}

// Compare models
await benchmarkModel(BEDROCK_MODELS.HAIKU);
await benchmarkModel(BEDROCK_MODELS.SONNET_3_5_V2);
await benchmarkModel(BEDROCK_MODELS.OPUS);
```

### Quality Testing

Compare output quality:

```typescript
async function compareQuality(input: any) {
  const models = [
    BEDROCK_MODELS.HAIKU,
    BEDROCK_MODELS.SONNET_3_5_V2,
    BEDROCK_MODELS.OPUS,
  ];

  for (const modelId of models) {
    const output = await generateContent(input, { modelId });
    console.log(`\n=== ${modelId} ===`);
    console.log(output);
    console.log(`Length: ${output.length} chars`);
  }
}
```

### Cost Analysis

Track token usage and costs:

```typescript
interface BenchmarkResult {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  cost: number;
}

async function analyzeCost(flow: string, iterations: number) {
  const results: BenchmarkResult[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    const output = await executeFlow(flow);
    const duration = Date.now() - start;

    // Calculate cost based on token usage
    const cost = calculateCost(
      output.inputTokens,
      output.outputTokens,
      output.modelId
    );

    results.push({
      modelId: output.modelId,
      inputTokens: output.inputTokens,
      outputTokens: output.outputTokens,
      durationMs: duration,
      cost,
    });
  }

  // Analyze results
  const avgCost = results.reduce((sum, r) => sum + r.cost, 0) / results.length;
  const avgDuration =
    results.reduce((sum, r) => sum + r.durationMs, 0) / results.length;

  console.log(`Average cost: $${avgCost.toFixed(4)}`);
  console.log(`Average duration: ${avgDuration.toFixed(0)}ms`);
}
```

## Runtime Overrides

See [MODEL_OVERRIDE_GUIDE.md](./MODEL_OVERRIDE_GUIDE.md) for detailed information on runtime overrides.

### Quick Reference

```typescript
// Override model only
await myFlow(input, { modelId: BEDROCK_MODELS.OPUS });

// Override temperature only
await myFlow(input, { temperature: 0.9 });

// Override multiple parameters
await myFlow(input, {
  modelId: BEDROCK_MODELS.HAIKU,
  temperature: 0.3,
  maxTokens: 1024,
});
```

## Performance Considerations

### Latency Expectations

| Model      | Expected Latency | Use Case              |
| ---------- | ---------------- | --------------------- |
| Haiku      | 0.5-1s           | User-facing features  |
| Sonnet 3.5 | 1-2s             | Most features         |
| Opus       | 3-5s             | Background processing |

### Token Limits and Performance

- **2048 tokens**: ~500 words, fastest generation
- **4096 tokens**: ~1000 words, standard generation
- **8192 tokens**: ~2000 words, slower generation

Larger token limits increase:

- Generation time
- Cost per request
- Memory usage

### Temperature and Performance

- **Low (0.1-0.3)**: Faster, more deterministic
- **Medium (0.4-0.6)**: Balanced
- **High (0.7-0.9)**: Slower, more creative

### Optimization Tips

1. **Use Haiku for high-volume features**
2. **Set minimum necessary token limits**
3. **Use lower temperature when creativity isn't needed**
4. **Batch similar requests when possible**
5. **Cache results for identical inputs**
6. **Use streaming for long-form content**

## Cost Optimization

### Pricing Reference (per 1M tokens)

| Model      | Input Cost | Output Cost | Total (1K in/out) |
| ---------- | ---------- | ----------- | ----------------- |
| Haiku      | $0.25      | $1.25       | $0.0015           |
| Sonnet 3.5 | $3.00      | $15.00      | $0.018            |
| Opus       | $15.00     | $75.00      | $0.090            |

### Cost Comparison Example

For 1000 requests with 500 input tokens and 500 output tokens:

- **Haiku**: $1.50
- **Sonnet 3.5**: $18.00 (12x more expensive)
- **Opus**: $90.00 (60x more expensive)

### Cost Optimization Strategies

#### 1. Use Haiku for Simple Tasks

```typescript
// ❌ Expensive: Using Sonnet for simple sentiment
options: MODEL_CONFIGS.BALANCED;

// ✅ Cost-effective: Using Haiku
options: MODEL_CONFIGS.SIMPLE;
```

**Savings**: 12x reduction in cost

#### 2. Minimize Token Limits

```typescript
// ❌ Wasteful: Requesting more tokens than needed
maxTokens: 8192; // For a 200-word bio

// ✅ Efficient: Appropriate token limit
maxTokens: 1024; // Sufficient for 200 words
```

**Savings**: Faster generation, lower cost

#### 3. Batch Similar Requests

```typescript
// ❌ Inefficient: Multiple individual calls
for (const review of reviews) {
  await analyzeSentiment(review);
}

// ✅ Efficient: Batch processing
await analyzeMultipleReviews(reviews);
```

**Savings**: Reduced overhead, better throughput

#### 4. Cache Results

```typescript
// Cache frequently requested content
const cacheKey = `blog-post-${topic}`;
const cached = await cache.get(cacheKey);

if (cached) return cached;

const result = await generateBlogPost({ topic });
await cache.set(cacheKey, result, { ttl: 3600 });
return result;
```

**Savings**: Eliminate redundant API calls

#### 5. Use Appropriate Temperature

```typescript
// ❌ Wasteful: High temperature for factual content
temperature: 0.9; // For NAP audit

// ✅ Efficient: Low temperature for accuracy
temperature: 0.2; // Faster, more consistent
```

**Savings**: Faster generation, fewer retries

### Monthly Cost Estimation

Calculate expected monthly costs:

```typescript
interface FeatureUsage {
  feature: string;
  requestsPerMonth: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  modelId: string;
}

function estimateMonthlyCost(usage: FeatureUsage[]): number {
  return usage.reduce((total, feature) => {
    const pricing = getPricing(feature.modelId);
    const inputCost =
      (feature.avgInputTokens / 1_000_000) *
      pricing.input *
      feature.requestsPerMonth;
    const outputCost =
      (feature.avgOutputTokens / 1_000_000) *
      pricing.output *
      feature.requestsPerMonth;
    return total + inputCost + outputCost;
  }, 0);
}

// Example usage
const usage: FeatureUsage[] = [
  {
    feature: "Agent Bio",
    requestsPerMonth: 10000,
    avgInputTokens: 200,
    avgOutputTokens: 150,
    modelId: BEDROCK_MODELS.HAIKU,
  },
  {
    feature: "Blog Posts",
    requestsPerMonth: 1000,
    avgInputTokens: 500,
    avgOutputTokens: 3000,
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
  },
];

console.log(
  `Estimated monthly cost: $${estimateMonthlyCost(usage).toFixed(2)}`
);
```

## Troubleshooting

### Common Issues

#### Issue: Flow is too slow

**Diagnosis**:

```typescript
// Measure execution time
const start = Date.now();
const result = await myFlow(input);
console.log(`Duration: ${Date.now() - start}ms`);
```

**Solutions**:

1. Switch to Haiku if quality is acceptable
2. Reduce maxTokens if output is shorter than limit
3. Lower temperature for faster generation
4. Check if web search is causing delays

#### Issue: Output quality is poor

**Diagnosis**:

```typescript
// Test with different models
const haikuResult = await myFlow(input, { modelId: BEDROCK_MODELS.HAIKU });
const sonnetResult = await myFlow(input, {
  modelId: BEDROCK_MODELS.SONNET_3_5_V2,
});
const opusResult = await myFlow(input, { modelId: BEDROCK_MODELS.OPUS });

// Compare quality
```

**Solutions**:

1. Upgrade to Sonnet 3.5 or Opus
2. Increase temperature for more creativity
3. Improve prompt clarity
4. Add examples to prompt

#### Issue: Costs are too high

**Diagnosis**:

```typescript
// Track token usage
import { logExecutionMetrics } from "@/aws/bedrock/execution-logger";

// Analyze logs to find high-cost features
```

**Solutions**:

1. Switch high-volume features to Haiku
2. Reduce token limits where possible
3. Implement caching for repeated requests
4. Batch similar requests

#### Issue: Inconsistent outputs

**Diagnosis**:

```typescript
// Test temperature settings
const results = [];
for (let i = 0; i < 10; i++) {
  results.push(await myFlow(input));
}
// Check variance in results
```

**Solutions**:

1. Lower temperature (0.1-0.3) for consistency
2. Use ANALYTICAL config for factual content
3. Improve prompt specificity
4. Add output format examples

#### Issue: Model not available

**Error**: `Model not found` or `Access denied`

**Solutions**:

1. Check model ID spelling
2. Verify model is available in your region
3. Use inference profile ARN for cross-region:
   ```typescript
   modelId: "us.anthropic.claude-3-5-sonnet-20241022-v2:0";
   ```
4. Check AWS Bedrock console for model access

#### Issue: Token limit exceeded

**Error**: `Maximum token limit exceeded`

**Solutions**:

1. Reduce maxTokens in configuration
2. Truncate input before sending
3. Split into multiple requests
4. Use a model with higher token limit

### Debugging Configuration

```typescript
import { mergeFlowOptions } from "@/aws/bedrock/flow-base";

// Check effective configuration
const effective = mergeFlowOptions(myFlow.options, runtimeOverrides);

console.log("Effective config:", effective);
// {
//   modelId: '...',
//   temperature: 0.7,
//   maxTokens: 4096,
//   topP: 1
// }
```

### Getting Help

1. Check execution logs in CloudWatch
2. Review property-based test failures
3. Compare with similar working flows
4. Test with runtime overrides
5. Consult AWS Bedrock documentation

## Best Practices Summary

### DO

✅ Use configuration presets (MODEL_CONFIGS) for consistency
✅ Document model selection rationale in comments
✅ Test with multiple models during development
✅ Monitor costs and performance in production
✅ Use Haiku for high-volume simple tasks
✅ Use Sonnet 3.5 for most general-purpose tasks
✅ Use Opus only when accuracy is critical
✅ Set appropriate token limits for expected output
✅ Use low temperature for factual/analytical content
✅ Use higher temperature for creative content
✅ Implement caching for repeated requests
✅ Batch similar requests when possible

### DON'T

❌ Use Opus for simple tasks (waste of money)
❌ Use Haiku for complex reasoning (poor quality)
❌ Set maxTokens higher than needed (slower, costier)
❌ Use high temperature for factual content (inconsistent)
❌ Ignore performance metrics (miss optimization opportunities)
❌ Hard-code model IDs without using constants
❌ Skip testing with different configurations
❌ Forget to document configuration choices
❌ Use same config for all features (one-size-fits-all)
❌ Override defaults without good reason

## Related Documentation

- [Model Override Guide](./MODEL_OVERRIDE_GUIDE.md) - Runtime configuration overrides
- [Bedrock Client](./client.ts) - Low-level client implementation
- [Flow Base](./flow-base.ts) - Flow definition utilities
- [Execution Logger](./execution-logger.ts) - Performance monitoring
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)

## Changelog

### 2024-11 - Initial Release

- Documented all 20+ AI flows
- Added configuration presets
- Created testing guidelines
- Added cost optimization strategies
- Included troubleshooting guide

---

**Last Updated**: November 2024
**Maintained By**: Co-agent Marketer Engineering Team
