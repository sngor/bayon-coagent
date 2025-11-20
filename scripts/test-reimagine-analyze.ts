#!/usr/bin/env tsx

/**
 * Test script for reimagine image analysis flow
 * 
 * This script tests the image analysis flow with a sample image
 * to verify it generates appropriate edit suggestions.
 */

import { analyzeImage } from '../src/aws/bedrock/flows/reimagine-analyze';
import { readFileSync } from 'fs';
import { join } from 'path';

async function testAnalyzeFlow() {
  console.log('Testing Reimagine Image Analysis Flow...\n');

  // Create a simple test image (1x1 pixel PNG)
  // In a real scenario, you would load an actual property image
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  try {
    console.log('Analyzing test image...');
    
    const result = await analyzeImage({
      imageData: testImageBase64,
      imageFormat: 'png',
    });

    console.log('\n✅ Analysis completed successfully!\n');
    console.log('Analysis:', result.analysis);
    console.log('\nSuggestions:');
    
    result.suggestions.forEach((suggestion, index) => {
      console.log(`\n${index + 1}. ${suggestion.editType.toUpperCase()}`);
      console.log(`   Priority: ${suggestion.priority}`);
      console.log(`   Confidence: ${(suggestion.confidence * 100).toFixed(0)}%`);
      console.log(`   Reason: ${suggestion.reason}`);
      
      if (suggestion.suggestedParams) {
        console.log(`   Suggested Params:`, JSON.stringify(suggestion.suggestedParams, null, 2));
      }
    });

    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testAnalyzeFlow();

