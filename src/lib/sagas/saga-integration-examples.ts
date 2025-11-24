/**
 * Saga Integration Examples
 * 
 * This file demonstrates how to integrate saga patterns into
 * server actions and API routes for distributed transactions.
 * 
 * Requirements: 7.2, 7.3
 */

import { executeAIIntegrationSaga } from './ai-integration-saga';
import { executeContentPublishingSaga } from './content-publishing-saga';

/**
 * Example 1: AI Content Generation with Publishing
 * 
 * Use this pattern when generating AI content that should be
 * immediately published to an external platform.
 */
export async function generateAndPublishContent(
    userId: string,
    prompt: string,
    platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter',
    traceId?: string
) {
    try {
        const result = await executeAIIntegrationSaga(
            {
                userId,
                contentType: 'social-media',
                prompt,
                platform,
                publishImmediately: true,
            },
            traceId
        );

        if (result.success) {
            return {
                success: true,
                message: 'Content generated and published successfully',
                data: result.data,
                sagaId: result.execution.sagaId,
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to generate and publish content',
                compensated: result.compensated,
                sagaId: result.execution.sagaId,
            };
        }
    } catch (error) {
        console.error('Error in generateAndPublishContent:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 2: AI Content Generation without Publishing
 * 
 * Use this pattern when generating AI content that should be
 * saved but not immediately published.
 */
export async function generateContentOnly(
    userId: string,
    contentType: 'blog-post' | 'social-media' | 'listing-description',
    prompt: string,
    traceId?: string
) {
    try {
        const result = await executeAIIntegrationSaga(
            {
                userId,
                contentType,
                prompt,
                publishImmediately: false, // Don't publish
            },
            traceId
        );

        if (result.success) {
            return {
                success: true,
                message: 'Content generated and saved successfully',
                data: result.data,
                sagaId: result.execution.sagaId,
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to generate content',
                compensated: result.compensated,
                sagaId: result.execution.sagaId,
            };
        }
    } catch (error) {
        console.error('Error in generateContentOnly:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 3: Multi-Platform Content Publishing
 * 
 * Use this pattern when publishing content to multiple platforms
 * with automatic rollback on failure.
 */
export async function publishToMultiplePlatforms(
    userId: string,
    title: string,
    body: string,
    platforms: Array<'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'website'>,
    tags?: string[],
    traceId?: string
) {
    try {
        const result = await executeContentPublishingSaga(
            {
                userId,
                title,
                body,
                contentType: 'social-media',
                platforms,
                tags,
            },
            traceId
        );

        if (result.success) {
            const publications = (result.data as any)?.publications || [];
            const successCount = publications.filter((p: any) => p.success).length;

            return {
                success: true,
                message: `Content published to ${successCount}/${platforms.length} platforms`,
                data: result.data,
                sagaId: result.execution.sagaId,
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to publish content',
                compensated: result.compensated,
                sagaId: result.execution.sagaId,
            };
        }
    } catch (error) {
        console.error('Error in publishToMultiplePlatforms:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 4: Scheduled Content Publishing
 * 
 * Use this pattern when scheduling content for future publication.
 */
export async function scheduleContentPublishing(
    userId: string,
    title: string,
    body: string,
    platforms: Array<'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'website'>,
    scheduledFor: string, // ISO timestamp
    tags?: string[],
    traceId?: string
) {
    try {
        const result = await executeContentPublishingSaga(
            {
                userId,
                title,
                body,
                contentType: 'social-media',
                platforms,
                scheduledFor,
                tags,
            },
            traceId
        );

        if (result.success) {
            return {
                success: true,
                message: `Content scheduled for ${scheduledFor}`,
                data: result.data,
                sagaId: result.execution.sagaId,
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to schedule content',
                compensated: result.compensated,
                sagaId: result.execution.sagaId,
            };
        }
    } catch (error) {
        console.error('Error in scheduleContentPublishing:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 5: Blog Post Creation and Publishing
 * 
 * Use this pattern for creating and publishing blog posts.
 */
export async function createAndPublishBlogPost(
    userId: string,
    title: string,
    body: string,
    tags?: string[],
    traceId?: string
) {
    try {
        const result = await executeContentPublishingSaga(
            {
                userId,
                title,
                body,
                contentType: 'blog-post',
                platforms: ['website'], // Publish to website only
                tags,
            },
            traceId
        );

        if (result.success) {
            return {
                success: true,
                message: 'Blog post created and published successfully',
                data: result.data,
                sagaId: result.execution.sagaId,
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to create blog post',
                compensated: result.compensated,
                sagaId: result.execution.sagaId,
            };
        }
    } catch (error) {
        console.error('Error in createAndPublishBlogPost:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Example 6: Newsletter Creation and Publishing
 * 
 * Use this pattern for creating and sending newsletters.
 */
export async function createAndSendNewsletter(
    userId: string,
    title: string,
    body: string,
    tags?: string[],
    traceId?: string
) {
    try {
        const result = await executeContentPublishingSaga(
            {
                userId,
                title,
                body,
                contentType: 'newsletter',
                platforms: ['website'], // Could be extended to email service
                tags,
            },
            traceId
        );

        if (result.success) {
            return {
                success: true,
                message: 'Newsletter created and sent successfully',
                data: result.data,
                sagaId: result.execution.sagaId,
            };
        } else {
            return {
                success: false,
                message: result.error || 'Failed to create newsletter',
                compensated: result.compensated,
                sagaId: result.execution.sagaId,
            };
        }
    } catch (error) {
        console.error('Error in createAndSendNewsletter:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Server Action Example: Use in Next.js Server Actions
 * 
 * This shows how to integrate sagas into Next.js server actions.
 */
export async function serverActionExample() {
    'use server';

    // Example: Generate AI content and publish to Facebook
    const result = await generateAndPublishContent(
        'user123',
        'Write a post about spring market trends',
        'facebook'
    );

    return result;
}

/**
 * API Route Example: Use in Next.js API Routes
 * 
 * This shows how to integrate sagas into API routes.
 */
export async function apiRouteExample(request: Request) {
    try {
        const body = await request.json();
        const { userId, title, content, platforms } = body;

        // Get trace ID from headers
        const traceId = request.headers.get('x-trace-id') || undefined;

        // Execute saga
        const result = await publishToMultiplePlatforms(
            userId,
            title,
            content,
            platforms,
            undefined,
            traceId
        );

        return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 500,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            }),
            {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    }
}

/**
 * Error Handling Example
 * 
 * This shows how to handle saga failures and compensations.
 */
export async function errorHandlingExample(userId: string) {
    const result = await generateAndPublishContent(
        userId,
        'Test content',
        'facebook'
    );

    if (!result.success) {
        // Log the failure
        console.error('Saga failed:', {
            sagaId: result.sagaId,
            error: result.message,
            compensated: result.compensated,
        });

        // Check if compensation was successful
        if (result.compensated) {
            // All changes were rolled back successfully
            return {
                success: false,
                message: 'Operation failed but all changes were rolled back',
            };
        } else {
            // Compensation failed - may need manual intervention
            return {
                success: false,
                message: 'Operation failed and some changes could not be rolled back',
                requiresManualIntervention: true,
            };
        }
    }

    return result;
}

/**
 * Monitoring Example
 * 
 * This shows how to monitor saga executions.
 */
export async function monitoringSagaExample(userId: string) {
    const result = await generateAndPublishContent(
        userId,
        'Test content',
        'facebook'
    );

    // Log saga execution for monitoring
    console.log('Saga execution:', {
        sagaId: result.sagaId,
        success: result.success,
        compensated: result.compensated,
        steps: result.success ? 'N/A' : 'Check DynamoDB for details',
    });

    // In production, you would send this to CloudWatch or other monitoring service
    // await sendToCloudWatch({
    //     metric: 'SagaExecution',
    //     dimensions: {
    //         SagaType: 'AIIntegration',
    //         Success: result.success.toString(),
    //     },
    //     value: 1,
    // });

    return result;
}
