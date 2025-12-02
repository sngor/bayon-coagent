/**
 * QR Code Generation Utility
 * 
 * Generates QR codes for open house sessions and uploads them to S3.
 * Validates Requirements: 4.1, 4.4
 */

import QRCode from 'qrcode';
import { uploadFile } from '@/aws/s3/client';

/**
 * QR Code generation options
 */
export interface QRCodeOptions {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    color?: {
        dark?: string;
        light?: string;
    };
}

/**
 * Default QR code options
 */
const DEFAULT_OPTIONS: QRCodeOptions = {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
        dark: '#000000',
        light: '#FFFFFF',
    },
};

/**
 * Generates a QR code for an open house session and uploads it to S3
 * 
 * @param sessionId - The unique session identifier
 * @param userId - The user ID (for S3 key organization)
 * @param options - Optional QR code generation options
 * @returns The S3 URL of the uploaded QR code image
 * 
 * @example
 * const qrCodeUrl = await generateSessionQRCode('session-123', 'user-456');
 * // Returns: https://bucket.s3.region.amazonaws.com/qr-codes/user-456/session-123.png
 */
export async function generateSessionQRCode(
    sessionId: string,
    userId: string,
    options: QRCodeOptions = {}
): Promise<string> {
    // Merge options with defaults
    const qrOptions = { ...DEFAULT_OPTIONS, ...options };

    // Generate the check-in URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkInUrl = `${baseUrl}/open-house/check-in/${sessionId}`;

    try {
        // Generate QR code as data URL
        const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
            width: qrOptions.width,
            margin: qrOptions.margin,
            errorCorrectionLevel: qrOptions.errorCorrectionLevel,
            color: qrOptions.color,
        });

        // Convert data URL to buffer
        // Data URL format: data:image/png;base64,<base64-encoded-data>
        const base64Data = qrCodeDataUrl.split(',')[1];
        const buffer = Buffer.from(base64Data, 'base64');

        // Upload to S3 with organized key structure
        const s3Key = `qr-codes/${userId}/${sessionId}.png`;
        const s3Url = await uploadFile(s3Key, buffer, 'image/png', {
            sessionId,
            userId,
            generatedAt: new Date().toISOString(),
        });

        return s3Url;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw new Error(`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generates a QR code as a data URL (for immediate display without S3 upload)
 * 
 * @param sessionId - The unique session identifier
 * @param options - Optional QR code generation options
 * @returns The QR code as a data URL
 * 
 * @example
 * const dataUrl = await generateQRCodeDataURL('session-123');
 * // Returns: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
 */
export async function generateQRCodeDataURL(
    sessionId: string,
    options: QRCodeOptions = {}
): Promise<string> {
    const qrOptions = { ...DEFAULT_OPTIONS, ...options };
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkInUrl = `${baseUrl}/open-house/check-in/${sessionId}`;

    try {
        const dataUrl = await QRCode.toDataURL(checkInUrl, {
            width: qrOptions.width,
            margin: qrOptions.margin,
            errorCorrectionLevel: qrOptions.errorCorrectionLevel,
            color: qrOptions.color,
        });

        return dataUrl;
    } catch (error) {
        console.error('Failed to generate QR code data URL:', error);
        throw new Error(`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Generates a QR code as a buffer (for server-side processing)
 * 
 * @param sessionId - The unique session identifier
 * @param options - Optional QR code generation options
 * @returns The QR code as a PNG buffer
 * 
 * @example
 * const buffer = await generateQRCodeBuffer('session-123');
 * // Can be used for PDF generation, email attachments, etc.
 */
export async function generateQRCodeBuffer(
    sessionId: string,
    options: QRCodeOptions = {}
): Promise<Buffer> {
    const qrOptions = { ...DEFAULT_OPTIONS, ...options };
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const checkInUrl = `${baseUrl}/open-house/check-in/${sessionId}`;

    try {
        const buffer = await QRCode.toBuffer(checkInUrl, {
            width: qrOptions.width,
            margin: qrOptions.margin,
            errorCorrectionLevel: qrOptions.errorCorrectionLevel,
            color: qrOptions.color,
        });

        return buffer;
    } catch (error) {
        console.error('Failed to generate QR code buffer:', error);
        throw new Error(`QR code generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Validates a QR code URL to ensure it points to a valid session check-in
 * 
 * @param url - The URL to validate
 * @returns The session ID if valid, null otherwise
 * 
 * @example
 * const sessionId = validateQRCodeURL('https://app.com/open-house/check-in/session-123');
 * // Returns: 'session-123'
 */
export function validateQRCodeURL(url: string): string | null {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');

        // Expected format: /open-house/check-in/{sessionId}
        if (pathParts.length >= 4 &&
            pathParts[1] === 'open-house' &&
            pathParts[2] === 'check-in' &&
            pathParts[3]) {
            return pathParts[3];
        }

        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Extracts session ID from a QR code check-in URL path
 * 
 * @param path - The URL path (e.g., '/open-house/check-in/session-123')
 * @returns The session ID if valid, null otherwise
 */
export function extractSessionIdFromPath(path: string): string | null {
    const pathParts = path.split('/');

    // Expected format: /open-house/check-in/{sessionId}
    if (pathParts.length >= 4 &&
        pathParts[1] === 'open-house' &&
        pathParts[2] === 'check-in' &&
        pathParts[3]) {
        return pathParts[3];
    }

    return null;
}
