/**
 * Competitor Monitor Example
 * 
 * Demonstrates how to use the CompetitorMonitor to track competitors,
 * identify patterns, and perform competitive analysis.
 */

import { createCompetitorMonitor } from './competitor-monitor';

/**
 * Example: Complete competitor monitoring workflow
 */
async function competitorMonitoringExample() {
    const monitor = createCompetitorMonitor();
    const userId = 'user_123';

    console.log('=== Competitor Monitoring Example ===\n');

    // 1. Add competitors to monitor
    console.log('1. Adding competitors...');

    const competitor1 = await monitor.addCompetitor(userId, {
        name: 'Jane Smith Real Estate',
        businessType: 'agent',
        markets: ['Austin, TX'],
        website: 'https://janesmith.com',
        socialProfiles: {
            facebook: 'https://facebook.com/janesmithrealestate',
            instagram: 'https://instagram.com/janesmithrealestate',
            linkedin: 'https://linkedin.com/in/janesmith',
        },
    });

    const competitor2 = await monitor.addCompetitor(userId, {
        name: 'Austin Elite Realty',
        businessType: 'team',
        markets: ['Austin, TX', 'Round Rock, TX'],
        website: 'https://austineliterealty.com',
        socialProfiles: {
            facebook: 'https://facebook.com/austineliterealty',
            instagram: 'https://instagram.com/austineliterealty',
            youtube: 'https://youtube.com/@austineliterealty',
        },
    });

    console.log(`Added competitor: ${competitor1.name} (${competitor1.id})`);
    console.log(`Added competitor: ${competitor2.name} (${competitor2.id})\n`);

    // 2. Track competitor content
    console.log('2. Tracking competitor content...');

    // Track social media posts
    await monitor.trackContent(competitor1.id, {
        type: 'social-media',
        platform: 'instagram',
        title: 'New Listing Alert: Downtown Austin',
        content: 'Just listed! Stunning 3BR/2BA home in the heart of downtown Austin. Modern finishes, rooftop deck, walking distance to everything. DM for details! #AustinRealEstate #NewListing',
        url: 'https://instagram.com/p/abc123',
        publishedAt: '2024-01-15T09:00:00Z',
        mediaUrls: ['https://example.com/image1.jpg'],
        engagement: {
            likes: 245,
            comments: 18,
            shares: 12,
        },
        topics: ['listing', 'downtown', 'austin', 'luxury'],
        sentiment: 'positive',
    });

    await monitor.trackContent(competitor1.id, {
        type: 'blog-post',
        platform: 'website',
        title: 'Austin Market Update: January 2024',
        content: 'The Austin real estate market continues to show strong fundamentals in early 2024. Inventory remains tight with only 2.1 months of supply...',
        url: 'https://janesmith.com/blog/austin-market-update-jan-2024',
        publishedAt: '2024-01-08T10:00:00Z',
        engagement: {
            views: 1250,
        },
        topics: ['market-update', 'austin', 'trends', 'analysis'],
        sentiment: 'neutral',
    });

    await monitor.trackContent(competitor2.id, {
        type: 'video',
        platform: 'youtube',
        title: 'Top 5 Neighborhoods in Austin for First-Time Buyers',
        content: 'In this video, we explore the best neighborhoods in Austin for first-time homebuyers, covering affordability, amenities, and future growth potential.',
        url: 'https://youtube.com/watch?v=xyz789',
        publishedAt: '2024-01-20T14:00:00Z',
        mediaUrls: ['https://youtube.com/watch?v=xyz789'],
        engagement: {
            views: 3420,
            likes: 156,
            comments: 34,
        },
        topics: ['buyer-tips', 'neighborhoods', 'austin', 'first-time-buyers'],
        sentiment: 'positive',
    });

    console.log('Tracked 3 pieces of competitor content\n');

    // 3. Get competitor content with filters
    console.log('3. Retrieving competitor content...');

    const recentContent = await monitor.getCompetitorContent(competitor1.id, {
        contentTypes: ['social-media', 'blog-post'],
        dateRange: {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z',
        },
        minEngagement: 50,
    });

    console.log(`Found ${recentContent.length} pieces of content matching filters\n`);

    // 4. Identify strategic patterns
    console.log('4. Identifying strategic patterns...');

    const patterns = await monitor.identifyPatterns(competitor1.id, {
        minFrequency: 2,
        minConfidence: 0.6,
        timeWindow: '90d',
        categories: ['content-strategy', 'messaging', 'timing'],
        includeEffectiveness: true,
    });

    console.log(`Identified ${patterns.length} strategic patterns:`);
    for (const pattern of patterns) {
        console.log(`  - ${pattern.name}`);
        console.log(`    Category: ${pattern.category}`);
        console.log(`    Confidence: ${(pattern.confidence * 100).toFixed(0)}%`);
        console.log(`    Frequency: ${pattern.frequency} occurrences`);
        if (pattern.effectiveness) {
            console.log(`    Effectiveness: ${(pattern.effectiveness * 100).toFixed(0)}%`);
        }
        console.log(`    Trend: ${pattern.trend}`);
    }
    console.log();

    // 5. Perform comprehensive competitor analysis
    console.log('5. Analyzing competitor...');

    const analysis = await monitor.analyzeCompetitor(userId, competitor1.id, {
        start: '2024-01-01T00:00:00Z',
        end: '2024-01-31T23:59:59Z',
    });

    console.log(`Analysis for ${analysis.competitor.name}:`);
    console.log(`  Total content: ${analysis.summary.totalContent}`);
    console.log(`  Content types:`, analysis.summary.contentTypes);
    console.log(`  Top topics:`, analysis.summary.topTopics.slice(0, 5));
    console.log(`  Average engagement: ${analysis.summary.averageEngagement.toFixed(1)}`);
    console.log(`  Posting frequency: ${analysis.summary.postingFrequency.toFixed(1)} posts/week`);
    console.log(`  Most active channels:`, analysis.summary.mostActiveChannels);
    console.log(`  Patterns identified: ${analysis.patterns.length}`);
    console.log(`  Analysis time: ${analysis.metadata.analysisTime}ms\n`);

    // 6. Batch analyze multiple competitors
    console.log('6. Batch analyzing multiple competitors...');

    const batchResults = await monitor.analyzeMultipleCompetitors(
        userId,
        [competitor1.id, competitor2.id],
        {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z',
        }
    );

    console.log('Comparative analysis:');
    for (const result of batchResults) {
        console.log(`\n${result.competitor.name}:`);
        console.log(`  Content volume: ${result.summary.totalContent}`);
        console.log(`  Engagement: ${result.summary.averageEngagement.toFixed(1)}`);
        console.log(`  Frequency: ${result.summary.postingFrequency.toFixed(1)}/week`);
        console.log(`  Top channel: ${result.summary.mostActiveChannels[0]}`);
    }
    console.log();

    // 7. Get latest analysis
    console.log('7. Retrieving cached analysis...');

    const cachedAnalysis = await monitor.getLatestAnalysis(userId, competitor1.id);
    if (cachedAnalysis) {
        console.log(`Latest analysis from: ${cachedAnalysis.metadata.timestamp}`);
        console.log(`Content analyzed: ${cachedAnalysis.metadata.contentAnalyzed}`);
    }
    console.log();

    // 8. Update competitor information
    console.log('8. Updating competitor information...');

    const updatedCompetitor = await monitor.updateCompetitor(userId, competitor1.id, {
        socialProfiles: {
            ...competitor1.socialProfiles,
            tiktok: 'https://tiktok.com/@janesmithrealestate',
        },
    });

    console.log(`Updated ${updatedCompetitor.name} with TikTok profile\n`);

    // 9. Get all competitors
    console.log('9. Listing all competitors...');

    const allCompetitors = await monitor.getCompetitors(userId, true);
    console.log(`Total active competitors: ${allCompetitors.length}`);
    for (const comp of allCompetitors) {
        console.log(`  - ${comp.name} (${comp.businessType})`);
        console.log(`    Markets: ${comp.markets.join(', ')}`);
        console.log(`    Last analyzed: ${comp.lastAnalyzed || 'Never'}`);
    }
    console.log();

    console.log('=== Example Complete ===');
}

/**
 * Example: Pattern analysis workflow
 */
async function patternAnalysisExample() {
    const monitor = createCompetitorMonitor();
    const userId = 'user_123';
    const competitorId = 'comp_123';

    console.log('=== Pattern Analysis Example ===\n');

    // Simulate tracking multiple pieces of content over time
    const contentPieces = [
        {
            type: 'social-media' as const,
            platform: 'instagram',
            title: 'Monday Market Minute',
            content: 'Your weekly Austin market update...',
            publishedAt: '2024-01-08T09:00:00Z',
            topics: ['market-update', 'monday'],
        },
        {
            type: 'social-media' as const,
            platform: 'instagram',
            title: 'Monday Market Minute',
            content: 'This week in Austin real estate...',
            publishedAt: '2024-01-15T09:00:00Z',
            topics: ['market-update', 'monday'],
        },
        {
            type: 'social-media' as const,
            platform: 'instagram',
            title: 'Monday Market Minute',
            content: 'Market trends for the week...',
            publishedAt: '2024-01-22T09:00:00Z',
            topics: ['market-update', 'monday'],
        },
        {
            type: 'social-media' as const,
            platform: 'facebook',
            title: 'New Listing',
            content: 'Just listed in West Austin...',
            publishedAt: '2024-01-10T14:00:00Z',
            topics: ['listing', 'west-austin'],
        },
        {
            type: 'social-media' as const,
            platform: 'facebook',
            title: 'New Listing',
            content: 'Check out this beautiful home...',
            publishedAt: '2024-01-17T14:00:00Z',
            topics: ['listing', 'downtown'],
        },
    ];

    console.log('Tracking content pieces...');
    for (const content of contentPieces) {
        await monitor.trackContent(competitorId, content);
    }
    console.log(`Tracked ${contentPieces.length} pieces of content\n`);

    // Identify patterns
    console.log('Identifying patterns...');
    const patterns = await monitor.identifyPatterns(competitorId, {
        minFrequency: 2,
        minConfidence: 0.7,
        timeWindow: '90d',
        categories: ['content-strategy', 'timing'],
        includeEffectiveness: true,
    });

    console.log(`\nIdentified ${patterns.length} patterns:\n`);
    for (const pattern of patterns) {
        console.log(`Pattern: ${pattern.name}`);
        console.log(`Description: ${pattern.description}`);
        console.log(`Category: ${pattern.category}`);
        console.log(`Confidence: ${(pattern.confidence * 100).toFixed(0)}%`);
        console.log(`Frequency: ${pattern.frequency} times`);
        console.log(`Trend: ${pattern.trend}`);
        console.log(`Evidence:`);
        for (const evidence of pattern.evidence.slice(0, 2)) {
            console.log(`  - "${evidence.example}" (relevance: ${(evidence.relevance * 100).toFixed(0)}%)`);
        }
        console.log();
    }

    console.log('=== Example Complete ===');
}

/**
 * Example: Competitive comparison
 */
async function competitiveComparisonExample() {
    const monitor = createCompetitorMonitor();
    const userId = 'user_123';

    console.log('=== Competitive Comparison Example ===\n');

    // Get all competitors
    const competitors = await monitor.getCompetitors(userId);

    if (competitors.length < 2) {
        console.log('Need at least 2 competitors for comparison');
        return;
    }

    // Analyze all competitors
    console.log('Analyzing competitors...');
    const analyses = await monitor.analyzeMultipleCompetitors(
        userId,
        competitors.map(c => c.id),
        {
            start: '2024-01-01T00:00:00Z',
            end: '2024-01-31T23:59:59Z',
        }
    );

    // Compare metrics
    console.log('\nCompetitive Comparison:\n');
    console.log('Content Volume:');
    for (const analysis of analyses) {
        console.log(`  ${analysis.competitor.name}: ${analysis.summary.totalContent} pieces`);
    }

    console.log('\nAverage Engagement:');
    for (const analysis of analyses) {
        console.log(`  ${analysis.competitor.name}: ${analysis.summary.averageEngagement.toFixed(1)}`);
    }

    console.log('\nPosting Frequency (posts/week):');
    for (const analysis of analyses) {
        console.log(`  ${analysis.competitor.name}: ${analysis.summary.postingFrequency.toFixed(1)}`);
    }

    console.log('\nMost Active Channels:');
    for (const analysis of analyses) {
        console.log(`  ${analysis.competitor.name}: ${analysis.summary.mostActiveChannels.join(', ')}`);
    }

    console.log('\nTop Topics:');
    for (const analysis of analyses) {
        console.log(`  ${analysis.competitor.name}: ${analysis.summary.topTopics.slice(0, 3).join(', ')}`);
    }

    console.log('\n=== Example Complete ===');
}

// Run examples
if (require.main === module) {
    (async () => {
        try {
            await competitorMonitoringExample();
            console.log('\n' + '='.repeat(50) + '\n');
            await patternAnalysisExample();
            console.log('\n' + '='.repeat(50) + '\n');
            await competitiveComparisonExample();
        } catch (error) {
            console.error('Error running examples:', error);
        }
    })();
}

export {
    competitorMonitoringExample,
    patternAnalysisExample,
    competitiveComparisonExample,
};
