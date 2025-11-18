# AI Content Suggestions - Integration Guide

## Quick Start

### Step 1: Add to Content Engine Page

Open `src/app/(app)/content-engine/page.tsx` and add the suggestions component:

```typescript
import { AIContentSuggestions } from "@/components/ai-content-suggestions";
import { trackContentCreationAction } from "@/app/actions";

export default function ContentEnginePage() {
  const { user } = useUser();
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Add handler for content type selection
  const handleSelectContentType = (contentType: string) => {
    // Map content type to tab ID
    const typeMap: Record<string, string> = {
      "Market Updates": "market-update",
      "Blog Posts": "blog-post",
      "Video Scripts": "video-script",
      "Neighborhood Guides": "guide",
      "Social Media Posts": "social",
    };

    const tabId = typeMap[contentType];
    if (tabId) {
      setActiveTab(tabId);
      setShowSuggestions(false);
    }
  };

  // Add handler for content idea selection
  const handleSelectIdea = (idea: ContentIdea) => {
    // Pre-fill form based on content type
    if (idea.contentType === "Blog Post") {
      setBlogTopic(idea.title);
      setActiveTab("blog-post");
    } else if (idea.contentType === "Market Update") {
      // Pre-fill market update form
      setActiveTab("market-update");
    }
    // ... handle other types

    setShowSuggestions(false);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Co-Marketing Studio"
        description="Use generative AI to create hyper-local content"
      />

      {/* Add suggestions panel */}
      {showSuggestions && user && (
        <AIContentSuggestions
          userId={user.id}
          marketFocus={user.marketFocus}
          onSelectContentType={handleSelectContentType}
          onSelectIdea={handleSelectIdea}
        />
      )}

      {/* Toggle button when hidden */}
      {!showSuggestions && (
        <Button
          variant="outline"
          onClick={() => setShowSuggestions(true)}
          className="gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Show AI Suggestions
        </Button>
      )}

      {/* Existing content engine tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {/* ... existing tabs ... */}
      </Tabs>
    </div>
  );
}
```

### Step 2: Add Tracking to Content Generation

Update each content generation action to track performance:

```typescript
// In market update generation
useEffect(() => {
  if (marketUpdateState.message === "success" && marketUpdateState.data) {
    setMarketUpdateContent(marketUpdateState.data);
    // Track successful creation
    trackContentCreationAction("Market Updates", true);
  } else if (
    marketUpdateState.message &&
    marketUpdateState.message !== "success"
  ) {
    // Track failed creation
    trackContentCreationAction("Market Updates", false);
    toast({
      variant: "destructive",
      title: "Market Update Failed",
      description: marketUpdateState.message,
    });
  }
}, [marketUpdateState]);

// Repeat for other content types:
// - Blog Posts
// - Video Scripts
// - Neighborhood Guides
// - Social Media Posts
```

### Step 3: Get User's Market Focus

Ensure the user profile includes market focus:

```typescript
// In your profile page or settings
const [marketFocus, setMarketFocus] = useState<string[]>([]);

// Save to user profile
await updateProfile({
  marketFocus: ["Seattle, WA", "Bellevue, WA"],
});
```

## Layout Options

### Option 1: Collapsible Panel (Recommended)

Show suggestions above the content type grid with a toggle:

```typescript
{
  showSuggestions ? (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowSuggestions(false)}
        className="absolute top-4 right-4 z-10"
      >
        <X className="w-4 h-4" />
      </Button>
      <AIContentSuggestions {...props} />
    </div>
  ) : (
    <Button onClick={() => setShowSuggestions(true)}>
      <Sparkles className="w-4 h-4 mr-2" />
      Show AI Suggestions
    </Button>
  );
}
```

### Option 2: Sidebar

Add suggestions in a persistent sidebar:

```typescript
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  {/* Main content */}
  <div className="lg:col-span-3">{/* Content engine tabs */}</div>

  {/* Suggestions sidebar */}
  <aside className="lg:col-span-1">
    <AIContentSuggestions {...props} />
  </aside>
</div>
```

### Option 3: Modal

Show suggestions in a modal on first visit:

```typescript
<Dialog open={showSuggestionsModal} onOpenChange={setShowSuggestionsModal}>
  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>AI Content Suggestions</DialogTitle>
      <DialogDescription>
        Get personalized recommendations for your content strategy
      </DialogDescription>
    </DialogHeader>
    <AIContentSuggestions {...props} />
  </DialogContent>
</Dialog>
```

## Customization

### Filtering Suggestions

Show only specific types of suggestions:

```typescript
// Show only posting times
<AIContentSuggestions
  userId={user.id}
  marketFocus={user.marketFocus}
  showPostingTimes={true}
  showContentTypes={false}
  showContentIdeas={false}
/>
```

### Custom Styling

Override the default styling:

```typescript
<AIContentSuggestions
  userId={user.id}
  marketFocus={user.marketFocus}
  className="border-2 border-primary"
/>
```

### Loading State

Customize the loading experience:

```typescript
{
  loading ? <CustomLoadingState /> : <AIContentSuggestions {...props} />;
}
```

## Testing

### Manual Testing Checklist

- [ ] Suggestions load correctly
- [ ] Clicking content type navigates to correct tab
- [ ] Clicking idea pre-fills form
- [ ] Posting times display with confidence levels
- [ ] Content types show priority badges
- [ ] Ideas include keywords and target audience
- [ ] Toggle button shows/hides suggestions
- [ ] Error states display properly
- [ ] Loading states are smooth
- [ ] Responsive on mobile and tablet

### Test with Different User States

1. **New User** (no performance data)

   - Should show default recommendations
   - Should suggest getting started content

2. **Active User** (has performance data)

   - Should show personalized recommendations
   - Should prioritize high-performing content types

3. **User with Market Focus**
   - Should show market-specific ideas
   - Should reference their locations

### API Testing

Test the API endpoint directly:

```bash
curl -X POST http://localhost:3000/api/content-suggestions \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "marketFocus": ["Seattle, WA"]
  }'
```

## Troubleshooting

### Suggestions Not Loading

1. Check user is authenticated
2. Verify API endpoint is accessible
3. Check browser console for errors
4. Verify AWS Bedrock credentials

### AI Responses Failing

1. Check AWS Bedrock configuration
2. Verify model ID is correct
3. Check CloudWatch logs for errors
4. Fallback recommendations should still work

### Performance Tracking Not Working

1. Verify user ID is correct
2. Check DynamoDB table exists
3. Verify IAM permissions
4. Check CloudWatch logs

## Performance Optimization

### Caching

Cache suggestions on the client:

```typescript
const [cachedSuggestions, setCachedSuggestions] = useState(null);
const [lastFetch, setLastFetch] = useState(0);

// Only fetch if cache is older than 5 minutes
if (Date.now() - lastFetch > 5 * 60 * 1000) {
  // Fetch new suggestions
}
```

### Lazy Loading

Load suggestions only when needed:

```typescript
const [loadSuggestions, setLoadSuggestions] = useState(false);

<Button onClick={() => setLoadSuggestions(true)}>Get Suggestions</Button>;

{
  loadSuggestions && <AIContentSuggestions {...props} />;
}
```

### Debouncing

Debounce API calls when market focus changes:

```typescript
const debouncedMarketFocus = useDebounce(marketFocus, 500);

useEffect(() => {
  // Fetch suggestions with debounced value
}, [debouncedMarketFocus]);
```

## Best Practices

1. **Always Track Performance** - Track both successes and failures
2. **Provide Feedback** - Show toast notifications when tracking
3. **Handle Errors Gracefully** - Always show fallback recommendations
4. **Respect User Preferences** - Remember if user hides suggestions
5. **Keep It Fresh** - Refresh suggestions periodically
6. **Mobile First** - Ensure suggestions work well on mobile
7. **Accessibility** - Ensure keyboard navigation works
8. **Loading States** - Always show loading indicators

## Next Steps

After integration:

1. Monitor usage analytics
2. Gather user feedback
3. A/B test different layouts
4. Measure impact on content creation
5. Iterate based on data
6. Add more suggestion types
7. Improve AI prompts based on results

## Support

For issues or questions:

- Check the README: `src/lib/ai-content-suggestions-README.md`
- Review examples: `src/lib/ai-content-suggestions-integration-example.tsx`
- Check implementation summary: `TASK_71_AI_CONTENT_SUGGESTIONS_IMPLEMENTATION.md`
