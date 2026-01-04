/**
 * Performance Correlation and Insights Service
 * 
 * Analyzes correlations between AI visibility improvements and business outcomes
 * Generates automated insights from performance data
 * Requirements: 12.2, 12.5
 */

import type {
  AIVisibilityScore,
  AIMention,
  PerformanceCorrelation,
  AutomatedInsight,
  InsightType,
  BusinessOutcomeMetrics,
  AnalyticsTimeRange,
} from '../services/analytics-service';

import { AIVisibilityRepository } from '../repository';

/**
 * Business metric data point
 */
export interface BusinessMetricDataPoint {
  date: Date;
  leadGeneration: number;
  websiteTraffic: number;
  conversionRate: number;
  brandMentions: number;
  customerSatisfaction: number;
}

/**
 * Correlation analysis configuration
 */
export interface CorrelationAnalysisConfig {
  userId: string;
  timeRange: AnalyticsTimeRange;
  includeExternalMetrics: boolean;
  confidenceThreshold: number; // 0-1
  significanceLevel: number; // 0-1
}

/**
 * Correlation calculation result
 */
export interface CorrelationResult {
  metric1: string;
  metric2: string;
  correlation: number; // -1 to 1
  pValue: number; // statistical significance
  sampleSize: number;
  confidence: number; // 0-1
  interpretation: string;
}

/**
 * Insight generation context
 */
export interface InsightGenerationContext {
  userId: string;
  scoreHistory: Array<{ timestamp: Date; score: AIVisibilityScore }>;
  mentions: AIMention[];
  businessMetrics: BusinessMetricDataPoint[];
  correlations: CorrelationResult[];
  timeRange: AnalyticsTimeRange;
}

/**
 * Insight template for generating specific insights
 */
interface InsightTemplate {
  type: InsightType;
  condition: (context: InsightGenerationContext) => boolean;
  priority: (context: InsightGenerationContext) => 'high' | 'medium' | 'low';
  title: (context: InsightGenerationContext) => string;
  description: (context: InsightGenerationContext) => string;
  recommendations: (context: InsightGenerationContext) => string[];
  confidence: (context: InsightGenerationContext) => number;
  dataSupport: (context: InsightGenerationContext) => string[];
}

/**
 * Performance Correlation and Insights Service Implementation
 */
export class PerformanceCorrelationService {
  private repository: AIVisibilityRepository;
  private insightTemplates: InsightTemplate[];

  constructor(repository?: AIVisibilityRepository) {
    this.repository = repository || new AIVisibilityRepository();
    this.insightTemplates = this.initializeInsightTemplates();
  }

  /**
   * Analyzes correlations between AI visibility and business outcomes
   */
  async analyzePerformanceCorrelations(
    config: CorrelationAnalysisConfig
  ): Promise<PerformanceCorrelation[]> {
    const days = this.getTimeRangeDays(config.timeRange);
    
    // Get AI visibility data
    const scoreHistory = await this.repository.getScoreHistory(config.userId, 100, days);
    const mentions = await this.repository.getAIMentions(config.userId, days);
    
    // Get business metrics (simulated for now)
    const businessMetrics = await this.getBusinessMetrics(config.userId, days);
    
    // Calculate correlations
    const correlationResults = await this.calculateCorrelations(
      scoreHistory,
      mentions,
      businessMetrics,
      config
    );

    // Convert to performance correlations with insights
    return this.generatePerformanceCorrelations(correlationResults, config);
  }

  /**
   * Generates automated insights from performance data
   */
  async generateAutomatedInsights(
    userId: string,
    timeRange: AnalyticsTimeRange = '30d'
  ): Promise<AutomatedInsight[]> {
    const days = this.getTimeRangeDays(timeRange);
    
    // Gather context data
    const scoreHistory = await this.repository.getScoreHistory(userId, 100, days);
    const mentions = await this.repository.getAIMentions(userId, days);
    const businessMetrics = await this.getBusinessMetrics(userId, days);
    
    // Calculate correlations for context
    const correlations = await this.calculateCorrelations(
      scoreHistory,
      mentions,
      businessMetrics,
      { userId, timeRange, includeExternalMetrics: true, confidenceThreshold: 0.5, significanceLevel: 0.05 }
    );

    const context: InsightGenerationContext = {
      userId,
      scoreHistory,
      mentions,
      businessMetrics,
      correlations,
      timeRange,
    };

    // Generate insights using templates
    const insights: AutomatedInsight[] = [];

    for (const template of this.insightTemplates) {
      if (template.condition(context)) {
        const insight: AutomatedInsight = {
          id: `insight_${Date.now()}_${template.type}_${Math.random().toString(36).substr(2, 9)}`,
          type: template.type,
          priority: template.priority(context),
          title: template.title(context),
          description: template.description(context),
          dataSupport: template.dataSupport(context),
          recommendations: template.recommendations(context),
          confidence: template.confidence(context),
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        };

        insights.push(insight);
      }
    }

    // Sort by priority and confidence
    return insights
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, 10); // Limit to top 10 insights
  }

  /**
   * Generates comprehensive report with correlations and insights
   */
  async generatePerformanceReport(
    userId: string,
    timeRange: AnalyticsTimeRange = '90d'
  ): Promise<{
    correlations: PerformanceCorrelation[];
    insights: AutomatedInsight[];
    businessOutcomes: BusinessOutcomeMetrics;
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
  }> {
    const config: CorrelationAnalysisConfig = {
      userId,
      timeRange,
      includeExternalMetrics: true,
      confidenceThreshold: 0.6,
      significanceLevel: 0.05,
    };

    const [correlations, insights, businessOutcomes] = await Promise.all([
      this.analyzePerformanceCorrelations(config),
      this.generateAutomatedInsights(userId, timeRange),
      this.getBusinessOutcomeMetrics(userId, timeRange),
    ]);

    const recommendations = this.generateActionableRecommendations(
      correlations,
      insights,
      businessOutcomes
    );

    return {
      correlations,
      insights,
      businessOutcomes,
      recommendations,
    };
  }

  /**
   * Tracks impact of implemented recommendations
   */
  async trackRecommendationImpact(
    userId: string,
    recommendationId: string,
    implementationDate: Date
  ): Promise<{
    beforeMetrics: BusinessOutcomeMetrics;
    afterMetrics: BusinessOutcomeMetrics;
    impact: {
      leadGenerationChange: number;
      trafficChange: number;
      conversionRateChange: number;
      brandAwarenessChange: number;
    };
    confidence: number;
  }> {
    const beforePeriod = 30; // 30 days before implementation
    const afterPeriod = 30; // 30 days after implementation

    const beforeStart = new Date(implementationDate.getTime() - beforePeriod * 24 * 60 * 60 * 1000);
    const afterEnd = new Date(implementationDate.getTime() + afterPeriod * 24 * 60 * 60 * 1000);

    // Get metrics for before and after periods
    const beforeMetrics = await this.getBusinessOutcomeMetrics(userId, '30d', beforeStart);
    const afterMetrics = await this.getBusinessOutcomeMetrics(userId, '30d', implementationDate);

    // Calculate impact
    const impact = {
      leadGenerationChange: afterMetrics.leadGeneration.total - beforeMetrics.leadGeneration.total,
      trafficChange: afterMetrics.websiteTraffic.total - beforeMetrics.websiteTraffic.total,
      conversionRateChange: afterMetrics.leadGeneration.conversionRate - beforeMetrics.leadGeneration.conversionRate,
      brandAwarenessChange: afterMetrics.brandAwareness.mentionVolume - beforeMetrics.brandAwareness.mentionVolume,
    };

    // Calculate confidence based on data quality and time elapsed
    const timeElapsed = (Date.now() - implementationDate.getTime()) / (24 * 60 * 60 * 1000);
    const confidence = Math.min(0.95, Math.max(0.3, timeElapsed / 30)); // Confidence increases over time

    return {
      beforeMetrics,
      afterMetrics,
      impact,
      confidence,
    };
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

  private async getBusinessMetrics(
    userId: string,
    days: number
  ): Promise<BusinessMetricDataPoint[]> {
    // TODO: Integrate with actual business metrics services
    // For now, generate simulated data with realistic patterns
    
    const dataPoints: BusinessMetricDataPoint[] = [];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      // Simulate realistic business metrics with trends
      const baseLeads = 2 + Math.sin(i / 7) * 1; // Weekly pattern
      const baseTraffic = 100 + Math.sin(i / 30) * 20; // Monthly pattern
      
      dataPoints.push({
        date,
        leadGeneration: Math.max(0, Math.floor(baseLeads + Math.random() * 3)),
        websiteTraffic: Math.max(0, Math.floor(baseTraffic + Math.random() * 50)),
        conversionRate: 0.15 + Math.random() * 0.1, // 15-25% conversion rate
        brandMentions: Math.floor(Math.random() * 5),
        customerSatisfaction: 0.8 + Math.random() * 0.2, // 80-100% satisfaction
      });
    }

    return dataPoints;
  }

  private async calculateCorrelations(
    scoreHistory: Array<{ timestamp: Date; score: AIVisibilityScore }>,
    mentions: AIMention[],
    businessMetrics: BusinessMetricDataPoint[],
    config: CorrelationAnalysisConfig
  ): Promise<CorrelationResult[]> {
    const correlations: CorrelationResult[] = [];

    if (scoreHistory.length < 10 || businessMetrics.length < 10) {
      return correlations; // Need sufficient data for meaningful correlations
    }

    // Align data by date
    const alignedData = this.alignDataByDate(scoreHistory, businessMetrics);

    if (alignedData.length < 5) {
      return correlations; // Need at least 5 data points
    }

    // Calculate correlations between AI visibility metrics and business outcomes
    const correlationPairs = [
      { metric1: 'overallScore', metric2: 'leadGeneration', label1: 'AI Visibility Score', label2: 'Lead Generation' },
      { metric1: 'overallScore', metric2: 'websiteTraffic', label1: 'AI Visibility Score', label2: 'Website Traffic' },
      { metric1: 'overallScore', metric2: 'conversionRate', label1: 'AI Visibility Score', label2: 'Conversion Rate' },
      { metric1: 'mentionCount', metric2: 'brandMentions', label1: 'AI Mention Count', label2: 'Brand Mentions' },
      { metric1: 'schemaMarkup', metric2: 'websiteTraffic', label1: 'Schema Markup Score', label2: 'Website Traffic' },
      { metric1: 'aiSearchPresence', metric2: 'leadGeneration', label1: 'AI Search Presence', label2: 'Lead Generation' },
    ];

    for (const pair of correlationPairs) {
      const values1 = alignedData.map(d => this.extractMetricValue(d, pair.metric1));
      const values2 = alignedData.map(d => this.extractMetricValue(d, pair.metric2));

      const correlation = this.calculatePearsonCorrelation(values1, values2);
      const pValue = this.calculatePValue(correlation, values1.length);
      
      if (Math.abs(correlation) >= config.confidenceThreshold && pValue <= config.significanceLevel) {
        correlations.push({
          metric1: pair.label1,
          metric2: pair.label2,
          correlation,
          pValue,
          sampleSize: values1.length,
          confidence: 1 - pValue,
          interpretation: this.interpretCorrelation(correlation, pValue),
        });
      }
    }

    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }

  private alignDataByDate(
    scoreHistory: Array<{ timestamp: Date; score: AIVisibilityScore }>,
    businessMetrics: BusinessMetricDataPoint[]
  ): Array<{
    date: Date;
    score: AIVisibilityScore;
    businessMetrics: BusinessMetricDataPoint;
  }> {
    const aligned: Array<{
      date: Date;
      score: AIVisibilityScore;
      businessMetrics: BusinessMetricDataPoint;
    }> = [];

    for (const scoreEntry of scoreHistory) {
      const scoreDate = scoreEntry.timestamp.toDateString();
      const businessEntry = businessMetrics.find(
        bm => bm.date.toDateString() === scoreDate
      );

      if (businessEntry) {
        aligned.push({
          date: scoreEntry.timestamp,
          score: scoreEntry.score,
          businessMetrics: businessEntry,
        });
      }
    }

    return aligned;
  }

  private extractMetricValue(
    data: { score: AIVisibilityScore; businessMetrics: BusinessMetricDataPoint },
    metric: string
  ): number {
    switch (metric) {
      case 'overallScore':
        return data.score.overall;
      case 'schemaMarkup':
        return data.score.breakdown.schemaMarkup;
      case 'aiSearchPresence':
        return data.score.breakdown.aiSearchPresence;
      case 'leadGeneration':
        return data.businessMetrics.leadGeneration;
      case 'websiteTraffic':
        return data.businessMetrics.websiteTraffic;
      case 'conversionRate':
        return data.businessMetrics.conversionRate;
      case 'brandMentions':
        return data.businessMetrics.brandMentions;
      case 'mentionCount':
        return data.businessMetrics.brandMentions; // Simplified mapping
      default:
        return 0;
    }
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculatePValue(correlation: number, sampleSize: number): number {
    // Simplified p-value calculation for demonstration
    // In production, use proper statistical libraries
    const t = Math.abs(correlation) * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
    
    // Approximate p-value based on t-distribution
    if (t > 2.576) return 0.01; // 99% confidence
    if (t > 1.96) return 0.05;  // 95% confidence
    if (t > 1.645) return 0.1;  // 90% confidence
    return 0.2; // Lower confidence
  }

  private interpretCorrelation(correlation: number, pValue: number): string {
    const strength = Math.abs(correlation);
    const direction = correlation > 0 ? 'positive' : 'negative';
    const significance = pValue <= 0.01 ? 'highly significant' : pValue <= 0.05 ? 'significant' : 'moderate';

    let strengthText = 'weak';
    if (strength > 0.7) strengthText = 'strong';
    else if (strength > 0.5) strengthText = 'moderate';

    return `${strengthText} ${direction} correlation (${significance})`;
  }

  private generatePerformanceCorrelations(
    correlationResults: CorrelationResult[],
    config: CorrelationAnalysisConfig
  ): PerformanceCorrelation[] {
    return correlationResults.map(result => ({
      metric: `${result.metric1} vs ${result.metric2}`,
      correlation: result.correlation,
      significance: result.pValue <= 0.01 ? 'high' : result.pValue <= 0.05 ? 'medium' : 'low',
      description: `${result.interpretation} between ${result.metric1.toLowerCase()} and ${result.metric2.toLowerCase()}.`,
      recommendations: this.generateCorrelationRecommendations(result),
    }));
  }

  private generateCorrelationRecommendations(result: CorrelationResult): string[] {
    const recommendations: string[] = [];

    if (Math.abs(result.correlation) > 0.6) {
      if (result.correlation > 0) {
        recommendations.push(`Focus on improving ${result.metric1} to drive ${result.metric2} growth`);
        recommendations.push(`Monitor ${result.metric1} as a leading indicator for ${result.metric2}`);
      } else {
        recommendations.push(`Investigate why ${result.metric1} negatively impacts ${result.metric2}`);
        recommendations.push(`Consider alternative strategies that don't compromise ${result.metric2}`);
      }
    }

    if (result.pValue <= 0.05) {
      recommendations.push('This correlation is statistically significant and can be relied upon for decision making');
    }

    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }

  private async getBusinessOutcomeMetrics(
    userId: string,
    timeRange: AnalyticsTimeRange,
    startDate?: Date
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

  private generateActionableRecommendations(
    correlations: PerformanceCorrelation[],
    insights: AutomatedInsight[],
    businessOutcomes: BusinessOutcomeMetrics
  ): {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  } {
    const immediate: string[] = [];
    const shortTerm: string[] = [];
    const longTerm: string[] = [];

    // Immediate actions from high-priority insights
    insights
      .filter(i => i.priority === 'high')
      .forEach(insight => {
        immediate.push(...insight.recommendations.slice(0, 1));
      });

    // Short-term actions from strong correlations
    correlations
      .filter(c => c.significance === 'high' && Math.abs(c.correlation) > 0.6)
      .forEach(correlation => {
        shortTerm.push(...correlation.recommendations.slice(0, 1));
      });

    // Long-term strategic recommendations
    if (businessOutcomes.leadGeneration.trend.direction === 'down') {
      longTerm.push('Develop comprehensive lead generation strategy focusing on AI visibility');
    }

    if (businessOutcomes.brandAwareness.shareOfVoice < 15) {
      longTerm.push('Implement long-term brand awareness campaign leveraging AI platforms');
    }

    longTerm.push('Establish systematic performance monitoring and optimization cycles');

    return {
      immediate: immediate.slice(0, 3),
      shortTerm: shortTerm.slice(0, 3),
      longTerm: longTerm.slice(0, 3),
    };
  }

  private initializeInsightTemplates(): InsightTemplate[] {
    return [
      // Score improvement insights
      {
        type: 'score_improvement',
        condition: (context) => {
          if (context.scoreHistory.length < 2) return false;
          const latest = context.scoreHistory[0];
          const previous = context.scoreHistory[context.scoreHistory.length - 1];
          const improvement = latest.score.overall - previous.score.overall;
          return improvement > 5; // 5+ point improvement
        },
        priority: (context) => {
          const latest = context.scoreHistory[0];
          const previous = context.scoreHistory[context.scoreHistory.length - 1];
          const improvement = latest.score.overall - previous.score.overall;
          return improvement > 15 ? 'high' : improvement > 10 ? 'medium' : 'low';
        },
        title: (context) => 'Significant AI Visibility Improvement Detected',
        description: (context) => {
          const latest = context.scoreHistory[0];
          const previous = context.scoreHistory[context.scoreHistory.length - 1];
          const improvement = latest.score.overall - previous.score.overall;
          return `Your AI visibility score has increased by ${improvement.toFixed(1)} points, indicating strong optimization progress.`;
        },
        recommendations: (context) => [
          'Continue current optimization strategies',
          'Document successful tactics for future reference',
          'Consider expanding successful approaches to other areas',
        ],
        confidence: (context) => 0.85,
        dataSupport: (context) => {
          const latest = context.scoreHistory[0];
          const previous = context.scoreHistory[context.scoreHistory.length - 1];
          const improvement = latest.score.overall - previous.score.overall;
          return [
            `Overall score increased from ${previous.score.overall} to ${latest.score.overall}`,
            `Improvement of ${improvement.toFixed(1)} points over ${context.timeRange}`,
          ];
        },
      },

      // Platform opportunity insights
      {
        type: 'platform_opportunity',
        condition: (context) => {
          const platformMentions = new Map<string, number>();
          context.mentions.forEach(mention => {
            const current = platformMentions.get(mention.platform) || 0;
            platformMentions.set(mention.platform, current + 1);
          });
          
          // Check if any platform has significantly fewer mentions
          const mentionCounts = Array.from(platformMentions.values());
          const maxMentions = Math.max(...mentionCounts);
          const minMentions = Math.min(...mentionCounts);
          
          return maxMentions > 0 && (maxMentions - minMentions) > 5;
        },
        priority: (context) => 'high',
        title: (context) => 'Untapped AI Platform Opportunities',
        description: (context) => {
          const platformMentions = new Map<string, number>();
          context.mentions.forEach(mention => {
            const current = platformMentions.get(mention.platform) || 0;
            platformMentions.set(mention.platform, current + 1);
          });
          
          const sortedPlatforms = Array.from(platformMentions.entries())
            .sort((a, b) => a[1] - b[1]);
          
          const underperforming = sortedPlatforms.slice(0, 2).map(p => p[0]);
          
          return `Low visibility detected on ${underperforming.join(' and ')}. These platforms represent significant growth opportunities.`;
        },
        recommendations: (context) => [
          'Create platform-specific content optimization strategies',
          'Research successful competitors on underperforming platforms',
          'Implement targeted schema markup for better platform recognition',
        ],
        confidence: (context) => 0.75,
        dataSupport: (context) => {
          const platformMentions = new Map<string, number>();
          context.mentions.forEach(mention => {
            const current = platformMentions.get(mention.platform) || 0;
            platformMentions.set(mention.platform, current + 1);
          });
          
          return Array.from(platformMentions.entries())
            .map(([platform, count]) => `${platform}: ${count} mentions`);
        },
      },

      // Seasonal trend insights
      {
        type: 'seasonal_trend',
        condition: (context) => {
          // Check if there's a clear seasonal pattern in mentions or scores
          if (context.scoreHistory.length < 30) return false;
          
          // Simple seasonal detection: check for weekly patterns
          const weeklyAverages = new Array(7).fill(0);
          const weeklyCounts = new Array(7).fill(0);
          
          context.mentions.forEach(mention => {
            const dayOfWeek = mention.timestamp.getDay();
            weeklyAverages[dayOfWeek]++;
            weeklyCounts[dayOfWeek]++;
          });
          
          const maxWeekly = Math.max(...weeklyAverages);
          const minWeekly = Math.min(...weeklyAverages);
          
          return maxWeekly > 0 && (maxWeekly - minWeekly) > 3;
        },
        priority: (context) => 'medium',
        title: (context) => 'Seasonal Performance Pattern Detected',
        description: (context) => 'Your AI visibility shows clear seasonal patterns that can be leveraged for strategic planning.',
        recommendations: (context) => [
          'Align content creation with high-performance periods',
          'Prepare optimization campaigns for low-performance seasons',
          'Monitor seasonal trends for competitive advantages',
        ],
        confidence: (context) => 0.70,
        dataSupport: (context) => [
          'Weekly mention patterns show significant variation',
          'Performance correlates with seasonal business cycles',
        ],
      },

      // Content performance insights
      {
        type: 'content_performance',
        condition: (context) => {
          // Check if there are strong correlations between content metrics and business outcomes
          return context.correlations.some(c => 
            c.metric1.includes('Content') && Math.abs(c.correlation) > 0.6
          );
        },
        priority: (context) => 'medium',
        title: (context) => 'Content Optimization Shows Strong ROI',
        description: (context) => {
          const contentCorrelation = context.correlations.find(c => 
            c.metric1.includes('Content') && Math.abs(c.correlation) > 0.6
          );
          return `Content optimization efforts show strong correlation (${(contentCorrelation?.correlation || 0).toFixed(2)}) with business outcomes.`;
        },
        recommendations: (context) => [
          'Increase investment in content optimization strategies',
          'Apply successful content approaches to other areas',
          'Document content best practices for team training',
        ],
        confidence: (context) => 0.80,
        dataSupport: (context) => {
          const contentCorrelation = context.correlations.find(c => 
            c.metric1.includes('Content')
          );
          return contentCorrelation ? [
            `Strong correlation: ${contentCorrelation.correlation.toFixed(2)}`,
            `Statistical significance: ${contentCorrelation.confidence.toFixed(2)}`,
          ] : [];
        },
      },
    ];
  }
}

/**
 * Singleton instance for the performance correlation service
 */
let performanceCorrelationServiceInstance: PerformanceCorrelationService | null = null;

/**
 * Gets the singleton performance correlation service instance
 */
export function getPerformanceCorrelationService(): PerformanceCorrelationService {
  if (!performanceCorrelationServiceInstance) {
    performanceCorrelationServiceInstance = new PerformanceCorrelationService();
  }
  return performanceCorrelationServiceInstance;
}

/**
 * Resets the singleton instance (for testing)
 */
export function resetPerformanceCorrelationService(): void {
  performanceCorrelationServiceInstance = null;
}