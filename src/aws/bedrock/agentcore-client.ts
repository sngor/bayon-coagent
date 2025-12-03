/**
 * AWS Bedrock AgentCore Runtime Client
 * 
 * Client for invoking agents deployed to AgentCore Runtime.
 * Provides type-safe invocation with streaming support.
 */

import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { logger } from '@/aws/logging';

export interface AgentInvocationParams {
    agentId: string;
    agentAliasId: string;
    sessionId: string;
    inputText: string;
    enableTrace?: boolean;
    endSession?: boolean;
}

export interface AgentInvocationResult {
    output: string;
    sessionId: string;
    traceId?: string;
    executionTime: number;
}

/**
 * AgentCore Runtime Client
 */
export class AgentCoreClient {
    private client: BedrockAgentRuntimeClient;

    constructor() {
        const config = getConfig();
        const credentials = getAWSCredentials();

        this.client = new BedrockAgentRuntimeClient({
            region: config.bedrock.region,
            credentials,
            endpoint: config.bedrock.endpoint,
        });
    }

    /**
     * Invoke an agent deployed to AgentCore Runtime
     */
    async invokeAgent(params: AgentInvocationParams): Promise<AgentInvocationResult> {
        const startTime = Date.now();

        try {
            logger.info('Invoking AgentCore agent', {
                agentId: params.agentId,
                sessionId: params.sessionId,
            });

            const command = new InvokeAgentCommand({
                agentId: params.agentId,
                agentAliasId: params.agentAliasId,
                sessionId: params.sessionId,
                inputText: params.inputText,
                enableTrace: params.enableTrace ?? false,
                endSession: params.endSession ?? false,
            });

            const response = await this.client.send(command);

            // Parse streaming response
            const chunks: string[] = [];
            if (response.completion) {
                for await (const event of response.completion) {
                    if (event.chunk?.bytes) {
                        const text = new TextDecoder().decode(event.chunk.bytes);
                        chunks.push(text);
                    }
                }
            }

            const executionTime = Date.now() - startTime;

            logger.info('AgentCore invocation completed', {
                agentId: params.agentId,
                sessionId: params.sessionId,
                executionTime,
                traceId: response.$metadata.requestId,
            });

            return {
                output: chunks.join(''),
                sessionId: params.sessionId,
                traceId: response.$metadata.requestId,
                executionTime,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;

            logger.error('AgentCore invocation failed', error as Error, {
                agentId: params.agentId,
                sessionId: params.sessionId,
                executionTime,
            });

            throw error;
        }
    }

    /**
     * Invoke agent with streaming response
     */
    async *invokeAgentStream(params: AgentInvocationParams): AsyncIterable<string> {
        try {
            logger.info('Invoking AgentCore agent (streaming)', {
                agentId: params.agentId,
                sessionId: params.sessionId,
            });

            const command = new InvokeAgentCommand({
                agentId: params.agentId,
                agentAliasId: params.agentAliasId,
                sessionId: params.sessionId,
                inputText: params.inputText,
                enableTrace: params.enableTrace ?? false,
                endSession: params.endSession ?? false,
            });

            const response = await this.client.send(command);

            if (response.completion) {
                for await (const event of response.completion) {
                    if (event.chunk?.bytes) {
                        const text = new TextDecoder().decode(event.chunk.bytes);
                        yield text;
                    }
                }
            }
        } catch (error) {
            logger.error('AgentCore streaming invocation failed', error as Error, {
                agentId: params.agentId,
                sessionId: params.sessionId,
            });

            throw error;
        }
    }
}

/**
 * Singleton instance
 */
let agentCoreClientInstance: AgentCoreClient | null = null;

/**
 * Get the singleton AgentCore client instance
 */
export function getAgentCoreClient(): AgentCoreClient {
    if (!agentCoreClientInstance) {
        agentCoreClientInstance = new AgentCoreClient();
    }
    return agentCoreClientInstance;
}

/**
 * Reset the AgentCore client singleton (useful for testing)
 */
export function resetAgentCoreClient(): void {
    agentCoreClientInstance = null;
}
