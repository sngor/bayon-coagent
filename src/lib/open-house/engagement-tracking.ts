/**
 * Engagement Tracking Utilities
 * 
 * Provides utilities for tracking email opens and link clicks in follow-up emails.
 * Validates Requirements: 13.5, 15.5
 */

/**
 * Generates a tracking pixel URL for email open tracking
 * The pixel is a 1x1 transparent GIF that records when the email is opened
 */
export function generateTrackingPixelUrl(
    sessionId: string,
    visitorId: string,
    baseUrl: string
): string {
    return `${baseUrl}/api/open-house/track/open?sessionId=${sessionId}&visitorId=${visitorId}`;
}

/**
 * Generates a tracked link URL that records clicks before redirecting
 * @param originalUrl - The destination URL
 * @param sessionId - The session ID
 * @param visitorId - The visitor ID
 * @param baseUrl - The base URL of the application
 * @returns Tracked URL that will record the click
 */
export function generateTrackedLinkUrl(
    originalUrl: string,
    sessionId: string,
    visitorId: string,
    baseUrl: string
): string {
    const encodedUrl = encodeURIComponent(originalUrl);
    return `${baseUrl}/api/open-house/track/click?sessionId=${sessionId}&visitorId=${visitorId}&url=${encodedUrl}`;
}

/**
 * Wraps all links in an HTML email body with tracking URLs
 * @param htmlBody - The HTML email body
 * @param sessionId - The session ID
 * @param visitorId - The visitor ID
 * @param baseUrl - The base URL of the application
 * @returns HTML body with tracked links
 */
export function wrapLinksWithTracking(
    htmlBody: string,
    sessionId: string,
    visitorId: string,
    baseUrl: string
): string {
    // Match all href attributes in anchor tags
    const hrefRegex = /href=["']([^"']+)["']/gi;

    return htmlBody.replace(hrefRegex, (match, url) => {
        // Skip if it's already a tracking URL or a mailto/tel link
        if (url.includes('/api/open-house/track/') ||
            url.startsWith('mailto:') ||
            url.startsWith('tel:') ||
            url.startsWith('#')) {
            return match;
        }

        const trackedUrl = generateTrackedLinkUrl(url, sessionId, visitorId, baseUrl);
        return `href="${trackedUrl}"`;
    });
}

/**
 * Adds a tracking pixel to an HTML email body
 * The pixel is placed at the end of the body
 * @param htmlBody - The HTML email body
 * @param sessionId - The session ID
 * @param visitorId - The visitor ID
 * @param baseUrl - The base URL of the application
 * @returns HTML body with tracking pixel
 */
export function addTrackingPixel(
    htmlBody: string,
    sessionId: string,
    visitorId: string,
    baseUrl: string
): string {
    const pixelUrl = generateTrackingPixelUrl(sessionId, visitorId, baseUrl);
    const trackingPixel = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;

    // Try to insert before closing body tag, otherwise append
    if (htmlBody.includes('</body>')) {
        return htmlBody.replace('</body>', `${trackingPixel}</body>`);
    }

    return htmlBody + trackingPixel;
}

/**
 * Prepares an email body with full engagement tracking
 * Adds tracking pixel and wraps all links with tracking
 * @param htmlBody - The HTML email body
 * @param sessionId - The session ID
 * @param visitorId - The visitor ID
 * @param baseUrl - The base URL of the application
 * @returns Fully tracked HTML body
 */
export function prepareTrackedEmailBody(
    htmlBody: string,
    sessionId: string,
    visitorId: string,
    baseUrl: string
): string {
    // First wrap links with tracking
    let trackedBody = wrapLinksWithTracking(htmlBody, sessionId, visitorId, baseUrl);

    // Then add tracking pixel
    trackedBody = addTrackingPixel(trackedBody, sessionId, visitorId, baseUrl);

    return trackedBody;
}

/**
 * Converts plain text email to HTML with basic formatting
 * This is needed to add tracking to plain text emails
 */
export function convertTextToHtml(textBody: string): string {
    // Escape HTML characters
    const escaped = textBody
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Convert line breaks to <br> tags
    const withBreaks = escaped.replace(/\n/g, '<br>');

    // Wrap in basic HTML structure
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    ${withBreaks}
</body>
</html>`;
}

/**
 * Checks if an email body is HTML
 */
export function isHtmlEmail(body: string): boolean {
    return /<[a-z][\s\S]*>/i.test(body);
}
