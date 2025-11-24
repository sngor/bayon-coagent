/**
 * API Gateway Module for Microservices Architecture
 * 
 * This module provides utilities for working with API Gateway
 * in the microservices architecture, including configuration,
 * client utilities, and request/response handling.
 */

// Configuration exports
export {
    getApiGatewayConfig,
    getServiceEndpoints,
    createApiGatewayResponse,
    parseRequestBody,
    extractUserFromRequest,
    validateRequestParameters,
    getApiVersion,
    validateApiVersion,
    createHealthCheckResponse,
    API_VERSIONS,
    type ApiGatewayConfig,
    type ServiceEndpoints,
    type ApiGatewayRequest,
    type ApiGatewayResponse,
    type ApiVersion,
    type HealthCheckResult,
} from './config';

// Client exports
export {
    ApiGatewayClient,
    getApiClient,
    get,
    post,
    put,
    del,
    checkServiceHealth,
    checkAllServicesHealth,
    type ApiClientConfig,
    type ApiRequest,
    type ApiResponse,
} from './client';

// Re-export for convenience
export * from './config';
export * from './client';