/**
 * Lambda Function Wrapper
 * Provides common functionality for all Lambda functions
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { captureAWSv3Client } from 'aws-xray-sdk-core';

interface LambdaHandler {
    (event: APIGatewayProxyEvent, context?: Context): Promise<APIGatewayProxyResult>;
}

/**
 * Wraps Lambda handlers with common functionality
 */
export function wrapLambdaHandler(handler: LambdaHandler): LambdaHandler {
    return async (event: APIGatewayProxyEvent, context?: Context): Promise<APIGatewayProxyResult> => {
        // Add correlation ID for tracing
        const correlationId = event.requestContext.requestId;

        // Set up logging context
        console.log('Lambda invocation started', {
            correlationId,
            httpMethod: event.httpMethod,
            path: event.path,
            userAgent: event.headers['User-Agent'],
            sourceIp: event.requestContext.identity.sourceIp,
        });

        const startTime = Date.now();

        try {
            // Handle CORS preflight requests
            if (event.httpMethod === 'OPTIONS') {
                return {
                    statusCode: 200,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
                        'Access-Control-Max-Age': '86400',
                    },
                    body: '',
                };
            }

            // Execute the handler
            const result = await handler(event, context);

            // Add CORS headers to all responses
            const corsHeaders = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Credentials': 'true',
                ...result.headers,
            };

            const duration = Date.now() - startTime;

            console.log('Lambda invocation completed', {
                correlationId,
                statusCode: result.statusCode,
                duration,
            });

            return {
                ...result,
                headers: corsHeaders,
            };
        } catch (error: any) {
            const duration = Date.now() - startTime;

            console.error('Lambda invocation failed', {
                correlationId,
                error: error.message,
                stack: error.stack,
                duration,
            });

            // Return standardized error response
            return {
                statusCode: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Credentials': 'true',
                },
                body: JSON.stringify({
                    error: 'Internal Server Error',
                    message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
                    correlationId,
                }),
            };
        }
    };
}

/**
 * Validates request body and parses JSON
 */
export function parseRequestBody<T>(event: APIGatewayProxyEvent): T {
    if (!event.body) {
        throw new Error('Request body is required');
    }

    try {
        return JSON.parse(event.body) as T;
    } catch (error) {
        throw new Error('Invalid JSON in request body');
    }
}

/**
 * Creates a success response
 */
export function createSuccessResponse<T>(data: T, statusCode: number = 200): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            success: true,
            data,
        }),
    };
}

/**
 * Creates an error response
 */
export function createErrorResponse(
    message: string,
    statusCode: number = 400,
    errorCode?: string
): APIGatewayProxyResult {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            success: false,
            error: {
                code: errorCode || 'UNKNOWN_ERROR',
                message,
            },
        }),
    };
}

/**
 * Validates required environment variables
 */
export function validateEnvironment(requiredVars: string[]): void {
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}