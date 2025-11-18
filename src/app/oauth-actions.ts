/**
 * Server actions for OAuth token management
 */

'use server';

import { getOAuthTokens, getValidOAuthTokens, refreshOAuthTokens, type OAuthTokenData } from '@/aws/dynamodb';

/**
 * Server action to get OAuth tokens for a user
 * @param userId User ID
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 * @returns OAuth token data or null if not found
 */
export async function getOAuthTokensAction(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<OAuthTokenData | null> {
  try {
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
