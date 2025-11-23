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

// Test configuration for property-based tests
const testConfig = { numRuns: 100 };

// ==================== Generators ====================

/**
 * Generator for concurrent content (same publish time)
 */
const concurrentContentArb = fc.record({
    itemCount: fc.integer({ min: 2, max: 6 }),
    publishTime: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
}).chain(({ itemCount, publishTime }) =>
    fc.record({
        publishTime: fc.constant(publishTime),
        items: fc.array(
            fc.record({
                id: fc.uuid(),
                userId: fc.uuid(),
                contentId: fc.uuid(),
                title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
                content: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
                contentType: fc.constantFrom(...Object.values(ContentCategory)),
                publishTime: fc.constant(publishTime),
                channels: fc.array(
                    fc.record({
                        type: fc.constantFrom(...Object.values(PublishChannelType)),
                        accountId: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
                        accountName: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
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

                    // Verify that all content items are rendered and accessible
                    items.forEach(item => {
                        const titleElement = screen.getByText(item.title);
                        expect(titleElement).toBeInTheDocument();
                        expect(titleElement).toBeVisible();
                    });

                    // Verify that conflicts are detected and handled
                    if (items.length > 1) {
                        const conflictIndicators = screen.getAllByText(/time slot.*with conflicts/i);
                        expect(conflictIndicators.length).toBeGreaterThan(0);
                    }

                    // Verify that expandable functionality exists for many items
                    if (items.length > 3) {
                        const expandButton = container.querySelector('[aria-expanded]');
                        expect(expandButton).toBeTruthy();
                    }

                    // Verify that each item has unique identifiable content
                    const renderedTitles = items.map(item => screen.getByText(item.title));
                    expect(renderedTitles).toHaveLength(items.length);

                    // All titles should be unique and visible
                    const uniqueTitles = new Set(renderedTitles.map(el => el.textContent));
                    expect(uniqueTitles.size).toBe(items.length);

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

                    // Verify that all content items are still accessible in compact mode
                    items.forEach(item => {
                        const titleElement = screen.getByText(item.title);
                        expect(titleElement).toBeInTheDocument();
                        expect(titleElement).toBeVisible();
                    });

                    // Verify conflict handling in compact mode
                    if (items.length > 1) {
                        const conflictIndicators = screen.getAllByText(/time slot.*with conflicts/i);
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
                    publishTime: fc.date({ min: new Date(), max: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) }),
                    items: fc.array(
                        fc.record({
                            id: fc.uuid(),
                            userId: fc.uuid(),
                            contentId: fc.uuid(),
                            title: fc.string({ minLength: 5, maxLength: 100 }).filter(s => s.trim().length >= 5),
                            content: fc.string({ minLength: 10, maxLength: 500 }).filter(s => s.trim().length >= 10),
                            contentType: fc.constantFrom(...Object.values(ContentCategory)),
                            channels: fc.array(
                                fc.record({
                                    type: fc.constantFrom(...Object.values(PublishChannelType)),
                                    accountId: fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5),
                                    accountName: fc.string({ minLength: 3, maxLength: 100 }).filter(s => s.trim().length >= 3),
                                    isActive: fc.constant(true),
                                    connectionStatus: fc.constant('connected' as const),
                                }),
                                { minLength: 1, maxLength: 2 }
                            ),
                            status: fc.constantFrom(...Object.values(ScheduledContentStatus)),
                            createdAt: fc.date(),
                            updatedAt: fc.date(),
                        }),
                        { minLength: 3, maxLength: 8 } // Multiple items to ensure conflicts
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
                    const conflictWarnings = screen.getAllByText(/time slot.*with conflicts/i);
                    expect(conflictWarnings.length).toBeGreaterThan(0);

                    // Should provide resolution options
                    const resolveButtons = screen.getAllByText('Resolve');
                    expect(resolveButtons.length).toBeGreaterThan(0);

                    // All items should still be accessible (either visible or expandable)
                    const visibleTitles = items.slice(0, 2).map(item => screen.getByText(item.title));
                    expect(visibleTitles).toHaveLength(2);

                    // Should show expand option for additional items
                    if (items.length > 2) {
                        const moreItemsText = screen.getByText(new RegExp(`\\+${items.length - 2} more`));
                        expect(moreItemsText).toBeInTheDocument();
                    }

                    return true;
                }
            ),
            testConfig
        );
    });
});