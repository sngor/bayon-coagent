/**
 * QR Code Generation Tests
 * 
 * Tests for QR code generation utility functions.
 * Validates Requirements: 4.1, 4.4
 */

import {
    generateQRCodeDataURL,
    generateQRCodeBuffer,
    validateQRCodeURL,
    extractSessionIdFromPath,
} from '@/lib/qr-code';

describe('QR Code Generation', () => {
    const testSessionId = 'test-session-123';

    describe('generateQRCodeDataURL', () => {
        it('should generate a valid data URL', async () => {
            const dataUrl = await generateQRCodeDataURL(testSessionId);

            expect(dataUrl).toBeDefined();
            expect(dataUrl).toMatch(/^data:image\/png;base64,/);
            expect(dataUrl.length).toBeGreaterThan(100);
        });

        it('should generate different QR codes for different session IDs', async () => {
            const dataUrl1 = await generateQRCodeDataURL('session-1');
            const dataUrl2 = await generateQRCodeDataURL('session-2');

            expect(dataUrl1).not.toBe(dataUrl2);
        });

        it('should respect custom width option', async () => {
            const smallQR = await generateQRCodeDataURL(testSessionId, { width: 200 });
            const largeQR = await generateQRCodeDataURL(testSessionId, { width: 800 });

            // Larger QR codes should have more data
            expect(largeQR.length).toBeGreaterThan(smallQR.length);
        });
    });

    describe('generateQRCodeBuffer', () => {
        it('should generate a valid PNG buffer', async () => {
            const buffer = await generateQRCodeBuffer(testSessionId);

            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);

            // Check PNG signature (first 8 bytes)
            expect(buffer[0]).toBe(0x89);
            expect(buffer[1]).toBe(0x50); // 'P'
            expect(buffer[2]).toBe(0x4E); // 'N'
            expect(buffer[3]).toBe(0x47); // 'G'
        });

        it('should generate consistent buffers for the same session ID', async () => {
            const buffer1 = await generateQRCodeBuffer(testSessionId);
            const buffer2 = await generateQRCodeBuffer(testSessionId);

            expect(buffer1.equals(buffer2)).toBe(true);
        });
    });

    describe('validateQRCodeURL', () => {
        it('should validate correct QR code URLs', () => {
            const validUrls = [
                'https://app.example.com/open-house/check-in/session-123',
                'http://localhost:3000/open-house/check-in/abc-def-ghi',
                'https://bayon.app/open-house/check-in/test-session',
            ];

            validUrls.forEach(url => {
                const sessionId = validateQRCodeURL(url);
                expect(sessionId).toBeTruthy();
                expect(typeof sessionId).toBe('string');
            });
        });

        it('should extract correct session IDs from valid URLs', () => {
            const testCases = [
                { url: 'https://app.com/open-house/check-in/session-123', expected: 'session-123' },
                { url: 'http://localhost:3000/open-house/check-in/abc-def', expected: 'abc-def' },
                { url: 'https://example.com/open-house/check-in/test', expected: 'test' },
            ];

            testCases.forEach(({ url, expected }) => {
                const sessionId = validateQRCodeURL(url);
                expect(sessionId).toBe(expected);
            });
        });

        it('should reject invalid URLs', () => {
            const invalidUrls = [
                'https://app.com/wrong-path/check-in/session-123',
                'https://app.com/open-house/wrong/session-123',
                'https://app.com/open-house/check-in/',
                'https://app.com/open-house/check-in',
                'not-a-url',
                '',
            ];

            invalidUrls.forEach(url => {
                const sessionId = validateQRCodeURL(url);
                expect(sessionId).toBeNull();
            });
        });
    });

    describe('extractSessionIdFromPath', () => {
        it('should extract session ID from valid paths', () => {
            const testCases = [
                { path: '/open-house/check-in/session-123', expected: 'session-123' },
                { path: '/open-house/check-in/abc-def-ghi', expected: 'abc-def-ghi' },
                { path: '/open-house/check-in/test', expected: 'test' },
            ];

            testCases.forEach(({ path, expected }) => {
                const sessionId = extractSessionIdFromPath(path);
                expect(sessionId).toBe(expected);
            });
        });

        it('should return null for invalid paths', () => {
            const invalidPaths = [
                '/wrong-path/check-in/session-123',
                '/open-house/wrong/session-123',
                '/open-house/check-in/',
                '/open-house/check-in',
                '',
                '/open-house',
            ];

            invalidPaths.forEach(path => {
                const sessionId = extractSessionIdFromPath(path);
                expect(sessionId).toBeNull();
            });
        });
    });
});
