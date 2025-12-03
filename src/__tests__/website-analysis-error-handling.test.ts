/**
 * @jest-environment node
 */

import { crawlWebsite, isValidCrawlUrl } from '@/lib/website-crawler';

describe('Website Analysis Error Handling', () => {
    describe('URL Validation', () => {
        it('should reject localhost URLs', () => {
            expect(isValidCrawlUrl('http://localhost:3000')).toBe(false);
            expect(isValidCrawlUrl('http://127.0.0.1')).toBe(false);
        });

        it('should reject private IP addresses', () => {
            expect(isValidCrawlUrl('http://192.168.1.1')).toBe(false);
            expect(isValidCrawlUrl('http://10.0.0.1')).toBe(false);
            expect(isValidCrawlUrl('http://172.16.0.1')).toBe(false);
        });

        it('should reject non-http protocols', () => {
            expect(isValidCrawlUrl('ftp://example.com')).toBe(false);
            expect(isValidCrawlUrl('file:///path/to/file')).toBe(false);
        });

        it('should accept valid public URLs', () => {
            expect(isValidCrawlUrl('http://example.com')).toBe(true);
            expect(isValidCrawlUrl('https://example.com')).toBe(true);
            expect(isValidCrawlUrl('https://www.example.com')).toBe(true);
        });
    });

    describe('Fetch Error Handling', () => {
        it('should throw user-friendly error for invalid URL', async () => {
            await expect(crawlWebsite('http://invalid-url-that-does-not-exist-12345.com'))
                .rejects
                .toThrow(/Website not found|Failed to fetch/);
        }, 10000); // Increase timeout for network request

        it('should throw error for invalid URL format', async () => {
            await expect(crawlWebsite('not-a-url'))
                .rejects
                .toThrow(/Invalid website URL/);
        });

        it('should throw error for private IP', async () => {
            await expect(crawlWebsite('http://localhost:3000'))
                .rejects
                .toThrow(/Invalid website URL/);
        });
    });
});
