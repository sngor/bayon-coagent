/**
 * Tests for MLS and Social Integration Key Generation
 * 
 * Tests key generation functions for listings, MLS connections, social connections,
 * social posts, and performance metrics.
 */

import { describe, it, expect } from '@jest/globals';
import {
    getListingKeys,
    getMLSConnectionKeys,
    getSocialConnectionKeys,
    getSocialPostKeys,
    getPerformanceMetricsKeys,
} from './keys';

describe('MLS and Social Integration Key Generation', () => {
    const userId = 'user-123';

    describe('getListingKeys', () => {
        it('should generate correct PK and SK for a listing', () => {
            const keys = getListingKeys(userId, 'listing-1');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('LISTING#listing-1');
        });

        it('should generate GSI keys when MLS provider and number are provided', () => {
            const keys = getListingKeys(userId, 'listing-1', 'flexmls', 'MLS-456');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('LISTING#listing-1');
            expect(keys.GSI1PK).toBe('MLS#flexmls#MLS-456');
        });

        it('should generate GSI status key when status is provided', () => {
            const keys = getListingKeys(userId, 'listing-1', 'flexmls', 'MLS-456', 'active');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('LISTING#listing-1');
            expect(keys.GSI1PK).toBe('MLS#flexmls#MLS-456');
            expect(keys.GSI1SK).toBe('STATUS#active');
        });

        it('should not generate GSI keys when MLS info is not provided', () => {
            const keys = getListingKeys(userId, 'listing-1');

            expect(keys.GSI1PK).toBeUndefined();
            expect(keys.GSI1SK).toBeUndefined();
        });
    });

    describe('getMLSConnectionKeys', () => {
        it('should generate correct PK and SK for MLS connection', () => {
            const keys = getMLSConnectionKeys(userId, 'conn-1');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('MLS_CONNECTION#conn-1');
        });

        it('should handle different connection IDs', () => {
            const keys1 = getMLSConnectionKeys(userId, 'conn-1');
            const keys2 = getMLSConnectionKeys(userId, 'conn-2');

            expect(keys1.SK).toBe('MLS_CONNECTION#conn-1');
            expect(keys2.SK).toBe('MLS_CONNECTION#conn-2');
        });
    });

    describe('getSocialConnectionKeys', () => {
        it('should generate correct PK and SK for Facebook connection', () => {
            const keys = getSocialConnectionKeys(userId, 'facebook');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('SOCIAL#FACEBOOK');
        });

        it('should generate correct PK and SK for Instagram connection', () => {
            const keys = getSocialConnectionKeys(userId, 'instagram');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('SOCIAL#INSTAGRAM');
        });

        it('should generate correct PK and SK for LinkedIn connection', () => {
            const keys = getSocialConnectionKeys(userId, 'linkedin');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('SOCIAL#LINKEDIN');
        });

        it('should uppercase platform names', () => {
            const keys = getSocialConnectionKeys(userId, 'FaCeBoOk');

            expect(keys.SK).toBe('SOCIAL#FACEBOOK');
        });
    });

    describe('getSocialPostKeys', () => {
        it('should generate correct PK and SK for a social post', () => {
            const keys = getSocialPostKeys(userId, 'post-1');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('POST#post-1');
        });

        it('should generate GSI keys when listing ID is provided', () => {
            const keys = getSocialPostKeys(userId, 'post-1', 'listing-1');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('POST#post-1');
            expect(keys.GSI1PK).toBe('LISTING#listing-1');
            expect(keys.GSI1SK).toBe('POST#post-1');
        });

        it('should not generate GSI keys when listing ID is not provided', () => {
            const keys = getSocialPostKeys(userId, 'post-1');

            expect(keys.GSI1PK).toBeUndefined();
            expect(keys.GSI1SK).toBeUndefined();
        });
    });

    describe('getPerformanceMetricsKeys', () => {
        it('should generate correct PK and SK for performance metrics', () => {
            const keys = getPerformanceMetricsKeys(userId, 'listing-1', '2024-01-15');

            expect(keys.PK).toBe('USER#user-123');
            expect(keys.SK).toBe('METRICS#listing-1#2024-01-15');
        });

        it('should handle different dates', () => {
            const keys1 = getPerformanceMetricsKeys(userId, 'listing-1', '2024-01-15');
            const keys2 = getPerformanceMetricsKeys(userId, 'listing-1', '2024-01-16');

            expect(keys1.SK).toBe('METRICS#listing-1#2024-01-15');
            expect(keys2.SK).toBe('METRICS#listing-1#2024-01-16');
        });

        it('should handle different listings', () => {
            const keys1 = getPerformanceMetricsKeys(userId, 'listing-1', '2024-01-15');
            const keys2 = getPerformanceMetricsKeys(userId, 'listing-2', '2024-01-15');

            expect(keys1.SK).toBe('METRICS#listing-1#2024-01-15');
            expect(keys2.SK).toBe('METRICS#listing-2#2024-01-15');
        });

        it('should support querying by listing prefix', () => {
            const keys = getPerformanceMetricsKeys(userId, 'listing-1', '2024-01-15');

            // Verify the SK starts with the listing ID for prefix queries
            expect(keys.SK.startsWith('METRICS#listing-1#')).toBe(true);
        });
    });

    describe('Key uniqueness and collision prevention', () => {
        it('should generate unique keys for different entity types', () => {
            const listingKeys = getListingKeys(userId, 'id-1');
            const postKeys = getSocialPostKeys(userId, 'id-1');
            const mlsKeys = getMLSConnectionKeys(userId, 'id-1');

            expect(listingKeys.SK).toBe('LISTING#id-1');
            expect(postKeys.SK).toBe('POST#id-1');
            expect(mlsKeys.SK).toBe('MLS_CONNECTION#id-1');

            // All should have same PK but different SK
            expect(listingKeys.PK).toBe(postKeys.PK);
            expect(listingKeys.PK).toBe(mlsKeys.PK);
            expect(listingKeys.SK).not.toBe(postKeys.SK);
            expect(listingKeys.SK).not.toBe(mlsKeys.SK);
        });

        it('should support querying by entity type prefix', () => {
            const listing1 = getListingKeys(userId, 'listing-1');
            const listing2 = getListingKeys(userId, 'listing-2');

            // Both should start with LISTING# for prefix queries
            expect(listing1.SK.startsWith('LISTING#')).toBe(true);
            expect(listing2.SK.startsWith('LISTING#')).toBe(true);
        });
    });
});
