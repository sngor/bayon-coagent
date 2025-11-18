# AI Content Suggestions

AI-powered content recommendations for the Content Engine, helping real estate agents optimize their content strategy.

## Features

### 1. Optimal Posting Times

Recommends the best times to publish content based on:

- Real estate industry best practices
- Audience engagement patterns
- Historical performance data
- Time of day and day of week analysis

### 2. Content Type Recommendations

Suggests which content types to create next based on:

- Historical success rates
- Underutilized content types with potential
- Market focus alignment
- Current trends in real estate marketing

### 3. AI-Generated Content Ideas

Provides specific, actionable content ideas including:

- Relevant titles and descriptions
- Target keywords for SEO
- Target audience identification
- Content type recommendations

## Usage

### In React Components

```typescript
import { AIContentSuggestions } from "@/components/ai-content-suggestions";

function ContentEnginePage() {
  const { user } = useUser();

  return (
    <AIContentSuggestions
      userId={user.id}
      marketFocus={["Seattle, WA", "Bellevue, WA"]}
      onSelectContentType={(type) => {
        // Navigate to content type
        setActiveTab(type);
      }}
      onSelectIdea={(idea) => {
        // Pre-fill form with idea
        setTopic(idea.title);
      }}
    />
  );
}
```

### Tracking Content Creation

Track when users create content to improve recommendations:

```typescript
import { trackContentCreationAction } from "@/app/actions";

// After successful content generation
await trackContentCreationAction("Blog Post", true);

// After failed content generation
await trackContentCreationAction("Market Update", false);
```

### Direct API Usage

```typescript
import { getContentSuggestionsEngine } from "@/lib/ai-content-suggestions";

const engine = getContentSuggestionsEngine();

// Get all suggestions
const suggestions = await engine.getContentSuggestions(userId, ["Seattle, WA"]);

// Get specific recommendations
const postingTimes = await engine.getOptimalPostingTimes(userId);
const contentTypes = await engine.getContentTypeRecommendations(userId);
const ideas = await engine.getContentIdeas(
  userId,
  ["Seattle, WA"],
  "Blog Post"
);
```

## Data Storage

Content performance is tracked in DynamoDB:

```
PK: USER#<userId>
SK: CONTENT_PERF#<contentType>
Data: {
  contentType: string
  successCount: number
  totalCount: number
  lastUsed: number
}
```

## AI Integration

Uses AWS Bedrock (Claude 3.5 Sonnet) to generate:

- Contextual posting time recommendations
- Personalized content type suggestions
- Fresh content ideas based on market focus

Fallback recommendations are provided when AI is unavailable.

## API Endpoints

### POST /api/content-suggestions

Get AI-powered content suggestions for a user.

**Request:**

```json
{
  "userId": "user-123",
  "marketFocus": ["Seattle, WA"]
}
```

**Response:**

```json
{
  "postingTimes": [
    {
      "dayOfWeek": "Tuesday",
      "timeOfDay": "9:00 AM - 11:00 AM",
      "confidence": "high",
      "reason": "Peak engagement time..."
    }
  ],
  "contentTypes": [
    {
      "type": "Market Updates",
      "title": "Share Local Market Insights",
      "description": "Create a market update...",
      "reason": "Establishes you as...",
      "priority": "high",
      "estimatedTime": "10 minutes"
    }
  ],
  "contentIdeas": [
    {
      "title": "Top 5 Neighborhoods...",
      "description": "Highlight affordable...",
      "contentType": "Blog Post",
      "keywords": ["first-time buyers", "Seattle"],
      "targetAudience": "First-time homebuyers"
    }
  ]
}
```

## Performance Considerations

- Suggestions are cached on the client side
- AI calls are made server-side to protect API keys
- Fallback recommendations ensure the feature always works
- Performance tracking is async and non-blocking

## Future Enhancements

- [ ] A/B testing for posting times
- [ ] Engagement metrics integration
- [ ] Seasonal content recommendations
- [ ] Competitor content analysis
- [ ] Multi-market content strategies
- [ ] Content calendar generation
