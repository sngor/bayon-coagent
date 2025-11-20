/**
 * Worker Agents Usage Examples
 * 
 * This file demonstrates how to use the worker agents in various scenarios.
 * These examples can be used as a reference for implementing the Workflow Orchestrator.
 */

import {
  // Worker execution
  executeWorkerTask,
  createWorkerTask,
  
  // Direct execution functions
  analyzeData,
  generateContent,
  forecastMarket,
  
  // Type guards
  isSuccessResult,
  isErrorResult,
  
  // Types
  type WorkerTask,
  type WorkerResult,
} from './index';

/**
 * Example 1: Data Analysis with Tavily Search
 */
export async function exampleDataAnalysis() {
  console.log('=== Data Analysis Example ===\n');
  
  try {
    // Direct execution (recommended for simple use cases)
    const result = await analyzeData({
      query: 'What are the average home prices in Austin, TX for luxury properties?',
      dataSource: 'tavily',
      context: {
        market: 'Austin, TX',
        timeframe: '2024',
        propertyType: 'luxury',
      },
    });
    
    console.log('Summary:', result.summary);
    console.log('Data Points:', result.data.length);
    console.log('Sources:', result.sources.length);
    console.log('Confidence:', result.confidence);
    
    if (result.insights) {
      console.log('\nKey Insights:');
      result.insights.forEach((insight, i) => {
        console.log(`${i + 1}. ${insight}`);
      });
    }
  } catch (error) {
    console.error('Data analysis failed:', error);
  }
}

/**
 * Example 2: Content Generation with Agent Profile
 */
export async function exampleContentGeneration() {
  console.log('\n=== Content Generation Example ===\n');
  
  try {
    const result = await generateContent({
      contentType: 'email',
      context: {
        recipient: 'potential luxury home buyer',
        subject: 'Exclusive new listing in West Lake Hills',
        propertyDetails: {
          address: '123 Scenic Drive',
          price: '$2,500,000',
          bedrooms: 5,
          bathrooms: 4,
          sqft: 4500,
        },
      },
      agentProfile: {
        agentName: 'Jane Smith',
        primaryMarket: 'Austin, TX',
        specialization: 'luxury',
        preferredTone: 'warm-consultative',
        corePrinciple: 'Maximize client ROI with data-first strategies',
      },
      instructions: 'Create a compelling email that highlights the property features and invites the recipient to a private showing',
      targetLength: 250,
    });
    
    console.log('Generated Content:');
    console.log(result.content);
    console.log('\nTone:', result.tone);
    console.log('Word Count:', result.wordCount);
    console.log('\nPersonalization:');
    console.log('- Agent name used:', result.personalization.agentNameUsed);
    console.log('- Market mentioned:', result.personalization.marketMentioned);
    console.log('- Specialization reflected:', result.personalization.specializationReflected);
    console.log('- Core principle included:', result.personalization.corePrincipleIncluded);
  } catch (error) {
    console.error('Content generation failed:', error);
  }
}

/**
 * Example 3: Market Forecasting with Qualifying Language
 */
export async function exampleMarketForecasting() {
  console.log('\n=== Market Forecasting Example ===\n');
  
  try {
    const result = await forecastMarket({
      historicalData: [
        { date: '2024-01', value: 450000, metric: 'median_price' },
        { date: '2024-02', value: 455000, metric: 'median_price' },
        { date: '2024-03', value: 460000, metric: 'median_price' },
        { date: '2024-04', value: 465000, metric: 'median_price' },
        { date: '2024-05', value: 470000, metric: 'median_price' },
        { date: '2024-06', value: 475000, metric: 'median_price' },
      ],
      timeframe: '90-day',
      market: 'Austin, TX',
      propertyType: 'single-family',
    });
    
    console.log('Forecast:');
    console.log('- Trend:', result.forecast.trend);
    console.log('- Confidence:', (result.forecast.confidence * 100).toFixed(1) + '%');
    console.log('- Price Range:', `$${result.forecast.priceRange.low.toLocaleString()} - $${result.forecast.priceRange.high.toLocaleString()}`);
    
    if (result.forecast.percentageChange) {
      console.log('- Expected Change:', result.forecast.percentageChange.expected.toFixed(1) + '%');
    }
    
    console.log('\nKey Factors:');
    result.factors.forEach((factor, i) => {
      console.log(`${i + 1}. ${factor}`);
    });
    
    console.log('\nAnalysis:');
    console.log(result.analysis);
    
    console.log('\nDisclaimer:');
    console.log(result.disclaimer);
    
    if (result.recommendations) {
      console.log('\nRecommendations:');
      result.recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
  } catch (error) {
    console.error('Market forecasting failed:', error);
  }
}

/**
 * Example 4: Using Worker Protocol for Task Management
 */
export async function exampleWorkerProtocol() {
  console.log('\n=== Worker Protocol Example ===\n');
  
  // Create a task
  const task = createWorkerTask(
    'data-analyst',
    'Analyze market trends for investment properties',
    {
      query: 'What are the best investment opportunities in Austin?',
      dataSource: 'tavily',
      context: {
        market: 'Austin, TX',
        propertyType: 'investment',
      },
    },
    {
      context: {
        userId: 'user123',
        conversationId: 'conv456',
      },
    }
  );
  
  console.log('Created task:', task.id);
  console.log('Task type:', task.type);
  console.log('Task status:', task.status);
  
  // Execute the task
  const result = await executeWorkerTask(task);
  
  console.log('\nExecution completed:');
  console.log('- Status:', result.status);
  console.log('- Execution time:', result.metadata.executionTime + 'ms');
  console.log('- Model used:', result.metadata.modelId);
  
  // Check result type
  if (isSuccessResult(result)) {
    console.log('\n✓ Task completed successfully');
    console.log('Output keys:', Object.keys(result.output));
    
    if (result.citations && result.citations.length > 0) {
      console.log('\nCitations:');
      result.citations.forEach((citation, i) => {
        console.log(`${i + 1}. ${citation.title} (${citation.sourceType})`);
        console.log(`   ${citation.url}`);
      });
    }
  } else if (isErrorResult(result)) {
    console.log('\n✗ Task failed');
    console.log('Error type:', result.error.type);
    console.log('Error message:', result.error.message);
  }
}

/**
 * Example 5: Parallel Worker Execution
 */
export async function exampleParallelExecution() {
  console.log('\n=== Parallel Execution Example ===\n');
  
  // Create multiple tasks
  const tasks: WorkerTask[] = [
    createWorkerTask('data-analyst', 'Analyze market data', {
      query: 'Current market trends in Austin',
      dataSource: 'tavily',
    }),
    createWorkerTask('content-generator', 'Generate summary', {
      contentType: 'summary',
      context: { topic: 'Austin real estate market' },
      agentProfile: {
        agentName: 'John Doe',
        primaryMarket: 'Austin, TX',
        specialization: 'general',
        preferredTone: 'professional',
        corePrinciple: 'Client success first',
      },
    }),
  ];
  
  console.log(`Executing ${tasks.length} tasks in parallel...`);
  
  // Execute all tasks in parallel
  const results = await Promise.all(
    tasks.map(task => executeWorkerTask(task))
  );
  
  console.log('\nResults:');
  results.forEach((result: WorkerResult, i: number) => {
    console.log(`\nTask ${i + 1}:`);
    console.log('- Type:', result.workerType);
    console.log('- Status:', result.status);
    console.log('- Execution time:', result.metadata.executionTime + 'ms');
    
    if (isSuccessResult(result)) {
      console.log('- Output available: ✓');
    } else if (isErrorResult(result)) {
      console.log('- Error:', result.error.message);
    }
  });
  
  // Calculate total execution time
  const totalTime = Math.max(...results.map((r: WorkerResult) => r.metadata.executionTime));
  console.log(`\nTotal parallel execution time: ${totalTime}ms`);
}

/**
 * Example 6: Error Handling
 */
export async function exampleErrorHandling() {
  console.log('\n=== Error Handling Example ===\n');
  
  try {
    // This will fail due to invalid input
    const task = createWorkerTask('data-analyst', 'Invalid task', {
      // Missing required fields
      query: '',
      dataSource: 'invalid' as any,
    });
    
    const result = await executeWorkerTask(task);
    
    if (isErrorResult(result)) {
      console.log('Error caught by worker:');
      console.log('- Type:', result.error.type);
      console.log('- Message:', result.error.message);
      console.log('- Code:', result.error.code);
      
      // Handle different error types
      switch (result.error.type) {
        case 'VALIDATION_ERROR':
          console.log('\n→ Action: Fix input validation');
          break;
        case 'API_ERROR':
          console.log('\n→ Action: Retry with exponential backoff');
          break;
        case 'TIMEOUT_ERROR':
          console.log('\n→ Action: Increase timeout or simplify request');
          break;
        case 'RESOURCE_NOT_FOUND':
          console.log('\n→ Action: Check resource availability');
          break;
        case 'INTERNAL_ERROR':
          console.log('\n→ Action: Log error and notify developers');
          break;
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         Worker Agents Usage Examples                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  await exampleDataAnalysis();
  await exampleContentGeneration();
  await exampleMarketForecasting();
  await exampleWorkerProtocol();
  await exampleParallelExecution();
  await exampleErrorHandling();
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║         All Examples Completed                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
}

// Uncomment to run examples
// runAllExamples().catch(console.error);
