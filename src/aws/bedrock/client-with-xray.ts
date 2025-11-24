/**
 * Enhanced Bedrock Client with X-Ray Tracing
 * 
 * This module extends the existing Bedrock client with comprehensive X-Ray tracing
 * for distributed tracing across the microservices architecture.
 */

import { BedrockClient, InvokeOptions, InvokeStreamOptions, InvokeWithVisionOptions } from './client';
import { traceBedrockOperation } from '@/aws/xray/utils';
import { tracer, OPERATION_NAMES } from '@/aws/xray/tracer';
import { addBusinessMetrics, addPerformanceSLA } from '@/aws/xray/service-map';
import { z } from 'zod';

/**
 * Enhanced Bedrock client with X-Ray tracing
 */
export class TracedBedrockClient extends BedrockClient {
    /**
     * Invoke Bedrock model with X-Ray tracing
     */
    async invoke<TOutput>(
        prompt: string,
        outputSchema: z.ZodSchema<TOutput>,
        options: InvokeOptions & {
            userId?: string;
            requestId?: string;
            operationName?: string;
        } = {}
    ): Promise<TOutput> {
        const operationName = options.operationName || OPERATION_NAMES.GENERATE_BLOG_POST;

        return traceBedrockOperation(
            this.getModelId(),
            operationName,
            async () => {
                const startTime = Date.now();

                try {
                    // Add operation context to trace
                    tracer.addAnnotation('bedrock.prompt_length', prompt.length);
                    tracer.addAnnotation('bedrock.temperature', options.temperature || 0.7);
                    tracer.addAnnotation('bedrock.max_tokens', options.maxTokens || 4096);

                    // Call the parent invoke method
                    const result = await super.invoke(prompt, outputSchema, options);

                    const duration = Date.now() - startTime;

                    // Add success metrics
                    tracer.addMetadata('bedrock.response_size', JSON.stringify(result).length);
                    tracer.addMetadata('bedrock.execution_time', duration);

                    // Add business metrics
                    addBusinessMetrics({
                        contentGenerated: 1,
                        tokensProcessed: this.estimateTokens(prompt) + this.estimateTokens(JSON.stringify(result)),
                    });

                    // Check SLA (example: 5 second target for content generation)
                    const targetLatency = 5000;
                    addPerformanceSLA(
                        operationName,
                        targetLatency,
                        duration,
                        duration > targetLatency
                    );

                    return result;
                } catch (error) {
                    const duration = Date.now() - startTime;

                    // Add error context
                    tracer.addMetadata('bedrock.error_duration', duration);
                    tracer.addMetadata('bedrock.error_type', error instanceof Error ? error.constructor.name : 'Unknown');

                    throw error;
                }
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                inputTokens: this.estimateTokens(prompt),
                metadata: {
                    'bedrock.flow_name': options.flowName,
                    'bedrock.prompt_type': this.classifyPrompt(prompt),
                    'bedrock.schema_type': outputSchema.constructor.name,
                },
            }
        );
    }

    /**
     * Invoke with prompts with X-Ray tracing
     */
    async invokeWithPrompts<TOutput>(
        systemPrompt: string,
        userPrompt: string,
        outputSchema: z.ZodSchema<TOutput>,
        options: InvokeOptions & {
            userId?: string;
            requestId?: string;
            operationName?: string;
        } = {}
    ): Promise<TOutput> {
        const operationName = options.operationName || OPERATION_NAMES.GENERATE_SOCIAL_POST;

        return traceBedrockOperation(
            this.getModelId(),
            operationName,
            async () => {
                const startTime = Date.now();

                try {
                    // Add operation context
                    tracer.addAnnotation('bedrock.system_prompt_length', systemPrompt.length);
                    tracer.addAnnotation('bedrock.user_prompt_length', userPrompt.length);
                    tracer.addAnnotation('bedrock.has_system_prompt', true);

                    const result = await super.invokeWithPrompts(systemPrompt, userPrompt, outputSchema, options);

                    const duration = Date.now() - startTime;

                    // Add success metrics
                    tracer.addMetadata('bedrock.total_prompt_length', systemPrompt.length + userPrompt.length);
                    tracer.addMetadata('bedrock.execution_time', duration);

                    return result;
                } catch (error) {
                    const duration = Date.now() - startTime;
                    tracer.addMetadata('bedrock.error_duration', duration);
                    throw error;
                }
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                inputTokens: this.estimateTokens(systemPrompt + userPrompt),
                metadata: {
                    'bedrock.prompt_structure': 'system_user',
                    'bedrock.system_prompt_type': this.classifyPrompt(systemPrompt),
                    'bedrock.user_prompt_type': this.classifyPrompt(userPrompt),
                },
            }
        );
    }

    /**
     * Invoke with vision with X-Ray tracing
     */
    async invokeWithVision<TOutput>(
        systemPrompt: string,
        userPrompt: string,
        outputSchema: z.ZodSchema<TOutput>,
        options: InvokeWithVisionOptions & {
            userId?: string;
            requestId?: string;
            operationName?: string;
        }
    ): Promise<TOutput> {
        const operationName = options.operationName || OPERATION_NAMES.REIMAGINE_IMAGE;

        return traceBedrockOperation(
            this.getModelId(),
            operationName,
            async () => {
                const startTime = Date.now();

                try {
                    // Add vision-specific context
                    tracer.addAnnotation('bedrock.has_vision', true);
                    tracer.addAnnotation('bedrock.image_format', options.image.format);
                    tracer.addAnnotation('bedrock.image_size', options.image.data.length);

                    const result = await super.invokeWithVision(systemPrompt, userPrompt, outputSchema, options);

                    const duration = Date.now() - startTime;

                    // Add vision-specific metrics
                    tracer.addMetadata('bedrock.vision_processing_time', duration);
                    tracer.addMetadata('bedrock.image_analysis', {
                        format: options.image.format,
                        size: options.image.data.length,
                        estimated_pixels: this.estimateImagePixels(options.image),
                    });

                    // Add business metrics for vision operations
                    addBusinessMetrics({
                        imagesProcessed: 1,
                        visionOperations: 1,
                    });

                    return result;
                } catch (error) {
                    const duration = Date.now() - startTime;
                    tracer.addMetadata('bedrock.vision_error_duration', duration);
                    throw error;
                }
            },
            {
                userId: options.userId,
                requestId: options.requestId,
                inputTokens: this.estimateTokens(systemPrompt + userPrompt),
                metadata: {
                    'bedrock.operation_type': 'vision',
                    'bedrock.image_format': options.image.format,
                    'bedrock.image_size_bytes': options.image.data.length,
                },
            }
        );
    }

    /**
     * Invoke stream with X-Ray tracing
     */
    async *invokeStream<TOutput>(
        prompt: string,
        outputSchema: z.ZodSchema<TOutput>,
        options: InvokeStreamOptions & {
            userId?: string;
            requestId?: string;
            operationName?: string;
        } = {}
    ): AsyncGenerator<string, TOutput, unknown> {
        const operationName = options.operationName || 'bedrock-stream';

        // Start a subsegment for the streaming operation
        const subsegment = tracer.startSubsegment(operationName, {
            serviceName: 'bedrock',
            userId: options.userId,
            requestId: options.requestId,
            metadata: {
                'bedrock.streaming': true,
                'bedrock.prompt_length': prompt.length,
            },
            annotations: {
                'bedrock.streaming': true,
                'bedrock.model_id': this.getModelId(),
            },
        });

        try {
            const startTime = Date.now();
            let chunkCount = 0;
            let totalChars = 0;

            const generator = super.invokeStream(prompt, outputSchema, options);

            for await (const chunk of generator) {
                chunkCount++;
                totalChars += chunk.length;

                // Add streaming metrics periodically
                if (chunkCount % 10 === 0) {
                    tracer.addMetadata('bedrock.streaming_progress', {
                        chunks: chunkCount,
                        characters: totalChars,
                        elapsed: Date.now() - startTime,
                    });
                }

                yield chunk;
            }

            const duration = Date.now() - startTime;

            // Add final streaming metrics
            tracer.addMetadata('bedrock.streaming_complete', {
                totalChunks: chunkCount,
                totalCharacters: totalChars,
                duration,
                averageChunkSize: totalChars / chunkCount,
                charactersPerSecond: totalChars / (duration / 1000),
            });

            tracer.closeSubsegment(subsegment!);

            // Return the final result (this is handled by the parent generator)
            return generator.return(undefined).value;
        } catch (error) {
            tracer.closeSubsegment(subsegment!, error as Error);
            throw error;
        }
    }

    // Helper methods

    private getModelId(): string {
        // Access the private modelId from parent class
        return (this as any).modelId;
    }

    private estimateTokens(text: string): number {
        // Rough estimation: ~4 characters per token for English text
        return Math.ceil(text.length / 4);
    }

    private classifyPrompt(prompt: string): string {
        const lowerPrompt = prompt.toLowerCase();

        if (lowerPrompt.includes('blog') || lowerPrompt.includes('article')) {
            return 'blog_generation';
        }
        if (lowerPrompt.includes('social') || lowerPrompt.includes('post')) {
            return 'social_media';
        }
        if (lowerPrompt.includes('description') || lowerPrompt.includes('listing')) {
            return 'property_description';
        }
        if (lowerPrompt.includes('market') || lowerPrompt.includes('analysis')) {
            return 'market_analysis';
        }
        if (lowerPrompt.includes('image') || lowerPrompt.includes('photo')) {
            return 'image_analysis';
        }

        return 'general';
    }

    private estimateImagePixels(image: { data: string; format: string }): number {
        // Very rough estimation based on base64 data size
        // This is just for tracing purposes, not accurate
        const bytes = image.data.length * 0.75; // Base64 is ~33% larger than binary

        // Assume average compression and color depth
        switch (image.format) {
            case 'jpeg':
                return Math.ceil(bytes * 20); // JPEG compression ratio
            case 'png':
                return Math.ceil(bytes * 8);  // PNG compression ratio
            case 'webp':
                return Math.ceil(bytes * 15); // WebP compression ratio
            default:
                return Math.ceil(bytes * 10);
        }
    }
}

/**
 * Create a traced Bedrock client instance
 */
export function createTracedBedrockClient(modelId?: string): TracedBedrockClient {
    return new TracedBedrockClient(modelId);
}

/**
 * Default traced Bedrock client instance
 */
export const tracedBedrockClient = createTracedBedrockClient();