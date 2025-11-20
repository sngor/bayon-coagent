/**
 * Efficiency Optimizer Usage Examples
 * 
 * This file demonstrates how to use the EfficiencyOptimizer service
 * to optimize AI-generated responses for conciseness and readability.
 */

import {
  EfficiencyOptimizer,
  DEFAULT_OPTIMIZATION_CONFIG,
  OptimizationConfig,
} from './efficiency-optimizer';

/**
 * Example 1: Basic optimization with default settings
 */
export async function basicOptimizationExample() {
  const optimizer = new EfficiencyOptimizer();

  const verboseResponse = `
Hello! Thank you for asking about the Austin real estate market.

I hope this helps! The market has been quite interesting lately. You know, basically, 
the median home price in Austin increased by 8.2% year-over-year. In order to understand 
this trend, we need to look at several factors.

Due to the fact that inventory levels are low, prices continue to rise. At this point in time, 
there are only 2.1 months of supply available.

Let me know if you have any other questions! Have a great day!
  `.trim();

  const result = optimizer.optimize(verboseResponse);

  console.log('Original length:', result.originalLength);
  console.log('Optimized length:', result.optimizedLength);
  console.log('Reduction:', result.reductionPercentage.toFixed(1) + '%');
  console.log('\nModifications applied:');
  result.modificationsApplied.forEach(mod => console.log('  -', mod));
  console.log('\nOptimized text:');
  console.log(result.optimizedText);

  return result;
}

/**
 * Example 2: Optimize with bullet point formatting
 */
export async function bulletPointFormattingExample() {
  const optimizer = new EfficiencyOptimizer({
    useBulletPoints: true,
    removeFiller: true,
  });

  const listResponse = `
The top neighborhoods for luxury homes in Austin are:

1. Westlake Hills - Known for hill country views and large estates
2. Tarrytown - Historic neighborhood with tree-lined streets
3. Barton Creek - Gated communities with golf course access
4. Rob Roy - Exclusive area with custom homes

Each of these areas offers unique advantages for high-end buyers.
  `.trim();

  const result = optimizer.optimize(listResponse);

  console.log('Optimized with bullet points:');
  console.log(result.optimizedText);

  return result;
}

/**
 * Example 3: Optimize with table formatting
 */
export async function tableFormattingExample() {
  const optimizer = new EfficiencyOptimizer({
    useTables: true,
    removeFiller: true,
  });

  const structuredResponse = `
Here are the key market metrics for Austin:

Median Price: $575,000
Average Days on Market: 32
Inventory Level: 2.1 months
Year-over-Year Growth: 8.2%
Active Listings: 3,450

These metrics indicate a strong seller's market.
  `.trim();

  const result = optimizer.optimize(structuredResponse);

  console.log('Optimized with table:');
  console.log(result.optimizedText);

  return result;
}

/**
 * Example 4: Answer prioritization
 */
export async function answerPrioritizationExample() {
  const optimizer = new EfficiencyOptimizer({
    prioritizeAnswer: true,
    removeFiller: true,
  });

  const reasoningFirstResponse = `
To understand the current market conditions, we need to analyze several factors. 
First, inventory levels have decreased by 15% compared to last year. Second, 
buyer demand remains strong with multiple offers on most properties. Third, 
interest rates have stabilized around 7%.

The answer is: Yes, it's currently a seller's market in Austin. Properties are 
selling quickly with competitive offers.
  `.trim();

  const result = optimizer.optimize(reasoningFirstResponse);

  console.log('Restructured to prioritize answer:');
  console.log(result.optimizedText);

  return result;
}

/**
 * Example 5: Custom configuration for specific use case
 */
export async function customConfigExample() {
  // Configuration for client-facing content (keep some warmth)
  const clientConfig: OptimizationConfig = {
    useBulletPoints: true,
    useTables: false,
    removeGreetings: false, // Keep greetings for client communication
    removeFiller: true,
    prioritizeAnswer: true,
  };

  const optimizer = new EfficiencyOptimizer(clientConfig);

  const clientResponse = `
Hello! Thank you for reaching out about listing your property.

Based on comparable sales in your neighborhood, I recommend listing your home at $625,000. 
Here's why: Recent sales show homes like yours selling between $600,000 and $650,000. 
Your home's updated kitchen and pool add significant value. The market is currently 
favoring sellers with low inventory.

Let me know if you have any questions!
  `.trim();

  const result = optimizer.optimize(clientResponse);

  console.log('Optimized for client communication:');
  console.log(result.optimizedText);

  return result;
}

/**
 * Example 6: Aggressive optimization with length limit
 */
export async function aggressiveOptimizationExample() {
  const optimizer = new EfficiencyOptimizer({
    maxLength: 200,
    useBulletPoints: true,
    useTables: true,
    removeGreetings: true,
    removeFiller: true,
    prioritizeAnswer: true,
  });

  const longResponse = `
Hello! Thank you for your question about investment opportunities in Austin.

The Austin real estate market presents several compelling investment opportunities 
in 2024. Due to the fact that the city continues to attract major employers like 
Tesla, Oracle, and numerous tech startups, population growth remains strong. 
This, in turn, drives housing demand.

In order to maximize returns, consider these neighborhoods:

1. East Austin - Rapidly appreciating area with new development
2. South Congress - High rental demand from young professionals
3. Domain area - Strong commercial and residential growth
4. Mueller - Master-planned community with consistent appreciation

At this point in time, rental yields average 6-8% annually, while appreciation 
has averaged 10% over the past five years. I hope this helps with your investment 
decision! Let me know if you have any other questions.
  `.trim();

  const result = optimizer.optimize(longResponse);

  console.log('Aggressively optimized:');
  console.log('Original:', result.originalLength, 'chars');
  console.log('Optimized:', result.optimizedLength, 'chars');
  console.log('Reduction:', result.reductionPercentage.toFixed(1) + '%');
  console.log('\n' + result.optimizedText);

  return result;
}

/**
 * Example 7: Integration with other services
 */
export async function integratedWorkflowExample() {
  // Simulate a complete workflow with response enhancement and optimization
  const optimizer = new EfficiencyOptimizer(DEFAULT_OPTIMIZATION_CONFIG);

  // Simulated AI response (would come from Bedrock in real usage)
  const aiResponse = `
Hello! I'd be happy to help you understand the market forecast for Austin.

Based on current trends, the market will continue to grow. Historical data suggests 
prices will increase by 5-7% next year. Here's why this is likely:

1. Population growth continues at 3% annually
2. Job market remains strong with tech sector expansion
3. Housing supply is constrained by limited new construction
4. Interest rates are expected to stabilize

In summary: The Austin market shows strong fundamentals for continued appreciation. 
However, this is a projection based on current conditions and historical trends.

I hope this helps! Let me know if you need more information.
  `.trim();

  // Step 1: Optimize for efficiency
  const optimizationResult = optimizer.optimize(aiResponse);

  console.log('=== Integrated Workflow Example ===\n');
  console.log('Modifications applied:');
  optimizationResult.modificationsApplied.forEach(mod => 
    console.log('  ✓', mod)
  );
  console.log('\nFinal optimized response:');
  console.log(optimizationResult.optimizedText);
  console.log('\nEfficiency gain:', optimizationResult.reductionPercentage.toFixed(1) + '%');

  return optimizationResult;
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Efficiency Optimizer Examples ===\n');

  console.log('\n--- Example 1: Basic Optimization ---');
  await basicOptimizationExample();

  console.log('\n--- Example 2: Bullet Point Formatting ---');
  await bulletPointFormattingExample();

  console.log('\n--- Example 3: Table Formatting ---');
  await tableFormattingExample();

  console.log('\n--- Example 4: Answer Prioritization ---');
  await answerPrioritizationExample();

  console.log('\n--- Example 5: Custom Configuration ---');
  await customConfigExample();

  console.log('\n--- Example 6: Aggressive Optimization ---');
  await aggressiveOptimizationExample();

  console.log('\n--- Example 7: Integrated Workflow ---');
  await integratedWorkflowExample();
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
