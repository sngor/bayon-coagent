/**
 * Testimonial Repository
 * 
 * Provides CRUD operations for testimonials using DynamoDB.
 * Follows the single-table design pattern with the base repository.
 */

import { DynamoDBRepository } from './repository';
import { getTestimonialKeys } from './index';
import { QueryOptions, QueryResult } from './types';
import { Testimonial } from '@/lib/types/common/common';

const repository = new DynamoDBRepository();

/**
 * Creates a new testimonial
 * @param userId User ID
 * @param testimonialId Testimonial ID
 * @param testimonialData Testimonial data
 * @returns The created testimonial
 */
export async function createTestimonial(
    userId: string,
    testimonialId: string,
    testimonialData: Omit<Testimonial, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<Testimonial> {
    const keys = getTestimonialKeys(userId, testimonialId);

    const testimonial: Testimonial = {
        id: testimonialId,
        userId,
        ...testimonialData,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await repository.create(
        keys.PK,
        keys.SK,
        'Testimonial',
        testimonial
    );

    return testimonial;
}

/**
 * Gets a testimonial by ID
 * @param userId User ID
 * @param testimonialId Testimonial ID
 * @returns Testimonial data or null if not found
 */
export async function getTestimonial(
    userId: string,
    testimonialId: string
): Promise<Testimonial | null> {
    const keys = getTestimonialKeys(userId, testimonialId);
    return repository.get<Testimonial>(keys.PK, keys.SK);
}

/**
 * Updates a testimonial
 * Preserves the original dateReceived field
 * @param userId User ID
 * @param testimonialId Testimonial ID
 * @param updates Partial testimonial data to update
 */
export async function updateTestimonial(
    userId: string,
    testimonialId: string,
    updates: Partial<Omit<Testimonial, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'dateReceived'>>
): Promise<void> {
    const keys = getTestimonialKeys(userId, testimonialId);

    // Update the testimonial, updatedAt will be set automatically by repository
    await repository.update(keys.PK, keys.SK, updates);
}

/**
 * Deletes a testimonial
 * Note: S3 cleanup should be handled separately before calling this
 * @param userId User ID
 * @param testimonialId Testimonial ID
 */
export async function deleteTestimonial(
    userId: string,
    testimonialId: string
): Promise<void> {
    const keys = getTestimonialKeys(userId, testimonialId);
    await repository.delete(keys.PK, keys.SK);
}

/**
 * Queries all testimonials for a user
 * Results are sorted by dateReceived in descending order (most recent first)
 * @param userId User ID
 * @param options Query options
 * @returns Query result with testimonials
 */
export async function queryTestimonials(
    userId: string,
    options: QueryOptions = {}
): Promise<QueryResult<Testimonial>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'TESTIMONIAL#';

    // Query with descending order by default (most recent first)
    // Since SK includes the testimonialId, we rely on the dateReceived field for sorting
    // The actual sorting by dateReceived will be done in the application layer
    const result = await repository.query<Testimonial>(pk, skPrefix, {
        ...options,
        scanIndexForward: false, // Most recent SK first
    });

    // Sort by dateReceived in descending order
    const sortedItems = result.items.sort((a, b) => {
        const dateA = new Date(a.dateReceived).getTime();
        const dateB = new Date(b.dateReceived).getTime();
        return dateB - dateA; // Descending order
    });

    return {
        ...result,
        items: sortedItems,
    };
}

/**
 * Queries featured testimonials for a user
 * Results are sorted by displayOrder
 * @param userId User ID
 * @param limit Maximum number of testimonials to return (default: 6)
 * @returns Query result with featured testimonials
 */
export async function queryFeaturedTestimonials(
    userId: string,
    limit: number = 6
): Promise<QueryResult<Testimonial>> {
    const result = await queryTestimonials(userId);

    // Filter for featured testimonials and sort by displayOrder
    const featuredItems = result.items
        .filter(t => t.isFeatured)
        .sort((a, b) => {
            const orderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
            const orderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        })
        .slice(0, limit);

    return {
        items: featuredItems,
        count: featuredItems.length,
    };
}
