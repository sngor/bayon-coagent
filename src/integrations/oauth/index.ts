/**
 * OAuth Integration Module
 * 
 * Exports OAuth connection management functionality for social media platforms
 * with enhanced analytics support for content workflow features.
 */

export {
    type OAuthConnectionManager,
    OAuthConnectionManagerImpl,
    getOAuthConnectionManager,
    disconnectConnection,
} from './connection-manager';

export type { Platform, OAuthConnection } from '../social/types';

// Re-export analytics constants for content workflow features
export {
    ANALYTICS_API_ENDPOINTS,
    ANALYTICS_METRICS,
} from '../social/constants';
