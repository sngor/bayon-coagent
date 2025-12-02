/**
 * QR Code Usage Examples
 * 
 * This file demonstrates how to use the QR code generation utilities
 * in the open house session workflow.
 */

import { generateSessionQRCode, generateQRCodeDataURL, validateQRCodeURL } from '@/lib/qr-code';

/**
 * Example 1: Generate QR code during session creation
 * 
 * This is the primary use case - when creating a new session,
 * generate a QR code and store the URL with the session.
 */
export async function createSessionWithQRCode(
    sessionId: string,
    userId: string,
    sessionData: any
) {
    try {
        // Generate QR code and upload to S3
        const qrCodeUrl = await generateSessionQRCode(sessionId, userId);

        // Store session with QR code URL
        const session = {
            ...sessionData,
            sessionId,
            userId,
            qrCodeUrl, // S3 URL of the QR code
            createdAt: new Date().toISOString(),
        };

        // Save to database
        // await repository.create(session);

        return {
            success: true,
            session,
            qrCodeUrl,
        };
    } catch (error) {
        console.error('Failed to create session with QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 2: Generate QR code for preview (without S3 upload)
 * 
 * Useful for showing a preview before the session is finalized.
 */
export async function previewSessionQRCode(sessionId: string) {
    try {
        // Generate QR code as data URL (no S3 upload)
        const dataUrl = await generateQRCodeDataURL(sessionId);

        return {
            success: true,
            dataUrl,
        };
    } catch (error) {
        console.error('Failed to generate QR code preview:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 3: Generate custom-sized QR code for printing
 * 
 * Generate a larger QR code for high-quality printing.
 */
export async function generatePrintableQRCode(
    sessionId: string,
    userId: string
) {
    try {
        // Generate larger QR code for printing (800px)
        const qrCodeUrl = await generateSessionQRCode(sessionId, userId, {
            width: 800,
            margin: 4, // More margin for printing
            errorCorrectionLevel: 'H', // Highest error correction for print
        });

        return {
            success: true,
            qrCodeUrl,
        };
    } catch (error) {
        console.error('Failed to generate printable QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 4: Validate QR code scan
 * 
 * When a user scans a QR code, validate the URL and extract the session ID.
 */
export function handleQRCodeScan(scannedUrl: string) {
    // Validate and extract session ID
    const sessionId = validateQRCodeURL(scannedUrl);

    if (!sessionId) {
        return {
            success: false,
            error: 'Invalid QR code URL',
        };
    }

    // Redirect to check-in page
    return {
        success: true,
        sessionId,
        redirectUrl: `/open-house/check-in/${sessionId}`,
    };
}

/**
 * Example 5: Generate branded QR code
 * 
 * Generate a QR code with custom brand colors.
 */
export async function generateBrandedQRCode(
    sessionId: string,
    userId: string,
    brandColors: { primary: string; secondary: string }
) {
    try {
        // Generate QR code with brand colors
        const qrCodeUrl = await generateSessionQRCode(sessionId, userId, {
            width: 400,
            color: {
                dark: brandColors.primary,
                light: '#FFFFFF',
            },
        });

        return {
            success: true,
            qrCodeUrl,
        };
    } catch (error) {
        console.error('Failed to generate branded QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 6: Batch generate QR codes for multiple sessions
 * 
 * Generate QR codes for multiple sessions at once.
 */
export async function batchGenerateQRCodes(
    sessions: Array<{ sessionId: string; userId: string }>
) {
    const results = await Promise.allSettled(
        sessions.map(({ sessionId, userId }) =>
            generateSessionQRCode(sessionId, userId)
        )
    );

    const successful = results
        .filter((result): result is PromiseFulfilledResult<string> =>
            result.status === 'fulfilled'
        )
        .map((result) => result.value);

    const failed = results
        .filter((result): result is PromiseRejectedResult =>
            result.status === 'rejected'
        )
        .map((result) => result.reason);

    return {
        successful,
        failed,
        total: sessions.length,
        successCount: successful.length,
        failureCount: failed.length,
    };
}

/**
 * Example 7: Regenerate QR code for existing session
 * 
 * If a QR code needs to be regenerated (e.g., after URL change),
 * this function handles it.
 */
export async function regenerateSessionQRCode(
    sessionId: string,
    userId: string
) {
    try {
        // Generate new QR code (will overwrite existing one in S3)
        const qrCodeUrl = await generateSessionQRCode(sessionId, userId);

        // Update session record with new QR code URL
        // await repository.update({
        //   PK: `USER#${userId}`,
        //   SK: `OPENHOUSE#${sessionId}`,
        //   qrCodeUrl,
        //   updatedAt: new Date().toISOString(),
        // });

        return {
            success: true,
            qrCodeUrl,
        };
    } catch (error) {
        console.error('Failed to regenerate QR code:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
