/**
 * Optimization Engine Service Implementation
 * 
 * Service for generating AI visibility optimization recommendations
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import type {
  OptimizationRecommendation,
  AIVisibilityScore,
  AIVisibilityScoreBreakdown,
  AIMention,
  SchemaMarkup,
  WebsiteAnalysis,
  RecommendationCategory,
  RecommendationPriority,
  ImplementationDifficulty,
  CompetitorAnalysis,
} from '../types';

import { AIVisibilityRepository } from '../repository';
import { calculateImprovementPotential, getScoreCategory } from '../utils/scoring';
import { 
  handleAIVisibilityOperation, 
  createGracefulAIOperation,
  errorHandler 
} from '../error-handler';
import { 
  AIVisibilityError, 
  DataPersistenceError,
  ConfigurationError 
} from '../errors';

/**
 * Recommendation template for generating specific recommendations
 */
interface RecommendationTemplate {
  category: RecommendationCategory;
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: number;
  implementationDifficulty: ImplementationDifficulty;
  codeExample?: string;
  resources?: string[];
  condition: (input: RecommendationInput) => boolean;
  priority: (input: RecommendationInput) => RecommendationPriority;
}

/**
 * Input data for recommendation generation
 */
interface RecommendationInput {
  userId: string;
  currentScore: AIVisibilityScore;
  mentions: AIMention[];
  schemaMarkup: SchemaMarkup[];
  websiteAnalysis?: WebsiteAnalysis;
  competitorAnalysis?: CompetitorAnalysis;
}

/**
 * Optimization Engine Service Implementation
 */
export class OptimizationEngineService {
  private repository: AIVisibilityRepository;
  private recommendationTemplates: RecommendationTemplate[];

  constructor(repository?: AIVisibilityRepository) {
    this.repository = repository || new AIVisibilityRepository();
    this.recommendationTemplates = this.initializeRecommendationTemplates();
  }

  /**
   * Analyzes current AI visibility and generates recommendations
   */
  async generateRecommendations(
    userId: string,
    currentScore: AIVisibilityScore,
    mentions: AIMention[],
    schemaMarkup: SchemaMarkup[],
    websiteAnalysis?: WebsiteAnalysis
  ): Promise<OptimizationRecommendation[]> {
    return handleAIVisibilityOperation(
      async () => {
        if (!userId) {
          throw new ConfigurationError('User ID is required for recommendation generation', 'userId', ['userId']);
        }

        const competitorAnalysis = await this.repository.getLatestCompetitorAnalysis(userId);

        const input: RecommendationInput = {
          userId,
          currentScore,
          mentions,
          schemaMarkup,
          websiteAnalysis,
          competitorAnalysis: competitorAnalysis || undefined,
        };

        // Generate recommendations based on templates
        const recommendations: OptimizationRecommendation[] = [];

        for (const template of this.recommendationTemplates) {
          if (template.condition(input)) {
            const recommendation: OptimizationRecommendation = {
              id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
              category: template.category,
              priority: template.priority(input),
              title: template.title,
              description: template.description,
              actionItems: template.actionItems,
              estimatedImpact: template.estimatedImpact,
              implementationDifficulty: template.implementationDifficulty,
              codeExample: template.codeExample,
              resources: template.resources,
              status: 'pending',
              createdAt: new Date(),
            };

            recommendations.push(recommendation);
          }
        }

        // Prioritize and limit recommendations
        const prioritizedRecommendations = await this.prioritizeRecommendations(recommendations);

        // Store recommendations in database with error handling
        const storeOperations = prioritizedRecommendations.map(recommendation => ({
          operation: () => this.repository.createOptimizationRecommendation(userId, recommendation),
          operationType: 'storeRecommendation',
          context: { userId, recommendationId: recommendation.id },
        }));

        const storeResults = await errorHandler.handleBatchOperations(storeOperations, {
          failFast: false,
          collectPartialResults: true,
        });

        // Log any storage failures but don't fail the entire operation
        if (storeResults.failureCount > 0) {
          console.warn(`Failed to store ${storeResults.failureCount} recommendations for user ${userId}`);
        }

        return prioritizedRecommendations;
      },
      'generateRecommendations',
      { userId, serviceName: 'optimizationEngine' }
    );
  }

  /**
   * Prioritizes recommendations based on impact and difficulty
   */
  async prioritizeRecommendations(
    recommendations: OptimizationRecommendation[]
  ): Promise<OptimizationRecommendation[]> {
    // Sort by priority (high > medium > low), then by impact (high > low), then by difficulty (easy > medium > hard)
    return recommendations.sort((a, b) => {
      // Priority weight
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Impact weight
      const impactDiff = b.estimatedImpact - a.estimatedImpact;
      if (impactDiff !== 0) return impactDiff;

      // Difficulty weight (easier first)
      const difficultyWeight = { easy: 3, medium: 2, hard: 1 };
      return difficultyWeight[b.implementationDifficulty] - difficultyWeight[a.implementationDifficulty];
    }).slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Estimates the impact of implementing a recommendation
   */
  async estimateImpact(
    recommendation: OptimizationRecommendation,
    currentScore: AIVisibilityScore
  ): Promise<{
    estimatedScoreIncrease: number;
    timeToSeeResults: number; // in days
    confidenceLevel: number; // 0-1
  }> {
    const baseImpact = recommendation.estimatedImpact;
    
    // Adjust impact based on current score (lower scores have higher potential)
    const scoreCategory = getScoreCategory(currentScore.overall);
    const categoryMultiplier = {
      poor: 1.5,
      fair: 1.2,
      good: 1.0,
      excellent: 0.8,
    };

    const adjustedImpact = baseImpact * categoryMultiplier[scoreCategory];

    // Estimate time to see results based on category
    const timeToResults = {
      schema: 7,      // Schema changes show up quickly
      technical: 14,  // Technical fixes take longer
      content: 21,    // Content optimization takes time
      social: 30,     // Social signals build slowly
      competitive: 45, // Competitive changes take longest
    };

    // Confidence based on difficulty and historical data
    const confidenceByDifficulty = {
      easy: 0.9,
      medium: 0.7,
      hard: 0.5,
    };

    return {
      estimatedScoreIncrease: Math.round(adjustedImpact),
      timeToSeeResults: timeToResults[recommendation.category] || 21,
      confidenceLevel: confidenceByDifficulty[recommendation.implementationDifficulty],
    };
  }

  /**
   * Generates implementation steps for a recommendation
   */
  async generateImplementationSteps(
    recommendation: OptimizationRecommendation
  ): Promise<{
    steps: string[];
    codeExamples?: string[];
    resources: string[];
    estimatedTimeHours: number;
  }> {
    const baseSteps = recommendation.actionItems;
    
    // Add category-specific detailed steps
    const detailedSteps = this.generateDetailedSteps(recommendation);
    
    // Estimate time based on difficulty and category
    const timeEstimates = {
      easy: { schema: 2, content: 4, technical: 3, social: 2, competitive: 6 },
      medium: { schema: 6, content: 12, technical: 8, social: 8, competitive: 16 },
      hard: { schema: 16, content: 24, technical: 20, social: 20, competitive: 40 },
    };

    const estimatedTimeHours = timeEstimates[recommendation.implementationDifficulty][recommendation.category] || 8;

    return {
      steps: [...baseSteps, ...detailedSteps],
      codeExamples: recommendation.codeExample ? [recommendation.codeExample] : undefined,
      resources: recommendation.resources || [],
      estimatedTimeHours,
    };
  }

  /**
   * Tracks recommendation completion and measures actual impact
   */
  async trackRecommendationImpact(
    userId: string,
    recommendationId: string,
    beforeScore: AIVisibilityScore,
    afterScore: AIVisibilityScore
  ): Promise<{
    actualImpact: number;
    accuracyScore: number; // how close was the estimate
  }> {
    return handleAIVisibilityOperation(
      async () => {
        if (!userId || !recommendationId) {
          throw new ConfigurationError(
            'User ID and recommendation ID are required',
            'trackingData',
            ['userId', 'recommendationId']
          );
        }

        const actualImpact = afterScore.overall - beforeScore.overall;
        
        // Get the original recommendation to compare with estimate
        const recommendations = await this.repository.getOptimizationRecommendations(userId);
        const recommendation = recommendations.items.find(r => r.id === recommendationId);
        
        if (!recommendation) {
          throw new DataPersistenceError(
            `Recommendation ${recommendationId} not found`,
            'read',
            'recommendation'
          );
        }

        // Calculate accuracy (how close the estimate was to actual)
        const estimatedImpact = recommendation.estimatedImpact;
        const accuracyScore = estimatedImpact > 0 
          ? Math.max(0, 1 - Math.abs(actualImpact - estimatedImpact) / estimatedImpact)
          : 0;

        // Update recommendation with completion data
        await this.repository.updateRecommendationStatus(
          userId,
          recommendationId,
          recommendation.priority,
          recommendation.createdAt.toISOString(),
          'completed',
          new Date()
        );

        return {
          actualImpact,
          accuracyScore,
        };
      },
      'trackRecommendationImpact',
      { userId, serviceName: 'optimizationEngine', metadata: { recommendationId } }
    );
  }

  /**
   * Generates a comprehensive optimization roadmap
   */
  async generateOptimizationRoadmap(
    userId: string,
    targetScore: number,
    timeframeMonths: number
  ): Promise<{
    phases: Array<{
      name: string;
      duration: number; // in weeks
      recommendations: OptimizationRecommendation[];
      expectedScoreIncrease: number;
    }>;
    totalEstimatedTime: number; // in hours
    successProbability: number; // 0-1
  }> {
    // Get current recommendations
    const recommendationsResult = await this.repository.getOptimizationRecommendations(userId);
    const recommendations = recommendationsResult.items;

    // Group recommendations into phases
    const phases = this.groupRecommendationsIntoPhases(recommendations, timeframeMonths);

    // Calculate total time and success probability
    const totalEstimatedTime = phases.reduce((total, phase) => {
      return total + phase.recommendations.reduce((phaseTotal, rec) => {
        const timeEstimate = this.estimateImplementationTime(rec);
        return phaseTotal + timeEstimate;
      }, 0);
    }, 0);

    const successProbability = this.calculateSuccessProbability(phases, targetScore);

    return {
      phases,
      totalEstimatedTime,
      successProbability,
    };
  }

  /**
   * Initialize recommendation templates
   */
  private initializeRecommendationTemplates(): RecommendationTemplate[] {
    return [
      // Schema Markup Recommendations
      {
        category: 'schema',
        title: 'Add RealEstateAgent Schema Markup',
        description: 'Implement comprehensive RealEstateAgent schema markup to help AI systems understand your professional role and expertise.',
        actionItems: [
          'Add RealEstateAgent schema to your website header',
          'Include your certifications and specializations',
          'Add service area information with geographic coordinates',
          'Include contact information and business hours',
        ],
        estimatedImpact: 15,
        implementationDifficulty: 'easy',
        codeExample: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Your Name",
  "knowsAbout": ["Residential Real Estate", "First-Time Buyers"],
  "areaServed": {
    "@type": "Place",
    "name": "Your City, State"
  }
}
</script>`,
        resources: ['https://schema.org/RealEstateAgent'],
        condition: (input) => !input.schemaMarkup.some(s => s['@type'] === 'RealEstateAgent'),
        priority: () => 'high',
      },
      {
        category: 'schema',
        title: 'Add Review Schema Markup',
        description: 'Implement Review and AggregateRating schema to showcase your client testimonials and ratings to AI systems.',
        actionItems: [
          'Convert client testimonials to Review schema format',
          'Calculate and add AggregateRating based on testimonials',
          'Include reviewer information and review dates',
          'Add review schema to testimonial pages',
        ],
        estimatedImpact: 12,
        implementationDifficulty: 'medium',
        condition: (input) => !input.schemaMarkup.some(s => s['@type'] === 'Review') && input.currentScore.breakdown.socialSignals > 30,
        priority: (input) => input.currentScore.breakdown.schemaMarkup < 50 ? 'high' : 'medium',
      },

      // Content Optimization Recommendations
      {
        category: 'content',
        title: 'Create AI-Optimized FAQ Content',
        description: 'Develop comprehensive FAQ content that directly answers common real estate questions AI systems frequently encounter.',
        actionItems: [
          'Research common real estate questions in your market',
          'Create detailed FAQ pages with structured answers',
          'Use clear headings and bullet points for AI parsing',
          'Include location-specific information in answers',
        ],
        estimatedImpact: 18,
        implementationDifficulty: 'medium',
        condition: (input) => input.currentScore.breakdown.contentOptimization < 60,
        priority: (input) => input.currentScore.breakdown.contentOptimization < 40 ? 'high' : 'medium',
      },
      {
        category: 'content',
        title: 'Optimize Content for Entity Recognition',
        description: 'Structure your content to help AI systems identify and understand real estate entities, locations, and expertise areas.',
        actionItems: [
          'Add semantic markup to property descriptions',
          'Use consistent terminology for neighborhoods and areas',
          'Include geographic coordinates in location references',
          'Structure expertise areas with clear categorization',
        ],
        estimatedImpact: 14,
        implementationDifficulty: 'hard',
        condition: (input) => input.currentScore.breakdown.contentOptimization < 70,
        priority: (input) => input.currentScore.breakdown.aiSearchPresence < 50 ? 'high' : 'low',
      },

      // Technical SEO Recommendations
      {
        category: 'technical',
        title: 'Improve Page Speed Performance',
        description: 'Optimize website performance to meet AI system requirements for fast, accessible content.',
        actionItems: [
          'Optimize images and implement lazy loading',
          'Minify CSS and JavaScript files',
          'Enable compression and caching',
          'Use a content delivery network (CDN)',
        ],
        estimatedImpact: 10,
        implementationDifficulty: 'medium',
        condition: (input) => input.currentScore.breakdown.technicalSEO < 70,
        priority: (input) => input.currentScore.breakdown.technicalSEO < 50 ? 'medium' : 'low',
      },

      // AI Search Presence Recommendations
      {
        category: 'competitive',
        title: 'Improve AI Platform Visibility',
        description: 'Increase your presence and positive mentions across AI platforms through strategic content optimization.',
        actionItems: [
          'Create content that answers specific local market questions',
          'Optimize for voice search and conversational queries',
          'Build authoritative content on market trends',
          'Engage with AI platform training data sources',
        ],
        estimatedImpact: 20,
        implementationDifficulty: 'hard',
        condition: (input) => input.currentScore.breakdown.aiSearchPresence < 50,
        priority: (input) => input.mentions.length < 5 ? 'high' : 'medium',
      },

      // Social Signals Recommendations
      {
        category: 'social',
        title: 'Enhance Social Media Integration',
        description: 'Strengthen social signals and cross-platform presence to improve AI system recognition.',
        actionItems: [
          'Add sameAs schema references to social profiles',
          'Maintain consistent NAP across all platforms',
          'Increase social engagement and content sharing',
          'Connect social profiles to your main website',
        ],
        estimatedImpact: 8,
        implementationDifficulty: 'easy',
        condition: (input) => input.currentScore.breakdown.socialSignals < 60,
        priority: (input) => input.currentScore.breakdown.socialSignals < 30 ? 'medium' : 'low',
      },
    ];
  }

  /**
   * Generate detailed implementation steps for a recommendation
   */
  private generateDetailedSteps(recommendation: OptimizationRecommendation): string[] {
    const categorySteps = {
      schema: [
        'Validate schema markup using Google\'s Structured Data Testing Tool',
        'Test schema implementation across different pages',
        'Monitor schema markup in search console',
      ],
      content: [
        'Conduct keyword research for AI-optimized content',
        'Create content calendar for consistent publishing',
        'Monitor content performance and AI mentions',
      ],
      technical: [
        'Run performance audits using Lighthouse',
        'Test website on multiple devices and browsers',
        'Monitor Core Web Vitals metrics',
      ],
      social: [
        'Audit current social media presence',
        'Create social media content strategy',
        'Set up social media monitoring tools',
      ],
      competitive: [
        'Analyze competitor AI visibility strategies',
        'Identify content gaps and opportunities',
        'Monitor competitive positioning changes',
      ],
    };

    return categorySteps[recommendation.category] || [];
  }

  /**
   * Estimate implementation time for a recommendation
   */
  private estimateImplementationTime(recommendation: OptimizationRecommendation): number {
    const baseHours = {
      easy: { schema: 2, content: 4, technical: 3, social: 2, competitive: 6 },
      medium: { schema: 6, content: 12, technical: 8, social: 8, competitive: 16 },
      hard: { schema: 16, content: 24, technical: 20, social: 20, competitive: 40 },
    };

    return baseHours[recommendation.implementationDifficulty][recommendation.category] || 8;
  }

  /**
   * Group recommendations into implementation phases
   */
  private groupRecommendationsIntoPhases(
    recommendations: OptimizationRecommendation[],
    timeframeMonths: number
  ): Array<{
    name: string;
    duration: number;
    recommendations: OptimizationRecommendation[];
    expectedScoreIncrease: number;
  }> {
    const weeksAvailable = timeframeMonths * 4;
    const phases: Array<{
      name: string;
      duration: number;
      recommendations: OptimizationRecommendation[];
      expectedScoreIncrease: number;
    }> = [];

    // Phase 1: Quick wins (high priority, easy implementation)
    const quickWins = recommendations.filter(r => 
      r.priority === 'high' && r.implementationDifficulty === 'easy'
    );
    if (quickWins.length > 0) {
      phases.push({
        name: 'Quick Wins',
        duration: Math.min(2, weeksAvailable / 4),
        recommendations: quickWins,
        expectedScoreIncrease: quickWins.reduce((sum, r) => sum + r.estimatedImpact, 0),
      });
    }

    // Phase 2: Foundation building (schema and technical)
    const foundation = recommendations.filter(r => 
      ['schema', 'technical'].includes(r.category) && r.priority !== 'low'
    );
    if (foundation.length > 0) {
      phases.push({
        name: 'Foundation Building',
        duration: Math.min(4, weeksAvailable / 3),
        recommendations: foundation,
        expectedScoreIncrease: foundation.reduce((sum, r) => sum + r.estimatedImpact, 0),
      });
    }

    // Phase 3: Content optimization
    const content = recommendations.filter(r => 
      r.category === 'content' && r.priority !== 'low'
    );
    if (content.length > 0) {
      phases.push({
        name: 'Content Optimization',
        duration: Math.min(6, weeksAvailable / 2),
        recommendations: content,
        expectedScoreIncrease: content.reduce((sum, r) => sum + r.estimatedImpact, 0),
      });
    }

    // Phase 4: Advanced optimization
    const advanced = recommendations.filter(r => 
      ['social', 'competitive'].includes(r.category) || r.implementationDifficulty === 'hard'
    );
    if (advanced.length > 0) {
      phases.push({
        name: 'Advanced Optimization',
        duration: Math.max(2, weeksAvailable - phases.reduce((sum, p) => sum + p.duration, 0)),
        recommendations: advanced,
        expectedScoreIncrease: advanced.reduce((sum, r) => sum + r.estimatedImpact, 0),
      });
    }

    return phases;
  }

  /**
   * Calculate success probability for reaching target score
   */
  private calculateSuccessProbability(
    phases: Array<{ expectedScoreIncrease: number; recommendations: OptimizationRecommendation[] }>,
    targetScore: number
  ): number {
    const totalExpectedIncrease = phases.reduce((sum, phase) => sum + phase.expectedScoreIncrease, 0);
    
    // Base probability on expected increase vs target
    let baseProbability = Math.min(1, totalExpectedIncrease / targetScore);
    
    // Adjust for implementation difficulty
    const totalRecommendations = phases.reduce((sum, phase) => sum + phase.recommendations.length, 0);
    const hardRecommendations = phases.reduce((sum, phase) => 
      sum + phase.recommendations.filter(r => r.implementationDifficulty === 'hard').length, 0
    );
    
    const difficultyFactor = 1 - (hardRecommendations / totalRecommendations) * 0.3;
    
    return Math.max(0.1, Math.min(0.95, baseProbability * difficultyFactor));
  }
}

/**
 * Singleton instance for the optimization engine
 */
let optimizationEngineInstance: OptimizationEngineService | null = null;

/**
 * Gets the singleton optimization engine instance
 */
export function getOptimizationEngineService(): OptimizationEngineService {
  if (!optimizationEngineInstance) {
    optimizationEngineInstance = new OptimizationEngineService();
  }
  return optimizationEngineInstance;
}

/**
 * Resets the singleton instance (for testing)
 */
export function resetOptimizationEngineService(): void {
  optimizationEngineInstance = null;
}