# Local Keyword Rankings - Implementation Summary

## What Was Fixed

The Local Keyword Rankings feature in the Brand → Competitors page is now fully functional.

### Issues Resolved

1. **Schema Mismatch**: Fixed inconsistency between the output schema (`agency`) and TypeScript type (`agencyName`)
2. **Type Alignment**: Updated all components to use consistent field names across the stack
3. **Optional URL Field**: Made the `url` field optional since it may not always be available

### Changes Made

**Files Modified:**

- `src/ai/schemas/keyword-ranking-schemas.ts` - Changed `agency` to `agencyName` in output schema
- `src/lib/types.ts` - Added optional `url` field to KeywordRanking type
- `src/aws/bedrock/flows/get-keyword-rankings.ts` - Updated prompt to use `agencyName` consistently

## How It Works

### User Flow

1. Navigate to **Brand → Competitors**
2. Scroll to the **Local Keyword Rankings** card
3. Enter a keyword (e.g., "best real estate agent Seattle")
4. Click **Analyze Keyword**
5. View top 5 agents ranking for that keyword in your location

### Technical Flow

1. **Input**: Keyword + Location (from user profile)
2. **Web Search**: Uses Tavily API to search Google for the keyword + location
3. **AI Analysis**: Claude analyzes search results to identify top 5 real estate agents
4. **Fallback**: If search fails, AI uses general market knowledge
5. **Display**: Shows ranked list with agent name, agency, and rank position

### Requirements

- **TAVILY_API_KEY** environment variable (for web search)
- User must have address set in their profile (for location context)
- If Tavily API key is missing, feature falls back to AI estimates

## Testing

Run the test script to verify functionality:

```bash
npx tsx test-keyword-rankings.ts
```

This will test the flow with a sample query and validate the response structure.

## API Response Format

```typescript
{
  rankings: [
    {
      rank: 1,
      agentName: "John Smith",
      agencyName: "Seattle Homes Realty",
      url: "https://example.com", // optional
    },
    // ... up to 5 results
  ];
}
```

## Notes

- Results are based on real-time web search when Tavily API is available
- AI provides estimates if search is unavailable
- Feature requires user's location from their profile
- Rankings are for informational purposes and reflect current search results
