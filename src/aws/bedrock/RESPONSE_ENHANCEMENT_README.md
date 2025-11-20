# Response Enhancement Service

## Overview

The Response Enhancement Service is a post-processing layer for AI-generated responses that ensures quality, safety, and compliance with requirements. It provides three main capabilities:

1. **Qualifying Language Injection** - Adds appropriate disclaimers to predictions and forecasts
2. **Factual Grounding Verification** - Ensures facts are sourced from provided data
3. **Citation Enforcement** - Validates that all factual statements have proper citations

## Requirements

This service implements the following requirements from the Kiro AI Assistant specification:

- **Requirement 1.5**: Qualifying language for predictions
- **Requirement 2.1**: Factual grounding in provided data
- **Requirement 2.3**: Unsourced fact disclaimers
- **Requirement 2.4**: Multiple fact citation enforcement

## Usage

### Basic Usage

```typescript
import { ResponseEnhancementService } from "@/aws/bedrock";

const service = new ResponseEnhancementService();

const text = "The market will grow by 10%. Median prices increased by 5%.";
const citations = []; // Array of Citation objects
const providedData = ["Market report shows 5% increase"];

const result = await service.enhance(text, citations, providedData);

console.log(result.enhancedText);
console.log(result.modificationsApplied);
console.log(result.warnings);
```

### Configuration Options

```typescript
const service = new ResponseEnhancementService({
  enableQualifyingLanguage: true, // Add qualifying language to predictions
  enableFactualGrounding: true, // Verify facts against provided data
  enableCitationEnforcement: true, // Check for citation coverage
  strictMode: false, // Throw error for uncited facts
});
```

### Strict Mode

In strict mode, the service will throw an error if any facts lack citations:

```typescript
const strictService = new ResponseEnhancementService({ strictMode: true });

try {
  const result = await strictService.enhance(text, citations);
} catch (error) {
  console.error("Uncited facts detected:", error.message);
}
```

## Features

### 1. Qualifying Language Injection

Automatically detects prediction and forecast statements and adds appropriate qualifying language.

**Detected Patterns:**

- Future tense indicators: "will increase", "is going to", "expected to"
- Prediction keywords: "predict", "forecast", "project", "estimate"
- Market trend predictions: "market will", "prices will"
- Investment language: "return will", "investment will generate"

**Qualifying Phrases Added:**

- "historical trends suggest"
- "based on current data"
- "market indicators point to"
- "analysis suggests"
- "data indicates"
- "trends aim for"
- "projections suggest"
- "estimates indicate"

**Example:**

```typescript
// Input
"The market will increase by 10% next year.";

// Output
"The market analysis suggests, will increase by 10% next year.";
```

**Note:** Predictions that already have qualifying language are not modified.

### 2. Factual Grounding Verification

Extracts factual statements and verifies they are grounded in provided data or have citations.

**Detected Fact Patterns:**

- Specific numbers and statistics: "8.2% increase", "$500k"
- Market data: "sales increased by", "inventory reached"
- Comparative statements: "higher than last year"
- Definitive statements: "the highest", "ranked #1"

**Confidence Levels:**

- **High**: Specific percentages or dollar amounts
- **Medium**: Comparative statements with trends
- **Low**: General statements

**Unsourced Fact Handling:**

If a fact cannot be verified against provided data or citations, a disclaimer is added:

```typescript
// Input
"The median price increased by 8.2% last year.";

// Output (if no data provided)
"The median price increased by 8.2% last year (unverified projection based on general industry trends).";
```

**Grounding Logic:**

Facts are considered grounded if:

1. They have a citation (markdown link or parenthetical reference)
2. Key numbers and terms appear in the provided data

### 3. Citation Enforcement

Checks that all factual statements have proper citations and warns about uncited facts.

**Citation Detection:**

The service recognizes these citation formats:

- Markdown links: `[Source](https://example.com)`
- Parenthetical citations: `(MLS Report: Q4 2024)`
- Inline references: `(Source: Market Data)`

**Warning System:**

```typescript
const result = await service.enhance(text, citations);

// Check warnings
if (result.warnings.length > 0) {
  console.log("Issues detected:");
  result.warnings.forEach((warning) => console.log(`- ${warning}`));
}
```

**Example Warnings:**

- "3 facts lack source verification"
- "2 facts lack citations"

## Result Object

The `enhance()` method returns an `EnhancementResult` object:

```typescript
interface EnhancementResult {
  enhancedText: string; // Modified text with enhancements
  modificationsApplied: string[]; // List of modifications made
  warnings: string[]; // Issues detected
  facts: ExtractedFact[]; // All facts found
  predictions: PredictionStatement[]; // All predictions found
}
```

### ExtractedFact

```typescript
interface ExtractedFact {
  text: string; // The factual statement
  startIndex: number; // Position in original text
  endIndex: number; // End position in original text
  hasCitation: boolean; // Whether it has a citation
  citationId?: string; // ID of associated citation
  confidence: "high" | "medium" | "low"; // Confidence level
}
```

### PredictionStatement

```typescript
interface PredictionStatement {
  text: string; // The prediction statement
  startIndex: number; // Position in original text
  endIndex: number; // End position in original text
  hasQualifyingLanguage: boolean; // Whether it has qualifying language
  type: "prediction" | "forecast" | "projection" | "estimate";
}
```

## Integration with AI Flows

The Response Enhancement Service should be used as a post-processing step after AI generation:

```typescript
import { BedrockClient } from "@/aws/bedrock/client";
import { ResponseEnhancementService } from "@/aws/bedrock/response-enhancement";
import { CitationService } from "@/aws/bedrock/citation-service";

async function generateEnhancedResponse(
  prompt: string,
  providedData: string[]
) {
  // Step 1: Generate AI response
  const bedrock = getBedrockClient();
  const aiResponse = await bedrock.invoke({
    prompt,
    // ... other options
  });

  // Step 2: Extract citations
  const citationService = getCitationService();
  const citations = await citationService.extractCitations(aiResponse);

  // Step 3: Enhance response
  const enhancementService = new ResponseEnhancementService();
  const result = await enhancementService.enhance(
    aiResponse,
    citations,
    providedData
  );

  return result;
}
```

## Best Practices

### 1. Provide Context Data

Always provide relevant data sources to improve fact grounding:

```typescript
const providedData = [
  "MLS report shows 8.2% increase in median prices",
  "Q4 2024 market analysis indicates strong growth",
  "Austin market data from December 2024",
];

const result = await service.enhance(text, citations, providedData);
```

### 2. Handle Warnings

Check and log warnings to identify content quality issues:

```typescript
const result = await service.enhance(text, citations, providedData);

if (result.warnings.length > 0) {
  logger.warn("Response enhancement warnings:", {
    warnings: result.warnings,
    factsCount: result.facts.length,
    predictionsCount: result.predictions.length,
  });
}
```

### 3. Use Strict Mode for Critical Content

Enable strict mode for client-facing content that must have citations:

```typescript
const strictService = new ResponseEnhancementService({
  strictMode: true,
  enableCitationEnforcement: true,
});
```

### 4. Disable Features When Not Needed

Disable specific features for performance or when not required:

```typescript
// For internal analysis that doesn't need qualifying language
const service = new ResponseEnhancementService({
  enableQualifyingLanguage: false,
  enableFactualGrounding: true,
  enableCitationEnforcement: true,
});
```

## Performance Considerations

- **Text Length**: Processing time scales linearly with text length
- **Pattern Matching**: Uses regex patterns for detection (fast for typical responses)
- **Fact Extraction**: Extracts sentences containing factual patterns
- **Citation Validation**: Does not validate URLs (handled by CitationService)

**Typical Performance:**

- Short response (< 500 chars): < 10ms
- Medium response (500-2000 chars): 10-50ms
- Long response (> 2000 chars): 50-200ms

## Error Handling

The service handles errors gracefully:

```typescript
try {
  const result = await service.enhance(text, citations, providedData);
} catch (error) {
  if (error.message.includes("uncited facts")) {
    // Handle strict mode violation
    console.error("Citation enforcement failed:", error);
  } else {
    // Handle other errors
    console.error("Enhancement failed:", error);
  }
}
```

## Testing

The service includes comprehensive unit tests covering:

- Qualifying language injection for various prediction types
- Fact extraction and confidence assessment
- Factual grounding verification
- Citation detection and enforcement
- Edge cases and error conditions

Run tests:

```bash
npm test -- response-enhancement.test.ts
```

## Related Services

- **CitationService**: Validates URLs and formats citations
- **GuardrailsService**: Validates request scope and safety
- **EfficiencyOptimizer**: Formats responses for conciseness

## Future Enhancements

Potential improvements for future versions:

1. **ML-based Fact Detection**: Use NLP models for more accurate fact extraction
2. **Citation Quality Scoring**: Assess the quality and relevance of citations
3. **Custom Qualifying Phrases**: Allow user-defined qualifying language
4. **Fact Verification API**: Integrate with external fact-checking services
5. **Multi-language Support**: Extend pattern matching to other languages

## Support

For issues or questions about the Response Enhancement Service:

1. Check the test file for usage examples
2. Review the design document for requirements
3. Consult the main Bedrock documentation

## License

Part of the Bayon Coagent platform - Internal use only.
