# Bedrock AI Flows

This directory contains AI flows migrated from Genkit to AWS Bedrock. Each flow maintains the same interface as the original Genkit version for backward compatibility.

## Migration Status

### ✅ Fully Migrated Flows

The following flows have been successfully migrated to Bedrock:

1. **generate-agent-bio** - Generates professional real estate agent biographies
2. **run-nap-audit** - Performs NAP (Name, Address, Phone) consistency audits
3. **generate-blog-post** - Creates SEO-friendly blog posts for real estate topics
4. **generate-market-update** - Generates market updates for specific locations
5. **generate-social-media-post** - Creates platform-specific social media content
6. **generate-video-script** - Generates 60-second video scripts
7. **generate-listing-faqs** - Creates FAQ sections for property listings
8. **generate-neighborhood-guides** - Produces comprehensive neighborhood guides
9. **generate-marketing-plan** - Creates personalized 3-step marketing plans
10. **run-research-agent** - Conducts deep research on topics with citations
11. **analyze-multiple-reviews** - Analyzes sentiment across multiple reviews
12. **analyze-review-sentiment** - Analyzes sentiment of individual reviews
13. **find-competitors** - Identifies and enriches competitor data
14. **get-keyword-rankings** - Estimates local keyword rankings
15. **get-real-estate-news** - Fetches news from NewsAPI (no AI)
16. **get-zillow-reviews** - Fetches reviews from Bridge API (no AI)
17. **exchange-google-token** - Handles OAuth token exchange (no AI)
18. **generate-header-image** - Returns placeholder images (no AI)
19. **listing-description-generator** - Generates property listing descriptions

### 🚧 Pending Migration

The following flows require additional infrastructure or dependencies:

- **client-management-flow** - Needs DynamoDB client repository
- **client-qa-flow** - Requires tool integration and multi-step interactions
- **cma-report-flow** - Needs property search and analysis tools
- **comparable-properties-flow** - Requires property database integration
- **equity-review-flow** - Simple flow, low priority
- **insurance-checkup-flow** - Simple flow, low priority
- **investment-opportunity-identification** - Needs property search
- **life-event-predictor-flow** - Requires client database
- **mortgage-calculator-flow** - Pure calculation, no AI needed
- **persona-driven-listing-descriptions** - Similar to existing flow
- **image-enhancement-flow** - Needs image generation service
- **generate-training-plan-flow** - Can be added if needed

## Key Differences from Genkit

### 1. No Built-in Web Search

Genkit flows used Google Search tool for live web data. Bedrock flows simulate this functionality. For production use, integrate with:

- Tavily Search API
- Serper API
- Bedrock Agents with web search capability

### 2. No Image Generation

Genkit used Imagen for image generation. Bedrock flows return placeholders. For production use, integrate with:

- Amazon Titan Image Generator
- Stable Diffusion on Bedrock
- External image generation services

### 3. Simplified Tool System

Genkit's tool system is replaced with direct function calls. Complex multi-tool flows may need refactoring.

### 4. Schema Validation

All schemas now use standard `zod` instead of `genkit`'s z export. Validation happens at the flow level.

## Usage Example

```typescript
import { generateAgentBio } from "@/aws/bedrock/flows";

const result = await generateAgentBio({
  name: "John Doe",
  experience: "10 years",
  certifications: "CRS, GRI",
  agencyName: "Premier Realty",
});

console.log(result.bio);
```

## Architecture

### Flow Base (`flow-base.ts`)

Provides core utilities:

- `defineFlow()` - Creates a flow with input/output validation
- `definePrompt()` - Creates a prompt-based flow with template substitution
- `invokeStream()` - Helper for streaming responses

### Bedrock Client (`client.ts`)

Handles all Bedrock API interactions:

- Model invocation with retry logic
- Response parsing and validation
- Streaming support
- Error handling

## Configuration

Flows use the centralized AWS configuration from `src/aws/config.ts`. Key settings:

- **Model**: `anthropic.claude-3-5-sonnet-20241022-v2:0` (default)
- **Region**: Configured via environment variables
- **Endpoint**: Supports LocalStack for local development

## Testing

Each flow should be tested with:

1. Valid inputs
2. Invalid inputs (schema validation)
3. Edge cases
4. Error conditions

## Future Enhancements

1. **Web Search Integration** - Add real-time web search capability
2. **Image Generation** - Integrate with Titan Image Generator
3. **Tool System** - Implement Bedrock Agents for complex tool use
4. **Streaming UI** - Add streaming support for long-form content
5. **Caching** - Implement response caching for frequently used prompts
6. **Rate Limiting** - Add request throttling and queuing
7. **Monitoring** - Integrate with CloudWatch for metrics and logging

## Migration Notes

### Schema Updates

All schema files in `src/ai/schemas/` have been updated to use `zod` instead of `genkit`:

```typescript
// Before
import { z } from "genkit";

// After
import { z } from "zod";
```

### Prompt Templates

Template variables use triple braces `{{{variable}}}` for consistency with Genkit:

```typescript
prompt: `Agent Name: {{{name}}}`;
```

### Error Handling

Flows throw descriptive errors that can be caught and handled by the application:

```typescript
try {
  const result = await generateAgentBio(input);
} catch (error) {
  if (error instanceof BedrockError) {
    // Handle Bedrock-specific errors
  }
}
```

## Contributing

When adding new flows:

1. Create the flow file in this directory
2. Export it from `index.ts`
3. Update this README
4. Add tests
5. Update the task list in `.kiro/specs/aws-migration/tasks.md`
