# Keyword Rankings - Quick Reference

## Overview

The Keyword Rankings feature allows users to analyze their position for specific keywords in local search results. It's part of the Brand → Competitors hub and helps agents understand their competitive position.

## Quick Start

### Server Action Usage

```typescript
import { getKeywordRankingsAction } from '@/app/actions';

// Form data from user input
const formData = new FormData();
formData.append('keyword', 'best real estate agent');
formData.append('location', 'Seattle, WA');

const result = await getKeywordRankingsAction(initialState, formData);
```

### Direct API Usage

```typescript
import { getKeywordRankings } from '@/aws/bedrock/flows/get-keyword-rankings';

const result = await getKeywordRankings({
  keywords: ['best real estate agent', 'luxury homes'],
  location: 'Seattle, WA',
  domain: 'myrealestate.com', // optional
  competitors: ['competitor1.com'] // optional
});
```

## API Interface

### Input Schema

```typescript
interface KeywordRankingsInput {
  keywords: string[];        // Array of keywords to analyze
  location: string;          // Location for local search context
  domain?: string;           // Optional: your domain to check
  competitors?: string[];    // Optional: competitor domains
}
```

### Output Schema

```typescript
interface KeywordRankingsOutput {
  rankings: KeywordRanking[];
  totalKeywords: number;
  averagePosition: number;
  topRankingKeywords: KeywordRanking[];
  improvementOpportunities: KeywordRanking[];
  competitorComparison?: {
    domain: string;
    rankings: KeywordRanking[];
  }[];
}

interface KeywordRanking {
  keyword: string;
  position: number;
  url: string;
  searchVolume: number;
  difficulty: number;
  trend: 'up' | 'down' | 'stable';
}
```

## Form to API Transformation

The server action transforms single keyword form input to the API's array format:

```typescript
// Form input (single keyword)
const formInput = {
  keyword: 'best real estate agent',
  location: 'Seattle, WA'
};

// Transformed to API input (array format)
const apiInput = {
  keywords: [formInput.keyword],
  location: formInput.location
};
```

## Usage in Components

### Form Implementation

```typescript
'use client';

import { useActionState } from 'react';
import { getKeywordRankingsAction } from '@/app/actions';

export function KeywordRankingsForm() {
  const [state, formAction] = useActionState(getKeywordRankingsAction, {
    message: '',
    data: null,
    errors: {}
  });

  return (
    <form action={formAction}>
      <input 
        name="keyword" 
        placeholder="Enter keyword to analyze"
        required 
      />
      <input 
        name="location" 
        placeholder="Your location"
        required 
      />
      <button type="submit">Analyze Rankings</button>
      
      {state.data && (
        <div>
          <h3>Rankings for "{state.data.rankings[0]?.originalKeyword}"</h3>
          {state.data.rankings.map((ranking, index) => (
            <div key={index}>
              Position {ranking.position}: {ranking.keyword}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
```

### Results Display

```typescript
interface RankingsDisplayProps {
  rankings: KeywordRanking[];
  originalKeyword: string;
}

export function RankingsDisplay({ rankings, originalKeyword }: RankingsDisplayProps) {
  return (
    <div className="space-y-4">
      <h3>Rankings for "{originalKeyword}"</h3>
      {rankings.map((ranking, index) => (
        <div key={index} className="flex justify-between items-center p-3 border rounded">
          <div>
            <div className="font-medium">{ranking.keyword}</div>
            <div className="text-sm text-muted-foreground">
              Search Volume: {ranking.searchVolume.toLocaleString()}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">#{ranking.position}</div>
            <div className={`text-sm ${
              ranking.trend === 'up' ? 'text-green-600' : 
              ranking.trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {ranking.trend === 'up' ? '↑' : ranking.trend === 'down' ? '↓' : '→'}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Error Handling

```typescript
// Server action response format
interface ActionResponse {
  message: string;
  data: KeywordRankingsOutput | null;
  errors: Record<string, string[]>;
}

// Handle validation errors
if (state.errors.keyword) {
  console.error('Keyword validation error:', state.errors.keyword[0]);
}

// Handle API errors
if (state.message !== 'success') {
  console.error('API error:', state.message);
}
```

## Requirements

- **TAVILY_API_KEY**: Required for web search functionality
- **User Profile**: User must have address set for location context
- **Minimum Input**: Keyword must be at least 3 characters
- **Location**: Location must be at least 3 characters

## Best Practices

1. **Input Validation**: Always validate keyword and location before submission
2. **Error Handling**: Handle both validation and API errors gracefully
3. **Loading States**: Show loading indicators during analysis
4. **Result Caching**: Consider caching results for frequently searched keywords
5. **Rate Limiting**: Be mindful of API rate limits for frequent requests

## Related Files

- `src/app/actions.ts` - Server action implementation
- `src/ai/schemas/keyword-ranking-schemas.ts` - Zod validation schemas
- `src/aws/bedrock/flows/get-keyword-rankings.ts` - Bedrock flow implementation
- `src/app/(app)/brand/competitors/page.tsx` - UI implementation

## Testing

```bash
# Test the keyword rankings flow
npx tsx test-keyword-rankings.ts

# Run unit tests
npm test -- keyword-rankings
```