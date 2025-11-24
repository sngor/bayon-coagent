/**
 * AWS X-Ray Distributed Tracing Module
 * 
 * This module provides centralized X-Ray tracing functionality for the
 * Bayon CoAgent microservices architecture. It enables distributed tracing
 * across Lambda functions, API Gateway, and Next.js services.
 */

export * from './tracer';
export * from './middleware';
export * from './utils';
export * from './config';