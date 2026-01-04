/**
 * AI Visibility Scoring Engine Service
 * 
 * Implements weighted scoring algorithm and trend analysis for AI visibility
 * Requirements: 1.2, 1.3, 1.4
 */

import type {
  AIVisibilityScore,
  AIVisibilityScoreBreakdown,
  AIMention,
  SchemaMarkup,
  KnowledgeGraphEntity,
  WebsiteAnalysis,
} from '../types';

import {
  calculateOverallScore,
  calculateSchemaMarkupScore,
  calculateAISearchPresenceScore,
  calculateKnowledgeGraphScore,
  calculateContentOptimizationScore,
  calculateSocialSignalsScore,
  calculateTechnicalSEOScore,
  calculateScoreTrend,
  createAIVisibilityScore,
  validateBreakdownScores,
  SCORE_WEIGHTS,
} from '../utils/scoring';

import { AIVisibilityRepository } from '../repository';

/**
 * Input data for AI visibility scoring
 */
export interface ScoringInput {
  userId: string;
  schemaMarkup: SchemaMarkup[];
  mentions: AIMention[];
  knowledgeGraphEntities: KnowledgeGraphEntity[];
  websiteAnalysis?: WebsiteAnalysis;
  profileCompleteness?: number;
  socialProfiles?: number;
  socialEngagement?: number;
  reviewCount?: number;
  averageRating?: number;
}

/**
 * Score history entry for trend analysis
 */
export interface ScoreHistoryEntry {
  userId: string;
  score: AIVisibilityScore;
  timestamp: Date;
  context?: {
    changesImplemented?: string[];
    externalFactors?: string[];
  };
}

/**
 * AI Visibility Scoring Engine Service
 */
export class AIVisibilityScoringEngine {
  private repository: AIVisibilityRepository;

  constructor(repository?: AIVisibilityRepository) {
    this.repository = repository || new AIVisibilityRepository();
  }

  /**
   * Calculates complete AI visibility score with all categories
   */
  async calculateAIVisibilityScore(input: ScoringInput): Promise<AIVisibilityScore> {
    // Get previous score for trend analysis
    const previousScore = await this.getPreviousScore(input.userId);

    // Calculate individual category scores
    const breakdown = await this.calculateCategoryScores(input);

    // Validate breakdown scores
    if (!validateBreakdownScores(breakdown)) {
      throw new Error('Invalid breakdown scores calculated');
    }

    // Create complete score object
    const score = createAIVisibilityScore(breakdown, previousScore?.overall);

    // Store score in history
    await this.storeScoreHistory(input.userId, score);

    return score;
  }

  /**
   * Calculates scores for each category
   */
  private async calculateCategoryScores(input: ScoringInput): Promise<AIVisibilityScoreBreakdown> {
    const {
      schemaMarkup,
      mentions,
      knowledgeGraphEntities,
      websiteAnalysis,
      profileCompleteness = 100,
      socialProfiles = 0,
      socialEngagement = 0,
      reviewCount = 0,
      averageRating = 0,
    } = input;

    // Schema markup score (25% weight)
    const schemaMarkupScore = calculateSchemaMarkupScore(
      schemaMarkup,
      profileCompleteness
    );

    // AI search presence score (20% weight)
    const aiSearchPresenceScore = calculateAISearchPresenceScore(mentions);

    // Knowledge graph integration score (15% weight)
    const knowledgeGraphScore = calculateKnowledgeGraphScore(
      knowledgeGraphEntities,
      this.hasGeographicData(knowledgeGraphEntities),
      this.hasCertificationData(schemaMarkup)
    );

    // Content optimization score (20% weight)
    const contentOptimizationScore = calculateContentOptimizationScore(
      websiteAnalysis?.schemaMarkup.length > 0,
      this.hasFAQContent(websiteAnalysis),
      this.hasLocationContent(websiteAnalysis),
      this.hasExpertiseContent(websiteAnalysis),
      this.calculateSemanticMarkupCoverage(websiteAnalysis)
    );

    // Social signals score (10% weight)
    const socialSignalsScore = calculateSocialSignalsScore(
      socialProfiles,
      socialEngagement,
      reviewCount,
      averageRating
    );

    // Technical SEO score (10% weight)
    const technicalSEOScore = calculateTechnicalSEOScore(
      websiteAnalysis ? this.hasSSL(websiteAnalysis) : false,
      websiteAnalysis ? this.isMobileOptimized(websiteAnalysis) : false,
      websiteAnalysis ? this.getPageSpeedScore(websiteAnalysis) : 0,
      websiteAnalysis ? websiteAnalysis.schemaMarkup.length > 0 : false,
      websiteAnalysis ? this.hasMetaTags(websiteAnalysis) : false
    );

    return {
      schemaMarkup: schemaMarkupScore,
      contentOptimization: contentOptimizationScore,
      aiSearchPresence: aiSearchPresenceScore,
      knowledgeGraphIntegration: knowledgeGraphScore,
      socialSignals: socialSignalsScore,
      technicalSEO: technicalSEOScore,
    };
  }

  /**
   * Gets the most recent score for trend analysis
   */
  private async getPreviousScore(userId: string): Promise<AIVisibilityScore | null> {
    try {
      const history = await this.repository.getScoreHistory(userId, 1);
      return history.length > 0 ? history[0].score : null;
    } catch (error) {
      console.warn('Failed to get previous score:', error);
      return null;
    }
  }

  /**
   * Stores score in history for trend tracking
   */
  private async storeScoreHistory(userId: string, score: AIVisibilityScore): Promise<void> {
    const historyEntry: ScoreHistoryEntry = {
      userId,
      score,
      timestamp: new Date(),
    };

    try {
      await this.repository.storeScoreHistory(historyEntry);
    } catch (error) {
      console.error('Failed to store score history:', error);
      // Don't throw - scoring should continue even if history storage fails
    }
  }

  /**
   * Gets score history for trend analysis
   */
  async getScoreHistory(
    userId: string,
    limit: number = 10,
    timeRangeDays?: number
  ): Promise<ScoreHistoryEntry[]> {
    return this.repository.getScoreHistory(userId, limit, timeRangeDays);
  }

  /**
   * Calculates score trends over time
   */
  async calculateScoreTrends(
    userId: string,
    timeRangeDays: number = 90
  ): Promise<{
    overallTrend: 'improving' | 'declining' | 'stable';
    categoryTrends: Record<keyof AIVisibilityScoreBreakdown, 'improving' | 'declining' | 'stable'>;
    averageMonthlyChange: number;
    bestPerformingCategory: keyof AIVisibilityScoreBreakdown;
    worstPerformingCategory: keyof AIVisibilityScoreBreakdown;
  }> {
    const history = await this.getScoreHistory(userId, 100, timeRangeDays);

    if (history.length < 2) {
      return {
        overallTrend: 'stable',
        categoryTrends: {
          schemaMarkup: 'stable',
          contentOptimization: 'stable',
          aiSearchPresence: 'stable',
          knowledgeGraphIntegration: 'stable',
          socialSignals: 'stable',
          technicalSEO: 'stable',
        },
        averageMonthlyChange: 0,
        bestPerformingCategory: 'schemaMarkup',
        worstPerformingCategory: 'schemaMarkup',
      };
    }

    const latest = history[0];
    const earliest = history[history.length - 1];

    // Calculate overall trend
    const overallChange = latest.score.overall - earliest.score.overall;
    const overallTrend = calculateScoreTrend(latest.score.overall, earliest.score.overall);

    // Calculate category trends
    const categoryTrends: Record<keyof AIVisibilityScoreBreakdown, 'improving' | 'declining' | 'stable'> = {
      schemaMarkup: calculateScoreTrend(
        latest.score.breakdown.schemaMarkup,
        earliest.score.breakdown.schemaMarkup
      ),
      contentOptimization: calculateScoreTrend(
        latest.score.breakdown.contentOptimization,
        earliest.score.breakdown.contentOptimization
      ),
      aiSearchPresence: calculateScoreTrend(
        latest.score.breakdown.aiSearchPresence,
        earliest.score.breakdown.aiSearchPresence
      ),
      knowledgeGraphIntegration: calculateScoreTrend(
        latest.score.breakdown.knowledgeGraphIntegration,
        earliest.score.breakdown.knowledgeGraphIntegration
      ),
      socialSignals: calculateScoreTrend(
        latest.score.breakdown.socialSignals,
        earliest.score.breakdown.socialSignals
      ),
      technicalSEO: calculateScoreTrend(
        latest.score.breakdown.technicalSEO,
        earliest.score.breakdown.technicalSEO
      ),
    };

    // Calculate average monthly change
    const daysDiff = (latest.timestamp.getTime() - earliest.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    const monthsDiff = daysDiff / 30;
    const averageMonthlyChange = monthsDiff > 0 ? overallChange / monthsDiff : 0;

    // Find best and worst performing categories
    const categoryChanges = {
      schemaMarkup: latest.score.breakdown.schemaMarkup - earliest.score.breakdown.schemaMarkup,
      contentOptimization: latest.score.breakdown.contentOptimization - earliest.score.breakdown.contentOptimization,
      aiSearchPresence: latest.score.breakdown.aiSearchPresence - earliest.score.breakdown.aiSearchPresence,
      knowledgeGraphIntegration: latest.score.breakdown.knowledgeGraphIntegration - earliest.score.breakdown.knowledgeGraphIntegration,
      socialSignals: latest.score.breakdown.socialSignals - earliest.score.breakdown.socialSignals,
      technicalSEO: latest.score.breakdown.technicalSEO - earliest.score.breakdown.technicalSEO,
    };

    const bestPerformingCategory = Object.entries(categoryChanges).reduce((a, b) => 
      categoryChanges[a[0] as keyof AIVisibilityScoreBreakdown] > categoryChanges[b[0] as keyof AIVisibilityScoreBreakdown] ? a : b
    )[0] as keyof AIVisibilityScoreBreakdown;

    const worstPerformingCategory = Object.entries(categoryChanges).reduce((a, b) => 
      categoryChanges[a[0] as keyof AIVisibilityScoreBreakdown] < categoryChanges[b[0] as keyof AIVisibilityScoreBreakdown] ? a : b
    )[0] as keyof AIVisibilityScoreBreakdown;

    return {
      overallTrend,
      categoryTrends,
      averageMonthlyChange,
      bestPerformingCategory,
      worstPerformingCategory,
    };
  }

  /**
   * Validates scoring weights configuration
   */
  validateScoringWeights(): boolean {
    const totalWeight = Object.values(SCORE_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    return Math.abs(totalWeight - 1.0) < 0.001;
  }

  /**
   * Gets current scoring weights
   */
  getScoringWeights(): typeof SCORE_WEIGHTS {
    return SCORE_WEIGHTS;
  }

  // Helper methods for analyzing website data

  private hasGeographicData(entities: KnowledgeGraphEntity[]): boolean {
    return entities.some(entity => entity.coordinates || entity.serviceArea);
  }

  private hasCertificationData(schemaMarkup: SchemaMarkup[]): boolean {
    return schemaMarkup.some(schema => schema.hasCredential && schema.hasCredential.length > 0);
  }

  private hasFAQContent(websiteAnalysis?: WebsiteAnalysis): boolean {
    if (!websiteAnalysis) return false;
    return websiteAnalysis.recommendations.some(rec => 
      rec.toLowerCase().includes('faq') || rec.toLowerCase().includes('question')
    );
  }

  private hasLocationContent(websiteAnalysis?: WebsiteAnalysis): boolean {
    if (!websiteAnalysis) return false;
    return websiteAnalysis.schemaMarkup.some(schema => 
      schema.address || schema.geo || schema.areaServed
    );
  }

  private hasExpertiseContent(websiteAnalysis?: WebsiteAnalysis): boolean {
    if (!websiteAnalysis) return false;
    return websiteAnalysis.schemaMarkup.some(schema => 
      schema.knowsAbout && schema.knowsAbout.length > 0
    );
  }

  private calculateSemanticMarkupCoverage(websiteAnalysis?: WebsiteAnalysis): number {
    if (!websiteAnalysis) return 0;
    
    const totalPossibleSchemas = 6; // RealEstateAgent, Person, LocalBusiness, Organization, Review, AggregateRating
    const presentSchemas = websiteAnalysis.schemaMarkup.length;
    
    return Math.min(100, (presentSchemas / totalPossibleSchemas) * 100);
  }

  private hasSSL(websiteAnalysis: WebsiteAnalysis): boolean {
    return websiteAnalysis.url.startsWith('https://');
  }

  private isMobileOptimized(websiteAnalysis: WebsiteAnalysis): boolean {
    // Check if mobile optimization issues are mentioned
    return !websiteAnalysis.technicalIssues.some(issue => 
      issue.toLowerCase().includes('mobile') || issue.toLowerCase().includes('responsive')
    );
  }

  private getPageSpeedScore(websiteAnalysis: WebsiteAnalysis): number {
    // Extract page speed score from technical issues or return default
    const speedIssue = websiteAnalysis.technicalIssues.find(issue => 
      issue.toLowerCase().includes('speed') || issue.toLowerCase().includes('performance')
    );
    
    if (speedIssue) {
      // Try to extract numeric score from issue description
      const match = speedIssue.match(/(\d+)/);
      return match ? parseInt(match[1]) : 50; // Default to 50 if mentioned but no score
    }
    
    return 75; // Default score if no speed issues mentioned
  }

  private hasMetaTags(websiteAnalysis: WebsiteAnalysis): boolean {
    // Check if meta tag issues are mentioned
    return !websiteAnalysis.technicalIssues.some(issue => 
      issue.toLowerCase().includes('meta') || issue.toLowerCase().includes('title') || issue.toLowerCase().includes('description')
    );
  }
}

/**
 * Singleton instance for the scoring engine
 */
let scoringEngineInstance: AIVisibilityScoringEngine | null = null;

/**
 * Gets the singleton scoring engine instance
 */
export function getAIVisibilityScoringEngine(): AIVisibilityScoringEngine {
  if (!scoringEngineInstance) {
    scoringEngineInstance = new AIVisibilityScoringEngine();
  }
  return scoringEngineInstance;
}

/**
 * Resets the singleton instance (for testing)
 */
export function resetAIVisibilityScoringEngine(): void {
  scoringEngineInstance = null;
}