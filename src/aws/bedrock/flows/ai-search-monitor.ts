'use server';

/**
 * @fileOverview Bedrock flow for AI search monitoring and competitive analysis.
 * 
 * This flow coordinates AI platform monitoring, mention detection, and competitive analysis
 * for real estate agents to track their AI visibility across multiple platforms.
 * 
 * Requirements: 4.1, 4.2, 4.3, 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { defineFlow, definePrompt, MODEL_CONFIGS } from '../flow-base';
import { z } from 'zod';
import { getAISearchMonitorService, getCompetitiveAnalysisService } from '@/lib/ai-visibility';
import type { AIPlatform, AIMention, CompetitorAnalysis } from '@/lib/ai-visibility/types';

/**
 * Input schema for AI search monitoring
 */
const AISearchMonitorInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  agentName: z.string().min(1, 'Agent name is required'),
  location: z.string().min(1, 'Location is required'),
  platforms: z.array(z.enum(['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'])).min(1, 'At least one platform required'),
  specialties: z.array(z.string()).optional().default([]),
  includeCompetitorAnalysis: z.boolean().optional().default(false),
});

/**
 * Output schema for AI search monitoring
 */
const AISearchMonitorOutputSchema = z.object({
  mentions: z.array(z.object({
    id: z.string(),
    platform: z.enum(['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat']),
    query: z.string(),
    sentiment: z.enum(['positive', 'neutral', 'negative']),
    position: z.number(),
    confidence: z.number(),
    context: z.string(),
  })),
  totalMentions: z.number(),
  platformBreakdown: z.record(z.string(), z.number()),
  sentimentBreakdown: z.object({
    positive: z.number(),
    neutral: z.number(),
    negative: z.number(),
  }),
  competitorAnalysis: z.object({
    competitors: z.array(z.object({
      name: z.string(),
      aiVisibilityScore: z.number(),
      mentionFrequency: z.number(),
    })),
    userRanking: z.number(),
    marketGaps: z.array(z.string()),
    recommendations: z.array(z.string()),
  }).optional(),
  insights: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export type AISearchMonitorInput = z.infer<typeof AISearchMonitorInputSchema>;
export type AISearchMonitorOutput = z.infer<typeof AISearchMonitorOutputSchema>;

/**
 * Prompt for generating AI monitoring insights
 */
const generateInsightsPrompt = definePrompt({
  name: 'generateAIMonitoringInsights',
  inputSchema: z.object({
    mentions: z.array(z.any()),
    agentName: z.string(),
    location: z.string(),
    competitorData: z.any().optional(),
  }),
  outputSchema: z.object({
    insights: z.array(z.string()),
    nextSteps: z.array(z.string()),
  }),
  options: MODEL_CONFIGS.ANALYTICAL,
  prompt: `You are an AI visibility expert analyzing search monitoring results for a real estate agent.

Agent: {{{agentName}}}
Location: {{{location}}}

Monitoring Results:
{{{mentions}}}

{{#if competitorData}}
Competitor Analysis:
{{{competitorData}}}
{{/if}}

Based on this data, provide:

1. **Key Insights** (3-5 insights about the agent's AI visibility):
   - Current visibility status across platforms
   - Sentiment trends and what they indicate
   - Platform performance comparison
   - Notable patterns or opportunities

2. **Next Steps** (3-5 actionable recommendations):
   - Specific actions to improve AI visibility
   - Platform-specific optimization strategies
   - Content or reputation improvements needed
   - Competitive positioning moves

Focus on actionable, specific recommendations that will improve the agent's discoverability in AI search results.

Return your analysis as a JSON object with "insights" and "nextSteps" arrays.`,
});

/**
 * AI Search Monitor Flow
 */
const aiSearchMonitorFlow = defineFlow(
  {
    name: 'aiSearchMonitorFlow',
    inputSchema: AISearchMonitorInputSchema,
    outputSchema: AISearchMonitorOutputSchema,
  },
  async (input) => {
    try {
      console.log(`[AISearchMonitorFlow] Starting monitoring for ${input.agentName} in ${input.location}`);

      const aiSearchMonitor = getAISearchMonitorService();
      const competitiveAnalysis = getCompetitiveAnalysisService();

      // Generate location-based queries
      const queries = aiSearchMonitor.generateLocationQueries(input.agentName, [input.location]);
      const queryStrings = queries.map(q => q.query).slice(0, 10); // Limit to 10 queries

      // Search across AI platforms
      const mentions = await aiSearchMonitor.searchPlatforms(
        input.platforms,
        queryStrings,
        input.userId
      );

      // Calculate platform breakdown
      const platformBreakdown: Record<string, number> = {};
      input.platforms.forEach(platform => {
        platformBreakdown[platform] = mentions.filter(m => m.platform === platform).length;
      });

      // Calculate sentiment breakdown
      const sentimentBreakdown = {
        positive: mentions.filter(m => m.sentiment === 'positive').length,
        neutral: mentions.filter(m => m.sentiment === 'neutral').length,
        negative: mentions.filter(m => m.sentiment === 'negative').length,
      };

      // Perform competitive analysis if requested
      let competitorAnalysisResult;
      if (input.includeCompetitorAnalysis) {
        try {
          const competitors = await competitiveAnalysis.identifyCompetitors(
            input.userId,
            input.location,
            input.specialties
          );

          const gaps = await competitiveAnalysis.performGapAnalysis(input.userId, competitors);
          const recommendations = await competitiveAnalysis.generateCompetitiveRecommendations(
            input.userId,
            gaps,
            competitors
          );

          const positioning = await competitiveAnalysis.getCompetitivePositioning(
            input.userId,
            competitors
          );

          competitorAnalysisResult = {
            competitors: competitors.slice(0, 5).map(c => ({
              name: c.name,
              aiVisibilityScore: c.aiVisibilityScore,
              mentionFrequency: c.mentionFrequency,
            })),
            userRanking: positioning.userRank,
            marketGaps: gaps.slice(0, 3).map(g => g.description),
            recommendations: recommendations.slice(0, 3).map(r => r.title),
          };
        } catch (error) {
          console.error('[AISearchMonitorFlow] Error in competitive analysis:', error);
          // Continue without competitive analysis
        }
      }

      // Generate insights using AI
      const insightsInput = {
        mentions: mentions.map(m => ({
          platform: m.platform,
          sentiment: m.sentiment,
          position: m.position,
          context: m.mentionContext.substring(0, 200),
        })),
        agentName: input.agentName,
        location: input.location,
        competitorData: competitorAnalysisResult ? JSON.stringify(competitorAnalysisResult) : undefined,
      };

      const { insights, nextSteps } = await generateInsightsPrompt(insightsInput);

      const result: AISearchMonitorOutput = {
        mentions: mentions.map(m => ({
          id: m.id,
          platform: m.platform,
          query: m.query,
          sentiment: m.sentiment,
          position: m.position,
          confidence: m.confidence,
          context: m.mentionContext,
        })),
        totalMentions: mentions.length,
        platformBreakdown,
        sentimentBreakdown,
        competitorAnalysis: competitorAnalysisResult,
        insights: insights || [],
        nextSteps: nextSteps || [],
      };

      console.log(`[AISearchMonitorFlow] Completed monitoring - found ${mentions.length} mentions`);
      return result;
    } catch (error) {
      console.error('[AISearchMonitorFlow] Error in AI search monitoring:', error);
      
      // Return minimal result on error
      return {
        mentions: [],
        totalMentions: 0,
        platformBreakdown: {},
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
        insights: ['Unable to complete AI monitoring due to technical issues. Please try again later.'],
        nextSteps: ['Check your internet connection and retry the monitoring process.'],
      };
    }
  }
);

/**
 * Executes AI search monitoring for a real estate agent
 * 
 * @param input - Monitoring configuration including agent details and platforms
 * @returns Monitoring results with mentions, analysis, and recommendations
 */
export async function runAISearchMonitoring(
  input: AISearchMonitorInput
): Promise<AISearchMonitorOutput> {
  return aiSearchMonitorFlow.execute(input);
}

/**
 * Quick monitoring function for immediate results
 */
export async function quickAIMonitoring(
  userId: string,
  agentName: string,
  location: string
): Promise<{
  mentionCount: number;
  topPlatform: string;
  overallSentiment: 'positive' | 'neutral' | 'negative';
  quickInsights: string[];
}> {
  try {
    const result = await runAISearchMonitoring({
      userId,
      agentName,
      location,
      platforms: ['chatgpt', 'claude', 'perplexity'],
      includeCompetitorAnalysis: false,
    });

    // Determine top platform
    const topPlatform = Object.entries(result.platformBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';

    // Determine overall sentiment
    const { positive, neutral, negative } = result.sentimentBreakdown;
    const overallSentiment = positive > negative ? 'positive' : 
                            negative > positive ? 'negative' : 'neutral';

    return {
      mentionCount: result.totalMentions,
      topPlatform,
      overallSentiment,
      quickInsights: result.insights.slice(0, 2),
    };
  } catch (error) {
    console.error('[quickAIMonitoring] Error:', error);
    return {
      mentionCount: 0,
      topPlatform: 'none',
      overallSentiment: 'neutral',
      quickInsights: ['Unable to complete monitoring at this time.'],
    };
  }
}