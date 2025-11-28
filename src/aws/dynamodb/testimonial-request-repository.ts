/**
 * Testimonial Request Repository
 * 
 * Provides CRUD operations for testimonial requests using DynamoDB.
 * Follows the single-table design pattern with the base repository.
 */

import { DynamoDBRepository } from './repository';
import { getTestimonialRequestKeys } from './keys';
import { QueryOptions, QueryResult } from './types';
import { TestimonialRequest } from '@/lib/types';
import { randomBytes } from 'crypto';

const repository = new DynamoDBRepository();

/**
 * Generates a unique submission link token
 * @returns A unique token string
 */
function generateSubmissionToken(): string {
    return randomBytes(32).toString('hex');
}

/**
 * Creates a new testimonial request
 * @param userId User ID
 * @param requestId Request ID
 * @param requestData Request data
 * @returns The created testimonial request
 */
export async function createTestimonialRequest(
    userId: string,
    requestId: string,
    requestData: {
        clientName: string;
        clientEmail: string;
    }
): Promise<TestimonialRequest> {
    const keys = getTestimonialRequestKeys(userId, requestId);

    // Generate unique submission link token
    const token = generateSubmissionToken();
    const submissionLink = `/testimonial/submit/${token}`;

    // Calculate expiration date (30 days from now)
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const request: TestimonialRequest = {
        id: requestId,
        userId,
        clientName: requestData.clientName,
        clientEmail: requestData.clientEmail,
        status: 'pending',
        submissionLink,
        sentAt: now.toISOString(),
        expiresAt,
        createdAt: Date.now(),
        updatedAt: Date.now(),
    };

    await repository.create(
        keys.PK,
        keys.SK,
        'TestimonialRequest',
        request
    );

    return request;
}

/**
 * Gets a testimonial request by ID
 * @param userId User ID
 * @param requestId Request ID
 * @returns Testimonial request data or null if not found
 */
export async function getTestimonialRequest(
    userId: string,
    requestId: string
): Promise<TestimonialRequest | null> {
    const keys = getTestimonialRequestKeys(userId, requestId);
    return repository.get<TestimonialRequest>(keys.PK, keys.SK);
}

/**
 * Gets a testimonial request by submission link token
 * @param token Submission link token
 * @returns Testimonial request data or null if not found
 */
export async function getTestimonialRequestByToken(
    token: string
): Promise<TestimonialRequest | null> {
    // We need to scan for the token since it's not part of the key
    // In a production system, you might want to use a GSI for this
    const result = await repository.scan<TestimonialRequest>({
        filterExpression: 'contains(#data.#submissionLink, :token)',
        expressionAttributeNames: {
            '#data': 'Data',
            '#submissionLink': 'submissionLink',
        },
        expressionAttributeValues: {
            ':token': token,
        },
        limit: 1,
    });

    return result.items.length > 0 ? result.items[0] : null;
}

/**
 * Updates a testimonial request
 * @param userId User ID
 * @param requestId Request ID
 * @param updates Partial request data to update
 */
export async function updateTestimonialRequest(
    userId: string,
    requestId: string,
    updates: Partial<Omit<TestimonialRequest, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
    const keys = getTestimonialRequestKeys(userId, requestId);
    await repository.update(keys.PK, keys.SK, updates);
}

/**
 * Updates testimonial request status
 * @param userId User ID
 * @param requestId Request ID
 * @param status New status
 * @param additionalUpdates Additional fields to update
 */
export async function updateTestimonialRequestStatus(
    userId: string,
    requestId: string,
    status: 'pending' | 'submitted' | 'expired',
    additionalUpdates?: {
        submittedAt?: string;
        reminderSentAt?: string;
    }
): Promise<void> {
    const keys = getTestimonialRequestKeys(userId, requestId);
    const updates: any = { status, ...additionalUpdates };
    await repository.update(keys.PK, keys.SK, updates);
}

/**
 * Deletes a testimonial request
 * @param userId User ID
 * @param requestId Request ID
 */
export async function deleteTestimonialRequest(
    userId: string,
    requestId: string
): Promise<void> {
    const keys = getTestimonialRequestKeys(userId, requestId);
    await repository.delete(keys.PK, keys.SK);
}

/**
 * Queries all testimonial requests for a user
 * @param userId User ID
 * @param options Query options
 * @returns Query result with testimonial requests
 */
export async function queryTestimonialRequests(
    userId: string,
    options: QueryOptions = {}
): Promise<QueryResult<TestimonialRequest>> {
    const pk = `USER#${userId}`;
    const skPrefix = 'REQUEST#';

    return repository.query<TestimonialRequest>(pk, skPrefix, {
        ...options,
        scanIndexForward: false, // Most recent first
    });
}

/**
 * Queries pending testimonial requests older than a specified number of days
 * @param userId User ID
 * @param daysOld Number of days old
 * @returns Query result with pending requests
 */
export async function queryPendingRequestsOlderThan(
    userId: string,
    daysOld: number
): Promise<QueryResult<TestimonialRequest>> {
    const result = await queryTestimonialRequests(userId);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const filteredItems = result.items.filter(request => {
        if (request.status !== 'pending') return false;
        if (request.reminderSentAt) return false; // Already sent reminder

        const sentDate = new Date(request.sentAt);
        return sentDate <= cutoffDate;
    });

    return {
        items: filteredItems,
        count: filteredItems.length,
    };
}

/**
 * Checks if a request has expired and updates status if needed
 * @param userId User ID
 * @param requestId Request ID
 * @returns True if expired, false otherwise
 */
export async function checkAndUpdateExpiredRequest(
    userId: string,
    requestId: string
): Promise<boolean> {
    const request = await getTestimonialRequest(userId, requestId);

    if (!request) return false;

    const now = new Date();
    const expiresAt = new Date(request.expiresAt);

    if (now > expiresAt && request.status === 'pending') {
        await updateTestimonialRequestStatus(userId, requestId, 'expired');
        return true;
    }

    return false;
}
