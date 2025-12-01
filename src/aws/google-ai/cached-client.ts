/**
 * Cached Gemini Client Wrapper
 * 
 * Provides caching support for Google AI (Gemini) content generation.
 */

import { GenerativeModel, GenerateContentResult } from '@google/generative-ai';
import { aiCache } from '@/lib/ai/cache/service';

export interface CachedGenerateContentOptions {
    /**
     * Whether to use cached responses if available
     * Default: true
     */
    useCache?: boolean;

    /**
     * Custom cache TTL in milliseconds
     */
    ttl?: number;
}

/**
 * Generates content using Gemini with caching support
 * 
 * @param model - The Gemini GenerativeModel instance
 * @param prompt - The prompt to send to the model (string or Part[])
 * @param options - Caching options
 * @returns The generated content result
 */
export async function generateContentWithCache(
    model: GenerativeModel,
    prompt: string | any[],
    options: CachedGenerateContentOptions = {}
): Promise<GenerateContentResult> {
    const useCache = options.useCache ?? true;
    let cacheKey: string | undefined;

    // Check cache
    if (useCache) {
        // Generate a key based on model name and prompt
        // Note: We access model.model which is the model name string
        cacheKey = aiCache.generateKey(model.model, prompt, {
            generationConfig: model.generationConfig
        });

        const cachedResponse = await aiCache.get<any>(cacheKey);
        if (cachedResponse) {
            // Reconstruct a minimal GenerateContentResult from cached data
            // Note: We only cache the text response for now to keep it simple
            return {
                response: {
                    text: () => cachedResponse.text,
                    functionCalls: () => cachedResponse.functionCalls,
                    candidates: cachedResponse.candidates,
                    promptFeedback: cachedResponse.promptFeedback,
                }
            } as GenerateContentResult;
        }
    }

    // Call the model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Cache the result
    if (useCache && cacheKey) {
        // We store a serializable version of the response
        const cacheableResponse = {
            text: text,
            candidates: response.candidates,
            promptFeedback: response.promptFeedback,
        };

        await aiCache.set(cacheKey, cacheableResponse, { ttl: options.ttl });
    }

    return result;
}
