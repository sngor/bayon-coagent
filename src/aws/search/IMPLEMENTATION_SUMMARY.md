# Web Search Implementation Summary

## Overview

This document summarizes the implementation of web search functionality to replace Google Search tool that was available in Genkit. The implementation provides a flexible search client that supports multiple providers (Tavily and Serper) and integrates seamlessly with Bedrock AI flows.

## What Was Implemented

### 1. Search Client Module (`src/aws/search/client.ts`)

A comprehensive search client that:

- Supports multiple providers (Tavily and Serper)
- Provides unified interface for web search
- Handles API authentication and error handling
- Formats results for AI consumption
- Extracts citations from search results

**Key Features:**

- Provider abstraction (easy to switch between Tavily/Serper)
- Configurable search options (depth, max results, domain filtering)
- AI-optimized result formatting
- Automatic fallback on errors
- Singleton pattern for efficient resource usage

### 2. Integration with Bedrock Flows

Updated three key flows to use web search:

#### a. NAP Audit Flow (`src/aws/bedrock/flows/run-nap-audit.ts`)

- Searches for agent profiles across multiple platforms
- Extracts NAP information from search results
- Compares found information with official data
- Falls back to AI knowledge if search fails

#### b. Find Competitors Flow (`src/aws/bedrock/flows/find-competitors.ts`)

- Searches for competitor agents in the market
- Enriches competitor data with metrics from search results
- Provides realistic estimates based on found data
- Graceful degradation when search unavailable

#### c. Keyword Rankings Flow (`src/aws/bedrock/flows/get-keyword-rankings.ts`)

- Performs localized searches for keywords
- Identifies agents ranking in search results
- Extracts ranking positions and agent details
- Falls back to estimates if search fails

### 3. Documentation

Created comprehensive documentation:

- **README.md**: Setup guide, usage examples, API reference
- **IMPLEMENTATION_SUMMARY.md**: This document

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Bedrock AI Flows                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  NAP Audit  │  Find Competitors  │  Keyword Rankings   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Search Client                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  • Provider abstraction                                 │ │
│  │  • Result formatting                                    │ │
│  │  • Citation extraction                                  │ │
│  │  • Error handling                                       │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                ▼                       ▼
        ┌──────────────┐        ┌──────────────┐
        │    Tavily    │        │    Serper    │
        │     API      │        │     API      │
        └──────────────┘        └──────────────┘
```

## Key Design Decisions

### 1. Provider Selection: Tavily as Default

**Rationale:**

- Optimized for AI applications
- Provides clean, structured results
- Includes AI-generated answers
- Better for real estate use cases

**Alternative:** Serper is available for users who prefer Google Search results.

### 2. Graceful Degradation

All flows implement fallback behavior:

- If search API fails → Use AI knowledge
- If API key missing → Clear error message
- If results empty → Return empty array, not error

**Rationale:** Ensures flows continue working even without search API access.

### 3. Search Context Injection

Search results are formatted and injected into prompts as context:

```typescript
const searchContext = searchClient.formatResultsForAI(results, true);
const prompt = `${systemPrompt}\n\nSearch Results:\n${searchContext}\n\n${userQuery}`;
```

**Rationale:**

- Maintains separation of concerns
- AI can reason about search results
- Easy to debug and modify

### 4. Singleton Pattern

Search client uses singleton pattern:

```typescript
let searchClientInstance: SearchClient | null = null;

export function getSearchClient(provider, apiKey?) {
  if (!searchClientInstance || apiKey) {
    searchClientInstance = new SearchClient(provider, apiKey);
  }
  return searchClientInstance;
}
```

**Rationale:**

- Efficient resource usage
- Consistent configuration
- Easy to reset for testing

## Environment Configuration

### Required Environment Variables

```bash
# Choose one provider:

# Option 1: Tavily (recommended)
TAVILY_API_KEY=your_tavily_api_key

# Option 2: Serper
SERPER_API_KEY=your_serper_api_key
```

### Getting API Keys

1. **Tavily**: https://app.tavily.com/sign-up

   - Free tier: 1,000 searches/month
   - Paid: $0.001 per search

2. **Serper**: https://serper.dev/signup
   - Free tier: 2,500 searches
   - Paid: $50 for 10,000 searches

## Usage Examples

### Basic Search

```typescript
import { search } from "@/aws/search";

const results = await search("real estate agents San Francisco");
console.log(results.results); // Array of SearchResult
```

### Advanced Search

```typescript
import { getSearchClient } from "@/aws/search";

const client = getSearchClient("tavily");
const results = await client.search("NAP audit real estate", {
  maxResults: 10,
  searchDepth: "advanced",
  includeAnswer: true,
  includeDomains: ["zillow.com", "realtor.com"],
});
```

### In Bedrock Flows

```typescript
const searchClient = getSearchClient();
const searchResults = await searchClient.search(query, {
  maxResults: 5,
  searchDepth: "basic",
});

const context = searchClient.formatResultsForAI(searchResults.results);
const output = await bedrockPrompt({ ...input, searchContext: context });
```

## Testing

### Manual Testing

Test the search client:

```typescript
import { search } from "@/aws/search";

// Test basic search
const results = await search("test query");
console.log("Results:", results.results.length);

// Test with options
const advancedResults = await search("test query", {
  maxResults: 3,
  includeAnswer: true,
});
console.log("Answer:", advancedResults.answer);
```

### Testing Flows

Test updated flows:

```typescript
import { runNapAudit } from "@/aws/bedrock/flows";

const result = await runNapAudit({
  name: "John Doe",
  address: "123 Main St, San Francisco, CA",
  phone: "555-1234",
  agencyName: "Test Realty",
  website: "https://example.com",
});

console.log("NAP Audit Results:", result.results);
```

## Migration from Genkit

### Before (Genkit with Google Search)

```typescript
const model = googleAI.model("gemini-2.5-flash", {
  tools: [googleAIPlugin.googleSearch],
});

const prompt = ai.definePrompt({
  model,
  prompt: "Search for real estate agents...",
});
```

### After (Bedrock with Search Client)

```typescript
import { getSearchClient } from "@/aws/search";

const searchClient = getSearchClient();
const results = await searchClient.search("real estate agents");
const context = searchClient.formatResultsForAI(results.results);

const prompt = definePrompt({
  prompt: `Search Results:\n${context}\n\nAnalyze...`,
});
```

## Performance Considerations

### API Costs

- **Tavily**: ~$0.001 per search
- **Serper**: ~$0.005 per search

**Recommendation:** Use caching for repeated queries.

### Latency

- Search API calls add 500-2000ms latency
- Consider async/parallel searches when possible
- Implement timeouts for production use

### Rate Limits

- **Tavily**: 100 requests/minute
- **Serper**: 60 requests/minute

**Recommendation:** Implement rate limiting in production.

## Error Handling

All flows implement comprehensive error handling:

```typescript
try {
  const results = await searchClient.search(query);
  // Use results
} catch (error) {
  if (error instanceof SearchError) {
    console.error("Search failed:", error.message);
    // Fall back to AI knowledge
  }
}
```

## Future Enhancements

### Potential Improvements

1. **Caching Layer**

   - Cache search results to reduce API costs
   - Implement TTL-based invalidation
   - Use Redis or in-memory cache

2. **Rate Limiting**

   - Implement request throttling
   - Queue system for high-volume usage
   - Per-user rate limits

3. **Result Ranking**

   - Custom relevance scoring
   - Domain authority weighting
   - Recency boosting

4. **Additional Providers**

   - Bing Search API
   - DuckDuckGo API
   - Custom search engines

5. **Search Analytics**
   - Track search queries
   - Monitor API usage
   - Analyze result quality

## Troubleshooting

### Common Issues

1. **"Missing API key" Error**

   - Solution: Set `TAVILY_API_KEY` or `SERPER_API_KEY` in `.env.local`

2. **Rate Limit Errors**

   - Solution: Implement caching or upgrade API plan

3. **Poor Search Quality**

   - Solution: Use `searchDepth: 'advanced'` or refine queries

4. **Timeout Errors**
   - Solution: Increase timeout or implement retry logic

## Validation

### Requirements Validation

✅ **Requirement 3.3**: Web search alternative implemented

- Tavily and Serper APIs integrated
- Search client module created
- Flows updated to use search

✅ **Requirement 3.4**: Search result formatting and citation extraction

- `formatResultsForAI()` method implemented
- `extractCitations()` method implemented
- Clean, structured output for AI consumption

### Flow Updates

✅ **NAP Audit Flow**: Uses web search to find agent profiles
✅ **Find Competitors Flow**: Uses web search to identify competitors
✅ **Keyword Rankings Flow**: Uses web search to determine rankings

## Conclusion

The web search implementation successfully replaces Google Search functionality from Genkit with a flexible, provider-agnostic solution. The implementation:

- Supports multiple search providers
- Integrates seamlessly with Bedrock flows
- Provides graceful degradation
- Includes comprehensive documentation
- Maintains backward compatibility

All flows that previously relied on Google Search now use the new search client and continue to function correctly.
