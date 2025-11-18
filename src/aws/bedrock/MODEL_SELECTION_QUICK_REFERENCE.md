# Model Selection Quick Reference

A quick decision tree and cheat sheet for selecting the right model configuration.

## Decision Tree

```
START: What are you building?
│
├─ Short text (< 500 words)?
│  ├─ Simple task (bio, sentiment)? → HAIKU + SIMPLE
│  └─ Creative task (social post)? → HAIKU + CREATIVE (temp 0.7)
│
├─ Medium text (500-1500 words)?
│  ├─ Factual/analytical? → SONNET 3.5 + ANALYTICAL
│  ├─ Creative content? → SONNET 3.5 + CREATIVE
│  └─ Balanced? → SONNET 3.5 + BALANCED
│
├─ Long text (> 1500 words)?
│  └─ Any type → SONNET 3.5 + LONG_FORM
│
└─ Critical accuracy needed?
   └─ Any length → OPUS + CRITICAL
```

## Quick Selection Table

| Feature Type        | Model      | Config     | Temperature | Tokens |
| ------------------- | ---------- | ---------- | ----------- | ------ |
| Agent Bio           | Haiku      | SIMPLE     | 0.3         | 2048   |
| Sentiment Analysis  | Haiku      | SIMPLE     | 0.3         | 2048   |
| Social Media        | Haiku      | CREATIVE   | 0.7         | 2048   |
| Listing Description | Haiku      | CREATIVE   | 0.7         | 2048   |
| Blog Post           | Sonnet 3.5 | LONG_FORM  | 0.6         | 8192   |
| Neighborhood Guide  | Sonnet 3.5 | LONG_FORM  | 0.6         | 8192   |
| Research Report     | Sonnet 3.5 | LONG_FORM  | 0.6         | 8192   |
| Video Script        | Sonnet 3.5 | CREATIVE   | 0.7         | 4096   |
| FAQs                | Sonnet 3.5 | BALANCED   | 0.5         | 4096   |
| Market Update       | Sonnet 3.5 | BALANCED   | 0.5         | 4096   |
| Marketing Plan      | Sonnet 3.5 | BALANCED   | 0.5         | 4096   |
| NAP Audit           | Sonnet 3.5 | ANALYTICAL | 0.2         | 4096   |
| Competitor Analysis | Sonnet 3.5 | ANALYTICAL | 0.2         | 4096   |
| Keyword Rankings    | Sonnet 3.5 | ANALYTICAL | 0.2         | 4096   |
| Review Analysis     | Sonnet 3.5 | ANALYTICAL | 0.2         | 4096   |
| Legal Content       | Opus       | CRITICAL   | 0.1         | 4096   |

## Configuration Presets Cheat Sheet

```typescript
// Copy-paste ready configurations

// Fast & cheap (< 500 words, simple)
options: MODEL_CONFIGS.SIMPLE;

// Balanced general purpose
options: MODEL_CONFIGS.BALANCED;

// Creative content
options: MODEL_CONFIGS.CREATIVE;

// Long-form content (> 1500 words)
options: MODEL_CONFIGS.LONG_FORM;

// Data extraction & analysis
options: MODEL_CONFIGS.ANALYTICAL;

// Critical accuracy
options: MODEL_CONFIGS.CRITICAL;
```

## Common Patterns

### Pattern 1: Short Creative Content

```typescript
const prompt = definePrompt({
  name: "generateShortContent",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  options: {
    modelId: BEDROCK_MODELS.HAIKU,
    temperature: 0.7,
    maxTokens: 1024,
  },
  prompt: `...`,
});
```

### Pattern 2: Long-Form Article

```typescript
const prompt = definePrompt({
  name: "generateArticle",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  options: MODEL_CONFIGS.LONG_FORM,
  prompt: `...`,
});
```

### Pattern 3: Data Extraction

```typescript
const prompt = definePrompt({
  name: "extractData",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL,
  prompt: `...`,
});
```

### Pattern 4: Custom Configuration

```typescript
const prompt = definePrompt({
  name: "customFlow",
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  options: {
    modelId: BEDROCK_MODELS.SONNET_3_5_V2,
    temperature: 0.4, // Custom value
    maxTokens: 3072, // Custom value
  },
  prompt: `...`,
});
```

## Temperature Guide

| Temperature | Use Case          | Example                            |
| ----------- | ----------------- | ---------------------------------- |
| 0.1         | Critical accuracy | Legal disclaimers, compliance      |
| 0.2         | Analytical tasks  | Data extraction, NAP audit         |
| 0.3         | Simple factual    | Sentiment analysis, classification |
| 0.5         | Balanced          | FAQs, market updates               |
| 0.6         | Long-form         | Blog posts, guides                 |
| 0.7         | Creative          | Social media, video scripts        |
| 0.9         | Highly creative   | Experimental, brainstorming        |

## Token Limits Guide

| Tokens | Words | Use Case                    |
| ------ | ----- | --------------------------- |
| 1024   | ~250  | Short descriptions, bios    |
| 2048   | ~500  | Social posts, summaries     |
| 4096   | ~1000 | Standard content, FAQs      |
| 6144   | ~1500 | Medium articles             |
| 8192   | ~2000 | Long-form content, research |

## Cost Comparison (per 1000 requests)

Assuming 500 input tokens + 500 output tokens per request:

| Model      | Cost per 1K requests | Monthly (30K) | Monthly (100K) |
| ---------- | -------------------- | ------------- | -------------- |
| Haiku      | $1.50                | $45           | $150           |
| Sonnet 3.5 | $18.00               | $540          | $1,800         |
| Opus       | $90.00               | $2,700        | $9,000         |

**Savings**: Using Haiku instead of Sonnet 3.5 = **12x cost reduction**

## Performance Comparison

| Model      | Avg Latency | Throughput | Best For              |
| ---------- | ----------- | ---------- | --------------------- |
| Haiku      | 0.5-1s      | High       | User-facing features  |
| Sonnet 3.5 | 1-2s        | Medium     | Most features         |
| Opus       | 3-5s        | Low        | Background processing |

## When to Override Defaults

### Test Different Models

```typescript
// Quick A/B test
const haiku = await flow(input, { modelId: BEDROCK_MODELS.HAIKU });
const sonnet = await flow(input, { modelId: BEDROCK_MODELS.SONNET_3_5_V2 });
```

### Adjust Temperature

```typescript
// More deterministic
await flow(input, { temperature: 0.1 });

// More creative
await flow(input, { temperature: 0.9 });
```

### Reduce Costs

```typescript
// Use cheaper model for testing
await flow(input, { modelId: BEDROCK_MODELS.HAIKU });
```

### Improve Quality

```typescript
// Use better model for important content
await flow(input, { modelId: BEDROCK_MODELS.OPUS });
```

## Common Mistakes to Avoid

❌ **Using Opus for simple tasks**

```typescript
// Wasteful: $90 per 1K requests
options: {
  modelId: BEDROCK_MODELS.OPUS;
}
```

✅ **Use Haiku for simple tasks**

```typescript
// Cost-effective: $1.50 per 1K requests
options: MODEL_CONFIGS.SIMPLE;
```

---

❌ **Setting maxTokens too high**

```typescript
// Wasteful: Requesting 8K tokens for 200-word bio
maxTokens: 8192;
```

✅ **Use appropriate token limit**

```typescript
// Efficient: 1K tokens sufficient for 200 words
maxTokens: 1024;
```

---

❌ **High temperature for factual content**

```typescript
// Inconsistent: High randomness for data extraction
temperature: 0.9;
```

✅ **Low temperature for accuracy**

```typescript
// Consistent: Low randomness for factual content
temperature: 0.2;
```

---

❌ **Not using presets**

```typescript
// Hard to maintain
options: {
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  temperature: 0.7,
  maxTokens: 4096,
}
```

✅ **Use configuration presets**

```typescript
// Clear and maintainable
options: MODEL_CONFIGS.CREATIVE;
```

## Testing Checklist

Before deploying a new flow:

- [ ] Tested with appropriate model for task complexity
- [ ] Verified temperature setting matches use case
- [ ] Confirmed token limit is sufficient but not excessive
- [ ] Tested with sample inputs
- [ ] Measured actual latency
- [ ] Calculated expected costs
- [ ] Documented configuration rationale
- [ ] Added property-based tests
- [ ] Tested error handling
- [ ] Verified output quality

## Need Help?

1. **Not sure which model?** → Start with `MODEL_CONFIGS.BALANCED`
2. **Too slow?** → Try `BEDROCK_MODELS.HAIKU`
3. **Poor quality?** → Try `BEDROCK_MODELS.SONNET_3_5_V2` or `OPUS`
4. **Too expensive?** → Use `HAIKU` for high-volume features
5. **Inconsistent outputs?** → Lower temperature to 0.1-0.3

## Related Docs

- [Full Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md)
- [Override Guide](./MODEL_OVERRIDE_GUIDE.md)
- [Flow Examples](./flows/)

---

**Quick Tip**: When in doubt, use `MODEL_CONFIGS.BALANCED` and optimize later based on metrics.
