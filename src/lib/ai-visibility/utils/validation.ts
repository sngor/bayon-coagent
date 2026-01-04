/**
 * AI Visibility Validation Utilities
 * 
 * Utility functions for validating AI visibility data
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { z } from 'zod';
import {
  AIVisibilityScoreSchema,
  AIMentionSchema,
  OptimizationRecommendationSchema,
  SchemaMarkupSchema,
  KnowledgeGraphEntitySchema,
  AIMonitoringConfigSchema,
  WebsiteAnalysisSchema,
} from '../schemas';
import type {
  AIVisibilityScore,
  AIMention,
  OptimizationRecommendation,
  SchemaMarkup,
  KnowledgeGraphEntity,
  AIMonitoringConfig,
  WebsiteAnalysis,
  ValidationResult,
} from '../types';

/**
 * Validates AI Visibility Score data
 */
export function validateAIVisibilityScore(data: unknown): ValidationResult {
  try {
    AIVisibilityScoreSchema.parse(data);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
        suggestions: generateScoreSuggestions(error.errors),
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: [],
      suggestions: [],
    };
  }
}

/**
 * Validates AI Mention data
 */
export function validateAIMention(data: unknown): ValidationResult {
  try {
    AIMentionSchema.parse(data);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
        suggestions: generateMentionSuggestions(error.errors),
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: [],
      suggestions: [],
    };
  }
}

/**
 * Validates Optimization Recommendation data
 */
export function validateOptimizationRecommendation(data: unknown): ValidationResult {
  try {
    OptimizationRecommendationSchema.parse(data);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
        suggestions: generateRecommendationSuggestions(error.errors),
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: [],
      suggestions: [],
    };
  }
}

/**
 * Validates Schema Markup data
 */
export function validateSchemaMarkup(data: unknown): ValidationResult {
  try {
    SchemaMarkupSchema.parse(data);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
        suggestions: generateSchemaSuggestions(error.errors),
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: [],
      suggestions: [],
    };
  }
}

/**
 * Validates Knowledge Graph Entity data
 */
export function validateKnowledgeGraphEntity(data: unknown): ValidationResult {
  try {
    KnowledgeGraphEntitySchema.parse(data);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
        suggestions: generateKnowledgeGraphSuggestions(error.errors),
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: [],
      suggestions: [],
    };
  }
}

/**
 * Validates AI Monitoring Config data
 */
export function validateAIMonitoringConfig(data: unknown): ValidationResult {
  try {
    AIMonitoringConfigSchema.parse(data);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
        suggestions: generateMonitoringConfigSuggestions(error.errors),
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: [],
      suggestions: [],
    };
  }
}

/**
 * Validates Website Analysis data
 */
export function validateWebsiteAnalysis(data: unknown): ValidationResult {
  try {
    WebsiteAnalysisSchema.parse(data);
    return {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        warnings: [],
        suggestions: generateWebsiteAnalysisSuggestions(error.errors),
      };
    }
    return {
      isValid: false,
      errors: ['Unknown validation error'],
      warnings: [],
      suggestions: [],
    };
  }
}

/**
 * Generates suggestions for AI Visibility Score validation errors
 */
function generateScoreSuggestions(errors: z.ZodIssue[]): string[] {
  const suggestions: string[] = [];
  
  for (const error of errors) {
    const path = error.path.join('.');
    
    if (path.includes('overall') && error.code === z.ZodIssueCode.too_big) {
      suggestions.push('Overall score must be between 0 and 100');
    }
    
    if (path.includes('breakdown') && error.code === z.ZodIssueCode.too_big) {
      suggestions.push('All breakdown scores must be between 0 and 100');
    }
    
    if (path.includes('trend') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('Trend must be one of: improving, declining, stable');
    }
  }
  
  return suggestions;
}

/**
 * Generates suggestions for AI Mention validation errors
 */
function generateMentionSuggestions(errors: z.ZodIssue[]): string[] {
  const suggestions: string[] = [];
  
  for (const error of errors) {
    const path = error.path.join('.');
    
    if (path.includes('platform') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('Platform must be one of: chatgpt, claude, perplexity, gemini, bing-chat');
    }
    
    if (path.includes('sentiment') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('Sentiment must be one of: positive, neutral, negative');
    }
    
    if (path.includes('confidence') && error.code === z.ZodIssueCode.too_big) {
      suggestions.push('Confidence must be between 0 and 1');
    }
    
    if (path.includes('position') && error.code === z.ZodIssueCode.too_small) {
      suggestions.push('Position must be a positive integer (1st, 2nd, 3rd, etc.)');
    }
  }
  
  return suggestions;
}

/**
 * Generates suggestions for Optimization Recommendation validation errors
 */
function generateRecommendationSuggestions(errors: z.ZodIssue[]): string[] {
  const suggestions: string[] = [];
  
  for (const error of errors) {
    const path = error.path.join('.');
    
    if (path.includes('category') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('Category must be one of: schema, content, technical, social, competitive');
    }
    
    if (path.includes('priority') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('Priority must be one of: high, medium, low');
    }
    
    if (path.includes('implementationDifficulty') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('Implementation difficulty must be one of: easy, medium, hard');
    }
    
    if (path.includes('status') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('Status must be one of: pending, in-progress, completed, dismissed');
    }
    
    if (path.includes('estimatedImpact') && error.code === z.ZodIssueCode.too_big) {
      suggestions.push('Estimated impact must be between 0 and 100');
    }
  }
  
  return suggestions;
}

/**
 * Generates suggestions for Schema Markup validation errors
 */
function generateSchemaSuggestions(errors: z.ZodIssue[]): string[] {
  const suggestions: string[] = [];
  
  for (const error of errors) {
    const path = error.path.join('.');
    
    if (path.includes('@context') && error.code === z.ZodIssueCode.invalid_string) {
      suggestions.push('@context must be a valid URL (typically https://schema.org)');
    }
    
    if (path.includes('@type') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('@type must be one of: RealEstateAgent, Person, LocalBusiness, Organization, Review, AggregateRating');
    }
    
    if (path.includes('email') && error.code === z.ZodIssueCode.invalid_string) {
      suggestions.push('Email must be a valid email address');
    }
    
    if (path.includes('url') && error.code === z.ZodIssueCode.invalid_string) {
      suggestions.push('URL must be a valid URL');
    }
    
    if (path.includes('geo.latitude') && (error.code === z.ZodIssueCode.too_big || error.code === z.ZodIssueCode.too_small)) {
      suggestions.push('Latitude must be between -90 and 90 degrees');
    }
    
    if (path.includes('geo.longitude') && (error.code === z.ZodIssueCode.too_big || error.code === z.ZodIssueCode.too_small)) {
      suggestions.push('Longitude must be between -180 and 180 degrees');
    }
  }
  
  return suggestions;
}

/**
 * Generates suggestions for Knowledge Graph Entity validation errors
 */
function generateKnowledgeGraphSuggestions(errors: z.ZodIssue[]): string[] {
  const suggestions: string[] = [];
  
  for (const error of errors) {
    const path = error.path.join('.');
    
    if (path.includes('@id') && error.code === z.ZodIssueCode.too_small) {
      suggestions.push('@id must be a non-empty string identifier');
    }
    
    if (path.includes('@type') && error.code === z.ZodIssueCode.too_small) {
      suggestions.push('@type must be a non-empty string');
    }
    
    if (path.includes('coordinates.latitude') && (error.code === z.ZodIssueCode.too_big || error.code === z.ZodIssueCode.too_small)) {
      suggestions.push('Latitude must be between -90 and 90 degrees');
    }
    
    if (path.includes('coordinates.longitude') && (error.code === z.ZodIssueCode.too_big || error.code === z.ZodIssueCode.too_small)) {
      suggestions.push('Longitude must be between -180 and 180 degrees');
    }
    
    if (path.includes('serviceArea.type') && error.code === z.ZodIssueCode.invalid_enum_value) {
      suggestions.push('Service area type must be either "Polygon" or "Circle"');
    }
  }
  
  return suggestions;
}

/**
 * Generates suggestions for AI Monitoring Config validation errors
 */
function generateMonitoringConfigSuggestions(errors: z.ZodIssue[]): string[] {
  const suggestions: string[] = [];
  
  for (const error of errors) {
    const path = error.path.join('.');
    
    if (path.includes('platforms') && error.code === z.ZodIssueCode.too_small) {
      suggestions.push('At least one AI platform must be selected for monitoring');
    }
    
    if (path.includes('queries') && error.code === z.ZodIssueCode.too_small) {
      suggestions.push('At least one search query must be provided');
    }
    
    if (path.includes('frequency') && error.code === z.ZodIssueCode.too_big) {
      suggestions.push('Monitoring frequency cannot exceed 168 hours (1 week)');
    }
    
    if (path.includes('frequency') && error.code === z.ZodIssueCode.too_small) {
      suggestions.push('Monitoring frequency must be at least 1 hour');
    }
  }
  
  return suggestions;
}

/**
 * Generates suggestions for Website Analysis validation errors
 */
function generateWebsiteAnalysisSuggestions(errors: z.ZodIssue[]): string[] {
  const suggestions: string[] = [];
  
  for (const error of errors) {
    const path = error.path.join('.');
    
    if (path.includes('url') && error.code === z.ZodIssueCode.invalid_string) {
      suggestions.push('Website URL must be a valid URL');
    }
    
    if (path.includes('analyzedAt') && error.code === z.ZodIssueCode.invalid_date) {
      suggestions.push('Analysis date must be a valid date');
    }
  }
  
  return suggestions;
}

/**
 * Validates multiple items and returns aggregated results
 */
export function validateMultiple<T>(
  items: unknown[],
  validator: (item: unknown) => ValidationResult
): {
  isValid: boolean;
  validItems: number;
  totalItems: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
} {
  const results = items.map(validator);
  const validItems = results.filter(r => r.isValid).length;
  
  return {
    isValid: validItems === items.length,
    validItems,
    totalItems: items.length,
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings),
    suggestions: results.flatMap(r => r.suggestions),
  };
}