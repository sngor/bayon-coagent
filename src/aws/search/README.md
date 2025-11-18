# Web Search Module

This module provides web search functionality to replace the Google Search tool that was available in Genkit. It supports multiple search API providers optimized for AI applications.

## Supported Providers

### Tavily (Recommended)

- **Best for**: AI applications requiring clean, structured search results
- **Features**: AI-optimized results, answer generation, follow-up questions
- **Pricing**: Free tier available, pay-as-you-go
- **Sign up**: https://tavily.com

### Serper

- **Best for**: Google Search API alternative
- **Features**: Organic results, answer boxes, images
- **Pricing**: Free tier available, pay-as-you-go
- **Sign up**: https://serper.dev

## Setup

### 1. Get an API Key

Choose a provider and sign up for an API key:

- **Tavily**: https://app.tavily.com/sign-up
- **Serper**: https://serper.dev/signup

### 2. Configure Environment Variables

Add your API key to `.env.local`:

```bash
# For Tavily (recommended)
TAVILY_API_KEY=your_tavily_api_key_here

# OR for Serper
SERPER_API_KEY=your_serper_api_key_here
```

## Usage

### Basic Search

```typescript
import { search } from "@/aws/search";

const results = await search("real estate agents in San Francisco");

console.log(results.results); // Array of search results
console.log(results.answer); // AI-generated answer (Tavily only)
```

### Advanced Search with Options

```typescript
import { getSearchClient } from "@/aws/search";

const client = getSearchClient("tavily");

const results = await client.search("real estate market trends", {
  maxResults: 10,
  searchDepth: "advanced",
  includeAnswer: true,
  includeImages: true,
  includeDomains: ["zillow.com", "realtor.com"],
  excludeDomains: ["spam-site.com"],
});
```

### Format Results for AI

```typescript
import { getSearchClient } from "@/aws/search";

const client = getSearchClient();
const results = await client.search("NAP consistency audit");

// Format for AI consumption
const formattedText = client.formatResultsForAI(results.results, true);

// Extract citations
const citations = client.extractCitations(results.results);
```

### Using with Bedrock Flows

```typescript
import { getSearchClient } from "@/aws/search";
import { getBedrockClient } from "@/aws/bedrock";

async function searchAndAnalyze(query: string) {
  // Perform search
  const searchClient = getSearchClient();
  const searchResults = await searchClient.search(query, {
    maxResults: 5,
    includeAnswer: true,
  });

  // Format for AI
  const context = searchClient.formatResultsForAI(searchResults.results);

  // Use with Bedrock
  const bedrockClient = getBedrockClient();
  const prompt = `Based on the following search results, provide an analysis:

${context}

Question: ${query}`;

  const response = await bedrockClient.invoke(prompt, outputSchema);
  return response;
}
```

## API Reference

### SearchClient

#### Constructor

```typescript
new SearchClient(provider?: 'tavily' | 'serper', apiKey?: string)
```

#### Methods

##### search(query, options?)

Performs a web search.

**Parameters:**

- `query` (string): The search query
- `options` (SearchOptions): Optional search configuration
  - `maxResults` (number): Maximum number of results (default: 5)
  - `searchDepth` ('basic' | 'advanced'): Search depth (Tavily only)
  - `includeAnswer` (boolean): Include AI-generated answer (Tavily only)
  - `includeImages` (boolean): Include image results
  - `includeDomains` (string[]): Limit search to specific domains
  - `excludeDomains` (string[]): Exclude specific domains

**Returns:** `Promise<SearchResponse>`

##### formatResultsForAI(results, includeCitations?)

Formats search results as text for AI consumption.

**Parameters:**

- `results` (SearchResult[]): Search results to format
- `includeCitations` (boolean): Whether to include source URLs (default: true)

**Returns:** `string`

##### extractCitations(results)

Extracts citation strings from search results.

**Parameters:**

- `results` (SearchResult[]): Search results

**Returns:** `string[]`

### Types

#### SearchResult

```typescript
interface SearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  publishedDate?: string;
}
```

#### SearchResponse

```typescript
interface SearchResponse {
  query: string;
  results: SearchResult[];
  answer?: string;
  images?: string[];
  followUpQuestions?: string[];
}
```

## Error Handling

```typescript
import { search, SearchError } from "@/aws/search";

try {
  const results = await search("my query");
} catch (error) {
  if (error instanceof SearchError) {
    console.error("Search failed:", error.message);
    console.error("Status code:", error.statusCode);
  }
}
```

## Migration from Google Search

If you're migrating from Genkit's Google Search tool:

**Before (Genkit):**

```typescript
const model = googleAI.model("gemini-2.5-flash", {
  tools: [googleAIPlugin.googleSearch],
});

// Search happens automatically in the prompt
```

**After (Bedrock + Search Client):**

```typescript
import { getSearchClient } from "@/aws/search";

// Explicitly perform search
const searchClient = getSearchClient();
const results = await searchClient.search(query);

// Format and include in prompt
const context = searchClient.formatResultsForAI(results.results);
const prompt = `${systemPrompt}\n\nSearch Results:\n${context}\n\nUser Query: ${userQuery}`;
```

## Local Development

For local development without API keys, you can mock the search client:

```typescript
// Mock implementation for testing
class MockSearchClient extends SearchClient {
  async search(query: string): Promise<SearchResponse> {
    return {
      query,
      results: [
        {
          title: "Mock Result",
          url: "https://example.com",
          content: "This is a mock search result for testing.",
        },
      ],
    };
  }
}
```

## Best Practices

1. **Cache Results**: Search API calls cost money. Cache results when possible.
2. **Rate Limiting**: Implement rate limiting to avoid hitting API limits.
3. **Error Handling**: Always handle search errors gracefully.
4. **Result Filtering**: Use `includeDomains` and `excludeDomains` to improve result quality.
5. **Context Length**: Be mindful of token limits when including search results in AI prompts.

## Troubleshooting

### "Missing API key" Error

Make sure you've set the appropriate environment variable:

- `TAVILY_API_KEY` for Tavily
- `SERPER_API_KEY` for Serper

### Rate Limit Errors

If you hit rate limits:

1. Implement caching
2. Reduce `maxResults`
3. Upgrade your API plan

### Poor Search Quality

Try these options:

1. Use `searchDepth: 'advanced'` (Tavily)
2. Use `includeDomains` to focus on specific sites
3. Refine your search query
4. Increase `maxResults` to get more options

## Examples

See the updated Bedrock flows for real-world examples:

- `src/aws/bedrock/flows/find-competitors.ts`
- `src/aws/bedrock/flows/run-nap-audit.ts`
- `src/aws/bedrock/flows/get-keyword-rankings.ts`
