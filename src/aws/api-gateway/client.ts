/**
 * API Gateway Client for Microservices Communication
 * 
 * This module provides a client for making requests to different
 * microservice API Gateway endpoints with proper authentication,
 * error handling, and request/response transformation.
 */

import { getServiceEndpoints, createApiGatewayResponse } from './config';

export interface ApiClientConfig {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
}

export interface ApiRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    body?: any;
    headers?: Record<string, string>;
    queryParams?: Record<string, string>;
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    traceId?: string;
    statusCode: number;
}

export class ApiGatewayClient {
    private endpoints: ReturnType<typeof getServiceEndpoints>;
    private config: ApiClientConfig;

    constructor(config: ApiClientConfig = {}) {
        this.endpoints = getServiceEndpoints();
        this.config = {
            timeout: 30000, // 30 seconds
            retries: 3,
            retryDelay: 1000, // 1 second
            ...config,
        };
    }

    /**
     * Make a request to the main platform service
     */
    async main<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
        return this.makeRequest(this.endpoints.main, request);
    }

    /**
     * Make a request to the AI processing service
     */
    async ai<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
        return this.makeRequest(this.endpoints.ai, request);
    }

    /**
     * Make a request to the integration service
     */
    async integration<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
        return this.makeRequest(this.endpoints.integration, request);
    }

    /**
     * Make a request to the background processing service
     */
    async background<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
        return this.makeRequest(this.endpoints.background, request);
    }

    /**
     * Make a request to the admin service
     */
    async admin<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
        return this.makeRequest(this.endpoints.admin, request);
    }

    /**
     * Make a request with retry logic and error handling
     */
    private async makeRequest<T = any>(
        baseUrl: string,
        request: ApiRequest,
        attempt: number = 1
    ): Promise<ApiResponse<T>> {
        const url = this.buildUrl(baseUrl, request.path, request.queryParams);
        const headers = this.buildHeaders(request.headers);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(url, {
                method: request.method,
                headers,
                body: request.body ? JSON.stringify(request.body) : undefined,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const responseData = await this.parseResponse(response);

            return {
                success: response.ok,
                data: response.ok ? responseData.data : undefined,
                error: !response.ok ? responseData.error : undefined,
                traceId: responseData.traceId,
                statusCode: response.status,
            };

        } catch (error: any) {
            // Retry on network errors or 5xx responses
            if (attempt < (this.config.retries || 3) && this.shouldRetry(error)) {
                await this.delay(this.config.retryDelay! * attempt);
                return this.makeRequest(baseUrl, request, attempt + 1);
            }

            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: error.message || 'Network request failed',
                    details: { attempt, maxRetries: this.config.retries },
                },
                statusCode: 0,
            };
        }
    }

    /**
     * Build the full URL with query parameters
     */
    private buildUrl(baseUrl: string, path: string, queryParams?: Record<string, string>): string {
        const url = new URL(path.startsWith('/') ? path.slice(1) : path, baseUrl);

        if (queryParams) {
            Object.entries(queryParams).forEach(([key, value]) => {
                url.searchParams.append(key, value);
            });
        }

        return url.toString();
    }

    /**
     * Build request headers with defaults
     */
    private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
        const defaultHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Trace-Id': this.generateTraceId(),
            'User-Agent': 'BayonCoAgent/1.0.0',
            ...this.config.headers,
            ...customHeaders,
        };

        // Add authentication headers if available
        const authToken = this.getAuthToken();
        if (authToken) {
            defaultHeaders['Authorization'] = `Bearer ${authToken}`;
        }

        return defaultHeaders;
    }

    /**
     * Parse response body
     */
    private async parseResponse(response: Response): Promise<any> {
        const contentType = response.headers.get('content-type');

        if (contentType?.includes('application/json')) {
            return response.json();
        }

        const text = await response.text();

        // Try to parse as JSON if it looks like JSON
        if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            try {
                return JSON.parse(text);
            } catch {
                // Fall through to return as text
            }
        }

        return { data: text };
    }

    /**
     * Determine if a request should be retried
     */
    private shouldRetry(error: any): boolean {
        // Retry on network errors
        if (error.name === 'AbortError' || error.name === 'TypeError') {
            return true;
        }

        // Retry on 5xx server errors
        if (error.status >= 500 && error.status < 600) {
            return true;
        }

        // Retry on 429 (rate limited)
        if (error.status === 429) {
            return true;
        }

        return false;
    }

    /**
     * Delay execution for retry logic
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get authentication token from storage or context
     */
    private getAuthToken(): string | null {
        // In browser environment
        if (typeof window !== 'undefined') {
            return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        }

        // In server environment
        return process.env.API_AUTH_TOKEN || null;
    }

    /**
     * Generate a unique trace ID for request tracking
     */
    private generateTraceId(): string {
        return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

/**
 * Convenience functions for common API operations
 */

// Singleton client instance
let clientInstance: ApiGatewayClient | null = null;

/**
 * Get or create the API Gateway client instance
 */
export function getApiClient(config?: ApiClientConfig): ApiGatewayClient {
    if (!clientInstance) {
        clientInstance = new ApiGatewayClient(config);
    }
    return clientInstance;
}

/**
 * Make a GET request to a service
 */
export async function get<T = any>(
    service: 'main' | 'ai' | 'integration' | 'background' | 'admin',
    path: string,
    queryParams?: Record<string, string>,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> {
    const client = getApiClient();
    return client[service]({
        method: 'GET',
        path,
        queryParams,
        headers,
    });
}

/**
 * Make a POST request to a service
 */
export async function post<T = any>(
    service: 'main' | 'ai' | 'integration' | 'background' | 'admin',
    path: string,
    body?: any,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> {
    const client = getApiClient();
    return client[service]({
        method: 'POST',
        path,
        body,
        headers,
    });
}

/**
 * Make a PUT request to a service
 */
export async function put<T = any>(
    service: 'main' | 'ai' | 'integration' | 'background' | 'admin',
    path: string,
    body?: any,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> {
    const client = getApiClient();
    return client[service]({
        method: 'PUT',
        path,
        body,
        headers,
    });
}

/**
 * Make a DELETE request to a service
 */
export async function del<T = any>(
    service: 'main' | 'ai' | 'integration' | 'background' | 'admin',
    path: string,
    headers?: Record<string, string>
): Promise<ApiResponse<T>> {
    const client = getApiClient();
    return client[service]({
        method: 'DELETE',
        path,
        headers,
    });
}

/**
 * Health check utilities for service monitoring
 */
export async function checkServiceHealth(
    service: 'main' | 'ai' | 'integration' | 'background' | 'admin'
): Promise<ApiResponse<any>> {
    return get(service, '/health');
}

/**
 * Check health of all services
 */
export async function checkAllServicesHealth(): Promise<Record<string, ApiResponse<any>>> {
    const services: Array<'main' | 'ai' | 'integration' | 'background' | 'admin'> = [
        'main', 'ai', 'integration', 'background', 'admin'
    ];

    const healthChecks = await Promise.allSettled(
        services.map(async (service) => ({
            service,
            result: await checkServiceHealth(service),
        }))
    );

    const results: Record<string, ApiResponse<any>> = {};

    healthChecks.forEach((check, index) => {
        const service = services[index];
        if (check.status === 'fulfilled') {
            results[service] = check.value.result;
        } else {
            results[service] = {
                success: false,
                error: {
                    code: 'HEALTH_CHECK_FAILED',
                    message: 'Health check request failed',
                    details: check.reason,
                },
                statusCode: 0,
            };
        }
    });

    return results;
}