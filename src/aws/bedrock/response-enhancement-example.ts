/**
 * Response Enhancement Service - Usage Examples
 * 
 * This file demonstrates how to use the Response Enhancement Service
 * in various scenarios.
 */

import { ResponseEnhancementService, DEFAULT_ENHANCEMENT_CONFIG } from './response-enhancement';
import { Citation } from './citation-service';

/**
 * Example 1: Basic Enhancement
 * 
 * Enhance a simple response with predictions and facts
 */
export async function basicEnhancementExample() {
  const service = new ResponseEnhancementService();

  const text = 'The Austin market will grow by 15% next year. ' +
               'Current median prices are $450,000.';

  const result = await service.enhance(text);

  console.log('Original:', text);
  console.log('Enhanced:', result.enhancedText);
  console.log('Modifications:', result.modificationsApplied);
  console.log('Warnings:', result.warnings);
  console.log('Predictions found:', result.predictions.length);
  console.log('Facts found:', result.facts.length);
}

/**
 * Example 2: With Citations
 * 
 * Enhance a response that includes citations
 */
export async function enhancementWithCitationsExample() {
  const service = new ResponseEnhancementService();

  const text = 'The median price increased by 8.2% ([MLS Report](https://example.com/report)). ' +
               'Sales volume reached 1,500 units.';

  const citations: Citation[] = [
    {
      id: 'cite-1',
      url: 'https://example.com/report',
      title: 'MLS Q4 2024 Report',
      sourceType: 'market-report',
      accessedAt: new Date().toISOString(),
      validated: true,
    },
  ];

  const result = await service.enhance(text, citations);

  console.log('Enhanced text:', result.enhancedText);
  console.log('Facts with citations:', result.facts.filter(f => f.hasCitation).length);
  console.log('Facts without citations:', result.facts.filter(f => !f.hasCitation).length);
}

/**
 * Example 3: With Provided Data
 * 
 * Enhance a response with grounding data to verify facts
 */
export async function enhancementWithDataExample() {
  const service = new ResponseEnhancementService();

  const text = 'The median price increased by 8.2% last year. ' +
               'Inventory levels decreased by 15%.';

  const providedData = [
    'MLS report shows 8.2% increase in median prices for 2024',
    'Market analysis indicates inventory reduction of 15% year-over-year',
  ];

  const result = await service.enhance(text, [], providedData);

  console.log('Enhanced text:', result.enhancedText);
  console.log('Warnings:', result.warnings);
  console.log('Grounded facts:', result.facts.filter(f => f.hasCitation).length);
}

/**
 * Example 4: Strict Mode
 * 
 * Use strict mode to enforce citation requirements
 */
export async function strictModeExample() {
  const strictService = new ResponseEnhancementService({
    strictMode: true,
    enableCitationEnforcement: true,
  });

  const textWithoutCitations = 'The median price is $500,000. Sales increased by 10%.';

  try {
    await strictService.enhance(textWithoutCitations);
    console.log('All facts have citations');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Citation enforcement failed:', errorMessage);
    // Handle the error - perhaps request citations from the AI
  }
}

/**
 * Example 5: Selective Enhancement
 * 
 * Enable only specific enhancement features
 */
export async function selectiveEnhancementExample() {
  // Only add qualifying language, skip fact checking
  const service = new ResponseEnhancementService({
    enableQualifyingLanguage: true,
    enableFactualGrounding: false,
    enableCitationEnforcement: false,
  });

  const text = 'The market will grow significantly. Prices will increase.';

  const result = await service.enhance(text);

  console.log('Enhanced text:', result.enhancedText);
  console.log('Predictions enhanced:', result.predictions.length);
  console.log('Facts checked:', result.facts.length); // Should be 0
}

/**
 * Example 6: Real Estate Market Analysis
 * 
 * Complete example for a market analysis response
 */
export async function marketAnalysisExample() {
  const service = new ResponseEnhancementService();

  const aiResponse = `
    Based on current trends, the Austin luxury market will see strong growth in 2025.
    The median price for luxury homes is currently $1.2M, up 12% from last year.
    Inventory levels are at historic lows with only 2.5 months of supply.
    We forecast continued appreciation of 8-10% annually.
  `.trim();

  const providedData = [
    'MLS data shows median luxury price at $1.2M as of December 2024',
    'Inventory report indicates 2.5 months supply in luxury segment',
    'Year-over-year price increase of 12% in luxury market',
  ];

  const citations: Citation[] = [
    {
      id: 'cite-1',
      url: 'https://mls.example.com/luxury-report-2024',
      title: 'Austin Luxury Market Report Q4 2024',
      sourceType: 'market-report',
      accessedAt: new Date().toISOString(),
      validated: true,
    },
  ];

  const result = await service.enhance(aiResponse, citations, providedData);

  console.log('=== Market Analysis Enhancement ===');
  console.log('\nOriginal Response:');
  console.log(aiResponse);
  console.log('\nEnhanced Response:');
  console.log(result.enhancedText);
  console.log('\nAnalysis:');
  console.log('- Predictions found:', result.predictions.length);
  console.log('- Facts extracted:', result.facts.length);
  console.log('- Modifications applied:', result.modificationsApplied);
  console.log('- Warnings:', result.warnings);
}

/**
 * Example 7: Integration with AI Flow
 * 
 * Show how to integrate with a complete AI workflow
 */
export async function aiFlowIntegrationExample() {
  // Simulated AI response
  const aiGeneratedText = `
    The downtown Austin market will experience significant growth.
    Current average price per square foot is $425.
    Sales velocity has increased by 25% compared to last quarter.
    Investment properties are projected to yield 8-12% returns.
  `.trim();

  // Simulated data sources
  const dataSources = [
    'Austin Board of Realtors report: $425/sqft average in downtown',
    'Q4 2024 sales data shows 25% increase in velocity',
  ];

  // Step 1: Enhance the response
  const enhancementService = new ResponseEnhancementService({
    enableQualifyingLanguage: true,
    enableFactualGrounding: true,
    enableCitationEnforcement: true,
    strictMode: false,
  });

  const result = await enhancementService.enhance(
    aiGeneratedText,
    [],
    dataSources
  );

  // Step 2: Check for issues
  if (result.warnings.length > 0) {
    console.log('⚠️  Enhancement warnings:');
    result.warnings.forEach(warning => console.log(`   - ${warning}`));
  }

  // Step 3: Log modifications
  if (result.modificationsApplied.length > 0) {
    console.log('✓ Modifications applied:');
    result.modificationsApplied.forEach(mod => console.log(`   - ${mod}`));
  }

  // Step 4: Return enhanced response
  return {
    text: result.enhancedText,
    metadata: {
      predictionsCount: result.predictions.length,
      factsCount: result.facts.length,
      warnings: result.warnings,
    },
  };
}

/**
 * Example 8: Handling Edge Cases
 * 
 * Demonstrate handling of various edge cases
 */
export async function edgeCasesExample() {
  const service = new ResponseEnhancementService();

  // Empty text
  const emptyResult = await service.enhance('');
  console.log('Empty text result:', emptyResult.enhancedText === '');

  // Text with no predictions or facts
  const generalText = 'Real estate is an important investment.';
  const generalResult = await service.enhance(generalText);
  console.log('General text unchanged:', generalResult.enhancedText === generalText);

  // Text with special characters
  const specialText = 'Prices increased by 10% (±2%). ROI: $1,000,000+.';
  const specialResult = await service.enhance(specialText);
  console.log('Special characters handled:', specialResult.enhancedText.length > 0);

  // Very long text
  const longText = 'The market will grow. '.repeat(100);
  const longResult = await service.enhance(longText);
  console.log('Long text processed:', longResult.predictions.length > 0);
}

/**
 * Example 9: Custom Configuration
 * 
 * Create a custom configuration for specific use cases
 */
export async function customConfigurationExample() {
  // Configuration for internal analysis (no qualifying language needed)
  const internalConfig = {
    enableQualifyingLanguage: false,
    enableFactualGrounding: true,
    enableCitationEnforcement: false,
    strictMode: false,
  };

  // Configuration for client-facing content (strict requirements)
  const clientFacingConfig = {
    enableQualifyingLanguage: true,
    enableFactualGrounding: true,
    enableCitationEnforcement: true,
    strictMode: true,
  };

  const text = 'The market will grow by 10%. Median price is $500k.';

  // Internal use
  const internalService = new ResponseEnhancementService(internalConfig);
  const internalResult = await internalService.enhance(text);
  console.log('Internal analysis:', internalResult.enhancedText);

  // Client-facing use
  const clientService = new ResponseEnhancementService(clientFacingConfig);
  try {
    const clientResult = await clientService.enhance(text);
    console.log('Client-facing:', clientResult.enhancedText);
  } catch (error) {
    console.log('Strict mode caught uncited facts');
  }
}

/**
 * Example 10: Monitoring and Logging
 * 
 * Show how to monitor enhancement results for quality assurance
 */
export async function monitoringExample() {
  const service = new ResponseEnhancementService();

  const text = 'The market will grow. Prices increased by 10%. Sales are up.';

  const result = await service.enhance(text);

  // Log metrics for monitoring
  const metrics = {
    timestamp: new Date().toISOString(),
    textLength: text.length,
    predictionsDetected: result.predictions.length,
    factsDetected: result.facts.length,
    modificationsCount: result.modificationsApplied.length,
    warningsCount: result.warnings.length,
    enhancementRatio: result.enhancedText.length / text.length,
  };

  console.log('Enhancement Metrics:', JSON.stringify(metrics, null, 2));

  // Alert on quality issues
  if (result.warnings.length > 3) {
    console.warn('⚠️  High number of warnings detected - review content quality');
  }

  if (result.facts.length > 5 && result.facts.filter(f => f.hasCitation).length === 0) {
    console.warn('⚠️  Multiple facts without citations - add sources');
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  (async () => {
    console.log('=== Response Enhancement Examples ===\n');

    console.log('Example 1: Basic Enhancement');
    await basicEnhancementExample();

    console.log('\n\nExample 6: Market Analysis');
    await marketAnalysisExample();

    console.log('\n\nExample 7: AI Flow Integration');
    await aiFlowIntegrationExample();
  })();
}
