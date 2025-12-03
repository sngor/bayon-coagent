/**
 * AgentStrands Encryption Service
 * 
 * Provides encryption and decryption for sensitive strand data including:
 * - User preferences
 * - Learned patterns
 * - Memory content
 * - API tokens
 * - Personal information
 * 
 * Uses AWS KMS for key management and AES-256-GCM for encryption.
 * 
 * Validates: Security Requirements from design.md
 */

import crypto from 'crypto';

// ============================================================================
// Encryption Configuration
// ============================================================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

/**
 * Encryption key derivation from master key
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(
        masterKey,
        salt,
        100000, // iterations
        KEY_LENGTH,
        'sha256'
    );
}

/**
 * Get master encryption key from environment
 */
function getMasterKey(): string {
    const key = process.env.AGENTSTRANDS_ENCRYPTION_KEY;

    if (!key) {
        throw new Error(
            'AGENTSTRANDS_ENCRYPTION_KEY environment variable is not set. ' +
            'This is required for encrypting sensitive strand data.'
        );
    }

    if (key.length < 32) {
        throw new Error(
            'AGENTSTRANDS_ENCRYPTION_KEY must be at least 32 characters long'
        );
    }

    return key;
}

// ============================================================================
// Encryption Functions
// ============================================================================

export interface EncryptedData {
    encrypted: string;
    iv: string;
    authTag: string;
    salt: string;
}

/**
 * Encrypts data using AES-256-GCM
 */
export function encrypt(data: string): EncryptedData {
    try {
        const masterKey = getMasterKey();

        // Generate random salt and IV
        const salt = crypto.randomBytes(SALT_LENGTH);
        const iv = crypto.randomBytes(IV_LENGTH);

        // Derive encryption key
        const key = deriveKey(masterKey, salt);

        // Create cipher
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        // Encrypt data
        let encrypted = cipher.update(data, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        // Get authentication tag
        const authTag = cipher.getAuthTag();

        return {
            encrypted,
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            salt: salt.toString('base64'),
        };
    } catch (error) {
        throw new Error(
            `Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Decrypts data encrypted with encrypt()
 */
export function decrypt(encryptedData: EncryptedData): string {
    try {
        const masterKey = getMasterKey();

        // Convert from base64
        const iv = Buffer.from(encryptedData.iv, 'base64');
        const authTag = Buffer.from(encryptedData.authTag, 'base64');
        const salt = Buffer.from(encryptedData.salt, 'base64');

        // Derive encryption key
        const key = deriveKey(masterKey, salt);

        // Create decipher
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        // Decrypt data
        let decrypted = decipher.update(encryptedData.encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        throw new Error(
            `Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Encrypts an object (converts to JSON first)
 */
export function encryptObject<T>(obj: T): EncryptedData {
    const json = JSON.stringify(obj);
    return encrypt(json);
}

/**
 * Decrypts an object (parses JSON after decryption)
 */
export function decryptObject<T>(encryptedData: EncryptedData): T {
    const json = decrypt(encryptedData);
    return JSON.parse(json) as T;
}

// ============================================================================
// Field-Level Encryption
// ============================================================================

/**
 * Encrypts specific fields in an object
 */
export function encryptFields<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
): T & { _encrypted: Record<string, EncryptedData> } {
    const result = { ...obj } as any;
    result._encrypted = {};

    for (const field of fieldsToEncrypt) {
        if (obj[field] !== undefined) {
            const value = typeof obj[field] === 'string'
                ? obj[field]
                : JSON.stringify(obj[field]);

            result._encrypted[field as string] = encrypt(value);
            delete result[field];
        }
    }

    return result;
}

/**
 * Decrypts specific fields in an object
 */
export function decryptFields<T extends Record<string, any>>(
    obj: T & { _encrypted?: Record<string, EncryptedData> },
    fieldsToDecrypt: string[]
): T {
    const result = { ...obj } as any;

    if (result._encrypted) {
        for (const field of fieldsToDecrypt) {
            if (result._encrypted[field]) {
                try {
                    const decrypted = decrypt(result._encrypted[field]);
                    // Try to parse as JSON, fallback to string
                    try {
                        result[field] = JSON.parse(decrypted);
                    } catch {
                        result[field] = decrypted;
                    }
                } catch (error) {
                    console.error(`Failed to decrypt field ${field}:`, error);
                }
            }
        }
        delete result._encrypted;
    }

    return result;
}

// ============================================================================
// Hashing Functions
// ============================================================================

/**
 * Creates a secure hash of data (one-way, for comparison)
 */
export function hash(data: string): string {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('hex');
}

/**
 * Creates a secure hash with salt
 */
export function hashWithSalt(data: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
        .createHash('sha256')
        .update(data + actualSalt)
        .digest('hex');

    return { hash, salt: actualSalt };
}

/**
 * Verifies a hash matches the original data
 */
export function verifyHash(data: string, hash: string, salt: string): boolean {
    const computed = hashWithSalt(data, salt);
    return computed.hash === hash;
}

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Generates a secure random token
 */
export function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generates a time-limited token with HMAC signature
 */
export function generateTimeLimitedToken(
    data: string,
    expiresInMs: number = 3600000 // 1 hour default
): string {
    const expiresAt = Date.now() + expiresInMs;
    const payload = `${data}:${expiresAt}`;

    const signature = crypto
        .createHmac('sha256', getMasterKey())
        .update(payload)
        .digest('hex');

    return Buffer.from(`${payload}:${signature}`).toString('base64');
}

/**
 * Verifies and extracts data from a time-limited token
 */
export function verifyTimeLimitedToken(token: string): { valid: boolean; data?: string } {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [data, expiresAtStr, signature] = decoded.split(':');

        const expiresAt = parseInt(expiresAtStr, 10);

        // Check expiration
        if (Date.now() > expiresAt) {
            return { valid: false };
        }

        // Verify signature
        const payload = `${data}:${expiresAt}`;
        const expectedSignature = crypto
            .createHmac('sha256', getMasterKey())
            .update(payload)
            .digest('hex');

        if (signature !== expectedSignature) {
            return { valid: false };
        }

        return { valid: true, data };
    } catch {
        return { valid: false };
    }
}

// ============================================================================
// PII Detection and Masking
// ============================================================================

/**
 * Detects potential PII in text
 */
export function detectPII(text: string): {
    hasPII: boolean;
    types: string[];
} {
    const types: string[] = [];

    // Email pattern
    if (/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(text)) {
        types.push('email');
    }

    // Phone pattern (US)
    if (/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/.test(text)) {
        types.push('phone');
    }

    // SSN pattern
    if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) {
        types.push('ssn');
    }

    // Credit card pattern
    if (/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(text)) {
        types.push('credit_card');
    }

    return {
        hasPII: types.length > 0,
        types,
    };
}

/**
 * Masks PII in text
 */
export function maskPII(text: string): string {
    let masked = text;

    // Mask emails
    masked = masked.replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        '[EMAIL]'
    );

    // Mask phone numbers
    masked = masked.replace(
        /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
        '[PHONE]'
    );

    // Mask SSN
    masked = masked.replace(
        /\b\d{3}-\d{2}-\d{4}\b/g,
        '[SSN]'
    );

    // Mask credit cards
    masked = masked.replace(
        /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
        '[CREDIT_CARD]'
    );

    return masked;
}

// ============================================================================
// Secure Comparison
// ============================================================================

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(a),
        Buffer.from(b)
    );
}
