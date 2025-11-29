/**
 * Google Analytics 4 (GA4) Integration
 * 
 * Provides integration with Google Analytics 4 for enhanced analytics tracking.
 * Supports both Measurement Protocol (sending events) and Data API (fetching reports).
 */

export { ga4Manager } from './ga4-manager.js';
export { MeasurementClient } from './measurement-client.js';
export { DataAPIClient } from './data-api-client.js';
export * from './types.js';
export * from './constants.js';
export * from './events.js';
