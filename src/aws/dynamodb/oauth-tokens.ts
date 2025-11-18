/**
 * OAuth Token Storage and Management
 * 
 * Provides functions to store, retrieve, and refresh OAuth tokens in DynamoDB.
 * Tokens are stored with the pattern: PK: OAUTH#<userId>, SK: <provider>
 */

import { getRepository } from './repository';
import { getOAuthTokenKeys } from './keys';
import { DynamoDBItem } from './types';

/**
 * OAuth token data structure
 */
export interface OAuthTokenData {
  agentProfileId: string;
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
  provider?: string;
}

/**
 * Stores OAuth tokens in DynamoDB
 * @param userId User ID
 * @param tokenData OAuth token data
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 */
export async function storeOAuthTokens(
  userId: string,
  tokenData: OAuthTokenData,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<void> {
  const repository = getRepository();
  const keys = getOAuthTokenKeys(userId, provider);

  const item: DynamoDBItem<OAuthTokenData> = {
    ...keys,
    EntityType: 'OAuthToken',
    Data: {
      ...tokenData,
      provider,
    },
    CreatedAt: Date.now(),
    UpdatedAt: Date.now(),
  };

  await repository.put(item);
}

/**
 * Retrieves OAuth tokens from DynamoDB
 * @param userId User ID
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 * @returns OAuth token data or null if not found
 */
export async function getOAuthTokens(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<OAuthTokenData | null> {
  const repository = getRepository();
  const keys = getOAuthTokenKeys(userId, provider);

  return await repository.get<OAuthTokenData>(keys.PK, keys.SK);
}

/**
 * Updates OAuth tokens in DynamoDB
 * @param userId User ID
 * @param updates Partial token data to update
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 */
export async function updateOAuthTokens(
  userId: string,
  updates: Partial<OAuthTokenData>,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<void> {
  const repository = getRepository();
  const keys = getOAuthTokenKeys(userId, provider);

  await repository.update<OAuthTokenData>(keys.PK, keys.SK, updates);
}

/**
 * Deletes OAuth tokens from DynamoDB
 * @param userId User ID
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 */
export async function deleteOAuthTokens(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<void> {
  const repository = getRepository();
  const keys = getOAuthTokenKeys(userId, provider);

  await repository.delete(keys.PK, keys.SK);
}

/**
 * Checks if OAuth tokens are expired
 * @param tokenData OAuth token data
 * @returns true if tokens are expired or about to expire (within 5 minutes)
 */
export function areTokensExpired(tokenData: OAuthTokenData): boolean {
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  return Date.now() >= tokenData.expiryDate - bufferTime;
}

/**
 * Refreshes OAuth tokens using the refresh token
 * @param userId User ID
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 * @returns New OAuth token data or null if refresh failed
 */
export async function refreshOAuthTokens(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<OAuthTokenData | null> {
  const tokenData = await getOAuthTokens(userId, provider);

  if (!tokenData) {
    throw new Error('No OAuth tokens found for user');
  }

  if (!tokenData.refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    // Call Google's token refresh endpoint
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: tokenData.refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Token refresh failed: ${errorData.error_description || errorData.error}`);
    }

    const data = await response.json();

    // Update tokens in DynamoDB
    const updatedTokenData: OAuthTokenData = {
      ...tokenData,
      accessToken: data.access_token,
      // Google may or may not return a new refresh token
      refreshToken: data.refresh_token || tokenData.refreshToken,
      expiryDate: Date.now() + data.expires_in * 1000,
    };

    await storeOAuthTokens(userId, updatedTokenData, provider);

    return updatedTokenData;
  } catch (error) {
    console.error('Failed to refresh OAuth tokens:', error);
    throw error;
  }
}

/**
 * Gets valid OAuth tokens, refreshing if necessary
 * @param userId User ID
 * @param provider OAuth provider (default: GOOGLE_BUSINESS)
 * @returns Valid OAuth token data or null if not found
 */
export async function getValidOAuthTokens(
  userId: string,
  provider: string = 'GOOGLE_BUSINESS'
): Promise<OAuthTokenData | null> {
  const tokenData = await getOAuthTokens(userId, provider);

  if (!tokenData) {
    return null;
  }

  // If tokens are expired or about to expire, refresh them
  if (areTokensExpired(tokenData)) {
    try {
      return await refreshOAuthTokens(userId, provider);
    } catch (error) {
      console.error('Failed to refresh expired tokens:', error);
      // Return null if refresh fails - user will need to re-authenticate
      return null;
    }
  }

  return tokenData;
}
