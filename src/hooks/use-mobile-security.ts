'use client';

import { useState, useCallback } from 'react';
import {
    encryptLocationData,
    decryptLocationData,
    stripExifData,
    stripExifDataBatch,
    storeSecureToken,
    getSecureToken,
    deleteSecureToken,
    rateLimiters,
    withRateLimit,
} from '@/lib/mobile/security';

interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
}

/**
 * Hook for using mobile security features
 */
export function useMobileSecurity() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Encrypts location data
     */
    const encryptLocation = useCallback(async (location: LocationData): Promise<string | null> => {
        setIsProcessing(true);
        setError(null);

        try {
            const encrypted = await encryptLocationData(location);
            return encrypted;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to encrypt location';
            setError(message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Decrypts location data
     */
    const decryptLocation = useCallback(async (encryptedData: string): Promise<LocationData | null> => {
        setIsProcessing(true);
        setError(null);

        try {
            const decrypted = await decryptLocationData(encryptedData);
            return decrypted;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to decrypt location';
            setError(message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Strips EXIF data from a photo
     */
    const stripPhotoExif = useCallback(async (file: File): Promise<File | null> => {
        setIsProcessing(true);
        setError(null);

        try {
            const stripped = await stripExifData(file);
            return stripped;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to strip EXIF data';
            setError(message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Strips EXIF data from multiple photos
     */
    const stripPhotosExif = useCallback(async (files: File[]): Promise<File[] | null> => {
        setIsProcessing(true);
        setError(null);

        try {
            const stripped = await stripExifDataBatch(files);
            return stripped;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to strip EXIF data';
            setError(message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Stores a token securely
     */
    const storeToken = useCallback(async (tokenName: string, token: string): Promise<boolean> => {
        setIsProcessing(true);
        setError(null);

        try {
            await storeSecureToken(tokenName, token);
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to store token';
            setError(message);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Retrieves a token securely
     */
    const retrieveToken = useCallback(async (tokenName: string): Promise<string | null> => {
        setIsProcessing(true);
        setError(null);

        try {
            const token = await getSecureToken(tokenName);
            return token;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to retrieve token';
            setError(message);
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Deletes a token
     */
    const removeToken = useCallback(async (tokenName: string): Promise<boolean> => {
        setIsProcessing(true);
        setError(null);

        try {
            await deleteSecureToken(tokenName);
            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete token';
            setError(message);
            return false;
        } finally {
            setIsProcessing(false);
        }
    }, []);

    /**
     * Executes a function with rate limiting
     */
    const withRateLimitProtection = useCallback(
        async <T>(
            key: string,
            limiterType: 'vision' | 'transcription' | 'share' | 'location' | 'general',
            fn: () => Promise<T>
        ): Promise<T | null> => {
            setIsProcessing(true);
            setError(null);

            try {
                const limiter = rateLimiters[limiterType];
                const result = await withRateLimit(key, limiter, fn);
                return result;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Rate limit exceeded';
                setError(message);
                return null;
            } finally {
                setIsProcessing(false);
            }
        },
        []
    );

    /**
     * Clears the error state
     */
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        // State
        isProcessing,
        error,

        // Location encryption
        encryptLocation,
        decryptLocation,

        // Photo privacy
        stripPhotoExif,
        stripPhotosExif,

        // Token security
        storeToken,
        retrieveToken,
        removeToken,

        // Rate limiting
        withRateLimitProtection,

        // Utilities
        clearError,
    };
}
