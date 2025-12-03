/**
 * AgentCore Runtime Configuration
 * 
 * Agent IDs and aliases for different environments
 */

export interface AgentConfig {
    agentId: string;
    agentAliasId: string;
}

export interface AgentCoreConfig {
    researchAgent: AgentConfig;
    contentGenerator: AgentConfig;
    knowledgeRetriever: AgentConfig;
}

/**
 * Get AgentCore configuration for current environment
 */
export function getAgentCoreConfig(): AgentCoreConfig {
    const env = process.env.NODE_ENV || 'development';

    // Development configuration
    if (env === 'development') {
        return {
            researchAgent: {
                agentId: process.env.RESEARCH_AGENT_ID || 'agent-dev-research',
                agentAliasId: process.env.RESEARCH_AGENT_ALIAS_ID || 'TSTALIASID',
            },
            contentGenerator: {
                agentId: process.env.CONTENT_GENERATOR_AGENT_ID || 'agent-dev-content',
                agentAliasId: process.env.CONTENT_GENERATOR_ALIAS_ID || 'TSTALIASID',
            },
            knowledgeRetriever: {
                agentId: process.env.KNOWLEDGE_RETRIEVER_AGENT_ID || 'agent-dev-knowledge',
                agentAliasId: process.env.KNOWLEDGE_RETRIEVER_ALIAS_ID || 'TSTALIASID',
            },
        };
    }

    // Production configuration
    return {
        researchAgent: {
            agentId: process.env.RESEARCH_AGENT_ID!,
            agentAliasId: process.env.RESEARCH_AGENT_ALIAS_ID!,
        },
        contentGenerator: {
            agentId: process.env.CONTENT_GENERATOR_AGENT_ID!,
            agentAliasId: process.env.CONTENT_GENERATOR_ALIAS_ID!,
        },
        knowledgeRetriever: {
            agentId: process.env.KNOWLEDGE_RETRIEVER_AGENT_ID!,
            agentAliasId: process.env.KNOWLEDGE_RETRIEVER_ALIAS_ID!,
        },
    };
}

/**
 * Generate session ID for agent invocation
 */
export function generateSessionId(userId: string, prefix: string = 'session'): string {
    return `${prefix}-${userId}-${Date.now()}`;
}
