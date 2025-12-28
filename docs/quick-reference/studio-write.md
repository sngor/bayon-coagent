# Studio Write - Quick Reference

Quick reference for the Studio Write content generation feature.

## Overview

Studio Write is the AI-powered content generation tool in the Studio Hub that creates high-quality marketing content for real estate agents.

## Content Types

| Type | Description | Key Features |
|------|-------------|--------------|
| **Blog Posts** | SEO-optimized articles | Target audience, tone, keywords, CTA |
| **Social Media** | Platform-specific posts | Hashtags, emojis, engagement focus |
| **Video Scripts** | Duration-based scripts | Visual cues, hooks, platform optimization |
| **Market Updates** | Location-specific analysis | Statistics, forecasts, property focus |
| **Neighborhood Guides** | Comprehensive area overviews | Customizable sections, audience targeting |
| **Website Content** | Professional web pages | SEO optimization, local keywords |

## User Interface Components

### Content Type Selector (New)

```tsx
{/* Content Type Selector - Now wrapped in Card */}
<Card>
  <CardContent>
    <div className="flex items-center gap-4">
      <Label htmlFor="content-type" className="text-sm font-medium whitespace-nowrap">
        Content Type:
      </Label>
      <Select value={activeTab} onValueChange={setActiveTab}>
        <SelectTrigger id="content-type" className="w-full max-w-md">
          <SelectValue placeholder="Select content type" />
        </SelectTrigger>
        <SelectContent>
          {contentTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span>{type.title}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </CardContent>
</Card>
```

### Page Structure

```tsx
<div className="space-y-8">
  {/* Header */}
  <PageHeader
    title="Studio Write"
    description="Create high-quality content with AI assistance"
    actions={<UsageBadge feature="aiContentGeneration" />}
  />

  {/* Content Type Selector */}
  <Card>
    <CardContent>
      {/* Selector UI */}
    </CardContent>
  </Card>

  {/* Content Generation Forms */}
  <FeatureGate feature="aiContentGeneration">
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Form Card */}
      <Card className="lg:col-span-1">
        {/* Dynamic form based on content type */}
      </Card>

      {/* Output Card */}
      <Card className="lg:col-span-2">
        {/* Generated content display */}
      </Card>
    </div>
  </FeatureGate>
</div>
```

## API Functions

### Content Generation

```typescript
// Blog post generation
const result = await generateBlogPost({
  topic: string,
  audience: string,
  tone: string,
  keywords?: string,
  includeWebSearch: boolean
});

// Social media post
const result = await generateSocialMediaPost({
  topic: string,
  platform: string,
  tone: string
});

// Video script
const result = await generateVideoScript({
  topic: string,
  duration: string,
  style: string,
  includeWebSearch: boolean
});

// Market update
const result = await generateMarketUpdate({
  location: string,
  timeframe: string,
  focus: string,
  includeWebSearch: boolean
});

// Neighborhood guide
const result = await generateNeighborhoodGuide({
  neighborhood: string,
  city: string,
  focus: string,
  includeWebSearch: boolean
});

// Website content
const result = await generateWebsiteContent({
  contentType: string,
  businessName: string,
  location: string,
  specialties: string,
  experience: string,
  tone: string,
  targetAudience: string,
  includeWebSearch: boolean
});
```

## Form Fields by Content Type

### Blog Posts
- **Topic** (textarea, required)
- **Target Audience** (select)
- **Writing Tone** (select)
- **Content Length** (select)
- **Location Focus** (input, optional)
- **SEO Keywords** (input, optional)
- **Include Web Search** (checkbox, default: true)
- **Include CTA** (checkbox, default: true)

### Social Media
- **Post Topic** (textarea, required)
- **Platform** (select)
- **Post Type** (select)
- **Tone** (select)
- **Post Length** (select)
- **Location** (input, optional)
- **Include Hashtags** (checkbox, default: true)
- **Include Emojis** (checkbox, default: true)
- **Include CTA** (checkbox, default: true)

### Video Scripts
- **Video Topic** (textarea, required)
- **Duration** (select)
- **Platform** (select)
- **Video Style** (select)
- **Presentation Tone** (select)
- **Location Focus** (input, optional)
- **Include Web Search** (checkbox, default: true)
- **Include Hooks** (checkbox, default: true)
- **Include Cues** (checkbox, default: true)

### Market Updates
- **Market Location** (input, required)
- **Time Period** (select)
- **Update Type** (select)
- **Property Type** (select)
- **Price Range** (select, optional)
- **Include Web Search** (checkbox, default: true)
- **Include Statistics** (checkbox, default: true)
- **Include Forecast** (checkbox, default: false)

### Neighborhood Guides
- **Neighborhood** (input, required)
- **City/Region** (input, required)
- **Primary Focus** (select)
- **Target Audience** (select)
- **Include Sections** (multiple checkboxes)
- **Include Web Search** (checkbox, default: true)
- **Include Photos** (checkbox, default: false)

### Website Content
- **Website Page Type** (select)
- **Business/Agent Name** (input, required)
- **Primary Location** (input, required)
- **Years of Experience** (select)
- **Target Audience** (select)
- **Specialties & Services** (textarea)
- **Website Tone** (select)
- **Include Web Search** (checkbox, default: true)
- **Include SEO** (checkbox, default: true)
- **Include Local Keywords** (checkbox, default: true)

## Loading States

### Multi-Step Progress

```typescript
const loadingSteps = [
  'Analyzing your request...',
  'Researching current information...',
  'Generating AI content...',
  'Optimizing for your audience...',
  'Finalizing content...'
];
```

### Progress Indicator

```tsx
<div className="w-64 mx-auto">
  <div className="flex justify-between text-xs text-muted-foreground mb-2">
    <span>Step {loadingStep + 1} of 5</span>
    <span>{Math.round(((loadingStep + 1) / 5) * 100)}%</span>
  </div>
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
      style={{ width: `${((loadingStep + 1) / 5) * 100}%` }}
    ></div>
  </div>
</div>
```

## Feature Gates

### Usage Tracking

```typescript
// Check if user can use feature
if (!canUseFeature('aiContentGeneration')) {
  toast({
    variant: 'destructive',
    title: 'Limit Reached',
    description: getUpgradeMessage('aiContentGeneration'),
  });
  return;
}

// Increment usage after successful generation
await incrementUsage('aiContentGeneration');
```

## Content Processing

### Response Handling

```typescript
// Clean and format generated content
function cleanAndFormatContent(content: string): string {
  if (!content) return '';

  let cleaned = content.trim();

  // Handle JSON responses
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);
      // Extract main content fields
      const contentFields = ['content', 'text', 'post', 'script', 'guide', 'update'];
      for (const field of contentFields) {
        if (parsed[field] && typeof parsed[field] === 'string') {
          cleaned = parsed[field];
          break;
        }
      }
    } catch (e) {
      // Keep as plain text if parsing fails
    }
  }

  // Clean up formatting
  return cleaned
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\')
    .trim();
}
```

### Keyword Extraction

```typescript
function extractKeywordsFromContent(content: string): string[] {
  if (!content) return [];

  const words = content.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !stopWords.includes(word));

  const frequency: { [key: string]: number } = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}
```

## Integration Points

### Library Hub
- Save generated content with metadata
- Organize by content type and date
- Search and filter saved content

### AEO Optimization
- Content analysis and scoring
- SEO recommendations
- Readability improvements

### Feature Gates
- Usage tracking and limits
- Trial user restrictions
- Upgrade prompts

## Common Use Cases

1. **Blog Content**: Generate SEO-optimized articles for website
2. **Social Media**: Create platform-specific posts for engagement
3. **Video Content**: Script videos for YouTube, Instagram, TikTok
4. **Market Analysis**: Share local market insights with clients
5. **Area Expertise**: Establish neighborhood authority with guides
6. **Website Pages**: Create professional web content

## Best Practices

1. **Be Specific**: Provide detailed, specific prompts for better results
2. **Use Web Search**: Enable current data for timely, relevant content
3. **Review & Edit**: Always review and customize generated content
4. **Save to Library**: Organize content for future reference and reuse
5. **Optimize for SEO**: Use keyword fields and AEO panel
6. **Match Brand Voice**: Select appropriate tone for your audience

## Troubleshooting

### Generation Issues
- Check network connection
- Verify feature gate limits
- Try more specific prompts
- Enable web search for current data

### Performance Issues
- Large requests may take longer
- Refresh page if unresponsive
- Check browser console for errors

### Content Quality
- Provide more context in prompts
- Use specific keywords and locations
- Select appropriate tone and audience
- Review and edit generated content

---

For complete documentation, see [Studio Hub Features](../features/studio.md).