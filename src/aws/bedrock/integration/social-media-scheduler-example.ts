/**
 * Social Media Scheduler - Usage Examples
 * 
 * Demonstrates how to use the SocialMediaScheduler for scheduling posts,
 * calculating optimal times, immediate posting, and queue management.
 */

import { SocialMediaScheduler } from './social-media-scheduler';
import type { SocialMediaPost } from './types';

/**
 * Example 1: Schedule a post for optimal time
 */
async function schedulePostWithOptimalTime() {
    const scheduler = new SocialMediaScheduler({
        autoOptimize: true,
        minPostDelay: 30,
    });

    const userId = 'user-123';
    const platforms = ['facebook', 'instagram'] as const;

    // Get optimal posting time
    const optimalTime = await scheduler.getOptimalTime(
        userId,
        'facebook',
        'market-update'
    );

    console.log('Optimal Time Recommendation:');
    console.log(`  Time: ${optimalTime.recommendedTime}`);
    console.log(`  Confidence: ${Math.round(optimalTime.confidence * 100)}%`);
    console.log(`  Reasoning: ${optimalTime.reasoning}`);
    console.log(`  Alternative times: ${optimalTime.alternativeTimes.length}`);

    // Create the post
    const post: SocialMediaPost = {
        userId,
        content: 'Check out the latest market trends in downtown! 🏡 #RealEstate #MarketUpdate',
        platform: 'facebook',
        hashtags: ['RealEstate', 'MarketUpdate'],
    };

    // Schedule the post
    const scheduled = await scheduler.schedulePost(
        post,
        optimalTime.recommendedTime,
        platforms
    );

    console.log('\nPost Scheduled:');
    console.log(`  ID: ${scheduled.id}`);
    console.log(`  Platforms: ${scheduled.platforms.join(', ')}`);
    console.log(`  Scheduled for: ${scheduled.scheduledTime}`);
    console.log(`  Status: ${scheduled.status}`);
}

/**
 * Example 2: Schedule a post for a specific time
 */
async function schedulePostForSpecificTime() {
    const scheduler = new SocialMediaScheduler();

    const userId = 'user-123';

    // Schedule for tomorrow at 2 PM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    const post: SocialMediaPost = {
        userId,
        content: 'Open house this weekend! Come see this beautiful property. 🏠',
        platform: 'instagram',
        hashtags: ['OpenHouse', 'RealEstate', 'DreamHome'],
        mediaUrls: ['https://example.com/property-photo.jpg'],
    };

    const scheduled = await scheduler.schedulePost(
        post,
        tomorrow,
        ['instagram', 'facebook']
    );

    console.log('Post scheduled for specific time:');
    console.log(`  ID: ${scheduled.id}`);
    console.log(`  Time: ${scheduled.scheduledTime}`);
}

/**
 * Example 3: Post immediately to multiple platforms
 */
async function postImmediately() {
    const scheduler = new SocialMediaScheduler();

    const post: SocialMediaPost = {
        userId: 'user-123',
        content: 'Just listed! Amazing 3BR/2BA in prime location. Contact me for details! 📞',
        platform: 'facebook',
        hashtags: ['JustListed', 'NewListing', 'RealEstate'],
    };

    const results = await scheduler.postNow(post, ['facebook', 'instagram', 'twitter']);

    console.log('Immediate Post Results:');
    for (const result of results) {
        console.log(`\n  ${result.platform}:`);
        console.log(`    Success: ${result.success}`);
        if (result.success) {
            console.log(`    Post ID: ${result.postId}`);
            console.log(`    URL: ${result.url}`);
        } else {
            console.log(`    Error: ${result.error}`);
        }
    }
}

/**
 * Example 4: Manage posting queue
 */
async function manageQueue() {
    const scheduler = new SocialMediaScheduler();
    const userId = 'user-123';

    // Get current queue
    const queue = await scheduler.getQueue(userId);
    console.log(`\nCurrent Queue: ${queue.length} posts`);

    for (const post of queue) {
        console.log(`\n  Post ${post.id}:`);
        console.log(`    Scheduled: ${post.scheduledTime}`);
        console.log(`    Platforms: ${post.platforms.join(', ')}`);
        console.log(`    Status: ${post.status}`);
    }

    // Get queue statistics
    const stats = await scheduler.getQueueStats(userId);
    console.log('\nQueue Statistics:');
    console.log(`  Total Pending: ${stats.totalPending}`);
    console.log(`  Total Scheduled: ${stats.totalScheduled}`);
    console.log(`  Next Post: ${stats.nextPostTime || 'None'}`);
    console.log('  Platform Breakdown:');
    for (const [platform, count] of Object.entries(stats.platformBreakdown)) {
        if (count > 0) {
            console.log(`    ${platform}: ${count}`);
        }
    }
}

/**
 * Example 5: Update a scheduled post
 */
async function updateScheduledPost() {
    const scheduler = new SocialMediaScheduler();
    const userId = 'user-123';

    // Get the queue to find a post to update
    const queue = await scheduler.getQueue(userId);
    if (queue.length === 0) {
        console.log('No posts in queue to update');
        return;
    }

    const postToUpdate = queue[0];
    console.log(`Updating post ${postToUpdate.id}`);

    // Reschedule for 2 hours later
    const newTime = new Date(postToUpdate.scheduledTime);
    newTime.setHours(newTime.getHours() + 2);

    await scheduler.updateScheduledPost(userId, postToUpdate.id, {
        scheduledTime: newTime,
        platforms: ['facebook', 'instagram', 'linkedin'],
    });

    console.log('Post updated successfully');
    console.log(`  New time: ${newTime}`);
    console.log(`  New platforms: facebook, instagram, linkedin`);
}

/**
 * Example 6: Cancel a scheduled post
 */
async function cancelScheduledPost() {
    const scheduler = new SocialMediaScheduler();
    const userId = 'user-123';

    // Get the queue
    const queue = await scheduler.getQueue(userId);
    if (queue.length === 0) {
        console.log('No posts in queue to cancel');
        return;
    }

    const postToCancel = queue[0];
    console.log(`Cancelling post ${postToCancel.id}`);

    await scheduler.cancelPost(userId, postToCancel.id);

    console.log('Post cancelled successfully');
}

/**
 * Example 7: Batch schedule multiple posts
 */
async function batchSchedulePosts() {
    const scheduler = new SocialMediaScheduler();
    const userId = 'user-123';

    const posts = [
        {
            content: 'Monday motivation: Your dream home is waiting! 💪',
            hashtags: ['MondayMotivation', 'RealEstate'],
        },
        {
            content: 'Market update: Prices trending up in downtown area 📈',
            hashtags: ['MarketUpdate', 'RealEstate'],
        },
        {
            content: 'Featured listing: Stunning waterfront property 🌊',
            hashtags: ['FeaturedListing', 'LuxuryRealEstate'],
        },
    ];

    console.log('Scheduling batch of posts...\n');

    for (let i = 0; i < posts.length; i++) {
        const postData = posts[i];

        // Get optimal time for this post
        const optimalTime = await scheduler.getOptimalTime(userId, 'facebook', 'general');

        // Add days to spread out posts
        optimalTime.recommendedTime.setDate(
            optimalTime.recommendedTime.getDate() + i * 2
        );

        const post: SocialMediaPost = {
            userId,
            content: postData.content,
            platform: 'facebook',
            hashtags: postData.hashtags,
        };

        const scheduled = await scheduler.schedulePost(
            post,
            optimalTime.recommendedTime,
            ['facebook', 'instagram']
        );

        console.log(`Post ${i + 1} scheduled:`);
        console.log(`  Time: ${scheduled.scheduledTime}`);
        console.log(`  Content: ${post.content.substring(0, 50)}...`);
    }

    console.log('\nBatch scheduling complete!');
}

/**
 * Run all examples
 */
async function runExamples() {
    console.log('=== Social Media Scheduler Examples ===\n');

    try {
        console.log('--- Example 1: Schedule with Optimal Time ---');
        await schedulePostWithOptimalTime();

        console.log('\n--- Example 2: Schedule for Specific Time ---');
        await schedulePostForSpecificTime();

        console.log('\n--- Example 3: Post Immediately ---');
        await postImmediately();

        console.log('\n--- Example 4: Manage Queue ---');
        await manageQueue();

        console.log('\n--- Example 5: Update Scheduled Post ---');
        await updateScheduledPost();

        console.log('\n--- Example 6: Cancel Scheduled Post ---');
        await cancelScheduledPost();

        console.log('\n--- Example 7: Batch Schedule Posts ---');
        await batchSchedulePosts();
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Export for use in other files
export {
    schedulePostWithOptimalTime,
    schedulePostForSpecificTime,
    postImmediately,
    manageQueue,
    updateScheduledPost,
    cancelScheduledPost,
    batchSchedulePosts,
};

// Run if executed directly
if (require.main === module) {
    runExamples();
}
