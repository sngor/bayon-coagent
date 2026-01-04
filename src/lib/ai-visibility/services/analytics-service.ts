/**
 * AI Visibility Analytics Service
 * 
 * Provides comprehensive analytics and reporting for AI visibility performance
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */

import type {
  AIVisibilityScore,
  AIMention,
  AIPlatform,
  CompetitorAnalysis,
} from '../types';

import { AIVisibilityRepository } from '../repository';

/**
 * Time range options for analytics
 */
export type AnalyticsTimeRange = '7d' | '30d' | '90d' | '180d' | '1y';

/**
 * Analytics data point for trend visualization
 */
export interface AnalyticsDataPoint {
  date: Date;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

/**
 * Trend analysis result
 */
export interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  significance: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Platform-specific performance metrics
 */
export interface PlatformPerformance {
  platform: AIPlatform;
  mentionCount: number;
  averagePosition: number;
  sentimentScore: number;
  trendDirection: 'up' | 'down' | 'stable';
  changePercentage: number;
  lastMention: Date | null;
}

/**
 * AI visibility trends over time
 */
export interface AIVisibilityTrends {
  timeRange: AnalyticsTimeRange;
  overallScore: {
    current: number;
    trend: TrendAnalysis;
    dataPoints: AnalyticsDataPoint[];
  };
  categoryTrends: {
    schemaMarkup: TrendAnalysis & { dataPoints: AnalyticsDataPoint[] };
    contentOptimization: TrendAnalysis & { dataPoints: AnalyticsDataPoint[] };
    aiSearchPresence: TrendAnalysis & { dataPoints: AnalyticsDataPoint[] };
    knowledgeGraphIntegration: TrendAnalysis & { dataPoints: AnalyticsDataPoint[] };
    socialSignals: TrendAnalysis & { dataPoints: AnalyticsDataPoint[] };
    technicalSEO: TrendAnalysis & { dataPoints: AnalyticsDataPoint[] };
  };
  mentionFrequency: {
    trend: TrendAnalysis;
    dataPoints: AnalyticsDataPoint[];
    platformBreakdown: PlatformPerformance[];
  };
  competitivePosition: {
    currentRank: number;
    previousRank: number;
    marketShare: number;
    gapAnalysis: {
      leader: string;
      gap: number;
      catchUpTime: number; // estimated days
    };
  };
}

/**
 * Performance correlation analysis
 */
export interface PerformanceCorrelation {
  metric: string;
  correlation: number; // -1 to 1
  significance: 'high' | 'medium' | 'low';
  description: string;
  recommendations: string[];
}

/**
 * Business outcome metrics
 */
export interface BusinessOutcomeMetrics {
  leadGeneration: {
    total: number;
    aiAttributed: number;
    conversionRate: number;
    trend: TrendAnalysis;
  };
  websiteTraffic: {
    total: number;
    aiReferrals: number;
    organicGrowth: number;
    trend: TrendAnalysis;
  };
  brandAwareness: {
    mentionVolume: number;
    sentimentScore: number;
    shareOfVoice: number;
    trend: TrendAnalysis;
  };
}

/**
 * Automated insight types
 */
export type InsightType = 
  | 'score_improvement' 
  | 'score_decline' 
  | 'platform_opportunity' 
  | 'competitive_threat' 
  | 'seasonal_trend' 
  | 'content_performance' 
  | 'technical_issue';

/**
 * Automated insight
 */
export interface AutomatedInsight {
  id: string;
  type: InsightType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  dataSupport: string[];
  recommendations: string[];
  confidence: number; // 0-1
  generatedAt: Date;
  expiresAt?: Date;
}

/**
 * Analytics report configuration
 */
export interface ReportConfig {
  userId: string;
  timeRange: AnalyticsTimeRange;
  includeCompetitive: boolean;
  includeBusinessOutcomes: boolean;
  includeInsights: boolean;
  format: 'summary' | 'detailed' | 'executive';
}

/**
 * Generated analytics report
 */
export interface AnalyticsReport {
  id: string;
  config: ReportConfig;
  generatedAt: Date;
  summary: {
    overallScore: number;
    scoreChange: number;
    keyAchievements: string[];
    topChallenges: string[];
    nextSteps: string[];
  };
  trends: AIVisibilityTrends;
  correlations: PerformanceCorrelation[];
  businessOutcomes?: BusinessOutcomeMetrics;
  competitiveAnalysis?: CompetitorAnalysis;
  insights: AutomatedInsight[];
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

/**
 * AI Visibility Analytics Service Implementation
 */
export class AIVisibilityAnalyticsService {
  private repository: AIVisibilityRepository;

  constructor(repository?: AIVisibilityRepository) {
    this.repository = repository || new AIVisibilityRepository();
  }

  /**
   * Gets comprehensive AI visibility trends for a user
   */
  async getAIVisibilityTrends(
    userId: string,
    timeRange: AnalyticsTimeRange = '30d'
  ): Promise<AIVisibilityTrends> {
    const days = this.getTimeRangeDays(timeRange);
    
    // Get score history
    const scoreHistory = await this.repository.getScoreHistory(userId, 100, days);
    
    // Get mention history
    const mentions = await this.repository.getAIMentions(userId, days);
    
    // Get competitive data
    const competitorAnalysis = await this.repository.getLatestCompetitorAnalysis(userId);

    // Calculate overall score trends
    const overallScoreTrend = this.calculateScoreTrend(scoreHistory, 'overall');
    
    // Calculate category trends
    const categoryTrends = {
      schemaMarkup: this.calculateScoreTrend(scoreHistory, 'schemaMarkup'),
      contentOptimization: this.calculateScoreTrend(scoreHistory, 'contentOptimization'),
      aiSearchPresence: this.calculateScoreTrend(scoreHistory, 'aiSearchPresence'),
      knowledgeGraphIntegration: this.calculateScoreTrend(scoreHistory, 'knowledgeGraphIntegration'),
      socialSignals: this.calculateScoreTrend(scoreHistory, 'socialSignals'),
      technicalSEO: this.calculateScoreTrend(scoreHistory, 'technicalSEO'),
    };

    // Calculate mention frequency trends
    const mentionTrend = this.calculateMentionTrend(mentions, timeRange);
    const platformBreakdown = this.calculatePlatformPerformance(mentions, timeRange);

    // Calculate competitive position
    const competitivePosition = this.calculateCompetitivePosition(
      scoreHistory[0]?.score,
      competitorAnalysis
    );

    return {
      timeRange,
      overallScore: overallScoreTrend,
      categoryTrends,
      mentionFrequency: {
        trend: mentionTrend.trend,
        dataPoints: mentionTrend.dataPoints,
        platformBreakdown,
      },
      competitivePosition,
    };
  }

  /**
   * Analyzes performance correlations with business outcomes
   */
  async analyzePerformanceCorrelations(
    userId: string,
    timeRange: AnalyticsTimeRange = '90d'
  ): Promise<PerformanceCorrelation[]> {
    const days = this.getTimeRangeDays(timeRange);
    
    // Get historical data
    const scoreHistory = await this.repository.getScoreHistory(userId, 100, days);
    const mentions = await this.repository.getAIMentions(userId, days);
    
    // TODO: Get business outcome data from other services
    // For now, we'll simulate correlations
    
    const correlations: PerformanceCorrelation[] = [
      {
        metric: 'AI Visibility Score vs Lead Generation',
        correlation: 0.78,
        significance: 'high',
        description: 'Strong positive correlation between AI visibility improvements and lead generation increases.',
        recommendations: [
          'Continue focusing on AI optimization to drive more leads',
          'Track lead sources to identify AI-attributed conversions',
          'Optimize content for high-converting AI queries'
        ]
      },
      {
        metric: 'Mention Frequency vs Website Traffic',
        correlation: 0.65,
        significance: 'medium',
        description: 'Moderate correlation between AI mentions and organic website traffic growth.',
        recommendations: [
          'Create content that encourages AI systems to mention your website',
          'Monitor traffic spikes following AI mentions',
          'Optimize landing pages for AI-referred visitors'
        ]
      },
      {
        metric: 'Schema Markup Score vs Search Rankings',
        correlation: 0.82,
        significance: 'high',
        description: 'Very strong correlation between schema markup implementation and search engine rankings.',
        recommendations: [
          'Prioritize schema markup improvements for maximum SEO impact',
          'Implement structured data for all key pages',
          'Monitor search console for schema markup performance'
        ]
      }
    ];

    return correlations;
  }

  /**
   * Generates automated insights from performance data
   */
  async generateAutomatedInsights(
    userId: string,
    timeRange: AnalyticsTimeRange = '30d'
  ): Promise<AutomatedInsight[]> {
    const trends = await this.getAIVisibilityTrends(userId, timeRange);
    const insights: AutomatedInsight[] = [];

    // Score improvement insights
    if (trends.overallScore.trend.direction === 'up' && trends.overallScore.trend.significance === 'high') {
      insights.push({
        id: `insight_${Date.now()}_score_improvement`,
        type: 'score_improvement',
        priority: 'medium',
        title: 'Significant AI Visibility Improvement Detected',
        description: `Your AI visibility score has increased by ${trends.overallScore.trend.percentage}% over the past ${timeRange}, indicating strong optimization progress.`,
        dataSupport: [
          `Overall score increased from ${trends.overallScore.current - (trends.overallScore.current * trends.overallScore.trend.percentage / 100)} to ${trends.overallScore.current}`,
          `Improvement trend shows ${trends.overallScore.trend.significance} significance`
        ],
        recommendations: [
          'Continue current optimization strategies',
          'Document successful tactics for future reference',
          'Consider expanding successful approaches to other areas'
        ],
        confidence: 0.85,
        generatedAt: new Date(),
      });
    }

    // Platform opportunity insights
    const underperformingPlatforms = trends.mentionFrequency.platformBreakdown
      .filter(p => p.mentionCount < 2 && p.trendDirection !== 'up')
      .slice(0, 2);

    if (underperformingPlatforms.length > 0) {
      insights.push({
        id: `insight_${Date.now()}_platform_opportunity`,
        type: 'platform_opportunity',
        priority: 'high',
        title: 'Untapped AI Platform Opportunities',
        description: `Low visibility detected on ${underperformingPlatforms.map(p => p.platform).join(' and ')}. These platforms represent significant growth opportunities.`,
        dataSupport: underperformingPlatforms.map(p => 
          `${p.platform}: ${p.mentionCount} mentions, average position ${p.averagePosition}`
        ),
        recommendations: [
          'Create platform-specific content optimization strategies',
          'Research successful competitors on these platforms',
          'Implement targeted schema markup for better platform recognition'
        ],
        confidence: 0.75,
        generatedAt: new Date(),
      });
    }

    // Competitive threat insights
    if (trends.competitivePosition.currentRank > trends.competitivePosition.previousRank) {
      insights.push({
        id: `insight_${Date.now()}_competitive_threat`,
        type: 'competitive_threat',
        priority: 'high',
        title: 'Competitive Position Decline',
        description: `Your market position has dropped from #${trends.competitivePosition.previousRank} to #${trends.competitivePosition.currentRank}. Immediate action needed to regain competitive advantage.`,
        dataSupport: [
          `Market rank decreased by ${trends.competitivePosition.currentRank - trends.competitivePosition.previousRank} positions`,
          `Gap to leader: ${trends.competitivePosition.gapAnalysis.gap} points`
        ],
        recommendations: [
          'Analyze competitor strategies that are outperforming yours',
          'Accelerate implementation of high-impact recommendations',
          'Focus on areas where competitors are gaining ground'
        ],
        confidence: 0.90,
        generatedAt: new Date(),
      });
    }

    // Content performance insights
    const bestPerformingCategory = Object.entries(trends.categoryTrends)
      .reduce((best, [key, trend]) => 
        trend.percentage > best.percentage ? { key, ...trend } : best
      , { key: '', percentage: -Infinity, direction: 'stable' as const, significance: 'low' as const, description: '' });

    if (bestPerformingCategory.percentage > 10) {
      insights.push({
        id: `insight_${Date.now()}_content_performance`,
        type: 'content_performance',
        priority: 'medium',
        title: `${bestPerformingCategory.key} Shows Strong Performance`,
        description: `Your ${bestPerformingCategory.key.replace(/([A-Z])/g, ' $1').toLowerCase()} has improved by ${bestPerformingCategory.percentage}%, making it your best-performing optimization area.`,
        dataSupport: [
          `${bestPerformingCategory.key} improvement: ${bestPerformingCategory.percentage}%`,
          `Performance significance: ${bestPerformingCategory.significance}`
        ],
        recommendations: [
          `Apply successful ${bestPerformingCategory.key} strategies to other areas`,
          'Document what worked well for future optimization cycles',
          'Consider increasing investment in this high-performing area'
        ],
        confidence: 0.80,
        generatedAt: new Date(),
      });
    }

    return insights.slice(0, 5); // Limit to top 5 insights
  }

  /**
   * Generates a comprehensive analytics report
   */
  async generateAnalyticsReport(config: ReportConfig): Promise<AnalyticsReport> {
    const trends = await this.getAIVisibilityTrends(config.userId, config.timeRange);
    const insights = config.includeInsights 
      ? await this.generateAutomatedInsights(config.userId, config.timeRange)
      : [];
    
    let correlations: PerformanceCorrelation[] = [];
    let businessOutcomes: BusinessOutcomeMetrics | undefined;
    let competitiveAnalysis: CompetitorAnalysis | undefined;

    if (config.includeBusinessOutcomes) {
      correlations = await this.analyzePerformanceCorrelations(config.userId, config.timeRange);
      businessOutcomes = await this.getBusinessOutcomeMetrics(config.userId, config.timeRange);
    }

    if (config.includeCompetitive) {
      competitiveAnalysis = await this.repository.getLatestCompetitorAnalysis(config.userId);
    }

    // Generate summary
    const summary = this.generateReportSummary(trends, insights, correlations);

    // Generate recommendations
    const recommendations = this.generateRecommendations(trends, insights, correlations);

    return {
      id: `report_${Date.now()}_${config.userId}`,
      config,
      generatedAt: new Date(),
      summary,
      trends,
      correlations,
      businessOutcomes,
      competitiveAnalysis: competitiveAnalysis || undefined,
      insights,
      recommendations,
    };
  }

  /**
   * Gets platform-specific performance breakdowns
   */
  async getPlatformPerformanceBreakdown(
    userId: string,
    timeRange: AnalyticsTimeRange = '30d'
  ): Promise<PlatformPerformance[]> {
    const days = this.getTimeRangeDays(timeRange);
    const mentions = await this.repository.getAIMentions(userId, days);
    
    return this.calculatePlatformPerformance(mentions, timeRange);
  }

  // Private helper methods

  private getTimeRangeDays(timeRange: AnalyticsTimeRange): number {
    const ranges = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '180d': 180,
      '1y': 365,
    };
    return ranges[timeRange];
  }

  private calculateScoreTrend(
    scoreHistory: any[],
    category: 'overall' | keyof AIVisibilityScore['breakdown']
  ): TrendAnalysis & { dataPoints: AnalyticsDataPoint[] } {
    if (scoreHistory.length < 2) {
      return {
        direction: 'stable',
        percentage: 0,
        significance: 'low',
        description: 'Insufficient data for trend analysis',
        dataPoints: [],
      };
    }

    const dataPoints: AnalyticsDataPoint[] = scoreHistory.map(entry => ({
      date: entry.timestamp,
      value: category === 'overall' ? entry.score.overall : entry.score.breakdown[category],
    })).reverse();

    const latest = dataPoints[dataPoints.length - 1].value;
    const earliest = dataPoints[0].value;
    const change = latest - earliest;
    const percentage = earliest > 0 ? (change / earliest) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    let significance: 'high' | 'medium' | 'low' = 'low';

    if (Math.abs(percentage) > 15) {
      significance = 'high';
      direction = change > 0 ? 'up' : 'down';
    } else if (Math.abs(percentage) > 5) {
      significance = 'medium';
      direction = change > 0 ? 'up' : 'down';
    }

    const description = this.generateTrendDescription(direction, percentage, significance);

    return {
      direction,
      percentage: Math.abs(percentage),
      significance,
      description,
      dataPoints,
    };
  }

  private calculateMentionTrend(
    mentions: AIMention[],
    timeRange: AnalyticsTimeRange
  ): { trend: TrendAnalysis; dataPoints: AnalyticsDataPoint[] } {
    const days = this.getTimeRangeDays(timeRange);
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Group mentions by day
    const mentionsByDay = new Map<string, number>();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      mentionsByDay.set(dateKey, 0);
    }

    mentions.forEach(mention => {
      const dateKey = mention.timestamp.toISOString().split('T')[0];
      const current = mentionsByDay.get(dateKey) || 0;
      mentionsByDay.set(dateKey, current + 1);
    });

    const dataPoints: AnalyticsDataPoint[] = Array.from(mentionsByDay.entries())
      .map(([date, count]) => ({
        date: new Date(date),
        value: count,
      }));

    // Calculate trend
    const firstHalf = dataPoints.slice(0, Math.floor(dataPoints.length / 2));
    const secondHalf = dataPoints.slice(Math.floor(dataPoints.length / 2));

    const firstHalfAvg = firstHalf.reduce((sum, dp) => sum + dp.value, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, dp) => sum + dp.value, 0) / secondHalf.length;

    const change = secondHalfAvg - firstHalfAvg;
    const percentage = firstHalfAvg > 0 ? (change / firstHalfAvg) * 100 : 0;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    let significance: 'high' | 'medium' | 'low' = 'low';

    if (Math.abs(percentage) > 25) {
      significance = 'high';
      direction = change > 0 ? 'up' : 'down';
    } else if (Math.abs(percentage) > 10) {
      significance = 'medium';
      direction = change > 0 ? 'up' : 'down';
    }

    const description = this.generateTrendDescription(direction, Math.abs(percentage), significance);

    return {
      trend: {
        direction,
        percentage: Math.abs(percentage),
        significance,
        description,
      },
      dataPoints,
    };
  }

  private calculatePlatformPerformance(
    mentions: AIMention[],
    timeRange: AnalyticsTimeRange
  ): PlatformPerformance[] {
    const platforms: AIPlatform[] = ['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'];
    const days = this.getTimeRangeDays(timeRange);
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    return platforms.map(platform => {
      const platformMentions = mentions.filter(m => 
        m.platform === platform && m.timestamp >= cutoffDate
      );

      const mentionCount = platformMentions.length;
      const averagePosition = mentionCount > 0 
        ? platformMentions.reduce((sum, m) => sum + m.position, 0) / mentionCount
        : 0;
      
      const sentimentScore = mentionCount > 0
        ? platformMentions.reduce((sum, m) => {
            const score = m.sentiment === 'positive' ? 1 : m.sentiment === 'neutral' ? 0.5 : 0;
            return sum + score;
          }, 0) / mentionCount
        : 0;

      // Calculate trend (compare first half vs second half of time period)
      const midpoint = new Date(cutoffDate.getTime() + (days / 2) * 24 * 60 * 60 * 1000);
      const firstHalf = platformMentions.filter(m => m.timestamp < midpoint).length;
      const secondHalf = platformMentions.filter(m => m.timestamp >= midpoint).length;
      
      let trendDirection: 'up' | 'down' | 'stable' = 'stable';
      let changePercentage = 0;

      if (firstHalf > 0) {
        changePercentage = ((secondHalf - firstHalf) / firstHalf) * 100;
        if (Math.abs(changePercentage) > 10) {
          trendDirection = changePercentage > 0 ? 'up' : 'down';
        }
      } else if (secondHalf > 0) {
        trendDirection = 'up';
        changePercentage = 100;
      }

      const lastMention = platformMentions.length > 0 
        ? platformMentions.reduce((latest, m) => 
            m.timestamp > latest ? m.timestamp : latest
          , new Date(0))
        : null;

      return {
        platform,
        mentionCount,
        averagePosition,
        sentimentScore,
        trendDirection,
        changePercentage: Math.abs(changePercentage),
        lastMention,
      };
    });
  }

  private calculateCompetitivePosition(
    currentScore?: AIVisibilityScore,
    competitorAnalysis?: CompetitorAnalysis
  ): AIVisibilityTrends['competitivePosition'] {
    if (!currentScore || !competitorAnalysis) {
      return {
        currentRank: 1,
        previousRank: 1,
        marketShare: 100,
        gapAnalysis: {
          leader: 'You',
          gap: 0,
          catchUpTime: 0,
        },
      };
    }

    const currentRank = competitorAnalysis.userPosition;
    const previousRank = Math.max(1, currentRank - 1); // Simplified for demo
    
    const totalCompetitors = competitorAnalysis.competitors.length + 1;
    const marketShare = ((totalCompetitors - currentRank + 1) / totalCompetitors) * 100;

    const leader = competitorAnalysis.competitors[0];
    const gap = leader ? leader.aiVisibilityScore - currentScore.overall : 0;
    const catchUpTime = gap > 0 ? Math.ceil(gap / 2) * 7 : 0; // Estimate 2 points per week

    return {
      currentRank,
      previousRank,
      marketShare,
      gapAnalysis: {
        leader: leader?.name || 'Unknown',
        gap,
        catchUpTime,
      },
    };
  }

  private generateTrendDescription(
    direction: 'up' | 'down' | 'stable',
    percentage: number,
    significance: 'high' | 'medium' | 'low'
  ): string {
    if (direction === 'stable') {
      return 'Performance has remained stable with minimal changes';
    }

    const directionText = direction === 'up' ? 'increased' : 'decreased';
    const significanceText = {
      high: 'significantly',
      medium: 'moderately',
      low: 'slightly',
    }[significance];

    return `Performance has ${significanceText} ${directionText} by ${percentage.toFixed(1)}%`;
  }

  private async getBusinessOutcomeMetrics(
    userId: string,
    timeRange: AnalyticsTimeRange
  ): Promise<BusinessOutcomeMetrics> {
    // TODO: Integrate with actual business metrics services
    // For now, return simulated data
    return {
      leadGeneration: {
        total: 45,
        aiAttributed: 12,
        conversionRate: 26.7,
        trend: {
          direction: 'up',
          percentage: 15.2,
          significance: 'medium',
          description: 'Lead generation has moderately increased by 15.2%',
        },
      },
      websiteTraffic: {
        total: 2340,
        aiReferrals: 187,
        organicGrowth: 8.5,
        trend: {
          direction: 'up',
          percentage: 8.5,
          significance: 'low',
          description: 'Website traffic has slightly increased by 8.5%',
        },
      },
      brandAwareness: {
        mentionVolume: 28,
        sentimentScore: 0.78,
        shareOfVoice: 12.3,
        trend: {
          direction: 'up',
          percentage: 22.1,
          significance: 'high',
          description: 'Brand awareness has significantly increased by 22.1%',
        },
      },
    };
  }

  private generateReportSummary(
    trends: AIVisibilityTrends,
    insights: AutomatedInsight[],
    correlations: PerformanceCorrelation[]
  ): AnalyticsReport['summary'] {
    const keyAchievements: string[] = [];
    const topChallenges: string[] = [];
    const nextSteps: string[] = [];

    // Identify achievements
    if (trends.overallScore.trend.direction === 'up') {
      keyAchievements.push(`AI visibility score improved by ${trends.overallScore.trend.percentage.toFixed(1)}%`);
    }

    const improvingCategories = Object.entries(trends.categoryTrends)
      .filter(([_, trend]) => trend.direction === 'up')
      .map(([category, _]) => category.replace(/([A-Z])/g, ' $1').toLowerCase());

    if (improvingCategories.length > 0) {
      keyAchievements.push(`Strong performance in ${improvingCategories.slice(0, 2).join(' and ')}`);
    }

    // Identify challenges
    const decliningCategories = Object.entries(trends.categoryTrends)
      .filter(([_, trend]) => trend.direction === 'down')
      .map(([category, _]) => category.replace(/([A-Z])/g, ' $1').toLowerCase());

    if (decliningCategories.length > 0) {
      topChallenges.push(`Declining performance in ${decliningCategories.slice(0, 2).join(' and ')}`);
    }

    if (trends.competitivePosition.currentRank > trends.competitivePosition.previousRank) {
      topChallenges.push('Competitive position has weakened');
    }

    // Generate next steps
    const highPriorityInsights = insights.filter(i => i.priority === 'high');
    if (highPriorityInsights.length > 0) {
      nextSteps.push(`Address ${highPriorityInsights.length} high-priority optimization opportunities`);
    }

    const strongCorrelations = correlations.filter(c => c.significance === 'high');
    if (strongCorrelations.length > 0) {
      nextSteps.push('Leverage strong performance correlations for business growth');
    }

    nextSteps.push('Continue monitoring AI platform performance and competitive position');

    return {
      overallScore: trends.overallScore.current,
      scoreChange: trends.overallScore.trend.direction === 'up' 
        ? trends.overallScore.trend.percentage 
        : -trends.overallScore.trend.percentage,
      keyAchievements: keyAchievements.slice(0, 3),
      topChallenges: topChallenges.slice(0, 3),
      nextSteps: nextSteps.slice(0, 3),
    };
  }

  private generateRecommendations(
    trends: AIVisibilityTrends,
    insights: AutomatedInsight[],
    correlations: PerformanceCorrelation[]
  ): AnalyticsReport['recommendations'] {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate actions from high-priority insights
    insights
      .filter(i => i.priority === 'high')
      .forEach(insight => {
        immediate.push(...insight.recommendations.slice(0, 1));
      });

    // Short-term actions from correlations
    correlations
      .filter(c => c.significance === 'high')
      .forEach(correlation => {
        shortTerm.push(...correlation.recommendations.slice(0, 1));
      });

    // Long-term strategic recommendations
    if (trends.competitivePosition.gapAnalysis.gap > 10) {
      longTerm.push('Develop comprehensive competitive strategy to close market gap');
    }

    if (trends.overallScore.current < 70) {
      longTerm.push('Implement systematic AI optimization program across all categories');
    }

    longTerm.push('Establish regular monitoring and optimization cycles');

    return {
      immediate: immediate.slice(0, 3),
      shortTerm: shortTerm.slice(0, 3),
      longTerm: longTerm.slice(0, 3),
    };
  }
}

/**
 * Singleton instance for the analytics service
 */
let analyticsServiceInstance: AIVisibilityAnalyticsService | null = null;

/**
 * Gets the singleton analytics service instance
 */
export function getAIVisibilityAnalyticsService(): AIVisibilityAnalyticsService {
  if (!analyticsServiceInstance) {
    analyticsServiceInstance = new AIVisibilityAnalyticsService();
  }
  return analyticsServiceInstance;
}

/**
 * Resets the singleton instance (for testing)
 */
export function resetAIVisibilityAnalyticsService(): void {
  analyticsServiceInstance = null;
}