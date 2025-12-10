/**
 * Simple Strands Research Service for Bayon Coagent
 * 
 * Integrates Strands Python research agent with TypeScript infrastructure
 */

import { spawn } from 'child_process';
import path from 'path';
import { z } from 'zod';

// Input/Output schemas
export const StrandsResearchInputSchema = z.object({
    topic: z.string().min(1, 'Research topic is required'),
    userId: z.string().min(1, 'User ID is required'),
});

export const StrandsResearchOutputSchema = z.object({
    success: z.boolean(),
    report: z.string().optional(),
    citations: z.array(z.string()).optional(),
    topic: z.string().optional(),
    timestamp: z.string().optional(),
    user_id: z.string().optional(),
    source: z.string().optional(),
    error: z.string().optional(),
});

export type StrandsResearchInput = z.infer<typeof StrandsResearchInputSchema>;
export type StrandsResearchOutput = z.infer<typeof StrandsResearchOutputSchema>;

/**
 * Execute Strands research agent
 */
export async function executeStrandsResearch(
    input: StrandsResearchInput
): Promise<StrandsResearchOutput> {
    return new Promise((resolve) => {
        try {
            // Validate input
            const validatedInput = StrandsResearchInputSchema.parse(input);

            // Path to Python script
            const scriptPath = path.join(process.cwd(), 'src/services/strands/bayon-research-agent.py');

            // Prepare input JSON
            const inputJson = JSON.stringify(validatedInput);

            // Spawn Python process
            const pythonProcess = spawn('python3', [scriptPath, inputJson], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
                    AWS_REGION: process.env.AWS_REGION || 'us-east-2',
                }
            });

            let stdout = '';
            let stderr = '';

            // Collect output
            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle completion
            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout.trim());
                        const validatedOutput = StrandsResearchOutputSchema.parse(result);
                        resolve(validatedOutput);
                    } catch (error) {
                        console.error('Failed to parse Strands output:', error);
                        console.error('Raw stdout:', stdout);
                        resolve({
                            success: false,
                            error: `Failed to parse research results: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        });
                    }
                } else {
                    console.error('Strands process failed:', stderr);
                    resolve({
                        success: false,
                        error: `Strands research failed: ${stderr || 'Unknown error'}`,
                    });
                }
            });

            pythonProcess.on('error', (error) => {
                console.error('Failed to start Strands process:', error);
                resolve({
                    success: false,
                    error: `Failed to start Strands research agent: ${error.message}`,
                });
            });

            // Timeout after 2 minutes
            setTimeout(() => {
                pythonProcess.kill();
                resolve({
                    success: false,
                    error: 'Research request timed out after 2 minutes',
                });
            }, 120000);

        } catch (error) {
            resolve({
                success: false,
                error: `Input validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
        }
    });
}

/**
 * Execute research with caching and fallback to Bedrock
 */
export async function executeResearchWithFallback(
    input: StrandsResearchInput
): Promise<StrandsResearchOutput> {
    try {
        // Import cache service
        const { getResearchCache } = await import('./research-cache-service');
        const cache = getResearchCache<StrandsResearchOutput>('research', {
            defaultTtl: 600000, // 10 minutes
            maxSize: 50,
        });

        // Check cache first
        const cacheKey = { topic: input.topic };
        const cachedResult = cache.get(cacheKey);

        if (cachedResult) {
            console.log('🎯 Cache hit for research topic:', input.topic);
            return {
                ...cachedResult,
                timestamp: new Date().toISOString(), // Update timestamp
            };
        }

        console.log('🔍 Attempting Strands research...');

        // Try Strands first
        const strandsResult = await executeStrandsResearch(input);

        if (strandsResult.success && strandsResult.report) {
            console.log('✅ Strands research successful');

            // Cache successful result
            cache.set(cacheKey, strandsResult);

            return strandsResult;
        }

        console.warn('⚠️ Strands research failed, falling back to Bedrock:', strandsResult.error);

        // Fallback to Bedrock
        const { runResearchAgent } = await import('@/aws/bedrock/flows/run-research-agent');
        const bedrockResult = await runResearchAgent({ topic: input.topic });

        console.log('✅ Bedrock fallback successful');

        const fallbackResult = {
            success: true,
            report: bedrockResult.report,
            citations: bedrockResult.citations,
            topic: input.topic,
            timestamp: new Date().toISOString(),
            user_id: input.userId,
            source: 'bedrock-fallback',
        };

        // Cache fallback result too
        cache.set(cacheKey, fallbackResult);

        return fallbackResult;

    } catch (error) {
        console.error('❌ Both Strands and Bedrock failed:', error);

        return {
            success: false,
            error: `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            topic: input.topic,
            timestamp: new Date().toISOString(),
            user_id: input.userId,
            source: 'error',
        };
    }
}

/**
 * Health check for Strands service
 */
export async function checkStrandsHealth(): Promise<{
    healthy: boolean;
    message: string;
    details?: any;
}> {
    try {
        const testResult = await executeStrandsResearch({
            topic: 'health check test',
            userId: 'health-check',
        });

        return {
            healthy: testResult.success,
            message: testResult.success
                ? 'Strands research agent is healthy'
                : `Strands health check failed: ${testResult.error}`,
            details: testResult,
        };
    } catch (error) {
        return {
            healthy: false,
            message: 'Strands health check failed',
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
    }
}