/**
 * Strands Research Agent Service
 * 
 * TypeScript service layer that integrates the Strands Python research agent
 * with your existing Bayon Coagent infrastructure.
 * 
 * Follows the established AWS service patterns and hub architecture.
 */

import { z } from 'zod';
import { BaseStrandsExecutor, ExecutionResult } from './base-executor';
import { getAgentConfig } from './agent-factory';
import { getCacheManager } from './cache-manager';

import {
    RunResearchAgentInputSchema,
    RunResearchAgentOutputSchema,
    type RunResearchAgentInput,
    type RunResearchAgentOutput
} from '@/ai/schemas/research-agent-schemas';

// Extended input schema for Strands-specific features
export const StrandsResearchInputSchema = RunResearchAgentInputSchema.extend({
    userId: z.string().min(1, 'User ID is required'),
    searchDepth: z.enum(['basic', 'advanced']).default('advanced'),
    includeMarketAnalysis: z.boolean().default(true),
});

// Wrapper schema that maintains compatibility with original interface
export const StrandsResearchOutputSchema = z.object({
    success: z.boolean(),
    report: z.string().optional(),
    citations: z.array(z.string()).optional(), // Match original format
    topic: z.string().optional(),
    timestamp: z.string().optional(),
    error: z.string().optional(),
});

export type StrandsResearchInput = z.infer<typeof StrandsResearchInputSchema>;
export type StrandsResearchOutput = z.infer<typeof StrandsResearchOutputSchema>;

/**
 * Research Agent Executor implementing the base executor pattern
 */
class ResearchAgentExecutor extends BaseStrandsExecutor<StrandsResearchInput, StrandsResearchOutput> {
    constructor() {
        super(getAgentConfig('research'));
    }

    protected validateInput(input: unknown): StrandsResearchInput {
        return StrandsResearchInputSchema.parse(input);
    }

    protected parseOutput(stdout: string): StrandsResearchOutput {
        const result = JSON.parse(stdout.trim());
        return StrandsResearchOutputSchema.parse(result);
    }

    protected createFallbackResult(error: string): ExecutionResult<StrandsResearchOutput> {
        return {
            success: false,
            data: {
                success: false,
                error,
                timestamp: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
        };
    }
}

// Singleton instance following the AWS client pattern
let researchExecutor: ResearchAgentExecutor | null = null;

function getResearchExecutor(): ResearchAgentExecutor {
    if (!researchExecutor) {
        researchExecutor = new ResearchAgentExecutor();
    }
    return researchExecutor;
}

/**
 * Execute Strands research agent with caching
 */
export async function executeStrandsResearch(
    input: StrandsResearchInput
): Promise<StrandsResearchOutput> {
    // Check cache first (research results can be cached for 10 minutes)
    const cacheManager = getCacheManager<StrandsResearchOutput>('research', {
        defaultTtl: 600000, // 10 minutes
        maxSize: 50, // Store up to 50 research results
    });

    // Create cache key from topic and search depth (exclude userId for sharing)
    const cacheKey = {
        topic: input.topic,
        searchDepth: input.searchDepth,
        includeMarketAnalysis: input.includeMarketAnalysis,
    };

    const cachedResult = cacheManager.get(cacheKey);
    if (cachedResult) {
        console.log('Returning cached research result for:', input.topic);
        return {
            ...cachedResult,
            timestamp: new Date().toISOString(), // Update timestamp
        };
    }

    // Execute research
    const executor = getResearchExecutor();
    const result = await executor.execute(input);

    const output = result.data || {
        success: false,
        error: result.error || 'Unknown execution error',
        timestamp: result.timestamp,
    };

    // Cache successful results
    if (output.success && output.report) {
        cacheManager.set(cacheKey, output);
    }

    return output;
}

/**
 * Alternative implementation using direct Python function call
 * (requires python-shell or similar package)
 */
export async function executeStrandsResearchDirect(
    input: StrandsResearchInput
): Promise<StrandsResearchOutput> {
    try {
        // This would use python-shell or similar to call the Python function directly
        // For now, we'll use the subprocess approach above

        // Example with python-shell (if you install it):
        // const { PythonShell } = require('python-shell');
        // const result = await PythonShell.run('research-agent.py', {
        //   mode: 'json',
        //   args: [JSON.stringify(input)]
        // });

        return executeStrandsResearch(input);
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
        };
    }
}

/**
 * Convert Bedrock output to Strands format
 */
function convertBedrockToStrandsOutput(
    bedrockResult: RunResearchAgentOutput,
    input: StrandsResearchInput
): StrandsResearchOutput {
    return {
        success: true,
        report: bedrockResult.report,
        citations: bedrockResult.citations || [],
        topic: input.topic,
        timestamp: new Date().toISOString(),
    };
}

/**
 * Fallback to original Bedrock research agent if Strands fails
 */
export async function executeResearchWithFallback(
    input: StrandsResearchInput
): Promise<StrandsResearchOutput> {
    // Try Strands first
    const strandsResult = await executeStrandsResearch(input);

    if (strandsResult.success) {
        return strandsResult;
    }

    // Log fallback attempt
    console.warn('Strands research failed, falling back to Bedrock:', strandsResult.error);

    try {
        // Import and execute original Bedrock implementation
        const { runResearchAgent } = await import('@/aws/bedrock/flows/run-research-agent');

        const bedrockResult = await runResearchAgent({
            topic: input.topic,
        });

        return convertBedrockToStrandsOutput(bedrockResult, input);

    } catch (bedrockError) {
        return {
            success: false,
            error: `Both Strands and Bedrock research failed. Strands: ${strandsResult.error}. Bedrock: ${bedrockError instanceof Error ? bedrockError.message : 'Unknown error'}`,
        };
    }
}

/**
 * Health check for Strands research agent
 */
export async function checkStrandsResearchHealth(): Promise<{
    healthy: boolean;
    message: string;
    details?: any;
}> {
    try {
        const testResult = await executeStrandsResearch({
            topic: 'health check test',
            userId: 'health-check',
            searchDepth: 'basic',
            includeMarketAnalysis: false,
        });

        return {
            healthy: testResult.success,
            message: testResult.success ? 'Strands research agent is healthy' : 'Strands research agent failed health check',
            details: testResult,
        };
    } catch (error) {
        return {
            healthy: false,
            message: 'Strands research agent health check failed',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}