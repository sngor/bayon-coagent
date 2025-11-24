/**
 * Example Server Actions with Fallback Mechanisms
 * 
 * This file demonstrates how to use fallback mechanisms in Next.js server actions
 * to handle service failures gracefully.
 * 
 * Requirements: 4.3 - Graceful failure handling with fallback options
 */

'use server';

import {
    executeWithFallback,
    aiResponseCache,
    backgroundJobQueue,
    integrationFailureManager,
    getUserFriendlyMessage
} from '@/lib/fallback-mechanisms';
import { getBedrockClient } from '@/aws/bedrock/client';
import { z } from 'zod';

// ============================================================================
// Example 1: AI Content Generation with Cache Fallback
// ============================================================================

const blogPostSchema = z.object({
    title: z.string(),
    content: z.string(),
    summary: z.string(),
});

export async function generateBlogPostWithFallback(
    topic: string,
    userId: string
) {
    const result = await executeWithFallback(
        async () => {
            const client = getBedrockClient();
            const prompt = `Generate a blog post about: ${topic}`;

            return await client.invoke(prompt, blogPostSchema, {
                temperature: 0.7,
                maxTokens: 2000,
            });
        },
        {
            operationName: 'generate_blog_post',
            userId,
            cacheKey: {
                prompt: topic,
                modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            },
            defaultValue: {
                title: 'Blog Post',
                content: 'Content generation is temporarily unavailable. Please try again in a moment.',
                summary: 'Temporary content',
            },
        }
    );

    if (result.success) {
        return {
            success: true,
            data: result.data,
            message: result.metadata?.usedFallback
                ? getUserFriendlyMessage(new Error(), result.metadata.fallbackType)
                : 'Blog post generated successfully',
        };
    }

    return {
        success: false,
        error: result.message || 'Failed to generate blog post',
    };
}

// ============================================================================
// Example 2: Social Media Publishing with Skip Fallback
// ============================================================================

export async function publishToSocialMediaWithFallback(
    contentId: string,
    userId: string,
    platforms: string[]
) {
    const results = await Promise.all(
        platforms.map(async (platform) => {
            // Check if we should skip this platform based on recent failures
            if (integrationFailureManager.shouldSkipService(platform, 3)) {
                return {
                    platform,
                    success: true,
                    skipped: true,
                    message: `${platform} temporarily disabled due to repeated failures`,
                };
            }

            const result = await executeWithFallback(
                async () => {
                    // Simulate publishing to platform
                    const response = await fetch(`https://api.${platform}.com/post`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ contentId, userId }),
                    });

                    if (!response.ok) {
                        throw new Error(`${platform} API returned ${response.status}`);
                    }

                    return await response.json();
                },
                {
                    operationName: `publish_${platform}`,
                    userId,
                    allowSkip: true, // Allow skipping on failure
                }
            );

            return {
                platform,
                success: result.success,
                skipped: result.metadata?.fallbackType === 'skip',
                queued: result.metadata?.fallbackType === 'queue',
                message: result.message,
            };
        })
    );

    const successful = results.filter(r => r.success && !r.skipped && !r.queued).length;
    const skipped = results.filter(r => r.skipped).length;
    const queued = results.filter(r => r.queued).length;

    return {
        success: true,
        results,
        summary: {
            total: platforms.length,
            successful,
            skipped,
            queued,
            message: `Published to ${successful} platforms, ${skipped} skipped, ${queued} queued`,
        },
    };
}

// ============================================================================
// Example 3: Analytics Sync with Queue Fallback
// ============================================================================

export async function syncAnalyticsWithFallback(
    contentId: string,
    userId: string
) {
    const result = await executeWithFallback(
        async () => {
            // Simulate analytics sync
            const response = await fetch(`https://analytics-api.example.com/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentId, userId }),
            });

            if (!response.ok) {
                throw new Error(`Analytics API returned ${response.status}`);
            }

            return await response.json();
        },
        {
            operationName: 'sync_analytics',
            userId,
            queueOnFailure: {
                type: 'analytics',
                payload: { contentId },
                priority: 'low', // Analytics can be processed later
            },
        }
    );

    if (result.success) {
        if (result.metadata?.fallbackType === 'queue') {
            return {
                success: true,
                queued: true,
                jobId: result.metadata.jobId,
                message: 'Analytics sync queued for later processing',
            };
        }

        return {
            success: true,
            data: result.data,
            message: 'Analytics synced successfully',
        };
    }

    return {
        success: false,
        error: result.message || 'Failed to sync analytics',
    };
}

// ============================================================================
// Example 4: Comprehensive Content Workflow with Multiple Fallbacks
// ============================================================================

export async function createAndPublishContentWithFallback(
    topic: string,
    userId: string,
    publishPlatforms: string[]
) {
    // Step 1: Generate content with cache fallback
    const contentResult = await generateBlogPostWithFallback(topic, userId);

    if (!contentResult.success) {
        return {
            success: false,
            error: 'Failed to generate content',
        };
    }

    // Step 2: Publish to platforms with skip fallback
    const publishResult = await publishToSocialMediaWithFallback(
        'content-id',
        userId,
        publishPlatforms
    );

    // Step 3: Sync analytics with queue fallback
    const analyticsResult = await syncAnalyticsWithFallback(
        'content-id',
        userId
    );

    return {
        success: true,
        content: contentResult.data,
        publishing: publishResult.summary,
        analytics: analyticsResult.queued
            ? { queued: true, jobId: analyticsResult.jobId }
            : { synced: true },
        message: 'Content workflow completed with fallbacks where needed',
    };
}

// ============================================================================
// Example 5: Queue Processing Action
// ============================================================================

export async function processQueuedJobs(userId: string) {
    const processed: string[] = [];
    const failed: string[] = [];

    // Process up to 10 jobs at a time
    for (let i = 0; i < 10; i++) {
        const job = backgroundJobQueue.dequeue();

        if (!job) {
            break; // No more jobs
        }

        // Only process jobs for this user
        if (job.userId !== userId) {
            continue;
        }

        try {
            // Process based on job type
            switch (job.type) {
                case 'ai':
                    await processAIJob(job.payload);
                    break;
                case 'analytics':
                    await processAnalyticsJob(job.payload);
                    break;
                case 'integration':
                    await processIntegrationJob(job.payload);
                    break;
            }

            backgroundJobQueue.complete(job.id);
            processed.push(job.id);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            backgroundJobQueue.fail(job.id, errorMessage);
            failed.push(job.id);
        }
    }

    return {
        success: true,
        processed: processed.length,
        failed: failed.length,
        message: `Processed ${processed.length} jobs, ${failed.length} failed`,
    };
}

// Helper functions for job processing
async function processAIJob(payload: any) {
    // Implementation for AI job processing
    console.log('Processing AI job:', payload);
}

async function processAnalyticsJob(payload: any) {
    // Implementation for analytics job processing
    console.log('Processing analytics job:', payload);
}

async function processIntegrationJob(payload: any) {
    // Implementation for integration job processing
    console.log('Processing integration job:', payload);
}

// ============================================================================
// Example 6: Cache Management Actions
// ============================================================================

export async function getCacheStats() {
    const stats = aiResponseCache.getStats();
    const queueStats = backgroundJobQueue.getStats();
    const failureStats = integrationFailureManager.getStats();

    return {
        success: true,
        cache: stats,
        queue: queueStats,
        failures: failureStats,
    };
}

export async function clearCache() {
    aiResponseCache.clear();

    return {
        success: true,
        message: 'Cache cleared successfully',
    };
}

export async function clearCompletedJobs() {
    backgroundJobQueue.clearCompleted();

    return {
        success: true,
        message: 'Completed jobs cleared',
    };
}

export async function resetIntegrationFailures(service?: string) {
    integrationFailureManager.clearFailures(service);

    return {
        success: true,
        message: service
            ? `Failures cleared for ${service}`
            : 'All failures cleared',
    };
}
