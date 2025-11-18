# Bedrock Documentation Index

Complete documentation for AWS Bedrock integration and model configuration.

## Getting Started

New to Bedrock flows? Start here:

1. **[README](./README.md)** - Overview and basic usage
2. **[Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md)** - Fast model selection guide
3. **[Flow Examples](./flows/)** - See working implementations

## Core Documentation

### Environment Configuration

**[Environment Configuration Guide](./ENVIRONMENT_CONFIGURATION.md)** - Environment setup covering:

- Required environment variables (BEDROCK_MODEL_ID, BEDROCK_REGION)
- Valid model IDs and validation
- Model configuration presets
- How model selection works (flow-level, runtime override, default fallback)
- Cost optimization strategies
- Troubleshooting configuration errors
- Best practices for production deployment

**When to read**: Before deploying to any environment, or when setting up local development.

### Model Configuration

**[Model Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md)** - Comprehensive guide covering:

- Available models and their characteristics
- Configuration presets (SIMPLE, BALANCED, CREATIVE, etc.)
- Model selection by feature type
- Step-by-step guide for adding new flows
- Performance and cost considerations
- Troubleshooting common issues
- Best practices and anti-patterns

**When to read**: Before implementing any new AI flow, or when optimizing existing flows.

### Quick Reference

**[Model Selection Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md)** - Quick decision tree including:

- Decision tree for model selection
- Configuration presets cheat sheet
- Common patterns and examples
- Temperature and token limit guides
- Cost comparison tables
- Common mistakes to avoid

**When to read**: When you need a quick answer about which model/config to use.

### Runtime Overrides

**[Model Override Guide](./MODEL_OVERRIDE_GUIDE.md)** - Runtime configuration covering:

- How to override model configurations at runtime
- Testing with different models
- A/B testing configurations
- Configuration precedence rules
- Troubleshooting override issues

**When to read**: When testing flows, experimenting with models, or debugging configuration issues.

### Testing & Benchmarking

**[Benchmarking Guide](./BENCHMARKING_GUIDE.md)** - Testing and measurement including:

- Setting up performance benchmarks
- Measuring latency and throughput
- Quality assessment methods
- Cost analysis and projections
- A/B testing frameworks
- Automated testing in CI/CD
- Interpreting benchmark results

**When to read**: When validating model selection, optimizing performance, or making data-driven decisions.

## Implementation Guides

### Flow Base

**[flow-base.ts](./flow-base.ts)** - Core utilities:

- `definePrompt()` - Create prompt-based flows
- `defineFlow()` - Create custom flows
- `BEDROCK_MODELS` - Model ID constants
- `MODEL_CONFIGS` - Configuration presets
- `mergeFlowOptions()` - Configuration merging

**When to read**: When implementing new flows or understanding the flow system.

### Bedrock Client

**[client.ts](./client.ts)** - Low-level client:

- `invoke()` - Synchronous AI calls
- `invokeStream()` - Streaming responses
- Error handling and retry logic
- Token usage tracking

**When to read**: When you need low-level control or are debugging client issues.

### Execution Logger

**[execution-logger.ts](./execution-logger.ts)** - Performance monitoring:

- Automatic execution logging
- Token usage tracking
- Performance metrics
- CloudWatch integration

**When to read**: When monitoring performance or analyzing costs.

## Flow Examples

### Content Generation

- **[generate-agent-bio.ts](./flows/generate-agent-bio.ts)** - Simple, fast bio generation (Haiku)
- **[generate-blog-post.ts](./flows/generate-blog-post.ts)** - Long-form content (Sonnet 3.5, 8K tokens)
- **[generate-social-media-post.ts](./flows/generate-social-media-post.ts)** - Creative short content (Haiku)
- **[listing-description-generator.ts](./flows/listing-description-generator.ts)** - Persuasive descriptions (Haiku)
- **[generate-video-script.ts](./flows/generate-video-script.ts)** - Structured creative content (Sonnet 3.5)
- **[generate-neighborhood-guides.ts](./flows/generate-neighborhood-guides.ts)** - Comprehensive guides (Sonnet 3.5)

### Analysis & Data Extraction

- **[run-nap-audit.ts](./flows/run-nap-audit.ts)** - NAP consistency audit (Sonnet 3.5, analytical)
- **[find-competitors.ts](./flows/find-competitors.ts)** - Competitor discovery (Sonnet 3.5, analytical)
- **[get-keyword-rankings.ts](./flows/get-keyword-rankings.ts)** - Keyword ranking extraction (Sonnet 3.5)
- **[analyze-review-sentiment.ts](./flows/analyze-review-sentiment.ts)** - Simple sentiment (Haiku)
- **[analyze-multiple-reviews.ts](./flows/analyze-multiple-reviews.ts)** - Pattern recognition (Sonnet 3.5)

### Strategic Features

- **[generate-marketing-plan.ts](./flows/generate-marketing-plan.ts)** - Strategic planning (Sonnet 3.5)
- **[run-research-agent.ts](./flows/run-research-agent.ts)** - Deep research (Sonnet 3.5, 8K tokens)

## Testing Documentation

### Property-Based Tests

**[**tests**/README.md](./**tests**/README.md)** - Test documentation:

- Property-based testing approach
- Test organization
- Running tests
- Writing new tests

### Test Examples

- **[model-configuration.test.ts](./flows/model-configuration.test.ts)** - Configuration validation
- **[model-override.test.ts](./__tests__/model-override.test.ts)** - Override behavior
- **[execution-logging.test.ts](./__tests__/execution-logging.test.ts)** - Logging validation
- **[nap-comparison.test.ts](./__tests__/nap-comparison.test.ts)** - NAP comparison logic
- **[competitor-discovery.test.ts](./__tests__/competitor-discovery.test.ts)** - Competitor discovery

## Common Workflows

### Adding a New Flow

1. Read: [Model Configuration Guide - Adding New Flows](./MODEL_CONFIGURATION_GUIDE.md#adding-new-flows)
2. Choose configuration from [Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md)
3. Implement using [flow-base.ts](./flow-base.ts) utilities
4. Add tests following [Test README](./__tests__/README.md)
5. Document configuration rationale in code comments

### Optimizing an Existing Flow

1. Benchmark current performance: [Benchmarking Guide](./BENCHMARKING_GUIDE.md)
2. Identify bottlenecks (latency, cost, quality)
3. Test alternatives: [Model Override Guide](./MODEL_OVERRIDE_GUIDE.md)
4. Compare results and make data-driven decision
5. Update configuration and document changes

### Debugging Configuration Issues

1. Check effective configuration: `mergeFlowOptions()`
2. Review [Troubleshooting](./MODEL_CONFIGURATION_GUIDE.md#troubleshooting)
3. Test with overrides: [Override Guide](./MODEL_OVERRIDE_GUIDE.md)
4. Check execution logs: [execution-logger.ts](./execution-logger.ts)
5. Compare with working examples: [flows/](./flows/)

### Cost Optimization

1. Identify high-cost features: [Benchmarking Guide - Cost Analysis](./BENCHMARKING_GUIDE.md#cost-analysis)
2. Review model selection: [Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md#model-selection-by-feature)
3. Consider Haiku for simple tasks: [Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md)
4. Optimize token limits and temperature
5. Implement caching for repeated requests

## Quick Links

### By Role

**Product Manager**:

- [Model Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md) - Understand capabilities and costs
- [Benchmarking Guide](./BENCHMARKING_GUIDE.md) - Performance and quality metrics

**Developer**:

- [Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md) - Fast answers
- [flow-base.ts](./flow-base.ts) - Implementation utilities
- [Flow Examples](./flows/) - Working code

**QA Engineer**:

- [Benchmarking Guide](./BENCHMARKING_GUIDE.md) - Testing methodology
- [Test README](./__tests__/README.md) - Test organization
- [Property-Based Tests](./__tests__/) - Test examples

**DevOps**:

- [Environment Configuration](./ENVIRONMENT_CONFIGURATION.md) - Environment setup
- [Execution Logger](./execution-logger.ts) - Monitoring
- [Benchmarking Guide - CI/CD](./BENCHMARKING_GUIDE.md#automated-testing) - Automated testing
- [Cost Analysis](./BENCHMARKING_GUIDE.md#cost-analysis) - Cost tracking

### By Task

**Implementing a new feature**:

1. [Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md) - Choose configuration
2. [Flow Examples](./flows/) - See similar implementations
3. [flow-base.ts](./flow-base.ts) - Use utilities

**Fixing a bug**:

1. [Troubleshooting](./MODEL_CONFIGURATION_GUIDE.md#troubleshooting) - Common issues
2. [Override Guide](./MODEL_OVERRIDE_GUIDE.md) - Test alternatives
3. [Test Examples](./__tests__/) - Validation

**Optimizing performance**:

1. [Benchmarking Guide](./BENCHMARKING_GUIDE.md) - Measure current state
2. [Configuration Guide](./MODEL_CONFIGURATION_GUIDE.md) - Optimization strategies
3. [Quick Reference](./MODEL_SELECTION_QUICK_REFERENCE.md) - Alternative configs

**Reducing costs**:

1. [Cost Analysis](./BENCHMARKING_GUIDE.md#cost-analysis) - Calculate costs
2. [Configuration Guide - Cost Optimization](./MODEL_CONFIGURATION_GUIDE.md#cost-optimization) - Strategies
3. [Quick Reference - Cost Comparison](./MODEL_SELECTION_QUICK_REFERENCE.md) - Model costs

## External Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude Model Documentation](https://docs.anthropic.com/claude/docs)
- [Anthropic Model Pricing](https://www.anthropic.com/pricing)
- [AWS Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)

## Changelog

### November 2024 - Initial Documentation Release

**Added**:

- Comprehensive model configuration guide
- Quick reference for fast decisions
- Benchmarking and testing guide
- Runtime override documentation
- Documentation index (this file)

**Documented**:

- 20+ AI flows with configuration rationale
- 6 configuration presets
- 5 Claude models
- Performance benchmarking methodology
- Cost optimization strategies

## Contributing

When adding new flows or updating configurations:

1. Document model selection rationale in code comments
2. Update relevant guides if introducing new patterns
3. Add property-based tests for new configurations
4. Update this index if adding new documentation files
5. Include benchmarking results for significant changes

## Support

For questions or issues:

1. Check [Troubleshooting](./MODEL_CONFIGURATION_GUIDE.md#troubleshooting)
2. Review [Test Examples](./__tests__/) for similar cases
3. Consult [Flow Examples](./flows/) for working implementations
4. Check execution logs in CloudWatch
5. Contact the engineering team

---

**Last Updated**: November 2024
**Maintained By**: Co-agent Marketer Engineering Team
