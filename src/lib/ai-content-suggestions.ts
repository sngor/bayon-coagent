/**
 * AI-Powered Content Suggestions
 * 
 * Provides intelligent content recommendations including:
 * - Optimal posting times based on audience engagement
 * - Content type recommendations based on performance
 * - AI-generated content ideas
 */

import { getRepository } from '@/aws/dynamodb/repository';
import { getBedrockClient } from '@/aws/bedrock/client';
import { z } from 'zod';

/**
 * Content performance data
 */
export interface ContentPerformance {
  contentType: string;
  successCount: number;
  totalCount: number;
  avgEngagement?: number;
  lastUsed?: number;
}

/**
 * Posting time recommendation
 */
export interface PostingTimeRecommendation {
  dayOfWeek: string;
  timeOfDay: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

/**
 * Content type recommendation
 */
export interface ContentTypeRecommendation {
  type: string;
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime?: string;
}

/**
 * Content idea suggestion
 */
export interface ContentIdea {
  title: string;
  description: string;
  contentType: string;
  keywords: string[];
  targetAudience: string;
}

/**
 * Zod schema for AI-generated content ideas
 */
const ContentIdeasSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      contentType: z.string(),
      keywords: z.array(z.string()),
      targetAudience: z.string(),
    })
  ),
});

/**
 * Zod schema for posting time recommendations
 */
const PostingTimesSchema = z.object({
  recommendations: z.array(
    z.object({
      dayOfWeek: z.string(),
      timeOfDay: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
      reason: z.string(),
    })
  ),
});

/**
 * Zod schema for content type recommendations
 */
const ContentTypeRecommendationsSchema = z.object({
  recommendations: z.array(
    z.object({
      type: z.string(),
      title: z.string(),
      description: z.string(),
      reason: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      estimatedTime: z.string().optional(),
    })
  ),
});

/**
 * AI Content Suggestions Engine
 */
export class AIContentSuggestionsEngine {
  private repository = getRepository();
  private bedrockClient = getBedrockClient();

  /**
   * Gets DynamoDB keys for content performance tracking
   */
  private getContentPerformanceKeys(userId: string, contentType: string) {
    return {
      PK: `USER#${userId}`,
      SK: `CONTENT_PERF#${contentType}`,
    };
  }

  /**
   * Tracks content creation and performance
   */
  async trackContentCreation(
    userId: string,
    contentType: string,
    success: boolean
  ): Promise<void> {
    const keys = this.getContentPerformanceKeys(userId, contentType);
    
    try {
      const existing = await this.repository.get<ContentPerformance>(
        keys.PK,
        keys.SK
      );

      const performance: ContentPerformance = existing || {
        contentType,
        successCount: 0,
        totalCount: 0,
      };

      performance.totalCount += 1;
      if (success) {
        performance.successCount += 1;
      }
      performance.lastUsed = Date.now();

      await this.repository.put({
        ...keys,
        EntityType: 'ContentPerformance',
        Data: performance,
        CreatedAt: existing ? undefined : Date.now(),
        UpdatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to track content creation:', error);
    }
  }

  /**
   * Gets content performance data for a user
   */
  async getContentPerformance(userId: string): Promise<ContentPerformance[]> {
    try {
      const items = await this.repository.query<ContentPerformance>(
        `USER#${userId}`,
        'CONTENT_PERF#'
      );

      return items.map((item) => item.Data);
    } catch (error) {
      console.error('Failed to get content performance:', error);
      return [];
    }
  }

  /**
   * Gets AI-powered optimal posting times
   */
  async getOptimalPostingTimes(
    userId: string,
    marketFocus?: string[]
  ): Promise<PostingTimeRecommendation[]> {
    try {
      const performance = await this.getContentPerformance(userId);
      const prompt = this.buildPostingTimesPrompt(performance, marketFocus);

      const result = await this.bedrockClient.invoke(
        prompt,
        PostingTimesSchema,
        {
          temperature: 0.7,
          maxTokens: 1500,
        }
      );

      return result.recommendations;
    } catch (error) {
      console.error('Failed to generate posting time recommendations:', error);
      return this.getFallbackPostingTimes();
    }
  }

  /**
   * Builds prompt for posting time recommendations
   */
  private buildPostingTimesPrompt(
    performance: ContentPerformance[],
    marketFocus?: string[]
  ): string {
    const performanceSummary = performance
      .map(
        (p) =>
          `${p.contentType}: ${p.successCount}/${p.totalCount} successful`
      )
      .join(', ');

    return `You are an AI assistant helping a real estate agent optimize their content posting schedule.

User's Content Performance:
${performanceSummary || 'No historical data yet'}

Market Focus: ${marketFocus?.join(', ') || 'General real estate'}

Based on real estate industry best practices and audience engagement patterns, recommend 3-5 optimal posting times for this agent's content.
Consider:
- When real estate audiences are most active on social media
- Best times for email newsletters
- Optimal days for blog posts
- Peak engagement times for video content

Return your response as JSON matching this structure:
{
  "recommendations": [
    {
      "dayOfWeek": "Tuesday",
      "timeOfDay": "9:00 AM - 11:00 AM",
      "confidence": "high" | "medium" | "low",
      "reason": "Why this time is optimal"
    }
  ]
}`;
  }

  /**
   * Gets fallback posting times when AI is unavailable
   */
  private getFallbackPostingTimes(): PostingTimeRecommendation[] {
    return [
      {
        dayOfWeek: 'Tuesday',
        timeOfDay: '9:00 AM - 11:00 AM',
        confidence: 'high',
        reason:
          'Peak engagement time for real estate professionals checking emails',
      },
      {
        dayOfWeek: 'Thursday',
        timeOfDay: '1:00 PM - 3:00 PM',
        confidence: 'high',
        reason: 'High social media activity during lunch breaks',
      },
      {
        dayOfWeek: 'Saturday',
        timeOfDay: '10:00 AM - 12:00 PM',
        confidence: 'medium',
        reason: 'Weekend property search peak time',
      },
    ];
  }

  /**
   * Gets AI-powered content type recommendations
   */
  async getContentTypeRecommendations(
    userId: string,
    marketFocus?: string[]
  ): Promise<ContentTypeRecommendation[]> {
    try {
      const performance = await this.getContentPerformance(userId);
      const prompt = this.buildContentTypePrompt(performance, marketFocus);

      const result = await this.bedrockClient.invoke(
        prompt,
        ContentTypeRecommendationsSchema,
        {
          temperature: 0.7,
          maxTokens: 2000,
        }
      );

      return result.recommendations;
    } catch (error) {
      console.error('Failed to generate content type recommendations:', error);
      return this.getFallbackContentTypeRecommendations(performance);
    }
  }

  /**
   * Builds prompt for content type recommendations
   */
  private buildContentTypePrompt(
    performance: ContentPerformance[],
    marketFocus?: string[]
  ): string {
    const performanceSummary = performance
      .sort((a, b) => {
        const aSuccessRate = a.successCount / a.totalCount;
        const bSuccessRate = b.successCount / b.totalCount;
        return bSuccessRate - aSuccessRate;
      })
      .slice(0, 5)
      .map(
        (p) =>
          `${p.contentType}: ${((p.successCount / p.totalCount) * 100).toFixed(0)}% success rate (${p.totalCount} created)`
      )
      .join('\n');

    return `You are an AI assistant helping a real estate agent choose the most effective content types.

User's Content Performance:
${performanceSummary || 'No historical data yet'}

Market Focus: ${marketFocus?.join(', ') || 'General real estate'}

Based on their performance and market focus, recommend 3-5 content types they should create next.
Prioritize content types that:
- Have shown good performance in the past
- Are underutilized but could be effective
- Align with their market focus
- Are trending in real estate marketing

Available content types:
- Market Updates
- Blog Posts
- Video Scripts
- Neighborhood Guides
- Social Media Posts
- Listing Descriptions

Return your response as JSON matching this structure:
{
  "recommendations": [
    {
      "type": "Content type name",
      "title": "Specific recommendation title",
      "description": "What to create",
      "reason": "Why this is recommended now",
      "priority": "high" | "medium" | "low",
      "estimatedTime": "5 minutes" (optional)
    }
  ]
}`;
  }

  /**
   * Gets fallback content type recommendations
   */
  private getFallbackContentTypeRecommendations(
    performance: ContentPerformance[]
  ): ContentTypeRecommendation[] {
    // If user has performance data, recommend their best-performing types
    if (performance.length > 0) {
      const sorted = performance
        .sort((a, b) => {
          const aRate = a.successCount / a.totalCount;
          const bRate = b.successCount / b.totalCount;
          return bRate - aRate;
        })
        .slice(0, 3);

      return sorted.map((p) => ({
        type: p.contentType,
        title: `Create More ${p.contentType}`,
        description: `You've had success with this content type`,
        reason: `${((p.successCount / p.totalCount) * 100).toFixed(0)}% success rate`,
        priority: 'high' as const,
      }));
    }

    // Default recommendations for new users
    return [
      {
        type: 'Market Updates',
        title: 'Share Local Market Insights',
        description: 'Create a market update for your area',
        reason: 'Establishes you as a local market expert',
        priority: 'high',
        estimatedTime: '10 minutes',
      },
      {
        type: 'Social Media Posts',
        title: 'Engage on Social Media',
        description: 'Create multi-platform social posts',
        reason: 'Quick wins for building your online presence',
        priority: 'high',
        estimatedTime: '5 minutes',
      },
      {
        type: 'Neighborhood Guides',
        title: 'Showcase Your Expertise',
        description: 'Write a comprehensive neighborhood guide',
        reason: 'High-value content that attracts buyers',
        priority: 'medium',
        estimatedTime: '20 minutes',
      },
    ];
  }

  /**
   * Gets AI-generated content ideas
   */
  async getContentIdeas(
    userId: string,
    marketFocus?: string[],
    contentType?: string
  ): Promise<ContentIdea[]> {
    try {
      const performance = await this.getContentPerformance(userId);
      const prompt = this.buildContentIdeasPrompt(
        performance,
        marketFocus,
        contentType
      );

      const result = await this.bedrockClient.invoke(
        prompt,
        ContentIdeasSchema,
        {
          temperature: 0.8,
          maxTokens: 2000,
        }
      );

      return result.ideas;
    } catch (error) {
      console.error('Failed to generate content ideas:', error);
      return this.getFallbackContentIdeas(marketFocus, contentType);
    }
  }

  /**
   * Builds prompt for content ideas
   */
  private buildContentIdeasPrompt(
    performance: ContentPerformance[],
    marketFocus?: string[],
    contentType?: string
  ): string {
    const recentTypes = performance
      .sort((a, b) => (b.lastUsed || 0) - (a.lastUsed || 0))
      .slice(0, 3)
      .map((p) => p.contentType);

    return `You are an AI assistant helping a real estate agent generate fresh content ideas.

Market Focus: ${marketFocus?.join(', ') || 'General real estate'}
Recently Created: ${recentTypes.join(', ') || 'None'}
${contentType ? `Specific Content Type: ${contentType}` : 'Any content type'}

Generate 5 specific, actionable content ideas that:
- Are relevant to their market focus
- Are timely and trending in real estate
- Provide value to their target audience
- Are different from what they've recently created
- Include specific angles and keywords

Return your response as JSON matching this structure:
{
  "ideas": [
    {
      "title": "Specific content title",
      "description": "What the content should cover",
      "contentType": "Market Update | Blog Post | Video Script | etc.",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "targetAudience": "Who this content is for"
    }
  ]
}`;
  }

  /**
   * Gets fallback content ideas
   */
  private getFallbackContentIdeas(
    marketFocus?: string[],
    contentType?: string
  ): ContentIdea[] {
    const market = marketFocus?.[0] || 'your area';

    const ideas: ContentIdea[] = [
      {
        title: `Top 5 Neighborhoods in ${market} for First-Time Buyers`,
        description:
          'Highlight affordable neighborhoods with good amenities and growth potential',
        contentType: 'Blog Post',
        keywords: ['first-time buyers', market, 'affordable neighborhoods'],
        targetAudience: 'First-time homebuyers',
      },
      {
        title: `${market} Market Update: What Buyers Need to Know This Month`,
        description:
          'Share current market trends, inventory levels, and pricing insights',
        contentType: 'Market Update',
        keywords: ['market trends', market, 'real estate market'],
        targetAudience: 'Active buyers and sellers',
      },
      {
        title: 'Home Staging Tips That Actually Work',
        description:
          'Quick, budget-friendly staging tips to help homes sell faster',
        contentType: 'Video Script',
        keywords: ['home staging', 'selling tips', 'home presentation'],
        targetAudience: 'Home sellers',
      },
      {
        title: 'Understanding Mortgage Rates: A Simple Guide',
        description:
          'Break down how mortgage rates work and what buyers should know',
        contentType: 'Social Media Post',
        keywords: ['mortgage rates', 'home financing', 'buyer education'],
        targetAudience: 'Prospective buyers',
      },
      {
        title: `Hidden Gems: Underrated Areas in ${market}`,
        description:
          'Showcase up-and-coming neighborhoods with great potential',
        contentType: 'Neighborhood Guide',
        keywords: ['hidden gems', market, 'emerging neighborhoods'],
        targetAudience: 'Investors and savvy buyers',
      },
    ];

    // Filter by content type if specified
    if (contentType) {
      return ideas.filter((idea) => idea.contentType === contentType);
    }

    return ideas;
  }

  /**
   * Gets comprehensive content suggestions for the content engine
   */
  async getContentSuggestions(userId: string, marketFocus?: string[]) {
    const [postingTimes, contentTypes, contentIdeas] = await Promise.all([
      this.getOptimalPostingTimes(userId, marketFocus),
      this.getContentTypeRecommendations(userId, marketFocus),
      this.getContentIdeas(userId, marketFocus),
    ]);

    return {
      postingTimes,
      contentTypes,
      contentIdeas,
    };
  }
}

/**
 * Singleton instance
 */
let suggestionsEngineInstance: AIContentSuggestionsEngine | null = null;

/**
 * Gets the singleton AI content suggestions engine instance
 */
export function getContentSuggestionsEngine(): AIContentSuggestionsEngine {
  if (!suggestionsEngineInstance) {
    suggestionsEngineInstance = new AIContentSuggestionsEngine();
  }
  return suggestionsEngineInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetContentSuggestionsEngine(): void {
  suggestionsEngineInstance = null;
}
