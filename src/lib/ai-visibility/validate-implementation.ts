/**
 * AI Visibility Implementation Validation Script
 * 
 * Simple validation script to verify the AI visibility module works correctly
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import {
  // Types
  type AIVisibilityScore,
  type AIMention,
  type SchemaMarkup,
  
  // Utilities
  validateAIVisibilityScore,
  validateAIMention,
  calculateOverallScore,
  calculateSchemaMarkupScore,
  
  // Constants
  AI_VISIBILITY_CONSTANTS,
} from './index';

/**
 * Validates the AI visibility implementation
 */
export function validateImplementation(): {
  success: boolean;
  results: string[];
  errors: string[];
} {
  const results: string[] = [];
  const errors: string[] = [];

  try {
    // Test 1: Validate AI Visibility Score
    const validScore: AIVisibilityScore = {
      overall: 75.5,
      breakdown: {
        schemaMarkup: 80,
        contentOptimization: 70,
        aiSearchPresence: 75,
        knowledgeGraphIntegration: 65,
        socialSignals: 85,
        technicalSEO: 90,
      },
      calculatedAt: new Date(),
      trend: 'improving',
      previousScore: 70,
    };

    const scoreValidation = validateAIVisibilityScore(validScore);
    if (scoreValidation.isValid) {
      results.push('✅ AI Visibility Score validation: PASSED');
    } else {
      errors.push('❌ AI Visibility Score validation: FAILED - ' + scoreValidation.errors.join(', '));
    }

    // Test 2: Validate AI Mention
    const validMention: AIMention = {
      id: 'mention_123',
      platform: 'chatgpt',
      query: 'best real estate agent in Seattle',
      response: 'John Doe is a highly rated real estate agent...',
      mentionContext: 'When asked about top agents...',
      position: 1,
      sentiment: 'positive',
      competitorsAlsoMentioned: ['Jane Smith', 'Bob Wilson'],
      timestamp: new Date(),
      confidence: 0.95,
    };

    const mentionValidation = validateAIMention(validMention);
    if (mentionValidation.isValid) {
      results.push('✅ AI Mention validation: PASSED');
    } else {
      errors.push('❌ AI Mention validation: FAILED - ' + mentionValidation.errors.join(', '));
    }

    // Test 3: Calculate overall score
    const breakdown = {
      schemaMarkup: 80,
      contentOptimization: 70,
      aiSearchPresence: 75,
      knowledgeGraphIntegration: 65,
      socialSignals: 85,
      technicalSEO: 90,
    };

    const overallScore = calculateOverallScore(breakdown);
    const expectedScore = 75.25; // 80*0.25 + 70*0.20 + 75*0.20 + 65*0.15 + 85*0.10 + 90*0.10
    
    if (Math.abs(overallScore - expectedScore) < 0.01) {
      results.push('✅ Overall score calculation: PASSED');
    } else {
      errors.push(`❌ Overall score calculation: FAILED - Expected ${expectedScore}, got ${overallScore}`);
    }

    // Test 4: Calculate schema markup score
    const schemaMarkup: SchemaMarkup[] = [
      {
        '@context': 'https://schema.org',
        '@type': 'RealEstateAgent',
        name: 'John Doe',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'John Doe',
      },
    ];

    const schemaScore = calculateSchemaMarkupScore(schemaMarkup, 100);
    if (schemaScore > 0 && schemaScore <= 100) {
      results.push('✅ Schema markup score calculation: PASSED');
    } else {
      errors.push(`❌ Schema markup score calculation: FAILED - Invalid score: ${schemaScore}`);
    }

    // Test 5: Validate constants
    const weights = AI_VISIBILITY_CONSTANTS.SCORE_WEIGHTS;
    const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
    
    if (Math.abs(totalWeight - 1.0) < 0.001) {
      results.push('✅ Score weights validation: PASSED');
    } else {
      errors.push(`❌ Score weights validation: FAILED - Total weight is ${totalWeight}, expected 1.0`);
    }

    // Test 6: Validate platforms
    const platforms = AI_VISIBILITY_CONSTANTS.PLATFORMS;
    const requiredPlatforms = ['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'];
    const hasAllPlatforms = requiredPlatforms.every(platform => platforms.includes(platform));
    
    if (hasAllPlatforms) {
      results.push('✅ Platforms validation: PASSED');
    } else {
      errors.push('❌ Platforms validation: FAILED - Missing required platforms');
    }

    // Test 7: Validate schema types
    const schemaTypes = AI_VISIBILITY_CONSTANTS.SCHEMA_TYPES;
    const requiredSchemaTypes = ['RealEstateAgent', 'Person', 'LocalBusiness', 'Organization', 'Review', 'AggregateRating'];
    const hasAllSchemaTypes = requiredSchemaTypes.every(type => schemaTypes.includes(type));
    
    if (hasAllSchemaTypes) {
      results.push('✅ Schema types validation: PASSED');
    } else {
      errors.push('❌ Schema types validation: FAILED - Missing required schema types');
    }

    // Test 8: Error handling
    const invalidScore = {
      overall: 150, // Invalid: > 100
      breakdown: {
        schemaMarkup: 80,
        contentOptimization: 70,
        aiSearchPresence: 75,
        knowledgeGraphIntegration: 65,
        socialSignals: 85,
        technicalSEO: 90,
      },
      calculatedAt: new Date(),
      trend: 'improving',
    };

    const invalidScoreValidation = validateAIVisibilityScore(invalidScore);
    if (!invalidScoreValidation.isValid && invalidScoreValidation.errors.length > 0) {
      results.push('✅ Error handling validation: PASSED');
    } else {
      errors.push('❌ Error handling validation: FAILED - Should reject invalid data');
    }

  } catch (error) {
    errors.push(`❌ Unexpected error during validation: ${error instanceof Error ? error.message : String(error)}`);
  }

  return {
    success: errors.length === 0,
    results,
    errors,
  };
}

/**
 * Runs the validation and logs results
 */
export function runValidation(): void {
  console.log('🔍 Validating AI Visibility Implementation...\n');
  
  const validation = validateImplementation();
  
  // Log results
  validation.results.forEach(result => console.log(result));
  
  // Log errors
  if (validation.errors.length > 0) {
    console.log('\n❌ Validation Errors:');
    validation.errors.forEach(error => console.log(error));
  }
  
  // Summary
  console.log(`\n📊 Summary: ${validation.results.length} tests passed, ${validation.errors.length} errors`);
  
  if (validation.success) {
    console.log('🎉 All validations passed! AI Visibility implementation is working correctly.');
  } else {
    console.log('⚠️  Some validations failed. Please review the errors above.');
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  runValidation();
}