/**
 * Unit tests for website crawler functionality
 * 
 * Tests the core crawling functions:
 * - fetchPage with timeout handling
 * - extractInternalLinks
 * - crawlWebsite
 * - isValidCrawlUrl
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
    fetchPage,
    extractInternalLinks,
    crawlWebsite,
    isValidCrawlUrl,
} from '@/lib/website-crawler';

// Mock fetch for testing
global.fetch = jest.fn() as jest.Mock;

describe('Website Crawler', () => {
    beforeEach(async () => {
        jest.clearAllMocks();

        // Clear cache between tests
        try {
            const { getCrawlCache } = await import('../lib/website-analysis-cache');
            const cache = getCrawlCache();
            cache.clear();
        } catch (error) {
            // Cache module not available, skip
        }
    });

    describe('isValidCrawlUrl', () => {
        it('should accept valid http URLs', () => {
            expect(isValidCrawlUrl('http://example.com')).toBe(true);
        });

        it('should accept valid https URLs', () => {
            expect(isValidCrawlUrl('https://example.com')).toBe(true);
        });

        it('should reject localhost', () => {
            expect(isValidCrawlUrl('http://localhost:3000')).toBe(false);
        });

        it('should reject 127.0.0.1', () => {
            expect(isValidCrawlUrl('http://127.0.0.1')).toBe(false);
        });

        it('should reject private IP ranges', () => {
            expect(isValidCrawlUrl('http://192.168.1.1')).toBe(false);
            expect(isValidCrawlUrl('http://10.0.0.1')).toBe(false);
            expect(isValidCrawlUrl('http://172.16.0.1')).toBe(false);
        });

        it('should reject non-http protocols', () => {
            expect(isValidCrawlUrl('ftp://example.com')).toBe(false);
            expect(isValidCrawlUrl('file:///path/to/file')).toBe(false);
        });

        it('should reject invalid URLs', () => {
            expect(isValidCrawlUrl('not-a-url')).toBe(false);
            expect(isValidCrawlUrl('')).toBe(false);
        });
    });

    describe('extractInternalLinks', () => {
        it('should extract internal links from HTML', () => {
            const html = `
                <html>
                    <body>
                        <a href="/about">About</a>
                        <a href="/contact">Contact</a>
                        <a href="https://example.com/services">Services</a>
                    </body>
                </html>
            `;
            const baseUrl = 'https://example.com';
            const links = extractInternalLinks(html, baseUrl);

            expect(links).toContain('https://example.com/about');
            expect(links).toContain('https://example.com/contact');
            expect(links).toContain('https://example.com/services');
        });

        it('should exclude external links', () => {
            const html = `
                <html>
                    <body>
                        <a href="/about">About</a>
                        <a href="https://external.com/page">External</a>
                    </body>
                </html>
            `;
            const baseUrl = 'https://example.com';
            const links = extractInternalLinks(html, baseUrl);

            expect(links).toContain('https://example.com/about');
            expect(links).not.toContain('https://external.com/page');
        });

        it('should exclude anchors, mailto, tel, and javascript links', () => {
            const html = `
                <html>
                    <body>
                        <a href="#section">Section</a>
                        <a href="mailto:test@example.com">Email</a>
                        <a href="tel:1234567890">Phone</a>
                        <a href="javascript:void(0)">JS</a>
                        <a href="/valid">Valid</a>
                    </body>
                </html>
            `;
            const baseUrl = 'https://example.com';
            const links = extractInternalLinks(html, baseUrl);

            expect(links).toHaveLength(1);
            expect(links).toContain('https://example.com/valid');
        });

        it('should avoid duplicate links', () => {
            const html = `
                <html>
                    <body>
                        <a href="/about">About 1</a>
                        <a href="/about">About 2</a>
                        <a href="/about">About 3</a>
                    </body>
                </html>
            `;
            const baseUrl = 'https://example.com';
            const links = extractInternalLinks(html, baseUrl);

            expect(links).toHaveLength(1);
            expect(links).toContain('https://example.com/about');
        });

        it('should exclude the base URL itself', () => {
            const html = `
                <html>
                    <body>
                        <a href="/">Home</a>
                        <a href="/about">About</a>
                    </body>
                </html>
            `;
            const baseUrl = 'https://example.com/';
            const links = extractInternalLinks(html, baseUrl);

            expect(links).not.toContain('https://example.com/');
            expect(links).toContain('https://example.com/about');
        });
    });

    describe('fetchPage', () => {
        it('should fetch HTML content successfully', async () => {
            const mockHtml = '<html><body>Test</body></html>';
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: {
                    get: () => 'text/html',
                },
                text: async () => mockHtml,
            });

            const result = await fetchPage('https://example.com');
            expect(result).toBe(mockHtml);
        });

        it('should throw error for non-OK responses', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found',
            });

            await expect(fetchPage('https://example.com')).rejects.toThrow(
                'Page not found (404). Please verify the URL is correct.'
            );
        });

        it('should throw error for non-HTML content', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                headers: {
                    get: () => 'application/json',
                },
            });

            await expect(fetchPage('https://example.com')).rejects.toThrow(
                'Invalid content type: application/json'
            );
        });

        it('should handle timeout errors', async () => {
            (global.fetch as jest.Mock).mockImplementationOnce(() => {
                return new Promise((_, reject) => {
                    setTimeout(() => {
                        const error = new Error('Aborted');
                        error.name = 'AbortError';
                        reject(error);
                    }, 10);
                });
            });

            await expect(fetchPage('https://example.com', 50)).rejects.toThrow(
                'Request timeout'
            );
        }, 10000);
    });

    describe('crawlWebsite', () => {
        it('should crawl homepage and additional pages', async () => {
            const homepageHtml = `
                <html>
                    <body>
                        <a href="/about">About</a>
                        <a href="/contact">Contact</a>
                    </body>
                </html>
            `;
            const aboutHtml = '<html><body>About page</body></html>';
            const contactHtml = '<html><body>Contact page</body></html>';

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    headers: { get: () => 'text/html' },
                    text: async () => homepageHtml,
                })
                .mockResolvedValueOnce({
                    ok: true,
                    headers: { get: () => 'text/html' },
                    text: async () => aboutHtml,
                })
                .mockResolvedValueOnce({
                    ok: true,
                    headers: { get: () => 'text/html' },
                    text: async () => contactHtml,
                });

            const result = await crawlWebsite('https://example.com');

            expect(result.homepage).toBe(homepageHtml);
            expect(result.additionalPages).toHaveLength(2);
            expect(result.crawledUrls).toHaveLength(3);
            expect(result.crawledUrls).toContain('https://example.com');
            expect(result.crawledUrls).toContain('https://example.com/about');
            expect(result.crawledUrls).toContain('https://example.com/contact');
        });

        it('should continue crawling if additional pages fail', async () => {
            const homepageHtml = `
                <html>
                    <body>
                        <a href="/about">About</a>
                        <a href="/contact">Contact</a>
                    </body>
                </html>
            `;
            const aboutHtml = '<html><body>About page</body></html>';

            (global.fetch as jest.Mock)
                .mockResolvedValueOnce({
                    ok: true,
                    headers: { get: () => 'text/html' },
                    text: async () => homepageHtml,
                })
                .mockResolvedValueOnce({
                    ok: true,
                    headers: { get: () => 'text/html' },
                    text: async () => aboutHtml,
                })
                .mockRejectedValueOnce(new Error('Network error'));

            const result = await crawlWebsite('https://example.com');

            expect(result.homepage).toBe(homepageHtml);
            expect(result.additionalPages).toHaveLength(1);
            expect(result.crawledUrls).toHaveLength(2);
        });

        it('should throw error if homepage fetch fails', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(
                new Error('Network error')
            );

            await expect(crawlWebsite('https://example.com')).rejects.toThrow();
        });

        it('should limit additional pages to maxAdditionalPages', async () => {
            const homepageHtml = `
                <html>
                    <body>
                        ${Array.from({ length: 20 }, (_, i) => `<a href="/page${i}">Page ${i}</a>`).join('\n')}
                    </body>
                </html>
            `;

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                headers: { get: () => 'text/html' },
                text: async () => '<html><body>Page</body></html>',
            });

            const result = await crawlWebsite('https://example.com', {
                maxAdditionalPages: 5,
            });

            // Should fetch homepage + 5 additional pages
            expect(result.crawledUrls.length).toBeLessThanOrEqual(6);
        });
    });
});
