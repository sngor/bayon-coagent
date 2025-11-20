/**
 * Workflow Orchestrator Usage Examples
 * 
 * This file demonstrates how to use the WorkflowOrchestrator to handle
 * complex multi-agent workflows.
 */

import { getWorkflowOrchestrator } from './orchestrator';
import { getAgentProfileRepository, type AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Example 1: Simple workflow execution
 * Analyzes market trends and generates a summary
 */
export async function exampleSimpleWorkflow() {
  const orchestrator = getWorkflowOrchestrator();
  
  // Create a sample agent profile
  const agentProfile: AgentProfile = {
    userId: 'user123',
    agentName: 'Jane Smith',
    primaryMarket: 'Austin, TX',
    specialization: 'luxury',
    preferredTone: 'warm-consultative',
    corePrinciple: 'Maximize client ROI with data-first strategies',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Execute a complex workflow
  const result = await orchestrator.executeCompleteWorkflow(
    'What are the current market trends in Austin for luxury homes, and can you create a summary email for my clients?',
    agentProfile
  );

  console.log('Synthesized Response:', result.synthesizedResponse);
  console.log('Key Points:', result.keyPoints);
  console.log('Citations:', result.citations);
  console.log('Execution Time:', result.executionTime, 'ms');
  console.log('Failed Tasks:', result.failedTasks);

  return result;
}

/**
 * Example 2: Manual workflow control
 * Demonstrates step-by-step workflow execution
 */
export async function exampleManualWorkflow() {
  const orchestrator = getWorkflowOrchestrator();
  
  const agentProfile: AgentProfile = {
    userId: 'user456',
    agentName: 'John Doe',
    primaryMarket: 'Seattle, WA',
    specialization: 'first-time-buyers',
    preferredTone: 'direct-data-driven',
    corePrinciple: 'Educate and empower first-time buyers',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Step 1: Decompose the request
  console.log('Step 1: Decomposing request...');
  const tasks = await orchestrator.decomposeRequest(
    'Analyze the Seattle housing market for first-time buyers and forecast trends for the next 6 months',
    agentProfile
  );
  
  console.log(`Created ${tasks.length} tasks:`);
  tasks.forEach((task, i) => {
    console.log(`  ${i + 1}. ${task.type}: ${task.description}`);
  });

  // Step 2: Execute the workflow
  console.log('\nStep 2: Executing workflow...');
  const results = await orchestrator.executeWorkflow(tasks);
  
  console.log(`Completed ${results.length} tasks:`);
  results.forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.workerType}: ${result.status}`);
    if (result.status === 'error') {
      console.log(`     Error: ${result.error?.message}`);
    }
  });

  // Step 3: Synthesize results
  console.log('\nStep 3: Synthesizing results...');
  const synthesis = await orchestrator.synthesizeResults(
    results,
    agentProfile,
    'Analyze the Seattle housing market for first-time buyers and forecast trends for the next 6 months'
  );

  console.log('Synthesized Response:', synthesis.synthesizedResponse);
  console.log('Key Points:', synthesis.keyPoints);

  return { tasks, results, synthesis };
}

/**
 * Example 3: Handling workflow failures
 * Demonstrates graceful degradation when workers fail
 */
export async function exampleWorkflowWithFailures() {
  const orchestrator = getWorkflowOrchestrator();
  
  const agentProfile: AgentProfile = {
    userId: 'user789',
    agentName: 'Sarah Johnson',
    primaryMarket: 'Miami, FL',
    specialization: 'investment',
    preferredTone: 'professional',
    corePrinciple: 'Data-driven investment strategies',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // This request might cause some workers to fail
    const result = await orchestrator.executeCompleteWorkflow(
      'Find investment opportunities in Miami and create a detailed analysis with market forecasts',
      agentProfile
    );

    if (result.failedTasks.length > 0) {
      console.log('Some tasks failed, but we still got results:');
      console.log('Failed tasks:', result.failedTasks);
      console.log('Synthesized response:', result.synthesizedResponse);
    } else {
      console.log('All tasks completed successfully!');
      console.log('Response:', result.synthesizedResponse);
    }

    return result;
  } catch (error) {
    console.error('Workflow failed completely:', error);
    throw error;
  }
}

/**
 * Example 4: Using with real user profile from database
 */
export async function exampleWithRealProfile(userId: string, prompt: string) {
  const orchestrator = getWorkflowOrchestrator();
  const profileRepo = getAgentProfileRepository();

  // Load agent profile from database
  const agentProfile = await profileRepo.getProfile(userId);

  if (!agentProfile) {
    throw new Error('Agent profile not found. Please create a profile first.');
  }

  // Execute workflow with real profile
  const result = await orchestrator.executeCompleteWorkflow(
    prompt,
    agentProfile
  );

  return result;
}

/**
 * Example 5: Workflow without agent profile
 * Uses default system behavior
 */
export async function exampleWithoutProfile() {
  const orchestrator = getWorkflowOrchestrator();

  // Execute workflow without personalization
  const result = await orchestrator.executeCompleteWorkflow(
    'What are the key factors affecting real estate prices in 2024?'
    // No agent profile provided
  );

  console.log('Response (no personalization):', result.synthesizedResponse);
  console.log('Citations:', result.citations);

  return result;
}

/**
 * Example 6: Complex multi-step workflow
 * Demonstrates handling of sequential and parallel tasks
 */
export async function exampleComplexWorkflow() {
  const orchestrator = getWorkflowOrchestrator();
  
  const agentProfile: AgentProfile = {
    userId: 'user999',
    agentName: 'Michael Chen',
    primaryMarket: 'San Francisco, CA',
    specialization: 'commercial',
    preferredTone: 'professional',
    corePrinciple: 'Strategic commercial real estate solutions',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Complex request that should decompose into multiple tasks
  const result = await orchestrator.executeCompleteWorkflow(
    `I need a comprehensive analysis of the San Francisco commercial real estate market. 
    Please analyze current market data, forecast trends for the next year, and create 
    a professional summary report I can share with potential investors.`,
    agentProfile
  );

  console.log('\n=== Complex Workflow Results ===');
  console.log(`Tasks executed: ${result.tasks.length}`);
  console.log(`Successful: ${result.tasks.length - result.failedTasks.length}`);
  console.log(`Failed: ${result.failedTasks.length}`);
  console.log(`Total execution time: ${result.executionTime}ms`);
  console.log('\nKey Points:');
  result.keyPoints.forEach((point, i) => {
    console.log(`  ${i + 1}. ${point}`);
  });
  console.log('\nCitations:');
  result.citations.forEach((citation, i) => {
    console.log(`  ${i + 1}. ${citation.title} (${citation.sourceType})`);
    console.log(`     ${citation.url}`);
  });

  return result;
}

// Export all examples
export const examples = {
  simple: exampleSimpleWorkflow,
  manual: exampleManualWorkflow,
  withFailures: exampleWorkflowWithFailures,
  withRealProfile: exampleWithRealProfile,
  withoutProfile: exampleWithoutProfile,
  complex: exampleComplexWorkflow,
};
