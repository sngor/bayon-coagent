/**
 * Example Lambda Function with X-Ray Tracing
 * 
 * This demonstrates how to use X-Ray tracing in Lambda functions
 * for the microservices architecture.
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withLambdaXRayTracing } from '@/aws/xray/middleware';
import { tracer, OPERATION_NAMES } from '@/aws/xray/tracer';
import {
    traceDatabaseOperation,
    traceBedrockOperation,
    addUserContext,
    addPerformanceMetrics
} from '@/aws/xray/utils';

/**
 * Example handler that demonstrates X-Ray tracing patterns
 */
async function handler(
    event: APIGatewayProxyEvent,
    context: Context
): Promise<APIGatewayProxyResult> {
    try {
        // Extract user information from the event
        const userId = event.requestContext?.authorizer?.claims?.sub;
        const requestId = event.requestContext?.requestId;

        // Add user context to the trace
        if (userId) {
            addUserContext({
                userId,
                userType: 'agent',
                sessionId: event.headers?.['X-Session-Id'],
                ipAddress: event.requestContext?.identity?.sourceIp,
                userAgent: event.headers?.['User-Agent'],
            });
        }

        // Example: Trace a database operation
        const userData = await traceDatabaseOperation(
            'getItem',
            'BayonCoAgent',
            async () => {
                // Simulate database call
                await new Promise(resolve => setTimeout(resolve, 50));
                return { userId, profile: { name: 'Test User' } };
            },
            { userId, requestId }
        );

        // Example: Trace an AI operation
        const aiResult = await traceBedrockOperation(
            'anthropic.claude-3-5-sonnet-20241022-v2:0',
            'generate-content',
            async () => {
                // Simulate AI call
                await new Promise(resolve => setTimeout(resolve, 200));
                return { content: 'Generated content', tokens: 150 };
            },
            {
                userId,
                requestId,
                inputTokens: 50,
                outputTokens: 150
            }
        );

        // Example: Trace business logic
        const processedResult = await tracer.traceAsync(
            OPERATION_NAMES.CREATE_CONTENT,
            async () => {
                // Simulate business logic
                await new Promise(resolve => setTimeout(resolve, 30));
                return {
                    id: 'content-123',
                    content: aiResult.content,
                    user: userData.profile.name,
                    timestamp: new Date().toISOString(),
                };
            },
            {
                serviceName: 'content-service',
                userId,
                requestId,
                metadata: {
                    'content.type': 'blog-post',
                    'content.length': aiResult.content.length,
                },
            }
        );

        // Add performance metrics
        addPerformanceMetrics({
            executionTime: Date.now() - parseInt(event.requestContext?.requestTimeEpoch || '0'),
            memoryUsage: context.memoryLimitInMB * 0.7, // Simulated usage
            requestSize: JSON.stringify(event.body || '').length,
            responseSize: JSON.stringify(processedResult).length,
        });

        // Get current trace context for response headers
        const traceContext = tracer.getCurrentTraceContext();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-Id': traceContext?.traceId || 'unknown',
                'X-Correlation-Id': traceContext?.correlationId || 'unknown',
            },
            body: JSON.stringify({
                success: true,
                data: processedResult,
                trace: {
                    traceId: traceContext?.traceId,
                    correlationId: traceContext?.correlationId,
                },
            }),
        };
    } catch (error) {
        // Add error to trace
        tracer.addError(error as Error);

        const traceContext = tracer.getCurrentTraceContext();

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'X-Trace-Id': traceContext?.traceId || 'unknown',
                'X-Correlation-Id': traceContext?.correlationId || 'unknown',
            },
            body: JSON.stringify({
                success: false,
                error: {
                    message: error instanceof Error ? error.message : 'Unknown error',
                    trace: {
                        traceId: traceContext?.traceId,
                        correlationId: traceContext?.correlationId,
                    },
                },
            }),
        };
    }
}

// Export the handler wrapped with X-Ray tracing
export const lambdaHandler = withLambdaXRayTracing(handler);