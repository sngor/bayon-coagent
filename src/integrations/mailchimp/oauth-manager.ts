/**
 * Mailchimp OAuth Manager
 * 
 * Implements OAuth 2.0 flow for Mailchimp integration.
 * Handles data center discovery and Mailchimp-specific OAuth requirements.
 */

import { BaseOAuthManager, OAuthConfig } from '../oauth/base-oauth-manager';
import { IntegrationProvider, IntegrationType, IntegrationConnection, IntegrationResult } from '../types';
import { MailchimpMetadata } from './types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Mailchimp OAuth Manager
 */
export class MailchimpOAuthManager extends BaseOAuthManager {
    provider: IntegrationProvider = 'mailchimp';
    type: IntegrationType = 'email';

    protected config: OAuthConfig = {
        clientId: process.env.MAILCHIMP_CLIENT_ID || '',
        clientSecret: process.env.MAILCHIMP_CLIENT_SECRET || '',
        redirectUri: `${APP_URL}/api/oauth/mailchimp/callback`,
        authUrl: 'https://login.mailchimp.com/oauth2/authorize',
        tokenUrl: 'https://login.mailchimp.com/oauth2/token',
        scopes: [] // Mailchimp doesn't use granular scopes in the same way
    };

    /**
     * Get user info from Mailchimp (including data center)
     */
    protected async getUserInfo(accessToken: string): Promise<Record<string, any>> {
        try {
            // First, get metadata to discover data center
            const metadataResponse = await fetch('https://login.mailchimp.com/oauth2/metadata', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            if (!metadataResponse.ok) {
                throw new Error('Failed to fetch Mailchimp metadata');
            }

            const metadata = await metadataResponse.json();

            // Extract data center from api_endpoint
            // Format: https://us1.api.mailchimp.com or https://usX.api.mailchimp.com
            const dc = metadata.api_endpoint.match(/https:\/\/([^.]+)\.api\.mailchimp\.com/)?.[1] || 'us1';

            const mailchimpMetadata: MailchimpMetadata = {
                dc,
                apiEndpoint: metadata.api_endpoint,
                accountId: metadata.accountname || metadata.account_id || '',
                accountName: metadata.accountname || '',
                role: metadata.role || 'member',
                loginUrl: metadata.login_url || ''
            };

            return mailchimpMetadata;
        } catch (error) {
            console.error('Failed to get Mailchimp user info:', error);
            throw error;
        }
    }

    /**
     * Validate Mailchimp connection
     */
    async validate(connection: IntegrationConnection): Promise<IntegrationResult<boolean>> {
        try {
            const metadata = connection.credentials.metadata as MailchimpMetadata;

            if (!metadata?.apiEndpoint) {
                return {
                    success: false,
                    error: 'Missing API endpoint in connection metadata'
                };
            }

            // Test API connection by fetching account info
            const response = await fetch(`${metadata.apiEndpoint}/3.0/`, {
                headers: {
                    'Authorization': `Bearer ${connection.credentials.accessToken}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                return {
                    success: false,
                    error: `API validation failed: ${response.statusText}`
                };
            }

            return {
                success: true,
                data: true
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Validation failed'
            };
        }
    }

    /**
     * Disconnect from Mailchimp
     * Note: Mailchimp doesn't provide a token revocation endpoint
     */
    async disconnect(userId: string): Promise<IntegrationResult<void>> {
        // Mailchimp doesn't have a revoke endpoint
        // The connection will be removed from our database
        // User must manually revoke access from Mailchimp dashboard if needed
        return {
            success: true
        };
    }
}

// Export singleton instance
export const mailchimpOAuthManager = new MailchimpOAuthManager();
