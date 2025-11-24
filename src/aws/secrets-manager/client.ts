/**
 * AWS Secrets Manager Client
 * 
 * Provides utilities for retrieving OAuth credentials and API keys
 * from AWS Secrets Manager with caching support.
 * 
 * Requirements: 6.4 - Secure credential management
 */

import {
    SecretsManagerClient,
    GetSecretValueCommand,
    GetSecretValueCommandOutput,
} from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1',
});

// Cache for secrets to avoid repeated API calls
const secretCache = new Map<string, { value: any; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get a secret from AWS Secrets Manager with caching
 * 
 * @param secretName - Name or ARN of the secret
 * @param useCache - Whether to use cached value (default: true)
 * @returns Parsed secret value
 */
export async function getSecret<T = any>(
    secretName: string,
    useCache: boolean = true
): Promise<T> {
    // Check cache first
    if (useCache) {
        const cached = secretCache.get(secretName);
        if (cached && cached.expiresAt > Date.now()) {
            console.log(`Using cached secret: ${secretName}`);
            return cached.value as T;
        }
    }

    console.log(`Fetching secret from Secrets Manager: ${secretName}`);

    try {
        const command = new GetSecretValueCommand({
            SecretId: secretName,
        });

        const response: GetSecretValueCommandOutput = await client.send(command);

        if (!response.SecretString) {
            throw new Error(`Secret ${secretName} has no value`);
        }

        const secretValue = JSON.parse(response.SecretString);

        // Cache the secret
        secretCache.set(secretName, {
            value: secretValue,
            expiresAt: Date.now() + CACHE_TTL,
        });

        return secretValue as T;
    } catch (error) {
        console.error(`Failed to get secret ${secretName}:`, error);
        throw error;
    }
}

/**
 * Clear the secret cache
 * Useful for testing or when secrets are rotated
 */
export function clearSecretCache(): void {
    secretCache.clear();
    console.log('Secret cache cleared');
}

/**
 * Clear a specific secret from the cache
 * 
 * @param secretName - Name or ARN of the secret to clear
 */
export function clearSecret(secretName: string): void {
    secretCache.delete(secretName);
    console.log(`Cleared secret from cache: ${secretName}`);
}

// OAuth credential types
export interface GoogleOAuthCredentials {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface FacebookOAuthCredentials {
    appId: string;
    appSecret: string;
    redirectUri: string;
}

export interface InstagramOAuthCredentials {
    appId: string;
    appSecret: string;
    redirectUri: string;
}

export interface LinkedInOAuthCredentials {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}

export interface TwitterOAuthCredentials {
    apiKey: string;
    apiSecret: string;
    bearerToken: string;
    redirectUri: string;
}

export interface MLSAPICredentials {
    mlsgrid: {
        apiKey: string;
        apiSecret: string;
        baseUrl: string;
    };
    bridgeInteractive: {
        apiKey: string;
        baseUrl: string;
    };
}

/**
 * Get Google OAuth credentials
 * 
 * @param environment - Environment name (development or production)
 * @returns Google OAuth credentials
 */
export async function getGoogleOAuthCredentials(
    environment: string = process.env.NODE_ENV || 'development'
): Promise<GoogleOAuthCredentials> {
    const secretName = `bayon-coagent/oauth/google-${environment}`;
    return getSecret<GoogleOAuthCredentials>(secretName);
}

/**
 * Get Facebook OAuth credentials
 * 
 * @param environment - Environment name (development or production)
 * @returns Facebook OAuth credentials
 */
export async function getFacebookOAuthCredentials(
    environment: string = process.env.NODE_ENV || 'development'
): Promise<FacebookOAuthCredentials> {
    const secretName = `bayon-coagent/oauth/facebook-${environment}`;
    return getSecret<FacebookOAuthCredentials>(secretName);
}

/**
 * Get Instagram OAuth credentials
 * 
 * @param environment - Environment name (development or production)
 * @returns Instagram OAuth credentials
 */
export async function getInstagramOAuthCredentials(
    environment: string = process.env.NODE_ENV || 'development'
): Promise<InstagramOAuthCredentials> {
    const secretName = `bayon-coagent/oauth/instagram-${environment}`;
    return getSecret<InstagramOAuthCredentials>(secretName);
}

/**
 * Get LinkedIn OAuth credentials
 * 
 * @param environment - Environment name (development or production)
 * @returns LinkedIn OAuth credentials
 */
export async function getLinkedInOAuthCredentials(
    environment: string = process.env.NODE_ENV || 'development'
): Promise<LinkedInOAuthCredentials> {
    const secretName = `bayon-coagent/oauth/linkedin-${environment}`;
    return getSecret<LinkedInOAuthCredentials>(secretName);
}

/**
 * Get Twitter OAuth credentials
 * 
 * @param environment - Environment name (development or production)
 * @returns Twitter OAuth credentials
 */
export async function getTwitterOAuthCredentials(
    environment: string = process.env.NODE_ENV || 'development'
): Promise<TwitterOAuthCredentials> {
    const secretName = `bayon-coagent/oauth/twitter-${environment}`;
    return getSecret<TwitterOAuthCredentials>(secretName);
}

/**
 * Get MLS API credentials
 * 
 * @param environment - Environment name (development or production)
 * @returns MLS API credentials
 */
export async function getMLSAPICredentials(
    environment: string = process.env.NODE_ENV || 'development'
): Promise<MLSAPICredentials> {
    const secretName = `bayon-coagent/mls/api-credentials-${environment}`;
    return getSecret<MLSAPICredentials>(secretName);
}
