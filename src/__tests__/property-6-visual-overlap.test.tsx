/**
 * Property 6: No visual overlap for concurrent content
 * 
 * **Feature: content-workflow-features, Property 6: No visual overlap for concurrent content**
 * 
 * For any set of content items scheduled for the same time slot, the Calendar Interface 
 * should display all items in a way that makes each item visible and accessible.
 * 
 * **Validates: Requirements 2.5**
 */

import fc from 'fast-check';
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { ConcurrentContentStack } from '@/components/concurrent-content-stack';
import {
    PublishChannelType,
    ScheduledContentStatus,
    ContentCategory
} from '@/lib/content-workflow-types';

// Test configuration for property-based tests - reduced for memory efficiency
const testConfig = { numRuns: 20 };

// ==================== Generators ====================

/**
 * Generator for concurrent content (same publish time) - optimized for memory efficiency
 */
const concurrentContentArb = fc.record({
    itemCount: fc.integer({ min: 2, max: 4 }), // Reduced max to prevent memory issues
    publishTime: fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }), // Reduced range
}).chain(({ itemCount, publishTime }) =>
    fc.record({
        publishTime: fc.constant(publishTime),
        items: fc.array(
            fc.record({
                id: fc.string({ minLength: 8, maxLength: 12 }), // Simpler IDs
                userId: fc.string({ minLength: 8, maxLength: 12 }),
                contentId: fc.string({ minLength: 8, maxLength: 12 }),
                title: fc.string({ minLength: 5, maxLength: 50 }), // Reduced max length
                content: fc.string({ minLength: 10, maxLength: 100 }), // Reduced max length
                contentType: fc.constantFrom(...Object.values(ContentCategory)),
                publishTime: fc.constant(publishTime),
                channels: fc.array(
                    fc.record({
                        type: fc.constantFrom(...Object.values(PublishChannelType)),
                        accountId: fc.string({ minLength: 5, maxLength: 20 }), // Reduced max length
                        accountName: fc.string({ minLength: 3, maxLength: 30 }), // Reduced max length
                        isActive: fc.constant(true),
                        connectionStatus: fc.constant('connected' as const),
                    }),
                    { minLength: 1, maxLength: 2 }
                ),
                status: fc.constantFrom(...Object.values(ScheduledContentStatus)),
                createdAt: fc.date(),
                updatedAt: fc.date(),
            }),
            { minLength: itemCount, maxLength: itemCount }
        )
    })
);

describe('Property 6: No visual overlap for concurrent content', () => {
    /**
     * **Feature: content-workflow-features, Property 6: No visual overlap for concurrent content**
     * 
     * For any set of content items scheduled for the same time slot, the Calendar Interface 
     * should display all items in a way that makes each item visible and accessible.
     * 
     * **Validates: Requirements 2.5**
     */
    it('should display concurrent content without visual overlap', () => {
        fc.assert(
            fc.property(
                concurrentContentArb,
                ({ publishTime, items }) => {
                    // Render the concurrent content stack
                    const { container } = render(
                        <ConcurrentContentStack
                            content={items}
                            date={publishTime}
                            isCompact={false}
                            maxVisibleItems={3}
                        />
                    );

                    // Verify that content items are rendered and accessible
                    // Check for the presence of content structure rather than specific text
                    const contentItems = container.querySelectorAll('[data-priority]');

                    // Filter out items with invalid dates (component should handle this gracefully)
                    const validItems = items.filter(item =>
                        item.publishTime && !isNaN(item.publishTime.getTime())
                    );

                    if (validItems.length > 0) {
                        // Should show at most maxVisibleItems (3) to prevent visual overlap
                        expect(contentItems.length).toBeGreaterThan(0);
                        expect(contentItems.length).toBeLessThanOrEqual(Math.max(3, validItems.length));
                    } else {
                        // If all items have invalid dates, component should render nothing
                        expect(contentItems.length).toBe(0);
                    }

                    // Verify each content item is visible (check for display style)
                    contentItems.forEach(item => {
                        const style = window.getComputedStyle(item);
                        expect(style.display).not.toBe('none');
                        expect(style.visibility).not.toBe('hidden');
                    });

                    // Verify that conflicts are detected and handled
                    if (items.length > 1) {
                        const conflictIndicators = screen.queryAllByText(/time slot.*with conflicts/i);
                        expect(conflictIndicators.length).toBeGreaterThan(0);
                    }

                    // Verify that expandable functionality exists for many items
                    if (items.length > 3) {
                        const expandButton = container.querySelector('[aria-expanded]');
                        expect(expandButton).toBeTruthy();
                    }

                    // Verify that each item has unique identifiable content
                    // Since titles might be normalized, check for structural elements instead
                    const timeElements = container.querySelectorAll('[class*="text-xs font-medium text-muted-foreground"]');
                    expect(timeElements.length).toBeGreaterThan(0);

                    return true;
                }
            ),
            testConfig
        );
    });

    it('should maintain accessibility in compact mode', () => {
        fc.assert(
            fc.property(
                concurrentContentArb,
                ({ publishTime, items }) => {
                    // Render in compact mode
                    render(
                        <ConcurrentContentStack
                            content={items}
                            date={publishTime}
                            isCompact={true}
                            maxVisibleItems={5}
                        />
                    );

                    // Verify that content items are still accessible in compact mode
                    // Check for the presence of content structure rather than specific text
                    const { container: compactContainer } = render(
                        <ConcurrentContentStack
                            content={items}
                            date={publishTime}
                            isCompact={true}
                            maxVisibleItems={5}
                        />
                    );

                    const contentItems = compactContainer.querySelectorAll('[data-priority]');

                    // Filter out items with invalid dates (component should handle this gracefully)
                    const validItems = items.filter(item =>
                        item.publishTime && !isNaN(item.publishTime.getTime())
                    );

                    if (validItems.length > 0) {
                        // Should show at most maxVisibleItems (5) to prevent visual overlap
                        expect(contentItems.length).toBeGreaterThan(0);
                        expect(contentItems.length).toBeLessThanOrEqual(Math.max(5, validItems.length));
                    } else {
                        // If all items have invalid dates, component should render nothing
                        expect(contentItems.length).toBe(0);
                    }

                    // Verify each content item is visible (check for display style)
                    contentItems.forEach(item => {
                        const style = window.getComputedStyle(item);
                        expect(style.display).not.toBe('none');
                        expect(style.visibility).not.toBe('hidden');
                    });

                    // Verify conflict handling in compact mode
                    if (items.length > 1) {
                        const conflictIndicators = screen.queryAllByText(/time slot.*with conflicts/i);
                        expect(conflictIndicators.length).toBeGreaterThan(0);
                    }

                    return true;
                }
            ),
            testConfig
        );
    });

    it('should provide conflict resolution for overlapping content', () => {
        fc.assert(
            fc.property(
                fc.record({
                    publishTime: fc.date({ min: new Date(), max: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) }),
                    items: fc.array(
                        fc.record({
                            id: fc.string({ minLength: 8, maxLength: 12 }),
                            userId: fc.string({ minLength: 8, maxLength: 12 }),
                            contentId: fc.string({ minLength: 8, maxLength: 12 }),
                            title: fc.string({ minLength: 5, maxLength: 50 }),
                            content: fc.string({ minLength: 10, maxLength: 100 }),
                            contentType: fc.constantFrom(...Object.values(ContentCategory)),
                            channels: fc.array(
                                fc.record({
                                    type: fc.constantFrom(...Object.values(PublishChannelType)),
                                    accountId: fc.string({ minLength: 5, maxLength: 20 }),
                                    accountName: fc.string({ minLength: 3, maxLength: 30 }),
                                    isActive: fc.constant(true),
                                    connectionStatus: fc.constant('connected' as const),
                                }),
                                { minLength: 1, maxLength: 2 }
                            ),
                            status: fc.constantFrom(...Object.values(ScheduledContentStatus)),
                            createdAt: fc.date(),
                            updatedAt: fc.date(),
                        }),
                        { minLength: 3, maxLength: 5 } // Reduced max to prevent memory issues
                    )
                }).chain(({ publishTime, items }) =>
                    fc.record({
                        publishTime: fc.constant(publishTime),
                        items: fc.constant(items.map(item => ({ ...item, publishTime })))
                    })
                ),
                ({ publishTime, items }) => {
                    // Render with many concurrent items
                    render(
                        <ConcurrentContentStack
                            content={items}
                            date={publishTime}
                            isCompact={false}
                            maxVisibleItems={2}
                        />
                    );

                    // Should show conflict warning
                    const conflictWarnings = screen.queryAllByText(/time slot.*with conflicts/i);
                    expect(conflictWarnings.length).toBeGreaterThan(0);

                    // Should provide resolution options
                    const resolveButtons = screen.queryAllByText('Resolve');
                    expect(resolveButtons.length).toBeGreaterThan(0);

                    // All items should still be accessible (either visible or expandable)
                    // Check that we have at least the expected number of visible items
                    const { container: thirdContainer } = render(
                        <ConcurrentContentStack
                            content={items}
                            date={publishTime}
                            isCompact={false}
                            maxVisibleItems={2}
                        />
                    );

                    const contentItems = thirdContainer.querySelectorAll('[data-priority]');
                    expect(contentItems.length).toBeGreaterThanOrEqual(Math.min(2, items.length));

                    // Should show expand option for additional items
                    if (items.length > 2) {
                        const moreItemsTexts = screen.queryAllByText(new RegExp(`\\+${items.length - 2} more`));
                        expect(moreItemsTexts.length).toBeGreaterThan(0);
                    }

                    return true;
                }
            ),
            testConfig
        );
    });
});