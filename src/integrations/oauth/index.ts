/**
 * OAuth Integration Module
 * 
 * Exports OAuth connection management functionality for social media platforms.
 */

export {
    type OAuthConnectionManager,
    OAuthConnectionManagerImpl,
    getOAuthConnectionManager,
    disconnectConnection,
} from './connection-manager';

export type { Platform, OAuthConnection } from '../social/types';
