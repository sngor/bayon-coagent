/**
 * Gap Analyzer Usage Example
 * 
 * Demonstrates how to use the GapAnalyzer to identify competitive gaps,
 * compare strategies, and generate visualizations.
 */

import { createGapAnalyzer, AgentContentSummary } from './gap-analyzer';
import { createCompetitorMonitor } from './competitor-monitor';
import { CompetitorAnalysisResult } from './types';

/**
 * Example: Analyze competitive gaps for an agent
 */
async function analyzeCompetitiveGaps() {
    const gapAnalyzer = createGapAnalyzer();
    const competitorMonitor = createCompetitorMonitor();

    const userId = 'user_123';

    // Step 1: Get agent's content summary
    const agentSummary: AgentContentSummary = {
        userId,
        totalContent: 45,
        contentTypes: {
            'blog-post': 20,
            'social-media': 25,
        },
        platforms: ['facebook', 'instagram'],
        postingFrequency: 3.5, // posts per week
        averageEngagement: 45,
        topTopics: [
            'home buying tips',
            'market updates',
            'neighborhood guides',
        ],
        contentQuality: 0.75,
        brandConsistency: 0.85,
    };

    // Step 2: Get competitor analyses
    const competitors = await competitorMonitor.getCompetitors(userId);
    const competitorAnalyses: CompetitorAnalysisResult[] = [];

    for (const competitor of competitors) {
        const analysis = await competitorMonitor.analyzeCompetitor(userId, competitor.id);
        competitorAnalyses.push(analysis);
    }

    // Step 3: Analyze gaps
    console.log('Analyzing competitive gaps...');
    const gaps = await gapAnalyzer.analyzeGaps(agentSummary, competitorAnalyses);

    console.log(`\nFound ${gaps.length} competitive gaps:\n`);

    gaps.forEach((gap, index) => {
        console.log(`${index + 1}. ${gap.title}`);
        console.log(`   Type: ${gap.type}`);
        console.log(`   Severity: ${gap.severity}`);
        console.log(`   Priority: ${gap.priority.toFixed(2)}`);
        console.log(`   Description: ${gap.description}`);
        console.log(`   Recommendation: ${gap.recommendation}`);
        console.log(`   Potential Impact: ${(gap.potentialImpact * 100).toFixed(0)}%`);
        console.log(`   Effort Required: ${gap.effortRequired}`);
        console.log('');
    });

    return gaps;
}

/**
 * Example: Compare strategies
 */
async function compareStrategies() {
    const gapAnalyzer = createGapAnalyzer();
    const competitorMonitor = createCompetitorMonitor();

    const userId = 'user_123';

    // Get agent summary
    const agentSummary: AgentContentSummary = {
        userId,
        totalContent: 45,
        contentTypes: {
            'blog-post': 20,
            'social-media': 25,
        },
        platforms: ['facebook', 'instagram'],
        postingFrequency: 3.5,
        averageEngagement: 45,
        topTopics: [
            'home buying tips',
            'market updates',
            'neighborhood guides',
        ],
        contentQuality: 0.75,
        brandConsistency: 0.85,
    };

    // Get competitor analyses
    const competitors = await competitorMonitor.getCompetitors(userId);
    const competitorAnalyses: CompetitorAnalysisResult[] = [];

    for (const competitor of competitors) {
        const analysis = await competitorMonitor.analyzeCompetitor(userId, competitor.id);
        competitorAnalyses.push(analysis);
    }

    // Compare strategies
    console.log('Comparing strategies...');
    const comparison = await gapAnalyzer.compareStrategies(agentSummary, competitorAnalyses);

    console.log('\n=== Agent Strategy ===');
    console.log('Content Focus:', comparison.agentStrategy.contentFocus.join(', '));
    console.log('Messaging Themes:', comparison.agentStrategy.messagingThemes.join(', '));
    console.log('Channels:', Object.keys(comparison.agentStrategy.channelMix).join(', '));
    console.log('Posting Frequency:', comparison.agentStrategy.postingPattern.frequency, 'posts/week');

    console.log('\n=== Competitor Strategies ===');
    for (const [name, strategy] of comparison.competitorStrategies.entries()) {
        console.log(`\n${name}:`);
        console.log('  Content Focus:', strategy.contentFocus.join(', '));
        console.log('  Channels:', Object.keys(strategy.channelMix).join(', '));
        console.log('  Frequency:', strategy.postingPattern.frequency, 'posts/week');
    }

    console.log('\n=== Key Differences ===');
    comparison.differences.forEach((diff, index) => {
        console.log(`\n${index + 1}. ${diff.category} (${diff.impact} impact)`);
        console.log(`   Your Approach: ${diff.agentApproach}`);
        console.log(`   Competitor Approach: ${diff.competitorApproach}`);
        console.log(`   Recommendation: ${diff.recommendation}`);
    });

    console.log('\n=== Strategic Recommendations ===');
    comparison.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
    });

    return comparison;
}

/**
 * Example: Generate gap visualization
 */
async function generateGapVisualization() {
    const gapAnalyzer = createGapAnalyzer();
    const competitorMonitor = createCompetitorMonitor();

    const userId = 'user_123';

    // Get agent summary
    const agentSummary: AgentContentSummary = {
        userId,
        totalContent: 45,
        contentTypes: {
            'blog-post': 20,
            'social-media': 25,
        },
        platforms: ['facebook', 'instagram'],
        postingFrequency: 3.5,
        averageEngagement: 45,
        topTopics: [
            'home buying tips',
            'market updates',
            'neighborhood guides',
        ],
        contentQuality: 0.75,
        brandConsistency: 0.85,
    };

    // Get competitor analyses
    const competitors = await competitorMonitor.getCompetitors(userId);
    const competitorAnalyses: CompetitorAnalysisResult[] = [];

    for (const competitor of competitors) {
        const analysis = await competitorMonitor.analyzeCompetitor(userId, competitor.id);
        competitorAnalyses.push(analysis);
    }

    // Get gaps
    const gaps = await gapAnalyzer.analyzeGaps(agentSummary, competitorAnalyses);

    // Generate visualization
    console.log('Generating gap visualization...');
    const visualization = await gapAnalyzer.generateVisualization(
        agentSummary,
        competitorAnalyses,
        gaps
    );

    console.log('\n=== Radar Chart Data ===');
    console.log('Categories:', visualization.radarChart.categories);
    console.log('Your Scores:', visualization.radarChart.agentScores.map(s => s.toFixed(1)));
    console.log('Competitor Averages:', visualization.radarChart.competitorAverages.map(s => s.toFixed(1)));
    console.log('Top Performers:', visualization.radarChart.topPerformerScores.map(s => s.toFixed(1)));

    console.log('\n=== Bar Chart Data ===');
    console.log('Metrics:', visualization.barChart.metrics);
    console.log('Your Values:', visualization.barChart.agentValues.map(v => v.toFixed(1)));
    console.log('Market Averages:', visualization.barChart.marketAverages.map(v => v.toFixed(1)));
    console.log('Gaps:', visualization.barChart.gaps.map(g => g.toFixed(1)));

    console.log('\n=== Heatmap Data ===');
    console.log('Content Types:', visualization.heatmap.contentTypes);
    console.log('Platforms:', visualization.heatmap.platforms);
    console.log('Your Coverage:', visualization.heatmap.agentCoverage);
    console.log('Competitor Coverage:', visualization.heatmap.competitorCoverage);

    console.log('\n=== Timeline Data ===');
    console.log('Dates:', visualization.timeline.dates.slice(0, 3), '...');
    console.log('Your Activity:', visualization.timeline.agentActivity.slice(0, 3), '...');
    console.log('Competitor Activity:', visualization.timeline.competitorActivity.slice(0, 3), '...');

    return visualization;
}

/**
 * Example: Complete gap analysis workflow
 */
async function completeGapAnalysisWorkflow() {
    console.log('=== Complete Gap Analysis Workflow ===\n');

    try {
        // Step 1: Analyze gaps
        console.log('Step 1: Analyzing competitive gaps...');
        const gaps = await analyzeCompetitiveGaps();

        // Step 2: Compare strategies
        console.log('\nStep 2: Comparing strategies...');
        const comparison = await compareStrategies();

        // Step 3: Generate visualization
        console.log('\nStep 3: Generating visualization...');
        const visualization = await generateGapVisualization();

        console.log('\n=== Analysis Complete ===');
        console.log(`Total Gaps Identified: ${gaps.length}`);
        console.log(`High Priority Gaps: ${gaps.filter(g => g.severity === 'high' || g.severity === 'critical').length}`);
        console.log(`Strategic Recommendations: ${comparison.recommendations.length}`);

        return {
            gaps,
            comparison,
            visualization,
        };
    } catch (error) {
        console.error('Error in gap analysis workflow:', error);
        throw error;
    }
}

/**
 * Example: Filter and prioritize gaps
 */
async function filterAndPrioritizeGaps() {
    const gapAnalyzer = createGapAnalyzer();
    const competitorMonitor = createCompetitorMonitor();

    const userId = 'user_123';

    const agentSummary: AgentContentSummary = {
        userId,
        totalContent: 45,
        contentTypes: {
            'blog-post': 20,
            'social-media': 25,
        },
        platforms: ['facebook', 'instagram'],
        postingFrequency: 3.5,
        averageEngagement: 45,
        topTopics: [
            'home buying tips',
            'market updates',
            'neighborhood guides',
        ],
        contentQuality: 0.75,
        brandConsistency: 0.85,
    };

    const competitors = await competitorMonitor.getCompetitors(userId);
    const competitorAnalyses: CompetitorAnalysisResult[] = [];

    for (const competitor of competitors) {
        const analysis = await competitorMonitor.analyzeCompetitor(userId, competitor.id);
        competitorAnalyses.push(analysis);
    }

    const gaps = await gapAnalyzer.analyzeGaps(agentSummary, competitorAnalyses);

    // Filter by severity
    const criticalGaps = gaps.filter(g => g.severity === 'critical');
    const highGaps = gaps.filter(g => g.severity === 'high');

    console.log('\n=== Critical Gaps (Immediate Action Required) ===');
    criticalGaps.forEach(gap => {
        console.log(`- ${gap.title}`);
        console.log(`  ${gap.recommendation}`);
    });

    console.log('\n=== High Priority Gaps ===');
    highGaps.forEach(gap => {
        console.log(`- ${gap.title}`);
        console.log(`  ${gap.recommendation}`);
    });

    // Filter by effort
    const quickWins = gaps.filter(g => g.effortRequired === 'low' && g.potentialImpact > 0.6);

    console.log('\n=== Quick Wins (Low Effort, High Impact) ===');
    quickWins.forEach(gap => {
        console.log(`- ${gap.title}`);
        console.log(`  Impact: ${(gap.potentialImpact * 100).toFixed(0)}%`);
        console.log(`  ${gap.recommendation}`);
    });

    return {
        criticalGaps,
        highGaps,
        quickWins,
    };
}

// Export examples
export {
    analyzeCompetitiveGaps,
    compareStrategies,
    generateGapVisualization,
    completeGapAnalysisWorkflow,
    filterAndPrioritizeGaps,
};
