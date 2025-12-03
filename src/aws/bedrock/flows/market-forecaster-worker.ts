'use server';

/**
 * Market Forecaster Worker Agent
 * 
 * This worker agent handles market forecasting tasks with automatic
 * qualifying language injection for predictions. It analyzes historical
 * data and provides forecasts with appropriate disclaimers.
 * 
 * Requirements: 4.2, 1.5 (qualifying language for predictions)
 */

import { z } from 'zod';
import { definePrompt, MODEL_CONFIGS } from '../flow-base';
import {
  MarketForecasterInputSchema,
  MarketForecasterOutputSchema,
} from '@/ai/schemas/market-forecaster-worker-schemas';
import type {
  MarketForecasterInput,
  MarketForecasterOutput,
} from '@/ai/schemas/market-forecaster-worker-schemas';
import type { WorkerTask, WorkerResult } from '../worker-protocol';
import { createSuccessResult, createErrorResult } from '../worker-protocol';
import { getAgentProfileRepository, type AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Market Forecaster prompt that generates predictions with qualifying language
 * and agent profile personalization
 */
const marketForecasterPrompt = definePrompt({
  name: 'marketForecasterWorker',
  inputSchema: z.object({
    market: z.string(),
    timeframe: z.enum(['30-day', '90-day', '6-month', '1-year', '2-year']),
    historicalData: z.array(z.object({
      date: z.string(),
      value: z.number(),
      metric: z.string(),
    })),
    propertyType: z.string().optional(),
    context: z.any().optional(),
    agentProfile: z.any().optional(),
  }),
  outputSchema: MarketForecasterOutputSchema,
  options: MODEL_CONFIGS.ANALYTICAL,
  systemPrompt: `You are a real estate market analyst specializing in market forecasting and trend analysis. You provide data-driven forecasts while maintaining appropriate caution and disclaimers.

**Your responsibilities:**
1. Analyze historical market data to identify trends and patterns
2. Generate forecasts with realistic confidence levels
3. Identify key factors influencing market conditions
4. Provide actionable recommendations based on forecasts
5. ALWAYS include qualifying language for predictions
6. ALWAYS include appropriate disclaimers
7. When an agent profile is provided, tailor recommendations to their specialization and market

**CRITICAL: Qualifying Language Requirements**
You MUST use qualifying language for all predictions and forecasts:
- Use phrases like "historical trends suggest", "data indicates", "may", "could", "aim for"
- Never make absolute guarantees or promises
- Always acknowledge uncertainty and market volatility
- Include confidence levels with all predictions
- Clearly state that past performance doesn't guarantee future results

**Disclaimer Requirements:**
Every forecast MUST include a disclaimer that:
- States predictions are based on historical data and current trends
- Acknowledges market conditions can change rapidly
- Notes that forecasts are not guarantees
- Recommends consulting with financial advisors for investment decisions`,
  prompt: `Analyze the following market data and generate a forecast:

**Market:** {{{market}}}
**Timeframe:** {{{timeframe}}}
**Property Type:** {{{propertyType}}}

{{#if agentProfile}}
**Agent Context:**
- Agent: {{{agentProfile.agentName}}}
- Primary Market: {{{agentProfile.primaryMarket}}}
- Specialization: {{{agentProfile.specialization}}}
- Core Principle: {{{agentProfile.corePrinciple}}}

Please tailor recommendations to {{{agentProfile.specialization}}} properties and {{{agentProfile.primaryMarket}}} market conditions.
{{/if}}

**Historical Data:**
{{{json historicalData}}}

**Additional Context:**
{{{json context}}}

Based on this data, provide:
1. A forecast with trend direction, confidence level, and price range
2. Key factors influencing the forecast
3. A comprehensive disclaimer with qualifying language
4. Detailed analysis narrative (using qualifying language throughout)
5. Actionable recommendations{{#if agentProfile}} aligned with {{{agentProfile.specialization}}} focus and {{{agentProfile.corePrinciple}}}{{/if}}
6. Data sources used

REMEMBER: Use qualifying language like "historical trends suggest", "data indicates", "may", "could" throughout your analysis. Never make absolute predictions or guarantees.`,
});

/**
 * Executes the Market Forecaster Worker
 * 
 * @param task - Worker task with market forecasting request
 * @returns Worker result with forecast output
 */
export async function executeMarketForecasterWorker(
  task: WorkerTask
): Promise<WorkerResult> {
  const startTime = Date.now();
  const startedAt = new Date().toISOString();

  try {
    // Validate input
    const input = MarketForecasterInputSchema.parse(task.input);

    // Validate historical data is not empty
    if (!input.historicalData || input.historicalData.length === 0) {
      throw new Error('Historical data is required for market forecasting');
    }

    // Load agent profile if userId is provided in context
    let agentProfile: AgentProfile | null = null;
    if (task.context?.userId) {
      const profileRepo = getAgentProfileRepository();
      agentProfile = await profileRepo.getProfile(task.context.userId);
    }

    // Execute forecasting prompt with agent profile
    const output = await marketForecasterPrompt({
      ...input,
      propertyType: input.propertyType || 'all property types',
      context: input.context || {},
      agentProfile: agentProfile || undefined,
    });

    // Verify qualifying language is present in disclaimer
    const hasQualifyingLanguage = verifyQualifyingLanguage(output.disclaimer);
    if (!hasQualifyingLanguage) {
      // Inject additional qualifying language if missing
      output.disclaimer = enhanceDisclaimer(output.disclaimer);
    }

    // Verify qualifying language in analysis
    const analysisHasQualifying = verifyQualifyingLanguage(output.analysis);
    if (!analysisHasQualifying) {
      output.analysis = enhanceAnalysis(output.analysis);
    }

    const executionTime = Date.now() - startTime;

    return createSuccessResult(
      task.id,
      'market-forecaster',
      output,
      {
        executionTime,
        startedAt,
        modelId: MODEL_CONFIGS.ANALYTICAL.modelId,
      }
    );
  } catch (error) {
    const executionTime = Date.now() - startTime;

    // Determine error type
    let errorType: 'VALIDATION_ERROR' | 'API_ERROR' | 'INTERNAL_ERROR' = 'INTERNAL_ERROR';
    let errorMessage = 'An unexpected error occurred during market forecasting';

    if (error instanceof z.ZodError) {
      errorType = 'VALIDATION_ERROR';
      errorMessage = `Input validation failed: ${error.errors.map(e => e.message).join(', ')}`;
    } else if (error instanceof Error) {
      if (error.message.includes('API') || error.message.includes('Bedrock')) {
        errorType = 'API_ERROR';
      }
      errorMessage = error.message;
    }

    return createErrorResult(
      task.id,
      'market-forecaster',
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
 * Convenience function to generate market forecast directly
 * (without going through the worker protocol)
 */
export async function forecastMarket(
  input: MarketForecasterInput
): Promise<MarketForecasterOutput> {
  const task: WorkerTask = {
    id: `direct_${Date.now()}`,
    type: 'market-forecaster',
    description: `Forecast market trends for ${input.market}`,
    dependencies: [],
    input,
    createdAt: new Date().toISOString(),
    status: 'in-progress',
  };

  const result = await executeMarketForecasterWorker(task);

  if (result.status === 'error') {
    throw new Error(result.error?.message || 'Market forecasting failed');
  }

  return result.output as MarketForecasterOutput;
}

/**
 * Verifies that qualifying language is present in text
 */
function verifyQualifyingLanguage(text: string): boolean {
  const qualifyingPhrases = [
    'historical trends suggest',
    'data indicates',
    'may',
    'could',
    'might',
    'aim for',
    'based on',
    'past performance',
    'not guarantee',
    'subject to change',
    'market conditions',
  ];

  const lowerText = text.toLowerCase();
  return qualifyingPhrases.some(phrase => lowerText.includes(phrase));
}

/**
 * Enhances disclaimer with additional qualifying language
 */
function enhanceDisclaimer(disclaimer: string): string {
  const additionalDisclaimer = '\n\nIMPORTANT: This forecast is based on historical trends and current market data. Market conditions can change rapidly, and past performance does not guarantee future results. This analysis should not be considered financial advice. Please consult with qualified financial advisors before making investment decisions.';

  return disclaimer + additionalDisclaimer;
}

/**
 * Enhances analysis with qualifying language
 */
function enhanceAnalysis(analysis: string): string {
  const prefix = 'Based on historical trends and current market data, ';

  // Check if analysis already starts with qualifying language
  const lowerAnalysis = analysis.toLowerCase();
  if (lowerAnalysis.startsWith('based on') || lowerAnalysis.startsWith('historical')) {
    return analysis;
  }

  return prefix + analysis;
}
