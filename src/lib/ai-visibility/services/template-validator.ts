/**
 * Template Validation Service
 * 
 * Validates templates against AI system preferences and best practices
 * Requirements: 9.4, 9.5
 */

import { ContentTemplate, TemplateGenerationResult } from './content-templates';
import { SchemaMarkup, ValidationResult } from '../types';

/**
 * AI system preferences for content optimization
 */
export interface AISystemPreferences {
  /** Preferred content structure patterns */
  structurePatterns: {
    headingHierarchy: boolean;
    bulletPoints: boolean;
    numberedLists: boolean;
    faqFormat: boolean;
    tableStructure: boolean;
  };
  
  /** Schema markup requirements */
  schemaRequirements: {
    requiredTypes: string[];
    optionalTypes: string[];
    minimumProperties: number;
  };
  
  /** Content formatting preferences */
  formatting: {
    maxSentenceLength: number;
    maxParagraphLength: number;
    minHeadingCount: number;
    preferredWordCount: { min: number; max: number };
  };
  
  /** SEO optimization requirements */
  seoRequirements: {
    h1Required: boolean;
    metaDescriptionLength: { min: number; max: number };
    keywordDensity: { min: number; max: number };
    internalLinksMin: number;
  };
}

/**
 * Validation severity levels
 */
export type ValidationSeverity = 'error' | 'warning' | 'suggestion';

/**
 * Validation issue
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  category: 'structure' | 'schema' | 'formatting' | 'seo' | 'ai_optimization';
  message: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  autoFixable: boolean;
}

/**
 * Comprehensive validation result
 */
export interface ComprehensiveValidationResult extends ValidationResult {
  score: number;
  issues: ValidationIssue[];
  aiCompatibilityScore: number;
  seoScore: number;
  recommendations: string[];
  autoFixSuggestions: string[];
}

/**
 * Template Validator Service
 */
export class TemplateValidator {
  private aiSystemPreferences: AISystemPreferences;

  constructor() {
    this.aiSystemPreferences = this.getDefaultAIPreferences();
  }

  /**
   * Validate template against AI system preferences
   */
  validateTemplate(template: ContentTemplate): ComprehensiveValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Validate structure
    issues.push(...this.validateStructure(template));
    
    // Validate schema markup
    issues.push(...this.validateSchemaMarkup(template));
    
    // Validate AI optimization features
    issues.push(...this.validateAIOptimization(template));
    
    // Validate SEO elements
    issues.push(...this.validateSEOElements(template));
    
    // Calculate scores
    const scores = this.calculateScores(template, issues);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(issues);
    const autoFixSuggestions = this.generateAutoFixSuggestions(issues);
    
    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      errors: issues.filter(i => i.severity === 'error').map(i => i.message),
      warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
      suggestions: issues.filter(i => i.severity === 'suggestion').map(i => i.message),
      score: scores.overall,
      issues,
      aiCompatibilityScore: scores.aiCompatibility,
      seoScore: scores.seo,
      recommendations,
      autoFixSuggestions
    };
  }

  /**
   * Validate generated content
   */
  validateGeneratedContent(result: TemplateGenerationResult): ComprehensiveValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Validate content structure
    issues.push(...this.validateContentStructure(result.content));
    
    // Validate schema markup in result
    issues.push(...this.validateGeneratedSchemaMarkup(result.schemaMarkup));
    
    // Validate AI readability
    issues.push(...this.validateAIReadability(result.content, result.metadata.aiReadabilityScore));
    
    // Validate SEO elements in content
    issues.push(...this.validateContentSEO(result.content));
    
    const scores = this.calculateContentScores(result, issues);
    const recommendations = this.generateContentRecommendations(issues, result);
    
    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      errors: issues.filter(i => i.severity === 'error').map(i => i.message),
      warnings: issues.filter(i => i.severity === 'warning').map(i => i.message),
      suggestions: issues.filter(i => i.severity === 'suggestion').map(i => i.message),
      score: scores.overall,
      issues,
      aiCompatibilityScore: scores.aiCompatibility,
      seoScore: scores.seo,
      recommendations,
      autoFixSuggestions: this.generateAutoFixSuggestions(issues)
    };
  }

  /**
   * Update AI system preferences
   */
  updateAIPreferences(preferences: Partial<AISystemPreferences>): void {
    this.aiSystemPreferences = { ...this.aiSystemPreferences, ...preferences };
  }

  /**
   * Get current AI system preferences
   */
  getAIPreferences(): AISystemPreferences {
    return { ...this.aiSystemPreferences };
  }

  /**
   * Private validation methods
   */

  /**
   * Validate template structure
   */
  private validateStructure(template: ContentTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const { structure } = template;

    // Check for heading hierarchy
    const hasHeading = structure.sections.some(s => s.type === 'heading');
    if (!hasHeading) {
      issues.push({
        severity: 'error',
        category: 'structure',
        message: 'Template must include at least one heading section',
        suggestion: 'Add a heading section with H1 tag for main title',
        impact: 'high',
        autoFixable: true
      });
    }

    // Check for structured content
    const hasStructuredContent = structure.sections.some(s => 
      s.type === 'list' || s.type === 'faq' || s.type === 'structured_data'
    );
    if (!hasStructuredContent) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: 'Template lacks structured content elements',
        suggestion: 'Add bullet points, FAQ sections, or structured data for better AI parsing',
        impact: 'medium',
        autoFixable: false
      });
    }

    // Check structure score
    if (structure.structureScore < 80) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: `Template structure score (${structure.structureScore}) below recommended threshold (80)`,
        suggestion: 'Improve template structure based on AI optimization guidelines',
        impact: 'medium',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Validate schema markup
   */
  private validateSchemaMarkup(template: ContentTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (template.schemaMarkup.length === 0) {
      issues.push({
        severity: 'error',
        category: 'schema',
        message: 'Template must include schema markup for AI optimization',
        suggestion: 'Add appropriate schema.org markup based on content type',
        impact: 'high',
        autoFixable: true
      });
      return issues;
    }

    // Validate each schema markup
    for (const schema of template.schemaMarkup) {
      issues.push(...this.validateIndividualSchema(schema));
    }

    return issues;
  }

  /**
   * Validate individual schema markup
   */
  private validateIndividualSchema(schema: SchemaMarkup): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check required properties
    if (!schema['@context']) {
      issues.push({
        severity: 'error',
        category: 'schema',
        message: 'Schema markup missing @context property',
        suggestion: 'Add "@context": "https://schema.org" to schema markup',
        impact: 'high',
        autoFixable: true
      });
    }

    if (!schema['@type']) {
      issues.push({
        severity: 'error',
        category: 'schema',
        message: 'Schema markup missing @type property',
        suggestion: 'Add appropriate @type property (e.g., "FAQPage", "Service", "RealEstateAgent")',
        impact: 'high',
        autoFixable: false
      });
    }

    if (!schema.name) {
      issues.push({
        severity: 'warning',
        category: 'schema',
        message: 'Schema markup missing name property',
        suggestion: 'Add descriptive name property for better AI understanding',
        impact: 'medium',
        autoFixable: false
      });
    }

    // Check for description
    if (!schema.description) {
      issues.push({
        severity: 'suggestion',
        category: 'schema',
        message: 'Schema markup could benefit from description property',
        suggestion: 'Add description property to provide more context to AI systems',
        impact: 'low',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Validate AI optimization features
   */
  private validateAIOptimization(template: ContentTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (template.aiOptimizationFeatures.length < 3) {
      issues.push({
        severity: 'warning',
        category: 'ai_optimization',
        message: 'Template has insufficient AI optimization features',
        suggestion: 'Add more AI-specific optimizations like FAQ structure, entity markup, voice search optimization',
        impact: 'medium',
        autoFixable: false
      });
    }

    // Check for specific AI optimization features
    const requiredFeatures = ['schema markup', 'structured content', 'natural language'];
    const missingFeatures = requiredFeatures.filter(feature => 
      !template.aiOptimizationFeatures.some(f => f.toLowerCase().includes(feature))
    );

    if (missingFeatures.length > 0) {
      issues.push({
        severity: 'suggestion',
        category: 'ai_optimization',
        message: `Template missing recommended AI features: ${missingFeatures.join(', ')}`,
        suggestion: 'Consider adding these AI optimization features for better performance',
        impact: 'low',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Validate SEO elements
   */
  private validateSEOElements(template: ContentTemplate): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (template.seoOptimizations.length < 2) {
      issues.push({
        severity: 'warning',
        category: 'seo',
        message: 'Template has insufficient SEO optimizations',
        suggestion: 'Add more SEO optimizations like heading structure, keyword optimization, meta tags',
        impact: 'medium',
        autoFixable: false
      });
    }

    // Check for required SEO optimization types
    const requiredSEOTypes = ['heading_structure', 'schema_markup'];
    const missingSEOTypes = requiredSEOTypes.filter(type => 
      !template.seoOptimizations.some(opt => opt.type === type)
    );

    if (missingSEOTypes.length > 0) {
      issues.push({
        severity: 'suggestion',
        category: 'seo',
        message: `Template missing recommended SEO optimizations: ${missingSEOTypes.join(', ')}`,
        suggestion: 'Add these SEO optimizations for better search visibility',
        impact: 'low',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Validate content structure
   */
  private validateContentStructure(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for H1 heading
    if (!/^#\s+.+$/m.test(content)) {
      issues.push({
        severity: 'error',
        category: 'structure',
        message: 'Content missing H1 heading',
        suggestion: 'Add an H1 heading at the beginning of the content',
        impact: 'high',
        autoFixable: true
      });
    }

    // Check for structured elements
    const hasBulletPoints = /^[\*\-\+]\s+.+$/m.test(content);
    const hasNumberedList = /^\d+\.\s+.+$/m.test(content);
    
    if (!hasBulletPoints && !hasNumberedList) {
      issues.push({
        severity: 'warning',
        category: 'structure',
        message: 'Content lacks structured elements (bullet points or numbered lists)',
        suggestion: 'Add bullet points or numbered lists for better readability and AI parsing',
        impact: 'medium',
        autoFixable: false
      });
    }

    // Check content length
    const wordCount = content.split(/\s+/).length;
    if (wordCount < this.aiSystemPreferences.formatting.preferredWordCount.min) {
      issues.push({
        severity: 'warning',
        category: 'formatting',
        message: `Content too short (${wordCount} words, minimum ${this.aiSystemPreferences.formatting.preferredWordCount.min})`,
        suggestion: 'Add more detailed content to provide better value and context',
        impact: 'medium',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Validate generated schema markup
   */
  private validateGeneratedSchemaMarkup(schemaMarkup: SchemaMarkup[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (schemaMarkup.length === 0) {
      issues.push({
        severity: 'error',
        category: 'schema',
        message: 'No schema markup generated',
        suggestion: 'Ensure template includes proper schema markup configuration',
        impact: 'high',
        autoFixable: false
      });
      return issues;
    }

    // Validate each generated schema
    for (const schema of schemaMarkup) {
      issues.push(...this.validateIndividualSchema(schema));
    }

    return issues;
  }

  /**
   * Validate AI readability
   */
  private validateAIReadability(content: string, aiReadabilityScore: number): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (aiReadabilityScore < 70) {
      issues.push({
        severity: 'warning',
        category: 'ai_optimization',
        message: `AI readability score (${aiReadabilityScore}) below recommended threshold (70)`,
        suggestion: 'Improve content structure with headings, bullet points, and clear formatting',
        impact: 'medium',
        autoFixable: false
      });
    }

    // Check sentence length
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length;
    
    if (avgSentenceLength > this.aiSystemPreferences.formatting.maxSentenceLength) {
      issues.push({
        severity: 'suggestion',
        category: 'formatting',
        message: `Average sentence length (${Math.round(avgSentenceLength)} words) exceeds recommended maximum (${this.aiSystemPreferences.formatting.maxSentenceLength})`,
        suggestion: 'Break down long sentences for better AI comprehension',
        impact: 'low',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Validate content SEO
   */
  private validateContentSEO(content: string): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for multiple heading levels
    const headingLevels = (content.match(/^#{1,6}\s+.+$/gm) || []).length;
    if (headingLevels < this.aiSystemPreferences.formatting.minHeadingCount) {
      issues.push({
        severity: 'suggestion',
        category: 'seo',
        message: `Content has ${headingLevels} headings, recommended minimum is ${this.aiSystemPreferences.formatting.minHeadingCount}`,
        suggestion: 'Add more headings to improve content structure and SEO',
        impact: 'low',
        autoFixable: false
      });
    }

    return issues;
  }

  /**
   * Calculate validation scores
   */
  private calculateScores(template: ContentTemplate, issues: ValidationIssue[]): {
    overall: number;
    aiCompatibility: number;
    seo: number;
  } {
    let overall = 100;
    let aiCompatibility = 100;
    let seo = 100;

    for (const issue of issues) {
      const penalty = issue.severity === 'error' ? 25 : issue.severity === 'warning' ? 15 : 5;
      
      overall -= penalty;
      
      if (issue.category === 'ai_optimization' || issue.category === 'schema') {
        aiCompatibility -= penalty;
      }
      
      if (issue.category === 'seo') {
        seo -= penalty;
      }
    }

    return {
      overall: Math.max(0, overall),
      aiCompatibility: Math.max(0, aiCompatibility),
      seo: Math.max(0, seo)
    };
  }

  /**
   * Calculate content scores
   */
  private calculateContentScores(result: TemplateGenerationResult, issues: ValidationIssue[]): {
    overall: number;
    aiCompatibility: number;
    seo: number;
  } {
    let overall = result.metadata.aiReadabilityScore;
    let aiCompatibility = result.metadata.aiReadabilityScore;
    let seo = result.metadata.seoScore;

    // Apply penalties for issues
    for (const issue of issues) {
      const penalty = issue.severity === 'error' ? 20 : issue.severity === 'warning' ? 10 : 3;
      
      overall -= penalty;
      
      if (issue.category === 'ai_optimization' || issue.category === 'schema') {
        aiCompatibility -= penalty;
      }
      
      if (issue.category === 'seo') {
        seo -= penalty;
      }
    }

    return {
      overall: Math.max(0, overall),
      aiCompatibility: Math.max(0, aiCompatibility),
      seo: Math.max(0, seo)
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations = new Set<string>();

    for (const issue of issues) {
      if (issue.impact === 'high' || issue.severity === 'error') {
        recommendations.add(issue.suggestion);
      }
    }

    // Add general recommendations
    if (issues.some(i => i.category === 'schema')) {
      recommendations.add('Review and improve schema markup for better AI understanding');
    }

    if (issues.some(i => i.category === 'structure')) {
      recommendations.add('Optimize content structure with proper headings and formatting');
    }

    return Array.from(recommendations);
  }

  /**
   * Generate content-specific recommendations
   */
  private generateContentRecommendations(issues: ValidationIssue[], result: TemplateGenerationResult): string[] {
    const recommendations = new Set<string>();

    // Add recommendations based on metadata
    if (result.metadata.aiReadabilityScore < 70) {
      recommendations.add('Improve content structure and formatting for better AI readability');
    }

    if (result.metadata.seoScore < 70) {
      recommendations.add('Enhance SEO elements like headings, meta descriptions, and keyword optimization');
    }

    if (result.metadata.wordCount < 300) {
      recommendations.add('Consider adding more content for better SEO value and user engagement');
    }

    // Add issue-specific recommendations
    for (const issue of issues) {
      if (issue.impact === 'high') {
        recommendations.add(issue.suggestion);
      }
    }

    return Array.from(recommendations);
  }

  /**
   * Generate auto-fix suggestions
   */
  private generateAutoFixSuggestions(issues: ValidationIssue[]): string[] {
    return issues
      .filter(issue => issue.autoFixable)
      .map(issue => `Auto-fix available: ${issue.suggestion}`);
  }

  /**
   * Get default AI system preferences
   */
  private getDefaultAIPreferences(): AISystemPreferences {
    return {
      structurePatterns: {
        headingHierarchy: true,
        bulletPoints: true,
        numberedLists: true,
        faqFormat: true,
        tableStructure: false
      },
      schemaRequirements: {
        requiredTypes: ['@context', '@type', 'name'],
        optionalTypes: ['description', 'url', 'sameAs'],
        minimumProperties: 3
      },
      formatting: {
        maxSentenceLength: 25,
        maxParagraphLength: 150,
        minHeadingCount: 2,
        preferredWordCount: { min: 300, max: 2000 }
      },
      seoRequirements: {
        h1Required: true,
        metaDescriptionLength: { min: 120, max: 160 },
        keywordDensity: { min: 0.01, max: 0.03 },
        internalLinksMin: 1
      }
    };
  }
}

/**
 * Export singleton instance
 */
export const templateValidator = new TemplateValidator();