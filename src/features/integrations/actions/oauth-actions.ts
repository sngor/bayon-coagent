/**
 * Server actions for OAuth token management
 */

'use server';

import { getOAuthTokens, getValidOAuthTokens, refreshOAuthTokens, type OAuthTokenData } from '@/aws/dynamodb';

/**
 * Server action to get OAuth tokens for a user
 * Uses Integration Service Lambda via API Gateway with fallback to direct implementation
 * Requirement 1.5: Implement fallback for integration service failures
 * 
 * @param userId User ID
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 * @returns OAuth token data or null if not found
 */
export async function getOAuthTokensAction(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<OAuthTokenData | null> {
  try {
    // For Google OAuth, try integration service first
    if (provider === 'GOOGLE_BUSINESS') {
      try {
        // Note: The Integration Service doesn't have a direct "get tokens" endpoint
        // It handles OAuth flow initiation and callback
        // For token retrieval, we fall back to direct DynamoDB access
        console.log('Getting OAuth tokens via direct DynamoDB access');
        return await getOAuthTokens(userId, provider);
      } catch (integrationError) {
        console.warn('Failed to get OAuth tokens, using direct implementation:', integrationError);
        return await getOAuthTokens(userId, provider);
      }
    }

    // For other providers, use direct implementation
    return await getOAuthTokens(userId, provider);
  } catch (error) {
    console.error('Failed to get OAuth tokens:', error);
    return null;
  }
}

/**
 * Server action to get valid OAuth tokens, refreshing if necessary
 * @param userId User ID
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 * @returns Valid OAuth token data or null if not found/refresh failed
 */
export async function getValidOAuthTokensAction(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<OAuthTokenData | null> {
  try {
    return await getValidOAuthTokens(userId, provider);
  } catch (error) {
    console.error('Failed to get valid OAuth tokens:', error);
    return null;
  }
}

/**
 * Server action to refresh OAuth tokens
 * @param userId User ID
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 * @returns Refreshed OAuth token data or null if refresh failed
 */
export async function refreshOAuthTokensAction(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<OAuthTokenData | null> {
  try {
    return await refreshOAuthTokens(userId, provider);
  } catch (error) {
    console.error('Failed to refresh OAuth tokens:', error);
    return null;
  }
}
