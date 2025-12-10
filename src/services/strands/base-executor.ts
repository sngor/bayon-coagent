/**
 * Base executor for Strands agents
 * Implements common patterns used across the AWS service layer
 */

import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { z } from 'zod';
import { AgentConfig, createStrandsEnvironment } from './agent-factory';

export interface ExecutionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: string;
}

export const BaseExecutionResultSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    timestamp: z.string(),
});

/**
 * Base executor class following the repository pattern used in AWS services
 */
export abstract class BaseStrandsExecutor<TInput, TOutput> {
    protected readonly config: AgentConfig;
    protected readonly environment: Record<string, string>;

    constructor(config: AgentConfig) {
        this.config = config;
        this.environment = createStrandsEnvironment();
    }

    /**
     * Abstract methods to be implemented by specific agents
     */
    protected abstract validateInput(input: unknown): TInput;
    protected abstract parseOutput(stdout: string): TOutput;
    protected abstract createFallbackResult(error: string): ExecutionResult<TOutput>;

    /**
     * Execute Python process with proper error handling and timeout
     */
    protected async executePythonProcess(input: TInput): Promise<ExecutionResult<TOutput>> {
        const scriptPath = path.join(process.cwd(), this.config.scriptPath);

        return new Promise((resolve) => {
            const pythonProcess = spawn('python3', [scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                env: this.environment,
            });

            let stdout = '';
            let stderr = '';
            let isResolved = false;

            // Collect output
            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // Handle process completion
            pythonProcess.on('close', (code) => {
                if (isResolved) return;
                isResolved = true;

                if (code === 0) {
                    try {
                        const output = this.parseOutput(stdout);
                        resolve({
                            success: true,
                            data: output,
                            timestamp: new Date().toISOString(),
                        });
                    } catch (parseError) {
                        console.error(`Failed to parse ${this.config.type} agent output:`, parseError);
                        resolve(this.createFallbackResult(
                            `Failed to parse results: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
                        ));
                    }
                } else {
                    console.error(`${this.config.type} agent process failed:`, stderr);
                    resolve(this.createFallbackResult(
                        `Agent failed with code ${code}: ${stderr}`
                    ));
                }
            });

            pythonProcess.on('error', (error) => {
                if (isResolved) return;
                isResolved = true;

                console.error(`Failed to start ${this.config.type} agent:`, error);
                resolve(this.createFallbackResult(
                    `Failed to start agent: ${error.message}`
                ));
            });

            // Set timeout
            const timeoutId = setTimeout(() => {
                if (isResolved) return;
                isResolved = true;

                pythonProcess.kill('SIGTERM');
                resolve(this.createFallbackResult(
                    `Request timed out after ${this.config.timeout / 1000} seconds`
                ));
            }, this.config.timeout);

            // Send input and cleanup
            pythonProcess.stdin.write(JSON.stringify(input));
            pythonProcess.stdin.end();

            pythonProcess.on('close', () => {
                clearTimeout(timeoutId);
            });
        });
    }

    /**
     * Execute with retry logic
     */
    public async execute(input: unknown): Promise<ExecutionResult<TOutput>> {
        try {
            const validatedInput = this.validateInput(input);

            let lastError = '';

            for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
                const result = await this.executePythonProcess(validatedInput);

                if (result.success) {
                    return result;
                }

                lastError = result.error || 'Unknown error';

                if (attempt < this.config.maxRetries) {
                    console.warn(`${this.config.type} agent attempt ${attempt + 1} failed, retrying...`);
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }

            return this.createFallbackResult(
                `All ${this.config.maxRetries + 1} attempts failed. Last error: ${lastError}`
            );

        } catch (error) {
            return this.createFallbackResult(
                `Input validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
        }
    }
}