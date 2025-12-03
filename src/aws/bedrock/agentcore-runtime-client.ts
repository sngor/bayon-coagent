/**
 * AWS Bedrock AgentCore Runtime Client
 * 
 * Client for invoking agents deployed to AgentCore Runtime.
 * This is the correct client for AgentCore (not Bedrock Agents).
 */

import { BedrockAgentCoreClient, InvokeAgentRuntimeCommand } from '@aws-sdk/client-bedrock-agentcore';
import { getConfig, getAWSCredentials } from '@/aws/config';
import { logger } from '@/aws/logging';
import { v4 as uuidv4 } from 'uuid';

export interface AgentCoreInvocationParams {
    agentArn: string;
    sessionId?: string;
    payload: Record<string, any>;
    userId?: string;
}

export interface AgentCoreInvocationResult {
    output: any;
    sessionId: string;
    executionTime: number;
    requestId?: string;
}

/**
 * AgentCore Runtime Client
 */
export class AgentCoreRuntimeClient {
    private client: BedrockAgentCoreClient;

    constructor() {
        const config = getConfig();
        const credentials = getAWSCredentials();

        this.client = new BedrockAgentCoreClient({
            region: config.bedrock.region,
            credentials: credentials.accessKeyId && credentials.secretAccessKey
                ? {
                    accessKeyId: credentials.accessKeyId,
                    secretAccessKey: credentials.secretAccessKey,
                }
                : undefined,
        });
    }

    /**
     * Invoke an agent deployed to AgentCore Runtime
     */
    async invokeAgent(params: AgentCoreInvocationParams): Promise<AgentCoreInvocationResult> {
        const startTime = Date.now();
        const sessionId = params.sessionId || uuidv4();

        try {
            logger.info('Invoking AgentCore agent', {
                agentArn: params.agentArn,
                sessionId,
                userId: params.userId,
            });

            const command = new InvokeAgentRuntimeCommand({
                agentRuntimeArn: params.agentArn,
                runtimeSessionId: sessionId,
                payload: Buffer.from(JSON.stringify(params.payload)),
            });

            const response = await this.client.send(command);

            // Process streaming response
            const chunks: string[] = [];

            if (response.response) {
                for await (const chunk of response.response) {
                    if (chunk) {
                        const text = new TextDecoder().decode(chunk);
                        chunks.push(text);
                    }
                }
            }

            const output = chunks.join('');
            const executionTime = Date.now() - startTime;

            logger.info('AgentCore invocation completed', {
                agentArn: params.agentArn,
                sessionId,
                executionTime,
                requestId: response.$metadata.requestId,
            });

            // Parse JSON response
            let parsedOutput;
            try {
                parsedOutput = JSON.parse(output);
            } catch (e) {
                // If not JSON, return as-is
                parsedOutput = { raw: output };
            }

            return {
                output: parsedOutput,
                sessionId,
                executionTime,
                requestId: response.$metadata.requestId,
            };
        } catch (error) {
            const executionTime = Date.now() - startTime;

            logger.error('AgentCore invocation failed', error as Error, {
                agentArn: params.agentArn,
                sessionId,
                executionTime,
            });

            throw error;
        }
    }
}

/**
 * Singleton instance
 */
let agentCoreRuntimeClientInstance: AgentCoreRuntimeClient | null = null;

/**
 * Get the singleton AgentCore Runtime client instance
 */
export function getAgentCoreRuntimeClient(): AgentCoreRuntimeClient {
    if (!agentCoreRuntimeClientInstance) {
        agentCoreRuntimeClientInstance = new AgentCoreRuntimeClient();
    }
    return agentCoreRuntimeClientInstance;
}

/**
 * Reset the AgentCore Runtime client singleton (useful for testing)
 */
export function resetAgentCoreRuntimeClient(): void {
    agentCoreRuntimeClientInstance = null;
}
