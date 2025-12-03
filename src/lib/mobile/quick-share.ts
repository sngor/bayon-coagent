/**
 * Quick Share Service
 * 
 * Provides functionality for sharing property information via QR codes,
 * SMS, email, and social media. Includes engagement tracking.
 */

import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';

export interface ShareOptions {
    propertyId: string;
    method: 'qr' | 'sms' | 'email' | 'social';
    recipient?: string;
    customMessage?: string;
    propertyData?: {
        address?: string;
        price?: string;
        beds?: number;
        baths?: number;
        sqft?: number;
        description?: string;
        imageUrl?: string;
    };
}

export interface ShareResult {
    success: boolean;
    shareId: string;
    trackingUrl: string;
    qrCodeDataUrl?: string;
    error?: string;
}

export interface EngagementMetrics {
    shareId: string;
    views: number;
    clicks: number;
    lastViewed?: number;
    createdAt: string;
}

/**
 * Generates a shareable QR code for a property
 * @param propertyId Property ID
 * @param userId User ID for tracking
 * @param options QR code generation options
 * @returns Data URL of the generated QR code
 */
export async function generatePropertyQR(
    propertyId: string,
    userId: string,
    options: {
        width?: number;
        margin?: number;
        color?: {
            dark?: string;
            light?: string;
        };
    } = {}
): Promise<string> {
    const shareId = uuidv4();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
    const shareUrl = `${baseUrl}/share/${shareId}?property=${propertyId}&user=${userId}`;

    try {
        const qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
            width: options.width || 400,
            margin: options.margin || 2,
            color: {
                dark: options.color?.dark || '#000000',
                light: options.color?.light || '#FFFFFF',
            },
            errorCorrectionLevel: 'M',
        });

        return qrCodeDataUrl;
    } catch (error) {
        console.error('Failed to generate QR code:', error);
        throw new Error('Failed to generate QR code');
    }
}

/**
 * Formats property information for SMS sharing
 * @param propertyData Property information
 * @param trackingUrl Tracking URL for engagement metrics
 * @returns Formatted SMS message
 */
export function formatSMSMessage(
    propertyData: ShareOptions['propertyData'],
    trackingUrl: string
): string {
    const parts: string[] = [];

    if (propertyData?.address) {
        parts.push(`🏡 ${propertyData.address}`);
    }

    const details: string[] = [];
    if (propertyData?.price) {
        details.push(`$${propertyData.price}`);
    }
    if (propertyData?.beds) {
        details.push(`${propertyData.beds} bed`);
    }
    if (propertyData?.baths) {
        details.push(`${propertyData.baths} bath`);
    }
    if (propertyData?.sqft) {
        details.push(`${propertyData.sqft.toLocaleString()} sqft`);
    }

    if (details.length > 0) {
        parts.push(details.join(' • '));
    }

    if (propertyData?.description) {
        const shortDescription = propertyData.description.length > 100
            ? propertyData.description.substring(0, 97) + '...'
            : propertyData.description;
        parts.push(`\n${shortDescription}`);
    }

    parts.push(`\nView details: ${trackingUrl}`);

    return parts.join('\n');
}

/**
 * Formats property information for email sharing
 * @param propertyData Property information
 * @param trackingUrl Tracking URL for engagement metrics
 * @param agentName Agent name for personalization
 * @returns Email subject and body
 */
export function formatEmailMessage(
    propertyData: ShareOptions['propertyData'],
    trackingUrl: string,
    agentName?: string
): { subject: string; body: string } {
    const subject = propertyData?.address
        ? `Property: ${propertyData.address}`
        : 'Property Information';

    const bodyParts: string[] = [];

    if (agentName) {
        bodyParts.push(`Hi,\n\nI wanted to share this property with you:\n`);
    } else {
        bodyParts.push(`Check out this property:\n`);
    }

    if (propertyData?.address) {
        bodyParts.push(`📍 ${propertyData.address}\n`);
    }

    const details: string[] = [];
    if (propertyData?.price) {
        details.push(`💰 Price: $${propertyData.price}`);
    }
    if (propertyData?.beds) {
        details.push(`🛏️ Bedrooms: ${propertyData.beds}`);
    }
    if (propertyData?.baths) {
        details.push(`🚿 Bathrooms: ${propertyData.baths}`);
    }
    if (propertyData?.sqft) {
        details.push(`📐 Square Feet: ${propertyData.sqft.toLocaleString()}`);
    }

    if (details.length > 0) {
        bodyParts.push(details.join('\n'));
    }

    if (propertyData?.description) {
        bodyParts.push(`\n${propertyData.description}`);
    }

    bodyParts.push(`\n🔗 View full details: ${trackingUrl}`);

    if (agentName) {
        bodyParts.push(`\n\nBest regards,\n${agentName}`);
    }

    return {
        subject,
        body: bodyParts.join('\n'),
    };
}

/**
 * Shares a property using the Web Share API
 * @param options Share options
 * @returns Promise that resolves when sharing is complete
 */
export async function shareViaWebAPI(options: {
    title: string;
    text: string;
    url: string;
}): Promise<boolean> {
    if (!navigator.share) {
        console.warn('Web Share API not supported');
        return false;
    }

    try {
        await navigator.share({
            title: options.title,
            text: options.text,
            url: options.url,
        });
        return true;
    } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name === 'AbortError') {
            console.log('Share cancelled by user');
        } else {
            console.error('Share failed:', error);
        }
        return false;
    }
}

/**
 * Checks if the Web Share API is available
 * @returns True if Web Share API is supported
 */
export function isWebShareSupported(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Generates a tracking URL for engagement metrics
 * @param shareId Share ID
 * @param propertyId Property ID
 * @returns Tracking URL
 */
export function generateTrackingUrl(shareId: string, propertyId: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bayoncoagent.com';
    return `${baseUrl}/share/${shareId}?property=${propertyId}`;
}

/**
 * Creates a share record for tracking
 * @param userId User ID
 * @param propertyId Property ID
 * @param method Share method
 * @param recipient Optional recipient information
 * @returns Share record data
 */
export function createShareRecord(
    userId: string,
    propertyId: string,
    method: ShareOptions['method'],
    recipient?: string
) {
    const shareId = uuidv4();
    const trackingUrl = generateTrackingUrl(shareId, propertyId);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

    return {
        id: shareId,
        userId,
        propertyId,
        method,
        recipient,
        trackingUrl,
        views: 0,
        clicks: 0,
        createdAt: now,
        expiresAt,
    };
}
