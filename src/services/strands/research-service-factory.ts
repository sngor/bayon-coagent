/**
 * Research Service Factory
 * 
 * Provides a unified interface for different research implementations
 * following the Strategy pattern for better maintainability
 */

import { z } from 'zod';

// Unified research input/output schemas
export const ResearchInputSchema = z.object({
    topic: z.string().min(1, 'Research topic is required'),
    userId: z.string().min(1, 'User ID is required'),
    searchDepth: z.enum(['basic', 'advanced']).default('advanced'),
    includeMarketAnalysis: z.boolean().default(true),
    includeRecommendations: z.boolean().default(true),
    targetAudience: z.enum(['agents', 'buyers', 'sellers', 'investors']).default('agents'),
});

export const ResearchOutputSchema = z.object({
    success: z.boolean(),
    report: z.string().optional(),
    citations: z.array(z.string()).optional(),
    keyFindings: z.array(z.string()).optional(),
    recommendations: z.array(z.string()).optional(),
    marketAnalysis: z.object({
        currentConditions: z.string(),
        trends: z.array(z.string()),
        opportunities: z.array(z.string()),
    }).optional(),
    topic: z.string().optional(),
    timestamp: z.string().optional(),
    userId: z.string().optional(),
    source: z.string().optional(),
    error: z.string().optional(),
});

export type ResearchInput = z.infer<typeof ResearchInputSchema>;
export type ResearchOutput = z.infer<typeof ResearchOutputSchema>;

/**
 * Research service interface
 */
export interface IResearchService {
    execute(input: ResearchInput): Promise<ResearchOutput>;
    healthCheck(): Promise<{ healthy: boolean; message: string; details?: any }>;
    getName(): string;
}

/**
 * Research service types
 */
export enum ResearchServiceType {
    STRANDS_PYTHON = 'strands-python',
    ENHANCED_TYPESCRIPT = 'enhanced-typescript',
    BEDROCK_FALLBACK = 'bedrock-fallback',
}

/**
 * Research service factory with lazy loading and caching
 */
export class ResearchServiceFactory {
    private static services = new Map<ResearchServiceType, IResearchService>();
    private static serviceLoaders = new Map<ResearchServiceType, () => Promise<IResearchService>>();

    /**
     * Register a research service with lazy loading
     */
    static registerLazy(
        type: ResearchServiceType,
        loader: () => Promise<IResearchService>
    ): void {
        this.serviceLoaders.set(type, loader);
    }

    /**
     * Register a research service instance
     */
    static register(type: ResearchServiceType, service: IResearchService): void {
        this.services.set(type, service);
    }

    /**
     * Get research service by type with lazy loading
     */
    static async getService(type: ResearchServiceType): Promise<IResearchService> {
        // Check if already loaded
        let service = this.services.get(type);
        if (service) {
            return service;
        }

        // Try lazy loading
        const loader = this.serviceLoaders.get(type);
        if (loader) {
            service = await loader();
            this.services.set(type, service);
            return service;
        }

        throw new Error(`Research service not found: ${type}`);
    }

    /**
     * Execute research with automatic fallback chain
     */
    static async executeWithFallback(input: ResearchInput): Promise<ResearchOutput> {
        const fallbackChain = [
            ResearchServiceType.STRANDS_PYTHON,
            ResearchServiceType.ENHANCED_TYPESCRIPT,
            ResearchServiceType.BEDROCK_FALLBACK,
        ];

        let lastError: string | undefined;

        for (const serviceType of fallbackChain) {
            try {
                const service = await this.getService(serviceType);
                const result = await service.execute(input);

                if (result.success) {
                    console.log(`✅ Research completed using ${service.getName()}`);
                    return result;
                }

                lastError = result.error;
                console.warn(`⚠️ ${service.getName()} failed: ${result.error}`);
            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                console.warn(`⚠️ ${serviceType} service error:`, error);
            }
        }

        return {
            success: false,
            error: `All research services failed. Last error: ${lastError}`,
            topic: input.topic,
            timestamp: new Date().toISOString(),
            userId: input.userId,
            source: 'research-factory-fallback',
        };
    }

    /**
     * Get health status of all services
     */
    static async getHealthStatus(): Promise<Record<string, { healthy: boolean; message: string }>> {
        const status: Record<string, { healthy: boolean; message: string }> = {};

        for (const [type, service] of this.services.entries()) {
            try {
                const health = await service.healthCheck();
                status[type] = {
                    healthy: health.healthy,
                    message: health.message,
                };
            } catch (error) {
                status[type] = {
                    healthy: false,
                    message: error instanceof Error ? error.message : 'Health check failed',
                };
            }
        }

        return status;
    }
}