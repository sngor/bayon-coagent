'use server';

/**
 * Data Analyst Worker Agent
 * 
 * This worker agent handles data analysis tasks including market data analysis,
 * property data analysis, and statistical analysis. It integrates with Tavily
 * search API for web-based data gathering.
 * 
 * Requirements: 4.2
 */

import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
  DataAnalystInputSchema,
  DataAnalystOutputSchema,
  type DataAnalystInput,
  type DataAnalystOutput,
} from '@/ai/schemas/data-analyst-worker-schemas';
import { getSearchClient, type SearchResult } from '@/aws/search';
import type { WorkerTask, WorkerResult } from '../worker-protocol';
import { createSuccessResult, createErrorResult } from '../worker-protocol';
import { getAgentProfileRepository, type AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

export { type DataAnalystInput, type DataAnalystOutput };

/**
 * Data Analyst prompt that processes search results and generates analysis
 * with agent profile personalization
 */
const dataAnalystPrompt = definePrompt({
  name: 'dataAnalystWorker',
  inputSchema: z.object({
    query: z.string(),
    searchResults: z.string(),
    context: z.any().optional(),
    agentProfile: z.any().optional(),
  }),
  outputSchema: DataAnalystOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL,
  systemPrompt: `You are a real estate data analyst with expertise in market analysis, property valuation, and statistical analysis. Your role is to analyze data and provide clear, actionable insights.

**Your responsibilities:**
1. Analyze data from various sources (MLS listings, market reports, web search results)
2. Extract key data points and structure them clearly
3. Provide a concise summary of findings
4. Identify important insights and trends
5. Cite all sources used in the analysis
6. Assess confidence level in your analysis
7. When an agent profile is provided, prioritize data relevant to their market and specialization

**Guidelines:**
- Focus on real estate-relevant data only
- Use precise numbers and statistics when available
- Clearly indicate when data is estimated or uncertain
- Structure data points with labels, values, and units
- Provide actionable insights, not just raw data
- Always cite your sources
- When analyzing for a specific agent, prioritize their primary market and specialization`,
  prompt: `Analyze the following data request:

**Query:** {{{query}}}

{{#if agentProfile}}
**Agent Context:**
- Agent: {{{agentProfile.agentName}}}
- Primary Market: {{{agentProfile.primaryMarket}}}
- Specialization: {{{agentProfile.specialization}}}
- Core Principle: {{{agentProfile.corePrinciple}}}

Please prioritize data relevant to {{{agentProfile.primaryMarket}}} and {{{agentProfile.specialization}}} properties.
{{/if}}

**Context:** {{{json context}}}

**Search Results:**
{{{searchResults}}}

Based on the search results and your real estate expertise, provide:
1. Structured data points (label, value, unit, source)
2. A clear summary of the analysis{{#if agentProfile}} relevant to {{{agentProfile.primaryMarket}}}{{/if}}
3. Citations for all sources used
4. Key insights from the data{{#if agentProfile}} aligned with {{{agentProfile.specialization}}} focus{{/if}}
5. Your confidence level in this analysis (0-1)

Remember to focus only on real estate-relevant information and cite all sources.`,
});

/**
 * Executes the Data Analyst Worker
 * 
 * @param task - Worker task with data analysis request
 * @returns Worker result with analysis output
 */
export async function executeDataAnalystWorker(
  task: WorkerTask
): Promise<WorkerResult> {
  const startTime = Date.now();
  const startedAt = new Date().toISOString();
  
  try {
    // Validate input
    const input = DataAnalystInputSchema.parse(task.input);
    
    // Load agent profile if userId is provided in context
    let agentProfile: AgentProfile | null = null;
    if (task.context?.userId) {
      const profileRepo = getAgentProfileRepository();
      agentProfile = await profileRepo.getProfile(task.context.userId);
    }
    
    // Perform web search if using Tavily or web data source
    let searchResults: SearchResult[] = [];
    let searchResultsText = '';
    
    if (input.dataSource === 'tavily' || input.dataSource === 'web') {
      const searchClient = getSearchClient('tavily');
      
      // Construct search query with context
      let searchQuery = input.query;
      
      // Prioritize agent's primary market if profile is available
      if (agentProfile?.primaryMarket) {
        searchQuery += ` ${agentProfile.primaryMarket}`;
      } else if (input.context?.market) {
        searchQuery += ` ${input.context.market}`;
      }
      
      if (input.context?.propertyType) {
        searchQuery += ` ${input.context.propertyType}`;
      }
      
      // Perform search
      const searchResponse = await searchClient.search(searchQuery, {
        maxResults: 5,
        searchDepth: 'advanced',
        includeAnswer: true,
      });
      
      searchResults = searchResponse.results;
      
      // Format search results for AI consumption
      searchResultsText = searchClient.formatResultsForAI(searchResults, true);
      
      // Add AI-generated answer if available
      if (searchResponse.answer) {
        searchResultsText = `AI Summary: ${searchResponse.answer}\n\n---\n\n${searchResultsText}`;
      }
    } else {
      // For other data sources, provide a placeholder
      searchResultsText = `Data source: ${input.dataSource}\nQuery: ${input.query}\n\nNote: This is a placeholder. In production, integrate with actual MLS or market report APIs.`;
    }
    
    // Execute analysis prompt with agent profile
    const output = await dataAnalystPrompt({
      query: input.query,
      searchResults: searchResultsText,
      context: input.context || {},
      agentProfile: agentProfile || undefined,
    });
    
    // Extract citations from search results
    const citations = searchResults.map(result => ({
      url: result.url,
      title: result.title,
      sourceType: input.dataSource,
    }));
    
    // Merge with citations from output
    const allCitations = [
      ...citations,
      ...(output.sources || []),
    ];
    
    // Remove duplicates based on URL
    const uniqueCitations = Array.from(
      new Map(allCitations.map(c => [c.url, c])).values()
    );
    
    const executionTime = Date.now() - startTime;
    
    return createSuccessResult(
      task.id,
      'data-analyst',
      output,
      {
        executionTime,
        startedAt,
        modelId: MODEL_CONFIGS.ANALYTICAL.modelId,
      },
      uniqueCitations
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    // Determine error type
    let errorType: 'VALIDATION_ERROR' | 'API_ERROR' | 'INTERNAL_ERROR' = 'INTERNAL_ERROR';
    let errorMessage = 'An unexpected error occurred during data analysis';
    
    if (error instanceof z.ZodError) {
      errorType = 'VALIDATION_ERROR';
      errorMessage = `Input validation failed: ${error.errors.map(e => e.message).join(', ')}`;
    } else if (error instanceof Error) {
      if (error.message.includes('API') || error.message.includes('search')) {
        errorType = 'API_ERROR';
      }
      errorMessage = error.message;
    }
    
    return createErrorResult(
      task.id,
      'data-analyst',
      {
        type: errorType,
        message: errorMessage,
        details: error instanceof Error ? { stack: error.stack } : undefined,
      },
      {
        executionTime,
        startedAt,
      }
    );
  }
}

/**
 * Convenience function to execute data analysis directly
 * (without going through the worker protocol)
 */
export async function analyzeData(
  input: DataAnalystInput
): Promise<DataAnalystOutput> {
  const task: WorkerTask = {
    id: `direct_${Date.now()}`,
    type: 'data-analyst',
    description: input.query,
    dependencies: [],
    input,
    createdAt: new Date().toISOString(),
    status: 'in-progress',
  };
  
  const result = await executeDataAnalystWorker(task);
  
  if (result.status === 'error') {
    throw new Error(result.error?.message || 'Data analysis failed');
  }
  
  return result.output as DataAnalystOutput;
}
