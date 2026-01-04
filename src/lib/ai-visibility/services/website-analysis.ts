/**
 * Website Analysis and Validation System
 * 
 * Comprehensive website analysis combining crawling, schema validation, and optimization recommendations
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { WebsiteAnalysis, ValidationResult, SchemaMarkup, OptimizationRecommendation } from '../types';
import { WebsiteAnalysisSchema } from '../schemas';
import { websiteCrawler, CrawlConfig, TechnicalSEOIssue } from './website-crawler';
import { schemaValidator, DetailedValidationReport } from './schema-validator';
import { getOptimizationEngineService } from './optimization-engine';
import { 
  handleAIVisibilityOperation, 
  createGracefulAIOperation 
} from '../error-handler';
import { 
  AIVisibilityError, 
  WebsiteAnalysisError,
  ConfigurationError 
} from '../errors';

/**
 * Website analysis configuration
 */
export interface WebsiteAnalysisConfig {
  crawlConfig?: Partial<CrawlConfig>;
  includeCompetitorAnalysis?: boolean;
  generateOptimizationRecommendations?: boolean;
  performTechnicalSEOAudit?: boolean;
  validateAllSchemas?: boolean;
}

/**
 * Comprehensive website analysis result
 */
export interface ComprehensiveWebsiteAnalysis extends WebsiteAnalysis {
  detailedValidationReports: DetailedValidationReport[];
  technicalSEOIssues: TechnicalSEOIssue[];
  optimizationRecommendations: OptimizationRecommendation[];
  aiVisibilityScore: number;
  improvementPotential: number;
  prioritizedActions: PrioritizedAction[];
}

/**
 * Prioritized action for website improvement
 */
export interface PrioritizedAction {
  id: string;
  title: string;
  description: string;
  category: 'schema' | 'technical' | 'content' | 'seo';
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedImpact: number; // 0-100
  implementationDifficulty: 'easy' | 'medium' | 'hard';
  codeExample?: string;
  resources?: string[];
  estimatedTimeHours: number;
}

/**
 * Re-validation schedule
 */
export interface RevalidationSchedule {
  userId: string;
  websiteUrl: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextValidation: Date;
  alertOnChanges: boolean;
  alertThresholds: {
    newErrors: number;
    removedSchemas: number;
    scoreDecrease: number;
  };
}

/**
 * Website Analysis Service Interface
 */
export interface WebsiteAnalysisService {
  /**
   * Perform comprehensive website analysis
   */
  analyzeWebsite(url: string, config?: WebsiteAnalysisConfig): Promise<ComprehensiveWebsiteAnalysis>;
  
  /**
   * Quick schema validation for a website
   */
  quickSchemaValidation(url: string): Promise<ValidationResult[]>;
  
  /**
   * Generate fix recommendations with code examples
   */
  generateFixRecommendations(analysis: ComprehensiveWebsiteAnalysis): PrioritizedAction[];
  
  /**
   * Set up automatic re-validation system
   */
  setupAutomaticRevalidation(schedule: RevalidationSchedule): Promise<void>;
  
  /**
   * Get re-validation history for a website
   */
  getRevalidationHistory(userId: string, websiteUrl: string, limit?: number): Promise<ComprehensiveWebsiteAnalysis[]>;
  
  /**
   * Compare two website analyses
   */
  compareAnalyses(before: ComprehensiveWebsiteAnalysis, after: ComprehensiveWebsiteAnalysis): AnalysisComparison;
}

/**
 * Analysis comparison result
 */
export interface AnalysisComparison {
  scoreChange: number;
  newIssues: string[];
  resolvedIssues: string[];
  newSchemas: SchemaMarkup[];
  removedSchemas: SchemaMarkup[];
  improvementSummary: string;
  regressionSummary: string;
}

/**
 * Advanced Website Analysis Service Implementation
 */
export class AdvancedWebsiteAnalysisService implements WebsiteAnalysisService {
  private revalidationSchedules = new Map<string, RevalidationSchedule>();
  private analysisHistory = new Map<string, ComprehensiveWebsiteAnalysis[]>();

  /**
   * Perform comprehensive website analysis
   */
  async analyzeWebsite(url: string, config: WebsiteAnalysisConfig = {}): Promise<ComprehensiveWebsiteAnalysis> {
    return handleAIVisibilityOperation(
      async () => {
        if (!url) {
          throw new ConfigurationError(
            'Website URL is required for analysis',
            'analysis',
            ['url']
          );
        }

        // Validate URL format
        try {
          new URL(url);
        } catch (error) {
          throw new WebsiteAnalysisError(
            'Invalid website URL format',
            url,
            'URL validation failed'
          );
        }

        try {
          // Step 1: Crawl the website
          const basicAnalysis = await websiteCrawler.crawlWebsite(url, config.crawlConfig);
          
          // Step 2: Perform detailed schema validation
          const detailedValidationReports: DetailedValidationReport[] = [];
          if (config.validateAllSchemas !== false) {
            for (const schema of basicAnalysis.schemaMarkup) {
              const report = schemaValidator.getDetailedValidationReport(schema);
              detailedValidationReports.push(report);
            }
          }

          // Step 3: Analyze technical SEO issues
          let technicalSEOIssues: TechnicalSEOIssue[] = [];
          if (config.performTechnicalSEOAudit !== false) {
            technicalSEOIssues = await this.analyzeTechnicalSEO(url, config.crawlConfig);
          }

          // Step 4: Generate optimization recommendations
          let optimizationRecommendations: OptimizationRecommendation[] = [];
          if (config.generateOptimizationRecommendations !== false) {
            optimizationRecommendations = await this.generateOptimizationRecommendations(
              basicAnalysis,
              detailedValidationReports,
              technicalSEOIssues
            );
          }

          // Step 5: Calculate AI visibility score
          const aiVisibilityScore = this.calculateAIVisibilityScore(
            basicAnalysis,
            detailedValidationReports,
            technicalSEOIssues
          );

          // Step 6: Calculate improvement potential
          const improvementPotential = this.calculateImprovementPotential(
            aiVisibilityScore,
            optimizationRecommendations
          );

          // Step 7: Generate prioritized actions
          const prioritizedActions = this.generatePrioritizedActions(
            basicAnalysis,
            detailedValidationReports,
            technicalSEOIssues,
            optimizationRecommendations
          );

          const comprehensiveAnalysis: ComprehensiveWebsiteAnalysis = {
            ...basicAnalysis,
            detailedValidationReports,
            technicalSEOIssues,
            optimizationRecommendations,
            aiVisibilityScore,
            improvementPotential,
            prioritizedActions,
          };

          // Store in history
          this.storeAnalysisInHistory(url, comprehensiveAnalysis);

          return comprehensiveAnalysis;
        } catch (error) {
          throw new WebsiteAnalysisError(
            'Website analysis failed',
            url,
            error instanceof Error ? error.message : 'Unknown analysis error',
            true,
            error instanceof Error ? error : undefined
          );
        }
      },
      'analyzeWebsite',
      { serviceName: 'websiteAnalysis', metadata: { url } }
    );
  }

  /**
   * Quick schema validation for a website
   */
  async quickSchemaValidation(url: string): Promise<ValidationResult[]> {
    return handleAIVisibilityOperation(
      async () => {
        if (!url) {
          throw new ConfigurationError(
            'Website URL is required for schema validation',
            'validation',
            ['url']
          );
        }

        // Validate URL format
        try {
          new URL(url);
        } catch (error) {
          throw new WebsiteAnalysisError(
            'Invalid website URL format',
            url,
            'URL validation failed'
          );
        }

        return websiteCrawler.validateWebsiteSchemas(url);
      },
      'quickSchemaValidation',
      { serviceName: 'websiteAnalysis', metadata: { url } }
    );
  }

  /**
   * Generate fix recommendations with code examples
   */
  generateFixRecommendations(analysis: ComprehensiveWebsiteAnalysis): PrioritizedAction[] {
    return analysis.prioritizedActions;
  }

  /**
   * Set up automatic re-validation system
   */
  async setupAutomaticRevalidation(schedule: RevalidationSchedule): Promise<void> {
    const key = `${schedule.userId}:${schedule.websiteUrl}`;
    this.revalidationSchedules.set(key, schedule);
    
    // In a real implementation, this would integrate with a job scheduler
    console.log(`Automatic re-validation scheduled for ${schedule.websiteUrl}`);
  }

  /**
   * Get re-validation history for a website
   */
  async getRevalidationHistory(
    userId: string, 
    websiteUrl: string, 
    limit: number = 10
  ): Promise<ComprehensiveWebsiteAnalysis[]> {
    const key = `${userId}:${websiteUrl}`;
    const history = this.analysisHistory.get(key) || [];
    return history.slice(-limit);
  }

  /**
   * Compare two website analyses
   */
  compareAnalyses(
    before: ComprehensiveWebsiteAnalysis, 
    after: ComprehensiveWebsiteAnalysis
  ): AnalysisComparison {
    const scoreChange = after.aiVisibilityScore - before.aiVisibilityScore;
    
    // Find new and resolved issues
    const beforeIssues = new Set(before.technicalIssues);
    const afterIssues = new Set(after.technicalIssues);
    
    const newIssues = Array.from(afterIssues).filter(issue => !beforeIssues.has(issue));
    const resolvedIssues = Array.from(beforeIssues).filter(issue => !afterIssues.has(issue));

    // Find schema changes
    const beforeSchemas = before.schemaMarkup.map(s => JSON.stringify(s));
    const afterSchemas = after.schemaMarkup.map(s => JSON.stringify(s));
    
    const newSchemas = after.schemaMarkup.filter((_, i) => !beforeSchemas.includes(afterSchemas[i]));
    const removedSchemas = before.schemaMarkup.filter((_, i) => !afterSchemas.includes(beforeSchemas[i]));

    // Generate summaries
    const improvementSummary = this.generateImprovementSummary(scoreChange, resolvedIssues, newSchemas);
    const regressionSummary = this.generateRegressionSummary(scoreChange, newIssues, removedSchemas);

    return {
      scoreChange,
      newIssues,
      resolvedIssues,
      newSchemas,
      removedSchemas,
      improvementSummary,
      regressionSummary,
    };
  }

  /**
   * Analyze technical SEO issues
   */
  private async analyzeTechnicalSEO(url: string, crawlConfig?: Partial<CrawlConfig>): Promise<TechnicalSEOIssue[]> {
    // This would integrate with the website crawler's technical analysis
    // For now, return basic issues based on URL analysis
    const issues: TechnicalSEOIssue[] = [];

    try {
      const urlObj = new URL(url);
      
      // Check HTTPS
      if (urlObj.protocol !== 'https:') {
        issues.push({
          type: 'missing_meta',
          severity: 'high',
          description: 'Website is not using HTTPS',
          recommendation: 'Implement SSL certificate for security and SEO benefits',
          codeExample: 'Redirect all HTTP traffic to HTTPS',
        });
      }

      // Check for common SEO issues (would be expanded with real crawling data)
      issues.push({
        type: 'missing_meta',
        severity: 'medium',
        description: 'Potential missing structured data',
        recommendation: 'Add comprehensive schema markup for better AI visibility',
        codeExample: this.generateBasicSchemaExample(),
      });

    } catch (error) {
      issues.push({
        type: 'missing_meta',
        severity: 'critical',
        description: 'Invalid website URL',
        recommendation: 'Provide a valid website URL',
      });
    }

    return issues;
  }

  /**
   * Generate optimization recommendations
   */
  private async generateOptimizationRecommendations(
    analysis: WebsiteAnalysis,
    validationReports: DetailedValidationReport[],
    technicalIssues: TechnicalSEOIssue[]
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Schema-related recommendations
    if (analysis.schemaMarkup.length === 0) {
      recommendations.push({
        id: `schema-${Date.now()}`,
        category: 'schema',
        priority: 'high',
        title: 'Add Basic Schema Markup',
        description: 'Your website has no structured data markup, which limits AI visibility',
        actionItems: [
          'Add RealEstateAgent schema markup',
          'Include contact information and service areas',
          'Add business address and phone number',
          'Validate schema markup implementation'
        ],
        estimatedImpact: 85,
        implementationDifficulty: 'medium',
        codeExample: this.generateBasicSchemaExample(),
        status: 'pending',
        createdAt: new Date(),
      });
    }

    // Validation error recommendations
    const hasValidationErrors = validationReports.some(r => !r.isValid);
    if (hasValidationErrors) {
      recommendations.push({
        id: `validation-${Date.now()}`,
        category: 'schema',
        priority: 'high',
        title: 'Fix Schema Validation Errors',
        description: 'Existing schema markup has validation errors that prevent proper AI interpretation',
        actionItems: [
          'Review schema validation errors',
          'Fix required property issues',
          'Correct data type mismatches',
          'Re-validate after fixes'
        ],
        estimatedImpact: 70,
        implementationDifficulty: 'easy',
        status: 'pending',
        createdAt: new Date(),
      });
    }

    // Technical SEO recommendations
    const criticalTechnicalIssues = technicalIssues.filter(i => i.severity === 'critical');
    if (criticalTechnicalIssues.length > 0) {
      recommendations.push({
        id: `technical-${Date.now()}`,
        category: 'technical',
        priority: 'high',
        title: 'Address Critical Technical Issues',
        description: 'Critical technical issues are preventing optimal AI crawling and indexing',
        actionItems: criticalTechnicalIssues.map(issue => issue.recommendation),
        estimatedImpact: 90,
        implementationDifficulty: 'hard',
        status: 'pending',
        createdAt: new Date(),
      });
    }

    return recommendations;
  }

  /**
   * Calculate AI visibility score
   */
  private calculateAIVisibilityScore(
    analysis: WebsiteAnalysis,
    validationReports: DetailedValidationReport[],
    technicalIssues: TechnicalSEOIssue[]
  ): number {
    let score = 0;

    // Schema markup presence (40 points)
    if (analysis.schemaMarkup.length > 0) {
      score += 20;
      
      // Additional points for schema variety
      const schemaTypes = new Set(analysis.schemaMarkup.map(s => s['@type']));
      score += Math.min(schemaTypes.size * 5, 20);
    }

    // Schema validation quality (30 points)
    if (validationReports.length > 0) {
      const avgCompletenessScore = validationReports.reduce((sum, r) => sum + r.completenessScore, 0) / validationReports.length;
      score += (avgCompletenessScore / 100) * 30;
    }

    // Technical SEO (30 points)
    const criticalIssues = technicalIssues.filter(i => i.severity === 'critical').length;
    const highIssues = technicalIssues.filter(i => i.severity === 'high').length;
    const mediumIssues = technicalIssues.filter(i => i.severity === 'medium').length;
    
    const technicalPenalty = (criticalIssues * 10) + (highIssues * 5) + (mediumIssues * 2);
    score += Math.max(30 - technicalPenalty, 0);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Calculate improvement potential
   */
  private calculateImprovementPotential(
    currentScore: number,
    recommendations: OptimizationRecommendation[]
  ): number {
    const maxPossibleImprovement = recommendations.reduce(
      (sum, rec) => sum + rec.estimatedImpact,
      0
    );
    
    const potentialScore = Math.min(currentScore + (maxPossibleImprovement * 0.7), 100);
    return Math.round(potentialScore - currentScore);
  }

  /**
   * Generate prioritized actions
   */
  private generatePrioritizedActions(
    analysis: WebsiteAnalysis,
    validationReports: DetailedValidationReport[],
    technicalIssues: TechnicalSEOIssue[],
    recommendations: OptimizationRecommendation[]
  ): PrioritizedAction[] {
    const actions: PrioritizedAction[] = [];

    // Convert technical issues to actions
    for (const issue of technicalIssues) {
      actions.push({
        id: `tech-${Date.now()}-${Math.random()}`,
        title: issue.description,
        description: issue.recommendation,
        category: 'technical',
        priority: issue.severity === 'critical' ? 'critical' : 
                 issue.severity === 'high' ? 'high' : 
                 issue.severity === 'medium' ? 'medium' : 'low',
        estimatedImpact: issue.severity === 'critical' ? 90 : 
                        issue.severity === 'high' ? 70 : 
                        issue.severity === 'medium' ? 50 : 30,
        implementationDifficulty: 'medium',
        codeExample: issue.codeExample,
        estimatedTimeHours: issue.severity === 'critical' ? 8 : 
                           issue.severity === 'high' ? 4 : 
                           issue.severity === 'medium' ? 2 : 1,
      });
    }

    // Convert recommendations to actions
    for (const rec of recommendations) {
      actions.push({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        category: rec.category,
        priority: rec.priority === 'high' ? 'high' : 
                 rec.priority === 'medium' ? 'medium' : 'low',
        estimatedImpact: rec.estimatedImpact,
        implementationDifficulty: rec.implementationDifficulty,
        codeExample: rec.codeExample,
        resources: rec.resources,
        estimatedTimeHours: rec.implementationDifficulty === 'easy' ? 1 : 
                           rec.implementationDifficulty === 'medium' ? 4 : 8,
      });
    }

    // Sort by priority and impact
    return actions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.estimatedImpact - a.estimatedImpact;
    });
  }

  /**
   * Store analysis in history
   */
  private storeAnalysisInHistory(url: string, analysis: ComprehensiveWebsiteAnalysis): void {
    const key = url;
    const history = this.analysisHistory.get(key) || [];
    history.push(analysis);
    
    // Keep only last 50 analyses
    if (history.length > 50) {
      history.shift();
    }
    
    this.analysisHistory.set(key, history);
  }

  /**
   * Generate improvement summary
   */
  private generateImprovementSummary(
    scoreChange: number,
    resolvedIssues: string[],
    newSchemas: SchemaMarkup[]
  ): string {
    const parts: string[] = [];
    
    if (scoreChange > 0) {
      parts.push(`AI visibility score improved by ${scoreChange} points`);
    }
    
    if (resolvedIssues.length > 0) {
      parts.push(`${resolvedIssues.length} technical issues resolved`);
    }
    
    if (newSchemas.length > 0) {
      parts.push(`${newSchemas.length} new schema markup(s) added`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No significant improvements detected';
  }

  /**
   * Generate regression summary
   */
  private generateRegressionSummary(
    scoreChange: number,
    newIssues: string[],
    removedSchemas: SchemaMarkup[]
  ): string {
    const parts: string[] = [];
    
    if (scoreChange < 0) {
      parts.push(`AI visibility score decreased by ${Math.abs(scoreChange)} points`);
    }
    
    if (newIssues.length > 0) {
      parts.push(`${newIssues.length} new technical issues detected`);
    }
    
    if (removedSchemas.length > 0) {
      parts.push(`${removedSchemas.length} schema markup(s) removed`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No regressions detected';
  }

  /**
   * Generate basic schema example
   */
  private generateBasicSchemaExample(): string {
    return `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  "name": "Your Name",
  "email": "your.email@example.com",
  "telephone": "+1-555-123-4567",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "123 Main St",
    "addressLocality": "Your City",
    "addressRegion": "Your State",
    "postalCode": "12345",
    "addressCountry": "US"
  },
  "areaServed": [{
    "@type": "Place",
    "name": "Your Service Area"
  }]
}
</script>`;
  }
}

/**
 * Create and export a singleton instance
 */
export const websiteAnalysisService = new AdvancedWebsiteAnalysisService();

/**
 * Convenience function to analyze a website
 */
export async function analyzeWebsiteComprehensively(
  url: string,
  config?: WebsiteAnalysisConfig
): Promise<ComprehensiveWebsiteAnalysis> {
  return websiteAnalysisService.analyzeWebsite(url, config);
}

/**
 * Convenience function for quick schema validation
 */
export async function quickValidateWebsiteSchemas(url: string): Promise<ValidationResult[]> {
  return websiteAnalysisService.quickSchemaValidation(url);
}

/**
 * Convenience function to set up automatic re-validation
 */
export async function setupWebsiteRevalidation(schedule: RevalidationSchedule): Promise<void> {
  return websiteAnalysisService.setupAutomaticRevalidation(schedule);
}