/**
 * Competitive Analysis Service
 * 
 * Service for analyzing competitive AI visibility and positioning
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { 
  AIMention, 
  AIPlatform, 
  CompetitorAnalysis, 
  AIVisibilityScore,
  OptimizationRecommendation 
} from '../types';
import { getAISearchMonitorService } from './ai-search-monitor';
import { getRepository } from '@/aws/dynamodb/repository';
import { generateId } from '@/lib/utils';

/**
 * Competitor information with AI visibility metrics
 */
interface CompetitorProfile {
  id: string;
  name: string;
  location: string;
  specialties: string[];
  aiVisibilityScore: number;
  mentionFrequency: number;
  averageSentiment: number;
  strongPlatforms: AIPlatform[];
  weakPlatforms: AIPlatform[];
  topTopics: string[];
  lastAnalyzed: Date;
}

/**
 * Market gap analysis result
 */
interface MarketGap {
  category: string;
  description: string;
  opportunity: string;
  difficulty: 'low' | 'medium' | 'high';
  potentialImpact: number;
  actionItems: string[];
}

/**
 * Competitive positioning data
 */
interface CompetitivePositioning {
  userRank: number;
  totalCompetitors: number;
  percentile: number;
  strengthAreas: string[];
  improvementAreas: string[];
  marketShare: number;
  trendDirection: 'improving' | 'declining' | 'stable';
}

/**
 * Competitive Analysis Service Implementation
 */
export class CompetitiveAnalysisService {
  private repository = getRepository();
  private aiSearchMonitor = getAISearchMonitorService();

  /**
   * Identifies competitors through AI search queries
   */
  async identifyCompetitors(
    userId: string,
    location: string,
    specialties: string[] = []
  ): Promise<CompetitorProfile[]> {
    try {
      console.log(`[CompetitiveAnalysis] Identifying competitors for user ${userId} in ${location}`);

      // Generate competitor discovery queries
      const discoveryQueries = this.generateCompetitorDiscoveryQueries(location, specialties);
      
      // Search across AI platforms to find mentioned agents
      const platforms: AIPlatform[] = ['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'];
      const mentions = await this.aiSearchMonitor.searchPlatforms(
        platforms,
        discoveryQueries,
        userId
      );

      // Extract competitor names from mentions
      const competitorNames = this.extractCompetitorNames(mentions);
      
      // Analyze each competitor
      const competitors: CompetitorProfile[] = [];
      
      for (const name of competitorNames) {
        try {
          const profile = await this.analyzeCompetitor(name, location, platforms);
          if (profile) {
            competitors.push(profile);
          }
        } catch (error) {
          console.error(`[CompetitiveAnalysis] Error analyzing competitor ${name}:`, error);
        }
      }

      // Store competitor data
      await this.storeCompetitorData(userId, competitors);

      console.log(`[CompetitiveAnalysis] Identified ${competitors.length} competitors`);
      return competitors.sort((a, b) => b.aiVisibilityScore - a.aiVisibilityScore);
    } catch (error) {
      console.error('[CompetitiveAnalysis] Error identifying competitors:', error);
      throw new Error('Failed to identify competitors');
    }
  }

  /**
   * Compares AI visibility scores between user and competitors
   */
  async compareAIVisibilityScores(
    userId: string,
    competitorIds: string[]
  ): Promise<{
    userScore: AIVisibilityScore;
    competitorScores: Array<{ id: string; name: string; score: AIVisibilityScore }>;
    ranking: number;
    insights: string[];
  }> {
    try {
      // Get user's AI visibility score
      const userScore = await this.getUserAIVisibilityScore(userId);
      
      // Get competitor scores
      const competitorScores = await Promise.all(
        competitorIds.map(async (id) => {
          const competitor = await this.getCompetitorProfile(userId, id);
          const score = await this.getCompetitorAIVisibilityScore(id);
          return {
            id,
            name: competitor?.name || 'Unknown',
            score
          };
        })
      );

      // Calculate ranking
      const allScores = [userScore.overall, ...competitorScores.map(c => c.score.overall)];
      allScores.sort((a, b) => b - a);
      const ranking = allScores.indexOf(userScore.overall) + 1;

      // Generate insights
      const insights = this.generateComparisonInsights(userScore, competitorScores);

      return {
        userScore,
        competitorScores,
        ranking,
        insights
      };
    } catch (error) {
      console.error('[CompetitiveAnalysis] Error comparing AI visibility scores:', error);
      throw new Error('Failed to compare AI visibility scores');
    }
  }

  /**
   * Performs gap analysis to identify opportunities
   */
  async performGapAnalysis(
    userId: string,
    competitors: CompetitorProfile[]
  ): Promise<MarketGap[]> {
    try {
      console.log(`[CompetitiveAnalysis] Performing gap analysis for user ${userId}`);

      const gaps: MarketGap[] = [];

      // Get user's current AI visibility data
      const userMentions = await this.aiSearchMonitor.getRecentMentions(userId, 24 * 7); // Last week
      const userTopics = this.extractTopicsFromMentions(userMentions);
      const userPlatforms = [...new Set(userMentions.map(m => m.platform))];

      // Analyze platform gaps
      const allPlatforms: AIPlatform[] = ['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'];
      const missingPlatforms = allPlatforms.filter(p => !userPlatforms.includes(p));
      
      if (missingPlatforms.length > 0) {
        gaps.push({
          category: 'Platform Coverage',
          description: `Missing presence on ${missingPlatforms.join(', ')}`,
          opportunity: 'Expand AI platform visibility to reach more potential clients',
          difficulty: 'medium',
          potentialImpact: missingPlatforms.length * 5,
          actionItems: [
            'Optimize content for missing platforms',
            'Create platform-specific content strategies',
            'Monitor and engage with platform-specific queries'
          ]
        });
      }

      // Analyze topic gaps
      const competitorTopics = competitors.flatMap(c => c.topTopics);
      const uniqueCompetitorTopics = [...new Set(competitorTopics)];
      const topicGaps = uniqueCompetitorTopics.filter(topic => 
        !userTopics.some(userTopic => 
          userTopic.toLowerCase().includes(topic.toLowerCase())
        )
      );

      if (topicGaps.length > 0) {
        gaps.push({
          category: 'Expertise Areas',
          description: `Competitors are mentioned for: ${topicGaps.slice(0, 3).join(', ')}`,
          opportunity: 'Develop content and expertise in underrepresented areas',
          difficulty: 'high',
          potentialImpact: topicGaps.length * 3,
          actionItems: [
            'Create content around missing expertise areas',
            'Obtain relevant certifications or training',
            'Develop case studies in these areas'
          ]
        });
      }

      // Analyze sentiment gaps
      const userSentimentScore = this.calculateAverageSentiment(userMentions);
      const competitorSentimentScores = competitors.map(c => c.averageSentiment);
      const avgCompetitorSentiment = competitorSentimentScores.reduce((a, b) => a + b, 0) / competitorSentimentScores.length;

      if (userSentimentScore < avgCompetitorSentiment - 0.1) {
        gaps.push({
          category: 'Reputation Management',
          description: 'Lower sentiment scores compared to competitors',
          opportunity: 'Improve online reputation and client satisfaction messaging',
          difficulty: 'medium',
          potentialImpact: 15,
          actionItems: [
            'Focus on client testimonials and success stories',
            'Improve service quality and client communication',
            'Address any negative feedback proactively'
          ]
        });
      }

      // Analyze mention frequency gaps
      const userMentionFreq = userMentions.length;
      const avgCompetitorMentionFreq = competitors.reduce((sum, c) => sum + c.mentionFrequency, 0) / competitors.length;

      if (userMentionFreq < avgCompetitorMentionFreq * 0.7) {
        gaps.push({
          category: 'Visibility Frequency',
          description: 'Lower mention frequency compared to top competitors',
          opportunity: 'Increase overall AI platform visibility and recognition',
          difficulty: 'high',
          potentialImpact: 20,
          actionItems: [
            'Increase content creation and online presence',
            'Optimize for AI-friendly content formats',
            'Engage more actively in industry discussions'
          ]
        });
      }

      console.log(`[CompetitiveAnalysis] Identified ${gaps.length} market gaps`);
      return gaps.sort((a, b) => b.potentialImpact - a.potentialImpact);
    } catch (error) {
      console.error('[CompetitiveAnalysis] Error performing gap analysis:', error);
      throw new Error('Failed to perform gap analysis');
    }
  }

  /**
   * Generates competitive positioning recommendations
   */
  async generateCompetitiveRecommendations(
    userId: string,
    gaps: MarketGap[],
    competitors: CompetitorProfile[]
  ): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];

      // Generate recommendations based on gaps
      for (const gap of gaps.slice(0, 5)) { // Top 5 gaps
        const recommendation: OptimizationRecommendation = {
          id: generateId(),
          category: 'competitive',
          priority: gap.potentialImpact > 15 ? 'high' : gap.potentialImpact > 8 ? 'medium' : 'low',
          title: `Address ${gap.category} Gap`,
          description: gap.description + '. ' + gap.opportunity,
          actionItems: gap.actionItems,
          estimatedImpact: gap.potentialImpact,
          implementationDifficulty: gap.difficulty === 'low' ? 'easy' : gap.difficulty === 'medium' ? 'medium' : 'hard',
          status: 'pending',
          createdAt: new Date()
        };

        recommendations.push(recommendation);
      }

      // Add competitor-specific recommendations
      const topCompetitor = competitors[0];
      if (topCompetitor) {
        recommendations.push({
          id: generateId(),
          category: 'competitive',
          priority: 'high',
          title: `Learn from Top Competitor: ${topCompetitor.name}`,
          description: `Analyze and adapt successful strategies from ${topCompetitor.name} who has a ${topCompetitor.aiVisibilityScore} AI visibility score.`,
          actionItems: [
            `Research ${topCompetitor.name}'s content strategy and topics`,
            'Identify their strongest platforms and engagement methods',
            'Adapt their successful approaches to your unique value proposition',
            'Monitor their AI mentions for emerging trends'
          ],
          estimatedImpact: 12,
          implementationDifficulty: 'medium',
          status: 'pending',
          createdAt: new Date()
        });
      }

      // Store recommendations
      for (const rec of recommendations) {
        await this.repository.putItem({
          PK: `USER#${userId}`,
          SK: `RECOMMENDATION#${rec.id}`,
          ...rec,
          createdAt: rec.createdAt.toISOString(),
          completedAt: rec.completedAt?.toISOString()
        });
      }

      console.log(`[CompetitiveAnalysis] Generated ${recommendations.length} competitive recommendations`);
      return recommendations;
    } catch (error) {
      console.error('[CompetitiveAnalysis] Error generating recommendations:', error);
      throw new Error('Failed to generate competitive recommendations');
    }
  }

  /**
   * Gets competitive positioning analysis
   */
  async getCompetitivePositioning(
    userId: string,
    competitors: CompetitorProfile[]
  ): Promise<CompetitivePositioning> {
    try {
      const userScore = await this.getUserAIVisibilityScore(userId);
      const competitorScores = competitors.map(c => c.aiVisibilityScore);
      
      // Calculate ranking
      const allScores = [userScore.overall, ...competitorScores].sort((a, b) => b - a);
      const userRank = allScores.indexOf(userScore.overall) + 1;
      const totalCompetitors = competitors.length + 1;
      const percentile = Math.round(((totalCompetitors - userRank) / totalCompetitors) * 100);

      // Identify strength and improvement areas
      const userMentions = await this.aiSearchMonitor.getRecentMentions(userId, 24 * 7);
      const strengthAreas = this.identifyStrengthAreas(userMentions, competitors);
      const improvementAreas = this.identifyImprovementAreas(userMentions, competitors);

      // Calculate market share (simplified)
      const totalMentions = competitors.reduce((sum, c) => sum + c.mentionFrequency, 0) + userMentions.length;
      const marketShare = totalMentions > 0 ? (userMentions.length / totalMentions) * 100 : 0;

      return {
        userRank,
        totalCompetitors,
        percentile,
        strengthAreas,
        improvementAreas,
        marketShare,
        trendDirection: userScore.trend === 'improving' ? 'improving' : 
                       userScore.trend === 'declining' ? 'declining' : 'stable'
      };
    } catch (error) {
      console.error('[CompetitiveAnalysis] Error getting competitive positioning:', error);
      throw new Error('Failed to get competitive positioning');
    }
  }

  /**
   * Generates competitor discovery queries
   */
  private generateCompetitorDiscoveryQueries(location: string, specialties: string[]): string[] {
    const baseQueries = [
      `Who are the top real estate agents in ${location}?`,
      `Best realtors in ${location} area`,
      `Recommended real estate professionals ${location}`,
      `Top performing agents ${location}`,
      `Real estate agent rankings ${location}`
    ];

    const specialtyQueries = specialties.map(specialty => 
      `Best ${specialty} real estate agent in ${location}`
    );

    return [...baseQueries, ...specialtyQueries];
  }

  /**
   * Extracts competitor names from AI mentions
   */
  private extractCompetitorNames(mentions: AIMention[]): string[] {
    const names = new Set<string>();
    
    mentions.forEach(mention => {
      // Add competitors mentioned in the same response
      mention.competitorsAlsoMentioned.forEach(competitor => {
        if (competitor && competitor.length > 3) {
          names.add(competitor);
        }
      });

      // Extract names from the response text
      const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
      const matches = mention.response.match(namePattern) || [];
      matches.forEach(match => {
        if (match.length > 5 && !match.includes('Real Estate')) {
          names.add(match);
        }
      });
    });

    return Array.from(names).slice(0, 10); // Limit to top 10 competitors
  }

  /**
   * Analyzes a specific competitor
   */
  private async analyzeCompetitor(
    name: string,
    location: string,
    platforms: AIPlatform[]
  ): Promise<CompetitorProfile | null> {
    try {
      // Generate queries specific to this competitor
      const queries = [
        `${name} real estate agent ${location}`,
        `${name} realtor reviews`,
        `${name} real estate experience`
      ];

      // Simulate competitor analysis (in real implementation, this would search for the competitor)
      const mockScore = 60 + Math.random() * 35; // Random score between 60-95
      const mockFrequency = Math.floor(Math.random() * 20) + 5; // 5-25 mentions
      const mockSentiment = 0.3 + Math.random() * 0.6; // 0.3-0.9 sentiment

      return {
        id: generateId(),
        name,
        location,
        specialties: ['residential', 'buyer representation'], // Mock data
        aiVisibilityScore: mockScore,
        mentionFrequency: mockFrequency,
        averageSentiment: mockSentiment,
        strongPlatforms: platforms.slice(0, 2 + Math.floor(Math.random() * 2)),
        weakPlatforms: platforms.slice(-2),
        topTopics: ['home buying', 'market analysis', 'negotiation'],
        lastAnalyzed: new Date()
      };
    } catch (error) {
      console.error(`[CompetitiveAnalysis] Error analyzing competitor ${name}:`, error);
      return null;
    }
  }

  /**
   * Stores competitor data in the database
   */
  private async storeCompetitorData(userId: string, competitors: CompetitorProfile[]): Promise<void> {
    try {
      for (const competitor of competitors) {
        await this.repository.putItem({
          PK: `USER#${userId}`,
          SK: `COMPETITOR#${competitor.id}`,
          ...competitor,
          lastAnalyzed: competitor.lastAnalyzed.toISOString()
        });
      }
    } catch (error) {
      console.error('[CompetitiveAnalysis] Error storing competitor data:', error);
    }
  }

  /**
   * Gets user's AI visibility score
   */
  private async getUserAIVisibilityScore(userId: string): Promise<AIVisibilityScore> {
    try {
      const scoreData = await this.repository.getItem({
        PK: `USER#${userId}`,
        SK: 'AI_VISIBILITY_SCORE'
      });

      if (scoreData) {
        return {
          ...scoreData,
          calculatedAt: new Date(scoreData.calculatedAt)
        } as AIVisibilityScore;
      }

      // Return default score if none exists
      return {
        overall: 50,
        breakdown: {
          schemaMarkup: 50,
          contentOptimization: 50,
          aiSearchPresence: 50,
          knowledgeGraphIntegration: 50,
          socialSignals: 50,
          technicalSEO: 50
        },
        calculatedAt: new Date(),
        trend: 'stable'
      };
    } catch (error) {
      console.error('[CompetitiveAnalysis] Error getting user AI visibility score:', error);
      throw error;
    }
  }

  /**
   * Gets competitor's AI visibility score
   */
  private async getCompetitorAIVisibilityScore(competitorId: string): Promise<AIVisibilityScore> {
    // Mock implementation - in real system, this would calculate or retrieve competitor scores
    const mockScore = 60 + Math.random() * 35;
    
    return {
      overall: mockScore,
      breakdown: {
        schemaMarkup: mockScore + (Math.random() - 0.5) * 20,
        contentOptimization: mockScore + (Math.random() - 0.5) * 20,
        aiSearchPresence: mockScore + (Math.random() - 0.5) * 20,
        knowledgeGraphIntegration: mockScore + (Math.random() - 0.5) * 20,
        socialSignals: mockScore + (Math.random() - 0.5) * 20,
        technicalSEO: mockScore + (Math.random() - 0.5) * 20
      },
      calculatedAt: new Date(),
      trend: 'stable'
    };
  }

  /**
   * Gets competitor profile from database
   */
  private async getCompetitorProfile(userId: string, competitorId: string): Promise<CompetitorProfile | null> {
    try {
      const data = await this.repository.getItem({
        PK: `USER#${userId}`,
        SK: `COMPETITOR#${competitorId}`
      });

      if (data) {
        return {
          ...data,
          lastAnalyzed: new Date(data.lastAnalyzed)
        } as CompetitorProfile;
      }

      return null;
    } catch (error) {
      console.error('[CompetitiveAnalysis] Error getting competitor profile:', error);
      return null;
    }
  }

  /**
   * Generates comparison insights
   */
  private generateComparisonInsights(
    userScore: AIVisibilityScore,
    competitorScores: Array<{ id: string; name: string; score: AIVisibilityScore }>
  ): string[] {
    const insights: string[] = [];
    
    const avgCompetitorScore = competitorScores.reduce((sum, c) => sum + c.score.overall, 0) / competitorScores.length;
    
    if (userScore.overall > avgCompetitorScore) {
      insights.push(`You're performing ${Math.round(userScore.overall - avgCompetitorScore)}% better than the average competitor.`);
    } else {
      insights.push(`You're ${Math.round(avgCompetitorScore - userScore.overall)}% behind the average competitor score.`);
    }

    // Find strongest competitor
    const topCompetitor = competitorScores.reduce((top, current) => 
      current.score.overall > top.score.overall ? current : top
    );
    
    if (topCompetitor) {
      const gap = topCompetitor.score.overall - userScore.overall;
      if (gap > 10) {
        insights.push(`${topCompetitor.name} leads by ${Math.round(gap)} points - focus on their successful strategies.`);
      } else if (gap < -5) {
        insights.push(`You're outperforming ${topCompetitor.name} by ${Math.round(-gap)} points - maintain your advantage.`);
      }
    }

    return insights;
  }

  /**
   * Extracts topics from mentions
   */
  private extractTopicsFromMentions(mentions: AIMention[]): string[] {
    const topics = new Set<string>();
    
    mentions.forEach(mention => {
      // Simple topic extraction from context
      const words = mention.mentionContext.toLowerCase().split(/\s+/);
      const realEstateTerms = [
        'luxury', 'buyer', 'seller', 'investment', 'commercial', 'residential',
        'negotiation', 'market', 'listing', 'closing', 'mortgage', 'financing'
      ];
      
      words.forEach(word => {
        if (realEstateTerms.includes(word)) {
          topics.add(word);
        }
      });
    });

    return Array.from(topics);
  }

  /**
   * Calculates average sentiment from mentions
   */
  private calculateAverageSentiment(mentions: AIMention[]): number {
    if (mentions.length === 0) return 0.5;
    
    const sentimentValues = mentions.map(m => {
      switch (m.sentiment) {
        case 'positive': return 1;
        case 'neutral': return 0.5;
        case 'negative': return 0;
        default: return 0.5;
      }
    });

    return sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length;
  }

  /**
   * Identifies strength areas compared to competitors
   */
  private identifyStrengthAreas(userMentions: AIMention[], competitors: CompetitorProfile[]): string[] {
    const userTopics = this.extractTopicsFromMentions(userMentions);
    const userSentiment = this.calculateAverageSentiment(userMentions);
    
    const strengths: string[] = [];
    
    if (userSentiment > 0.7) {
      strengths.push('Client Satisfaction');
    }
    
    if (userMentions.length > 0) {
      const platforms = [...new Set(userMentions.map(m => m.platform))];
      if (platforms.length >= 3) {
        strengths.push('Multi-Platform Presence');
      }
    }

    return strengths;
  }

  /**
   * Identifies improvement areas compared to competitors
   */
  private identifyImprovementAreas(userMentions: AIMention[], competitors: CompetitorProfile[]): string[] {
    const improvements: string[] = [];
    
    const userSentiment = this.calculateAverageSentiment(userMentions);
    const avgCompetitorSentiment = competitors.reduce((sum, c) => sum + c.averageSentiment, 0) / competitors.length;
    
    if (userSentiment < avgCompetitorSentiment - 0.1) {
      improvements.push('Reputation Management');
    }
    
    if (userMentions.length < 5) {
      improvements.push('Online Visibility');
    }

    const platforms = [...new Set(userMentions.map(m => m.platform))];
    if (platforms.length < 3) {
      improvements.push('Platform Diversification');
    }

    return improvements;
  }
}

/**
 * Singleton instance of the Competitive Analysis Service
 */
let competitiveAnalysisInstance: CompetitiveAnalysisService | null = null;

/**
 * Gets the singleton Competitive Analysis Service instance
 */
export function getCompetitiveAnalysisService(): CompetitiveAnalysisService {
  if (!competitiveAnalysisInstance) {
    competitiveAnalysisInstance = new CompetitiveAnalysisService();
  }
  return competitiveAnalysisInstance;
}

/**
 * Resets the singleton instance (useful for testing)
 */
export function resetCompetitiveAnalysisService(): void {
  competitiveAnalysisInstance = null;
}