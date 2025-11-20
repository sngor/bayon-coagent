# Citation Service

The Citation Service provides comprehensive citation management for the Kiro AI Assistant, ensuring all factual statements are properly sourced and cited with validated URLs.

## Features

- **URL Validation**: Validates citation URLs with HTTP HEAD/GET requests
- **Timeout Handling**: Configurable timeouts with graceful fallback for unvalidated URLs
- **Citation Formatting**: Formats citations as hyperlinks with source type labels
- **Citation Extraction**: Extracts citations from AI-generated markdown text
- **DynamoDB Storage**: Stores and tracks citations with conversation/workflow context
- **Batch Operations**: Validates multiple URLs in parallel
- **Citation Numbering**: Automatically numbers citations for easy reference

## Requirements Coverage

This implementation satisfies the following requirements from the Kiro AI Assistant specification:

- **Requirement 10.1**: Citations formatted as hyperlinks with descriptive text
- **Requirement 10.2**: URL validation before including in responses
- **Requirement 10.3**: Fallback notation for unvalidated URLs
- **Requirement 10.4**: Citation numbering/labeling for multiple sources
- **Requirement 10.5**: Source type inclusion (MLS, market report, data API, web)

## Usage

### Basic Citation Creation

```typescript
import { CitationService } from "@/aws/bedrock";

const service = new CitationService();

// Create a citation
const citation = await service.addCitation(
  "The median home price increased by 8.2%",
  {
    url: "https://example.com/market-report",
    title: "Austin Q4 2024 Housing Report",
    sourceType: "market-report",
  }
);

console.log(citation.validated); // true if URL is accessible
```

### Extracting Citations from AI Responses

```typescript
const aiResponse = `
  According to [Market Report](https://example.com/report),
  prices increased by 8.2%. See also [MLS data](https://mls.example.com/data).
`;

const citations = await service.extractCitations(aiResponse);
// Returns array of Citation objects
```

### Formatting with Numbered Citations

```typescript
const response = "Market analysis shows positive trends.";
const citations = [
  /* array of Citation objects */
];

const formatted = service.formatWithNumberedCitations(response, citations);
// Output:
// Market analysis shows positive trends.
//
// **Sources:**
// [1] Market Report: [Austin Q4 2024](https://example.com/report)
// [2] MLS Listing: [Property #12345](https://mls.example.com/listing) (accessibility not verified)
```

### Storing Citations in DynamoDB

```typescript
import { CitationService } from "@/aws/bedrock";

const service = new CitationService();
const userId = "user123";
const conversationId = "conv456";

// Store citations
await service.storeCitations(userId, citations, conversationId);

// Retrieve citations for a conversation
const stored = await service.getCitationsForConversation(
  userId,
  conversationId
);
```

### Handling Unvalidated URLs

```typescript
// Create citation with fallback for unvalidated URLs
const citation = await service.createCitationWithFallback(
  "https://example.com/report",
  "Market Report",
  "market-report",
  2000 // 2 second timeout
);

// If validation fails or times out, citation.validated will be false
// Formatted output will include "(accessibility not verified)" notation
```

### Batch URL Validation

```typescript
const urls = [
  "https://example.com/report1",
  "https://example.com/report2",
  "https://example.com/report3",
];

const results = await service.validateURLsBatch(urls, 5000);
// Returns Map<string, boolean> with validation results
```

## API Reference

### CitationService

#### Methods

##### `addCitation(text: string, source: Omit<Citation, 'id' | 'accessedAt' | 'validated'>): Promise<Citation>`

Creates a new citation with URL validation.

##### `validateURL(url: string, options?: ValidationOptions): Promise<boolean>`

Validates that a URL is accessible. Returns `false` on timeout or error.

**Options:**

- `timeoutMs`: Timeout in milliseconds (default: 5000)
- `followRedirects`: Whether to follow redirects (default: false)

##### `formatCitations(text: string, citations: Citation[]): Promise<string>`

Formats text with inline citation links.

##### `extractCitations(text: string): Promise<Citation[]>`

Extracts citations from markdown-style links in text.

##### `labelCitations(citations: Citation[]): Array<Citation & { label: string }>`

Adds numbered labels to citations (e.g., [1], [2], [3]).

##### `formatWithNumberedCitations(text: string, citations: Citation[]): string`

Formats text with a numbered sources section at the end.

##### `storeCitations(userId: string, citations: Citation[], conversationId?: string, workflowId?: string): Promise<CitationRecord[]>`

Stores citations in DynamoDB with conversation/workflow context.

##### `getCitationsForConversation(userId: string, conversationId: string): Promise<CitationRecord[]>`

Retrieves all citations for a specific conversation.

##### `getCitationStats(userId: string): Promise<CitationStats>`

Gets citation statistics for a user (total, by source type, validated/unvalidated).

##### `createCitationWithFallback(url: string, title: string, sourceType: CitationSourceType, timeoutMs?: number): Promise<Citation>`

Creates a citation with graceful fallback if URL validation fails.

##### `validateURLsBatch(urls: string[], timeoutMs?: number): Promise<Map<string, boolean>>`

Validates multiple URLs in parallel.

### Types

#### `Citation`

```typescript
interface Citation {
  id: string;
  url: string;
  title: string;
  sourceType: CitationSourceType;
  accessedAt: string;
  validated: boolean;
}
```

#### `CitationSourceType`

```typescript
type CitationSourceType = "mls" | "market-report" | "data-api" | "web";
```

#### `CitationRecord`

```typescript
interface CitationRecord extends Citation {
  userId: string;
  usedInConversation?: string;
  usedInWorkflow?: string;
  createdAt: string;
  updatedAt: string;
}
```

## DynamoDB Schema

Citations are stored in DynamoDB with the following key pattern:

- **PK**: `USER#<userId>`
- **SK**: `CITATION#<citationId>`
- **EntityType**: `Citation`

## Error Handling

The Citation Service implements graceful error handling:

1. **URL Validation Failures**: Returns `false` instead of throwing errors
2. **Timeouts**: Configurable timeouts with automatic fallback
3. **Invalid URLs**: Detected and marked as unvalidated
4. **Network Errors**: Logged but don't prevent citation creation

## Testing

Run the test suite:

```bash
npm test -- src/aws/bedrock/__tests__/citation-service.test.ts
```

See `citation-service-example.ts` for complete usage examples.

## Integration with AI Flows

The Citation Service integrates with Bedrock AI flows:

```typescript
import { CitationService } from "@/aws/bedrock";

// In your AI flow
const service = new CitationService();

// After generating AI response
const citations = await service.extractAndStoreCitations(
  userId,
  aiResponse,
  conversationId
);

// Format response with citations
const formattedResponse = service.formatWithNumberedCitations(
  aiResponse,
  citations
);
```

## Best Practices

1. **Always validate URLs** before including in responses
2. **Use appropriate timeouts** (5000ms default is reasonable)
3. **Store citations** for conversation history and audit trails
4. **Include source types** to help users understand citation context
5. **Handle validation failures gracefully** with fallback notation
6. **Batch validate URLs** when processing multiple citations

## Future Enhancements

- Citation deduplication across conversations
- Citation quality scoring
- Automatic source type detection improvements
- Citation expiration tracking
- Citation update notifications
