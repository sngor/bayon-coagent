# Bedrock Property-Based Tests

This directory contains property-based tests for AWS Bedrock AI flows.

## Test Categories

### Configuration Tests

- **model-configuration.test.ts**: Tests model selection and configuration presets
- **schema-validation.test.ts**: Tests input/output schema validation
- **input-validation.test.ts**: Tests that input validation precedes model invocation
- **nap-comparison.test.ts**: Tests NAP (Name, Address, Phone) comparison logic
- **nap-missing-profile.test.ts**: Tests handling of missing profiles in NAP audits
- **retry-behavior.test.ts**: Tests retry logic for retryable errors (throttling, timeouts, 503, 429)

These tests run without external API calls and can be run locally.

### Integration Tests

- **competitor-discovery.test.ts**: Tests competitor discovery functionality
- **missing-data-handling.test.ts**: Tests that missing data returns zeros instead of hallucinations
- **keyword-rankings.test.ts**: Tests keyword ranking functionality
- **search-failure-handling.test.ts**: Tests that search failures don't crash flows

These tests require external API access and will be skipped if API keys are not configured.

## Running Tests

### Run All Tests

```bash
npm test -- src/aws/bedrock/__tests__
```

### Run Specific Test File

```bash
npm test -- src/aws/bedrock/__tests__/model-configuration.test.ts
```

### Run with Coverage

```bash
npm test -- src/aws/bedrock/__tests__ --coverage
```

## Required Environment Variables

### For Integration Tests

Integration tests require the following environment variables:

- `TAVILY_API_KEY`: API key for Tavily web search service
- `AWS_BEDROCK_REGION`: AWS region for Bedrock service (e.g., 'us-east-1')
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key

Set these in your `.env.local` file:

```bash
TAVILY_API_KEY=your-tavily-api-key
AWS_BEDROCK_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
```

### Skipped Tests

Tests that require API keys will be automatically skipped if the required environment variables are not set. You'll see a warning message like:

```
⚠️  Skipping competitor discovery property tests: Missing API keys
   Set TAVILY_API_KEY and AWS_BEDROCK_REGION to run these tests
```

## Property-Based Testing

These tests use [fast-check](https://github.com/dubzzz/fast-check) for property-based testing. Property-based tests generate random inputs and verify that certain properties hold true across all inputs.

### Example Property

```typescript
// Property: Competitor discovery returns 3-5 results
fc.assert(
  fc.asyncProperty(competitorDiscoveryInputArbitrary(), async (input) => {
    const output = await findCompetitors(input);
    expect(output.competitors.length).toBeGreaterThanOrEqual(0);
    expect(output.competitors.length).toBeLessThanOrEqual(5);
    return true;
  }),
  { numRuns: 10 }
);
```

## Test Timeouts

Integration tests that call external APIs have extended timeouts:

- Default: 120 seconds (2 minutes)
- Can be overridden with `--testTimeout` flag

```bash
npm test -- src/aws/bedrock/__tests__/competitor-discovery.test.ts --testTimeout=180000
```

## Debugging Tests

### Verbose Mode

Enable verbose mode to see all failing values during property-based testing:

```bash
npm test -- src/aws/bedrock/__tests__ --verbose
```

### Single Test

Run a single test case:

```bash
npm test -- src/aws/bedrock/__tests__/competitor-discovery.test.ts -t "should return between 0 and 5 competitors"
```

## CI/CD Considerations

In CI/CD pipelines:

1. Configuration tests should always run
2. Integration tests should only run in staging/production environments where API keys are available
3. Use environment-specific test configurations to control which tests run

## Adding New Tests

When adding new property-based tests:

1. **Define the property**: What should always be true?
2. **Create generators**: Generate valid random inputs
3. **Write assertions**: Verify the property holds
4. **Tag the test**: Reference the design document property number
5. **Document requirements**: Link to requirements being validated

Example:

```typescript
/**
 * Feature: ai-model-optimization, Property 13: Competitor discovery returns 3-5 results
 * Validates: Requirements 8.1
 */
it("should return between 0 and 5 competitors", async () => {
  // Test implementation
});
```

## Model Override Testing

The `model-override.test.ts` file tests the runtime model configuration override capability. See the [Model Override Guide](../MODEL_OVERRIDE_GUIDE.md) for documentation on how to use this feature in your flows.
