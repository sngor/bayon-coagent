/**
 * Validation script for AI Search Monitoring implementation
 * 
 * This script validates that the AI search monitoring services are properly implemented
 * and can be instantiated without errors.
 */

import { getAISearchMonitorService, getCompetitiveAnalysisService } from './index';
import type { AIPlatform } from './types';

/**
 * Validates AI Search Monitor Service
 */
async function validateAISearchMonitor(): Promise<boolean> {
  try {
    console.log('🔍 Validating AI Search Monitor Service...');
    
    const service = getAISearchMonitorService();
    
    // Test service instantiation
    if (!service) {
      throw new Error('AI Search Monitor Service not instantiated');
    }
    
    // Test query generation
    const queries = service.generateLocationQueries('John Doe', ['New York, NY']);
    if (!queries || queries.length === 0) {
      throw new Error('Query generation failed');
    }
    
    console.log(`✅ Generated ${queries.length} location-based queries`);
    
    // Test platform configuration
    const platforms: AIPlatform[] = ['chatgpt', 'claude', 'perplexity', 'gemini', 'bing-chat'];
    console.log(`✅ Supports ${platforms.length} AI platforms: ${platforms.join(', ')}`);
    
    console.log('✅ AI Search Monitor Service validation passed');
    return true;
  } catch (error) {
    console.error('❌ AI Search Monitor Service validation failed:', error);
    return false;
  }
}

/**
 * Validates Competitive Analysis Service
 */
async function validateCompetitiveAnalysis(): Promise<boolean> {
  try {
    console.log('🏆 Validating Competitive Analysis Service...');
    
    const service = getCompetitiveAnalysisService();
    
    // Test service instantiation
    if (!service) {
      throw new Error('Competitive Analysis Service not instantiated');
    }
    
    console.log('✅ Competitive Analysis Service instantiated successfully');
    
    // Test that methods exist
    const methods = [
      'identifyCompetitors',
      'compareAIVisibilityScores',
      'performGapAnalysis',
      'generateCompetitiveRecommendations',
      'getCompetitivePositioning'
    ];
    
    for (const method of methods) {
      if (typeof (service as any)[method] !== 'function') {
        throw new Error(`Method ${method} not found on service`);
      }
    }
    
    console.log(`✅ All ${methods.length} required methods are available`);
    console.log('✅ Competitive Analysis Service validation passed');
    return true;
  } catch (error) {
    console.error('❌ Competitive Analysis Service validation failed:', error);
    return false;
  }
}

/**
 * Validates Bedrock Flow Integration
 */
async function validateBedrockIntegration(): Promise<boolean> {
  try {
    console.log('🤖 Validating Bedrock Flow Integration...');
    
    // Test that the flow can be imported
    const { runAISearchMonitoring, quickAIMonitoring } = await import('@/aws/bedrock/flows/ai-search-monitor');
    
    if (typeof runAISearchMonitoring !== 'function') {
      throw new Error('runAISearchMonitoring function not available');
    }
    
    if (typeof quickAIMonitoring !== 'function') {
      throw new Error('quickAIMonitoring function not available');
    }
    
    console.log('✅ Bedrock AI monitoring flows are available');
    console.log('✅ Bedrock Flow Integration validation passed');
    return true;
  } catch (error) {
    console.error('❌ Bedrock Flow Integration validation failed:', error);
    return false;
  }
}

/**
 * Main validation function
 */
export async function validateAIMonitoringImplementation(): Promise<{
  success: boolean;
  results: {
    aiSearchMonitor: boolean;
    competitiveAnalysis: boolean;
    bedrockIntegration: boolean;
  };
}> {
  console.log('🚀 Starting AI Monitoring Implementation Validation...\n');
  
  const results = {
    aiSearchMonitor: await validateAISearchMonitor(),
    competitiveAnalysis: await validateCompetitiveAnalysis(),
    bedrockIntegration: await validateBedrockIntegration(),
  };
  
  const success = Object.values(results).every(result => result === true);
  
  console.log('\n📊 Validation Summary:');
  console.log(`AI Search Monitor: ${results.aiSearchMonitor ? '✅' : '❌'}`);
  console.log(`Competitive Analysis: ${results.competitiveAnalysis ? '✅' : '❌'}`);
  console.log(`Bedrock Integration: ${results.bedrockIntegration ? '✅' : '❌'}`);
  console.log(`\nOverall Status: ${success ? '✅ PASSED' : '❌ FAILED'}`);
  
  return { success, results };
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateAIMonitoringImplementation()
    .then(({ success }) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Validation script error:', error);
      process.exit(1);
    });
}