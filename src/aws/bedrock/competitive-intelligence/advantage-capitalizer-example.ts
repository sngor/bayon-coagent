/**
 * Advantage Capitalizer Example Usage
 * 
 * Demonstrates how to use the AdvantageCapitalizer to identify
 * competitive advantages and generate strategies to leverage them.
 */

import { createAdvantageCapitalizer } from './advantage-capitalizer';
import { createCompetitorMonitor } from './competitor-monitor';
import { AgentContentSummary } from './gap-analyzer';
import { Competitor } from './types';

/**
 * Example: Identify and capitalize on competitive advantages
 */
async function identifyAndCapitalizeAdvantages() {
    const capitalizer = createAdvantageCapitalizer();
    const monitor = createCompetitorMonitor();

    const userId = 'user_123';

    // Agent's content summary
    const agentSummary: AgentContentSummary = {
        userId,
        totalContent: 150,
        contentTypes: {
            'blog-post': 50,
            'social-media': 80,
            'video': 15,
            'email': 5,
        },
        platforms: ['facebook', 'instagram', 'linkedin', 'youtube', 'tiktok'],
        postingFrequency: 8.5, // posts per week
        averageEngagement: 125,
        topTopics: [
            'luxury homes',
            'investment properties',
            'market analysis',
            'home staging',
            'virtual tours',
        ],
        contentQuality: 0.85,
        brandConsistency: 0.90,
    };

    // Get competitor analyses
    const competitors = await monitor.getCompetitors(userId);
    const competitorAnalyses = await Promise.all(
        competitors.map((c: Competitor) => monitor.analyzeCompetitor(userId, c.id))
    );

    // Identify advantages
    console.log('Identifying competitive advantages...');
    const result = await capitalizer.identifyAdvantages(
        userId,
        agentSummary,
        competitorAnalyses
    );

    console.log(`\nFound ${result.advantages.length} competitive advantages:`);
    console.log(`- Strong advantages: ${result.summary.strongAdvantages}`);
    console.log(`- Sustainable advantages: ${result.summary.sustainableAdvantages}`);

    console.log('\nTop Advantages:');
    result.summary.topAdvantages.forEach((advantage, i) => {
        console.log(`\n${i + 1}. ${advantage.title}`);
        console.log(`   Type: ${advantage.type}`);
        console.log(`   Strength: ${(advantage.strength * 100).toFixed(0)}%`);
        console.log(`   Sustainability: ${advantage.sustainability}`);
        console.log(`   Description: ${advantage.description}`);
    });

    return result;
}

/**
 * Example: Generate strategy suggestions for advantages
 */
async function generateStrategySuggestions() {
    const capitalizer = createAdvantageCapitalizer();
    const userId = 'user_123';

    // Get identified advantages
    const advantages = await capitalizer.getAdvantages(userId);

    console.log('\nGenerating strategy suggestions...');
    const suggestions = await capitalizer.generateStrategySuggestions(
        userId,
        advantages
    );

    console.log(`\nGenerated ${suggestions.length} strategy suggestions:`);

    suggestions.forEach((suggestion, i) => {
        console.log(`\n${i + 1}. ${suggestion.advantageTitle}`);
        console.log(`   Priority: ${suggestion.priorityOrder}`);
        console.log(`   Estimated Impact: ${(suggestion.estimatedImpact * 100).toFixed(0)}%`);

        console.log('\n   Quick Wins:');
        suggestion.quickWins.forEach(win => {
            console.log(`   - ${win}`);
        });

        console.log('\n   Long-term Actions:');
        suggestion.longTermActions.forEach(action => {
            console.log(`   - ${action}`);
        });

        console.log(`\n   Strategies (${suggestion.strategies.length}):`);
        suggestion.strategies.forEach((strategy, j) => {
            console.log(`   ${j + 1}. ${strategy.name}`);
            console.log(`      ${strategy.description}`);
            console.log(`      Expected Impact: ${(strategy.expectedImpact * 100).toFixed(0)}%`);
            console.log(`      Channels: ${strategy.channels.join(', ')}`);
            console.log(`      Content Recommendations: ${strategy.contentRecommendations.length}`);
        });
    });

    return suggestions;
}

/**
 * Example: Track advantage performance
 */
async function trackAdvantagePerformance() {
    const capitalizer = createAdvantageCapitalizer();
    const userId = 'user_123';

    const advantages = await capitalizer.getAdvantages(userId);
    const advantage = advantages[0];

    console.log(`\nTracking performance for: ${advantage.title}`);

    // Update performance metrics
    await capitalizer.trackAdvantagePerformance(userId, advantage.id, {
        contentCreated: 12,
        engagementRate: 0.15,
        reachIncrease: 0.25,
        leadGeneration: 8,
        brandAwareness: 0.30,
        competitiveGap: 0.20,
    });

    console.log('Performance metrics updated successfully');

    // Get performance summary
    const summary = await capitalizer.getPerformanceSummary(userId);

    console.log('\nPerformance Summary:');
    console.log(`Total Advantages: ${summary.totalAdvantages}`);
    console.log(`Active Strategies: ${summary.activeStrategies}`);
    console.log(`Completed Strategies: ${summary.completedStrategies}`);
    console.log(`Average Impact: ${(summary.averageImpact * 100).toFixed(1)}%`);

    console.log('\nTop Performers:');
    summary.topPerformers.forEach((performer, i) => {
        console.log(`\n${i + 1}. ${performer.advantage.title}`);
        console.log(`   Content Created: ${performer.performance.contentCreated}`);
        console.log(`   Engagement Rate: ${(performer.performance.engagementRate * 100).toFixed(1)}%`);
        console.log(`   Reach Increase: ${(performer.performance.reachIncrease * 100).toFixed(1)}%`);
        console.log(`   Leads Generated: ${performer.performance.leadGeneration}`);
    });

    return summary;
}

/**
 * Example: Update strategy status
 */
async function updateStrategyStatus() {
    const capitalizer = createAdvantageCapitalizer();
    const userId = 'user_123';

    const advantages = await capitalizer.getAdvantages(userId);
    const advantage = advantages[0];

    // Get advantage with strategies
    const advantageData = await capitalizer.getAdvantageWithStrategies(
        userId,
        advantage.id
    );

    if (!advantageData || advantageData.strategies.length === 0) {
        console.log('No strategies found');
        return;
    }

    const strategy = advantageData.strategies[0];

    console.log(`\nUpdating strategy: ${strategy.name}`);
    console.log(`Current status: ${strategy.status}`);

    // Update to in-progress
    await capitalizer.updateStrategyStatus(
        userId,
        advantage.id,
        strategy.id,
        'in-progress'
    );

    console.log('Status updated to: in-progress');

    // Later, mark as completed
    await capitalizer.updateStrategyStatus(
        userId,
        advantage.id,
        strategy.id,
        'completed'
    );

    console.log('Status updated to: completed');
}

/**
 * Example: Complete workflow
 */
async function completeWorkflow() {
    console.log('=== Advantage Capitalization Workflow ===\n');

    // Step 1: Identify advantages
    console.log('Step 1: Identifying competitive advantages...');
    const identificationResult = await identifyAndCapitalizeAdvantages();

    // Step 2: Generate strategies
    console.log('\n\nStep 2: Generating strategy suggestions...');
    const suggestions = await generateStrategySuggestions();

    // Step 3: Track performance
    console.log('\n\nStep 3: Tracking advantage performance...');
    const performanceSummary = await trackAdvantagePerformance();

    // Step 4: Update strategy status
    console.log('\n\nStep 4: Managing strategy execution...');
    await updateStrategyStatus();

    console.log('\n\n=== Workflow Complete ===');

    return {
        identificationResult,
        suggestions,
        performanceSummary,
    };
}

// Export examples
export {
    identifyAndCapitalizeAdvantages,
    generateStrategySuggestions,
    trackAdvantagePerformance,
    updateStrategyStatus,
    completeWorkflow,
};

// Run example if executed directly
if (require.main === module) {
    completeWorkflow()
        .then(() => {
            console.log('\nExample completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Example failed:', error);
            process.exit(1);
        });
}
