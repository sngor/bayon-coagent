/**
 * Token Encryption Service using AWS KMS
 * 
 * Provides encryption and decryption for sensitive tokens (MLS and OAuth)
 * using AWS Key Management Service (KMS) for secure key management.
 * 
 * Requirements: 1.2, 6.2 - Secure token storage with encryption
 */

import { KMSClient, EncryptCommand, DecryptCommand } from '@aws-sdk/client-kms';

/**
 * KMS Client Configuration
 */
const kmsClient = new KMSClient({
    region: process.env.AWS_REGION || 'us-east-1',
    ...(process.env.USE_LOCAL_AWS === 'true' && {
        endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
        credentials: {
            accessKeyId: 'test',
            secretAccessKey: 'test',
        },
    }),
});

/**
 * KMS Key ID for token encryption
 * In production, this should be a dedicated KMS key for token encryption
 */
const KMS_KEY_ID = process.env.TOKEN_ENCRYPTION_KEY_ID || 'alias/bayon-token-encryption';

/**
 * Encryption context for additional security
 * Provides additional authenticated data (AAD) for encryption
 */
interface EncryptionContext {
    userId: string;
    tokenType: 'mls' | 'oauth';
    platform?: string;
}

/**
 * Encrypts a token using AWS KMS
 * 
 * @param token - Plain text token to encrypt
 * @param context - Encryption context for additional security
 * @returns Base64-encoded encrypted token
 */
export async function encryptToken(
    token: string,
    context: EncryptionContext
): Promise<string> {
    // Skip encryption in local development without LocalStack
    if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_AWS !== 'true') {
        console.warn('Token encryption skipped in local development mode');
        return Buffer.from(token).toString('base64');
    }

    try {
        const command = new EncryptCommand({
            KeyId: KMS_KEY_ID,
            Plaintext: Buffer.from(token, 'utf-8'),
            EncryptionContext: {
                userId: context.userId,
                tokenType: context.tokenType,
                ...(context.platform && { platform: context.platform }),
            },
        });

        const response = await kmsClient.send(command);

        if (!response.CiphertextBlob) {
            throw new Error('KMS encryption failed: no ciphertext returned');
        }

        // Return base64-encoded ciphertext for storage
        return Buffer.from(response.CiphertextBlob).toString('base64');
    } catch (error) {
        console.error('Token encryption failed:', error);
        throw new Error(`Failed to encrypt token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Decrypts a token using AWS KMS
 * 
 * @param encryptedToken - Base64-encoded encrypted token
 * @param context - Encryption context (must match encryption context)
 * @returns Decrypted plain text token
 */
export async function decryptToken(
    encryptedToken: string,
    context: EncryptionContext
): Promise<string> {
    // Skip decryption in local development without LocalStack
    if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_AWS !== 'true') {
        return Buffer.from(encryptedToken, 'base64').toString('utf-8');
    }

    try {
        const command = new DecryptCommand({
            CiphertextBlob: Buffer.from(encryptedToken, 'base64'),
            EncryptionContext: {
                userId: context.userId,
                tokenType: context.tokenType,
                ...(context.platform && { platform: context.platform }),
            },
        });

        const response = await kmsClient.send(command);

        if (!response.Plaintext) {
            throw new Error('KMS decryption failed: no plaintext returned');
        }

        return Buffer.from(response.Plaintext).toString('utf-8');
    } catch (error) {
        console.error('Token decryption failed:', error);
        throw new Error(`Failed to decrypt token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Encrypts MLS access token
 * 
 * @param token - MLS access token
 * @param userId - User ID
 * @returns Encrypted token
 */
export async function encryptMLSToken(token: string, userId: string): Promise<string> {
    return encryptToken(token, {
        userId,
        tokenType: 'mls',
    });
}

/**
 * Decrypts MLS access token
 * 
 * @param encryptedToken - Encrypted MLS token
 * @param userId - User ID
 * @returns Decrypted token
 */
export async function decryptMLSToken(encryptedToken: string, userId: string): Promise<string> {
    return decryptToken(encryptedToken, {
        userId,
        tokenType: 'mls',
    });
}

/**
 * Encrypts OAuth access token
 * 
 * @param token - OAuth access token
 * @param userId - User ID
 * @param platform - Social media platform
 * @returns Encrypted token
 */
export async function encryptOAuthToken(
    token: string,
    userId: string,
    platform: string
): Promise<string> {
    return encryptToken(token, {
        userId,
        tokenType: 'oauth',
        platform,
    });
}

/**
 * Decrypts OAuth access token
 * 
 * @param encryptedToken - Encrypted OAuth token
 * @param userId - User ID
 * @param platform - Social media platform
 * @returns Decrypted token
 */
export async function decryptOAuthToken(
    encryptedToken: string,
    userId: string,
    platform: string
): Promise<string> {
    return decryptToken(encryptedToken, {
        userId,
        tokenType: 'oauth',
        platform,
    });
}

/**
 * Validates that a token is properly encrypted
 * 
 * @param token - Token to validate
 * @returns True if token appears to be encrypted
 */
export function isTokenEncrypted(token: string): boolean {
    try {
        // Encrypted tokens should be base64-encoded
        const decoded = Buffer.from(token, 'base64').toString('base64');
        return decoded === token && token.length > 100; // KMS ciphertext is typically > 100 chars
    } catch {
        return false;
    }
}
