/**
 * Gap Identifier Example
 * 
 * Demonstrates how to use the GapIdentifier to analyze content libraries,
 * detect gaps, generate suggestions, and track gap resolution.
 */

import {
    GapIdentifier,
    ContentItem,
    createGapIdentifier,
} from '../gap-identifier';
import { AgentProfile } from '../types';

/**
 * Example 1: Basic Gap Analysis
 */
async function basicGapAnalysis() {
    console.log('=== Example 1: Basic Gap Analysis ===\n');

    // Create gap identifier with default configuration
    const identifier = createGapIdentifier();

    // Sample agent profile
    const agentProfile: AgentProfile = {
        id: 'agent-123',
        agentName: 'Sarah Johnson',
        primaryMarket: 'Austin, TX',
        specialization: ['luxury homes', 'residential'],
        targetAudience: ['luxury buyers', 'investors'],
    };

    // Sample content library
    const contentLibrary: ContentItem[] = [
        {
            id: 'content-1',
            type: 'blog-post',
            title: 'Austin Market Update - Q1 2024',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50),
            topics: ['market trends', 'pricing', 'inventory'],
            keywords: ['austin', 'real estate', 'market', 'trends', 'q1'],
            targetAudience: ['buyers', 'sellers'],
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'content-2',
            type: 'social-media',
            title: 'Home Staging Tips',
            content: 'Quick tips for staging your home to sell faster and for more money.',
            topics: ['home staging', 'selling tips'],
            keywords: ['staging', 'tips', 'selling', 'home'],
            targetAudience: ['sellers'],
            createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
            id: 'content-3',
            type: 'blog-post',
            title: 'Best Neighborhoods in Austin',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(80),
            topics: ['neighborhoods', 'local schools', 'community'],
            keywords: ['austin', 'neighborhoods', 'schools', 'community', 'guide'],
            targetAudience: ['buyers', 'first-time buyers'],
            createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    // Analyze the content library
    const analysis = await identifier.analyzeLibrary(contentLibrary, agentProfile);

    console.log(`Total Gaps Detected: ${analysis.totalGaps}`);
    console.log(`Overall Coverage Score: ${(analysis.coverageScore * 100).toFixed(1)}%\n`);

    console.log('Coverage Summary:');
    console.log(`  Topic Coverage: ${(analysis.summary.topicCoverage * 100).toFixed(1)}%`);
    console.log(`  Format Diversity: ${(analysis.summary.formatDiversity * 100).toFixed(1)}%`);
    console.log(`  Audience Reach: ${(analysis.summary.audienceReach * 100).toFixed(1)}%`);
    console.log(`  Content Frequency: ${(analysis.summary.contentFrequency * 100).toFixed(1)}%`);
    console.log(`  Overall Health: ${(analysis.summary.overallHealth * 100).toFixed(1)}%\n`);

    console.log('Detected Gaps:');
    analysis.gaps.forEach((gap, index) => {
        console.log(`\n${index + 1}. ${gap.title}`);
        console.log(`   Type: ${gap.type}`);
        console.log(`   Severity: ${gap.severity}`);
        console.log(`   Impact: ${(gap.impact * 100).toFixed(1)}%`);
        console.log(`   Confidence: ${(gap.confidence * 100).toFixed(1)}%`);
        console.log(`   Missing Elements: ${gap.missingElements.slice(0, 3).join(', ')}`);
        console.log(`   Recommendations: ${gap.recommendations.length}`);
    });
}

/**
 * Example 2: Topic Suggestions
 */
async function topicSuggestions() {
    console.log('\n\n=== Example 2: Topic Suggestions ===\n');

    const identifier = createGapIdentifier();

    const agentProfile: AgentProfile = {
        id: 'agent-456',
        agentName: 'Michael Chen',
        primaryMarket: 'San Francisco, CA',
        specialization: ['luxury homes', 'investment properties'],
    };

    const contentLibrary: ContentItem[] = [
        {
            id: 'content-1',
            type: 'blog-post',
            title: 'Market Overview',
            content: 'General market overview content. '.repeat(100),
            topics: ['market overview'],
            keywords: ['market', 'overview', 'san francisco'],
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    const analysis = await identifier.analyzeLibrary(contentLibrary, agentProfile);

    // Find topic gaps
    const topicGaps = analysis.gaps.filter(g => g.type === 'topic');

    if (topicGaps.length > 0) {
        const gap = topicGaps[0];
        console.log(`Gap: ${gap.title}\n`);

        // Generate topic suggestions
        const suggestions = await identifier.generateTopicSuggestions(gap, agentProfile);

        console.log('Suggested Topics:');
        suggestions.slice(0, 10).forEach((topic, index) => {
            console.log(`  ${index + 1}. ${topic}`);
        });

        console.log('\nTop Recommendations:');
        gap.recommendations.slice(0, 3).forEach((rec, index) => {
            console.log(`\n${index + 1}. ${rec.action}`);
            console.log(`   Priority: ${rec.priority}`);
            console.log(`   Effort: ${rec.effort}`);
            console.log(`   Timeline: ${rec.timeline}`);
            console.log(`   Expected Impact: ${rec.expectedImpact}`);
        });
    }
}

/**
 * Example 3: Gap Tracking and Monitoring
 */
async function gapTracking() {
    console.log('\n\n=== Example 3: Gap Tracking and Monitoring ===\n');

    const identifier = createGapIdentifier();

    // Simulate historical gaps
    const historicalGaps = [
        {
            id: 'gap-1',
            type: 'topic' as const,
            title: 'Missing Luxury Market Topics',
            description: 'Content library missing key luxury market topics',
            severity: 'high' as const,
            impact: 0.7,
            confidence: 0.9,
            missingElements: ['luxury market trends', 'high-end property features'],
            recommendations: [],
            evidence: [],
            detectedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'open' as const,
        },
        {
            id: 'gap-2',
            type: 'format' as const,
            title: 'Missing Video Content',
            description: 'No video scripts in content library',
            severity: 'medium' as const,
            impact: 0.5,
            confidence: 0.85,
            missingElements: ['video-script'],
            recommendations: [],
            evidence: [],
            detectedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'resolved' as const,
            resolution: {
                resolvedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                resolvedBy: 'agent-123',
                contentCreated: ['video-1', 'video-2'],
            },
        },
        {
            id: 'gap-3',
            type: 'audience' as const,
            title: 'Missing Investor Content',
            description: 'No content targeting investors',
            severity: 'medium' as const,
            impact: 0.6,
            confidence: 0.8,
            missingElements: ['investors'],
            recommendations: [],
            evidence: [],
            detectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'open' as const,
        },
    ];

    // Monitor gaps over time
    const monitoring = await identifier.monitorGaps('user-123', historicalGaps);

    console.log('Gap Monitoring Report:\n');
    console.log(`Overall Trend: ${monitoring.trend.toUpperCase()}\n`);

    console.log(`New Gaps (${monitoring.newGaps.length}):`);
    monitoring.newGaps.forEach(gap => {
        console.log(`  - ${gap.title} (${gap.severity})`);
    });

    console.log(`\nResolved Gaps (${monitoring.resolvedGaps.length}):`);
    monitoring.resolvedGaps.forEach(gap => {
        console.log(`  - ${gap.title}`);
        if (gap.resolution) {
            console.log(`    Resolved: ${new Date(gap.resolution.resolvedAt).toLocaleDateString()}`);
            console.log(`    Content Created: ${gap.resolution.contentCreated.length} items`);
        }
    });

    console.log(`\nPersistent Gaps (${monitoring.persistentGaps.length}):`);
    monitoring.persistentGaps.forEach(gap => {
        const daysOld = Math.floor(
            (Date.now() - new Date(gap.detectedAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        console.log(`  - ${gap.title} (${daysOld} days old, ${gap.severity})`);
    });

    // Track gap resolution
    console.log('\n\nResolving a gap...');
    const resolvedGap = await identifier.trackGapResolution(
        'gap-3',
        ['content-10', 'content-11', 'content-12'],
        'agent-123'
    );

    console.log(`Gap "${resolvedGap.title}" marked as resolved`);
    console.log(`Content created: ${resolvedGap.resolution?.contentCreated.join(', ')}`);
}

/**
 * Example 4: Custom Configuration
 */
async function customConfiguration() {
    console.log('\n\n=== Example 4: Custom Configuration ===\n');

    // Create identifier with custom configuration
    const identifier = new GapIdentifier({
        minConfidence: 0.7,
        minImpact: 0.5,
        analysisWindow: 60, // 60 days
        bestPractices: {
            topicsBySpecialization: {
                'luxury homes': [
                    'luxury market trends',
                    'high-end property features',
                    'luxury buyer profiles',
                    'estate planning',
                    'luxury home staging',
                ],
                'investment properties': [
                    'investment opportunities',
                    'ROI analysis',
                    'rental market trends',
                    'property management',
                    'tax strategies',
                ],
            },
            contentTypes: ['blog-post', 'video-script', 'newsletter', 'guide'],
            minFrequency: 10, // 10 pieces per month
            audienceSegments: ['luxury buyers', 'investors', 'sellers'],
            qualityBenchmarks: {
                minWordCount: {
                    'blog-post': 1000,
                    'social-media': 150,
                    'video-script': 600,
                    'listing-description': 250,
                    'market-update': 800,
                    'newsletter': 1200,
                    'guide': 2000,
                },
                minKeywords: 8,
                minTopicsPerMonth: 15,
            },
        },
        enableCompetitorComparison: true,
    });

    const agentProfile: AgentProfile = {
        id: 'agent-789',
        agentName: 'Emily Rodriguez',
        primaryMarket: 'Miami, FL',
        specialization: ['luxury homes', 'investment properties'],
    };

    const contentLibrary: ContentItem[] = [
        {
            id: 'content-1',
            type: 'blog-post',
            title: 'Miami Luxury Market Report',
            content: 'Comprehensive analysis of the Miami luxury real estate market. '.repeat(60),
            topics: ['luxury market trends', 'miami real estate'],
            keywords: ['miami', 'luxury', 'real estate', 'market', 'trends', 'analysis', 'report', 'investment'],
            targetAudience: ['luxury buyers'],
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        },
    ];

    const analysis = await identifier.analyzeLibrary(contentLibrary, agentProfile);

    console.log('Custom Configuration Analysis:\n');
    console.log(`Configuration:`);
    console.log(`  Min Confidence: 70%`);
    console.log(`  Min Impact: 50%`);
    console.log(`  Analysis Window: 60 days`);
    console.log(`  Min Frequency: 10 items/month`);
    console.log(`  Competitor Comparison: Enabled\n`);

    console.log(`Results:`);
    console.log(`  Total Gaps: ${analysis.totalGaps}`);
    console.log(`  Coverage Score: ${(analysis.coverageScore * 100).toFixed(1)}%`);
    console.log(`  Items Analyzed: ${analysis.metadata.itemsAnalyzed}`);
    console.log(`  Analysis Time: ${analysis.metadata.analysisTime}ms\n`);

    console.log('High-Priority Gaps:');
    const highPriorityGaps = analysis.gaps.filter(
        g => g.severity === 'high' || g.severity === 'critical'
    );
    highPriorityGaps.forEach(gap => {
        console.log(`  - ${gap.title} (${gap.severity}, impact: ${(gap.impact * 100).toFixed(1)}%)`);
    });
}

/**
 * Run all examples
 */
async function runExamples() {
    try {
        await basicGapAnalysis();
        await topicSuggestions();
        await gapTracking();
        await customConfiguration();

        console.log('\n\n=== All Examples Completed Successfully ===\n');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    runExamples();
}

export {
    basicGapAnalysis,
    topicSuggestions,
    gapTracking,
    customConfiguration,
};
