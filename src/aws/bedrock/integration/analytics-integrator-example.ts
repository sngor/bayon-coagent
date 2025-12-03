/**
 * Analytics Integrator Usage Examples
 * 
 * Demonstrates how to use the AnalyticsIntegrator for tracking content
 * performance, generating insights, and synchronizing data.
 */

import { AnalyticsIntegrator } from './analytics-integrator';

async function example1_ConnectToAnalytics() {
    console.log('\n=== Example 1: Connect to Analytics Platform ===\n');

    const integrator = new AnalyticsIntegrator({
        defaultProvider: 'google-analytics',
        autoSync: true,
        syncInterval: 3600, // 1 hour
    });

    // Connect to Google Analytics
    const status = await integrator.connect(
        'user-123',
        'google-analytics',
        {
            accessToken: 'ga-access-token-here',
            refreshToken: 'ga-refresh-token-here',
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
        }
    );

    console.log('Connection status:', status);
    console.log('Connected:', status.connected);
    if (status.lastSync) {
        console.log('Last sync:', status.lastSync);
    }
}

async function example2_TrackContentPerformance() {
    console.log('\n=== Example 2: Track Content Performance ===\n');

    const integrator = new AnalyticsIntegrator();

    // Track performance for a specific piece of content
    const metrics = await integrator.trackPerformance(
        'user-123',
        'content-456',
        'facebook',
        '7d' // Last 7 days
    );

    console.log('Content ID:', metrics.contentId);
    console.log('Platform:', metrics.platform);
    console.log('Timeframe:', metrics.timeframe);
    console.log('\nMetrics:');
    console.log('  Views:', metrics.metrics.views);
    console.log('  Clicks:', metrics.metrics.clicks);
    console.log('  Shares:', metrics.metrics.shares);
    console.log('  Likes:', metrics.metrics.likes);
    console.log('  Comments:', metrics.metrics.comments);
    console.log('  Conversions:', metrics.metrics.conversions);
    console.log('  Engagement Rate:', metrics.metrics.engagementRate.toFixed(2) + '%');
    console.log('  Click-Through Rate:', metrics.metrics.clickThroughRate.toFixed(2) + '%');

    if (metrics.demographics) {
        console.log('\nDemographics:');
        console.log('  Age Groups:', metrics.demographics.ageGroups);
        console.log('  Locations:', metrics.demographics.locations);
        console.log('  Devices:', metrics.demographics.devices);
    }
}

async function example3_GenerateInsights() {
    console.log('\n=== Example 3: Generate Strategy Insights ===\n');

    const integrator = new AnalyticsIntegrator({
        autoGenerateInsights: true,
    });

    // Generate insights from last 30 days
    const insights = await integrator.generateInsights('user-123', '30d');

    console.log(`Generated ${insights.length} insights:\n`);

    for (const insight of insights) {
        console.log(`[${insight.type.toUpperCase()}] ${insight.title}`);
        console.log(`  Impact: ${insight.impact}`);
        console.log(`  Confidence: ${(insight.confidence * 100).toFixed(0)}%`);
        console.log(`  Description: ${insight.description}`);
        console.log('  Recommendations:');
        insight.recommendations.forEach((rec, i) => {
            console.log(`    ${i + 1}. ${rec}`);
        });
        console.log('');
    }
}

async function example4_SyncData() {
    console.log('\n=== Example 4: Synchronize Analytics Data ===\n');

    const integrator = new AnalyticsIntegrator({
        autoSync: false, // Manual sync
        autoGenerateInsights: true,
    });

    // Manually trigger data sync
    const result = await integrator.syncData('user-123');

    console.log('Sync Result:');
    console.log('  Success:', result.success);
    console.log('  Contents Synced:', result.contentsSynced);
    console.log('  Insights Generated:', result.insightsGenerated);
    console.log('  Synced At:', result.syncedAt);

    if (result.errors.length > 0) {
        console.log('  Errors:');
        result.errors.forEach(error => console.log(`    - ${error}`));
    }
}

async function example5_GetInsights() {
    console.log('\n=== Example 5: Retrieve Insights with Filters ===\n');

    const integrator = new AnalyticsIntegrator();

    // Get all high-impact insights
    const highImpact = await integrator.getInsights('user-123', {
        impact: 'high',
        minConfidence: 0.7,
    });

    console.log(`Found ${highImpact.length} high-impact insights:\n`);

    for (const insight of highImpact) {
        console.log(`${insight.title} (${(insight.confidence * 100).toFixed(0)}% confidence)`);
        console.log(`  ${insight.description}\n`);
    }

    // Get only warnings
    const warnings = await integrator.getInsights('user-123', {
        type: 'warning',
    });

    console.log(`\nFound ${warnings.length} warnings:\n`);

    for (const warning of warnings) {
        console.log(`⚠️  ${warning.title}`);
        console.log(`  ${warning.description}\n`);
    }
}

async function example6_CheckConnectionStatus() {
    console.log('\n=== Example 6: Check Connection Status ===\n');

    const integrator = new AnalyticsIntegrator();

    // Check connection status
    const statuses = await integrator.getConnectionStatus('user-123');

    for (const status of statuses) {
        console.log(`Provider: ${status.provider}`);
        console.log(`Connected: ${status.connected}`);
        if (status.lastSync) {
            console.log(`Last Sync: ${status.lastSync}`);
        }
        if (status.error) {
            console.log(`Error: ${status.error}`);
        }
        console.log('');
    }
}

async function example7_DisconnectFromAnalytics() {
    console.log('\n=== Example 7: Disconnect from Analytics ===\n');

    const integrator = new AnalyticsIntegrator();

    // Disconnect from a provider
    await integrator.disconnect('user-123', 'google-analytics');

    console.log('Disconnected from Google Analytics');
    console.log('Auto-sync stopped');
    console.log('Credentials removed');
}

async function example8_MultiPlatformTracking() {
    console.log('\n=== Example 8: Multi-Platform Performance Tracking ===\n');

    const integrator = new AnalyticsIntegrator();

    const platforms = ['facebook', 'instagram', 'linkedin'];
    const contentId = 'content-789';

    console.log(`Tracking content ${contentId} across platforms:\n`);

    for (const platform of platforms) {
        const metrics = await integrator.trackPerformance(
            'user-123',
            contentId,
            platform,
            '7d'
        );

        console.log(`${platform}:`);
        console.log(`  Engagement Rate: ${metrics.metrics.engagementRate.toFixed(2)}%`);
        console.log(`  Views: ${metrics.metrics.views}`);
        console.log(`  Conversions: ${metrics.metrics.conversions}`);
        console.log('');
    }
}

// Run all examples
async function runAllExamples() {
    try {
        await example1_ConnectToAnalytics();
        await example2_TrackContentPerformance();
        await example3_GenerateInsights();
        await example4_SyncData();
        await example5_GetInsights();
        await example6_CheckConnectionStatus();
        await example7_DisconnectFromAnalytics();
        await example8_MultiPlatformTracking();

        console.log('\n=== All Examples Completed ===\n');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Uncomment to run examples
// runAllExamples();
