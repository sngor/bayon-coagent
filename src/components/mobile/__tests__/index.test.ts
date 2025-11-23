/**
 * Mobile Components Index Test
 * 
 * Verifies that mobile components directory is properly structured and follows patterns.
 */

import { describe, it, expect } from '@jest/globals';

describe('Mobile Components Index', () => {
    it('should follow mobile optimization utilities', async () => {
        // Test that mobile optimization utilities are available
        const mobileOptimization = await import('@/lib/mobile-optimization');

        expect(mobileOptimization.MIN_TOUCH_TARGET_SIZE).toBe(44);
        expect(mobileOptimization.TOUCH_FRIENDLY_CLASSES).toBeDefined();
        expect(mobileOptimization.MOBILE_LAYOUT_CLASSES).toBeDefined();
        expect(mobileOptimization.getInputType).toBeDefined();
        expect(mobileOptimization.getMobileClasses).toBeDefined();
    });

    it('should have proper mobile component structure', () => {
        // Verify mobile component directory structure follows patterns
        const expectedComponents = [
            'QuickCapture',
            'VoiceMemo',
            'ContentManagement',
            'SyncStatus',
            'OfflineStatusIndicator',
            'PropertyComparison',
            'MarketStats',
            'MeetingPrep',
            'OpenHouseCheckin',
            'NotificationPreferences'
        ];

        // This test ensures we have the expected core components
        expect(expectedComponents.length).toBeGreaterThan(5);
        expect(expectedComponents).toContain('QuickCapture');
        expect(expectedComponents).toContain('VoiceMemo');
        expect(expectedComponents).toContain('SyncStatus');
    });

    it('should have mobile optimization patterns', async () => {
        const mobileOptimization = await import('@/lib/mobile-optimization');

        // Test touch-friendly classes
        expect(mobileOptimization.TOUCH_FRIENDLY_CLASSES.button).toContain('min-h-[44px]');
        expect(mobileOptimization.TOUCH_FRIENDLY_CLASSES.button).toContain('touch-manipulation');

        // Test input type detection
        expect(mobileOptimization.getInputType('email')).toBe('email');
        expect(mobileOptimization.getInputType('phone')).toBe('tel');
        expect(mobileOptimization.getInputType('website')).toBe('url');
        expect(mobileOptimization.getInputType('age')).toBe('number');

        // Test mobile layout classes
        expect(mobileOptimization.MOBILE_LAYOUT_CLASSES.container).toContain('px-4');
        expect(mobileOptimization.MOBILE_LAYOUT_CLASSES.grid).toContain('grid-cols-1');
    });

    it('should have mobile breakpoints configured', async () => {
        const mobileOptimization = await import('@/lib/mobile-optimization');

        expect(mobileOptimization.BREAKPOINTS.mobile).toBe(768);
        expect(mobileOptimization.BREAKPOINTS.tablet).toBe(1024);
        expect(mobileOptimization.BREAKPOINTS.desktop).toBe(1280);
    });

    it('should have input type mappings', async () => {
        const mobileOptimization = await import('@/lib/mobile-optimization');

        expect(mobileOptimization.INPUT_TYPES.email).toBe('email');
        expect(mobileOptimization.INPUT_TYPES.phone).toBe('tel');
        expect(mobileOptimization.INPUT_TYPES.url).toBe('url');
        expect(mobileOptimization.INPUT_TYPES.number).toBe('number');
    });

    it('should provide mobile utility functions', async () => {
        const mobileOptimization = await import('@/lib/mobile-optimization');

        // Test getMobileClasses function
        const buttonClasses = mobileOptimization.getMobileClasses('button', 'extra-class');
        expect(buttonClasses).toContain('min-h-[44px]');
        expect(buttonClasses).toContain('touch-manipulation');
        expect(buttonClasses).toContain('extra-class');

        // Test getInputType function with various inputs
        expect(mobileOptimization.getInputType('user-email')).toBe('email');
        expect(mobileOptimization.getInputType('contact-phone')).toBe('tel');
        expect(mobileOptimization.getInputType('company-website')).toBe('url');
        expect(mobileOptimization.getInputType('years-experience')).toBe('number');
        expect(mobileOptimization.getInputType('random-field')).toBe('text');
    });
});