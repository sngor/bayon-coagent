/**
 * AI Cache Service
 * 
 * Manages caching for AI service responses to reduce costs and latency.
 */

import { AICache, CacheOptions } from './types';
import { InMemoryAdapter } from './in-memory-adapter';
import crypto from 'crypto';

export class AICacheService {
    private static instance: AICacheService;
    private adapter: AICache;
    private enabled: boolean = true;

    private constructor() {
        // Default to in-memory adapter
        // In the future, we can switch this based on env vars (e.g., Redis)
        this.adapter = new InMemoryAdapter();
    }

    public static getInstance(): AICacheService {
        if (!AICacheService.instance) {
            AICacheService.instance = new AICacheService();
        }
        return AICacheService.instance;
    }

    /**
     * Generates a deterministic cache key for a request
     */
    public generateKey(
        modelId: string,
        prompt: string | object,
        options: Record<string, any> = {}
    ): string {
        const promptStr = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);
        const optionsStr = JSON.stringify(options);

        const hash = crypto
            .createHash('sha256')
            .update(`${modelId}:${promptStr}:${optionsStr}`)
            .digest('hex');

        return `ai:${modelId}:${hash}`;
    }

    /**
     * Get cached response
     */
    public async get<T>(key: string): Promise<T | null> {
        if (!this.enabled) return null;
        return this.adapter.get<T>(key);
    }

    /**
     * Cache a response
     */
    public async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
        if (!this.enabled) return;
        await this.adapter.set(key, value, options);
    }

    /**
     * Disable caching (e.g., for testing or debugging)
     */
    public disable(): void {
        this.enabled = false;
    }

    /**
     * Enable caching
     */
    public enable(): void {
        this.enabled = true;
    }

    /**
     * Clear all cache
     */
    public async clear(): Promise<void> {
        await this.adapter.clear();
    }

    /**
     * Get cache stats
     */
    public async getStats() {
        return this.adapter.getStats();
    }
}

export const aiCache = AICacheService.getInstance();
