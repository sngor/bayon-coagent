/**
 * Enhanced AI Flow Examples
 * 
 * This file demonstrates how to use the enhanced multi-agent AI flows
 * in real-world scenarios within the Bayon Coagent application.
 */

import {
    Research,
    Content,
    Market,
    FlowManager,
    runEnhancedResearch,
    type EnhancedFlowOptions
} from '@/aws/bedrock';
import type { AgentProfile } from '@/aws/dynamodb/agent-profile-repository';

/**
 * Example 1: Enhanced Research for Market Analysis
 * 
 * This example shows how to use the enhanced research agent for
 * comprehensive market analysis with multiple agents working together.
 */
export async function exampleMarketResearch(agentProfile: AgentProfile) {
    console.log('🔍 Starting Enhanced Market Research...');

    const result = await Research.executeResearch(
        "What are the current trends and investment opportunities in the Miami luxury real estate market for 2024?",
        agentProfile,
        {
            enableMultiAgent: true,
            qualityRequirements: {
                minimumConfidence: 0.85,
                requiresCitation: true,
                requiresPersonalization: true
            },
            executionPreferences: {
                priorityLevel: 'high',
                maxExecutionTime: 180000, // 3 minutes
                enableAdaptiveExecution: true
            }
        }
    );

    console.log('📊 Research Results:');
    console.log('Response:', result.response.substring(0, 200) + '...');
    console.log('Confidence:', result.confidence);
    console.log('Sources:', result.sources.length);
    console.log('Key Findings:', result.keyFindings?.length || 0);
    console.log('Quality Score:', result.qualityMetrics?.overallQuality);
    console.log('Execution Time:', result.executionTime + 'ms');

    return result;
}

/**
 * Example 2: Enhanced Content Generation with Market Insights
 * 
 * This example demonstrates creating personalized content that incorporates
 * real-time market data and insights from multiple agents.
 */
export async function exampleContentWithMarketInsights(agentProfile: AgentProfile) {
    console.log('✍️ Starting Enhanced Content Generation...');

    const content = await Content.generateContent(
        'market-update',
        'Create a compelling market update email for luxury property investors highlighting current opportunities and trends',
        agentProfile,
        {
            enableMultiAgent: true,
            includeMarketInsights: true,
            targetLength: 400,
            targetAudience: 'investors',
            qualityRequirements: {
                minimumConfidence: 0.8,
                requiresPersonalization: true
            }
        }
    );

    console.log('📝 Content Results:');
    console.log('Content Length:', content.wordCount, 'words');
    console.log('Tone:', content.tone);
    console.log('Quality Score:', content.qualityScore);
    console.log('Brand Consistency:', content.brandConsistency);
    console.log('Personalization Applied:', content.personalizationApplied);

    return content;
}

/**
 * Example 3: Comprehensive Market Analysis with Forecasting
 * 
 * This example shows how to perform deep market analysis that includes
 * data analysis, trend identification, and future predictions.
 */
export async function exampleComprehensiveMarketAnalysis(agentProfile: AgentProfile) {
    console.log('📈 Starting Comprehensive Market Analysis...');

    const analysis = await Market.analyzeMarket(
        "Analyze the Miami Beach condo market for investment potential over the next 18 months",
        "Miami Beach",
        agentProfile,
        {
            enableMultiAgent: true,
            includeForecasting: true,
            timeframe: '18 months',
            analysisDepth: 'deep',
            qualityRequirements: {
                minimumConfidence: 0.8,
                requiresCitation: true
            }
        }
    );

    console.log('🏢 Market Analysis Results:');
    console.log('Analysis Length:', analysis.analysis.length, 'characters');
    console.log('Data Points:', analysis.dataPoints.length);
    console.log('Trends Identified:', analysis.trends.length);
    console.log('Predictions:', analysis.predictions?.length || 0);
    console.log('Risk Factors:', analysis.riskFactors?.length || 0);
    console.log('Opportunities:', analysis.opportunities?.length || 0);
    console.log('Confidence:', analysis.confidence);

    return analysis;
}

/**
 * Example 4: Intelligent Flow Selection
 * 
 * This example demonstrates how the FlowManager automatically selects
 * the optimal execution strategy based on query complexity.
 */
export async function exampleIntelligentFlowSelection(agentProfile: AgentProfile) {
    console.log('🤖 Testing Intelligent Flow Selection...');

    // Simple query - should use single agent
    const simpleResult = await FlowManager.executeFlow(
        'research',
        { query: "What is the average home price in Miami?" },
        agentProfile
    );

    console.log('Simple Query - Multi-agent used:', simpleResult.agentPerformance?.length > 1);

    // Complex query - should use multi-agent
    const complexResult = await FlowManager.executeFlow(
        'research',
        {
            query: "Provide a comprehensive analysis of Miami real estate market trends, investment opportunities, risk factors, and 12-month forecasts with actionable recommendations for luxury property investors",
            researchDepth: 'comprehensive'
        },
        agentProfile,
        {
            qualityRequirements: {
                minimumConfidence: 0.85,
                requiresCitation: true
            }
        }
    );

    console.log('Complex Query - Multi-agent used:', complexResult.agentPerformance?.length > 1);

    return { simpleResult, complexResult };
}

/**
 * Example 5: Performance Monitoring and Optimization
 * 
 * This example shows how to monitor agent performance and optimize
 * the system based on metrics.
 */
export async function examplePerformanceMonitoring() {
    console.log('📊 Monitoring Agent Performance...');

    const metrics = FlowManager.getAgentMetrics();

    console.log('🎯 Overall Performance:');
    console.log('Total Tasks:', metrics.overallPerformance.totalTasks);
    console.log('Average Success Rate:', (metrics.overallPerformance.avgSuccessRate * 100).toFixed(1) + '%');
    console.log('Average Execution Time:', metrics.overallPerformance.avgExecutionTime.toFixed(0) + 'ms');

    console.log('\n🤖 Agent Strands:');
    metrics.strands.forEach(strand => {
        console.log(`${strand.type}:`);
        console.log(`  State: ${strand.state}`);
        console.log(`  Success Rate: ${(strand.metrics.successRate * 100).toFixed(1)}%`);
        console.log(`  Avg Execution Time: ${strand.metrics.avgExecutionTime.toFixed(0)}ms`);
        console.log(`  Current Load: ${(strand.metrics.currentLoad * 100).toFixed(1)}%`);
        console.log(`  Tasks Completed: ${strand.metrics.tasksCompleted}`);
    });

    console.log('\n💡 Recommendations:');
    metrics.recommendations.forEach(rec => console.log(`  - ${rec}`));

    return metrics;
}

/**
 * Example 6: Context Sharing Between Agents
 * 
 * This example demonstrates how agents share context and build
 * on each other's work for better results.
 */
export async function exampleContextSharing(agentProfile: AgentProfile) {
    console.log('🔄 Testing Context Sharing...');

    // First, perform market analysis
    const marketAnalysis = await Market.analyzeMarket(
        "Analyze current luxury real estate trends in Miami",
        "Miami",
        agentProfile,
        {
            enableMultiAgent: true,
            contextSharing: {
                enabled: true,
                shareWithFutureRequests: true
            }
        }
    );

    console.log('📊 Market analysis completed, context shared');

    // Then, generate content that leverages the shared market context
    const marketUpdate = await Content.generateContent(
        'market-update',
        'Create a market update that incorporates the latest market analysis findings',
        agentProfile,
        {
            enableMultiAgent: true,
            includeMarketInsights: true, // This will use shared context
            targetAudience: 'clients'
        }
    );

    console.log('📝 Content generated using shared market context');
    console.log('Market insights incorporated:', marketUpdate.personalizationApplied?.marketMentioned);

    return { marketAnalysis, marketUpdate };
}

/**
 * Example 7: Quality-Driven Execution
 * 
 * This example shows how to configure different quality requirements
 * for different types of content and use cases.
 */
export async function exampleQualityDrivenExecution(agentProfile: AgentProfile) {
    console.log('⭐ Testing Quality-Driven Execution...');

    // High-quality research for critical client presentation
    const criticalResearch = await runEnhancedResearch(
        "Comprehensive investment analysis for $50M luxury development opportunity in Miami Beach",
        {
            researchDepth: 'expert',
            researchScope: {
                includeMarketData: true,
                includeCompetitiveAnalysis: true,
                includeTrendAnalysis: true,
                includeForecasting: true,
                includeActionableInsights: true
            },
            qualityRequirements: {
                minimumConfidence: 0.9,
                requiresCitation: true,
                requiresPersonalization: true,
                factCheckingLevel: 'rigorous'
            },
            executionPreferences: {
                priorityLevel: 'critical',
                maxExecutionTime: 300000, // 5 minutes
                enableAdaptiveExecution: true
            }
        },
        agentProfile
    );

    console.log('🎯 Critical Research Results:');
    console.log('Quality Score:', criticalResearch.qualityMetrics.overallQuality);
    console.log('Confidence Level:', criticalResearch.qualityMetrics.confidenceLevel);
    console.log('Factual Accuracy:', criticalResearch.qualityMetrics.factualAccuracy);
    console.log('Agents Used:', criticalResearch.executionDetails.agentsUsed);
    console.log('Execution Time:', criticalResearch.executionDetails.executionTime + 'ms');

    // Standard quality for internal use
    const standardResearch = await runEnhancedResearch(
        "Quick market overview for internal team meeting",
        {
            researchDepth: 'standard',
            qualityRequirements: {
                minimumConfidence: 0.7,
                requiresCitation: false
            },
            executionPreferences: {
                priorityLevel: 'medium',
                maxExecutionTime: 60000 // 1 minute
            }
        },
        agentProfile
    );

    console.log('📋 Standard Research Results:');
    console.log('Quality Score:', standardResearch.qualityMetrics.overallQuality);
    console.log('Execution Time:', standardResearch.executionDetails.executionTime + 'ms');

    return { criticalResearch, standardResearch };
}

/**
 * Example 8: Error Handling and Fallback
 * 
 * This example demonstrates robust error handling and fallback
 * to single-agent execution when multi-agent fails.
 */
export async function exampleErrorHandlingAndFallback(agentProfile: AgentProfile) {
    console.log('🛡️ Testing Error Handling and Fallback...');

    try {
        // Attempt multi-agent execution with tight constraints
        const result = await Research.executeResearch(
            "Complex research query that might challenge the system",
            agentProfile,
            {
                enableMultiAgent: true,
                executionPreferences: {
                    maxExecutionTime: 10000, // Very short timeout to potentially trigger fallback
                    priorityLevel: 'high'
                },
                qualityRequirements: {
                    minimumConfidence: 0.95 // Very high confidence requirement
                }
            }
        );

        console.log('✅ Multi-agent execution succeeded');
        console.log('Confidence achieved:', result.confidence);

        return result;
    } catch (error) {
        console.log('⚠️ Multi-agent execution failed, attempting fallback...');

        // Fallback to single-agent with relaxed requirements
        const fallbackResult = await Research.executeResearch(
            "Complex research query that might challenge the system",
            agentProfile,
            {
                enableMultiAgent: false, // Force single-agent
                qualityRequirements: {
                    minimumConfidence: 0.7 // Relaxed confidence requirement
                }
            }
        );

        console.log('✅ Fallback execution succeeded');
        console.log('Fallback confidence:', fallbackResult.confidence);

        return fallbackResult;
    }
}

/**
 * Run all examples
 */
export async function runAllExamples(agentProfile: AgentProfile) {
    console.log('🚀 Running Enhanced AI Flow Examples...\n');

    try {
        await exampleMarketResearch(agentProfile);
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleContentWithMarketInsights(agentProfile);
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleComprehensiveMarketAnalysis(agentProfile);
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleIntelligentFlowSelection(agentProfile);
        console.log('\n' + '='.repeat(50) + '\n');

        await examplePerformanceMonitoring();
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleContextSharing(agentProfile);
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleQualityDrivenExecution(agentProfile);
        console.log('\n' + '='.repeat(50) + '\n');

        await exampleErrorHandlingAndFallback(agentProfile);

        console.log('\n✅ All examples completed successfully!');
    } catch (error) {
        console.error('❌ Example execution failed:', error);
        throw error;
    }
}

/**
 * Example agent profile for testing
 */
export const exampleAgentProfile: AgentProfile = {
    userId: 'example-user-123',
    agentName: 'Sarah Johnson',
    primaryMarket: 'Miami, FL',
    specialization: 'luxury',
    preferredTone: 'warm-consultative',
    corePrinciple: 'Providing exceptional service and market expertise to luxury property clients',

    // Enhanced profile fields
    marketExpertise: {
        yearsOfExperience: 8,
        averagePrice: 2500000,
        topNeighborhoods: ['South Beach', 'Brickell', 'Coral Gables'],
        marketTrends: ['luxury-condos', 'waterfront-properties', 'investment-opportunities']
    },

    brandPreferences: {
        tagline: 'Luxury Real Estate Excellence',
        uniqueSellingProposition: 'Exclusive access to off-market luxury properties with personalized concierge service'
    },

    communicationStyle: {
        formalityLevel: 'formal',
        technicalDepth: 'intermediate',
        emotionalTone: 'empathetic'
    }
};

/**
 * Quick test function for development
 */
export async function quickTest() {
    console.log('🧪 Running Quick Test...');

    const result = await Research.executeResearch(
        "What are the top 3 investment opportunities in Miami real estate right now?",
        exampleAgentProfile,
        {
            enableMultiAgent: true,
            qualityRequirements: {
                minimumConfidence: 0.8
            }
        }
    );

    console.log('Quick test result:', {
        responseLength: result.response.length,
        confidence: result.confidence,
        sources: result.sources.length,
        executionTime: result.executionTime
    });

    return result;
}