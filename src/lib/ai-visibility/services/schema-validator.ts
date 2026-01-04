/**
 * Schema Validation and Error Reporting Service
 * 
 * Validates schema markup against Schema.org specifications and provides detailed error reporting
 * Requirements: 2.4
 */

import { SchemaMarkup, ValidationResult } from '../types';
import { SchemaMarkupSchema } from '../schemas';
import { z } from 'zod';

/**
 * Schema validation cache entry
 */
interface ValidationCacheEntry {
  result: ValidationResult;
  timestamp: number;
}

/**
 * Schema.org specification rules
 */
interface SchemaOrgRule {
  property: string;
  required: boolean;
  type: string;
  description: string;
  fixSuggestion: string;
}

/**
 * Schema Validator Service Interface
 */
export interface SchemaValidatorService {
  /**
   * Validate schema markup against Schema.org specifications
   */
  validateSchema(schema: SchemaMarkup): ValidationResult;
  
  /**
   * Validate multiple schemas
   */
  validateMultipleSchemas(schemas: SchemaMarkup[]): ValidationResult;
  
  /**
   * Get detailed validation report with fix suggestions
   */
  getDetailedValidationReport(schema: SchemaMarkup): DetailedValidationReport;
  
  /**
   * Clear validation cache
   */
  clearCache(): void;
}

/**
 * Detailed validation report with fix suggestions
 */
export interface DetailedValidationReport {
  isValid: boolean;
  schemaType: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
  completenessScore: number; // 0-100
  aiOptimizationScore: number; // 0-100
}

/**
 * Validation error with fix suggestion
 */
export interface ValidationError {
  property: string;
  message: string;
  severity: 'error' | 'warning';
  fixSuggestion: string;
  codeExample?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  property: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

/**
 * Validation suggestion for improvement
 */
export interface ValidationSuggestion {
  category: 'completeness' | 'ai-optimization' | 'seo' | 'accessibility';
  title: string;
  description: string;
  implementation: string;
  estimatedImpact: number; // 0-100
}

/**
 * Advanced Schema Validator Implementation
 */
export class AdvancedSchemaValidator implements SchemaValidatorService {
  private validationCache = new Map<string, ValidationCacheEntry>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  
  // Schema.org specification rules for different schema types
  private readonly schemaOrgRules: Record<string, SchemaOrgRule[]> = {
    'RealEstateAgent': [
      {
        property: 'name',
        required: true,
        type: 'string',
        description: 'The name of the real estate agent',
        fixSuggestion: 'Add the agent\'s full name to improve AI recognition'
      },
      {
        property: 'email',
        required: true,
        type: 'string',
        description: 'Contact email for the agent',
        fixSuggestion: 'Include a valid email address for contact purposes'
      },
      {
        property: 'telephone',
        required: false,
        type: 'string',
        description: 'Phone number for the agent',
        fixSuggestion: 'Add phone number to improve local search visibility'
      },
      {
        property: 'address',
        required: false,
        type: 'PostalAddress',
        description: 'Business address of the agent',
        fixSuggestion: 'Include business address for local SEO benefits'
      },
      {
        property: 'areaServed',
        required: false,
        type: 'Place[]',
        description: 'Geographic areas served by the agent',
        fixSuggestion: 'Specify service areas to improve local search results'
      },
      {
        property: 'knowsAbout',
        required: false,
        type: 'string[]',
        description: 'Areas of expertise and specialization',
        fixSuggestion: 'List specializations to help AI systems understand expertise'
      }
    ],
    'Person': [
      {
        property: 'name',
        required: true,
        type: 'string',
        description: 'The person\'s name',
        fixSuggestion: 'Ensure the name is complete and properly formatted'
      },
      {
        property: 'jobTitle',
        required: false,
        type: 'string',
        description: 'Professional title or role',
        fixSuggestion: 'Add job title to clarify professional role'
      }
    ],
    'LocalBusiness': [
      {
        property: 'name',
        required: true,
        type: 'string',
        description: 'Business name',
        fixSuggestion: 'Use a clear, descriptive business name'
      },
      {
        property: 'address',
        required: true,
        type: 'PostalAddress',
        description: 'Business address',
        fixSuggestion: 'Include complete business address for local search'
      },
      {
        property: 'telephone',
        required: true,
        type: 'string',
        description: 'Business phone number',
        fixSuggestion: 'Add business phone number for customer contact'
      }
    ],
    'Organization': [
      {
        property: 'name',
        required: true,
        type: 'string',
        description: 'Organization name',
        fixSuggestion: 'Provide clear organization name'
      },
      {
        property: 'url',
        required: false,
        type: 'string',
        description: 'Organization website',
        fixSuggestion: 'Include website URL for credibility'
      }
    ]
  };

  /**
   * Validate schema markup against Schema.org specifications
   */
  validateSchema(schema: SchemaMarkup): ValidationResult {
    const cacheKey = this.generateCacheKey(schema);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    const result = this.performValidation(schema);
    this.setCache(cacheKey, result);
    
    return result;
  }

  /**
   * Validate multiple schemas
   */
  validateMultipleSchemas(schemas: SchemaMarkup[]): ValidationResult {
    const results = schemas.map(schema => this.validateSchema(schema));
    
    const allValid = results.every(r => r.isValid);
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);
    const allSuggestions = results.flatMap(r => r.suggestions);

    return {
      isValid: allValid,
      errors: allErrors,
      warnings: allWarnings,
      suggestions: allSuggestions
    };
  }

  /**
   * Get detailed validation report with fix suggestions
   */
  getDetailedValidationReport(schema: SchemaMarkup): DetailedValidationReport {
    const basicValidation = this.validateSchema(schema);
    const schemaType = schema['@type'];
    
    // Perform detailed analysis
    const errors = this.analyzeSchemaErrors(schema);
    const warnings = this.analyzeSchemaWarnings(schema);
    const suggestions = this.generateImprovementSuggestions(schema);
    
    // Calculate scores
    const completenessScore = this.calculateCompletenessScore(schema);
    const aiOptimizationScore = this.calculateAIOptimizationScore(schema);

    return {
      isValid: basicValidation.isValid,
      schemaType,
      errors,
      warnings,
      suggestions,
      completenessScore,
      aiOptimizationScore
    };
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Perform basic schema validation
   */
  private performValidation(schema: SchemaMarkup): ValidationResult {
    try {
      // First, validate against Zod schema
      SchemaMarkupSchema.parse(schema);
      
      // Then perform Schema.org specific validation
      const schemaOrgValidation = this.validateAgainstSchemaOrg(schema);
      
      return {
        isValid: schemaOrgValidation.isValid,
        errors: schemaOrgValidation.errors,
        warnings: schemaOrgValidation.warnings,
        suggestions: schemaOrgValidation.suggestions
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
          warnings: [],
          suggestions: this.generateZodErrorSuggestions(error.errors)
        };
      }
      
      return {
        isValid: false,
        errors: ['Unknown validation error occurred'],
        warnings: [],
        suggestions: ['Please check the schema format and try again']
      };
    }
  }

  /**
   * Validate against Schema.org specifications
   */
  private validateAgainstSchemaOrg(schema: SchemaMarkup): ValidationResult {
    const schemaType = schema['@type'];
    const rules = this.schemaOrgRules[schemaType] || [];
    
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check required properties
    for (const rule of rules) {
      if (rule.required && !(rule.property in schema)) {
        errors.push(`Missing required property: ${rule.property}`);
        suggestions.push(rule.fixSuggestion);
      }
    }

    // Check @context
    if (schema['@context'] !== 'https://schema.org') {
      warnings.push('@context should be "https://schema.org" for proper Schema.org compliance');
      suggestions.push('Use "https://schema.org" as the @context value');
    }

    // Check for AI optimization opportunities
    const aiSuggestions = this.generateAIOptimizationSuggestions(schema);
    suggestions.push(...aiSuggestions);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Analyze schema for detailed errors
   */
  private analyzeSchemaErrors(schema: SchemaMarkup): ValidationError[] {
    const errors: ValidationError[] = [];
    const schemaType = schema['@type'];
    const rules = this.schemaOrgRules[schemaType] || [];

    // Check required properties with detailed error information
    for (const rule of rules) {
      if (rule.required && !(rule.property in schema)) {
        errors.push({
          property: rule.property,
          message: `Missing required property: ${rule.property}`,
          severity: 'error',
          fixSuggestion: rule.fixSuggestion,
          codeExample: this.generateCodeExample(rule.property, rule.type)
        });
      }
    }

    // Check data format issues
    if (schema.email && !this.isValidEmail(schema.email)) {
      errors.push({
        property: 'email',
        message: 'Invalid email format',
        severity: 'error',
        fixSuggestion: 'Provide a valid email address in the format: user@domain.com',
        codeExample: '"email": "agent@example.com"'
      });
    }

    if (schema.url && !this.isValidUrl(schema.url)) {
      errors.push({
        property: 'url',
        message: 'Invalid URL format',
        severity: 'error',
        fixSuggestion: 'Provide a valid URL starting with http:// or https://',
        codeExample: '"url": "https://www.example.com"'
      });
    }

    return errors;
  }

  /**
   * Analyze schema for warnings
   */
  private analyzeSchemaWarnings(schema: SchemaMarkup): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for missing optional but recommended properties
    if (!schema.description) {
      warnings.push({
        property: 'description',
        message: 'Missing description property',
        impact: 'medium',
        recommendation: 'Add a description to help AI systems understand the entity better'
      });
    }

    if (!schema.telephone) {
      warnings.push({
        property: 'telephone',
        message: 'Missing telephone property',
        impact: 'medium',
        recommendation: 'Include phone number for better local search visibility'
      });
    }

    if (!schema.address) {
      warnings.push({
        property: 'address',
        message: 'Missing address property',
        impact: 'high',
        recommendation: 'Add business address for local SEO benefits'
      });
    }

    if (!schema.areaServed || schema.areaServed.length === 0) {
      warnings.push({
        property: 'areaServed',
        message: 'Missing service areas',
        impact: 'high',
        recommendation: 'Specify geographic areas served to improve local search results'
      });
    }

    return warnings;
  }

  /**
   * Generate improvement suggestions
   */
  private generateImprovementSuggestions(schema: SchemaMarkup): ValidationSuggestion[] {
    const suggestions: ValidationSuggestion[] = [];

    // Completeness suggestions
    if (!schema.knowsAbout || schema.knowsAbout.length === 0) {
      suggestions.push({
        category: 'completeness',
        title: 'Add Areas of Expertise',
        description: 'Specify areas of knowledge and specialization',
        implementation: 'Add "knowsAbout" property with relevant real estate specializations',
        estimatedImpact: 75
      });
    }

    // AI optimization suggestions
    if (!schema.aggregateRating) {
      suggestions.push({
        category: 'ai-optimization',
        title: 'Include Customer Reviews',
        description: 'Add aggregate rating and reviews for credibility',
        implementation: 'Include "aggregateRating" and "review" properties from testimonials',
        estimatedImpact: 85
      });
    }

    // SEO suggestions
    if (!schema.sameAs || schema.sameAs.length === 0) {
      suggestions.push({
        category: 'seo',
        title: 'Link Social Profiles',
        description: 'Connect social media profiles for better entity recognition',
        implementation: 'Add "sameAs" property with social media URLs',
        estimatedImpact: 60
      });
    }

    return suggestions;
  }

  /**
   * Calculate completeness score (0-100)
   */
  private calculateCompletenessScore(schema: SchemaMarkup): number {
    const schemaType = schema['@type'];
    const rules = this.schemaOrgRules[schemaType] || [];
    
    if (rules.length === 0) return 100;

    const requiredProperties = rules.filter(r => r.required);
    const optionalProperties = rules.filter(r => !r.required);
    
    // Required properties: 70% weight
    const requiredScore = requiredProperties.length > 0 
      ? (requiredProperties.filter(r => r.property in schema).length / requiredProperties.length) * 70
      : 70;
    
    // Optional properties: 30% weight
    const optionalScore = optionalProperties.length > 0
      ? (optionalProperties.filter(r => r.property in schema).length / optionalProperties.length) * 30
      : 30;

    return Math.round(requiredScore + optionalScore);
  }

  /**
   * Calculate AI optimization score (0-100)
   */
  private calculateAIOptimizationScore(schema: SchemaMarkup): number {
    let score = 0;
    const maxScore = 100;

    // Basic information (30 points)
    if (schema.name) score += 10;
    if (schema.description) score += 10;
    if (schema.email) score += 10;

    // Contact information (20 points)
    if (schema.telephone) score += 10;
    if (schema.address) score += 10;

    // Geographic data (20 points)
    if (schema.areaServed && schema.areaServed.length > 0) score += 10;
    if (schema.geo) score += 10;

    // Expertise and credibility (20 points)
    if (schema.knowsAbout && schema.knowsAbout.length > 0) score += 10;
    if (schema.aggregateRating) score += 10;

    // Social signals (10 points)
    if (schema.sameAs && schema.sameAs.length > 0) score += 10;

    return Math.min(score, maxScore);
  }

  /**
   * Generate AI optimization suggestions
   */
  private generateAIOptimizationSuggestions(schema: SchemaMarkup): string[] {
    const suggestions: string[] = [];

    if (!schema.description || schema.description.length < 50) {
      suggestions.push('Add a detailed description (50+ characters) to help AI systems understand the entity');
    }

    if (!schema.knowsAbout || schema.knowsAbout.length === 0) {
      suggestions.push('Include "knowsAbout" property with relevant expertise areas for better AI categorization');
    }

    if (!schema.areaServed || schema.areaServed.length === 0) {
      suggestions.push('Specify service areas to improve location-based AI recommendations');
    }

    if (!schema.aggregateRating && schema['@type'] === 'RealEstateAgent') {
      suggestions.push('Include customer reviews and ratings to build AI trust signals');
    }

    return suggestions;
  }

  /**
   * Generate suggestions from Zod validation errors
   */
  private generateZodErrorSuggestions(errors: z.ZodIssue[]): string[] {
    const suggestions: string[] = [];

    for (const error of errors) {
      const path = error.path.join('.');
      
      switch (error.code) {
        case 'invalid_type':
          suggestions.push(`${path} should be of type ${error.expected}, got ${error.received}`);
          break;
        case 'too_small':
          suggestions.push(`${path} should have at least ${error.minimum} characters/items`);
          break;
        case 'too_big':
          suggestions.push(`${path} should have at most ${error.maximum} characters/items`);
          break;
        case 'invalid_string':
          if (error.validation === 'email') {
            suggestions.push(`${path} should be a valid email address`);
          } else if (error.validation === 'url') {
            suggestions.push(`${path} should be a valid URL`);
          }
          break;
        default:
          suggestions.push(`${path}: ${error.message}`);
      }
    }

    return suggestions;
  }

  /**
   * Generate code example for a property
   */
  private generateCodeExample(property: string, type: string): string {
    const examples: Record<string, string> = {
      'name': '"name": "John Smith"',
      'email': '"email": "john@example.com"',
      'telephone': '"telephone": "+1-555-123-4567"',
      'description': '"description": "Experienced real estate agent specializing in luxury homes"',
      'url': '"url": "https://www.johnsmith-realestate.com"',
      'address': `"address": {
  "@type": "PostalAddress",
  "streetAddress": "123 Main St",
  "addressLocality": "Anytown",
  "addressRegion": "CA",
  "postalCode": "12345",
  "addressCountry": "US"
}`,
      'areaServed': `"areaServed": [{
  "@type": "Place",
  "name": "San Francisco Bay Area"
}]`
    };

    return examples[property] || `"${property}": "value"`;
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate cache key for schema
   */
  private generateCacheKey(schema: SchemaMarkup): string {
    return JSON.stringify(schema);
  }

  /**
   * Get validation result from cache
   */
  private getFromCache(key: string): ValidationResult | null {
    const cached = this.validationCache.get(key);
    
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_TTL_MS) {
      this.validationCache.delete(key);
      return null;
    }
    
    return cached.result;
  }

  /**
   * Set validation result in cache
   */
  private setCache(key: string, result: ValidationResult): void {
    this.validationCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }
}

/**
 * Create and export a singleton instance
 */
export const schemaValidator = new AdvancedSchemaValidator();

/**
 * Convenience function to validate schema markup
 */
export function validateSchemaMarkup(schema: SchemaMarkup): ValidationResult {
  return schemaValidator.validateSchema(schema);
}

/**
 * Convenience function to get detailed validation report
 */
export function getDetailedValidationReport(schema: SchemaMarkup): DetailedValidationReport {
  return schemaValidator.getDetailedValidationReport(schema);
}

/**
 * Convenience function to validate multiple schemas
 */
export function validateMultipleSchemas(schemas: SchemaMarkup[]): ValidationResult {
  return schemaValidator.validateMultipleSchemas(schemas);
}