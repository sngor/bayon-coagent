# Model Benchmarking Guide

This guide explains how to test and benchmark different models to make data-driven configuration decisions.

## Table of Contents

1. [Overview](#overview)
2. [Setting Up Benchmarks](#setting-up-benchmarks)
3. [Performance Benchmarking](#performance-benchmarking)
4. [Quality Benchmarking](#quality-benchmarking)
5. [Cost Analysis](#cost-analysis)
6. [A/B Testing](#ab-testing)
7. [Automated Testing](#automated-testing)
8. [Interpreting Results](#interpreting-results)

## Overview

Benchmarking helps you:

- **Validate model selection**: Confirm your chosen model is appropriate
- **Optimize performance**: Find the fastest model that meets quality requirements
- **Reduce costs**: Identify opportunities to use cheaper models
- **Measure improvements**: Track performance over time
- **Make data-driven decisions**: Use metrics instead of guesswork

### What to Benchmark

1. **Latency**: Response time from request to completion
2. **Quality**: Output accuracy, completeness, and relevance
3. **Cost**: Token usage and associated costs
4. **Consistency**: Variance in outputs across multiple runs
5. **Error Rate**: Frequency of failures or invalid outputs

## Setting Up Benchmarks

### Create a Benchmark Script

```typescript
// File: scripts/benchmark-flow.ts
import { BEDROCK_MODELS } from "@/aws/bedrock/flow-base";

interface BenchmarkConfig {
  flowName: string;
  testInputs: any[];
  models: string[];
  iterations: number;
}

interface BenchmarkResult {
  modelId: string;
  avgLatencyMs: number;
  minLatencyMs: number;
  maxLatencyMs: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  totalCost: number;
  errorRate: number;
  outputs: any[];
}

async function benchmarkFlow(
  config: BenchmarkConfig
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];

  for (const modelId of config.models) {
    console.log(`\nBenchmarking ${modelId}...`);

    const latencies: number[] = [];
    const inputTokens: number[] = [];
    const outputTokens: number[] = [];
    const outputs: any[] = [];
    let errors = 0;

    for (let i = 0; i < config.iterations; i++) {
      const input = config.testInputs[i % config.testInputs.length];

      try {
        const start = Date.now();
        const output = await executeFlow(config.flowName, input, { modelId });
        const latency = Date.now() - start;

        latencies.push(latency);
        inputTokens.push(output.usage?.inputTokens || 0);
        outputTokens.push(output.usage?.outputTokens || 0);
        outputs.push(output);
      } catch (error) {
        errors++;
        console.error(`Error on iteration ${i}:`, error);
      }
    }

    const avgInputTokens = average(inputTokens);
    const avgOutputTokens = average(outputTokens);
    const totalCost = calculateCost(
      avgInputTokens * config.iterations,
      avgOutputTokens * config.iterations,
      modelId
    );

    results.push({
      modelId,
      avgLatencyMs: average(latencies),
      minLatencyMs: Math.min(...latencies),
      maxLatencyMs: Math.max(...latencies),
      avgInputTokens,
      avgOutputTokens,
      totalCost,
      errorRate: errors / config.iterations,
      outputs,
    });
  }

  return results;
}

function average(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

function calculateCost(
  inputTokens: number,
  outputTokens: number,
  modelId: string
): number {
  const pricing = {
    [BEDROCK_MODELS.HAIKU]: { input: 0.25, output: 1.25 },
    [BEDROCK_MODELS.SONNET_3_5_V2]: { input: 3.0, output: 15.0 },
    [BEDROCK_MODELS.OPUS]: { input: 15.0, output: 75.0 },
  };

  const prices = pricing[modelId] || pricing[BEDROCK_MODELS.SONNET_3_5_V2];
  return (
    (inputTokens / 1_000_000) * prices.input +
    (outputTokens / 1_000_000) * prices.output
  );
}
```

### Example Usage

```typescript
// Benchmark blog post generation
const results = await benchmarkFlow({
  flowName: "generateBlogPost",
  testInputs: [
    { topic: "Real Estate Market Trends 2024" },
    { topic: "First-Time Home Buyer Tips" },
    { topic: "Investment Property Analysis" },
  ],
  models: [
    BEDROCK_MODELS.HAIKU,
    BEDROCK_MODELS.SONNET_3_5_V2,
    BEDROCK_MODELS.OPUS,
  ],
  iterations: 10,
});

printResults(results);
```

## Performance Benchmarking

### Measure Latency

```typescript
async function measureLatency(
  flow: string,
  input: any,
  modelId: string,
  runs: number = 10
) {
  const latencies: number[] = [];

  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    await executeFlow(flow, input, { modelId });
    const latency = performance.now() - start;
    latencies.push(latency);
  }

  return {
    avg: average(latencies),
    min: Math.min(...latencies),
    max: Math.max(...latencies),
    p50: percentile(latencies, 50),
    p95: percentile(latencies, 95),
    p99: percentile(latencies, 99),
  };
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[index];
}

// Example
const latency = await measureLatency(
  "generateAgentBio",
  { name: "John Doe", experience: 10, certifications: "CRS, GRI" },
  BEDROCK_MODELS.HAIKU,
  50
);

console.log(`Average: ${latency.avg.toFixed(0)}ms`);
console.log(`P95: ${latency.p95.toFixed(0)}ms`);
console.log(`P99: ${latency.p99.toFixed(0)}ms`);
```

### Compare Models

```typescript
async function compareModelLatency(flow: string, input: any) {
  const models = [
    BEDROCK_MODELS.HAIKU,
    BEDROCK_MODELS.SONNET_3_5_V2,
    BEDROCK_MODELS.OPUS,
  ];

  console.log("\n=== Latency Comparison ===\n");

  for (const modelId of models) {
    const latency = await measureLatency(flow, input, modelId, 20);
    console.log(`${modelId}:`);
    console.log(`  Avg: ${latency.avg.toFixed(0)}ms`);
    console.log(`  P95: ${latency.p95.toFixed(0)}ms`);
    console.log(`  Min: ${latency.min.toFixed(0)}ms`);
    console.log(`  Max: ${latency.max.toFixed(0)}ms\n`);
  }
}
```

### Throughput Testing

```typescript
async function measureThroughput(
  flow: string,
  input: any,
  modelId: string,
  duration: number = 60000
) {
  const startTime = Date.now();
  let requests = 0;
  let errors = 0;

  while (Date.now() - startTime < duration) {
    try {
      await executeFlow(flow, input, { modelId });
      requests++;
    } catch (error) {
      errors++;
    }
  }

  const actualDuration = Date.now() - startTime;
  const requestsPerSecond = (requests / actualDuration) * 1000;

  return {
    totalRequests: requests,
    totalErrors: errors,
    durationMs: actualDuration,
    requestsPerSecond,
    errorRate: errors / (requests + errors),
  };
}

// Example: Test for 30 seconds
const throughput = await measureThroughput(
  "analyzeReviewSentiment",
  { review: "Great agent, very helpful!" },
  BEDROCK_MODELS.HAIKU,
  30000
);

console.log(`Throughput: ${throughput.requestsPerSecond.toFixed(2)} req/s`);
console.log(`Error rate: ${(throughput.errorRate * 100).toFixed(2)}%`);
```

## Quality Benchmarking

### Automated Quality Metrics

```typescript
interface QualityMetrics {
  completeness: number; // 0-1: All required fields present
  validity: number; // 0-1: Passes schema validation
  length: number; // Character count
  wordCount: number; // Word count
  readability: number; // Flesch reading ease score
}

function assessQuality(output: any, schema: z.ZodSchema): QualityMetrics {
  // Check completeness
  const requiredFields = getRequiredFields(schema);
  const presentFields = requiredFields.filter(
    (field) => output[field] !== undefined
  );
  const completeness = presentFields.length / requiredFields.length;

  // Check validity
  const validity = schema.safeParse(output).success ? 1 : 0;

  // Measure length
  const text = extractText(output);
  const length = text.length;
  const wordCount = text.split(/\s+/).length;

  // Calculate readability (simplified Flesch score)
  const readability = calculateReadability(text);

  return {
    completeness,
    validity,
    length,
    wordCount,
    readability,
  };
}

async function compareQuality(flow: string, input: any, schema: z.ZodSchema) {
  const models = [
    BEDROCK_MODELS.HAIKU,
    BEDROCK_MODELS.SONNET_3_5_V2,
    BEDROCK_MODELS.OPUS,
  ];

  console.log("\n=== Quality Comparison ===\n");

  for (const modelId of models) {
    const outputs = [];

    // Generate multiple outputs
    for (let i = 0; i < 5; i++) {
      const output = await executeFlow(flow, input, { modelId });
      outputs.push(output);
    }

    // Assess quality
    const metrics = outputs.map((o) => assessQuality(o, schema));
    const avgMetrics = {
      completeness: average(metrics.map((m) => m.completeness)),
      validity: average(metrics.map((m) => m.validity)),
      length: average(metrics.map((m) => m.length)),
      wordCount: average(metrics.map((m) => m.wordCount)),
      readability: average(metrics.map((m) => m.readability)),
    };

    console.log(`${modelId}:`);
    console.log(
      `  Completeness: ${(avgMetrics.completeness * 100).toFixed(1)}%`
    );
    console.log(`  Validity: ${(avgMetrics.validity * 100).toFixed(1)}%`);
    console.log(`  Avg Length: ${avgMetrics.length.toFixed(0)} chars`);
    console.log(`  Avg Words: ${avgMetrics.wordCount.toFixed(0)}`);
    console.log(`  Readability: ${avgMetrics.readability.toFixed(1)}\n`);
  }
}
```

### Manual Quality Review

```typescript
async function generateSampleOutputs(flow: string, input: any) {
  const models = [
    BEDROCK_MODELS.HAIKU,
    BEDROCK_MODELS.SONNET_3_5_V2,
    BEDROCK_MODELS.OPUS,
  ];

  console.log("\n=== Sample Outputs for Manual Review ===\n");

  for (const modelId of models) {
    console.log(`\n--- ${modelId} ---\n`);
    const output = await executeFlow(flow, input, { modelId });
    console.log(JSON.stringify(output, null, 2));
    console.log("\n" + "=".repeat(80) + "\n");
  }
}

// Generate samples for review
await generateSampleOutputs("generateBlogPost", {
  topic: "Real Estate Investment Strategies",
});
```

### Consistency Testing

```typescript
async function testConsistency(
  flow: string,
  input: any,
  modelId: string,
  runs: number = 10
) {
  const outputs = [];

  for (let i = 0; i < runs; i++) {
    const output = await executeFlow(flow, input, { modelId });
    outputs.push(output);
  }

  // Measure variance in key metrics
  const lengths = outputs.map((o) => extractText(o).length);
  const variance = calculateVariance(lengths);
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / average(lengths);

  return {
    avgLength: average(lengths),
    stdDev,
    coefficientOfVariation,
    minLength: Math.min(...lengths),
    maxLength: Math.max(...lengths),
    outputs,
  };
}

function calculateVariance(numbers: number[]): number {
  const avg = average(numbers);
  const squaredDiffs = numbers.map((n) => Math.pow(n - avg, 2));
  return average(squaredDiffs);
}

// Test consistency
const consistency = await testConsistency(
  "generateAgentBio",
  { name: "John Doe", experience: 10, certifications: "CRS" },
  BEDROCK_MODELS.HAIKU,
  20
);

console.log(`Avg length: ${consistency.avgLength.toFixed(0)} chars`);
console.log(`Std dev: ${consistency.stdDev.toFixed(0)} chars`);
console.log(`CV: ${(consistency.coefficientOfVariation * 100).toFixed(1)}%`);
```

## Cost Analysis

### Calculate Per-Request Cost

```typescript
function calculateRequestCost(
  inputTokens: number,
  outputTokens: number,
  modelId: string
): number {
  const pricing = {
    [BEDROCK_MODELS.HAIKU]: { input: 0.25, output: 1.25 },
    [BEDROCK_MODELS.SONNET_3_5_V2]: { input: 3.0, output: 15.0 },
    [BEDROCK_MODELS.OPUS]: { input: 15.0, output: 75.0 },
  };

  const prices = pricing[modelId];
  return (
    (inputTokens / 1_000_000) * prices.input +
    (outputTokens / 1_000_000) * prices.output
  );
}

// Example
const cost = calculateRequestCost(500, 500, BEDROCK_MODELS.HAIKU);
console.log(`Cost per request: $${cost.toFixed(6)}`);
```

### Project Monthly Costs

```typescript
interface FeatureProjection {
  feature: string;
  requestsPerMonth: number;
  avgInputTokens: number;
  avgOutputTokens: number;
}

function projectMonthlyCosts(
  projections: FeatureProjection[],
  modelId: string
): number {
  return projections.reduce((total, proj) => {
    const costPerRequest = calculateRequestCost(
      proj.avgInputTokens,
      proj.avgOutputTokens,
      modelId
    );
    return total + costPerRequest * proj.requestsPerMonth;
  }, 0);
}

// Example projections
const projections: FeatureProjection[] = [
  {
    feature: "Agent Bio",
    requestsPerMonth: 10000,
    avgInputTokens: 200,
    avgOutputTokens: 150,
  },
  {
    feature: "Blog Posts",
    requestsPerMonth: 1000,
    avgInputTokens: 500,
    avgOutputTokens: 3000,
  },
];

const haikuCost = projectMonthlyCosts(projections, BEDROCK_MODELS.HAIKU);
const sonnetCost = projectMonthlyCosts(
  projections,
  BEDROCK_MODELS.SONNET_3_5_V2
);

console.log(`Haiku: $${haikuCost.toFixed(2)}/month`);
console.log(`Sonnet: $${sonnetCost.toFixed(2)}/month`);
console.log(`Savings: $${(sonnetCost - haikuCost).toFixed(2)}/month`);
```

### Cost-Performance Trade-off

```typescript
interface CostPerformanceMetric {
  modelId: string;
  avgLatencyMs: number;
  costPer1000: number;
  qualityScore: number; // 0-100
  efficiency: number; // quality / (cost * latency)
}

async function analyzeCostPerformance(
  flow: string,
  input: any
): Promise<CostPerformanceMetric[]> {
  const models = [
    BEDROCK_MODELS.HAIKU,
    BEDROCK_MODELS.SONNET_3_5_V2,
    BEDROCK_MODELS.OPUS,
  ];
  const results: CostPerformanceMetric[] = [];

  for (const modelId of models) {
    // Measure latency
    const latency = await measureLatency(flow, input, modelId, 10);

    // Measure cost
    const output = await executeFlow(flow, input, { modelId });
    const cost =
      calculateRequestCost(
        output.usage.inputTokens,
        output.usage.outputTokens,
        modelId
      ) * 1000;

    // Assess quality (manual or automated)
    const qualityScore = await assessQualityScore(output);

    // Calculate efficiency
    const efficiency = qualityScore / (cost * latency.avg);

    results.push({
      modelId,
      avgLatencyMs: latency.avg,
      costPer1000: cost,
      qualityScore,
      efficiency,
    });
  }

  return results;
}

// Find the most efficient model
const metrics = await analyzeCostPerformance("generateBlogPost", {
  topic: "Real Estate Trends",
});

const mostEfficient = metrics.sort((a, b) => b.efficiency - a.efficiency)[0];
console.log(`Most efficient model: ${mostEfficient.modelId}`);
```

## A/B Testing

### Set Up A/B Test

```typescript
interface ABTestConfig {
  flow: string;
  input: any;
  modelA: string;
  modelB: string;
  sampleSize: number;
}

interface ABTestResult {
  modelA: {
    avgLatency: number;
    avgCost: number;
    avgQuality: number;
    errorRate: number;
  };
  modelB: {
    avgLatency: number;
    avgCost: number;
    avgQuality: number;
    errorRate: number;
  };
  winner: string;
  confidence: number;
}

async function runABTest(config: ABTestConfig): Promise<ABTestResult> {
  const resultsA = [];
  const resultsB = [];

  for (let i = 0; i < config.sampleSize; i++) {
    // Alternate between models
    const modelId = i % 2 === 0 ? config.modelA : config.modelB;
    const results = i % 2 === 0 ? resultsA : resultsB;

    try {
      const start = Date.now();
      const output = await executeFlow(config.flow, config.input, { modelId });
      const latency = Date.now() - start;
      const cost = calculateRequestCost(
        output.usage.inputTokens,
        output.usage.outputTokens,
        modelId
      );
      const quality = await assessQualityScore(output);

      results.push({ latency, cost, quality, error: false });
    } catch (error) {
      results.push({ latency: 0, cost: 0, quality: 0, error: true });
    }
  }

  // Calculate metrics
  const metricsA = calculateMetrics(resultsA);
  const metricsB = calculateMetrics(resultsB);

  // Determine winner (simple heuristic)
  const scoreA = metricsA.avgQuality / (metricsA.avgCost * metricsA.avgLatency);
  const scoreB = metricsB.avgQuality / (metricsB.avgCost * metricsB.avgLatency);

  return {
    modelA: metricsA,
    modelB: metricsB,
    winner: scoreA > scoreB ? config.modelA : config.modelB,
    confidence: Math.abs(scoreA - scoreB) / Math.max(scoreA, scoreB),
  };
}

// Run A/B test
const result = await runABTest({
  flow: "generateSocialMediaPost",
  input: { topic: "Open House This Weekend" },
  modelA: BEDROCK_MODELS.HAIKU,
  modelB: BEDROCK_MODELS.SONNET_3_5_V2,
  sampleSize: 100,
});

console.log(`Winner: ${result.winner}`);
console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
```

## Automated Testing

### Integration with CI/CD

```typescript
// File: scripts/benchmark-ci.ts
import { benchmarkFlow } from "./benchmark-flow";

async function runCIBenchmarks() {
  const benchmarks = [
    {
      name: "Agent Bio Generation",
      flow: "generateAgentBio",
      input: { name: "Test Agent", experience: 5, certifications: "CRS" },
      expectedLatency: 1000, // ms
      expectedCost: 0.001, // dollars
    },
    {
      name: "Blog Post Generation",
      flow: "generateBlogPost",
      input: { topic: "Test Topic" },
      expectedLatency: 3000,
      expectedCost: 0.05,
    },
  ];

  let allPassed = true;

  for (const benchmark of benchmarks) {
    console.log(`\nRunning: ${benchmark.name}`);

    const result = await benchmarkFlow({
      flowName: benchmark.flow,
      testInputs: [benchmark.input],
      models: [BEDROCK_MODELS.SONNET_3_5_V2],
      iterations: 5,
    });

    const passed =
      result[0].avgLatencyMs <= benchmark.expectedLatency &&
      result[0].totalCost / 5 <= benchmark.expectedCost;

    if (passed) {
      console.log("✅ PASSED");
    } else {
      console.log("❌ FAILED");
      console.log(
        `  Expected latency: ${
          benchmark.expectedLatency
        }ms, got: ${result[0].avgLatencyMs.toFixed(0)}ms`
      );
      console.log(
        `  Expected cost: $${benchmark.expectedCost}, got: $${(
          result[0].totalCost / 5
        ).toFixed(4)}`
      );
      allPassed = false;
    }
  }

  process.exit(allPassed ? 0 : 1);
}

runCIBenchmarks();
```

### Regression Testing

```typescript
// Store baseline metrics
interface Baseline {
  flow: string;
  modelId: string;
  avgLatencyMs: number;
  avgCost: number;
  avgQuality: number;
  timestamp: string;
}

async function detectRegression(
  flow: string,
  modelId: string,
  baseline: Baseline
) {
  const current = await benchmarkFlow({
    flowName: flow,
    testInputs: [
      /* test inputs */
    ],
    models: [modelId],
    iterations: 10,
  });

  const latencyRegression =
    (current[0].avgLatencyMs - baseline.avgLatencyMs) / baseline.avgLatencyMs;
  const costRegression =
    (current[0].totalCost / 10 - baseline.avgCost) / baseline.avgCost;

  if (latencyRegression > 0.2) {
    console.warn(
      `⚠️  Latency regression detected: +${(latencyRegression * 100).toFixed(
        1
      )}%`
    );
  }

  if (costRegression > 0.2) {
    console.warn(
      `⚠️  Cost regression detected: +${(costRegression * 100).toFixed(1)}%`
    );
  }

  return {
    latencyRegression,
    costRegression,
    hasRegression: latencyRegression > 0.2 || costRegression > 0.2,
  };
}
```

## Interpreting Results

### Performance Interpretation

**Latency**:

- < 1s: Excellent for user-facing features
- 1-2s: Good for most features
- 2-3s: Acceptable for background tasks
- > 3s: Consider optimization or async processing

**Throughput**:

- > 10 req/s: High throughput
- 5-10 req/s: Medium throughput
- < 5 req/s: Low throughput (consider scaling)

### Quality Interpretation

**Completeness**:

- 100%: All required fields present
- 90-99%: Mostly complete, minor issues
- < 90%: Significant quality issues

**Consistency** (Coefficient of Variation):

- < 10%: Very consistent
- 10-20%: Moderately consistent
- > 20%: High variance, consider lower temperature

### Cost Interpretation

**Per-Request Cost**:

- < $0.001: Very cheap (Haiku)
- $0.001-$0.01: Moderate (Sonnet)
- > $0.01: Expensive (Opus or long outputs)

**Monthly Projections**:

- Calculate based on expected volume
- Factor in growth projections
- Consider cost vs. quality trade-offs

### Making Decisions

Use this decision matrix:

| Scenario                       | Recommendation                           |
| ------------------------------ | ---------------------------------------- |
| High volume + simple task      | Use Haiku                                |
| High volume + quality critical | Use Sonnet, optimize prompts             |
| Low volume + quality critical  | Use Opus                                 |
| Latency > 3s                   | Switch to faster model or optimize       |
| Cost > budget                  | Use cheaper model or reduce token limits |
| Quality < 90%                  | Use better model or improve prompts      |
| High variance                  | Lower temperature                        |

## Example: Complete Benchmark

```bash
# Run comprehensive benchmark
npm run benchmark:flow -- --flow=generateBlogPost --iterations=50

# Output:
# === Blog Post Generation Benchmark ===
#
# Haiku:
#   Avg Latency: 847ms
#   P95 Latency: 1203ms
#   Avg Cost: $0.0023
#   Quality Score: 72/100
#   Error Rate: 0%
#
# Sonnet 3.5:
#   Avg Latency: 1834ms
#   P95 Latency: 2401ms
#   Avg Cost: $0.0421
#   Quality Score: 94/100
#   Error Rate: 0%
#
# Opus:
#   Avg Latency: 4127ms
#   P95 Latency: 5203ms
#   Avg Cost: $0.1847
#   Quality Score: 97/100
#   Error Rate: 0%
#
# Recommendation: Use Sonnet 3.5
# Rationale: Best balance of quality (94) and cost ($0.04)
```

## Related Documentation

- [Model Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md)
- [Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md)
- [Property-Based Tests](./__tests__/)

---

**Remember**: Benchmark with realistic inputs and production-like conditions for accurate results.
