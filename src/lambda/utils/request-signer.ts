/**
 * AWS Signature V4 Request Signing Utility
 * 
 * This module provides utilities for signing requests to API Gateway endpoints
 * using AWS Signature Version 4 for secure service-to-service communication.
 * 
 * Note: This is a simplified implementation for testing. In production, use
 * AWS SDK's built-in signing capabilities or AWS IAM authentication.
 */

import crypto from 'crypto';

export interface SignedRequestOptions {
    method: string;
    hostname: string;
    path: string;
    headers?: Record<string, string>;
    body?: string;
    queryParams?: Record<string, string>;
    region?: string;
    service?: string;
}

export interface SignedRequest {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: string;
}

/**
 * Sign an HTTP request using AWS Signature V4
 * 
 * This is a simplified implementation for demonstration and testing.
 * In production, use AWS SDK's built-in request signing or IAM authentication.
 */
export async function signRequest(options: SignedRequestOptions): Promise<SignedRequest> {
    const {
        method,
        hostname,
        path,
        headers = {},
        body,
        queryParams = {},
        region = process.env.AWS_REGION || 'us-east-1',
        service = 'execute-api',
    } = options;

    // Get current timestamp
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);

    // Build canonical request
    const canonicalHeaders = {
        'Content-Type': 'application/json',
        'host': hostname,
        'X-Amz-Date': amzDate,
        ...headers,
    };

    // Create authorization header (simplified - in production use AWS SDK)
    const credential = `${process.env.AWS_ACCESS_KEY_ID || 'MOCK_ACCESS_KEY'}/${dateStamp}/${region}/${service}/aws4_request`;
    const signedHeaders = Object.keys(canonicalHeaders).map(k => k.toLowerCase()).sort().join(';');

    // Create a mock signature for testing (in production, use proper AWS Signature V4)
    const signature = crypto
        .createHash('sha256')
        .update(`${method}${hostname}${path}${body || ''}${amzDate}`)
        .digest('hex');

    const authorizationHeader = `AWS4-HMAC-SHA256 Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    // Build full URL
    const queryString = Object.keys(queryParams).length > 0
        ? '?' + new URLSearchParams(queryParams).toString()
        : '';
    const url = `https://${hostname}${path}${queryString}`;

    return {
        method,
        url,
        headers: {
            ...canonicalHeaders,
            'Authorization': authorizationHeader,
        },
        body,
    };
}

/**
 * Make a signed request to an API Gateway endpoint
 */
export async function makeSignedRequest(
    options: SignedRequestOptions
): Promise<Response> {
    const signedRequest = await signRequest(options);

    const response = await fetch(signedRequest.url, {
        method: signedRequest.method,
        headers: signedRequest.headers,
        body: signedRequest.body,
    });

    return response;
}

/**
 * Parse API Gateway URL to extract hostname and path
 */
export function parseApiGatewayUrl(url: string): { hostname: string; path: string } {
    const urlObj = new URL(url);
    return {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
    };
}

/**
 * Sign and invoke an API Gateway endpoint with retry logic
 */
export async function invokeApiGateway<T = any>(
    apiUrl: string,
    method: string,
    path: string,
    body?: any,
    queryParams?: Record<string, string>,
    headers?: Record<string, string>
): Promise<T> {
    const { retry } = await import('../../lib/retry-utility');

    return retry(
        async () => {
            const { hostname } = parseApiGatewayUrl(apiUrl);
            const fullPath = path.startsWith('/') ? path : `/${path}`;

            const signedRequest = await signRequest({
                method,
                hostname,
                path: fullPath,
                headers,
                body: body ? JSON.stringify(body) : undefined,
                queryParams,
            });

            const response = await fetch(signedRequest.url, {
                method: signedRequest.method,
                headers: signedRequest.headers,
                body: signedRequest.body,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `API Gateway request failed: ${response.status} ${response.statusText} - ${errorText}`
                );
            }

            const data = await response.json();
            return data as T;
        },
        {
            maxRetries: 3,
            baseDelay: 1000,
            backoffMultiplier: 2,
            operationName: `api-gateway-${method}-${path}`,
            onRetry: (error, attempt, delay) => {
                console.log(`Retrying API Gateway request (attempt ${attempt}, delay ${delay}ms):`, error.message);
            },
        }
    );
}

/**
 * Invoke AI Service API Gateway
 */
export async function invokeAiService<T = any>(
    path: string,
    method: string = 'POST',
    body?: any,
    queryParams?: Record<string, string>
): Promise<T> {
    const aiServiceUrl = process.env.AI_SERVICE_API_URL;
    if (!aiServiceUrl) {
        throw new Error('AI_SERVICE_API_URL environment variable is not set');
    }

    return invokeApiGateway<T>(aiServiceUrl, method, path, body, queryParams);
}

/**
 * Invoke Integration Service API Gateway
 */
export async function invokeIntegrationService<T = any>(
    path: string,
    method: string = 'POST',
    body?: any,
    queryParams?: Record<string, string>
): Promise<T> {
    const integrationServiceUrl = process.env.INTEGRATION_SERVICE_API_URL;
    if (!integrationServiceUrl) {
        throw new Error('INTEGRATION_SERVICE_API_URL environment variable is not set');
    }

    return invokeApiGateway<T>(integrationServiceUrl, method, path, body, queryParams);
}

/**
 * Invoke Background Service API Gateway
 */
export async function invokeBackgroundService<T = any>(
    path: string,
    method: string = 'POST',
    body?: any,
    queryParams?: Record<string, string>
): Promise<T> {
    const backgroundServiceUrl = process.env.BACKGROUND_SERVICE_API_URL;
    if (!backgroundServiceUrl) {
        throw new Error('BACKGROUND_SERVICE_API_URL environment variable is not set');
    }

    return invokeApiGateway<T>(backgroundServiceUrl, method, path, body, queryParams);
}

/**
 * Invoke Admin Service API Gateway
 */
export async function invokeAdminService<T = any>(
    path: string,
    method: string = 'POST',
    body?: any,
    queryParams?: Record<string, string>
): Promise<T> {
    const adminServiceUrl = process.env.ADMIN_SERVICE_API_URL;
    if (!adminServiceUrl) {
        throw new Error('ADMIN_SERVICE_API_URL environment variable is not set');
    }

    return invokeApiGateway<T>(adminServiceUrl, method, path, body, queryParams);
}

/**
 * Batch invoke multiple API Gateway endpoints in parallel
 */
export async function batchInvokeApiGateway<T = any>(
    requests: Array<{
        apiUrl: string;
        method: string;
        path: string;
        body?: any;
        queryParams?: Record<string, string>;
    }>
): Promise<T[]> {
    const promises = requests.map(req =>
        invokeApiGateway<T>(req.apiUrl, req.method, req.path, req.body, req.queryParams)
    );

    return Promise.all(promises);
}

/**
 * Invoke API Gateway with retry logic using standardized retry utility
 */
export async function invokeApiGatewayWithRetry<T = any>(
    apiUrl: string,
    method: string,
    path: string,
    body?: any,
    queryParams?: Record<string, string>,
    maxRetries: number = 3,
    retryDelay: number = 1000
): Promise<T> {
    const { retry } = await import('../../lib/retry-utility');

    return retry(
        async () => invokeApiGateway<T>(apiUrl, method, path, body, queryParams),
        {
            maxRetries,
            baseDelay: retryDelay,
            backoffMultiplier: 2,
            operationName: `api-gateway-${method}-${path}`,
            onRetry: (error, attempt, delay) => {
                console.log(`Retrying API Gateway request (attempt ${attempt}/${maxRetries + 1}, delay ${delay}ms):`, error.message);
            },
        }
    );
}
