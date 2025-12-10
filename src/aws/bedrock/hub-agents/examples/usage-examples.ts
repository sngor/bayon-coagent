/**
 * Hub Agent Registry Usage Examples
 * 
 * Demonstrates how to use the improved hub agent registry
 * with various features and optimizations.
 */

import { HubAgentRegistry, type AgentRecommendationContext } from '../hub-agent-registry';
import { PerformanceScoringStrategy, QualityScoringStrategy } from '../agent-scoring';

/**
 * Example 1: Basic agent lookup
 */
export function basicAgentLookup() {
    // Get specific agent by type
    const studioAgent = HubAgentRegistry.getAgent('studio-creative');
    console.log('Studio Agent:', studioAgent?.name);

    // Get agent by hub
    const brandAgent = HubAgentRegistry.getAgentByHub('brand');
    console.log('Brand Agent:', brandAgent?.name);

    // Get all agents
    const allAgents = HubAgentRegistry.getAllAgents();
    console.log('Total agents:', allAgents.size);
}

/**
 * Example 2: Expertise-based recommendations
 */
export function expertiseBasedRecommendations() {
    // Find agents with specific expertise
    const contentExperts = HubAgentRegistry.getAgentsByExpertise('content-creation');
    console.log('Content creation experts:', contentExperts.map(a => a.name));

    // Find agents by task type
    const dataAnalysts = HubAgentRegistry.getAgentsByTaskType('analyze-data');
    console.log('Data analysis agents:', dataAnalysts.map(a => a.name));
}

/**
 * Example 3: Smart agent recommendations
 */
export function smartRecommendations() {
    // Recommend agent for content creation in studio hub
    const contentContext: AgentRecommendationContext = {
        taskType: 'generate-content',
        hubContext: 'studio',
        expertiseRequired: ['content-creation', 'copywriting']
    };

    const recommendedAgent = HubAgentRegistry.getRecommendedAgent(contentContext);
    console.log('Recommended for content creation:', recommendedAgent?.name);

    // Get multiple recommendations with scores
    const recommendations = HubAgentRegistry.getAgentRecommendations(contentContext, 3);
    console.log('Top 3 recommendations:');
    recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.agent.name} (score: ${rec.score.toFixed(2)})`);
    });
}

/**
 * Example 4: Performance-optimized recommendations
 */
export function performanceOptimizedRecommendations() {
    // Prioritize speed for time-sensitive tasks
    const urgentContext: AgentRecommendationContext = {
        taskType: 'generate-content',
        hubContext: 'studio',
        prioritizePerformance: true
    };

    const fastAgent = HubAgentRegistry.getRecommendedAgent(urgentContext);
    console.log('Fast agent for urgent task:', fastAgent?.name);
    console.log('Speed score:', fastAgent?.capabilities.speedScore);
}

/**
 * Example 5: Quality-focused recommendations
 */
export function qualityFocusedRecommendations() {
    // Prioritize quality for important analysis
    const qualityContext: AgentRecommendationContext = {
        taskType: 'research-query',
        expertiseRequired: ['market-research', 'data-analysis'],
        prioritizeQuality: true
    };

    const qualityAgent = HubAgentRegistry.getRecommendedAgent(qualityContext);
    console.log('High-quality agent for research:', qualityAgent?.name);
    console.log('Quality score:', qualityAgent?.capabilities.qualityScore);
}

/**
 * Example 6: Custom scoring strategy
 */
export function customScoringStrategy() {
    // Set custom scoring strategy
    const customStrategy = new QualityScoringStrategy();
    HubAgentRegistry.setScoringStrategy(customStrategy);

    const context: AgentRecommendationContext = {
        taskType: 'analyze-market',
        expertiseRequired: ['market-analysis']
    };

    const agent = HubAgentRegistry.getRecommendedAgent(context);
    console.log('Agent with custom scoring:', agent?.name);

    // Reset to default strategy
    HubAgentRegistry.setScoringStrategy(new (require('../agent-scoring')).WeightedScoringStrategy());
}

/**
 * Example 7: Agent statistics and analytics
 */
export function agentAnalytics() {
    const stats = HubAgentRegistry.getAgentStats();

    console.log('Agent Statistics:');
    console.log('- Total agents:', stats.totalAgents);
    console.log('- Average quality score:', stats.averageQualityScore.toFixed(2));
    console.log('- Average speed score:', stats.averageSpeedScore.toFixed(2));
    console.log('- Total expertise areas:', stats.totalExpertiseAreas);

    console.log('\nAgents by hub:');
    Object.entries(stats.agentsByHub).forEach(([hub, count]) => {
        console.log(`- ${hub}: ${count} agent(s)`);
    });
}

/**
 * Example 8: Real-world usage scenarios
 */
export function realWorldScenarios() {
    console.log('=== Real-world Usage Scenarios ===\n');

    // Scenario 1: User wants to create a blog post
    console.log('Scenario 1: Creating a blog post');
    const blogContext: AgentRecommendationContext = {
        taskType: 'generate-content',
        hubContext: 'studio',
        expertiseRequired: ['blog-posts', 'content-creation']
    };
    const blogAgent = HubAgentRegistry.getRecommendedAgent(blogContext);
    console.log(`Recommended: ${blogAgent?.name}\n`);

    // Scenario 2: User needs market research
    console.log('Scenario 2: Market research analysis');
    const researchContext: AgentRecommendationContext = {
        taskType: 'research-query',
        hubContext: 'research',
        expertiseRequired: ['market-research', 'data-analysis'],
        prioritizeQuality: true
    };
    const researchAgent = HubAgentRegistry.getRecommendedAgent(researchContext);
    console.log(`Recommended: ${researchAgent?.name}\n`);

    // Scenario 3: User wants to analyze a deal quickly
    console.log('Scenario 3: Quick deal analysis');
    const dealContext: AgentRecommendationContext = {
        taskType: 'calculate-roi',
        hubContext: 'tools',
        expertiseRequired: ['financial-analysis', 'roi-calculation'],
        prioritizePerformance: true
    };
    const dealAgent = HubAgentRegistry.getRecommendedAgent(dealContext);
    console.log(`Recommended: ${dealAgent?.name}\n`);

    // Scenario 4: User needs help organizing content
    console.log('Scenario 4: Content organization');
    const organizeContext: AgentRecommendationContext = {
        taskType: 'organize-content',
        hubContext: 'library',
        expertiseRequired: ['content-organization', 'knowledge-management']
    };
    const organizeAgent = HubAgentRegistry.getRecommendedAgent(organizeContext);
    console.log(`Recommended: ${organizeAgent?.name}\n`);

    // Scenario 5: General assistance (no specific context)
    console.log('Scenario 5: General assistance');
    const generalContext: AgentRecommendationContext = {
        taskType: 'general-query'
    };
    const generalAgent = HubAgentRegistry.getRecommendedAgent(generalContext);
    console.log(`Recommended: ${generalAgent?.name}\n`);
}

/**
 * Example 9: Performance benchmarking
 */
export function performanceBenchmark() {
    console.log('=== Performance Benchmark ===\n');

    const contexts = [
        { taskType: 'generate-content', hubContext: 'studio' },
        { taskType: 'analyze-data', hubContext: 'research' },
        { taskType: 'calculate-roi', hubContext: 'tools' },
        { taskType: 'organize-content', hubContext: 'library' }
    ];

    // Benchmark recommendation performance
    const iterations = 1000;
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
        const context = contexts[i % contexts.length];
        HubAgentRegistry.getRecommendedAgent(context);
    }

    const totalTime = performance.now() - start;
    const avgTime = totalTime / iterations;

    console.log(`Completed ${iterations} recommendations in ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per recommendation: ${avgTime.toFixed(4)}ms`);
    console.log(`Recommendations per second: ${(1000 / avgTime).toFixed(0)}`);
}

/**
 * Run all examples
 */
export function runAllExamples() {
    console.log('🤖 Hub Agent Registry Examples\n');

    basicAgentLookup();
    console.log('\n---\n');

    expertiseBasedRecommendations();
    console.log('\n---\n');

    smartRecommendations();
    console.log('\n---\n');

    performanceOptimizedRecommendations();
    console.log('\n---\n');

    qualityFocusedRecommendations();
    console.log('\n---\n');

    agentAnalytics();
    console.log('\n---\n');

    realWorldScenarios();
    console.log('\n---\n');

    performanceBenchmark();
}

// Export for use in other files
export default {
    basicAgentLookup,
    expertiseBasedRecommendations,
    smartRecommendations,
    performanceOptimizedRecommendations,
    qualityFocusedRecommendations,
    customScoringStrategy,
    agentAnalytics,
    realWorldScenarios,
    performanceBenchmark,
    runAllExamples
};