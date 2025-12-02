/**
 * Engagement Tracking Tests
 * 
 * Tests for email open and link click tracking utilities.
 * Validates Requirements: 13.5, 15.5
 */

import {
    generateTrackingPixelUrl,
    generateTrackedLinkUrl,
    wrapLinksWithTracking,
    addTrackingPixel,
    prepareTrackedEmailBody,
    convertTextToHtml,
    isHtmlEmail,
} from '@/lib/open-house/engagement-tracking';

describe('Engagement Tracking Utilities', () => {
    const baseUrl = 'https://app.example.com';
    const sessionId = 'session-123';
    const visitorId = 'visitor-456';

    describe('generateTrackingPixelUrl', () => {
        it('should generate correct tracking pixel URL', () => {
            const url = generateTrackingPixelUrl(sessionId, visitorId, baseUrl);

            expect(url).toBe(
                `${baseUrl}/api/open-house/track/open?sessionId=${sessionId}&visitorId=${visitorId}`
            );
        });
    });

    describe('generateTrackedLinkUrl', () => {
        it('should generate correct tracked link URL', () => {
            const originalUrl = 'https://example.com/property';
            const trackedUrl = generateTrackedLinkUrl(
                originalUrl,
                sessionId,
                visitorId,
                baseUrl
            );

            expect(trackedUrl).toContain('/api/open-house/track/click');
            expect(trackedUrl).toContain(`sessionId=${sessionId}`);
            expect(trackedUrl).toContain(`visitorId=${visitorId}`);
            expect(trackedUrl).toContain(encodeURIComponent(originalUrl));
        });
    });

    describe('wrapLinksWithTracking', () => {
        it('should wrap all links with tracking URLs', () => {
            const html = `
                <p>Check out <a href="https://example.com">this property</a></p>
                <p>Or visit <a href="https://another.com">this one</a></p>
            `;

            const tracked = wrapLinksWithTracking(html, sessionId, visitorId, baseUrl);

            expect(tracked).toContain('/api/open-house/track/click');
            expect(tracked).not.toContain('href="https://example.com"');
            expect(tracked).not.toContain('href="https://another.com"');
        });

        it('should not wrap mailto links', () => {
            const html = '<a href="mailto:test@example.com">Email me</a>';
            const tracked = wrapLinksWithTracking(html, sessionId, visitorId, baseUrl);

            expect(tracked).toContain('mailto:test@example.com');
            expect(tracked).not.toContain('/api/open-house/track/click');
        });

        it('should not wrap tel links', () => {
            const html = '<a href="tel:+1234567890">Call me</a>';
            const tracked = wrapLinksWithTracking(html, sessionId, visitorId, baseUrl);

            expect(tracked).toContain('tel:+1234567890');
            expect(tracked).not.toContain('/api/open-house/track/click');
        });

        it('should not wrap anchor links', () => {
            const html = '<a href="#section">Jump to section</a>';
            const tracked = wrapLinksWithTracking(html, sessionId, visitorId, baseUrl);

            expect(tracked).toContain('href="#section"');
            expect(tracked).not.toContain('/api/open-house/track/click');
        });

        it('should not double-wrap already tracked links', () => {
            const html = `<a href="${baseUrl}/api/open-house/track/click?url=test">Link</a>`;
            const tracked = wrapLinksWithTracking(html, sessionId, visitorId, baseUrl);

            // Should still contain the original tracking URL
            expect(tracked).toContain('/api/open-house/track/click');
            // Should not have nested tracking URLs
            expect((tracked.match(/\/api\/open-house\/track\/click/g) || []).length).toBe(1);
        });
    });

    describe('addTrackingPixel', () => {
        it('should add tracking pixel before closing body tag', () => {
            const html = '<html><body><p>Content</p></body></html>';
            const tracked = addTrackingPixel(html, sessionId, visitorId, baseUrl);

            expect(tracked).toContain('<img src=');
            expect(tracked).toContain('/api/open-house/track/open');
            expect(tracked).toContain('width="1" height="1"');
            expect(tracked).toContain('style="display:none;"');
            expect(tracked.indexOf('</body>')).toBeGreaterThan(tracked.indexOf('<img src='));
        });

        it('should append tracking pixel if no body tag', () => {
            const html = '<p>Simple content</p>';
            const tracked = addTrackingPixel(html, sessionId, visitorId, baseUrl);

            expect(tracked).toContain('<img src=');
            expect(tracked).toContain('/api/open-house/track/open');
            expect(tracked.endsWith('/>') || tracked.endsWith('</p>')).toBe(true);
        });
    });

    describe('prepareTrackedEmailBody', () => {
        it('should add both tracking pixel and wrap links', () => {
            const html = `
                <html>
                <body>
                    <p>Hello! <a href="https://example.com">Click here</a></p>
                </body>
                </html>
            `;

            const tracked = prepareTrackedEmailBody(html, sessionId, visitorId, baseUrl);

            // Should have tracking pixel
            expect(tracked).toContain('/api/open-house/track/open');
            expect(tracked).toContain('width="1" height="1"');

            // Should have tracked links
            expect(tracked).toContain('/api/open-house/track/click');
            expect(tracked).not.toContain('href="https://example.com"');
        });
    });

    describe('convertTextToHtml', () => {
        it('should convert plain text to HTML', () => {
            const text = 'Hello\nWorld';
            const html = convertTextToHtml(text);

            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('<html>');
            expect(html).toContain('<body');
            expect(html).toContain('Hello<br>World');
        });

        it('should escape HTML characters', () => {
            const text = '<script>alert("xss")</script>';
            const html = convertTextToHtml(text);

            expect(html).not.toContain('<script>');
            expect(html).toContain('&lt;script&gt;');
        });

        it('should handle ampersands', () => {
            const text = 'Tom & Jerry';
            const html = convertTextToHtml(text);

            expect(html).toContain('Tom &amp; Jerry');
        });
    });

    describe('isHtmlEmail', () => {
        it('should detect HTML emails', () => {
            expect(isHtmlEmail('<html><body>Test</body></html>')).toBe(true);
            expect(isHtmlEmail('<p>Test</p>')).toBe(true);
            expect(isHtmlEmail('<div>Test</div>')).toBe(true);
        });

        it('should detect plain text emails', () => {
            expect(isHtmlEmail('Plain text email')).toBe(false);
            expect(isHtmlEmail('No HTML here')).toBe(false);
        });

        it('should handle edge cases', () => {
            expect(isHtmlEmail('')).toBe(false);
            expect(isHtmlEmail('< not html')).toBe(false);
            expect(isHtmlEmail('html> not html')).toBe(false);
        });
    });

    describe('Integration: Full email tracking', () => {
        it('should prepare a complete tracked email', () => {
            const originalEmail = `
                <html>
                <head><title>Follow-up</title></head>
                <body>
                    <h1>Thank you for visiting!</h1>
                    <p>We hope you enjoyed the open house.</p>
                    <p>
                        <a href="https://example.com/property">View property details</a>
                    </p>
                    <p>
                        <a href="https://example.com/schedule">Schedule a showing</a>
                    </p>
                    <p>
                        Questions? <a href="mailto:agent@example.com">Email us</a>
                    </p>
                </body>
                </html>
            `;

            const tracked = prepareTrackedEmailBody(
                originalEmail,
                sessionId,
                visitorId,
                baseUrl
            );

            // Should have tracking pixel
            expect(tracked).toContain('/api/open-house/track/open');

            // Should have 2 tracked links (not the mailto)
            const trackClickMatches = tracked.match(/\/api\/open-house\/track\/click/g);
            expect(trackClickMatches).toHaveLength(2);

            // Should preserve mailto link
            expect(tracked).toContain('mailto:agent@example.com');

            // Should not have original URLs
            expect(tracked).not.toContain('href="https://example.com/property"');
            expect(tracked).not.toContain('href="https://example.com/schedule"');
        });
    });
});
