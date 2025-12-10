/**
 * Factory for creating and managing Strands agents
 * Follows the established AWS service pattern in this codebase
 */

import { z } from 'zod';

export type AgentType = 'research' | 'listing' | 'content';

export interface AgentConfig {
    type: AgentType;
    scriptPath: string;
    timeout: number;
    maxRetries: number;
}

export const AgentConfigSchema = z.object({
    type: z.enum(['research', 'listing', 'content']),
    scriptPath: z.string(),
    timeout: z.number().positive(),
    maxRetries: z.number().min(0).max(5),
});

/**
 * Agent configurations following the hub architecture
 */
export const AGENT_CONFIGS: Record<AgentType, AgentConfig> = {
    research: {
        type: 'research',
        scriptPath: 'src/services/strands/research-agent.py',
        timeout: 120000, // 2 minutes for comprehensive research
        maxRetries: 2,
    },
    listing: {
        type: 'listing',
        scriptPath: 'src/services/strands/listing-agent.py',
        timeout: 60000, // 1 minute for listing descriptions
        maxRetries: 3,
    },
    content: {
        type: 'content',
        scriptPath: 'src/services/strands/content-agent.py',
        timeout: 90000, // 1.5 minutes for content generation
        maxRetries: 2,
    },
} as const;

/**
 * Get agent configuration with validation
 */
export function getAgentConfig(type: AgentType): AgentConfig {
    const config = AGENT_CONFIGS[type];
    if (!config) {
        throw new Error(`Unknown agent type: ${type}`);
    }
    return AgentConfigSchema.parse(config);
}

/**
 * Create environment variables for any Strands agent
 */
export function createStrandsEnvironment(): Record<string, string> {
    return {
        ...process.env,
        AWS_REGION: process.env.AWS_REGION || 'us-east-2',
        DYNAMODB_TABLE_NAME: process.env.DYNAMODB_TABLE_NAME || '',
        TAVILY_API_KEY: process.env.TAVILY_API_KEY || '',
        // Add other common environment variables
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
    };
}