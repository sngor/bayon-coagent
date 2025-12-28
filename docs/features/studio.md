# Studio Hub - Content Creation

The Studio Hub is the central content creation workspace in Bayon CoAgent, providing AI-powered tools to generate high-quality marketing content for real estate agents.

## Overview

The Studio Hub transforms ideas into polished, professional content in minutes. It combines AI-powered generation with intuitive editing tools to help real estate agents create compelling marketing materials that establish authority and drive engagement.

## Features

### 🖊️ Write - AI Content Generation

**Location:** `/studio/write`

Generate various types of content with AI assistance:

#### Content Types

1. **Blog Posts**
   - SEO-optimized articles for real estate topics
   - Target audience selection (First-Time Buyers, Sellers, Investors, etc.)
   - Customizable tone and length
   - Keyword optimization
   - Call-to-action integration

2. **Social Media Posts**
   - Platform-specific content (Instagram, Facebook, LinkedIn, Twitter, TikTok)
   - Hashtag and emoji integration
   - Engagement-focused copy
   - Multiple post types (Educational, Market Update, Listing Showcase)

3. **Video Scripts**
   - Duration-based scripting (30 seconds to 10+ minutes)
   - Platform optimization (YouTube, Instagram Reels, TikTok)
   - Visual and timing cues
   - Attention-grabbing hooks

4. **Market Updates**
   - Location-specific market analysis
   - Time period customization
   - Property type focus
   - Statistical integration
   - Market forecast inclusion

5. **Neighborhood Guides**
   - Comprehensive area overviews
   - Customizable sections (Schools, Dining, Transportation, Recreation)
   - Target audience adaptation
   - Photo suggestions

6. **Website Content**
   - About Me pages
   - Services descriptions
   - FAQ sections
   - Landing pages
   - SEO optimization

#### User Interface

The Write interface features a clean, organized layout:

- **Content Type Selector**: Dropdown menu wrapped in a Card component for easy content type selection
- **Dynamic Forms**: Context-aware form fields that adapt based on selected content type
- **Real-time Generation**: AI-powered content creation with progress indicators
- **Editable Output**: Generated content can be edited directly in the interface
- **AEO Optimization**: Built-in optimization panel for content enhancement
- **Save to Library**: Direct integration with Library Hub for content management

#### Technical Implementation

```tsx
// Content Type Selector (New Card Wrapper)
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

#### Features & Capabilities

- **Web Search Integration**: Optional current data inclusion for up-to-date content
- **Feature Gating**: Usage limits and upgrade prompts for trial users
- **Loading States**: Multi-step progress indicators with dynamic messaging
- **Error Handling**: Comprehensive error display and retry mechanisms
- **Content Optimization**: AEO (Answer Engine Optimization) panel integration
- **Library Integration**: Direct save functionality to content library

### 📝 Describe - Listing Descriptions

**Location:** `/studio/describe`

Generate compelling, persona-driven property descriptions that convert browsers into buyers.

### 🎨 Reimagine - AI Image Editing

**Location:** `/studio/reimagine`

Transform property photos with AI-powered editing:
- Virtual staging
- Day-to-dusk conversion
- Image enhancement
- Item removal
- Renovation visualization

### 🏠 Open House - Event Materials

**Location:** `/studio/open-house`

Create professional open house materials:
- Event flyers
- Promotional content
- Sign-in sheets
- Follow-up materials

### 📮 Post Cards - Direct Mail

**Location:** `/studio/post-cards`

Design marketing postcards and direct mail materials for targeted campaigns.

## User Workflows

### Content Creation Flow

1. **Select Content Type**: Choose from 6 content types via the dropdown selector
2. **Configure Parameters**: Fill out dynamic form fields specific to content type
3. **Generate Content**: AI processes request with optional web search integration
4. **Review & Edit**: Generated content appears in editable textarea
5. **Optimize**: Use AEO panel to enhance content for search engines
6. **Save**: Store content in Library Hub for future use

### Integration Points

- **Library Hub**: All generated content can be saved and organized
- **Brand Hub**: Profile information auto-populates relevant fields
- **Research Hub**: Market insights can inform content generation
- **Feature Gates**: Usage tracking and upgrade prompts for trial users

## Technical Architecture

### Components

- **PageHeader**: Consistent header with title, description, and usage badge
- **Card Components**: Organized sections for content type selection and forms
- **Dynamic Forms**: Context-aware form rendering based on content type
- **Loading States**: Multi-step progress indicators with animations
- **AEO Panel**: Content optimization tools
- **Save Dialog**: Library integration for content storage

### API Integration

- **Bedrock Flows**: AI content generation via AWS Bedrock
- **Tavily Search**: Optional web search for current information
- **DynamoDB**: Content storage and retrieval
- **Feature Gates**: Usage tracking and limits

### Performance Optimizations

- **Lazy Loading**: Components load on demand
- **Memoization**: Expensive operations are cached
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Error Boundaries**: Graceful error handling and recovery

## Recent Updates

### UI Improvements (Latest)

- **Enhanced Content Type Selector**: Wrapped in Card component for better visual hierarchy
- **Improved Form Organization**: Better spacing and visual grouping
- **Consistent Styling**: Aligned with design system standards

### Feature Enhancements

- **Web Search Integration**: Optional current data inclusion
- **AEO Optimization**: Built-in content optimization tools
- **Usage Tracking**: Feature gate integration for trial management
- **Library Integration**: Direct save functionality

## Best Practices

### Content Generation

1. **Be Specific**: Provide detailed topics and context for better results
2. **Use Web Search**: Enable current data for timely, relevant content
3. **Customize Tone**: Match your brand voice and target audience
4. **Optimize Keywords**: Include relevant SEO terms for better discoverability
5. **Review & Edit**: Always review generated content before publishing

### Performance

1. **Monitor Usage**: Track feature usage against limits
2. **Save Frequently**: Use Library Hub to organize and reuse content
3. **Optimize Images**: Compress images before uploading
4. **Test Content**: Preview content across different devices and platforms

## Troubleshooting

### Common Issues

1. **Generation Fails**: Check network connection and try again
2. **Content Quality**: Provide more specific prompts and context
3. **Usage Limits**: Upgrade subscription or wait for limit reset
4. **Save Errors**: Ensure proper authentication and try again

### Performance Issues

1. **Slow Generation**: Large requests may take longer; be patient
2. **Memory Issues**: Refresh page if interface becomes unresponsive
3. **Network Timeouts**: Check connection and retry failed requests

## Related Documentation

- [Component Reference](../component-reference.md) - UI component details
- [Library Hub](./library.md) - Content management and organization
- [Brand Hub](./brand.md) - Profile and brand strategy integration
- [Feature Gates](../feature-toggles.md) - Usage limits and trial management
- [AI Content Generation](./ai-content.md) - Technical implementation details

## API Reference

### Server Actions

- `generateBlogPost()` - Blog post generation
- `generateSocialMediaPost()` - Social media content
- `generateVideoScript()` - Video script creation
- `generateMarketUpdate()` - Market analysis content
- `generateNeighborhoodGuide()` - Area guide creation
- `generateWebsiteContent()` - Website page content

### Feature Gates

- `aiContentGeneration` - Controls access to AI content generation features
- Usage tracking and limit enforcement
- Upgrade prompts for trial users

---

The Studio Hub represents the core content creation capabilities of Bayon CoAgent, empowering real estate agents to create professional, engaging content that establishes authority and drives business growth.