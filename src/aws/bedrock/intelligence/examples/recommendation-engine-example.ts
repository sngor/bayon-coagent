/**
 * Recommendation Engine Example
 * 
 * Demonstrates how to use the RecommendationEngine to generate
 * timing recommendations and scheduling strategies.
 */

import {
    RecommendationEngine,
    ContentPerformance,
} from '../recommendation-engine';
import { AgentProfile } from '../types';

/**
 * Example: Generate timing recommendations
 */
async function exampleTimingRecommendations() {
    console.log('=== Timing Recommendations Example ===\n');

    // Create recommendation engine
    const engine = new RecommendationEngine({
        minDataPoints: 10,
        minConfidence: 0.6,
        analysisWindow: 90,
    });

    // Sample historical data
    const historicalData: ContentPerformance[] = [
        {
            contentId: 'content-1',
            contentType: 'blog-post',
            publishedAt: '2024-01-15T09:00:00Z',
            dayOfWeek: 1, // Monday
            hourOfDay: 9,
            metrics: {
                views: 250,
                engagement: 45,
                clicks: 12,
                shares: 5,
                conversions: 2,
            },
            platform: 'website',
            topics: ['market trends', 'real estate'],
        },
        {
            contentId: 'content-2',
            contentType: 'blog-post',
            publishedAt: '2024-01-17T14:00:00Z',
            dayOfWeek: 3, // Wednesday
            hourOfDay: 14,
            metrics: {
                views: 180,
                engagement: 32,
                clicks: 8,
                shares: 3,
                conversions: 1,
            },
            platform: 'website',
            topics: ['home buying', 'tips'],
        },
        // Add more data points...
        {
            contentId: 'content-3',
            contentType: 'blog-post',
            publishedAt: '2024-01-22T09:00:00Z',
            dayOfWeek: 1, // Monday
            hourOfDay: 9,
            metrics: {
                views: 280,
                engagement: 52,
                clicks: 15,
                shares: 7,
                conversions: 3,
            },
            platform: 'website',
            topics: ['market update', 'pricing'],
        },
    ];

    // Generate timing recommendations
    const recommendations = await engine.generateTimingRecommendations(
        historicalData,
        'blog-post',
        'website'
    );

    console.log(`Found ${recommendations.length} timing recommendations:\n`);

    for (const rec of recommendations) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`Recommendation: ${rec.id}`);
        console.log(`  Best Time: ${dayNames[rec.dayOfWeek]} at ${rec.hourOfDay}:00`);
        console.log(`  Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
        console.log(`  Expected Improvement: ${(rec.expectedImprovement * 100).toFixed(1)}%`);
        console.log(`  Evidence:`);
        console.log(`    - Historical Performance: ${rec.evidence.historicalPerformance.toFixed(2)}`);
        console.log(`    - Sample Size: ${rec.evidence.sampleSize}`);
        console.log(`    - Consistency: ${(rec.evidence.consistencyScore * 100).toFixed(1)}%`);

        if (rec.alternatives.length > 0) {
            console.log(`  Alternative Times:`);
            rec.alternatives.forEach((alt, i) => {
                console.log(`    ${i + 1}. ${dayNames[alt.dayOfWeek]} at ${alt.hourOfDay}:00`);
            });
        }
        console.log('');
    }
}

/**
 * Example: Generate scheduling strategy
 */
async function exampleSchedulingStrategy() {
    console.log('=== Scheduling Strategy Example ===\n');

    // Create recommendation engine
    const engine = new RecommendationEngine({
        minDataPoints: 10,
        minConfidence: 0.6,
    });

    // Sample agent profile
    const agentProfile: AgentProfile = {
        id: 'agent-123',
        agentName: 'Sarah Johnson',
        primaryMarket: 'Austin, TX',
        specialization: ['luxury homes', 'residential'],
        contentPreferences: {
            topics: ['market trends', 'home staging', 'investment'],
            formats: ['blog-post', 'social-media', 'video'],
            frequency: 'weekly',
        },
    };

    // Sample historical data (more comprehensive)
    const historicalData: ContentPerformance[] = generateSampleData();

    // Generate scheduling strategy
    const strategy = await engine.generateSchedulingStrategy(
        historicalData,
        agentProfile
    );

    console.log(`Strategy: ${strategy.name}`);
    console.log(`Description: ${strategy.description}`);
    console.log(`Confidence: ${(strategy.confidence * 100).toFixed(1)}%\n`);

    console.log('Recommended Frequency:');
    console.log(`  - ${strategy.frequency.postsPerWeek} posts per week`);
    console.log(`  - ${strategy.frequency.postsPerMonth} posts per month\n`);

    console.log('Content Mix:');
    strategy.contentMix.forEach(mix => {
        console.log(`  - ${mix.contentType}: ${mix.percentage}% (${mix.frequency})`);
    });
    console.log('');

    console.log('Optimal Schedule:');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    strategy.schedule.forEach((slot, i) => {
        console.log(`  ${i + 1}. ${dayNames[slot.dayOfWeek]} at ${slot.hourOfDay}:00 - ${slot.contentType} (Priority: ${slot.priority})`);
    });
    console.log('');

    console.log('Expected Outcomes:');
    console.log(`  - Engagement Increase: ${strategy.expectedOutcomes.engagementIncrease}%`);
    console.log(`  - Reach Increase: ${strategy.expectedOutcomes.reachIncrease}%`);
    console.log(`  - Consistency Score: ${(strategy.expectedOutcomes.consistencyScore * 100).toFixed(1)}%`);
}

/**
 * Example: Prioritize recommendations
 */
async function examplePrioritization() {
    console.log('\n=== Recommendation Prioritization Example ===\n');

    const engine = new RecommendationEngine();

    const agentProfile: AgentProfile = {
        id: 'agent-123',
        agentName: 'Sarah Johnson',
        primaryMarket: 'Austin, TX',
        specialization: ['luxury homes'],
    };

    // Sample recommendations
    const historicalData = generateSampleData();
    const timingRecs = await engine.generateTimingRecommendations(
        historicalData,
        'blog-post',
        'website'
    );
    const strategy = await engine.generateSchedulingStrategy(
        historicalData,
        agentProfile
    );

    // Prioritize all recommendations
    const prioritized = engine.prioritizeRecommendations(
        [...timingRecs, strategy],
        agentProfile
    );

    console.log(`Found ${prioritized.length} prioritized recommendations:\n`);

    prioritized.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.title}`);
        console.log(`   Type: ${rec.type}`);
        console.log(`   Priority Score: ${(rec.priority * 100).toFixed(1)}`);
        console.log(`   Impact: ${(rec.impact * 100).toFixed(1)}%`);
        console.log(`   Feasibility: ${(rec.feasibility * 100).toFixed(1)}%`);
        console.log(`   Confidence: ${(rec.confidence * 100).toFixed(1)}%`);
        console.log(`   Time to Implement: ${rec.timeToImplement}`);
        console.log(`   Action Items:`);
        rec.actionItems.forEach(action => {
            console.log(`     - ${action}`);
        });
        console.log('');
    });
}

/**
 * Helper: Generate sample data
 */
function generateSampleData(): ContentPerformance[] {
    const data: ContentPerformance[] = [];
    const contentTypes = ['blog-post', 'social-media', 'market-update'];
    const topics = [
        ['market trends', 'pricing'],
        ['home staging', 'tips'],
        ['investment', 'roi'],
        ['neighborhood', 'schools'],
    ];

    // Generate 30 data points
    for (let i = 0; i < 30; i++) {
        const date = new Date('2024-01-01');
        date.setDate(date.getDate() + i * 3);

        const dayOfWeek = date.getDay();
        const hourOfDay = [9, 10, 14, 15, 18][Math.floor(Math.random() * 5)];

        data.push({
            contentId: `content-${i + 1}`,
            contentType: contentTypes[i % contentTypes.length],
            publishedAt: date.toISOString(),
            dayOfWeek,
            hourOfDay,
            metrics: {
                views: 150 + Math.floor(Math.random() * 200),
                engagement: 25 + Math.floor(Math.random() * 40),
                clicks: 5 + Math.floor(Math.random() * 15),
                shares: 2 + Math.floor(Math.random() * 8),
                conversions: Math.floor(Math.random() * 4),
            },
            platform: 'website',
            topics: topics[i % topics.length],
        });
    }

    return data;
}

/**
 * Run all examples
 */
async function runExamples() {
    try {
        await exampleTimingRecommendations();
        await exampleSchedulingStrategy();
        await examplePrioritization();
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Run if executed directly
if (require.main === module) {
    runExamples();
}

export {
    exampleTimingRecommendations,
    exampleSchedulingStrategy,
    examplePrioritization,
};
