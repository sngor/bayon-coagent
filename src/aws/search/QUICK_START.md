# Web Search Quick Start Guide

Get up and running with web search in 5 minutes.

## Step 1: Choose a Provider

We recommend **Tavily** for AI applications:

- Sign up: https://app.tavily.com/sign-up
- Get your API key from the dashboard

Alternative: **Serper** (Google Search API)

- Sign up: https://serper.dev/signup
- Get your API key from the dashboard

## Step 2: Configure Environment

Add your API key to `.env.local`:

```bash
# For Tavily (recommended)
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx

# OR for Serper
SERPER_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Use in Your Code

### Simple Search

```typescript
import { search } from "@/aws/search";

const results = await search("real estate agents in San Francisco");

console.log(results.results);
// [
//   {
//     title: "Top Real Estate Agents in San Francisco",
//     url: "https://example.com",
//     content: "...",
//   },
//   ...
// ]
```

### Advanced Search

```typescript
import { getSearchClient } from "@/aws/search";

const client = getSearchClient("tavily");

const results = await client.search("real estate market trends", {
  maxResults: 10,
  searchDepth: "advanced",
  includeAnswer: true,
  includeDomains: ["zillow.com", "realtor.com"],
});

console.log(results.answer); // AI-generated answer
console.log(results.results); // Search results
```

### Use with Bedrock AI

```typescript
import { getSearchClient } from "@/aws/search";
import { getBedrockClient } from "@/aws/bedrock";
import { z } from "zod";

async function searchAndAnalyze(query: string) {
  // 1. Search the web
  const searchClient = getSearchClient();
  const searchResults = await searchClient.search(query, {
    maxResults: 5,
  });

  // 2. Format for AI
  const context = searchClient.formatResultsForAI(searchResults.results);

  // 3. Analyze with Bedrock
  const bedrockClient = getBedrockClient();
  const prompt = `Based on these search results, provide an analysis:

${context}

Question: ${query}`;

  const outputSchema = z.object({
    summary: z.string(),
    keyPoints: z.array(z.string()),
  });

  const response = await bedrockClient.invoke(prompt, outputSchema);
  return response;
}

// Use it
const analysis = await searchAndAnalyze(
  "What are the top real estate trends in 2024?"
);
console.log(analysis.summary);
console.log(analysis.keyPoints);
```

## Step 4: Test It

Create a test file `test-search.ts`:

```typescript
import { search } from "@/aws/search";

async function testSearch() {
  try {
    const results = await search("real estate agents San Francisco", {
      maxResults: 3,
    });

    console.log("✅ Search successful!");
    console.log(`Found ${results.results.length} results`);

    results.results.forEach((result, i) => {
      console.log(`\n${i + 1}. ${result.title}`);
      console.log(`   ${result.url}`);
      console.log(`   ${result.content.substring(0, 100)}...`);
    });
  } catch (error) {
    console.error("❌ Search failed:", error);
  }
}

testSearch();
```

Run it:

```bash
npx tsx test-search.ts
```

## Common Use Cases

### 1. NAP Consistency Audit

```typescript
import { runNapAudit } from "@/aws/bedrock/flows";

const audit = await runNapAudit({
  name: "John Doe",
  address: "123 Main St, San Francisco, CA 94102",
  phone: "(415) 555-1234",
  agencyName: "Doe Realty",
  website: "https://doerealty.com",
});

console.log(audit.results);
```

### 2. Find Competitors

```typescript
import { findCompetitors } from "@/aws/bedrock/flows";

const competitors = await findCompetitors({
  name: "John Doe",
  agencyName: "Doe Realty",
  address: "San Francisco, CA",
});

console.log(competitors.competitors);
```

### 3. Keyword Rankings

```typescript
import { getKeywordRankings } from "@/aws/bedrock/flows";

const rankings = await getKeywordRankings({
  keyword: "luxury real estate",
  location: "San Francisco, CA",
});

console.log(rankings.rankings);
```

## Troubleshooting

### Error: "Missing API key"

Make sure you've set the environment variable:

```bash
# Check if it's set
echo $TAVILY_API_KEY

# If not, add to .env.local
echo "TAVILY_API_KEY=your_key_here" >> .env.local
```

### Error: "Rate limit exceeded"

You've hit the API limit. Solutions:

1. Wait a few minutes
2. Implement caching
3. Upgrade your API plan

### Poor Search Results

Try these options:

```typescript
const results = await client.search(query, {
  searchDepth: "advanced", // More thorough search
  maxResults: 10, // More results
  includeDomains: ["zillow.com", "realtor.com"], // Focus on specific sites
});
```

## Next Steps

- Read the full [README](./README.md) for detailed documentation
- Check [IMPLEMENTATION_SUMMARY](./IMPLEMENTATION_SUMMARY.md) for architecture details
- Explore the updated flows in `src/aws/bedrock/flows/`

## Support

- Tavily Docs: https://docs.tavily.com
- Serper Docs: https://serper.dev/docs
- GitHub Issues: [Your repo issues page]

Happy searching! 🔍
