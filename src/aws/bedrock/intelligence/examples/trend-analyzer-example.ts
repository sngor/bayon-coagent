/**
 * TrendAnalyzer Usage Example
 * 
 * This example demonstrates how to use the TrendAnalyzer to:
 * 1. Analyze market data for trends
 * 2. Predict trend trajectories
 * 3. Identify relevant trends for agents
 * 4. Generate trend notifications
 */

import { TrendAnalyzer } from '../trend-analyzer';
import { MarketData, AgentProfile } from '../types';

/**
 * Example: Analyze market trends
 */
async function analyzeMarketTrends() {
    console.log('=== Analyzing Market Trends ===\n');

    // Create analyzer with custom configuration
    const analyzer = new TrendAnalyzer({
        minDataPoints: 5,
        minConfidence: 0.6,
        analysisWindow: 90,
        predictionHorizon: 30,
    });

    // Sample market data (e.g., from MLS, Zillow, or other sources)
    const marketData: MarketData[] = [
        {
            market: 'Austin, TX',
            dataType: 'price',
            metric: 'median-home-price',
            value: 450000,
            previousValue: 440000,
            changePercent: 2.27,
            trend: 'up',
            source: 'MLS',
            timestamp: '2024-01-01T00:00:00Z',
        },
        {
            market: 'Austin, TX',
            dataType: 'price',
            metric: 'median-home-price',
            value: 460000,
            previousValue: 450000,
            changePercent: 2.22,
            trend: 'up',
            source: 'MLS',
            timestamp: '2024-02-01T00:00:00Z',
        },
        {
            market: 'Austin, TX',
            dataType: 'price',
            metric: 'median-home-price',
            value: 470000,
            previousValue: 460000,
            changePercent: 2.17,
            trend: 'up',
            source: 'MLS',
            timestamp: '2024-03-01T00:00:00Z',
        },
        {
            market: 'Austin, TX',
            dataType: 'price',
            metric: 'median-home-price',
            value: 480000,
            previousValue: 470000,
            changePercent: 2.13,
            trend: 'up',
            source: 'MLS',
            timestamp: '2024-04-01T00:00:00Z',
        },
        {
            market: 'Austin, TX',
            dataType: 'price',
            metric: 'median-home-price',
            value: 490000,
            previousValue: 480000,
            changePercent: 2.08,
            trend: 'up',
            source: 'MLS',
            timestamp: '2024-05-01T00:00:00Z',
        },
        {
            market: 'Austin, TX',
            dataType: 'price',
            metric: 'median-home-price',
            value: 500000,
            previousValue: 490000,
            changePercent: 2.04,
            trend: 'up',
            source: 'MLS',
            timestamp: '2024-06-01T00:00:00Z',
        },
    ];

    // Analyze trends
    const trends = await analyzer.analyzeTrends(marketData, '90 days');

    console.log(`Found ${trends.length} trend(s):\n`);

    for (const trend of trends) {
        console.log(`Trend: ${trend.name}`);
        console.log(`  Market: ${trend.market}`);
        console.log(`  Direction: ${trend.direction}`);
        console.log(`  Strength: ${trend.strength}`);
        console.log(`  Confidence: ${(trend.confidence * 100).toFixed(1)}%`);
        console.log(`  Category: ${trend.category}`);
        console.log(`  Description: ${trend.description}`);
        console.log(`  Statistics:`);
        console.log(`    - Mean: $${trend.statistics.mean.toFixed(0)}`);
        console.log(`    - Percent Change: ${trend.statistics.percentChange.toFixed(2)}%`);
        console.log(`    - Volatility: ${(trend.statistics.volatility * 100).toFixed(2)}%`);
        console.log(`    - R-squared: ${((trend.statistics.rSquared || 0) * 100).toFixed(1)}%`);
        console.log('');
    }

    return trends;
}

/**
 * Example: Predict trend trajectory
 */
async function predictTrendFuture(trend: any) {
    console.log('=== Predicting Trend Trajectory ===\n');

    const analyzer = new TrendAnalyzer();

    // Predict future values
    const prediction = await analyzer.predictTrendTrajectory(trend, []);

    console.log(`Prediction for: ${trend.name}`);
    console.log(`  Predicted Direction: ${prediction.predictedDirection}`);
    console.log(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`  Methodology: ${prediction.methodology}`);
    console.log(`  Horizon: ${prediction.horizon}`);
    console.log(`\n  Influencing Factors:`);
    prediction.influencingFactors.forEach(factor => {
        console.log(`    - ${factor}`);
    });
    console.log(`\n  Risk Factors:`);
    prediction.riskFactors.forEach(risk => {
        console.log(`    - ${risk}`);
    });

    console.log(`\n  Predicted Values (first 5 days):`);
    prediction.predictions.slice(0, 5).forEach((pred, i) => {
        const date = new Date(pred.timestamp).toLocaleDateString();
        console.log(`    Day ${i + 1} (${date}):`);
        console.log(`      Value: $${pred.value.toFixed(0)}`);
        console.log(`      Range: $${pred.lowerBound.toFixed(0)} - $${pred.upperBound.toFixed(0)}`);
    });
    console.log('');

    return prediction;
}

/**
 * Example: Find relevant trends for an agent
 */
async function findRelevantTrends(trends: any[]) {
    console.log('=== Finding Relevant Trends for Agent ===\n');

    const analyzer = new TrendAnalyzer();

    // Agent profile
    const agentProfile: AgentProfile = {
        id: 'agent-123',
        agentName: 'Sarah Johnson',
        primaryMarket: 'Austin, TX',
        specialization: ['luxury homes', 'residential', 'investment properties'],
        targetAudience: ['first-time buyers', 'investors', 'relocating professionals'],
        contentPreferences: {
            topics: ['market trends', 'investment tips', 'neighborhood guides'],
            formats: ['blog posts', 'social media', 'video'],
            frequency: 'weekly',
        },
        goals: {
            leadGeneration: 50,
            brandAwareness: true,
            marketShare: 5,
        },
    };

    console.log(`Agent: ${agentProfile.agentName}`);
    console.log(`Primary Market: ${agentProfile.primaryMarket}`);
    console.log(`Specialization: ${agentProfile.specialization.join(', ')}\n`);

    // Find relevant trends
    const relevantTrends = analyzer.getRelevantTrends(trends, agentProfile);

    console.log(`Found ${relevantTrends.length} relevant trend(s):\n`);

    for (const trend of relevantTrends) {
        console.log(`Trend: ${trend.name}`);
        console.log(`  Relevance: ${(trend.relevance * 100).toFixed(1)}%`);
        console.log(`  Direction: ${trend.direction}`);
        console.log(`  Strength: ${trend.strength}`);
        console.log(`  Why relevant: Market match, ${trend.confidence > 0.7 ? 'high confidence' : 'moderate confidence'}`);
        console.log('');
    }

    return relevantTrends;
}

/**
 * Example: Generate trend notifications
 */
async function generateTrendNotifications(trends: any[]) {
    console.log('=== Generating Trend Notifications ===\n');

    const analyzer = new TrendAnalyzer();

    for (const trend of trends) {
        // Generate notification for new trend
        const notification = await analyzer.generateNotification(
            'user-123',
            trend,
            'new-trend'
        );

        console.log(`Notification: ${notification.type}`);
        console.log(`  Priority: ${notification.priority}`);
        console.log(`  Message: ${notification.message}`);
        console.log(`  Action Items:`);
        notification.actionItems.forEach(item => {
            console.log(`    - ${item}`);
        });
        console.log(`  Expires: ${new Date(notification.expiresAt!).toLocaleDateString()}`);
        console.log('');
    }
}

/**
 * Run all examples
 */
async function runExamples() {
    try {
        // 1. Analyze market trends
        const trends = await analyzeMarketTrends();

        if (trends.length > 0) {
            // 2. Predict trajectory for first trend
            await predictTrendFuture(trends[0]);

            // 3. Find relevant trends
            await findRelevantTrends(trends);

            // 4. Generate notifications
            await generateTrendNotifications(trends);
        }

        console.log('=== Examples Complete ===');
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Export for use in other modules
export {
    analyzeMarketTrends,
    predictTrendFuture,
    findRelevantTrends,
    generateTrendNotifications,
    runExamples,
};

// Run examples if executed directly
if (require.main === module) {
    runExamples();
}
