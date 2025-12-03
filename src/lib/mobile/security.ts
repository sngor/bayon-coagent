/**
 * Mobile Security and Privacy Module
 * 
 * Provides security features for mobile agent functionality including:
 * - Location data encryption
 * - Voice recording deletion
 * - EXIF data stripping
 * - Secure token storage
 * - Rate limiting
 */

import { getRepository } from '@/aws/dynamodb/repository';

// ============================================================================
// Location Data Encryption
// ============================================================================

/**
 * Encrypts location data using Web Crypto API
 */
export async function encryptLocationData(
    location: { latitude: number; longitude: number; accuracy?: number }
): Promise<string> {
    const data = JSON.stringify(location);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate encryption key
    const key = await getOrCreateEncryptionKey();

    // Encrypt the data
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts location data
 */
export async function decryptLocationData(
    encryptedData: string
): Promise<{ latitude: number; longitude: number; accuracy?: number }> {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedBuffer = combined.slice(12);

    // Get encryption key
    const key = await getOrCreateEncryptionKey();

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedBuffer
    );

    // Convert back to object
    const decoder = new TextDecoder();
    const data = decoder.decode(decryptedBuffer);
    return JSON.parse(data);
}

/**
 * Gets or creates an encryption key stored in IndexedDB
 */
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
    const keyName = 'mobile-location-encryption-key';

    // Try to get existing key from IndexedDB
    const db = await openSecurityDB();
    const transaction = db.transaction(['keys'], 'readonly');
    const store = transaction.objectStore('keys');
    const request = store.get(keyName);

    return new Promise((resolve, reject) => {
        request.onsuccess = async () => {
            if (request.result) {
                // Import existing key
                const key = await crypto.subtle.importKey(
                    'jwk',
                    request.result.key,
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
                resolve(key);
            } else {
                // Generate new key
                const key = await crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );

                // Export and store key
                const exportedKey = await crypto.subtle.exportKey('jwk', key);
                const writeTransaction = db.transaction(['keys'], 'readwrite');
                const writeStore = writeTransaction.objectStore('keys');
                writeStore.put({ name: keyName, key: exportedKey });

                resolve(key);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Opens the security IndexedDB database
 */
function openSecurityDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('mobile-security', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('keys')) {
                db.createObjectStore('keys', { keyPath: 'name' });
            }
            if (!db.objectStoreNames.contains('tokens')) {
                db.createObjectStore('tokens', { keyPath: 'name' });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// ============================================================================
// Voice Recording Deletion
// ============================================================================

/**
 * Deletes a voice recording from S3 and removes the database record
 */
export async function deleteVoiceRecording(
    userId: string,
    voiceNoteId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const repository = getRepository();

        // Get the voice note to find the S3 URL
        const voiceNote = await repository.getItem<{
            audioUrl: string;
            transcription: string;
        }>({
            PK: `USER#${userId}`,
            SK: `VOICENOTE#${voiceNoteId}`,
        });

        if (!voiceNote) {
            return { success: false, error: 'Voice note not found' };
        }

        // Delete from S3
        if (voiceNote.audioUrl) {
            const response = await fetch('/api/mobile/delete-voice-recording', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audioUrl: voiceNote.audioUrl }),
            });

            if (!response.ok) {
                throw new Error('Failed to delete audio file from S3');
            }
        }

        // Delete from DynamoDB
        await repository.deleteItem({
            PK: `USER#${userId}`,
            SK: `VOICENOTE#${voiceNoteId}`,
        });

        return { success: true };
    } catch (error) {
        console.error('Error deleting voice recording:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Deletes all voice recordings for a user (privacy cleanup)
 */
export async function deleteAllVoiceRecordings(
    userId: string
): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
        const repository = getRepository();

        // Query all voice notes for the user
        const voiceNotes = await repository.queryItems<{ id: string; audioUrl: string }>({
            PK: `USER#${userId}`,
            SKPrefix: 'VOICENOTE#',
        });

        let deletedCount = 0;

        // Delete each voice note
        for (const note of voiceNotes) {
            const result = await deleteVoiceRecording(userId, note.id);
            if (result.success) {
                deletedCount++;
            }
        }

        return { success: true, deletedCount };
    } catch (error) {
        console.error('Error deleting all voice recordings:', error);
        return {
            success: false,
            deletedCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

// ============================================================================
// EXIF Data Stripping
// ============================================================================

/**
 * Strips EXIF data from an image file
 */
export async function stripExifData(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result as ArrayBuffer;
                const blob = new Blob([arrayBuffer], { type: file.type });

                // Create an image element to load the file
                const img = new Image();
                const url = URL.createObjectURL(blob);

                img.onload = () => {
                    // Create a canvas and draw the image
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');

                    if (!ctx) {
                        reject(new Error('Failed to get canvas context'));
                        return;
                    }

                    ctx.drawImage(img, 0, 0);

                    // Convert canvas to blob (this strips EXIF data)
                    canvas.toBlob(
                        (newBlob) => {
                            if (!newBlob) {
                                reject(new Error('Failed to create blob from canvas'));
                                return;
                            }

                            // Create a new File object without EXIF data
                            const strippedFile = new File([newBlob], file.name, {
                                type: file.type,
                                lastModified: Date.now(),
                            });

                            URL.revokeObjectURL(url);
                            resolve(strippedFile);
                        },
                        file.type,
                        0.95 // Quality
                    );
                };

                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load image'));
                };

                img.src = url;
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Strips EXIF data from multiple images
 */
export async function stripExifDataBatch(files: File[]): Promise<File[]> {
    const promises = files.map((file) => stripExifData(file));
    return Promise.all(promises);
}

// ============================================================================
// Secure Token Storage
// ============================================================================

/**
 * Securely stores a token in IndexedDB
 */
export async function storeSecureToken(
    tokenName: string,
    token: string
): Promise<void> {
    const db = await openSecurityDB();
    const transaction = db.transaction(['tokens'], 'readwrite');
    const store = transaction.objectStore('tokens');

    // Encrypt the token before storing
    const encryptedToken = await encryptToken(token);

    return new Promise((resolve, reject) => {
        const request = store.put({
            name: tokenName,
            token: encryptedToken,
            timestamp: Date.now(),
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Retrieves a securely stored token from IndexedDB
 */
export async function getSecureToken(tokenName: string): Promise<string | null> {
    const db = await openSecurityDB();
    const transaction = db.transaction(['tokens'], 'readonly');
    const store = transaction.objectStore('tokens');

    return new Promise((resolve, reject) => {
        const request = store.get(tokenName);

        request.onsuccess = async () => {
            if (request.result) {
                try {
                    const decryptedToken = await decryptToken(request.result.token);
                    resolve(decryptedToken);
                } catch (error) {
                    reject(error);
                }
            } else {
                resolve(null);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Deletes a securely stored token
 */
export async function deleteSecureToken(tokenName: string): Promise<void> {
    const db = await openSecurityDB();
    const transaction = db.transaction(['tokens'], 'readwrite');
    const store = transaction.objectStore('tokens');

    return new Promise((resolve, reject) => {
        const request = store.delete(tokenName);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Encrypts a token using Web Crypto API
 */
async function encryptToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(token);

    const key = await getOrCreateEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
    );

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a token
 */
async function decryptToken(encryptedToken: string): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedToken), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encryptedBuffer = combined.slice(12);

    const key = await getOrCreateEncryptionKey();

    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encryptedBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
}

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Rate limiter for API calls
 */
export class RateLimiter {
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = config;
    }

    /**
     * Checks if a request is allowed under rate limiting rules
     */
    async checkLimit(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
        const now = Date.now();
        const entry = rateLimitStore.get(key);

        // No entry or expired window - allow request
        if (!entry || now >= entry.resetTime) {
            rateLimitStore.set(key, {
                count: 1,
                resetTime: now + this.config.windowMs,
            });
            return { allowed: true };
        }

        // Within window - check count
        if (entry.count < this.config.maxRequests) {
            entry.count++;
            return { allowed: true };
        }

        // Rate limit exceeded
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    /**
     * Resets the rate limit for a key
     */
    reset(key: string): void {
        rateLimitStore.delete(key);
    }

    /**
     * Gets current usage for a key
     */
    getUsage(key: string): { count: number; remaining: number; resetTime: number } | null {
        const entry = rateLimitStore.get(key);
        if (!entry || Date.now() >= entry.resetTime) {
            return null;
        }

        return {
            count: entry.count,
            remaining: this.config.maxRequests - entry.count,
            resetTime: entry.resetTime,
        };
    }
}

/**
 * Pre-configured rate limiters for different API types
 */
export const rateLimiters = {
    // AI vision analysis - 10 requests per minute
    vision: new RateLimiter({ maxRequests: 10, windowMs: 60000 }),

    // Voice transcription - 20 requests per minute
    transcription: new RateLimiter({ maxRequests: 20, windowMs: 60000 }),

    // Quick share - 30 requests per minute
    share: new RateLimiter({ maxRequests: 30, windowMs: 60000 }),

    // Location updates - 60 requests per minute
    location: new RateLimiter({ maxRequests: 60, windowMs: 60000 }),

    // General API - 100 requests per minute
    general: new RateLimiter({ maxRequests: 100, windowMs: 60000 }),
};

/**
 * Middleware function to apply rate limiting to API calls
 */
export async function withRateLimit<T>(
    key: string,
    limiter: RateLimiter,
    fn: () => Promise<T>
): Promise<T> {
    const result = await limiter.checkLimit(key);

    if (!result.allowed) {
        throw new Error(
            `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`
        );
    }

    return fn();
}

// ============================================================================
// Privacy Utilities
// ============================================================================

/**
 * Clears all security-related data (for user privacy)
 */
export async function clearAllSecurityData(): Promise<void> {
    const db = await openSecurityDB();

    // Clear tokens
    const tokenTransaction = db.transaction(['tokens'], 'readwrite');
    const tokenStore = tokenTransaction.objectStore('tokens');
    await new Promise<void>((resolve, reject) => {
        const request = tokenStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    // Clear encryption keys
    const keyTransaction = db.transaction(['keys'], 'readwrite');
    const keyStore = keyTransaction.objectStore('keys');
    await new Promise<void>((resolve, reject) => {
        const request = keyStore.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });

    // Clear rate limit store
    rateLimitStore.clear();
}

/**
 * Gets security status information
 */
export async function getSecurityStatus(): Promise<{
    hasEncryptionKey: boolean;
    tokenCount: number;
    rateLimitUsage: Record<string, { count: number; remaining: number } | null>;
}> {
    const db = await openSecurityDB();

    // Check for encryption key
    const keyTransaction = db.transaction(['keys'], 'readonly');
    const keyStore = keyTransaction.objectStore('keys');
    const hasEncryptionKey = await new Promise<boolean>((resolve) => {
        const request = keyStore.get('mobile-location-encryption-key');
        request.onsuccess = () => resolve(!!request.result);
        request.onerror = () => resolve(false);
    });

    // Count tokens
    const tokenTransaction = db.transaction(['tokens'], 'readonly');
    const tokenStore = tokenTransaction.objectStore('tokens');
    const tokenCount = await new Promise<number>((resolve) => {
        const request = tokenStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
    });

    // Get rate limit usage
    const rateLimitUsage: Record<string, { count: number; remaining: number } | null> = {
        vision: rateLimiters.vision.getUsage('default'),
        transcription: rateLimiters.transcription.getUsage('default'),
        share: rateLimiters.share.getUsage('default'),
        location: rateLimiters.location.getUsage('default'),
        general: rateLimiters.general.getUsage('default'),
    };

    return {
        hasEncryptionKey,
        tokenCount,
        rateLimitUsage,
    };
}
